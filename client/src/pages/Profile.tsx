import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { User, Mail, MapPin, Briefcase, School, Globe, Plus, GraduationCap, Sparkles, Save } from "lucide-react";

export default function Profile() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[28px] font-bold text-[#191F28]">내 프로필</h2>
            <p className="text-[#8B95A1] mt-1 text-lg">AI 분석의 정확도를 높이기 위해 정보를 입력해주세요.</p>
          </div>
          <Button className="gap-2 h-12 px-6 rounded-xl bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/20 font-bold text-base">
            <Save className="h-5 w-5" /> 저장하기
          </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-[320px_1fr]">
          {/* Profile Overview Card - Sticky */}
          <div className="space-y-6">
            <Card className="toss-card sticky top-24">
              <CardContent className="pt-8 flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="h-24 w-24 rounded-full bg-[#F2F4F6] flex items-center justify-center text-2xl font-bold text-[#3182F6] border-4 border-white shadow-lg">
                    JD
                  </div>
                  <div className="absolute bottom-0 right-0 h-6 w-6 bg-[#00BFA5] rounded-full border-2 border-white" />
                </div>
                <h3 className="text-xl font-bold text-[#191F28]">John Doe</h3>
                <p className="text-[#8B95A1] font-medium">Product Manager</p>
                
                <div className="mt-6 w-full space-y-3 text-left">
                  <div className="flex items-center gap-3 text-[#4E5968] text-sm font-medium p-3 rounded-xl bg-[#F9FAFB]">
                    <Mail className="h-4 w-4 text-[#B0B8C1]" />
                    john.doe@example.com
                  </div>
                  <div className="flex items-center gap-3 text-[#4E5968] text-sm font-medium p-3 rounded-xl bg-[#F9FAFB]">
                    <MapPin className="h-4 w-4 text-[#B0B8C1]" />
                    Seoul, South Korea
                  </div>
                  <div className="flex items-center gap-3 text-[#4E5968] text-sm font-medium p-3 rounded-xl bg-[#F9FAFB]">
                    <Briefcase className="h-4 w-4 text-[#B0B8C1]" />
                    5년차
                  </div>
                </div>

                <div className="w-full mt-6 pt-6 border-t border-[#F2F4F6]">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-[#4E5968]">프로필 완성도</span>
                        <span className="text-sm font-bold text-[#3182F6]">85%</span>
                    </div>
                    <div className="h-2 w-full bg-[#F2F4F6] rounded-full overflow-hidden">
                        <div className="h-full bg-[#3182F6] w-[85%]" />
                    </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Form Area */}
          <div className="space-y-8">
            
            {/* 1. Basic Info */}
            <section className="space-y-4">
                <h3 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                    <User className="h-5 w-5 text-[#3182F6]" /> 기본 정보
                </h3>
                <Card className="toss-card">
                <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[#4E5968]">이름</Label>
                        <Input defaultValue="John Doe" className="bg-[#F2F4F6] border-none rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[#4E5968]">현재 직무</Label>
                        <Input defaultValue="Product Manager" className="bg-[#F2F4F6] border-none rounded-xl h-12" />
                    </div>
                    </div>
                    <div className="space-y-2">
                    <Label className="text-[#4E5968]">한줄 소개</Label>
                    <Input defaultValue="데이터 기반의 의사결정을 선호하는 PM입니다." className="bg-[#F2F4F6] border-none rounded-xl h-12" />
                    </div>
                </CardContent>
                </Card>
            </section>

            {/* 2. Experience & Education */}
            <section className="space-y-4">
                <h3 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-[#3182F6]" /> 경력 및 학력
                </h3>
                <Card className="toss-card">
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                            <Label className="text-[#4E5968] font-bold">최종 학력</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <Select defaultValue="bachelors">
                                    <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bachelors">학사 (대졸)</SelectItem>
                                        <SelectItem value="masters">석사</SelectItem>
                                        <SelectItem value="phd">박사</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input placeholder="학교명" defaultValue="한국대학교" className="bg-[#F2F4F6] border-none rounded-xl h-12" />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-[#F2F4F6]">
                            <div className="flex justify-between items-center">
                                <Label className="text-[#4E5968] font-bold">총 경력 연수</Label>
                                <span className="text-[#3182F6] font-bold text-lg">5년</span>
                            </div>
                            <Slider defaultValue={[5]} max={20} step={1} className="py-2" />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-[#F2F4F6]">
                             <Label className="text-[#4E5968] font-bold">보유 스킬</Label>
                             <div className="flex flex-wrap gap-2">
                                {["Product Strategy", "User Research", "Data Analysis", "SQL", "Figma"].map((skill) => (
                                    <Badge key={skill} variant="secondary" className="bg-[#E8F3FF] text-[#1B64DA] hover:bg-[#D2E6FF] px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer">
                                    {skill} X
                                    </Badge>
                                ))}
                                <Button variant="outline" size="sm" className="rounded-lg border-dashed border-[#B0B8C1] text-[#8B95A1] hover:text-[#3182F6] hover:border-[#3182F6] h-8">
                                    <Plus className="h-4 w-4 mr-1" /> 추가
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* 3. Preferences (Conditions) */}
            <section className="space-y-4">
                <h3 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#FFB300]" /> 선호 근무 조건
                </h3>
                <Card className="toss-card">
                    <CardContent className="p-6 space-y-6">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[#4E5968]">희망 근무지</Label>
                                <Input defaultValue="서울 강남구" className="bg-[#F2F4F6] border-none rounded-xl h-12" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[#4E5968]">희망 연봉 (만원)</Label>
                                <Input type="number" defaultValue="6000" className="bg-[#F2F4F6] border-none rounded-xl h-12" />
                            </div>
                        </div>
                        <div className="space-y-2">
                             <Label className="text-[#4E5968]">직업적 관심사</Label>
                             <Textarea 
                                defaultValue="다양한 팀과 협업하며 복잡한 사용자 문제를 데이터 기반으로 해결하는 것을 즐깁니다."
                                className="min-h-[100px] bg-[#F2F4F6] border-none rounded-xl resize-none p-4 text-base"
                             />
                        </div>
                    </CardContent>
                </Card>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
