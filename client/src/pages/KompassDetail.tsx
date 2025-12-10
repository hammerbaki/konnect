import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Plus, Flag, Bell, Calendar as CalendarIcon, Sparkles, Loader2 } from "lucide-react";
import { MOCK_VISIONS, VisionGoal, DailyGoal, YearlyGoal, HalfYearlyGoal, MonthlyGoal, WeeklyGoal } from "@/lib/mockData";
import { useState, useEffect, useRef } from "react";
import { useMobileAction } from "@/lib/MobileActionContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useRoute } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTokens } from "@/lib/TokenContext";

import { motion, AnimatePresence } from "framer-motion";

type GoalLevel = 'year' | 'half' | 'month' | 'week' | 'day';

interface AncestorChainItem {
  level: string;
  title: string;
  description?: string;
}

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

  // AI Generation State
  const [generatingLevel, setGeneratingLevel] = useState<GoalLevel | null>(null);
  const { refreshCredits } = useTokens();
  const queryClient = useQueryClient();

  // AI Goal Suggestion Mutation
  const aiSuggestMutation = useMutation({
    mutationFn: async (params: {
      level: GoalLevel;
      visionTitle: string;
      visionDescription: string;
      targetYear: number;
      ancestorChain: AncestorChainItem[];
      siblings?: { title: string }[];
      count?: number;
    }) => {
      const response = await apiRequest('POST', '/api/goals/ai-suggest', params);
      return response.json();
    },
    onSuccess: (data, variables) => {
      if (data.creditsUsed > 0) {
        refreshCredits();
      }
      toast({
        title: "AI 목표 생성 완료",
        description: `${data.suggestions.length}개의 목표가 생성되었습니다.`,
      });
      
      // Apply suggestions to the vision tree
      applyAISuggestions(variables.level, data.suggestions);
    },
    onError: (error: any) => {
      const message = error?.message || "AI 목표 생성 중 오류가 발생했습니다.";
      toast({
        title: "생성 실패",
        description: message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setGeneratingLevel(null);
    },
  });

  // Apply AI suggestions to the tree - merges with existing content
  const applyAISuggestions = (level: GoalLevel, suggestions: { title: string; description: string }[]) => {
    if (!vision) return;
    
    const newVision = JSON.parse(JSON.stringify(vision)) as VisionGoal;
    
    switch (level) {
      case 'year':
        // Update yearly goal descriptions - only if empty or append with AI marker
        suggestions.forEach((s, i) => {
          if (newVision.children[i]) {
            const existing = newVision.children[i].description;
            if (!existing || existing.trim() === '') {
              newVision.children[i].description = s.description;
            } else {
              // Append with separator if already has content
              newVision.children[i].description = `${existing} | AI: ${s.description}`;
            }
          }
        });
        break;
      case 'half':
        const yearForHalf = newVision.children.find(y => y.id === selectedYearId);
        if (yearForHalf) {
          suggestions.forEach((s, i) => {
            if (yearForHalf.children[i]) {
              const existing = yearForHalf.children[i].description;
              if (!existing || existing.trim() === '') {
                yearForHalf.children[i].description = s.description;
              } else {
                yearForHalf.children[i].description = `${existing} | AI: ${s.description}`;
              }
            }
          });
        }
        break;
      case 'month':
        const yearForMonth = newVision.children.find(y => y.id === selectedYearId);
        const halfForMonth = yearForMonth?.children.find(h => h.id === selectedHalfYearId);
        if (halfForMonth) {
          suggestions.forEach((s, i) => {
            if (halfForMonth.children[i]) {
              const existing = halfForMonth.children[i].description;
              if (!existing || existing.trim() === '') {
                halfForMonth.children[i].description = s.description;
              } else {
                halfForMonth.children[i].description = `${existing} | AI: ${s.description}`;
              }
            }
          });
        }
        break;
      case 'week':
        const yearForWeek = newVision.children.find(y => y.id === selectedYearId);
        const halfForWeek = yearForWeek?.children.find(h => h.id === selectedHalfYearId);
        const monthForWeek = halfForWeek?.children.find(m => m.id === selectedMonthId);
        if (monthForWeek) {
          suggestions.forEach((s, i) => {
            if (monthForWeek.children[i]) {
              const existing = monthForWeek.children[i].description;
              if (!existing || existing.trim() === '') {
                monthForWeek.children[i].description = s.description;
              } else {
                monthForWeek.children[i].description = `${existing} | AI: ${s.description}`;
              }
            }
          });
        }
        break;
      case 'day':
        const yearForDay = newVision.children.find(y => y.id === selectedYearId);
        const halfForDay = yearForDay?.children.find(h => h.id === selectedHalfYearId);
        const monthForDay = halfForDay?.children.find(m => m.id === selectedMonthId);
        const weekForDay = monthForDay?.children.find(w => w.id === selectedWeekId);
        if (weekForDay) {
          suggestions.forEach((s, i) => {
            if (weekForDay.children[i]) {
              const existingTodos = weekForDay.children[i].todos || [];
              const hasContent = existingTodos.some(t => t.title.trim() !== '' && t.title !== '할 일을 입력하세요');
              
              if (!hasContent) {
                // Replace empty todos with AI suggestions
                weekForDay.children[i].todos = [
                  { id: `${weekForDay.children[i].id}-ai-1`, title: s.title, completed: false },
                  { id: `${weekForDay.children[i].id}-ai-2`, title: s.description, completed: false },
                ];
              } else {
                // Append AI todos to existing
                const newId = Date.now() + i;
                weekForDay.children[i].todos.push(
                  { id: `ai-${newId}-1`, title: `✨ ${s.title}`, completed: false },
                  { id: `ai-${newId}-2`, title: `✨ ${s.description}`, completed: false },
                );
              }
            }
          });
        }
        break;
    }
    
    setVision(newVision);
  };

  // Build ancestor chain for AI context
  const buildAncestorChain = (level: GoalLevel): AncestorChainItem[] => {
    const chain: AncestorChainItem[] = [];
    
    if (!vision) return chain;
    
    chain.push({ level: '비전', title: vision.title, description: vision.description });
    
    if (level === 'year') return chain;
    
    const year = vision.children.find(y => y.id === selectedYearId);
    if (year) chain.push({ level: '연간', title: year.title, description: year.description });
    
    if (level === 'half') return chain;
    
    const half = year?.children.find(h => h.id === selectedHalfYearId);
    if (half) chain.push({ level: '반기', title: half.title, description: half.description });
    
    if (level === 'month') return chain;
    
    const month = half?.children.find(m => m.id === selectedMonthId);
    if (month) chain.push({ level: '월간', title: month.title, description: month.description });
    
    if (level === 'week') return chain;
    
    const week = month?.children.find(w => w.id === selectedWeekId);
    if (week) chain.push({ level: '주간', title: week.title, description: week.description });
    
    return chain;
  };

  // Handle AI generation
  const handleGenerateWithAI = (level: GoalLevel) => {
    if (!vision) return;
    
    setGeneratingLevel(level);
    
    const ancestorChain = buildAncestorChain(level);
    
    aiSuggestMutation.mutate({
      level,
      visionTitle: vision.title,
      visionDescription: vision.description,
      targetYear: vision.targetYear,
      ancestorChain,
    });
  };

  // AI Generate Button Component
  const AIGenerateButton = ({ level, isStrategic = false }: { level: GoalLevel; isStrategic?: boolean }) => {
    const isGenerating = generatingLevel === level;
    
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          handleGenerateWithAI(level);
        }}
        disabled={isGenerating || aiSuggestMutation.isPending}
        className="h-7 text-xs gap-1.5 bg-gradient-to-r from-[#3182F6]/5 to-purple-500/5 border-[#3182F6]/30 text-[#3182F6] hover:bg-[#3182F6]/10"
      >
        {isGenerating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Sparkles className="h-3 w-3" />
        )}
        {isGenerating ? '생성 중...' : (isStrategic ? 'AI 생성 (1 크레딧)' : 'AI 생성')}
      </Button>
    );
  };

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
      icon: CalendarIcon,
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

    // --- Generic Update Helper ---
    const updateGoalContent = (nodeId: string, field: 'title' | 'description', value: string) => {
        if (!vision) return;
        const newVision = JSON.parse(JSON.stringify(vision)) as VisionGoal;

        // Helper to traverse and find node
        const findAndUpdate = (nodes: any[]): boolean => {
            for (const node of nodes) {
                if (node.id === nodeId) {
                    node[field] = value;
                    return true;
                }
                if (node.children && findAndUpdate(node.children)) return true;
            }
            return false;
        };

        // Check Vision root first
        if (newVision.id === nodeId) {
            newVision[field] = value;
            setVision(newVision);
            return;
        }

        // Traverse children
        if (findAndUpdate(newVision.children)) {
            setVision(newVision);
        }
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
                    <h3 className="text-sm font-bold text-[#191F28]">목표 알림</h3>
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
                            지금
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
            <h2 className="text-[28px] font-bold text-[#191F28]">나침반 상세</h2>
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
                        <Input 
                            value={vision.title} 
                            onChange={(e) => updateGoalContent(vision.id, 'title', e.target.value)}
                            className="text-2xl font-bold text-[#191F28] mb-2 text-center border-none shadow-none bg-transparent focus-visible:ring-0 p-0 h-auto"
                        />
                        <Input 
                            value={vision.description} 
                            onChange={(e) => updateGoalContent(vision.id, 'description', e.target.value)}
                            className="text-[#4E5968] text-sm mb-4 text-center border-none shadow-none bg-transparent focus-visible:ring-0 p-0 h-auto"
                        />
                        <Progress value={vision.progress} className="h-2" indicatorClassName="bg-[#191F28]" />
                        <p className="text-right text-xs font-bold text-[#191F28] mt-1">{vision.progress}% 달성</p>
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* Level 2: Yearly Goals (3 Cards) */}
        <div className="space-y-2 relative">
             <div className="text-center space-y-2">
                <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] text-[10px]">연간 목표</Badge>
                <p className="text-sm text-[#8B95A1]">각 연도의 핵심 목표를 설정하세요.</p>
                <AIGenerateButton level="year" isStrategic={true} />
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
                                        <span className="text-[10px] text-[#8B95A1] bg-[#F2F4F6] px-1.5 py-0.5 rounded-md">{year.dateDisplay}</span>
                                    </div>
                                    {year.description && (
                                        <Input 
                                            value={year.description}
                                            onChange={(e) => updateGoalContent(year.id, 'description', e.target.value)}
                                            className="text-xs text-[#8B95A1] mb-3 text-center border-none shadow-none bg-transparent focus-visible:ring-0 p-0 h-auto truncate w-full"
                                        />
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
                <div className="text-center space-y-2">
                    <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] text-[10px]">반기별 목표</Badge>
                    <p className="text-sm text-[#8B95A1]">연간 목표를 상반기와 하반기로 나누어 계획하세요.</p>
                    <AIGenerateButton level="half" isStrategic={true} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
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
                                        <span className="text-[10px] text-[#8B95A1] bg-[#F2F4F6] px-1.5 py-0.5 rounded-md">{half.dateDisplay}</span>
                                    </div>
                                    {half.description && (
                                        <Input 
                                            value={half.description}
                                            onChange={(e) => updateGoalContent(half.id, 'description', e.target.value)}
                                            className="text-xs text-[#8B95A1] mb-3 text-center border-none shadow-none bg-transparent focus-visible:ring-0 p-0 h-auto truncate w-full"
                                        />
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
                <div className="text-center space-y-2">
                     <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] text-[10px]">월간 목표</Badge>
                     <p className="text-sm text-[#8B95A1]">매월 달성해야 할 핵심 목표를 계획하세요.</p>
                     <AIGenerateButton level="month" />
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
                                    <div className="flex flex-col items-center gap-1 mb-1 w-full">
                                        <h5 className={cn("font-bold text-xs truncate w-full", selectedMonthId === month.id ? "text-[#3182F6]" : "text-[#333D4B]")}>
                                            {month.title}
                                        </h5>
                                        <span className="text-[9px] text-[#8B95A1] bg-[#F2F4F6] px-1 py-0.5 rounded-sm">{month.dateDisplay}</span>
                                    </div>
                                    {month.description && (
                                        <Input 
                                            value={month.description}
                                            onChange={(e) => updateGoalContent(month.id, 'description', e.target.value)}
                                            className="text-[10px] text-[#8B95A1] mb-2 text-center border-none shadow-none bg-transparent focus-visible:ring-0 p-0 h-auto truncate w-full"
                                        />
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
                <div className="text-center space-y-2">
                     <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] text-[10px]">주간 목표</Badge>
                     <p className="text-sm text-[#8B95A1]">이번 주에 집중해야 할 과제를 확인하세요.</p>
                     <AIGenerateButton level="week" />
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
                                    <div className="flex flex-col items-center gap-1 mb-1 w-full">
                                        <h5 className={cn("font-bold text-xs truncate w-full", selectedWeekId === week.id ? "text-[#3182F6]" : "text-[#333D4B]")}>
                                            {week.title}
                                        </h5>
                                        <span className="text-[9px] text-[#8B95A1] bg-[#F2F4F6] px-1 py-0.5 rounded-sm">{week.dateDisplay}</span>
                                    </div>
                                    {week.description && (
                                        <Input 
                                            value={week.description}
                                            onChange={(e) => updateGoalContent(week.id, 'description', e.target.value)}
                                            className="text-[10px] text-[#8B95A1] mb-2 text-center border-none shadow-none bg-transparent focus-visible:ring-0 p-0 h-auto truncate w-full"
                                        />
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
                <div className="text-center space-y-2">
                     <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] text-[10px]">일일 과제</Badge>
                     <p className="text-sm text-[#8B95A1]">향후 24시간 내에 해야 할 상위 3가지 과제</p>
                     <AIGenerateButton level="day" />
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
                                <div className="flex justify-between items-start mb-2 pr-6">
                                    <div className="flex flex-col">
                                        <span className="text-lg font-bold text-[#191F28]">{day.title}</span>
                                        <span className="text-xs text-[#8B95A1] bg-[#F2F4F6] px-1.5 py-0.5 rounded-md inline-block mt-1 w-fit">{day.dateDisplay}</span>
                                    </div>
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
                                                readOnly={todo.completed}
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