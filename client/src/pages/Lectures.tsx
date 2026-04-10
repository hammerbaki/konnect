/*
 * Lectures — 인강 리뷰 커뮤니티 (실제 DB 연동)
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Monitor, Star, Filter, TrendingUp, Users, ArrowRight, Sparkles, PenLine, MessageSquare, Loader2,
} from "lucide-react";
import { ReviewModal } from "@/components/community/ReviewModal";
import { ReviewCard } from "@/components/community/ReviewCard";
import { CommunityTabNav } from "@/components/community/CommunityTabNav";
import { getAuthHeaders } from "@/lib/queryClient";
import type { CommunityReview } from "@shared/schema";

const subjects = ["전체", "국어", "수학", "영어", "한국사", "사탐", "과탐"];
const platforms = ["전체", "메가스터디", "대성마이맥", "이투스", "EBSi"];
const sortOptions = [
  { key: "recent" as const, label: "최신순", icon: MessageSquare },
  { key: "likes" as const, label: "인기순", icon: TrendingUp },
  { key: "rating" as const, label: "평점순", icon: Star },
];

const topRanking = [
  { rank: 1, title: "전한길 한국사 올인원", instructor: "전한길", rating: 4.9, change: "—" },
  { rank: 2, title: "현우진 뉴런 수학1", instructor: "현우진", rating: 4.9, change: "↑1" },
  { rank: 3, title: "박광일 국어 올인원", instructor: "박광일", rating: 4.8, change: "↓1" },
  { rank: 4, title: "양승진 시발점 수학2", instructor: "양승진", rating: 4.8, change: "NEW" },
  { rank: 5, title: "정승제 국어 나비효과", instructor: "정승제", rating: 4.7, change: "—" },
];

export default function Lectures() {
  const [activeSubject, setActiveSubject] = useState("전체");
  const [sortBy, setSortBy] = useState<"recent" | "likes" | "rating">("recent");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [page, setPage] = useState(1);

  const queryKey = ["community-reviews", "lecture", activeSubject, sortBy, page];

  const { data, isLoading } = useQuery<{ reviews: CommunityReview[]; total: number; likedIds: number[] }>({
    queryKey,
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({
        type: "lecture",
        sort: sortBy,
        page: String(page),
        limit: "15",
        ...(activeSubject !== "전체" ? { subject: activeSubject } : {}),
      });
      const res = await fetch(`/api/community/reviews?${params}`, { headers, credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
  });

  const reviews = data?.reviews ?? [];
  const likedIds = data?.likedIds ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 15);

  // Stats
  const subjectCounts: Record<string, number> = {};
  reviews.forEach(r => { subjectCounts[r.subject] = (subjectCounts[r.subject] ?? 0) + 1; });
  const topSubjects = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCount = Math.max(...topSubjects.map(([, c]) => c), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Monitor size={20} className="text-indigo" />
        <h1 className="editorial-heading text-2xl">인강 리뷰</h1>
        <span className="ink-tag-filled bg-indigo/10 text-indigo text-[10px]">전국구</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        실수강생의 솔직한 후기와 강의 비교로 나에게 맞는 인강을 찾으세요.
      </p>

      {/* Mobile tab nav */}
      <CommunityTabNav />

      {/* Banner — desktop only */}
      <div className="hidden md:flex dream-card p-4 mb-4 items-center gap-3">
        <Sparkles size={18} className="text-dream shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">직접 들어본 인강, 후기를 남겨보세요</p>
          <p className="text-[10px] text-muted-foreground">솔직한 경험이 다른 학생에게 큰 도움이 됩니다</p>
        </div>
        <button onClick={() => setReviewOpen(true)}
          className="flex items-center gap-1 bg-dream text-white text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-dream/90 transition-colors">
          <PenLine size={12} /> 후기 쓰기
        </button>
      </div>

      {/* Mobile: write button row */}
      <div className="md:hidden flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">인강 리뷰 커뮤니티</span>
        <button onClick={() => setReviewOpen(true)}
          className="flex items-center gap-1 bg-dream text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-dream/90 transition-colors">
          <PenLine size={12} /> 후기 쓰기
        </button>
      </div>
      <hr className="editorial-divider-thick mt-0" />

      {/* Filters */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter size={14} className="text-muted-foreground shrink-0" />
          {subjects.map((s) => (
            <button key={s} onClick={() => { setActiveSubject(s); setPage(1); }}
              className={`shrink-0 px-3 py-1 text-xs transition-all ${activeSubject === s ? "bg-foreground text-background font-semibold" : "text-muted-foreground hover:text-foreground border border-border"}`}
            >{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {sortOptions.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setSortBy(key); setPage(1); }}
              className={`flex items-center gap-1 text-xs ${sortBy === key ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* 2-col layout */}
      <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-8">
        {/* Main: Reviews */}
        <div>
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Monitor size={36} className="text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">아직 후기가 없습니다.</p>
              <button onClick={() => setReviewOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-dream">
                <PenLine size={13} /> 첫 후기를 남겨보세요 →
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare size={15} />
                  <span className="editorial-heading text-base">수강 후기</span>
                  <span className="text-xs text-muted-foreground">총 {total}개</span>
                </div>
                <button onClick={() => setReviewOpen(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-dream border border-dream/30 px-2.5 py-1 rounded-full hover:bg-dream/5 transition-colors">
                  <PenLine size={11} /> 후기 쓰기
                </button>
              </div>
              <hr className="editorial-divider-thick mt-0 mb-0" />
              <div className="divide-y divide-border">
                {reviews.map((review, i) => (
                  <motion.div key={review.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.03 * i }}>
                    <ReviewCard review={review} isLiked={likedIds.includes(review.id)} queryKey={queryKey} />
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-6">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 text-xs border border-border rounded-lg disabled:opacity-40 hover:bg-secondary transition-colors">이전</button>
                  <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 text-xs border border-border rounded-lg disabled:opacity-40 hover:bg-secondary transition-colors">다음</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Sidebar (Desktop) */}
        <aside className="hidden lg:block space-y-5 mt-2">
          {/* CTA */}
          <div className="ink-card p-4 bg-indigo/5 border-indigo/20">
            <div className="flex items-center gap-2 mb-2">
              <PenLine size={14} className="text-indigo" />
              <span className="text-xs font-semibold tracking-wider uppercase">후기 기여</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">직접 들어본 인강이 있다면 솔직한 후기를 공유해주세요.</p>
            <button onClick={() => setReviewOpen(true)}
              className="text-xs font-semibold text-indigo flex items-center gap-0.5 hover:gap-1.5 transition-all">
              후기 남기기 <ArrowRight size={12} />
            </button>
          </div>

          {/* Weekly Ranking */}
          <div className="ink-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-indigo" />
              <span className="text-xs font-semibold tracking-wider uppercase">주간 인강 랭킹</span>
            </div>
            <div className="space-y-2.5">
              {topRanking.map((item) => (
                <div key={item.rank} className="flex items-start gap-2.5 py-1">
                  <span className="text-lg font-mono font-bold text-muted-foreground/40 w-5 text-right shrink-0">{item.rank}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-snug">{item.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{item.instructor}</span>
                      <Star size={9} className="text-gold fill-gold" />
                      <span className="text-[10px] font-semibold">{item.rating}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono ${item.change === "NEW" ? "text-vermillion" : item.change.startsWith("↑") ? "text-green-600" : "text-muted-foreground"}`}>
                    {item.change}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Stats from real data */}
          {topSubjects.length > 0 && (
            <div className="ink-card p-4">
              <span className="text-xs font-semibold tracking-wider uppercase mb-3 block">과목별 리뷰 수</span>
              <div className="space-y-2">
                {topSubjects.map(([subj, cnt]) => (
                  <div key={subj}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span>{subj}</span>
                      <span className="text-muted-foreground">{cnt}</span>
                    </div>
                    <div className="h-1 bg-secondary">
                      <div className="h-full bg-indigo/60" style={{ width: `${Math.round((cnt / maxCount) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <ReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} type="lecture"
        defaultSubject={activeSubject} />
    </div>
  );
}
