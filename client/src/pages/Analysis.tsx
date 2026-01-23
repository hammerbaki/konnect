import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
    Brain, Sparkles, Loader2, 
    Briefcase, School, GraduationCap, 
    Star, Compass,
    ChevronRight, LayoutDashboard, History,
    AlertTriangle, User,
    Clock, Bot, XCircle, Plus, ExternalLink, Target
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMobileAction } from "@/lib/MobileActionContext";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/AuthContext";
import { useAIJob } from "@/hooks/useAIJob";
import { useTokens } from "@/lib/TokenContext";
import { generateCareerReportPDF, CareerReportData, ReportMetadata } from "@/lib/pdfReportGenerator";
import { EnhancedCareerCard } from "@/components/analysis/EnhancedCareerCard";
import type { CareerRecommendation } from "@/types/career-analysis";

const ANALYSIS_CREDIT_COST = 100;

// Field names to user-friendly Korean labels mapping
const FIELD_LABELS: Record<string, string> = {
    // High school fields
    high_hopeUniversity: "희망 대학",
    high_careerHope: "진로 희망",
    high_favoriteSubject: "좋아하는 과목",
    high_dreamJob: "희망 직업",
    // University fields
    univ_majorName: "전공 (학과명)",
    univ_desiredIndustry: "희망 산업",
    univ_desiredRole: "희망 직무",
    // General fields
    gen_desiredIndustry: "희망 산업 분야",
    gen_desiredRole: "희망 직무",
    gen_skills: "보유 핵심 스킬",
};

// Minimum required fields for meaningful analysis by profile type
const MINIMUM_REQUIRED_FIELDS: Record<string, { fields: string[]; description: string }> = {
    high: {
        fields: ["high_hopeUniversity", "high_careerHope"],
        description: "희망 대학과 진로 희망을 입력해야 분석을 실행할 수 있습니다.",
    },
    university: {
        fields: ["univ_majorName", "univ_desiredIndustry"],
        description: "전공과 희망 산업을 입력해야 분석을 실행할 수 있습니다.",
    },
    general: {
        fields: ["gen_desiredIndustry", "gen_desiredRole"],
        description: "희망 산업과 희망 직무를 입력해야 분석을 실행할 수 있습니다.",
    },
};

// Validate if profile has minimum required fields for analysis
function validateProfileForAnalysis(profileType: string, profileData: any): { 
    isValid: boolean; 
    missingFields: { key: string; label: string }[];
    message: string;
} {
    const requirements = MINIMUM_REQUIRED_FIELDS[profileType];
    if (!requirements) {
        return { isValid: true, missingFields: [], message: "" };
    }
    
    const missingFields: { key: string; label: string }[] = [];
    
    for (const field of requirements.fields) {
        const value = profileData?.[field];
        const isEmpty = value === undefined || value === null || value === "" || 
            (Array.isArray(value) && value.length === 0);
        
        if (isEmpty) {
            missingFields.push({
                key: field,
                label: FIELD_LABELS[field] || field,
            });
        }
    }
    
    return {
        isValid: missingFields.length === 0,
        missingFields,
        message: missingFields.length > 0 ? requirements.description : "",
    };
}

const profileTypeIcons: Record<string, any> = {
    general: Briefcase,
    international: Compass,
    university: GraduationCap,
    high: School,
    middle: School,
    elementary: Star,
};

const profileTypeColors: Record<string, string> = {
    general: 'text-blue-600 bg-blue-50',
    international: 'text-teal-600 bg-teal-50',
    university: 'text-purple-600 bg-purple-50',
    high: 'text-pink-600 bg-pink-50',
    middle: 'text-orange-600 bg-orange-50',
    elementary: 'text-green-600 bg-green-50',
};

const profileTypeLabels: Record<string, string> = {
    general: '구직자',
    international: '외국인유학생',
    university: '대학생',
    high: '고등학생',
    middle: '중학생',
    elementary: '초등학생',
};

// Profile display order: general on top, then international, university, high, middle, elementary
const profileTypeOrder: Record<string, number> = {
    general: 1,
    international: 2,
    university: 3,
    high: 4,
    middle: 5,
    elementary: 6,
};

