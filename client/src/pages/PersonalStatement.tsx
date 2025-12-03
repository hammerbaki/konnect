import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles, Save, Wand2, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useMobileAction } from "@/lib/MobileActionContext";
import { useToast } from "@/hooks/use-toast";

interface EssayQuestion {
    id: string;
    title: string;
    description: string;
    maxLength: number;
    content: string;
}

export default function PersonalStatement() {
    const { setAction } = useMobileAction();
    const { toast } = useToast();

    const [questions, setQuestions] = useState<EssayQuestion[]>([
        {
            id: "growth",
            title: "성장과정",
            description: "자신의 성장과정과 가치관을 형성하게 된 계기를 구체적으로 기술해주세요.",
            maxLength: 1000,
            content: ""
        },
        {
            id: "personality",
            title: "성격의 장단점",
            description: "본인의 성격의 장단점과 단점을 극복하기 위해 노력한 경험을 기술해주세요.",
            maxLength: 1000,
            content: ""
        },
        {
            id: "motivation",
            title: "지원동기",
            description: "해당 직무를 선택한 이유와 본인이 적임자라고 생각하는 이유를 기술해주세요.",
            maxLength: 1000,
            content: ""
        },
        {
            id: "aspiration",
            title: "입사 후 포부",
            description: "입사 후 이루고 싶은 목표와 이를 달성하기 위한 구체적인 계획을 기술해주세요.",
            maxLength: 1000,
            content: ""
        }
    ]);

    const handleSave = () => {
        toast({
            title: "저장 완료",
            description: "자기소개서가 성공적으로 저장되었습니다.",
        });
    };

    useEffect(() => {
        setAction({
            icon: Save,
            label: "저장",
            onClick: handleSave
        });
        return () => setAction(null);
    }, []);

    const handleContentChange = (id: string, value: string) => {
        setQuestions(prev => prev.map(q => 
            q.id === id ? { ...q, content: value } : q
        ));
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-[28px] font-bold text-[#191F28] flex items-center gap-2">
                            <FileText className="h-8 w-8 text-[#3182F6]" />
                            자기소개서
                        </h2>
                        <p className="text-[#8B95A1] mt-1 text-lg">
                            AI가 당신의 경험을 분석하여 최적의 자소서를 제안해드립니다.
                        </p>
                    </div>
                    <Button onClick={handleSave} className="gap-2 h-12 px-6 rounded-xl bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/20 font-bold text-base hidden md:flex">
                        <Save className="h-5 w-5" /> 저장하기
                    </Button>
                </div>

                <div className="grid gap-8 md:grid-cols-[1fr_300px]">
                    <div className="space-y-6">
                        {questions.map((q, index) => (
                            <Card key={q.id} className="toss-card overflow-hidden border-none shadow-sm ring-1 ring-black/5">
                                <CardHeader className="pb-4 border-b border-[#F2F4F6] bg-white">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <Badge variant="secondary" className="bg-blue-50 text-[#3182F6] hover:bg-blue-100 mb-2 rounded-md px-2 py-0.5 font-medium">
                                                질문 {index + 1}
                                            </Badge>
                                            <CardTitle className="text-xl font-bold text-[#191F28]">{q.title}</CardTitle>
                                            <CardDescription className="text-[#4E5968] font-medium mt-1">
                                                {q.description}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 pt-6 bg-white">
                                    <div className="relative">
                                        <Textarea 
                                            value={q.content}
                                            onChange={(e) => handleContentChange(q.id, e.target.value)}
                                            placeholder="내용을 입력해주세요. (AI 자동완성 기능을 활용해보세요!)"
                                            className="min-h-[240px] resize-none text-base leading-relaxed p-4 rounded-xl border-[#E5E8EB] focus:border-[#3182F6] focus:ring-2 focus:ring-blue-100 transition-all shadow-inner bg-[#FAFAFB]"
                                            maxLength={q.maxLength}
                                        />
                                        <div className="absolute bottom-4 right-4 text-xs font-medium text-[#8B95A1] bg-white/80 px-2 py-1 rounded-full backdrop-blur-sm border border-[#E5E8EB]">
                                            {q.content.length} / {q.maxLength}자
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="gap-1.5 rounded-lg border-blue-100 bg-blue-50/50 text-[#3182F6] hover:bg-blue-100 hover:text-[#1B64DA] font-medium">
                                                <Sparkles className="h-3.5 w-3.5" />
                                                AI 소재 추천
                                            </Button>
                                            <Button variant="outline" size="sm" className="gap-1.5 rounded-lg border-purple-100 bg-purple-50/50 text-[#7C3AED] hover:bg-purple-100 hover:text-[#6D28D9] font-medium">
                                                <Wand2 className="h-3.5 w-3.5" />
                                                문장 다듬기
                                            </Button>
                                        </div>
                                        {q.content.length > 0 && (
                                            <div className="flex items-center gap-1.5 text-[#00BFA5] text-sm font-bold animate-in fade-in slide-in-from-left-2">
                                                <CheckCircle2 className="h-4 w-4" />
                                                작성중
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Sidebar Actions (Sticky on Desktop) */}
                    <div className="space-y-6 hidden md:block">
                        <div className="sticky top-24 space-y-4">
                            <Card className="toss-card bg-gradient-to-br from-[#3182F6] to-[#1B64DA] text-white border-none">
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                                        <Sparkles className="h-5 w-5" />
                                        AI 분석 리포트
                                    </h3>
                                    <p className="text-blue-100 text-sm mb-4 leading-relaxed">
                                        작성된 내용을 바탕으로<br/>
                                        직무 적합도와 강점을 분석해드립니다.
                                    </p>
                                    <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-none font-bold">
                                        전체 분석하기
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="toss-card">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">작성 현황</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {questions.map((q, i) => (
                                        <div key={q.id} className="flex items-center justify-between text-sm">
                                            <span className="text-[#4E5968]">{q.title}</span>
                                            {q.content.length > 100 ? (
                                                <Badge variant="default" className="bg-[#00BFA5] hover:bg-[#00BFA5] text-white border-none">완료</Badge>
                                            ) : q.content.length > 0 ? (
                                                <Badge variant="secondary" className="bg-orange-100 text-orange-600 hover:bg-orange-100 border-none">작성중</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[#B0B8C1] border-[#E5E8EB]">미작성</Badge>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}