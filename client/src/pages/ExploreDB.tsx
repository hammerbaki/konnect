import { useState, useCallback } from "react";
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
  TrendingUp, TrendingDown, Minus, BookOpen, Award, MapPin, DollarSign,
  Database, Wifi, Sparkles, Home
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
}

interface UnivEntry {
  univName: string;
  region: string;
  competition: number;
  employmentRate: number;
  tuition: number;
  scholarship: number;
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

function truncate(str: string | null, len = 80) {
  if (!str) return "설명 없음";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

// ---- AI Recommendation Banner ----
function AiRecommendBanner({ result }: { result: AptitudeResult | null | undefined; isLoading: boolean }) {
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState(false);

  const majors = result?.recommendedMajors?.slice(0, 3) ?? [];
  const jobs = result?.recommendedJobs?.slice(0, 3) ?? [];

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
            <p className="text-sm font-semibold text-ink">AI 맞춤 추천</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {result
                ? "나의 적성 분석 결과를 기반으로 추천 전공과 진로를 제안받으세요"
                : "나의 적성 분석 결과를 기반으로 추천 전공과 진로를 제안받으세요"}
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
            {expanded ? "접기" : "결과 보기"}
          </Button>
        ) : (
          <Button
            size="sm"
            className="bg-dream hover:bg-dream/90 text-white shrink-0"
            onClick={(e) => { e.stopPropagation(); navigate("/aptitude"); }}
            data-testid="btn-go-aptitude"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            추천받기
          </Button>
        )}
      </div>

