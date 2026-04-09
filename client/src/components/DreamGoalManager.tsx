/**
 * DreamGoalManager — 3-layer accordion goal management
 * Year → Month (flattened from half-years) → Week
 * Smallest unit: Week (with description/tasks)
 * Mobile-first, accordion pattern (inspired by Notion toggles / Todoist sections)
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Circle,
  Sparkles,
  Loader2,
  Plus,
  Target,
  CalendarDays,
  Layers,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { VisionGoal, MonthlyGoal, WeeklyGoal } from "@/lib/mockData";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface KompassData {
  id: string;
  visionData: VisionGoal;
  progress: number;
  targetYear: number;
}

interface FlatMonth {
  id: string;
  title: string;
  description?: string;
  dateDisplay?: string;
  progress: number;
  yearId: string;
  yearTitle: string;
  weeks: WeeklyGoal[];
}

interface FlatYear {
  id: string;
  title: string;
  description?: string;
  dateDisplay?: string;
  progress: number;
  months: FlatMonth[];
}

function flattenYear(vision: VisionGoal): FlatYear[] {
  return vision.children.map((year) => {
    const months: FlatMonth[] = year.children.flatMap((half) =>
      half.children.map((month) => ({
        id: month.id,
        title: month.title,
        description: month.description,
        dateDisplay: month.dateDisplay,
        progress: month.progress,
        yearId: year.id,
        yearTitle: year.title,
        weeks: month.children,
      }))
    );
    return {
      id: year.id,
      title: year.title,
      description: year.description,
      dateDisplay: year.dateDisplay,
      progress: year.progress,
      months,
    };
  });
}

function recalcProgress(v: VisionGoal): void {
  v.children.forEach((year) => {
    year.children.forEach((half) => {
      half.children.forEach((month) => {
        month.children.forEach((week) => {
          week.children.forEach((day) => {
            const done = day.todos.filter((t) => t.completed).length;
            day.progress = day.todos.length > 0 ? Math.round((done / day.todos.length) * 100) : 0;
          });
          const wSum = week.children.reduce((s, d) => s + d.progress, 0);
          week.progress = Math.round(wSum / (week.children.length || 1));
        });
        const mSum = month.children.reduce((s, w) => s + w.progress, 0);
        month.progress = Math.round(mSum / (month.children.length || 1));
      });
      const hSum = half.children.reduce((s, m) => s + m.progress, 0);
      half.progress = Math.round(hSum / (half.children.length || 1));
    });
    const ySum = year.children.reduce((s, h) => s + h.progress, 0);
    year.progress = Math.round(ySum / (year.children.length || 1));
  });
  const vSum = v.children.reduce((s, y) => s + y.progress, 0);
  v.progress = Math.round(vSum / (v.children.length || 1));
}

function calcOverall(v: VisionGoal): number {
  let total = 0, done = 0;
  v.children.forEach((y) =>
    y.children.forEach((h) =>
      h.children.forEach((m) =>
        m.children.forEach((w) =>
          w.children.forEach((d) =>
            d.todos.forEach((t) => { total++; if (t.completed) done++; })
          )
        )
      )
    )
  );
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function progressColor(pct: number) {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 50) return "bg-dream";
  if (pct >= 20) return "bg-amber-400";
  return "bg-secondary";
}

/* ── Week Panel ── */
function WeekPanel({
  week,
  onToggleTodo,
}: {
  week: WeeklyGoal;
  onToggleTodo: (weekId: string, dayId: string, todoId: string) => void;
}) {
  const allTodos = week.children.flatMap((d) => d.todos.map((t) => ({ ...t, dayId: d.id })));
  const doneTodos = allTodos.filter((t) => t.completed).length;

  return (
    <div className="ml-4 mt-1 mb-2 bg-secondary/30 rounded-lg p-3 space-y-2">
      {week.description && (
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-2 border-l-2 border-dream/30 pl-2">
          {week.description}
        </p>
      )}
      {allTodos.length > 0 ? (
        <div className="space-y-1.5">
          {allTodos.map((todo) => (
            <button
              key={todo.id}
              onClick={() => onToggleTodo(week.id, todo.dayId, todo.id)}
              className={cn(
                "flex items-start gap-2 w-full text-left text-[12px] rounded-md px-2 py-1.5 transition-colors group",
                todo.completed
                  ? "text-muted-foreground"
                  : "text-foreground hover:bg-secondary"
              )}
              data-testid={`toggle-todo-${todo.id}`}
            >
              {todo.completed ? (
                <Check size={13} className="text-emerald-500 mt-0.5 shrink-0" />
              ) : (
                <Circle size={13} className="text-muted-foreground/50 mt-0.5 shrink-0 group-hover:text-dream transition-colors" />
              )}
              <span className={cn("leading-snug", todo.completed && "line-through")}>{todo.title}</span>
            </button>
          ))}
          <div className="flex items-center justify-between pt-1">
            <Progress value={week.progress} className="h-1 flex-1 mr-3" indicatorClassName={progressColor(week.progress)} />
            <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
              {doneTodos}/{allTodos.length}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground text-center py-2">할 일이 없습니다</p>
      )}
    </div>
  );
}

