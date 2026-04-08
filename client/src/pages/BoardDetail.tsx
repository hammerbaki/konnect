/*
 * 3안 최종 — 보드 상세 페이지
 * 상위 탭 5개: 게시판 | 적성 발견 | 목표 달성 | 면접 후기 | 합격 수기
 * 사이드바: 무료/유료(Premium) 뱃지 구분
 * 계열 보드 메타데이터
 */
import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, Search, Users, FileText, Heart, MessageSquare,
  Eye, Pin, Flame, Clock, ChevronLeft, ChevronRight, PenLine,
  Star, Award, Target, Brain, Mic, FileEdit, Compass, Route,
  CalendarClock, Sparkles, ChevronDown, Zap, Crown,
  ClipboardCheck, BookOpen, Trophy, GraduationCap,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

/* ─── Board Metadata (계열 보드 중심) ─── */
type BoardMeta = {
  name: string;
  icon: string;
  description: string;
  members: number;
  posts: number;
  type: "계열" | "특수";
  includes?: string;
  interviewTopics?: string[];
  docTypes?: string[];
  ddays?: { label: string; date: string }[];
};

const boardsMeta: Record<string, BoardMeta> = {
  "med-pharm": {
    name: "의·약학 계열", icon: "🏥",
    description: "의대, 약대, 간호대를 꿈꾸는 사람들의 공간",
    members: 3872, posts: 14260, type: "계열",
    includes: "의예과 · 약학 · 간호학 · 의사",
    interviewTopics: ["MMI 다중미니면접", "의학 윤리 시나리오", "과학적 사고력 평가", "상황 판단"],
    docTypes: ["자기소개서", "학업계획서", "의학 에세이"],
    ddays: [{ label: "수능", date: "2026-11-12" }, { label: "의대 면접 시즌", date: "2026-11-25" }],
  },
  engineering: {
    name: "공학 계열", icon: "💻",
    description: "공대 입시와 엔지니어 진로를 함께 준비합니다",
    members: 3420, posts: 15000, type: "계열",
    includes: "컴퓨터공학 · 전자공학 · 기계공학 · 개발자 · 연구원",
    interviewTopics: ["기술 면접", "코딩 구술", "프로젝트 발표", "수학·과학 구술"],
    docTypes: ["자기소개서", "포트폴리오", "연구계획서"],
    ddays: [{ label: "수능", date: "2026-11-12" }, { label: "KAIST 원서접수", date: "2026-09-15" }],
  },
  "business-econ": {
    name: "경영·경제 계열", icon: "📊",
    description: "경영·경제 분야 입시 전략과 진로 탐색",
    members: 2180, posts: 9400, type: "계열",
    includes: "경영학 · 경제학 · 회계학 · 금융",
    interviewTopics: ["시사 면접", "경제 이슈", "리더십 경험", "논리적 사고"],
    docTypes: ["자기소개서", "학업계획서"],
    ddays: [{ label: "수능", date: "2026-11-12" }],
  },
  "law-admin": {
    name: "법·행정 계열", icon: "⚖️",
    description: "법조인과 행정 전문가를 꿈꾸는 공간",
    members: 1990, posts: 8700, type: "계열",
    includes: "법학 · 행정학 · 변호사 · 공무원",
    interviewTopics: ["법적 사고력", "시사 이슈", "논리적 추론", "윤리 딜레마"],
    docTypes: ["자기소개서", "학업계획서"],
    ddays: [{ label: "수능", date: "2026-11-12" }],
  },
  "natural-sci": {
    name: "자연과학 계열", icon: "🔬",
    description: "자연과학 탐구와 연구자 진로 준비",
    members: 1560, posts: 6800, type: "계열",
    includes: "수학 · 물리 · 화학 · 생물 · 지구과학",
    interviewTopics: ["과학 구술면접", "실험 설계", "연구 발표"],
    docTypes: ["자기소개서", "연구계획서"],
    ddays: [{ label: "수능", date: "2026-11-12" }],
  },
  humanities: {
    name: "인문·사회 계열", icon: "📚",
    description: "인문·사회 분야 입시와 진로 탐색",
    members: 1740, posts: 7200, type: "계열",
    includes: "인문학 · 사회학 · 심리학 · 정치외교",
    interviewTopics: ["인문학적 사고", "사회 이슈 토론", "독서 기반 면접"],
    docTypes: ["자기소개서", "학업계획서"],
    ddays: [{ label: "수능", date: "2026-11-12" }],
  },
  "arts-sports": {
    name: "예·체능 계열", icon: "🎨",
    description: "예술과 체육 분야 실기·입시 정보",
    members: 980, posts: 4100, type: "계열",
    includes: "미술 · 음악 · 체육 · 디자인 · 영상",
    interviewTopics: ["포트폴리오 발표", "실기 면접", "예술관 면접"],
    docTypes: ["자기소개서", "포트폴리오"],
    ddays: [{ label: "수능", date: "2026-11-12" }],
  },
  education: {
    name: "교육 계열", icon: "🎓",
    description: "교대·사범대 입시와 교직 진로 준비",
    members: 1020, posts: 4400, type: "계열",
    includes: "교육학 · 초등교육 · 교사 · 사범대",
    interviewTopics: ["교직 적성 면접", "수업 시연", "교육관 면접"],
    docTypes: ["자기소개서", "학업계획서"],
    ddays: [{ label: "수능", date: "2026-11-12" }],
  },
  reconnect: { name: "다시, 잇다", icon: "🌅", description: "재도전하는 모든 이들의 공간", members: 1340, posts: 4500, type: "특수" },
  "n-soo": { name: "N수생 라운지", icon: "📖", description: "N수생들의 정보 교환과 응원", members: 2100, posts: 8900, type: "특수" },
  mentoring: { name: "멘토링", icon: "🤝", description: "선배·후배 간 멘토링 매칭", members: 780, posts: 3200, type: "특수" },
  "study-group": { name: "스터디 모집", icon: "👥", description: "함께 공부할 동료를 찾습니다", members: 1500, posts: 6700, type: "특수" },
};

