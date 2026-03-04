import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-[#8B95A1] hover:text-[#191F28]" data-testid="link-back-home">
              <ArrowLeft className="h-4 w-4" />
              홈으로 돌아가기
            </Button>
          </Link>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-[#191F28] mb-8" data-testid="text-privacy-title">개인정보처리방침</h1>
          
          <div className="prose prose-gray max-w-none space-y-8 text-[#4E5968]">
            <section>
              <h2 className="text-xl font-bold text-[#191F28] mb-4">1. 개인정보의 수집 및 이용 목적</h2>
              <p>Konnect(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증</li>
                <li>회원 자격 유지·관리, 서비스 부정이용 방지</li>
                <li>AI 기반 진로 분석 및 자기소개서 생성 서비스 제공</li>
                <li>서비스 이용 기록 분석 및 서비스 개선</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#191F28] mb-4">2. 수집하는 개인정보 항목</h2>
              <p>회사는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li><strong>필수 항목:</strong> 이메일 주소, 이름(닉네임)</li>
                <li><strong>선택 항목:</strong> 프로필 사진, 생년월일, 성별, 학력 정보, 경력 정보, 희망 직종</li>
                <li><strong>자동 수집 항목:</strong> IP 주소, 쿠키, 서비스 이용 기록, 접속 로그</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#191F28] mb-4">3. 개인정보의 보유 및 이용 기간</h2>
              <p>회사는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용 기간 내에서 개인정보를 처리·보유합니다.</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>회원 정보: 회원 탈퇴 시까지 (단, 관계 법령에 따라 보존이 필요한 경우 해당 기간까지)</li>
                <li>서비스 이용 기록: 3년</li>
                <li>결제 및 학습권 이용 기록: 5년</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#191F28] mb-4">4. 개인정보의 제3자 제공</h2>
              <p>회사는 정보주체의 개인정보를 제1조에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#191F28] mb-4">5. 개인정보의 파기</h2>
              <p>회사는 개인정보 보유 기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.</li>
                <li>종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#191F28] mb-4">6. 정보주체의 권리·의무 및 행사방법</h2>
              <p>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>개인정보 열람 요구</li>
                <li>오류 등이 있을 경우 정정 요구</li>
                <li>삭제 요구</li>
                <li>처리정지 요구</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#191F28] mb-4">7. 개인정보 보호책임자</h2>
              <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
              <div className="bg-[#F7F8FA] rounded-xl p-4 mt-3">
                <p><strong>개인정보 보호책임자</strong></p>
                <p>이메일: privacy@konnect.careers</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#191F28] mb-4">8. 개인정보처리방침 변경</h2>
              <p>이 개인정보처리방침은 2025년 1월 1일부터 적용됩니다. 이전의 개인정보 처리방침은 아래에서 확인하실 수 있습니다.</p>
            </section>
          </div>
        </div>
        
        <div className="text-center mt-8 text-sm text-[#8B95A1]">
          &copy; 2025 Konnect.careers. All rights reserved.
        </div>
      </div>
    </div>
  );
}
