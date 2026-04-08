/*
 * 3안 최종 수정 — 꿈 보드 탐색 페이지
 * 계열 보드 8개 + 특수 보드 4개 = 12개 보드
 * 자기진단 CTA + 유료 도구 안내
 */
import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Star, Users, FileText, TrendingUp, Search, Flame,
  GraduationCap, Briefcase, BookOpen, Sunrise, ChevronRight,
  Sparkles, Heart, PenLine, Brain, Zap, Mic, FileEdit,
  Compass, Route, Crown, ClipboardCheck, Stethoscope,
  Scale, FlaskConical, Palette, Monitor,
} from "lucide-react";

/* ─── 계열 보드 데이터 (Phase 1) ─── */
const fieldBoards = [
  {
    slug: "med-pharm", name: "의·약학 계열", icon: "🏥",
    members: 3872, posts: 14260,
    includes: "의예과 · 약학 · 간호학 · 의사",
    description: "의대, 약대, 간호대를 꿈꾸는 사람들의 공간",
    color: "dream",
  },
  {
    slug: "engineering", name: "공학 계열", icon: "💻",
    members: 3420, posts: 15000,
    includes: "컴퓨터공학 · 전자공학 · 기계공학 · 개발자 · 연구원",
    description: "공대 입시와 엔지니어 진로를 함께 준비합니다",
    color: "indigo",
  },
  {
    slug: "business-econ", name: "경영·경제 계열", icon: "📊",
    members: 2180, posts: 9400,
    includes: "경영학 · 경제학 · 회계학 · 금융",
    description: "경영·경제 분야 입시 전략과 진로 탐색",
    color: "gold",
  },
  {
    slug: "law-admin", name: "법·행정 계열", icon: "⚖️",
    members: 1990, posts: 8700,
    includes: "법학 · 행정학 · 변호사 · 공무원",
    description: "법조인과 행정 전문가를 꿈꾸는 공간",
    color: "vermillion",
  },
  {
    slug: "natural-sci", name: "자연과학 계열", icon: "🔬",
    members: 1560, posts: 6800,
    includes: "수학 · 물리 · 화학 · 생물 · 지구과학",
    description: "자연과학 탐구와 연구자 진로 준비",
    color: "emerald",
  },
  {
    slug: "humanities", name: "인문·사회 계열", icon: "📚",
    members: 1740, posts: 7200,
    includes: "인문학 · 사회학 · 심리학 · 정치외교",
    description: "인문·사회 분야 입시와 진로 탐색",
    color: "indigo",
  },
  {
    slug: "arts-sports", name: "예·체능 계열", icon: "🎨",
    members: 980, posts: 4100,
    includes: "미술 · 음악 · 체육 · 디자인 · 영상",
    description: "예술과 체육 분야 실기·입시 정보",
    color: "coral",
  },
  {
    slug: "education", name: "교육 계열", icon: "🎓",
    members: 1020, posts: 4400,
    includes: "교육학 · 초등교육 · 교사 · 사범대",
    description: "교대·사범대 입시와 교직 진로 준비",
    color: "dream",
  },
];

const specialBoards = [
  { slug: "reconnect", name: "다시, 잇다", members: 1340, posts: 4500, description: "재도전하는 모든 이들의 공간. 다시 시작하는 용기를 나눕니다.", accent: true },
  { slug: "n-soo", name: "N수생 라운지", members: 2100, posts: 8900, description: "N수생들의 정보 교환과 응원의 공간" },
  { slug: "mentoring", name: "멘토링", members: 780, posts: 3200, description: "선배·후배 간 멘토링 매칭" },
  { slug: "study-group", name: "스터디 모집", members: 1500, posts: 6700, description: "함께 공부할 동료를 찾습니다" },
];

const myBoards = [
  { slug: "med-pharm", name: "의·약학 계열", members: 3872, posts: 14260, icon: "🏥", growth: "+12%" },
];

