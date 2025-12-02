import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Plus, Flag, MoreVertical, Pencil, Edit2, X } from "lucide-react";
import { MOCK_VISION, VisionGoal, DailyGoal, Todo } from "@/lib/mockData";
import { useState, useEffect } from "react";
import { useMobileAction } from "@/lib/MobileActionContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export default function Goals() {
  const [vision, setVision] = useState<VisionGoal>(MOCK_VISION);
  const { setAction } = useMobileAction();
  const { toast } = useToast();

  // Selection State - Initialize with the first item of each level
  const [selectedYearId, setSelectedYearId] = useState<string | null>(vision.children[0]?.id || null);
  const [selectedHalfYearId, setSelectedHalfYearId] = useState<string | null>(vision.children[0]?.children[0]?.id || null);
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(vision.children[0]?.children[0]?.children[0]?.id || null);
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(vision.children[0]?.children[0]?.children[0]?.children[0]?.id || null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDailyGoal, setEditingDailyGoal] = useState<DailyGoal | null>(null);

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

  // Update selections when parent changes to keep drill-down valid
  useEffect(() => {
      if (selectedYear && !selectedYear.children.find(h => h.id === selectedHalfYearId)) {
          setSelectedHalfYearId(selectedYear.children[0]?.id || null);
      }
  }, [selectedYearId, selectedYear]);

  useEffect(() => {
      if (selectedHalfYear && !selectedHalfYear.children.find(m => m.id === selectedMonthId)) {
          setSelectedMonthId(selectedHalfYear.children[0]?.id || null);
      }
  }, [selectedHalfYearId, selectedHalfYear]);

  useEffect(() => {
      if (selectedMonth && !selectedMonth.children.find(w => w.id === selectedWeekId)) {
          setSelectedWeekId(selectedMonth.children[0]?.id || null);
      }
  }, [selectedMonthId, selectedMonth]);


  const toggleTodo = (dailyId: string, todoId: string) => {
      const newVision = JSON.parse(JSON.stringify(vision)) as VisionGoal;
      
      // Find path
      // Note: This deep search is inefficient for large trees but okay for this mock scale.
      // Better to pass path or IDs down, but we recalculate everything from root for simplicity here.
      
      let targetDay: DailyGoal | undefined;
      
      // Traverse to find the day
      for (const year of newVision.children) {
          for (const half of year.children) {
              for (const month of half.children) {
                  for (const week of month.children) {
                      const day = week.children.find(d => d.id === dailyId);
                      if (day) {
                          targetDay = day;
                          break;
                      }
                  }
                  if (targetDay) break;
              }
              if (targetDay) break;
          }
          if (targetDay) break;
      }

      if (targetDay) {
          const todo = targetDay.todos.find(t => t.id === todoId);
          if (todo) {
              todo.completed = !todo.completed;
              recalculateProgress(newVision);
              setVision(newVision);
              
              // Also update editing state if open
              if (editingDailyGoal && editingDailyGoal.id === dailyId) {
                  setEditingDailyGoal(JSON.parse(JSON.stringify(targetDay)));
              }
          }
      }
  };

  const updateTodoText = (dailyId: string, todoId: string, newText: string) => {
      const newVision = JSON.parse(JSON.stringify(vision)) as VisionGoal;
      // Find path (reusing logic - should be extracted in real app)
      let targetDay: DailyGoal | undefined;
       for (const year of newVision.children) {
          for (const half of year.children) {
              for (const month of half.children) {
                  for (const week of month.children) {
                      const day = week.children.find(d => d.id === dailyId);
                      if (day) {
                          targetDay = day;
                          break;
                      }
                  }
                  if (targetDay) break;
              }
              if (targetDay) break;
          }
          if (targetDay) break;
      }

      if (targetDay) {
          const todo = targetDay.todos.find(t => t.id === todoId);
          if (todo) {
              todo.title = newText;
              setVision(newVision);
              if (editingDailyGoal && editingDailyGoal.id === dailyId) {
                  setEditingDailyGoal(JSON.parse(JSON.stringify(targetDay)));
              }
          }
      }
  };

  const recalculateProgress = (v: VisionGoal) => {
      v.children.forEach(year => {
          year.children.forEach(half => {
              half.children.forEach(month => {
                  month.children.forEach(week => {
                      week.children.forEach(day => {
                          const completed = day.todos.filter(t => t.completed).length;
                          day.progress = day.todos.length > 0 ? Math.round((completed / day.todos.length) * 100) : 0;
                      });
                      const totalDay = week.children.reduce((sum, d) => sum + d.progress, 0);
                      week.progress = Math.round(totalDay / (week.children.length || 1));
                  });
                  const totalWeek = month.children.reduce((sum, w) => sum + w.progress, 0);
                  month.progress = Math.round(totalWeek / (month.children.length || 1));
              });
              const totalMonth = half.children.reduce((sum, m) => sum + m.progress, 0);
              half.progress = Math.round(totalMonth / (half.children.length || 1));
          });
          const totalHalf = year.children.reduce((sum, h) => sum + h.progress, 0);
          year.progress = Math.round(totalHalf / (year.children.length || 1));
      });
      const totalYear = v.children.reduce((sum, y) => sum + y.progress, 0);
      v.progress = Math.round(totalYear / (v.children.length || 1));
  };

  const openEditModal = (e: React.MouseEvent, day: DailyGoal) => {
      e.stopPropagation();
      setEditingDailyGoal(day);
      setIsEditModalOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto pb-20 px-4 md:px-0">
        <div className="text-center mb-8 pt-6">
            <h2 className="text-[28px] font-bold text-[#191F28]">목표 관리 (Vision Tree)</h2>
            <p className="text-[#8B95A1] mt-2 text-lg">꿈을 현실로 만드는 가장 확실한 방법</p>
        </div>

        {/* Level 1: Vision Card */}
        <div className="flex justify-center mb-8">
            <div className="relative w-full max-w-xl z-50">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#191F28] text-white px-3 py-0.5 rounded-full text-xs font-bold shadow-md">
                    Vision {vision.targetYear}
                </div>
                <Card className="toss-card border-2 border-[#191F28] shadow-xl bg-[#F9FAFB]">
                    <CardContent className="p-6 text-center">
                        <Flag className="h-8 w-8 mx-auto text-[#191F28] mb-3" />
                        <h1 className="text-2xl font-bold text-[#191F28] mb-2">{vision.title}</h1>
                        <p className="text-[#4E5968] text-sm mb-4">{vision.description}</p>
                        <Progress value={vision.progress} className="h-2" indicatorClassName="bg-[#191F28]" />
                        <p className="text-right text-xs font-bold text-[#191F28] mt-1">{vision.progress}% 달성</p>
                    </CardContent>
                </Card>
                <div className="absolute left-1/2 bottom-[-32px] w-0.5 h-8 bg-[#E5E8EB] -translate-x-1/2 z-0" />
            </div>
        </div>

        {/* Level 2: Yearly Goals (3 Cards) */}
        <div className="space-y-2 relative">
             <div className="text-center">
                <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] mb-2 text-[10px]">Yearly</Badge>
             </div>
             <div className="grid grid-cols-3 gap-3">
                {vision.children.map((year) => (
                    <div key={year.id} className="relative">
                        <Card 
                            onClick={() => setSelectedYearId(year.id)}
                            className={cn(
                                "toss-card cursor-pointer transition-all hover:-translate-y-1 h-full",
                                selectedYearId === year.id 
                                    ? "border-2 border-[#3182F6] shadow-md bg-blue-50/30" 
                                    : "border border-transparent hover:shadow-sm"
                            )}
                        >
                            <CardContent className="p-4 text-center">
                                <div className="flex justify-center items-center gap-2 mb-2">
                                    <h3 className={cn("font-bold text-sm", selectedYearId === year.id ? "text-[#3182F6]" : "text-[#333D4B]")}>
                                        {year.title}
                                    </h3>
                                    {year.progress === 100 && <Badge className="bg-[#00BFA5] hover:bg-[#00BFA5] border-none text-white text-[10px] px-1.5 py-0">Done</Badge>}
                                </div>
                                <Progress value={year.progress} className="h-1.5 mb-1" indicatorClassName={year.progress === 100 ? "bg-[#00BFA5]" : selectedYearId === year.id ? "bg-[#3182F6]" : "bg-[#B0B8C1]"} />
                                <p className="text-xs font-bold text-[#8B95A1]">{year.progress}%</p>
                            </CardContent>
                        </Card>
                        {selectedYearId === year.id && (
                            <div className="absolute left-1/2 bottom-[-24px] w-0.5 h-8 bg-[#3182F6] -translate-x-1/2 z-10" />
                        )}
                    </div>
                ))}
             </div>
        </div>

        {/* Level 3: Half-Yearly Goals (2 Cards) */}
        {selectedYear && (
            <div className="space-y-2 mt-6">
                <div className="text-center">
                    <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] mb-2 text-[10px]">Half-Yearly</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {selectedYear.children.map((half) => (
                        <Card 
                            key={half.id}
                            onClick={() => setSelectedHalfYearId(half.id)}
                            className={cn(
                                "toss-card cursor-pointer transition-all",
                                selectedHalfYearId === half.id 
                                    ? "border-2 border-[#3182F6] shadow-md bg-blue-50/30" 
                                    : "border border-transparent hover:shadow-sm"
                            )}
                        >
                            <CardContent className="p-4 text-center">
                                <div className="flex justify-center items-center gap-2 mb-2">
                                    <h4 className={cn("font-bold text-sm", selectedHalfYearId === half.id ? "text-[#3182F6]" : "text-[#333D4B]")}>
                                        {half.title}
                                    </h4>
                                    {half.progress === 100 && <Badge className="bg-[#00BFA5] hover:bg-[#00BFA5] border-none text-white text-[10px] px-1.5 py-0">Done</Badge>}
                                </div>
                                <Progress value={half.progress} className="h-1.5 mb-1" indicatorClassName={half.progress === 100 ? "bg-[#00BFA5]" : selectedHalfYearId === half.id ? "bg-[#3182F6]" : "bg-[#B0B8C1]"} />
                                <p className="text-xs font-bold text-[#8B95A1]">{half.progress}%</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )}

        {/* Level 4: Monthly Goals (6 Cards) */}
        {selectedHalfYear && (
            <div className="space-y-2 mt-6">
                <div className="text-center">
                     <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] mb-2 text-[10px]">Monthly</Badge>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {selectedHalfYear.children.map((month) => (
                        <Card 
                            key={month.id}
                            onClick={() => setSelectedMonthId(month.id)}
                            className={cn(
                                "toss-card cursor-pointer transition-all",
                                selectedMonthId === month.id 
                                    ? "border-2 border-[#3182F6] shadow-md bg-blue-50/30" 
                                    : "border border-transparent hover:shadow-sm"
                            )}
                        >
                            <CardContent className="p-3 text-center">
                                <div className="flex justify-center items-center gap-1 mb-2">
                                    <h5 className={cn("font-bold text-xs truncate", selectedMonthId === month.id ? "text-[#3182F6]" : "text-[#333D4B]")}>
                                        {month.title}
                                    </h5>
                                    {month.progress === 100 && <div className="h-2 w-2 rounded-full bg-[#00BFA5]" />}
                                </div>
                                <Progress value={month.progress} className="h-1" indicatorClassName={month.progress === 100 ? "bg-[#00BFA5]" : selectedMonthId === month.id ? "bg-[#3182F6]" : "bg-[#B0B8C1]"} />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )}

        {/* Level 5: Weekly Goals (4 Cards) */}
        {selectedMonth && (
             <div className="space-y-2 mt-6">
                <div className="text-center">
                     <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] mb-2 text-[10px]">Weekly</Badge>
                </div>
                <div className="grid grid-cols-4 gap-2 max-w-3xl mx-auto">
                    {selectedMonth.children.map((week) => (
                        <Card 
                            key={week.id}
                            onClick={() => setSelectedWeekId(week.id)}
                            className={cn(
                                "toss-card cursor-pointer transition-all",
                                selectedWeekId === week.id 
                                    ? "border-2 border-[#3182F6] shadow-md bg-blue-50/30" 
                                    : "border border-transparent hover:shadow-sm"
                            )}
                        >
                            <CardContent className="p-3 text-center">
                                <div className="flex justify-center items-center gap-1 mb-2">
                                    <h5 className={cn("font-bold text-xs truncate", selectedWeekId === week.id ? "text-[#3182F6]" : "text-[#333D4B]")}>
                                        {week.title}
                                    </h5>
                                    {week.progress === 100 && <div className="h-2 w-2 rounded-full bg-[#00BFA5]" />}
                                </div>
                                <Progress value={week.progress} className="h-1" indicatorClassName={week.progress === 100 ? "bg-[#00BFA5]" : selectedWeekId === week.id ? "bg-[#3182F6]" : "bg-[#B0B8C1]"} />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )}

        {/* Level 6: Daily Goals (7 Cards - Small Compact) */}
        {selectedWeek && (
             <div className="space-y-2 mt-6 pb-10">
                <div className="text-center">
                     <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] mb-2 text-[10px]">Daily To-Dos</Badge>
                </div>
                
                {/* Compact Grid for 7 Days */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {selectedWeek.children.map((day) => (
                        <Card key={day.id} className="toss-card border-l-2 border-l-[#3182F6] hover:shadow-md transition-shadow h-full flex flex-col">
                            <div className="p-3 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-[#191F28]">{day.title}</span>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 -mt-1 -mr-1 text-[#B0B8C1] hover:text-[#3182F6]"
                                        onClick={(e) => openEditModal(e, day)}
                                    >
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                </div>
                                
                                {/* Mini Todo List */}
                                <div className="space-y-1.5 flex-1">
                                    {day.todos.map((todo) => (
                                        <div 
                                            key={todo.id} 
                                            onClick={() => toggleTodo(day.id, todo.id)}
                                            className="flex items-start gap-2 cursor-pointer group"
                                        >
                                            <div className={cn(
                                                "mt-0.5 transition-colors",
                                                todo.completed ? "text-[#3182F6]" : "text-[#E5E8EB] group-hover:text-[#B0B8C1]"
                                            )}>
                                                {todo.completed ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                                            </div>
                                            <span className={cn(
                                                "text-[10px] leading-tight transition-colors line-clamp-2",
                                                todo.completed ? "text-[#B0B8C1] line-through" : "text-[#4E5968] group-hover:text-[#333D4B]"
                                            )}>
                                                {todo.title}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-3 pt-2 border-t border-[#F2F4F6]">
                                    <Progress value={day.progress} className="h-1" indicatorClassName="bg-[#3182F6]" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        )}

        {/* Edit Todo Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pencil className="h-5 w-5 text-[#3182F6]" />
                        {editingDailyGoal?.title} 수정
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    {editingDailyGoal?.todos.map((todo, idx) => (
                        <div key={todo.id} className="flex items-center gap-3">
                             <div 
                                className={cn(
                                    "cursor-pointer transition-colors",
                                    todo.completed ? "text-[#3182F6]" : "text-[#D1D6DB]"
                                )}
                                onClick={() => toggleTodo(editingDailyGoal.id, todo.id)}
                            >
                                {todo.completed ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                            </div>
                            <Input 
                                value={todo.title} 
                                onChange={(e) => updateTodoText(editingDailyGoal.id, todo.id, e.target.value)}
                                className="flex-1 bg-[#F9FAFB] border-none focus-visible:ring-[#3182F6]"
                            />
                            <Button variant="ghost" size="icon" className="text-[#E44E48]/50 hover:text-[#E44E48] hover:bg-red-50">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" className="w-full border-dashed border-[#B0B8C1] text-[#8B95A1] hover:text-[#3182F6] hover:border-[#3182F6] hover:bg-[#E8F3FF]">
                        <Plus className="h-4 w-4 mr-2" /> 새 할 일 추가
                    </Button>
                </div>

                <DialogFooter className="sm:justify-end">
                    <Button onClick={() => setIsEditModalOpen(false)} className="bg-[#3182F6] hover:bg-[#2b72d7] text-white font-bold rounded-xl px-6">
                        저장
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
}