const recommendationSectionTitles: Record<string, string> = {
    elementary: '추천 꿈 직업',
    middle: '추천 진로 방향',
    high: '추천 대학 학과',
    university: '추천 인턴십/직무',
    general: '추천 커리어',
};

const matchScoreLabels: Record<string, string> = {
    elementary: '흥미도',
    middle: '적합도',
    high: '합격 가능성',
    university: '취업 적합도',
    general: '적합도',
};

interface AnalysisLoadingStateProps {
    progress: number;
    isSubmitting: boolean;
    isCurrentProfileAnalyzing: boolean;
    jobId: string | null;
    onCancel: () => void;
}

function AnalysisLoadingState({ progress, isSubmitting, isCurrentProfileAnalyzing, jobId, onCancel }: AnalysisLoadingStateProps) {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isCancelling, setIsCancelling] = useState(false);
    const startTimeRef = useRef<number>(Date.now());
    
    useEffect(() => {
        startTimeRef.current = Date.now();
        const interval = setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [jobId]);
    
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}분 ${secs}초` : `${secs}초`;
    };
    
    const handleCancel = async () => {
        setIsCancelling(true);
        try {
            await onCancel();
        } finally {
            setIsCancelling(false);
        }
    };
    
    const isLongRunning = elapsedSeconds >= 120; // 2 minutes
    const isVeryLongRunning = elapsedSeconds >= 240; // 4 minutes
    
    return (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
            <Card className="bg-white rounded-2xl border border-[#E5E8EB] shadow-lg p-8 max-w-md w-full">
                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#3182F6]/20 to-[#3182F6]/5 flex items-center justify-center">
                            <Loader2 className="h-10 w-10 text-[#3182F6] animate-spin" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#3182F6] flex items-center justify-center shadow-lg">
                            <Brain className="h-4 w-4 text-white" />
                        </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-[#191F28] mb-2">AI 분석 진행 중</h3>
                    <p className="text-sm text-[#8B95A1] mb-4">
                        프로필 정보를 바탕으로 맞춤형 진로를 분석하고 있습니다
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-[#8B95A1] mb-4">
                        <Clock className="h-3 w-3" />
                        <span>경과 시간: {formatTime(elapsedSeconds)}</span>
                    </div>
                    
                    {isLongRunning && (
                        <div className={cn(
                            "w-full p-3 rounded-lg mb-4 text-sm",
                            isVeryLongRunning 
                                ? "bg-red-50 text-red-700 border border-red-200" 
                                : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                        )}>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>
                                    {isVeryLongRunning 
                                        ? "분석이 예상보다 오래 걸리고 있습니다. 취소하고 다시 시도해 주세요."
                                        : "평소보다 시간이 오래 걸리고 있습니다. 잠시만 기다려 주세요."}
                                </span>
                            </div>
                        </div>
                    )}
                    
                    <div className="w-full bg-[#F2F4F6] rounded-full h-2 mb-3">
                        <div 
                            className="bg-gradient-to-r from-[#3182F6] to-[#1565C0] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(progress, 10)}%` }}
                        />
                    </div>
                    <p className="text-xs text-[#8B95A1] mb-6">
                        {isSubmitting && !isCurrentProfileAnalyzing ? "분석 요청을 처리 중..." :
                         progress < 20 ? "프로필 정보 분석 중..." : 
                         progress < 50 ? "AI가 추천 진로를 생성 중..." : 
                         progress < 80 ? "결과를 정리하고 있습니다..." : 
                         "거의 완료되었습니다!"}
                    </p>
                    
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isCancelling}
                        className="text-[#8B95A1] hover:text-[#191F28] hover:border-[#191F28]"
                        data-testid="button-cancel-analysis"
                    >
                        {isCancelling ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                취소 중...
                            </>
                        ) : (
                            <>
                                <XCircle className="h-4 w-4 mr-2" />
                                분석 취소
                            </>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    );
}

