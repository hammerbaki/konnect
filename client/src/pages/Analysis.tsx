import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Briefcase, MapPin, DollarSign, Sparkles, GraduationCap, Loader2 } from "lucide-react";
import { useState } from "react";

import { useTokens } from "@/lib/TokenContext";
import { useToast } from "@/hooks/use-toast";

export default function Analysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { credits, deductCredit } = useTokens();
  const { toast } = useToast();

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
      }, 2000);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-6xl mx-auto pb-10">
        <div>
          <h2 className="text-[28px] font-bold text-[#191F28]">AI 커리어 분석</h2>
          <p className="text-[#8B95A1] mt-1 text-lg">심층적인 커리어 적합성 분석을 위해 조건을 설정해주세요.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="hard" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-[#F2F4F6] p-1 rounded-[16px]">
                <TabsTrigger value="hard" className="rounded-[12px] py-2.5 font-semibold data-[state=active]:bg-white data-[state=active]:text-[#191F28] data-[state=active]:shadow-sm">필수 조건</TabsTrigger>
                <TabsTrigger value="soft" className="rounded-[12px] py-2.5 font-semibold data-[state=active]:bg-white data-[state=active]:text-[#191F28] data-[state=active]:shadow-sm">선호 조건</TabsTrigger>
                <TabsTrigger value="threshold" className="rounded-[12px] py-2.5 font-semibold data-[state=active]:bg-white data-[state=active]:text-[#191F28] data-[state=active]:shadow-sm">자격 요건</TabsTrigger>
              </TabsList>
              
              <div className="mt-6">
                <TabsContent value="hard">
                  <Card className="toss-card p-6">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle className="flex items-center gap-2 text-xl font-bold text-[#191F28]">
                        <Briefcase className="h-5 w-5 text-[#3182F6]" /> 필수 제약 조건
                      </CardTitle>
                      <CardDescription className="text-[#8B95A1]">타협할 수 없는 핵심 조건을 정의합니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 px-0 pb-0">
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-[#4E5968] font-semibold">희망 근무지</Label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-[#B0B8C1]" />
                            <Input className="pl-11 h-12 rounded-[16px] bg-[#F2F4F6] border-none text-base" placeholder="예: 서울 강남구, 판교" defaultValue="서울 강남구" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#4E5968] font-semibold">최소 연봉 (만원)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-4 top-3.5 h-5 w-5 text-[#B0B8C1]" />
                            <Input type="number" className="pl-11 h-12 rounded-[16px] bg-[#F2F4F6] border-none text-base" placeholder="5000" defaultValue="6000" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-[#4E5968] font-semibold">제외 산업군</Label>
                        <Input className="h-12 rounded-[16px] bg-[#F2F4F6] border-none text-base" placeholder="예: 도박, 사행성 게임 (쉼표로 구분)" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[#4E5968] font-semibold">목표 직무</Label>
                        <Input className="h-12 rounded-[16px] bg-[#F2F4F6] border-none text-base" placeholder="예: 프로덕트 매니저" defaultValue="시니어 프로덕트 매니저" />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="soft">
                  <Card className="toss-card p-6">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle className="flex items-center gap-2 text-xl font-bold text-[#191F28]">
                        <Sparkles className="h-5 w-5 text-[#FFB300]" /> 선호 조건
                      </CardTitle>
                      <CardDescription className="text-[#8B95A1]">AI가 성향과 관심사를 매칭하도록 돕습니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 px-0 pb-0">
                      <div className="space-y-2">
                        <Label className="text-[#4E5968] font-semibold">직업적 관심사</Label>
                        <Textarea 
                          placeholder="어떤 업무에서 에너지를 얻으시나요?" 
                          className="min-h-[120px] rounded-[16px] bg-[#F2F4F6] border-none text-base p-4 resize-none" 
                          defaultValue="다양한 팀과 협업하며 복잡한 사용자 문제를 데이터 기반으로 해결하는 것을 즐깁니다." 
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-[#4E5968] font-semibold">근무 형태</Label>
                          <Select defaultValue="hybrid">
                            <SelectTrigger className="h-12 rounded-[16px] bg-[#F2F4F6] border-none text-base">
                              <SelectValue placeholder="선택해주세요" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="remote">완전 원격근무</SelectItem>
                              <SelectItem value="hybrid">하이브리드</SelectItem>
                              <SelectItem value="onsite">사무실 출근</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#4E5968] font-semibold">선호 팀 규모</Label>
                          <Select defaultValue="mid">
                            <SelectTrigger className="h-12 rounded-[16px] bg-[#F2F4F6] border-none text-base">
                              <SelectValue placeholder="선택해주세요" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="startup">스타트업 (1-50명)</SelectItem>
                              <SelectItem value="mid">성장기 (50-500명)</SelectItem>
                              <SelectItem value="enterprise">대기업 (500명+)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="threshold">
                  <Card className="toss-card p-6">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle className="flex items-center gap-2 text-xl font-bold text-[#191F28]">
                        <GraduationCap className="h-5 w-5 text-[#333D4B]" /> 자격 요건 분석
                      </CardTitle>
                      <CardDescription className="text-[#8B95A1]">가능성 진단을 위한 기본 자격 정보를 입력합니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 px-0 pb-0">
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-[#4E5968] font-semibold">최종 학력</Label>
                          <Select defaultValue="bachelors">
                            <SelectTrigger className="h-12 rounded-[16px] bg-[#F2F4F6] border-none text-base">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="highschool">고등학교 졸업</SelectItem>
                              <SelectItem value="bachelors">학사 (대졸)</SelectItem>
                              <SelectItem value="masters">석사</SelectItem>
                              <SelectItem value="phd">박사</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#4E5968] font-semibold">학점 / 성과 점수</Label>
                          <Input type="number" step="0.1" className="h-12 rounded-[16px] bg-[#F2F4F6] border-none text-base" placeholder="4.5 만점 기준" defaultValue="3.8" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-[#4E5968] font-semibold">경력 연수</Label>
                        <div className="pt-6 px-2">
                          <Slider defaultValue={[5]} max={20} step={1} className="py-4" />
                          <div className="flex justify-between mt-2 text-sm text-[#8B95A1] font-medium">
                            <span>신입</span>
                            <span>5년차</span>
                            <span>10년차 이상</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>

            <div className="flex justify-end flex-col items-end gap-3 mt-4">
              <Button 
                size="lg" 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || showResults} 
                className="w-full md:w-auto h-14 px-8 rounded-[20px] text-lg font-bold bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 분석 중...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-5 w-5" /> AI 분석 시작하기 (1 토큰)
                  </>
                )}
              </Button>
              {credits === 0 && (
                <p className="text-sm font-medium text-[#E44E48]">토큰이 부족합니다. 코드를 등록해주세요.</p>
              )}
            </div>
          </div>

          {/* Results Panel - Sticky */}
          <div className="space-y-6">
             <Card className={`toss-card p-6 border-l-4 border-l-[#FFB300] transition-all duration-500 ${showResults ? 'opacity-100 translate-y-0' : 'opacity-50 blur-[1px] translate-y-4'}`}>
              <CardHeader className="px-0 pt-0 bg-transparent">
                <CardTitle className="text-xl font-bold text-[#191F28]">분석 요약</CardTitle>
                <CardDescription className="text-[#8B95A1]">입력된 정보를 바탕으로 한 적합도 예측입니다.</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pt-6 space-y-6">
                {!showResults && !isAnalyzing && (
                  <div className="text-center py-12 text-[#B0B8C1]">
                    <Brain className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">분석을 실행하여<br/>결과를 확인하세요</p>
                  </div>
                )}

                {(showResults || isAnalyzing) && (
                  <>
                    <div>
                      <div className="flex justify-between mb-3 text-base font-bold text-[#191F28]">
                        <span>종합 매칭 점수</span>
                        <span className="text-[#3182F6] text-xl">85%</span>
                      </div>
                      <Progress value={85} className="h-3 bg-[#F2F4F6]" indicatorClassName="bg-[#3182F6]" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-[#F2F4F6] p-4 rounded-[20px]">
                        <span className="text-sm text-[#8B95A1] font-medium block mb-1">연봉 타당성</span>
                        <span className="text-lg font-bold text-[#00BFA5]">높음</span>
                      </div>
                      <div className="bg-[#F2F4F6] p-4 rounded-[20px]">
                        <span className="text-sm text-[#8B95A1] font-medium block mb-1">시장 수요</span>
                        <span className="text-lg font-bold text-[#3182F6]">성장중</span>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <h4 className="text-base font-bold text-[#191F28]">주요 인사이트</h4>
                      <div className="space-y-3">
                        <div className="flex gap-3 items-start">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-none px-2 py-1 shrink-0 mt-0.5">긍정</Badge>
                          <p className="text-sm text-[#4E5968] leading-relaxed">리더십 성향과 소프트 스킬이 해당 직무와 매우 잘 일치합니다.</p>
                        </div>
                        <div className="flex gap-3 items-start">
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-none px-2 py-1 shrink-0 mt-0.5">보완</Badge>
                          <p className="text-sm text-[#4E5968] leading-relaxed">시니어 레벨 대비 SQL 활용 능력이 다소 부족합니다.</p>
                        </div>
                      </div>
                    </div>

                    {showResults && (
                      <Button className="w-full h-12 rounded-[16px] border border-[#E5E8EB] text-[#4E5968] hover:bg-[#F2F4F6] font-bold" variant="outline">
                        전체 리포트 보기
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#3182F6]/10 to-[#3182F6]/5 border-none shadow-none rounded-[24px]">
              <CardContent className="p-6">
                <h3 className="font-bold text-[#3182F6] mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Pro Tip
                </h3>
                <p className="text-sm text-[#4E5968] leading-relaxed font-medium">
                  "선호 조건"을 더 자세히 입력할수록 문화적 적합도 알고리즘의 정확도가 최대 40%까지 향상됩니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
