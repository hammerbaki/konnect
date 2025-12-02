import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, Loader2, ArrowRight, CheckCircle2, Settings, History, RefreshCcw, Briefcase, ChevronRight, FileText, ListTodo, Award } from "lucide-react";
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

  if (analysisState === 'results') {
    return (
      <Layout>
         <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <Button variant="ghost" onClick={() => setAnalysisState('initial')} className="mb-4 pl-0 hover:bg-transparent hover:text-[#3182F6]">
                    <ArrowRight className="h-4 w-4 mr-2 rotate-180" /> 돌아가기
                </Button>
                <h2 className="text-[28px] font-bold text-[#191F28]">분석 결과 및 추천</h2>
                <p className="text-[#8B95A1] mt-2 text-lg">회원님의 프로필에 가장 적합한 커리어 패스입니다.</p>
            </div>

            <div className="grid gap-6">
                {MOCK_ANALYSIS.recommendedRoles.map((role, index) => (
                    <Card key={index} className={`toss-card border-l-4 ${index === 0 ? 'border-l-[#3182F6] bg-blue-50/30' : 'border-l-transparent'}`}>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-xl font-bold text-[#191F28]">{role.title}</h3>
                                        {index === 0 && <Badge className="bg-[#3182F6] hover:bg-[#3182F6]">Best Match</Badge>}
                                    </div>
                                    <p className="text-[#4E5968] text-sm font-medium">{role.salary}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-[#3182F6]">{role.matchScore}%</span>
                                    <p className="text-xs text-[#8B95A1]">적합도</p>
                                </div>
                            </div>
                            <p className="text-[#4E5968] mb-6 text-sm leading-relaxed">{role.description}</p>
                            
                            <div className="flex gap-2 mb-6">
                                {role.requirements.map((req, i) => (
                                    <Badge key={i} variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] font-normal">
                                        {req}
                                    </Badge>
                                ))}
                            </div>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="w-full h-12 rounded-xl font-bold text-base bg-white border border-[#E5E8EB] text-[#3182F6] hover:bg-[#E8F3FF] hover:border-[#E8F3FF] shadow-sm">
                                        상세 정보 및 로드맵 보기
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
                        </CardContent>
                    </Card>
                ))}
            </div>
         </div>
      </Layout>
    );
  }

  // Initial View: Past Reports or Empty State
  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-10 pt-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-[28px] font-bold text-[#191F28]">커리어 분석</h2>
            <p className="text-[#8B95A1] mt-1 text-lg">AI가 진단한 커리어 리포트 내역입니다.</p>
          </div>
          <Button onClick={handleAnalyze} className="gap-2 h-12 px-6 rounded-xl bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/20 font-bold text-base">
            <RefreshCcw className="h-4 w-4" /> 재분석 실행
          </Button>
        </div>

        {hasPastReports ? (
            <div className="grid gap-6 md:grid-cols-2">
                {/* Latest Report Card */}
                <Card className="col-span-full toss-card bg-[#191F28] text-white border-none">
                    <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <Badge className="bg-[#3182F6] text-white hover:bg-[#3182F6] border-none px-3 py-1.5 mb-3">최신 리포트</Badge>
                                <h3 className="text-2xl font-bold">시니어 프로덕트 매니저 적합도 분석</h3>
                                <p className="text-gray-400 mt-1">2025. 05. 20 분석됨</p>
                            </div>
                            <div className="text-right">
                                <span className="text-5xl font-bold text-[#3182F6]">92</span>
                                <span className="text-xl text-gray-500">/100</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6 mb-8">
                            <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                                <p className="text-sm text-gray-400 mb-1">시장 경쟁력</p>
                                <p className="text-lg font-bold text-[#00BFA5]">상위 10%</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                                <p className="text-sm text-gray-400 mb-1">보유 역량</p>
                                <p className="text-lg font-bold">8/10 매칭</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                                <p className="text-sm text-gray-400 mb-1">예상 연봉</p>
                                <p className="text-lg font-bold">₩8,500만+</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={() => setAnalysisState('results')} className="flex-1 h-12 bg-white text-[#191F28] hover:bg-gray-100 font-bold rounded-xl">
                                추천 직무 보기
                            </Button>
                            <Button variant="outline" className="flex-1 h-12 border-white/20 text-white hover:bg-white/10 font-bold rounded-xl bg-transparent" onClick={() => setLocation('/report')}>
                                상세 리포트 <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Past History List */}
                <Card className="col-span-full toss-card">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                            <History className="h-5 w-5 text-[#B0B8C1]" /> 분석 히스토리
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 hover:bg-[#F9FAFB] rounded-xl cursor-pointer transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-[#F2F4F6] flex items-center justify-center group-hover:bg-[#E8F3FF] transition-colors">
                                        <FileText className="h-5 w-5 text-[#B0B8C1] group-hover:text-[#3182F6]" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#191F28] text-sm">데이터 분석가 전환 가능성 진단</p>
                                        <p className="text-xs text-[#8B95A1]">2025. 04. {10 - i}</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-[#D1D6DB] group-hover:text-[#333D4B]" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        ) : (
            <div className="text-center py-20 bg-white rounded-[32px] border border-[#E5E8EB]">
                <div className="w-20 h-20 bg-[#F2F4F6] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Brain className="h-10 w-10 text-[#B0B8C1]" />
                </div>
                <h3 className="text-xl font-bold text-[#191F28] mb-2">아직 분석 내역이 없습니다</h3>
                <p className="text-[#8B95A1] mb-8">프로필을 기반으로 첫 번째 커리어 분석을 시작해보세요.</p>
                <Button onClick={handleAnalyze} size="lg" className="h-14 px-8 rounded-2xl bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/20 font-bold text-lg">
                    <Sparkles className="mr-2 h-5 w-5" /> AI 분석 시작하기 (1 토큰)
                </Button>
            </div>
        )}
      </div>
    </Layout>
  );
}
