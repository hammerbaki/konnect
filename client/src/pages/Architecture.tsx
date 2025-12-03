import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Database, Server, Globe, Cpu, Zap, ShieldCheck, Layers } from "lucide-react";
import { motion } from "framer-motion";

export default function Architecture() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <div className="space-y-2">
          <h2 className="text-[28px] font-bold text-[#191F28] flex items-center gap-2">
            <Layers className="h-8 w-8 text-[#3182F6]" />
            System Architecture
          </h2>
          <p className="text-[#8B95A1] text-lg">
            Hybrid Cloud Architecture: Replit for Agility + AWS for Power
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
                  Replit Environment
                </div>
                <span className="text-sm text-[#6B7684] font-medium">Main Application & Orchestration</span>
              </div>
              
              <Card className="flex-1 border-2 border-[#191F28] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] bg-white overflow-visible">
                <CardHeader className="bg-[#F2F4F6] border-b border-[#E5E8EB] py-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="h-5 w-5 text-[#3182F6]" />
                    Fullstack App (Monorepo)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    {/* Frontend Node */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
                        <div className="h-10 w-10 bg-[#3182F6] rounded-lg flex items-center justify-center text-white shadow-md">
                            <span className="font-bold">TS</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-[#191F28]">React Frontend</h4>
                            <p className="text-xs text-[#6B7684]">User Interface & State</p>
                        </div>
                    </div>

                    {/* Backend Node */}
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-4 relative">
                        <div className="absolute left-1/2 -top-6 h-6 w-0.5 bg-[#E5E8EB]" /> {/* Connector */}
                        <div className="h-10 w-10 bg-[#00BFA5] rounded-lg flex items-center justify-center text-white shadow-md">
                            <span className="font-bold">Node</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-[#191F28]">Node.js Backend</h4>
                            <p className="text-xs text-[#6B7684]">API Gateway, Auth, DB Sync</p>
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
                            <p className="text-xs text-[#6B7684]">User Data, Profiles, History</p>
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
                  AWS Environment
                </div>
                <span className="text-sm text-[#6B7684] font-medium">Microservice (Compute)</span>
              </div>
              
              <Card className="flex-1 border-2 border-[#FF9900] shadow-[8px_8px_0px_0px_rgba(255,153,0,0.2)] bg-white">
                <CardHeader className="bg-[#FFF8F0] border-b border-[#FFE0B2] py-4">
                  <CardTitle className="flex items-center gap-2 text-lg text-[#D15B0A]">
                    <Server className="h-5 w-5" />
                    Django Microservice
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
                            <p className="text-xs text-[#6B7684]">Receives Heavy Job Requests</p>
                        </div>
                    </div>

                    {/* Worker Node */}
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-center gap-4 relative">
                        <div className="absolute left-1/2 -top-6 h-6 w-0.5 bg-[#E5E8EB]" /> {/* Connector */}
                        <div className="h-10 w-10 bg-[#9333EA] rounded-lg flex items-center justify-center text-white shadow-md">
                            <Cpu className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-[#191F28]">Celery Workers</h4>
                            <p className="text-xs text-[#6B7684]">AI Inference, PDF Parsing</p>
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
                            <p className="text-xs text-[#6B7684]">Job Queue & Caching</p>
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
                        Reliability
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-[#4E5968] text-sm leading-relaxed">
                        The core user experience runs on Replit's managed infrastructure, ensuring 
                        high availability for UI/UX. Heavy AI jobs are offloaded to AWS so the 
                        app never slows down.
                    </p>
                </CardContent>
            </Card>

            <Card className="toss-card">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        Velocity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-[#4E5968] text-sm leading-relaxed">
                        We develop the frontend and business logic rapidly on Replit (Agile), 
                        while leveraging the existing, stable AWS backend for complex 
                        data processing (Stability).
                    </p>
                </CardContent>
            </Card>

            <Card className="toss-card">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Layers className="h-5 w-5 text-blue-500" />
                        Scalability
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-[#4E5968] text-sm leading-relaxed">
                        As user traffic grows, we can scale the AWS worker nodes independently 
                        without affecting the main application's responsiveness.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </Layout>
  );
}