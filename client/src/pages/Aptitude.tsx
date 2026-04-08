import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useBookmarks } from "@/hooks/useBookmarks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
  Brain, ChevronLeft, ChevronRight, RotateCcw, Sparkles,
  Briefcase, GraduationCap, Wifi, ArrowRight, ArrowLeft,
  AlertCircle, Layers, Zap, Star
} from "lucide-react";

// ---- Types ----
interface Question {
  id: number;
  text: string;
  category: "interest" | "aptitude";
  key: string;
}

interface RecommendedJob {
  name: string;
  reason: string;
  salary: number | null;
  field: string | null;
  growth: string | null;
}

interface RecommendedMajor {
  name: string;
  category: string | null;
  reason: string;
  description?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
}

interface AptitudeResult {
  id: number;
  interestScores: Record<string, number>;
  aptitudeScores: Record<string, number>;
  recommendedJobs: RecommendedJob[];
  recommendedMajors: RecommendedMajor[];
  summary: string;
  createdAt: string;
}

interface AptitudeStats {
  jobCount: number;
  majorCount: number;
}

// ---- Labels (spec-aligned) ----
const INTEREST_LABELS: Record<string, string> = {
  SCI: "과학·탐구",
  ENG: "공학·기술",
  MED: "의료·보건",
  BIZ: "경영·경제",
  LAW: "법률·행정",
  EDU: "교육·상담",
  ART: "예술·디자인",
  IT:  "IT·정보통신",
  SOC: "사회·문화",
};

const APTITUDE_LABELS: Record<string, string> = {
  VERBAL:   "언어능력",
  MATH:     "수리·논리력",
  SPATIAL:  "공간·시각능력",
  CREATIVE: "창의력",
  SOCIAL:   "대인관계능력",
  SELF:     "자기관리능력",
};

const INTEREST_ICONS: Record<string, string> = {
  SCI: "🔬", ENG: "⚙️", MED: "🏥", BIZ: "💼", LAW: "⚖️",
  EDU: "📚", ART: "🎨", IT: "💻", SOC: "🌍",
};

const INTEREST_COLORS = ["#320e9d", "#ea6a64", "#c79e41", "#22c55e", "#3b82f6", "#f97316", "#a855f7", "#06b6d4", "#ec4899"];
const APTITUDE_COLORS = ["#320e9d", "#ea6a64", "#c79e41", "#22c55e", "#3b82f6", "#f97316"];

