/*
 * Design: Inkwell — Editorial Ink & Paper
 * Lectures page — PC: 2-column (cards + sidebar) / Mobile: single column
 */
import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Monitor,
  Star,
  Filter,
  TrendingUp,
  Heart,
  MessageSquare,
  Eye,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const subjects = ["전체", "국어", "수학", "영어", "한국사", "사탐", "과탐"];
const platforms = ["전체", "메가스터디", "대성마이맥", "이투스", "EBSi"];

const lectures = [
  { id: 1, title: "현우진 뉴런 수학1", instructor: "현우진", platform: "메가스터디", subject: "수학", rating: 4.9, reviews: 2340, price: 159000, students: 45200, difficulty: "중상", desc: "개념부터 킬러까지 체계적으로 잡아주는 수학 강의의 정석." },
  { id: 2, title: "박광일 국어 올인원", instructor: "박광일", platform: "대성마이맥", subject: "국어", rating: 4.8, reviews: 1890, price: 139000, students: 38700, difficulty: "중", desc: "비문학·문학·화작을 하나의 프레임으로 정리." },
  { id: 3, title: "김기훈 영어 독해 마스터", instructor: "김기훈", platform: "이투스", subject: "영어", rating: 4.7, reviews: 1560, price: 129000, students: 32100, difficulty: "중", desc: "구문 분석 기반 독해 전략." },
  { id: 4, title: "양승진 시발점 수학2", instructor: "양승진", platform: "메가스터디", subject: "수학", rating: 4.8, reviews: 1780, price: 149000, students: 41300, difficulty: "중하", desc: "기초부터 탄탄하게 쌓아올리는 개념 강의." },
  { id: 5, title: "이해황 국어 비문학 특강", instructor: "이해황", platform: "이투스", subject: "국어", rating: 4.6, reviews: 1230, price: 89000, students: 28900, difficulty: "상", desc: "비문학 독해력을 극한까지 끌어올리는 고난도 특강." },
  { id: 6, title: "EBS 수능특강 영어", instructor: "EBS", platform: "EBSi", subject: "영어", rating: 4.5, reviews: 3200, price: 0, students: 120000, difficulty: "중", desc: "수능 연계 교재 기반 무료 강의." },
  { id: 7, title: "전한길 한국사 올인원", instructor: "전한길", platform: "메가스터디", subject: "한국사", rating: 4.9, reviews: 4100, price: 99000, students: 78000, difficulty: "하", desc: "한국사 만점을 위한 가장 효율적인 강의." },
  { id: 8, title: "정승제 국어 개념의 나비효과", instructor: "정승제", platform: "이투스", subject: "국어", rating: 4.7, reviews: 2100, price: 119000, students: 35600, difficulty: "중하", desc: "국어 기초가 부족한 학생을 위한 개념 강의." },
];

