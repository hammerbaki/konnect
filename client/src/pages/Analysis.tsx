import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
    Brain, Sparkles, Loader2, ArrowRight, 
    Briefcase, TrendingUp, School, GraduationCap, 
    Target, Award, Star, Compass,
    ChevronRight, Plus, LayoutDashboard, History,
    CheckCircle2, AlertTriangle, Zap, User, ExternalLink,
    FolderOpen, Users, Heart, Lightbulb, LayoutGrid,
    XCircle, Clock
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMobileAction } from "@/lib/MobileActionContext";
import { Link, useLocation } from "wouter";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/AuthContext";
import { useAIJob } from "@/hooks/useAIJob";
import { useTokens } from "@/lib/TokenContext";
import { Bot } from "lucide-react";

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

interface CareerActions {
    portfolio: string[];
    networking: string[];
    mindset: string[];
}

interface CareerRecommendation {
    title: string;
    description: string;
    matchScore: number;
    salary: string;
    jobOutlook: string;
    competencies: Array<{ subject: string; A: number; fullMark: number }>;
    strengths: string[];
    weaknesses: string[];
    actions: CareerActions;
}

const profileTypeIcons: Record<string, any> = {
    general: Briefcase,
    university: GraduationCap,
    high: School,
    middle: School,
    elementary: Star,
};

const profileTypeColors: Record<string, string> = {
    general: 'text-blue-600 bg-blue-50',
    university: 'text-purple-600 bg-purple-50',
    high: 'text-pink-600 bg-pink-50',
    middle: 'text-orange-600 bg-orange-50',
    elementary: 'text-green-600 bg-green-50',
};

