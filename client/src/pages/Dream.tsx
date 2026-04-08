/*
 * Konnect v3 — 꿈 선언 + 꿈 프로필 (3안 보완)
 * 감성 서사("나는 ____이 되겠다") + 구조화된 학업 데이터(학년/학교/GPA/목표/전형)
 * 보완 보고서: "학생 프로필은 모든 AI 기능의 개인화 기초 데이터"
 * 3안 차별점: 프로필 + 보드 자동 배정 → 보드 맥락화 도구의 기반
 */
import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Heart,
  Users,
  Sparkles,
  PenLine,
  ChevronRight,
  Award,
  Target,
  Calendar,
  TrendingUp,
  MessageCircleHeart,
  Sunrise,
  RotateCcw,
  Flame,
  GraduationCap,
  School,
  BookOpen,
  FileText,
  BarChart3,
  Compass,
  LayoutGrid,
  Brain,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

/* ─── Profile Data Types ─── */
type AdmissionType = "수시" | "정시" | "미정";
type ProfileData = {
  grade: string;
  school: string;
  gpa: string;
  targetUniv: string;
  targetDept: string;
  admissionType: AdmissionType;
  strongSubjects: string[];
  weakSubjects: string[];
  interests: string[];
};

const defaultProfile: ProfileData = {
  grade: "고3",
  school: "한국고등학교",
  gpa: "1.8",
  targetUniv: "서울대학교",
  targetDept: "의과대학",
  admissionType: "수시",
  strongSubjects: ["생명과학", "화학", "영어"],
  weakSubjects: ["국어"],
  interests: ["의학연구", "희귀질환", "바이오테크"],
};

const allSubjects = ["국어", "수학", "영어", "물리", "화학", "생명과학", "지구과학", "사회", "한국사", "제2외국어"];

const dreamComrades = [
  { name: "의대지망생A", dream: "서울대 의대", days: 142, cheers: 89, avatar: "A" },
  { name: "미래의사B", dream: "연세대 의예과", days: 98, cheers: 67, avatar: "B" },
  { name: "생명과학러C", dream: "서울대 생명과학부", days: 67, cheers: 45, avatar: "C" },
  { name: "의학연구자D", dream: "KAIST 의과학대학원", days: 203, cheers: 134, avatar: "D" },
  { name: "간호사꿈E", dream: "서울대 간호학과", days: 56, cheers: 23, avatar: "E" },
  { name: "약대지망F", dream: "서울대 약학대학", days: 178, cheers: 112, avatar: "F" },
];

const dreamTimeline = [
  { date: "2025.12.01", event: "꿈 선언: 서울대 의대에서 희귀질환을 연구하겠다", type: "declare" },
  { date: "2025.12.15", event: "꿈 프로필 완성 → 서울대 의대 보드 자동 배정", type: "board" },
  { date: "2026.01.15", event: "첫 번째 마일스톤 달성: 연속 30일 학습", type: "milestone" },
  { date: "2026.02.01", event: "AI 적성 분석 완료 → 의학 적합도 92%", type: "aptitude" },
  { date: "2026.02.20", event: "꿈 동료 100명 돌파", type: "social" },
  { date: "2026.03.10", event: "이야기 '모의고사 3등급에서 시작한 나의 이야기' 응원 300 돌파", type: "story" },
  { date: "2026.04.01", event: "Lv.3 꿈의 탐험가 달성", type: "level" },
];

const reStarterComrades = [
  { name: "다시봄", dream: "연세대 의예과", prevDream: "경영학과", days: 245, avatar: "D", message: "방향이 바뀐 것뿐, 열정은 그대로" },
  { name: "두번째봄꽃", dream: "서울대 경제학부", prevDream: "서울대 경제학부", days: 312, avatar: "B", message: "같은 꿈이라도 두 번째는 더 깊다" },
  { name: "다시날다", dream: "고려대 법학", prevDream: "고려대 법학", days: 198, avatar: "N", message: "작년의 눈물이 올해의 날개가 되었다" },
];

const popularDreams = [
  { dream: "서울대학교", count: 1247, growth: "+12%" },
  { dream: "연세대학교", count: 1089, growth: "+8%" },
  { dream: "고려대학교", count: 1034, growth: "+15%" },
  { dream: "KAIST", count: 678, growth: "+22%" },
  { dream: "성균관대학교", count: 567, growth: "+5%" },
  { dream: "한양대학교", count: 534, growth: "+9%" },
  { dream: "서강대학교", count: 423, growth: "+11%" },
  { dream: "중앙대학교", count: 398, growth: "+7%" },
];

