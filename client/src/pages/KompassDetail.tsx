import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, Plus, Flag, Bell, Calendar, Sparkles, Loader2, Eye, X, CheckSquare, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { VisionGoal, DailyGoal, YearlyGoal, HalfYearlyGoal, MonthlyGoal, WeeklyGoal } from "@/lib/mockData";
import { useState, useEffect, useRef, useCallback } from "react";
import { useMobileAction } from "@/lib/MobileActionContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTokens } from "@/lib/TokenContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { motion, AnimatePresence } from "framer-motion";

type GoalLevel = 'vision' | 'year' | 'half' | 'month' | 'week' | 'day';

interface AncestorChainItem {
  level: string;
  title: string;
  description?: string;
}

interface KompassData {
  id: string;
  profileId: string;
  targetYear: number;
  startMonth?: number;
  visionData: VisionGoal;
  progress: number;
}

export default function KompassDetail() {
  const [match, params] = useRoute("/goals/:id");
  const id = params?.id;
  const [_, setLocation] = useLocation();
  
  const [vision, setVision] = useState<VisionGoal | null>(null);
  const [kompassId, setKompassId] = useState<string | null>(null);
  const { setAction } = useMobileAction();
  const { toast } = useToast();

  const dailyCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedVisionRef = useRef<string>("");
  const visionRef = useRef<VisionGoal | null>(null);
  const kompassIdRef = useRef<string | null>(null);

  // Reminder State
  const [isReminderEnabled, setIsReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");

  // Selection State
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [selectedHalfYearId, setSelectedHalfYearId] = useState<string | null>(null);
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);

  // Goal Detail Modal State
  interface GoalModalData {
    id: string;
    level: GoalLevel;
    title: string;
    description: string;
    dateDisplay: string;
    progress: number;
  }
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalModalData, setGoalModalData] = useState<GoalModalData | null>(null);

  const openGoalModal = (goal: { id: string; title: string; description?: string; dateDisplay?: string; progress?: number }, level: GoalLevel) => {
    setGoalModalData({
      id: goal.id,
      level,
      title: goal.title,
      description: goal.description || "",
      dateDisplay: goal.dateDisplay || "",
      progress: goal.progress || 0,
    });
    setGoalModalOpen(true);
  };

  const handleModalSave = () => {
    if (!goalModalData || !vision) return;
    
    // Batch both updates in a single vision mutation to avoid race conditions
    const newVision = JSON.parse(JSON.stringify(vision)) as VisionGoal;
    
    const findAndUpdateNode = (nodes: any[]): boolean => {
      for (const node of nodes) {
        if (node.id === goalModalData.id) {
          node.title = goalModalData.title;
          node.description = goalModalData.description;
          return true;
        }
        if (node.children && findAndUpdateNode(node.children)) return true;
      }
      return false;
    };
    
    if (newVision.id === goalModalData.id) {
      newVision.title = goalModalData.title;
      newVision.description = goalModalData.description;
    } else {
      findAndUpdateNode(newVision.children);
    }
    
    // Sync ref immediately to ensure cleanup has latest data
    visionRef.current = newVision;
    setVision(newVision);
    setGoalModalOpen(false);
    toast({ title: "저장 완료", description: "목표가 수정되었습니다." });
  };

  // AI Generation State
  const [generatingLevel, setGeneratingLevel] = useState<GoalLevel | null>(null);
  const { refreshCredits } = useTokens();
  const queryClient = useQueryClient();

  // Load kompass from API
  const { data: kompassData, isLoading, error } = useQuery<KompassData>({
    queryKey: [`/api/kompass/${id}`],
    enabled: !!id,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (visionData: VisionGoal) => {
      if (!kompassId) return;
      const response = await apiRequest('PATCH', `/api/kompass/${kompassId}`, {
        visionData,
        progress: calculateOverallProgress(visionData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/kompass'] });
    },
    onError: (error: any) => {
      console.error('Failed to save kompass:', error);
    },
  });

  // Calculate overall progress
  const calculateOverallProgress = (v: VisionGoal): number => {
    let total = 0;
    let completed = 0;
    
    v.children.forEach(year => {
      year.children.forEach(half => {
        half.children.forEach(month => {
          month.children.forEach(week => {
            week.children.forEach(day => {
              day.todos.forEach(todo => {
                total++;
                if (todo.completed) completed++;
              });
            });
          });
        });
      });
    });
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  // Auto-save with debounce
  const triggerAutoSave = useCallback(() => {
    if (!vision || !kompassId) return;
    
    const visionStr = JSON.stringify(vision);
    if (visionStr === lastSavedVisionRef.current) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      lastSavedVisionRef.current = visionStr;
      saveMutation.mutate(vision);
    }, 1000);
  }, [vision, kompassId, saveMutation]);

  // Trigger auto-save when vision changes
  useEffect(() => {
    triggerAutoSave();
  }, [vision, triggerAutoSave]);

  // Keep refs in sync for cleanup effect
  useEffect(() => {
    visionRef.current = vision;
  }, [vision]);

  useEffect(() => {
    kompassIdRef.current = kompassId;
  }, [kompassId]);

  // Initialize from API data
  useEffect(() => {
    if (kompassData) {
      setKompassId(kompassData.id);
      setVision(kompassData.visionData);
      lastSavedVisionRef.current = JSON.stringify(kompassData.visionData);
      
      // Initialize selection
      const v = kompassData.visionData;
      setSelectedYearId(v.children[0]?.id || null);
      setSelectedHalfYearId(v.children[0]?.children[0]?.id || null);
      setSelectedMonthId(v.children[0]?.children[0]?.children[0]?.id || null);
      setSelectedWeekId(v.children[0]?.children[0]?.children[0]?.children[0]?.id || null);
    }
  }, [kompassData]);

  // Helper function to calculate progress for immediate save
  const calculateProgressForSave = (v: VisionGoal): number => {
    let total = 0;
    let completed = 0;
    
    v.children.forEach(year => {
      year.children.forEach(half => {
        half.children.forEach(month => {
          month.children.forEach(week => {
            week.children.forEach(day => {
              day.todos.forEach(todo => {
                total++;
                if (todo.completed) completed++;
              });
            });
          });
        });
      });
    });
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  // Save immediately on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      // Clear any pending debounced save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Check if there are unsaved changes and save immediately
      const currentVision = visionRef.current;
      const currentKompassId = kompassIdRef.current;
      
      if (currentVision && currentKompassId) {
        const currentVisionStr = JSON.stringify(currentVision);
        if (currentVisionStr !== lastSavedVisionRef.current) {
          // Use fetch with keepalive for reliable save during page navigation
          // Note: sendBeacon only supports POST, but our API uses PATCH
          const payload = JSON.stringify({
            visionData: currentVision,
            progress: calculateProgressForSave(currentVision),
          });
          
          fetch(`/api/kompass/${currentKompassId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true, // Ensures request completes even after page navigation
          }).catch(() => {
            // Silent fail - nothing we can do if the request fails during unmount
          });
        }
      }
    };
  }, []);

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

  // Apply AI suggestions to the tree - updates title and description with bullets
  const applyAISuggestions = (level: GoalLevel, suggestions: { title: string; description: string; bullets: string[] }[]) => {
    if (!vision) return;
    
    const newVision = JSON.parse(JSON.stringify(vision)) as VisionGoal;
    
    // Helper to update a goal node with AI suggestion
    const updateNode = (node: any, suggestion: { title: string; description: string; bullets: string[] }) => {
      // Set title directly from AI (dateDisplay already shows the date/period separately)
      node.title = suggestion.title;
      // Format bullets into description with bullet points
      node.description = suggestion.bullets.length > 0
        ? suggestion.bullets.map(b => `• ${b}`).join('\n')
        : suggestion.description;
    };
    
    switch (level) {
      case 'year':
        suggestions.forEach((s, i) => {
          if (newVision.children[i]) updateNode(newVision.children[i], s);
        });
        break;
      case 'half':
        const yearForHalf = newVision.children.find(y => y.id === selectedYearId);
        if (yearForHalf) {
          suggestions.forEach((s, i) => {
            if (yearForHalf.children[i]) updateNode(yearForHalf.children[i], s);
          });
        }
        break;
      case 'month':
        const yearForMonth = newVision.children.find(y => y.id === selectedYearId);
        const halfForMonth = yearForMonth?.children.find(h => h.id === selectedHalfYearId);
        if (halfForMonth) {
          suggestions.forEach((s, i) => {
            if (halfForMonth.children[i]) updateNode(halfForMonth.children[i], s);
          });
        }
        break;
      case 'week':
        const yearForWeek = newVision.children.find(y => y.id === selectedYearId);
        const halfForWeek = yearForWeek?.children.find(h => h.id === selectedHalfYearId);
        const monthForWeek = halfForWeek?.children.find(m => m.id === selectedMonthId);
        if (monthForWeek) {
          suggestions.forEach((s, i) => {
            if (monthForWeek.children[i]) updateNode(monthForWeek.children[i], s);
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
              // For days, use bullets as todos
              const bullets = s.bullets.length > 0 ? s.bullets : s.description.split('\n').filter(b => b.trim());
              weekForDay.children[i].todos = bullets.map((b, idx) => ({
                id: `${weekForDay.children[i].id}-ai-${idx}`,
                title: b.replace('• ', ''),
                completed: false,
              }));
            }
          });
        }
        break;
    }
    
    // Immediately sync ref to ensure cleanup effect has latest vision
    // This prevents race condition where user navigates before useEffect runs
    visionRef.current = newVision;
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
    
    // Calculate dynamic count based on level
    let count: number | undefined;
    if (level === 'week') {
      // Get the number of weeks in the selected month (from the actual children array)
      const year = vision.children.find(y => y.id === selectedYearId);
      const half = year?.children.find(h => h.id === selectedHalfYearId);
      const month = half?.children.find(m => m.id === selectedMonthId);
      count = month?.children.length || 4; // Default to 4 if not found
    } else if (level === 'day') {
      // Get the number of days in the selected week
      const year = vision.children.find(y => y.id === selectedYearId);
      const half = year?.children.find(h => h.id === selectedHalfYearId);
      const month = half?.children.find(m => m.id === selectedMonthId);
      const week = month?.children.find(w => w.id === selectedWeekId);
      count = week?.children.length || 7; // Default to 7 if not found
    }
    
    aiSuggestMutation.mutate({
      level,
      visionTitle: vision.title,
      visionDescription: vision.description,
      targetYear: vision.targetYear,
      ancestorChain,
      count,
    });
  };

  // AI Generate Button Component
  const AIGenerateButton = ({ level, isStrategic = false, hasGenerated = false }: { level: GoalLevel; isStrategic?: boolean; hasGenerated?: boolean }) => {
    const isGenerating = generatingLevel === level;
    
    // If already generated, show "View Action Plan" button
    if (hasGenerated && !isGenerating) {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            // Scroll to the content section or expand details
          }}
          className="h-8 text-xs gap-1.5 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
        >
          <Eye className="h-3 w-3" />
          목표 달성을 위한 액션 플랜 보기
        </Button>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateWithAI(level);
                }}
                disabled={isGenerating || aiSuggestMutation.isPending}
                className="h-8 text-xs gap-1.5 bg-gradient-to-r from-[#3182F6]/5 to-purple-500/5 border-[#3182F6]/30 text-[#3182F6] hover:bg-[#3182F6]/10"
              >
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {isGenerating ? '생성 중...' : (isStrategic ? 'AI로 세부 내용 자동 생성 (100 포인트)' : 'AI 생성')}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-sm">클릭하면 AI가 목표 세부 내용을 자동으로 작성해드립니다</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {isStrategic && !hasGenerated && (
          <span className="text-[10px] text-[#8B95A1] hidden sm:inline">
            AI가 세부 내용을 자동으로 생성합니다
          </span>
        )}
      </div>
    );
  };


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

      // Find Year by dateDisplay (which contains just the year number like "2025")
      const yearNode = vision.children.find(y => y.dateDisplay === String(currentYearVal) || y.id.includes(String(currentYearVal)));
      if (!yearNode) {
          toast({ title: "오늘 날짜를 찾을 수 없습니다.", description: `${currentYearVal}년 목표가 없습니다.` });
          return;
      }

      // Find Month by dateDisplay (which contains month number like "01", "12")
      let monthNode;
      let halfNode;
      const monthPadded = String(currentMonthVal).padStart(2, '0');
      
      // Search through halves to find month
      for (const h of yearNode.children) {
          const m = h.children.find(m => m.dateDisplay === monthPadded || m.dateDisplay === String(currentMonthVal));
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
      // Week dateDisplay is like "01.01" (month.day), so find by week number in ID
      const weekNode = monthNode.children.find(w => w.id.includes(`w${weekNum}-`));
      
      if (!weekNode) {
           // Fallback to first week if 5th week doesn't exist or logic fails
           toast({ title: "해당 주차를 찾을 수 없습니다.", description: `${weekNum}주차 목표가 없습니다.` });
           return;
      }

      // Find Day by day number in ID or title
      let dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
      if (dayOfWeek === 0) dayOfWeek = 7; // Make Sunday 7
      
      const dayNode = weekNode.children.find(d => d.title === `Day ${dayOfWeek}` || d.id.includes(`d${dayOfWeek}-`));

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
      icon: Calendar,
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
              // Sync ref immediately to ensure cleanup has latest data
              visionRef.current = newVision;
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
              // Sync ref immediately to ensure cleanup has latest data
              visionRef.current = newVision;
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
            // Sync ref immediately to ensure cleanup has latest data
            visionRef.current = newVision;
            setVision(newVision);
            return;
        }

        // Traverse children
        if (findAndUpdate(newVision.children)) {
            // Sync ref immediately to ensure cleanup has latest data
            visionRef.current = newVision;
            setVision(newVision);
        }
    };

    if (isLoading) {
      return (
        <Layout>
          <div className="space-y-8 max-w-5xl mx-auto pb-20 px-4 md:px-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#F9FAFB] p-4 rounded-xl mb-6 gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
            <div className="space-y-6">
              <Card className="toss-card p-6">
                <Skeleton className="h-6 w-48 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="toss-card p-5">
                    <Skeleton className="h-5 w-32 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </Card>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="toss-card p-4">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-1/2" />
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </Layout>
      );
    }

    if (error || !vision) {
      return (
        <Layout>
          <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
            <p className="text-[#8B95A1]">Kompass를 찾을 수 없습니다.</p>
            <Button onClick={() => setLocation('/goals')} variant="outline">
              목록으로 돌아가기
            </Button>
          </div>
        </Layout>
      );
    }

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
                <Card className="toss-card border-2 border-[#191F28] shadow-xl bg-gradient-to-br from-[#F9FAFB] to-white">
                    <CardContent className="p-6">
                        <div className="text-center mb-4">
                            <Flag className="h-8 w-8 mx-auto text-[#191F28] mb-3" />
                            <h2 className="text-2xl font-bold text-[#191F28] mb-2">{vision.title}</h2>
                            {vision.description && (
                                <div className="text-[#6B7684] text-sm space-y-1">
                                    {vision.description.split('\n').slice(0, 2).map((line, i) => (
                                        <p key={i} className="truncate">{line}</p>
                                    ))}
                                    {vision.description.split('\n').length > 2 && (
                                        <p className="text-[#8B95A1]">+{vision.description.split('\n').length - 2}개 더보기</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Progress value={vision.progress} className="h-2.5 flex-1 rounded-full" indicatorClassName="bg-gradient-to-r from-[#191F28] to-[#4E5968] rounded-full" />
                                <span className="text-sm font-bold text-[#191F28]">{vision.progress}%</span>
                            </div>
                            <button
                                onClick={() => openGoalModal({ id: vision.id, title: vision.title, description: vision.description, dateDisplay: `${vision.targetYear}년`, progress: vision.progress }, 'vision')}
                                className="w-full py-2.5 text-sm font-medium text-[#191F28] bg-[#191F28]/5 hover:bg-[#191F28]/10 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                data-testid="button-detail-vision"
                            >
                                <Eye className="h-4 w-4" />
                                상세 보기
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* Level 2: Yearly Goals (3 Cards) */}
        <div className="space-y-2 relative">
             <div className="text-center space-y-2">
                <Badge variant="outline" className="bg-white border-[#E5E8EB] text-[#8B95A1] text-[10px]">연간 목표</Badge>
                <p className="text-sm text-[#8B95A1]">각 연도의 핵심 목표를 설정하세요.</p>
                <AIGenerateButton level="year" isStrategic={true} hasGenerated={(vision?.children?.length || 0) > 0} />
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {vision.children.map((year) => (
                    <div key={year.id} className="relative">
                        <Card 
                            onClick={() => setSelectedYearId(year.id)}
                            className={cn(
                                "toss-card cursor-pointer transition-all duration-200 hover:-translate-y-1 h-full box-border overflow-hidden",
                                selectedYearId === year.id 
                                    ? "border-2 border-[#3182F6] shadow-lg ring-2 ring-[#3182F6]/20 bg-gradient-to-br from-blue-50/50 to-white" 
                                    : "border border-[#E5E8EB] hover:shadow-md hover:border-[#3182F6]/30"
                            )}
                        >
                            <CardContent className="p-5 flex flex-col h-full">
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-[11px] font-medium text-[#3182F6] bg-[#3182F6]/10 px-2 py-1 rounded-lg">{year.dateDisplay}</span>
                                    <CheckCircle2 className={cn("w-5 h-5", year.progress === 100 ? "text-[#00BFA5]" : "text-[#E5E8EB]")} />
                                </div>
                                <div className="flex-1">
                                    <h3 className={cn("font-bold text-base mb-2 line-clamp-2", selectedYearId === year.id ? "text-[#3182F6]" : "text-[#191F28]")}>
                                        {year.title}
                                    </h3>
                                    {year.description && (
                                        <div className="text-left text-xs text-[#6B7684] space-y-1 mb-3">
                                            {year.description.split('\n').slice(0, 2).map((line, i) => (
                                                <p key={i} className="truncate leading-relaxed">{line}</p>
                                            ))}
                                            {year.description.split('\n').length > 2 && (
                                                <p className="text-[#8B95A1] font-medium">+{year.description.split('\n').length - 2}개 더보기</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3 pt-2 border-t border-[#F2F4F6]">
                                    <div className="flex justify-between items-center">
                                        <Progress value={year.progress} className="h-2 flex-1 mr-3 rounded-full" indicatorClassName={cn("rounded-full transition-all", year.progress === 100 ? "bg-gradient-to-r from-[#00BFA5] to-[#00E5A0]" : selectedYearId === year.id ? "bg-gradient-to-r from-[#3182F6] to-[#60A5FA]" : "bg-[#B0B8C1]")} />
                                        <span className={cn("text-xs font-bold whitespace-nowrap", year.progress === 100 ? "text-[#00BFA5]" : "text-[#6B7684]")}>{year.progress}%</span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openGoalModal(year, 'year'); }}
                                        className="w-full py-2 text-xs font-medium text-[#3182F6] bg-[#3182F6]/5 hover:bg-[#3182F6]/10 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                                        data-testid={`button-detail-${year.id}`}
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                        상세 보기
                                    </button>
                                </div>
                            </CardContent>
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
                    <AIGenerateButton level="half" isStrategic={true} hasGenerated={(selectedYear?.children?.length || 0) > 0} />
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {selectedYear.children.map((half) => (
                        <Card 
                            key={half.id}
                            onClick={() => setSelectedHalfYearId(half.id)}
                            className={cn(
                                "toss-card cursor-pointer transition-all duration-200 hover:-translate-y-1 box-border overflow-hidden",
                                selectedHalfYearId === half.id 
                                    ? "border-2 border-purple-500 shadow-lg ring-2 ring-purple-500/20 bg-gradient-to-br from-purple-50/50 to-white" 
                                    : "border border-[#E5E8EB] hover:shadow-md hover:border-purple-500/30"
                            )}
                        >
                            <CardContent className="p-5 flex flex-col h-full">
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-[11px] font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-lg">{half.dateDisplay}</span>
                                    <CheckCircle2 className={cn("w-5 h-5", half.progress === 100 ? "text-[#00BFA5]" : "text-[#E5E8EB]")} />
                                </div>
                                <div className="flex-1">
                                    <h4 className={cn("font-bold text-base mb-2 line-clamp-2", selectedHalfYearId === half.id ? "text-purple-600" : "text-[#191F28]")}>
                                        {half.title}
                                    </h4>
                                    {half.description && (
                                        <div className="text-left text-xs text-[#6B7684] space-y-1 mb-3">
                                            {half.description.split('\n').slice(0, 2).map((line, i) => (
                                                <p key={i} className="truncate leading-relaxed">{line}</p>
                                            ))}
                                            {half.description.split('\n').length > 2 && (
                                                <p className="text-[#8B95A1] font-medium">+{half.description.split('\n').length - 2}개 더보기</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3 pt-2 border-t border-[#F2F4F6]">
                                    <div className="flex justify-between items-center">
                                        <Progress value={half.progress} className="h-2 flex-1 mr-3 rounded-full" indicatorClassName={cn("rounded-full transition-all", half.progress === 100 ? "bg-gradient-to-r from-[#00BFA5] to-[#00E5A0]" : selectedHalfYearId === half.id ? "bg-gradient-to-r from-purple-500 to-purple-400" : "bg-[#B0B8C1]")} />
                                        <span className={cn("text-xs font-bold whitespace-nowrap", half.progress === 100 ? "text-[#00BFA5]" : "text-[#6B7684]")}>{half.progress}%</span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openGoalModal(half, 'half'); }}
                                        className="w-full py-2 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                                        data-testid={`button-detail-${half.id}`}
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                        상세 보기
                                    </button>
                                </div>
                            </CardContent>
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
                     <AIGenerateButton level="month" hasGenerated={(selectedHalfYear?.children?.length || 0) > 0} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {selectedHalfYear.children.map((month) => (
                        <Card 
                            key={month.id}
                            onClick={() => setSelectedMonthId(month.id)}
                            className={cn(
                                "toss-card cursor-pointer transition-all duration-200 hover:-translate-y-0.5 box-border overflow-hidden",
                                selectedMonthId === month.id 
                                    ? "border-2 border-green-500 shadow-lg ring-2 ring-green-500/20 bg-gradient-to-br from-green-50/50 to-white" 
                                    : "border border-[#E5E8EB] hover:shadow-md hover:border-green-500/30"
                            )}
                        >
                            <CardContent className="p-3 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded">{month.dateDisplay}</span>
                                    <CheckCircle2 className={cn("w-4 h-4", month.progress === 100 ? "text-[#00BFA5]" : "text-[#E5E8EB]")} />
                                </div>
                                <div className="flex-1 mb-2">
                                    <h5 className={cn("font-bold text-sm truncate w-full", selectedMonthId === month.id ? "text-green-600" : "text-[#191F28]")}>
                                        {month.title}
                                    </h5>
                                    {month.description && (
                                        <p className="text-[10px] text-[#8B95A1] truncate mt-1">{month.description.split('\n')[0]}</p>
                                    )}
                                </div>
                                <div className="space-y-2 pt-2 border-t border-[#F2F4F6]">
                                    <div className="flex items-center gap-2">
                                        <Progress value={month.progress} className="h-1.5 flex-1 rounded-full" indicatorClassName={cn("rounded-full", month.progress === 100 ? "bg-gradient-to-r from-[#00BFA5] to-[#00E5A0]" : selectedMonthId === month.id ? "bg-gradient-to-r from-green-500 to-green-400" : "bg-[#B0B8C1]")} />
                                        <span className={cn("text-[10px] font-bold w-6 text-right", month.progress === 100 ? "text-[#00BFA5]" : "text-[#6B7684]")}>{month.progress}%</span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openGoalModal(month, 'month'); }}
                                        className="w-full py-1.5 text-[10px] font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded flex items-center justify-center gap-1 transition-colors"
                                        data-testid={`button-detail-${month.id}`}
                                    >
                                        <Eye className="h-3 w-3" />
                                        상세
                                    </button>
                                </div>
                            </CardContent>
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
                     <AIGenerateButton level="week" hasGenerated={(selectedMonth?.children?.length || 0) > 0} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
                    {selectedMonth.children.map((week) => (
                        <Card 
                            key={week.id}
                            onClick={() => setSelectedWeekId(week.id)}
                            className={cn(
                                "toss-card cursor-pointer transition-all duration-200 hover:-translate-y-0.5 box-border overflow-hidden",
                                selectedWeekId === week.id 
                                    ? "border-2 border-orange-500 shadow-lg ring-2 ring-orange-500/20 bg-gradient-to-br from-orange-50/50 to-white" 
                                    : "border border-[#E5E8EB] hover:shadow-md hover:border-orange-500/30"
                            )}
                        >
                            <CardContent className="p-4 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-medium text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">{week.dateDisplay}</span>
                                    <CheckCircle2 className={cn("w-4 h-4", week.progress === 100 ? "text-[#00BFA5]" : "text-[#E5E8EB]")} />
                                </div>
                                <div className="flex-1 mb-2">
                                    <h5 className={cn("font-bold text-sm mb-1", selectedWeekId === week.id ? "text-orange-600" : "text-[#191F28]")}>
                                        {week.title}
                                    </h5>
                                    {week.description && (
                                        <p className="text-[10px] text-[#8B95A1] line-clamp-2">{week.description.split('\n')[0]}</p>
                                    )}
                                </div>
                                <div className="space-y-2 pt-2 border-t border-[#F2F4F6]">
                                    <div className="flex items-center gap-2">
                                        <Progress value={week.progress} className="h-1.5 flex-1 rounded-full" indicatorClassName={cn("rounded-full", week.progress === 100 ? "bg-gradient-to-r from-[#00BFA5] to-[#00E5A0]" : selectedWeekId === week.id ? "bg-gradient-to-r from-orange-500 to-orange-400" : "bg-[#B0B8C1]")} />
                                        <span className={cn("text-[10px] font-bold w-6 text-right", week.progress === 100 ? "text-[#00BFA5]" : "text-[#6B7684]")}>{week.progress}%</span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openGoalModal(week, 'week'); }}
                                        className="w-full py-1.5 text-[10px] font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded flex items-center justify-center gap-1 transition-colors"
                                        data-testid={`button-detail-${week.id}`}
                                    >
                                        <Eye className="h-3 w-3" />
                                        상세
                                    </button>
                                </div>
                            </CardContent>
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
                     <AIGenerateButton level="day" hasGenerated={(selectedWeek?.children?.length || 0) > 0} />
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
                                <div className="space-y-2 flex-1">
                                    {day.todos.map((todo, todoIdx) => (
                                        <div 
                                            key={todo.id} 
                                            className="flex items-start gap-2.5 group bg-[#F9FAFB] rounded-lg p-2.5 hover:bg-[#F2F4F6] transition-colors"
                                        >
                                            <div 
                                                className={cn(
                                                    "cursor-pointer transition-colors flex-shrink-0 mt-0.5",
                                                    todo.completed ? "text-[#00BFA5]" : "text-[#B0B8C1] group-hover:text-[#3182F6]"
                                                )}
                                                onClick={() => toggleTodo(day.id, todo.id)}
                                            >
                                                {todo.completed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                            </div>
                                            <textarea 
                                                ref={(el) => {
                                                    if (el) {
                                                        el.style.height = 'auto';
                                                        el.style.height = el.scrollHeight + 'px';
                                                    }
                                                }}
                                                value={todo.title} 
                                                onChange={(e) => updateTodoText(day.id, todo.id, e.target.value)}
                                                readOnly={todo.completed}
                                                rows={1}
                                                className={cn(
                                                    "flex-1 bg-transparent border-0 px-0 py-0 text-sm leading-snug resize-none overflow-hidden focus:outline-none focus:ring-0 placeholder:text-[#B0B8C1]",
                                                    todo.completed ? "text-[#B0B8C1] line-through" : "text-[#333D4B]"
                                                )}
                                                style={{ minHeight: '20px' }}
                                                onInput={(e) => {
                                                    const target = e.target as HTMLTextAreaElement;
                                                    target.style.height = 'auto';
                                                    target.style.height = target.scrollHeight + 'px';
                                                }}
                                                placeholder="할 일을 입력하세요"
                                            />
                                            <span className="text-[10px] text-[#B0B8C1] font-medium flex-shrink-0">{todoIdx + 1}</span>
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

        {/* Goal Detail Modal */}
        <Dialog open={goalModalOpen} onOpenChange={setGoalModalOpen}>
          <DialogContent className="sm:max-w-lg rounded-2xl border-0 shadow-2xl">
            <DialogHeader className="pb-4 border-b border-[#F2F4F6]">
              <DialogTitle className="text-xl font-bold text-[#191F28] flex items-center gap-3">
                {goalModalData?.level === 'vision' && <Badge className="bg-gradient-to-r from-[#191F28] to-[#4E5968] text-white px-3 py-1">비전</Badge>}
                {goalModalData?.level === 'year' && <Badge className="bg-gradient-to-r from-[#3182F6] to-[#60A5FA] text-white px-3 py-1">연간</Badge>}
                {goalModalData?.level === 'half' && <Badge className="bg-gradient-to-r from-purple-500 to-purple-400 text-white px-3 py-1">반기</Badge>}
                {goalModalData?.level === 'month' && <Badge className="bg-gradient-to-r from-green-500 to-green-400 text-white px-3 py-1">월간</Badge>}
                {goalModalData?.level === 'week' && <Badge className="bg-gradient-to-r from-orange-500 to-orange-400 text-white px-3 py-1">주간</Badge>}
                목표 상세
              </DialogTitle>
            </DialogHeader>
            
            {goalModalData && (
              <div className="space-y-6 py-4">
                <div className="flex items-center justify-between bg-gradient-to-r from-[#F9FAFB] to-[#F2F4F6] rounded-2xl p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <Calendar className="h-5 w-5 text-[#6B7684]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8B95A1] uppercase tracking-wider font-medium">기간</p>
                      <p className="text-sm font-bold text-[#191F28]">{goalModalData.dateDisplay}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#8B95A1] uppercase tracking-wider font-medium">달성률</p>
                    <div className="flex items-center gap-2">
                      <Progress value={goalModalData.progress} className="w-16 h-2 rounded-full" indicatorClassName={cn("rounded-full", goalModalData.progress === 100 ? "bg-gradient-to-r from-[#00BFA5] to-[#00E5A0]" : "bg-gradient-to-r from-[#3182F6] to-[#60A5FA]")} />
                      <p className={cn("text-lg font-bold", goalModalData.progress === 100 ? "text-[#00BFA5]" : "text-[#3182F6]")}>{goalModalData.progress}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="modal-title" className="text-sm font-bold text-[#191F28] flex items-center gap-2">
                    <Flag className="h-4 w-4 text-[#6B7684]" />
                    목표 제목
                  </Label>
                  <Input 
                    id="modal-title"
                    value={goalModalData.title}
                    onChange={(e) => setGoalModalData({ ...goalModalData, title: e.target.value })}
                    className="h-12 rounded-xl border-[#E5E8EB] bg-[#F9FAFB] focus-visible:ring-[#3182F6] focus-visible:bg-white transition-colors text-[#191F28] font-medium"
                    data-testid="input-modal-title"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold text-[#191F28] flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-[#6B7684]" />
                    세부 실행 과제
                  </Label>
                  {goalModalData.description.includes('•') ? (
                    <div className="space-y-2 bg-gradient-to-br from-[#F9FAFB] to-[#F2F4F6] rounded-xl p-4">
                      {goalModalData.description.split('\n').filter(line => line.trim()).map((line, i) => (
                        <div key={i} className="flex items-start gap-3 group bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                          {line.trim().startsWith('•') ? (
                            <>
                              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#3182F6] to-[#60A5FA] flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white font-bold text-xs">{i + 1}</span>
                              </div>
                              <textarea
                                ref={(el) => {
                                  if (el) {
                                    el.style.height = 'auto';
                                    el.style.height = el.scrollHeight + 'px';
                                  }
                                }}
                                value={line.replace('• ', '')}
                                onChange={(e) => {
                                  const lines = goalModalData.description.split('\n');
                                  const bulletIndex = lines.findIndex((l, idx) => idx === i || l === line);
                                  if (bulletIndex >= 0) {
                                    lines[bulletIndex] = `• ${e.target.value}`;
                                    setGoalModalData({ ...goalModalData, description: lines.join('\n') });
                                  }
                                }}
                                rows={1}
                                className="flex-1 text-sm border-0 bg-transparent px-0 py-0 leading-relaxed resize-none overflow-hidden focus:outline-none focus:ring-0 text-[#333D4B]"
                                style={{ minHeight: '24px' }}
                                onInput={(e) => {
                                  const target = e.target as HTMLTextAreaElement;
                                  target.style.height = 'auto';
                                  target.style.height = target.scrollHeight + 'px';
                                }}
                              />
                              <button
                                onClick={() => {
                                  const lines = goalModalData.description.split('\n').filter((l, idx) => idx !== i);
                                  setGoalModalData({ ...goalModalData, description: lines.join('\n') });
                                }}
                                className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-opacity"
                              >
                                ×
                              </button>
                            </>
                          ) : (
                            <p className="text-sm text-[#4E5968]">{line}</p>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setGoalModalData({ ...goalModalData, description: goalModalData.description + '\n• ' });
                        }}
                        className="w-full mt-2 py-2 text-xs font-medium text-[#3182F6] bg-white hover:bg-[#3182F6]/5 border border-dashed border-[#3182F6]/30 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        항목 추가
                      </button>
                    </div>
                  ) : (
                    <Textarea 
                      id="modal-description"
                      value={goalModalData.description}
                      onChange={(e) => setGoalModalData({ ...goalModalData, description: e.target.value })}
                      placeholder="목표에 대한 상세 설명을 입력하세요"
                      className="min-h-[120px] rounded-xl border-[#E5E8EB] bg-[#F9FAFB] focus-visible:ring-[#3182F6] focus-visible:bg-white resize-none text-sm transition-colors"
                      data-testid="input-modal-description"
                    />
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="gap-3 pt-4 border-t border-[#F2F4F6]">
              <Button 
                variant="outline" 
                onClick={() => setGoalModalOpen(false)}
                className="flex-1 h-12 rounded-xl border-[#E5E8EB] text-[#6B7684] hover:bg-[#F9FAFB] font-medium"
              >
                취소
              </Button>
              <Button 
                onClick={handleModalSave}
                className="flex-1 h-12 bg-gradient-to-r from-[#3182F6] to-[#2b72d7] hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-[#3182F6]/25 transition-all"
                data-testid="button-modal-save"
              >
                저장
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
}