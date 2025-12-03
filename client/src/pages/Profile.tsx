import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { User, Mail, MapPin, Briefcase, School, Globe, Plus, GraduationCap, Sparkles, Save, Building, Calendar, Award, Link as LinkIcon, Trash2 } from "lucide-react";
import { useMobileAction } from "@/lib/MobileActionContext";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function Profile() {
  const { setAction } = useMobileAction();
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "프로필 저장 완료",
      description: "프로필 정보가 성공적으로 업데이트되었습니다.",
    });
  };

  useEffect(() => {
    setAction({
      icon: Save,
      label: "저장",
      onClick: handleSave
    });
    return () => setAction(null);
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[28px] font-bold text-[#191F28]">내 프로필</h2>
            <p className="text-[#8B95A1] mt-1 text-lg">AI 분석의 정확도를 높이기 위해 정보를 입력해주세요.</p>
          </div>
          <Button onClick={handleSave} className="gap-2 h-12 px-6 rounded-xl bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/20 font-bold text-base hidden md:flex">
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

            {/* 2. Work Experience (Expanded) */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-[#3182F6]" /> 경력 사항
                    </h3>
                    <Button variant="ghost" size="sm" className="text-[#3182F6] hover:bg-blue-50">
                        <Plus className="h-4 w-4 mr-1" /> 추가
                    </Button>
                </div>
                
                <Card className="toss-card">
                    <CardContent className="p-6 space-y-6">
                        {/* Item 1 */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-[#191F28] text-lg">Senior Product Manager</h4>
                                    <p className="text-[#4E5968] font-medium">Tech Corp Inc.</p>
                                </div>
                                <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-red-500">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[#8B95A1] text-xs">시작일</Label>
                                    <Input type="month" defaultValue="2021-03" className="bg-[#F2F4F6] border-none rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#8B95A1] text-xs">종료일</Label>
                                    <Input type="month" defaultValue="2023-12" className="bg-[#F2F4F6] border-none rounded-xl" />
                                </div>
                            </div>
                            
                            <Textarea 
                                className="bg-[#F2F4F6] border-none rounded-xl min-h-[80px] resize-none text-sm" 
                                defaultValue="- B2B SaaS 제품 기획 및 런칭 주도&#10;- 3분기 연속 매출 목표 120% 달성"
                            />
                        </div>

                        <Separator className="bg-[#F2F4F6]" />

                        {/* Item 2 */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-[#191F28] text-lg">Product Owner</h4>
                                    <p className="text-[#4E5968] font-medium">Startup X</p>
                                </div>
                                <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-red-500">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[#8B95A1] text-xs">시작일</Label>
                                    <Input type="month" defaultValue="2019-01" className="bg-[#F2F4F6] border-none rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#8B95A1] text-xs">종료일</Label>
                                    <Input type="month" defaultValue="2021-02" className="bg-[#F2F4F6] border-none rounded-xl" />
                                </div>
                            </div>
                            
                            <Textarea 
                                className="bg-[#F2F4F6] border-none rounded-xl min-h-[80px] resize-none text-sm" 
                                defaultValue="- 모바일 앱 2.0 리뉴얼 프로젝트 PM&#10;- DAU 300% 성장 견인"
                            />
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* 3. Education (Expanded) */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-[#3182F6]" /> 학력
                    </h3>
                    <Button variant="ghost" size="sm" className="text-[#3182F6] hover:bg-blue-50">
                        <Plus className="h-4 w-4 mr-1" /> 추가
                    </Button>
                </div>
                <Card className="toss-card">
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[#4E5968]">학교명</Label>
                                    <Input defaultValue="한국대학교" className="bg-[#F2F4F6] border-none rounded-xl h-12" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#4E5968]">전공</Label>
                                    <Input defaultValue="경영학과" className="bg-[#F2F4F6] border-none rounded-xl h-12" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[#4E5968]">학위</Label>
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
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#4E5968]">졸업년도</Label>
                                    <Input type="number" defaultValue="2018" className="bg-[#F2F4F6] border-none rounded-xl h-12" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

             {/* 4. Skills & Languages */}
             <section className="space-y-4">
                <h3 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                    <Award className="h-5 w-5 text-[#3182F6]" /> 스킬 및 어학
                </h3>
                <Card className="toss-card">
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-3">
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
                        
                        <Separator className="bg-[#F2F4F6]" />

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label className="text-[#4E5968] font-bold">어학 능력</Label>
                                <Button variant="ghost" size="sm" className="text-[#3182F6] text-xs h-auto p-0 hover:bg-transparent">
                                    + 추가
                                </Button>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-xl">
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-[#B0B8C1]" />
                                    <span className="font-bold text-[#333D4B]">영어 (English)</span>
                                </div>
                                <span className="text-sm text-[#4E5968] bg-white px-2 py-1 rounded border border-[#E5E8EB]">Business Level</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

             {/* 5. Links & Portfolio */}
             <section className="space-y-4">
                <h3 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-[#3182F6]" /> 링크 및 포트폴리오
                </h3>
                <Card className="toss-card">
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[#4E5968]">LinkedIn</Label>
                            <Input placeholder="https://linkedin.com/in/..." className="bg-[#F2F4F6] border-none rounded-xl h-12" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[#4E5968]">Portfolio / Website</Label>
                            <Input placeholder="https://..." className="bg-[#F2F4F6] border-none rounded-xl h-12" />
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* 6. Preferences (Conditions) */}
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