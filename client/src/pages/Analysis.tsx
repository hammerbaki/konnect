import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, Loader2, ArrowRight, CheckCircle2, Settings, History, RefreshCcw, Briefcase, ChevronRight, FileText, ListTodo, Award, User, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useTokens } from "@/lib/TokenContext";
import { useToast } from "@/hooks/use-toast";
import { useMobileAction } from "@/lib/MobileActionContext";
import { Link, useLocation } from "wouter";
import { MOCK_ANALYSIS } from "@/lib/mockData";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

function CareerDetailContent({ role, handleCreatePlan }: { role: any, handleCreatePlan: () => void }) {
    return (
        <>
            <div className="flex-1 overflow-y-auto p-5">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary" className="bg-blue-50 text-[#3182F6] hover:bg-blue-50 border-none px-3 py-1.5 text-sm font-bold">
                            추천 커리어
                        </Badge>
                        <span className="text-[#8B95A1] text-sm font-medium">매칭 점수 {role.matchScore}%</span>
                    </div>
                    <h2 className="text-[28px] font-bold text-[#191F28] leading-tight mb-3">{role.title}</h2>
                    <p className="text-[#4E5968] text-lg leading-relaxed">
                        {role.description}
                    </p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#F2F4F6]">
                        <p className="text-sm text-[#8B95A1] mb-1">예상 연봉</p>
                        <p className="text-lg font-bold text-[#191F28]">{role.salary}</p>
                    </div>
                    <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#F2F4F6]">
                        <p className="text-sm text-[#8B95A1] mb-1">시장 수요</p>
                        <div className="flex items-center gap-1 text-lg font-bold text-[#E86D66]">
                            <TrendingUp className="h-4 w-4" /> 매우 높음
                        </div>
                    </div>
                </div>

                {/* Charts Section within Detail */}
                <div className="space-y-6 mb-8">
                    <Card className="border border-[#E5E8EB] shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Award className="h-4 w-4 text-[#3182F6]" /> 역량 매칭 분석
                            </CardTitle>
                            <CardDescription className="text-xs">나의 역량 vs 이 포지션 요구 역량</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[250px] w-full flex justify-center items-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={MOCK_ANALYSIS.radarData}>
                                <PolarGrid stroke="#E5E8EB" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#4E5968', fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                <Radar
                                    name="My Skills"
                                    dataKey="A"
                                    stroke="#3182F6"
                                    fill="#3182F6"
                                    fillOpacity={0.3}
                                />
                                <Radar
                                    name="Role Req"
                                    dataKey="B"
                                    stroke="#B0B8C1"
                                    fill="#B0B8C1"
                                    fillOpacity={0.1}
                                />
                                </RadarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="border border-[#E5E8EB] shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-[#00BFA5]" /> 연봉 예측
                            </CardTitle>
                            <CardDescription className="text-xs">현재 vs 이 포지션 예상 (단위: 만원)</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: '현재', amount: 6000 },
                                    { name: '이 포지션', amount: 8500 },
                                    { name: 'Top 10%', amount: 12000 },
                                ]} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4E5968', fontSize: 12 }} />
                                    <Tooltip 
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                                        <Cell fill="#B0B8C1" />
                                        <Cell fill="#3182F6" />
                                        <Cell fill="#00BFA5" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs Section */}
                <Tabs defaultValue="roadmap" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-[#F2F4F6] p-1 rounded-xl mb-6 h-12">
                        <TabsTrigger value="roadmap" className="rounded-lg font-bold text-base h-10 data-[state=active]:bg-white data-[state=active]:text-[#191F28] data-[state=active]:shadow-sm">실행 로드맵</TabsTrigger>
                        <TabsTrigger value="requirements" className="rounded-lg font-bold text-base h-10 data-[state=active]:bg-white data-[state=active]:text-[#191F28] data-[state=active]:shadow-sm">자격 요건</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="roadmap" className="space-y-6 animate-in fade-in-50">
                        <div className="space-y-0 relative pl-4 border-l-2 border-[#F2F4F6] ml-3">
                            {/* Step 1 */}
                            <div className="pb-10 relative pl-4">
                                <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-[#E8F3FF] border-4 border-white flex items-center justify-center text-[#3182F6] font-bold text-sm shadow-sm">1</div>
                                <h4 className="font-bold text-[#191F28] text-lg mb-1">단기 목표 (1-3개월)</h4>
                                <p className="text-sm text-[#6B7684] mb-4 font-medium">필수 자격증 취득 및 기초 역량 강화</p>
                                <div className="bg-white border border-[#E5E8EB] rounded-xl p-4 shadow-sm space-y-3">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-[#3182F6] shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-[#333D4B] text-sm">SQLD 자격증 취득</p>
                                            <p className="text-xs text-[#8B95A1] mt-0.5">데이터 분석 기초 증명</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-[#3182F6] shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-[#333D4B] text-sm">포트폴리오 1건 제작</p>
                                            <p className="text-xs text-[#8B95A1] mt-0.5">실제 데이터셋 활용 분석 프로젝트</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Step 2 */}
                            <div className="pb-10 relative pl-4">
                                <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-[#F2F4F6] border-4 border-white flex items-center justify-center text-[#8B95A1] font-bold text-sm">2</div>
                                <h4 className="font-bold text-[#191F28] text-lg mb-1">중기 목표 (3-6개월)</h4>
                                <p className="text-sm text-[#6B7684] mb-4 font-medium">실무 프로젝트 경험 및 네트워킹</p>
                                <div className="bg-white border border-[#E5E8EB] rounded-xl p-4 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-[#B0B8C1] shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-[#333D4B] text-sm">사이드 프로젝트 리딩</p>
                                            <p className="text-xs text-[#8B95A1] mt-0.5">PM/PO 역할 수행 경험 확보</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="relative pl-4">
                                <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-[#F2F4F6] border-4 border-white flex items-center justify-center text-[#8B95A1] font-bold text-sm">3</div>
                                <h4 className="font-bold text-[#191F28] text-lg mb-1">장기 목표 (1년)</h4>
                                <p className="text-sm text-[#6B7684] mb-4 font-medium">시니어 포지션 이직 성공</p>
                                <div className="bg-white border border-[#E5E8EB] rounded-xl p-4 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <Briefcase className="h-5 w-5 text-[#B0B8C1] shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-[#333D4B] text-sm">Target 기업 지원</p>
                                            <p className="text-xs text-[#8B95A1] mt-0.5">시리즈 B 이상 스타트업 PO</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="requirements" className="space-y-4 animate-in fade-in-50">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-2">
                            <p className="text-[#3182F6] text-sm font-bold flex items-center gap-2 mb-1">
                                <Sparkles className="h-4 w-4" /> AI 분석 Insight
                            </p>
                            <p className="text-[#4E5968] text-sm leading-relaxed">
                                "회원님의 현재 경력과 스킬셋은 이 포지션 요구사항의 <span className="font-bold text-[#333D4B]">85%</span>를 충족합니다. 부족한 SQL 역량만 보완하면 즉시 지원 가능합니다."
                            </p>
                        </div>
                        {role.requirements.map((req: string, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-[#E5E8EB] shadow-sm">
                                <div className="h-6 w-6 rounded-full bg-[#E8F3FF] flex items-center justify-center text-[#3182F6] text-xs font-bold shrink-0 mt-0.5">
                                    {i + 1}
                                </div>
                                <p className="font-medium text-[#333D4B] text-base leading-snug">{req}</p>
                            </div>
                        ))}
                    </TabsContent>
                </Tabs>
            </div>

            <div className="p-6 border-t border-[#F2F4F6] bg-white pb-10">
                <Button onClick={handleCreatePlan} className="w-full h-14 text-lg font-bold rounded-xl bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]">
                    <ListTodo className="mr-2 h-5 w-5" /> 이 커리어로 실행 계획 생성하기
                </Button>
            </div>
        </>
    );
}

function ResponsiveCareerDetail({ role, handleCreatePlan }: { role: any, handleCreatePlan: () => void }) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Drawer>
                <DrawerTrigger asChild>
                    <Button variant="outline" className="flex-1 h-14 rounded-xl font-bold text-base border-[#E5E8EB] text-[#4E5968] hover:bg-[#F2F4F6]">
                        상세 정보 보기
                    </Button>
                </DrawerTrigger>
                <DrawerContent className="h-[92vh] rounded-t-[24px] flex flex-col outline-none">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[#E5E8EB] mt-3 mb-1" />
                    <div className="flex justify-between items-center px-5 py-3 border-b border-[#F2F4F6]">
                        <DrawerTitle className="text-[18px] font-bold text-[#191F28]">커리어 상세 정보</DrawerTitle>
                        <DrawerClose asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-[#F2F4F6] hover:bg-[#E5E8EB]">
                                <X className="h-4 w-4 text-[#333D4B]" />
                            </Button>
                        </DrawerClose>
                    </div>
                    <CareerDetailContent role={role} handleCreatePlan={handleCreatePlan} />
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 h-14 rounded-xl font-bold text-base border-[#E5E8EB] text-[#4E5968] hover:bg-[#F2F4F6]">
                    상세 정보 보기
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-[24px] gap-0 bg-white border-none shadow-2xl [&>button]:hidden">
                <DialogHeader className="p-6 pb-4 border-b border-[#F2F4F6] flex-shrink-0 flex flex-row justify-between items-center space-y-0">
                    <DialogTitle className="text-[24px] font-bold text-[#191F28]">커리어 상세 정보</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-[#F2F4F6]">
                            <X className="h-5 w-5 text-[#333D4B]" />
                        </Button>
                    </DialogClose>
                </DialogHeader>
                <CareerDetailContent role={role} handleCreatePlan={handleCreatePlan} />
            </DialogContent>
        </Dialog>
    );
}

export default function Analysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisState, setAnalysisState] = useState<'initial' | 'analyzing' | 'results' | 'plan_created'>('initial');
  const { credits, deductCredit } = useTokens();
  const { toast } = useToast();
  const { setAction } = useMobileAction();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<any>(null);

  // Check for past reports (Mock logic: assume true for demo if not first visit)
  const hasPastReports = true; 
  
  const salaryData = [
      { name: '현재', amount: 6000 },
      { name: '업계평균', amount: 8500 },
      { name: '상위10%', amount: 12000 },
  ];

  useEffect(() => {
    const action = analysisState === 'results' ? {
        icon: ArrowRight,
        label: "리포트",
        onClick: () => setLocation("/report")
    } : {
        icon: Brain,
        label: "재분석",
        onClick: () => handleAnalyze()
    };

    setAction(action);
    return () => setAction(null);
  }, [analysisState]);

  const handleAnalyze = () => {
    if (credits <= 0) {
      toast({
        variant: "destructive",
        title: "토큰 부족",
        description: "커리어 분석을 진행하려면 최소 1개의 토큰이 필요합니다.",
      });
      return;
    }

    if (deductCredit()) {
      setAnalysisState('analyzing');
      // Mock analysis delay
      setTimeout(() => {
        setAnalysisState('results');
      }, 2500);
    }
  };

  const handleCreatePlan = () => {
      toast({
          title: "커리어 로드맵 생성 완료",
          description: "목표 페이지에 상세 실행 계획이 생성되었습니다.",
      });
      setLocation("/goals");
  };

  if (analysisState === 'analyzing') {
      return (
          <Layout>
              <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                  <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-[#3182F6]/20 animate-ping" />
                      <div className="relative bg-white p-6 rounded-full shadow-xl">
                          <Loader2 className="h-12 w-12 text-[#3182F6] animate-spin" />
                      </div>
                  </div>
                  <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold text-[#191F28]">AI가 프로필을 분석 중입니다</h3>
                      <p className="text-[#8B95A1]">보유 역량과 시장 데이터를 매칭하고 있습니다...</p>
                  </div>
              </div>
          </Layout>
      );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6">
        
        {/* Heartwarming Summary Section */}
        <div className="mb-10 text-center space-y-4">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-blue-50 mb-2">
                <Sparkles className="h-10 w-10 text-[#3182F6]" />
            </div>
            <h2 className="text-[32px] font-bold text-[#191F28] leading-tight">
                John님, 정말 대단한 성장이네요!<br/>
                <span className="text-[#3182F6]">상위 10%</span>의 역량을 보유하고 계십니다.
            </h2>
            <p className="text-[#4E5968] text-lg max-w-2xl mx-auto bg-[#F2F4F6] py-4 px-6 rounded-2xl leading-relaxed">
                "현재 보유하신 <span className="font-bold text-[#191F28]">Product Strategy</span>와 <span className="font-bold text-[#191F28]">User Research</span> 역량은 시장에서 매우 높은 가치로 평가받고 있습니다. John님의 강점을 살려 도전해볼 수 있는 최고의 커리어 패스를 추천해드립니다."
            </p>
        </div>
        
        {/* Radar Chart Section - Removed from here and moved to Detail View */}
        
        <div className="flex items-center justify-between mb-6 px-2">
             <h3 className="text-xl font-bold text-[#191F28] flex items-center gap-2">
                <Brain className="h-5 w-5 text-[#3182F6]" /> AI 추천 커리어
             </h3>
             <Button onClick={handleAnalyze} variant="outline" className="border-[#3182F6] text-[#3182F6] hover:bg-blue-50 font-bold">
                <RefreshCcw className="h-4 w-4 mr-1" /> 다시 분석하기
             </Button>
        </div>

        {/* Recommended Careers List */}
        <div className="grid gap-6 mb-16">
            {MOCK_ANALYSIS.recommendedRoles.map((role, index) => (
                <Card key={index} className={`toss-card overflow-hidden border-l-4 ${index === 0 ? 'border-l-[#3182F6] shadow-lg' : 'border-l-transparent'}`}>
                    <CardContent className="p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-2xl font-bold text-[#191F28]">{role.title}</h3>
                                    {index === 0 && <Badge className="bg-[#3182F6] hover:bg-[#3182F6] px-3 py-1 text-sm">AI 최적 추천</Badge>}
                                </div>
                                <p className="text-[#4E5968] font-medium text-lg">{role.salary}</p>
                            </div>
                            <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-xl">
                                <span className="text-3xl font-bold text-[#3182F6]">{role.matchScore}%</span>
                                <span className="text-sm text-[#6B7684] font-bold">적합도</span>
                            </div>
                        </div>
                        
                        <p className="text-[#4E5968] mb-8 text-base leading-relaxed border-b border-[#F2F4F6] pb-6">
                            {role.description}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                             <ResponsiveCareerDetail role={role} handleCreatePlan={handleCreatePlan} />

                            <Button 
                                onClick={handleCreatePlan}
                                className="flex-1 h-14 rounded-xl font-bold text-base bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/20 text-white"
                            >
                                <ListTodo className="mr-2 h-5 w-5" /> 이 커리어로 비전 트리 만들기
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>

        {/* Secondary Information (History, etc) */}
        <div className="pt-8 border-t border-[#F2F4F6]">
            <h3 className="text-lg font-bold text-[#8B95A1] mb-4 flex items-center gap-2">
                <History className="h-5 w-5" /> 지난 분석 내역
            </h3>
            <div className="space-y-3 opacity-70 hover:opacity-100 transition-opacity">
                {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white border border-[#E5E8EB] rounded-xl cursor-pointer hover:bg-[#F9FAFB]">
                        <span className="text-[#4E5968] font-medium text-sm">데이터 분석가 전환 가능성 진단</span>
                        <span className="text-xs text-[#B0B8C1]">2025. 04. {10 - i}</span>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </Layout>
  );
}