      {/* Expanded AI result card */}
      {result && expanded && (
        <Card className="border border-dream/15 bg-white shadow-sm">
          <CardContent className="p-5 space-y-4" data-testid="ai-result-card">
            <h3 className="text-sm font-semibold text-ink">AI 맞춤 추천 결과</h3>
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
                        {typeof m === "string" ? m : m.name}
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
                        {typeof j === "string" ? j : j.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---- Major Card ----
function MajorCard({ major }: { major: Major }) {
  const [open, setOpen] = useState(false);
  const univs: UnivEntry[] = Array.isArray(major.universities) ? major.universities : [];
  const jobs: string[] = Array.isArray(major.relatedJobs) ? major.relatedJobs : [];

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
      data-testid={`card-major-${major.id}`}
      onClick={() => setOpen(o => !o)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-ink text-sm" data-testid={`text-major-name-${major.id}`}>
                {major.majorName}
              </h3>
              {major.category && (
                <Badge variant="secondary" className="bg-dream/10 text-dream text-xs px-2 py-0 h-5">
                  {major.category}
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">{truncate(major.description, 100)}</p>
            {jobs.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {jobs.slice(0, 4).map((j, i) => (
                  <span key={i} className="text-xs bg-coral/10 text-coral rounded-full px-2 py-0.5">
                    {j}
                  </span>
                ))}
                {jobs.length > 4 && (
                  <span className="text-xs text-gray-400">+{jobs.length - 4}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex-shrink-0 text-gray-400 mt-1">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {open && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            {major.demand && (
              <div className="text-xs text-gray-600">
                <span className="font-medium text-gold">수요전망: </span>{major.demand}
              </div>
            )}
            {major.relatedSubjects && (
              <div className="text-xs text-gray-600">
                <span className="font-medium">관련 과목: </span>{major.relatedSubjects}
              </div>
            )}
            {univs.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-dream" /> 개설 대학
                </p>
                <div className="overflow-x-auto">
                  <table className="text-xs w-full min-w-[480px]">
                    <thead>
                      <tr className="text-gray-400 border-b">
                        <th className="text-left pb-1 font-medium">대학명</th>
                        <th className="text-left pb-1 font-medium">지역</th>
                        <th className="text-right pb-1 font-medium">경쟁률</th>
                        <th className="text-right pb-1 font-medium">대학취업률</th>
                        <th className="text-right pb-1 font-medium">등록금(만원)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {univs.slice(0, 10).map((u, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-1 font-medium text-ink">{u.univName}</td>
                          <td className="py-1 text-gray-500">{u.region}</td>
                          <td className="py-1 text-right">{u.competition?.toFixed(1) ?? "-"}</td>
                          <td className="py-1 text-right text-blue-600">{u.employmentRate?.toFixed(1) ?? "-"}%</td>
                          <td className="py-1 text-right">{u.tuition ? Math.round(u.tuition / 10).toLocaleString() : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {univs.length > 10 && (
                  <p className="text-xs text-gray-400 mt-1">외 {univs.length - 10}개 대학</p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Job Card ----
function JobCard({ job }: { job: Job }) {
  const [open, setOpen] = useState(false);
  const majors: string[] = Array.isArray(job.relatedMajors) ? job.relatedMajors : [];
  const quals: string[] = Array.isArray(job.qualifications) ? job.qualifications : [];

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
      data-testid={`card-job-${job.id}`}
      onClick={() => setOpen(o => !o)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-ink text-sm" data-testid={`text-job-name-${job.id}`}>
                {job.jobName}
              </h3>
              {job.field && (
                <Badge variant="secondary" className="bg-coral/10 text-coral text-xs px-2 py-0 h-5">
                  {job.field}
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">{truncate(job.description, 100)}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {job.salary && (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <DollarSign className="w-3.5 h-3.5" />
                  월평균 {Math.round(job.salary / 10000).toLocaleString()}만원
                </span>
              )}
              <GrowthBadge growth={job.growth} />
            </div>
          </div>
          <div className="flex-shrink-0 text-gray-400 mt-1">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {open && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            {job.description && (
              <p className="text-xs text-gray-600 leading-relaxed">{job.description}</p>
            )}
            {majors.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-dream" /> 관련 학과
                </p>
                <div className="flex flex-wrap gap-1">
                  {majors.map((m, i) => (
                    <span key={i} className="text-xs bg-dream/10 text-dream rounded-full px-2 py-0.5">{m}</span>
                  ))}
                </div>
              </div>
            )}
            {quals.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-gold" /> 필요 자격증
                </p>
                <div className="flex flex-wrap gap-1">
                  {quals.map((q, i) => (
                    <span key={i} className="text-xs bg-gold/10 text-gold rounded-full px-2 py-0.5">{q}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---- University Card (2-column grid style) ----
function UniversityCard({ univ }: { univ: University }) {
  const tuitionWan = univ.avgTuition ? Math.round(univ.avgTuition / 10) : null;

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

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {univ.competitionRate != null && univ.competitionRate > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-coral flex-shrink-0" />
              <div>
                <span className="text-xs text-gray-500">경쟁률 </span>
                <span className="text-xs font-bold text-ink">{univ.competitionRate.toFixed(1)}:1</span>
              </div>
            </div>
          )}
          {univ.employmentRate != null && univ.employmentRate > 0 && (
            <div className="flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <div>
                <span className="text-xs text-gray-500">취업률 </span>
                <span className="text-xs font-bold text-ink">{univ.employmentRate.toFixed(1)}%</span>
              </div>
            </div>
          )}
          {tuitionWan != null && tuitionWan > 0 && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-gold flex-shrink-0" />
              <div>
                <span className="text-xs text-gray-500">등록금 </span>
                <span className="text-xs font-bold text-ink">{tuitionWan.toLocaleString()}만원</span>
              </div>
            </div>
          )}
          {univ.dormitoryRate != null && univ.dormitoryRate > 0 && (
            <div className="flex items-center gap-2">
              <Home className="w-3.5 h-3.5 text-dream flex-shrink-0" />
              <div>
                <span className="text-xs text-gray-500">기숙사 </span>
                <span className="text-xs font-bold text-ink">{univ.dormitoryRate.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Pagination ----
function Pagination({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} data-testid="btn-prev-page">
        이전
      </Button>
      <span className="text-sm text-gray-600">{page} / {totalPages}</span>
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)} data-testid="btn-next-page">
        다음
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
    queryKey: ["/api/explore/jobs", search, field, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (field && field !== "all") params.set("field", field);
      return fetch(`/api/explore/jobs?${params}`).then(r => r.json());
    },
    enabled: tab === "jobs",
  });

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleTabChange = (t: string) => {
    setTab(t as any);
    setSearch("");
    setSearchInput("");
    setPage(1);
  };

  const handleFilter = (value: string, setter: (v: string) => void) => {
    setter(value);
    setPage(1);
  };

  const majorTotal = 235;
  const jobTotal = 552;
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
          <p className="text-sm text-gray-500 mt-1">전공·직업·대학 정보를 탐색하고 나에게 맞는 진로를 찾아보세요</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center" data-testid="api-status-bar">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full">
            <Wifi className="w-3 h-3" />
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            API 연동됨
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-dream/8 text-dream border border-dream/20 px-3 py-1.5 rounded-full">
            <Database className="w-3 h-3" />
            전공 {majorTotal} · 직업 {jobTotal} · 대학 {univsQuery.data?.total ?? 489}
          </span>
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
            <Building2 className="w-4 h-4" /> 대학 정보
          </TabsTrigger>
          <TabsTrigger
            value="majors"
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-dream data-[state=active]:text-white"
            data-testid="tab-majors"
          >
            <GraduationCap className="w-4 h-4" /> 전공 <span className="text-xs opacity-70">({majorTotal})</span>
          </TabsTrigger>
          <TabsTrigger
            value="jobs"
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-coral data-[state=active]:text-white"
            data-testid="tab-jobs"
          >
            <Briefcase className="w-4 h-4" /> 직업 <span className="text-xs opacity-70">({jobTotal})</span>
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
                {categories?.majorCategories.map(c => (
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
          <div className="flex gap-2">
            <div className="relative flex-1">
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
              <SelectTrigger className="w-44" data-testid="select-trigger-field">
                <SelectValue placeholder="직업 분야 전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">직업 분야 전체</SelectItem>
                {categories?.jobFields.map(f => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
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
                  <JobCard key={j.id} job={j} />
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
