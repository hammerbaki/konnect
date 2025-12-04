import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Sparkles, Bot, Copy, FileText, ChevronLeft, Quote, School, GraduationCap, Briefcase, ArrowRight, AlertCircle, History, Plus, MessageSquare, Menu, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// --- Mock Data (Mirroring Profile.tsx structure) ---
const MOCK_PROFILE_DB = {
    basic: {
        name: "김철수",
        role: "Product Manager",
    },
    // Simulate populated High School data
    high: {
        high_schoolName: "한국고등학교",
        high_hopeUniversity: "서울대학교",
        high_majorTrack: "공학계열",
        high_careerHope: "AI 연구원",
        high_activityStatus: "코딩 동아리 부장, 전국 정보올림피아드 은상",
        high_favoriteSubject: "수학",
        // high_mbti is missing to simulate incomplete profile for testing if needed, 
        // but let's populate it for now to allow generation.
        high_mbti: "INTJ" 
    },
    // Simulate populated University data
    univ: {
        univ_majorName: "컴퓨터공학과",
        univ_careerGoalClear: "5",
        univ_skillsToDevelop: ["Deep Learning", "React"],
    },
    // Simulate populated General Job Seeker data
    general: {
        gen_currentStatus: "employed",
        gen_workExperience: [
            { role: "Product Manager", company: "Tech Corp", description: "SaaS Launch" }
        ],
        gen_reasonForChange: "growth",
        gen_desiredIndustry: "Fintech",
        gen_desiredRole: "Senior PM",
        gen_skills: ["Communication", "Data Analysis"]
    }
};

// --- Types ---
type CategoryId = 'high' | 'univ' | 'general';
type AgentId = string;

interface Agent {
    id: AgentId;
    label: string;
    desc: string;
    promptTemplate: string;
    requiredFields: string[]; // Fields to check in MOCK_PROFILE_DB
}

interface Category {
    id: CategoryId;
    label: string;
    subLabel: string;
    icon: any;
    colorClass: string;
    agents: Agent[];
}

interface ChatSession {
    id: string;
    title: string;
    categoryId: CategoryId;
    agentId: AgentId;
    lastModified: Date;
    messages: any[]; // Using any[] for simplicity in mockup
}

