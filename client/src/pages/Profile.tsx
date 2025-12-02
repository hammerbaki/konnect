import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, MapPin, Briefcase, School, Globe } from "lucide-react";

export default function Profile() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div>
          <h2 className="text-[28px] font-bold text-[#191F28]">내 프로필</h2>
          <p className="text-[#8B95A1] mt-1 text-lg">기본 정보와 이력을 관리합니다.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-[300px_1fr]">
          {/* Profile Card */}
          <Card className="toss-card h-fit">
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

              <Button className="w-full mt-6 rounded-xl font-bold bg-[#3182F6] hover:bg-[#2b72d7]">
                프로필 편집
              </Button>
            </CardContent>
          </Card>

          {/* Details Form */}
          <div className="space-y-6">
            <Card className="toss-card">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-[#191F28]">기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#4E5968]">이름</Label>
                    <Input defaultValue="John Doe" className="bg-[#F2F4F6] border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#4E5968]">직무</Label>
                    <Input defaultValue="Product Manager" className="bg-[#F2F4F6] border-none rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#4E5968]">한줄 소개</Label>
                  <Input defaultValue="데이터 기반의 의사결정을 선호하는 PM입니다." className="bg-[#F2F4F6] border-none rounded-xl" />
                </div>
              </CardContent>
            </Card>

            <Card className="toss-card">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-[#191F28]">보유 스킬</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["Product Strategy", "User Research", "Data Analysis", "Agile/Scrum", "SQL", "Figma"].map((skill) => (
                    <Badge key={skill} variant="secondary" className="bg-[#E8F3FF] text-[#1B64DA] hover:bg-[#D2E6FF] px-3 py-1.5 rounded-lg text-sm font-medium">
                      {skill}
                    </Badge>
                  ))}
                  <Button variant="outline" size="sm" className="rounded-lg border-dashed border-[#B0B8C1] text-[#8B95A1] hover:text-[#3182F6] hover:border-[#3182F6]">
                    + 추가
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="toss-card">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-[#191F28]">학력 및 이력</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-start p-4 rounded-xl border border-[#F2F4F6] hover:border-[#E5E8EB] transition-colors">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <School className="h-5 w-5 text-[#3182F6]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#191F28]">한국대학교</h4>
                    <p className="text-sm text-[#4E5968]">컴퓨터공학 학사</p>
                    <p className="text-xs text-[#8B95A1] mt-1">2016 - 2020</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start p-4 rounded-xl border border-[#F2F4F6] hover:border-[#E5E8EB] transition-colors">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Briefcase className="h-5 w-5 text-[#9852F8]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#191F28]">테크 스타트업 A</h4>
                    <p className="text-sm text-[#4E5968]">주니어 PM</p>
                    <p className="text-xs text-[#8B95A1] mt-1">2020 - 현재</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
