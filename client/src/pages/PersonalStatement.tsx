import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Sparkles, User, Bot, RotateCcw, Copy, Check, Pencil, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Types
type MessageType = 'text' | 'draft';
type Sender = 'user' | 'ai';

interface Message {
    id: string;
    sender: Sender;
    type: MessageType;
    content: string;
    timestamp: Date;
    version?: number; // For drafts
}

interface EssayTopic {
    id: string;
    label: string;
    description: string;
}

const TOPICS: EssayTopic[] = [
    { id: "growth", label: "성장과정", description: "자신의 성장과정과 가치관 형성 계기" },
    { id: "personality", label: "성격의 장단점", description: "본인의 성격 장단점과 극복 노력" },
    { id: "motivation", label: "지원동기", description: "직무 선택 이유와 본인이 적임자인 이유" },
    { id: "aspiration", label: "입사 후 포부", description: "입사 후 목표와 달성 계획" },
];

// Mock Drafts
const MOCK_DRAFT_V1 = `저는 '데이터로 세상을 읽는 눈'을 키우며 성장해왔습니다. 대학 시절 통계학을 전공하며 수치 뒤에 숨겨진 인사이트를 발견하는 것에 흥미를 느꼈고, 이는 자연스럽게 데이터 분석가라는 꿈으로 이어졌습니다.

특히 캡스톤 디자인 프로젝트에서 교내 식당 혼잡도 예측 모델을 개발했던 경험은 저에게 큰 터닝포인트가 되었습니다. 단순히 모델의 정확도를 높이는 것을 넘어, 실제 학생들이 겪는 '점심시간의 기다림'이라는 문제를 해결하고 싶다는 목표가 있었기 때문입니다. 데이터를 수집하고 분석하는 과정에서 예상치 못한 변수들에 부딪히기도 했지만, 팀원들과 밤을 새워가며 토론하고 문제를 하나씩 해결해 나가는 과정에서 '함께 성장하는 기쁨'을 배웠습니다.

이러한 경험을 통해 저는 단순히 기술적인 역량뿐만 아니라, 문제를 정의하고 해결해 나가는 끈기와 협업의 중요성을 깊이 깨닫게 되었습니다. 귀사에서도 이러한 저의 가치관을 바탕으로 동료들과 함께 성장하며, 데이터 기반의 의사결정을 통해 실질적인 가치를 창출하는 인재가 되고 싶습니다.`;

const MOCK_DRAFT_V2 = `[수정됨] 저는 데이터를 통해 세상을 더 효율적으로 만드는 것에 깊은 관심을 가지고 성장했습니다. 통계학 전공을 통해 데이터 분석의 기초를 다졌고, 이를 실생활 문제 해결에 적용하고자 노력해왔습니다.

가장 기억에 남는 경험은 대학 시절 진행한 '교내 식당 혼잡도 예측 프로젝트'입니다. 당시 학생들은 점심시간마다 긴 대기 줄로 인해 불편을 겪고 있었습니다. 저는 이 문제를 해결하고자 팀을 구성하여 식당 이용 데이터를 수집하고, 머신러닝 모델을 활용하여 시간대별 혼잡도를 예측하는 서비스를 개발했습니다.

초기 모델은 정확도가 낮았지만, 날씨나 시험 기간 같은 외부 변수를 추가하고 하이퍼파라미터를 튜닝하며 성능을 개선했습니다. 그 결과 예측 정확도를 85%까지 끌어올릴 수 있었고, 실제 학교 앱에 탑재되어 학생들의 대기 시간을 평균 10분 단축하는 성과를 거두었습니다.

이 과정에서 저는 데이터가 실제 삶의 문제를 해결하는 강력한 도구가 될 수 있음을 확신했습니다. 귀사에서도 이러한 문제 해결 능력과 실행력을 바탕으로 비즈니스 임팩트를 창출하는 PM이 되겠습니다.`;

