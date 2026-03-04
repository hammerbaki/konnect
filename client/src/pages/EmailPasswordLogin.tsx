import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, Sparkles, Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function EmailPasswordLogin() {
  const { isAuthenticated, isLoading, signInWithPassword, signUpWithPassword } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setAuthLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setMessage({ type: "error", text: "비밀번호가 일치하지 않습니다." });
          setAuthLoading(false);
          return;
        }
        if (password.length < 6) {
          setMessage({ type: "error", text: "비밀번호는 6자 이상이어야 합니다." });
          setAuthLoading(false);
          return;
        }
        const { error } = await signUpWithPassword(email, password);
        if (error) {
          if (error.message.includes("already registered")) {
            setMessage({ type: "error", text: "이미 가입된 이메일입니다." });
          } else {
            setMessage({ type: "error", text: "회원가입에 실패했습니다. 다시 시도해주세요." });
          }
        } else {
          setMessage({ type: "success", text: "이메일로 인증 링크가 발송되었습니다. 이메일을 확인해주세요." });
        }
      } else {
        const { error } = await signInWithPassword(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            setMessage({ type: "error", text: "이메일 또는 비밀번호가 올바르지 않습니다." });
          } else {
            setMessage({ type: "error", text: "로그인에 실패했습니다. 다시 시도해주세요." });
          }
        }
      }
    } catch (err) {
      setMessage({ type: "error", text: "오류가 발생했습니다. 다시 시도해주세요." });
    } finally {
      setAuthLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setMessage(null);
    setPassword("");
    setConfirmPassword("");
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
              <Link href="/login" className="flex items-center gap-2 text-[#8B95A1] hover:text-[#4E5968] transition-colors mb-2" data-testid="link-back-login">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">다른 방법으로 로그인</span>
              </Link>
              <CardTitle className="text-2xl font-bold text-[#191F28]">
                {isSignUp ? "회원가입" : "이메일 로그인"}
              </CardTitle>
              <CardDescription className="text-[#8B95A1] text-base mt-1">
                {isSignUp ? "이메일과 비밀번호로 가입하세요" : "이메일과 비밀번호로 로그인하세요"}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#4E5968] font-medium">
                    비밀번호
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B95A1]" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="비밀번호를 입력하세요"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 pl-12 pr-12 rounded-[16px] border-[#E5E8EB] focus:border-[#3182F6] focus:ring-[#3182F6]/20"
                      data-testid="input-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B95A1] hover:text-[#4E5968]"
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-[#4E5968] font-medium">
                      비밀번호 확인
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B95A1]" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="비밀번호를 다시 입력하세요"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-14 pl-12 rounded-[16px] border-[#E5E8EB] focus:border-[#3182F6] focus:ring-[#3182F6]/20"
                        data-testid="input-confirm-password"
                        required
                      />
                    </div>
                  </div>
                )}

                {message && (
                  <p className={`text-sm ${message.type === "success" ? "text-[#3182F6]" : "text-red-500"}`}>
                    {message.text}
                  </p>
                )}

                <Button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full h-14 text-lg rounded-[16px] bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
                  data-testid="button-submit"
                >
                  {authLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    isSignUp ? "회원가입" : "로그인"
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-sm text-[#8B95A1] hover:text-[#3182F6] transition-colors"
                    data-testid="button-toggle-mode"
                  >
                    {isSignUp ? (
                      <>이미 계정이 있으신가요? <span className="font-medium text-[#3182F6]">로그인</span></>
                    ) : (
                      <>계정이 없으신가요? <span className="font-medium text-[#3182F6]">회원가입</span></>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#F9FAFB]">
                  <Sparkles className="h-5 w-5 text-[#3182F6]" />
                  <span className="text-sm text-[#4E5968]">
                    신규 가입 시 무료 학습권 <span className="font-bold text-[#3182F6]">1000개</span> 제공
                  </span>
                </div>
              </form>
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
