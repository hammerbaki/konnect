import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useBookmarks } from "@/hooks/useBookmarks";
import { apiRequest, getAuthHeaders } from "@/lib/queryClient";
import {
  Star, ArrowRight, GraduationCap, Briefcase, Building2,
  Brain, Target, ChevronRight, ChevronDown, BookOpen, School, Tv, MessageSquare,
} from "lucide-react";
import { VisionGoal, WeeklyGoal } from "@/lib/mockData";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { usePageTitle } from "@/hooks/usePageTitle";

/* ─── Labels ───────────────────────────────────────────────────── */
const INTEREST_LABELS: Record<string, string> = {
  SCI: "과학·탐구", ENG: "공학·기술", MED: "의료·보건", BIZ: "경영·경제",
  LAW: "법률·행정", EDU: "교육·상담", ART: "예술·디자인", IT: "IT·정보통신", SOC: "사회·문화",
};
const APTITUDE_LABELS: Record<string, string> = {
  VERBAL: "언어능력", MATH: "수리·논리력", SPATIAL: "공간·시각능력",
  CREATIVE: "창의력", SOCIAL: "대인관계능력", SELF: "자기관리능력",
};

/* ─── Types ─────────────────────────────────────────────────────── */
interface AptitudeResult {
  id: number;
  interestScores: Record<string, number>;
  aptitudeScores: Record<string, number>;
  recommendedJobs: Array<{ name: string }>;
  recommendedMajors: Array<{ name: string }>;
  summary: string | null;
  createdAt: string;
}

interface KompassData {
  id: string;
  title?: string;
  targetYear: number;
  startMonth?: number;
  visionData: VisionGoal;
  progress: number;
  profileTitle?: string;
}

interface CommunityReview {
  id: number;
  type: string;
  targetName: string;
  overallRating: number;
  content: string;
  subject?: string;
  instructor?: string;
  createdAt?: string;
}

/* ─── Helpers ───────────────────────────────────────────────────── */
function findCurrentWeek(vision: VisionGoal): { week: WeeklyGoal; monthTitle: string } | null {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const monthPadded = String(currentMonth).padStart(2, "0");

  const yearNode = vision.children.find(
    (y) => y.dateDisplay === String(currentYear) || y.id.includes(String(currentYear))
  );
  if (!yearNode) return null;

  let monthNode = null;
  for (const h of yearNode.children) {
    const m = h.children.find(
      (m) => m.dateDisplay === monthPadded || m.dateDisplay === String(currentMonth)
    );
    if (m) { monthNode = m; break; }
  }
  if (!monthNode) return null;

  // Current day of month
  const dayOfMonth = today.getDate();
  // Find the week whose date range contains today
  // WeeklyGoal.dateDisplay is like "04.01" (month.day start of week)
  let bestWeek: WeeklyGoal | null = null;
  for (let i = 0; i < monthNode.children.length; i++) {
    const w = monthNode.children[i];
    // Approximate: week 1 = days 1-7, week 2 = 8-14, etc.
    const weekStart = (i) * 7 + 1;
    const weekEnd = Math.min((i + 1) * 7, 31);
    if (dayOfMonth >= weekStart && dayOfMonth <= weekEnd) {
      bestWeek = w;
      break;
    }
  }
  // Fallback: last week of month
  if (!bestWeek && monthNode.children.length > 0) {
    bestWeek = monthNode.children[monthNode.children.length - 1];
  }
  if (!bestWeek) return null;
  return { week: bestWeek, monthTitle: monthNode.title };
}

/* ─── Star rating ───────────────────────────────────────────────── */
function MiniStars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={10} className={n <= value ? "fill-gold text-gold" : "text-gray-200 fill-gray-200"} />
      ))}
    </span>
  );
}

