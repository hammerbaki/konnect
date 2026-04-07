import { useState, useCallback, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, ChevronDown, ChevronUp, GraduationCap, Briefcase, Building2,
  TrendingUp, TrendingDown, Minus, BookOpen, Award, MapPin, Banknote,
  Database, Sparkles, Home, Users, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight
} from "lucide-react";

// ---- Types ----
interface Major {
  id: number;
  majorName: string;
  category: string | null;
  description: string | null;
  relatedJobs: string[];
  relatedSubjects: string | null;
  universities: UnivEntry[] | null;
  hollandCode: string | null;
  demand: string | null;
  employmentRate: number | null;
  avgSalaryDistribution: {
    avg_monthly_wan?: number | null;
    raw_employment?: string | null;
    raw_salary?: string | null;
    source?: string;
  } | null;
}

interface UnivEntry {
  univName: string;
  region: string;
  competition: number;
  employmentRate: number;
  tuition: number;
  scholarship: number;
}

interface MajorUnivEntry {
  id: number;
  majorName: string;
  univName: string;
  region: string | null;
  quota: number | null;
  competitionRate: number | null;
  employmentRate: number | null;
  year: number | null;
}

interface Job {
  id: number;
  jobName: string;
  field: string | null;
  description: string | null;
  relatedMajors: string[];
  salary: number | null;
  growth: string | null;
  qualifications: string[];
  hollandCode: string | null;
  jobSeq: string | null;
}

interface University {
  id: number;
  univName: string;
  campusType: string | null;
  schoolType: string | null;
  univType: string | null;
  foundationType: string | null;
  region: string | null;
  competitionRate: number | null;
  employmentRate: number | null;
  avgTuition: number | null;
  dormitoryRate: number | null;
  scholarshipPerStudent: number | null;
  studentCount: number | null;
  admissionQuota: number | null;
}

interface ApiResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface Categories {
  majorCategories: string[];
  jobFields: string[];
  regions: string[];
  majorNames: string[];
}

interface AptitudeResult {
  id: number;
  summary: string | null;
  recommendedJobs: Array<{ name: string; reason: string }>;
  recommendedMajors: Array<{ name: string; reason: string }>;
  createdAt: string;
}

// ---- Helpers ----
function growthColor(growth: string | null) {
  if (!growth) return "text-gray-500";
  if (growth.includes("매우좋음")) return "text-emerald-600";
  if (growth.includes("좋음")) return "text-green-500";
  if (growth.includes("나쁨") || growth.includes("매우나쁨")) return "text-red-500";
  return "text-amber-500";
}

function GrowthBadge({ growth }: { growth: string | null }) {
  if (!growth) return null;
  const color = growthColor(growth);
  const Icon = growth.includes("좋음") ? TrendingUp : growth.includes("나쁨") ? TrendingDown : Minus;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon className="w-3.5 h-3.5" /> {growth}
    </span>
  );
}