/* ─── Auto-assigned boards based on profile ─── */
function getAutoBoards(profile: ProfileData) {
  const boards: { slug: string; name: string; icon: string; reason: string }[] = [];
  const univMap: Record<string, { slug: string; icon: string }> = {
    "서울대학교": { slug: "snu", icon: "🏫" },
    "연세대학교": { slug: "yonsei", icon: "🏫" },
    "고려대학교": { slug: "korea-univ", icon: "🏫" },
    "KAIST": { slug: "kaist", icon: "🔬" },
  };
  const deptMap: Record<string, { slug: string; icon: string }> = {
    "의과대학": { slug: "medicine", icon: "🩺" },
    "의예과": { slug: "medicine", icon: "🩺" },
    "컴퓨터공학": { slug: "cs", icon: "💻" },
    "경영학": { slug: "business", icon: "📊" },
    "법학": { slug: "law", icon: "⚖️" },
  };
  if (univMap[profile.targetUniv]) {
    boards.push({ ...univMap[profile.targetUniv], name: profile.targetUniv, reason: "목표 대학" });
  }
  if (deptMap[profile.targetDept]) {
    boards.push({ ...deptMap[profile.targetDept], name: profile.targetDept, reason: "목표 학과" });
  }
  if (profile.targetDept === "의과대학" || profile.targetDept === "의예과") {
    boards.push({ slug: "doctor", name: "의사", icon: "👨‍⚕️", reason: "관련 직업" });
    if (profile.targetUniv === "서울대학교") {
      boards.push({ slug: "snu-medicine", name: "서울대 의대", icon: "🏥", reason: "대학+학과 조합" });
    }
  }
  return boards;
}