/* ─── 상위 탭 (2안 흡수) ─── */
type SectionTab = "board" | "aptitude" | "goals" | "interview-review" | "acceptance";
const sectionTabs: { key: SectionTab; label: string; icon: any }[] = [
  { key: "board", label: "게시판", icon: FileText },
  { key: "aptitude", label: "적성 발견", icon: Brain },
  { key: "goals", label: "목표 달성", icon: Target },
  { key: "interview-review", label: "면접 후기", icon: Mic },
  { key: "acceptance", label: "합격 수기", icon: Trophy },
];

/* ─── 글 유형 (게시판 탭 내부) ─── */
type PostType = "all" | "info" | "question" | "review" | "cheer" | "milestone";
const postTypes: { key: PostType; label: string; icon: any }[] = [
  { key: "all", label: "전체", icon: FileText },
  { key: "info", label: "정보", icon: FileText },
  { key: "question", label: "질문", icon: MessageSquare },
  { key: "review", label: "후기", icon: Star },
  { key: "cheer", label: "응원", icon: Heart },
  { key: "milestone", label: "이정표", icon: Target },
];

/* ─── Sample Posts ─── */
const boardPosts = [
  { id: 1, title: "서울대 학종 세특 주제 추천 모음 — 2027학년도 대비", author: "서울대꿈나무", type: "info" as PostType, likes: 234, comments: 45, views: 1820, time: "2시간 전", excerpt: "올해 서울대 학종을 준비하면서 정리한 세특 주제들을 공유합니다...", isPinned: true },
  { id: 2, title: "의대 면접 기출 정리 (2024~2026)", author: "의대지망생", type: "info" as PostType, likes: 189, comments: 32, views: 1450, time: "3시간 전", excerpt: "3개년 의대 면접 기출을 정리했습니다. MMI, 다중미니면접 포함...", isPinned: true },
  { id: 3, title: "수능 D-200 달성! 여기까지 온 후기", author: "꿈을향해", type: "milestone" as PostType, likes: 156, comments: 28, views: 980, time: "4시간 전", excerpt: "D-200을 달성했습니다. 지금까지의 여정을 돌아보며...", hot: true },
  { id: 4, title: "모의고사 국어 1등급 비법 공유", author: "국어마스터", type: "info" as PostType, likes: 312, comments: 67, views: 2340, time: "5시간 전", excerpt: "국어 1등급을 꾸준히 유지하는 방법을 공유합니다..." },
  { id: 5, title: "생기부 세특 어떤 주제가 좋을까요?", author: "고2학생", type: "question" as PostType, likes: 45, comments: 23, views: 560, time: "6시간 전", excerpt: "생기부 세특 주제를 고민 중인데, 의대 지원 시 어떤 주제가..." },
  { id: 6, title: "연세대 수시 합격 후기", author: "연세인", type: "review" as PostType, likes: 278, comments: 54, views: 1890, time: "7시간 전", excerpt: "연세대 수시에 합격한 후기를 공유합니다..." },
  { id: 7, title: "힘들 때 이 글을 읽어주세요", author: "응원단장", type: "cheer" as PostType, likes: 456, comments: 89, views: 3200, time: "8시간 전", excerpt: "공부가 힘들고 지칠 때, 우리 모두 함께 힘내봐요..." },
  { id: 8, title: "KAIST 학생부종합 준비 가이드", author: "카이스트생", type: "info" as PostType, likes: 167, comments: 34, views: 1230, time: "9시간 전", excerpt: "KAIST 학생부종합전형 준비 방법을 단계별로 정리했습니다..." },
  { id: 9, title: "수학 3등급에서 1등급까지 올린 방법", author: "수학정복", type: "review" as PostType, likes: 389, comments: 72, views: 2780, time: "10시간 전", excerpt: "수학 3등급에서 시작해서 1등급까지 올린 과정을 공유합니다..." },
  { id: 10, title: "같이 공부할 스터디원 모집합니다", author: "스터디장", type: "question" as PostType, likes: 34, comments: 18, views: 340, time: "11시간 전", excerpt: "매일 저녁 9시~12시 온라인 스터디 함께 하실 분..." },
];

