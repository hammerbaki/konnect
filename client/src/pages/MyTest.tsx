import { useState, useEffect, useCallback, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2,
  Loader2,
  Brain,
  Target,
  TrendingUp,
  Award,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KJobsQuestion {
  id: string;
  questionNumber: number;
  questionText: string;
  questionType: "likert" | "forced_choice";
  optionA: string | null;
  optionB: string | null;
}

interface AssessmentSession {
  assessmentId: string;
  sessionId: string;
  totalQuestions?: number;
  currentQuestion: number;
  answers?: Record<string, number | string>;
  resumed: boolean;
}

interface AssessmentResult {
  id: string;
  careerDna: string;
  scores: Record<string, number>;
  keywords: string[];
  recommendedJobs: Array<{
    jobId: number;
    title: string;
    matchPercentage: number;
    keyCompetencies: string[];
  }>;
  growthPlan: {
    thirtyDays: string[];
    sixtyDays: string[];
    ninetyDays: string[];
  };
  completedAt: string;
}

const LIKERT_OPTIONS = [
  { value: 1, label: "전혀 아니다" },
  { value: 2, label: "아니다" },
  { value: 3, label: "보통이다" },
  { value: 4, label: "그렇다" },
  { value: 5, label: "매우 그렇다" },
];

const AXIS_LABELS: Record<string, string> = {
  careerInterests: "흥미영역",
  workNeeds: "업무환경",
  interactionStyle: "상호작용",
  pressureResponse: "스트레스대응",
  selfIdentity: "자아정체성",
  executionLearning: "실행학습",
  valuesPurpose: "가치관",
};

export default function MyTest() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const { data: latestResult } = useQuery<AssessmentResult | null>({
    queryKey: ["/api/kjobs/latest"],
    enabled: !!user,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery<KJobsQuestion[]>({
    queryKey: ["/api/kjobs/questions"],
    enabled: !!user && !latestResult,
  });

  const initMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/kjobs/init", {});
      return res.json() as Promise<AssessmentSession>;
    },
    onSuccess: (data) => {
      setAssessmentId(data.assessmentId);
      if (data.resumed && data.answers) {
        setAnswers(data.answers);
        setCurrentQuestionIndex(Math.max(0, data.currentQuestion - 1));
        toast({
          title: "이어서 진행합니다",
          description: "이전에 진행하던 검사를 이어서 진행합니다.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "오류",
        description: error.message || "검사 초기화에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ currentQuestion, answers: ans }: { currentQuestion: number; answers: Record<string, number | string> }) => {
      if (!assessmentId) return;
      await apiRequest("PATCH", `/api/kjobs/${assessmentId}/progress`, {
        currentQuestion,
        answers: ans,
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (finalAnswers: Record<string, number | string>) => {
      if (!assessmentId) throw new Error("No assessment session");
      const res = await apiRequest("POST", `/api/kjobs/${assessmentId}/submit`, {
        answers: finalAnswers,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kjobs/latest"] });
      setShowResult(true);
      toast({
        title: "검사 완료!",
        description: "진로진단 결과가 저장되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "제출 오류",
        description: error.message || "검사 제출에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (user && !latestResult && questions && !assessmentId) {
      initMutation.mutate();
    }
  }, [user, latestResult, questions, assessmentId]);

  const handleAnswer = useCallback((questionId: string, value: number | string) => {
    setAnswers(prev => {
      const updated = { ...prev, [questionId]: value };
      if (assessmentId) {
        saveMutation.mutate({ currentQuestion: currentQuestionIndex + 1, answers: updated });
      }
      return updated;
    });
  }, [assessmentId, currentQuestionIndex, saveMutation]);

  const handleNext = useCallback(() => {
    if (!questions) return;
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [questions, currentQuestionIndex]);

  const handlePrev = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleSubmit = useCallback(() => {
    if (!questions) return;
    const requiredAnswers = questions.length;
    if (Object.keys(answers).length < requiredAnswers) {
      toast({
        title: "미완료 문항 있음",
        description: "모든 문항에 답변해 주세요.",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate(answers);
  }, [questions, answers, submitMutation, toast]);

  const currentQuestion = useMemo(() => {
    if (!questions) return null;
    return questions[currentQuestionIndex];
  }, [questions, currentQuestionIndex]);

  const progress = useMemo(() => {
    if (!questions || questions.length === 0) return 0;
    return Math.round((Object.keys(answers).length / questions.length) * 100);
  }, [questions, answers]);

  const isCurrentAnswered = currentQuestion ? answers[currentQuestion.id] !== undefined : false;

  if (latestResult && !showResult) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-[#3182F6] to-[#1E5FD3]">
            <CardContent className="p-6 text-white">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20">
                  <Brain className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm opacity-80">나의 Career DNA</p>
                  <h2 className="text-2xl font-bold mt-1">{latestResult.careerDna}</h2>
                </div>
                {latestResult.keywords && latestResult.keywords.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {latestResult.keywords.map((keyword, i) => (
                      <span key={i} className="px-3 py-1 bg-white/20 rounded-full text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-[#3182F6]" />
                7축 진단 점수
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestResult.scores && Object.entries(latestResult.scores).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4E5968]">{AXIS_LABELS[key] || key}</span>
                    <span className="font-medium text-[#191F28]">{value as number}</span>
                  </div>
                  <Progress value={value as number} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-[#F59E0B]" />
                추천 직업 TOP 5
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestResult.recommendedJobs && latestResult.recommendedJobs.map((job, i) => (
                <div key={job.jobId || i} className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#3182F6] text-white flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-[#191F28]">{job.title}</p>
                      <p className="text-xs text-[#8B95A1]">
                        {job.keyCompetencies?.slice(0, 3).join(", ") || ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-[#3182F6] font-bold">{job.matchPercentage}%</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#22C55E]" />
                성장 로드맵
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestResult.growthPlan && [
                { label: "30일 목표", items: latestResult.growthPlan.thirtyDays || [] },
                { label: "60일 목표", items: latestResult.growthPlan.sixtyDays || [] },
                { label: "90일 목표", items: latestResult.growthPlan.ninetyDays || [] },
              ].map((plan, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className="font-medium text-[#191F28]">{plan.label}</h4>
                  <ul className="space-y-1">
                    {plan.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#4E5968]">
                        <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              className="flex-1 bg-[#3182F6] hover:bg-[#1E5FD3]"
              onClick={() => setLocation("/analysis")}
              data-testid="button-go-analysis"
            >
              AI 커리어 분석하기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (questionsLoading || initMutation.isPending) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#3182F6]" />
          <p className="text-[#8B95A1]">검사를 준비하는 중...</p>
        </div>
      </Layout>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-[#8B95A1]">질문을 불러올 수 없습니다.</p>
          <Button onClick={() => window.location.reload()}>다시 시도</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#8B95A1]">
              {currentQuestionIndex + 1} / {questions.length}
            </span>
            <span className="text-sm font-medium text-[#3182F6]">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {currentQuestion && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-medium text-[#191F28] mb-6">
                {currentQuestion.questionText}
              </h2>

              {currentQuestion.questionType === "likert" ? (
                <div className="space-y-2">
                  {LIKERT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(currentQuestion.id, opt.value)}
                      className={cn(
                        "w-full p-4 text-left rounded-xl border-2 transition-all",
                        answers[currentQuestion.id] === opt.value
                          ? "border-[#3182F6] bg-[#E8F3FF]"
                          : "border-[#E5E8EB] hover:border-[#B0B8C1]"
                      )}
                      data-testid={`button-likert-${opt.value}`}
                    >
                      <span className={cn(
                        "font-medium",
                        answers[currentQuestion.id] === opt.value ? "text-[#3182F6]" : "text-[#4E5968]"
                      )}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => handleAnswer(currentQuestion.id, "A")}
                    className={cn(
                      "p-4 text-left rounded-xl border-2 transition-all",
                      answers[currentQuestion.id] === "A"
                        ? "border-[#3182F6] bg-[#E8F3FF]"
                        : "border-[#E5E8EB] hover:border-[#B0B8C1]"
                    )}
                    data-testid="button-choice-a"
                  >
                    <span className="font-medium text-[#3182F6]">A. </span>
                    <span className={cn(
                      answers[currentQuestion.id] === "A" ? "text-[#3182F6]" : "text-[#4E5968]"
                    )}>
                      {currentQuestion.optionA}
                    </span>
                  </button>
                  <button
                    onClick={() => handleAnswer(currentQuestion.id, "B")}
                    className={cn(
                      "p-4 text-left rounded-xl border-2 transition-all",
                      answers[currentQuestion.id] === "B"
                        ? "border-[#3182F6] bg-[#E8F3FF]"
                        : "border-[#E5E8EB] hover:border-[#B0B8C1]"
                    )}
                    data-testid="button-choice-b"
                  >
                    <span className="font-medium text-[#3182F6]">B. </span>
                    <span className={cn(
                      answers[currentQuestion.id] === "B" ? "text-[#3182F6]" : "text-[#4E5968]"
                    )}>
                      {currentQuestion.optionB}
                    </span>
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className="flex-1"
            data-testid="button-prev"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            이전
          </Button>
          
          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={!isCurrentAnswered || submitMutation.isPending}
              className="flex-1 bg-[#3182F6] hover:bg-[#1E5FD3]"
              data-testid="button-submit"
            >
              {submitMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              제출하기
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!isCurrentAnswered}
              className="flex-1 bg-[#3182F6] hover:bg-[#1E5FD3]"
              data-testid="button-next"
            >
              다음
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}
