import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_ANALYSIS, MOCK_GOALS } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpRight, TrendingUp, Activity, Award, ChevronRight, FileText, Target, User } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const data = [
  { name: '1월', score: 65 },
  { name: '2월', score: 68 },
  { name: '3월', score: 75 },
  { name: '4월', score: 72 },
  { name: '5월', score: 80 },
  { name: '6월', score: 85 },
];

export default function Dashboard() {
  return (
    <Layout>
      <div className="space-y-8 pb-10">
        <div>
          <h2 className="text-[28px] font-bold text-[#191F28]">대시보드</h2>
          <p className="text-[#8B95A1] mt-1 text-lg">반가워요! 현재 커리어 성장 궤적을 확인해보세요.</p>
        </div>

        {/* Progress Overview Section */}
        <div className="grid gap-6 md:grid-cols-2">
            {/* Vision Tree Progress */}
            <Card className="toss-card p-6 text-[#191F28]">
                <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                            <Target className="h-5 w-5 text-[#3182F6]" /> Kompass 진행률
                        </CardTitle>
                        <CardDescription className="text-[#8B95A1] mt-1">최종 커리어 목표 달성까지</CardDescription>
                    </div>
                    <span className="text-3xl font-bold text-[#3182F6]">45%</span>
                </CardHeader>
                <CardContent className="px-0 pb-0 mt-4">
                    <Progress value={45} className="h-3 bg-[#F2F4F6]" indicatorClassName="bg-[#3182F6]" />
                    <div className="mt-4 flex justify-between text-sm text-[#8B95A1]">
                        <span>현재: 시니어 PM 직무 전환</span>
                        <span>목표: CPO (2030)</span>
                    </div>
                </CardContent>
            </Card>

            {/* Essay Progress */}
            <Card className="toss-card p-6">
                <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                            <FileText className="h-5 w-5 text-[#00BFA5]" /> 자기소개서 완성도
                        </CardTitle>
                        <CardDescription className="text-[#8B95A1] mt-1">경력 기술서 및 포트폴리오</CardDescription>
                    </div>
                    <Button variant="outline" className="rounded-xl h-10 text-[#00BFA5] border-[#00BFA5]/20 hover:bg-[#00BFA5]/10 font-bold">
                        작성하기
                    </Button>
                </CardHeader>
                <CardContent className="px-0 pb-0 mt-4">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-[#4E5968] font-medium">핵심 역량 기술</span>
                            <span className="text-[#00BFA5] font-bold">완료</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-[#4E5968] font-medium">프로젝트 성과</span>
                            <span className="text-[#FFB300] font-bold">작성중</span>
                        </div>
                        <Progress value={70} className="h-2 bg-[#F2F4F6] mt-2" indicatorClassName="bg-[#00BFA5]" />
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="toss-card hover:scale-[1.02] transition-transform">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-[#8B95A1]">커리어 매칭 점수</CardTitle>
              <div className="p-2 bg-blue-50 rounded-xl">
                <Activity className="h-4 w-4 text-[#3182F6]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#191F28]">{MOCK_ANALYSIS.score}점</div>
              <p className="text-sm text-[#8B95A1] mt-1 font-medium">
                <span className="text-[#3182F6]">▲ 2.5%</span> 지난달 대비
              </p>
              <div className="mt-4 h-2.5 w-full bg-[#F2F4F6] rounded-full overflow-hidden">
                <div className="h-full bg-[#3182F6]" style={{ width: `${MOCK_ANALYSIS.score}%` }}></div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="toss-card hover:scale-[1.02] transition-transform">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-[#8B95A1]">시장 트렌드</CardTitle>
              <div className="p-2 bg-emerald-50 rounded-xl">
                <TrendingUp className="h-4 w-4 text-[#00BFA5]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#191F28]">{MOCK_ANALYSIS.marketTrend}</div>
              <p className="text-sm text-[#8B95A1] mt-1 font-medium">
                타겟 직군 수요 급증
              </p>
            </CardContent>
          </Card>
          
          <Card className="toss-card hover:scale-[1.02] transition-transform">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-[#8B95A1]">진행중인 목표</CardTitle>
              <div className="p-2 bg-amber-50 rounded-xl">
                <Award className="h-4 w-4 text-[#FFB300]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#191F28]">{MOCK_GOALS.length}개</div>
              <p className="text-sm text-[#8B95A1] mt-1 font-medium">
                {MOCK_GOALS.filter(g => g.status === 'in-progress').length}개 진행중
              </p>
            </CardContent>
          </Card>
          
          <Card className="toss-card hover:scale-[1.02] transition-transform">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-[#8B95A1]">예상 연봉 범위</CardTitle>
              <div className="p-2 bg-purple-50 rounded-xl">
                <ArrowUpRight className="h-4 w-4 text-[#9852F8]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#191F28]">
                ${(MOCK_ANALYSIS.salaryRange.min / 1000).toFixed(0)}k - ${(MOCK_ANALYSIS.salaryRange.max / 1000).toFixed(0)}k
              </div>
              <p className="text-sm text-[#8B95A1] mt-1 font-medium">
                경력 및 위치 기반 산정
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 toss-card p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl font-bold text-[#191F28]">준비도 점수 추이</CardTitle>
              <CardDescription className="text-[#8B95A1]">
                지난 6개월간의 자격 요건 충족도 변화입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="h-[320px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F4F6" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#B0B8C1" 
                      fontSize={14} 
                      tickLine={false} 
                      axisLine={false} 
                      tickMargin={10}
                    />
                    <YAxis 
                      stroke="#B0B8C1" 
                      fontSize={14} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}%`} 
                    />
                    <Tooltip 
                      cursor={{fill: '#F9FAFB'}}
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                        padding: '12px 20px',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    />
                    <Bar dataKey="score" fill="#3182F6" radius={[8, 8, 0, 0]} barSize={40}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#3182F6' : '#E5E8EB'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3 toss-card p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl font-bold text-[#191F28]">주요 스킬 갭 (Gap)</CardTitle>
              <CardDescription className="text-[#8B95A1]">
                목표 직무를 위해 보완이 필요한 역량입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 mt-4">
              <div className="space-y-4">
                {MOCK_ANALYSIS.skillsGap.map((skill, i) => (
                  <div key={skill} className="flex items-center p-4 bg-[#F2F4F6] rounded-xl group hover:bg-[#E8F3FF] transition-colors cursor-pointer">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#E44E48] mr-4" />
                    <div className="space-y-1 flex-1">
                      <p className="text-base font-bold text-[#333D4B]">{skill}</p>
                      <p className="text-sm text-[#8B95A1]">시니어 레벨 필수 역량</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#B0B8C1] group-hover:text-[#3182F6] transition-colors" />
                  </div>
                ))}
                
                <div className="mt-8 pt-6 border-t border-[#F2F4F6]">
                  <h4 className="text-base font-bold text-[#333D4B] mb-4">나의 강점</h4>
                  <div className="flex flex-wrap gap-2">
                    {MOCK_ANALYSIS.strengths.map(strength => (
                      <span key={strength} className="px-3 py-1.5 rounded-lg bg-[#E8F3FF] text-[#1B64DA] text-sm font-semibold">
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