/* ─── 적성 발견 탭 콘텐츠 ─── */
const aptitudeContent = [
  { id: 101, title: "이 계열이 나에게 맞을까? — 적성 체크리스트", author: "진로탐색러", likes: 345, comments: 67, time: "1일 전", excerpt: "이 계열에 적합한 성향과 역량을 체크리스트로 정리했습니다." },
  { id: 102, title: "선배가 말하는 이 계열의 현실", author: "현직선배", likes: 289, comments: 45, time: "2일 전", excerpt: "대학 입학 후 실제로 느낀 이 계열의 장단점을 솔직하게..." },
  { id: 103, title: "관련 직업 탐색 — 졸업 후 어디로?", author: "커리어코치", likes: 198, comments: 34, time: "3일 전", excerpt: "이 계열 졸업 후 진출할 수 있는 직업군과 전망을 정리..." },
  { id: 104, title: "추천 도서 & 활동 목록", author: "독서왕", likes: 156, comments: 23, time: "4일 전", excerpt: "이 계열 진학을 위해 도움이 되는 도서와 비교과 활동..." },
];

/* ─── 목표 달성 탭 콘텐츠 ─── */
const goalsContent = [
  { id: 201, title: "수능 D-200 달성 인증! 🎉", author: "끝까지간다", likes: 234, comments: 56, time: "1일 전", excerpt: "수능까지 D-200을 돌파했습니다! 남은 기간 화이팅..." },
  { id: 202, title: "모의고사 성적 추이 공유 (3월→6월)", author: "성적올리기", likes: 178, comments: 34, time: "2일 전", excerpt: "3월 모의고사부터 6월까지의 성적 변화를 공유합니다..." },
  { id: 203, title: "나의 학습 로드맵 — 월별 계획", author: "계획왕", likes: 145, comments: 28, time: "3일 전", excerpt: "수능까지 남은 기간을 월별로 나눠서 계획을 세웠습니다..." },
  { id: 204, title: "생기부 완성 진행률 80% 달성!", author: "생기부마스터", likes: 123, comments: 19, time: "5일 전", excerpt: "목표했던 세특 활동의 80%를 완료했습니다..." },
];

