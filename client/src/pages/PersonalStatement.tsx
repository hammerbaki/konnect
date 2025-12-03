import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Bot, Copy, Pencil, FileText, ChevronLeft, ChevronRight, RefreshCcw, User, Quote } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Mock Profile Data (Simulating retrieval from DB)
const USER_PROFILE = {
    name: "John Doe",
    role: "Product Manager",
    years: 5,
    experiences: [
        "Tech Corp Inc. (Senior PM) - B2B SaaS Launch",
        "Startup X (PO) - Mobile App Renewal, 300% DAU Growth"
    ],
    keywords: ["Data-driven", "Leadership", "Growth"]
};

// Types
type MessageType = 'text' | 'draft';
type Sender = 'user' | 'ai';
type TopicId = 'growth' | 'personality' | 'motivation' | 'aspiration';

interface Message {
    id: string;
    sender: Sender;
    type: MessageType;
    content: string;
    timestamp: Date;
    version?: number;
    topic?: string;
}

interface TopicAgent {
    id: TopicId;
    label: string;
    color: string;
    prompt: string;
}

const AGENTS: TopicAgent[] = [
    { 
        id: "growth", 
        label: "성장과정 분석 에이전트", 
        color: "bg-green-100 text-green-700",
        prompt: "사용자의 과거 경험과 가치관 형성을 중심으로 성장과정을 작성해줘." 
    },
    { 
        id: "personality", 
        label: "성격/장단점 분석 에이전트", 
        color: "bg-orange-100 text-orange-700",
        prompt: "직무 수행에 강점이 되는 성격과 보완 노력에 대해 작성해줘." 
    },
    { 
        id: "motivation", 
        label: "지원동기 분석 에이전트", 
        color: "bg-blue-100 text-blue-700",
        prompt: "이 직무를 선택한 이유와 본인의 적합성을 연결하여 작성해줘." 
    },
    { 
        id: "aspiration", 
        label: "커리어 비전 에이전트", 
        color: "bg-purple-100 text-purple-700",
        prompt: "입사 후 구체적인 목표와 기여 방안을 작성해줘." 
    },
];

