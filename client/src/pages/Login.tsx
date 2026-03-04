import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, Sparkles, Mail, ArrowLeft, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const { isAuthenticated, isLoading, signInWithGoogle, signInWithApple, signInWithKakao, signInWithOtp, verifyOtp } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleGoogleLogin = async () => {
    setOauthLoading("google");
    await signInWithGoogle();
  };

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const sendOtpCode = async () => {
    setMessage(null);
    setAuthLoading(true);

    try {
      const { error } = await signInWithOtp(email);

      if (error) {
        setMessage({ type: "error", text: "인증 코드 발송에 실패했습니다. 다시 시도해주세요." });
      } else {
        setShowOtpInput(true);
        setMessage({ type: "success", text: "인증 코드가 이메일로 발송되었습니다." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "오류가 발생했습니다. 다시 시도해주세요." });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendOtpCode();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setAuthLoading(true);

    try {
      const { error } = await verifyOtp(email, otpCode);

      if (error) {
        setMessage({ type: "error", text: "인증 코드가 올바르지 않습니다." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "인증에 실패했습니다. 다시 시도해주세요." });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setShowOtpInput(false);
    setOtpCode("");
    setMessage(null);
  };

  if (isLoading) {
    return (
      <Layout hideNav>
        <div className="min-h-screen flex items-center justify-center bg-[#F2F4F6] relative overflow-hidden font-sans py-8">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#3182F6]/5 blur-3xl" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-[#3182F6]/5 blur-3xl" />
          </div>
          <div className="z-10 w-full max-w-md px-4">
            <div className="text-center mb-8">
              <Skeleton className="h-16 w-16 rounded-[22px] mx-auto mb-6" />
              <Skeleton className="h-9 w-32 mx-auto mb-2" />
              <Skeleton className="h-5 w-48 mx-auto" />
            </div>
            <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-8">
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-5 w-32 mb-6" />
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <div className="flex items-center gap-3 py-2">
                  <Skeleton className="h-px flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-px flex-1" />
                </div>
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideNav>
      <div className="min-h-screen flex items-center justify-center bg-[#F2F4F6] relative overflow-hidden font-sans py-8">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#3182F6]/5 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-[#3182F6]/5 blur-3xl" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="z-10 w-full max-w-md px-4"
        >
          <div className="text-center mb-8">
            <button 
              onClick={() => setLocation("/")}
              className="inline-block hover:scale-105 transition-transform"
              data-testid="button-home"
            >
              <img 
                src="/konnect-logo.png" 
                alt="Konnect - Your AI Career Solution" 
                className="h-16 w-auto mx-auto"
              />
            </button>
          </div>

          <Card className="toss-card border-none shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-[24px] overflow-hidden bg-white">
            <CardHeader className="space-y-2 pt-8 px-8 pb-4">
              <CardTitle className="text-2xl font-bold text-[#191F28]">
                로그인
              </CardTitle>
              <CardDescription className="text-[#8B95A1] text-base mt-1">
                계정에 로그인하세요
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-8 pb-8">
              <div className="space-y-4">

                {!showOtpInput ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[#4E5968] font-medium">
                        이메일
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B95A1]" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-14 pl-12 rounded-[16px] border-[#E5E8EB] focus:border-[#3182F6] focus:ring-[#3182F6]/20"
                          data-testid="input-email"
                          required
                        />
                      </div>
                    </div>

                    {message && (
                      <p className={`text-sm ${message.type === "success" ? "text-[#3182F6]" : "text-red-500"}`}>
                        {message.text}
                      </p>
                    )}

                    <Button 
                      type="submit"
                      disabled={authLoading}
                      className="w-full h-14 text-lg rounded-[16px] bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
                      data-testid="button-send-otp"
                    >
                      {authLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "이메일로 인증코드 받기"
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <button
                      type="button"
                      onClick={handleBackToEmail}
                      className="flex items-center gap-2 text-[#8B95A1] hover:text-[#4E5968] transition-colors"
                      data-testid="button-back"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="text-sm">이메일 변경</span>
                    </button>

                    <div className="p-4 rounded-[16px] bg-[#F9FAFB]">
                      <p className="text-sm text-[#4E5968]">
                        <span className="font-medium text-[#191F28]">{email}</span>
                        <span className="block mt-1">으로 발송된 인증 코드를 입력해주세요.</span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-[#4E5968] font-medium">
                        인증 코드
                      </Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="6자리 인증 코드"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="h-14 text-center text-xl tracking-[0.5em] rounded-[16px] border-[#E5E8EB] focus:border-[#3182F6] focus:ring-[#3182F6]/20"
                        data-testid="input-otp"
                        maxLength={6}
                        required
                      />
                    </div>

                    {message && (
                      <p className={`text-sm ${message.type === "success" ? "text-[#3182F6]" : "text-red-500"}`}>
                        {message.text}
                      </p>
                    )}

                    <Button 
                      type="submit"
                      disabled={authLoading || otpCode.length < 6}
                      className="w-full h-14 text-lg rounded-[16px] bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
                      data-testid="button-verify-otp"
                    >
                      {authLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "인증하기"
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={sendOtpCode}
                      className="w-full text-center text-sm text-[#8B95A1] hover:text-[#3182F6] transition-colors"
                      data-testid="button-resend-otp"
                    >
                      인증 코드 다시 받기
                    </button>
                  </form>
                )}

                <Link href="/login/email" className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#E5E8EB] hover:border-[#3182F6]/30 hover:bg-[#F9FAFB] transition-all" data-testid="link-email-password-login">
                  <Lock className="h-5 w-5 text-[#8B95A1]" />
                  <span className="text-sm text-[#4E5968] font-medium">이메일/비밀번호로 로그인</span>
                </Link>

                <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#F9FAFB]">
                  <Sparkles className="h-5 w-5 text-[#3182F6]" />
                  <span className="text-sm text-[#4E5968]">
                    신규 가입 시 무료 학습권 <span className="font-bold text-[#3182F6]">1000개</span> 제공
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-sm text-[#8B95A1]">
            &copy; 2025 Konnect.careers. All rights reserved.
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}