// --- Configuration ---
const CATEGORIES: Category[] = [
    {
        id: 'high',
        label: '고등학생 (대입)',
        subLabel: '생활기록부 기반 대입 자소서',
        icon: School,
        colorClass: 'text-pink-500 bg-pink-50 border-pink-100 hover:border-pink-300 hover:bg-pink-100',
        agents: [
            { 
                id: 'high_motive', 
                label: '대입 지원동기', 
                desc: '희망 대학/학과에 지원하게 된 구체적인 계기 작성',
                promptTemplate: "학생의 희망 대학({high_hopeUniversity})과 진로 희망({high_careerHope})을 연결하여 지원 동기를 작성해줘.",
                requiredFields: ['high_hopeUniversity', 'high_careerHope']
            },
            { 
                id: 'high_growth', 
                label: '학업 기울인 노력', 
                desc: '학업 역량을 키우기 위해 노력한 과정 서술',
                promptTemplate: "가장 좋아했던 과목({high_favoriteSubject})과 관련하여 학업에 기울인 노력을 구체적으로 서술해줘.",
                requiredFields: ['high_favoriteSubject']
            },
            { 
                id: 'high_activity', 
                label: '의미 있는 교내 활동', 
                desc: '동아리, 봉사 등 학교 생활 중 가장 의미 있었던 활동',
                promptTemplate: "다음 활동 내역을 바탕으로 배우고 느낀 점을 중심으로 작성해줘: {high_activityStatus}",
                requiredFields: ['high_activityStatus']
            }
        ]
    },
    {
        id: 'univ',
        label: '대학생 (취업/인턴)',
        subLabel: '인턴, 신입 채용 맞춤형 자소서',
        icon: GraduationCap,
        colorClass: 'text-blue-500 bg-blue-50 border-blue-100 hover:border-blue-300 hover:bg-blue-100',
        agents: [
            { 
                id: 'univ_growth', 
                label: '성장과정', 
                desc: '가치관이 형성된 계기와 성장 배경 작성',
                promptTemplate: "대학 생활 중 성장하게 된 계기와 가치관을 중심으로 작성해줘.",
                requiredFields: ['univ_majorName']
            },
            { 
                id: 'univ_competence', 
                label: '직무 핵심 역량', 
                desc: '지원 직무에 필요한 핵심 역량과 강점 어필',
                promptTemplate: "보유한 스킬({univ_skillsToDevelop})을 활용하여 직무 역량을 강조하는 내용을 작성해줘.",
                requiredFields: ['univ_skillsToDevelop']
            },
            { 
                id: 'univ_motive', 
                label: '지원동기 및 포부', 
                desc: '회사 선택 기준과 입사 후 목표',
                promptTemplate: "전공({univ_majorName})과 연관지어 지원 동기와 입사 후 포부를 작성해줘.",
                requiredFields: ['univ_majorName']
            }
        ]
    },
    {
        id: 'general',
        label: '일반 구직자 (경력)',
        subLabel: '이직, 경력 기술서 및 경험 정리',
        icon: Briefcase,
        colorClass: 'text-green-500 bg-green-50 border-green-100 hover:border-green-300 hover:bg-green-100',
        agents: [
             { 
                id: 'gen_change', 
                label: '이직/구직 사유', 
                desc: '이직을 결심한 이유와 새로운 도전에 대한 설명',
                promptTemplate: "현재 이직 사유({gen_reasonForChange})를 긍정적인 방향(성장, 도전)으로 풀어내어 작성해줘.",
                requiredFields: ['gen_reasonForChange']
            },
            { 
                id: 'gen_exp', 
                label: '경력 기술 (핵심 성과)', 
                desc: '주요 경력 사항과 성과를 STAR 기법으로 정리',
                promptTemplate: "다음 경력 사항을 바탕으로 핵심 성과 위주로 기술해줘: {gen_workExperience}",
                requiredFields: ['gen_workExperience']
            },
            { 
                id: 'gen_fit', 
                label: '직무 적합성 & 비전', 
                desc: '보유 경험이 희망 직무에 어떻게 기여할 수 있는지',
                promptTemplate: "희망 산업({gen_desiredIndustry})의 {gen_desiredRole}로서 기여할 수 있는 점을 보유 스킬({gen_skills})과 연결하여 작성해줘.",
                requiredFields: ['gen_desiredIndustry', 'gen_desiredRole', 'gen_skills']
            }
        ]
    }
];

// --- Mock History Data ---
const MOCK_HISTORY: ChatSession[] = [
    {
        id: "session-1",
        title: "서울대 지원동기 초안",
        categoryId: 'high',
        agentId: 'high_motive',
        lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        messages: [
            {
                id: "msg-1",
                sender: "ai",
                type: "text",
                content: "안녕하세요! [고등학생 (대입)] - [대입 지원동기] 에이전트입니다.\n\n김철수님의 프로필 정보를 바탕으로 초안 작성을 시작하겠습니다.",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
            },
            {
                id: "msg-2",
                sender: "ai",
                type: "draft",
                content: "[자동 생성된 초안입니다]\n\n저는 어릴 적부터 수학을 좋아하여 공학계열에 관심을 가지게 되었습니다...\n\n(과거 작성된 내용)",
                topic: "대입 지원동기",
                version: 1,
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 2000)
            }
        ]
    },
    {
        id: "session-2",
        title: "PM 이직 사유 정리",
        categoryId: 'general',
        agentId: 'gen_change',
        lastModified: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
        messages: [
            {
                id: "msg-3",
                sender: "ai",
                type: "text",
                content: "안녕하세요! [일반 구직자 (경력)] - [이직/구직 사유] 에이전트입니다.",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5)
            },
             {
                id: "msg-4",
                sender: "ai",
                type: "draft",
                content: "현재 Tech Corp에서 Senior PM으로 재직하며 SaaS 런칭을 주도했지만, 더 큰 성장을 위해 이직을 결심했습니다.",
                topic: "이직/구직 사유",
                version: 1,
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5 + 2000)
            }
        ]
    }
];