/* ─── Community review card ─────────────────────────────────────── */
function MiniReviewCard({ review }: { review: CommunityReview }) {
  const timeAgo = review.createdAt
    ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: ko })
    : "";
  return (
    <div className="flex-shrink-0 w-56 rounded-2xl border border-border bg-white p-4 space-y-2 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between">
        <MiniStars value={review.overallRating} />
        <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
      </div>
      <p className="text-xs font-semibold text-foreground truncate">{review.targetName}</p>
      {review.instructor && (
        <p className="text-[10px] text-muted-foreground truncate">강사: {review.instructor}</p>
      )}
      <p className="text-[11px] text-[#4E5968] leading-relaxed line-clamp-3">{review.content}</p>
    </div>
  );
}

/* ─── Community reviews section ─────────────────────────────────── */
const COMMUNITY_TABS = [
  { type: "lecture", label: "인강 리뷰", icon: Tv, href: "/community?tab=lecture" },
  { type: "workbook", label: "문제집 리뷰", icon: BookOpen, href: "/community?tab=workbook" },
  { type: "academy", label: "학원 리뷰", icon: School, href: "/community?tab=academy" },
] as const;

function CommunityReviewsSection() {
  return (
    <div className="space-y-5">
      {COMMUNITY_TABS.map(({ type, label, icon: Icon, href }) => (
        <CommunityTab key={type} type={type} label={label} Icon={Icon} href={href} />
      ))}
    </div>
  );
}

