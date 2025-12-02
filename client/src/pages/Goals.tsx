import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Plus, ArrowRight, Calendar, Clock, Flag, ListTodo } from "lucide-react";
import { MOCK_GOALS } from "@/lib/mockData";
import { useState, useEffect } from "react";
import { useMobileAction } from "@/lib/MobileActionContext";
import { useToast } from "@/hooks/use-toast";

export default function Goals() {
  const [goals, setGoals] = useState(MOCK_GOALS);
  const { setAction } = useMobileAction();
  const { toast } = useToast();

  const handleNewGoal = () => {
      toast({
          title: "새 목표 만들기",
          description: "목표 생성 기능이 곧 업데이트될 예정입니다.",
      });
  };

  useEffect(() => {
    setAction({
      icon: Plus,
      label: "추가",
      onClick: handleNewGoal
    });
    return () => setAction(null);
  }, []);

  const toggleStep = (goalId: string, stepId: string) => {
    setGoals(goals.map(goal => {
      if (goal.id !== goalId) return goal;
      
      const updatedSteps = goal.steps.map(step => 
        step.id === stepId ? { ...step, isCompleted: !step.isCompleted } : step
      );
      
      const completedCount = updatedSteps.filter(s => s.isCompleted).length;
      const newProgress = Math.round((completedCount / updatedSteps.length) * 100);
      
      return {
        ...goal,
        steps: updatedSteps,
        progress: newProgress,
        status: newProgress === 100 ? "completed" : newProgress > 0 ? "in-progress" : "pending"
      };
    }));
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[28px] font-bold text-[#191F28]">목표 관리 (Vision Tree)</h2>
            <p className="text-[#8B95A1] mt-1 text-lg">장기 비전부터 일일 계획까지 체계적으로 관리하세요.</p>
          </div>
          <Button className="gap-2 h-12 px-6 rounded-xl bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/20 font-bold text-base">
            <Plus className="h-5 w-5" /> 새 목표 만들기
          </Button>
        </div>

        {/* Tree Structure Visualization */}
        <div className="relative border-l-2 border-dashed border-[#E5E8EB] ml-6 md:ml-10 pl-8 md:pl-12 space-y-12">
            
            {/* 3 Year Plan */}
            <div className="relative">
                <div className="absolute -left-[49px] md:-left-[65px] top-0 h-10 w-10 bg-[#191F28] rounded-full flex items-center justify-center text-white shadow-md z-10">
                    <Flag className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-[#191F28] mb-4">3년 비전 (2028)</h3>
                <Card className="toss-card bg-[#F9FAFB] border-none">
                    <CardContent className="p-6">
                        <p className="font-bold text-lg text-[#191F28]">CPO (Chief Product Officer) 달성</p>
                        <p className="text-[#8B95A1] mt-1">유니콘 기업 규모의 제품 총괄 리더십 확보</p>
                    </CardContent>
                </Card>
            </div>

            {/* 1 Year Plan (Current Goals) */}
            <div className="relative">
                <div className="absolute -left-[49px] md:-left-[65px] top-0 h-10 w-10 bg-[#3182F6] rounded-full flex items-center justify-center text-white shadow-md z-10">
                    <Calendar className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-[#191F28] mb-4">올해 목표 (2025)</h3>
                
                <div className="grid gap-6">
                    {goals.map((goal) => (
                        <Card key={goal.id} className="toss-card overflow-hidden border-l-4 border-l-[#3182F6] p-0">
                        <CardHeader className="bg-white border-b border-[#F2F4F6] p-6">
                            <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                <CardTitle className="text-xl font-bold text-[#191F28]">{goal.title}</CardTitle>
                                <Badge className="bg-[#E8F3FF] text-[#1B64DA] border-none px-2.5 py-1 text-xs font-semibold">진행중</Badge>
                                </div>
                                <CardDescription className="flex items-center gap-4 text-[#8B95A1] font-medium">
                                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> 목표일: {new Date(goal.targetDate).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {goal.steps.length}단계 계획</span>
                                </CardDescription>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-[#3182F6]">{goal.progress}%</div>
                                <span className="text-xs text-[#8B95A1] font-medium">달성률</span>
                            </div>
                            </div>
                            <Progress value={goal.progress} className="h-2.5 mt-5 bg-[#E5E8EB]" indicatorClassName="bg-[#3182F6]" />
                        </CardHeader>
                        <CardContent className="p-6 bg-[#F9FAFB]">
                            <div className="space-y-4">
                            <h4 className="text-sm font-bold text-[#8B95A1] uppercase tracking-wide flex items-center gap-2">
                                <ListTodo className="h-4 w-4" /> 세부 실천 계획
                            </h4>
                            <div className="space-y-3">
                                {goal.steps.map((step) => (
                                <div 
                                    key={step.id} 
                                    className={`flex items-center p-4 rounded-xl border transition-all duration-200 cursor-pointer group ${
                                    step.isCompleted 
                                        ? 'bg-[#F2F4F6] border-transparent' 
                                        : 'bg-white border-[#E5E8EB] hover:border-[#3182F6] hover:shadow-sm'
                                    }`}
                                    onClick={() => toggleStep(goal.id, step.id)}
                                >
                                    <div className={`mr-4 flex-shrink-0 ${step.isCompleted ? 'text-[#00BFA5]' : 'text-[#D1D6DB] group-hover:text-[#3182F6]'}`}>
                                    {step.isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                                    </div>
                                    <span className={`flex-1 text-base ${step.isCompleted ? 'text-[#B0B8C1] line-through font-medium' : 'font-bold text-[#333D4B]'}`}>
                                    {step.title}
                                    </span>
                                    {step.isCompleted && <span className="text-xs text-[#00BFA5] font-bold px-2.5 py-1 bg-emerald-50 rounded-full">완료</span>}
                                </div>
                                ))}
                            </div>
                            </div>
                        </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </Layout>
  );
}
