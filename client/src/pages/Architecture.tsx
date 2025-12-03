import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Database, Server, Globe, Cpu, Zap, ShieldCheck, Layers, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";

export default function Architecture() {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        <div className="space-y-2">
          <h2 className="text-[28px] font-bold text-[#191F28] flex items-center gap-2">
            <Layers className="h-8 w-8 text-[#3182F6]" />
            시스템 구조도 (System Architecture)
          </h2>
          <p className="text-[#8B95A1] text-lg">
            현재의 하이브리드 운영 모델: Replit (Frontend/BFF) + AWS (Heavy Compute)
          </p>
        </div>

        {/* Whiteboard Area */}
        <div className="relative w-full bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 md:p-12 overflow-hidden">
          
          {/* Dot Grid Background for Engineering look */}
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-50" />

          <div className="relative z-10 flex flex-col gap-12">
            
            {/* Top Level: The Strategy */}
            <div className="flex justify-center">
                <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg text-sm font-medium rotate-1 shadow-sm">
                    💡 핵심 전략: "가벼운 건 Replit에서 빠르게, 무거운 건 AWS에서 확실하게"
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-stretch justify-center gap-8 md:gap-20">
                
                {/* LEFT: REPLIT (Blue Team) */}
                <div className="flex-1 max-w-md flex flex-col gap-4">
                    <div className="text-center mb-2">
                        <span className="inline-block bg-[#E8F3FF] text-[#3182F6] border-2 border-[#3182F6] px-3 py-1 rounded-md font-bold text-sm">
                            Replit (메인 서버)
                        </span>
                        <p className="text-xs text-gray-500 mt-1">빠른 배포 & UI/UX 호스팅</p>
                    </div>

                    <div className="bg-white border-2 border-gray-800 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-6 relative">
                        {/* React */}
                        <div className="border border-gray-300 rounded p-3 bg-gray-50">
                            <div className="flex items-center gap-2 mb-2">
                                <Globe className="h-4 w-4 text-blue-600" />
                                <span className="font-bold text-sm">React Client</span>
                            </div>
                            <div className="text-xs text-gray-600 pl-6">
                                • 사용자 인터페이스 (UI)<br/>
                                • 실시간 상호작용<br/>
                                • 상태 관리 (State)
                            </div>
                        </div>

                        {/* Arrow Down */}
                        <div className="absolute left-1/2 top-[88px] -translate-x-1/2 text-gray-400">
                            <ArrowDown className="h-5 w-5" />
                        </div>

                        {/* Node.js */}
                        <div className="border border-gray-300 rounded p-3 bg-gray-50">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-4 w-4 bg-green-600 rounded-full text-[10px] text-white flex items-center justify-center">N</div>
                                <span className="font-bold text-sm">Node.js (BFF)</span>
                            </div>
                            <div className="text-xs text-gray-600 pl-6">
                                • API Gateway 역할<br/>
                                • 인증/세션 관리<br/>
                                • 간단한 CRUD 처리
                            </div>
                        </div>

                        {/* DB Connection */}
                        <div className="border-t-2 border-dashed border-gray-300 my-1"></div>

                        {/* Postgres */}
                        <div className="flex items-center gap-3 p-2 bg-[#F1F4F8] rounded border border-gray-200">
                            <Database className="h-5 w-5 text-gray-600" />
                            <div>
                                <div className="font-bold text-sm">Postgres DB</div>
                                <div className="text-[10px] text-gray-500">사용자/프로필 데이터 저장</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CENTER: The Bridge */}
                <div className="flex flex-col justify-center items-center gap-2 text-xs font-mono text-gray-500 py-4 md:py-0">
                    <div className="hidden md:block w-24 border-t-2 border-dashed border-gray-400 relative top-3"></div>
                    <div className="bg-white border border-gray-300 px-2 py-1 rounded shadow-sm z-20 whitespace-nowrap">
                        HTTP / REST API
                    </div>
                    <div className="hidden md:block w-24 border-t-2 border-dashed border-gray-400 relative -top-3"></div>
                    <div className="md:hidden h-12 border-l-2 border-dashed border-gray-400"></div>
                </div>

                {/* RIGHT: AWS (Orange Team) */}
                <div className="flex-1 max-w-md flex flex-col gap-4">
                     <div className="text-center mb-2">
                        <span className="inline-block bg-[#FFF4E5] text-[#D15B0A] border-2 border-[#D15B0A] px-3 py-1 rounded-md font-bold text-sm">
                            AWS (작업 서버)
                        </span>
                        <p className="text-xs text-gray-500 mt-1">고성능 연산 & AI 처리</p>
                    </div>

                    <div className="bg-white border-2 border-gray-800 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-6 relative">
                        
                        {/* Django */}
                        <div className="border border-gray-300 rounded p-3 bg-gray-50">
                            <div className="flex items-center gap-2 mb-2">
                                <Server className="h-4 w-4 text-orange-600" />
                                <span className="font-bold text-sm">Django API</span>
                            </div>
                            <div className="text-xs text-gray-600 pl-6">
                                • 무거운 요청 수신<br/>
                                • 작업 큐(Queue) 등록
                            </div>
                        </div>

                         {/* Arrow Down */}
                         <div className="absolute left-1/2 top-[88px] -translate-x-1/2 text-gray-400">
                            <ArrowDown className="h-5 w-5" />
                        </div>

                        {/* Celery & Redis */}
                        <div className="flex gap-2">
                            <div className="flex-1 border border-gray-300 rounded p-3 bg-gray-50">
                                <div className="flex items-center gap-2 mb-1">
                                    <Zap className="h-3 w-3 text-red-500" />
                                    <span className="font-bold text-xs">Redis</span>
                                </div>
                                <div className="text-[10px] text-gray-500">Message Queue</div>
                            </div>
                            <div className="flex-1 border border-gray-300 rounded p-3 bg-gray-50">
                                <div className="flex items-center gap-2 mb-1">
                                    <Cpu className="h-3 w-3 text-purple-600" />
                                    <span className="font-bold text-xs">Celery</span>
                                </div>
                                <div className="text-[10px] text-gray-500">Worker Nodes</div>
                            </div>
                        </div>

                        {/* AI Processing */}
                        <div className="border-2 border-gray-200 rounded p-3 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-center">
                            <div>
                                <div className="text-sm font-bold text-gray-700">AI Engine</div>
                                <div className="text-[10px] text-gray-500">LLM Inference / Analysis</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footnote */}
            <div className="mt-8 border-t border-dashed border-gray-300 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex gap-3">
                        <span className="font-bold min-w-[60px]">Why?</span>
                        <span>Replit은 UI 개발과 배포 속도가 빠르지만, 긴 실행 시간이 필요한 AI 작업에는 AWS EC2가 비용/성능 면에서 유리함.</span>
                    </div>
                    <div className="flex gap-3">
                        <span className="font-bold min-w-[60px]">How?</span>
                        <span>사용자는 Replit 웹사이트만 보게 되며, 뒷단의 AWS 통신은 내부적으로 처리되어 사용자 경험(UX)을 해치지 않음.</span>
                    </div>
                </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}