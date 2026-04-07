import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Briefcase, GraduationCap, CheckCircle2, Clock
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
  salaryRange: string;
  outlook: string;
}

interface RecommendedMajor {
  name: string;
  category: string;
  reason: string;
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

// ---- Labels ----
const INTEREST_LABELS: Record<string, string> = {
  SCI: "자연과학", ENG: "공학·기술", MED: "의료·보건",
  BIZ: "경영·경제", LAW: "법·행정", EDU: "교육",
  ART: "예술·디자인", IT: "IT·정보", SOC: "사회·복지",
};

const APTITUDE_LABELS: Record<string, string> = {
  VERBAL: "언어능력", MATH: "수리능력", SPATIAL: "공간지각",
  CREATIVE: "창의성", SOCIAL: "대인관계", SELF: "자기관리",
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
function StartScreen({ onStart, latestResult }: { onStart: () => void; latestResult: AptitudeResult | null }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-10 text-center space-y-8">
      <div className="space-y-3">
        <div className="w-16 h-16 bg-dream/10 rounded-2xl flex items-center justify-center mx-auto">
          <Brain className="w-8 h-8 text-dream" />
        </div>
        <h1 className="text-2xl font-bold text-ink">전공 적성 분석</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          30개의 문항으로 나의 흥미와 적성을 파악하고<br />
          AI가 맞춤 직업·학과를 추천해드립니다.
        </p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-3">
        <h3 className="text-sm font-semibold text-ink">검사 구성</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-dream/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-dream font-bold">1</span>
            </div>
            <span>흥미 문항 18개 — 9개 분야 (SCI·ENG·MED·BIZ·LAW·EDU·ART·IT·SOC)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-coral/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-coral font-bold">2</span>
            </div>
            <span>적성 문항 12개 — 6개 역량 (언어·수리·공간·창의·대인·자기관리)</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>예상 소요 시간: 5~7분</span>
          </div>
        </div>
      </div>

      <Button
        onClick={onStart}
        data-testid="btn-start-aptitude"
        className="w-full bg-dream hover:bg-dream/90 text-white py-6 text-base font-semibold rounded-2xl"
      >
        <Sparkles className="w-5 h-5 mr-2" /> 검사 시작하기
      </Button>

      {latestResult && (
        <p className="text-xs text-gray-400">
          마지막 검사: {new Date(latestResult.createdAt).toLocaleDateString("ko-KR")}
        </p>
      )}
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
  const accentColor = isInterest ? "text-dream" : "text-coral";
  const bgColor = isInterest ? "bg-dream/10" : "bg-coral/10";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{currentIdx + 1} / {questions.length}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bgColor} ${accentColor}`}>
            {isInterest ? "흥미" : "적성"} · {label}
          </span>
        </div>
        <Progress value={progress} className="h-2" data-testid="progress-aptitude" />
      </div>

      {/* Question */}
      <Card className="border-0 shadow-md" data-testid={`question-card-${q.id}`}>
        <CardContent className="p-6">
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

// ---- Result Screen ----
function ResultScreen({ result, onRetake }: { result: AptitudeResult; onRetake: () => void }) {
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

  const jobs = Array.isArray(result.recommendedJobs) ? result.recommendedJobs.slice(0, 3) : [];
  const majors = Array.isArray(result.recommendedMajors) ? result.recommendedMajors.slice(0, 3) : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">적성 분석 결과</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(result.createdAt).toLocaleDateString("ko-KR")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetake} data-testid="btn-retake">
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> 다시 검사
        </Button>
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
            <CardTitle className="text-sm font-semibold text-ink">흥미 분포</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={interestData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#6b7280" }} />
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
          </CardContent>
        </Card>

        {/* Bar - Aptitude */}
        <Card>
          <CardHeader className="pb-0 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-ink">적성 역량</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={aptitudeData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} width={55} />
                <Tooltip formatter={(v) => [`${v}점`, "점수"]} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {aptitudeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Jobs */}
      <div>
        <h2 className="text-base font-semibold text-ink mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-coral" /> 추천 직업
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {jobs.map((job, i) => (
            <Card key={i} className="border-coral/20 hover:shadow-md transition-shadow" data-testid={`card-rec-job-${i}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-coral/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-coral">{i + 1}</span>
                  </div>
                  <h3 className="font-semibold text-ink text-sm leading-tight">{job.name}</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{job.reason}</p>
                {job.salaryRange && (
                  <p className="text-xs font-medium text-emerald-600">💰 {job.salaryRange}</p>
                )}
                {job.outlook && (
                  <Badge variant="outline" className="text-xs border-coral/30 text-coral">{job.outlook}</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recommended Majors */}
      <div>
        <h2 className="text-base font-semibold text-ink mb-3 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-dream" /> 추천 학과
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {majors.map((major, i) => (
            <Card key={i} className="border-dream/20 hover:shadow-md transition-shadow" data-testid={`card-rec-major-${i}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-dream/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-dream">{i + 1}</span>
                  </div>
                  <h3 className="font-semibold text-ink text-sm leading-tight">{major.name}</h3>
                </div>
                {major.category && (
                  <Badge variant="secondary" className="text-xs bg-dream/10 text-dream">{major.category}</Badge>
                )}
                <p className="text-xs text-gray-500 leading-relaxed">{major.reason}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="pb-6" />
    </div>
  );
}

// ---- Main Page ----
export default function Aptitude() {
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<"start" | "questions" | "result">("start");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [localResult, setLocalResult] = useState<AptitudeResult | null>(null);

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["/api/aptitude/questions"],
    staleTime: Infinity,
  });

  const { data: latestResult } = useQuery<AptitudeResult | null>({
    queryKey: ["/api/aptitude/latest"],
    staleTime: 1000 * 60 * 5,
  });

  const analyzeMutation = useMutation({
    mutationFn: async (payload: { answers: { questionId: number; score: number }[] }) => {
      const res = await apiRequest("POST", "/api/aptitude/analyze", payload);
      return res.json();
    },
    onSuccess: (data: AptitudeResult) => {
      setLocalResult(data);
      setStage("result");
      queryClient.invalidateQueries({ queryKey: ["/api/aptitude/latest"] });
    },
    onError: (error: any) => {
      alert("분석 중 오류가 발생했습니다: " + error.message);
    },
  });

  const handleStart = () => {
    setAnswers({});
    setCurrentIdx(0);
    setStage("questions");
  };

  const handleAnswer = (id: number, score: number) => {
    setAnswers(prev => ({ ...prev, [id]: score }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) setCurrentIdx(i => i + 1);
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
    setStage("start");
  };

  const displayResult = localResult || latestResult || null;

  if (stage === "start") {
    return (
      <StartScreen
        onStart={handleStart}
        latestResult={displayResult}
      />
    );
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
        isSubmitting={analyzeMutation.isPending}
      />
    );
  }

  if (stage === "result" && displayResult) {
    return <ResultScreen result={displayResult} onRetake={handleRetake} />;
  }

  // If no result yet but latestResult exists, show it
  if (latestResult) {
    return <ResultScreen result={latestResult} onRetake={handleRetake} />;
  }

  return (
    <StartScreen onStart={handleStart} latestResult={null} />
  );
}
