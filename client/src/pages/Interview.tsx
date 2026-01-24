import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { Layout } from '@/components/layout/Layout';
import { 
  Mic, 
  MessageSquare, 
  BookOpen, 
  ChevronRight, 
  ChevronLeft,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Target,
  Brain,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  FileText,
  Star,
  Lightbulb,
  TrendingUp,
  Users,
  Briefcase,
  Plus,
} from 'lucide-react';

interface InterviewSession {
  id: string;
  desiredJob: string;
  sessionType: string;
  status: string;
  totalQuestions: number;
  answeredQuestions: number;
  createdAt: string;
  completedAt?: string;
}

interface InterviewQuestion {
  id: string;
  category: 'basic' | 'job_specific' | 'self_intro' | 'star';
  questionOrder: number;
  question: string;
  questionReason?: string;
  guideText?: string;
  relatedStrength?: string;
  relatedWeakness?: string;
  difficulty?: string;
  answer?: InterviewAnswer | null;
}

interface InterviewAnswer {
  id: string;
  answer: string;
  understandingScore?: number;
  fitScore?: number;
  logicScore?: number;
  specificityScore?: number;
  overallScore?: number;
  improvementSuggestion?: string;
  improvedAnswer?: string;
  isBookmarked: number;
  feedbackJson?: any;
}

const categoryInfo: Record<string, { label: string; icon: any; color: string; description: string }> = {
  basic: { 
    label: '기본 면접 질문', 
    icon: MessageSquare, 
    color: 'bg-blue-100 text-blue-700',
    description: '지원동기, 강점/약점, 협업 및 경험 관련 질문'
  },
  job_specific: { 
    label: '직무 질문', 
    icon: Briefcase, 
    color: 'bg-purple-100 text-purple-700',
    description: '희망직무와 직접 연결된 실무 질문'
  },
  self_intro: { 
    label: '자기소개', 
    icon: Users, 
    color: 'bg-green-100 text-green-700',
    description: '1분 자기소개 및 직무 연결 소개'
  },
  star: { 
    label: 'STAR 질문', 
    icon: Star, 
    color: 'bg-orange-100 text-orange-700',
    description: '상황-행동-결과 구조의 행동 기반 질문'
  },
};

