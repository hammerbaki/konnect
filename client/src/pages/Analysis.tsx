import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
    Brain, Sparkles, Loader2, ArrowRight, CheckCircle2, 
    Briefcase, TrendingUp, School, GraduationCap, 
    User, LineChart, Target, BookOpen, Award,
    ChevronRight, Plus, LayoutDashboard, History
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTokens } from "@/lib/TokenContext";
import { useToast } from "@/hooks/use-toast";
import { useMobileAction } from "@/lib/MobileActionContext";
import { Link, useLocation } from "wouter";
import { MOCK_ANALYSIS } from "@/lib/mockData";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

// --- Mock Data for Different Profiles ---
const PROFILES = [
    {
        id: 'p1',
        type: 'general',
        title: 'Senior PM (이직 준비)',
        icon: Briefcase,
        color: 'text-blue-600 bg-blue-50',
        lastAnalyzed: '2024.03.15',
        stats: {
            label1: '시장 경쟁력', val1: 'Top 10%',
            label2: '예상 연봉', val2: '₩8,500만',
            label3: '이직 성공률', val3: '85%',
        },
        summary: "현재 보유하신 Product Strategy 역량은 시장에서 매우 높은 가치로 평가받고 있습니다.",
        chartData: {
            radar: [
                { subject: 'Product Strategy', A: 140, fullMark: 150 },
                { subject: 'User Research', A: 130, fullMark: 150 },
                { subject: 'Data Analysis', A: 90, fullMark: 150 },
                { subject: 'Leadership', A: 110, fullMark: 150 },
                { subject: 'Communication', A: 120, fullMark: 150 },
            ]
        },
        recommendations: MOCK_ANALYSIS.recommendedRoles
    },
    {
        id: 'p2',
        type: 'university',
        title: '컴퓨터공학 3학년',
        icon: GraduationCap,
        color: 'text-purple-600 bg-purple-50',
        lastAnalyzed: '2024.02.20',
        stats: {
            label1: '학점 분석', val1: '3.8/4.5',
            label2: '필요 자격증', val2: '2개',
            label3: '인턴 합격률', val3: '60%',
        },
        summary: "전공 학점은 우수하나, 실무 프로젝트 경험 보완이 필요합니다. 방학 중 인턴십을 추천합니다.",
        chartData: {
            radar: [
                { subject: 'CS 지식', A: 130, fullMark: 150 },
                { subject: '알고리즘', A: 120, fullMark: 150 },
                { subject: '프로젝트 경험', A: 60, fullMark: 150 },
                { subject: '영어 점수', A: 90, fullMark: 150 },
                { subject: '자격증', A: 70, fullMark: 150 },
            ]
        },
        recommendations: [
            { title: "백엔드 개발자 인턴", matchScore: 92, salary: "월 250만", description: "서버 API 개발 및 DB 설계 실무 경험" },
            { title: "데이터 분석가 인턴", matchScore: 88, salary: "월 230만", description: "Python 활용 데이터 전처리 및 시각화" }
        ]
    },
    {
        id: 'p3',
        type: 'high',
        title: '이과 (AI 관심)',
        icon: School,
        color: 'text-pink-600 bg-pink-50',
        lastAnalyzed: '2024.01.10',
        stats: {
            label1: '내신 등급', val1: '1.8등급',
            label2: '목표 대학', val2: '안정권',
            label3: '수능 최저', val3: '충족',
        },
        summary: "수학/과학 교과 성적이 우수하여 AI 학과 진학 시 유리합니다. 관련 동아리 활동을 더 강화해보세요.",
        chartData: {
            radar: [
                { subject: '수학 역량', A: 140, fullMark: 150 },
                { subject: '과학 탐구', A: 135, fullMark: 150 },
                { subject: '영어', A: 110, fullMark: 150 },
                { subject: '국어', A: 100, fullMark: 150 },
                { subject: '리더십', A: 90, fullMark: 150 },
            ]
        },
        recommendations: [
            { title: "서울대 컴퓨터공학부", matchScore: 85, salary: "수시 학종", description: "수학/과학 심화 역량 강조 필요" },
            { title: "카이스트 전기및전자", matchScore: 82, salary: "특기자", description: "탐구 활동 보고서 보완 필요" }
        ]
    }
];

