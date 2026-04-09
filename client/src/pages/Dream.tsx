import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Sparkles,
  PenLine,
  ChevronDown,
  Target,
  Calendar,
  Flame,
  Plus,
  Loader2,
  Trash2,
  ChevronRight,
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
import { DreamGoalManager } from "@/components/DreamGoalManager";
import { cn } from "@/lib/utils";

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
  const target = new Date(targetYear, 10, 1);
  const today = new Date();
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}


export default function Dream() {
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
  // Track which kompass cards are expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
      // Auto-expand newly created kompass
      if (data.id) setExpandedIds((prev) => new Set([...prev, data.id]));
    },
    onError: () => toast.error("목표 생성 중 오류가 발생했습니다."),
  });

  const deleteKompassMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/kompass/${id}`); },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/kompass"] });
      const prev = queryClient.getQueryData(["/api/kompass"]);
      queryClient.setQueryData(["/api/kompass"], (old: any[]) => old?.filter((k) => k.id !== id) ?? []);
      return { prev };
    },
    onSuccess: () => toast.success("목표가 삭제되었습니다."),
    onError: (_err: any, _id: any, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(["/api/kompass"], ctx.prev);
      toast.error("삭제 중 오류가 발생했습니다.");
    },
    onSettled: () => {
      setDeletingKompassId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/kompass"] });
    },
  });

  useEffect(() => {
    if (profileList.length > 0 && !selectedProfileId) setSelectedProfileId(profileList[0].id);
  }, [profileList, selectedProfileId]);

  useEffect(() => {
    if (kompassList.length > 0 && kompassList[0].visionData?.title) {
      setDreamText(kompassList[0].visionData.title);
    }
  }, [kompassList]);

  // Auto-expand first kompass
  useEffect(() => {
    if (kompassList.length > 0 && expandedIds.size === 0) {
      setExpandedIds(new Set([kompassList[0].id]));
    }
  }, [kompassList]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

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
    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6">
      {/* Hero */}
      <section className="mb-8">
        <div className="relative overflow-hidden rounded-xl">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663433131621/A3XszkVKVy7WNitpyWDbEe/v3-dream-declare-mDj6CTYACFFc5iz7RCGboG.webp"
            alt="꿈 선언"
            className="w-full h-40 lg:h-52 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent" />
          <div className="absolute bottom-5 left-5 lg:bottom-6 lg:left-7">
            <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold">Dream Journey</span>
            <h1 className="editorial-heading text-2xl lg:text-3xl text-white mt-1">꿈의 선언</h1>
          </div>
        </div>
      </section>

      <div className="space-y-8">

        {/* ═══ 나의 꿈 선언 ═══ */}
        <motion.div className="dream-card p-5 lg:p-7" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-3">
            <Star size={15} className="text-dream" />
            <span className="text-[11px] uppercase tracking-[0.15em] text-dream font-semibold">나의 꿈 선언</span>
          </div>

          {isEditing ? (
            <div className="space-y-3">
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
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <blockquote className="editorial-heading text-xl lg:text-2xl leading-snug mb-3">
                  "{dreamText}"
                </blockquote>
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  {kompassList[0] && (
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> {kompassList[0].targetYear}년 목표
                    </span>
                  )}
                  {kompassList[0] && (
                    <span className="flex items-center gap-1 text-coral font-semibold">
                      <Flame size={11} /> D-{Math.max(0, calcDDay(kompassList[0].targetYear))}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground/50 hover:text-dream shrink-0"
                data-testid="button-edit-dream"
              >
                <PenLine size={14} />
              </button>
            </div>
          )}
        </motion.div>

        {/* ═══ 꿈의 목표 관리 ═══ */}
        <section>
          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="editorial-heading text-lg flex items-center gap-2">
                <Target size={16} className="text-dream" />
                꿈의 목표 관리
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                연간 → 월별 → 주별 목표를 한 곳에서 관리합니다
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
              {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : kompassList.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="dream-card p-8 text-center cursor-pointer group"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <div className="w-12 h-12 bg-dream/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Plus size={20} className="text-dream" />
              </div>
              <p className="editorial-heading text-base text-dream mb-1">첫 번째 꿈 목표를 선언하세요</p>
              <p className="text-xs text-muted-foreground">AI가 연간·월별·주별 목표를 자동으로 생성합니다</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {kompassList.map((kompass, i) => {
                const isExpanded = expandedIds.has(kompass.id);
                const dDay = calcDDay(kompass.targetYear);

                return (
                  <motion.div
                    key={kompass.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="ink-card overflow-hidden"
                    data-testid={`card-dream-kompass-${kompass.id}`}
                  >
                    {/* Kompass header — click to expand/collapse */}
                    <button
                      onClick={() => toggleExpanded(kompass.id)}
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-3.5 text-left transition-colors",
                        isExpanded ? "bg-dream/5 border-b border-dream/10" : "hover:bg-secondary/40"
                      )}
                      data-testid={`button-expand-kompass-${kompass.id}`}
                    >
                      {/* Expand icon */}
                      <span className={cn("transition-transform shrink-0 text-muted-foreground/60", isExpanded && "rotate-180")}>
                        <ChevronDown size={15} />
                      </span>

                      {/* Icon */}
                      <div className="w-8 h-8 bg-dream/10 rounded-lg flex items-center justify-center shrink-0">
                        <Target size={14} className="text-dream" />
                      </div>

                      {/* Title + meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-[10px] bg-dream/10 text-dream px-1.5 py-0.5 rounded-full font-semibold">
                            {kompass.targetYear}년
                          </span>
                          {dDay > 0 && (
                            <span className="text-[10px] text-coral font-semibold flex items-center gap-0.5">
                              <Flame size={9} /> D-{dDay}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold line-clamp-1">{kompass.visionData.title}</p>
                      </div>

                      {/* Progress — donut */}
                      <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                        <svg width="36" height="36" className="-rotate-90">
                          <circle cx="18" cy="18" r="14" strokeWidth="3.5" fill="none" className="stroke-secondary" />
                          <circle
                            cx="18" cy="18" r="14" strokeWidth="3.5" fill="none"
                            stroke={kompass.progress >= 80 ? "#10b981" : kompass.progress >= 50 ? "#320e9d" : kompass.progress >= 20 ? "#f59e0b" : "#e2e8f0"}
                            strokeDasharray={2 * Math.PI * 14}
                            strokeDashoffset={2 * Math.PI * 14 * (1 - kompass.progress / 100)}
                            strokeLinecap="round"
                            style={{ transition: "stroke-dashoffset 0.6s ease" }}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-dream rotate-90">
                          {kompass.progress}%
                        </span>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (deletingKompassId) return;
                          if (window.confirm(`"${kompass.visionData.title}" 목표를 삭제하시겠습니까?`)) {
                            setDeletingKompassId(kompass.id);
                            deleteKompassMutation.mutate(kompass.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                        data-testid={`button-delete-dream-kompass-${kompass.id}`}
                      >
                        {deletingKompassId === kompass.id
                          ? <Loader2 size={13} className="animate-spin" />
                          : <Trash2 size={13} />}
                      </button>
                    </button>

                    {/* Inline goal manager (Year → Month → Week accordion) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4">
                            {/* 3-layer goal accordion */}
                            <DreamGoalManager
                              kompassId={kompass.id}
                              visionTitle={kompass.visionData.title}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══ Bottom CTA row ═══ */}
        {kompassList.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Link href="/explore">
              <div className="ink-card p-3.5 hover:border-dream/30 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-dream">학과 탐색</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">꿈에 맞는 학과</p>
                  </div>
                  <ChevronRight size={13} className="text-dream/50" />
                </div>
              </div>
            </Link>
            <Link href="/aptitude">
              <div className="ink-card p-3.5 hover:border-dream/30 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-dream">흥미 분석</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">나의 진로 유형</p>
                  </div>
                  <ChevronRight size={13} className="text-dream/50" />
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* ═══ 생성 Dialog ═══ */}
      <Dialog open={isCreateModalOpen} onOpenChange={(o) => { setIsCreateModalOpen(o); if (!o) setImportedData(null); }}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle className="editorial-heading text-xl text-dream">새 꿈 목표 만들기</DialogTitle>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-dream/10 text-dream px-2 py-0.5 rounded-full">
                <Sparkles size={10} /> AI 생성
              </span>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              AI가 연간 → 월별 → 주별 목표를 자동으로 생성합니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dk-title" className="text-sm font-semibold">목표 제목</Label>
              <Input
                id="dk-title"
                placeholder="예: 서울대 의대 합격"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-11 rounded-xl border-dream/20 focus-visible:ring-dream"
                data-testid="input-dream-kompass-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dk-year" className="text-sm font-semibold">달성 목표 연도</Label>
              <Input
                id="dk-year"
                type="number"
                placeholder="예: 2027"
                value={newTargetYear}
                onChange={(e) => setNewTargetYear(e.target.value)}
                className="h-11 rounded-xl border-dream/20 focus-visible:ring-dream"
                data-testid="input-dream-target-year"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dk-desc" className="text-sm font-semibold">
                꿈의 이유 <span className="font-normal text-muted-foreground">(선택)</span>
              </Label>
              <Textarea
                id="dk-desc"
                placeholder="이 꿈을 이루고 싶은 이유, 현재 상황 등을 자유롭게 적어주세요."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="min-h-[90px] rounded-xl border-dream/20 focus-visible:ring-dream resize-none text-sm"
                data-testid="input-dream-description"
              />
            </div>
            <div className="bg-dream/5 border border-dream/20 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <Sparkles size={13} className="text-dream shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-dream">AI가 자동으로 생성합니다: </span>
                  연간 → 월별 → 주별 목표 전체 계층을 한 번에 만들어줍니다.
                </p>
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
              {createKompassMutation.isPending
                ? <><Loader2 size={18} className="animate-spin" /> AI가 목표를 생성하고 있어요...</>
                : <><Sparkles size={18} /> 꿈 목표 생성하기</>}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
