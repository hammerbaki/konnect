import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
    Brain, Sparkles, Loader2, ArrowRight, 
    Briefcase, TrendingUp, School, GraduationCap, 
    Target, Award, Star, Compass,
    ChevronRight, Plus, LayoutDashboard, History,
    CheckCircle2, AlertTriangle, Zap, User, ExternalLink,
    FolderOpen, Users, Heart, Lightbulb, Menu
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
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

export default function Analysis() {
    const { toast } = useToast();
    const { setAction } = useMobileAction();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [, navigate] = useLocation();
    const { deductCredit, restoreCredits } = useTokens();
    
    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [expandedCareer, setExpandedCareer] = useState<string | null>(null);

    const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
        queryKey: ['/api/profiles'],
        queryFn: async () => {
            const response = await apiRequest('GET', '/api/profiles');
            return response.json();
        },
        enabled: !!user,
    });

    useEffect(() => {
        if (profiles && profiles.length > 0 && !activeProfileId) {
            setActiveProfileId(profiles[0].id);
        }
    }, [profiles, activeProfileId]);

    const { data: analyses, isLoading: isLoadingAnalyses } = useQuery({
        queryKey: ['/api/profiles', activeProfileId, 'analyses'],
        queryFn: async () => {
            const response = await apiRequest('GET', `/api/profiles/${activeProfileId}/analyses`);
            return response.json();
        },
        enabled: !!activeProfileId,
    });

    const latestAnalysis = analyses && analyses.length > 0 ? analyses[0] : null;
    const activeProfile = profiles?.find((p: any) => p.id === activeProfileId);

    // Track optimistic credit deduction for safe restoration
    const analysisCreditsDeductedRef = useRef(false);

    const aiJob = useAIJob({
        onSuccess: () => {
            analysisCreditsDeductedRef.current = false; // Clear flag on success
            queryClient.invalidateQueries({ queryKey: ['/api/profiles', activeProfileId, 'analyses'] });
            queryClient.invalidateQueries({ queryKey: ['/api/user-identity'] });
            toast({ title: "분석 완료", description: "AI 커리어 분석이 완료되었습니다." });
        },
        onError: (error: string) => {
            // Only restore if we actually deducted
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

    const handleGenerateAnalysis = async (profileId: string) => {
        if (!activeProfile) return;
        
        // Optimistically deduct credits immediately
        const deducted = deductCredit(ANALYSIS_CREDIT_COST);
        if (!deducted) {
            toast({ variant: "destructive", description: "크레딧이 부족합니다. 분석에 100 크레딧이 필요합니다." });
            return;
        }
        analysisCreditsDeductedRef.current = true; // Track deduction for safe restoration
        
        try {
            await aiJob.submitJob("analysis", profileId, {
                profileData: activeProfile.profileData,
                profileType: activeProfile.type,
            });
        } catch (error) {
            // onError in useAIJob will handle restoring credits using the ref flag
        }
    };

    useEffect(() => {
        if (activeProfileId) {
            setAction({
                icon: Brain,
                label: "분석하기",
                onClick: () => activeProfileId && handleGenerateAnalysis(activeProfileId)
            });
        }
        return () => setAction(null);
    }, [activeProfileId, setAction]);

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
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 text-[#3182F6] animate-spin" />
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
                    <Button 
                        onClick={() => activeProfileId && handleGenerateAnalysis(activeProfileId)}
                        disabled={aiJob.isLoading || !activeProfileId}
                        className="h-12 px-8 rounded-xl bg-[#3182F6] text-white font-bold"
                        data-testid="button-generate-analysis"
                    >
                        <Sparkles className="h-5 w-5 mr-2" /> AI 분석 시작 (100 크레딧)
                    </Button>
                </div>
            );
        }

        const { summary, stats, recommendations } = latestAnalysis;
        const careerRecommendations: CareerRecommendation[] = recommendations?.careers || [];
        const profileType = activeProfile?.type || 'general';

        return (
            <div className="space-y-6 animate-in fade-in-50 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-[#191F28]">분석 결과</h2>
                        <p className="text-xs text-[#8B95A1] mt-1">
                            {new Date(latestAnalysis.createdAt).toLocaleDateString('ko-KR')} 분석
                        </p>
                    </div>
                    <Button 
                        onClick={() => activeProfileId && handleGenerateAnalysis(activeProfileId)}
                        disabled={aiJob.isLoading}
                        variant="outline"
                        className="rounded-xl border-[#3182F6] text-[#3182F6]"
                        data-testid="button-regenerate-analysis"
                    >
                        <Sparkles className="h-4 w-4 mr-2" /> 다시 분석하기
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
                                                <Menu className="h-5 w-5" />
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
                            {aiJob.isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
                                    <div className="bg-white rounded-2xl border border-[#E5E8EB] shadow-sm p-6 max-w-md w-full">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3182F6] to-[#1e6cd6] flex items-center justify-center flex-shrink-0">
                                                <Bot className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-[#191F28] mb-2">AI 어시스턴트</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1">
                                                        <span 
                                                            className="w-2 h-2 bg-[#3182F6] rounded-full"
                                                            style={{
                                                                animation: 'thinking-pulse 1.4s ease-in-out infinite',
                                                                animationDelay: '0s'
                                                            }}
                                                        />
                                                        <span 
                                                            className="w-2 h-2 bg-[#3182F6] rounded-full"
                                                            style={{
                                                                animation: 'thinking-pulse 1.4s ease-in-out infinite',
                                                                animationDelay: '0.2s'
                                                            }}
                                                        />
                                                        <span 
                                                            className="w-2 h-2 bg-[#3182F6] rounded-full"
                                                            style={{
                                                                animation: 'thinking-pulse 1.4s ease-in-out infinite',
                                                                animationDelay: '0.4s'
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-[#4E5968]">프로필을 분석하고 있어요</span>
                                                </div>
                                                <p className="text-xs text-[#8B95A1] mt-3">
                                                    맞춤형 진로 분석을 준비하고 있습니다. 잠시만 기다려주세요.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <style>{`
                                        @keyframes thinking-pulse {
                                            0%, 100% { opacity: 0.4; transform: scale(0.8); }
                                            50% { opacity: 1; transform: scale(1); }
                                        }
                                    `}</style>
                                </div>
                            ) : isLoadingProfiles || isLoadingAnalyses ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="h-8 w-8 text-[#3182F6] animate-spin" />
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
