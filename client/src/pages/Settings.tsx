import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Shield, Lock, UserX, Smartphone, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { useState, useEffect } from "react";

function SettingsSkeleton() {
    return (
        <Layout>
            <div className="max-w-2xl mx-auto pb-20">
                <Skeleton className="h-8 w-24 mb-6" />

                <div className="space-y-5 sm:space-y-6">
                    {/* Contact Information Skeleton */}
                    <section>
                        <Skeleton className="h-6 w-32 mb-3" />
                        <Card className="toss-card">
                            <CardContent className="p-4 sm:p-6 space-y-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-16" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-12 flex-1 rounded-xl" />
                                        <Skeleton className="h-12 w-16 rounded-xl" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-12 flex-1 rounded-xl" />
                                        <Skeleton className="h-12 w-16 rounded-xl" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Notifications Skeleton */}
                    <section>
                        <Skeleton className="h-6 w-24 mb-3" />
                        <Card className="toss-card">
                            <CardContent className="p-0">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-4 sm:p-5 border-b border-[#F2F4F6] last:border-b-0">
                                        <div className="flex-1 mr-3">
                                            <Skeleton className="h-5 w-32 mb-1" />
                                            <Skeleton className="h-4 w-48" />
                                        </div>
                                        <Skeleton className="h-6 w-10 rounded-full" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </section>

                    {/* Security Skeleton */}
                    <section>
                        <Skeleton className="h-6 w-28 mb-3" />
                        <Card className="toss-card">
                            <CardContent className="p-0">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-4 sm:p-5 border-b border-[#F2F4F6] last:border-b-0">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-5 w-5 rounded" />
                                            <Skeleton className="h-5 w-24" />
                                        </div>
                                        <Skeleton className="h-5 w-5" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </section>

                    <Skeleton className="h-14 w-full rounded-xl" />
                </div>
            </div>
        </Layout>
    );
}

export default function Settings() {
    const { toast } = useToast();
    const { user, isLoading } = useAuth();
    
    const [phone, setPhone] = useState("");
    const [marketingConsent, setMarketingConsent] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                setPhone(settings.phone || "");
                setMarketingConsent(settings.marketingConsent ?? false);
                setEmailNotifications(settings.emailNotifications ?? true);
                setPushNotifications(settings.pushNotifications ?? true);
            } catch (e) {
                console.error("Failed to parse settings:", e);
            }
        }
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const settings = {
                phone,
                marketingConsent,
                emailNotifications,
                pushNotifications,
            };
            localStorage.setItem('userSettings', JSON.stringify(settings));
            
            toast({
                title: "설정 저장 완료",
                description: "변경사항이 저장되었습니다.",
            });
        } catch (error) {
            toast({
                title: "저장 실패",
                description: "설정을 저장하는 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <SettingsSkeleton />;
    }

    const userEmail = user?.email || "";
    const displayName = user?.firstName && user?.lastName 
        ? `${user.lastName}${user.firstName}`
        : user?.firstName || user?.lastName || "";

    return (
        <Layout>
            <div className="max-w-2xl mx-auto pb-20">
                <h2 className="text-xl sm:text-[28px] font-bold text-[#191F28] mb-4 sm:mb-6">설정</h2>

                <div className="space-y-5 sm:space-y-6">
                    {/* Contact Information */}
                    <section>
                        <h3 className="text-base sm:text-lg font-bold text-[#191F28] mb-3 flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-[#3182F6]" /> 연락처 정보
                        </h3>
                        <Card className="toss-card">
                            <CardContent className="p-4 sm:p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[#4E5968] text-sm">이메일</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={userEmail}
                                            placeholder="이메일 없음"
                                            disabled 
                                            className="bg-[#F2F4F6] border-none rounded-xl h-11 sm:h-12 text-sm sm:text-base" 
                                            data-testid="input-email"
                                        />
                                        <Button 
                                            variant="outline" 
                                            className="h-11 sm:h-12 px-3 sm:px-4 rounded-xl border-[#E5E8EB] text-sm"
                                            data-testid="button-change-email"
                                        >
                                            변경
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#4E5968] text-sm">휴대폰 번호</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="휴대폰 번호를 입력하세요"
                                            className="bg-[#F2F4F6] border-none rounded-xl h-11 sm:h-12 text-sm sm:text-base" 
                                            data-testid="input-phone"
                                        />
                                        <Button 
                                            variant="outline" 
                                            className="h-11 sm:h-12 px-3 sm:px-4 rounded-xl border-[#E5E8EB] text-sm"
                                            data-testid="button-verify-phone"
                                        >
                                            인증
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Notifications */}
                    <section>
                        <h3 className="text-base sm:text-lg font-bold text-[#191F28] mb-3 flex items-center gap-2">
                            <Bell className="h-5 w-5 text-[#FFB300]" /> 알림 설정
                        </h3>
                        <Card className="toss-card">
                            <CardContent className="p-0">
                                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#F2F4F6]">
                                    <div className="flex-1 mr-3">
                                        <p className="font-bold text-[#191F28] text-sm sm:text-base">마케팅 정보 수신 동의</p>
                                        <p className="text-xs sm:text-sm text-[#8B95A1]">이벤트 및 혜택 정보를 받습니다.</p>
                                    </div>
                                    <Switch 
                                        checked={marketingConsent}
                                        onCheckedChange={setMarketingConsent}
                                        data-testid="switch-marketing"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#F2F4F6]">
                                    <div className="flex-1 mr-3">
                                        <p className="font-bold text-[#191F28] text-sm sm:text-base">이메일 알림</p>
                                        <p className="text-xs sm:text-sm text-[#8B95A1]">주요 공지사항을 메일로 받습니다.</p>
                                    </div>
                                    <Switch 
                                        checked={emailNotifications}
                                        onCheckedChange={setEmailNotifications}
                                        data-testid="switch-email-notifications"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 sm:p-5">
                                    <div className="flex-1 mr-3">
                                        <p className="font-bold text-[#191F28] text-sm sm:text-base">앱 푸시 알림</p>
                                        <p className="text-xs sm:text-sm text-[#8B95A1]">서비스 알림을 앱으로 받습니다.</p>
                                    </div>
                                    <Switch 
                                        checked={pushNotifications}
                                        onCheckedChange={setPushNotifications}
                                        data-testid="switch-push-notifications"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Security & Account */}
                    <section>
                        <h3 className="text-base sm:text-lg font-bold text-[#191F28] mb-3 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-[#333D4B]" /> 보안 및 계정
                        </h3>
                        <Card className="toss-card">
                            <CardContent className="p-0 divide-y divide-[#F2F4F6]">
                                <button 
                                    className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[#F9FAFB] active:bg-[#F2F4F6] transition-colors text-left"
                                    data-testid="button-change-password"
                                >
                                    <div className="flex items-center gap-3">
                                        <Lock className="h-5 w-5 text-[#8B95A1]" />
                                        <span className="font-medium text-[#333D4B] text-sm sm:text-base">비밀번호 변경</span>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-[#B0B8C1]" />
                                </button>
                                <button 
                                    className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[#F9FAFB] active:bg-[#F2F4F6] transition-colors text-left"
                                    data-testid="button-delete-account"
                                >
                                    <div className="flex items-center gap-3">
                                        <UserX className="h-5 w-5 text-[#8B95A1]" />
                                        <span className="font-medium text-[#8B95A1] text-sm sm:text-base">회원 탈퇴</span>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-[#B0B8C1]" />
                                </button>
                            </CardContent>
                        </Card>
                    </section>

                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold rounded-xl bg-[#3182F6] hover:bg-[#2b72d7] active:scale-[0.98] transition-all"
                        data-testid="button-save-settings"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                저장 중...
                            </>
                        ) : (
                            "설정 저장하기"
                        )}
                    </Button>
                </div>
            </div>
        </Layout>
    );
}
