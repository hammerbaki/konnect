import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
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
          <h1 className="text-3xl font-bold text-[#191F28] mb-8" data-testid="text-terms-title">이용약관</h1>
          
          <div className="prose prose-gray max-w-none space-y-8 text-[#4E5968]">
            <section>
              <h2 className="text-xl font-bold text-[#191F28] mb-4">제1조 (목적)</h2>
              <p>이 약관은 Konnect(이하 "회사")가 제공하는 AI 진로 상담 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#191F28] mb-4">제2조 (정의)</h2>
              <ul className="list-decimal pl-6 mt-3 space-y-2">
                <li>"서비스"란 회사가 제공하는 AI 기반 진로 분석, 자기소개서 생성, 목표 관리 등의 온라인 서비스를 말합니다.</li>
                <li>"회원"이란 회사와 서비스 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.</li>
                <li>"포인트"란 서비스 내에서 AI 기능을 이용하기 위해 필요한 디지털 화폐를 말합니다.</li>
                <li>"기프트 포인트(GP)"란 회사가 무료로 제공하는 포인트로, 유효기간이 있으며 선입선출 방식으로 사용됩니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#191F28] mb-4">제3조 (약관의 효력 및 변경)</h2>
              <ul className="list-decimal pl-6 mt-3 space-y-2">
                <li>이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</li>
                <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</li>
                <li>회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#191F28] mb-4">제4조 (서비스의 제공)</h2>
              <p>회사는 다음과 같은 서비스를 제공합니다.</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>AI 기반 진로 분석 서비스</li>
                <li>AI 자기소개서 생성 및 수정 서비스</li>
                <li>진로 목표 관리(Kompass) 서비스</li>
                <li>직업 정보 탐색 서비스</li>
                <li>기타 회사가 정하는 서비스</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#191F28] mb-4">제5조 (회원가입)</h2>
              <ul className="list-decimal pl-6 mt-3 space-y-2">
                <li>회원가입은 이용자가 약관의 내용에 대하여 동의를 한 다음 회원가입신청을 하고 회사가 이러한 신청에 대하여 승낙함으로써 체결됩니다.</li>
                <li>회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않거나 사후에 이용계약을 해지할 수 있습니다.
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
                    <li>허위의 정보를 기재하거나, 회사가 요구하는 내용을 기재하지 않은 경우</li>
                    <li>이전에 회원자격을 상실한 적이 있는 경우</li>
                  </ul>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#191F28] mb-4">제6조 (포인트 및 결제)</h2>
              <ul className="list-decimal pl-6 mt-3 space-y-2">
                <li>회원은 포인트를 구매하여 AI 서비스를 이용할 수 있습니다.</li>
                <li>기프트 포인트(GP)는 유효기간 내에만 사용 가능하며, 유효기간이 경과하면 자동으로 소멸됩니다.</li>
                <li>포인트는 현금으로 환불되지 않으며, 회원 탈퇴 시 잔여 포인트는 소멸됩니다.</li>
                <li>결제 취소 및 환불은 관련 법령 및 회사 정책에 따릅니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#191F28] mb-4">제7조 (회원의 의무)</h2>
              <p>회원은 다음 행위를 하여서는 안 됩니다.</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>신청 또는 변경 시 허위 내용의 등록</li>
                <li>타인의 정보 도용</li>
                <li>회사가 게시한 정보의 변경</li>
                <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                <li>회사 및 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                <li>서비스를 이용하여 얻은 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하는 행위</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#191F28] mb-4">제8조 (AI 서비스 이용)</h2>
              <ul className="list-decimal pl-6 mt-3 space-y-2">
                <li>AI가 생성한 콘텐츠는 참고용이며, 회사는 그 정확성이나 완전성을 보장하지 않습니다.</li>
                <li>회원은 AI 생성 콘텐츠를 최종 결정의 유일한 근거로 사용해서는 안 됩니다.</li>
                <li>AI 서비스 이용 시 소모되는 포인트는 환불되지 않습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#191F28] mb-4">제9조 (서비스 이용제한)</h2>
              <p>회사는 회원이 이 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 서비스 이용을 경고, 일시정지, 영구이용정지 등으로 단계적으로 제한할 수 있습니다.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#191F28] mb-4">제10조 (면책조항)</h2>
              <ul className="list-decimal pl-6 mt-3 space-y-2">
                <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
                <li>회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.</li>
                <li>회사는 회원이 서비스를 이용하여 기대하는 수익을 얻지 못하거나 상실한 것에 대하여 책임을 지지 않습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#191F28] mb-4">부칙</h2>
              <p>이 약관은 2025년 1월 1일부터 시행됩니다.</p>
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
