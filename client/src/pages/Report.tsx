import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Share2, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { MOCK_ANALYSIS } from "@/lib/mockData";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from "recharts";

const radarData = [
  { subject: '직무 적합성', A: 120, fullMark: 150 },
  { subject: '기술 역량', A: 98, fullMark: 150 },
  { subject: '리더십', A: 86, fullMark: 150 },
  { subject: '성장 잠재력', A: 99, fullMark: 150 },
  { subject: '문화 적합성', A: 85, fullMark: 150 },
  { subject: '시장 수요', A: 65, fullMark: 150 },
];

const salaryData = [
  { name: '하위 25%', value: 4500 },
  { name: '중위값', value: 5800 },
  { name: '상위 25%', value: 7200 },
  { name: '나의 예상', value: 6500, isUser: true },
];

export default function Report() {
  return (
    <>
      <div className="max-w-5xl mx-auto space-y-8 pb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/analysis">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-[#F2F4F6]">
                <ArrowLeft className="h-6 w-6 text-[#191F28]" />
              </Button>
            </Link>
            <div>
              <h2 className="text-[28px] font-bold text-[#191F28]">상세 분석 리포트</h2>
              <p className="text-[#8B95A1] mt-1 text-lg">2025년 5월 21일 생성됨</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl border-[#E5E8EB] text-[#4E5968] font-bold">
              <Share2 className="mr-2 h-4 w-4" /> 공유하기
            </Button>
            <Button className="rounded-xl bg-[#3182F6] hover:bg-[#2b72d7] font-bold shadow-lg shadow-blue-500/20">
              <Download className="mr-2 h-4 w-4" /> PDF 저장
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Score Card */}
          <Card className="toss-card md:col-span-2 p-6 bg-[#191F28] text-white">
            <CardContent className="p-0 flex items-center justify-between">
              <div>
                <Badge className="bg-[#3182F6] text-white hover:bg-[#3182F6] border-none px-3 py-1.5 text-sm mb-4">
                  High Match
                </Badge>
                <h3 className="text-3xl font-bold mb-2">시니어 프로덕트 매니저</h3>
                <p className="text-gray-400 text-lg mb-6">직무 적합도가 매우 높습니다.</p>
                
                <div className="flex gap-8">
                  <div>
                    <p className="text-gray-400 text-sm font-medium mb-1">종합 점수</p>
                    <p className="text-4xl font-bold text-[#3182F6]">{MOCK_ANALYSIS.score}<span className="text-xl text-gray-500 ml-1">/ 100</span></p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm font-medium mb-1">시장 경쟁력</p>
                    <p className="text-4xl font-bold text-[#00BFA5]">상위 15%</p>
                  </div>
                </div>
              </div>
              
              <div className="h-[240px] w-[240px] relative hidden md:block">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <Radar
                      name="My Stats"
                      dataKey="A"
                      stroke="#3182F6"
                      fill="#3182F6"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="toss-card p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg font-bold text-[#191F28]">추천 액션</CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              <div className="flex gap-3 items-start p-3 bg-[#E8F3FF] rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-[#3182F6] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#1B64DA]">SQL 자격증 과정 등록</p>
                  <p className="text-xs text-[#6B7684] mt-1">부족한 데이터 역량을 보완하세요.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start p-3 bg-[#F2F4F6] rounded-xl opacity-60">
                <CheckCircle2 className="h-5 w-5 text-[#8B95A1] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#4E5968]">포트폴리오 업데이트</p>
                  <p className="text-xs text-[#8B95A1] mt-1">최근 프로젝트 성과를 추가하세요.</p>
                </div>
              </div>
              <Button variant="outline" className="w-full rounded-xl border-[#E5E8EB] text-[#3182F6] font-bold hover:bg-[#E8F3FF] border-none">
                모든 액션 보기
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="toss-card p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl font-bold text-[#191F28]">연봉 분석</CardTitle>
              <CardDescription>동일 경력/직무 대비 예상 연봉 위치입니다.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salaryData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F2F4F6" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#4E5968', fontSize: 12, fontWeight: 600 }} width={80} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{fill: '#F9FAFB'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                      {salaryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isUser ? '#3182F6' : '#E5E8EB'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="toss-card p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl font-bold text-[#191F28]">상세 평가 항목</CardTitle>
              <CardDescription>각 영역별 세부 평가 내용입니다.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-6 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-[#4E5968]">하드 스킬 (Hard Skills)</span>
                  <span className="text-[#E44E48]">보완 필요</span>
                </div>
                <Progress value={65} className="h-2 bg-[#F2F4F6]" indicatorClassName="bg-[#E44E48]" />
                <p className="text-xs text-[#8B95A1]">SQL 및 데이터 분석 도구 활용 능력이 요구 수준보다 낮습니다.</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-[#4E5968]">소프트 스킬 (Soft Skills)</span>
                  <span className="text-[#3182F6]">매우 우수</span>
                </div>
                <Progress value={92} className="h-2 bg-[#F2F4F6]" indicatorClassName="bg-[#3182F6]" />
                <p className="text-xs text-[#8B95A1]">커뮤니케이션 및 리더십 역량이 탁월합니다.</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-[#4E5968]">경력 일관성</span>
                  <span className="text-[#00BFA5]">우수</span>
                </div>
                <Progress value={85} className="h-2 bg-[#F2F4F6]" indicatorClassName="bg-[#00BFA5]" />
                <p className="text-xs text-[#8B95A1]">직무 전환의 스토리텔링이 설득력 있습니다.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
