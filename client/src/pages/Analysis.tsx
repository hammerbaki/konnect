import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Brain, Sparkles, Loader2, ArrowRight, 
    Briefcase, TrendingUp, School, GraduationCap, 
    LineChart, Target, Award, Star,
    ChevronRight, Plus, LayoutDashboard, History,
    CheckCircle2, AlertTriangle, Zap, User
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMobileAction } from "@/lib/MobileActionContext";
import { Link } from "wouter";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/AuthContext";

// Profile type icon mapping
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

export default function Analysis() {
    const { toast } = useToast();
    const { setAction } = useMobileAction();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    
    // State
    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Fetch user's profiles
    const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
        queryKey: ['/api/profiles'],
        queryFn: async () => {
            const response = await apiRequest('GET', '/api/profiles');
            return response.json();
        },
        enabled: !!user,
    });

    // Set first profile as active when profiles load
    useEffect(() => {
        if (profiles && profiles.length > 0 && !activeProfileId) {
            setActiveProfileId(profiles[0].id);
        }
    }, [profiles, activeProfileId]);

    // Fetch analyses for active profile
    const { data: analyses, isLoading: isLoadingAnalyses } = useQuery({
        queryKey: ['/api/profiles', activeProfileId, 'analyses'],
        queryFn: async () => {
            const response = await apiRequest('GET', `/api/profiles/${activeProfileId}/analyses`);
            return response.json();
        },
        enabled: !!activeProfileId,
    });

    // Get the latest analysis
    const latestAnalysis = analyses && analyses.length > 0 ? analyses[0] : null;
    const activeProfile = profiles?.find((p: any) => p.id === activeProfileId);

    // Generate analysis mutation
    const generateAnalysisMutation = useMutation({
        mutationFn: async (profileId: string) => {
            const response = await apiRequest('POST', `/api/profiles/${profileId}/generate-analysis`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to generate analysis');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/profiles', activeProfileId, 'analyses'] });
            queryClient.invalidateQueries({ queryKey: ['/api/user-identity'] });
            toast({ title: "분석 완료", description: "AI 커리어 분석이 완료되었습니다." });
        },
        onError: (error: Error) => {
            toast({ 
                variant: "destructive", 
                title: "분석 실패", 
                description: error.message || "AI 분석 중 오류가 발생했습니다." 
            });
        },
    });

    // Mobile Action
    useEffect(() => {
        if (activeProfileId) {
            setAction({
                icon: Brain,
                label: "분석하기",
                onClick: () => generateAnalysisMutation.mutate(activeProfileId)
            });
        }
        return () => setAction(null);
    }, [activeProfileId]);

    const handleAnalyze = () => {
        if (!activeProfileId) {
            toast({ variant: "destructive", title: "프로필 없음", description: "먼저 프로필을 선택해주세요." });
            return;
        }
        generateAnalysisMutation.mutate(activeProfileId);
    };

    // --- Components ---

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
                                        {isActive && <Badge className="h-1.5 w-1.5 p-0 rounded-full bg-[#3182F6]" />}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-[#8B95A1]">
                                        <History className="h-3 w-3" />
                                        {profile.lastAnalyzed 
                                            ? new Date(profile.lastAnalyzed).toLocaleDateString('ko-KR')
                                            : '분석 없음'}
                                    </div>
                                </div>
                            </button>
                        )
                    })
                ) : (
                    <div className="text-center py-8">
                        <p className="text-sm text-[#8B95A1] mb-4">프로필이 없습니다</p>
                        <Link href="/profile">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Plus className="h-4 w-4" /> 프로필 만들기
                            </Button>
                        </Link>
                    </div>
                )}
                
                <Link href="/profile">
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-[#8B95A1] hover:bg-[#F2F4F6] hover:text-[#4E5968] transition-all border border-dashed border-[#E5E8EB]">
                        <div className="p-2 rounded-lg bg-[#F2F4F6]">
                            <Plus className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium">프로필 관리</span>
                    </button>
                </Link>
            </div>
        </div>
    );

    const DashboardContent = () => {
        if (generateAnalysisMutation.isPending) {
            return (
                <div className="h-full flex flex-col items-center justify-center space-y-6 min-h-[60vh]">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-[#3182F6]/20 animate-ping" />
                        <div className="relative bg-white p-6 rounded-full shadow-xl">
                            <Loader2 className="h-12 w-12 text-[#3182F6] animate-spin" />
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold text-[#191F28]">AI 분석 중...</h3>
                        <p className="text-[#8B95A1]">프로필 데이터를 분석하고 있습니다. 잠시만 기다려주세요.</p>
                    </div>
                </div>
            );
        }

        if (isLoadingAnalyses) {
            return (
                <div className="h-full flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 text-[#3182F6] animate-spin" />
                </div>
            );
        }

        if (!latestAnalysis) {
            return (
                <div className="h-full flex flex-col items-center justify-center space-y-6 min-h-[60vh]">
                    <div className="bg-[#F2F4F6] p-8 rounded-full">
                        <Brain className="h-16 w-16 text-[#B0B8C1]" />
                    </div>
                    <div className="text-center space-y-2 max-w-md">
                        <h3 className="text-2xl font-bold text-[#191F28]">아직 분석 결과가 없습니다</h3>
                        <p className="text-[#8B95A1]">
                            AI가 프로필을 분석하여 맞춤형 커리어 추천과 인사이트를 제공합니다.
                        </p>
                    </div>
                    <Button 
                        onClick={handleAnalyze}
                        className="gap-2 h-12 px-8 rounded-xl bg-[#3182F6] font-bold"
                        data-testid="button-start-analysis"
                    >
                        <Sparkles className="h-5 w-5" /> AI 분석 시작하기
                    </Button>
                    <p className="text-xs text-[#8B95A1]">1 크레딧 소요</p>
                </div>
            );
        }

        // Parse recommendations from the analysis (stored as { careers: [...], skills: {...} })
        const recommendationsData = latestAnalysis.recommendations || {};
        const careerRecommendations = Array.isArray(recommendationsData) 
            ? recommendationsData 
            : (recommendationsData.careers || []);
        const skillAnalysis = Array.isArray(recommendationsData) 
            ? null 
            : (recommendationsData.skills || null);
        const chartData = latestAnalysis.chartData || { radar: [], bar: [] };

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* 1. Hero Summary */}
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#E5E8EB] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-transparent rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-[#E8F3FF] text-[#3182F6] hover:bg-[#E8F3FF] border-none">
                                    <Sparkles className="h-3 w-3 mr-1" /> AI Insight
                                </Badge>
                                <span className="text-xs text-[#8B95A1]">
                                    {latestAnalysis.createdAt 
                                        ? new Date(latestAnalysis.createdAt).toLocaleDateString('ko-KR')
                                        : '최근 분석'}
                                </span>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleAnalyze}
                                disabled={generateAnalysisMutation.isPending}
                                className="gap-1 text-[#3182F6] border-[#3182F6]"
                                data-testid="button-reanalyze"
                            >
                                <Brain className="h-4 w-4" /> 재분석
                            </Button>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#191F28] mb-4 leading-tight" data-testid="text-analysis-summary">
                            {latestAnalysis.summary}
                        </h1>
                        
                        {latestAnalysis.stats && (
                            <div className="grid grid-cols-3 gap-4 mt-8">
                                <div className="bg-[#F9FAFB] rounded-xl p-4 text-center border border-[#F2F4F6]">
                                    <p className="text-xs text-[#8B95A1] mb-1">{latestAnalysis.stats.label1}</p>
                                    <p className="text-lg md:text-xl font-bold text-[#191F28]" data-testid="text-stat-1">{latestAnalysis.stats.val1}</p>
                                </div>
                                <div className="bg-[#F9FAFB] rounded-xl p-4 text-center border border-[#F2F4F6]">
                                    <p className="text-xs text-[#8B95A1] mb-1">{latestAnalysis.stats.label2}</p>
                                    <p className="text-lg md:text-xl font-bold text-[#191F28]" data-testid="text-stat-2">{latestAnalysis.stats.val2}</p>
                                </div>
                                <div className="bg-[#F9FAFB] rounded-xl p-4 text-center border border-[#F2F4F6]">
                                    <p className="text-xs text-[#8B95A1] mb-1">{latestAnalysis.stats.label3}</p>
                                    <p className="text-lg md:text-xl font-bold text-[#191F28]" data-testid="text-stat-3">{latestAnalysis.stats.val3}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Charts Row */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Radar Chart */}
                    <Card className="border border-[#E5E8EB] shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Award className="h-4 w-4 text-[#3182F6]" /> 역량 분석
                            </CardTitle>
                            <CardDescription className="text-xs">나의 현재 역량 분포도</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[250px] flex items-center justify-center">
                            {chartData.radar && chartData.radar.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData.radar}>
                                        <PolarGrid stroke="#E5E8EB" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#4E5968', fontSize: 11 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                        <Radar name="My Skills" dataKey="A" stroke="#3182F6" fill="#3182F6" fillOpacity={0.3} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-sm text-[#8B95A1]">차트 데이터가 없습니다</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Bar Chart */}
                    <Card className="border border-[#E5E8EB] shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-[#00BFA5]" /> 성장 예측
                            </CardTitle>
                            <CardDescription className="text-xs">현 직무 대비 성장 가능성</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                            {chartData.bar && chartData.bar.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData.bar} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4E5968', fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="val" radius={[6, 6, 0, 0]}>
                                            <Cell fill="#B0B8C1" />
                                            <Cell fill="#3182F6" />
                                            <Cell fill="#00BFA5" />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-sm text-[#8B95A1]">차트 데이터가 없습니다</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* 3. Career Recommendations */}
                {careerRecommendations && careerRecommendations.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                                <Target className="h-5 w-5 text-[#3182F6]" />
                                추천 커리어
                            </h3>
                        </div>
                        <div className="grid gap-4">
                            {careerRecommendations.map((role: any, idx: number) => (
                                <Card key={idx} className="toss-card group hover:border-[#3182F6] transition-all cursor-pointer" data-testid={`card-recommendation-${idx}`}>
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-lg font-bold text-[#191F28] group-hover:text-[#3182F6] transition-colors">
                                                        {role.title}
                                                    </h4>
                                                    {idx === 0 && <Badge className="bg-[#E8F3FF] text-[#3182F6] hover:bg-[#E8F3FF] border-none px-2 py-0.5 text-[10px]">AI Pick</Badge>}
                                                </div>
                                                <p className="text-sm text-[#4E5968]">{role.description}</p>
                                            </div>
                                            <div className="text-right shrink-0 ml-4">
                                                <span className="text-2xl font-bold text-[#3182F6]">{role.matchScore}%</span>
                                                <p className="text-[10px] text-[#8B95A1]">적합도</p>
                                            </div>
                                        </div>
                                        
                                        {role.requiredSkills && role.requiredSkills.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {role.requiredSkills.map((skill: string, skillIdx: number) => (
                                                    <Badge key={skillIdx} variant="secondary" className="text-xs bg-[#F2F4F6] text-[#4E5968]">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center justify-between pt-3 border-t border-[#F2F4F6]">
                                            <span className="text-xs font-medium text-[#333D4B] flex items-center gap-1">
                                                <Briefcase className="h-3 w-3" />
                                                {role.salary}
                                            </span>
                                            <span className="text-xs text-[#8B95A1]">
                                                {role.jobOutlook}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. Skill Analysis */}
                {skillAnalysis && (
                    <div className="grid md:grid-cols-3 gap-4">
                        {/* Strengths */}
                        <Card className="border border-[#E5E8EB] shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2 text-[#00BFA5]">
                                    <CheckCircle2 className="h-4 w-4" /> 강점
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {skillAnalysis.strengths?.map((strength: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-[#4E5968]">
                                            <CheckCircle2 className="h-4 w-4 text-[#00BFA5] shrink-0 mt-0.5" />
                                            {strength}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Weaknesses */}
                        <Card className="border border-[#E5E8EB] shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2 text-[#FFB300]">
                                    <AlertTriangle className="h-4 w-4" /> 보완점
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {skillAnalysis.weaknesses?.map((weakness: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-[#4E5968]">
                                            <AlertTriangle className="h-4 w-4 text-[#FFB300] shrink-0 mt-0.5" />
                                            {weakness}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Development Plan */}
                        <Card className="border border-[#E5E8EB] shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2 text-[#3182F6]">
                                    <Zap className="h-4 w-4" /> 추천 액션
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {skillAnalysis.developmentPlan?.map((plan: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-[#4E5968]">
                                            <Zap className="h-4 w-4 text-[#3182F6] shrink-0 mt-0.5" />
                                            {plan}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Floating Analyze Button */}
                <div className="fixed bottom-24 right-6 md:hidden z-50">
                    <Button 
                        onClick={handleAnalyze}
                        disabled={generateAnalysisMutation.isPending}
                        className="h-14 w-14 rounded-full bg-[#3182F6] shadow-lg shadow-blue-500/30"
                        data-testid="button-mobile-analyze"
                    >
                        {generateAnalysisMutation.isPending ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <Brain className="h-6 w-6" />
                        )}
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto h-[calc(100vh-40px)] md:h-[calc(100vh-80px)] flex md:rounded-2xl md:shadow-sm md:border border-[#E5E8EB] overflow-hidden bg-white relative">
                
                {/* Desktop Sidebar */}
                <div className="hidden md:flex w-[280px] border-r border-[#E5E8EB] bg-[#F9FAFB]/50 flex-col">
                    <ProfileSidebar />
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col h-full relative bg-[#F9FAFB] md:bg-white">
                    
                    {/* Mobile Header */}
                    <div className="flex md:hidden items-center px-4 py-3 bg-white border-b border-[#E5E8EB] sticky top-0 z-20">
                        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="-ml-2 mr-2">
                                    <Menu className="h-5 w-5 text-[#4E5968]" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[280px] p-0">
                                <ProfileSidebar />
                            </SheetContent>
                        </Sheet>
                        <h1 className="text-lg font-bold text-[#191F28] flex-1">커리어 분석</h1>
                        <Button 
                            onClick={handleAnalyze}
                            disabled={generateAnalysisMutation.isPending}
                            size="sm"
                            className="gap-1 bg-[#3182F6] text-white"
                            data-testid="button-header-analyze"
                        >
                            {generateAnalysisMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4" />
                            )}
                            {latestAnalysis ? '재분석' : '분석'}
                        </Button>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8">
                        <DashboardContent />
                    </div>
                </div>
            </div>
        </Layout>
    );
}
