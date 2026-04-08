/*
 * Konnect v3 — 성장 대시보드
 * 학습 히트맵, 마일스톤, 크레딧(KNC) = "성장의 화폐"
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Award,
  Coins,
  Calendar,
  Flame,
  Heart,
  BookOpen,
  Star,
  Target,
  ChevronRight,
  ArrowRight,
  Sparkles,
  PenLine,
  Zap,
  Sunrise,
  RotateCcw,
} from "lucide-react";

/* Heatmap mock — 12 weeks × 7 days */
const heatmapWeeks: number[][] = [];
for (let w = 0; w < 12; w++) {
  const week: number[] = [];
  for (let d = 0; d < 7; d++) {
    if (w < 10) {
      week.push(Math.random() > 0.15 ? Math.floor(Math.random() * 4) + 1 : 0);
    } else {
      week.push(d <= new Date().getDay() ? Math.floor(Math.random() * 4) + 1 : 0);
    }
  }
  heatmapWeeks.push(week);
}

const heatColor = (level: number) => {
  if (level === 0) return "bg-secondary";
  if (level === 1) return "bg-dream/20";
  if (level === 2) return "bg-dream/40";
  if (level === 3) return "bg-dream/70";
  return "bg-dream";
};

const milestones = [
  { title: "꿈 선언", date: "2025.12.01", icon: Star, achieved: true },
  { title: "첫 이야기 작성", date: "2025.12.05", icon: PenLine, achieved: true },
  { title: "연속 7일 학습", date: "2025.12.08", icon: Flame, achieved: true },
  { title: "꿈 동료 10명", date: "2025.12.15", icon: Heart, achieved: true },
  { title: "연속 30일 학습", date: "2026.01.01", icon: Flame, achieved: true },
  { title: "꿈 동료 100명", date: "2026.02.20", icon: Heart, achieved: true },
  { title: "이야기 응원 300", date: "2026.03.10", icon: Award, achieved: true },
  { title: "Lv.3 꿈의 탐험가", date: "2026.04.01", icon: Zap, achieved: true },
  { title: "연속 100일 학습", date: "—", icon: Flame, achieved: false },
  { title: "꿈 동료 500명", date: "—", icon: Heart, achieved: false },
  { title: "수학 1등급 달성", date: "—", icon: Target, achieved: false },
  { title: "Lv.5 꿈의 개척자", date: "—", icon: Sparkles, achieved: false },
];

/* "다시, 잇다" 전용 성장 카드 */
const reStarterGrowth = {
  prevBestGrade: "3등급",
  currentGrade: "2등급",
  improvement: "+1.2등급",
  daysActive: 245,
  storiesWritten: 23,
  cheersReceived: 1847,
};

const creditHistory = [
  { action: "이야기 작성", amount: "+30", date: "오늘", type: "earn" },
  { action: "응원 10회 보내기", amount: "+15", date: "오늘", type: "earn" },
  { action: "연속 7일 보너스", amount: "+50", date: "어제", type: "earn" },
  { action: "마켓 교재 구매", amount: "-200", date: "3일 전", type: "spend" },
  { action: "마일스톤 달성 보상", amount: "+100", date: "5일 전", type: "earn" },
  { action: "AI 경로 분석 이용", amount: "-50", date: "1주 전", type: "spend" },
];

const levels = [
  { level: 1, name: "꿈의 씨앗", min: 0, max: 200 },
  { level: 2, name: "꿈의 새싹", min: 200, max: 500 },
  { level: 3, name: "꿈의 탐험가", min: 500, max: 2000 },
  { level: 4, name: "꿈의 항해사", min: 2000, max: 5000 },
  { level: 5, name: "꿈의 개척자", min: 5000, max: 10000 },
];

