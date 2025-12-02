import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Plus, Flag, Bell, Target } from "lucide-react";
import { MOCK_VISIONS, VisionGoal, DailyGoal } from "@/lib/mockData";
import { useState, useEffect, useRef } from "react";
import { useMobileAction } from "@/lib/MobileActionContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useRoute } from "wouter";

import { motion, AnimatePresence } from "framer-motion";

export default function KompassDetail() {
  const [match, params] = useRoute("/goals/:id");
  const id = params?.id;
  
  const [vision, setVision] = useState<VisionGoal | null>(null);
  const { setAction } = useMobileAction();
  const { toast } = useToast();

  const dailyCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Reminder State
  const [isReminderEnabled, setIsReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");

  // Selection State
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [selectedHalfYearId, setSelectedHalfYearId] = useState<string | null>(null);
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);

  useEffect(() => {
      if (id) {
          const found = MOCK_VISIONS.find(v => v.id === id);
          if (found) {
              setVision(found);
              // Initialize selection
              setSelectedYearId(found.children[0]?.id || null);
              setSelectedHalfYearId(found.children[0]?.children[0]?.id || null);
              setSelectedMonthId(found.children[0]?.children[0]?.children[0]?.id || null);
              setSelectedWeekId(found.children[0]?.children[0]?.children[0]?.children[0]?.id || null);
          }
      }
  }, [id]);

  // Derived Data based on selection
  const selectedYear = vision?.children.find(y => y.id === selectedYearId);
  const selectedHalfYear = selectedYear?.children.find(h => h.id === selectedHalfYearId);
  const selectedMonth = selectedHalfYear?.children.find(m => m.id === selectedMonthId);
  const selectedWeek = selectedMonth?.children.find(w => w.id === selectedWeekId);

  const handleGoToToday = () => {
      if (!vision) return;

      const today = new Date();
      const currentYearVal = today.getFullYear();
      const currentMonthVal = today.getMonth() + 1;
      const currentDayVal = today.getDate();

      // Find Year
      const yearNode = vision.children.find(y => y.title.includes(String(currentYearVal)));
      if (!yearNode) {
          toast({ title: "오늘 날짜를 찾을 수 없습니다.", description: `${currentYearVal}년 목표가 없습니다.` });
          return;
      }

      // Find Month
      let monthNode;
      let halfNode;
      
      // Search through halves to find month
      for (const h of yearNode.children) {
          const m = h.children.find(m => m.title === `${currentMonthVal}월`);
          if (m) {
              monthNode = m;
              halfNode = h;
              break;
          }
      }

      if (!monthNode || !halfNode) {
           toast({ title: "오늘 날짜를 찾을 수 없습니다.", description: `${currentMonthVal}월 목표가 없습니다.` });
           return;
      }

      // Find Week (Approximate logic: 1-7 -> W1, 8-14 -> W2, etc.)
      const weekNum = Math.ceil(currentDayVal / 7);
      const weekNode = monthNode.children.find(w => w.title === `${weekNum}주차`);
      
      if (!weekNode) {
           // Fallback to first week if 5th week doesn't exist or logic fails
           toast({ title: "해당 주차를 찾을 수 없습니다.", description: `${weekNum}주차 목표가 없습니다.` });
           return;
      }

      // Find Day
      // In mock data, days are just "Day 1", "Day 2"... 
      // We map currentDayVal % 7 || 7 to Day X? 
      // Or just map 1st day of week to today?
      // Let's try to find "Day {dayOfWeek}" where 1=Mon... 
      // Actually mock data is just 1-7. 
      // Let's just select the current day of the week (0-6 -> 1-7)
      let dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
      if (dayOfWeek === 0) dayOfWeek = 7; // Make Sunday 7
      
      const dayNode = weekNode.children.find(d => d.title === `Day ${dayOfWeek}`);

      // Update State
      setSelectedYearId(yearNode.id);
      setSelectedHalfYearId(halfNode.id);
      setSelectedMonthId(monthNode.id);
      setSelectedWeekId(weekNode.id);

      toast({ title: "오늘 날짜로 이동했습니다.", description: `${currentYearVal}년 ${currentMonthVal}월 ${weekNum}주차 Day ${dayOfWeek}` });

      // Scroll to view
      setTimeout(() => {
          if (dayNode && dailyCardRefs.current[dayNode.id]) {
              dailyCardRefs.current[dayNode.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }, 500); // Wait for animation
  };

  useEffect(() => {
    setAction({
      icon: Target,
      label: "Today",
      onClick: handleGoToToday
    });
    return () => setAction(null);
  }, [vision]);

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

  const handleSetCurrentTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setReminderTime(`${hours}:${minutes}`);
      toast({
          title: "시간 설정 완료",
          description: `매일 ${hours}:${minutes}에 알림을 보내드립니다.`,
      });
  };

  const toggleTodo = (dailyId: string, todoId: string) => {
      if (!vision) return;
      const newVision = JSON.parse(JSON.stringify(vision)) as VisionGoal;
      
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
              todo.completed = !todo.completed;
              recalculateProgress(newVision);
              setVision(newVision);
          }
      }
  };

  const updateTodoText = (dailyId: string, todoId: string, newText: string) => {
      if (!vision) return;
      const newVision = JSON.parse(JSON.stringify(vision)) as VisionGoal;
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

  if (!vision) return <Layout><div>Loading...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto pb-20 px-4 md:px-0">
        
        {/* Reminder Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#F9FAFB] p-4 rounded-xl mb-6 gap-4 sm:gap-0">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-full shadow-sm text-[#3182F6]">
                    <Bell className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-[#191F28]">Remind Me</h3>
                    <p className="text-xs text-[#8B95A1]">매일 목표 점검 알림 받기</p>
                </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                 {isReminderEnabled && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 duration-300">
                        <Input 
                            type="time" 
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                            className="w-28 h-8 text-xs bg-white border-none shadow-sm"
                        />
                        <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 text-xs bg-white border-none shadow-sm text-[#3182F6] hover:text-[#2b72d7]"
                            onClick={handleSetCurrentTime}
                        >
                            Now
                        </Button>
                    </div>
                 )}
                 <Switch 
                    checked={isReminderEnabled}
                    onCheckedChange={setIsReminderEnabled}
                    className="data-[state=checked]:bg-[#3182F6]"
                 />
            </div>
        </div>

        <div className="text-center mb-8 pt-2">
            <h2 className="text-[28px] font-bold text-[#191F28]">Kompass Detail</h2>
            <p className="text-[#8B95A1] mt-2 text-lg">나만의 나침반을 따라 목표를 달성하세요</p>
        </div>

        {/* Level 1: Vision Card */}
        <div className="flex justify-center mb-8">
            <div className="relative w-full max-w-xl z-50">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#191F28] text-white px-3 py-0.5 rounded-full text-xs font-bold shadow-md">
                    Kompass {vision.targetYear}
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
            </div>
        </div>

        {/* Level 2: Yearly Goals (3 Cards) */}
        <div className="space-y-2 relative">
             <div className="text-center">
                <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] mb-2 text-[10px]">Yearly</Badge>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {vision.children.map((year) => (
                    <div key={year.id} className="relative">
                        <Card 
                            onClick={() => setSelectedYearId(year.id)}
                            className={cn(
                                "toss-card cursor-pointer transition-all hover:-translate-y-1 h-full box-border",
                                selectedYearId === year.id 
                                    ? "border-2 border-[#3182F6] shadow-md bg-blue-50/30" 
                                    : "border-2 border-transparent hover:shadow-sm"
                            )}
                        >
                            <CardContent className="p-4 text-center flex flex-col h-full justify-between">
                                <div>
                                    <div className="flex justify-center items-center gap-2 mb-2">
                                        <h3 className={cn("font-bold text-sm", selectedYearId === year.id ? "text-[#3182F6]" : "text-[#333D4B]")}>
                                            {year.title}
                                        </h3>
                                    </div>
                                    {year.description && (
                                        <p className="text-xs text-[#8B95A1] mb-3 line-clamp-2">{year.description}</p>
                                    )}
                                </div>
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <Progress value={year.progress} className="h-1.5 flex-1 mr-2" indicatorClassName={year.progress === 100 ? "bg-[#00BFA5]" : selectedYearId === year.id ? "bg-[#3182F6]" : "bg-[#B0B8C1]"} />
                                        <span className="text-[10px] font-bold text-[#8B95A1] whitespace-nowrap">{year.progress}%</span>
                                    </div>
                                </div>
                            </CardContent>
                            <div className="absolute top-3 right-3">
                                <CheckCircle2 className={cn("w-4 h-4", year.progress === 100 ? "text-[#00BFA5]" : "text-[#E5E8EB]")} />
                            </div>
                        </Card>
                    </div>
                ))}
             </div>
        </div>

        {/* Level 3: Half-Yearly Goals (2 Cards) */}
        <AnimatePresence mode="wait">
        {selectedYear && (
            <motion.div 
                key={selectedYear.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2 mt-6"
            >
                <div className="text-center">
                    <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] mb-2 text-[10px]">Half-Yearly</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {selectedYear.children.map((half) => (
                        <Card 
                            key={half.id}
                            onClick={() => setSelectedHalfYearId(half.id)}
                            className={cn(
                                "toss-card cursor-pointer transition-all box-border",
                                selectedHalfYearId === half.id 
                                    ? "border-2 border-[#3182F6] shadow-md bg-blue-50/30" 
                                    : "border-2 border-transparent hover:shadow-sm"
                            )}
                        >
                            <CardContent className="p-4 text-center flex flex-col h-full justify-between">
                                <div>
                                    <div className="flex justify-center items-center gap-2 mb-2">
                                        <h4 className={cn("font-bold text-sm", selectedHalfYearId === half.id ? "text-[#3182F6]" : "text-[#333D4B]")}>
                                            {half.title}
                                        </h4>
                                    </div>
                                    {half.description && (
                                        <p className="text-xs text-[#8B95A1] mb-3 line-clamp-2">{half.description}</p>
                                    )}
                                </div>
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <Progress value={half.progress} className="h-1.5 flex-1 mr-2" indicatorClassName={half.progress === 100 ? "bg-[#00BFA5]" : selectedHalfYearId === half.id ? "bg-[#3182F6]" : "bg-[#B0B8C1]"} />
                                        <span className="text-[10px] font-bold text-[#8B95A1] whitespace-nowrap">{half.progress}%</span>
                                    </div>
                                </div>
                            </CardContent>
                            <div className="absolute top-3 right-3">
                                <CheckCircle2 className={cn("w-4 h-4", half.progress === 100 ? "text-[#00BFA5]" : "text-[#E5E8EB]")} />
                            </div>
                        </Card>
                    ))}
                </div>
            </motion.div>
        )}
        </AnimatePresence>

        {/* Level 4: Monthly Goals (6 Cards) */}
        <AnimatePresence mode="wait">
        {selectedHalfYear && (
            <motion.div 
                key={selectedHalfYear.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2 mt-6"
            >
                <div className="text-center">
                     <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] mb-2 text-[10px]">Monthly</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {selectedHalfYear.children.map((month) => (
                        <Card 
                            key={month.id}
                            onClick={() => setSelectedMonthId(month.id)}
                            className={cn(
                                "toss-card cursor-pointer transition-all box-border",
                                selectedMonthId === month.id 
                                    ? "border-2 border-[#3182F6] shadow-md bg-blue-50/30" 
                                    : "border-2 border-transparent hover:shadow-sm"
                            )}
                        >
                            <CardContent className="p-3 text-center flex flex-col h-full justify-between">
                                <div>
                                    <div className="flex justify-center items-center gap-1 mb-1">
                                        <h5 className={cn("font-bold text-xs truncate", selectedMonthId === month.id ? "text-[#3182F6]" : "text-[#333D4B]")}>
                                            {month.title}
                                        </h5>
                                    </div>
                                    {month.description && (
                                        <p className="text-[10px] text-[#8B95A1] mb-2 line-clamp-2 leading-tight">{month.description}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Progress value={month.progress} className="h-1 flex-1" indicatorClassName={month.progress === 100 ? "bg-[#00BFA5]" : selectedMonthId === month.id ? "bg-[#3182F6]" : "bg-[#B0B8C1]"} />
                                    <span className="text-[9px] font-bold text-[#8B95A1] w-5 text-right">{month.progress}%</span>
                                </div>
                            </CardContent>
                            <div className="absolute top-2 right-2">
                                <CheckCircle2 className={cn("w-3 h-3", month.progress === 100 ? "text-[#00BFA5]" : "text-[#E5E8EB]")} />
                            </div>
                        </Card>
                    ))}
                </div>
            </motion.div>
        )}
        </AnimatePresence>

        {/* Level 5: Weekly Goals (4 Cards) */}
        <AnimatePresence mode="wait">
        {selectedMonth && (
             <motion.div 
                key={selectedMonth.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2 mt-6"
            >
                <div className="text-center">
                     <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] mb-2 text-[10px]">Weekly</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 max-w-3xl mx-auto">
                    {selectedMonth.children.map((week) => (
                        <Card 
                            key={week.id}
                            onClick={() => setSelectedWeekId(week.id)}
                            className={cn(
                                "toss-card cursor-pointer transition-all box-border",
                                selectedWeekId === week.id 
                                    ? "border-2 border-[#3182F6] shadow-md bg-blue-50/30" 
                                    : "border-2 border-transparent hover:shadow-sm"
                            )}
                        >
                            <CardContent className="p-3 text-center flex flex-col h-full justify-between">
                                <div>
                                    <div className="flex justify-center items-center gap-1 mb-1">
                                        <h5 className={cn("font-bold text-xs truncate", selectedWeekId === week.id ? "text-[#3182F6]" : "text-[#333D4B]")}>
                                            {week.title}
                                        </h5>
                                    </div>
                                    {week.description && (
                                        <p className="text-[10px] text-[#8B95A1] mb-2 line-clamp-2 leading-tight">{week.description}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Progress value={week.progress} className="h-1 flex-1" indicatorClassName={week.progress === 100 ? "bg-[#00BFA5]" : selectedWeekId === week.id ? "bg-[#3182F6]" : "bg-[#B0B8C1]"} />
                                    <span className="text-[9px] font-bold text-[#8B95A1] w-5 text-right">{week.progress}%</span>
                                </div>
                            </CardContent>
                            <div className="absolute top-2 right-2">
                                <CheckCircle2 className={cn("w-3 h-3", week.progress === 100 ? "text-[#00BFA5]" : "text-[#E5E8EB]")} />
                            </div>
                        </Card>
                    ))}
                </div>
            </motion.div>
        )}
        </AnimatePresence>

        {/* Level 6: Daily Goals (7 Cards - Small Compact) */}
        <AnimatePresence mode="wait">
        {selectedWeek && (
            <motion.div 
                key={selectedWeek.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2 mt-6 pb-10"
            >
                <div className="text-center">
                     <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] mb-2 text-[10px]">Daily To-Dos</Badge>
                </div>
                
                {/* Compact Grid for 7 Days - Expanded for direct editing */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {selectedWeek.children.map((day) => {
                        const isCompleted = day.progress === 100;
                        return (
                        <Card key={day.id} className={cn(
                            "toss-card hover:shadow-md transition-shadow h-full flex flex-col border-l-4",
                            isCompleted ? "border-l-[#00BFA5]" : "border-l-[#3182F6]"
                        )}>
                            <div 
                                className="p-4 flex-1 flex flex-col relative"
                                ref={(el) => { dailyCardRefs.current[day.id] = el; }}
                            >
                                <div className="flex justify-between items-start mb-4 pr-6">
                                    <span className="text-lg font-bold text-[#191F28]">{day.title}</span>
                                </div>
                                <div className="absolute top-4 right-4">
                                    <CheckCircle2 className={cn("w-5 h-5", isCompleted ? "text-[#00BFA5]" : "text-[#E5E8EB]")} />
                                </div>
                                
                                {/* Editable Todo List */}
                                <div className="space-y-3 flex-1">
                                    {day.todos.map((todo) => (
                                        <div 
                                            key={todo.id} 
                                            className="flex items-center gap-3 group"
                                        >
                                            <div 
                                                className={cn(
                                                    "cursor-pointer transition-colors mt-1",
                                                    todo.completed ? "text-[#00BFA5]" : "text-[#E5E8EB] group-hover:text-[#B0B8C1]"
                                                )}
                                                onClick={() => toggleTodo(day.id, todo.id)}
                                            >
                                                {todo.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                                            </div>
                                            <Input 
                                                value={todo.title} 
                                                onChange={(e) => updateTodoText(day.id, todo.id, e.target.value)}
                                                className={cn(
                                                    "flex-1 bg-transparent border-transparent px-0 h-auto py-1 text-sm focus-visible:ring-0 focus-visible:border-b focus-visible:border-[#3182F6] rounded-none placeholder:text-[#B0B8C1] shadow-none",
                                                    todo.completed ? "text-[#B0B8C1] line-through" : "text-[#333D4B]"
                                                )}
                                                placeholder="할 일을 입력하세요"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 pt-3 border-t border-[#F2F4F6] flex items-center gap-3">
                                    <Progress value={day.progress} className="h-1.5 flex-1" indicatorClassName={isCompleted ? "bg-[#00BFA5]" : "bg-[#3182F6]"} />
                                    <span className="text-xs font-bold text-[#8B95A1]">{day.progress}%</span>
                                </div>
                            </div>
                        </Card>
                        );
                    })}
                </div>
            </motion.div>
        )}
        </AnimatePresence>

      </div>
    </Layout>
  );
}