export default function PersonalStatement() {
    const { toast } = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);
    
    // State
    const [step, setStep] = useState<'category' | 'agent' | 'chat'>('category');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    
    // History State
    const [history, setHistory] = useState<ChatSession[]>(MOCK_HISTORY);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // Chat State
    const [input, setInput] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);

    // --- Handlers ---

    const handleNewChat = () => {
        setStep('category');
        setSelectedCategory(null);
        setSelectedAgent(null);
        setCurrentSessionId(null);
        setMessages([]);
        setIsHistoryOpen(false);
    };

    const handleLoadSession = (session: ChatSession) => {
        const category = CATEGORIES.find(c => c.id === session.categoryId);
        const agent = category?.agents.find(a => a.id === session.agentId);

        if (category && agent) {
            setSelectedCategory(category);
            setSelectedAgent(agent);
            setMessages(session.messages);
            setCurrentSessionId(session.id);
            setStep('chat');
            setIsHistoryOpen(false);
        }
    };

    const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        setHistory(prev => prev.filter(h => h.id !== sessionId));
        if (currentSessionId === sessionId) {
            handleNewChat();
        }
        toast({ description: "기록이 삭제되었습니다." });
    };

    const handleCategorySelect = (category: Category) => {
        setSelectedCategory(category);
        setStep('agent');
    };

    const handleAgentSelect = (agent: Agent) => {
        if (!selectedCategory) return;

        // 1. Validation
        const categoryData = MOCK_PROFILE_DB[selectedCategory.id as keyof typeof MOCK_PROFILE_DB] as any;
        const missingFields = agent.requiredFields.filter(field => {
            const val = categoryData[field];
            return !val || (Array.isArray(val) && val.length === 0);
        });

        if (missingFields.length > 0) {
            toast({
                variant: "destructive",
                title: "프로필 정보 부족",
                description: `이 에이전트를 사용하려면 프로필에서 다음 정보를 먼저 입력해야 합니다: ${missingFields.join(", ")}`,
            });
            return;
        }

        // 2. Initialize New Session
        setSelectedAgent(agent);
        setStep('chat');
        
        const newSessionId = Date.now().toString();
        setCurrentSessionId(newSessionId);
        
        const initialMsg = {
            id: "system-welcome",
            sender: "ai",
            type: "text",
            content: `안녕하세요! [${selectedCategory.label}] - [${agent.label}] 에이전트입니다.\n\n${MOCK_PROFILE_DB.basic.name}님의 프로필 정보를 바탕으로 초안 작성을 시작하겠습니다.`,
            timestamp: new Date()
        };
        
        setMessages([initialMsg]);
        
        // Add to History immediately (or could wait until first generation)
        const newSession: ChatSession = {
            id: newSessionId,
            title: `${agent.label} (작성 중)`,
            categoryId: selectedCategory.id,
            agentId: agent.id,
            lastModified: new Date(),
            messages: [initialMsg]
        };
        setHistory(prev => [newSession, ...prev]);
        
        // 3. Trigger Auto-Generation
        setIsGenerating(true);
        setTimeout(() => {
            const draft = generateMockDraft(agent, categoryData);
            const draftMsg = {
                id: Date.now().toString(),
                sender: "ai",
                type: "draft",
                content: draft,
                topic: agent.label,
                version: 1,
                timestamp: new Date()
            };
            
            const updatedMessages = [initialMsg, draftMsg];
            setMessages(updatedMessages);
            
            // Update History
            setHistory(prev => prev.map(h => h.id === newSessionId ? { ...h, messages: updatedMessages, lastModified: new Date() } : h));
            
            setIsGenerating(false);
        }, 2000);
    };

    const generateMockDraft = (agent: Agent, profileData: any) => {
        let draft = agent.promptTemplate;
        agent.requiredFields.forEach(field => {
            const val = profileData[field];
            const stringVal = Array.isArray(val) ? val.map((v: any) => typeof v === 'object' ? v.role : v).join(", ") : val;
            draft = draft.replace(`{${field}}`, `"${stringVal}"`);
        });
        
        return `[자동 생성된 초안입니다]\n\n${draft}\n\n이 내용은 사용자의 프로필 데이터를 기반으로 생성되었습니다. 구체적인 에피소드를 추가하면 더 좋은 글이 됩니다.`;
    };

    const handleSendMessage = () => {
        if (!input.trim() || !currentSessionId) return;
        
        const userMsg = {
            id: Date.now().toString(),
            sender: "user",
            type: "text",
            content: input,
            timestamp: new Date()
        };
        
        const updatedMessagesWithUser = [...messages, userMsg];
        setMessages(updatedMessagesWithUser);
        // Update History
        setHistory(prev => prev.map(h => h.id === currentSessionId ? { ...h, messages: updatedMessagesWithUser, lastModified: new Date() } : h));
        
        setInput("");
        setIsGenerating(true);

        // Mock Revision
        setTimeout(() => {
            const prevDraft = [...updatedMessagesWithUser].reverse().find(m => m.type === 'draft');
            const newVersion = (prevDraft?.version || 1) + 1;
            
            const aiResponseMsg = {
                id: Date.now().toString(),
                sender: "ai",
                type: "text",
                content: "요청하신 내용을 반영하여 수정했습니다.",
                timestamp: new Date()
            };
            
            const newDraftMsg = {
                id: (Date.now() + 1).toString(),
                sender: "ai",
                type: "draft",
                content: `[수정본 V${newVersion}]\n\n(사용자 피드백: "${input}" 반영됨)\n\n${prevDraft?.content}`,
                topic: selectedAgent?.label,
                version: newVersion,
                timestamp: new Date()
            };

            const finalMessages = [...updatedMessagesWithUser, aiResponseMsg, newDraftMsg];
            setMessages(finalMessages);
            
            // Update History
            setHistory(prev => prev.map(h => h.id === currentSessionId ? { ...h, messages: finalMessages, lastModified: new Date() } : h));
            
            setIsGenerating(false);
        }, 1500);
    };

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isGenerating]);


    // --- Render History List Component ---
    const HistoryList = () => (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-[#E5E8EB]">
                <Button 
                    onClick={handleNewChat} 
                    className="w-full justify-start gap-2 bg-[#3182F6] hover:bg-[#2b72d7] text-white"
                >
                    <Plus className="h-4 w-4" />
                    새 자소서 작성
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {history.length === 0 ? (
                    <div className="text-center py-10 text-[#8B95A1] text-sm">
                        작성된 기록이 없습니다.
                    </div>
                ) : (
                    history.map((session) => (
                        <div 
                            key={session.id}
                            onClick={() => handleLoadSession(session)}
                            className={cn(
                                "group flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer hover:bg-[#F2F4F6]",
                                currentSessionId === session.id ? "bg-[#E8F3FF] text-[#3182F6]" : "text-[#4E5968]"
                            )}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <MessageSquare className={cn("h-4 w-4 shrink-0", currentSessionId === session.id ? "text-[#3182F6]" : "text-[#B0B8C1]")} />
                                <div className="truncate">
                                    <p className="text-sm font-bold truncate">{session.title}</p>
                                    <p className="text-[11px] opacity-70 truncate">
                                        {new Date(session.lastModified).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-[#B0B8C1] hover:text-[#FF5252] hover:bg-red-50"
                                onClick={(e) => handleDeleteSession(e, session.id)}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <Layout>
            <div className="max-w-6xl mx-auto h-[calc(100vh-40px)] md:h-[calc(100vh-80px)] flex md:rounded-2xl md:shadow-sm md:border border-[#E5E8EB] overflow-hidden bg-white relative">
                
                {/* Desktop Sidebar */}
                <div className="hidden md:flex w-[260px] border-r border-[#E5E8EB] bg-white flex-col">
                    <div className="p-4 border-b border-[#E5E8EB] flex items-center gap-2 text-[#191F28] font-bold">
                        <History className="h-4 w-4 text-[#8B95A1]" />
                        작성 기록
                    </div>
                    <HistoryList />
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col h-full relative">
                    
                    {/* Header */}
                    <div className="flex items-center px-4 md:px-6 py-4 border-b border-[#F2F4F6] bg-white z-10 min-h-[68px] justify-between">
                        <div className="flex items-center gap-2">
                            {/* Mobile Menu Trigger */}
                            <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="md:hidden -ml-2">
                                        <Menu className="h-5 w-5 text-[#4E5968]" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[280px] p-0">
                                    <div className="p-4 border-b border-[#E5E8EB] flex items-center gap-2 text-[#191F28] font-bold">
                                        <History className="h-4 w-4 text-[#8B95A1]" />
                                        작성 기록
                                    </div>
                                    <HistoryList />
                                </SheetContent>
                            </Sheet>

                            {step !== 'category' && (
                                <Button variant="ghost" size="icon" onClick={() => setStep(step === 'chat' ? 'agent' : 'category')} className="mr-1">
                                    <ChevronLeft className="h-5 w-5 text-[#4E5968]" />
                                </Button>
                            )}
                            <div>
                                <h2 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-[#3182F6]" />
                                    AI 자소서 코치
                                </h2>
                                {selectedCategory && (
                                    <p className="text-xs text-[#8B95A1] font-medium mt-0.5 hidden md:block">
                                        {selectedCategory.label} {selectedAgent && `> ${selectedAgent.label}`}
                                    </p>
                                )}
                            </div>
                        </div>
                        {selectedAgent && (
                            <Badge variant="outline" className="text-[#3182F6] bg-blue-50 border-blue-100 hidden md:flex">
                                {selectedAgent.label} 작성 중
                            </Badge>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto bg-[#F9FAFB] p-4 md:p-8 relative" ref={scrollRef}>
                        
                        {/* STEP 1: Category Selection */}
                        {step === 'category' && (
                            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center space-y-2 mb-8 pt-10">
                                    <h3 className="text-2xl font-bold text-[#191F28]">어떤 자소서를 작성하시나요?</h3>
                                    <p className="text-[#8B95A1]">작성하려는 목적에 맞는 AI 에이전트를 선택해주세요.</p>
                                </div>
                                
                                <div className="grid md:grid-cols-3 gap-4">
                                    {CATEGORIES.map((cat) => {
                                        const Icon = cat.icon;
                                        return (
                                            <button 
                                                key={cat.id}
                                                onClick={() => handleCategorySelect(cat)}
                                                className={`
                                                    flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg bg-white
                                                    ${cat.colorClass}
                                                `}
                                            >
                                                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                                                    <Icon className="h-8 w-8" />
                                                </div>
                                                <h4 className="text-lg font-bold text-[#191F28] mb-1">{cat.label}</h4>
                                                <p className="text-xs text-[#8B95A1]">{cat.subLabel}</p>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Agent Selection */}
                        {step === 'agent' && selectedCategory && (
                            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center gap-2 mb-6">
                                    <Badge className="bg-[#191F28] text-white hover:bg-[#191F28]">{selectedCategory.label}</Badge>
                                    <span className="text-[#8B95A1] text-sm">전문 에이전트 선택</span>
                                </div>

                                <div className="grid gap-4">
                                    {selectedCategory.agents.map((agent) => (
                                        <div 
                                            key={agent.id}
                                            onClick={() => handleAgentSelect(agent)}
                                            className="group bg-white p-5 rounded-2xl border border-[#E5E8EB] hover:border-[#3182F6] hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 rounded-xl bg-[#F2F4F6] group-hover:bg-blue-50 transition-colors">
                                                    <Bot className="h-6 w-6 text-[#8B95A1] group-hover:text-[#3182F6]" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-[#191F28] text-lg group-hover:text-[#3182F6] transition-colors">
                                                        {agent.label}
                                                    </h4>
                                                    <p className="text-[#8B95A1] text-sm mt-1">{agent.desc}</p>
                                                    
                                                    {/* Required Fields Tag */}
                                                    <div className="flex gap-2 mt-3">
                                                        {agent.requiredFields.map(field => (
                                                            <span key={field} className="text-[10px] px-2 py-1 rounded-md bg-[#F9FAFB] text-[#8B95A1] border border-[#E5E8EB]">
                                                                필요: {field}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <ArrowRight className="h-5 w-5 text-[#E5E8EB] group-hover:text-[#3182F6] transition-colors" />
                                        </div>
                                    ))}
                                </div>
                                
                                <Alert className="bg-blue-50 border-blue-100 text-[#3182F6]">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Tip</AlertTitle>
                                    <AlertDescription>
                                        각 에이전트는 프로필에 저장된 데이터를 기반으로 글을 작성합니다.<br/>
                                        프로필 정보가 부족할 경우 이용이 제한될 수 있습니다.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}

                        {/* STEP 3: Chat Interface */}
                        {step === 'chat' && (
                            <div className="space-y-6 pb-20 max-w-4xl mx-auto">
                                 {messages.map((msg) => (
                                    <div 
                                        key={msg.id} 
                                        className={cn(
                                            "flex w-full gap-3 animate-in fade-in slide-in-from-bottom-2",
                                            msg.sender === 'user' ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        {msg.sender === 'ai' && (
                                            <Avatar className="h-8 w-8 mt-1 shadow-sm border border-white shrink-0">
                                                <div className="bg-gradient-to-br from-[#3182F6] to-[#1B64DA] w-full h-full flex items-center justify-center">
                                                    <Bot className="h-5 w-5 text-white" />
                                                </div>
                                            </Avatar>
                                        )}
                                        <div className={cn(
                                            "flex flex-col gap-1 max-w-[85%] md:max-w-[80%]",
                                            msg.sender === 'user' ? "items-end" : "items-start"
                                        )}>
                                            {msg.type === 'text' ? (
                                                <div className={cn(
                                                    "px-4 py-3 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap shadow-sm",
                                                    msg.sender === 'user' 
                                                        ? "bg-[#3182F6] text-white rounded-tr-none" 
                                                        : "bg-white text-[#333D4B] border border-[#E5E8EB] rounded-tl-none"
                                                )}>
                                                    {msg.content}
                                                </div>
                                            ) : (
                                                <div className="w-full min-w-[280px] md:min-w-[500px]">
                                                    <div className="flex items-center justify-between mb-2 px-1">
                                                        <span className="text-xs font-bold text-[#3182F6] flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md">
                                                            <FileText className="h-3 w-3" />
                                                            {msg.topic} Ver.{msg.version}
                                                        </span>
                                                        <span className="text-[11px] text-[#8B95A1]">
                                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
                                                    </div>
                                                    <Card className="border-[#E5E8EB] shadow-sm overflow-hidden bg-white">
                                                        <CardContent className="p-6 bg-white relative">
                                                            <Quote className="absolute top-4 left-4 h-8 w-8 text-gray-100 -z-10" />
                                                            <div className="text-[15px] leading-8 text-[#191F28] whitespace-pre-wrap font-medium font-serif">
                                                                {msg.content}
                                                            </div>
                                                        </CardContent>
                                                        <div className="bg-[#F9FAFB] px-4 py-3 border-t border-[#F2F4F6] flex justify-between items-center">
                                                            <Button variant="ghost" size="sm" className="h-8 text-xs text-[#4E5968] hover:bg-white hover:text-[#3182F6]" onClick={() => {
                                                                navigator.clipboard.writeText(msg.content);
                                                                toast({ description: "복사되었습니다." });
                                                            }}>
                                                                <Copy className="h-3.5 w-3.5 mr-1.5" /> 복사
                                                            </Button>
                                                        </div>
                                                    </Card>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                 {/* Loading State */}
                                {isGenerating && (
                                    <div className="flex w-full gap-3 justify-start animate-in fade-in">
                                        <Avatar className="h-8 w-8 mt-1 shadow-sm">
                                            <div className="bg-gradient-to-br from-[#3182F6] to-[#1B64DA] w-full h-full flex items-center justify-center">
                                                <Bot className="h-5 w-5 text-white" />
                                            </div>
                                        </Avatar>
                                        <div className="bg-white border border-[#E5E8EB] px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                            <span className="flex gap-1">
                                                <span className="w-1.5 h-1.5 bg-[#3182F6] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                <span className="w-1.5 h-1.5 bg-[#3182F6] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                <span className="w-1.5 h-1.5 bg-[#3182F6] rounded-full animate-bounce"></span>
                                            </span>
                                            <span className="text-xs text-[#8B95A1] font-medium ml-1">
                                                작성 중...
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* STEP 3 Input Area (Only visible in chat mode) */}
                    {step === 'chat' && (
                        <div className="bg-white border-t border-[#E5E8EB] p-4 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-20">
                            <div className="max-w-4xl mx-auto relative flex items-end gap-2">
                                <div className="relative flex-1 bg-[#F2F4F6] rounded-[24px] px-4 py-3 focus-within:bg-white transition-all border border-transparent focus-within:border-[#3182F6] focus-within:shadow-[0_0_0_2px_rgba(49,130,246,0.1)]">
                                    <Textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="수정하고 싶은 내용을 적어주세요..."
                                        className="min-h-[24px] max-h-[150px] w-full bg-transparent border-none p-0 resize-none focus-visible:ring-0 placeholder:text-[#B0B8C1] text-[15px] leading-relaxed shadow-none focus:ring-0 focus:outline-none"
                                        disabled={isGenerating}
                                    />
                                </div>
                                <Button 
                                    onClick={handleSendMessage} 
                                    disabled={!input.trim() || isGenerating}
                                    className={cn(
                                        "h-12 w-12 rounded-full flex-shrink-0 shadow-sm transition-all duration-200",
                                        input.trim() 
                                            ? "bg-[#3182F6] hover:bg-[#2b72d7] text-white" 
                                            : "bg-[#F2F4F6] text-[#B0B8C1] hover:bg-[#E5E8EB]"
                                    )}
                                >
                                    <Send className="h-5 w-5 ml-0.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}