const profileTypeLabels: Record<string, string> = {
    general: '일반 (직장인)',
    university: '대학생',
    high: '고등학생',
    middle: '중학생',
    elementary: '초등학생',
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
            weaknesses: career.weaknesses
        };
        sessionStorage.setItem('kompass_import', JSON.stringify(goalData));
        navigate('/goals');
        toast({ title: "Kompass로 이동", description: "목표를 설정해보세요!" });
    };

    const ProfileSidebar = () => (
        <div className="flex flex-col h-full">
            <div className="p-6 pb-4">
                <h2 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-[#3182F6]" />
                    내 프로필
                </h2>
                <p className="text-xs text-[#8B95A1] mt-1">분석할 프로필 선택</p>
            </div>
            
            <div className="flex-1 overflow-y-auto px-3 space-y-2">
                {isLoadingProfiles ? (
                    <div className="space-y-2 py-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-[#E5E8EB]">
                                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <Skeleton className="h-4 w-24 mb-1.5" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : profiles && profiles.length > 0 ? (
                    profiles.map((profile: any) => {
                        const Icon = profileTypeIcons[profile.type] || Briefcase;
                        const isActive = activeProfileId === profile.id;
                        const colorClass = profileTypeColors[profile.type] || 'text-gray-600 bg-gray-50';
                        return (
                            <button
                                key={profile.id}
                                onClick={() => {
                                    setActiveProfileId(profile.id);
                                    setIsSidebarOpen(false);
                                }}
                                className={cn(
                                    "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 border",
                                    isActive 
                                        ? "bg-white border-[#3182F6] shadow-sm ring-1 ring-[#3182F6]" 
                                        : "bg-transparent border-transparent hover:bg-[#F2F4F6]"
                                )}
                                data-testid={`button-select-profile-${profile.id}`}
                            >
                                <div className={cn("p-2 rounded-lg shrink-0", colorClass)}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className={cn("font-bold text-sm truncate", isActive ? "text-[#191F28]" : "text-[#4E5968]")}>
                                            {profile.title || profileTypeLabels[profile.type]}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-[#8B95A1] block truncate">
                                        {profileTypeLabels[profile.type]}
                                    </span>
                                </div>
                                <ChevronRight className={cn("h-4 w-4 shrink-0 mt-1", isActive ? "text-[#3182F6]" : "text-[#B0B8C1]")} />
                            </button>
                        );
                    })
                ) : (
                    <div className="text-center py-8">
                        <p className="text-sm text-[#8B95A1] mb-3">등록된 프로필이 없습니다</p>
                        <Link href="/profile">
                            <Button size="sm" className="bg-[#3182F6]">
                                <Plus className="h-4 w-4 mr-1" /> 프로필 만들기
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );

    const CareerCard = ({ career, index }: { career: CareerRecommendation; index: number }) => {
        const isExpanded = expandedCareer === `career-${index}`;
        const profileType = activeProfile?.type || 'general';
        
        return (
            <Card className={cn(
                "border transition-all duration-300",
                isExpanded ? "border-[#3182F6] shadow-lg" : "border-[#E5E8EB] hover:border-[#3182F6]/50"
            )}>
                <Accordion type="single" collapsible value={expandedCareer || ""} onValueChange={setExpandedCareer}>
                    <AccordionItem value={`career-${index}`} className="border-none">
                        <AccordionTrigger className="px-5 py-4 hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3182F6] to-[#1565C0] flex items-center justify-center shrink-0">
                                        <span className="text-lg font-bold text-white">{career.matchScore}%</span>
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-base font-bold text-[#191F28]">{career.title}</h4>
                                            {index === 0 && (
                                                <Badge className="bg-[#E8F3FF] text-[#3182F6] hover:bg-[#E8F3FF] border-none px-2 py-0.5 text-[10px]">
                                                    AI Pick
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-[#8B95A1]">{matchScoreLabels[profileType]}</p>
                                    </div>
                                </div>
                            </div>
                        </AccordionTrigger>
                        
                        <AccordionContent className="px-5 pb-5">
                            <div className="space-y-6">
                                <p className="text-sm text-[#4E5968] leading-relaxed">{career.description}</p>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-[#F9FAFB] rounded-xl p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Briefcase className="h-3.5 w-3.5 text-[#3182F6]" />
                                            <span className="text-[10px] text-[#8B95A1]">정보</span>
                                        </div>
                                        <p className="text-sm font-medium text-[#191F28]">{career.salary}</p>
                                    </div>
                                    <div className="bg-[#F9FAFB] rounded-xl p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TrendingUp className="h-3.5 w-3.5 text-[#00BFA5]" />
                                            <span className="text-[10px] text-[#8B95A1]">전망</span>
                                        </div>
                                        <p className="text-sm font-medium text-[#191F28]">{career.jobOutlook}</p>
                                    </div>
                                </div>

                                {career.competencies && career.competencies.length > 0 && (
                                    <div className="bg-[#F9FAFB] rounded-xl p-4">
                                        <h5 className="text-sm font-bold text-[#191F28] mb-3 flex items-center gap-2">
                                            <Award className="h-4 w-4 text-[#3182F6]" /> 역량 분석
                                        </h5>
                                        <div className="h-[180px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={career.competencies}>
                                                    <PolarGrid stroke="#E5E8EB" />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#4E5968', fontSize: 10 }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                                    <Radar name="역량" dataKey="A" stroke="#3182F6" fill="#3182F6" fillOpacity={0.3} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-[#F0FDF4] rounded-xl p-4">
                                        <h5 className="text-sm font-bold text-[#00BFA5] mb-3 flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" /> 강점
                                        </h5>
                                        <ul className="space-y-2">
                                            {career.strengths?.map((s, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-[#4E5968]">
                                                    <CheckCircle2 className="h-4 w-4 text-[#00BFA5] shrink-0 mt-0.5" />
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-[#FFF7ED] rounded-xl p-4">
                                        <h5 className="text-sm font-bold text-[#F59E0B] mb-3 flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4" /> 보완점
                                        </h5>
                                        <ul className="space-y-2">
                                            {career.weaknesses?.map((w, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-[#4E5968]">
                                                    <AlertTriangle className="h-4 w-4 text-[#F59E0B] shrink-0 mt-0.5" />
                                                    {w}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {career.actions && (
                                    <div className="space-y-4">
                                        <h5 className="text-base font-bold text-[#191F28] flex items-center gap-2">
                                            <Zap className="h-5 w-5 text-[#3182F6]" /> 추천 액션
                                        </h5>
                                        
                                        <div className="grid gap-4">
                                            {career.actions.portfolio?.length > 0 && (
                                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="w-8 h-8 rounded-lg bg-[#3182F6] flex items-center justify-center">
                                                            <FolderOpen className="h-4 w-4 text-white" />
                                                        </div>
                                                        <div>
                                                            <h6 className="text-sm font-bold text-[#191F28]">포트폴리오</h6>
                                                            <p className="text-[10px] text-[#8B95A1]">만들고 준비할 것들</p>
                                                        </div>
                                                    </div>
                                                    <ul className="space-y-2">
                                                        {career.actions.portfolio.map((item, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm text-[#4E5968] bg-white/60 rounded-lg p-2.5">
                                                                <div className="w-5 h-5 rounded-full bg-[#3182F6]/10 flex items-center justify-center shrink-0 mt-0.5">
                                                                    <span className="text-[10px] font-bold text-[#3182F6]">{i + 1}</span>
                                                                </div>
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {career.actions.networking?.length > 0 && (
                                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                                                            <Users className="h-4 w-4 text-white" />
                                                        </div>
                                                        <div>
                                                            <h6 className="text-sm font-bold text-[#191F28]">네트워킹</h6>
                                                            <p className="text-[10px] text-[#8B95A1]">만나고 연결할 사람들</p>
                                                        </div>
                                                    </div>
                                                    <ul className="space-y-2">
                                                        {career.actions.networking.map((item, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm text-[#4E5968] bg-white/60 rounded-lg p-2.5">
                                                                <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                                                    <span className="text-[10px] font-bold text-purple-600">{i + 1}</span>
                                                                </div>
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {career.actions.mindset?.length > 0 && (
                                                <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl p-4 border border-rose-100">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center">
                                                            <Heart className="h-4 w-4 text-white" />
                                                        </div>
                                                        <div>
                                                            <h6 className="text-sm font-bold text-[#191F28]">마인드셋</h6>
                                                            <p className="text-[10px] text-[#8B95A1]">갖춰야 할 마음가짐</p>
                                                        </div>
                                                    </div>
                                                    <ul className="space-y-2">
                                                        {career.actions.mindset.map((item, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm text-[#4E5968] bg-white/60 rounded-lg p-2.5">
                                                                <div className="w-5 h-5 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                                                    <Heart className="h-3 w-3 text-rose-500" />
                                                                </div>
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <Button 
                                    onClick={() => handleExportToKompass(career)}
                                    className="w-full h-12 rounded-xl bg-gradient-to-r from-[#3182F6] to-[#1565C0] text-white font-bold hover:opacity-90 transition-opacity"
                                    data-testid={`button-export-kompass-${index}`}
                                >
                                    <Compass className="h-5 w-5 mr-2" />
                                    Kompass로 목표 세우기
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </Card>
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
                                <ul className="mt-2 list-disc list-inside">
                                    {profileValidation.missingFields.map(field => (
                                        <li key={field.key}>{field.label}</li>
                                    ))}
                                </ul>
                                <Link href="/profile" className="inline-flex items-center mt-2 text-sm font-medium underline">
                                    프로필 수정하기 <ChevronRight className="h-3 w-3 ml-1" />
                                </Link>
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
                            <ul className="mt-2 list-disc list-inside">
                                {profileValidation.missingFields.map(field => (
                                    <li key={field.key}>{field.label}</li>
                                ))}
                            </ul>
                            <Link href="/profile" className="inline-flex items-center mt-2 text-sm font-medium underline">
                                프로필 수정하기 <ChevronRight className="h-3 w-3 ml-1" />
                            </Link>
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
                                <CareerCard key={idx} career={career} index={idx} />
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
                        <ProfileSidebar />
                    </aside>

                    <main className="flex-1 min-w-0">
                        <div className="lg:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-[#E5E8EB]">
                            <div className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                                        <SheetTrigger asChild>
                                            <Button variant="ghost" size="icon" className="shrink-0">
                                                <LayoutGrid className="h-5 w-5" />
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent side="left" className="w-72 p-0">
                                            <ProfileSidebar />
                                        </SheetContent>
                                    </Sheet>
                                    
                                    {activeProfile && (
                                        <div className="flex items-center gap-2">
                                            <div className={cn("p-1.5 rounded-lg", profileTypeColors[activeProfile.type])}>
                                                {(() => {
                                                    const Icon = profileTypeIcons[activeProfile.type] || Briefcase;
                                                    return <Icon className="h-4 w-4" />;
                                                })()}
                                            </div>
                                            <span className="font-bold text-sm text-[#191F28] truncate max-w-[150px]">
                                                {activeProfile.title || profileTypeLabels[activeProfile.type]}
                                            </span>
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