function CommunityTab({
  type, label, Icon, href,
}: { type: string; label: string; Icon: any; href: string }) {
  const { data, isLoading } = useQuery<{ reviews: CommunityReview[] }>({
    queryKey: ["/api/community/reviews", type],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/community/reviews?type=${type}&sort=recent&limit=5`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    staleTime: 1000 * 60 * 2,
    refetchOnMount: true,
  });

  const reviews = data?.reviews ?? [];

  return (
    <section data-testid={`section-community-${type}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#191F28] flex items-center gap-1.5">
          <Icon size={15} className="text-dream" />
          {label}
        </h3>
        <Link href={href}>
          <span className="text-[11px] text-dream font-semibold flex items-center gap-0.5 cursor-pointer">
            더보기 <ChevronRight size={12} />
          </span>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="flex-shrink-0 w-56 h-28 rounded-2xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-[#FAFAFA] py-6 text-center">
          <p className="text-xs text-muted-foreground">아직 리뷰가 없습니다.</p>
          <Link href={href}>
            <span className="text-xs text-dream font-semibold mt-1 inline-block cursor-pointer">
              첫 번째 리뷰를 남겨보세요 →
            </span>
          </Link>
        </div>
      ) : (
        <div
          className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {reviews.map((r) => (
            <div key={r.id} className="snap-start">
              <MiniReviewCard review={r} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Weekly Goal Progress ──────────────────────────────────────── */
interface WeekEntry {
  week: WeeklyGoal;
  goalTitle: string;
  kompassId: string;
}

function SingleWeekRow({ entry }: { entry: WeekEntry }) {
  const [, navigate] = useLocation();
  const progress = entry.week.progress ?? 0;
  // Build a readable week subtitle: prefer description, fallback to title ("Week 1" → "1주차")
  const weekSubtitle = entry.week.description?.split("\n")[0]?.replace(/^•\s*/, "").trim()
    || entry.week.title?.replace(/week\s*/i, "").replace(/^(\d+)$/, "$1주차");

  const handleClick = () => {
    navigate(`/dream?kompassId=${encodeURIComponent(entry.kompassId)}&weekId=${encodeURIComponent(entry.week.id)}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left space-y-1 rounded-xl px-3 py-2.5 -mx-3 transition-colors hover:bg-dream/5 active:bg-dream/10"
      data-testid={`btn-weekly-goal-${entry.kompassId}`}
    >
      {/* Main goal title */}
      <p className="text-sm font-bold text-[#191F28] leading-snug">{entry.goalTitle}</p>
      {/* Week subtitle */}
      {weekSubtitle && (
        <p className="text-[11px] text-muted-foreground truncate">{weekSubtitle}</p>
      )}
      {/* Progress bar */}
      <div className="flex items-center gap-2.5 pt-0.5">
        <Progress
          value={progress}
          className="flex-1 h-2 bg-dream/10"
          indicatorClassName="bg-dream"
        />
        <span className="text-xs font-bold text-dream min-w-[30px] text-right">{progress}%</span>
      </div>
    </button>
  );
}

function WeeklyGoalBar({ kompassList }: { kompassList: KompassData[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!kompassList.length) return null;

  // Collect current-week entry for every kompass goal
  const entries: WeekEntry[] = [];
  for (const k of kompassList) {
    if (!k.visionData) continue;
    const result = findCurrentWeek(k.visionData);
    if (result) {
      entries.push({
        week: result.week,
        goalTitle: k.visionData.title,
        kompassId: k.id,
      });
    }
  }

  if (entries.length === 0) return null;

  const first = entries[0];
  const rest = entries.slice(1);
  const hasMore = rest.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-dream/20 bg-gradient-to-br from-dream/5 to-transparent overflow-hidden"
      data-testid="card-weekly-goal"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-dream" />
          <span className="text-xs font-bold text-[#191F28]">이번 주 목표</span>
          {first.week.dateDisplay && (
            <span className="text-[10px] text-muted-foreground bg-dream/10 px-1.5 py-0.5 rounded-full">
              {first.week.dateDisplay}
            </span>
          )}
        </div>
        <Link href="/dream">
          <span className="text-[11px] text-dream font-semibold flex items-center gap-0.5 cursor-pointer">
            꿈 보기 <ChevronRight size={11} />
          </span>
        </Link>
      </div>

      {/* First goal — always visible */}
      <div className="px-4 pb-3">
        <SingleWeekRow entry={first} />
      </div>

      {/* Expanded: rest of goals */}
      <AnimatePresence initial={false}>
        {expanded && hasMore && (
          <motion.div
            key="expanded-goals"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-4 border-t border-dream/10 pt-3">
              {rest.map((entry) => (
                <SingleWeekRow key={entry.kompassId} entry={entry} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expand / collapse toggle */}
      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 border-t border-dream/10 text-[11px] text-dream font-semibold hover:bg-dream/5 transition-colors"
          data-testid="btn-weekly-goal-toggle"
        >
          {expanded ? (
            <>
              <motion.span
                key="up"
                animate={{ rotate: 180 }}
                transition={{ duration: 0.22 }}
                style={{ display: "inline-flex" }}
              >
                <ChevronDown size={13} />
              </motion.span>
              접기
            </>
          ) : (
            <>
              <motion.span
                key="down"
                animate={{ rotate: 0 }}
                transition={{ duration: 0.22 }}
                style={{ display: "inline-flex" }}
              >
                <ChevronDown size={13} />
              </motion.span>
              {rest.length}개 목표 더 보기
            </>
          )}
        </button>
      )}
    </motion.div>
  );
}

/* ─── Hero Banner ───────────────────────────────────────────────── */
function HeroBanner() {
  return (
    <section>
      <div className="relative overflow-hidden rounded-xl">
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663433131621/A3XszkVKVy7WNitpyWDbEe/v3-hero-dream-kSVtSQjiGKaTguFYwP6Y5v.webp"
          alt="꿈을 잇다"
          className="w-full h-44 sm:h-56 lg:h-72 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent" />
        <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 right-6 sm:right-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <span className="text-[10px] uppercase tracking-[0.25em] text-gold font-semibold">
              Konnect
            </span>
            <h1 className="editorial-heading text-2xl sm:text-[2.25rem] text-white mt-2 leading-tight">
              KONNECT, 나와 꿈을 연결한다
            </h1>
            <p className="text-white/65 text-xs sm:text-sm mt-3 max-w-md leading-relaxed">
              어떤 인강을 들을지 묻기 전에, 왜 공부하는지를 먼저 묻는다.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <Link href="/explore">
                <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-dream text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-dream/90 transition-colors shadow-sm">
                  <Star size={14} />
                  학과·직업 탐색
                </span>
              </Link>
              <Link href="/aptitude">
                <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 text-white text-xs sm:text-sm font-medium rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/25 transition-colors">
                  진로 흥미 분석
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Main Dashboard ────────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();
  usePageTitle("홈 대시보드 — Konnect", "오늘의 목표·추천 학과·직업을 한눈에 확인하세요.");
  const [, navigate] = useLocation();
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [showAllMajors, setShowAllMajors] = useState(false);
  const REC_INITIAL = 3;

  /* Aptitude */
  const { data: latestAptitude } = useQuery<AptitudeResult | null>({
    queryKey: ["/api/aptitude/latest"],
    staleTime: 1000 * 60 * 5,
    enabled: !!user,
  });

  /* Bookmarks */
  const { bookmarkList, removeBookmark: removeBm } = useBookmarks({ enabled: !!user });

  const handleRemoveBm = (id: number, name: string) => {
    if (window.confirm(`"${name}"을(를) 관심 목록에서 제거하시겠습니까?`)) {
      removeBm.mutate(id);
    }
  };

  /* Kompass goals */
  const { data: kompassList = [] } = useQuery<KompassData[]>({
    queryKey: ["/api/kompass"],
    staleTime: 1000 * 60 * 5,
    enabled: !!user,
  });

  return (
    <div className="space-y-6 pb-8">

      {/* ── Hero Banner ── */}
      <HeroBanner />

      {/* ── Weekly Goal Progress (only if goals exist) ── */}
      {kompassList.length > 0 && (
        <WeeklyGoalBar kompassList={kompassList} />
      )}

      {/* ── 관심 목록 ── */}
      <section data-testid="card-bookmarks">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#191F28] flex items-center gap-1.5">
            <Star size={15} className="text-gold fill-gold" /> 관심 목록
          </h3>
          <button
            onClick={() => navigate("/explore?from=dashboard")}
            className="text-[11px] text-dream font-semibold flex items-center gap-0.5"
            data-testid="link-explore-from-bookmarks"
          >
            탐색하기 <ChevronRight size={12} />
          </button>
        </div>

        {bookmarkList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-[#FAFAFA] py-8 flex flex-col items-center gap-3 text-center">
            <Star size={28} className="text-gray-200" />
            <p className="text-sm text-muted-foreground">
              탐색 페이지에서 ☆ 버튼을 눌러<br />관심 항목을 저장하세요.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="border-dream text-dream text-xs rounded-xl font-semibold"
              onClick={() => navigate("/explore?from=dashboard")}
              data-testid="btn-go-explore"
            >
              학과/직업 탐색 바로가기 <ArrowRight size={12} className="ml-1" />
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-white p-4 space-y-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            {/* 관심 학교 */}
            {bookmarkList.filter((b) => b.bookmarkType === "university").length > 0 && (
              <div data-testid="bm-section-university">
                <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-2">
                  <Building2 size={10} /> 관심 학교
                </p>
                <div className="flex flex-wrap gap-2">
                  {bookmarkList.filter((b) => b.bookmarkType === "university").map((bm) => (
                    <span
                      key={bm.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 cursor-pointer transition-colors"
                      onClick={() => navigate(`/explore?tab=universities&q=${encodeURIComponent(bm.targetName)}&from=dashboard`)}
                      data-testid={`bm-item-${bm.id}`}
                    >
                      {bm.targetName}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveBm(bm.id, bm.targetName); }}
                        className="w-4 h-4 rounded-full text-gray-400 hover:bg-red-500 hover:text-white transition-all text-xs leading-none flex items-center justify-center"
                        data-testid={`btn-bm-remove-${bm.id}`}
                      >×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 관심 학과 */}
            {bookmarkList.filter((b) => b.bookmarkType === "major").length > 0 && (
              <div data-testid="bm-section-major">
                <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-2">
                  <GraduationCap size={10} /> 관심 학과
                </p>
                <div className="flex flex-wrap gap-2">
                  {bookmarkList.filter((b) => b.bookmarkType === "major").map((bm) => (
                    <span
                      key={bm.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 cursor-pointer transition-colors"
                      onClick={() => navigate(`/explore?tab=majors&q=${encodeURIComponent(bm.targetName)}&from=dashboard`)}
                      data-testid={`bm-item-${bm.id}`}
                    >
                      {bm.targetName}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveBm(bm.id, bm.targetName); }}
                        className="w-4 h-4 rounded-full text-gray-400 hover:bg-red-500 hover:text-white transition-all text-xs leading-none flex items-center justify-center"
                        data-testid={`btn-bm-remove-${bm.id}`}
                      >×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 관심 직업 */}
            {bookmarkList.filter((b) => b.bookmarkType === "job").length > 0 && (
              <div data-testid="bm-section-job">
                <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-2">
                  <Briefcase size={10} /> 관심 직업
                </p>
                <div className="flex flex-wrap gap-2">
                  {bookmarkList.filter((b) => b.bookmarkType === "job").map((bm) => (
                    <span
                      key={bm.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 cursor-pointer transition-colors"
                      onClick={() => navigate(`/explore?tab=jobs&q=${encodeURIComponent(bm.targetName)}&from=dashboard`)}
                      data-testid={`bm-item-${bm.id}`}
                    >
                      {bm.targetName}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveBm(bm.id, bm.targetName); }}
                        className="w-4 h-4 rounded-full text-gray-400 hover:bg-red-500 hover:text-white transition-all text-xs leading-none flex items-center justify-center"
                        data-testid={`btn-bm-remove-${bm.id}`}
                      >×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => navigate("/explore?from=dashboard")}
              className="text-[11px] text-dream font-semibold flex items-center gap-0.5"
            >
              학과/직업 탐색 바로가기 <ArrowRight size={11} className="ml-0.5" />
            </button>
          </div>
        )}
      </section>

      {/* ── 나의 흥미 분석 결과 ── */}
      <section data-testid="card-aptitude-summary">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#191F28] flex items-center gap-1.5">
            <Brain size={15} className="text-dream" /> 나의 흥미 분석 결과
          </h3>
          <button
            onClick={() => navigate("/aptitude")}
            className="text-[11px] text-dream font-semibold flex items-center gap-0.5"
          >
            {latestAptitude ? "다시 분석" : "분석 시작"} <ChevronRight size={12} />
          </button>
        </div>

        {latestAptitude ? (
          <div className="rounded-2xl border border-border bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-3">
            {/* 상위 흥미 */}
            {latestAptitude.interestScores && Object.keys(latestAptitude.interestScores).length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold mb-1.5">상위 흥미</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(latestAptitude.interestScores)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([k, v]) => (
                      <span key={k} className="text-[11px] px-2.5 py-1 rounded-full bg-dream/10 text-dream font-semibold border border-dream/20">
                        {INTEREST_LABELS[k] || k} <span className="text-dream/70">{Math.round(v)}점</span>
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* 상위 역량 */}
            {latestAptitude.aptitudeScores && Object.keys(latestAptitude.aptitudeScores).length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold mb-1.5">상위 역량</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(latestAptitude.aptitudeScores)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 2)
                    .map(([k]) => (
                      <span key={k} className="text-[11px] px-2.5 py-1 rounded-full bg-coral/10 text-coral font-semibold border border-coral/10">
                        {APTITUDE_LABELS[k] || k}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* 추천 직업 */}
            {latestAptitude.recommendedJobs?.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold mb-1.5">추천 직업</p>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {(showAllJobs
                    ? latestAptitude.recommendedJobs
                    : latestAptitude.recommendedJobs.slice(0, REC_INITIAL)
                  ).map((j, i) => (
                    <button
                      key={i}
                      onClick={() => navigate(`/explore?tab=jobs&q=${encodeURIComponent(j.name)}&from=dashboard`)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-coral/10 text-coral font-semibold hover:bg-coral/20 transition-colors"
                      data-testid={`btn-rec-job-${i}`}
                    >
                      {j.name}
                    </button>
                  ))}
                  {!showAllJobs && latestAptitude.recommendedJobs.length > REC_INITIAL && (
                    <button onClick={() => setShowAllJobs(true)} className="text-[10px] text-muted-foreground underline">
                      외 {latestAptitude.recommendedJobs.length - REC_INITIAL}개
                    </button>
                  )}
                  {showAllJobs && latestAptitude.recommendedJobs.length > REC_INITIAL && (
                    <button onClick={() => setShowAllJobs(false)} className="text-[10px] text-muted-foreground underline">접기</button>
                  )}
                </div>
              </div>
            )}

            {/* 추천 학과 */}
            {latestAptitude.recommendedMajors?.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold mb-1.5">추천 학과</p>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {(showAllMajors
                    ? latestAptitude.recommendedMajors
                    : latestAptitude.recommendedMajors.slice(0, REC_INITIAL)
                  ).map((m, i) => (
                    <button
                      key={i}
                      onClick={() => navigate(`/explore?tab=majors&q=${encodeURIComponent(m.name)}&from=dashboard`)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-dream/10 text-dream font-semibold hover:bg-dream/10 transition-colors"
                      data-testid={`btn-rec-major-${i}`}
                    >
                      {m.name}
                    </button>
                  ))}
                  {!showAllMajors && latestAptitude.recommendedMajors.length > REC_INITIAL && (
                    <button onClick={() => setShowAllMajors(true)} className="text-[10px] text-muted-foreground underline">
                      외 {latestAptitude.recommendedMajors.length - REC_INITIAL}개
                    </button>
                  )}
                  {showAllMajors && latestAptitude.recommendedMajors.length > REC_INITIAL && (
                    <button onClick={() => setShowAllMajors(false)} className="text-[10px] text-muted-foreground underline">접기</button>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => navigate("/aptitude")}
              className="text-[11px] text-dream font-semibold flex items-center gap-0.5 pt-1"
              data-testid="btn-view-aptitude-result"
            >
              상세 결과 보기 <ArrowRight size={11} className="ml-0.5" />
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-[#FAFAFA] py-8 flex flex-col items-center gap-3 text-center">
            <Brain size={28} className="text-gray-200" />
            <div>
              <p className="text-sm text-muted-foreground">아직 흥미 분석을 하지 않았습니다.</p>
              <p className="text-xs text-muted-foreground mt-1">30문항 · 약 5분이면 나에게 맞는<br />학과와 직업을 찾을 수 있습니다.</p>
            </div>
            <Button
              className="bg-dream text-white font-bold rounded-xl text-xs px-5 h-9"
              onClick={() => navigate("/aptitude")}
              data-testid="btn-start-aptitude"
            >
              분석 시작 <ArrowRight size={13} className="ml-1" />
            </Button>
          </div>
        )}
      </section>

      {/* ── 커뮤니티 리뷰 ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#191F28] flex items-center gap-1.5">
            <MessageSquare size={15} className="text-dream" /> 커뮤니티 최신 리뷰
          </h3>
          <Link href="/community">
            <span className="text-[11px] text-dream font-semibold flex items-center gap-0.5 cursor-pointer">
              전체보기 <ChevronRight size={12} />
            </span>
          </Link>
        </div>
        <CommunityReviewsSection />
      </section>

    </div>
  );
}
