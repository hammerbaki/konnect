import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useBookmarks } from "@/hooks/useBookmarks";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Compass, 
  FileText, 
  BarChart3, 
  ChevronRight, 
  Sparkles,
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  Brain,
  Star,
  X,
  GraduationCap,
  Briefcase,
  Building2,
  ArrowRight
} from "lucide-react";

const INTEREST_LABELS: Record<string, string> = {
  SCI: "과학·탐구", ENG: "공학·기술", MED: "의료·보건", BIZ: "경영·경제",
  LAW: "법률·행정", EDU: "교육·상담", ART: "예술·디자인", IT: "IT·정보통신", SOC: "사회·문화",
};
const APTITUDE_LABELS: Record<string, string> = {
  VERBAL: "언어능력", MATH: "수리·논리력", SPATIAL: "공간·시각능력",
  CREATIVE: "창의력", SOCIAL: "대인관계능력", SELF: "자기관리능력",
};

interface AptitudeResult {
  id: number;
  interestScores: Record<string, number>;
  aptitudeScores: Record<string, number>;
  recommendedJobs: Array<{ name: string }>;
  recommendedMajors: Array<{ name: string }>;
  summary: string | null;
  createdAt: string;
}
interface BookmarkItem {
  id: number;
  bookmarkType: string;
  targetId: number;
  targetName: string;
  createdAt: string;
}

