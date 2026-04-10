/*
 * Academies — 학원 리뷰 커뮤니티 (실제 DB 연동)
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  MapPin, Star, Filter, TrendingUp, MessageSquare, Loader2, PenLine, ChevronDown, ArrowRight,
} from "lucide-react";
import { ReviewModal } from "@/components/community/ReviewModal";
import { ReviewCard } from "@/components/community/ReviewCard";
import { CommunityTabNav } from "@/components/community/CommunityTabNav";
import { getAuthHeaders } from "@/lib/queryClient";
import type { CommunityReview } from "@shared/schema";
import { usePageTitle } from "@/hooks/usePageTitle";

const regions: Record<string, string[]> = {
  "서울": ["전체", "강남구", "서초구", "송파구", "양천구", "노원구", "마포구", "중구", "강서구"],
  "경기": ["전체", "성남시", "수원시", "용인시", "고양시", "안양시", "부천시", "화성시"],
  "인천": ["전체", "남동구", "부평구", "연수구"],
  "부산": ["전체", "해운대구", "수영구", "남구"],
  "대구": ["전체", "수성구", "달서구", "중구"],
  "대전": ["전체", "유성구", "서구", "중구"],
  "광주": ["전체", "북구", "남구", "서구"],
};
const subjects = ["전체", "국어", "수학", "영어", "과학", "논술", "종합"];
const sortOptions = [
  { key: "recent" as const, label: "최신순", icon: MessageSquare },
  { key: "likes" as const, label: "인기순", icon: TrendingUp },
  { key: "rating" as const, label: "평점순", icon: Star },
];

export default function Academies() {
  usePageTitle("학원 리뷰 — Konnect 커뮤니티", "학원 정보와 재원생들의 솔직한 리뷰를 확인하세요.");
  const [activeRegion, setActiveRegion] = useState("서울");
  const [activeSubject, setActiveSubject] = useState("전체");
  const [sortBy, setSortBy] = useState<"recent" | "likes" | "rating">("recent");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [page, setPage] = useState(1);

  const districts = regions[activeRegion] ?? ["전체"];
  const queryKey = ["community-reviews", "academy", activeSubject, sortBy, page];

  const { data, isLoading } = useQuery<{ reviews: CommunityReview[]; total: number; likedIds: number[] }>({
    queryKey,
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({
        type: "academy",
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

  // Client-side filter by region (region stored in review.region field)
  const allReviews = data?.reviews ?? [];
  const reviews = activeRegion !== "전체"
    ? allReviews.filter(r => !r.region || r.region === activeRegion)
    : allReviews;
  const likedIds = data?.likedIds ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 15);

  // Regional stats from current reviews
  const regionCounts: Record<string, number> = {};
  allReviews.forEach(r => { if (r.region) regionCounts[r.region] = (regionCounts[r.region] ?? 0) + 1; });
  const topRegions = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCount = Math.max(...topRegions.map(([, c]) => c), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <MapPin size={20} className="text-gold" />
        <h1 className="editorial-heading text-2xl">학원 리뷰</h1>
        <span className="ink-tag-filled bg-gold/10 text-gold text-[10px]">지역구</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        지역별 실제 수강 후기로 나에게 맞는 학원을 찾으세요.
      </p>

      {/* Mobile tab nav */}
      <CommunityTabNav />

      {/* Banner — desktop only */}
      <div className="hidden md:flex dream-card p-4 mb-4 items-center gap-3">
        <MapPin size={18} className="text-dream shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">다녀본 학원 후기를 남겨보세요</p>
          <p className="text-[10px] text-muted-foreground">지역 후기가 쌓일수록 모두에게 도움이 됩니다</p>
        </div>
        <button onClick={() => setReviewOpen(true)}
          className="flex items-center gap-1 bg-dream text-white text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-dream/90 transition-colors">
          <PenLine size={12} /> 후기 쓰기
        </button>
      </div>

      {/* Mobile: write button row */}
      <div className="md:hidden flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">학원 리뷰 커뮤니티</span>
        <button onClick={() => setReviewOpen(true)}
          className="flex items-center gap-1 bg-dream text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-dream/90 transition-colors">
          <PenLine size={12} /> 후기 쓰기
        </button>
      </div>
      <hr className="editorial-divider-thick mt-0" />

      {/* Region Filter */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <MapPin size={14} className="text-gold shrink-0" />
          {Object.keys(regions).map((r) => (
            <button key={r} onClick={() => { setActiveRegion(r); setPage(1); }}
              className={`shrink-0 px-3 py-1 text-xs transition-all ${activeRegion === r ? "bg-foreground text-background font-semibold" : "text-muted-foreground hover:text-foreground border border-border"}`}
            >{r}</button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <ChevronDown size={14} className="text-muted-foreground shrink-0" />
          {districts.map((d) => (
            <button key={d} className="shrink-0 text-xs text-muted-foreground">{d}</button>
          ))}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter size={14} className="text-muted-foreground shrink-0" />
            {subjects.map(s => (
              <button key={s} onClick={() => { setActiveSubject(s); setPage(1); }}
                className={`shrink-0 text-xs transition-all ${activeSubject === s ? "text-foreground font-semibold" : "text-muted-foreground"}`}
              >{s}</button>
            ))}
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-3">
            {sortOptions.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => { setSortBy(key); setPage(1); }}
                className={`flex items-center gap-1 text-xs ${sortBy === key ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
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
              <MapPin size={36} className="text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                {allReviews.length > 0 ? `${activeRegion} 지역 후기가 아직 없습니다.` : "아직 후기가 없습니다."}
              </p>
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
                  <span className="editorial-heading text-base">학원 후기</span>
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
          <div className="ink-card p-4 bg-gold/5 border-gold/20">
            <div className="flex items-center gap-2 mb-2">
              <PenLine size={14} className="text-gold" />
              <span className="text-xs font-semibold tracking-wider uppercase">후기 기여</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">다녀본 학원의 솔직한 후기를 공유해주세요.</p>
            <button onClick={() => setReviewOpen(true)}
              className="text-xs font-semibold text-gold flex items-center gap-0.5 hover:gap-1.5 transition-all">
              후기 남기기 <ArrowRight size={12} />
            </button>
          </div>

          {/* Region distribution */}
          {topRegions.length > 0 && (
            <div className="ink-card p-4">
              <span className="text-xs font-semibold tracking-wider uppercase mb-3 block">지역별 리뷰 수</span>
              <div className="space-y-2">
                {topRegions.map(([region, cnt]) => (
                  <div key={region}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span>{region}</span>
                      <span className="text-muted-foreground">{cnt}</span>
                    </div>
                    <div className="h-1 bg-secondary">
                      <div className="h-full bg-gold/60" style={{ width: `${Math.round((cnt / maxCount) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="ink-card p-4">
            <span className="text-xs font-semibold tracking-wider uppercase mb-3 block">학원 선택 팁</span>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>📍 <strong>위치</strong>가 멀면 지속하기 어렵습니다</p>
              <p>👥 <strong>반 인원</strong>이 적을수록 밀도 있는 관리가 가능합니다</p>
              <p>📊 <strong>레벨 테스트</strong>를 통해 맞는 반에 배치되는지 확인하세요</p>
              <p>💰 <strong>환불 정책</strong>을 등록 전에 반드시 확인하세요</p>
            </div>
          </div>
        </aside>
      </div>

      <ReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} type="academy"
        defaultSubject={activeSubject}
        defaultTarget={activeRegion !== "전체" ? { name: "", region: activeRegion } : undefined} />
    </div>
  );
}