export default function PersonalStatement() {
    const { toast } = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [selectedTopic, setSelectedTopic] = useState<string>("growth");
    const [input, setInput] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            sender: "ai",
            type: "text",
            content: "안녕하세요! 자기소개서 작성을 도와드릴 AI 코치입니다.\n작성하시려는 항목을 선택하고, 관련된 경험이나 키워드를 자유롭게 말씀해주세요. 초안을 작성해드리겠습니다.",
            timestamp: new Date()
        }
    ]);

    // Scroll to bottom on new message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = () => {
        if (!input.trim()) return;

        // 1. Add User Message
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

        // 2. Simulate AI Response (Mocking the flow)
        setTimeout(() => {
            // Determine if we should send a draft or text based on context (simple mock logic)
            const isFirstDraftRequest = messages.length < 3; 
            
            if (isFirstDraftRequest) {
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    sender: "ai",
                    type: "text",
                    content: "말씀해주신 내용을 바탕으로 초안을 작성해보았습니다. 내용을 확인하시고 수정하고 싶은 부분이 있다면 말씀해주세요.",
                    timestamp: new Date()
                };
                 const draftMsg: Message = {
                    id: (Date.now() + 2).toString(),
                    sender: "ai",
                    type: "draft",
                    content: MOCK_DRAFT_V1,
                    timestamp: new Date(),
                    version: 1
                };
                setMessages(prev => [...prev, aiMsg, draftMsg]);
            } else {
                 const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    sender: "ai",
                    type: "text",
                    content: "피드백을 반영하여 내용을 수정했습니다. 더 구체적인 성과 수치를 포함하고, 직무 적합성을 강조했습니다.",
                    timestamp: new Date()
                };
                 const draftMsg: Message = {
                    id: (Date.now() + 2).toString(),
                    sender: "ai",
                    type: "draft",
                    content: MOCK_DRAFT_V2,
                    timestamp: new Date(),
                    version: 2
                };
                setMessages(prev => [...prev, aiMsg, draftMsg]);
            }
            setIsGenerating(false);
        }, 1500);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ description: "클립보드에 복사되었습니다." });
    };

    return (
        <Layout>
            <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col">
                {/* Header Area */}
                <div className="flex items-center justify-between mb-6 px-4 md:px-0">
                    <div>
                        <h2 className="text-2xl font-bold text-[#191F28] flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-[#3182F6]" />
                            AI 자소서 코치
                        </h2>
                        <p className="text-[#8B95A1] text-sm mt-1">
                            대화하듯 경험을 이야기하면, AI가 전문적인 자소서를 완성해줍니다.
                        </p>
                    </div>
                    <div className="w-[200px]">
                         <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                            <SelectTrigger className="bg-white border-[#E5E8EB] rounded-xl h-11">
                                <SelectValue placeholder="주제 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                {TOPICS.map(topic => (
                                    <SelectItem key={topic.id} value={topic.id}>
                                        {topic.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Chat Area */}
                <Card className="flex-1 flex flex-col border-none shadow-sm bg-[#F9FAFB] overflow-hidden rounded-2xl ring-1 ring-black/5">
                    
                    {/* Messages List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                        {messages.map((msg, index) => (
                            <div 
                                key={msg.id} 
                                className={cn(
                                    "flex w-full gap-3",
                                    msg.sender === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                {/* Avatar (AI only) */}
                                {msg.sender === 'ai' && (
                                    <Avatar className="h-8 w-8 mt-1 shadow-sm border border-white">
                                        <div className="bg-gradient-to-br from-[#3182F6] to-[#1B64DA] w-full h-full flex items-center justify-center">
                                            <Bot className="h-5 w-5 text-white" />
                                        </div>
                                    </Avatar>
                                )}

                                {/* Message Bubble */}
                                <div className={cn(
                                    "max-w-[85%] md:max-w-[70%]",
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
                                        // Draft Card View
                                        <div className="w-full min-w-[300px] md:min-w-[480px]">
                                            <div className="flex items-center justify-between mb-2 px-1">
                                                <span className="text-xs font-bold text-[#3182F6] flex items-center gap-1">
                                                    <FileText className="h-3 w-3" />
                                                    Draft Ver.{msg.version}
                                                </span>
                                                <span className="text-[11px] text-[#8B95A1]">
                                                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                            <Card className="border-[#E5E8EB] shadow-sm overflow-hidden transition-all hover:shadow-md">
                                                <CardContent className="p-5 bg-white">
                                                    <div className="text-[15px] leading-7 text-[#191F28] whitespace-pre-wrap font-medium">
                                                        {msg.content}
                                                    </div>
                                                </CardContent>
                                                <div className="bg-[#F9FAFB] px-4 py-3 border-t border-[#F2F4F6] flex justify-between items-center">
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="sm" className="h-8 text-xs text-[#4E5968] hover:bg-white hover:text-[#3182F6]" onClick={() => copyToClipboard(msg.content)}>
                                                            <Copy className="h-3.5 w-3.5 mr-1.5" />
                                                            복사
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-8 text-xs text-[#4E5968] hover:bg-white hover:text-[#3182F6]">
                                                            <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                                            직접 수정
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
                        
                        {/* Loading Indicator */}
                        {isGenerating && (
                            <div className="flex w-full gap-3 justify-start">
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
                                    <span className="text-xs text-[#8B95A1] font-medium ml-1">작성 중...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area - Sticky Bottom */}
                    <div className="p-4 bg-white border-t border-[#E5E8EB]">
                        <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
                            <div className="relative flex-1 bg-[#F2F4F6] rounded-[24px] px-4 py-3 focus-within:ring-2 focus-within:ring-[#3182F6]/20 focus-within:bg-white transition-all border border-transparent focus-within:border-[#3182F6]">
                                <Textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="예: 통계학 전공을 살려 식당 혼잡도 예측 프로젝트를 했던 경험을 넣어줘."
                                    className="min-h-[24px] max-h-[120px] w-full bg-transparent border-none p-0 resize-none focus-visible:ring-0 placeholder:text-[#B0B8C1] text-[15px] leading-relaxed"
                                    rows={1}
                                    style={{ height: 'auto' }}
                                    onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        target.style.height = 'auto';
                                        target.style.height = `${target.scrollHeight}px`;
                                    }}
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
                        <div className="text-center mt-2">
                            <p className="text-[11px] text-[#8B95A1]">
                                AI가 생성한 내용은 부정확할 수 있으니 확인이 필요합니다.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </Layout>
    );
}