/* ─── 면접 후기 탭 콘텐츠 ─── */
const interviewContent = [
  { id: 301, title: "2026 면접 후기 — 생각보다 어려웠다", author: "면접생존자", likes: 456, comments: 89, time: "1주 전", excerpt: "올해 면접을 보고 왔습니다. 예상 질문과 실제 질문의 차이가..." },
  { id: 302, title: "면접 꿀팁 — 이것만은 꼭 준비하세요", author: "합격선배", likes: 389, comments: 67, time: "2주 전", excerpt: "면접에서 가장 중요한 것은 자기소개서와의 일관성입니다..." },
  { id: 303, title: "제시문 면접 대비법 총정리", author: "면접코치", likes: 312, comments: 54, time: "3주 전", excerpt: "제시문 면접의 유형별 대비 전략을 정리했습니다..." },
  { id: 304, title: "면접 복장/태도 가이드", author: "매너왕", likes: 198, comments: 32, time: "1달 전", excerpt: "면접 당일 복장, 태도, 대기실 매너까지 총정리..." },
];

/* ─── 합격 수기 탭 콘텐츠 ─── */
const acceptanceContent = [
  { id: 401, title: "학종으로 합격한 나의 이야기", author: "합격자A", likes: 567, comments: 123, time: "1달 전", excerpt: "학생부종합전형으로 합격하기까지의 과정을 상세히 공유합니다..." },
  { id: 402, title: "정시로 역전한 수험 생활", author: "정시역전", likes: 445, comments: 98, time: "2달 전", excerpt: "수시에서 불합격 후 정시로 역전한 이야기입니다..." },
  { id: 403, title: "논술전형 합격 비법 — 실전 팁", author: "논술마스터", likes: 334, comments: 76, time: "2달 전", excerpt: "논술전형으로 합격한 경험과 실전 팁을 공유합니다..." },
  { id: 404, title: "N수 끝에 합격 — 포기하지 마세요", author: "N수합격", likes: 678, comments: 145, time: "3달 전", excerpt: "2번의 재수 끝에 합격한 이야기. 포기하지 않으면 길이 있습니다..." },
];

/* ─── Sidebar Data ─── */
const boardComrades = [
  { name: "서울대꿈나무", level: "Lv.5", posts: 234 },
  { name: "의대지망생", level: "Lv.4", posts: 189 },
  { name: "국어마스터", level: "Lv.4", posts: 156 },
  { name: "꿈을향해", level: "Lv.3", posts: 123 },
];

/* ─── Helpers ─── */
function getTypeStyle(type: PostType): string {
  switch (type) {
    case "info": return "bg-blue-100 text-blue-700";
    case "question": return "bg-amber-100 text-amber-700";
    case "review": return "bg-emerald-100 text-emerald-700";
    case "cheer": return "bg-pink-100 text-pink-700";
    case "milestone": return "bg-purple-100 text-purple-700";
    default: return "bg-secondary text-muted-foreground";
  }
}

function getDDayText(dateStr: string) {
  const target = new Date(dateStr);
  const today = new Date();
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? `D-${diff}` : diff === 0 ? "D-Day" : `D+${Math.abs(diff)}`;
}

