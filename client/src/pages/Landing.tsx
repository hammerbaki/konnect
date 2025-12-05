import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Target, FileText, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, navigateToLogin } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F4F6]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3182F6]"></div>
      </div>
    );
  }

  const features = [
    {
      icon: Sparkles,
      title: "AI 커리어 분석",
      description: "프로필 기반 맞춤형 진로 분석"
    },
    {
      icon: Target,
      title: "목표 관리 (Kompass)",
      description: "비전부터 일일 목표까지 체계적 관리"
    },
    {
      icon: FileText,
      title: "자기소개서 생성",
      description: "AI가 작성하는 맞춤형 자기소개서"
    }
  ];

  return (
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
              반가워요 👋
            </CardTitle>
            <CardDescription className="text-[#8B95A1] text-base">
              커리어 대시보드에 접속하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#F9FAFB]"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#3182F6]/10">
                    <feature.icon className="w-5 h-5 text-[#3182F6]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#191F28] text-sm">{feature.title}</p>
                    <p className="text-xs text-[#8B95A1]">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              className="w-full h-14 text-lg rounded-[20px] bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]" 
              onClick={navigateToLogin}
              data-testid="button-login"
            >
              시작하기
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-[#8B95A1]">
              <Mail className="w-4 h-4" />
              <span>이메일로 간편하게 로그인</span>
            </div>
          </CardContent>
        </Card>
        
        <p className="mt-8 text-center text-sm text-[#8B95A1]">
          &copy; 2025 Konnect.careers. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