export default function Dream() {
  const [dreamText, setDreamText] = useState("서울대 의대에서 희귀질환을 연구하겠다");
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfile, setEditProfile] = useState<ProfileData>(defaultProfile);
  const [showProfileDetail, setShowProfileDetail] = useState(false);

  const autoBoards = getAutoBoards(profile);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Hero */}
      <section className="mb-8">
        <div className="relative overflow-hidden rounded-xl">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663433131621/A3XszkVKVy7WNitpyWDbEe/v3-dream-declare-mDj6CTYACFFc5iz7RCGboG.webp"
            alt="꿈 선언"
            className="w-full h-48 lg:h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/40 to-transparent" />
          <div className="absolute bottom-5 left-5 lg:bottom-8 lg:left-8">
            <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold">
              Dream Declaration + Profile
            </span>
            <h1 className="editorial-heading text-2xl lg:text-4xl text-white mt-1">
              꿈의 선언
            </h1>
            <p className="text-white/60 text-sm mt-1">
              감성 서사와 학업 데이터가 만나, 모든 AI 도구의 개인화 기반이 됩니다.
            </p>
          </div>
        </div>
      </section>

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
        {/* Main */}
        <div>
          {/* ═══ 나의 꿈 선언 카드 ═══ */}
          <section className="mb-6">
            <motion.div
              className="dream-card p-6 lg:p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Star size={20} className="text-dream" />
                <span className="text-xs uppercase tracking-[0.15em] text-dream font-semibold">
                  나의 꿈 선언
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  2025.12.01 선언
                </span>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">나는</p>
                  <textarea
                    value={dreamText}
                    onChange={(e) => setDreamText(e.target.value)}
                    className="w-full p-3 border border-dream/30 rounded-lg bg-transparent editorial-heading text-xl focus:border-dream outline-none resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 bg-dream text-white text-sm font-semibold rounded-lg"
                      onClick={() => {
                        setIsEditing(false);
                        toast.success("꿈이 업데이트되었습니다");
                      }}
                    >
                      선언하기
                    </button>
                    <button
                      className="px-4 py-2 text-sm text-muted-foreground"
                      onClick={() => setIsEditing(false)}
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <blockquote className="editorial-heading text-2xl lg:text-3xl leading-snug mb-4">
                    "{dreamText}"
                  </blockquote>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} /> 142일째
                    </span>
                    <span className="flex items-center gap-1 text-coral">
                      <Users size={14} /> 꿈 동료 312명
                    </span>
                    <span className="flex items-center gap-1 text-gold">
                      <Heart size={14} /> 응원 1,847
                    </span>
                  </div>
                  <button
                    className="mt-4 text-xs text-dream hover:underline flex items-center gap-1"
                    onClick={() => setIsEditing(true)}
                  >
                    <PenLine size={12} /> 꿈 수정하기
                  </button>
                </>
              )}
            </motion.div>
          </section>

          {/* ═══ 꿈 프로필 (3안 보완 핵심) ═══ */}
          <section className="mb-6">
            <motion.div
              className="border-2 border-dream/20 bg-gradient-to-br from-dream/5 via-background to-indigo/5 rounded-xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="p-5 lg:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-dream/10 rounded-full flex items-center justify-center">
                      <GraduationCap size={16} className="text-dream" />
                    </div>
                    <div>
                      <h2 className="editorial-heading text-lg flex items-center gap-2">
                        꿈 프로필
                        <span className="text-[9px] font-sans font-semibold tracking-wider text-dream bg-dream/10 px-2 py-0.5 rounded-full uppercase">
                          3안 신규
                        </span>
                      </h2>
                      <p className="text-[10px] text-muted-foreground">
                        모든 AI 도구의 개인화 기반 데이터
                      </p>
                    </div>
                  </div>
                  <button
                    className="text-xs text-dream hover:underline flex items-center gap-1"
                    onClick={() => {
                      if (isEditingProfile) {
                        setProfile(editProfile);
                        setIsEditingProfile(false);
                        toast.success("꿈 프로필이 업데이트되었습니다");
                      } else {
                        setEditProfile({ ...profile });
                        setIsEditingProfile(true);
                      }
                    }}
                  >
                    <PenLine size={12} />
                    {isEditingProfile ? "저장" : "수정"}
                  </button>
                </div>

                {/* Profile Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "학년", value: profile.grade, icon: School, field: "grade" as const },
                    { label: "학교", value: profile.school, icon: School, field: "school" as const },
                    { label: "내신 평균", value: `${profile.gpa}등급`, icon: BarChart3, field: "gpa" as const },
                    { label: "목표 대학", value: profile.targetUniv, icon: GraduationCap, field: "targetUniv" as const },
                    { label: "목표 학과", value: profile.targetDept, icon: BookOpen, field: "targetDept" as const },
                    { label: "전형 유형", value: profile.admissionType, icon: FileText, field: "admissionType" as const },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/60 dark:bg-ink/30 backdrop-blur-sm rounded-lg p-3 border border-dream/10">
                      <div className="flex items-center gap-1.5 mb-1">
                        <item.icon size={11} className="text-dream" />
                        <span className="text-[10px] text-muted-foreground">{item.label}</span>
                      </div>
                      {isEditingProfile ? (
                        item.field === "admissionType" ? (
                          <select
                            value={editProfile.admissionType}
                            onChange={(e) => setEditProfile({ ...editProfile, admissionType: e.target.value as AdmissionType })}
                            className="w-full text-sm font-semibold bg-transparent border-b border-dream/30 focus:border-dream outline-none py-0.5"
                          >
                            <option value="수시">수시</option>
                            <option value="정시">정시</option>
                            <option value="미정">미정</option>
                          </select>
                        ) : (
                          <input
                            value={editProfile[item.field]}
                            onChange={(e) => setEditProfile({ ...editProfile, [item.field]: e.target.value })}
                            className="w-full text-sm font-semibold bg-transparent border-b border-dream/30 focus:border-dream outline-none py-0.5"
                          />
                        )
                      ) : (
                        <p className="text-sm font-semibold">{item.value}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Subjects & Interests */}
                <button
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3"
                  onClick={() => setShowProfileDetail(!showProfileDetail)}
                >
                  <ChevronRight size={12} className={`transition-transform ${showProfileDetail ? "rotate-90" : ""}`} />
                  과목 & 관심분야 {showProfileDetail ? "접기" : "펼치기"}
                </button>

                <AnimatePresence>
                  {showProfileDetail && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid sm:grid-cols-3 gap-3 mb-3">
                        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg p-3 border border-emerald-200/30">
                          <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">강한 과목</p>
                          <div className="flex flex-wrap gap-1">
                            {profile.strongSubjects.map((s) => (
                              <span key={s} className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">{s}</span>
                            ))}
                          </div>
                        </div>
                        <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-lg p-3 border border-amber-200/30">
                          <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 mb-1.5">약한 과목</p>
                          <div className="flex flex-wrap gap-1">
                            {profile.weakSubjects.map((s) => (
                              <span key={s} className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">{s}</span>
                            ))}
                          </div>
                        </div>
                        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg p-3 border border-indigo-200/30">
                          <p className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 mb-1.5">관심 분야</p>
                          <div className="flex flex-wrap gap-1">
                            {profile.interests.map((s) => (
                              <span key={s} className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ═══ 3안 핵심: 보드 자동 배정 ═══ */}
                <div className="bg-dream/5 border border-dream/20 rounded-lg p-4 mt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <LayoutGrid size={14} className="text-dream" />
                    <span className="text-xs font-semibold text-dream">프로필 기반 자동 배정 보드</span>
                    <span className="text-[9px] bg-dream/10 text-dream px-1.5 py-0.5 rounded-full ml-auto">3안 고유</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-3">
                    꿈 프로필을 기반으로 자동으로 관련 보드에 배정됩니다. 보드에 참여하면 모든 AI 도구가 해당 꿈에 맞춰 개인화됩니다.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {autoBoards.map((b) => (
                      <Link key={b.slug} href={`/boards/${b.slug}`}>
                        <div className="flex items-center gap-2 p-2.5 bg-white/80 dark:bg-ink/30 rounded-lg border border-dream/10 hover:border-dream/30 transition-colors cursor-pointer group">
                          <span className="text-lg">{b.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold group-hover:text-dream transition-colors">{b.name}</p>
                            <p className="text-[9px] text-muted-foreground">{b.reason}</p>
                          </div>
                          <CheckCircle2 size={14} className="text-dream shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* AI 도구 연동 안내 */}
                <div className="mt-4 grid sm:grid-cols-2 gap-2">
                  <Link href="/aptitude">
                    <div className="flex items-center gap-2 p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-200/20 hover:border-indigo-300/40 transition-colors cursor-pointer">
                      <Brain size={16} className="text-indigo-600 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold">AI 적성 분석</p>
                        <p className="text-[9px] text-muted-foreground">프로필 기반 맞춤 분석 →</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/boards">
                    <div className="flex items-center gap-2 p-3 bg-dream/5 rounded-lg border border-dream/20 hover:border-dream/40 transition-colors cursor-pointer">
                      <Compass size={16} className="text-dream shrink-0" />
                      <div>
                        <p className="text-xs font-semibold">꿈 보드 탐색</p>
                        <p className="text-[9px] text-muted-foreground">맥락화된 AI 도구 →</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </motion.div>
          </section>

          {/* 꿈의 여정 타임라인 */}
          <section className="mb-8">
            <h2 className="editorial-heading text-lg mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-dream" />
              꿈의 여정
            </h2>
            <hr className="editorial-divider-thick mt-0 mb-4" />
            <div className="space-y-0">
              {dreamTimeline.map((item, i) => (
                <div key={i} className="flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      item.type === "declare" ? "bg-dream" :
                      item.type === "board" ? "bg-indigo-500" :
                      item.type === "aptitude" ? "bg-violet-500" :
                      item.type === "milestone" ? "bg-gold" :
                      item.type === "social" ? "bg-coral" :
                      item.type === "story" ? "bg-indigo" :
                      "bg-growth"
                    }`} />
                    {i < dreamTimeline.length - 1 && (
                      <div className="w-px flex-1 bg-border mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="text-[10px] text-muted-foreground mb-0.5">{item.date}</p>
                    <p className="text-sm font-medium">{item.event}</p>
                    {item.type === "board" && (
                      <span className="text-[9px] bg-dream/10 text-dream px-1.5 py-0.5 rounded-full mt-1 inline-block">3안 고유</span>
                    )}
                    {item.type === "aptitude" && (
                      <span className="text-[9px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full mt-1 inline-block">AI 적성 분석</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* "다시, 잇다" 섹션 */}
          <section className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative overflow-hidden rounded-xl border-2 border-coral/20 bg-gradient-to-br from-coral/5 via-background to-gold/5"
            >
              <div className="p-5 lg:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-coral/10 rounded-full flex items-center justify-center">
                    <Sunrise size={16} className="text-coral" />
                  </div>
                  <div>
                    <h2 className="editorial-heading text-lg flex items-center gap-2">
                      다시, 잇다.
                      <span className="text-[9px] font-sans font-semibold tracking-wider text-coral bg-coral/10 px-2 py-0.5 rounded-full uppercase">
                        Re:Connect
                      </span>
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      꿈을 다시 선언한다는 것은, 더 단단해졌다는 뜻입니다.
                    </p>
                  </div>
                </div>

                <div className="bg-white/60 dark:bg-ink/30 backdrop-blur-sm rounded-lg p-4 mb-4 border border-coral/10">
                  <p className="text-sm leading-relaxed text-center">
                    꿈이 바뀌어도, 같은 꿈을 다시 선언해도 — 그 모든 과정이 <span className="font-bold text-coral">성장</span>입니다.
                    <br />
                    <span className="text-muted-foreground">Konnect는 "다시"를 응원합니다.</span>
                  </p>
                </div>

                <div className="space-y-3">
                  {reStarterComrades.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 bg-coral/5 rounded-lg p-3">
                      <div className="w-9 h-9 bg-coral/10 text-coral rounded-full flex items-center justify-center text-sm font-bold">
                        {c.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold">{c.name}</span>
                          <span className="text-[9px] text-coral bg-coral/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Sunrise size={8} /> 다시, 잇다
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {c.dream} · {c.days}일째 · "{c.message}"
                        </p>
                      </div>
                      <button
                        className="cheer-btn text-[10px] py-1 px-2.5"
                        onClick={() => toast.success(`${c.name}님에게 응원을 보냈습니다!`)}
                      >
                        응원
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-5 lg:px-6 pb-5 lg:pb-6">
                <button
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-coral text-white text-sm font-semibold rounded-lg hover:bg-coral/90 transition-colors"
                  onClick={() => {
                    setIsEditing(true);
                    toast.info("꿈을 다시 선언해보세요. 다시 시작하는 것은 용기입니다.");
                  }}
                >
                  <RotateCcw size={14} />
                  나도 다시, 잇다
                </button>
                <p className="text-[10px] text-muted-foreground text-center mt-2 italic">
                  "멈춘 것이 아니다. 더 멀리 뛰기 위해 숨을 고른 것이다."
                </p>
              </div>
            </motion.div>
          </section>

          {/* 꿈 동료 */}
          <section className="mb-8">
            <h2 className="editorial-heading text-lg mb-4 flex items-center gap-2">
              <Users size={18} className="text-coral" />
              같은 꿈을 꾸는 동료들
            </h2>
            <hr className="editorial-divider-thick mt-0 mb-4" />
            <div className="grid sm:grid-cols-2 gap-3">
              {dreamComrades.map((c, i) => (
                <motion.div
                  key={i}
                  className="ink-card p-4 flex items-center gap-3"
                  whileHover={{ y: -2 }}
                >
                  <div className="w-10 h-10 bg-dream/10 text-dream rounded-full flex items-center justify-center font-bold">
                    {c.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {c.dream} · {c.days}일째
                    </p>
                  </div>
                  <button
                    className="cheer-btn text-[10px] py-1 px-3"
                    onClick={() => toast.success(`${c.name}님에게 응원을 보냈습니다!`)}
                  >
                    <Heart size={10} className="inline mr-1" />
                    응원
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block space-y-6">
          {/* 인기 꿈 랭킹 */}
          <div className="ink-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target size={14} className="text-dream" />
              <span className="text-xs font-semibold tracking-wider uppercase">인기 꿈 랭킹</span>
            </div>
            <div className="space-y-2.5">
              {popularDreams.map((d, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="text-lg font-mono font-bold text-muted-foreground/40 w-5 text-right shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{d.dream}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {d.count.toLocaleString()}명
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-growth">{d.growth}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 꿈 변경 이력 */}
          <div className="ink-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-gold" />
              <span className="text-xs font-semibold tracking-wider uppercase">꿈의 성장</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground mb-3">
              꿈이 바뀌는 건 <span className="font-bold text-foreground">실패가 아니라 성장</span>입니다.
              모든 변화는 기록으로 남습니다.
            </p>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">현재까지</p>
              <p className="editorial-heading text-xl text-dream">1번의 꿈</p>
              <p className="text-[10px] text-muted-foreground">을 선언했습니다</p>
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
            <div className="text-center py-3">
              <p className="editorial-heading text-2xl text-coral">4,237</p>
              <p className="text-xs text-muted-foreground mt-1">명이 꿈을 다시 잇고 있습니다</p>
            </div>
            <div className="bg-coral/5 rounded-lg p-3 mt-2">
              <p className="text-xs italic text-center leading-relaxed">
                "같은 꿈이라도 두 번째는 더 깊다."
              </p>
              <p className="text-[10px] text-coral text-center mt-1">— 두번째봄꽃</p>
            </div>
          </div>

          {/* 응원 통계 */}
          <div className="ink-card p-4 bg-coral/5 border-coral/20">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircleHeart size={14} className="text-coral" />
              <span className="text-xs font-semibold tracking-wider uppercase">응원 현황</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white rounded-lg p-2">
                <p className="text-lg font-bold text-coral">1,847</p>
                <p className="text-[10px] text-muted-foreground">받은 응원</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-lg font-bold text-dream">523</p>
                <p className="text-[10px] text-muted-foreground">보낸 응원</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
