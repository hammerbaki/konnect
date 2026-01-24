import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
    Brain, Sparkles, Loader2, 
    Briefcase, School, GraduationCap, 
    Star, Compass,
    ChevronRight, LayoutDashboard, History,
    AlertTriangle, User,
    Clock, Bot, XCircle, Plus, ExternalLink, Target,
    Activity, Award, ArrowDown, Lightbulb, TrendingUp, Zap
} from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
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
    elementary: '진로진단 기반 추천 꿈 직업',
    middle: '진로진단 기반 추천 진로 방향',
    high: '진로진단 기반 추천 대학 학과',
    university: '진로진단 기반 추천 인턴십/직무',
    general: '진로진단 기반 커리어 분석 결과',
};

const matchScoreLabels: Record<string, string> = {
    elementary: '흥미도',
    middle: '적합도',
    high: '합격 가능성',
    university: '취업 적합도',
    general: '적합도',
};

// K-JOBS 7-axis labels (includes both old and new key formats)
const KJOBS_AXIS_LABELS: Record<string, string> = {
    // New key format
    interest: '흥미',
    aptitude: '적성',
    values: '가치관',
    personality: '성격',
    workEnvironment: '업무환경',
    interaction: '상호작용',
    lifestyle: '라이프스타일',
    // Legacy key format (for backward compatibility)
    careerInterests: '흥미영역',
    workNeeds: '업무환경',
    interactionStyle: '상호작용',
    pressureResponse: '스트레스대응',
    selfIdentity: '자아정체성',
    executionLearning: '실행학습',
    valuesPurpose: '가치관',
};

