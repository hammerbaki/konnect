import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { Mail, Lock, User, Loader2, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const { isAuthenticated, login, register, sendMagicLink } = useAuth();
  const [, setLocation] = useLocation();
  
  const [activeTab, setActiveTab] = useState("login");
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
      setLocation("/");
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      setLocation("/");
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
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    const result = await register(email, password, firstName, lastName);
    
    if (result.success) {
      setLocation("/");
    } else {
      setError(result.error || "회원가입에 실패했습니다.");
    }
    
    setIsLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    const result = await sendMagicLink(email);
    
    if (result.success) {
      setSuccess("로그인 링크가 이메일로 발송되었습니다. 이메일을 확인해 주세요.");
    } else {
      setError(result.error || "매직 링크 발송에 실패했습니다.");
    }
    
    setIsLoading(false);
  };

  return (
    <Layout hideNav>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F9FAFB] to-white p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3182F6] to-[#1e6ce0] text-white mb-4 shadow-lg">
              <Sparkles className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-[#191F28]">Konnect</h1>
            <p className="text-[#8B95A1] mt-2">AI 진로 가이드 플랫폼</p>
          </div>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl text-center">환영합니다</CardTitle>
              <CardDescription className="text-center">
                로그인하여 맞춤형 진로 분석을 시작하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="login" data-testid="tab-login">로그인</TabsTrigger>
                  <TabsTrigger value="register" data-testid="tab-register">회원가입</TabsTrigger>
                  <TabsTrigger value="magic" data-testid="tab-magic">매직 링크</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">이메일</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A1]" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                          data-testid="input-login-email"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">비밀번호</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A1]" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="8자 이상"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          required
                          minLength={8}
                          data-testid="input-login-password"
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-[#3182F6] hover:bg-[#1e6ce0]"
                      disabled={isLoading}
                      data-testid="button-login"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      로그인
                    </Button>
                  </form>
                  
                  {showMagicLinkHint && (
                    <p className="text-sm text-center text-[#8B95A1] mt-4">
                      비밀번호 없이 가입하셨나요?{" "}
                      <button 
                        onClick={() => setActiveTab("magic")}
                        className="text-[#3182F6] hover:underline"
                      >
                        매직 링크로 로그인
                      </button>
                    </p>
                  )}
                </TabsContent>
                
                <TabsContent value="register" className="space-y-4">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">성</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A1]" />
                          <Input
                            id="first-name"
                            type="text"
                            placeholder="김"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="pl-10"
                            data-testid="input-first-name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">이름</Label>
                        <Input
                          id="last-name"
                          type="text"
                          placeholder="진로"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          data-testid="input-last-name"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">이메일</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A1]" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                          data-testid="input-register-email"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">비밀번호</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A1]" />
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="8자 이상"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          required
                          minLength={8}
                          data-testid="input-register-password"
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-[#3182F6] hover:bg-[#1e6ce0]"
                      disabled={isLoading}
                      data-testid="button-register"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      가입하기
                    </Button>
                  </form>
                  <p className="text-xs text-center text-[#8B95A1]">
                    가입 시 무료 크레딧 10개가 제공됩니다 ✨
                  </p>
                </TabsContent>
                
                <TabsContent value="magic" className="space-y-4">
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="magic-email">이메일</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A1]" />
                        <Input
                          id="magic-email"
                          type="email"
                          placeholder="email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                          data-testid="input-magic-email"
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-[#3182F6] hover:bg-[#1e6ce0]"
                      disabled={isLoading}
                      data-testid="button-magic-link"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      로그인 링크 받기
                    </Button>
                  </form>
                  <p className="text-sm text-center text-[#8B95A1]">
                    비밀번호 없이 이메일로 로그인하세요.<br />
                    처음 사용 시 자동으로 계정이 생성됩니다.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