const communityReviews = [
  { id: 101, title: "국어 박광일 vs 이해황, 비문학 강의 솔직 비교", author: "국어고민러", likes: 312, comments: 67, views: 2400, time: "1시간 전", tag: "국어", excerpt: "두 강의 모두 수강해본 입장에서 솔직하게 비교합니다." },
  { id: 102, title: "현우진 뉴런 vs 양승진 시발점, 수학 강의 선택 가이드", author: "수학러", likes: 287, comments: 54, views: 1980, time: "3시간 전", tag: "수학", excerpt: "수학 등급별로 어떤 강의가 맞는지 정리했습니다." },
  { id: 103, title: "김기훈 영어 올인원 3개월 수강 후기 (4등급→2등급)", author: "영어정복", likes: 198, comments: 38, views: 1560, time: "5시간 전", tag: "영어", excerpt: "3개월 동안 매일 1강씩 들으면서 성적이 올랐습니다." },
  { id: 104, title: "EBSi 무료 강의만으로 수능 준비 가능할까?", author: "EBS충", likes: 156, comments: 42, views: 1340, time: "7시간 전", tag: "영어", excerpt: "EBS 수능특강 + 수능완성만으로 영어 1등급 받은 후기입니다." },
  { id: 105, title: "전한길 한국사, 이거 하나면 끝 (만점 후기)", author: "한국사만점", likes: 234, comments: 29, views: 1890, time: "8시간 전", tag: "한국사", excerpt: "전한길 올인원 한 번 듣고 기출 3회독하니 만점 나왔습니다." },
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
  const [activePlatform, setActivePlatform] = useState("전체");
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "price">("popular");

  const filtered = lectures
    .filter((l) => activeSubject === "전체" || l.subject === activeSubject)
    .filter((l) => activePlatform === "전체" || l.platform === activePlatform)
    .sort((a, b) => {
      if (sortBy === "popular") return b.students - a.students;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "price") return a.price - b.price;
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Monitor size={20} className="text-indigo" />
        <h1 className="editorial-heading text-2xl">인강 리뷰</h1>
        <span className="ink-tag-filled bg-indigo/10 text-indigo text-[10px]">전국구</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        어떤 인강을 들을지 고민이라면? 실수강생 후기와 강의 비교로 나에게 맞는 인강을 찾으세요.
      </p>

      {/* 꿈 맥락 연동 배너 */}
      <div className="dream-card p-4 mb-4 flex items-center gap-3">
        <Sparkles size={18} className="text-dream shrink-0" />
        <div className="flex-1">
          <p className="text-sm">
            나의 꿈 <span className="font-bold text-dream">"서울대 의대"</span>를 위한 추천 인강이 있어요
          </p>
          <p className="text-[10px] text-muted-foreground">꿈 동료 312명이 가장 많이 선택한 인강 조합을 확인하세요</p>
        </div>
        <Link href="/explore">
          <span className="text-xs text-dream font-semibold whitespace-nowrap">AI 추천 →</span>
        </Link>
      </div>
      <hr className="editorial-divider-thick mt-0" />

      {/* Filters */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter size={14} className="text-muted-foreground shrink-0" />
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSubject(s)}
              className={`shrink-0 px-3 py-1 text-xs transition-all ${
                activeSubject === s
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto">
            {platforms.map((p) => (
              <button
                key={p}
                onClick={() => setActivePlatform(p)}
                className={`text-xs transition-all ${
                  activePlatform === p ? "text-foreground font-semibold" : "text-muted-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-2">
            {([
              { key: "popular" as const, label: "수강생순", icon: Users },
              { key: "rating" as const, label: "평점순", icon: Star },
              { key: "price" as const, label: "가격순", icon: TrendingUp },
            ]).map((s) => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
                className={`flex items-center gap-1 text-xs ${
                  sortBy === s.key ? "text-foreground font-semibold" : "text-muted-foreground"
                }`}
              >
                <s.icon size={12} /> {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ PC: 2-column / Mobile: single column ═══ */}
      <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-8">
        {/* Main Content */}
        <div>
          {/* Lecture Cards */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
            {filtered.map((lec, i) => (
              <motion.div
                key={lec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <div
                  className="ink-card p-4 h-full flex flex-col cursor-pointer"
                  onClick={() => toast.info("강의 상세 페이지는 준비 중입니다")}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="ink-tag text-[10px]">{lec.subject}</span>
                    <span className="ink-tag-filled bg-indigo/10 text-indigo text-[10px]">{lec.platform}</span>
                  </div>
                  <h3 className="font-serif font-bold text-sm leading-snug mb-1">{lec.title}</h3>
                  <p className="text-[10px] text-muted-foreground mb-1">{lec.instructor}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{lec.desc}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={12} className="text-gold fill-gold" />
                    <span className="text-xs font-semibold">{lec.rating}</span>
                    <span className="text-[10px] text-muted-foreground">({lec.reviews.toLocaleString()})</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {lec.students.toLocaleString()}명
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2 mt-auto">
                    <span className="ink-tag-filled bg-secondary text-[10px]">난이도 {lec.difficulty}</span>
                    <span className="text-sm font-bold">
                      {lec.price === 0 ? "무료" : `${lec.price.toLocaleString()}원`}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Community Reviews */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} />
              <h2 className="editorial-heading text-lg">수강 후기 & 비교 글</h2>
            </div>
            <Link href="/community">
              <span className="text-xs text-muted-foreground hover:text-foreground ink-link">전체보기 →</span>
            </Link>
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
                  <h3 className="font-serif font-bold text-sm group-hover:text-indigo transition-colors">
                    {review.title}
                  </h3>
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
          <div className="ink-card p-4 bg-indigo/5 border-indigo/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-indigo" />
              <span className="text-xs font-semibold tracking-wider uppercase">AI 인강 추천</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              내 성적과 학습 스타일을 입력하면 최적의 인강을 추천받을 수 있습니다.
            </p>
            <Link href="/ai">
              <span className="text-xs font-semibold text-indigo flex items-center gap-0.5 hover:gap-1.5 transition-all">
                AI 추천 받기 <ArrowRight size={12} />
              </span>
            </Link>
          </div>

          {/* Weekly Ranking */}
          <div className="ink-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-indigo" />
              <span className="text-xs font-semibold tracking-wider uppercase">주간 인강 랭킹</span>
            </div>
            <div className="space-y-2.5">
              {topRanking.map((item) => (
                <div key={item.rank} className="flex items-start gap-2.5 py-1 group cursor-pointer"
                  onClick={() => toast.info("강의 상세 페이지는 준비 중입니다")}
                >
                  <span className="text-lg font-mono font-bold text-muted-foreground/40 w-5 text-right shrink-0">
                    {item.rank}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium group-hover:text-indigo transition-colors leading-snug">
                      {item.title}
                    </p>
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

          {/* Subject Stats */}
          <div className="ink-card p-4">
            <span className="text-xs font-semibold tracking-wider uppercase mb-3 block">과목별 리뷰 수</span>
            <div className="space-y-2">
              {[
                { subject: "수학", count: 487, pct: 100 },
                { subject: "국어", count: 412, pct: 85 },
                { subject: "영어", count: 298, pct: 61 },
                { subject: "한국사", count: 156, pct: 32 },
                { subject: "과탐", count: 89, pct: 18 },
              ].map((s) => (
                <div key={s.subject}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span>{s.subject}</span>
                    <span className="text-muted-foreground">{s.count}</span>
                  </div>
                  <div className="h-1 bg-secondary">
                    <div className="h-full bg-indigo/60" style={{ width: `${s.pct}%` }} />
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
