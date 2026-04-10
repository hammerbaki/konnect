/**
 * Konnect v3 — 다시, 잇다 전용 페이지
 * Design: Editorial Ink & Paper — "다시, 잇다" 철학 선언 + 재도전 동료 + 스토리 + 성장 증명 + 멘토 연결
 * 이 페이지는 Konnect의 핵심 정체성을 정의하는 철학 페이지입니다.
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Sunrise,
  Heart,
  TrendingUp,
  Users,
  Star,
  ArrowRight,
  Quote,
  Flame,
  Award,
  BookOpen,
  MessageCircleHeart,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Calendar,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";

/* ── 성장 증명 데이터 ── */
const growthProofs = [
  {
    nickname: "다시봄",
    avatar: "D",
    dream: "연세대 의예과",
    before: { grade: "4등급", year: "2025 수능" },
    after: { grade: "1등급", year: "2026 6월 모의" },
    story: "작년 수능 후 한 달을 울었다. 하지만 눈물이 마른 자리에 새로운 결심이 피어났다.",
    days: 245,
    cheers: 567,
    color: "coral",
  },
  {
    nickname: "두번째봄꽃",
    avatar: "B",
    dream: "서울대 경제학부",
    before: { grade: "3등급", year: "2025 수능" },
    after: { grade: "1등급", year: "2026 3월 모의" },
    story: "1년 전의 나에게. 너는 실패한 게 아니야. 다만 아직 준비가 덜 됐을 뿐이었어.",
    days: 312,
    cheers: 892,
    color: "dream",
  },
  {
    nickname: "다시날다",
    avatar: "N",
    dream: "고려대 법학",
    before: { grade: "3등급", year: "2025 수능" },
    after: { grade: "2등급", year: "2026 3월 모의" },
    story: "같은 꿈이라도 두 번째는 더 깊다. 작년의 나는 '가고 싶었고', 올해의 나는 '갈 수 있다'고 믿는다.",
    days: 198,
    cheers: 456,
    color: "gold",
  },
];

/* ── 멘토 데이터 (합격한 재도전자) ── */
const mentors = [
  {
    nickname: "봄을건넌사람",
    avatar: "S",
    university: "서울대 의대",
    year: "2025 합격",
    attempt: "2수",
    specialty: "수학 · 과학탐구",
    message: "두 번째 수능날 아침, 나는 떨리지 않았다. 준비가 되어 있었으니까.",
    sessions: 47,
    rating: 4.9,
  },
  {
    nickname: "다시핀꽃",
    avatar: "H",
    university: "연세대 경영학과",
    year: "2025 합격",
    attempt: "3수",
    specialty: "국어 · 영어",
    message: "세 번째 도전에서 배운 건, 실력보다 중요한 건 멘탈이라는 것.",
    sessions: 62,
    rating: 4.8,
  },
  {
    nickname: "새벽을아는사람",
    avatar: "J",
    university: "고려대 법학",
    year: "2025 합격",
    attempt: "2수",
    specialty: "사회탐구 · 자소서",
    message: "재수 시절 새벽 5시의 독서실이 나를 만들었다.",
    sessions: 35,
    rating: 4.9,
  },
];

/* ── 명언 ── */
const quotes = [
  { text: "멈춘 것이 아니다. 더 멀리 뛰기 위해 숨을 고른 것이다.", author: "다시봄" },
  { text: "같은 꿈이라도 두 번째는 더 깊다.", author: "다시날다" },
  { text: "작년의 눈물이 올해의 잉크가 되었다.", author: "두번째봄꽃" },
  { text: "실패는 끝이 아니라, 더 나은 시작의 서막이다.", author: "봄을건넌사람" },
];

/* ── 통계 ── */
const stats = [
  { label: "다시 꿈꾸는 사람", value: "4,237", icon: Users, suffix: "명" },
  { label: "평균 성적 향상", value: "1.8", icon: TrendingUp, suffix: "등급" },
  { label: "합격 선배 멘토", value: "127", icon: Star, suffix: "명" },
  { label: "나눈 응원", value: "52,847", icon: Heart, suffix: "개" },
];

