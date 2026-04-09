import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Sparkles,
  PenLine,
  ChevronRight,
  Target,
  Calendar,
  TrendingUp,
  Flame,
  CheckCircle2,
  Plus,
  Loader2,
  Trash2,
  Compass,
  ArrowRight,
  Flag,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { generateLightTree, VisionGoal } from "@/lib/mockData";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface KompassItem {
  id: string;
  profileId: string;
  targetYear: number;
  startMonth?: number;
  visionData: VisionGoal;
  progress: number;
  profileTitle?: string;
  createdAt?: string;
}

interface ImportedCareerData {
  title: string;
  actions: { portfolio: string[]; networking: string[]; mindset: string[] };
  strengths: string[];
  weaknesses: string[];
  profileId?: string;
}

interface Profile { id: string; title: string; type: string; }

function calcDDay(targetYear: number): number {
  const suneungDate = new Date(targetYear, 10, 1);
  const today = new Date();
  return Math.ceil((suneungDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function calcJourneyPct(createdAt: string | undefined, targetYear: number): number {
  const start = createdAt ? new Date(createdAt) : new Date();
  const end = new Date(targetYear, 10, 1);
  const today = new Date();
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 100;
  const elapsed = today.getTime() - start.getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

function getGoalStats(vision: VisionGoal) {
  const years = vision.children ?? [];
  const halves = years.flatMap((y) => y.children ?? []);
  const months = halves.flatMap((h) => h.children ?? []);
  const weeks = months.flatMap((m) => m.children ?? []);

  const doneYears = years.filter((y) => y.progress >= 100).length;
  const doneHalves = halves.filter((h) => h.progress >= 100).length;
  const doneMonths = months.filter((m) => m.progress >= 100).length;
  const doneWeeks = weeks.filter((w) => w.progress >= 100).length;

  return {
    years: { done: doneYears, total: years.length },
    halves: { done: doneHalves, total: halves.length },
    months: { done: doneMonths, total: months.length },
    weeks: { done: doneWeeks, total: weeks.length },
  };
}

function getStatusColor(progress: number, journeyPct: number): { bg: string; text: string; label: string } {
  const diff = progress - journeyPct;
  if (progress >= 100) return { bg: "bg-emerald-100", text: "text-emerald-700", label: "완료" };
  if (diff >= -5) return { bg: "bg-dream/10", text: "text-dream", label: "순조로움" };
  if (diff >= -20) return { bg: "bg-amber-100", text: "text-amber-700", label: "주의 필요" };
  return { bg: "bg-red-100", text: "text-red-600", label: "집중 필요" };
}

function CircleProgress({ value, size = 56 }: { value: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={5} className="stroke-secondary fill-none" />
      <circle
        cx={size / 2} cy={size / 2} r={r} strokeWidth={5}
        className="fill-none stroke-dream transition-all duration-700"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Dream() {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [dreamText, setDreamText] = useState("나의 꿈을 선언해보세요");
  const [isEditing, setIsEditing] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTargetYear, setNewTargetYear] = useState(String(new Date().getFullYear() + 2));
  const [newDescription, setNewDescription] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [importedData, setImportedData] = useState<ImportedCareerData | null>(null);
  const [deletingKompassId, setDeletingKompassId] = useState<string | null>(null);

  const { data: kompassList = [], isLoading: isLoadingKompass } = useQuery<KompassItem[]>({
    queryKey: ["/api/kompass"],
  });

  const { data: profileList = [] } = useQuery<Profile[]>({
    queryKey: ["/api/profiles"],
    staleTime: 5 * 60 * 1000,
  });

  const createKompassMutation = useMutation({
    mutationFn: async (data: { profileId: string; targetYear: number; startMonth: number; visionData?: VisionGoal; title?: string; description?: string; useAI?: boolean }) => {
      if (data.useAI) {
        const response = await apiRequest("POST", `/api/profiles/${data.profileId}/kompass/generate`, {
          title: data.title, targetYear: data.targetYear, description: data.description,
        });
        return { ...(await response.json()), _usedAI: true };
      } else {
        const response = await apiRequest("POST", `/api/profiles/${data.profileId}/kompass`, {
          targetYear: data.targetYear, startMonth: data.startMonth, visionData: data.visionData, progress: 0,
        });
        return { ...(await response.json()), _usedAI: false };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/kompass"] });
      setIsCreateModalOpen(false);
      setNewTitle(""); setNewDescription(""); setSelectedProfileId(""); setImportedData(null);
      toast.success(data._usedAI ? "AI가 목표 계획을 생성했습니다!" : "꿈 목표가 저장되었습니다.");
      setLocation(`/goals/${data.id}`);
    },
    onError: () => toast.error("목표 생성 중 오류가 발생했습니다."),
  });

  const deleteKompassMutation = useMutation({
    mutationFn: async (kompassId: string) => {
      await apiRequest("DELETE", `/api/kompass/${kompassId}`);
    },
    onMutate: async (kompassId: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/kompass"] });
      const prev = queryClient.getQueryData(["/api/kompass"]);
      queryClient.setQueryData(["/api/kompass"], (old: any[]) => old?.filter((k) => k.id !== kompassId) ?? []);
      return { prev };
    },
    onSuccess: () => toast.success("목표가 삭제되었습니다."),
    onError: (_err: any, _id: any, context: any) => {
      if (context?.prev) queryClient.setQueryData(["/api/kompass"], context.prev);
      toast.error("삭제 중 오류가 발생했습니다.");
    },
    onSettled: () => {
      setDeletingKompassId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/kompass"] });
    },
  });

  useEffect(() => {
    if (profileList.length > 0 && !selectedProfileId) {
      setSelectedProfileId(profileList[0].id);
    }
  }, [profileList, selectedProfileId]);

  useEffect(() => {
    if (kompassList.length > 0 && kompassList[0].visionData?.title) {
      setDreamText(kompassList[0].visionData.title);
    }
  }, [kompassList]);

  const handleSubmit = () => {
    if (!newTitle || !newTargetYear) { toast.error("목표 제목과 달성 연도를 입력해주세요."); return; }
    if (!selectedProfileId) { toast.error("프로필을 먼저 생성해주세요."); return; }
    const targetYear = parseInt(newTargetYear);
    if (importedData) {
      const visionData = generateLightTree(`temp-${Date.now()}`, newTitle, targetYear, newDescription, 1);
      createKompassMutation.mutate({ profileId: selectedProfileId, targetYear, startMonth: 1, visionData });
    } else {
      createKompassMutation.mutate({ profileId: selectedProfileId, targetYear, startMonth: 1, title: newTitle, description: newDescription, useAI: true });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6">
      {/* Hero */}
      <section className="mb-8">
        <div className="relative overflow-hidden rounded-xl">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663433131621/A3XszkVKVy7WNitpyWDbEe/v3-dream-declare-mDj6CTYACFFc5iz7RCGboG.webp"
            alt="꿈 선언"
            className="w-full h-44 lg:h-56 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent" />
          <div className="absolute bottom-5 left-5 lg:bottom-7 lg:left-8">
            <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold">Dream Journey</span>
            <h1 className="editorial-heading text-2xl lg:text-3xl text-white mt-1">꿈의 선언</h1>
            <p className="text-white/60 text-xs mt-1">선언하고, 기록하고, 성장합니다.</p>
          </div>
        </div>
      </section>

      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8">
        {/* ── Main Column ── */}
        <div className="space-y-8">

          {/* ═══ 나의 꿈 선언 ═══ */}
          <section>
            <motion.div className="dream-card p-6 lg:p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 mb-4">
                <Star size={18} className="text-dream" />
                <span className="text-xs uppercase tracking-[0.15em] text-dream font-semibold">나의 꿈 선언</span>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">나는</p>
                  <textarea
                    value={dreamText}
                    onChange={(e) => setDreamText(e.target.value)}
                    className="w-full p-3 border border-dream/30 rounded-lg bg-transparent editorial-heading text-xl focus:border-dream outline-none resize-none"
                    rows={2}
                    data-testid="input-dream-text"
                  />
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 bg-dream text-white text-sm font-semibold rounded-lg"
                      onClick={() => { setIsEditing(false); toast.success("꿈이 업데이트되었습니다"); }}
                      data-testid="button-declare-dream"
                    >
                      선언하기
                    </button>
                    <button className="px-4 py-2 text-sm text-muted-foreground" onClick={() => setIsEditing(false)}>취소</button>
                  </div>
                </div>
              ) : (
                <>
                  <blockquote className="editorial-heading text-2xl lg:text-3xl leading-snug mb-5">
                    "{dreamText}"
                  </blockquote>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    {kompassList[0] && (
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {kompassList[0].targetYear}년 목표
                      </span>
                    )}
                    {kompassList[0] && (
                      <span className="flex items-center gap-1 text-coral font-semibold">
                        <Flame size={13} />
                        D-{Math.max(0, calcDDay(kompassList[0].targetYear))}
                      </span>
                    )}
                  </div>
                  <button
                    className="mt-4 text-xs text-dream hover:underline flex items-center gap-1"
                    onClick={() => setIsEditing(true)}
                    data-testid="button-edit-dream"
                  >
                    <PenLine size={12} /> 꿈 수정하기
                  </button>
                </>
              )}
            </motion.div>
          </section>

          {/* ═══ 꿈을 위한 목표들 ═══ */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="editorial-heading text-lg flex items-center gap-2">
                  <Target size={17} className="text-dream" />
                  꿈을 위한 목표들
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  연간 → 반기 → 월별 → 주별 → 일별 목표를 체계적으로 관리합니다
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-dream text-white text-xs font-semibold rounded-lg hover:bg-dream/90 transition-colors"
                data-testid="button-create-dream-kompass"
              >
                <Plus size={13} /> 새 목표
              </button>
            </div>
            <hr className="editorial-divider-thick mt-0 mb-4" />

            {isLoadingKompass ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
              </div>
            ) : kompassList.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="dream-card p-6 text-center cursor-pointer group"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <div className="w-12 h-12 bg-dream/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Plus size={20} className="text-dream" />
                </div>
                <p className="editorial-heading text-base text-dream mb-1">첫 번째 꿈 목표를 선언하세요</p>
                <p className="text-xs text-muted-foreground">AI가 연간·반기·월별·주별·일별 목표를 자동으로 생성합니다</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {kompassList.map((kompass, i) => {
                  const vision = kompass.visionData;
                  return (
                    <motion.div
                      key={kompass.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="group relative ink-card p-4 hover:border-dream/40 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setLocation(`/goals/${kompass.id}`)}
                      data-testid={`card-dream-kompass-${kompass.id}`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (deletingKompassId) return;
                          if (window.confirm(`"${vision.title}" 목표를 삭제하시겠습니까?`)) {
                            setDeletingKompassId(kompass.id);
                            deleteKompassMutation.mutate(kompass.id);
                          }
                        }}
                        className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        data-testid={`button-delete-dream-kompass-${kompass.id}`}
                      >
                        {deletingKompassId === kompass.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>

                      <div className="flex items-start gap-3 pr-8">
                        <div className="w-10 h-10 bg-dream/10 rounded-lg flex items-center justify-center shrink-0">
                          <Target size={18} className="text-dream" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] bg-dream/10 text-dream px-2 py-0.5 rounded-full font-semibold">
                              {kompass.targetYear}년 목표
                            </span>
                            {kompass.profileTitle && (
                              <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{kompass.profileTitle}</span>
                            )}
                          </div>
                          <p className="text-sm font-semibold line-clamp-1 mb-1">{vision.title}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2">{vision.description}</p>
                          <div className="flex items-center gap-3">
                            <Progress value={kompass.progress} className="h-1.5 flex-1" indicatorClassName="bg-dream" />
                            <span className="text-xs font-bold text-dream shrink-0">{kompass.progress}%</span>
                          </div>
                        </div>
                        <ChevronRight size={15} className="text-muted-foreground/40 group-hover:text-dream transition-colors shrink-0 mt-1" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ═══ 꿈의 여정 ═══ */}
          <section>
            <h2 className="editorial-heading text-lg mb-4 flex items-center gap-2">
              <TrendingUp size={17} className="text-dream" />
              꿈의 여정
            </h2>
            <hr className="editorial-divider-thick mt-0 mb-4" />

            {isLoadingKompass ? (
              <div className="space-y-4">
                {[1, 2].map((i) => <Skeleton key={i} className="h-52 w-full rounded-xl" />)}
              </div>
            ) : kompassList.length === 0 ? (
              <div className="dream-card p-8 text-center">
                <Flag size={28} className="text-dream/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">목표를 추가하면 여정 진행도가 표시됩니다</p>
              </div>
            ) : (
              <div className="space-y-5">
                {kompassList.map((kompass, i) => {
                  const stats = getGoalStats(kompass.visionData);
                  const dDay = calcDDay(kompass.targetYear);
                  const journeyPct = calcJourneyPct(kompass.createdAt, kompass.targetYear);
                  const status = getStatusColor(kompass.progress, journeyPct);

                  const levels = [
                    { label: "연간 목표", ...stats.years, color: "bg-dream" },
                    { label: "반기 목표", ...stats.halves, color: "bg-indigo-500" },
                    { label: "월별 목표", ...stats.months, color: "bg-violet-500" },
                    { label: "주별 목표", ...stats.weeks, color: "bg-coral" },
                  ];

                  return (
                    <motion.div
                      key={kompass.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="ink-card p-5 hover:border-dream/30 transition-colors"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-0.5">{kompass.profileTitle ?? "목표"}</p>
                          <p className="font-bold text-base line-clamp-1">{kompass.visionData.title}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ml-3 shrink-0 ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </div>

                      {/* Overall progress */}
                      <div className="flex items-center gap-4 mb-5">
                        <div className="relative shrink-0">
                          <CircleProgress value={kompass.progress} size={64} />
                          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-dream">
                            {kompass.progress}%
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                            <span>전체 달성률</span>
                            <span className="font-semibold text-dream">{kompass.progress}%</span>
                          </div>
                          <Progress value={kompass.progress} className="h-2.5 rounded-full" indicatorClassName="bg-dream rounded-full" />
                          <p className="text-[9px] text-muted-foreground mt-1.5">
                            목표 기간의 {journeyPct}% 경과 · {dDay > 0 ? `D-${dDay}` : "D-Day"}
                          </p>
                        </div>
                      </div>

                      {/* Goal level breakdown */}
                      <div className="space-y-2.5 mb-5">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">목표 레벨 진행</p>
                        {levels.map((lv) => {
                          const pct = lv.total > 0 ? Math.round((lv.done / lv.total) * 100) : 0;
                          return (
                            <div key={lv.label} className="flex items-center gap-2.5">
                              <span className="text-[10px] text-muted-foreground w-16 shrink-0">{lv.label}</span>
                              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${lv.color}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-semibold text-muted-foreground w-12 text-right shrink-0">
                                {lv.done}/{lv.total}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Journey timeline bar */}
                      <div className="bg-secondary/40 rounded-lg p-3">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {kompass.createdAt
                              ? new Date(kompass.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "short" })
                              : "시작"}
                          </span>
                          <span className="flex items-center gap-1 text-dream font-semibold">
                            <Flag size={10} />
                            {kompass.targetYear}년 목표
                          </span>
                        </div>
                        <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-dream to-coral rounded-full transition-all duration-700"
                            style={{ width: `${journeyPct}%` }}
                          />
                          {/* Today marker */}
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white border-2 border-dream rounded-full shadow-sm"
                            style={{ left: `calc(${journeyPct}% - 4px)` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[9px] text-muted-foreground">경과 {journeyPct}%</span>
                          <button
                            onClick={() => setLocation(`/goals/${kompass.id}`)}
                            className="text-[10px] text-dream font-semibold flex items-center gap-0.5 hover:underline"
                          >
                            세부 목표 보기 <ArrowRight size={9} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ── Right Sidebar ── */}
        <aside className="hidden lg:block space-y-5 mt-0">
          {/* D-Day 카드 */}
          {kompassList[0] && (
            <div className="ink-card p-4 bg-gradient-to-br from-dream/5 to-transparent border-dream/20">
              <div className="flex items-center gap-2 mb-3">
                <Flame size={14} className="text-coral" />
                <span className="text-xs font-semibold tracking-wider uppercase">카운트다운</span>
              </div>
              <div className="text-center py-2">
                <p className="editorial-heading text-4xl text-dream">
                  D-{Math.max(0, calcDDay(kompassList[0].targetYear))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{kompassList[0].targetYear}년 목표까지</p>
              </div>
              <div className="mt-3 bg-dream/5 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">전체 달성률</p>
                <p className="text-xl font-bold text-dream mt-0.5">{kompassList[0].progress}%</p>
              </div>
            </div>
          )}

          {/* 전체 진행 요약 */}
          {kompassList.length > 0 && (
            <div className="ink-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Compass size={14} className="text-dream" />
                <span className="text-xs font-semibold tracking-wider uppercase">목표 요약</span>
              </div>
              <div className="space-y-2">
                {kompassList.map((k) => {
                  const stats = getGoalStats(k.visionData);
                  return (
                    <div key={k.id} className="bg-secondary/40 rounded-lg p-2.5">
                      <p className="text-[11px] font-semibold line-clamp-1 mb-1.5">{k.visionData.title}</p>
                      <div className="flex items-center gap-2">
                        <Progress value={k.progress} className="h-1.5 flex-1" indicatorClassName="bg-dream" />
                        <span className="text-[10px] font-bold text-dream">{k.progress}%</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1">
                        월별 {stats.months.done}/{stats.months.total}개 완료
                      </p>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 border border-dream/20 text-dream text-xs font-semibold rounded-lg hover:bg-dream/5 transition-colors"
              >
                <Plus size={12} /> 새 목표 추가
              </button>
            </div>
          )}

          {/* 꿈의 성장 */}
          <div className="ink-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-gold" />
              <span className="text-xs font-semibold tracking-wider uppercase">꿈의 성장</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground mb-3">
              꿈이 바뀌는 건 <span className="font-bold text-foreground">실패가 아니라 성장</span>입니다.
              모든 변화는 기록으로 남습니다.
            </p>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">현재까지</p>
              <p className="editorial-heading text-xl text-dream">{kompassList.length}개의 꿈</p>
              <p className="text-[10px] text-muted-foreground">을 선언했습니다</p>
            </div>
          </div>

          {/* CTA */}
          <Link href="/explore">
            <div className="ink-card p-4 bg-gradient-to-br from-dream/5 to-coral/5 border-dream/20 hover:border-dream/40 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-dream">학과/직업 탐색</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">꿈에 맞는 학과를 찾아보세요</p>
                </div>
                <ChevronRight size={15} className="text-dream" />
              </div>
            </div>
          </Link>
        </aside>
      </div>

      {/* ═══ Kompass 생성 Dialog ═══ */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => { setIsCreateModalOpen(open); if (!open) setImportedData(null); }}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle className="editorial-heading text-xl text-dream">새 꿈 목표 만들기</DialogTitle>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-dream/10 text-dream px-2 py-0.5 rounded-full">
                <Sparkles size={10} /> AI 생성
              </span>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              AI가 연간 → 반기 → 월별 → 주별 → 일별 목표를 자동으로 생성합니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dream-goal-title" className="text-sm font-semibold">목표 제목</Label>
              <Input
                id="dream-goal-title"
                placeholder="예: 서울대 의대 합격"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-11 rounded-xl border-dream/20 focus-visible:ring-dream"
                data-testid="input-dream-kompass-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dream-goal-year" className="text-sm font-semibold">달성 목표 연도</Label>
              <Input
                id="dream-goal-year"
                type="number"
                placeholder="예: 2027"
                value={newTargetYear}
                onChange={(e) => setNewTargetYear(e.target.value)}
                className="h-11 rounded-xl border-dream/20 focus-visible:ring-dream"
                data-testid="input-dream-target-year"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dream-goal-desc" className="text-sm font-semibold">
                꿈의 이유 <span className="font-normal text-muted-foreground">(선택 — AI 개인화에 활용됩니다)</span>
              </Label>
              <Textarea
                id="dream-goal-desc"
                placeholder="이 꿈을 이루고 싶은 이유, 현재 상황, 강점 등을 자유롭게 적어주세요."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="min-h-[100px] rounded-xl border-dream/20 focus-visible:ring-dream resize-none text-sm"
                data-testid="input-dream-description"
              />
            </div>
            <div className="bg-dream/5 border border-dream/20 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <Sparkles size={14} className="text-dream shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-dream">AI가 자동으로 생성합니다: </span>
                  연간 목표 → 반기 목표 → 월별 세부 목표 → 주별 액션 → 일별 태스크 전체 계층을 한 번에 만들어줍니다.
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={handleSubmit}
              disabled={createKompassMutation.isPending || !selectedProfileId}
              className="w-full h-12 bg-dream text-white font-bold rounded-xl text-base hover:bg-dream/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              data-testid="button-submit-dream-kompass"
            >
              {createKompassMutation.isPending ? (
                <><Loader2 size={18} className="animate-spin" /> AI가 목표를 생성하고 있어요...</>
              ) : (
                <><Sparkles size={18} /> 꿈 목표 생성하기</>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