function InterviewContent() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [view, setView] = useState<'list' | 'session' | 'practice'>('list');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Fetch profiles
  const { data: profiles = [], isLoading: loadingProfiles } = useQuery<any[]>({
    queryKey: ['/api/profiles'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/profiles');
      return res.json();
    },
    enabled: !!user,
  });
  
  // Set active profile when profiles load
  useEffect(() => {
    if (profiles.length > 0 && !activeProfileId) {
      setActiveProfileId(profiles[0].id);
    }
  }, [profiles, activeProfileId]);
  
  const activeProfile = profiles.find((p: any) => p.id === activeProfileId);
  
  // Fetch sessions
  const { data: sessions = [], isLoading: loadingSessions } = useQuery<InterviewSession[]>({
    queryKey: ['interview-sessions'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/interview/sessions');
      return res.json();
    },
    enabled: !!user,
  });
  
  // Fetch session details
  const { data: sessionData, isLoading: loadingSession } = useQuery({
    queryKey: ['interview-session', selectedSessionId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/interview/sessions/${selectedSessionId}`);
      return res.json();
    },
    enabled: !!selectedSessionId,
  });
  
  // Get desired job from profile
  const getDesiredJob = (): string | null => {
    if (!activeProfile?.profileData) return null;
    const data = activeProfile.profileData as any;
    
    switch (activeProfile.type) {
      case 'elementary':
        return data.elem_dreamJob || null;
      case 'middle':
        return data.mid_dreamJob || null;
      case 'high':
        return data.high_careerHope || null;
      case 'university':
        return data.univ_desiredIndustry || null;
      case 'general':
        return data.gen_desiredRole || null;
      case 'international':
        return data.intl_desiredPosition || null;
      default:
        return null;
    }
  };
  
  const desiredJob = getDesiredJob();
  
  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (params: { profileId: string; desiredJob: string; sessionType: string }) => {
      const res = await apiRequest('POST', '/api/interview/sessions', params);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interview-sessions'] });
      setSelectedSessionId(data.session.id);
      setView('session');
      toast({ title: '면접 준비 세션이 생성되었습니다.' });
    },
    onError: () => {
      toast({ title: '세션 생성 실패', variant: 'destructive' });
    },
  });
  
  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async (params: { questionId: string; answer: string }) => {
      const res = await apiRequest('POST', '/api/interview/answers', params);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-session', selectedSessionId] });
      setShowFeedback(true);
    },
    onError: () => {
      toast({ title: '답변 제출 실패', variant: 'destructive' });
    },
  });
  
  // Save answer (no feedback)
  const saveAnswerMutation = useMutation({
    mutationFn: async (params: { questionId: string; answer: string }) => {
      const res = await apiRequest('POST', '/api/interview/answers/save', params);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-session', selectedSessionId] });
      toast({ title: '답변이 저장되었습니다.' });
    },
  });
  
  // Improve answer mutation
  const improveAnswerMutation = useMutation({
    mutationFn: async (params: { questionId: string; answer: string }) => {
      const res = await apiRequest('POST', '/api/interview/answers/improve', params);
      return res.json();
    },
  });
  
  // Toggle bookmark
  const toggleBookmarkMutation = useMutation({
    mutationFn: async (answerId: string) => {
      const res = await apiRequest('PATCH', `/api/interview/answers/${answerId}/bookmark`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-session', selectedSessionId] });
    },
  });
  
  const handleStartSession = () => {
    if (!activeProfile || !desiredJob) {
      toast({ 
        title: '희망직무가 설정되지 않았습니다.',
        description: '프로필에서 희망직무를 먼저 설정해주세요.',
        variant: 'destructive'
      });
      return;
    }
    
    createSessionMutation.mutate({
      profileId: activeProfile.id,
      desiredJob,
      sessionType: 'practice',
    });
  };
  
  const handleSubmitAnswer = () => {
    const question = sessionData?.questions?.[currentQuestionIndex];
    if (!question || !answerText.trim()) return;
    
    submitAnswerMutation.mutate({
      questionId: question.id,
      answer: answerText,
    });
  };
  
  const handleSaveAnswer = () => {
    const question = sessionData?.questions?.[currentQuestionIndex];
    if (!question || !answerText.trim()) return;
    
    saveAnswerMutation.mutate({
      questionId: question.id,
      answer: answerText,
    });
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < (sessionData?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setAnswerText('');
      setShowFeedback(false);
    }
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setAnswerText('');
      setShowFeedback(false);
    }
  };
  
  // Set answer text when loading existing answer
  useEffect(() => {
    const question = sessionData?.questions?.[currentQuestionIndex];
    if (question?.answer) {
      setAnswerText(question.answer.answer || '');
      setShowFeedback(!!question.answer.overallScore);
    } else {
      setAnswerText('');
      setShowFeedback(false);
    }
  }, [currentQuestionIndex, sessionData?.questions]);
  
  const currentQuestion = sessionData?.questions?.[currentQuestionIndex];
  const progress = sessionData?.session 
    ? (sessionData.session.answeredQuestions / sessionData.session.totalQuestions) * 100
    : 0;
    
  // Render session list view
  if (view === 'list') {
    return (
      <div className="space-y-6" data-testid="interview-list-view">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#3182F6]/20 to-[#7C3AED]/20 flex items-center justify-center mx-auto mb-4">
            <Mic className="w-8 h-8 text-[#3182F6]" />
          </div>
          <h1 className="text-2xl font-bold text-[#191F28] mb-2">면접 준비</h1>
          <p className="text-[#8B95A1] text-sm max-w-md mx-auto">
            희망직무와 프로필을 기반으로 맞춤형 면접 질문을 생성하고 연습할 수 있습니다.
          </p>
        </div>
        
        {/* 희망직무 표시 */}
        <Card className="border-[#3182F6]/30 bg-gradient-to-r from-[#E8F3FF] to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#3182F6]/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#3182F6]" />
                </div>
                <div>
                  <p className="text-xs text-[#8B95A1]">현재 희망직무</p>
                  <p className="font-bold text-[#191F28]">
                    {desiredJob || '설정되지 않음'}
                  </p>
                </div>
              </div>
              {!desiredJob && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/profile')}
                  data-testid="btn-set-desired-job"
                >
                  설정하기
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* 새 세션 시작 */}
        <Card className="border-dashed border-2 border-[#E5E8EB] hover:border-[#3182F6] transition-colors cursor-pointer"
              onClick={handleStartSession}
              data-testid="btn-start-new-session">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#3182F6]/10 flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-[#3182F6]" />
            </div>
            <h3 className="font-bold text-[#191F28] mb-1">새 면접 준비 시작</h3>
            <p className="text-sm text-[#8B95A1]">
              AI가 희망직무에 맞는 면접 질문을 생성합니다
            </p>
            {createSessionMutation.isPending && (
              <div className="flex items-center justify-center gap-2 mt-4 text-[#3182F6]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">질문 생성 중...</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* 카테고리 설명 */}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(categoryInfo).map(([key, info]) => (
            <Card key={key} className="p-3">
              <div className="flex items-start gap-2">
                <Badge className={info.color}>
                  <info.icon className="w-3 h-3" />
                </Badge>
                <div>
                  <p className="text-xs font-medium text-[#191F28]">{info.label}</p>
                  <p className="text-[10px] text-[#8B95A1]">{info.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* 이전 세션 목록 */}
        {sessions.length > 0 && (
          <div>
            <h3 className="font-bold text-[#191F28] mb-3">이전 면접 연습</h3>
            <div className="space-y-2">
              {sessions.map(session => (
                <Card 
                  key={session.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedSessionId(session.id);
                    setView('session');
                    setCurrentQuestionIndex(0);
                  }}
                  data-testid={`session-${session.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#191F28]">{session.desiredJob}</p>
                        <p className="text-xs text-[#8B95A1]">
                          {new Date(session.createdAt).toLocaleDateString('ko-KR')} · 
                          {session.answeredQuestions}/{session.totalQuestions} 완료
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={session.status === 'completed' ? 'secondary' : 'outline'}>
                          {session.status === 'completed' ? '완료' : '진행중'}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-[#8B95A1]" />
                      </div>
                    </div>
                    <Progress value={(session.answeredQuestions / session.totalQuestions) * 100} className="mt-2 h-1" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Render session/practice view
  if (view === 'session' && sessionData) {
    return (
      <div className="space-y-4" data-testid="interview-session-view">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setView('list');
              setSelectedSessionId(null);
            }}
            data-testid="btn-back-to-list"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            목록으로
          </Button>
          <Badge variant="outline">
            {currentQuestionIndex + 1} / {sessionData.questions.length}
          </Badge>
        </div>
        
        {/* Progress */}
        <div className="space-y-1">
          <Progress value={(currentQuestionIndex + 1) / sessionData.questions.length * 100} className="h-2" />
          <p className="text-xs text-[#8B95A1] text-center">
            {sessionData.session.desiredJob} 면접 준비
          </p>
        </div>
        
        {/* Question Card */}
        {currentQuestion && (
          <Card className="border-t-4" style={{ borderTopColor: categoryInfo[currentQuestion.category]?.color.includes('blue') ? '#3182F6' : categoryInfo[currentQuestion.category]?.color.includes('purple') ? '#7C3AED' : categoryInfo[currentQuestion.category]?.color.includes('green') ? '#059669' : '#D97706' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Badge className={categoryInfo[currentQuestion.category]?.color}>
                  {categoryInfo[currentQuestion.category]?.label}
                </Badge>
                {currentQuestion.difficulty && (
                  <Badge variant="outline" className="text-xs">
                    {currentQuestion.difficulty === 'easy' ? '기초' : currentQuestion.difficulty === 'medium' ? '중급' : '심화'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Question */}
              <div className="p-4 bg-[#F8F9FA] rounded-lg">
                <p className="text-lg font-medium text-[#191F28] leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>
              
              {/* Question Reason */}
              {currentQuestion.questionReason && (
                <div className="flex items-start gap-2 p-3 bg-[#FFF8E1] rounded-lg">
                  <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-800">이 질문이 나온 이유</p>
                    <p className="text-xs text-amber-700">{currentQuestion.questionReason}</p>
                  </div>
                </div>
              )}
              
              {/* Guide Text (for self_intro) */}
              {currentQuestion.guideText && (
                <div className="flex items-start gap-2 p-3 bg-[#E8F3FF] rounded-lg">
                  <BookOpen className="w-4 h-4 text-[#3182F6] mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-[#3182F6]">답변 가이드</p>
                    <p className="text-xs text-[#4B5563]">{currentQuestion.guideText}</p>
                  </div>
                </div>
              )}
              
              {/* Answer Input */}
              <div>
                <Textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="답변을 입력하세요..."
                  className="min-h-[150px] resize-none"
                  data-testid="textarea-answer"
                />
                <p className="text-xs text-[#8B95A1] mt-1 text-right">
                  {answerText.length}자
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleSaveAnswer}
                  disabled={!answerText.trim() || saveAnswerMutation.isPending}
                  data-testid="btn-save-answer"
                >
                  {saveAnswerMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-1" />
                  )}
                  저장만
                </Button>
                <Button
                  className="flex-1 bg-[#3182F6]"
                  onClick={handleSubmitAnswer}
                  disabled={!answerText.trim() || submitAnswerMutation.isPending}
                  data-testid="btn-submit-answer"
                >
                  {submitAnswerMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-1" />
                  )}
                  AI 피드백 받기
                </Button>
              </div>
              
              {/* Feedback Display */}
              {showFeedback && currentQuestion.answer?.overallScore && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#191F28] flex items-center gap-2">
                      <Brain className="w-5 h-5 text-[#3182F6]" />
                      AI 피드백
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBookmarkMutation.mutate(currentQuestion.answer!.id)}
                      data-testid="btn-toggle-bookmark"
                    >
                      {currentQuestion.answer.isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4 text-[#3182F6]" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Scores */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: '질문 이해도', score: currentQuestion.answer.understandingScore },
                      { label: '직무 적합도', score: currentQuestion.answer.fitScore },
                      { label: '논리 구조', score: currentQuestion.answer.logicScore },
                      { label: '구체성', score: currentQuestion.answer.specificityScore },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-[#F8F9FA] rounded">
                        <span className="text-xs text-[#8B95A1]">{item.label}</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <div
                              key={n}
                              className={`w-2 h-2 rounded-full ${n <= (item.score || 0) ? 'bg-[#3182F6]' : 'bg-[#E5E8EB]'}`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Overall Score */}
                  <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-[#3182F6]/10 to-[#7C3AED]/10 rounded-lg">
                    <span className="text-sm text-[#8B95A1]">종합 점수</span>
                    <span className="text-2xl font-bold text-[#3182F6]">
                      {currentQuestion.answer.overallScore}/5
                    </span>
                  </div>
                  
                  {/* Improvement Suggestion */}
                  {currentQuestion.answer.improvementSuggestion && (
                    <div className="p-3 bg-[#FFF8E1] rounded-lg">
                      <p className="text-xs font-medium text-amber-800 mb-1">개선 제안</p>
                      <p className="text-sm text-amber-700">{currentQuestion.answer.improvementSuggestion}</p>
                    </div>
                  )}
                  
                  {/* Improved Answer */}
                  {currentQuestion.answer.improvedAnswer && (
                    <div className="p-3 bg-[#E8F3FF] rounded-lg">
                      <p className="text-xs font-medium text-[#3182F6] mb-1">AI 첨삭 답변</p>
                      <p className="text-sm text-[#4B5563] whitespace-pre-wrap">{currentQuestion.answer.improvedAnswer}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            data-testid="btn-prev-question"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            이전
          </Button>
          <Button
            variant="outline"
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex >= sessionData.questions.length - 1}
            data-testid="btn-next-question"
          >
            다음
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        {/* Question List Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">질문 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sessionData.questions.map((q: InterviewQuestion, idx: number) => (
                <Button
                  key={q.id}
                  variant={idx === currentQuestionIndex ? 'default' : q.answer ? 'secondary' : 'outline'}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => {
                    setCurrentQuestionIndex(idx);
                    setShowFeedback(false);
                  }}
                  data-testid={`btn-question-${idx}`}
                >
                  {q.answer ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Loading state
  if (loadingSessions || loadingSession) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[#3182F6]" />
      </div>
    );
  }
  
  return null;
}

export default function Interview() {
  return (
    <Layout>
      <div className="pb-20 px-4">
        <InterviewContent />
      </div>
    </Layout>
  );
}
