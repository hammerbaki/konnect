/*
 * Konnect v3 — 나의 여정 페이지
 * 꿈 선언부터 현재까지의 성장 경로를 시각화
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Star,
  Calendar,
  TrendingUp,
  Award,
  Target,
  Heart,
  BookOpen,
  Monitor,
  MapPin,
  ChevronRight,
  Flame,
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sunrise,
} from "lucide-react";

const journeyPhases = [
  {
    phase: "꿈의 시작",
    date: "2025.12",
    status: "completed" as const,
    events: [
      { text: "Konnect 가입", done: true },
      { text: "꿈 선언: 서울대 의대", done: true },
      { text: "첫 이야기 작성", done: true },
    ],
  },
  {
    phase: "기반 다지기",
    date: "2026.01–02",
    status: "completed" as const,
    events: [
      { text: "수학 인강 선택 (현우진 뉴런)", done: true },
      { text: "생명과학 문제집 시작 (개념원리)", done: true },
      { text: "연속 30일 학습 달성", done: true },
      { text: "꿈 동료 100명 돌파", done: true },
    ],
  },
  {
    phase: "성장의 가속",
    date: "2026.03–04",
    status: "active" as const,
    events: [
      { text: "3월 모의고사 분석 완료", done: true },
      { text: "AI 경로 추천 확인", done: true },
      { text: "수학 2등급 → 1등급 목표", done: false },
      { text: "세특 주제 선정", done: false },
    ],
  },
  {
    phase: "실전 준비",
    date: "2026.05–08",
    status: "upcoming" as const,
    events: [
      { text: "6월 모의고사 목표 설정", done: false },
      { text: "수시 원서 전략 수립", done: false },
      { text: "자기소개서 초안 작성", done: false },
    ],
  },
  {
    phase: "최종 도전",
    date: "2026.09–11",
    status: "upcoming" as const,
    events: [
      { text: "수시 원서 접수", done: false },
      { text: "면접 준비", done: false },
      { text: "수능 D-Day", done: false },
    ],
  },
];

const weeklyGoals = [
  { goal: "수학 기출 3회독 (2024학년도)", done: true, category: "수학" },
  { goal: "생명과학 개념 정리 (유전)", done: true, category: "생명과학" },
  { goal: "국어 비문학 매일 3지문", done: false, category: "국어" },
  { goal: "영어 어휘 하루 50개", done: false, category: "영어" },
];

const studyStats = [
  { label: "총 학습일", value: "142일", icon: Calendar },
  { label: "연속 학습", value: "23일", icon: Flame },
  { label: "작성 이야기", value: "47편", icon: BookOpen },
  { label: "받은 응원", value: "1,847", icon: Heart },
];

export default function Journey() {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <section className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.2em] text-dream font-semibold">
          My Journey
        </span>
        <h1 className="editorial-heading text-2xl lg:text-3xl mt-1">나의 여정</h1>
        <p className="text-sm text-muted-foreground mt-1">
          꿈을 선언한 그날부터 오늘까지, 나의 성장 경로를 한눈에 봅니다.
        </p>
        <hr className="editorial-divider-thick mt-4" />
      </section>

      {/* Stats Bar */}
      <section className="mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {studyStats.map((stat) => (
            <div key={stat.label} className="ink-card p-4 text-center">
              <stat.icon size={20} className="mx-auto text-dream mb-2" />
              <p className="editorial-heading text-xl">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
        <div>
          {/* Journey Timeline */}
          <section className="mb-8">
            <h2 className="editorial-heading text-lg mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-dream" />
              여정 타임라인
            </h2>
            <hr className="editorial-divider-thick mt-0 mb-4" />

            <div className="space-y-0">
              {journeyPhases.map((phase, i) => (
                <motion.div
                  key={i}
                  className="flex gap-4 pb-8 last:pb-0"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        phase.status === "completed"
                          ? "bg-dream border-dream"
                          : phase.status === "active"
                          ? "bg-coral border-coral animate-pulse"
                          : "bg-transparent border-muted-foreground/30"
                      }`}
                    />
                    {i < journeyPhases.length - 1 && (
                      <div
                        className={`w-px flex-1 mt-1 ${
                          phase.status === "completed" ? "bg-dream" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <h3
                        className={`text-base font-semibold ${
                          phase.status === "active" ? "text-coral" : ""
                        }`}
                      >
                        {phase.phase}
                      </h3>
                      <span className="text-[10px] text-muted-foreground">{phase.date}</span>
                      {phase.status === "active" && (
                        <span className="text-[10px] bg-coral/10 text-coral px-1.5 py-0.5 rounded font-semibold">
                          현재
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {phase.events.map((event, j) => (
                        <div key={j} className="flex items-center gap-2">
                          {event.done ? (
                            <CheckCircle2 size={14} className="text-dream shrink-0" />
                          ) : (
                            <Circle size={14} className="text-muted-foreground/30 shrink-0" />
                          )}
                          <span
                            className={`text-sm ${
                              event.done ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {event.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* 이번 주 목표 */}
          <section className="mb-8">
            <h2 className="editorial-heading text-lg mb-4 flex items-center gap-2">
              <Target size={18} className="text-coral" />
              이번 주 목표
            </h2>
            <hr className="editorial-divider-thick mt-0 mb-4" />
            <div className="space-y-2">
              {weeklyGoals.map((goal, i) => (
                <div
                  key={i}
                  className={`ink-card p-3 flex items-center gap-3 ${
                    goal.done ? "bg-dream/5" : ""
                  }`}
                >
                  {goal.done ? (
                    <CheckCircle2 size={18} className="text-dream shrink-0" />
                  ) : (
                    <Circle size={18} className="text-muted-foreground/30 shrink-0" />
                  )}
                  <span
                    className={`text-sm flex-1 ${
                      goal.done ? "line-through text-muted-foreground" : "font-medium"
                    }`}
                  >
                    {goal.goal}
                  </span>
                  <span className="ink-tag text-[10px]">{goal.category}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block space-y-6">
          <div className="dream-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star size={14} className="text-dream" />
              <span className="text-xs font-semibold tracking-wider uppercase text-dream">
                현재 꿈
              </span>
            </div>
            <p className="editorial-heading text-base mb-2">
              "서울대 의대에서 희귀질환을 연구하겠다"
            </p>
            <p className="text-xs text-muted-foreground">142일째 · 꿈 동료 312명</p>
            <Link href="/dream">
              <span className="text-xs text-dream hover:underline mt-2 block">꿈 페이지 →</span>
            </Link>
          </div>

          <div className="ink-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award size={14} className="text-gold" />
              <span className="text-xs font-semibold tracking-wider uppercase">달성 마일스톤</span>
            </div>
            <div className="space-y-2">
              {["연속 30일 학습", "꿈 동료 100명", "이야기 응원 300", "Lv.3 달성"].map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Award size={12} className="text-gold" />
                  <span className="text-sm">{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* "다시, 잇다" 사이드바 카드 */}
          <div className="ink-card p-4 bg-gradient-to-b from-coral/5 to-transparent border-coral/20">
            <div className="flex items-center gap-2 mb-3">
              <Sunrise size={14} className="text-coral" />
              <span className="text-xs font-semibold tracking-wider uppercase text-coral">
                다시, 잇다
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground mb-3">
              여정이 다시 시작된 것은 <span className="font-bold text-coral">용기</span>의 증거입니다.
              작년의 경험이 올해의 나침반이 됩니다.
            </p>
            <div className="bg-coral/5 rounded-lg p-3 text-center">
              <p className="text-xs italic">
                "멈춘 것이 아니다.<br />더 멀리 뛰기 위해 숨을 고른 것이다."
              </p>
            </div>
          </div>

          <div className="ink-card p-4 bg-dream/5 border-dream/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-dream" />
              <span className="text-xs font-semibold tracking-wider uppercase">AI 분석</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              현재 진행률 <span className="font-bold text-dream">62%</span>입니다.
              수학 1등급 달성이 다음 핵심 목표입니다.
            </p>
            <Link href="/explore">
              <span className="flex items-center justify-center gap-1.5 w-full py-2 mt-3 bg-dream text-white text-sm font-semibold rounded-lg hover:bg-dream/90 transition-colors">
                경로 재분석 <ArrowRight size={14} />
              </span>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
