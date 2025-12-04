import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, Mail, User, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Terms states
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsScrolled, setIsTermsScrolled] = useState(false);
  const [isPrivacyScrolled, setIsPrivacyScrolled] = useState(false);

  // Forgot Password
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const termsRef = useRef<HTMLDivElement>(null);
  const privacyRef = useRef<HTMLDivElement>(null);

  // Scroll detection for Terms
  const handleTermsScroll = () => {
    if (termsRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = termsRef.current;
      if (scrollHeight - scrollTop <= clientHeight + 50) { // 50px buffer
        setIsTermsScrolled(true);
      }
    }
  };

  // Scroll detection for Privacy
  const handlePrivacyScroll = () => {
    if (privacyRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = privacyRef.current;
      if (scrollHeight - scrollTop <= clientHeight + 50) { // 50px buffer
        setIsPrivacyScrolled(true);
      }
    }
  };

  // Reset scroll state when modals open
  useEffect(() => {
    if (isTermsModalOpen) setIsTermsScrolled(false);
  }, [isTermsModalOpen]);

  useEffect(() => {
    if (isPrivacyModalOpen) setIsPrivacyScrolled(false);
  }, [isPrivacyModalOpen]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validation
    if (!email || !password || (!isLogin && !name)) {
        setError("모든 필드를 입력해주세요.");
        setIsLoading(false);
        return;
    }

    if (!isLogin && (!termsAgreed || !privacyAgreed)) {
        setError("필수 약관에 모두 동의해주세요.");
        setIsLoading(false);
        return;
    }

    // Mock auth
    setTimeout(() => {
        setLocation("/dashboard");
    }, 1000);
  };

  const handleForgotPassword = () => {
      if (!resetEmail) {
          toast({
              title: "이메일 입력",
              description: "비밀번호를 재설정할 이메일을 입력해주세요.",
              variant: "destructive"
          });
          return;
      }
      toast({
          title: "이메일 발송 완료",
          description: `${resetEmail}로 비밀번호 재설정 링크를 보냈습니다.`,
      });
      setIsForgotPasswordOpen(false);
      setResetEmail("");
  };

  const TermsContent = () => (
      <div className="text-sm text-[#4E5968] space-y-4">
          <p><strong>제 1 조 (목적)</strong><br/>이 약관은 Konnect(이하 "회사")가 제공하는 커리어 인텔리전스 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 회원의 권리, 의무 및 책임사항 등 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
          <p><strong>제 2 조 (용어의 정의)</strong><br/>1. "서비스"라 함은 구현되는 단말기(PC, TV, 휴대형단말기 등의 각종 유무선 장치를 포함)와 상관없이 "회원"이 이용할 수 있는 Konnect 및 Konnect 관련 제반 서비스를 의미합니다.<br/>2. "회원"이라 함은 회사의 "서비스"에 접속하여 이 약관에 따라 "회사"와 이용계약을 체결하고 "회사"가 제공하는 "서비스"를 이용하는 고객을 말합니다.</p>
          <p><strong>제 3 조 (약관의 게시와 개정)</strong><br/>1. "회사"는 이 약관의 내용을 "회원"이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.<br/>2. "회사"는 "약관의 규제에 관한 법률", "정보통신망 이용촉진 및 정보보호 등에 관한 법률(이하 "정보통신망법")" 등 관련법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</p>
          <p><strong>제 4 조 (서비스의 제공 및 변경)</strong><br/>1. 회사는 회원에게 아래와 같은 서비스를 제공합니다.<br/>  - 커리어 분석 및 진단 서비스<br/>  - 채용 정보 제공 서비스<br/>  - 기타 회사가 추가 개발하거나 다른 회사와의 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스<br/>2. 회사는 상당한 이유가 있는 경우에 운영상, 기술상의 필요에 따라 제공하고 있는 전부 또는 일부 서비스를 변경할 수 있습니다.</p>
          <p><strong>제 5 조 (서비스의 중단)</strong><br/>1. 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</p>
          <p><strong>제 6 조 (회원가입)</strong><br/>1. 이용자는 "회사"가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.</p>
          <p>이하 생략... (스크롤하여 확인해주세요)</p>
          <div className="h-20 bg-gradient-to-t from-white/10 to-transparent"></div>
          <p><strong>제 7 조 (개인정보보호 의무)</strong><br/>"회사"는 "정보통신망법" 등 관계 법령이 정하는 바에 따라 "회원"의 개인정보를 보호하기 위해 노력합니다. 개인정보의 보호 및 사용에 대해서는 관련법 및 "회사"의 개인정보처리방침이 적용됩니다.</p>
          <p><strong>부칙</strong><br/>1. 이 약관은 2025년 1월 1일부터 시행합니다.</p>
      </div>
  );

  const PrivacyContent = () => (
      <div className="text-sm text-[#4E5968] space-y-4">
          <p><strong>1. 개인정보의 수집 및 이용 목적</strong><br/>Konnect는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
          <p>가. 홈페이지 회원 가입 및 관리<br/>회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 제한적 본인확인제 시행에 따른 본인확인, 서비스 부정이용 방지, 만 14세 미만 아동의 개인정보 처리시 법정대리인의 동의여부 확인, 각종 고지·통지, 고충처리 등을 목적으로 개인정보를 처리합니다.</p>
          <p>나. 재화 또는 서비스 제공<br/>물품배송, 서비스 제공, 계약서·청구서 발송, 콘텐츠 제공, 맞춤서비스 제공, 본인인증, 연령인증, 요금결제·정산, 채권추심 등을 목적으로 개인정보를 처리합니다.</p>
          <p><strong>2. 수집하는 개인정보의 항목</strong><br/>회사는 회원가입, 상담, 서비스 신청 등등을 위해 아래와 같은 개인정보를 수집하고 있습니다.<br/>- 수집항목 : 이름, 생년월일, 성별, 로그인ID, 비밀번호, 자택 전화번호, 자택 주소, 휴대전화번호, 이메일, 직업, 회사명, 부서, 직책, 법정대리인정보, 주민등록번호, 신용카드정보, 은행계좌정보, 서비스 이용기록, 접속 로그, 쿠키, 접속 IP 정보, 결제기록</p>
          <p><strong>3. 개인정보의 보유 및 이용기간</strong><br/>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
          <p>이하 생략... (스크롤하여 확인해주세요)</p>
          <div className="h-20 bg-gradient-to-t from-white/10 to-transparent"></div>
          <p><strong>4. 개인정보의 파기절차 및 방법</strong><br/>회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체없이 파기합니다.</p>
      </div>
  );

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
                {/* Forgot Password Link */}
                {isLogin && (
                    <div className="flex justify-end mt-2">
                        <button 
                            type="button"
                            onClick={() => setIsForgotPasswordOpen(true)}
                            className="text-sm text-[#8B95A1] hover:text-[#3182F6] font-medium"
                        >
                            비밀번호 찾기
                        </button>
                    </div>
                )}
              </div>

              {/* Terms and Privacy Checkboxes (Only for Register) */}
              {!isLogin && (
                  <div className="space-y-3 pt-2">
                      <div className="flex items-center space-x-2">
                          <Checkbox 
                              id="terms" 
                              checked={termsAgreed} 
                              onCheckedChange={(checked) => {
                                  if (checked && !termsAgreed) {
                                      // Only open if checking (not unchecking)
                                      setIsTermsModalOpen(true);
                                  } else {
                                      setTermsAgreed(!!checked);
                                  }
                              }}
                              className="data-[state=checked]:bg-[#3182F6] border-[#B0B8C1]"
                          />
                          <label 
                              htmlFor="terms" 
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[#4E5968] cursor-pointer hover:text-[#3182F6]"
                              onClick={(e) => {
                                  e.preventDefault();
                                  setIsTermsModalOpen(true);
                              }}
                          >
                              (필수) 이용약관에 동의합니다
                          </label>
                      </div>
                      <div className="flex items-center space-x-2">
                          <Checkbox 
                              id="privacy" 
                              checked={privacyAgreed}
                              onCheckedChange={(checked) => {
                                  if (checked && !privacyAgreed) {
                                      setIsPrivacyModalOpen(true);
                                  } else {
                                      setPrivacyAgreed(!!checked);
                                  }
                              }}
                              className="data-[state=checked]:bg-[#3182F6] border-[#B0B8C1]"
                          />
                          <label 
                              htmlFor="privacy" 
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[#4E5968] cursor-pointer hover:text-[#3182F6]"
                              onClick={(e) => {
                                  e.preventDefault();
                                  setIsPrivacyModalOpen(true);
                              }}
                          >
                              (필수) 개인정보 수집 및 이용에 동의합니다
                          </label>
                      </div>
                  </div>
              )}
              
              {error && (
                <div className="flex items-center gap-2 text-[#E44E48] bg-red-50 p-3 rounded-xl text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4 px-8 pb-8">
              <Button 
                className="w-full h-14 text-lg rounded-[20px] bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:bg-[#B0B8C1] disabled:shadow-none" 
                type="submit" 
                disabled={isLoading || (!isLogin && (!termsAgreed || !privacyAgreed))}
              >
                {isLoading ? "처리중..." : (isLogin ? "로그인" : "시작하기")}
                {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
              
              <div className="text-center text-base text-[#8B95A1]">
                {isLogin ? "계정이 없으신가요? " : "이미 계정이 있으신가요? "}
                <button 
                  type="button"
                  onClick={() => {
                      setIsLogin(!isLogin);
                      setError("");
                  }} 
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

      {/* Forgot Password Modal */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-[#191F28]">비밀번호 찾기</DialogTitle>
                  <DialogDescription>
                      가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
                  </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                  <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-[#4E5968]">이메일</Label>
                      <Input 
                          id="reset-email" 
                          placeholder="name@example.com" 
                          className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                      />
                  </div>
              </div>
              <DialogFooter>
                  <Button onClick={handleForgotPassword} className="w-full h-12 rounded-xl bg-[#3182F6] font-bold text-lg">
                      링크 보내기
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Terms Modal */}
      <Dialog open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen}>
          <DialogContent className="sm:max-w-lg rounded-2xl max-h-[80vh] flex flex-col">
              <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-[#191F28]">이용약관</DialogTitle>
                  <DialogDescription>서비스 이용을 위해 약관 내용을 확인해주세요.</DialogDescription>
              </DialogHeader>
              <div 
                  ref={termsRef}
                  onScroll={handleTermsScroll}
                  className="flex-1 overflow-y-auto p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E8EB] my-2"
              >
                  <TermsContent />
              </div>
              <DialogFooter>
                  <Button 
                      onClick={() => {
                          setTermsAgreed(true);
                          setIsTermsModalOpen(false);
                      }} 
                      disabled={!isTermsScrolled}
                      className="w-full h-12 rounded-xl bg-[#3182F6] font-bold text-lg disabled:bg-[#B0B8C1]"
                  >
                      {isTermsScrolled ? "동의합니다" : "약관을 끝까지 읽어주세요"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Privacy Modal */}
      <Dialog open={isPrivacyModalOpen} onOpenChange={setIsPrivacyModalOpen}>
          <DialogContent className="sm:max-w-lg rounded-2xl max-h-[80vh] flex flex-col">
              <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-[#191F28]">개인정보 처리방침</DialogTitle>
                  <DialogDescription>개인정보 수집 및 이용에 대한 내용을 확인해주세요.</DialogDescription>
              </DialogHeader>
              <div 
                  ref={privacyRef}
                  onScroll={handlePrivacyScroll}
                  className="flex-1 overflow-y-auto p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E8EB] my-2"
              >
                  <PrivacyContent />
              </div>
              <DialogFooter>
                  <Button 
                      onClick={() => {
                          setPrivacyAgreed(true);
                          setIsPrivacyModalOpen(false);
                      }} 
                      disabled={!isPrivacyScrolled}
                      className="w-full h-12 rounded-xl bg-[#3182F6] font-bold text-lg disabled:bg-[#B0B8C1]"
                  >
                      {isPrivacyScrolled ? "동의합니다" : "내용을 끝까지 읽어주세요"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
