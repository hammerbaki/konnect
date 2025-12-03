import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Database, Server, Globe, Cpu, Zap, ShieldCheck, Layers, Cloud, Repeat, Sparkles, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function Architecture() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <div className="space-y-2">
          <h2 className="text-[28px] font-bold text-[#191F28] flex items-center gap-2">
            <Layers className="h-8 w-8 text-[#3182F6]" />
            Replit 네이티브 보안 아키텍처
          </h2>
          <p className="text-[#8B95A1] text-lg">
            Enterprise-grade 보안 및 오토스케일링 구조
          </p>
        </div>

        {/* Architecture Diagram Area */}
        <div className="relative w-full bg-[#F9FAFB] rounded-3xl border border-[#E5E8EB] p-8 md:p-12 overflow-hidden">
          
          {/* Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.3]" />

          <div className="relative flex flex-col md:flex-row items-stretch justify-between gap-8 md:gap-12 z-10">
            
            {/* 1. CLIENT ZONE */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-center"
            >
               <div className="bg-white border-2 border-[#191F28] rounded-2xl p-6 shadow-md w-[200px] relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 bg-[#3182F6] rounded-lg flex items-center justify-center text-white">
                       <Globe className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="font-bold text-[#191F28]">사용자</div>
                        <div className="text-xs text-[#8B95A1]">Secure Client</div>
                    </div>
                  </div>
                  <div className="text-xs text-[#4E5968] mt-2 bg-[#F2F4F6] p-2 rounded-lg">
                    • HTTPS (TLS 1.3)<br/>
                    • Encrypted Traffic
                  </div>
               </div>
            </motion.div>

            {/* Connection Arrow */}
            <div className="flex items-center justify-center relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                    <span className="text-[10px] font-bold text-green-600 whitespace-nowrap">WAF / DDoS Protection</span>
                </div>
                <ArrowRight className="text-[#B0B8C1] h-6 w-6 md:rotate-0 rotate-90" />
            </div>

            {/* 2. REPLIT AUTOSCALE CLOUD (The Core) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="bg-gradient-to-r from-[#3182F6] to-[#00BFA5] text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1">
                  <Cloud className="h-3 w-3" /> Replit Autoscale Cloud
                </div>
                <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <Lock className="h-3 w-3" /> SOC2 Compliant
                </div>
              </div>
              
              <Card className="flex-1 border-2 border-[#3182F6] shadow-[0_0_40px_rgba(49,130,246,0.15)] bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 space-y-6">
                    
                    {/* Node.js Cluster */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 relative overflow-hidden">
                         <div className="absolute top-0 right-0 bg-[#3182F6] text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">
                            Auto-Scaling
                         </div>
                        <div className="flex items-center gap-4 mb-3">
                            <div className="h-10 w-10 bg-[#191F28] rounded-lg flex items-center justify-center text-white shadow-md">
                                <Server className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-[#191F28]">Node.js 서버 클러스터</h4>
                                <p className="text-xs text-[#6B7684]">Google Cloud Armor로 보호됨</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                             {[1,2,3].map(i => (
                                 <div key={i} className="bg-white border border-blue-100 rounded p-2 flex flex-col items-center justify-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-mono text-blue-600">Instance {i}</span>
                                 </div>
                             ))}
                        </div>
                    </div>

                    {/* Internal Job Queue */}
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center gap-4 relative">
                         <div className="absolute left-1/2 -top-6 h-6 w-0.5 bg-[#E5E8EB]" /> {/* Connector */}
                        <div className="h-10 w-10 bg-[#F97316] rounded-lg flex items-center justify-center text-white shadow-md">
                            <Repeat className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-[#191F28]">스마트 작업 큐 (Job Queue)</h4>
                            <p className="text-xs text-[#6B7684]">과부하 방지 및 속도 제어</p>
                        </div>
                    </div>

                    {/* Database Pooler */}
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-center gap-4 relative">
                         <div className="absolute left-1/2 -top-6 h-6 w-0.5 bg-[#E5E8EB]" /> {/* Connector */}
                        <div className="h-10 w-10 bg-[#9333EA] rounded-lg flex items-center justify-center text-white shadow-md">
                            <Database className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-[#191F28]">Replit Postgres (Encrypted)</h4>
                            <p className="text-xs text-[#6B7684]">AES-256 데이터 암호화 저장</p>
                        </div>
                    </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Connection Arrow */}
            <div className="flex items-center justify-center">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-[#3182F6] bg-blue-50 px-2 py-1 rounded-full border border-blue-100 whitespace-nowrap">
                        Secure API Call
                    </span>
                    <ArrowRight className="text-[#B0B8C1] h-6 w-6 md:rotate-0 rotate-90" />
                </div>
            </div>

            {/* 3. EXTERNAL AI */}
             <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col justify-center"
            >
               <div className="bg-white border-2 border-[#D97757] rounded-2xl p-6 shadow-md w-[200px] relative z-10">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D97757] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Private API
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 bg-[#D97757] rounded-lg flex items-center justify-center text-white">
                       <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="font-bold text-[#191F28]">Claude</div>
                        <div className="text-xs text-[#8B95A1]">Enterprise</div>
                    </div>
                  </div>
                  <div className="text-xs text-[#4E5968] mt-2 bg-[#FFF8F6] p-2 rounded-lg border border-[#FFE4DE]">
                    • 데이터 학습 없음<br/>
                    • SOC2 인증
                  </div>
               </div>
            </motion.div>

          </div>
        </div>

        {/* Explanation Cards */}
        <div className="grid md:grid-cols-3 gap-6">
            <Card className="toss-card">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-green-500" />
                        보안 (Security)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-[#4E5968] text-sm leading-relaxed">
                        Google Cloud Armor 기반의 DDoS 방어와 WAF가 기본 적용되어 있으며, 
                        모든 데이터는 전송 중(TLS) 및 저장 중(AES-256)에 암호화됩니다.
                    </p>
                </CardContent>
            </Card>

            <Card className="toss-card">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Server className="h-5 w-5 text-[#3182F6]" />
                        자동 확장 (Autoscale)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-[#4E5968] text-sm leading-relaxed">
                        트래픽 급증 시 1초 이내에 새로운 서버 인스턴스가 자동으로 생성되어 
                        1000명 이상의 동시 접속도 지연 없이 처리합니다.
                    </p>
                </CardContent>
            </Card>

            <Card className="toss-card">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="h-5 w-5 text-[#00BFA5]" />
                        관리 (Management)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-[#4E5968] text-sm leading-relaxed">
                        복잡한 방화벽 설정이나 로드밸런서 구성 없이, Replit 대시보드에서 
                        'Autoscale' 버튼 하나로 엔터프라이즈급 인프라가 즉시 가동됩니다.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </Layout>
  );
}