const popularBoards = [
  { slug: "med-pharm", name: "의·약학 계열", members: 3872, posts: 14260, icon: "🏥", field: "계열" },
  { slug: "engineering", name: "공학 계열", members: 3420, posts: 15000, icon: "💻", field: "계열" },
  { slug: "business-econ", name: "경영·경제 계열", members: 2180, posts: 9400, icon: "📊", field: "계열" },
  { slug: "n-soo", name: "N수생 라운지", members: 2100, posts: 8900, icon: "📖", field: "특수" },
  { slug: "law-admin", name: "법·행정 계열", members: 1990, posts: 8700, icon: "⚖️", field: "계열" },
  { slug: "humanities", name: "인문·사회 계열", members: 1740, posts: 7200, icon: "📚", field: "계열" },
  { slug: "natural-sci", name: "자연과학 계열", members: 1560, posts: 6800, icon: "🔬", field: "계열" },
  { slug: "study-group", name: "스터디 모집", members: 1500, posts: 6700, icon: "👥", field: "특수" },
  { slug: "reconnect", name: "다시, 잇다", members: 1340, posts: 4500, icon: "🌅", field: "특수" },
  { slug: "education", name: "교육 계열", members: 1020, posts: 4400, icon: "🎓", field: "계열" },
];

type TabType = "all" | "field" | "special";