// ---- AI Recommendation Banner ----
function AiRecommendBanner({ result }: { result: AptitudeResult | null | undefined; isLoading: boolean }) {
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState(false);

  const majors = result?.recommendedMajors?.slice(0, 3) ?? [];
  const jobs = result?.recommendedJobs?.slice(0, 3) ?? [];
  const analyzedDate = result?.createdAt
    ? new Date(result.createdAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })
    : null;

  return (
    <div className="space-y-3">
      {/* Banner row */}
      <div
        className="flex items-center justify-between bg-dream/6 border border-dream/15 rounded-2xl px-5 py-4 cursor-pointer hover:bg-dream/10 transition-colors"
        onClick={() => result ? setExpanded(e => !e) : navigate("/aptitude")}
        data-testid="ai-recommend-banner"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-dream/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-dream" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">
              AI 맞춤 추천
              {result && (
                <span className="ml-2 text-xs font-normal text-gray-400">
                  설문 기반 AI 분석 · {analyzedDate}
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {result
                ? "흥미·적성 설문 점수를 AI가 분석하여 추천 전공과 진로를 제안합니다"
                : "30문항 적성 설문을 완료하면 학생의 흥미·능력 기반으로 AI가 맞춤 전공과 진로를 추천해 드립니다"}
            </p>
          </div>
        </div>
        {result ? (
          <Button
            size="sm"
            variant="outline"
            className="border-dream/30 text-dream hover:bg-dream/10 shrink-0"
            data-testid="btn-toggle-ai-result"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {expanded ? "접기" : "추천 결과 보기"}
          </Button>
        ) : (
          <Button
            size="sm"
            className="bg-dream hover:bg-dream/90 text-white shrink-0"
            onClick={(e) => { e.stopPropagation(); navigate("/aptitude"); }}
            data-testid="btn-go-aptitude"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            적성 설문 시작
          </Button>
        )}
      </div>

      {/* Expanded AI result card */}
      {result && expanded && (
        <Card className="border border-dream/15 bg-white shadow-sm">
          <CardContent className="p-5 space-y-4" data-testid="ai-result-card">
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-semibold text-ink">AI 맞춤 추천 결과</h3>
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                흥미·적성 설문 기반
              </span>
            </div>
            {result.summary && (
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3">
                {result.summary}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {majors.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-dream" /> 추천 전공
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {majors.map((m, i) => (
                      <span
                        key={i}
                        className="text-xs bg-dream/10 text-dream rounded-full px-3 py-1 font-medium"
                        data-testid={`badge-recommended-major-${i}`}
                      >
                        {typeof m === "string" ? m : (m as any).name}
                        {typeof m !== "string" && (m as any).matchScore && (
                          <span className="ml-1 opacity-70">{(m as any).matchScore}%</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {jobs.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-coral" /> 추천 직업
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {jobs.map((j, i) => (
                      <span
                        key={i}
                        className="text-xs bg-coral/10 text-coral rounded-full px-3 py-1 font-medium"
                        data-testid={`badge-recommended-job-${i}`}
                      >
                        {typeof j === "string" ? j : (j as any).name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 border-dream/30 text-dream"
                onClick={() => navigate("/aptitude")}
                data-testid="btn-retake-aptitude"
              >
                설문 재응시
              </Button>
              <p className="text-xs text-gray-400">
                * 더 정확한 추천을 위해 적성 설문을 다시 응시할 수 있습니다
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---- Holland Code → Label (출처: 커리어넷 직업심리학 분류 체계) ----
// 데이터 정확성 원칙: 커리어넷 DB에서 가져온 홀랜드 코드를 그대로 표시.
// LLM으로 홀랜드 코드를 생성하거나 추측하여 채워넣는 것을 금지함.
const hollandLabel: Record<string, { name: string; desc: string }> = {
  R: { name: "실재형", desc: "기계, 도구, 동물 등 구체적 대상을 다루는 활동 선호" },
  I: { name: "탐구형", desc: "탐구, 분석, 연구 등 지적 활동 선호" },
  A: { name: "예술형", desc: "창의적, 자유로운 표현 활동 선호" },
  S: { name: "사회형", desc: "사람을 돕고, 가르치고, 돌보는 활동 선호" },
  E: { name: "진취형", desc: "조직을 이끌고, 설득하고, 관리하는 활동 선호" },
  C: { name: "관습형", desc: "정해진 규칙과 절차에 따라 체계적으로 일하는 것 선호" },
};

/** "SAI" → "S=사회형, A=예술형, I=탐구형" */
function hollandExpand(code: string | null): string | null {
  if (!code) return null;
  const parts = code.trim().toUpperCase().split('').filter(c => hollandLabel[c]);
  if (parts.length === 0) return null;
  return parts.map(c => `${c}=${hollandLabel[c].name}`).join(', ');
}

/** JSON 배열 또는 쉼표 구분 문자열로 저장된 관련 과목을 읽기 좋게 변환 */
function parseSubjects(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.join(', ');
  } catch {}
  return raw;
}

// ---- Demand Badge ----
function DemandBadge({ demand }: { demand: string | null }) {
  if (!demand) return null;
  const map: Record<string, { label: string; cls: string }> = {
    "매우 높음": { label: "수요 매우 높음", cls: "bg-emerald-100 text-emerald-700" },
    "높음":     { label: "수요 높음",     cls: "bg-green-100 text-green-700" },
    "보통":     { label: "수요 보통",     cls: "bg-amber-100 text-amber-700" },
    "낮음":     { label: "수요 낮음",     cls: "bg-orange-100 text-orange-600" },
    "매우 낮음": { label: "수요 매우 낮음", cls: "bg-red-100 text-red-600" },
  };
  const d = map[demand] ?? { label: demand, cls: "bg-gray-100 text-gray-600" };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.cls}`}
      title="졸업 후 취업 시장 수요 전망"
    >
      {d.label}
    </span>
  );
}

// ---- Major Card ----
function MajorCard({ major }: { major: Major }) {
  const [showMore, setShowMore] = useState(false);
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [univPage, setUnivPage] = useState(1);
  const [univRegion, setUnivRegion] = useState<string>("전체");
  const [univSort, setUnivSort] = useState<"경쟁률" | "취업률" | "이름">("경쟁률");

  const UNIV_PER_PAGE = 6;

  const jobs: string[] = Array.isArray(major.relatedJobs) ? major.relatedJobs : [];
  const visibleJobs = showAllJobs ? jobs : jobs.slice(0, 5);

  // 관련 직업 통계 — showMore 시 lazy fetch
  const jobStatsQuery = useQuery<{
    avgSalaryWan: number | null;
    minSalaryWan: number | null;
    maxSalaryWan: number | null;
    jobCount: number;
    jobsWithSalary: number;
    dominantGrowth: string | null;
  }>({
    queryKey: ["/api/explore/majors/job-stats", major.majorName],
    queryFn: () =>
      fetch(`/api/explore/majors/${encodeURIComponent(major.majorName)}/job-stats`)
        .then(r => r.json()),
    enabled: showMore,
    staleTime: 1000 * 60 * 30,
  });
  const jobStats = jobStatsQuery.data;

  // 개설 대학 — 전용 API에서 실시간 조회
  const univQuery = useQuery<{ data: MajorUnivEntry[]; total: number }>({
    queryKey: ["/api/explore/majors/universities", major.majorName],
    queryFn: () =>
      fetch(`/api/explore/majors/${encodeURIComponent(major.majorName)}/universities`)
        .then(r => r.json()),
    staleTime: 1000 * 60 * 10,
  });
  const univs = univQuery.data?.data ?? [];

  // Unique regions for filter
  const regions = ["전체", ...Array.from(new Set(univs.map(u => u.region ?? "기타").filter(Boolean)))
    .sort((a, b) => {
      const order = ["서울", "경기", "인천", "부산", "대전", "대구", "광주", "울산", "경북", "경남", "충북", "충남", "전북", "전남", "강원", "제주", "세종"];
      const ai = order.indexOf(a), bi = order.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
  ];

  // Filtered + sorted
  const filteredUnivs = univs
    .filter(u => univRegion === "전체" || u.region === univRegion)
    .sort((a, b) => {
      if (univSort === "경쟁률") return (b.competitionRate ?? 0) - (a.competitionRate ?? 0);
      if (univSort === "취업률") return (b.employmentRate ?? 0) - (a.employmentRate ?? 0);
      return (a.univName ?? "").localeCompare(b.univName ?? "", "ko");
    });

  const totalPages = Math.ceil(filteredUnivs.length / UNIV_PER_PAGE);
  const visibleUnivs = filteredUnivs.slice(0, univPage * UNIV_PER_PAGE);

  const avgEmp = univs.length > 0
    ? (univs.reduce((s, u) => s + (u.employmentRate ?? 0), 0) / univs.length).toFixed(1)
    : null;

  return (
    <Card
      className="hover:shadow-md transition-shadow border border-gray-100"
      data-testid={`card-major-${major.id}`}
    >
      <CardContent className="p-4 space-y-3">

        {/* ── Header: name + badges ── */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-ink text-base leading-tight" data-testid={`text-major-name-${major.id}`}>
            {major.majorName}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
            {major.category && (
              <span className="text-xs font-medium bg-dream/10 text-dream px-2 py-0.5 rounded-full">
                {major.category}
              </span>
            )}
            <DemandBadge demand={major.demand} />
          </div>
        </div>

        {/* ── Description ── */}
        {major.description && (
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
            {major.description}
          </p>
        )}

        {/* ── 장래 직업 ── */}
        {jobs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-coral" />
              장래 직업
            </p>
            <div className="flex flex-wrap gap-1">
              {visibleJobs.map((j, i) => (
                <span
                  key={i}
                  className="text-xs bg-coral/10 text-coral rounded-full px-2 py-0.5"
                  data-testid={`tag-job-${major.id}-${i}`}
                >
                  {j}
                </span>
              ))}
              {!showAllJobs && jobs.length > 5 && (
                <button
                  className="text-xs text-gray-400 hover:text-gray-600 px-1"
                  onClick={() => setShowAllJobs(true)}
                  data-testid={`btn-show-all-jobs-${major.id}`}
                >
                  +{jobs.length - 5}개 더
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── 개설 대학 ── */}
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-dream" />
              개설 대학
              {univs.length > 0 && (
                <span className="ml-1 text-dream font-bold">{univs.length}개</span>
              )}
            </p>
            {univs.length > 0 && (
              <div className="flex items-center gap-1">
                {(["경쟁률", "취업률", "이름"] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => { setUnivSort(s); setUnivPage(1); }}
                    className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                      univSort === s
                        ? "bg-dream text-white border-dream"
                        : "text-gray-400 border-gray-200 hover:border-dream hover:text-dream"
                    }`}
                    data-testid={`btn-sort-${s}-${major.id}`}
                  >
                    {s}순
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Region filter chips — show when ≥4 regions */}
          {regions.length >= 5 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {regions.map(r => (
                <button
                  key={r}
                  onClick={() => { setUnivRegion(r); setUnivPage(1); }}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    univRegion === r
                      ? "bg-coral text-white border-coral"
                      : "text-gray-400 border-gray-200 hover:border-coral hover:text-coral"
                  }`}
                  data-testid={`btn-region-${r}-${major.id}`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {univQuery.isLoading ? (
            <div className="space-y-1">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-6 w-full rounded" />
              ))}
            </div>
          ) : univs.length === 0 ? (
            <div className="flex flex-col gap-1 py-2 px-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-gray-300" />
                <span className="text-xs text-gray-500 font-medium">개설 대학 데이터 없음</span>
              </div>
              <p className="text-xs text-gray-400 pl-6">
                현재 데이터에서 이 학과명으로 개설된 대학을 찾을 수 없습니다.
              </p>
            </div>
          ) : filteredUnivs.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">해당 지역에 개설된 대학이 없습니다.</p>
          ) : (
            <>
              <div className="space-y-1">
                {visibleUnivs.map((u, i) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0"
                    data-testid={`row-univ-${major.id}-${i}`}
                  >
                    <span className="font-medium text-ink flex items-center gap-1 min-w-0 truncate">
                      <MapPin className="w-3 h-3 text-gray-300 flex-shrink-0" />
                      <span className="truncate">{u.univName}</span>
                      {u.region && <span className="text-gray-400 font-normal flex-shrink-0">({u.region})</span>}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {u.competitionRate != null && u.competitionRate > 0 && (
                        <span
                          className="text-orange-500 font-medium flex items-center gap-0.5"
                          title="대학 전체 신입생 경쟁률 기준 (학과별 수치 아님)"
                        >
                          <TrendingUp className="w-3 h-3" />
                          {u.competitionRate.toFixed(1)}:1
                          <span className="text-[9px] text-orange-300 font-normal ml-0.5">전체</span>
                        </span>
                      )}
                      {u.employmentRate != null && u.employmentRate > 0 && (
                        <span
                          className="text-blue-600 font-medium flex items-center gap-0.5"
                          title="대학 전체 취업률 기준 (학과별 수치 아님)"
                        >
                          <Award className="w-3 h-3" />
                          {u.employmentRate.toFixed(0)}%
                          <span className="text-[9px] text-blue-300 font-normal ml-0.5">전체</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Load more */}
              {univPage < totalPages && (
                <button
                  className="mt-1.5 w-full text-xs text-dream hover:underline flex items-center justify-center gap-0.5 py-1"
                  onClick={() => setUnivPage(p => p + 1)}
                  data-testid={`btn-load-more-univs-${major.id}`}
                >
                  <ChevronDown className="w-3 h-3" />
                  더 보기 ({filteredUnivs.length - visibleUnivs.length}개 남음)
                </button>
              )}
              {univPage > 1 && (
                <button
                  className="mt-0.5 w-full text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-0.5 py-0.5"
                  onClick={() => setUnivPage(1)}
                  data-testid={`btn-collapse-univs-${major.id}`}
                >
                  <ChevronUp className="w-3 h-3" /> 접기
                </button>
              )}

              {/* Footer summary */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 text-xs text-gray-500">
                {avgEmp && Number(avgEmp) > 0 && (
                  <span
                    className="flex items-center gap-1"
                    title="개설 대학들의 학교 전체 취업률 평균 (학과별 수치 아님)"
                  >
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    개설 대학 평균 취업률&nbsp;
                    <strong className="text-emerald-600">{avgEmp}%</strong>
                    <span className="text-[9px] text-gray-400">(대학 전체 기준)</span>
                  </span>
                )}
                <span className="flex items-center gap-1 ml-auto">
                  <GraduationCap className="w-3 h-3 text-dream" />
                  총 <strong className="text-dream">{univs.length}</strong>개 대학
                </span>
              </div>
            </>
          )}
        </div>

        {/* ── 더 보기 토글 ── */}
        {(major.demand || major.relatedSubjects || major.hollandCode) && (
          <div>
            <button
              className="text-xs text-gray-400 hover:text-dream flex items-center gap-0.5 mt-1"
              onClick={() => setShowMore(v => !v)}
              data-testid={`btn-more-${major.id}`}
            >
              {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showMore ? "접기" : "추가 정보"}
            </button>

            {showMore && (
              <div className="mt-2 space-y-1.5 text-xs text-gray-600 pl-1">
                {/* 관련 직업 급여 범위 — source: cached_jobs */}
                {jobStats && jobStats.jobsWithSalary > 0 &&
                  jobStats.minSalaryWan != null && jobStats.maxSalaryWan != null && (
                  <div className="flex items-start gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                    <span>
                      <span className="font-medium text-gold">관련 직업 급여 범위: </span>
                      <span className="font-semibold text-amber-700">
                        연평균 {jobStats.minSalaryWan.toLocaleString()}만원
                        {jobStats.minSalaryWan !== jobStats.maxSalaryWan && (
                          <> ~ {jobStats.maxSalaryWan.toLocaleString()}만원</>
                        )}
                      </span>
                      <span className="text-gray-400 ml-1 text-[10px]">
                        (관련 직업 {jobStats.jobsWithSalary}개 기준)
                      </span>
                    </span>
                  </div>
                )}
                {/* 관련 직업 고용전망 — source: cached_jobs */}
                {jobStats?.dominantGrowth && (
                  <div className="flex items-center gap-1.5">
                    {jobStats.dominantGrowth.includes("증가") ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    ) : jobStats.dominantGrowth.includes("감소") ? (
                      <TrendingDown className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    ) : (
                      <Minus className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    )}
                    <span>
                      <span className="font-medium">관련 직업 고용전망: </span>
                      <span className={`font-semibold ${
                        jobStats.dominantGrowth.includes("증가") ? "text-emerald-600" :
                        jobStats.dominantGrowth.includes("감소") ? "text-red-500" : "text-gray-600"
                      }`}>{jobStats.dominantGrowth}</span>
                    </span>
                  </div>
                )}
                {/* 홀랜드 코드 — source: careernet */}
                {major.hollandCode && hollandExpand(major.hollandCode) && (
                  <div className="space-y-1">
                    <div className="flex items-start gap-1.5">
                      <span className="font-medium text-dream flex-shrink-0">홀랜드 코드: </span>
                      <span>
                        <span className="font-semibold">{major.hollandCode}</span>
                        <span className="text-gray-500 ml-1">({hollandExpand(major.hollandCode)})</span>
                      </span>
                    </div>
                    <div className="text-gray-400 text-[10px] leading-relaxed pl-0.5">
                      홀랜드 코드는 직업심리학자 존 홀랜드(John Holland)가 개발한 직업 흥미 유형 분류 체계로,
                      6가지 유형(R실재형, I탐구형, A예술형, S사회형, E진취형, C관습형)의 조합으로 해당 학과/직업의 특성을 나타냅니다.
                    </div>
                  </div>
                )}
                {/* 수요전망 — source: ai */}
                {major.demand && (
                  <div>
                    <span className="font-medium text-gold">수요전망: </span>{major.demand}
                    <span className="text-gray-400 ml-1">(AI 예측)</span>
                  </div>
                )}
                {/* 관련 과목 — source: careernet */}
                {parseSubjects(major.relatedSubjects) && (
                  <div>
                    <span className="font-medium">관련 과목: </span>
                    {parseSubjects(major.relatedSubjects)}
                  </div>
                )}

                {/* 공통 출처 — 섹션 하단에 한 번만 표시 */}
                <div className="pt-1 border-t border-gray-100 text-[10px] text-gray-400">
                  출처: 커리어넷{major.demand ? " | 수요전망은 AI 예측" : ""}
                </div>
              </div>
            )}
          </div>
        )}

      </CardContent>
    </Card>
  );
}

// ---- Major Detail Modal ----
function MajorDetailModal({
  majorName,
  onClose,
  onNavigate,
}: {
  majorName: string;
  onClose: () => void;
  onNavigate: (name: string) => void;
}) {
  const { data, isLoading } = useQuery<{ data: Major[]; total: number }>({
    queryKey: ['major-modal', majorName],
    queryFn: () =>
      fetch(`/api/explore/majors?search=${encodeURIComponent(majorName)}&limit=10`)
        .then(r => r.json()),
  });
  const major = data?.data?.find(m => m.majorName === majorName) ?? data?.data?.[0] ?? null;

  const { data: jobStats } = useQuery<{
    minSalaryWan: number | null;
    maxSalaryWan: number | null;
    jobsWithSalary: number;
  }>({
    queryKey: ['major-job-stats', majorName],
    queryFn: () =>
      fetch(`/api/explore/majors/${encodeURIComponent(majorName)}/job-stats`)
        .then(r => r.json()),
    enabled: !!major,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="modal-major-detail"
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="font-bold text-dream text-base">{majorName}</h2>
            {major?.category && (
              <span className="text-xs text-gray-400">{major.category}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1"
            data-testid="btn-close-modal"
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div className="p-4 space-y-3 text-sm overflow-y-auto flex-1">
          {isLoading ? (
            <p className="text-gray-400 text-xs">불러오는 중...</p>
          ) : major ? (
            <>
              {major.description && (
                <div>
                  <p className="font-semibold text-gray-700 mb-1 flex items-center gap-1 text-xs">
                    📝 학과 설명
                  </p>
                  <p className="text-gray-600 leading-relaxed text-xs">{major.description}</p>
                </div>
              )}
              {Array.isArray(major.relatedJobs) && major.relatedJobs.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-700 mb-1.5 flex items-center gap-1 text-xs">
                    💼 관련 직업
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {major.relatedJobs.slice(0, 5).map((j: string, i: number) => (
                      <span key={i} className="bg-coral/10 text-coral rounded-full px-2 py-0.5 text-xs">{j}</span>
                    ))}
                  </div>
                </div>
              )}
              {jobStats && jobStats.jobsWithSalary > 0 &&
                jobStats.minSalaryWan != null && jobStats.maxSalaryWan != null && (
                <div>
                  <p className="font-semibold text-gray-700 mb-1 flex items-center gap-1 text-xs">
                    💰 관련 직업 급여 범위
                  </p>
                  <div className="text-xs text-emerald-600 font-semibold">
                    연평균 {jobStats.minSalaryWan.toLocaleString()}만원
                    {jobStats.minSalaryWan !== jobStats.maxSalaryWan && (
                      <> ~ {jobStats.maxSalaryWan.toLocaleString()}만원</>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    (관련 직업 {jobStats.jobsWithSalary}개 기준)
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-xs">이 전공의 상세 정보는 아직 준비 중입니다.</p>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t border-gray-100 flex gap-2 rounded-b-xl">
          <button
            data-testid="btn-modal-navigate"
            onClick={() => { onNavigate(majorName); onClose(); }}
            className="flex-1 text-xs bg-dream/10 text-dream rounded-lg py-2 hover:bg-dream/20 transition-colors font-medium"
          >
            {major ? '전공 탭에서 자세히 보기 →' : '전공 탭에서 검색하기 →'}
          </button>
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 px-3"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Job Card ----
function JobCard({
  job,
  validMajors,
  onMajorClick,
}: {
  job: Job;
  validMajors: Set<string>;
  onMajorClick: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [modalMajor, setModalMajor] = useState<string | null>(null);
  // DB에 있는 related_majors만 표시. LLM 생성 금지.
  const majors: string[] = Array.isArray(job.relatedMajors) ? job.relatedMajors : [];
  const hasExtra = !!(job.growth || majors.length > 0);

  return (
    <>
      {modalMajor && (
        <MajorDetailModal
          majorName={modalMajor}
          onClose={() => setModalMajor(null)}
          onNavigate={name => { onMajorClick(name); setModalMajor(null); }}
        />
      )}
      <Card
        className="hover:shadow-md transition-shadow border border-gray-100"
        data-testid={`card-job-${job.id}`}
      >
        <CardContent className="p-4">
          {/* ── 접힌 상태 (항상 표시) ── */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-ink text-sm" data-testid={`text-job-name-${job.id}`}>
                  {job.jobName}
                </h3>
                {job.field && (
                  <span className="text-[10px] text-gray-400 font-normal leading-none" data-testid={`text-job-field-${job.id}`}>
                    {job.field}
                  </span>
                )}
              </div>
              {/* 설명: 말줄임 없이 전체 표시 */}
              {job.description && (
                <p className="text-xs text-gray-500 leading-relaxed">{job.description}</p>
              )}
              {/* 급여 (데이터 있을 때만) */}
              {job.salary != null && job.salary > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <Banknote className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-emerald-600">
                    연평균 {Math.round(job.salary / 10000).toLocaleString()}만원
                  </span>
                </div>
              )}
            </div>
            {/* 우측 상단 chevron (추가 정보 있을 때만) */}
            {hasExtra && (
              <button
                className="flex-shrink-0 text-gray-400 mt-1 hover:text-gray-600"
                onClick={() => setOpen(o => !o)}
                data-testid={`btn-job-toggle-${job.id}`}
              >
                {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* ── 펼침 영역 (수요전망 + 관련 전공만, 접힌 내용 반복 금지) ── */}
          {open && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 text-xs">
              {/* 수요전망: 전문 표시, 잘리지 않음 */}
              {job.growth && (
                <div className="flex items-start gap-1.5">
                  {job.growth.includes("증가") ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : job.growth.includes("감소") ? (
                    <TrendingDown className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-medium text-gray-700">수요전망: </span>
                    <span className="text-gray-600 leading-relaxed">{job.growth}</span>
                  </div>
                </div>
              )}

              {/* 관련 전공 전체 목록 (모달로 열기) */}
              {majors.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-dream" /> 관련 전공
                  </p>
                  <ul className="space-y-1 pl-1">
                    {majors.map((m, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="text-gray-400">•</span>
                        {validMajors.has(m) ? (
                          <button
                            data-testid={`btn-major-detail-${job.id}-${i}`}
                            onClick={() => setModalMajor(m)}
                            className="text-dream hover:underline text-left"
                          >
                            {m} <span className="text-gray-400 text-[10px]">→ 전공 상세보기</span>
                          </button>
                        ) : (
                          <span className="text-gray-600">{m}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ── 하단 토글 버튼 (추가 정보 있을 때만 표시) ── */}
          {hasExtra && (
            <button
              data-testid={`btn-job-expand-${job.id}`}
              onClick={() => setOpen(o => !o)}
              className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-dream transition-colors border-t border-gray-50 pt-2"
            >
              {open ? (
                <><ChevronUp className="w-3 h-3" /> 관련 전공 접기</>
              ) : (
                <><ChevronDown className="w-3 h-3" /> 관련 전공</>
              )}
            </button>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ---- Stat Row helper for university card ----
function StatRow({ icon, label, value, color = "text-ink" }: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <span className="text-xs text-gray-500">{label} </span>
        <span className={`text-xs font-bold ${color}`}>{value}</span>
      </div>
    </div>
  );
}

// ---- University Card (2-column grid style) ----
function UniversityCard({ univ }: { univ: University }) {
  const tuitionWan = univ.avgTuition && univ.avgTuition > 0 ? Math.round(univ.avgTuition / 10) : null;
  const scholarshipWan = univ.scholarshipPerStudent && univ.scholarshipPerStudent > 0
    ? Math.round(univ.scholarshipPerStudent / 10000)
    : null;
  const none = <span className="text-gray-400 font-normal">없음</span>;

  return (
    <Card className="border border-gray-100 hover:shadow-md transition-shadow" data-testid={`card-univ-${univ.id}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-ink text-sm leading-tight" data-testid={`text-univ-name-${univ.id}`}>
              {univ.univName}
            </h3>
            {univ.campusType && univ.campusType !== "본교" && (
              <p className="text-xs text-gray-400 mt-0.5">{univ.campusType}</p>
            )}
          </div>
          <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
            {univ.region && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                <MapPin className="w-2.5 h-2.5" /> {univ.region}
              </span>
            )}
            {univ.foundationType && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {univ.foundationType}
              </span>
            )}
          </div>
        </div>

        {/* Stats grid — always 3 rows × 2 cols, shows 없음 when missing */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <StatRow
            icon={<TrendingUp className="w-3.5 h-3.5 text-coral" />}
            label="경쟁률 (학교 전체)"
            value={univ.competitionRate && univ.competitionRate > 0
              ? `${univ.competitionRate.toFixed(1)}:1` : none}
          />
          <StatRow
            icon={<Briefcase className="w-3.5 h-3.5 text-emerald-500" />}
            label="취업률 (학교 전체)"
            value={univ.employmentRate && univ.employmentRate > 0
              ? `${univ.employmentRate.toFixed(1)}%` : none}
            color="text-emerald-600"
          />
          <StatRow
            icon={<Banknote className="w-3.5 h-3.5 text-gold" />}
            label="등록금"
            value={tuitionWan ? `${tuitionWan.toLocaleString()}만원` : none}
          />
          <StatRow
            icon={<Home className="w-3.5 h-3.5 text-dream" />}
            label="기숙사 수용률"
            value={univ.dormitoryRate && univ.dormitoryRate > 0
              ? `${univ.dormitoryRate.toFixed(1)}%` : none}
            color="text-dream"
          />
          <StatRow
            icon={<Users className="w-3.5 h-3.5 text-blue-400" />}
            label="재학생"
            value={univ.studentCount && univ.studentCount > 0
              ? `${univ.studentCount.toLocaleString()}명` : none}
          />
          <StatRow
            icon={<Award className="w-3.5 h-3.5 text-amber-500" />}
            label="1인당 장학금"
            value={scholarshipWan ? `${scholarshipWan.toLocaleString()}만원` : none}
            color="text-amber-600"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Pagination ----
function Pagination({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  // Build visible page numbers: show up to 10 around current page
  const range = 5;
  let start = Math.max(1, page - range);
  let end = Math.min(totalPages, page + range);
  if (end - start < 9) {
    if (start === 1) end = Math.min(totalPages, start + 9);
    else start = Math.max(1, end - 9);
  }
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1 mt-6 flex-wrap">
      {/* 첫 페이지 */}
      <Button
        variant="outline" size="icon"
        className="w-7 h-7"
        disabled={page <= 1}
        onClick={() => onPage(1)}
        data-testid="btn-first-page"
        title="첫 페이지"
      >
        <ChevronsLeft className="w-3.5 h-3.5" />
      </Button>
      {/* 이전 */}
      <Button
        variant="outline" size="icon"
        className="w-7 h-7"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        data-testid="btn-prev-page"
        title="이전"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </Button>

      {/* Page numbers */}
      {start > 1 && <span className="text-xs text-gray-400 px-1">…</span>}
      {pages.map(p => (
        <Button
          key={p}
          variant={p === page ? "default" : "outline"}
          size="icon"
          className={`w-7 h-7 text-xs ${p === page ? "bg-dream text-white hover:bg-dream/90" : ""}`}
          onClick={() => onPage(p)}
          data-testid={`btn-page-${p}`}
        >
          {p}
        </Button>
      ))}
      {end < totalPages && <span className="text-xs text-gray-400 px-1">…</span>}

      {/* 다음 */}
      <Button
        variant="outline" size="icon"
        className="w-7 h-7"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        data-testid="btn-next-page"
        title="다음"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </Button>
      {/* 마지막 페이지 */}
      <Button
        variant="outline" size="icon"
        className="w-7 h-7"
        disabled={page >= totalPages}
        onClick={() => onPage(totalPages)}
        data-testid="btn-last-page"
        title="마지막 페이지"
      >
        <ChevronsRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

// ---- Skeleton Grid ----
function SkeletonGrid({ cols = 2 }: { cols?: number }) {
  return (
    <div className={`grid gap-3 ${cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border border-gray-100">
          <CardContent className="p-4">
            <Skeleton className="h-4 w-2/3 mb-2" />
            <Skeleton className="h-3 w-1/3 mb-3" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---- Main Page ----
export default function ExploreDB() {
  const [tab, setTab] = useState<"universities" | "majors" | "jobs">("universities");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("all");
  const [field, setField] = useState("all");
  const [majorFilter, setMajorFilter] = useState("all");
  const [region, setRegion] = useState("all");
  const [sort, setSort] = useState("competition");
  const [page, setPage] = useState(1);

  const { data: categories } = useQuery<Categories>({
    queryKey: ["/api/explore/categories"],
    staleTime: 1000 * 60 * 10,
  });

  const { data: latestAptitude, isLoading: aptitudeLoading } = useQuery<AptitudeResult>({
    queryKey: ["/api/aptitude/latest"],
    retry: false,
  });

  const univsQuery = useQuery<ApiResponse<University>>({
    queryKey: ["/api/explore/universities", search, region, sort, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20", sort });
      if (search) params.set("search", search);
      if (region && region !== "all") params.set("region", region);
      return fetch(`/api/explore/universities?${params}`).then(r => r.json());
    },
    enabled: tab === "universities",
  });

  const majorsQuery = useQuery<ApiResponse<Major>>({
    queryKey: ["/api/explore/majors", search, category, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (category && category !== "all") params.set("category", category);
      return fetch(`/api/explore/majors?${params}`).then(r => r.json());
    },
    enabled: tab === "majors",
  });

  const jobsQuery = useQuery<ApiResponse<Job>>({
    queryKey: ["/api/explore/jobs", search, field, majorFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (field && field !== "all") params.set("field", field);
      if (majorFilter && majorFilter !== "all") params.set("major", majorFilter);
      return fetch(`/api/explore/jobs?${params}`).then(r => r.json());
    },
    enabled: tab === "jobs",
  });

  // DB에 있는 전공명 Set — 직업 카드에서 링크 활성화 여부 결정용
  const validMajors = new Set<string>(categories?.majorNames ?? []);

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleTabChange = (t: string) => {
    setTab(t as any);
    setSearch("");
    setSearchInput("");
    setPage(1);
    setField("all");
    setMajorFilter("all");
  };

  const handleFilter = (value: string, setter: (v: string) => void) => {
    setter(value);
    setPage(1);
  };

  // 직업 카드에서 전공명 클릭 → 전공 탭으로 이동 후 검색
  const navigateToMajor = useCallback((majorName: string) => {
    setTab("majors");
    setSearch(majorName);
    setSearchInput(majorName);
    setPage(1);
  }, []);

  const majorTotal = 235;
  const jobTotal = 443;
  const univTotal = univsQuery.data?.total ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-dream" />
            전공/진로 탐색
          </h1>
          <p className="text-sm text-gray-500 mt-1">대학·전공·직업 정보를 탐색하고 나에게 맞는 진로를 찾아보세요</p>
        </div>
      </div>

      {/* AI Recommendation Banner */}
      <AiRecommendBanner result={latestAptitude ?? null} isLoading={aptitudeLoading} />

      {/* Tabs */}
      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList className="bg-gray-100 p-1 rounded-xl h-auto" data-testid="tabs-explore">
          <TabsTrigger
            value="universities"
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-dream data-[state=active]:text-white"
            data-testid="tab-universities"
          >
            <Building2 className="w-4 h-4" /> 대학 정보 <span className="text-xs opacity-70">({univTotal})</span>
          </TabsTrigger>
          <TabsTrigger
            value="majors"
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-dream data-[state=active]:text-white"
            data-testid="tab-majors"
          >
            <GraduationCap className="w-4 h-4" /> 전공 정보 <span className="text-xs opacity-70">({majorTotal})</span>
          </TabsTrigger>
          <TabsTrigger
            value="jobs"
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-coral data-[state=active]:text-white"
            data-testid="tab-jobs"
          >
            <Briefcase className="w-4 h-4" /> 직업 정보 <span className="text-xs opacity-70">({jobTotal})</span>
          </TabsTrigger>
        </TabsList>

        {/* ===== 대학 정보 탭 ===== */}
        <TabsContent value="universities" className="mt-4 space-y-4">
          {/* Search + Filter row */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                data-testid="input-search-univ"
                className="pl-9"
                placeholder="대학명 검색..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Select value={region} onValueChange={v => handleFilter(v, setRegion)} data-testid="select-region">
              <SelectTrigger className="w-28" data-testid="select-trigger-region">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {categories?.regions.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={v => { setSort(v); setPage(1); }} data-testid="select-sort">
              <SelectTrigger className="w-38" data-testid="select-trigger-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="competition">경쟁률 높은 순</SelectItem>
                <SelectItem value="employment">취업률 높은 순</SelectItem>
                <SelectItem value="tuition_asc">등록금 낮은 순</SelectItem>
                <SelectItem value="tuition_desc">등록금 높은 순</SelectItem>
                <SelectItem value="name">이름 순</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="bg-dream hover:bg-dream/90 text-white" data-testid="btn-search-univ">
              검색
            </Button>
          </div>

          {/* Count */}
          {!univsQuery.isLoading && (
            <p className="text-xs text-gray-400">총 {univsQuery.data?.total ?? 0}개 대학</p>
          )}

          {/* Grid */}
          {univsQuery.isLoading ? (
            <SkeletonGrid cols={2} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(univsQuery.data?.data ?? []).map(u => (
                  <UniversityCard key={u.id} univ={u} />
                ))}
              </div>
              <Pagination
                page={page}
                total={univsQuery.data?.total ?? 0}
                limit={20}
                onPage={setPage}
              />
            </>
          )}
        </TabsContent>

        {/* ===== 전공 탭 ===== */}
        <TabsContent value="majors" className="mt-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                data-testid="input-search-major"
                className="pl-9"
                placeholder="학과명 검색..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Select value={category} onValueChange={v => handleFilter(v, setCategory)} data-testid="select-category">
              <SelectTrigger className="w-36" data-testid="select-trigger-category">
                <SelectValue placeholder="계열 전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">계열 전체</SelectItem>
                {[...(categories?.majorCategories ?? [])].sort((a, b) => {
                  if (a === "기타") return 1;
                  if (b === "기타") return -1;
                  return a.localeCompare(b, "ko");
                }).map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="bg-dream hover:bg-dream/90 text-white" data-testid="btn-search-major">
              검색
            </Button>
          </div>
          {!majorsQuery.isLoading && (
            <p className="text-xs text-gray-400">총 {majorsQuery.data?.total ?? 0}개 학과</p>
          )}
          {majorsQuery.isLoading ? (
            <SkeletonGrid cols={1} />
          ) : (
            <>
              <div className="space-y-3">
                {(majorsQuery.data?.data ?? []).map(m => (
                  <MajorCard key={m.id} major={m} />
                ))}
              </div>
              <Pagination
                page={page}
                total={majorsQuery.data?.total ?? 0}
                limit={20}
                onPage={setPage}
              />
            </>
          )}
        </TabsContent>

        {/* ===== 직업 탭 ===== */}
        <TabsContent value="jobs" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                data-testid="input-search-job"
                className="pl-9"
                placeholder="직업명 검색..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Select value={field} onValueChange={v => handleFilter(v, setField)} data-testid="select-field">
              <SelectTrigger className="w-40" data-testid="select-trigger-field">
                <SelectValue placeholder="직업 분야 전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">직업 분야 전체</SelectItem>
                {categories?.jobFields.map(f => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={majorFilter} onValueChange={v => handleFilter(v, setMajorFilter)} data-testid="select-major-filter">
              <SelectTrigger className="w-40" data-testid="select-trigger-major-filter">
                <SelectValue placeholder="관련 전공 전체" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="all">관련 전공 전체</SelectItem>
                {(categories?.majorNames ?? []).map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="bg-dream hover:bg-dream/90 text-white" data-testid="btn-search-job">
              검색
            </Button>
          </div>
          {!jobsQuery.isLoading && (
            <p className="text-xs text-gray-400">총 {jobsQuery.data?.total ?? 0}개 직업</p>
          )}
          {jobsQuery.isLoading ? (
            <SkeletonGrid cols={1} />
          ) : (
            <>
              <div className="space-y-3">
                {(jobsQuery.data?.data ?? []).map(j => (
                  <JobCard key={j.id} job={j} validMajors={validMajors} onMajorClick={navigateToMajor} />
                ))}
              </div>
              <Pagination
                page={page}
                total={jobsQuery.data?.total ?? 0}
                limit={20}
                onPage={setPage}
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
