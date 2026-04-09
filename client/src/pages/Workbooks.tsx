/*
 * Design: Inkwell — Editorial Ink & Paper
 * Workbooks page — PC: 2-column (cards + sidebar) / Mobile: single column
 */
import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  BookOpen,
  Star,
  Filter,
  TrendingUp,
  Heart,
  MessageSquare,
  Eye,
  Users,
  BarChart3,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const subjects = ["전체", "국어", "수학", "영어", "한국사", "사탐", "과탐"];
const difficulties = ["전체", "기초", "기본", "발전", "심화"];
const types = ["전체", "개념서", "유형서", "기출", "모의고사", "EBS"];

const workbooks = [
  { id: 1, title: "수학의 정석 (수학1+수학2)", author: "홍성대", publisher: "성지출판", subject: "수학", difficulty: "기본", type: "개념서", rating: 4.9, reviews: 3200, price: 38000, desc: "대한민국 수학 개념서의 바이블.", recommend: "개념이 부족한 학생" },
  { id: 2, title: "쎈 수학1", author: "홍범준·신사고", publisher: "좋은책신사고", subject: "수학", difficulty: "발전", type: "유형서", rating: 4.8, reviews: 2800, price: 18000, desc: "유형별 문제 풀이의 정석.", recommend: "유형 연습이 필요한 학생" },
  { id: 3, title: "블랙라벨 수학2", author: "좋은책신사고", publisher: "좋은책신사고", subject: "수학", difficulty: "심화", type: "유형서", rating: 4.7, reviews: 1560, price: 16000, desc: "상위권을 위한 고난도 문제집.", recommend: "1~2등급 목표 학생" },
  { id: 4, title: "매3비 (매일 지문 3개씩 비문학)", author: "안인숙", publisher: "키출판사", subject: "국어", difficulty: "기본", type: "유형서", rating: 4.8, reviews: 2100, price: 16000, desc: "비문학 독해력을 매일 꾸준히 키우는 데일리 문제집.", recommend: "비문학이 약한 학생" },
  { id: 5, title: "매3문 (매일 지문 3개씩 문학)", author: "안인숙", publisher: "키출판사", subject: "국어", difficulty: "기본", type: "유형서", rating: 4.7, reviews: 1800, price: 16000, desc: "문학 감상력을 매일 훈련하는 데일리 문제집.", recommend: "문학이 약한 학생" },
  { id: 6, title: "자이스토리 영어 독해", author: "수경출판사", publisher: "수경출판사", subject: "영어", difficulty: "기본", type: "유형서", rating: 4.7, reviews: 1800, price: 14500, desc: "다양한 유형의 독해 문제를 대량으로 연습.", recommend: "독해 연습량이 필요한 학생" },
  { id: 7, title: "EBS 수능특강 국어", author: "EBS", publisher: "EBS", subject: "국어", difficulty: "기본", type: "EBS", rating: 4.5, reviews: 4200, price: 9900, desc: "수능 연계 교재. 국어 영역 전 범위 커버.", recommend: "모든 수험생 필수" },
  { id: 8, title: "마더텅 수능기출 영어 독해", author: "마더텅", publisher: "마더텅", subject: "영어", difficulty: "발전", type: "기출", rating: 4.8, reviews: 2600, price: 15800, desc: "수능 기출문제를 연도별·유형별로 정리.", recommend: "기출 회독이 필요한 학생" },
  { id: 9, title: "수능완성 수학", author: "EBS", publisher: "EBS", subject: "수학", difficulty: "발전", type: "EBS", rating: 4.6, reviews: 3100, price: 8800, desc: "수능 직전 실전 감각을 키우는 EBS 연계 교재.", recommend: "수능 직전 마무리" },
  { id: 10, title: "봉투 모의고사 시즌2", author: "이투스", publisher: "이투스북", subject: "수학", difficulty: "심화", type: "모의고사", rating: 4.6, reviews: 980, price: 12000, desc: "실전과 동일한 환경에서 풀 수 있는 봉투 모의고사.", recommend: "실전 감각이 필요한 학생" },
];

const communityReviews = [
  { id: 201, title: "수학의 정석 vs 쎈 vs 블랙라벨, 난이도별 추천 총정리", author: "문제집마스터", likes: 456, comments: 89, views: 3200, time: "2시간 전", tag: "수학", excerpt: "세 문제집 모두 풀어본 입장에서 등급별 추천을 정리합니다." },
  { id: 202, title: "국어 매3비 vs 매3문, 어떤 걸 먼저 풀어야 할까?", author: "국어1등급", likes: 234, comments: 41, views: 2100, time: "4시간 전", tag: "국어", excerpt: "비문학이 더 급하면 매3비 먼저, 문학 감상이 약하면 매3문 먼저." },
  { id: 203, title: "EBS 수능특강 활용법 총정리 (연계율 체감 후기)", author: "EBS파", likes: 189, comments: 33, views: 1560, time: "6시간 전", tag: "EBS", excerpt: "EBS 연계율이 체감 50% 정도인데, 그래도 안 하면 손해입니다." },
  { id: 204, title: "마더텅 기출 vs 자이스토리, 영어 문제집 비교", author: "영어고민", likes: 167, comments: 28, views: 1340, time: "8시간 전", tag: "영어", excerpt: "기출 분석은 마더텅, 유형 연습은 자이스토리." },
];

