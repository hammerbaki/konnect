/*
 * Workbooks — 문제집 리뷰 커뮤니티 (실제 DB 연동)
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BookOpen, Star, Filter, TrendingUp, MessageSquare, Loader2, PenLine, ArrowRight,
} from "lucide-react";
import { ReviewModal } from "@/components/community/ReviewModal";
import { ReviewCard } from "@/components/community/ReviewCard";
import { getAuthHeaders } from "@/lib/queryClient";
import type { CommunityReview } from "@shared/schema";

const subjects = ["전체", "국어", "수학", "영어", "한국사", "사탐", "과탐", "EBS"];
const sortOptions = [
  { key: "recent" as const, label: "최신순", icon: MessageSquare },
  { key: "likes" as const, label: "인기순", icon: TrendingUp },
  { key: "rating" as const, label: "평점순", icon: Star },
];
const topRanking = [
  { rank: 1, title: "수학의 정석", author: "홍성대", rating: 4.9, change: "—" },
  { rank: 2, title: "쎈 수학1", author: "홍범준", rating: 4.8, change: "↑1" },
  { rank: 3, title: "매3비 비문학", author: "안인숙", rating: 4.8, change: "—" },
  { rank: 4, title: "마더텅 영어 기출", author: "마더텅", rating: 4.8, change: "NEW" },
  { rank: 5, title: "EBS 수능특강 국어", author: "EBS", rating: 4.5, change: "↓2" },
];
const difficultyGuide = [
  { level: "기초", desc: "4~5등급, 개념 정리", color: "bg-green-500" },
  { level: "기본", desc: "3~4등급, 유형 익히기", color: "bg-blue-500" },
  { level: "발전", desc: "2~3등급, 심화 유형", color: "bg-yellow-500" },
  { level: "심화", desc: "1~2등급, 킬러 대비", color: "bg-vermillion" },
];

export default function Workbooks() {
  const [activeSubject, setActiveSubject] = useState("전체");
  const [sortBy, setSortBy] = useState<"recent" | "likes" | "rating">("recent");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [page, setPage] = useState(1);

  const queryKey = ["community-reviews", "workbook", activeSubject, sortBy, page];

  const { data, isLoading } = useQuery<{ reviews: CommunityReview[]; total: number; likedIds: number[] }>({
    queryKey,
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({
        type: "workbook",
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

  const subjectCounts: Record<string, number> = {};
  reviews.forEach(r => { subjectCounts[r.subject] = (subjectCounts[r.subject] ?? 0) + 1; });
  const topSubjects = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCount = Math.max(...topSubjects.map(([, c]) => c), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <BookOpen size={20} className="text-vermillion" />
        <h1 className="editorial-heading text-2xl">문제집 리뷰</h1>
        <span className="ink-tag-filled bg-vermillion/10 text-vermillion text-[10px]">전국구</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        실사용자 후기와 난이도별 비교로 나에게 맞는 문제집을 찾으세요.
      </p>

      {/* Banner */}
      <div className="dream-card p-4 mb-4 flex items-center gap-3">
        <BookOpen size={18} className="text-dream shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">풀어본 문제집 후기를 공유해보세요</p>
          <p className="text-[10px] text-muted-foreground">솔직한 경험이 다른 학생에게 큰 도움이 됩니다</p>
        </div>
        <button onClick={() => setReviewOpen(true)}
          className="flex items-center gap-1 bg-dream text-white text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-dream/90 transition-colors">
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
        {/* Reviews */}
        <div>
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <BookOpen size={36} className="text-muted-foreground mx-auto" />
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
                  <span className="editorial-heading text-base">문제집 후기</span>
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

        {/* Right Sidebar */}
        <aside className="hidden lg:block space-y-5 mt-2">
          <div className="ink-card p-4 bg-vermillion/5 border-vermillion/20">
            <div className="flex items-center gap-2 mb-2">
              <PenLine size={14} className="text-vermillion" />
              <span className="text-xs font-semibold tracking-wider uppercase">후기 기여</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">풀어본 문제집의 솔직한 후기를 공유해주세요.</p>
            <button onClick={() => setReviewOpen(true)}
              className="text-xs font-semibold text-vermillion flex items-center gap-0.5 hover:gap-1.5 transition-all">
              후기 남기기 <ArrowRight size={12} />
            </button>
          </div>

          <div className="ink-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-vermillion" />
              <span className="text-xs font-semibold tracking-wider uppercase">주간 문제집 랭킹</span>
            </div>
            <div className="space-y-2.5">
              {topRanking.map((item) => (
                <div key={item.rank} className="flex items-start gap-2.5 py-1">
                  <span className="text-lg font-mono font-bold text-muted-foreground/40 w-5 text-right shrink-0">{item.rank}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-snug">{item.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{item.author}</span>
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

          <div className="ink-card p-4">
            <span className="text-xs font-semibold tracking-wider uppercase mb-3 block">난이도 가이드</span>
            <div className="space-y-2 text-xs">
              {difficultyGuide.map((d) => (
                <div key={d.level} className="flex items-center gap-2">
                  <span className={`w-2 h-2 ${d.color} shrink-0`} />
                  <span className="font-semibold w-8">{d.level}</span>
                  <span className="text-muted-foreground">{d.desc}</span>
                </div>
              ))}
            </div>
          </div>

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
                      <div className="h-full bg-vermillion/60" style={{ width: `${Math.round((cnt / maxCount) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <ReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} type="workbook"
        defaultSubject={activeSubject} />
    </div>
  );
}
