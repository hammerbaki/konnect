import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Database, Server, Globe, Cpu, Zap, ShieldCheck, Layers, Box, Repeat, Cloud } from "lucide-react";
import { motion } from "framer-motion";

export default function Architecture() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <div className="space-y-2">
          <h2 className="text-[28px] font-bold text-[#191F28] flex items-center gap-2">
            <Layers className="h-8 w-8 text-[#3182F6]" />
            Replit 네이티브 스케일러블 아키텍처
          </h2>
          <p className="text-[#8B95A1] text-lg">
            단일 플랫폼으로 1000+ 동시 접속자 처리 및 AI 토큰 제어 구조
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
                        <div className="text-xs text-[#8B95A1]">React Client</div>
                    </div>
                  </div>
                  <div className="text-xs text-[#4E5968] mt-2 bg-[#F2F4F6] p-2 rounded-lg">
                    • 요청 생성<br/>
                    • 결과 조회
                  </div>
               </div>
            </motion.div>

            {/* Connection Arrow */}
            <div className="flex items-center justify-center">
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
                                <p className="text-xs text-[#6B7684]">트래픽에 따라 자동 확장 (N개 인스턴스)</p>
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
                            <p className="text-xs text-[#6B7684]">API 속도 제한(Rate Limit) 제어 & 순차 처리</p>
                        </div>
                    </div>

                    {/* Database Pooler */}
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-center gap-4 relative">
                         <div className="absolute left-1/2 -top-6 h-6 w-0.5 bg-[#E5E8EB]" /> {/* Connector */}
                        <div className="h-10 w-10 bg-[#9333EA] rounded-lg flex items-center justify-center text-white shadow-md">
                            <Database className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-[#191F28]">Replit Postgres (Pooler)</h4>
                            <p className="text-xs text-[#6B7684]">커넥션 풀링으로 수천명 동시 접속 안정화</p>
                        </div>
                    </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Connection Arrow */}
            <div className="flex items-center justify-center">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-[#3182F6] bg-blue-50 px-2 py-1 rounded-full border border-blue-100 whitespace-nowrap">
                        8000 tokens/sec
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
                    External API
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 bg-[#D97757] rounded-lg flex items-center justify-center text-white">
                       <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="font-bold text-[#191F28]">Claude</div>
                        <div className="text-xs text-[#8B95A1]">Anthropic AI</div>
                    </div>
                  </div>
                  <div className="text-xs text-[#4E5968] mt-2 bg-[#FFF8F6] p-2 rounded-lg border border-[#FFE4DE]">
                    • 커리어 분석<br/>
                    • 자소서 생성<br/>
                    • 실시간 추론
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
                        <Server className="h-5 w-5 text-[#3182F6]" />
                        오토스케일링 (Autoscale)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-[#4E5968] text-sm leading-relaxed">
                        사용자가 1000명으로 급증하면 Replit이 자동으로 서버 인스턴스를 늘려 대응합니다. 
                        트래픽이 없으면 서버가 줄어들어 비용이 절감됩니다.
                    </p>
                </CardContent>
            </Card>

            <Card className="toss-card">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-[#F97316]" />
                        속도 제한 방어 (Rate Limit)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-[#4E5968] text-sm leading-relaxed">
                        Node.js 내부의 작업 큐가 '수문장' 역할을 합니다. 사용자 요청이 폭주해도 
                        Claude API로는 초당 8000 토큰 이하로만 조절하여 전송하므로 에러가 발생하지 않습니다.
                    </p>
                </CardContent>
            </Card>

            <Card className="toss-card">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="h-5 w-5 text-[#00BFA5]" />
                        비용 효율성 (Cost)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-[#4E5968] text-sm leading-relaxed">
                        복잡한 AWS 인프라 관리 없이, 사용한 만큼만 지불하는 Replit의 구조를 활용하여 
                        초기 구축 비용과 유지보수 시간을 90% 이상 단축합니다.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </Layout>
  );
}

// Icon component for Sparkles specifically if not imported
function Sparkles({ className }: { className?: string }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M9 3v4" />
            <path d="M2 7h4" />
            <path d="M2 11h4" />
        </svg>
    )
}