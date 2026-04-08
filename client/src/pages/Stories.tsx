/*
 * Konnect v3 — 스토리 스트림
 * "게시판"이 아닌 "이야기"의 흐름. 응원 시스템 중심.
 */
import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircleHeart,
  PenLine,
  Award,
  Flame,
  Star,
  TrendingUp,
  Filter,
  ChevronRight,
  Share2,
  Bookmark,
  Users,
  Sunrise,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

const stories = [
  {
    id: 1,
    author: "꿈을향해",
    avatar: "K",
    dream: "서울대 의대",
    title: "모의고사 3등급에서 시작한 나의 이야기",
    content: "6월 모의고사 수학 3등급을 받고 눈앞이 캄캄했다. 하지만 포기하지 않기로 했다. 매일 새벽 5시에 일어나 기출 3회독을 시작했고, 9월 모의고사에서 드디어 2등급을 받았다. 아직 갈 길이 멀지만, 한 걸음씩 나아가고 있다는 게 느껴진다.",
    cheers: 312,
    comments: 67,
    time: "2시간 전",
    tag: "성장기",
    milestone: "수학 2등급 달성",
    cheered: false,
  },
  {
    id: 2,
    author: "미래의사",
    avatar: "M",
    dream: "연세대 의예과",
    title: "꿈이 바뀌어도 괜찮다는 걸 알게 된 날",
    content: "처음엔 변호사가 꿈이었다. 법학 관련 책도 많이 읽고, 토론 대회도 나갔다. 그런데 고2 때 생명과학을 공부하면서 의학에 빠져들었다. 주변에서 '이제 와서 바꾸면 늦는다'고 했지만, 나는 확신했다. 꿈이 바뀐 건 실패가 아니라 성장이었다.",
    cheers: 456,
    comments: 89,
    time: "5시간 전",
    tag: "꿈의 전환",
    milestone: "꿈 재선언",
    cheered: false,
  },
  {
    id: 3,
    author: "끝까지간다",
    avatar: "E",
    dream: "서강대 경영학과",
    title: "D-220, 슬럼프가 왔을 때 나를 구한 한 마디",
    content: "\"지금 힘든 건 네가 성장하고 있다는 증거야.\" 담임 선생님의 이 한 마디가 다시 책상에 앉게 만들었다. 슬럼프는 누구에게나 온다. 중요한 건 그 자리에서 다시 일어나는 것이다.",
    cheers: 234,
    comments: 45,
    time: "8시간 전",
    tag: "응원",
    milestone: "연속 30일 학습",
    cheered: true,
  },
  {
    id: 4,
    author: "수학정복자",
    avatar: "S",
    dream: "KAIST 전산학부",
    title: "수학 5등급에서 1등급까지, 1년의 기록",
    content: "고2 겨울, 수학 5등급이었다. 모두가 불가능하다고 했다. 하지만 나는 기본부터 다시 시작했다. 중학교 수학부터 복습하고, 매일 4시간씩 수학만 팠다. 6개월 만에 3등급, 9개월 만에 2등급, 그리고 11개월 만에 드디어 1등급을 받았다.",
    cheers: 789,
    comments: 156,
    time: "12시간 전",
    tag: "역전 드라마",
    milestone: "수학 1등급 달성",
    cheered: false,
  },
  {
    id: 5,
    author: "꿈꾸는간호사",
    avatar: "N",
    dream: "서울대 간호학과",
    title: "할머니의 병실에서 꿈을 찾았다",
    content: "할머니가 입원하셨을 때, 매일 병원에 갔다. 그때 만난 간호사 선생님의 따뜻한 미소가 아직도 잊히지 않는다. '나도 저런 사람이 되고 싶다.' 그날 이후 내 꿈은 확고해졌다.",
    cheers: 567,
    comments: 98,
    time: "1일 전",
    tag: "꿈의 시작",
    milestone: null,
    cheered: false,
  },
  {
    id: 6,
    author: "다시봄",
    avatar: "D",
    dream: "연세대 의예과",
    title: "두 번째 도전, 이번엔 다르다는 걸 안다",
    content: "작년 수능 후 한 달을 울었다. 하지만 눈물이 마른 자리에 새로운 결심이 피어났다. 이번엔 왜 공부하는지를 먼저 물었다. 그리고 답을 찾았다. 멈춘 게 아니라 숨을 고른 것이었다.",
    cheers: 1023,
    comments: 234,
    time: "3시간 전",
    tag: "다시, 잇다",
    milestone: "꿈 재선언",
    cheered: false,
  },
  {
    id: 7,
    author: "두번째봄꽃",
    avatar: "B",
    dream: "서울대 경제학부",
    title: "작년의 나에게 보내는 편지",
    content: "1년 전의 나에게. 너는 실패한 게 아니야. 다만 아직 준비가 덜 됐을 뿐이었어. 지금의 나는 그때보다 훨씬 단단해졌어. 고마워, 포기하지 않아줘서.",
    cheers: 892,
    comments: 203,
    time: "5시간 전",
    tag: "다시, 잇다",
    milestone: null,
    cheered: false,
  },
  {
    id: 8,
    author: "다시날다",
    avatar: "N",
    dream: "고려대 법학",
    title: "같은 꿈이라도 두 번째는 더 깊다",
    content: "작년에도 고려대 법학이 꿈이었다. 올해도 같은 꿈이다. 하지만 나는 안다, 같은 꿈이 아니라는 걸. 작년의 나는 '가고 싶었고', 올해의 나는 '갈 수 있다'고 믿는다.",
    cheers: 678,
    comments: 156,
    time: "7시간 전",
    tag: "다시, 잇다",
    milestone: "연속 100일 학습",
    cheered: false,
  },
];

