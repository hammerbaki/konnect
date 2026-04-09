/**
 * DreamGoalManager — 3-layer accordion goal management
 * Year → Month → Week  |  Mobile-first
 * Features: donut progress, Korean months, add todos, edit/delete all levels
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  ChevronDown, ChevronRight, Check, Circle, Loader2, Plus,
  MoreHorizontal, Pencil, Trash2, X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { VisionGoal, WeeklyGoal } from "@/lib/mockData";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ─── Types ─── */
interface KompassData { id: string; visionData: VisionGoal; progress: number; targetYear: number; }

interface FlatMonth {
  id: string; title: string; description?: string; dateDisplay?: string;
  progress: number; yearId: string; weeks: WeeklyGoal[];
}
interface FlatYear {
  id: string; title: string; description?: string; dateDisplay?: string;
  progress: number; months: FlatMonth[];
}

/* ─── Helpers ─── */
function flattenYear(vision: VisionGoal): FlatYear[] {
  return vision.children.map((year) => ({
    id: year.id, title: year.title, description: year.description,
    dateDisplay: year.dateDisplay, progress: year.progress,
    months: year.children.flatMap((half) =>
      half.children.map((m) => ({
        id: m.id, title: m.title, description: m.description,
        dateDisplay: m.dateDisplay, progress: m.progress,
        yearId: year.id, weeks: m.children,
      }))
    ),
  }));
}

