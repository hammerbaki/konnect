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
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden font-sans py-8">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, #320e9d0a 0%, transparent 70%)" }} />
            <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, #ea6a640a 0%, transparent 70%)" }} />
          </div>
          <div className="z-10 w-full max-w-md px-4">
            <div className="text-center mb-8">
              <Skeleton className="h-16 w-16 rounded-[22px] mx-auto mb-6" />
              <Skeleton className="h-9 w-32 mx-auto mb-2" />
              <Skeleton className="h-5 w-48 mx-auto" />
            </div>
            <div className="bg-card rounded-2xl shadow-[0_8px_30px_rgba(50,14,157,0.08)] p-8 border border-border">
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
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden font-sans py-8">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, #320e9d0a 0%, transparent 70%)" }} />
          <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, #ea6a640a 0%, transparent 70%)" }} />
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
                alt="Konnect — 꿈을 잇다" 
                className="h-14 w-auto mx-auto"
              />
            </button>
            <p className="mt-3 text-sm text-dream font-medium">꿈을 잇다.</p>
          </div>

          <Card className="border border-border shadow-[0_8px_40px_rgba(50,14,157,0.08)] rounded-2xl overflow-hidden bg-card">
            <CardHeader className="space-y-1 pt-8 px-8 pb-4">
              <CardTitle className="text-2xl font-bold text-foreground">
                로그인
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm mt-1">
                계정에 로그인하여 꿈을 이어가세요
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-8 pb-8">
              <div className="space-y-4">

                {!showOtpInput ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground/80 font-medium text-sm">
                        이메일
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 pl-11 rounded-xl border-border focus:border-dream focus:ring-dream/20"
                          data-testid="input-email"
                          required
                        />
                      </div>
                    </div>

                    {message && (
                      <p className={`text-sm ${message.type === "success" ? "text-dream" : "text-destructive"}`}>
                        {message.text}
                      </p>
                    )}

                    <Button 
                      type="submit"
                      disabled={authLoading}
                      className="w-full h-12 text-base rounded-xl text-white font-semibold transition-all hover:scale-[1.01] shadow-[0_4px_16px_rgba(50,14,157,0.25)]"
                      style={{ background: "linear-gradient(135deg, #320e9d, #4a16e0)" }}
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
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-back"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="text-sm">이메일 변경</span>
                    </button>

                    <div className="p-4 rounded-xl bg-dream/5 border border-dream/10">
                      <p className="text-sm text-foreground/80">
                        <span className="font-semibold text-dream">{email}</span>
                        <span className="block mt-1 text-muted-foreground">으로 발송된 인증 코드를 입력해주세요.</span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-foreground/80 font-medium text-sm">
                        인증 코드
                      </Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="6자리 인증 코드"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="h-12 text-center text-xl tracking-[0.5em] rounded-xl border-border focus:border-dream focus:ring-dream/20"
                        data-testid="input-otp"
                        maxLength={6}
                        required
                      />
                    </div>

                    {message && (
                      <p className={`text-sm ${message.type === "success" ? "text-dream" : "text-destructive"}`}>
                        {message.text}
                      </p>
                    )}

                    <Button 
                      type="submit"
                      disabled={authLoading || otpCode.length < 6}
                      className="w-full h-12 text-base rounded-xl text-white font-semibold transition-all hover:scale-[1.01] shadow-[0_4px_16px_rgba(50,14,157,0.25)]"
                      style={{ background: "linear-gradient(135deg, #320e9d, #4a16e0)" }}
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
                      className="w-full text-center text-sm text-muted-foreground hover:text-dream transition-colors"
                      data-testid="button-resend-otp"
                    >
                      인증 코드 다시 받기
                    </button>
                  </form>
                )}

                <Link href="/login/email" className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border hover:border-dream/30 hover:bg-dream/5 transition-all" data-testid="link-email-password-login">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground/70 font-medium">이메일/비밀번호로 로그인</span>
                </Link>

                <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-dream/5 border border-dream/10">
                  <Sparkles className="h-4 w-4 text-gold" />
                  <span className="text-sm text-foreground/70">
                    신규 가입 시 무료 학습권 <span className="font-bold text-dream">1,000개</span> 제공
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            © 2026 Konnect — 꿈을 잇다. All rights reserved.
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}
