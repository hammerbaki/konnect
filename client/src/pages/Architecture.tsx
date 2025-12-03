import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Database, Server, Globe, Cpu, Zap, ShieldCheck, Layers } from "lucide-react";
import { motion } from "framer-motion";

export default function Architecture() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <div className="space-y-2">
          <h2 className="text-[28px] font-bold text-[#191F28] flex items-center gap-2">
            <Layers className="h-8 w-8 text-[#3182F6]" />
            시스템 아키텍처
          </h2>
          <p className="text-[#8B95A1] text-lg">
            하이브리드 클라우드 구조: Replit의 민첩성과 AWS의 성능 결합
          </p>
        </div>

        {/* Architecture Diagram Area */}
        <div className="relative w-full bg-[#F9FAFB] rounded-3xl border border-[#E5E8EB] p-8 md:p-12 overflow-hidden">
          
          {/* Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.3]" />

          <div className="relative flex flex-col md:flex-row items-stretch justify-between gap-8 md:gap-16 z-10">
            
            {/* 1. REPLIT ZONE */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                  Replit 환경
                </div>
                <span className="text-sm text-[#6B7684] font-medium">메인 앱 & 오케스트레이션</span>
              </div>
              
              <Card className="flex-1 border-2 border-[#191F28] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] bg-white overflow-visible">
                <CardHeader className="bg-[#F2F4F6] border-b border-[#E5E8EB] py-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="h-5 w-5 text-[#3182F6]" />
                    풀스택 앱 (Monorepo)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    {/* Frontend Node */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
                        <div className="h-10 w-10 bg-[#3182F6] rounded-lg flex items-center justify-center text-white shadow-md">
                            <span className="font-bold">TS</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-[#191F28]">React 프론트엔드</h4>
                            <p className="text-xs text-[#6B7684]">사용자 인터페이스 & 상태 관리</p>
                        </div>
                    </div>

                    {/* Backend Node */}
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-4 relative">
                        <div className="absolute left-1/2 -top-6 h-6 w-0.5 bg-[#E5E8EB]" /> {/* Connector */}
                        <div className="h-10 w-10 bg-[#00BFA5] rounded-lg flex items-center justify-center text-white shadow-md">
                            <span className="font-bold">Node</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-[#191F28]">Node.js 백엔드</h4>
                            <p className="text-xs text-[#6B7684]">API 게이트웨이, 인증, DB 연동</p>
                        </div>
                    </div>

                    {/* Database Node */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-4 relative">
                         <div className="absolute left-1/2 -top-6 h-6 w-0.5 bg-[#E5E8EB]" /> {/* Connector */}
                        <div className="h-10 w-10 bg-[#4E5968] rounded-lg flex items-center justify-center text-white shadow-md">
                            <Database className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-[#191F28]">Replit Postgres</h4>
                            <p className="text-xs text-[#6B7684]">사용자 데이터, 프로필, 이력 저장</p>
                        </div>
                    </div>
                </CardContent>
              </Card>
            </motion.div>


            {/* CONNECTION ARROWS */}
            <div className="flex flex-col items-center justify-center gap-2 md:pt-20">
                <motion.div 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "100%", opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="hidden md:flex items-center gap-2"
                >
                    <div className="h-[2px] w-16 bg-gradient-to-r from-[#3182F6] to-[#FF6B00] animate-pulse" />
                    <div className="bg-white border border-[#E5E8EB] px-3 py-1.5 rounded-full text-[10px] font-bold text-[#6B7684] shadow-sm whitespace-nowrap z-20">
                        REST API (JSON)
                    </div>
                    <div className="h-[2px] w-16 bg-gradient-to-r from-[#3182F6] to-[#FF6B00] animate-pulse" />
                    <ArrowRight className="text-[#FF6B00]" />
                </motion.div>
                
                {/* Mobile Vertical Arrow */}
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 80, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="md:hidden flex flex-col items-center gap-2 py-4"
                >
                     <div className="w-[2px] h-full bg-gradient-to-b from-[#3182F6] to-[#FF6B00]" />
                     <ArrowRight className="text-[#FF6B00] rotate-90" />
                </motion.div>
            </div>


            {/* 2. AWS ZONE */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-4 flex items-center gap-2 justify-end md:justify-start">
                <div className="bg-[#FF9900] text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                  AWS 환경
                </div>
                <span className="text-sm text-[#6B7684] font-medium">마이크로서비스 (연산 처리)</span>
              </div>
              
              <Card className="flex-1 border-2 border-[#FF9900] shadow-[8px_8px_0px_0px_rgba(255,153,0,0.2)] bg-white">
                <CardHeader className="bg-[#FFF8F0] border-b border-[#FFE0B2] py-4">
                  <CardTitle className="flex items-center gap-2 text-lg text-[#D15B0A]">
                    <Server className="h-5 w-5" />
                    Django 마이크로서비스
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    {/* API Node */}
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center gap-4">
                        <div className="h-10 w-10 bg-[#FF9900] rounded-lg flex items-center justify-center text-white shadow-md">
                            <span className="font-bold">Py</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-[#191F28]">Django REST API</h4>
                            <p className="text-xs text-[#6B7684]">고부하 작업 요청 수신</p>
                        </div>
                    </div>

                    {/* Worker Node */}
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-center gap-4 relative">
                        <div className="absolute left-1/2 -top-6 h-6 w-0.5 bg-[#E5E8EB]" /> {/* Connector */}
                        <div className="h-10 w-10 bg-[#9333EA] rounded-lg flex items-center justify-center text-white shadow-md">
                            <Cpu className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-[#191F28]">Celery 워커</h4>
                            <p className="text-xs text-[#6B7684]">AI 추론, PDF 파싱 등 무거운 작업</p>
                        </div>
                    </div>

                    {/* Cache Node */}
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-4 relative">
                         <div className="absolute left-1/2 -top-6 h-6 w-0.5 bg-[#E5E8EB]" /> {/* Connector */}
                        <div className="h-10 w-10 bg-[#DC2626] rounded-lg flex items-center justify-center text-white shadow-md">
                            <Zap className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-[#191F28]">Redis</h4>
                            <p className="text-xs text-[#6B7684]">작업 큐 & 캐싱 레이어</p>
                        </div>
                    </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Explanation Cards */}
        <div className="grid md:grid-cols-3 gap-6">
            <Card className="toss-card">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-green-500" />
                        안정성 (Reliability)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-[#4E5968] text-sm leading-relaxed">
                        핵심 사용자 경험은 Replit의 관리형 인프라에서 실행되어 
                        UI/UX의 고가용성을 보장합니다. 무거운 AI 작업은 AWS로 
                        분산 처리되어 앱 속도 저하를 방지합니다.
                    </p>
                </CardContent>
            </Card>

            <Card className="toss-card">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        개발 속도 (Velocity)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-[#4E5968] text-sm leading-relaxed">
                        프론트엔드와 비즈니스 로직은 Replit에서 빠르게 개발(Agile)하고, 
                        복잡한 데이터 처리는 기존의 안정적인 AWS 백엔드를 
                        활용(Stability)하여 효율을 극대화합니다.
                    </p>
                </CardContent>
            </Card>

            <Card className="toss-card">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Layers className="h-5 w-5 text-blue-500" />
                        확장성 (Scalability)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-[#4E5968] text-sm leading-relaxed">
                        사용자 트래픽이 증가하더라도 메인 애플리케이션의 반응성에 
                        영향을 주지 않고, AWS의 Celery 워커 노드만 독립적으로 
                        확장하여 대응할 수 있습니다.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </Layout>
  );
}