import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, Loader2, ArrowRight, CheckCircle2, Settings } from "lucide-react";
import { useState } from "react";
import { useTokens } from "@/lib/TokenContext";
import { useToast } from "@/hooks/use-toast";
import { useMobileAction } from "@/lib/MobileActionContext";
import { useEffect } from "react";
import { Link } from "wouter";

export default function Analysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [targetRole, setTargetRole] = useState("시니어 프로덕트 매니저");
  const { credits, deductCredit } = useTokens();
  const { toast } = useToast();
  const { setAction } = useMobileAction();

  useEffect(() => {
    setAction({
      icon: showResults ? ArrowRight : Brain,
      label: showResults ? "리포트" : "분석",
      onClick: () => {
        if (showResults) {
           window.location.href = "/report";
        } else {
           handleAnalyze();
        }
      }
    });
    return () => setAction(null);
  }, [showResults, isAnalyzing, targetRole, credits]);

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
      setIsAnalyzing(true);
      // Mock analysis delay
      setTimeout(() => {
        setIsAnalyzing(false);
        setShowResults(true);
      }, 2500);
    }
  };

  if (showResults) {
    return (
      <Layout>
         <div className="max-w-3xl mx-auto pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#E8F3FF] text-[#3182F6] mb-4">
                    <Brain className="h-8 w-8" />
                </div>
                <h2 className="text-[28px] font-bold text-[#191F28]">분석이 완료되었습니다!</h2>
                <p className="text-[#8B95A1] mt-2 text-lg">John님의 프로필과 <span className="text-[#3182F6] font-bold">{targetRole}</span> 직무 적합도 분석 결과입니다.</p>
            </div>

            <Card className="toss-card p-6 border-none shadow-lg">
              <CardContent className="p-0 space-y-8">
                {/* Score Section */}
                <div className="text-center py-4">
                    <p className="text-sm font-bold text-[#8B95A1] mb-2">종합 매칭 점수</p>
                    <div className="flex items-end justify-center gap-2">
                        <span className="text-6xl font-bold text-[#3182F6]">85</span>
                        <span className="text-2xl font-bold text-[#B0B8C1] mb-1">/ 100</span>
                    </div>
                </div>

                {/* Key Highlights */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#F9FAFB] p-5 rounded-2xl text-center">
                        <p className="text-sm text-[#8B95A1] font-bold mb-1">예상 연봉</p>
                        <p className="text-xl font-bold text-[#191F28]">상위 15%</p>
                    </div>
                    <div className="bg-[#F9FAFB] p-5 rounded-2xl text-center">
                        <p className="text-sm text-[#8B95A1] font-bold mb-1">시장 수요</p>
                        <p className="text-xl font-bold text-[#00BFA5]">매우 높음</p>
                    </div>
                </div>

                {/* Brief Feedback */}
                <div className="space-y-3 bg-[#F2F4F6] p-5 rounded-2xl">
                    <h4 className="font-bold text-[#191F28] mb-2">AI 요약 피드백</h4>
                    <div className="flex gap-3 items-start">
                        <CheckCircle2 className="h-5 w-5 text-[#3182F6] shrink-0 mt-0.5" />
                        <p className="text-sm text-[#4E5968] leading-relaxed">현재 보유하신 <span className="font-bold">Product Strategy</span> 역량이 해당 직무의 핵심 요구사항과 완벽하게 일치합니다.</p>
                    </div>
                    <div className="flex gap-3 items-start">
                        <CheckCircle2 className="h-5 w-5 text-[#FFB300] shrink-0 mt-0.5" />
                        <p className="text-sm text-[#4E5968] leading-relaxed">더 높은 연봉 협상을 위해 <span className="font-bold">SQL 데이터 분석</span> 역량을 포트폴리오에 강조해보세요.</p>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button 
                        variant="outline" 
                        className="flex-1 h-14 rounded-xl border-[#E5E8EB] text-[#4E5968] hover:bg-[#F2F4F6] font-bold text-base"
                        onClick={() => setShowResults(false)}
                    >
                        다시 분석하기
                    </Button>
                    <Link href="/report" className="flex-1">
                        <Button className="w-full h-14 rounded-xl bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/20 font-bold text-base">
                            전체 리포트 보기 <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </div>
              </CardContent>
            </Card>
         </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto pb-10 pt-10">
        <div className="text-center mb-10">
          <h2 className="text-[32px] font-bold text-[#191F28] mb-3">어떤 커리어를 목표로 하시나요?</h2>
          <p className="text-[#8B95A1] text-lg">
            현재 프로필 정보를 바탕으로 AI가 적합도를 분석해드립니다.<br/>
            정보가 변경되었다면 <Link href="/profile"><span className="text-[#3182F6] font-bold cursor-pointer underline underline-offset-4">프로필 설정</span></Link>에서 업데이트해주세요.
          </p>
        </div>

        <Card className="toss-card p-8 shadow-xl shadow-black/5 border-none">
          <div className="space-y-8">
            {/* Profile Summary Pill */}
            <div className="bg-[#F9FAFB] rounded-2xl p-4 flex items-center gap-4 border border-[#F2F4F6]">
                <div className="h-12 w-12 rounded-full bg-[#E8F3FF] flex items-center justify-center text-[#3182F6] font-bold text-lg">
                    JD
                </div>
                <div className="flex-1">
                    <p className="text-sm text-[#8B95A1] font-medium">분석 대상 프로필</p>
                    <p className="text-base font-bold text-[#191F28]">John Doe (5년차 PM)</p>
                </div>
                <Link href="/profile">
                    <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-[#3182F6]">
                        <Settings className="h-5 w-5" />
                    </Button>
                </Link>
            </div>

            <div className="space-y-4">
                <Label className="text-lg font-bold text-[#191F28]">목표 직무 / 포지션</Label>
                <div className="relative">
                    <Sparkles className="absolute left-4 top-4 h-5 w-5 text-[#FFB300]" />
                    <Input 
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className="pl-12 h-14 rounded-2xl bg-[#F2F4F6] border-none text-lg font-medium focus-visible:ring-[#3182F6]" 
                        placeholder="예: 시니어 프로덕트 매니저" 
                    />
                </div>
                <p className="text-sm text-[#8B95A1] pl-1">
                    * 입력하신 직무의 시장 데이터와 회원님의 역량을 비교 분석합니다.
                </p>
            </div>

            <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || !targetRole}
                className="w-full h-16 rounded-2xl bg-[#3182F6] hover:bg-[#2b72d7] shadow-xl shadow-blue-500/30 text-xl font-bold transition-all hover:scale-[1.02]"
            >
                {isAnalyzing ? (
                    <>
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> AI 분석 중...
                    </>
                ) : (
                    <>
                        분석 시작하기 (1 토큰)
                    </>
                )}
            </Button>

            {credits === 0 && (
                <p className="text-center text-sm font-medium text-[#E44E48]">
                    보유하신 토큰이 부족합니다.
                </p>
            )}
          </div>
        </Card>

        {/* Context Tips */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            <div>
                <p className="text-2xl font-bold text-[#191F28] mb-1">3분</p>
                <p className="text-sm text-[#8B95A1] font-medium">소요 시간</p>
            </div>
            <div>
                <p className="text-2xl font-bold text-[#191F28] mb-1">92%</p>
                <p className="text-sm text-[#8B95A1] font-medium">분석 정확도</p>
            </div>
            <div>
                <p className="text-2xl font-bold text-[#191F28] mb-1">15+</p>
                <p className="text-sm text-[#8B95A1] font-medium">분석 항목</p>
            </div>
        </div>
      </div>
    </Layout>
  );
}