const topRanking = [
  { rank: 1, title: "수학의 정석", author: "홍성대", rating: 4.9, change: "—" },
  { rank: 2, title: "쎈 수학1", author: "홍범준", rating: 4.8, change: "↑1" },
  { rank: 3, title: "매3비 비문학", author: "안인숙", rating: 4.8, change: "—" },
  { rank: 4, title: "마더텅 영어 기출", author: "마더텅", rating: 4.8, change: "NEW" },
  { rank: 5, title: "EBS 수능특강 국어", author: "EBS", rating: 4.5, change: "↓2" },
];

export default function Workbooks() {
  const [activeSubject, setActiveSubject] = useState("전체");
  const [activeDifficulty, setActiveDifficulty] = useState("전체");
  const [activeType, setActiveType] = useState("전체");
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "price">("popular");

  const filtered = workbooks
    .filter((w) => activeSubject === "전체" || w.subject === activeSubject)
    .filter((w) => activeDifficulty === "전체" || w.difficulty === activeDifficulty)
    .filter((w) => activeType === "전체" || w.type === activeType)
    .sort((a, b) => {
      if (sortBy === "popular") return b.reviews - a.reviews;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "price") return a.price - b.price;
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <BookOpen size={20} className="text-vermillion" />
        <h1 className="editorial-heading text-2xl">문제집 리뷰</h1>
        <span className="ink-tag-filled bg-vermillion/10 text-vermillion text-[10px]">전국구</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        어떤 문제집을 풀지 고민이라면? 실사용자 후기와 난이도별 비교로 나에게 맞는 문제집을 찾으세요.
      </p>

      {/* 꿈 맥락 연동 배너 */}
      <div className="dream-card p-4 mb-4 flex items-center gap-3">
        <Sparkles size={18} className="text-dream shrink-0" />
        <div className="flex-1">
          <p className="text-sm">
            나의 꿈 <span className="font-bold text-dream">"서울대 의대"</span>를 위한 필수 문제집 조합이 있어요
          </p>
          <p className="text-[10px] text-muted-foreground">꿈 동료들이 가장 많이 풀어본 문제집 조합을 확인하세요</p>
        </div>
        <Link href="/explore">
          <span className="text-xs text-dream font-semibold whitespace-nowrap">AI 추천 →</span>
        </Link>
      </div>
      <p className="text-sm text-muted-foreground mb-4 hidden">
        어떤 문제집을 풀지 고민이라면? 실사용 후기와 난이도 비교로 나에게 맞는 문제집을 찾으세요.
      </p>
      <hr className="editorial-divider-thick mt-0" />

      {/* Filters */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter size={14} className="text-muted-foreground shrink-0" />
          {subjects.map((s) => (
            <button key={s} onClick={() => setActiveSubject(s)}
              className={`shrink-0 px-3 py-1 text-xs transition-all ${activeSubject === s ? "bg-foreground text-background font-semibold" : "text-muted-foreground hover:text-foreground border border-border"}`}
            >{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            {difficulties.map((d) => (
              <button key={d} onClick={() => setActiveDifficulty(d)}
                className={`text-xs transition-all ${activeDifficulty === d ? "text-foreground font-semibold" : "text-muted-foreground"}`}
              >{d}</button>
            ))}
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-2 overflow-x-auto">
            {types.map((t) => (
              <button key={t} onClick={() => setActiveType(t)}
                className={`text-xs transition-all ${activeType === t ? "text-foreground font-semibold" : "text-muted-foreground"}`}
              >{t}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {([
            { key: "popular" as const, label: "리뷰순", icon: Users },
            { key: "rating" as const, label: "평점순", icon: Star },
            { key: "price" as const, label: "가격순", icon: TrendingUp },
          ]).map((s) => (
            <button key={s.key} onClick={() => setSortBy(s.key)}
              className={`flex items-center gap-1 text-xs ${sortBy === s.key ? "text-foreground font-semibold" : "text-muted-foreground"}`}
            ><s.icon size={12} /> {s.label}</button>
          ))}
        </div>
      </div>

      {/* ═══ PC: 2-column / Mobile: single column ═══ */}
      <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-8">
        {/* Main Content */}
        <div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
            {filtered.map((wb, i) => (
              <motion.div key={wb.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                <div className="ink-card p-4 h-full flex flex-col cursor-pointer" onClick={() => toast.info("문제집 상세 페이지는 준비 중입니다")}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="ink-tag text-[10px]">{wb.subject}</span>
                    <span className="ink-tag-filled bg-vermillion/10 text-vermillion text-[10px]">{wb.type}</span>
                    {wb.difficulty === "심화" && <span className="ink-tag-filled bg-foreground text-background text-[10px]">심화</span>}
                  </div>
                  <h3 className="font-serif font-bold text-sm leading-snug mb-1">{wb.title}</h3>
                  <p className="text-[10px] text-muted-foreground mb-1">{wb.author} · {wb.publisher}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-1">{wb.desc}</p>
                  <div className="p-2 bg-secondary/50 mb-2">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <BarChart3 size={10} className="text-vermillion" /> 추천: {wb.recommend}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={12} className="text-gold fill-gold" />
                    <span className="text-xs font-semibold">{wb.rating}</span>
                    <span className="text-[10px] text-muted-foreground">({wb.reviews.toLocaleString()})</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2 mt-auto">
                    <span className="ink-tag-filled bg-secondary text-[10px]">난이도 {wb.difficulty}</span>
                    <span className="text-sm font-bold">{wb.price.toLocaleString()}원</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Community Reviews */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} />
              <h2 className="editorial-heading text-lg">문제집 후기 & 비교 글</h2>
            </div>
            <Link href="/community"><span className="text-xs text-muted-foreground hover:text-foreground ink-link">전체보기 →</span></Link>
          </div>
          <hr className="editorial-divider-thick mt-0 mb-0" />
          <div className="divide-y divide-border">
            {communityReviews.map((review) => (
              <Link key={review.id} href={`/community/${review.id}`}>
                <article className="py-4 group">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="ink-tag text-[10px]">{review.tag}</span>
                    <span className="text-[10px] text-muted-foreground">{review.time}</span>
                  </div>
                  <h3 className="font-serif font-bold text-sm group-hover:text-vermillion transition-colors">{review.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{review.excerpt}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span>{review.author}</span>
                    <span className="flex items-center gap-0.5"><Heart size={10} /> {review.likes}</span>
                    <span className="flex items-center gap-0.5"><MessageSquare size={10} /> {review.comments}</span>
                    <span className="flex items-center gap-0.5"><Eye size={10} /> {review.views}</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Right Sidebar (Desktop Only) ── */}
        <aside className="hidden lg:block space-y-6">
          {/* AI Recommendation */}
          <div className="ink-card p-4 bg-vermillion/5 border-vermillion/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-vermillion" />
              <span className="text-xs font-semibold tracking-wider uppercase">AI 문제집 추천</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              내 등급과 취약 과목을 입력하면 최적의 문제집 로드맵을 추천받을 수 있습니다.
            </p>
            <Link href="/ai">
              <span className="text-xs font-semibold text-vermillion flex items-center gap-0.5 hover:gap-1.5 transition-all">
                AI 추천 받기 <ArrowRight size={12} />
              </span>
            </Link>
          </div>

          {/* Weekly Ranking */}
          <div className="ink-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-vermillion" />
              <span className="text-xs font-semibold tracking-wider uppercase">주간 문제집 랭킹</span>
            </div>
            <div className="space-y-2.5">
              {topRanking.map((item) => (
                <div key={item.rank} className="flex items-start gap-2.5 py-1 group cursor-pointer"
                  onClick={() => toast.info("문제집 상세 페이지는 준비 중입니다")}
                >
                  <span className="text-lg font-mono font-bold text-muted-foreground/40 w-5 text-right shrink-0">{item.rank}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium group-hover:text-vermillion transition-colors leading-snug">{item.title}</p>
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

          {/* Difficulty Guide */}
          <div className="ink-card p-4">
            <span className="text-xs font-semibold tracking-wider uppercase mb-3 block">난이도 가이드</span>
            <div className="space-y-2 text-xs">
              {[
                { level: "기초", desc: "4~5등급, 개념 정리", color: "bg-green-500" },
                { level: "기본", desc: "3~4등급, 유형 익히기", color: "bg-blue-500" },
                { level: "발전", desc: "2~3등급, 심화 유형", color: "bg-yellow-500" },
                { level: "심화", desc: "1~2등급, 킬러 대비", color: "bg-vermillion" },
              ].map((d) => (
                <div key={d.level} className="flex items-center gap-2">
                  <span className={`w-2 h-2 ${d.color} shrink-0`} />
                  <span className="font-semibold w-8">{d.level}</span>
                  <span className="text-muted-foreground">{d.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Stats */}
          <div className="ink-card p-4">
            <span className="text-xs font-semibold tracking-wider uppercase mb-3 block">과목별 리뷰 수</span>
            <div className="space-y-2">
              {[
                { subject: "수학", count: 412, pct: 100 },
                { subject: "국어", count: 298, pct: 72 },
                { subject: "영어", count: 187, pct: 45 },
                { subject: "EBS", count: 156, pct: 38 },
              ].map((s) => (
                <div key={s.subject}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span>{s.subject}</span>
                    <span className="text-muted-foreground">{s.count}</span>
                  </div>
                  <div className="h-1 bg-secondary">
                    <div className="h-full bg-vermillion/60" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