function pct(done: number, total: number) {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function recalcProgress(v: VisionGoal): void {
  v.children.forEach((year) => {
    year.children.forEach((half) => {
      half.children.forEach((month) => {
        month.children.forEach((week) => {
          // Day: done / total todos for that day
          week.children.forEach((day) => {
            const done = day.todos.filter((t) => t.completed).length;
            day.progress = pct(done, day.todos.length);
          });
          // Week: flat count of ALL todos across every day in the week
          const wTodos = week.children.flatMap((d) => d.todos);
          week.progress = pct(wTodos.filter((t) => t.completed).length, wTodos.length);
        });
        // Month: flat count of ALL todos across every week → day in the month
        const mTodos = month.children.flatMap((w) => w.children.flatMap((d) => d.todos));
        month.progress = pct(mTodos.filter((t) => t.completed).length, mTodos.length);
      });
      // Half: flat count all the way down
      const hTodos = half.children.flatMap((m) => m.children.flatMap((w) => w.children.flatMap((d) => d.todos)));
      half.progress = pct(hTodos.filter((t) => t.completed).length, hTodos.length);
    });
    // Year: flat count all the way down
    const yTodos = year.children.flatMap((h) => h.children.flatMap((m) => m.children.flatMap((w) => w.children.flatMap((d) => d.todos))));
    year.progress = pct(yTodos.filter((t) => t.completed).length, yTodos.length);
  });
  // Vision root
  const vTodos = v.children.flatMap((y) => y.children.flatMap((h) => h.children.flatMap((m) => m.children.flatMap((w) => w.children.flatMap((d) => d.todos)))));
  v.progress = pct(vTodos.filter((t) => t.completed).length, vTodos.length);
}

function calcOverall(v: VisionGoal): number {
  let total = 0, done = 0;
  v.children.forEach((y) => y.children.forEach((h) => h.children.forEach((m) =>
    m.children.forEach((w) => w.children.forEach((d) =>
      d.todos.forEach((t) => { total++; if (t.completed) done++; })
    ))
  )));
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

/** Extract Korean month number from dateDisplay like "2026년 4월" or "4월" or index fallback */
function koreanMonth(dateDisplay?: string, idx?: number): string {
  if (dateDisplay) {
    const m = dateDisplay.match(/(\d+)월/);
    if (m) return `${m[1]}월`;
  }
  if (idx !== undefined) return `${idx + 1}월`;
  return "";
}

function strokeColor(pct: number) {
  if (pct >= 80) return "#10b981";   // emerald
  if (pct >= 50) return "#320e9d";   // dream
  if (pct >= 20) return "#f59e0b";   // amber
  return "#e2e8f0";                   // secondary (empty)
}

/* ─── Donut SVG ─── */
function Donut({ pct, size = 36, stroke = 3.5 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const cx = size / 2;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={cx} cy={cx} r={r} strokeWidth={stroke} fill="none" className="stroke-secondary" />
      <circle
        cx={cx} cy={cx} r={r} strokeWidth={stroke} fill="none"
        stroke={strokeColor(pct)}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

/* ─── Three-dot Menu ─── */
function DotsMenu({
  onEdit, onDelete,
}: { onEdit: () => void; onDelete: () => void; }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
        className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground/50 hover:text-foreground"
      >
        <MoreHorizontal size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-xl shadow-lg overflow-hidden min-w-[120px]"
          >
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-[12px] hover:bg-secondary/60 transition-colors text-foreground"
            >
              <Pencil size={12} className="text-dream" /> 수정
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-[12px] hover:bg-red-50 transition-colors text-red-500"
            >
              <Trash2 size={12} /> 삭제
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── useIsMobile ─── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

/* ─── Mobile Edit Drawer ─── */
function EditDrawer({
  item, onSave, onClose,
}: {
  item: { id: string; value: string; label: string };
  onSave: (id: string, value: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(item.value);
  const dragControls = useDragControls();

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-[199]"
        onClick={onClose}
      />
      <motion.div
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0, bottom: 0.4 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100 || info.velocity.y > 400) onClose();
        }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="fixed bottom-0 left-0 right-0 z-[200] bg-white rounded-t-2xl px-4 pt-3 pb-10 shadow-2xl"
      >
        {/* Drag handle — touch here to drag down & close */}
        <div
          className="flex justify-center pb-3 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={(e) => dragControls.start(e)}
          onClick={onClose}
        >
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        <p className="text-[13px] font-semibold text-foreground mb-3">{item.label} 수정</p>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full text-[16px] border border-border rounded-xl px-3 py-2.5 outline-none focus:border-dream resize-none leading-snug mb-3"
        />
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-border text-[13px] text-muted-foreground active:bg-secondary"
          >취소</button>
          <button
            onClick={() => { if (text.trim()) { onSave(item.id, text.trim()); onClose(); } }}
            disabled={!text.trim()}
            className="flex-1 py-3 rounded-xl bg-dream text-white text-[13px] font-semibold disabled:opacity-40 active:bg-dream/90"
          >저장</button>
        </div>
      </motion.div>
    </>
  );
}

/* ─── Inline Edit Input ─── */
function InlineEdit({
  value, onSave, onCancel, placeholder, textClass,
}: { value: string; onSave: (v: string) => void; onCancel: () => void; placeholder?: string; textClass?: string; }) {
  const [text, setText] = useState(value);
  return (
    <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(text);
          if (e.key === "Escape") onCancel();
        }}
        placeholder={placeholder}
        className={cn(
          "flex-1 min-w-0 bg-white/80 border-0 border-b border-dream/50 outline-none px-0.5 py-0 leading-snug",
          textClass
        )}
      />
      <button onClick={() => onSave(text)} className="text-dream shrink-0"><Check size={11} /></button>
      <button onClick={onCancel} className="text-muted-foreground shrink-0"><X size={11} /></button>
    </div>
  );
}

/* ─── WeekPanel ─── */
function WeekPanel({
  week,
  onToggleTodo,
  onAddTodo,
  onEditTodo,
  onDeleteTodo,
}: {
  week: WeeklyGoal;
  onToggleTodo: (weekId: string, dayId: string, todoId: string) => void;
  onAddTodo: (weekId: string, text: string) => void;
  onEditTodo: (weekId: string, dayId: string, todoId: string, newTitle: string) => void;
  onDeleteTodo: (weekId: string, dayId: string, todoId: string) => void;
}) {
  const [newTodo, setNewTodo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const allTodos = week.children.flatMap((d) => d.todos.map((t) => ({ ...t, dayId: d.id })));
  const doneTodos = allTodos.filter((t) => t.completed).length;

  const handleAdd = () => {
    const trimmed = newTodo.trim();
    if (!trimmed) return;
    onAddTodo(week.id, trimmed);
    setNewTodo("");
  };

  const startEdit = (todo: { id: string; title: string }) => {
    setEditingId(todo.id);
    setEditText(todo.title);
  };

  const commitEdit = (dayId: string, todoId: string) => {
    const trimmed = editText.trim();
    if (trimmed) onEditTodo(week.id, dayId, todoId, trimmed);
    setEditingId(null);
  };

  return (
    <div className="pl-[3.25rem] pr-3 pb-3 pt-1.5 space-y-1 bg-secondary/10">
      {week.description && (
        <p className="text-[10px] text-muted-foreground border-l-2 border-dream/30 pl-2 mb-2 leading-relaxed">
          {week.description}
        </p>
      )}

      {/* Todo list */}
      {allTodos.map((todo) => (
        <div
          key={todo.id}
          className={cn(
            "flex items-center gap-2 w-full text-[12px] rounded-lg px-2 py-1.5 transition-colors group",
            todo.completed ? "text-muted-foreground" : "hover:bg-secondary text-foreground"
          )}
        >
          {/* Check toggle */}
          <button
            onClick={() => onToggleTodo(week.id, todo.dayId, todo.id)}
            className="shrink-0 mt-0.5"
            data-testid={`toggle-todo-${todo.id}`}
          >
            {todo.completed
              ? <Check size={13} className="text-emerald-500" />
              : <Circle size={13} className="text-muted-foreground/40 group-hover:text-dream transition-colors" />}
          </button>

          {/* Title or inline edit */}
          {editingId === todo.id ? (
            <input
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit(todo.dayId, todo.id);
                if (e.key === "Escape") setEditingId(null);
              }}
              onBlur={() => commitEdit(todo.dayId, todo.id)}
              className="flex-1 text-[12px] bg-white border border-dream/50 rounded px-1.5 py-0.5 outline-none"
              data-testid={`input-edit-todo-${todo.id}`}
            />
          ) : (
            <span className={cn("leading-snug flex-1 min-w-0 break-words", todo.completed && "line-through")}>
              {todo.title}
            </span>
          )}

          {/* Edit / Delete actions – visible on hover */}
          {editingId !== todo.id && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => startEdit(todo)}
                className="p-1 rounded hover:bg-dream/10 text-muted-foreground hover:text-dream transition-colors"
                data-testid={`button-edit-todo-${todo.id}`}
                title="수정"
              >
                <Pencil size={11} />
              </button>
              <button
                onClick={() => onDeleteTodo(week.id, todo.dayId, todo.id)}
                className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                data-testid={`button-delete-todo-${todo.id}`}
                title="삭제"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Count */}
      {allTodos.length > 0 && (
        <p className="text-[10px] text-muted-foreground px-2">{doneTodos}/{allTodos.length} 완료</p>
      )}

      {/* Add todo */}
      <div className="flex items-center gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          placeholder="할 일 추가..."
          className="flex-1 text-[12px] bg-white border border-border/60 rounded-lg px-2.5 py-1.5 outline-none focus:border-dream/60 placeholder:text-muted-foreground/50"
          data-testid={`input-add-todo-${week.id}`}
        />
        <button
          onClick={handleAdd}
          disabled={!newTodo.trim()}
          className="p-1.5 bg-dream/10 hover:bg-dream/20 text-dream rounded-lg disabled:opacity-40 transition-colors"
          data-testid={`button-add-todo-${week.id}`}
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
interface Props { kompassId: string; visionTitle: string; }

export function DreamGoalManager({ kompassId, visionTitle }: Props) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [vision, setVision] = useState<VisionGoal | null>(null);
  const [expandedYearIds, setExpandedYearIds] = useState<Set<string>>(new Set());
  const [expandedMonthIds, setExpandedMonthIds] = useState<Set<string>>(new Set());
  const [expandedWeekIds, setExpandedWeekIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerEdit, setDrawerEdit] = useState<{ id: string; value: string; label: string } | null>(null);

  /** Route to inline (desktop) or drawer (mobile) */
  const openEdit = (id: string, value: string, label: string) => {
    if (isMobile) {
      setDrawerEdit({ id, value, label });
    } else {
      setEditingId(id);
    }
  };

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef("");
  const visionRef = useRef<VisionGoal | null>(null);

  const { data: kompassData, isLoading } = useQuery<KompassData>({
    queryKey: [`/api/kompass/${kompassId}`],
    enabled: !!kompassId,
  });

  const saveMutation = useMutation({
    mutationFn: async (v: VisionGoal) => {
      const res = await apiRequest("PATCH", `/api/kompass/${kompassId}`, {
        visionData: v, progress: calcOverall(v),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/kompass"] }),
  });

  const triggerSave = useCallback(() => {
    if (!vision || !kompassId) return;
    const str = JSON.stringify(vision);
    if (str === lastSavedRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      lastSavedRef.current = str;
      saveMutation.mutate(vision);
    }, 1000);
  }, [vision, kompassId, saveMutation]);

  useEffect(() => { triggerSave(); }, [vision, triggerSave]);
  useEffect(() => { visionRef.current = vision; }, [vision]);

  useEffect(() => {
    if (kompassData) {
      setVision(kompassData.visionData);
      lastSavedRef.current = JSON.stringify(kompassData.visionData);
      const firstYear = kompassData.visionData.children[0];
      if (firstYear) {
        setExpandedYearIds(new Set([firstYear.id]));
        const firstMonth = firstYear.children[0]?.children[0];
        if (firstMonth) setExpandedMonthIds(new Set([firstMonth.id]));
      }
    }
  }, [kompassData]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      const v = visionRef.current;
      if (v && JSON.stringify(v) !== lastSavedRef.current) saveMutation.mutate(v);
    };
  }, []);

  /* ── Mutators ── */
  const updateVision = (fn: (v: VisionGoal) => void) => {
    if (!vision) return;
    const next = JSON.parse(JSON.stringify(vision)) as VisionGoal;
    fn(next);
    visionRef.current = next;
    setVision(next);
  };

  /** Find node at any depth and run callback */
  const findNode = (v: VisionGoal, id: string, cb: (node: any) => void): boolean => {
    const traverse = (nodes: any[]): boolean => {
      for (const n of nodes) {
        if (n.id === id) { cb(n); return true; }
        if (n.children && traverse(n.children)) return true;
      }
      return false;
    };
    if (v.id === id) { cb(v); return true; }
    return traverse(v.children);
  };

  const handleToggleTodo = (weekId: string, dayId: string, todoId: string) => {
    updateVision((v) => {
      for (const year of v.children)
        for (const half of year.children)
          for (const month of half.children)
            for (const week of month.children) {
              if (week.id !== weekId) continue;
              const day = week.children.find((d) => d.id === dayId);
              const todo = day?.todos.find((t) => t.id === todoId);
              if (todo) { todo.completed = !todo.completed; recalcProgress(v); return; }
            }
    });
  };

  const handleAddTodo = (weekId: string, text: string) => {
    updateVision((v) => {
      for (const year of v.children)
        for (const half of year.children)
          for (const month of half.children)
            for (const week of month.children) {
              if (week.id !== weekId) continue;
              // Add to first day (or create one)
              if (week.children.length === 0) {
                week.children.push({
                  id: `${weekId}-day-1`, title: "Day 1", dateDisplay: "",
                  progress: 0, todos: [], children: [] as any,
                } as any);
              }
              const day = week.children[0];
              day.todos.push({
                id: `${weekId}-todo-${Date.now()}`,
                title: text,
                completed: false,
              });
              recalcProgress(v);
              return;
            }
    });
  };

  const handleEditTodo = (weekId: string, dayId: string, todoId: string, newTitle: string) => {
    updateVision((v) => {
      for (const year of v.children)
        for (const half of year.children)
          for (const month of half.children)
            for (const week of month.children) {
              if (week.id !== weekId) continue;
              const day = week.children.find((d) => d.id === dayId);
              const todo = day?.todos.find((t) => t.id === todoId);
              if (todo) { todo.title = newTitle; return; }
            }
    });
  };

  const handleDeleteTodo = (weekId: string, dayId: string, todoId: string) => {
    updateVision((v) => {
      for (const year of v.children)
        for (const half of year.children)
          for (const month of half.children)
            for (const week of month.children) {
              if (week.id !== weekId) continue;
              const day = week.children.find((d) => d.id === dayId);
              if (day) {
                day.todos = day.todos.filter((t) => t.id !== todoId);
                recalcProgress(v);
                return;
              }
            }
    });
  };

  const handleEditNode = (id: string, newTitle: string) => {
    updateVision((v) => { findNode(v, id, (n) => { n.title = newTitle; }); });
    setEditingId(null);
  };

  const handleDeleteYear = (yearId: string) => {
    if (!confirm("이 연간 목표를 삭제하시겠습니까?")) return;
    updateVision((v) => { v.children = v.children.filter((y) => y.id !== yearId); recalcProgress(v); });
  };

  const handleDeleteMonth = (monthId: string) => {
    if (!confirm("이 월별 목표를 삭제하시겠습니까?")) return;
    updateVision((v) => {
      for (const year of v.children)
        for (const half of year.children) {
          half.children = half.children.filter((m) => m.id !== monthId);
        }
      recalcProgress(v);
    });
  };

  const handleDeleteWeek = (weekId: string) => {
    if (!confirm("이 주별 목표를 삭제하시겠습니까?")) return;
    updateVision((v) => {
      for (const year of v.children)
        for (const half of year.children)
          for (const month of half.children) {
            month.children = month.children.filter((w) => w.id !== weekId);
          }
      recalcProgress(v);
    });
  };

  const toggle = (set: Set<string>, id: string): Set<string> => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

  /* ── Render ── */
  if (isLoading) {
    return (
      <div className="space-y-2 mt-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-11 w-full rounded-xl" />)}
      </div>
    );
  }
  if (!vision) return null;

  const years = flattenYear(vision);

  return (
    <div className="mt-3">
      {/* ── Year → Month → Week accordion (Notion-style flat rows) ── */}
      <div className="space-y-2">
        {years.map((year) => {
          const isYearOpen = expandedYearIds.has(year.id);
          return (
            /* Year block: outer border only – no nested card borders */
            <div key={year.id} className="rounded-xl border border-border overflow-hidden">

              {/* ── Year header ── */}
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors select-none",
                  isYearOpen ? "bg-dream/5" : "hover:bg-secondary/40"
                )}
                onClick={() => setExpandedYearIds((p) => toggle(p, year.id))}
                data-testid={`accordion-year-${year.id}`}
              >
                <ChevronRight size={13} className={cn("text-muted-foreground shrink-0 transition-transform", isYearOpen && "rotate-90")} />
                <span className="font-bold text-[13px] text-foreground shrink-0">{year.dateDisplay ?? year.title}년</span>
                {editingId === year.id ? (
                  <InlineEdit value={year.title} onSave={(v) => handleEditNode(year.id, v)} onCancel={() => setEditingId(null)} placeholder="연간 목표..." textClass="text-[11px] text-muted-foreground" />
                ) : (
                  <span className="text-[11px] text-muted-foreground flex-1 min-w-0 break-words">{year.description || year.title}</span>
                )}
                <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Donut pct={year.progress} size={32} stroke={3} />
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-dream">{year.progress}%</span>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <DotsMenu onEdit={() => openEdit(year.id, year.description || year.title, "연간 목표")} onDelete={() => handleDeleteYear(year.id)} />
                </div>
              </div>

              {/* ── Months: flat rows, same width, left-border shows depth ── */}
              <AnimatePresence>
                {isYearOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                    className="overflow-hidden divide-y divide-border/20"
                  >
                    {year.months.map((month, monthIdx) => {
                      const isMonthOpen = expandedMonthIds.has(month.id);
                      const kMonth = koreanMonth(month.dateDisplay, monthIdx);
                      return (
                        <div key={month.id}>

                          {/* ── Month header: pl-7, left colored border for depth ── */}
                          <div
                            className={cn(
                              "flex items-center gap-2 pl-7 pr-3 py-2 cursor-pointer transition-colors select-none border-l-2",
                              isMonthOpen ? "bg-dream/[0.03] border-l-dream/50" : "hover:bg-secondary/20 border-l-dream/15"
                            )}
                            onClick={() => setExpandedMonthIds((p) => toggle(p, month.id))}
                            data-testid={`accordion-month-${month.id}`}
                          >
                            <ChevronRight size={11} className={cn("text-muted-foreground/60 shrink-0 transition-transform", isMonthOpen && "rotate-90")} />
                            <span className="text-[11px] font-semibold text-dream shrink-0 w-6">{kMonth}</span>
                            {editingId === month.id ? (
                              <InlineEdit value={month.title} onSave={(v) => handleEditNode(month.id, v)} onCancel={() => setEditingId(null)} placeholder="월별 목표..." textClass="text-[11px] text-foreground" />
                            ) : (
                              <span className="text-[11px] text-foreground flex-1 min-w-0 break-words">{month.title}</span>
                            )}
                            <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                              <Donut pct={month.progress} size={28} stroke={2.5} />
                              <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-dream">{month.progress}%</span>
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                              <DotsMenu onEdit={() => openEdit(month.id, month.title, "월별 목표")} onDelete={() => handleDeleteMonth(month.id)} />
                            </div>
                          </div>

                          {/* ── Weeks: flat rows, deeper indent, lighter border ── */}
                          <AnimatePresence>
                            {isMonthOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.16 }}
                                className="overflow-hidden divide-y divide-border/10"
                              >
                                {month.weeks.map((week) => {
                                  const isWeekOpen = expandedWeekIds.has(week.id);
                                  const allTodos = week.children.flatMap((d) => d.todos);
                                  const doneTodos = allTodos.filter((t) => t.completed).length;
                                  return (
                                    <div key={week.id}>

                                      {/* Week header: pl-12, thinner left border */}
                                      <div
                                        className={cn(
                                          "flex items-center gap-2 pl-12 pr-3 py-1.5 cursor-pointer select-none transition-colors border-l-2",
                                          isWeekOpen ? "bg-secondary/30 border-l-dream/30" : "hover:bg-secondary/10 border-l-transparent"
                                        )}
                                        onClick={() => setExpandedWeekIds((p) => toggle(p, week.id))}
                                        data-testid={`accordion-week-${week.id}`}
                                      >
                                        <ChevronRight size={10} className={cn("text-muted-foreground/40 shrink-0 transition-transform", isWeekOpen && "rotate-90")} />

                                        {editingId === week.id ? (
                                          <InlineEdit value={week.title} onSave={(v) => handleEditNode(week.id, v)} onCancel={() => setEditingId(null)} placeholder="주별 목표..." textClass="text-[11px] font-medium text-foreground" />
                                        ) : (
                                          <div className="flex-1 min-w-0">
                                            <span className="text-[11px] font-medium text-foreground">{week.title}</span>
                                            {week.description && (
                                              <span className="text-[10px] text-muted-foreground ml-1.5 break-words">{week.description}</span>
                                            )}
                                          </div>
                                        )}

                                        {allTodos.length > 0 && (
                                          <span className="text-[10px] text-muted-foreground shrink-0">{doneTodos}/{allTodos.length}</span>
                                        )}
                                        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                                          <Donut pct={week.progress} size={24} stroke={2} />
                                          <span className="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-dream">{week.progress}%</span>
                                        </div>
                                        <div onClick={(e) => e.stopPropagation()}>
                                          <DotsMenu onEdit={() => openEdit(week.id, week.title, "주별 목표")} onDelete={() => handleDeleteWeek(week.id)} />
                                        </div>
                                      </div>

                                      {/* Week content */}
                                      <AnimatePresence>
                                        {isWeekOpen && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.14 }}
                                            className="overflow-hidden"
                                          >
                                            <WeekPanel
                                              week={week}
                                              onToggleTodo={handleToggleTodo}
                                              onAddTodo={handleAddTodo}
                                              onEditTodo={handleEditTodo}
                                              onDeleteTodo={handleDeleteTodo}
                                            />
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Save indicator */}
      {saveMutation.isPending && (
        <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
          <Loader2 size={10} className="animate-spin" /> 저장 중...
        </div>
      )}

      {/* Mobile bottom drawer for editing */}
      <AnimatePresence>
        {drawerEdit && (
          <EditDrawer
            item={drawerEdit}
            onSave={(id, value) => { handleEditNode(id, value); }}
            onClose={() => setDrawerEdit(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
