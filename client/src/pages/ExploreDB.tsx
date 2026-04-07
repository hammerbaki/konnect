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
  Database, Wifi, Sparkles, Home, Users, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight
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

// ---- Holland Code → Label ----
const hollandLabel: Record<string, string> = {
  R: "실재형", I: "탐구형", A: "예술형", S: "사회형", E: "기업형", C: "관습형",
};
function hollandBadgeText(code: string | null): string | null {
  if (!code) return null;
  const first = code.trim().charAt(0).toUpperCase();
  return hollandLabel[first] ?? code;
}

// ---- Demand Badge ----
function DemandBadge({ demand }: { demand: string | null }) {
  if (!demand) return null;
  const map: Record<string, { label: string; cls: string }> = {
    "매우 높음": { label: "매우 높음", cls: "bg-emerald-100 text-emerald-700" },
    "높음":     { label: "높음",     cls: "bg-green-100 text-green-700" },
    "보통":     { label: "보통",     cls: "bg-amber-100 text-amber-700" },
    "낮음":     { label: "낮음",     cls: "bg-orange-100 text-orange-600" },
    "매우 낮음": { label: "매우 낮음", cls: "bg-red-100 text-red-600" },
  };
  const d = map[demand] ?? { label: demand, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.cls}`}>
      {d.label}
    </span>
  );
}

// ---- Major Card ----
function MajorCard({ major }: { major: Major }) {
  const [showMore, setShowMore] = useState(false);
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [showAllUnivs, setShowAllUnivs] = useState(false);

  const univs: UnivEntry[] = Array.isArray(major.universities) ? major.universities : [];
  const jobs: string[] = Array.isArray(major.relatedJobs) ? major.relatedJobs : [];
  const visibleJobs = showAllJobs ? jobs : jobs.slice(0, 5);
  const visibleUnivs = showAllUnivs ? univs : univs.slice(0, 3);

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
          <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-dream" />
            이 학과 개설 대학
          </p>

          {univs.length === 0 ? (
            <div className="flex items-center gap-2 py-3 px-3 bg-gray-50 rounded-lg">
              <Database className="w-4 h-4 text-gray-300" />
              <span className="text-xs text-gray-400">개설 대학 데이터 업데이트 예정</span>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                {visibleUnivs.map((u, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0"
                    data-testid={`row-univ-${major.id}-${i}`}
                  >
                    <span className="font-medium text-ink flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-300" />
                      {u.univName}
                      <span className="text-gray-400 font-normal">({u.region})</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-orange-500 font-medium flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" />
                        {u.competition != null ? `${u.competition.toFixed(1)}:1` : "-"}
                      </span>
                      <span className="text-blue-600 font-medium flex items-center gap-0.5">
                        <Award className="w-3 h-3" />
                        대학취업 {u.employmentRate != null ? `${u.employmentRate.toFixed(0)}%` : "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {univs.length > 3 && (
                <button
                  className="mt-1.5 text-xs text-dream hover:underline flex items-center gap-0.5"
                  onClick={() => setShowAllUnivs(v => !v)}
                  data-testid={`btn-toggle-univs-${major.id}`}
                >
                  {showAllUnivs
                    ? <><ChevronUp className="w-3 h-3" /> 접기</>
                    : <><ChevronDown className="w-3 h-3" /> 외 {univs.length - 3}개 대학</>
                  }
                </button>
              )}

              {/* Footer summary */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 text-xs text-gray-500">
                {avgEmp && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    개설대학 평균취업률 <strong className="text-emerald-600">{avgEmp}%</strong>
                  </span>
                )}
                <span className="flex items-center gap-1">
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
                {major.hollandCode && (
                  <div>
                    <span className="font-medium text-dream">홀랜드 코드: </span>
                    {major.hollandCode} ({hollandBadgeText(major.hollandCode)})
                  </div>
                )}
                {major.demand && (
                  <div>
                    <span className="font-medium text-gold">수요전망: </span>{major.demand}
                  </div>
                )}
                {major.relatedSubjects && (
                  <div>
                    <span className="font-medium">관련 과목: </span>{major.relatedSubjects}
                  </div>
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
                  <Banknote className="w-3.5 h-3.5" />
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
            label="경쟁률"
            value={univ.competitionRate && univ.competitionRate > 0
              ? `${univ.competitionRate.toFixed(1)}:1` : none}
          />
          <StatRow
            icon={<Briefcase className="w-3.5 h-3.5 text-emerald-500" />}
            label="취업률"
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
        <div className="flex flex-wrap gap-2 items-center" data-testid="api-status-bar">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full">
            <Wifi className="w-3 h-3" />
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            API 연동됨
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-dream/8 text-dream border border-dream/20 px-3 py-1.5 rounded-full">
            <Database className="w-3 h-3" />
            대학 {univsQuery.data?.total ?? 489} · 전공 {majorTotal} · 직업 {jobTotal}
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