export default function Analysis() {
    const { toast } = useToast();
    const { setAction } = useMobileAction();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [location, navigate] = useLocation();
    const { deductCredit, restoreCredits } = useTokens();
    
    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
    const [expandedCareer, setExpandedCareer] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [urlProfileHandled, setUrlProfileHandled] = useState(false);

    const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
        queryKey: ['/api/profiles'],
        queryFn: async () => {
            const response = await apiRequest('GET', '/api/profiles');
            return response.json();
        },
        enabled: !!user,
        staleTime: 0,
        refetchOnMount: 'always',
    });

    // Handle profile query parameter from URL (e.g., /analysis?profile=xxx)
    useEffect(() => {
        if (profiles && profiles.length > 0 && !urlProfileHandled) {
            const urlParams = new URLSearchParams(window.location.search);
            const profileParam = urlParams.get('profile');
            
            if (profileParam) {
                // Check if the profile exists in user's profiles
                const matchedProfile = profiles.find((p: any) => p.id === profileParam);
                if (matchedProfile) {
                    setActiveProfileId(profileParam);
                    // Clear the URL parameter
                    navigate('/analysis', { replace: true });
                } else {
                    // Profile not found, use first profile
                    setActiveProfileId(profiles[0].id);
                }
            } else if (!activeProfileId) {
                setActiveProfileId(profiles[0].id);
            }
            setUrlProfileHandled(true);
        }
    }, [profiles, urlProfileHandled, navigate, activeProfileId]);

    const { data: analyses, isLoading: isLoadingAnalyses } = useQuery({
        queryKey: ['/api/profiles', activeProfileId, 'analyses'],
        queryFn: async () => {
            const response = await apiRequest('GET', `/api/profiles/${activeProfileId}/analyses`);
            return response.json();
        },
        enabled: !!activeProfileId,
        staleTime: 30000,
        refetchOnWindowFocus: false,
    });

    const latestAnalysis = analyses && analyses.length > 0 ? analyses[0] : null;
    const activeProfile = profiles?.find((p: any) => p.id === activeProfileId);

    const analysisCreditsDeductedRef = useRef(false);

    const aiJob = useAIJob({
        jobType: "analysis",
        profileId: activeProfileId,
        onSuccess: () => {
            analysisCreditsDeductedRef.current = false;
            queryClient.invalidateQueries({ queryKey: ['/api/profiles', activeProfileId, 'analyses'] });
            queryClient.invalidateQueries({ queryKey: ['/api/user-identity'] });
            toast({ title: "분석 완료", description: "AI 커리어 분석이 완료되었습니다." });
        },
        onError: (error: string) => {
            if (analysisCreditsDeductedRef.current) {
                restoreCredits(ANALYSIS_CREDIT_COST);
                analysisCreditsDeductedRef.current = false;
            }
            toast({ 
                variant: "destructive", 
                title: "분석 실패", 
                description: error || "AI 분석 중 오류가 발생했습니다." 
            });
        },
    });

    const isCurrentProfileAnalyzing = activeProfileId ? aiJob.isActiveForProfile("analysis", activeProfileId) : false;

    const handleGenerateAnalysis = async (profileId: string) => {
        if (!activeProfile) return;
        
        // Prevent duplicate submissions
        if (isSubmitting || isCurrentProfileAnalyzing) {
            console.log("Analysis already in progress, ignoring click");
            return;
        }
        
        // Validate profile has minimum required fields
        const profileValidation = validateProfileForAnalysis(activeProfile.type, activeProfile.profileData);
        if (!profileValidation.isValid) {
            toast({ 
                variant: "destructive", 
                title: "프로필 정보 부족",
                description: `다음 필드를 먼저 입력해주세요: ${profileValidation.missingFields.map(f => f.label).join(", ")}` 
            });
            return;
        }
        
        // Show immediate feedback
        setIsSubmitting(true);
        
        // Optimistically deduct credits immediately
        const deducted = deductCredit(ANALYSIS_CREDIT_COST);
        if (!deducted) {
            setIsSubmitting(false);
            toast({ variant: "destructive", description: "포인트가 부족합니다. 분석에 100 포인트가 필요합니다." });
            return;
        }
        analysisCreditsDeductedRef.current = true; // Track deduction for safe restoration
        
        try {
            await aiJob.submitJob("analysis", profileId, {
                profileData: activeProfile.profileData,
                profileType: activeProfile.type,
                profileTitle: activeProfile.title,
            });
        } catch (error) {
            setIsSubmitting(false);
            // onError in useAIJob will handle restoring credits using the ref flag
        }
    };
    
    // Get profile validation status for display
    const profileValidation = activeProfile 
        ? validateProfileForAnalysis(activeProfile.type, activeProfile.profileData) 
        : { isValid: true, missingFields: [], message: "" };
    
    // Reset isSubmitting when job starts processing
    useEffect(() => {
        if (isCurrentProfileAnalyzing) {
            setIsSubmitting(false);
        }
    }, [isCurrentProfileAnalyzing]);

    useEffect(() => {
        if (activeProfileId && !isSubmitting && !isCurrentProfileAnalyzing) {
            setAction({
                icon: Brain,
                label: "분석하기",
                onClick: () => handleGenerateAnalysis(activeProfileId)
            });
        } else {
            setAction(null);
        }
        return () => setAction(null);
    }, [activeProfileId, setAction, isSubmitting, isCurrentProfileAnalyzing]);

    const handleExportToKompass = (career: CareerRecommendation) => {
        const goalData = {
            title: career.title,
            actions: career.actions,
            strengths: career.strengths,
            weaknesses: career.weaknesses,
            profileId: activeProfileId, // Pass the analyzed profile ID for auto-selection
        };
        sessionStorage.setItem('kompass_import', JSON.stringify(goalData));
        navigate('/goals');
        toast({ title: "Kompass로 이동", description: "목표를 설정해보세요!" });
    };

    const ProfileInfoSidebar = () => {
        const Icon = activeProfile ? (profileTypeIcons[activeProfile.type] || Briefcase) : User;
        const colorClass = activeProfile ? (profileTypeColors[activeProfile.type] || 'text-gray-600 bg-gray-50') : 'text-gray-600 bg-gray-50';
        
        return (
            <div className="flex flex-col h-full">
                <div className="p-6 pb-4">
                    <h2 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                        <LayoutDashboard className="h-5 w-5 text-[#3182F6]" />
                        분석 기준 정보
                    </h2>
                    <p className="text-xs text-[#8B95A1] mt-1">내 프로필 기반으로 분석합니다</p>
                </div>
                
                <div className="px-4">
                    {isLoadingProfiles ? (
                        <div className="p-4 rounded-xl border border-[#E5E8EB] bg-[#F9FAFB]">
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                    ) : activeProfile ? (
                        <div className="p-4 rounded-xl border border-[#E5E8EB] bg-[#F9FAFB]" data-testid="profile-info-summary">
                            <p className="text-xs text-[#8B95A1] mb-2 font-medium">현재 분석 기준</p>
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg", colorClass)}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-[#191F28]">
                                        {activeProfile.title || profileTypeLabels[activeProfile.type]}
                                    </p>
                                    <p className="text-xs text-[#8B95A1]">
                                        {profileTypeLabels[activeProfile.type]}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 rounded-xl border border-[#E5E8EB] bg-[#F9FAFB] text-center">
                            <p className="text-sm text-[#8B95A1] mb-3">등록된 프로필이 없습니다</p>
                            <Link href="/profile">
                                <Button size="sm" className="bg-[#3182F6]">
                                    <Plus className="h-4 w-4 mr-1" /> 프로필 만들기
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
                
                {activeProfile && (
                    <div className="px-4 mt-4">
                        <Link href={`/profile?type=${activeProfile.type}`}>
                            <Button variant="outline" size="sm" className="w-full text-[#8B95A1] hover:text-[#3182F6]">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                프로필 수정하기
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        );
    };

    const DashboardContent = () => {
        if (!latestAnalysis) {
            return (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#3182F6]/20 to-[#3182F6]/5 flex items-center justify-center mb-6">
                        <Brain className="h-10 w-10 text-[#3182F6]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#191F28] mb-2 text-center">AI 분석을 시작해보세요</h3>
                    <p className="text-sm text-[#8B95A1] text-center mb-6 max-w-md">
                        프로필 정보를 바탕으로 맞춤형 진로 분석을 제공합니다
                    </p>
                    
                    {!profileValidation.isValid && activeProfile && (
                        <Alert variant="destructive" className="mb-6 max-w-md">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>프로필 정보 부족</AlertTitle>
                            <AlertDescription>
                                분석을 실행하려면 다음 정보를 입력해주세요:
                                <ul className="mt-2 space-y-1">
                                    {profileValidation.missingFields.map(field => (
                                        <li key={field.key}>
                                            <Link 
                                                href={`/profile?field=${field.key}`}
                                                className="inline-flex items-center text-sm font-medium underline hover:text-red-700"
                                            >
                                                {field.label} <ChevronRight className="h-3 w-3 ml-0.5" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    <Button 
                        onClick={() => activeProfileId && handleGenerateAnalysis(activeProfileId)}
                        disabled={isCurrentProfileAnalyzing || isSubmitting || !activeProfileId || !profileValidation.isValid}
                        className="h-12 px-8 rounded-xl bg-[#3182F6] text-white font-bold disabled:opacity-50"
                        data-testid="button-generate-analysis"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> 분석 요청 중...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-5 w-5 mr-2" /> AI 분석 시작 (100 포인트)
                            </>
                        )}
                    </Button>
                </div>
            );
        }

        const { summary, stats, recommendations } = latestAnalysis;
        const careerRecommendations: CareerRecommendation[] = recommendations?.careers || [];
        const profileType = activeProfile?.type || 'general';

        return (
            <div className="space-y-6">
                {/* Profile validation warning - show even when analysis exists */}
                {!profileValidation.isValid && activeProfile && (
                    <Alert variant="destructive" className="mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>프로필 정보 부족</AlertTitle>
                        <AlertDescription>
                            다시 분석하려면 다음 정보를 입력해주세요:
                            <ul className="mt-2 space-y-1">
                                {profileValidation.missingFields.map(field => (
                                    <li key={field.key}>
                                        <Link 
                                            href={`/profile?field=${field.key}`}
                                            className="inline-flex items-center text-sm font-medium underline hover:text-red-700"
                                        >
                                            {field.label} <ChevronRight className="h-3 w-3 ml-0.5" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-[#191F28]">분석 결과</h2>
                        <p className="text-xs text-[#8B95A1] mt-1">
                            {new Date(latestAnalysis.createdAt).toLocaleDateString('ko-KR')} 분석
                        </p>
                    </div>
                    <Button 
                        onClick={() => activeProfileId && handleGenerateAnalysis(activeProfileId)}
                        disabled={isCurrentProfileAnalyzing || isSubmitting || !profileValidation.isValid}
                        variant="outline"
                        className="rounded-xl border-[#3182F6] text-[#3182F6] disabled:opacity-50"
                        data-testid="button-regenerate-analysis"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 요청 중...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" /> 다시 분석하기
                            </>
                        )}
                    </Button>
                </div>

                <Card className="bg-gradient-to-br from-[#F8FAFC] to-white border-[#E5E8EB]">
                    <CardContent className="p-5">
                        <p className="text-[#4E5968] text-sm leading-relaxed">{summary}</p>
                        
                        {stats && (
                            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#E5E8EB]">
                                <div className="text-center">
                                    <p className="text-[10px] text-[#8B95A1] mb-0.5">{stats.label1}</p>
                                    <p className="text-sm font-bold text-[#3182F6]">{stats.val1}</p>
                                </div>
                                <div className="text-center border-x border-[#E5E8EB]">
                                    <p className="text-[10px] text-[#8B95A1] mb-0.5">{stats.label2}</p>
                                    <p className="text-sm font-bold text-[#191F28]">{stats.val2}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-[#8B95A1] mb-0.5">{stats.label3}</p>
                                    <p className="text-sm font-bold text-[#00BFA5]">{stats.val3}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {careerRecommendations.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-4 px-1">
                            <Target className="h-5 w-5 text-[#3182F6]" />
                            <h3 className="text-lg font-bold text-[#191F28]">
                                {recommendationSectionTitles[profileType]}
                            </h3>
                        </div>
                        <p className="text-sm text-[#8B95A1] mb-4 px-1">
                            각 항목을 클릭하여 상세 정보와 액션 플랜을 확인하세요
                        </p>
                        <div className="space-y-4">
                            {careerRecommendations.map((career, idx) => (
                                <EnhancedCareerCard 
                                    key={idx} 
                                    career={career} 
                                    index={idx}
                                    isExpanded={expandedCareer === `career-${idx}`}
                                    onToggle={setExpandedCareer}
                                    onExportToKompass={handleExportToKompass}
                                    matchScoreLabel={matchScoreLabels[activeProfile?.type || 'general']}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Layout>
            <div className="min-h-screen bg-[#F9FAFB]">
                <div className="flex">
                    <aside className="hidden lg:block w-72 bg-white border-r border-[#E5E8EB] h-screen sticky top-0">
                        <ProfileInfoSidebar />
                    </aside>

                    <main className="flex-1 min-w-0">
                        <div className="lg:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-[#E5E8EB]">
                            <div className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    {activeProfile && (
                                        <div className="flex items-center gap-2">
                                            <div className={cn("p-1.5 rounded-lg", profileTypeColors[activeProfile.type])}>
                                                {(() => {
                                                    const Icon = profileTypeIcons[activeProfile.type] || Briefcase;
                                                    return <Icon className="h-4 w-4" />;
                                                })()}
                                            </div>
                                            <div>
                                                <span className="font-bold text-sm text-[#191F28] truncate max-w-[150px] block">
                                                    {activeProfile.title || profileTypeLabels[activeProfile.type]}
                                                </span>
                                                <span className="text-[10px] text-[#8B95A1]">분석 기준 프로필</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
                            {(isCurrentProfileAnalyzing || isSubmitting) ? (
                                <AnalysisLoadingState 
                                    progress={aiJob.progress}
                                    isSubmitting={isSubmitting}
                                    isCurrentProfileAnalyzing={isCurrentProfileAnalyzing}
                                    jobId={aiJob.jobId}
                                    onCancel={async () => {
                                        const result = await aiJob.cancelJob();
                                        if (result.success) {
                                            toast({
                                                title: "분석이 취소되었습니다",
                                                description: result.refundedAmount ? `${result.refundedAmount} 포인트가 환불되었습니다.` : undefined,
                                            });
                                        }
                                    }}
                                />
                            ) : isLoadingProfiles || isLoadingAnalyses ? (
                                <div className="max-w-3xl mx-auto py-8 space-y-6">
                                    <Card className="toss-card p-6">
                                        <div className="flex items-center gap-4 mb-6">
                                            <Skeleton className="h-12 w-12 rounded-xl" />
                                            <div className="flex-1">
                                                <Skeleton className="h-6 w-48 mb-2" />
                                                <Skeleton className="h-4 w-32" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-4 w-full mb-2" />
                                        <Skeleton className="h-4 w-3/4" />
                                    </Card>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[1, 2].map((i) => (
                                            <Card key={i} className="toss-card p-5">
                                                <Skeleton className="h-5 w-32 mb-3" />
                                                <Skeleton className="h-4 w-full mb-2" />
                                                <Skeleton className="h-4 w-2/3" />
                                            </Card>
                                        ))}
                                    </div>
                                    <Card className="toss-card p-6">
                                        <Skeleton className="h-6 w-40 mb-4" />
                                        <div className="space-y-3">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="p-4 border border-[#E5E8EB] rounded-xl">
                                                    <Skeleton className="h-5 w-48 mb-2" />
                                                    <Skeleton className="h-4 w-full" />
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>
                            ) : !activeProfile ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <User className="h-16 w-16 text-[#B0B8C1] mb-4" />
                                    <h3 className="text-lg font-bold text-[#191F28] mb-2">프로필을 선택하세요</h3>
                                    <p className="text-sm text-[#8B95A1] text-center mb-4">
                                        분석할 프로필을 선택하거나 새로 만들어주세요
                                    </p>
                                    <Link href="/profile">
                                        <Button className="bg-[#3182F6]">
                                            <Plus className="h-4 w-4 mr-2" /> 프로필 만들기
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <DashboardContent />
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </Layout>
    );
}