function PostSkeleton() {
  return (
    <div className="py-3 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  );
}

const POSTS_PER_PAGE = 8;

/* ─── Generic Content List (적성/목표/면접/합격 탭용) ─── */
function ContentList({ items, slug }: { items: typeof aptitudeContent; slug: string }) {
  return (
    <div className="space-y-0 divide-y divide-border">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.03 * i }}
          className="py-3 group cursor-pointer"
          onClick={() => toast.info("게시글 상세 페이지로 이동합니다 (준비 중)")}
        >
          <h3 className="text-sm font-semibold group-hover:text-dream transition-colors">{item.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.excerpt}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
            <span>{item.author}</span>
            <span>{item.time}</span>
            <span className="flex items-center gap-0.5"><Heart size={9} /> {item.likes}</span>
            <span className="flex items-center gap-0.5"><MessageSquare size={9} /> {item.comments}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function BoardDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const board = boardsMeta[slug];

  const [activeSection, setActiveSection] = useState<SectionTab>("board");
  const [activeType, setActiveType] = useState<PostType>("all");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "comments">("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showAiTools, setShowAiTools] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, [slug, activeType, sortBy, currentPage, activeSection]);

  if (!board) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">존재하지 않는 보드입니다.</p>
        <Link href="/boards">
          <span className="text-dream hover:underline text-sm mt-2 inline-block">보드 목록으로 돌아가기</span>
        </Link>
      </div>
    );
  }

  /* Filter & Sort (게시판 탭) */
  let filtered = boardPosts.filter((p) => activeType === "all" || p.type === activeType);
  if (searchQuery) {
    filtered = filtered.filter((p) => p.title.includes(searchQuery) || p.author.includes(searchQuery));
  }
  const pinned = filtered.filter((p) => p.isPinned);
  const unpinned = filtered.filter((p) => !p.isPinned);
  const sorted = [...unpinned].sort((a, b) => {
    if (sortBy === "popular") return b.likes - a.likes;
    if (sortBy === "comments") return b.comments - a.comments;
    return 0;
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / POSTS_PER_PAGE));
  const paginated = sorted.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Back */}
      <Link href="/boards">
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={14} /> 꿈 보드로 돌아가기
        </span>
      </Link>

      {/* Board Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{board.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="editorial-heading text-xl md:text-2xl">{board.name}</h1>
              <span className="ink-tag text-[9px]">{board.type}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{board.description}</p>
            {board.includes && (
              <p className="text-[10px] text-dream/70 mt-0.5">포함: {board.includes}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1"><Users size={12} /> 꿈 동료 {board.members.toLocaleString()}명</span>
          <span className="flex items-center gap-1"><FileText size={12} /> 게시글 {board.posts.toLocaleString()}개</span>
        </div>
      </motion.div>

      {/* ═══ 상위 탭 (2안 흡수) ═══ */}
      <div className="flex gap-0 border-b border-border mb-4 overflow-x-auto">
        {sectionTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveSection(tab.key); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap transition-all border-b-2 ${
              activeSection === tab.key
                ? "border-dream text-dream font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-8">
        {/* ─── Main ─── */}
        <div>
          {/* === 게시판 탭 === */}
          {activeSection === "board" && (
            <>
              {/* Post Type Tabs */}
              <div className="flex gap-1 mb-4 flex-wrap">
                {postTypes.map((pt) => (
                  <button
                    key={pt.key}
                    onClick={() => { setActiveType(pt.key); setCurrentPage(1); }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-all ${
                      activeType === pt.key
                        ? "bg-foreground text-background font-semibold"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <pt.icon size={11} />
                    {pt.label}
                  </button>
                ))}
              </div>

              {/* Search & Sort */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    placeholder="글 제목, 작성자 검색..."
                    className="w-full pl-9 pr-4 py-2 text-sm border border-border bg-transparent focus:border-foreground outline-none transition-colors"
                  />
                </div>
                <div className="flex gap-1">
                  {([
                    { key: "latest", label: "최신", icon: Clock },
                    { key: "popular", label: "인기", icon: Flame },
                    { key: "comments", label: "댓글", icon: MessageSquare },
                  ] as const).map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setSortBy(s.key)}
                      className={`flex items-center gap-1 px-2.5 py-2 text-xs transition-all ${
                        sortBy === s.key ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <s.icon size={11} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pinned Posts */}
              {pinned.length > 0 && activeType === "all" && (
                <div className="mb-4">
                  {pinned.map((post) => (
                    <Link key={post.id} href={`/boards/${slug}/${post.id}`}>
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-gold/5 border border-gold/20 mb-1 hover:bg-gold/10 transition-colors cursor-pointer">
                        <Pin size={12} className="text-gold shrink-0" />
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${getTypeStyle(post.type)}`}>
                          {postTypes.find((t) => t.key === post.type)?.label}
                        </span>
                        <span className="text-sm font-semibold truncate flex-1">{post.title}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{post.time}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Post List */}
              {isLoading ? (
                <div className="space-y-0 divide-y divide-border">
                  {Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)}
                </div>
              ) : (
                <div className="space-y-0 divide-y divide-border">
                  {paginated.map((post, i) => (
                    <Link key={post.id} href={`/boards/${slug}/${post.id}`}>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.03 * i }}
                        className="py-3 group cursor-pointer"
                      >
                        <div className="flex items-start gap-2">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${getTypeStyle(post.type)}`}>
                            {postTypes.find((t) => t.key === post.type)?.label}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-semibold group-hover:text-dream transition-colors truncate">{post.title}</h3>
                              {(post as any).hot && <Flame size={12} className="text-vermillion shrink-0" />}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{post.excerpt}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                              <span>{post.author}</span>
                              <span>{post.time}</span>
                              <span className="flex items-center gap-0.5"><Heart size={9} /> {post.likes}</span>
                              <span className="flex items-center gap-0.5"><MessageSquare size={9} /> {post.comments}</span>
                              <span className="flex items-center gap-0.5"><Eye size={9} /> {post.views}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                  {paginated.length === 0 && (
                    <div className="py-8 text-center text-sm text-muted-foreground">해당 조건의 게시글이 없습니다.</div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 mt-6">
                  <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 text-xs transition-all ${currentPage === i + 1 ? "bg-foreground text-background font-bold" : "text-muted-foreground hover:text-foreground"}`}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* === 적성 발견 탭 === */}
          {activeSection === "aptitude" && (
            <div>
              <div className="mb-4 p-4 bg-dream/5 border border-dream/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={16} className="text-dream" />
                  <h3 className="font-serif font-bold text-sm">이 계열의 적성 탐색</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {board.name}에 맞는 적성과 역량을 탐색하세요. 선배들의 경험담과 진로 정보를 확인할 수 있습니다.
                </p>
                <Link href="/diagnosis">
                  <span className="inline-flex items-center gap-1 mt-2 text-xs text-dream font-semibold hover:underline">
                    <ClipboardCheck size={12} /> AI 적성 진단 받기 (무료) →
                  </span>
                </Link>
              </div>
              <ContentList items={aptitudeContent} slug={slug} />
            </div>
          )}

          {/* === 목표 달성 탭 === */}
          {activeSection === "goals" && (
            <div>
              <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={16} className="text-emerald-600" />
                  <h3 className="font-serif font-bold text-sm">동료들의 목표 달성 현황</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {board.name} 동료들의 학습 로드맵과 마일스톤을 확인하고 함께 성장하세요.
                </p>
              </div>
              <ContentList items={goalsContent} slug={slug} />
            </div>
          )}

          {/* === 면접 후기 탭 === */}
          {activeSection === "interview-review" && (
            <div>
              <div className="mb-4 p-4 bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mic size={16} className="text-violet-600" />
                  <h3 className="font-serif font-bold text-sm">{board.name} 면접 후기</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  이 계열 면접 경험담을 읽고 준비하세요. AI 면접 연습으로 실전 감각을 키울 수 있습니다.
                </p>
                <Link href={`/tools/interview?board=${slug}`}>
                  <span className="inline-flex items-center gap-1 mt-2 text-xs text-violet-600 font-semibold hover:underline">
                    <Crown size={10} /> AI 면접 연습하기 (Premium) →
                  </span>
                </Link>
              </div>
              <ContentList items={interviewContent} slug={slug} />
            </div>
          )}

          {/* === 합격 수기 탭 === */}
          {activeSection === "acceptance" && (
            <div>
              <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy size={16} className="text-amber-600" />
                  <h3 className="font-serif font-bold text-sm">{board.name} 합격 수기</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  이 계열에 합격한 선배들의 생생한 경험담을 확인하세요.
                </p>
              </div>
              <ContentList items={acceptanceContent} slug={slug} />
            </div>
          )}

          {/* Write CTA */}
          <div className="mt-6 text-center">
            <Link href="/write">
              <span className="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm bg-foreground text-background hover:bg-foreground/90 transition-colors font-semibold">
                <PenLine size={14} /> 글쓰기
              </span>
            </Link>
          </div>
        </div>

        {/* ─── Sidebar (PC Only) ─── */}
        <aside className="hidden lg:block space-y-5">

          {/* ═══ 3안 핵심: 맥락화된 AI 도구 허브 (무료/유료 구분) ═══ */}
          <div className="border-2 border-dream/20 bg-gradient-to-b from-dream/5 to-transparent p-4 rounded-lg">
            <button
              className="flex items-center justify-between w-full mb-3"
              onClick={() => setShowAiTools(!showAiTools)}
            >
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-dream" />
                <h3 className="font-serif font-bold text-sm">이 보드의 AI 도구</h3>
                <span className="text-[8px] bg-dream/10 text-dream px-1.5 py-0.5 rounded-full font-semibold">3안</span>
              </div>
              <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showAiTools ? "rotate-180" : ""}`} />
            </button>

            {showAiTools && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
                <p className="text-[10px] text-muted-foreground mb-2">
                  보드에 참여하면 모든 AI 도구가 <strong>{board.name}</strong>에 맞게 자동 개인화됩니다.
                </p>

                {/* 자기진단 — 무료 */}
                <Link href="/diagnosis">
                  <span className="block w-full text-left p-3 bg-white/80 dark:bg-ink/30 rounded-lg border border-emerald-200/50 hover:border-emerald-400/50 transition-all group">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 bg-emerald-100 rounded flex items-center justify-center">
                        <ClipboardCheck size={12} className="text-emerald-600" />
                      </div>
                      <span className="text-xs font-semibold group-hover:text-dream transition-colors">자기진단 & 평가</span>
                      <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold ml-auto">무료</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground ml-8">적성 · 학업 · 전략 · 습관 4종 진단</p>
                  </span>
                </Link>

                {/* AI 생기부 분석 — Premium */}
                <Link href={`/tools/document?board=${slug}&type=gisaengbu`}>
                  <span className="block w-full text-left p-3 bg-white/80 dark:bg-ink/30 rounded-lg border border-dream/10 hover:border-dream/30 transition-all group">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 bg-emerald-100 rounded flex items-center justify-center">
                        <FileEdit size={12} className="text-emerald-600" />
                      </div>
                      <span className="text-xs font-semibold group-hover:text-dream transition-colors">AI 생기부 분석</span>
                      <span className="text-[8px] bg-dream/10 text-dream px-1.5 py-0.5 rounded-full font-semibold ml-auto flex items-center gap-0.5">
                        <Crown size={8} /> Premium
                      </span>
                    </div>
                    <p className="text-[9px] text-muted-foreground ml-8">세특 적합도 평가 · 무료 체험 1회</p>
                  </span>
                </Link>

                {/* AI 자소서 첨삭 — Premium */}
                <Link href={`/tools/document?board=${slug}&type=jasoseo`}>
                  <span className="block w-full text-left p-3 bg-white/80 dark:bg-ink/30 rounded-lg border border-dream/10 hover:border-dream/30 transition-all group">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                        <PenLine size={12} className="text-blue-600" />
                      </div>
                      <span className="text-xs font-semibold group-hover:text-dream transition-colors">AI 자소서 첨삭</span>
                      <span className="text-[8px] bg-dream/10 text-dream px-1.5 py-0.5 rounded-full font-semibold ml-auto flex items-center gap-0.5">
                        <Crown size={8} /> Premium
                      </span>
                    </div>
                    <p className="text-[9px] text-muted-foreground ml-8">문항별 맞춤 피드백 · 무료 체험 1회</p>
                  </span>
                </Link>

                {/* AI 면접 연습 — Premium */}
                {board.interviewTopics && (
                  <Link href={`/tools/interview?board=${slug}`}>
                    <span className="block w-full text-left p-3 bg-white/80 dark:bg-ink/30 rounded-lg border border-dream/10 hover:border-dream/30 transition-all group">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-violet-100 rounded flex items-center justify-center">
                          <Mic size={12} className="text-violet-600" />
                        </div>
                        <span className="text-xs font-semibold group-hover:text-dream transition-colors">AI 면접 연습</span>
                        <span className="text-[8px] bg-dream/10 text-dream px-1.5 py-0.5 rounded-full font-semibold ml-auto flex items-center gap-0.5">
                          <Crown size={8} /> Premium
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 ml-8">
                        {board.interviewTopics.slice(0, 2).map((t) => (
                          <span key={t} className="text-[9px] px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded">{t}</span>
                        ))}
                      </div>
                      <p className="text-[9px] text-muted-foreground ml-8 mt-1">무료 체험 1회 (3문항)</p>
                    </span>
                  </Link>
                )}

                {/* AI 탐색 — 무료 */}
                <Link href={`/tools/ai-explore?board=${slug}`}>
                  <span className="block w-full text-left p-3 bg-white/80 dark:bg-ink/30 rounded-lg border border-emerald-200/50 hover:border-emerald-400/50 transition-all group">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                        <Compass size={12} className="text-blue-600" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold group-hover:text-dream transition-colors">AI 탐색 엔진</span>
                        <p className="text-[9px] text-muted-foreground">{board.name} 관련 정보 탐색</p>
                      </div>
                      <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold ml-auto">무료</span>
                    </div>
                  </span>
                </Link>

                {/* 동료 로드맵 — 무료 */}
                <button
                  className="w-full text-left p-3 bg-white/80 dark:bg-ink/30 rounded-lg border border-emerald-200/50 hover:border-emerald-400/50 transition-all group"
                  onClick={() => toast.info("동료 로드맵 비교 기능이 준비 중입니다")}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-amber-100 rounded flex items-center justify-center">
                      <Route size={12} className="text-amber-600" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold group-hover:text-dream transition-colors">동료 로드맵</span>
                      <p className="text-[9px] text-muted-foreground">{board.members}명의 진행률 비교</p>
                    </div>
                    <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold ml-auto">무료</span>
                  </div>
                </button>

                {/* 보드 D-Day */}
                {board.ddays && board.ddays.length > 0 && (
                  <div className="p-3 bg-white/80 dark:bg-ink/30 rounded-lg border border-dream/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-coral/10 rounded flex items-center justify-center">
                        <CalendarClock size={12} className="text-coral" />
                      </div>
                      <span className="text-xs font-semibold">보드 D-Day</span>
                    </div>
                    <div className="space-y-1.5 ml-8">
                      {board.ddays.map((d) => (
                        <div key={d.label} className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground truncate flex-1 mr-2">{d.label}</span>
                          <span className="text-[10px] font-mono font-bold text-coral shrink-0">{getDDayText(d.date)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 요금제 안내 */}
                <Link href="/pricing">
                  <span className="block w-full text-center p-2 text-[10px] text-dream font-semibold hover:underline">
                    요금제 보기 →
                  </span>
                </Link>
              </motion.div>
            )}
          </div>

          {/* Board Info Card */}
          <div className="border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{board.icon}</span>
              <h3 className="font-serif font-bold text-sm">{board.name}</h3>
            </div>
            <p className="text-[10px] text-muted-foreground mb-3">{board.description}</p>
            <hr className="editorial-divider my-2" />
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">꿈 동료</span>
                <span className="font-semibold">{board.members.toLocaleString()}명</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">게시글</span>
                <span className="font-semibold">{board.posts.toLocaleString()}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">오늘 새 글</span>
                <span className="font-semibold text-dream">+24</span>
              </div>
            </div>
          </div>

          {/* Top Contributors */}
          <div className="border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award size={14} className="text-gold" />
              <h3 className="font-serif font-bold text-sm">활동 랭킹</h3>
            </div>
            <hr className="editorial-divider my-2" />
            <div className="space-y-2">
              {boardComrades.map((c, i) => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-muted-foreground w-4">{i + 1}</span>
                  <div className="w-6 h-6 bg-secondary flex items-center justify-center text-[10px] font-bold rounded-full">{c.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{c.name}</p>
                    <p className="text-[9px] text-muted-foreground">{c.level} · {c.posts}글</p>
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