const trendingTags = [
  { tag: "다시, 잇다", count: 487 },
  { tag: "성장기", count: 342 },
  { tag: "역전 드라마", count: 289 },
  { tag: "꿈의 전환", count: 234 },
  { tag: "응원", count: 198 },
  { tag: "꿈의 시작", count: 167 },
  { tag: "슬럼프 극복", count: 145 },
];

export default function Stories() {
  const [cheerStates, setCheerStates] = useState<Record<number, boolean>>(
    Object.fromEntries(stories.map((s) => [s.id, s.cheered]))
  );
  const [cheerCounts, setCheerCounts] = useState<Record<number, number>>(
    Object.fromEntries(stories.map((s) => [s.id, s.cheers]))
  );
  const [activeFilter, setActiveFilter] = useState("전체");

  const handleCheer = (id: number) => {
    const wasCheerd = cheerStates[id];
    setCheerStates((prev) => ({ ...prev, [id]: !wasCheerd }));
    setCheerCounts((prev) => ({
      ...prev,
      [id]: wasCheerd ? prev[id] - 1 : prev[id] + 1,
    }));
    if (!wasCheerd) {
      toast.success("응원을 보냈습니다! 💪");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <section className="mb-6">
        <div className="relative overflow-hidden rounded-xl mb-6">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663433131621/A3XszkVKVy7WNitpyWDbEe/v3-story-stream-2Yd1bqQWHNLqJuqkVcP5hS.webp"
            alt="스토리 스트림"
            className="w-full h-40 lg:h-52 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent" />
          <div className="absolute bottom-5 left-5 lg:bottom-8 lg:left-8">
            <span className="text-[10px] uppercase tracking-[0.2em] text-coral font-semibold">
              Story Stream
            </span>
            <h1 className="editorial-heading text-2xl lg:text-3xl text-white mt-1">
              이야기의 강
            </h1>
            <p className="text-white/60 text-sm mt-1">
              게시판이 아닙니다. 꿈을 향한 여정의 이야기입니다.
            </p>
          </div>
        </div>
      </section>

      {/* Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["전체", "다시, 잇다", "성장기", "역전 드라마", "꿈의 전환", "응원", "꿈의 시작"].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
              activeFilter === f
                ? "bg-coral text-white font-semibold"
                : "bg-secondary text-muted-foreground hover:bg-accent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
        <div>
          {/* Write CTA */}
          <Link href="/write">
            <div className="mb-6 p-4 border border-dashed border-coral/30 rounded-lg flex items-center gap-3 hover:bg-coral/5 transition-colors group">
              <div className="w-10 h-10 bg-coral/10 text-coral rounded-full flex items-center justify-center">
                <PenLine size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">나의 이야기를 들려주세요</p>
                <p className="text-xs text-muted-foreground">
                  당신의 한 줄이 누군가에게 큰 힘이 됩니다
                </p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground group-hover:text-coral transition-colors" />
            </div>
          </Link>

          {/* Story Feed */}
          <div className="space-y-0 divide-y divide-border">
            {stories
              .filter((s) => activeFilter === "전체" || s.tag === activeFilter)
              .map((story) => (
                <motion.div
                  key={story.id}
                  className="py-6 first:pt-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {/* Author */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-9 h-9 bg-dream/10 text-dream rounded-full flex items-center justify-center text-sm font-bold">
                      {story.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{story.author}</span>
                        <span className="text-[10px] text-dream bg-dream/10 px-1.5 py-0.5 rounded">
                          {story.dream}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{story.time}</span>
                    </div>
                  </div>

                  {/* Milestone */}
                  {story.milestone && (
                    <div className="flex items-center gap-1.5 mb-2 bg-gold/10 px-3 py-1.5 rounded-lg w-fit">
                      <Award size={12} className="text-gold" />
                      <span className="text-[10px] font-semibold text-gold">
                        🎉 마일스톤 달성: {story.milestone}
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <h3 className="editorial-heading text-lg mb-2">{story.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {story.content}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-4">
                    <span className={`ink-tag text-[10px] ${story.tag === '다시, 잇다' ? '!bg-coral/10 !text-coral !border-coral/20' : ''}`}>
                      {story.tag === '다시, 잇다' && <Sunrise size={8} className="inline mr-0.5" />}
                      {story.tag}
                    </span>
                    <button
                      onClick={() => handleCheer(story.id)}
                      className={`flex items-center gap-1.5 text-sm font-semibold transition-all ${
                        cheerStates[story.id]
                          ? "text-coral"
                          : "text-muted-foreground hover:text-coral"
                      }`}
                    >
                      <Heart
                        size={16}
                        className={cheerStates[story.id] ? "fill-coral" : ""}
                      />
                      {cheerCounts[story.id]} 응원
                    </button>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MessageCircleHeart size={16} /> {story.comments}
                    </span>
                    <button
                      className="ml-auto text-muted-foreground hover:text-foreground"
                      onClick={() => toast.info("북마크 기능은 준비 중입니다")}
                    >
                      <Bookmark size={16} />
                    </button>
                    <button
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => toast.info("공유 기능은 준비 중입니다")}
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block space-y-6">
          {/* "다시, 잇다" 사이드바 카드 */}
          <div className="ink-card p-4 bg-gradient-to-b from-coral/5 to-transparent border-coral/20">
            <div className="flex items-center gap-2 mb-3">
              <Sunrise size={14} className="text-coral" />
              <span className="text-xs font-semibold tracking-wider uppercase text-coral">
                다시, 잇다
              </span>
            </div>
            <div className="bg-coral/5 rounded-lg p-3 mb-3">
              <p className="text-xs italic text-center leading-relaxed">
                "멈춘 것이 아니다.<br />더 멀리 뛰기 위해 숨을 고른 것이다."
              </p>
            </div>
            <div className="text-center mb-3">
              <p className="editorial-heading text-2xl text-coral">4,237</p>
              <p className="text-[10px] text-muted-foreground">명이 다시 꿈을 잇고 있습니다</p>
            </div>
            <button
              onClick={() => setActiveFilter('다시, 잇다')}
              className="flex items-center justify-center gap-1.5 w-full py-2 bg-coral text-white text-xs font-semibold rounded-lg hover:bg-coral/90 transition-colors"
            >
              <RotateCcw size={12} />
              다시, 잇다 이야기만 보기
            </button>
          </div>

          {/* Trending Tags */}
          <div className="ink-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-coral" />
              <span className="text-xs font-semibold tracking-wider uppercase">인기 태그</span>
            </div>
            <div className="space-y-2">
              {trendingTags.map((t, i) => (
                <button
                  key={t.tag}
                  onClick={() => setActiveFilter(t.tag)}
                  className="w-full flex items-center gap-2.5 py-1 group"
                >
                  <span className="text-lg font-mono font-bold text-muted-foreground/40 w-5 text-right shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm group-hover:text-coral transition-colors flex-1 text-left">
                    #{t.tag}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{t.count}편</span>
                </button>
              ))}
            </div>
          </div>

          {/* 오늘의 응원 */}
          <div className="ink-card p-4 bg-coral/5 border-coral/20">
            <div className="flex items-center gap-2 mb-3">
              <Heart size={14} className="text-coral" />
              <span className="text-xs font-semibold tracking-wider uppercase">오늘의 응원</span>
            </div>
            <div className="text-center py-3">
              <p className="editorial-heading text-3xl text-coral">2,847</p>
              <p className="text-xs text-muted-foreground mt-1">개의 응원이 오갔습니다</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-dream">523</p>
                <p className="text-[10px] text-muted-foreground">보낸 응원</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-coral">1,847</p>
                <p className="text-[10px] text-muted-foreground">받은 응원</p>
              </div>
            </div>
          </div>

          {/* 이야기 통계 */}
          <div className="ink-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={14} className="text-gold" />
              <span className="text-xs font-semibold tracking-wider uppercase">이야기 통계</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">전체 이야기</span>
                <span className="font-bold">12,847편</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">오늘 작성</span>
                <span className="font-bold text-coral">47편</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">활동 작성자</span>
                <span className="font-bold">3,421명</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