const currentKNC = 1250;
const currentLevel = levels.find((l) => currentKNC >= l.min && currentKNC < l.max) || levels[2];
const nextLevel = levels[currentLevel.level] || levels[4];
const progress = ((currentKNC - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100;

export default function Growth() {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <section className="mb-6">
        <div className="relative overflow-hidden rounded-xl mb-6">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663433131621/A3XszkVKVy7WNitpyWDbEe/v3-growth-dashboard-5GFcnAjhHFVPvjgFwDnL3L.webp"
            alt="성장 대시보드"
            className="w-full h-40 lg:h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent" />
          <div className="absolute bottom-5 left-5 lg:bottom-8 lg:left-8">
            <span className="text-[10px] uppercase tracking-[0.2em] text-growth font-semibold">
              Growth Dashboard
            </span>
            <h1 className="editorial-heading text-2xl lg:text-3xl text-white mt-1">
              나의 성장
            </h1>
            <p className="text-white/60 text-sm mt-1">
              매일의 노력이 모여 꿈이 됩니다
            </p>
          </div>
        </div>
      </section>

      {/* Level & KNC Overview */}
      <section className="mb-8">
        <div className="dream-card p-5 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={18} className="text-gold" />
                <span className="text-sm font-semibold">Lv.{currentLevel.level} {currentLevel.name}</span>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="editorial-heading text-4xl text-gold">{currentKNC.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">KNC</span>
              </div>
              <div className="w-full h-3 bg-border rounded-full overflow-hidden mb-1">
                <motion.div
                  className="h-full bg-gradient-to-r from-dream to-gold rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                다음 레벨 (Lv.{nextLevel.level} {nextLevel.name})까지{" "}
                <span className="font-bold text-foreground">{(currentLevel.max - currentKNC).toLocaleString()} KNC</span>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:gap-4">
              <div className="text-center">
                <p className="editorial-heading text-2xl text-dream">142</p>
                <p className="text-[10px] text-muted-foreground">총 학습일</p>
              </div>
              <div className="text-center">
                <p className="editorial-heading text-2xl text-coral">23</p>
                <p className="text-[10px] text-muted-foreground">연속 일수</p>
              </div>
              <div className="text-center">
                <p className="editorial-heading text-2xl text-growth">47</p>
                <p className="text-[10px] text-muted-foreground">이야기</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
        <div>
          {/* Learning Heatmap */}
          <section className="mb-8">
            <h2 className="editorial-heading text-lg mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-dream" />
              학습 히트맵
            </h2>
            <hr className="editorial-divider-thick mt-0 mb-4" />
            <div className="ink-card p-4 overflow-x-auto">
              <div className="flex gap-1 min-w-[400px]">
                {heatmapWeeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-1">
                    {week.map((level, di) => (
                      <div
                        key={di}
                        className={`w-3 h-3 lg:w-4 lg:h-4 rounded-sm ${heatColor(level)}`}
                        title={`Week ${wi + 1}, Day ${di + 1}: Level ${level}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
                <span>적음</span>
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((l) => (
                    <div key={l} className={`w-3 h-3 rounded-sm ${heatColor(l)}`} />
                  ))}
                </div>
                <span>많음</span>
              </div>
            </div>
          </section>

          {/* Milestones */}
          <section className="mb-8">
            <h2 className="editorial-heading text-lg mb-4 flex items-center gap-2">
              <Award size={18} className="text-gold" />
              마일스톤
            </h2>
            <hr className="editorial-divider-thick mt-0 mb-4" />
            <div className="grid sm:grid-cols-2 gap-3">
              {milestones.map((m, i) => (
                <motion.div
                  key={i}
                  className={`ink-card p-3 flex items-center gap-3 ${
                    m.achieved ? "bg-dream/5" : "opacity-50"
                  }`}
                  whileHover={m.achieved ? { scale: 1.02 } : {}}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      m.achieved ? "bg-gold/10 text-gold" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <m.icon size={16} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${m.achieved ? "" : "text-muted-foreground"}`}>
                      {m.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{m.date}</p>
                  </div>
                  {m.achieved && (
                    <span className="text-[10px] text-dream font-semibold">달성</span>
                  )}
                </motion.div>
              ))}
            </div>
          </section>

          {/* Credit History */}
          <section className="mb-8">
            <h2 className="editorial-heading text-lg mb-4 flex items-center gap-2">
              <Coins size={18} className="text-gold" />
              크레딧 내역
            </h2>
            <hr className="editorial-divider-thick mt-0 mb-4" />
            <div className="space-y-0 divide-y divide-border">
              {creditHistory.map((item, i) => (
                <div key={i} className="py-3 flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.type === "earn" ? "bg-growth/10 text-growth" : "bg-coral/10 text-coral"
                    }`}
                  >
                    {item.type === "earn" ? <TrendingUp size={14} /> : <Coins size={14} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-[10px] text-muted-foreground">{item.date}</p>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      item.type === "earn" ? "text-growth" : "text-coral"
                    }`}
                  >
                    {item.amount} KNC
                  </span>
                </div>
              ))}
            </div>
            <Link href="/credits">
              <span className="text-xs text-muted-foreground hover:text-foreground ink-link mt-3 block text-center">
                전체 크레딧 내역 보기 →
              </span>
            </Link>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block space-y-6">
          {/* Level Progress */}
          <div className="ink-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-gold" />
              <span className="text-xs font-semibold tracking-wider uppercase">레벨 시스템</span>
            </div>
            <div className="space-y-2">
              {levels.map((l) => (
                <div
                  key={l.level}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    l.level === currentLevel.level ? "bg-dream/10 border border-dream/20" : ""
                  }`}
                >
                  <span
                    className={`text-sm font-mono font-bold w-8 ${
                      l.level <= currentLevel.level ? "text-dream" : "text-muted-foreground/40"
                    }`}
                  >
                    Lv.{l.level}
                  </span>
                  <span
                    className={`text-sm flex-1 ${
                      l.level === currentLevel.level ? "font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {l.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{l.min.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* "다시, 잇다" 성장 카드 */}
          <div className="ink-card p-4 bg-gradient-to-b from-coral/5 to-transparent border-coral/20">
            <div className="flex items-center gap-2 mb-3">
              <Sunrise size={14} className="text-coral" />
              <span className="text-xs font-semibold tracking-wider uppercase text-coral">
                다시, 잇다 · 성장 기록
              </span>
            </div>
            <div className="bg-coral/5 rounded-lg p-3 mb-3">
              <p className="text-xs italic text-center leading-relaxed">
                "두 번째 도전은 실패의 반복이 아니라,<br />성장의 연장이다."
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-white rounded-lg p-2">
                <p className="text-lg font-bold text-coral">{reStarterGrowth.daysActive}</p>
                <p className="text-[10px] text-muted-foreground">다시 걸어온 날</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-lg font-bold text-growth">{reStarterGrowth.improvement}</p>
                <p className="text-[10px] text-muted-foreground">성적 향상</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">
                작년 최고 {reStarterGrowth.prevBestGrade} → 현재 {reStarterGrowth.currentGrade}
              </p>
            </div>
          </div>

          {/* 블록체인 안내 */}
          <div className="ink-card p-4 bg-gold/5 border-gold/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-gold" />
              <span className="text-xs font-semibold tracking-wider uppercase">블록체인 크레딧</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground mb-3">
              KNC는 향후 <span className="font-bold text-foreground">블록체인</span>으로 관리됩니다.
              성장의 기록이 변조 불가능한 형태로 영구 보존됩니다.
            </p>
            <p className="text-[10px] text-muted-foreground italic">
              "크레딧은 점수가 아니라, 성장의 발자국입니다."
            </p>
          </div>

          {/* Quick Actions */}
          <div className="ink-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target size={14} className="text-dream" />
              <span className="text-xs font-semibold tracking-wider uppercase">KNC 얻는 법</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">이야기 작성</span>
                <span className="font-bold text-growth">+30 KNC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">응원 보내기</span>
                <span className="font-bold text-growth">+5 KNC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">연속 7일 보너스</span>
                <span className="font-bold text-growth">+50 KNC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">마일스톤 달성</span>
                <span className="font-bold text-growth">+100 KNC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">리뷰 작성</span>
                <span className="font-bold text-growth">+20 KNC</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