export default function ReConnect() {
  usePageTitle("다시 연결 — Konnect", "그룹 초대를 수락하고 멘토·멘티와 연결하세요.");
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-0">
      {/* ═══════════════════════════════════════════════════
          HERO — 풀 와이드 감성 히어로
      ═══════════════════════════════════════════════════ */}
      <section className="relative -mx-4 lg:-mx-6 mb-10 overflow-hidden rounded-none lg:rounded-2xl">
        <div className="relative h-[340px] lg:h-[420px]">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663433131621/A3XszkVKVy7WNitpyWDbEe/v3-reconnect-hero-S6XEENqzD39mZVrUCYmwTD.webp"
            alt="다시, 잇다"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-[10px] uppercase tracking-[0.3em] text-coral/90 font-semibold mb-2 block">
                Re:Connect
              </span>
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-3" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
                다시, 잇다.
              </h1>
              <p className="text-base lg:text-lg text-white/80 max-w-xl leading-relaxed mb-6">
                끊어진 줄 알았던 꿈을, 다시 이어가는 사람들.<br />
                멈춘 것이 아니다. 더 멀리 뛰기 위해 숨을 고른 것이다.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/dream">
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral text-white text-sm font-semibold rounded-lg hover:bg-coral/90 transition-all">
                    <Sunrise size={16} />
                    나도 다시, 잇다
                  </span>
                </Link>
                <a href="#stories" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur text-white text-sm font-semibold rounded-lg border border-white/20 hover:bg-white/20 transition-all">
                  이야기 둘러보기
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          STATS BAR — 핵심 수치
      ═══════════════════════════════════════════════════ */}
      <section className="mb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="ink-card p-4 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <stat.icon size={20} className="mx-auto text-coral mb-2" />
              <p className="editorial-heading text-2xl lg:text-3xl">
                {stat.value}<span className="text-sm text-muted-foreground ml-1">{stat.suffix}</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          철학 선언 — 왜 "다시, 잇다"인가
      ═══════════════════════════════════════════════════ */}
      <section className="mb-12">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[10px] uppercase tracking-[0.2em] text-coral font-semibold">
            Our Philosophy
          </span>
          <h2 className="editorial-heading text-2xl lg:text-3xl mt-2 mb-4">
            왜 "다시, 잇다"인가
          </h2>
          <hr className="editorial-divider-thick mx-auto w-16 mb-6" />
          <div className="space-y-4 text-sm lg:text-base text-muted-foreground leading-relaxed">
            <p>
              세상은 재도전을 <span className="font-semibold text-foreground">"실패의 연장"</span>이라 부릅니다.
              하지만 우리는 다르게 봅니다.
            </p>
            <p className="text-lg lg:text-xl font-semibold text-foreground" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
              "다시 시작하는 것은 실패가 아니라,<br />
              더 깊은 이해의 시작이다."
            </p>
            <p>
              작년의 경험은 올해의 <span className="font-semibold text-coral">나침반</span>이 됩니다.
              한 번 걸어본 길이기에, 이번엔 어디서 멈추고 어디서 달려야 하는지 압니다.
              Konnect는 그 여정을 함께합니다.
            </p>
          </div>
        </div>
      </section>

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
        <div>
          {/* ═══════════════════════════════════════════════════
              성장 증명 — Before & After
          ═══════════════════════════════════════════════════ */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={18} className="text-coral" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-coral font-semibold">
                Growth Proof
              </span>
            </div>
            <h2 className="editorial-heading text-xl lg:text-2xl mb-1">성장의 증명</h2>
            <p className="text-sm text-muted-foreground mb-4">
              다시 도전한 사람들의 실제 성적 변화
            </p>
            <hr className="editorial-divider-thick mb-6" />

            <div className="space-y-4">
              {growthProofs.map((proof, i) => (
                <motion.div
                  key={i}
                  className="ink-card p-5 hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${
                      proof.color === "coral" ? "bg-coral" : proof.color === "dream" ? "bg-dream" : "bg-gold"
                    }`}>
                      {proof.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{proof.nickname}</span>
                        <span className="ink-tag text-[10px] bg-coral/10 text-coral border-coral/20">
                          다시, 잇다
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{proof.dream} · {proof.days}일째</p>

                      {/* Before → After 카드 */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 bg-muted/50 rounded-lg p-3 text-center">
                          <p className="text-[10px] text-muted-foreground mb-1">{proof.before.year}</p>
                          <p className="text-xl font-bold text-muted-foreground">{proof.before.grade}</p>
                        </div>
                        <div className="shrink-0">
                          <ArrowRight size={20} className="text-coral" />
                        </div>
                        <div className="flex-1 bg-coral/5 border border-coral/20 rounded-lg p-3 text-center">
                          <p className="text-[10px] text-coral mb-1">{proof.after.year}</p>
                          <p className="text-xl font-bold text-coral">{proof.after.grade}</p>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground italic leading-relaxed">
                        "{proof.story}"
                      </p>

                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart size={12} className="text-coral" /> {proof.cheers} 응원
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {proof.days}일째 도전 중
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════
              다시, 잇다 스토리 피드
          ═══════════════════════════════════════════════════ */}
          <section className="mb-10" id="stories">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={18} className="text-coral" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-coral font-semibold">
                Re:Stories
              </span>
            </div>
            <h2 className="editorial-heading text-xl lg:text-2xl mb-1">다시, 잇다 이야기</h2>
            <p className="text-sm text-muted-foreground mb-4">
              다시 도전하는 사람들이 나누는 진솔한 이야기
            </p>
            <hr className="editorial-divider-thick mb-6" />

            <div className="space-y-4">
              {[
                {
                  avatar: "D", nickname: "다시봄", dream: "연세대 의예과", time: "3시간 전",
                  title: "두 번째 도전, 이번엔 다르다는 걸 안다",
                  body: "작년 수능 후 한 달을 울었다. 하지만 눈물이 마른 자리에 새로운 결심이 피어났다. 이번엔 왜 공부하는지를 먼저 물었다. 그리고 답을 찾았다. 멈춘 게 아니라 숨을 고른 것이었다. 올해의 나는 작년보다 훨씬 단단하다.",
                  cheers: 567, comments: 134, tag: "꿈 재선언",
                },
                {
                  avatar: "B", nickname: "두번째봄꽃", dream: "서울대 경제학부", time: "5시간 전",
                  title: "작년의 나에게 보내는 편지",
                  body: "1년 전의 나에게. 너는 실패한 게 아니야. 다만 아직 준비가 덜 됐을 뿐이었어. 지금의 나는 그때보다 훨씬 단단해졌어. 매일 새벽 5시에 일어나는 게 더 이상 힘들지 않아. 고마워, 포기하지 않아줘서.",
                  cheers: 892, comments: 203, tag: "성장 일기",
                },
                {
                  avatar: "N", nickname: "다시날다", dream: "고려대 법학", time: "7시간 전",
                  title: "같은 꿈이라도 두 번째는 더 깊다",
                  body: "작년에도 고려대 법학이 꿈이었다. 올해도 같은 꿈이다. 하지만 나는 안다, 같은 꿈이 아니라는 걸. 작년의 나는 '가고 싶었고', 올해의 나는 '갈 수 있다'고 믿는다. 그 차이가 모든 것을 바꾼다.",
                  cheers: 456, comments: 89, tag: "마인드셋",
                },
                {
                  avatar: "W", nickname: "다시쓰는이야기", dream: "성균관대 글로벌경영", time: "12시간 전",
                  title: "엄마에게 미안하다고 했더니",
                  body: "재수를 결심하고 엄마에게 미안하다고 했다. 엄마는 웃으면서 말했다. '미안하긴, 네가 다시 일어서는 모습이 엄마는 더 자랑스러워.' 그 말 한마디에 다시 책상에 앉을 수 있었다. 이번엔 나를 위해서, 그리고 엄마를 위해서.",
                  cheers: 1247, comments: 312, tag: "가족",
                },
              ].map((story, i) => (
                <motion.div
                  key={i}
                  className="ink-card p-5 hover:shadow-md transition-shadow cursor-pointer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center text-coral font-bold">
                      {story.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{story.nickname}</span>
                        <span className="ink-tag text-[10px] bg-coral/10 text-coral border-coral/20">
                          다시, 잇다
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{story.dream} · {story.time}</p>
                    </div>
                    <span className="ink-tag text-[10px]">{story.tag}</span>
                  </div>
                  <h3 className="font-semibold mb-2">{story.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {story.body}
                  </p>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart size={12} className="text-coral" /> {story.cheers} 응원
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircleHeart size={12} /> {story.comments} 댓글
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <Link href="/stories">
              <span className="flex items-center justify-center gap-2 w-full py-3 mt-4 ink-card text-sm font-semibold text-coral hover:bg-coral/5 transition-colors">
                다시, 잇다 이야기 더 보기 <ArrowRight size={14} />
              </span>
            </Link>
          </section>

          {/* ═══════════════════════════════════════════════════
              선배 멘토 연결
          ═══════════════════════════════════════════════════ */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-1">
              <Star size={18} className="text-gold" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold">
                Mentors
              </span>
            </div>
            <h2 className="editorial-heading text-xl lg:text-2xl mb-1">합격한 선배들</h2>
            <p className="text-sm text-muted-foreground mb-4">
              같은 길을 먼저 걸어간 선배들이 기다리고 있습니다
            </p>
            <hr className="editorial-divider-thick mb-6" />

            <div className="relative mb-6 rounded-xl overflow-hidden">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663433131621/A3XszkVKVy7WNitpyWDbEe/v3-reconnect-mentor-TvRMKbsDLUprEK9un7eLMS.webp"
                alt="멘토링"
                className="w-full h-48 lg:h-56 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white text-sm lg:text-base font-semibold" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
                  "두 번째 봄의 멘토링"
                </p>
                <p className="text-white/70 text-xs mt-1">
                  같은 경험을 한 선배만이 줄 수 있는 진짜 조언
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {mentors.map((mentor, i) => (
                <motion.div
                  key={i}
                  className="ink-card p-4 hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-gold/10 flex items-center justify-center text-gold font-bold shrink-0">
                      {mentor.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{mentor.nickname}</span>
                        <span className="ink-tag text-[10px] bg-gold/10 text-gold border-gold/20">
                          {mentor.attempt} 합격
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {mentor.university} · {mentor.year} · 전문: {mentor.specialty}
                      </p>
                      <p className="text-sm italic text-muted-foreground mb-2">
                        "{mentor.message}"
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageCircleHeart size={10} /> {mentor.sessions}회 상담
                          </span>
                          <span className="flex items-center gap-1">
                            <Star size={10} className="text-gold fill-gold" /> {mentor.rating}
                          </span>
                        </div>
                        <button
                          className="text-xs font-semibold text-gold hover:underline"
                          onClick={() => {
                            toast("멘토 연결 기능은 곧 오픈됩니다!", { description: "사전 신청을 해두시면 우선 매칭해 드려요." });
                          }}
                        >
                          상담 신청 →
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* ═══════════════════════════════════════════════════
            SIDEBAR (PC only)
        ═══════════════════════════════════════════════════ */}
        <aside className="hidden lg:block space-y-6">
          {/* 오늘의 명언 */}
          <div className="ink-card p-5 bg-gradient-to-b from-coral/5 to-transparent border-coral/20">
            <div className="flex items-center gap-2 mb-3">
              <Quote size={14} className="text-coral" />
              <span className="text-xs font-semibold tracking-wider uppercase text-coral">
                오늘의 한 마디
              </span>
            </div>
            <div className="space-y-4">
              {quotes.slice(0, 2).map((q, i) => (
                <div key={i} className="bg-coral/5 rounded-lg p-3">
                  <p className="text-sm italic leading-relaxed">"{q.text}"</p>
                  <p className="text-[10px] text-coral mt-1.5">— {q.author}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 나도 다시, 잇다 CTA */}
          <div className="dream-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sunrise size={14} className="text-coral" />
              <span className="text-xs font-semibold tracking-wider uppercase text-coral">
                함께하기
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground mb-3">
              다시 도전하는 당신은 혼자가 아닙니다.
              <span className="font-bold text-coral"> 4,237명</span>의 동료가
              같은 길을 걷고 있습니다.
            </p>
            <Link href="/dream">
              <span className="flex items-center justify-center gap-2 w-full py-2.5 bg-coral text-white text-sm font-semibold rounded-lg hover:bg-coral/90 transition-colors">
                <Sunrise size={14} />
                나도 다시, 잇다
              </span>
            </Link>
          </div>

          {/* 이번 달 성장 리포트 */}
          <div className="ink-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={14} className="text-coral" />
              <span className="text-xs font-semibold tracking-wider uppercase">
                이번 달 성장
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">신규 합류</span>
                <span className="font-bold text-coral">+312명</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">작성된 이야기</span>
                <span className="font-bold">487편</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">나눈 응원</span>
                <span className="font-bold">12,847개</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">멘토 상담</span>
                <span className="font-bold text-gold">234회</span>
              </div>
              <hr className="border-border/50" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">평균 성적 향상</span>
                <span className="font-bold text-coral text-lg">1.8등급 ↑</span>
              </div>
            </div>
          </div>

          {/* 다시, 잇다 배지 */}
          <div className="ink-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Award size={14} className="text-gold" />
              <span className="text-xs font-semibold tracking-wider uppercase">
                다시, 잇다 배지
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: "첫 재선언", icon: "🌅", desc: "꿈을 다시 선언" },
                { name: "30일 연속", icon: "🔥", desc: "30일 연속 학습" },
                { name: "응원 100", icon: "💛", desc: "응원 100개 달성" },
                { name: "멘토 연결", icon: "🤝", desc: "선배 멘토 상담" },
                { name: "1등급 달성", icon: "⭐", desc: "과목 1등급 달성" },
                { name: "이야기꾼", icon: "📖", desc: "이야기 10편 작성" },
              ].map((badge, i) => (
                <div key={i} className="bg-muted/30 rounded-lg p-2.5 text-center">
                  <span className="text-lg block mb-1">{badge.icon}</span>
                  <p className="text-[10px] font-semibold">{badge.name}</p>
                  <p className="text-[9px] text-muted-foreground">{badge.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 커뮤니티 가이드라인 */}
          <div className="ink-card p-5 bg-muted/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-dream" />
              <span className="text-xs font-semibold tracking-wider uppercase">
                우리의 약속
              </span>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <p>• "재수생"이라는 말 대신 <span className="font-semibold text-coral">"다시 꿈꾸는 사람"</span>이라 부릅니다.</p>
              <p>• 비교하지 않습니다. 각자의 속도가 있습니다.</p>
              <p>• 응원은 아끼지 않되, 조언은 겸손하게.</p>
              <p>• 꿈이 바뀌는 것은 <span className="font-semibold text-dream">성장</span>입니다.</p>
            </div>
          </div>
        </aside>
      </div>

      {/* ═══════════════════════════════════════════════════
          BOTTOM CTA — 풀 와이드
      ═══════════════════════════════════════════════════ */}
      <section className="mb-8 mt-4">
        <div className="ink-card p-8 lg:p-12 text-center bg-gradient-to-br from-coral/5 via-transparent to-dream/5 border-coral/10">
          <Sunrise size={32} className="mx-auto text-coral mb-4" />
          <h2 className="editorial-heading text-2xl lg:text-3xl mb-3">
            다시 시작하는 당신에게
          </h2>
          <p className="text-sm lg:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed mb-6" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
            "어제의 실패는 오늘의 나를 만든 재료입니다.<br />
            당신이 다시 일어선 그 순간,<br />
            이미 절반은 이긴 것입니다."
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/dream">
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-coral text-white font-semibold rounded-lg hover:bg-coral/90 transition-all">
                <Sunrise size={16} />
                나의 꿈 다시 선언하기
              </span>
            </Link>
            <Link href="/stories">
              <span className="inline-flex items-center gap-2 px-6 py-3 border-2 border-coral/30 text-coral font-semibold rounded-lg hover:bg-coral/5 transition-all">
                동료들의 이야기 보기
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