function DashboardSkeleton() {
  return (
    <>
      <div className="space-y-5 sm:space-y-8 pb-6 sm:pb-10">
        {/* Hero skeleton */}
        <Skeleton className="w-full h-44 sm:h-56 lg:h-72 rounded-xl" />

        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="toss-card p-3 sm:p-5 h-full">
              <div className="flex flex-col h-full">
                <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl mb-2 sm:mb-4" />
                <Skeleton className="h-5 w-20 mb-1" />
                <Skeleton className="h-4 w-24 mb-3 hidden sm:block" />
                <div className="mt-auto flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          <Card className="toss-card">
            <CardHeader className="pb-2 sm:pb-4">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="toss-card">
            <CardHeader className="pb-2 sm:pb-4">
              <Skeleton className="h-6 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

// Profile field definitions for each profile type
const PROFILE_FIELDS: Record<string, { required: string[]; optional: string[] }> = {
  high: {
    required: ["high_hopeUniversity", "high_careerHope"],
    optional: ["high_favoriteSubject", "high_dreamJob", "high_grade", "high_extracurriculars", "high_awards", "high_skills"],
  },
  university: {
    required: ["univ_majorName", "univ_desiredIndustry"],
    optional: ["univ_desiredRole", "univ_gpa", "univ_certifications", "univ_projects", "univ_internships", "univ_skills"],
  },
  general: {
    required: ["gen_desiredIndustry", "gen_desiredRole"],
    optional: ["gen_skills", "gen_experience", "gen_currentRole", "gen_certifications", "gen_education"],
  },
  middle: {
    required: [],
    optional: ["mid_interests", "mid_dreamJob", "mid_favoriteSubject"],
  },
  elementary: {
    required: [],
    optional: ["elem_interests", "elem_dreamJob"],
  },
};

// Calculate profile completeness percentage
function calculateProfileCompleteness(profile: any): { percentage: number; filledCount: number; totalCount: number } {
  if (!profile || !profile.profileData) {
    return { percentage: 0, filledCount: 0, totalCount: 1 };
  }
  
  const fields = PROFILE_FIELDS[profile.type];
  if (!fields) {
    return { percentage: 50, filledCount: 1, totalCount: 2 }; // Default for unknown types
  }
  
  const allFields = [...fields.required, ...fields.optional];
  if (allFields.length === 0) {
    return { percentage: 100, filledCount: 0, totalCount: 0 };
  }
  
  let filledCount = 0;
  for (const field of allFields) {
    const value = profile.profileData[field];
    const isFilled = value !== undefined && value !== null && value !== "" && 
      !(Array.isArray(value) && value.length === 0);
    if (isFilled) filledCount++;
  }
  
  // Required fields are weighted more (count as 2)
  const requiredFilled = fields.required.filter(f => {
    const v = profile.profileData[f];
    return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
  }).length;
  
  const weightedFilled = filledCount + requiredFilled; // Required counted twice
  const weightedTotal = allFields.length + fields.required.length;
  
  const percentage = Math.round((weightedFilled / weightedTotal) * 100);
  return { percentage, filledCount, totalCount: allFields.length };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  // 진로 흥미 분석 최신 결과
  const { data: latestAptitude } = useQuery<AptitudeResult | null>({
    queryKey: ["/api/aptitude/latest"],
    staleTime: 1000 * 60 * 5,
    enabled: !!user,
  });

  // 추천 직업/학과 펼치기 상태
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [showAllMajors, setShowAllMajors] = useState(false);
  const REC_INITIAL = 3;

  // 찜 목록 (낙관적 업데이트 포함)
  const { bookmarkList, removeBookmark: removeBm } = useBookmarks({ enabled: !!user });

  const handleRemoveBm = (id: number, name: string) => {
    if (window.confirm(`"${name}"을(를) 관심 목록에서 제거하시겠습니까?`)) {
      removeBm.mutate(id);
    }
  };

  // Fetch profiles - cache for 5 minutes to reduce API calls
  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['/api/profiles'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/profiles');
      return response.json();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get first profile ID if exists
  const firstProfileId = profiles?.[0]?.id;

  // Fetch analyses for the first profile - with caching
  const { data: analyses } = useQuery({
    queryKey: ['/api/profiles', firstProfileId, 'analyses'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/profiles/${firstProfileId}/analyses`);
      return response.json();
    },
    enabled: !!firstProfileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch essays for the first profile - with caching
  const { data: essays } = useQuery({
    queryKey: ['/api/profiles', firstProfileId, 'essays'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/profiles/${firstProfileId}/essays`);
      return response.json();
    },
    enabled: !!firstProfileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch kompass for the first profile - with caching
  const { data: kompass } = useQuery({
    queryKey: ['/api/profiles', firstProfileId, 'kompass'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/profiles/${firstProfileId}/kompass`);
      return response.json();
    },
    enabled: !!firstProfileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const profileCount = profiles?.length ?? 0;
  const analysisCount = analyses?.length ?? 0;
  const essayCount = essays?.length ?? 0;
  const kompassCount = kompass?.length ?? 0;
  
  // Calculate actual profile completeness for the first profile
  const firstProfile = profiles?.[0];
  const profileCompleteness = firstProfile 
    ? calculateProfileCompleteness(firstProfile) 
    : { percentage: 0, filledCount: 0, totalCount: 0 };

  // Quick action cards data
  const quickActions = [
    {
      title: "프로필",
      description: "내 정보 관리",
      icon: User,
      color: "#320e9d",
      bgColor: "bg-dream/10",
      href: "/profile",
      stat: profileCount > 0 ? `${profileCount}개 프로필` : "작성하기",
    },
    {
      title: "AI 분석",
      description: "커리어 분석",
      icon: BarChart3,
      color: "#00BFA5",
      bgColor: "bg-emerald-50",
      href: "/analysis",
      stat: analysisCount > 0 ? `${analysisCount}개 분석` : "시작하기",
    },
    {
      title: "Kompass",
      description: "AI 목표관리",
      icon: Compass,
      color: "#FFB300",
      bgColor: "bg-amber-50",
      href: "/goals",
      stat: kompassCount > 0 ? `${kompassCount}개 목표` : "목표 설정",
    },
    {
      title: "자기소개서",
      description: "에세이 작성",
      icon: FileText,
      color: "#9852F8",
      bgColor: "bg-purple-50",
      href: "/personal-statement",
      stat: essayCount > 0 ? `${essayCount}개 작성` : "작성하기",
    },
  ];

  if (isLoadingProfiles) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <div className="space-y-5 sm:space-y-8 pb-6 sm:pb-10">
        {/* Hero Banner */}
        <section>
          <div className="relative overflow-hidden rounded-xl">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663433131621/A3XszkVKVy7WNitpyWDbEe/v3-hero-dream-kSVtSQjiGKaTguFYwP6Y5v.webp"
              alt="꿈을 잇다"
              className="w-full h-44 sm:h-56 lg:h-72 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent" />
            <div className="absolute bottom-5 left-5 sm:bottom-8 sm:left-8 right-5 sm:right-8">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
              >
                <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold">
                  Konnect
                </span>
                <h1 className="editorial-heading text-2xl sm:text-4xl text-white mt-1 leading-tight">KONNECT, 꿈을 잇다.</h1>
                <p className="text-white/70 text-xs sm:text-sm mt-1.5 max-w-md">
                  어떤 인강을 들을지 묻기 전에, 왜 공부하는지를 먼저 묻는다.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Link href="/explore">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-dream text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-dream/90 transition-colors">
                      <Star size={14} />
                      학과·직업 탐색
                    </span>
                  </Link>
                  <Link href="/aptitude">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 text-white text-xs sm:text-sm font-medium rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
                      진로 흥미 분석
                    </span>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ======= 핵심 기능 영역: 관심 목록 (좌) + 흥미 분석 결과 (우) ======= */}
        <div className="grid gap-4 md:grid-cols-2">

          {/* ★ 관심 목록 카드 — 탭 없이 학교/학과/직업 세로 나열 */}
          <Card className="toss-card p-5 flex flex-col" data-testid="card-bookmarks">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#191F28] flex items-center gap-2">
                <Star className="h-5 w-5 text-[#c79e41] fill-current" /> 관심 목록
              </h3>
            </div>
            {bookmarkList.length === 0 ? (
              <div className="flex flex-col gap-3 flex-1 items-center justify-center text-center py-6">
                <Star className="h-8 w-8 text-gray-200" />
                <p className="text-sm text-[#8B95A1]">탐색 페이지에서 ☆ 버튼을 눌러<br/>관심 항목을 저장하세요.</p>
                <Button size="sm" variant="outline" className="border-[#320e9d] text-[#320e9d] font-semibold rounded-xl text-xs" onClick={() => navigate("/explore?from=dashboard")} data-testid="btn-go-explore">
                  학과/직업 탐색 바로가기 <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 flex-1">

                {/* 관심 학교 */}
                {bookmarkList.filter(b => b.bookmarkType === "university").length > 0 && (
                  <div data-testid="bm-section-university">
                    <p className="text-xs font-semibold text-[#8B95A1] flex items-center gap-1 mb-2">
                      <Building2 className="h-3 w-3" /> 관심 학교
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {bookmarkList.filter(b => b.bookmarkType === "university").map(bm => (
                        <span
                          key={bm.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 cursor-pointer transition-colors"
                          onClick={() => navigate(`/explore?tab=universities&q=${encodeURIComponent(bm.targetName)}&from=dashboard`)}
                          data-testid={`bm-item-${bm.id}`}
                        >
                          {bm.targetName}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveBm(bm.id, bm.targetName); }}
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:bg-red-500 hover:text-white transition-all text-xs leading-none"
                            data-testid={`btn-bm-remove-${bm.id}`}
                          >×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 관심 학과 */}
                {bookmarkList.filter(b => b.bookmarkType === "major").length > 0 && (
                  <div data-testid="bm-section-major">
                    <p className="text-xs font-semibold text-[#8B95A1] flex items-center gap-1 mb-2">
                      <GraduationCap className="h-3 w-3" /> 관심 학과
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {bookmarkList.filter(b => b.bookmarkType === "major").map(bm => (
                        <span
                          key={bm.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 cursor-pointer transition-colors"
                          onClick={() => navigate(`/explore?tab=majors&q=${encodeURIComponent(bm.targetName)}&from=dashboard`)}
                          data-testid={`bm-item-${bm.id}`}
                        >
                          {bm.targetName}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveBm(bm.id, bm.targetName); }}
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:bg-red-500 hover:text-white transition-all text-xs leading-none"
                            data-testid={`btn-bm-remove-${bm.id}`}
                          >×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 관심 직업 */}
                {bookmarkList.filter(b => b.bookmarkType === "job").length > 0 && (
                  <div data-testid="bm-section-job">
                    <p className="text-xs font-semibold text-[#8B95A1] flex items-center gap-1 mb-2">
                      <Briefcase className="h-3 w-3" /> 관심 직업
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {bookmarkList.filter(b => b.bookmarkType === "job").map(bm => (
                        <span
                          key={bm.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 cursor-pointer transition-colors"
                          onClick={() => navigate(`/explore?tab=jobs&q=${encodeURIComponent(bm.targetName)}&from=dashboard`)}
                          data-testid={`bm-item-${bm.id}`}
                        >
                          {bm.targetName}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveBm(bm.id, bm.targetName); }}
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:bg-red-500 hover:text-white transition-all text-xs leading-none"
                            data-testid={`btn-bm-remove-${bm.id}`}
                          >×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Button size="sm" variant="ghost" className="mt-auto text-[#320e9d] text-xs self-start px-0 hover:bg-transparent" onClick={() => navigate("/explore?from=dashboard")}>
                  학과/직업 탐색 바로가기 <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </Card>

          {/* 🧠 진로 흥미 분석 결과 요약 카드 */}
          <Card className="toss-card p-5 flex flex-col" data-testid="card-aptitude-summary">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#191F28] flex items-center gap-2">
                <Brain className="h-5 w-5 text-[#320e9d]" /> 나의 흥미 분석 결과
              </h3>
            </div>
            {latestAptitude ? (
              <div className="flex flex-col gap-3 flex-1">
                {/* 상위 흥미 */}
                {latestAptitude.interestScores && Object.keys(latestAptitude.interestScores).length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-medium">상위 흥미</p>
                    <p className="text-sm text-[#191F28]">
                      {Object.entries(latestAptitude.interestScores)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([k, v]) => `${INTEREST_LABELS[k] || k} (${Math.round(v)}점)`)
                        .join(', ')}
                    </p>
                  </div>
                )}
                {/* 상위 역량 */}
                {latestAptitude.aptitudeScores && Object.keys(latestAptitude.aptitudeScores).length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-medium">상위 역량</p>
                    <p className="text-sm text-[#191F28]">
                      {Object.entries(latestAptitude.aptitudeScores)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 2)
                        .map(([k]) => APTITUDE_LABELS[k] || k)
                        .join(', ')}
                    </p>
                  </div>
                )}
                {/* 추천 직업 — 인라인 펼치기 */}
                {latestAptitude.recommendedJobs?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-medium">추천 직업</p>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {(showAllJobs
                        ? latestAptitude.recommendedJobs
                        : latestAptitude.recommendedJobs.slice(0, REC_INITIAL)
                      ).map((j, i) => (
                        <button
                          key={i}
                          onClick={() => navigate(`/explore?tab=jobs&q=${encodeURIComponent(j.name)}&from=dashboard`)}
                          className="text-xs px-2.5 py-1 rounded-full bg-coral/10 text-coral font-semibold hover:bg-coral/20 transition-colors"
                          data-testid={`btn-rec-job-${i}`}
                        >
                          {j.name}
                        </button>
                      ))}
                      {latestAptitude.recommendedJobs.length > REC_INITIAL && !showAllJobs && (
                        <button
                          onClick={() => setShowAllJobs(true)}
                          className="text-xs text-gray-400 self-center underline hover:text-gray-600 transition-colors"
                          data-testid="btn-rec-jobs-more"
                        >
                          외 {latestAptitude.recommendedJobs.length - REC_INITIAL}개
                        </button>
                      )}
                      {showAllJobs && latestAptitude.recommendedJobs.length > REC_INITIAL && (
                        <button
                          onClick={() => setShowAllJobs(false)}
                          className="text-xs text-gray-400 self-center underline hover:text-gray-600 transition-colors"
                          data-testid="btn-rec-jobs-collapse"
                        >
                          접기
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {/* 추천 학과 — 인라인 펼치기 */}
                {latestAptitude.recommendedMajors?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-medium">추천 학과</p>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {(showAllMajors
                        ? latestAptitude.recommendedMajors
                        : latestAptitude.recommendedMajors.slice(0, REC_INITIAL)
                      ).map((m, i) => (
                        <button
                          key={i}
                          onClick={() => navigate(`/explore?tab=majors&q=${encodeURIComponent(m.name)}&from=dashboard`)}
                          className="text-xs px-2.5 py-1 rounded-full bg-[#320e9d]/10 text-[#320e9d] font-semibold hover:bg-[#320e9d]/20 transition-colors"
                          data-testid={`btn-rec-major-${i}`}
                        >
                          {m.name}
                        </button>
                      ))}
                      {latestAptitude.recommendedMajors.length > REC_INITIAL && !showAllMajors && (
                        <button
                          onClick={() => setShowAllMajors(true)}
                          className="text-xs text-gray-400 self-center underline hover:text-gray-600 transition-colors"
                          data-testid="btn-rec-majors-more"
                        >
                          외 {latestAptitude.recommendedMajors.length - REC_INITIAL}개
                        </button>
                      )}
                      {showAllMajors && latestAptitude.recommendedMajors.length > REC_INITIAL && (
                        <button
                          onClick={() => setShowAllMajors(false)}
                          className="text-xs text-gray-400 self-center underline hover:text-gray-600 transition-colors"
                          data-testid="btn-rec-majors-collapse"
                        >
                          접기
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 mt-auto pt-2">
                  <Button size="sm" className="flex-1 bg-[#320e9d] text-white font-bold rounded-xl text-xs h-8" onClick={() => navigate("/aptitude")} data-testid="btn-view-aptitude-result">
                    상세 결과 보기 <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 border-[#320e9d] text-[#320e9d] font-bold rounded-xl text-xs h-8" onClick={() => navigate("/aptitude")} data-testid="btn-retake-aptitude">
                    다시 분석하기
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 flex-1">
                <div className="p-4 bg-[#F9FAFB] rounded-xl flex-1">
                  <p className="text-sm text-[#8B95A1] mb-2">아직 흥미 분석을 하지 않았습니다.</p>
                  <p className="text-xs text-[#8B95A1]">30문항 · 약 5분이면 나에게 맞는 학과와 직업을 찾을 수 있습니다.</p>
                </div>
                <Button className="w-full bg-[#320e9d] text-white font-bold rounded-xl text-sm h-9" onClick={() => navigate("/aptitude")} data-testid="btn-start-aptitude">
                  분석 시작 <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions Grid - Horizontal scroll on small screens */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <Card className="toss-card p-3 sm:p-5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group h-full" data-testid={`card-action-${action.title}`}>
                  <div className="flex flex-col h-full">
                    <div className={`p-2 sm:p-3 ${action.bgColor} rounded-lg sm:rounded-xl w-fit mb-2 sm:mb-4`}>
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: action.color }} />
                    </div>
                    <h3 className="text-sm sm:text-lg font-bold text-[#191F28] mb-0.5 sm:mb-1">{action.title}</h3>
                    <p className="text-xs sm:text-sm text-[#8B95A1] mb-2 sm:mb-3 hidden sm:block">{action.description}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-semibold" style={{ color: action.color }}>
                        {action.stat}
                      </span>
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-[#B0B8C1] group-hover:text-[#320e9d] transition-colors" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Kompass Progress Card */}
          <Card className="toss-card p-6">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#320e9d]" /> Kompass 목표
                </CardTitle>
                <Link href="/goals">
                  <Button variant="ghost" size="sm" className="text-[#320e9d] font-bold">
                    전체보기 <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <CardDescription className="text-[#8B95A1] mt-1">
                AI 기반 장기·중기·단기 목표 관리
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0 mt-4 space-y-4">
              {kompass && kompass.length > 0 ? (
                <div className="space-y-3">
                  {kompass.slice(0, 3).map((goal: any) => (
                    <div key={goal.id} className="p-4 bg-[#F9FAFB] rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[#191F28] text-sm truncate flex-1">
                          {goal.title}
                        </span>
                      </div>
                      <Link href={`/goals/${goal.id}`}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full rounded-lg border-[#320e9d] text-[#320e9d] font-semibold hover:bg-[#320e9d]/10"
                          data-testid={`button-today-goal-${goal.id}`}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          오늘의 목표 보기
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {kompass.length > 3 && (
                    <Link href="/goals">
                      <Button variant="ghost" className="w-full text-[#8B95A1] text-sm">
                        +{kompass.length - 3}개 더 보기
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-[#F9FAFB] rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="h-5 w-5 text-[#320e9d]" />
                    <span className="font-bold text-[#191F28]">목표 설정하기</span>
                  </div>
                  <p className="text-sm text-[#8B95A1]">
                    프로필과 커리어 분석을 바탕으로 장기·중기·단기 목표를 체계적으로 관리하세요.
                  </p>
                  <Link href="/goals">
                    <Button className="w-full mt-4 rounded-xl h-11 bg-[#320e9d] font-bold" data-testid="button-go-to-kompass">
                      새 목표 만들기
                    </Button>
                  </Link>
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#4E5968] font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#00BFA5]" /> 설정된 목표
                  </span>
                  <span className="text-[#00BFA5] font-bold">{kompassCount}개</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#4E5968] font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#FFB300]" /> 활성 프로필
                  </span>
                  <span className="text-[#FFB300] font-bold">{profileCount}개</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Summary Card */}
          <Card className="toss-card p-6">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#00BFA5]" /> AI 커리어 분석
                </CardTitle>
                <Link href="/analysis">
                  <Button variant="ghost" size="sm" className="text-[#00BFA5] font-bold">
                    전체보기 <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <CardDescription className="text-[#8B95A1] mt-1">
                AI가 분석한 나의 커리어 인사이트
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0 mt-4">
              {analysisCount > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-[#F0FDF9] rounded-xl border border-[#00BFA5]/20">
                    <p className="text-sm text-[#00BFA5] font-semibold mb-1">최근 분석 완료</p>
                    <p className="text-[#4E5968] text-sm">
                      {analysisCount}개의 커리어 분석이 있습니다.
                    </p>
                  </div>
                  <Link href="/analysis">
                    <Button variant="outline" className="w-full rounded-xl h-11 border-[#00BFA5] text-[#00BFA5] font-bold hover:bg-[#00BFA5]/10" data-testid="button-view-analysis">
                      분석 결과 보기
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="p-4 bg-[#F9FAFB] rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <BarChart3 className="h-5 w-5 text-[#00BFA5]" />
                    <span className="font-bold text-[#191F28]">분석 시작하기</span>
                  </div>
                  <p className="text-sm text-[#8B95A1] mb-4">
                    프로필을 바탕으로 AI가 맞춤형 커리어 분석을 제공합니다.
                  </p>
                  <Link href="/analysis">
                    <Button className="w-full rounded-xl h-11 bg-[#00BFA5] font-bold hover:bg-[#00BFA5]/90" data-testid="button-start-analysis">
                      AI 분석 시작 (100 학습권)
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Completion Card */}
          <Card className="toss-card p-6">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                  <User className="h-5 w-5 text-[#320e9d]" /> 프로필 현황
                </CardTitle>
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="text-[#320e9d] font-bold">
                    수정하기 <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[#4E5968] font-medium">프로필 완성도</span>
                  <span className="text-[#320e9d] font-bold">
                    {profileCount > 0 
                      ? `${profileCompleteness.percentage}%` 
                      : '미작성'}
                  </span>
                </div>
                <Progress 
                  value={profileCompleteness.percentage} 
                  className="h-3 bg-[#F2F4F6]" 
                  indicatorClassName="bg-[#320e9d]" 
                />
                <p className="text-sm text-[#8B95A1]">
                  {profileCount === 0 
                    ? '프로필을 작성하면 AI 분석과 맞춤 추천을 받을 수 있어요.'
                    : profileCompleteness.percentage < 50
                      ? '필수 정보를 입력해야 AI 분석을 받을 수 있어요.'
                      : profileCompleteness.percentage < 100
                        ? '프로필 정보를 더 상세히 입력하면 더 정확한 분석을 받을 수 있어요.'
                        : '프로필이 완성되었어요! AI 분석을 시작해보세요.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Essays Card */}
          <Card className="toss-card p-6">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#9852F8]" /> 자기소개서
                </CardTitle>
                <Link href="/personal-statement">
                  <Button variant="ghost" size="sm" className="text-[#9852F8] font-bold">
                    전체보기 <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0 mt-4">
              {essayCount > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-[#F5F0FF] rounded-xl border border-[#9852F8]/20">
                    <p className="text-sm text-[#9852F8] font-semibold mb-1">작성된 에세이</p>
                    <p className="text-[#4E5968] text-sm">
                      {essayCount}개의 자기소개서가 있습니다.
                    </p>
                  </div>
                  <Link href="/personal-statement">
                    <Button variant="outline" className="w-full rounded-xl h-11 border-[#9852F8] text-[#9852F8] font-bold hover:bg-[#9852F8]/10" data-testid="button-view-essays">
                      에세이 보기
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-[#8B95A1]">
                    AI가 도와주는 자기소개서 작성으로 취업 준비를 시작해보세요.
                  </p>
                  <Link href="/personal-statement">
                    <Button className="w-full rounded-xl h-11 bg-[#9852F8] font-bold hover:bg-[#9852F8]/90" data-testid="button-write-essay">
                      자기소개서 작성 (100 학습권)
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
