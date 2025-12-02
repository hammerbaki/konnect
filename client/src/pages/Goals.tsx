import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Plus, Flag, ChevronDown, Calendar, MoreVertical } from "lucide-react";
import { MOCK_VISION, VisionGoal, YearlyGoal, HalfYearlyGoal, MonthlyGoal, WeeklyGoal, DailyGoal, Todo } from "@/lib/mockData";
import { useState, useEffect } from "react";
import { useMobileAction } from "@/lib/MobileActionContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Goals() {
  const [vision, setVision] = useState<VisionGoal>(MOCK_VISION);
  const { setAction } = useMobileAction();
  const { toast } = useToast();

  // Selection State
  const [selectedYearId, setSelectedYearId] = useState<string | null>("year-2025");
  const [selectedHalfYearId, setSelectedHalfYearId] = useState<string | null>("h1-2025");
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>("m1-2025");
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>("w1-m1");

  // Derived Data based on selection
  const selectedYear = vision.children.find(y => y.id === selectedYearId);
  const selectedHalfYear = selectedYear?.children.find(h => h.id === selectedHalfYearId);
  const selectedMonth = selectedHalfYear?.children.find(m => m.id === selectedMonthId);
  const selectedWeek = selectedMonth?.children.find(w => w.id === selectedWeekId);

  const handleNewGoal = () => {
      toast({
          title: "새 목표 만들기",
          description: "이 기능은 준비 중입니다.",
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

  const toggleTodo = (dailyId: string, todoId: string) => {
      // Deep clone vision to update state immutably
      const newVision = JSON.parse(JSON.stringify(vision)) as VisionGoal;
      
      // Find path to update
      const year = newVision.children.find(y => y.id === selectedYearId);
      const half = year?.children.find(h => h.id === selectedHalfYearId);
      const month = half?.children.find(m => m.id === selectedMonthId);
      const week = month?.children.find(w => w.id === selectedWeekId);
      const day = week?.children.find(d => d.id === dailyId);

      if (day) {
          const todo = day.todos.find(t => t.id === todoId);
          if (todo) {
              todo.completed = !todo.completed;
              
              // Update Progress Logic (Bottom-Up)
              // 1. Day Progress
              const completedTodos = day.todos.filter(t => t.completed).length;
              day.progress = Math.round((completedTodos / day.todos.length) * 100);

              // 2. Week Progress (Average of days)
              if (week) {
                  const totalDayProgress = week.children.reduce((sum, d) => sum + d.progress, 0);
                  week.progress = Math.round(totalDayProgress / (week.children.length || 1));
              }

              // 3. Month Progress
              if (month && month.children) {
                  const totalWeekProgress = month.children.reduce((sum, w) => sum + w.progress, 0);
                  month.progress = Math.round(totalWeekProgress / (month.children.length || 1));
              }
              
              // 4. Half Year Progress
              if (half && half.children) {
                   const totalMonthProgress = half.children.reduce((sum, m) => sum + m.progress, 0);
                   half.progress = Math.round(totalMonthProgress / (half.children.length || 1));
              }

              // 5. Year Progress
              if (year && year.children) {
                  const totalHalfProgress = year.children.reduce((sum, h) => sum + h.progress, 0);
                  year.progress = Math.round(totalHalfProgress / (year.children.length || 1));
              }

              // 6. Vision Progress
              const totalYearProgress = newVision.children.reduce((sum, y) => sum + y.progress, 0);
              newVision.progress = Math.round(totalYearProgress / (newVision.children.length || 1));
              
              setVision(newVision);
          }
      }
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-4xl mx-auto pb-20">
        <div className="text-center mb-8 pt-6">
            <h2 className="text-[28px] font-bold text-[#191F28]">목표 관리 (Vision Tree)</h2>
            <p className="text-[#8B95A1] mt-2 text-lg">꿈을 현실로 만드는 가장 확실한 방법</p>
        </div>

        {/* Level 1: Vision Card */}
        <div className="flex justify-center">
            <div className="relative w-full max-w-2xl z-50">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#191F28] text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                    Final Vision ({vision.targetYear})
                </div>
                <Card className="toss-card border-2 border-[#191F28] shadow-2xl bg-[#F9FAFB]">
                    <CardContent className="p-8 text-center">
                        <Flag className="h-12 w-12 mx-auto text-[#191F28] mb-4" />
                        <h1 className="text-3xl font-bold text-[#191F28] mb-2">{vision.title}</h1>
                        <p className="text-[#4E5968] text-lg mb-6">{vision.description}</p>
                        <div className="w-full max-w-md mx-auto">
                            <div className="flex justify-between text-sm font-bold text-[#333D4B] mb-2">
                                <span>전체 달성률</span>
                                <span className="text-[#3182F6]">{vision.progress}%</span>
                            </div>
                            <Progress value={vision.progress} className="h-3" indicatorClassName="bg-[#191F28]" />
                        </div>
                    </CardContent>
                </Card>
                {/* Connector Line */}
                <div className="absolute left-1/2 bottom-[-32px] w-0.5 h-8 bg-[#E5E8EB] -translate-x-1/2 z-0" />
            </div>
        </div>

        {/* Level 2: Yearly Goals */}
        <div className="space-y-4 relative">
             <div className="text-center">
                <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] mb-2">Yearly Goals</Badge>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vision.children.map((year) => (
                    <div key={year.id} className="relative group">
                        <Card 
                            onClick={() => setSelectedYearId(year.id)}
                            className={cn(
                                "toss-card cursor-pointer transition-all hover:-translate-y-1",
                                selectedYearId === year.id 
                                    ? "border-2 border-[#3182F6] shadow-lg shadow-blue-500/10 bg-blue-50/30" 
                                    : "hover:shadow-md border border-transparent"
                            )}
                        >
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className={cn("font-bold text-lg", selectedYearId === year.id ? "text-[#3182F6]" : "text-[#333D4B]")}>
                                        {year.title}
                                    </h3>
                                    {selectedYearId === year.id && <CheckCircle2 className="h-5 w-5 text-[#3182F6]" />}
                                </div>
                                <Progress value={year.progress} className="h-2 mb-2" indicatorClassName={selectedYearId === year.id ? "bg-[#3182F6]" : "bg-[#B0B8C1]"} />
                                <p className="text-right text-xs font-bold text-[#8B95A1]">{year.progress}%</p>
                            </CardContent>
                        </Card>
                        {/* Connector to Next Level */}
                        {selectedYearId === year.id && (
                            <div className="absolute left-1/2 bottom-[-32px] w-0.5 h-12 bg-[#3182F6] -translate-x-1/2 z-10 hidden md:block" />
                        )}
                    </div>
                ))}
             </div>
        </div>

        {/* Level 3: Half-Yearly Goals */}
        {selectedYear && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="text-center pt-4">
                    <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] mb-2">Half-Yearly Goals</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    {selectedYear.children.map((half) => (
                        <Card 
                            key={half.id}
                            onClick={() => setSelectedHalfYearId(half.id)}
                            className={cn(
                                "toss-card cursor-pointer transition-all",
                                selectedHalfYearId === half.id 
                                    ? "border-2 border-[#00BFA5] shadow-lg bg-emerald-50/30" 
                                    : "hover:shadow-md border border-transparent"
                            )}
                        >
                            <CardContent className="p-5">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className={cn("font-bold", selectedHalfYearId === half.id ? "text-[#00BFA5]" : "text-[#333D4B]")}>
                                        {half.title}
                                    </h4>
                                </div>
                                <Progress value={half.progress} className="h-2 mb-2" indicatorClassName={selectedHalfYearId === half.id ? "bg-[#00BFA5]" : "bg-[#B0B8C1]"} />
                                <p className="text-right text-xs font-bold text-[#8B95A1]">{half.progress}%</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )}

        {/* Level 4: Monthly Goals */}
        {selectedHalfYear && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="text-center pt-4">
                     <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] mb-2">Monthly Goals</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedHalfYear.children.length > 0 ? (
                        selectedHalfYear.children.map((month) => (
                            <Card 
                                key={month.id}
                                onClick={() => setSelectedMonthId(month.id)}
                                className={cn(
                                    "toss-card cursor-pointer transition-all",
                                    selectedMonthId === month.id 
                                        ? "border-2 border-[#FFB300] shadow-lg bg-amber-50/30" 
                                        : "hover:shadow-md border border-transparent"
                                )}
                            >
                                <CardContent className="p-4">
                                    <h5 className={cn("font-bold text-sm mb-3 truncate", selectedMonthId === month.id ? "text-[#FFB300]" : "text-[#333D4B]")}>
                                        {month.title}
                                    </h5>
                                    <Progress value={month.progress} className="h-1.5 mb-1" indicatorClassName={selectedMonthId === month.id ? "bg-[#FFB300]" : "bg-[#B0B8C1]"} />
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full text-center text-[#8B95A1] py-4">하위 목표가 없습니다.</div>
                    )}
                </div>
            </div>
        )}

        {/* Level 5: Weekly Goals */}
        {selectedMonth && (
             <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="text-center pt-4">
                     <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] mb-2">Weekly Goals</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedMonth.children.length > 0 ? (
                        selectedMonth.children.map((week) => (
                            <Card 
                                key={week.id}
                                onClick={() => setSelectedWeekId(week.id)}
                                className={cn(
                                    "toss-card cursor-pointer transition-all",
                                    selectedWeekId === week.id 
                                        ? "border-2 border-[#9852F8] shadow-lg bg-purple-50/30" 
                                        : "hover:shadow-md border border-transparent"
                                )}
                            >
                                <CardContent className="p-4">
                                    <h5 className={cn("font-bold text-sm mb-3 truncate", selectedWeekId === week.id ? "text-[#9852F8]" : "text-[#333D4B]")}>
                                        {week.title}
                                    </h5>
                                    <Progress value={week.progress} className="h-1.5 mb-1" indicatorClassName={selectedWeekId === week.id ? "bg-[#9852F8]" : "bg-[#B0B8C1]"} />
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                         <div className="col-span-full text-center text-[#8B95A1] py-4">하위 목표가 없습니다.</div>
                    )}
                </div>
            </div>
        )}

        {/* Level 6: Daily Goals (To-Dos) */}
        {selectedWeek && (
             <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 pb-10">
                <div className="text-center pt-4">
                     <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] mb-2">Daily To-Dos</Badge>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {selectedWeek.children.length > 0 ? (
                        selectedWeek.children.map((day) => (
                            <Card key={day.id} className="toss-card border-l-4 border-l-[#3182F6]">
                                <CardHeader className="py-4 px-5 border-b border-[#F2F4F6] bg-[#F9FAFB]">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-base font-bold text-[#191F28]">{day.title}</CardTitle>
                                        <span className="text-xs font-bold text-[#3182F6] bg-blue-50 px-2 py-1 rounded-full">
                                            {day.progress}% 달성
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-[#F2F4F6]">
                                        {day.todos.map((todo) => (
                                            <div 
                                                key={todo.id} 
                                                onClick={() => toggleTodo(day.id, todo.id)}
                                                className="flex items-center p-4 hover:bg-[#F2F4F6] cursor-pointer transition-colors"
                                            >
                                                <div className={cn(
                                                    "mr-4 transition-colors",
                                                    todo.completed ? "text-[#3182F6]" : "text-[#D1D6DB]"
                                                )}>
                                                    {todo.completed ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                                                </div>
                                                <span className={cn(
                                                    "text-sm font-medium flex-1",
                                                    todo.completed ? "text-[#B0B8C1] line-through" : "text-[#333D4B]"
                                                )}>
                                                    {todo.title}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                         <div className="col-span-full text-center text-[#8B95A1] py-4">하위 목표가 없습니다.</div>
                    )}
                </div>
            </div>
        )}
      </div>
    </Layout>
  );
}
