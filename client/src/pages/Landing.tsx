import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, Mail, User, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Mock auth
    setTimeout(() => {
      if (email && password) {
        setLocation("/dashboard");
      } else {
        setError("모든 필드를 입력해주세요.");
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F4F6] relative overflow-hidden font-sans">
      {/* Background Abstract Shapes */}
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
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-[22px] bg-[#3182F6] text-white mb-6 shadow-lg shadow-blue-500/20">
            <span className="text-3xl font-bold">K</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#191F28]">Konnect</h1>
          <p className="text-[#8B95A1] mt-2 text-lg">AI 기반 커리어 인텔리전스 플랫폼</p>
        </div>

        <Card className="toss-card border-none shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-[24px] overflow-hidden">
          <CardHeader className="space-y-2 pt-8 px-8">
            <CardTitle className="text-2xl font-bold text-[#191F28]">
              {isLogin ? "반가워요 👋" : "회원가입"}
            </CardTitle>
            <CardDescription className="text-[#8B95A1] text-base">
              {isLogin ? "커리어 대시보드에 접속하세요." : "성공적인 커리어 여정을 시작해보세요."}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 px-8 pb-8">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#4E5968] font-semibold">이름</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 h-5 w-5 text-[#B0B8C1]" />
                    <Input 
                      id="name"
                      className="pl-11 h-12 bg-[#F2F4F6] border-none rounded-xl text-base focus-visible:ring-[#3182F6]" 
                      placeholder="홍길동" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#4E5968] font-semibold">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-[#B0B8C1]" />
                  <Input 
                    id="email"
                    type="email"
                    className="pl-11 h-12 bg-[#F2F4F6] border-none rounded-xl text-base focus-visible:ring-[#3182F6]" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[#4E5968] font-semibold">비밀번호</Label>
                  {isLogin && (
                    <a href="#" className="text-sm text-[#8B95A1] hover:text-[#3182F6]">비밀번호 찾기</a>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-[#B0B8C1]" />
                  <Input 
                    id="password"
                    type="password"
                    className="pl-11 h-12 bg-[#F2F4F6] border-none rounded-xl text-base focus-visible:ring-[#3182F6]" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              
              {error && (
                <div className="flex items-center gap-2 text-[#E44E48] bg-red-50 p-3 rounded-xl text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4 px-8 pb-8">
              <Button className="w-full h-14 text-lg rounded-[20px] bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]" type="submit" disabled={isLoading}>
                {isLoading ? "처리중..." : (isLogin ? "로그인" : "시작하기")}
                {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
              
              <div className="text-center text-base text-[#8B95A1]">
                {isLogin ? "계정이 없으신가요? " : "이미 계정이 있으신가요? "}
                <button 
                  type="button"
                  onClick={() => setIsLogin(!isLogin)} 
                  className="text-[#3182F6] font-semibold hover:underline focus:outline-none"
                >
                  {isLogin ? "회원가입" : "로그인"}
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
        
        <p className="mt-8 text-center text-sm text-[#8B95A1]">
          &copy; 2025 Konnect.careers. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