export default function Analysis() {
    const { credits, deductCredit } = useTokens();
    const { toast } = useToast();
    const { setAction } = useMobileAction();
    const [, setLocation] = useLocation();
    
    // State
    const [activeProfileId, setActiveProfileId] = useState<string>(PROFILES[0].id);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const activeProfile = PROFILES.find(p => p.id === activeProfileId) || PROFILES[0];

    // Mobile Action
    useEffect(() => {
        setAction({
            icon: Brain,
            label: "재분석",
            onClick: handleAnalyze
        });
        return () => setAction(null);
    }, [activeProfileId]);

    const handleAnalyze = () => {
        if (credits <= 0) {
            toast({ variant: "destructive", title: "토큰 부족", description: "분석하려면 토큰이 필요합니다." });
            return;
        }
        if (deductCredit()) {
            setIsAnalyzing(true);
            setTimeout(() => {
                setIsAnalyzing(false);
                toast({ title: "분석 완료", description: "최신 데이터로 업데이트되었습니다." });
            }, 2000);
        }
    };

    // --- Components ---

    const ProfileSidebar = () => (
        <div className="flex flex-col h-full">
            <div className="p-6 pb-4">
                <h2 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-[#3182F6]" />
                    내 프로필
                </h2>
                <p className="text-xs text-[#8B95A1] mt-1">관리 중인 커리어 프로필</p>
            </div>
            
            <div className="flex-1 overflow-y-auto px-3 space-y-2">
                {PROFILES.map((profile) => {
                    const Icon = profile.icon;
                    const isActive = activeProfileId === profile.id;
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
                        >
                            <div className={cn("p-2 rounded-lg shrink-0", profile.color)}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className={cn("font-bold text-sm truncate", isActive ? "text-[#191F28]" : "text-[#4E5968]")}>
                                        {profile.title}
                                    </span>
                                    {isActive && <Badge className="h-1.5 w-1.5 p-0 rounded-full bg-[#3182F6]" />}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-[#8B95A1]">
                                    <History className="h-3 w-3" />
                                    {profile.lastAnalyzed}
                                </div>
                            </div>
                        </button>
                    )
                })}
                
                <button className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-[#8B95A1] hover:bg-[#F2F4F6] hover:text-[#4E5968] transition-all border border-dashed border-[#E5E8EB]">
                    <div className="p-2 rounded-lg bg-[#F2F4F6]">
                        <Plus className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium">새 프로필 추가</span>
                </button>
            </div>
        </div>
    );

    const DashboardContent = () => {
        if (isAnalyzing) {
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
                        <p className="text-[#8B95A1]">{activeProfile.title} 데이터를 분석하고 있습니다.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* 1. Hero Summary */}
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#E5E8EB] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-transparent rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Badge variant="secondary" className="bg-[#E8F3FF] text-[#3182F6] hover:bg-[#E8F3FF] border-none">
                                <Sparkles className="h-3 w-3 mr-1" /> AI Insight
                            </Badge>
                            <span className="text-xs text-[#8B95A1]">Last updated: {activeProfile.lastAnalyzed}</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#191F28] mb-4 leading-tight">
                            {activeProfile.summary}
                        </h1>
                        
                        <div className="grid grid-cols-3 gap-4 mt-8">
                            {Object.entries(activeProfile.stats).map(([key, val], idx) => (
                                <div key={idx} className="bg-[#F9FAFB] rounded-xl p-4 text-center border border-[#F2F4F6]">
                                    <p className="text-xs text-[#8B95A1] mb-1">{(activeProfile.stats as any)[`label${idx+1}`]}</p>
                                    <p className="text-lg md:text-xl font-bold text-[#191F28]">{(activeProfile.stats as any)[`val${idx+1}`]}</p>
                                </div>
                            ))}
                        </div>
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
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={activeProfile.chartData?.radar || MOCK_ANALYSIS.radarData}>
                                    <PolarGrid stroke="#E5E8EB" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#4E5968', fontSize: 11 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                    <Radar name="My Skills" dataKey="A" stroke="#3182F6" fill="#3182F6" fillOpacity={0.3} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Bar Chart */}
                    <Card className="border border-[#E5E8EB] shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-[#00BFA5]" /> 
                                {activeProfile.type === 'high' ? '합격 확률' : '성장 예측'}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {activeProfile.type === 'high' ? '지원 대학별 합격 가능성' : '현 직무 대비 성장 가능성'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: '현재', val: 65 },
                                    { name: '1년 후', val: 85 },
                                    { name: '최고점', val: 95 },
                                ]} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4E5968', fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="val" radius={[6, 6, 0, 0]}>
                                        <Cell fill="#B0B8C1" />
                                        <Cell fill="#3182F6" />
                                        <Cell fill="#00BFA5" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. Recommendations List */}
                <div>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                            <Target className="h-5 w-5 text-[#3182F6]" />
                            {activeProfile.type === 'high' ? '추천 학과/대학' : '추천 커리어'}
                        </h3>
                        <Button variant="ghost" size="sm" className="text-[#8B95A1] text-xs hover:text-[#3182F6]">
                            전체보기 <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                    </div>
                    <div className="grid gap-4">
                        {activeProfile.recommendations?.map((role: any, idx: number) => (
                            <Card key={idx} className="toss-card group hover:border-[#3182F6] transition-all cursor-pointer">
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-lg font-bold text-[#191F28] group-hover:text-[#3182F6] transition-colors">
                                                    {role.title}
                                                </h4>
                                                {idx === 0 && <Badge className="bg-[#E8F3FF] text-[#3182F6] hover:bg-[#E8F3FF] border-none px-2 py-0.5 text-[10px]">AI Pick</Badge>}
                                            </div>
                                            <p className="text-sm text-[#4E5968] line-clamp-1">{role.description}</p>
                                        </div>
                                        <div className="text-right shrink-0 ml-4">
                                            <span className="text-2xl font-bold text-[#3182F6]">{role.matchScore}%</span>
                                            <p className="text-[10px] text-[#8B95A1]">일치도</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-[#F2F4F6]">
                                        <span className="text-xs font-medium text-[#333D4B] flex items-center gap-1">
                                            {activeProfile.type === 'high' ? <School className="h-3 w-3" /> : <Briefcase className="h-3 w-3" />}
                                            {role.salary}
                                        </span>
                                        <Button size="sm" variant="ghost" className="h-7 text-xs text-[#8B95A1] hover:text-[#3182F6] hover:bg-blue-50 px-2">
                                            상세분석 <ArrowRight className="h-3 w-3 ml-1" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
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
                        <h1 className="text-lg font-bold text-[#191F28]">커리어 분석</h1>
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