// ---- Score Button ----
function ScoreButton({ score, selected, onClick }: { score: number; selected: boolean; onClick: () => void }) {
  const labels = ["", "전혀 아님", "아님", "보통", "그렇다", "매우 그렇다"];
  return (
    <button
      onClick={onClick}
      data-testid={`btn-score-${score}`}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 transition-all text-sm font-medium
        ${selected
          ? "border-dream bg-dream text-white scale-105 shadow-lg"
          : "border-gray-200 bg-white text-gray-600 hover:border-dream/40 hover:bg-dream/5"
        }`}
    >
      <span className="text-lg font-bold">{score}</span>
      <span className="text-[10px] leading-tight text-center whitespace-nowrap opacity-80">{labels[score]}</span>
    </button>
  );
}

// ---- Start Screen ----
function StartScreen({ onStart, latestResult, stats }: {
  onStart: () => void;
  latestResult: AptitudeResult | null;
  stats: AptitudeStats | null;
}) {
  const jobCount = stats?.jobCount ?? 443;
  const majorCount = stats?.majorCount ?? 235;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
      {/* Hero Section — CTA 버튼이 스크롤 없이 바로 보임 */}
      <div className="bg-dream/5 border border-dream/15 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-dream/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Brain className="w-6 h-6 text-dream" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">진로 흥미 분석</h1>
            <p className="text-xs text-gray-500 mt-0.5">약 5분 · 총 30문항</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          커리어넷 <span className="font-semibold text-dream">{jobCount.toLocaleString()}개 직업</span> · <span className="font-semibold text-dream">{majorCount.toLocaleString()}개 학과</span> 데이터와<br />
          나의 흥미 · 역량을 매칭하여<br />
          가장 잘 맞는 학과와 직업을 추천해 드립니다.
        </p>

        <Button
          onClick={onStart}
          data-testid="btn-start-aptitude"
          className="w-full bg-dream hover:bg-dream/90 text-white py-5 text-base font-semibold rounded-xl"
        >
          <Sparkles className="w-5 h-5 mr-2" /> 분석 시작
        </Button>

        {latestResult && (
          <p className="text-xs text-center text-gray-400">
            마지막 검사: {new Date(latestResult.createdAt).toLocaleDateString("ko-KR")}
          </p>
        )}
      </div>

      {/* 검사 구성 상세 — 항상 표시 */}
      <div className="border border-gray-100 rounded-2xl px-5 py-5 space-y-4">
        <h3 className="text-sm font-semibold text-ink">검사 구성</h3>

        {/* 1단계: 흥미 분야 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-dream/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-dream font-bold">1</span>
            </div>
            <span className="text-sm font-medium text-ink flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-dream" />
              흥미 검사 · 18문항 — 9개 관심 분야
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 ml-8">
            {Object.entries(INTEREST_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 rounded-lg px-2 py-1.5">
                <span>{INTEREST_ICONS[key]}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2단계: 역량 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-coral/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-coral font-bold">2</span>
            </div>
            <span className="text-sm font-medium text-ink flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-coral" />
              역량 검사 · 12문항 — 6개 역량
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 ml-8">
            {Object.values(APTITUDE_LABELS).map((label) => (
              <div key={label} className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 rounded-lg px-2 py-1.5">
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Stage Transition Banner ----
function StageBanner({ stage, onContinue }: { stage: 1 | 2; onContinue: () => void }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center text-center space-y-6">
      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${stage === 1 ? "bg-dream/10" : "bg-coral/10"}`}>
        {stage === 1 ? (
          <Layers className="w-10 h-10 text-dream" />
        ) : (
          <Zap className="w-10 h-10 text-coral" />
        )}
      </div>
      <div className="space-y-2">
        <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${stage === 1 ? "bg-dream/10 text-dream" : "bg-coral/10 text-coral"}`}>
          {stage}단계 시작
        </div>
        <h2 className="text-xl font-bold text-ink">
          {stage === 1 ? "흥미 검사" : "역량 검사"}
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          {stage === 1
            ? "9개 관심 분야에 대한 흥미를 18개 문항으로 평가합니다."
            : "6가지 핵심 역량을 12개 문항으로 측정합니다."}
        </p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 w-full text-left space-y-1.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {stage === 1 ? "평가 분야" : "평가 역량"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {stage === 1
            ? Object.values(INTEREST_LABELS).map((label) => (
                <span key={label} className="text-xs bg-dream/10 text-dream px-2 py-0.5 rounded-full">{label}</span>
              ))
            : Object.values(APTITUDE_LABELS).map((label) => (
                <span key={label} className="text-xs bg-coral/10 text-coral px-2 py-0.5 rounded-full">{label}</span>
              ))
          }
        </div>
      </div>
      <Button
        onClick={onContinue}
        data-testid={`btn-stage-${stage}-start`}
        className={`w-full py-5 text-sm font-semibold rounded-2xl text-white ${stage === 1 ? "bg-dream hover:bg-dream/90" : "bg-coral hover:bg-coral/90"}`}
      >
        시작하기 <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

// ---- Question Screen ----
function QuestionScreen({
  questions,
  answers,
  currentIdx,
  onAnswer,
  onPrev,
  onNext,
  onSubmit,
  isSubmitting,
}: {
  questions: Question[];
  answers: Record<number, number>;
  currentIdx: number;
  onAnswer: (id: number, score: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  const q = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;
  const isLast = currentIdx === questions.length - 1;
  const allAnswered = questions.every(q => answers[q.id] !== undefined);
  const isInterest = q.category === "interest";
  const label = isInterest ? INTEREST_LABELS[q.key] : APTITUDE_LABELS[q.key];
  const icon = isInterest ? INTEREST_ICONS[q.key] : null;
  const accentColor = isInterest ? "text-dream" : "text-coral";
  const bgColor = isInterest ? "bg-dream/10" : "bg-coral/10";

  // Stage indicator
  const interestCount = questions.filter(q => q.category === "interest").length;
  const aptitudeCount = questions.filter(q => q.category === "aptitude").length;
  const isCurrentInterest = q.category === "interest";
  const currentStageNum = isCurrentInterest ? 1 : 2;
  const stageTotal = isCurrentInterest ? interestCount : aptitudeCount;
  const stageIdx = isCurrentInterest
    ? questions.slice(0, currentIdx + 1).filter(x => x.category === "interest").length
    : questions.slice(0, currentIdx + 1).filter(x => x.category === "aptitude").length;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Stage indicator */}
      <div className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl ${bgColor} ${accentColor}`}>
        <span className="font-bold">{currentStageNum}단계</span>
        <span className="opacity-60">·</span>
        <span>{isCurrentInterest ? "흥미 검사" : "역량 검사"}</span>
        <span className="opacity-60">·</span>
        <span>{stageIdx}/{stageTotal} 문항</span>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{currentIdx + 1} / {questions.length}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bgColor} ${accentColor} flex items-center gap-1`}>
            {icon && <span>{icon}</span>}
            {label}
          </span>
        </div>
        <Progress value={progress} className="h-2" data-testid="progress-aptitude" />
      </div>

      {/* Question */}
      <Card className="border-0 shadow-md" data-testid={`question-card-${q.id}`}>
        <CardContent className="p-6">
          <div className="text-center space-y-1 mb-4">
            <p className={`text-xs font-semibold ${accentColor} opacity-70`}>
              {isInterest ? "흥미 분야: " : "역량: "}{label}
            </p>
          </div>
          <p className="text-base font-medium text-ink leading-relaxed text-center min-h-[80px] flex items-center justify-center">
            {q.text}
          </p>
          <div className="flex justify-center gap-2 mt-6 flex-wrap">
            {[1, 2, 3, 4, 5].map(score => (
              <ScoreButton
                key={score}
                score={score}
                selected={answers[q.id] === score}
                onClick={() => onAnswer(q.id, score)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={currentIdx === 0}
          data-testid="btn-prev-question"
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> 이전
        </Button>
        {isLast ? (
          <Button
            onClick={onSubmit}
            disabled={!allAnswered || isSubmitting}
            data-testid="btn-submit-aptitude"
            className="flex-1 bg-dream hover:bg-dream/90 text-white"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                AI 분석 중...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> 결과 분석
              </span>
            )}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={answers[q.id] === undefined}
            data-testid="btn-next-question"
            className="flex-1 bg-dream hover:bg-dream/90 text-white"
          >
            다음 <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {!allAnswered && isLast && (
        <p className="text-xs text-center text-amber-500">
          모든 문항에 답변해야 결과를 확인할 수 있습니다.
        </p>
      )}
    </div>
  );
}

// ---- Result Screen Fallback ----
function ResultFallback({ onRetake }: { onRetake: () => void }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center text-center space-y-6">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-ink">결과를 불러오지 못했습니다</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          분석 중 오류가 발생했습니다.<br />
          네트워크 상태를 확인하고 다시 시도해주세요.
        </p>
      </div>
      <Button onClick={onRetake} data-testid="btn-retake-fallback" className="bg-dream hover:bg-dream/90 text-white">
        <RotateCcw className="w-4 h-4 mr-2" /> 다시 검사하기
      </Button>
    </div>
  );
}

// ---- Result Screen ----
interface BookmarkItem {
  id: number;
  bookmarkType: string;
  targetId: number;
  targetName: string;
  createdAt: string;
}

function ResultScreen({ result, onRetake }: { result: AptitudeResult; onRetake: () => void }) {
  const [, navigate] = useLocation();
  // 북마크 상태 (낙관적 업데이트 포함)
  const { getBookmark: getBm, toggleBookmark } = useBookmarks();
  const toggleBm = (type: string, name: string) => toggleBookmark(type, 0, name);

  const goToExplore = (tab: "jobs" | "majors", q: string) => {
    navigate(`/explore?tab=${tab}&q=${encodeURIComponent(q)}&from=analysis`);
  };

  const interestData = Object.entries(result.interestScores).map(([k, v]) => ({
    subject: INTEREST_LABELS[k] || k,
    value: v,
    fullMark: 100,
  }));

  const aptitudeData = Object.entries(result.aptitudeScores).map(([k, v], i) => ({
    name: APTITUDE_LABELS[k] || k,
    value: v,
    color: APTITUDE_COLORS[i] || "#320e9d",
  }));

  const jobs = Array.isArray(result.recommendedJobs) ? result.recommendedJobs : [];
  const majors = Array.isArray(result.recommendedMajors) ? result.recommendedMajors : [];

  const hasJobs = jobs.length > 0;
  const hasMajors = majors.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* 대시보드 뒤로가기 */}
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-dream transition-colors"
        data-testid="btn-back-to-dashboard"
      >
        <ArrowLeft className="w-4 h-4" /> 대시보드로 돌아가기
      </button>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">진로 흥미 분석 결과</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(result.createdAt).toLocaleDateString("ko-KR")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
            <Wifi className="w-3 h-3" />
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            API 연동됨
          </span>
          <Button variant="outline" size="sm" onClick={onRetake} data-testid="btn-retake">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> 다시 검사
          </Button>
        </div>
      </div>

      {/* Summary */}
      {result.summary && (
        <Card className="border-dream/20 bg-dream/5">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Brain className="w-5 h-5 text-dream flex-shrink-0 mt-0.5" />
              <p className="text-sm text-ink leading-relaxed" data-testid="text-summary">{result.summary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Radar - Interest */}
        <Card>
          <CardHeader className="pb-0 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-ink">9개 분야 흥미 분포</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {interestData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={interestData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "#6b7280" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="흥미"
                    dataKey="value"
                    stroke="#320e9d"
                    fill="#320e9d"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">데이터 없음</div>
            )}
          </CardContent>
        </Card>

        {/* Bar - Aptitude */}
        <Card>
          <CardHeader className="pb-0 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-ink">6개 역량 분포</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            {aptitudeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={aptitudeData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#374151" }} width={65} />
                  <Tooltip formatter={(v) => [`${v}점`, "점수"]} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {aptitudeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">데이터 없음</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommended Jobs */}
      <div>
        <h2 className="text-base font-semibold text-ink mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-coral" /> 추천 직업
        </h2>
        {hasJobs ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {jobs.slice(0, 3).map((job, i) => (
                <Card key={i} className="border-coral/20 hover:shadow-md transition-shadow flex flex-col" data-testid={`card-rec-job-${i}`}>
                  <CardContent className="p-4 flex flex-col gap-2 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className="w-7 h-7 bg-coral/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-coral">{i + 1}</span>
                        </div>
                        <h3 className="font-semibold text-ink text-sm leading-tight">{job.name}</h3>
                      </div>
                      <button
                        onClick={() => toggleBm("job", job.name)}
                        className={`flex-shrink-0 transition-colors p-1 rounded-full ${getBm("job", job.name) ? 'text-gold' : 'text-gray-300 hover:text-gold'}`}
                        title={getBm("job", job.name) ? "찜 해제" : "찜하기"}
                        data-testid={`btn-bookmark-rec-job-${i}`}
                      >
                        <Star className={`w-4 h-4 ${getBm("job", job.name) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    {job.field && (
                      <Badge variant="outline" className="text-xs border-gray-200 text-gray-400 w-fit">{job.field}</Badge>
                    )}
                    {job.salary != null && job.salary > 0 && (
                      <p className="text-xs font-semibold text-emerald-600" data-testid={`text-job-salary-${job.name}`}>
                        연평균 {Math.round(job.salary / 10000).toLocaleString()}만원
                      </p>
                    )}
                    <p className="text-xs text-gray-500 leading-relaxed flex-1">"{job.reason}"</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-1 text-coral border border-coral/20 hover:bg-coral/5 text-xs h-7 gap-1"
                      data-testid={`btn-job-detail-${i}`}
                      onClick={() => goToExplore("jobs", job.name)}
                    >
                      직업 상세보기 <ArrowRight className="w-3 h-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {jobs.length > 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {jobs.slice(3).map((job, idx) => {
                  const i = idx + 3;
                  return (
                    <Card key={i} className="border-coral/20 hover:shadow-md transition-shadow flex flex-col" data-testid={`card-rec-job-${i}`}>
                      <CardContent className="p-4 flex flex-col gap-2 flex-1">
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <div className="w-7 h-7 bg-coral/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-coral">{i + 1}</span>
                            </div>
                            <h3 className="font-semibold text-ink text-sm leading-tight">{job.name}</h3>
                          </div>
                          <button
                            onClick={() => toggleBm("job", job.name)}
                            className={`flex-shrink-0 transition-colors p-1 rounded-full ${getBm("job", job.name) ? 'text-gold' : 'text-gray-300 hover:text-gold'}`}
                            title={getBm("job", job.name) ? "찜 해제" : "찜하기"}
                            data-testid={`btn-bookmark-rec-job-${i}`}
                          >
                            <Star className={`w-4 h-4 ${getBm("job", job.name) ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                        {job.field && (
                          <Badge variant="outline" className="text-xs border-gray-200 text-gray-400 w-fit">{job.field}</Badge>
                        )}
                        {job.salary != null && job.salary > 0 && (
                          <p className="text-xs font-semibold text-emerald-600" data-testid={`text-job-salary-${job.name}`}>
                            연평균 {Math.round(job.salary / 10000).toLocaleString()}만원
                          </p>
                        )}
                        <p className="text-xs text-gray-500 leading-relaxed flex-1">"{job.reason}"</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-1 text-coral border border-coral/20 hover:bg-coral/5 text-xs h-7 gap-1"
                          data-testid={`btn-job-detail-${i}`}
                          onClick={() => goToExplore("jobs", job.name)}
                        >
                          직업 상세보기 <ArrowRight className="w-3 h-3" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl text-sm text-gray-500">
            <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
            추천 직업 데이터를 불러오지 못했습니다.
          </div>
        )}
      </div>

      {/* Recommended Majors */}
      <div>
        <h2 className="text-base font-semibold text-ink mb-3 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-dream" /> 추천 학과
        </h2>
        {hasMajors ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {majors.slice(0, 3).map((major, i) => (
                <Card key={i} className="border-dream/20 hover:shadow-md transition-shadow flex flex-col" data-testid={`card-rec-major-${i}`}>
                  <CardContent className="p-4 flex flex-col gap-2 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className="w-7 h-7 bg-dream/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-dream">{i + 1}</span>
                        </div>
                        <h3 className="font-semibold text-ink text-sm leading-tight">{major.name}</h3>
                      </div>
                      <button
                        onClick={() => toggleBm("major", major.name)}
                        className={`flex-shrink-0 transition-colors p-1 rounded-full ${getBm("major", major.name) ? 'text-gold' : 'text-gray-300 hover:text-gold'}`}
                        title={getBm("major", major.name) ? "찜 해제" : "찜하기"}
                        data-testid={`btn-bookmark-rec-major-${i}`}
                      >
                        <Star className={`w-4 h-4 ${getBm("major", major.name) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    {major.category && (
                      <Badge variant="secondary" className="text-xs bg-dream/10 text-dream w-fit">{major.category}</Badge>
                    )}
                    {major.salaryMin != null && major.salaryMax != null && (
                      <p className="text-xs font-semibold text-emerald-600" data-testid={`text-major-salary-${major.name}`}>
                        관련 직업 연평균 {Math.round(major.salaryMin / 10000).toLocaleString()}~{Math.round(major.salaryMax / 10000).toLocaleString()}만원
                      </p>
                    )}
                    <p className="text-xs text-gray-500 leading-relaxed flex-1">"{major.reason}"</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-1 text-dream border border-dream/20 hover:bg-dream/5 text-xs h-7 gap-1"
                      data-testid={`btn-major-detail-${i}`}
                      onClick={() => goToExplore("majors", major.name)}
                    >
                      전공 상세보기 <ArrowRight className="w-3 h-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {majors.length > 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {majors.slice(3).map((major, idx) => {
                  const i = idx + 3;
                  return (
                    <Card key={i} className="border-dream/20 hover:shadow-md transition-shadow flex flex-col" data-testid={`card-rec-major-${i}`}>
                      <CardContent className="p-4 flex flex-col gap-2 flex-1">
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <div className="w-7 h-7 bg-dream/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-dream">{i + 1}</span>
                            </div>
                            <h3 className="font-semibold text-ink text-sm leading-tight">{major.name}</h3>
                          </div>
                          <button
                            onClick={() => toggleBm("major", major.name)}
                            className={`flex-shrink-0 transition-colors p-1 rounded-full ${getBm("major", major.name) ? 'text-gold' : 'text-gray-300 hover:text-gold'}`}
                            title={getBm("major", major.name) ? "찜 해제" : "찜하기"}
                            data-testid={`btn-bookmark-rec-major-${i}`}
                          >
                            <Star className={`w-4 h-4 ${getBm("major", major.name) ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                        {major.category && (
                          <Badge variant="secondary" className="text-xs bg-dream/10 text-dream w-fit">{major.category}</Badge>
                        )}
                        {major.salaryMin != null && major.salaryMax != null && (
                          <p className="text-xs font-semibold text-emerald-600" data-testid={`text-major-salary-${major.name}`}>
                            관련 직업 연평균 {Math.round(major.salaryMin / 10000).toLocaleString()}~{Math.round(major.salaryMax / 10000).toLocaleString()}만원
                          </p>
                        )}
                        <p className="text-xs text-gray-500 leading-relaxed flex-1">"{major.reason}"</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-1 text-dream border border-dream/20 hover:bg-dream/5 text-xs h-7 gap-1"
                          data-testid={`btn-major-detail-${i}`}
                          onClick={() => goToExplore("majors", major.name)}
                        >
                          전공 상세보기 <ArrowRight className="w-3 h-3" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl text-sm text-gray-500">
            <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
            추천 학과 데이터를 불러오지 못했습니다.
          </div>
        )}
      </div>

      <div className="pb-6" />
    </div>
  );
}

// ---- Main Page ----
export default function Aptitude() {
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<"start" | "banner1" | "questions" | "banner2" | "result">("start");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [localResult, setLocalResult] = useState<AptitudeResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [pollProgress, setPollProgress] = useState(0);

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["/api/aptitude/questions"],
    staleTime: Infinity,
  });

  const { data: latestResult, isLoading: latestLoading } = useQuery<AptitudeResult | null>({
    queryKey: ["/api/aptitude/latest"],
    staleTime: 1000 * 60 * 5,
  });

  const { data: stats } = useQuery<AptitudeStats>({
    queryKey: ["/api/aptitude/stats"],
    staleTime: Infinity,
  });

  // ── 폴링 쿼리 ─────────────────────────────────────────────────────
  const { data: pollData } = useQuery<{
    status: string;
    progress: number;
    data?: AptitudeResult;
    error?: string;
  }>({
    queryKey: ["/api/aptitude/job", activeJobId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/aptitude/job/${activeJobId}`);
      return res.json();
    },
    enabled: !!activeJobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      if (data.status === "completed" || data.status === "failed") return false;
      return 2000;
    },
    staleTime: 0,
  });

  // 폴링 결과 처리
  useEffect(() => {
    if (!pollData) return;
    setPollProgress(pollData.progress || 0);
    if (pollData.status === "completed" && pollData.data) {
      setLocalResult(pollData.data);
      setAnalyzeError(false);
      setActiveJobId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/aptitude/latest"] });
    } else if (pollData.status === "failed") {
      setAnalyzeError(true);
      setActiveJobId(null);
    }
  }, [pollData, queryClient]);

  const isPolling = !!activeJobId;

  const analyzeMutation = useMutation({
    mutationFn: async (payload: { answers: { questionId: number; score: number }[] }) => {
      const res = await apiRequest("POST", "/api/aptitude/analyze", payload);
      return res.json() as Promise<{ jobId: string; status: string }>;
    },
    onSuccess: ({ jobId }) => {
      setAnalyzeError(false);
      setPollProgress(5);
      setActiveJobId(jobId);
      setStage("result");
    },
    onError: () => {
      setAnalyzeError(true);
      setStage("result");
    },
  });

  // 마운트 시 최근 결과가 있으면 결과 화면 자동 표시 (한 번만)
  const hasAutoShownResult = useRef(false);
  useEffect(() => {
    if (!hasAutoShownResult.current && !latestLoading && latestResult && stage === "start") {
      hasAutoShownResult.current = true;
      setStage("result");
    }
  }, [latestResult, latestLoading, stage]);

  const handleStart = () => {
    setAnswers({});
    setCurrentIdx(0);
    setAnalyzeError(false);
    setStage("banner1");
  };

  const handleBanner1Continue = () => {
    setStage("questions");
  };

  const handleAnswer = (id: number, score: number) => {
    const updatedAnswers = { ...answers, [id]: score };
    setAnswers(updatedAnswers);

    // Auto-advance: check if this is the last interest question
    if (questions.length > 0) {
      const interestQuestions = questions.filter(q => q.category === "interest");
      const lastInterestQ = interestQuestions[interestQuestions.length - 1];
      const firstAptitudeQ = questions.find(q => q.category === "aptitude");
      const currentQ = questions[currentIdx];

      // If we just answered the last interest question and entering aptitude section,
      // we handle it in the Next button flow, not here
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      const currentQ = questions[currentIdx];
      const nextQ = questions[currentIdx + 1];

      // Show stage 2 banner when transitioning from interest to aptitude
      if (currentQ.category === "interest" && nextQ.category === "aptitude") {
        setCurrentIdx(currentIdx + 1);
        setStage("banner2");
        return;
      }

      setCurrentIdx(i => i + 1);
    }
  };

  const handleBanner2Continue = () => {
    setStage("questions");
  };

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx(i => i - 1);
  };

  const handleSubmit = () => {
    const payload = Object.entries(answers).map(([id, score]) => ({
      questionId: parseInt(id),
      score,
    }));
    analyzeMutation.mutate({ answers: payload });
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentIdx(0);
    setLocalResult(null);
    setAnalyzeError(false);
    setActiveJobId(null);
    setPollProgress(0);
    setStage("start");
  };

  const displayResult = localResult || latestResult || null;

  if (stage === "start") {
    // 최근 결과 로딩 중: 깜빡임 방지를 위해 스피너 표시
    if (latestLoading) {
      return (
        <div className="max-w-lg mx-auto px-4 py-24 flex flex-col items-center text-center space-y-4">
          <span className="w-10 h-10 border-4 border-dream border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">이전 결과를 불러오는 중...</p>
        </div>
      );
    }
    return (
      <StartScreen
        onStart={handleStart}
        latestResult={displayResult}
        stats={stats ?? null}
      />
    );
  }

  if (stage === "banner1") {
    return <StageBanner stage={1} onContinue={handleBanner1Continue} />;
  }

  if (stage === "banner2") {
    return <StageBanner stage={2} onContinue={handleBanner2Continue} />;
  }

  if (stage === "questions") {
    return (
      <QuestionScreen
        questions={questions}
        answers={answers}
        currentIdx={currentIdx}
        onAnswer={handleAnswer}
        onPrev={handlePrev}
        onNext={handleNext}
        onSubmit={handleSubmit}
        isSubmitting={analyzeMutation.isPending || isPolling}
      />
    );
  }

  if (stage === "result") {
    if (analyzeError || (!displayResult && !analyzeMutation.isPending && !isPolling)) {
      return <ResultFallback onRetake={handleRetake} />;
    }
    if (displayResult) {
      return <ResultScreen result={displayResult} onRetake={handleRetake} />;
    }
    // 큐/처리 중 로딩 화면 (진행률 바 포함)
    const loadingProgress = isPolling ? pollProgress : 5;
    const loadingMsg = analyzeMutation.isPending
      ? "분석을 시작하는 중입니다..."
      : pollProgress < 30
        ? "AI가 나의 흥미·적성을 분석하고 있어요..."
        : pollProgress < 70
          ? "직업 · 학과 데이터와 매칭 중입니다..."
          : "추천 결과를 정리하고 있습니다...";
    return (
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center text-center space-y-6">
        <span className="w-12 h-12 border-4 border-dream border-t-transparent rounded-full animate-spin" />
        <div className="w-full max-w-xs space-y-2">
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-dream transition-all duration-700"
              style={{ width: `${Math.max(5, loadingProgress)}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">{loadingMsg}</p>
          {isPolling && (
            <p className="text-xs text-gray-400">{loadingProgress}% 완료</p>
          )}
        </div>
      </div>
    );
  }

  if (latestResult) {
    return <ResultScreen result={latestResult} onRetake={handleRetake} />;
  }

  return <StartScreen onStart={handleStart} latestResult={null} stats={stats ?? null} />;
}