/* ── Month Panel ── */
function MonthPanel({
  month,
  onToggleTodo,
}: {
  month: FlatMonth;
  onToggleTodo: (weekId: string, dayId: string, todoId: string) => void;
}) {
  const [expandedWeekIds, setExpandedWeekIds] = useState<Set<string>>(new Set());

  const toggleWeek = (id: string) => {
    setExpandedWeekIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="ml-4 mt-1 mb-2 space-y-1">
      {month.weeks.map((week) => {
        const isExpanded = expandedWeekIds.has(week.id);
        const allTodos = week.children.flatMap((d) => d.todos);
        const done = allTodos.filter((t) => t.completed).length;
        return (
          <div key={week.id} className="rounded-lg border border-border/60">
            <button
              onClick={() => toggleWeek(week.id)}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-secondary/50 transition-colors rounded-lg"
              data-testid={`accordion-week-${week.id}`}
            >
              <span className="text-muted-foreground/60 shrink-0">
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
              <span className="text-[12px] font-medium flex-1 text-left line-clamp-1">
                {week.title}
              </span>
              {allTodos.length > 0 && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {done}/{allTodos.length}
                </span>
              )}
              <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden shrink-0">
                <div
                  className={cn("h-full rounded-full transition-all", progressColor(week.progress))}
                  style={{ width: `${week.progress}%` }}
                />
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <WeekPanel week={week} onToggleTodo={onToggleTodo} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Component ── */
interface Props {
  kompassId: string;
  visionTitle: string;
}

export function DreamGoalManager({ kompassId, visionTitle }: Props) {
  const queryClient = useQueryClient();
  const [vision, setVision] = useState<VisionGoal | null>(null);
  const [expandedYearIds, setExpandedYearIds] = useState<Set<string>>(new Set());
  const [expandedMonthIds, setExpandedMonthIds] = useState<Set<string>>(new Set());

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");
  const visionRef = useRef<VisionGoal | null>(null);

  const { data: kompassData, isLoading } = useQuery<KompassData>({
    queryKey: [`/api/kompass/${kompassId}`],
    enabled: !!kompassId,
  });

  const saveMutation = useMutation({
    mutationFn: async (v: VisionGoal) => {
      const res = await apiRequest("PATCH", `/api/kompass/${kompassId}`, {
        visionData: v,
        progress: calcOverall(v),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kompass"] });
    },
  });

  const triggerSave = useCallback(() => {
    if (!vision || !kompassId) return;
    const str = JSON.stringify(vision);
    if (str === lastSavedRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      lastSavedRef.current = str;
      saveMutation.mutate(vision);
    }, 1200);
  }, [vision, kompassId, saveMutation]);

  useEffect(() => { triggerSave(); }, [vision, triggerSave]);

  useEffect(() => {
    if (kompassData) {
      setVision(kompassData.visionData);
      lastSavedRef.current = JSON.stringify(kompassData.visionData);
      // Auto-expand first year and its first month
      const firstYear = kompassData.visionData.children[0];
      if (firstYear) {
        setExpandedYearIds(new Set([firstYear.id]));
        const firstMonth = firstYear.children[0]?.children[0];
        if (firstMonth) setExpandedMonthIds(new Set([firstMonth.id]));
      }
    }
  }, [kompassData]);

  useEffect(() => { visionRef.current = vision; }, [vision]);

  // Cleanup: save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      const v = visionRef.current;
      if (v && JSON.stringify(v) !== lastSavedRef.current) {
        saveMutation.mutate(v);
      }
    };
  }, []);

  const toggleTodo = (weekId: string, dayId: string, todoId: string) => {
    if (!vision) return;
    const newVision = JSON.parse(JSON.stringify(vision)) as VisionGoal;
    outer: for (const year of newVision.children) {
      for (const half of year.children) {
        for (const month of half.children) {
          for (const week of month.children) {
            if (week.id !== weekId) continue;
            const day = week.children.find((d) => d.id === dayId);
            if (!day) continue;
            const todo = day.todos.find((t) => t.id === todoId);
            if (todo) {
              todo.completed = !todo.completed;
              recalcProgress(newVision);
              visionRef.current = newVision;
              setVision(newVision);
              break outer;
            }
          }
        }
      }
    }
  };

  const toggleYear = (id: string) => {
    setExpandedYearIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleMonth = (id: string) => {
    setExpandedMonthIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2 mt-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!vision) return null;

  const years = flattenYear(vision);
  const overallProgress = calcOverall(vision);

  return (
    <div className="mt-3">
      {/* Overall progress bar */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <div className="flex-1">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>{visionTitle}</span>
            <span className="font-semibold text-dream">{overallProgress}% 달성</span>
          </div>
          <Progress value={overallProgress} className="h-1.5" indicatorClassName="bg-dream" />
        </div>
      </div>

      {/* Year → Month → Week accordion */}
      <div className="space-y-1.5">
        {years.map((year) => {
          const isYearExpanded = expandedYearIds.has(year.id);
          const doneMonths = year.months.filter((m) => m.progress >= 100).length;

          return (
            <div key={year.id} className="rounded-xl border border-border overflow-hidden">
              {/* Year header */}
              <button
                onClick={() => toggleYear(year.id)}
                className={cn(
                  "flex items-center gap-2.5 w-full px-4 py-3 text-left transition-colors",
                  isYearExpanded ? "bg-dream/5" : "hover:bg-secondary/50"
                )}
                data-testid={`accordion-year-${year.id}`}
              >
                <span className={cn("transition-transform shrink-0", isYearExpanded && "rotate-90")}>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </span>
                <CalendarDays size={14} className="text-dream shrink-0" />
                <span className="font-semibold text-sm flex-1">
                  {year.dateDisplay ?? year.title}년
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {doneMonths}/{year.months.length}개월
                </span>
                <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden shrink-0">
                  <div
                    className={cn("h-full rounded-full transition-all", progressColor(year.progress))}
                    style={{ width: `${year.progress}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-dream w-8 text-right shrink-0">
                  {year.progress}%
                </span>
              </button>

              <AnimatePresence>
                {isYearExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-1 space-y-1">
                      {year.months.map((month) => {
                        const isMonthExpanded = expandedMonthIds.has(month.id);
                        const doneWeeks = month.weeks.filter((w) => w.progress >= 100).length;

                        return (
                          <div key={month.id} className="rounded-lg border border-border/50">
                            {/* Month header */}
                            <button
                              onClick={() => toggleMonth(month.id)}
                              className={cn(
                                "flex items-center gap-2 w-full px-3 py-2.5 text-left transition-colors rounded-lg",
                                isMonthExpanded ? "bg-dream/5" : "hover:bg-secondary/40"
                              )}
                              data-testid={`accordion-month-${month.id}`}
                            >
                              <span className={cn("transition-transform shrink-0", isMonthExpanded && "rotate-90")}>
                                <ChevronRight size={12} className="text-muted-foreground/60" />
                              </span>
                              <Layers size={12} className="text-dream/70 shrink-0" />
                              <span className="text-[13px] font-medium flex-1">
                                {month.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {doneWeeks}/{month.weeks.length}주
                              </span>
                              <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden shrink-0">
                                <div
                                  className={cn("h-full rounded-full transition-all", progressColor(month.progress))}
                                  style={{ width: `${month.progress}%` }}
                                />
                              </div>
                            </button>

                            <AnimatePresence>
                              {isMonthExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.18 }}
                                  className="overflow-hidden"
                                >
                                  <MonthPanel month={month} onToggleTodo={toggleTodo} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {saveMutation.isPending && (
        <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
          <Loader2 size={10} className="animate-spin" />
          저장 중...
        </div>
      )}
    </div>
  );
}