export default function PersonalStatement() {
    const { toast } = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    const [activeTopic, setActiveTopic] = useState<TopicId | null>(null);
    const [input, setInput] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "system-welcome",
            sender: "ai",
            type: "text",
            content: `안녕하세요 ${USER_PROFILE.name}님! 👋\n\n프로필에 입력된 ${USER_PROFILE.years}년차 ${USER_PROFILE.role} 경력과 '${USER_PROFILE.keywords.join(", ")}' 키워드를 바탕으로 자기소개서를 작성해드릴 준비가 되었습니다.\n\n아래에서 작성하고 싶은 주제를 선택해주세요.`,
            timestamp: new Date()
        }
    ]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isGenerating]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    const handleTopicSelect = (topic: TopicAgent) => {
        setActiveTopic(topic.id);
        
        // Add System Message indicating context switch
        const switchMsg: Message = {
            id: Date.now().toString(),
            sender: "ai",
            type: "text",
            content: `[${topic.label}] 모드로 전환되었습니다. 프로필을 분석하여 초안을 작성하겠습니다.`,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, switchMsg]);
        setIsGenerating(true);

        // Simulate AI Generation based on Profile
        setTimeout(() => {
            const draftContent = generateMockDraft(topic.id);
            
            const draftMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: "ai",
                type: "draft",
                content: draftContent,
                topic: topic.label,
                version: 1,
                timestamp: new Date()
            };
            
            setMessages(prev => [...prev, draftMsg]);
            setIsGenerating(false);
        }, 2000);
    };

    const handleSendMessage = () => {
        if (!input.trim()) return;
        if (!activeTopic) {
            toast({ description: "먼저 작성할 주제를 선택해주세요.", variant: "destructive" });
            return;
        }

        // User Message
        const userMsg: Message = {
            id: Date.now().toString(),
            sender: "user",
            type: "text",
            content: input,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsGenerating(true);

        // Simulate AI Revision
        setTimeout(() => {
            const currentAgent = AGENTS.find(a => a.id === activeTopic);
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: "ai",
                type: "text",
                content: "요청하신 내용을 반영하여 내용을 다듬었습니다.",
                timestamp: new Date()
            };
            
            // Create a slightly different draft to simulate revision
            const prevDraft = [...messages].reverse().find(m => m.type === 'draft' && m.topic === currentAgent?.label);
            const newVersion = (prevDraft?.version || 1) + 1;
            
            const draftMsg: Message = {
                id: (Date.now() + 2).toString(),
                sender: "ai",
                type: "draft",
                content: `[수정됨 v${newVersion}]\n\n${prevDraft?.content || generateMockDraft(activeTopic)}\n\n(사용자 요청 "${input}" 반영 완료)`,
                topic: currentAgent?.label,
                version: newVersion,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg, draftMsg]);
            setIsGenerating(false);
        }, 1500);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const generateMockDraft = (topicId: string) => {
        // Simple mock generator using profile data
        const baseIntro = `저는 ${USER_PROFILE.years}년차 ${USER_PROFILE.role}로서 `;
        
        switch(topicId) {
            case 'growth':
                return `${baseIntro} 끊임없는 성장을 추구해왔습니다.\n특히 ${USER_PROFILE.experiences[0]} 경험을 통해 데이터 기반 의사결정의 중요성을 배웠으며, 이는 제 가치관의 핵심이 되었습니다.`;
            case 'personality':
                return `${baseIntro} '분석적 사고'와 '추진력'을 겸비하고 있습니다.\n${USER_PROFILE.experiences[1]} 당시, 불확실한 상황에서도 데이터를 근거로 팀을 설득하여 300% 성장을 이뤄낸 경험이 이를 증명합니다.`;
            case 'motivation':
                return `${baseIntro} 귀사의 비전에 깊이 공감하여 지원했습니다.\n저의 ${USER_PROFILE.keywords.join(", ")} 역량이 귀사의 서비스 확장에 기여할 수 있다고 확신합니다.`;
            case 'aspiration':
                return `${baseIntro} 입사 후 1년 내에 핵심 지표를 2배 성장시키는 것이 목표입니다.\n과거 ${USER_PROFILE.experiences[1]} 성공 경험을 바탕으로, 실질적인 비즈니스 임팩트를 만들어내겠습니다.`;
            default:
                return "초안 작성 중...";
        }
    };

    return (
        <Layout>
            <div className="max-w-5xl mx-auto h-[calc(100vh-40px)] md:h-[calc(100vh-80px)] flex flex-col bg-white md:rounded-2xl md:shadow-sm md:border border-[#E5E8EB] overflow-hidden">
                
                {/* 1. Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2F4F6] bg-white z-10">
                    <div>
                        <h2 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-[#3182F6]" />
                            AI 자소서 코치
                        </h2>
                    </div>
                    <Badge variant="outline" className="bg-[#F2F4F6] text-[#4E5968] border-none font-medium">
                        <User className="h-3 w-3 mr-1" /> {USER_PROFILE.name}님의 프로필 연동됨
                    </Badge>
                </div>

                {/* 2. Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#F9FAFB]" ref={scrollRef}>
                    {messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={cn(
                                "flex w-full gap-3 animate-in fade-in slide-in-from-bottom-2",
                                msg.sender === 'user' ? "justify-end" : "justify-start"
                            )}
                        >
                            {/* Avatar */}
                            {msg.sender === 'ai' && (
                                <Avatar className="h-8 w-8 mt-1 shadow-sm border border-white shrink-0">
                                    <div className="bg-gradient-to-br from-[#3182F6] to-[#1B64DA] w-full h-full flex items-center justify-center">
                                        <Bot className="h-5 w-5 text-white" />
                                    </div>
                                </Avatar>
                            )}

                            <div className={cn(
                                "flex flex-col gap-1 max-w-[85%] md:max-w-[70%]",
                                msg.sender === 'user' ? "items-end" : "items-start"
                            )}>
                                {/* Message Bubble */}
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
                                    // Draft Card
                                    <div className="w-full min-w-[280px] md:min-w-[500px]">
                                        <div className="flex items-center justify-between mb-2 px-1">
                                            <span className="text-xs font-bold text-[#3182F6] flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md">
                                                <FileText className="h-3 w-3" />
                                                {msg.topic} Ver.{msg.version}
                                            </span>
                                            <span className="text-[11px] text-[#8B95A1]">
                                                {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <Card className="border-[#E5E8EB] shadow-sm overflow-hidden transition-all hover:shadow-md group bg-white">
                                            <CardContent className="p-6 bg-white relative">
                                                <Quote className="absolute top-4 left-4 h-8 w-8 text-gray-100 -z-10" />
                                                <div className="text-[15px] leading-8 text-[#191F28] whitespace-pre-wrap font-medium font-serif">
                                                    {msg.content}
                                                </div>
                                            </CardContent>
                                            <div className="bg-[#F9FAFB] px-4 py-3 border-t border-[#F2F4F6] flex justify-between items-center">
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-[#4E5968] hover:bg-white hover:text-[#3182F6]" onClick={() => {
                                                        navigator.clipboard.writeText(msg.content);
                                                        toast({ description: "복사되었습니다." });
                                                    }}>
                                                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                                                        복사
                                                    </Button>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-gray-200 disabled:opacity-30">
                                                        <ChevronLeft className="h-4 w-4 text-[#8B95A1]" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-gray-200 disabled:opacity-30">
                                                        <ChevronRight className="h-4 w-4 text-[#8B95A1]" />
                                                    </Button>
                                                </div>
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
                                    {activeTopic ? '작성 중...' : '생각 중...'}
                                </span>
                            </div>
                        </div>
                    )}
                    <div className="h-4" />
                </div>

                {/* 3. Input Area with Agents */}
                <div className="bg-white border-t border-[#E5E8EB] p-4 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-20">
                    <div className="max-w-4xl mx-auto space-y-3">
                        
                        {/* Topic Agents Selector (Pills) */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 md:mx-0 md:px-0">
                            {AGENTS.map((agent) => (
                                <button
                                    key={agent.id}
                                    onClick={() => handleTopicSelect(agent)}
                                    disabled={isGenerating}
                                    className={cn(
                                        "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border shadow-sm",
                                        activeTopic === agent.id
                                            ? "bg-[#191F28] text-white border-[#191F28] shadow-md"
                                            : "bg-white text-[#4E5968] border-[#E5E8EB] hover:bg-[#F9FAFB] hover:border-[#D1D6DB]"
                                    )}
                                >
                                    {agent.label}
                                </button>
                            ))}
                        </div>

                        {/* Input Box */}
                        <div className="relative flex items-end gap-2">
                            <div className="relative flex-1 bg-[#F2F4F6] rounded-[24px] px-4 py-3 focus-within:bg-white transition-all border border-transparent focus-within:border-[#3182F6] focus-within:shadow-[0_0_0_2px_rgba(49,130,246,0.1)]">
                                <Textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={activeTopic ? "수정하고 싶은 내용을 자유롭게 적어주세요..." : "먼저 위에서 주제를 선택해주세요!"}
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
                        
                        <div className="text-center">
                             <p className="text-[11px] text-[#8B95A1]">
                                {activeTopic ? (
                                    <span><span className="font-bold text-[#3182F6]">Tip:</span> "더 구체적인 수치를 넣어줘" 또는 "리더십을 강조해줘"라고 말해보세요.</span>
                                ) : (
                                    "작성할 주제를 선택하면 AI가 초안을 만들어드립니다."
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}