export default function DreamBoards() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: "all", label: "전체", icon: Sparkles },
    { key: "field", label: "계열별", icon: GraduationCap },
    { key: "special", label: "특수 보드", icon: Sunrise },
  ];

  const filterBySearch = <T extends { name: string }>(items: T[]) =>
    searchQuery ? items.filter((b) => b.name.includes(searchQuery) || ('includes' in b && typeof (b as any).includes === 'string' && (b as any).includes.includes(searchQuery))) : items;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Star size={20} className="text-dream" />
          <h1 className="editorial-heading text-2xl md:text-3xl">꿈 보드</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-xl">
          카테고리가 아니라 꿈이 게시판을 만든다. 같은 꿈을 가진 동료들과 정보를 나누고, 서로 응원하세요.
        </p>
      </motion.div>

      {/* ═══ 3안 차별점 배너 ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6 border-2 border-dream/20 bg-gradient-to-r from-dream/5 via-indigo-50/30 to-violet-50/30 dark:from-dream/10 dark:via-transparent dark:to-transparent rounded-xl p-5"
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 bg-dream/10 rounded-lg flex items-center justify-center shrink-0">
            <Zap size={18} className="text-dream" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-serif font-bold text-sm">3안의 핵심 — 보드가 모든 것을 맥락화합니다</h3>
              <span className="text-[8px] bg-dream text-white px-1.5 py-0.5 rounded-full font-semibold">3안 고유</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              1안(EduConnect 게시판 이식)과 2안(AI 도구 강화)과 달리, 3안에서는 <strong>꿈 보드에 참여하는 것만으로 모든 AI 도구가 해당 꿈에 맞춰 자동 개인화</strong>됩니다.
              자기진단은 <strong className="text-emerald-600">무료</strong>, 생기부/자소서/면접은 <strong className="text-dream">Premium</strong>으로 제공됩니다.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 ml-11">
          {[
            { icon: ClipboardCheck, label: "자기진단", desc: "무료 — 4종 진단", free: true },
            { icon: FileEdit, label: "생기부 분석", desc: "Premium", free: false },
            { icon: PenLine, label: "자소서 첨삭", desc: "Premium", free: false },
            { icon: Mic, label: "면접 연습", desc: "Premium", free: false },
            { icon: Compass, label: "AI 탐색", desc: "무료", free: true },
            { icon: Route, label: "동료 로드맵", desc: "무료", free: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 p-2 bg-white/60 dark:bg-ink/30 rounded-lg">
              <item.icon size={12} className={item.free ? "text-emerald-600 shrink-0" : "text-dream shrink-0"} />
              <div>
                <p className="text-[10px] font-semibold">{item.label}</p>
                <p className={`text-[8px] font-semibold ${item.free ? "text-emerald-600" : "text-dream"}`}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="flex gap-8">
        {/* ─── Main Content ─── */}
        <div className="flex-1 min-w-0">
          {/* 내 꿈 보드 */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Heart size={14} className="text-dream" />
              <h2 className="font-serif font-bold text-base">내 꿈 보드</h2>
              <span className="text-[10px] text-muted-foreground">꿈 선언 기반 자동 배정</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {myBoards.map((board) => (
                <Link key={board.slug} href={`/boards/${board.slug}`}>
                  <motion.div whileHover={{ y: -2 }} className="p-4 border border-dream/30 bg-dream/5 hover:bg-dream/10 transition-all cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{board.icon}</span>
                      <span className="font-serif font-bold text-sm">{board.name}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold ml-auto">{board.growth}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Users size={9} /> {board.members.toLocaleString()}명</span>
                      <span className="flex items-center gap-0.5"><FileText size={9} /> {board.posts.toLocaleString()}글</span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </section>

          <hr className="editorial-divider" />

          {/* 보드 탐색 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Search size={14} />
              <h2 className="font-serif font-bold text-base">보드 탐색</h2>
            </div>

            {/* Tabs — 전체 | 계열별 | 특수 보드 */}
            <div className="flex gap-1 mb-4 flex-wrap">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all ${
                    activeTab === tab.key
                      ? "bg-foreground text-background font-semibold"
                      : "border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon size={12} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="보드 이름 또는 포함 분야로 검색..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-border bg-transparent focus:border-foreground outline-none transition-colors"
              />
            </div>

            {/* Popular Boards (All tab) */}
            {activeTab === "all" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Flame size={12} className="text-vermillion" /> 인기 보드 TOP 10
                </h3>
                <div className="space-y-1">
                  {filterBySearch(popularBoards).map((board, i) => (
                    <Link key={board.slug} href={`/boards/${board.slug}`}>
                      <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 transition-colors cursor-pointer border-b border-border/50 last:border-0">
                        <span className="text-sm font-mono font-bold text-muted-foreground w-5">{i + 1}</span>
                        <span className="text-base">{board.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold">{board.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">{board.field}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5"><Users size={9} /> {board.members.toLocaleString()}</span>
                          <span className="flex items-center gap-0.5"><FileText size={9} /> {board.posts.toLocaleString()}</span>
                        </div>
                        <ChevronRight size={12} className="text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 계열별 보드 */}
            {(activeTab === "all" || activeTab === "field") && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={activeTab === "all" ? "mt-8" : ""}>
                <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3 flex items-center gap-1.5">
                  <GraduationCap size={12} className="text-dream" /> 계열별 보드
                  <span className="text-[9px] font-normal ml-1">(Phase 1 — 사용자 증가 시 대학별 세분화 예정)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filterBySearch(fieldBoards).map((board) => (
                    <Link key={board.slug} href={`/boards/${board.slug}`}>
                      <motion.div whileHover={{ y: -1 }} className="p-4 border border-border hover:border-dream/50 hover:bg-dream/5 transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{board.icon}</span>
                            <span className="font-serif font-bold text-sm">{board.name}</span>
                          </div>
                          <ChevronRight size={12} className="text-muted-foreground" />
                        </div>
                        <p className="text-[10px] text-muted-foreground mb-2">{board.description}</p>
                        <p className="text-[10px] text-dream/80 mb-2">포함: {board.includes}</p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5"><Users size={9} /> {board.members.toLocaleString()}명</span>
                          <span className="flex items-center gap-0.5"><FileText size={9} /> {board.posts.toLocaleString()}글</span>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 특수 보드 */}
            {(activeTab === "all" || activeTab === "special") && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={activeTab !== "special" ? "mt-8" : ""}>
                <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Sunrise size={12} className="text-coral" /> 특수 보드
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filterBySearch(specialBoards).map((board) => (
                    <Link key={board.slug} href={`/boards/${board.slug}`}>
                      <div className={`p-4 border transition-all cursor-pointer ${
                        board.accent
                          ? "border-coral/30 bg-coral/5 hover:bg-coral/10"
                          : "border-border hover:border-coral/50 hover:bg-coral/5"
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-serif font-bold text-sm ${board.accent ? "text-coral" : ""}`}>{board.name}</span>
                          <ChevronRight size={12} className="text-muted-foreground" />
                        </div>
                        <p className="text-[10px] text-muted-foreground mb-2">{board.description}</p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5"><Users size={9} /> {board.members.toLocaleString()}</span>
                          <span className="flex items-center gap-0.5"><FileText size={9} /> {board.posts.toLocaleString()}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </section>
        </div>

        {/* ─── Sidebar (PC Only) ─── */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-6">
          {/* 자기진단 CTA (무료) */}
          <Link href="/diagnosis">
            <div className="p-4 bg-emerald-600 text-white text-center hover:bg-emerald-700 transition-colors cursor-pointer rounded-lg">
              <ClipboardCheck size={16} className="mx-auto mb-2" />
              <p className="text-sm font-semibold">자기진단 & 평가</p>
              <p className="text-[10px] opacity-90 mt-1">적성·학업·전략·습관 무료 진단</p>
              <span className="inline-block mt-2 text-[9px] bg-white/20 px-2 py-0.5 rounded-full">무료</span>
            </div>
          </Link>

          {/* Premium 도구 안내 */}
          <div className="border-2 border-dream/30 bg-gradient-to-b from-dream/5 to-transparent p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Crown size={14} className="text-dream" />
              <h3 className="font-serif font-bold text-sm">Premium AI 도구</h3>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">
              보드 맥락에 맞춘 AI 생기부 분석, 자소서 첨삭, 면접 연습을 이용하세요.
            </p>
            <div className="space-y-1.5 mb-3">
              {[
                { label: "AI 생기부 분석", desc: "세특 적합도 평가" },
                { label: "AI 자소서 첨삭", desc: "문항별 맞춤 피드백" },
                { label: "AI 면접 연습", desc: "실시간 시뮬레이션" },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-2 p-1.5 bg-dream/5 rounded">
                  <Crown size={9} className="text-dream shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold">{t.label}</p>
                    <p className="text-[8px] text-muted-foreground">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/pricing">
              <span className="text-[10px] text-dream font-semibold hover:underline">요금제 보기 →</span>
            </Link>
          </div>

          {/* 글쓰기 CTA */}
          <Link href="/write">
            <div className="p-4 bg-foreground text-background text-center hover:opacity-90 transition-colors cursor-pointer">
              <PenLine size={16} className="mx-auto mb-2" />
              <p className="text-sm font-semibold">글쓰기</p>
              <p className="text-[10px] opacity-80 mt-1">꿈 보드에 이야기를 남겨보세요</p>
            </div>
          </Link>

          {/* Board Stats */}
          <div className="border border-border p-4">
            <h3 className="font-serif font-bold text-sm mb-3">전체 보드 현황</h3>
            <hr className="editorial-divider my-2" />
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">전체 보드</span>
                <span className="font-semibold">12개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">전체 회원</span>
                <span className="font-semibold">24,500명</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">오늘 새 글</span>
                <span className="font-semibold text-dream">+342</span>
              </div>
            </div>
          </div>

          {/* Fast Growing */}
          <div className="border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-emerald-600" />
              <h3 className="font-serif font-bold text-sm">급성장 보드</h3>
            </div>
            <hr className="editorial-divider my-2" />
            <div className="space-y-2">
              {[
                { name: "의·약학 계열", growth: "+23%", slug: "med-pharm" },
                { name: "공학 계열", growth: "+18%", slug: "engineering" },
                { name: "N수생 라운지", growth: "+15%", slug: "n-soo" },
                { name: "경영·경제 계열", growth: "+14%", slug: "business-econ" },
              ].map((b) => (
                <Link key={b.slug} href={`/boards/${b.slug}`}>
                  <div className="flex items-center justify-between py-1 hover:text-foreground transition-colors cursor-pointer">
                    <span className="text-xs">{b.name}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">{b.growth}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Re:Connect Promo */}
          <div className="border border-coral/30 bg-coral/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sunrise size={14} className="text-coral" />
              <h3 className="font-serif font-bold text-sm text-coral">다시, 잇다</h3>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">
              재도전하는 모든 이들을 위한 특별한 공간.
            </p>
            <Link href="/boards/reconnect">
              <span className="text-[10px] text-coral font-semibold hover:underline">보드 방문하기 →</span>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
