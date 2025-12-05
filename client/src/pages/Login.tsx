import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { Mail, Lock, User, Loader2, CheckCircle, AlertCircle, Sparkles, ArrowLeft, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";

type AuthMode = "login" | "register" | "magic";

export default function Login() {
  const { isAuthenticated, login, register, sendMagicLink } = useAuth();
  const [, setLocation] = useLocation();
  
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showMagicLinkHint, setShowMagicLinkHint] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    if (errorParam === "invalid_token") {
      setError("유효하지 않은 링크입니다. 다시 시도해 주세요.");
    } else if (errorParam === "expired_token") {
      setError("링크가 만료되었습니다. 다시 요청해 주세요.");
    } else if (errorParam === "verification_failed") {
      setError("인증에 실패했습니다. 다시 시도해 주세요.");
    }
  }, []);

  const resetForm = () => {
    setError(null);
    setSuccess(null);
    setShowMagicLinkHint(false);
  };

  const handleModeChange = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    setIsLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      setLocation("/dashboard");
    } else {
      setError(result.error || "로그인에 실패했습니다.");
      if (result.useMagicLink) {
        setShowMagicLinkHint(true);
      }
    }
    
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    setIsLoading(true);
    
    const result = await register(email, password, firstName, lastName);
    
    if (result.success) {
      setLocation("/dashboard");
    } else {
      setError(result.error || "회원가입에 실패했습니다.");
    }
    
    setIsLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    setIsLoading(true);
    
    const result = await sendMagicLink(email);
    
    if (result.success) {
      setSuccess("로그인 링크가 이메일로 발송되었습니다. 이메일을 확인해 주세요.");
    } else {
      setError(result.error || "매직 링크 발송에 실패했습니다.");
    }
    
    setIsLoading(false);
  };

  const modeConfig = {
    login: {
      title: "로그인",
      subtitle: "이메일과 비밀번호로 로그인하세요",
      buttonText: "로그인",
      onSubmit: handleLogin,
    },
    register: {
      title: "회원가입",
      subtitle: "계정을 만들고 무료 크레딧 10개를 받으세요",
      buttonText: "가입하기",
      onSubmit: handleRegister,
    },
    magic: {
      title: "매직 링크",
      subtitle: "비밀번호 없이 이메일로 로그인하세요",
      buttonText: "로그인 링크 받기",
      onSubmit: handleMagicLink,
    },
  };

  const config = modeConfig[mode];

  return (
    <Layout hideNav>
      <div className="min-h-screen flex items-center justify-center bg-[#F2F4F6] relative overflow-hidden font-sans">
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
            >
              <span className="text-3xl font-bold">K</span>
            </button>
            <h1 className="text-3xl font-bold tracking-tight text-[#191F28]">Konnect</h1>
            <p className="text-[#8B95A1] mt-2">AI 기반 커리어 인텔리전스 플랫폼</p>
          </div>

          <Card className="toss-card border-none shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-[24px] overflow-hidden bg-white">
            <CardHeader className="space-y-2 pt-8 px-8 pb-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardTitle className="text-2xl font-bold text-[#191F28]">
                    {config.title}
                  </CardTitle>
                  <CardDescription className="text-[#8B95A1] text-base mt-1">
                    {config.subtitle}
                  </CardDescription>
                </motion.div>
              </AnimatePresence>
            </CardHeader>
            
            <CardContent className="px-8 pb-8">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Alert variant="destructive" className="mb-6 rounded-xl border-red-100 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-600">{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
                
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Alert className="mb-6 rounded-xl border-green-100 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-700">{success}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.form
                  key={mode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={config.onSubmit}
                  className="space-y-5"
                >
                  {mode === "register" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name" className="text-[#4E5968] font-medium">성</Label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#B0B8C1]" />
                          <Input
                            id="first-name"
                            type="text"
                            placeholder="김"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="pl-12 h-14 rounded-xl border-[#E5E8EB] bg-[#F9FAFB] focus:bg-white focus:border-[#3182F6] transition-all text-base"
                            data-testid="input-first-name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name" className="text-[#4E5968] font-medium">이름</Label>
                        <Input
                          id="last-name"
                          type="text"
                          placeholder="진로"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="h-14 rounded-xl border-[#E5E8EB] bg-[#F9FAFB] focus:bg-white focus:border-[#3182F6] transition-all text-base"
                          data-testid="input-last-name"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#4E5968] font-medium">이메일</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#B0B8C1]" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-14 rounded-xl border-[#E5E8EB] bg-[#F9FAFB] focus:bg-white focus:border-[#3182F6] transition-all text-base"
                        required
                        data-testid={`input-${mode}-email`}
                      />
                    </div>
                  </div>

                  {(mode === "login" || mode === "register") && (
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-[#4E5968] font-medium">비밀번호</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#B0B8C1]" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="8자 이상 입력"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-12 h-14 rounded-xl border-[#E5E8EB] bg-[#F9FAFB] focus:bg-white focus:border-[#3182F6] transition-all text-base"
                          required
                          minLength={8}
                          data-testid={`input-${mode}-password`}
                        />
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg rounded-[16px] bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] mt-2"
                    disabled={isLoading}
                    data-testid={`button-${mode}`}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : null}
                    {config.buttonText}
                    {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                  </Button>
                </motion.form>
              </AnimatePresence>

              {showMagicLinkHint && mode === "login" && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-center text-[#8B95A1] mt-4"
                >
                  비밀번호 없이 가입하셨나요?{" "}
                  <button 
                    onClick={() => handleModeChange("magic")}
                    className="text-[#3182F6] hover:underline font-medium"
                  >
                    매직 링크로 로그인
                  </button>
                </motion.p>
              )}

              {mode === "magic" && (
                <p className="text-sm text-center text-[#8B95A1] mt-4 leading-relaxed">
                  이메일로 전송된 링크를 클릭하면 자동 로그인됩니다.<br />
                  <span className="text-[#3182F6]">처음 사용 시 자동으로 계정이 생성됩니다.</span>
                </p>
              )}

              {mode === "register" && (
                <div className="flex items-center justify-center gap-2 mt-4 py-3 px-4 rounded-xl bg-[#F9FAFB]">
                  <Sparkles className="h-5 w-5 text-[#3182F6]" />
                  <span className="text-sm text-[#4E5968]">가입 즉시 무료 크레딧 <span className="font-bold text-[#3182F6]">10개</span> 제공</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 flex items-center justify-center gap-2">
            {mode !== "login" && (
              <button
                onClick={() => handleModeChange("login")}
                className="flex items-center gap-1 text-sm text-[#8B95A1] hover:text-[#4E5968] transition-colors"
                data-testid="link-to-login"
              >
                <ArrowLeft className="h-4 w-4" />
                로그인으로 돌아가기
              </button>
            )}
          </div>

          <div className="mt-8 flex items-center justify-center gap-6">
            {mode === "login" && (
              <>
                <button
                  onClick={() => handleModeChange("register")}
                  className="text-sm text-[#8B95A1] hover:text-[#3182F6] transition-colors"
                  data-testid="link-to-register"
                >
                  계정 만들기
                </button>
                <span className="text-[#E5E8EB]">|</span>
                <button
                  onClick={() => handleModeChange("magic")}
                  className="text-sm text-[#8B95A1] hover:text-[#3182F6] transition-colors"
                  data-testid="link-to-magic"
                >
                  비밀번호 없이 로그인
                </button>
              </>
            )}
          </div>

          <p className="mt-8 text-center text-sm text-[#8B95A1]">
            &copy; 2025 Konnect.careers. All rights reserved.
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}
