import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, Shield, Lock, UserX, Smartphone, ChevronRight, Loader2, Gift, Copy, Check, Users, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface ReferralInfo {
    referralCode: string | null;
    referralLink: string;
    totalReferred: number;
    totalGpEarned: number;
    inviterReward: number;
    inviteeReward: number;
}

interface UserSettings {
    phone: string | null;
    marketingConsent: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
}

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
                                        <Skeleton className="h-5 w-8 rounded-full" />
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
    const { user, isLoading, updatePassword, logout, getAccessToken } = useAuth();
    const queryClient = useQueryClient();
    const [, setLocation] = useLocation();
    
    const [phone, setPhone] = useState("");
    const [marketingConsent, setMarketingConsent] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);
    const [copied, setCopied] = useState(false);
    
    // Password change state
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordChanging, setPasswordChanging] = useState(false);
    
    // Account deletion state
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [accountDeleting, setAccountDeleting] = useState(false);

    // Fetch referral info
    const { data: referralInfo, isLoading: referralLoading } = useQuery<ReferralInfo>({
        queryKey: ['/api/referral/info'],
        queryFn: async () => {
            const response = await apiRequest('GET', '/api/referral/info');
            return response.json();
        },
        enabled: !!user,
    });

    const copyReferralLink = () => {
        if (referralInfo?.referralLink) {
            navigator.clipboard.writeText(referralInfo.referralLink);
            setCopied(true);
            toast({
                title: "복사 완료",
                description: "추천 링크가 클립보드에 복사되었습니다.",
            });
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Fetch settings from database
    const { data: settings, isLoading: settingsLoading } = useQuery<UserSettings>({
        queryKey: ['/api/user-settings'],
        queryFn: async () => {
            const response = await apiRequest('GET', '/api/user-settings');
            return response.json();
        },
        enabled: !!user,
    });

    // Initialize state from fetched settings
    useEffect(() => {
        if (settings) {
            setPhone(settings.phone || "");
            setMarketingConsent(settings.marketingConsent);
            setEmailNotifications(settings.emailNotifications);
            setPushNotifications(settings.pushNotifications);
        }
    }, [settings]);

    // Track changes
    useEffect(() => {
        if (settings) {
            const changed = 
                phone !== (settings.phone || "") ||
                marketingConsent !== settings.marketingConsent ||
                emailNotifications !== settings.emailNotifications ||
                pushNotifications !== settings.pushNotifications;
            setHasChanges(changed);
        }
    }, [phone, marketingConsent, emailNotifications, pushNotifications, settings]);

    // Save settings mutation
    const saveMutation = useMutation({
        mutationFn: async () => {
            const response = await apiRequest('PATCH', '/api/user-settings', {
                phone: phone || null,
                marketingConsent,
                emailNotifications,
                pushNotifications,
            });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/user-settings'] });
            toast({
                title: "설정 저장 완료",
                description: "변경사항이 저장되었습니다.",
            });
            setHasChanges(false);
        },
        onError: () => {
            toast({
                title: "저장 실패",
                description: "설정을 저장하는 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        },
    });

    const handleSave = () => {
        saveMutation.mutate();
    };

    const formatPhoneNumber = (value: string) => {
        const numbers = value.replace(/[^\d]/g, '');
        const limited = numbers.slice(0, 11);
        
        if (limited.length <= 3) {
            return limited;
        } else if (limited.length <= 7) {
            return `${limited.slice(0, 3)}-${limited.slice(3)}`;
        } else {
            return `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7)}`;
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value);
        setPhone(formatted);
    };

    const handlePasswordChange = async () => {
        if (newPassword.length < 6) {
            toast({
                title: "비밀번호 오류",
                description: "비밀번호는 최소 6자 이상이어야 합니다.",
                variant: "destructive",
            });
            return;
        }
        
        if (newPassword !== confirmPassword) {
            toast({
                title: "비밀번호 불일치",
                description: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
                variant: "destructive",
            });
            return;
        }
        
        setPasswordChanging(true);
        try {
            const { error } = await updatePassword(newPassword);
            if (error) {
                toast({
                    title: "비밀번호 변경 실패",
                    description: error.message || "비밀번호를 변경하는 중 오류가 발생했습니다.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "비밀번호 변경 완료",
                    description: "비밀번호가 성공적으로 변경되었습니다.",
                });
                setShowPasswordDialog(false);
                setNewPassword("");
                setConfirmPassword("");
            }
        } catch (error) {
            toast({
                title: "비밀번호 변경 실패",
                description: "비밀번호를 변경하는 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setPasswordChanging(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== "회원탈퇴") {
            toast({
                title: "입력 오류",
                description: "'회원탈퇴'를 정확히 입력해주세요.",
                variant: "destructive",
            });
            return;
        }
        
        setAccountDeleting(true);
        try {
            const token = await getAccessToken();
            const response = await fetch('/api/auth/delete-account', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            if (response.ok) {
                toast({
                    title: "계정 삭제 완료",
                    description: "계정이 성공적으로 삭제되었습니다.",
                });
                await logout();
                setLocation('/');
            } else {
                const data = await response.json();
                toast({
                    title: "계정 삭제 실패",
                    description: data.message || "계정을 삭제하는 중 오류가 발생했습니다.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "계정 삭제 실패",
                description: "계정을 삭제하는 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setAccountDeleting(false);
        }
    };

    if (isLoading || settingsLoading) {
        return <SettingsSkeleton />;
    }

    const userEmail = user?.email || "";

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
                                    <Input 
                                        value={userEmail}
                                        placeholder="이메일 없음"
                                        disabled 
                                        className="bg-[#F2F4F6] border-none rounded-xl h-11 sm:h-12 text-sm sm:text-base" 
                                        data-testid="input-email"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#4E5968] text-sm">휴대폰 번호</Label>
                                    <Input 
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        placeholder="010-1234-5678"
                                        maxLength={13}
                                        className="bg-[#F2F4F6] border-none rounded-xl h-11 sm:h-12 text-sm sm:text-base" 
                                        data-testid="input-phone"
                                    />
                                    <p className="text-xs text-[#8B95A1]">형식: 010-1234-5678</p>
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
                                    <div className="flex-1 mr-4">
                                        <p className="font-medium text-[#191F28] text-sm sm:text-base">마케팅 정보 수신</p>
                                        <p className="text-xs sm:text-sm text-[#8B95A1]">이벤트 및 혜택 정보를 받습니다.</p>
                                    </div>
                                    <Switch 
                                        checked={marketingConsent}
                                        onCheckedChange={setMarketingConsent}
                                        className="h-[18px] w-8 data-[state=checked]:bg-[#3182F6] data-[state=unchecked]:bg-[#D1D6DB]"
                                        data-testid="switch-marketing"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#F2F4F6]">
                                    <div className="flex-1 mr-4">
                                        <p className="font-medium text-[#191F28] text-sm sm:text-base">이메일 알림</p>
                                        <p className="text-xs sm:text-sm text-[#8B95A1]">주요 공지사항을 메일로 받습니다.</p>
                                    </div>
                                    <Switch 
                                        checked={emailNotifications}
                                        onCheckedChange={setEmailNotifications}
                                        className="h-[18px] w-8 data-[state=checked]:bg-[#3182F6] data-[state=unchecked]:bg-[#D1D6DB]"
                                        data-testid="switch-email-notifications"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 sm:p-5">
                                    <div className="flex-1 mr-4">
                                        <p className="font-medium text-[#191F28] text-sm sm:text-base">앱 푸시 알림</p>
                                        <p className="text-xs sm:text-sm text-[#8B95A1]">서비스 알림을 앱으로 받습니다.</p>
                                    </div>
                                    <Switch 
                                        checked={pushNotifications}
                                        onCheckedChange={setPushNotifications}
                                        className="h-[18px] w-8 data-[state=checked]:bg-[#3182F6] data-[state=unchecked]:bg-[#D1D6DB]"
                                        data-testid="switch-push-notifications"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Referral Program */}
                    <section>
                        <h3 className="text-base sm:text-lg font-bold text-[#191F28] mb-3 flex items-center gap-2">
                            <Gift className="h-5 w-5 text-[#10B981]" /> 친구 초대
                        </h3>
                        <Card className="toss-card">
                            <CardContent className="p-4 sm:p-6">
                                {referralLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-12 w-full rounded-xl" />
                                        <div className="flex gap-4">
                                            <Skeleton className="h-16 flex-1 rounded-xl" />
                                            <Skeleton className="h-16 flex-1 rounded-xl" />
                                        </div>
                                    </div>
                                ) : referralInfo ? (
                                    <div className="space-y-4">
                                        {/* HIDDEN_POINTS_SETTINGS_REWARD_START */}
                                        {/* <div className="bg-gradient-to-r from-[#10B981]/10 to-[#3182F6]/10 rounded-xl p-4 border border-[#10B981]/20">
                                            <p className="text-sm text-[#4E5968] mb-2">
                                                친구를 초대하면 <span className="font-bold text-[#10B981]">{referralInfo.inviterReward}GP</span>를 받고,
                                                친구도 <span className="font-bold text-[#3182F6]">{referralInfo.inviteeReward}GP</span>를 받습니다!
                                            </p>
                                        </div> */}
                                        {/* HIDDEN_POINTS_SETTINGS_REWARD_END */}
                                        
                                        <div className="space-y-2">
                                            <Label className="text-[#4E5968] text-sm">나의 추천 링크</Label>
                                            <div className="flex gap-2">
                                                <Input 
                                                    value={referralInfo.referralLink || ""}
                                                    readOnly
                                                    className="bg-[#F2F4F6] border-none rounded-xl h-11 sm:h-12 text-sm font-mono"
                                                    data-testid="input-referral-link"
                                                />
                                                <Button
                                                    onClick={copyReferralLink}
                                                    variant="outline"
                                                    className="h-11 sm:h-12 px-4 rounded-xl border-[#E5E8EB] hover:bg-[#F2F4F6]"
                                                    data-testid="button-copy-referral"
                                                >
                                                    {copied ? (
                                                        <Check className="h-5 w-5 text-[#10B981]" />
                                                    ) : (
                                                        <Copy className="h-5 w-5 text-[#4E5968]" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <div className="bg-[#F2F4F6] rounded-xl p-4 text-center">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <Users className="h-4 w-4 text-[#4E5968]" />
                                                    <span className="text-sm text-[#4E5968]">초대한 친구</span>
                                                </div>
                                                <p className="text-xl sm:text-2xl font-bold text-[#191F28]" data-testid="text-total-referred">
                                                    {referralInfo.totalReferred}명
                                                </p>
                                            </div>
                                            {/* HIDDEN_POINTS_SETTINGS_GP_EARNED_START */}
                                            {/* <div className="bg-[#10B981]/10 rounded-xl p-4 text-center">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <Gift className="h-4 w-4 text-[#10B981]" />
                                                    <span className="text-sm text-[#10B981]">받은 GP</span>
                                                </div>
                                                <p className="text-xl sm:text-2xl font-bold text-[#10B981]" data-testid="text-total-gp-earned">
                                                    {referralInfo.totalGpEarned}GP
                                                </p>
                                            </div> */}
                                            {/* HIDDEN_POINTS_SETTINGS_GP_EARNED_END */}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-[#8B95A1] text-center py-4">
                                        추천 정보를 불러올 수 없습니다.
                                    </p>
                                )}
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
                                    onClick={() => setShowPasswordDialog(true)}
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
                                    onClick={() => setShowDeleteDialog(true)}
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
                        disabled={saveMutation.isPending || !hasChanges}
                        className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold rounded-xl bg-[#3182F6] hover:bg-[#2b72d7] active:scale-[0.98] transition-all disabled:opacity-50"
                        data-testid="button-save-settings"
                    >
                        {saveMutation.isPending ? (
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

            {/* Password Change Dialog */}
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            비밀번호 변경
                        </DialogTitle>
                        <DialogDescription>
                            새로운 비밀번호를 입력해주세요. 비밀번호는 최소 6자 이상이어야 합니다.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">새 비밀번호</Label>
                            <div className="relative">
                                <Input
                                    id="new-password"
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="새 비밀번호 입력"
                                    className="pr-10"
                                    data-testid="input-new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B95A1]"
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">비밀번호 확인</Label>
                            <div className="relative">
                                <Input
                                    id="confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="비밀번호 확인"
                                    className="pr-10"
                                    data-testid="input-confirm-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B95A1]"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowPasswordDialog(false);
                                setNewPassword("");
                                setConfirmPassword("");
                            }}
                        >
                            취소
                        </Button>
                        <Button
                            onClick={handlePasswordChange}
                            disabled={passwordChanging || !newPassword || !confirmPassword}
                            className="bg-[#3182F6] hover:bg-[#2b72d7]"
                            data-testid="button-submit-password-change"
                        >
                            {passwordChanging ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    변경 중...
                                </>
                            ) : (
                                "변경하기"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Account Deletion Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            회원 탈퇴
                        </DialogTitle>
                        <DialogDescription className="text-left">
                            <div className="space-y-3 pt-2">
                                <p className="font-medium text-red-600">
                                    경고: 이 작업은 되돌릴 수 없습니다!
                                </p>
                                <p>
                                    회원 탈퇴 시 다음 정보가 모두 삭제됩니다:
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    <li>모든 프로필 정보</li>
                                    <li>저장된 분석 결과</li>
                                    <li>작성한 자기소개서</li>
                                    <li>목표 관리 데이터</li>
                                    {/* HIDDEN_POINTS_SETTINGS_DELETE_INFO: <li>보유 포인트 및 GP</li> */}
                                </ul>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="delete-confirm">
                                확인을 위해 <span className="font-bold text-red-600">'회원탈퇴'</span>를 입력해주세요
                            </Label>
                            <Input
                                id="delete-confirm"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="회원탈퇴"
                                className="border-red-300 focus:border-red-500"
                                data-testid="input-delete-confirm"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowDeleteDialog(false);
                                setDeleteConfirmText("");
                            }}
                        >
                            취소
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={accountDeleting || deleteConfirmText !== "회원탈퇴"}
                            data-testid="button-confirm-delete-account"
                        >
                            {accountDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    삭제 중...
                                </>
                            ) : (
                                "회원 탈퇴"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
