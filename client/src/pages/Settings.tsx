import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, Shield, Lock, UserX, Smartphone, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
    const { toast } = useToast();

    const handleSave = () => {
        toast({
            title: "설정 저장 완료",
            description: "변경사항이 저장되었습니다.",
        });
    };

    return (
        <Layout>
            <div className="max-w-2xl mx-auto pb-20">
                <h2 className="text-[28px] font-bold text-[#191F28] mb-6">설정</h2>

                <div className="space-y-6">
                    {/* Contact Information */}
                    <section>
                        <h3 className="text-lg font-bold text-[#191F28] mb-3 flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-[#3182F6]" /> 연락처 정보
                        </h3>
                        <Card className="toss-card">
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[#4E5968]">이메일</Label>
                                    <div className="flex gap-2">
                                        <Input defaultValue="john.doe@example.com" disabled className="bg-[#F2F4F6] border-none rounded-xl h-12" />
                                        <Button variant="outline" className="h-12 px-4 rounded-xl border-[#E5E8EB]">변경</Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#4E5968]">휴대폰 번호</Label>
                                    <div className="flex gap-2">
                                        <Input defaultValue="010-1234-5678" className="bg-[#F2F4F6] border-none rounded-xl h-12" />
                                        <Button variant="outline" className="h-12 px-4 rounded-xl border-[#E5E8EB]">인증</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Notifications */}
                    <section>
                        <h3 className="text-lg font-bold text-[#191F28] mb-3 flex items-center gap-2">
                            <Bell className="h-5 w-5 text-[#FFB300]" /> 알림 설정
                        </h3>
                        <Card className="toss-card">
                            <CardContent className="p-0">
                                <div className="flex items-center justify-between p-5 border-b border-[#F2F4F6]">
                                    <div>
                                        <p className="font-bold text-[#191F28]">마케팅 정보 수신 동의</p>
                                        <p className="text-sm text-[#8B95A1]">이벤트 및 혜택 정보를 받습니다.</p>
                                    </div>
                                    <Switch />
                                </div>
                                <div className="flex items-center justify-between p-5 border-b border-[#F2F4F6]">
                                    <div>
                                        <p className="font-bold text-[#191F28]">이메일 알림</p>
                                        <p className="text-sm text-[#8B95A1]">주요 공지사항을 메일로 받습니다.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between p-5">
                                    <div>
                                        <p className="font-bold text-[#191F28]">앱 푸시 알림</p>
                                        <p className="text-sm text-[#8B95A1]">서비스 알림을 앱으로 받습니다.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Security & Account */}
                    <section>
                        <h3 className="text-lg font-bold text-[#191F28] mb-3 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-[#333D4B]" /> 보안 및 계정
                        </h3>
                        <Card className="toss-card">
                            <CardContent className="p-0 divide-y divide-[#F2F4F6]">
                                <button className="w-full flex items-center justify-between p-5 hover:bg-[#F9FAFB] transition-colors text-left">
                                    <div className="flex items-center gap-3">
                                        <Lock className="h-5 w-5 text-[#8B95A1]" />
                                        <span className="font-medium text-[#333D4B]">비밀번호 변경</span>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-[#B0B8C1]" />
                                </button>
                                <button className="w-full flex items-center justify-between p-5 hover:bg-[#F9FAFB] transition-colors text-left">
                                    <div className="flex items-center gap-3">
                                        <UserX className="h-5 w-5 text-[#8B95A1]" />
                                        <span className="font-medium text-[#8B95A1]">회원 탈퇴</span>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-[#B0B8C1]" />
                                </button>
                            </CardContent>
                        </Card>
                    </section>

                    <Button onClick={handleSave} className="w-full h-14 text-lg font-bold rounded-xl bg-[#3182F6] hover:bg-[#2b72d7]">
                        설정 저장하기
                    </Button>
                </div>
            </div>
        </Layout>
    );
}