// K-JOBS result type
interface KJobsResult {
    id: string;
    careerDna: string;
    scores?: Record<string, number>;
    facetScores?: Record<string, any>;
    keywords?: string[];
    recommendedJobs?: { jobId: string; title: string; matchPercentage: number; keyCompetencies?: string[] }[];
    growthPlan?: { thirtyDays?: string[]; sixtyDays?: string[]; ninetyDays?: string[] };
    completedAt: string;
}

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

    const { data: kjobsResult } = useQuery<KJobsResult | null>({
        queryKey: ['/api/kjobs/latest'],
        enabled: !!user,
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

                    {!kjobsResult && (
                        <Card className="mb-6 max-w-md border-[#3182F6]/30 bg-gradient-to-r from-[#E8F3FF] to-white">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#3182F6]/10 flex items-center justify-center shrink-0">
                                        <Brain className="w-5 h-5 text-[#3182F6]" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-[#191F28] text-sm mb-1">진로진단 검사로 더 정확한 분석을!</h4>
                                        <p className="text-xs text-[#8B95A1] mb-2">
                                            K-JOBS 진로진단 검사 결과가 AI 분석에 반영됩니다.
                                        </p>
                                        <Link href="/mytest" className="inline-flex items-center text-xs font-medium text-[#3182F6] hover:underline" data-testid="link-take-kjobs-test">
                                            진로진단 시작하기 <ChevronRight className="w-3 h-3 ml-0.5" />
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    
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
                    <div className="flex items-center gap-2">
                        {activeProfile && (
                            <Link href={`/profile?type=${activeProfile.type}`}>
                                <Button 
                                    variant="outline" 
                                    className="rounded-xl border-[#E5E8EB] text-[#4E5968] hover:border-[#3182F6] hover:text-[#3182F6]"
                                    data-testid="button-profile-criteria"
                                >
                                    {(() => {
                                        const Icon = profileTypeIcons[activeProfile.type] || Briefcase;
                                        return <Icon className="h-4 w-4 mr-2" />;
                                    })()}
                                    {activeProfile.title || profileTypeLabels[activeProfile.type]}
                                </Button>
                            </Link>
                        )}
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

                {/* K-JOBS 진로진단 결과 섹션 */}
                {kjobsResult && (
                    <Card className="border-[#E5E8EB] overflow-hidden" data-testid="card-kjobs-result">
                        <CardHeader className="bg-gradient-to-r from-[#3182F6] to-[#1E5FD3] text-white pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Brain className="w-5 h-5" />
                                    진로진단 결과
                                </CardTitle>
                                <Badge className="bg-white/20 text-white border-0 text-xs" data-testid="badge-kjobs">
                                    K-JOBS MyTest
                                </Badge>
                            </div>
                            <div className="mt-3">
                                <p className="text-sm opacity-80">나의 Career DNA</p>
                                <p className="text-xl font-bold mt-1" data-testid="text-career-dna">{kjobsResult.careerDna || '분석 중'}</p>
                            </div>
                            {kjobsResult.keywords && kjobsResult.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3" data-testid="keywords-list">
                                    {kjobsResult.keywords.slice(0, 5).map((keyword, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-white/20 rounded-full text-xs" data-testid={`text-keyword-${i}`}>
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="p-5">
                            {/* 7축 진단 레이더 차트 */}
                            {kjobsResult.scores && Object.keys(kjobsResult.scores).length > 0 && (
                                <div className="mb-6" data-testid="section-scores-chart">
                                    <h4 className="text-sm font-semibold text-[#191F28] mb-4 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-[#3182F6]" />
                                        역량분석
                                    </h4>
                                    <div className="h-64" data-testid="chart-radar">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={
                                                Object.entries(kjobsResult.scores).map(([key, value]) => ({
                                                    subject: KJOBS_AXIS_LABELS[key] || key,
                                                    value: value,
                                                    fullMark: 100,
                                                }))
                                            }>
                                                <PolarGrid stroke="#E5E8EB" />
                                                <PolarAngleAxis 
                                                    dataKey="subject" 
                                                    tick={{ fill: '#4E5968', fontSize: 11 }}
                                                />
                                                <Radar
                                                    name="점수"
                                                    dataKey="value"
                                                    stroke="#3182F6"
                                                    fill="#3182F6"
                                                    fillOpacity={0.3}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {/* 점수 상세 */}
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        {Object.entries(kjobsResult.scores).map(([key, value]) => (
                                            <div key={key} className="flex items-center justify-between p-2 bg-[#F9FAFB] rounded-lg">
                                                <span className="text-xs text-[#4E5968]">{KJOBS_AXIS_LABELS[key] || key}</span>
                                                <span className={cn(
                                                    "text-sm font-bold",
                                                    value >= 70 ? "text-[#22C55E]" : value >= 50 ? "text-[#3182F6]" : "text-[#8B95A1]"
                                                )}>{value}점</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* === 3섹션 추천 직업 구조 === */}
                            {kjobsResult.recommendedJobs && kjobsResult.recommendedJobs.length > 0 && (() => {
                                // 희망직무 정보 추출 (모든 프로필 타입 커버)
                                const desiredJob = activeProfile?.profileData?.gen_desiredRole || 
                                                   activeProfile?.profileData?.intl_desiredPosition || 
                                                   activeProfile?.profileData?.univ_desiredRole ||
                                                   activeProfile?.profileData?.univ_desiredIndustry ||
                                                   activeProfile?.profileData?.high_hopedCareer || '';
                                const desiredIndustry = activeProfile?.profileData?.gen_desiredIndustry || 
                                                        activeProfile?.profileData?.univ_desiredIndustry || '';
                                
                                // 상위 역량 추출 (55점 이상, 최대 3개)
                                const topCompetencies = kjobsResult.scores 
                                    ? Object.entries(kjobsResult.scores)
                                        .filter(([_, v]) => typeof v === 'number' && v >= 55)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 3)
                                    : [];
                                const topCompetencyLabels = topCompetencies.map(([key, _]) => KJOBS_AXIS_LABELS[key] || key);
                                const topCompetencyAvg = topCompetencies.length > 0 
                                    ? Math.round(topCompetencies.reduce((sum, [_, v]) => sum + v, 0) / topCompetencies.length)
                                    : 0;
                                
                                // 모든 추천 직업
                                const allJobs = kjobsResult.recommendedJobs;
                                
                                // 직무군 정의 (동일 직무군 판별용)
                                const jobCategories: Record<string, { keywords: string[], skills: string[] }> = {
                                    'IT개발': { 
                                        keywords: ['개발', '프로그래머', '엔지니어', 'SW', '소프트웨어', '백엔드', '프론트엔드', '풀스택', '앱', '웹', '시스템', 'AI', '인공지능', '데이터'],
                                        skills: ['프로그래밍', '코딩', '알고리즘', '데이터베이스', 'API', '시스템설계', '문제해결', '논리적사고']
                                    },
                                    '기획전략': { 
                                        keywords: ['기획', '전략', 'PM', '프로젝트', '매니저', '서비스기획', '상품기획', '사업기획', '경영기획'],
                                        skills: ['기획력', '분석력', '커뮤니케이션', '프레젠테이션', '문서작성', '조정능력', '전략적사고']
                                    },
                                    '디자인': { 
                                        keywords: ['디자인', 'UI', 'UX', '그래픽', '시각', '브랜드', '제품디자인', '영상', '모션'],
                                        skills: ['창의력', '시각적표현', '디자인툴', '사용자경험', '트렌드분석', '컬러감각', '레이아웃']
                                    },
                                    '마케팅': { 
                                        keywords: ['마케팅', '광고', '홍보', 'PR', '브랜딩', '콘텐츠', 'SNS', '퍼포먼스', '그로스'],
                                        skills: ['마케팅전략', '데이터분석', '콘텐츠제작', '커뮤니케이션', '트렌드파악', '고객이해', '창의력']
                                    },
                                    '영업': { 
                                        keywords: ['영업', '세일즈', '어카운트', '제휴', 'B2B', 'B2C', '해외영업'],
                                        skills: ['협상력', '고객관리', '커뮤니케이션', '설득력', '목표달성', '관계구축', '시장분석']
                                    },
                                    '연구개발': { 
                                        keywords: ['연구', 'R&D', '연구원', '개발연구', '기술연구', '과학', '실험'],
                                        skills: ['분석력', '문제해결', '실험설계', '논문작성', '데이터분석', '창의력', '전문지식']
                                    },
                                    '경영관리': { 
                                        keywords: ['경영', '관리', '인사', 'HR', '재무', '회계', '총무', '법무'],
                                        skills: ['조직관리', '의사결정', '분석력', '리더십', '커뮤니케이션', '전략적사고']
                                    },
                                    '교육': { 
                                        keywords: ['교육', '강사', '교사', '트레이너', '멘토', '코치'],
                                        skills: ['교육설계', '커뮤니케이션', '전달력', '인내심', '피드백', '학습이해']
                                    },
                                    '의료헬스': { 
                                        keywords: ['의료', '간호', '헬스케어', '건강', '병원', '약사', '치료'],
                                        skills: ['전문지식', '환자케어', '커뮤니케이션', '분석력', '세심함', '윤리의식']
                                    },
                                    '콘텐츠': { 
                                        keywords: ['콘텐츠', '에디터', '작가', '기자', '영상', '크리에이터', 'PD'],
                                        skills: ['창의력', '스토리텔링', '글쓰기', '영상편집', '트렌드파악', '커뮤니케이션']
                                    }
                                };
                                
                                // 직무군 판별 함수
                                const getJobCategory = (jobTitle: string): string | null => {
                                    const titleLower = jobTitle.toLowerCase();
                                    for (const [category, { keywords }] of Object.entries(jobCategories)) {
                                        if (keywords.some(kw => titleLower.includes(kw.toLowerCase()))) {
                                            return category;
                                        }
                                    }
                                    return null;
                                };
                                
                                // 스킬 중첩도 계산 (70% 이상 기준)
                                const calculateSkillOverlap = (desiredCategory: string | null, jobCategory: string | null): number => {
                                    if (!desiredCategory || !jobCategory) return 0;
                                    if (desiredCategory === jobCategory) return 100;
                                    
                                    const desiredSkills = jobCategories[desiredCategory]?.skills || [];
                                    const jobSkills = jobCategories[jobCategory]?.skills || [];
                                    if (desiredSkills.length === 0 || jobSkills.length === 0) return 0;
                                    
                                    const overlap = desiredSkills.filter(s => jobSkills.includes(s)).length;
                                    return Math.round((overlap / desiredSkills.length) * 100);
                                };
                                
                                // 연계 이유 생성 함수 (사용자 요구사항에 맞춰 정확한 문구 사용)
                                const generateLinkReason = (desiredCategory: string | null, jobCategory: string | null, skillOverlap: number, desiredJob: string, jobTitle: string): string => {
                                    if (desiredCategory === jobCategory && desiredCategory) {
                                        // 동일 직무군인 경우
                                        return `동일한 '${desiredCategory}' 직무군으로, 직무 전환 시 기존 역량을 그대로 활용할 수 있습니다.`;
                                    }
                                    if (skillOverlap >= 70) {
                                        // 스킬 70% 이상 중첩인 경우
                                        const sharedSkills = jobCategories[desiredCategory || '']?.skills.filter(
                                            s => jobCategories[jobCategory || '']?.skills.includes(s)
                                        ) || [];
                                        return `핵심 스킬 ${skillOverlap}% 중첩 (${sharedSkills.slice(0, 3).join(', ')}). 유사 역량 기반으로 연계 가능합니다.`;
                                    }
                                    return `${desiredJob} 경험을 바탕으로 발전 가능한 직무입니다.`;
                                };
                                
                                // 희망직무의 직무군 판별
                                const desiredCategory = getJobCategory(desiredJob);
                                
                                // 섹션1: 진로진단 기반 추천 (상위 3개 - 성향/역량 최적 매칭)
                                const diagnosisBasedJobs = allJobs.slice(0, 3);
                                
                                // 섹션2: 희망직무 연계 추천 (동일 직무군 OR 스킬 70%+ 중첩만 허용)
                                const linkedJobs = desiredJob 
                                    ? allJobs.slice(0, 15)
                                        .map((job: any) => {
                                            const jobCategory = getJobCategory(job.title);
                                            const skillOverlap = calculateSkillOverlap(desiredCategory, jobCategory);
                                            const isSameCategory = desiredCategory && jobCategory && desiredCategory === jobCategory;
                                            const hasHighSkillOverlap = skillOverlap >= 70;
                                            const isLinkedQualified = isSameCategory || hasHighSkillOverlap;
                                            const linkReason = generateLinkReason(desiredCategory, jobCategory, skillOverlap, desiredJob, job.title);
                                            
                                            return {
                                                ...job,
                                                jobCategory,
                                                skillOverlap,
                                                isSameCategory,
                                                hasHighSkillOverlap,
                                                isLinkedQualified,
                                                linkReason,
                                                linkedScore: isSameCategory ? 95 : (hasHighSkillOverlap ? 85 + Math.round(skillOverlap * 0.1) : 0)
                                            };
                                        })
                                        .filter((job: any) => job.isLinkedQualified)
                                        .filter((job: any) => !diagnosisBasedJobs.some((d: any) => d.title === job.title))
                                        .sort((a: any, b: any) => b.linkedScore - a.linkedScore)
                                        .slice(0, 3)
                                    : [];
                                
                                // 섹션3: 전환 가능 직무 (연계 자격 미달 - 다른 직무군이고 스킬 중첩 70% 미만)
                                const usedTitles = [...diagnosisBasedJobs, ...linkedJobs].map((j: any) => j.title);
                                const transferJobs = desiredJob
                                    ? allJobs.slice(0, 15)
                                        .filter((job: any) => !usedTitles.includes(job.title)) // 먼저 사용된 직업 제외
                                        .map((job: any) => {
                                            const jobCategory = getJobCategory(job.title);
                                            const skillOverlap = calculateSkillOverlap(desiredCategory, jobCategory);
                                            const isSameCategory = desiredCategory && jobCategory && desiredCategory === jobCategory;
                                            const hasHighSkillOverlap = skillOverlap >= 70;
                                            const isLinkedQualified = isSameCategory || hasHighSkillOverlap;
                                            
                                            // 전환 이유 생성 (사용자 요구사항에 맞춰 정확한 문구 사용)
                                            let transferReason = '';
                                            const sharedSkills = jobCategories[desiredCategory || '']?.skills.slice(0, 2).join(', ') || '역량';
                                            if (skillOverlap > 0) {
                                                // 스킬 공유가 있는 경우
                                                transferReason = `${sharedSkills} 스킬 ${skillOverlap}% 공유. ${jobCategory || '새로운'} 분야로 전환할 수 있습니다.`;
                                            } else {
                                                // 스킬 공유가 없는 경우
                                                transferReason = `진단 결과 높은 적합도를 보이며, 새로운 분야로 도전이 가능합니다.`;
                                            }
                                            
                                            return {
                                                ...job,
                                                jobCategory,
                                                skillOverlap,
                                                isTransferCandidate: !isLinkedQualified, // 연계 자격 미달이면 전환 후보
                                                transferReason
                                            };
                                        })
                                        .filter((job: any) => job.isTransferCandidate) // 연계 자격 미달인 직업만
                                        .sort((a: any, b: any) => b.matchPercentage - a.matchPercentage) // 진단 매칭도 순으로 정렬
                                        .slice(0, 5)
                                    : allJobs
                                        .filter((job: any) => !usedTitles.includes(job.title))
                                        .filter((job: any) => job.matchPercentage >= 40 && job.matchPercentage <= 80)
                                        .slice(0, 5);
                                
                                return (
                                    <div className="space-y-6" data-testid="section-job-recommendations">
                                        {/* 섹션 1: 진로진단 기반 추천 직업 */}
                                        <div data-testid="section-diagnosis-based">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#3182F6] text-white text-[10px] font-bold">1</div>
                                                <h4 className="text-sm font-semibold text-[#191F28]">진로진단 기반 추천 직업</h4>
                                                <Badge className="bg-[#3182F6]/10 text-[#3182F6] border-0 text-[9px]">성향·역량 중심</Badge>
                                            </div>
                                            <div className="mb-2 p-2 bg-[#EFF6FF] rounded-lg">
                                                <p className="text-[10px] text-[#3182F6]">
                                                    <strong>추천 기준:</strong> 진로진단 응답 기반 성향·역량 분석 결과
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                {diagnosisBasedJobs.map((job: any, i: number) => (
                                                    <div key={job.jobId || i} className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E8EB]" data-testid={`card-diagnosis-job-${i}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-[#3182F6] text-white flex items-center justify-center font-bold text-xs">
                                                                {i + 1}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium text-[#191F28]">{job.title}</span>
                                                                <span className="text-[10px] text-[#8B95A1]">성향·역량 적합도</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-sm font-bold text-[#3182F6]">{job.matchPercentage}%</span>
                                                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-[#EFF6FF] text-[#3182F6] border-[#3182F6]/30">
                                                                진단기반
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* 섹션 2: 희망직무 연계 추천 직업 */}
                                        {desiredJob && linkedJobs.length > 0 && (
                                            <div data-testid="section-linked-jobs">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#8B5CF6] text-white text-[10px] font-bold">2</div>
                                                    <h4 className="text-sm font-semibold text-[#191F28]">희망직무 연계 추천 직업</h4>
                                                    <Badge className="bg-[#8B5CF6]/10 text-[#8B5CF6] border-0 text-[9px]">동일직무군/스킬중첩</Badge>
                                                </div>
                                                <div className="mb-2 p-2 bg-[#F5F3FF] rounded-lg">
                                                    <p className="text-[10px] text-[#8B5CF6]">
                                                        <strong>추천 기준:</strong> 희망직무({desiredJob})와 동일 직무군 또는 핵심 스킬 70% 이상 중첩
                                                    </p>
                                                    <p className="text-[9px] text-[#8B95A1] mt-1">
                                                        {desiredCategory ? `희망직무 직무군: ${desiredCategory}` : '직무군 분석 중'}
                                                    </p>
                                                </div>
                                                <div className="space-y-3">
                                                    {linkedJobs.map((job: any, i: number) => (
                                                        <div key={job.jobId || i} className="p-3 bg-[#FAFAFA] rounded-xl border border-[#8B5CF6]/20" data-testid={`card-linked-job-${i}`}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-6 h-6 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center font-bold text-xs">
                                                                        {i + 1}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium text-[#191F28]">{job.title}</span>
                                                                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                                                            {job.isSameCategory && (
                                                                                <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 bg-[#F3E8FF] text-[#8B5CF6] border-[#8B5CF6]/30">
                                                                                    동일 직무군
                                                                                </Badge>
                                                                            )}
                                                                            {job.hasHighSkillOverlap && !job.isSameCategory && (
                                                                                <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 bg-[#EFF6FF] text-[#3182F6] border-[#3182F6]/30">
                                                                                    스킬 {job.skillOverlap}% 중첩
                                                                                </Badge>
                                                                            )}
                                                                            {job.jobCategory && (
                                                                                <Badge variant="outline" className="text-[7px] px-1 py-0 h-3.5 bg-white text-[#8B95A1] border-[#E5E8EB]">
                                                                                    {job.jobCategory}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-sm font-bold text-[#8B5CF6]">{job.linkedScore}%</span>
                                                                    <span className="text-[9px] text-[#8B95A1]">연계 적합도</span>
                                                                </div>
                                                            </div>
                                                            <div className="p-2 bg-[#F5F3FF] rounded-lg">
                                                                <p className="text-[10px] text-[#6B7280] leading-relaxed">
                                                                    <span className="text-[#8B5CF6] font-medium">연계 이유:</span> {job.linkReason}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* 희망직무 없을 때 안내 */}
                                        {!desiredJob && (
                                            <div className="p-3 bg-[#F5F3FF] rounded-lg border border-[#8B5CF6]/20" data-testid="notice-no-desired-job">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Compass className="w-4 h-4 text-[#8B5CF6]" />
                                                    <span className="text-sm font-medium text-[#191F28]">희망직무 연계 추천</span>
                                                </div>
                                                <p className="text-xs text-[#8B95A1]">
                                                    프로필에 희망직무를 입력하면 진단 결과와 연계된 맞춤 추천을 받을 수 있습니다.
                                                </p>
                                            </div>
                                        )}
                                        
                                        {/* 섹션 3: 전환 가능 직무 (직무군이 다른 경우) */}
                                        {transferJobs.length > 0 && (
                                            <div data-testid="section-transfer-jobs">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#00BFA5] text-white text-[10px] font-bold">3</div>
                                                    <h4 className="text-sm font-semibold text-[#191F28]">전환 가능 직무</h4>
                                                    <Badge className="bg-[#00BFA5]/10 text-[#00BFA5] border-0 text-[9px]">커리어 확장</Badge>
                                                </div>
                                                <div className="mb-2 p-2 bg-[#F0FDF4] rounded-lg">
                                                    <p className="text-[10px] text-[#00BFA5]">
                                                        <strong>추천 기준:</strong> 희망직무와 다른 직무군이지만, 기존 역량을 활용해 전환 가능한 직무
                                                    </p>
                                                    <p className="text-[9px] text-[#8B95A1] mt-1">
                                                        새로운 분야로의 커리어 확장 가능성을 보여드립니다
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    {transferJobs.map((job: any, i: number) => (
                                                        <div key={job.jobId || i} className="p-3 bg-[#F9FAFB] rounded-lg border border-[#00BFA5]/20" data-testid={`card-transfer-job-${i}`}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium text-[#191F28]">{job.title}</span>
                                                                    {job.jobCategory && (
                                                                        <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 bg-white text-[#8B95A1] border-[#E5E8EB]">
                                                                            {job.jobCategory}
                                                                        </Badge>
                                                                    )}
                                                                    {job.skillOverlap > 0 && (
                                                                        <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 bg-[#FEF3C7] text-[#D97706] border-[#D97706]/30">
                                                                            스킬 {job.skillOverlap}% 공유
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <span className="text-sm font-bold text-[#00BFA5]">{job.matchPercentage}%</span>
                                                            </div>
                                                            {job.transferReason && (
                                                                <p className="text-[10px] text-[#6B7280] leading-relaxed">
                                                                    <span className="text-[#00BFA5] font-medium">전환 이유:</span> {job.transferReason}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>
                )}

                {/* AI 분석 요약 브릿지 카드 */}
                {kjobsResult && careerRecommendations.length > 0 && (
                    <div className="relative" data-testid="section-ai-bridge">
                        {/* 연결선 */}
                        <div className="absolute left-1/2 -top-3 transform -translate-x-1/2">
                            <div className="flex flex-col items-center">
                                <ArrowDown className="h-6 w-6 text-[#3182F6] animate-bounce" />
                            </div>
                        </div>
                        
                        <Card className="border-[#3182F6]/30 bg-gradient-to-br from-[#EFF6FF] to-white overflow-hidden mt-2">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#3182F6] to-[#1E5FD3] flex items-center justify-center shadow-lg">
                                        <Sparkles className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="text-base font-bold text-[#191F28]">AI 분석 요약</h4>
                                            <Badge className="bg-[#3182F6]/10 text-[#3182F6] border-0 text-xs">
                                                K-JOBS 기반
                                            </Badge>
                                        </div>
                                        
                                        {/* 진단 결과 요약 */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm text-[#4E5968]">
                                                <Brain className="h-4 w-4 text-[#3182F6] shrink-0" />
                                                <span>
                                                    <strong className="text-[#191F28]">Career DNA:</strong> {kjobsResult.careerDna || '분석 완료'}
                                                </span>
                                            </div>
                                            
                                            {kjobsResult.scores && Object.keys(kjobsResult.scores).length > 0 && (() => {
                                                const scoreEntries = Object.entries(kjobsResult.scores)
                                                    .filter(([_, v]) => typeof v === 'number' && !isNaN(v));
                                                const strongAreas = scoreEntries
                                                    .filter(([_, v]) => v >= 55)
                                                    .sort((a, b) => b[1] - a[1])
                                                    .slice(0, 3);
                                                return strongAreas.length > 0 && (
                                                    <div className="flex items-center gap-2 text-sm text-[#4E5968]">
                                                        <TrendingUp className="h-4 w-4 text-[#22C55E] shrink-0" />
                                                        <span>
                                                            <strong className="text-[#191F28]">강점 영역:</strong>{' '}
                                                            {strongAreas.map(([key, _]) => KJOBS_AXIS_LABELS[key] || key).join(', ')}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                            
                                            {kjobsResult.keywords && kjobsResult.keywords.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {kjobsResult.keywords.slice(0, 4).map((keyword, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-[#3182F6]/10 text-[#3182F6] rounded-full text-xs font-medium">
                                                            {keyword}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* 분석 설명 */}
                                        <div className="mt-4 p-3 bg-white/60 rounded-lg border border-[#E5E8EB]">
                                            <div className="flex items-start gap-2">
                                                <Lightbulb className="h-4 w-4 text-[#F59E0B] shrink-0 mt-0.5" />
                                                <p className="text-xs text-[#4E5968] leading-relaxed">
                                                    K-JOBS 진로진단 결과를 바탕으로 AI가 회원님의 <strong className="text-[#191F28]">역량, 성향, 관심사</strong>를 
                                                    종합 분석하여 아래 커리어를 도출했습니다. 각 추천은 진단 데이터에 기반한 
                                                    <strong className="text-[#3182F6]"> 맞춤형 결과</strong>입니다.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* 하단 연결선 */}
                        <div className="flex justify-center py-2">
                            <ArrowDown className="h-5 w-5 text-[#3182F6]/50" />
                        </div>
                    </div>
                )}

                {careerRecommendations.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2 px-1">
                            <Target className="h-5 w-5 text-[#3182F6]" />
                            <h3 className="text-lg font-bold text-[#191F28]">
                                {recommendationSectionTitles[profileType]}
                            </h3>
                        </div>
                        
                        {/* 진로진단 적합도 표시 */}
                        {kjobsResult && kjobsResult.recommendedJobs && kjobsResult.recommendedJobs.length > 0 && (() => {
                            const validJobs = kjobsResult.recommendedJobs
                                .slice(0, 5)
                                .filter((job: { matchPercentage?: number }) => typeof job.matchPercentage === 'number' && !isNaN(job.matchPercentage));
                            const avgMatch = validJobs.length > 0 
                                ? Math.round(validJobs.reduce((sum: number, job: { matchPercentage: number }) => sum + job.matchPercentage, 0) / validJobs.length)
                                : null;
                            return avgMatch !== null && (
                                <div className="flex items-center gap-2 mb-3 px-1" data-testid="section-kjobs-match-summary">
                                    <Zap className="h-4 w-4 text-[#F59E0B]" />
                                    <span className="text-sm text-[#4E5968]">
                                        K-JOBS 진로진단 적합도: 
                                        <strong className="text-[#3182F6] ml-1">평균 {avgMatch}%</strong>
                                    </span>
                                </div>
                            );
                        })()}
                        
                        {/* K-JOBS 결과 없을 때 프로필 기반 안내 */}
                        {!kjobsResult && careerRecommendations.length > 0 && (
                            <div className="flex items-center gap-2 mb-3 px-1 p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E8EB]" data-testid="section-profile-based-notice">
                                <Bot className="h-4 w-4 text-[#8B95A1]" />
                                <span className="text-sm text-[#4E5968]">
                                    프로필 정보를 기반으로 AI가 분석한 결과입니다.
                                    <span className="text-[#3182F6] ml-1">진로진단을 완료하면 더 정확한 추천을 받을 수 있습니다.</span>
                                </span>
                            </div>
                        )}
                        
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
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-8">
                    {/* Mobile profile header */}
                    <div className="lg:hidden mb-4 p-3 bg-white rounded-xl border border-[#E5E8EB]">
                        <div className="flex items-center justify-between">
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
                            {activeProfile && (
                                <Link href={`/profile?type=${activeProfile.type}`}>
                                    <Button variant="outline" size="sm" className="text-xs text-[#8B95A1] hover:text-[#3182F6]">
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        수정
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <main className="flex-1 min-w-0">
                            <div className="max-w-3xl">
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
            </div>
        </Layout>
    );
}
