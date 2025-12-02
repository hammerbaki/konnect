import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, Loader2, ArrowRight, CheckCircle2, Settings, History, RefreshCcw, Briefcase, ChevronRight, FileText, ListTodo, Award, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useTokens } from "@/lib/TokenContext";
import { useToast } from "@/hooks/use-toast";
import { useMobileAction } from "@/lib/MobileActionContext";
import { Link, useLocation } from "wouter";
import { MOCK_ANALYSIS } from "@/lib/mockData";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  // Common content for both initial (past report) and results view
  // In a real app, initial view might show last saved report vs new results
  // For this mockup, we'll show the same structure but maybe with different data context
  
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

        <div className="flex items-center justify-between mb-6 px-2">
             <h3 className="text-xl font-bold text-[#191F28] flex items-center gap-2">
                <Brain className="h-5 w-5 text-[#3182F6]" /> AI 추천 커리어
             </h3>
             <Button onClick={handleAnalyze} variant="ghost" className="text-[#8B95A1] hover:text-[#3182F6]">
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
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="flex-1 h-14 rounded-xl font-bold text-base border-[#E5E8EB] text-[#4E5968] hover:bg-[#F2F4F6]">
                                        상세 정보 보기
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl rounded-[24px] p-0 gap-0 overflow-hidden border-none">
                                    <div className="bg-[#191F28] p-8 text-white">
                                        <Badge className="bg-[#3182F6] text-white border-none mb-4 hover:bg-[#3182F6]">추천 커리어</Badge>
                                        <h2 className="text-3xl font-bold mb-2">{role.title}</h2>
                                        <p className="text-gray-400">{role.description}</p>
                                    </div>
                                    
                                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                                        <Tabs defaultValue="roadmap" className="w-full">
                                            <TabsList className="grid w-full grid-cols-2 bg-[#F2F4F6] p-1 rounded-xl mb-6">
                                                <TabsTrigger value="roadmap" className="rounded-lg font-bold">실행 로드맵</TabsTrigger>
                                                <TabsTrigger value="requirements" className="rounded-lg font-bold">자격 요건 상세</TabsTrigger>
                                            </TabsList>
                                            
                                            <TabsContent value="roadmap" className="space-y-6">
                                                <div className="space-y-4">
                                                    <div className="flex gap-4">
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-8 h-8 rounded-full bg-[#E8F3FF] flex items-center justify-center text-[#3182F6] font-bold text-sm z-10">1</div>
                                                            <div className="w-0.5 h-full bg-[#F2F4F6] -my-2" />
                                                        </div>
                                                        <div className="pb-8">
                                                            <h4 className="font-bold text-[#191F28] mb-1">단기 목표 (1-3개월)</h4>
                                                            <p className="text-sm text-[#4E5968] mb-3">필수 자격증 취득 및 기초 역량 강화</p>
                                                            <ul className="space-y-2">
                                                                <li className="flex items-center gap-2 text-sm text-[#4E5968]">
                                                                    <CheckCircle2 className="h-4 w-4 text-[#B0B8C1]" /> SQLD 자격증 취득
                                                                </li>
                                                                <li className="flex items-center gap-2 text-sm text-[#4E5968]">
                                                                    <CheckCircle2 className="h-4 w-4 text-[#B0B8C1]" /> 데이터 분석 포트폴리오 1건 제작
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex gap-4">
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-8 h-8 rounded-full bg-[#F2F4F6] flex items-center justify-center text-[#8B95A1] font-bold text-sm z-10">2</div>
                                                            <div className="w-0.5 h-full bg-[#F2F4F6] -my-2" />
                                                        </div>
                                                        <div className="pb-8">
                                                            <h4 className="font-bold text-[#191F28] mb-1">중기 목표 (3-6개월)</h4>
                                                            <p className="text-sm text-[#4E5968] mb-3">실무 프로젝트 경험 및 네트워킹</p>
                                                            <ul className="space-y-2">
                                                                <li className="flex items-center gap-2 text-sm text-[#4E5968]">
                                                                    <CheckCircle2 className="h-4 w-4 text-[#B0B8C1]" /> 사이드 프로젝트 리딩 경험
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-4">
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-8 h-8 rounded-full bg-[#F2F4F6] flex items-center justify-center text-[#8B95A1] font-bold text-sm z-10">3</div>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-[#191F28] mb-1">장기 목표 (1년)</h4>
                                                            <p className="text-sm text-[#4E5968]">시니어 포지션 이직 성공</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TabsContent>
                                            
                                            <TabsContent value="requirements">
                                                <div className="space-y-4">
                                                    {role.requirements.map((req: string, i: number) => (
                                                        <div key={i} className="p-4 bg-[#F9FAFB] rounded-xl border border-[#F2F4F6]">
                                                            <p className="font-bold text-[#191F28] text-sm">{req}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                    <DialogFooter className="p-6 pt-2 bg-white border-t border-[#F2F4F6]">
                                        <Button onClick={handleCreatePlan} className="w-full h-14 text-lg font-bold rounded-xl bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/20">
                                            <ListTodo className="mr-2 h-5 w-5" /> 이 커리어로 실행 계획 생성하기
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

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
