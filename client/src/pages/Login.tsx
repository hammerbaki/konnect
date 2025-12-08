import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, Sparkles, Mail, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const { isAuthenticated, isLoading, signInWithGoogle, signInWithGithub, signInWithApple, signInWithEmail, signUpWithEmail } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthLoading(true);

    try {
      const { error } = isSignUp 
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        } else if (error.message.includes("Email not confirmed")) {
          setError("이메일 인증이 필요합니다. 메일함을 확인해주세요.");
        } else if (error.message.includes("User already registered")) {
          setError("이미 가입된 이메일입니다. 로그인해주세요.");
        } else {
          setError(error.message);
        }
      } else if (isSignUp) {
        setError("인증 메일이 발송되었습니다. 메일함을 확인해주세요.");
      }
    } catch (err) {
      setError("인증 중 오류가 발생했습니다.");
    } finally {
      setAuthLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout hideNav>
        <div className="min-h-screen flex items-center justify-center bg-[#F2F4F6]">
          <Loader2 className="h-8 w-8 animate-spin text-[#3182F6]" />
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
              className="inline-flex items-center justify-center h-16 w-16 rounded-[22px] bg-[#3182F6] text-white mb-6 shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
              data-testid="button-home"
            >
              <span className="text-3xl font-bold">K</span>
            </button>
            <h1 className="text-3xl font-bold tracking-tight text-[#191F28]">Konnect</h1>
            <p className="text-[#8B95A1] mt-2">AI 기반 커리어 인텔리전스 플랫폼</p>
          </div>

          <Card className="toss-card border-none shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-[24px] overflow-hidden bg-white">
            <CardHeader className="space-y-2 pt-8 px-8 pb-4">
              <CardTitle className="text-2xl font-bold text-[#191F28]">
                {isSignUp ? "회원가입" : "로그인"}
              </CardTitle>
              <CardDescription className="text-[#8B95A1] text-base mt-1">
                {isSignUp ? "새 계정을 만들어 시작하세요" : "계정에 로그인하세요"}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-8 pb-8">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    onClick={signInWithGoogle}
                    className="h-14 rounded-[16px] border-[#E5E8EB] hover:bg-[#F9FAFB] hover:border-[#3182F6]/30 transition-all"
                    data-testid="button-google"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={signInWithApple}
                    className="h-14 rounded-[16px] border-[#E5E8EB] hover:bg-[#F9FAFB] hover:border-[#3182F6]/30 transition-all"
                    data-testid="button-apple"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#000">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={signInWithGithub}
                    className="h-14 rounded-[16px] border-[#E5E8EB] hover:bg-[#F9FAFB] hover:border-[#3182F6]/30 transition-all"
                    data-testid="button-github"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#333">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[#E5E8EB]" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-[#8B95A1]">또는</span>
                  </div>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
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
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="비밀번호를 입력하세요"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-14 pl-4 pr-12 rounded-[16px] border-[#E5E8EB] focus:border-[#3182F6] focus:ring-[#3182F6]/20"
                        data-testid="input-password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B95A1] hover:text-[#4E5968]"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p className={`text-sm ${error.includes("발송") ? "text-[#3182F6]" : "text-red-500"}`}>
                      {error}
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
                    ) : isSignUp ? (
                      "가입하기"
                    ) : (
                      "로그인"
                    )}
                  </Button>
                </form>

                <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#F9FAFB]">
                  <Sparkles className="h-5 w-5 text-[#3182F6]" />
                  <span className="text-sm text-[#4E5968]">
                    신규 가입 시 무료 크레딧 <span className="font-bold text-[#3182F6]">10개</span> 제공
                  </span>
                </div>

                <p className="text-center text-sm text-[#8B95A1]">
                  {isSignUp ? "이미 계정이 있으신가요?" : "계정이 없으신가요?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError(null);
                    }}
                    className="text-[#3182F6] font-medium hover:underline"
                    data-testid="button-toggle-auth"
                  >
                    {isSignUp ? "로그인" : "회원가입"}
                  </button>
                </p>
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
