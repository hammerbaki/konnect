import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Database, Wifi
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
  region: string | null;
  univType: string | null;
  foundationType: string | null;
  competitionRate: number | null;
  employmentRate: number | null;
  avgTuition: number | null;
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

// ---- University Card ----
function UniversityCard({ univ }: { univ: University }) {
  const tuitionWan = univ.avgTuition ? Math.round(univ.avgTuition / 10) : null;
  const scholarshipWan = univ.scholarshipPerStudent ? Math.round(univ.scholarshipPerStudent / 10000) : null;

  return (
    <Card className="border border-gray-100 hover:shadow-md transition-shadow" data-testid={`card-univ-${univ.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-ink text-sm" data-testid={`text-univ-name-${univ.id}`}>
                {univ.univName}
              </h3>
              {univ.foundationType && (
                <Badge variant="secondary" className="text-xs px-2 py-0 h-5 bg-gray-100 text-gray-600">
                  {univ.foundationType}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              {univ.region && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {univ.region}
                </span>
              )}
              {univ.univType && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {univ.univType}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {univ.competitionRate != null && (
            <div className="bg-dream/5 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">경쟁률</p>
              <p className="text-sm font-semibold text-dream">{univ.competitionRate.toFixed(1)}:1</p>
            </div>
          )}
          {univ.employmentRate != null && (
            <div className="bg-coral/5 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">취업률</p>
              <p className="text-sm font-semibold text-coral">{univ.employmentRate.toFixed(1)}%</p>
            </div>
          )}
          {tuitionWan != null && (
            <div className="bg-gold/5 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">평균 등록금</p>
              <p className="text-sm font-semibold text-gold">{tuitionWan.toLocaleString()}만원</p>
            </div>
          )}
          {scholarshipWan != null && (
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">1인당 장학금</p>
              <p className="text-sm font-semibold text-green-600">{scholarshipWan.toLocaleString()}만원</p>
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

// ---- Skeleton List ----
function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border border-gray-100">
          <CardContent className="p-4">
            <Skeleton className="h-4 w-1/3 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---- Main Page ----
export default function ExploreDB() {
  const [tab, setTab] = useState<"majors" | "jobs" | "universities">("majors");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("all");
  const [field, setField] = useState("all");
  const [region, setRegion] = useState("all");
  const [page, setPage] = useState(1);

  const { data: categories } = useQuery<Categories>({
    queryKey: ["/api/explore/categories"],
    staleTime: 1000 * 60 * 10,
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

  const univsQuery = useQuery<ApiResponse<University>>({
    queryKey: ["/api/explore/universities", search, region, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (region && region !== "all") params.set("region", region);
      return fetch(`/api/explore/universities?${params}`).then(r => r.json());
    },
    enabled: tab === "universities",
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">학과 · 직업 · 대학 탐색</h1>
          <p className="text-sm text-gray-500 mt-1">관심 분야를 검색하고 진로를 설계해보세요.</p>
        </div>
        {/* API 연동 상태 배지 */}
        <div className="flex flex-wrap gap-2 items-center" data-testid="api-status-bar">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full">
            <Wifi className="w-3 h-3" />
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            API 연동됨
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-dream/8 text-dream border border-dream/20 px-3 py-1.5 rounded-full">
            <Database className="w-3 h-3" />
            학과 235 · 직업 552 · 대학 489
          </span>
        </div>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList className="bg-gray-100 p-1 rounded-xl h-auto" data-testid="tabs-explore">
          <TabsTrigger value="majors" className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-dream data-[state=active]:text-white" data-testid="tab-majors">
            <GraduationCap className="w-4 h-4" /> 학과
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-coral data-[state=active]:text-white" data-testid="tab-jobs">
            <Briefcase className="w-4 h-4" /> 직업
          </TabsTrigger>
          <TabsTrigger value="universities" className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-gold data-[state=active]:text-white" data-testid="tab-universities">
            <Building2 className="w-4 h-4" /> 대학
          </TabsTrigger>
        </TabsList>

        {/* Search + Filter bar */}
        <div className="flex gap-2 mt-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                data-testid="input-search"
                className="pl-9 pr-4"
                placeholder={
                  tab === "majors" ? "학과명 검색..." :
                  tab === "jobs" ? "직업명 검색..." : "대학명 검색..."
                }
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} className="bg-dream hover:bg-dream/90 text-white" data-testid="btn-search">
              검색
            </Button>
          </div>

          {tab === "majors" && (
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
          )}

          {tab === "jobs" && (
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
          )}

          {tab === "universities" && (
            <Select value={region} onValueChange={v => handleFilter(v, setRegion)} data-testid="select-region">
              <SelectTrigger className="w-32" data-testid="select-trigger-region">
                <SelectValue placeholder="지역 전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">지역 전체</SelectItem>
                {categories?.regions.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Majors Tab */}
        <TabsContent value="majors" className="mt-4 space-y-3">
          {majorsQuery.isLoading ? <SkeletonList /> : (
            <>
              <p className="text-xs text-gray-400">총 {majorsQuery.data?.total ?? 0}개 학과</p>
              {(majorsQuery.data?.data ?? []).map(m => (
                <MajorCard key={m.id} major={m} />
              ))}
              <Pagination
                page={page}
                total={majorsQuery.data?.total ?? 0}
                limit={20}
                onPage={setPage}
              />
            </>
          )}
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="mt-4 space-y-3">
          {jobsQuery.isLoading ? <SkeletonList /> : (
            <>
              <p className="text-xs text-gray-400">총 {jobsQuery.data?.total ?? 0}개 직업</p>
              {(jobsQuery.data?.data ?? []).map(j => (
                <JobCard key={j.id} job={j} />
              ))}
              <Pagination
                page={page}
                total={jobsQuery.data?.total ?? 0}
                limit={20}
                onPage={setPage}
              />
            </>
          )}
        </TabsContent>

        {/* Universities Tab */}
        <TabsContent value="universities" className="mt-4 space-y-3">
          {univsQuery.isLoading ? <SkeletonList /> : (
            <>
              <p className="text-xs text-gray-400">총 {univsQuery.data?.total ?? 0}개 대학</p>
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
      </Tabs>
    </div>
  );
}
