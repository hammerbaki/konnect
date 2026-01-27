import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { Layout } from '@/components/layout/Layout';
import { 
  Mic, 
  MicOff,
  Video,
  Square,
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
  PenLine,
  Volume2,
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

interface VideoRecording {
  id: string;
  sessionId: string;
  questionId: string;
  questionOrder: number;
  sttText?: string;
  sttStatus: 'pending' | 'processing' | 'completed' | 'failed';
  sttError?: string;
  understandingScore?: number;
  fitScore?: number;
  logicScore?: number;
  specificityScore?: number;
  overallScore?: number;
  improvementSuggestion?: string;
  improvedAnswer?: string;
  isBookmarked: number;
  durationSeconds?: number;
  userNote?: string;
}

// Voice Recorder Hook
type RecordingState = 'idle' | 'recording' | 'stopped';

const MAX_RECORDING_DURATION = 180; // 3 minutes max

function useVoiceRecorder(onMaxDurationReached?: () => void) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setDuration(0);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(100);
      setState('recording');
      
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= MAX_RECORDING_DURATION && onMaxDurationReached) {
            onMaxDurationReached();
          }
          return newDuration;
        });
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      throw err;
    }
  }, [onMaxDurationReached]);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state !== 'recording') {
        resolve(new Blob());
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        recorder.stream.getTracks().forEach((t) => t.stop());
        setState('stopped');
        resolve(blob);
      };

      recorder.stop();
    });
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setDuration(0);
    chunksRef.current = [];
  }, []);

  return { state, duration, startRecording, stopRecording, reset };
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
  
  // Voice mode state
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceRecordingId, setVoiceRecordingId] = useState<string | null>(null);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  
  // Auto-stop callback for max duration
  const handleMaxDurationReached = useCallback(() => {
    toast({ 
      title: '최대 녹음 시간 도달',
      description: '3분 최대 녹음 시간에 도달했습니다.',
    });
  }, [toast]);
  const voiceRecorder = useVoiceRecorder(handleMaxDurationReached);
  
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
      case 'international_university':
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
    onError: (error: any) => {
      console.error('Session creation error:', error);
      toast({ 
        title: '세션 생성 실패', 
        description: error?.message || '면접 세션을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        variant: 'destructive' 
      });
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
  
  // Fetch video recordings for current session
  const { data: videoRecordings = [] } = useQuery<VideoRecording[]>({
    queryKey: ['video-recordings', selectedSessionId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/interview/video-recordings/${selectedSessionId}`);
      return res.json();
    },
    enabled: !!selectedSessionId && isVoiceMode,
  });
  
  // Get current question's video recording
  const currentQuestionRecording = videoRecordings.find(
    r => r.questionId === sessionData?.questions?.[currentQuestionIndex]?.id
  );
  
  // Submit voice recording mutation
  const submitVoiceRecordingMutation = useMutation({
    mutationFn: async (params: { sessionId: string; questionId: string; questionOrder: number; audioBase64: string; durationSeconds: number }) => {
      const res = await apiRequest('POST', '/api/interview/video-recordings', params);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['video-recordings', selectedSessionId] });
      setVoiceRecordingId(data.id);
      if (data.sttStatus === 'completed') {
        toast({ title: '음성이 변환되었습니다.' });
      } else if (data.sttStatus === 'failed') {
        toast({ title: '음성 인식에 실패했습니다.', variant: 'destructive' });
      }
    },
    onError: () => {
      toast({ title: '녹음 저장 실패', variant: 'destructive' });
    },
  });
  
  // Get AI feedback on voice recording
  const getVoiceFeedbackMutation = useMutation({
    mutationFn: async (recordingId: string) => {
      const res = await apiRequest('POST', `/api/interview/video-recordings/${recordingId}/feedback`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-recordings', selectedSessionId] });
      setShowFeedback(true);
      toast({ title: 'AI 피드백이 생성되었습니다.' });
    },
    onError: () => {
      toast({ title: 'AI 피드백 생성 실패', variant: 'destructive' });
    },
  });
  
  // Voice recording handlers
  const handleStartVoiceRecording = async () => {
    try {
      await voiceRecorder.startRecording();
    } catch (err) {
      toast({ 
        title: '마이크 접근 권한이 필요합니다.',
        description: '브라우저 설정에서 마이크 권한을 허용해주세요.',
        variant: 'destructive' 
      });
    }
  };
  
  const handleStopVoiceRecording = async () => {
    const question = sessionData?.questions?.[currentQuestionIndex];
    if (!question) return;
    
    setIsProcessingVoice(true);
    try {
      const audioBlob = await voiceRecorder.stopRecording();
      
      // Check file size limit (10MB max)
      const MAX_SIZE = 10 * 1024 * 1024;
      if (audioBlob.size > MAX_SIZE) {
        toast({ 
          title: '녹음 파일이 너무 큽니다.',
          description: '10MB 이하로 녹음해주세요.',
          variant: 'destructive' 
        });
        setIsProcessingVoice(false);
        voiceRecorder.reset();
        return;
      }
      
      // Convert to base64
      const reader = new FileReader();
      reader.onerror = () => {
        toast({ title: '녹음 처리 중 오류가 발생했습니다.', variant: 'destructive' });
        setIsProcessingVoice(false);
      };
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        submitVoiceRecordingMutation.mutate({
          sessionId: selectedSessionId!,
          questionId: question.id,
          questionOrder: currentQuestionIndex,
          audioBase64: base64,
          durationSeconds: voiceRecorder.duration,
        }, {
          onSettled: () => {
            setIsProcessingVoice(false);
          }
        });
      };
      reader.readAsDataURL(audioBlob);
    } catch (err) {
      toast({ title: '녹음 처리 중 오류가 발생했습니다.', variant: 'destructive' });
      setIsProcessingVoice(false);
    }
  };
  
  const handleGetVoiceFeedback = () => {
    if (currentQuestionRecording?.id) {
      getVoiceFeedbackMutation.mutate(currentQuestionRecording.id);
    }
  };
  
  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
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
      voiceRecorder.reset();
    }
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setAnswerText('');
      setShowFeedback(false);
      voiceRecorder.reset();
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
        
        {/* Mode Toggle */}
        <div className="flex justify-center">
          <div className="flex bg-[#F2F4F6] rounded-lg p-1 gap-1">
            <Button
              variant={!isVoiceMode ? 'default' : 'ghost'}
              size="sm"
              className={!isVoiceMode ? 'bg-white shadow-sm' : ''}
              onClick={() => setIsVoiceMode(false)}
              data-testid="btn-text-mode"
            >
              <PenLine className="w-4 h-4 mr-1" />
              텍스트
            </Button>
            <Button
              variant={isVoiceMode ? 'default' : 'ghost'}
              size="sm"
              className={isVoiceMode ? 'bg-white shadow-sm' : ''}
              onClick={() => setIsVoiceMode(true)}
              data-testid="btn-voice-mode"
            >
              <Mic className="w-4 h-4 mr-1" />
              음성 면접
            </Button>
          </div>
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
              
              {/* Answer Input - Text Mode */}
              {!isVoiceMode && (
                <>
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
                </>
              )}
              
              {/* Voice Recording Mode */}
              {isVoiceMode && (
                <div className="space-y-4">
                  {/* Recording Control */}
                  <div className="flex flex-col items-center p-6 bg-gradient-to-br from-[#F8F9FA] to-[#E8F3FF] rounded-xl">
                    {voiceRecorder.state === 'idle' && !currentQuestionRecording?.sttText && (
                      <>
                        <button
                          onClick={handleStartVoiceRecording}
                          className="w-20 h-20 rounded-full bg-[#3182F6] hover:bg-[#2563EB] flex items-center justify-center shadow-lg transition-all hover:scale-105"
                          data-testid="btn-start-voice-recording"
                        >
                          <Mic className="w-8 h-8 text-white" />
                        </button>
                        <p className="mt-4 text-sm text-[#8B95A1]">버튼을 눌러 녹음을 시작하세요</p>
                      </>
                    )}
                    
                    {voiceRecorder.state === 'recording' && (
                      <>
                        <div className="relative">
                          <button
                            onClick={handleStopVoiceRecording}
                            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-all animate-pulse"
                            data-testid="btn-stop-voice-recording"
                          >
                            <Square className="w-6 h-6 text-white fill-white" />
                          </button>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
                        </div>
                        <p className="mt-4 text-lg font-bold text-red-500">{formatDuration(voiceRecorder.duration)}</p>
                        <p className="text-sm text-[#8B95A1]">녹음 중... 버튼을 눌러 종료</p>
                      </>
                    )}
                    
                    {(isProcessingVoice || submitVoiceRecordingMutation.isPending) && (
                      <>
                        <div className="w-20 h-20 rounded-full bg-[#3182F6]/20 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-[#3182F6] animate-spin" />
                        </div>
                        <p className="mt-4 text-sm text-[#8B95A1]">음성을 텍스트로 변환 중...</p>
                      </>
                    )}
                  </div>
                  
                  {/* Transcription Result */}
                  {currentQuestionRecording?.sttText && (
                    <div className="space-y-3">
                      <div className="p-4 bg-white border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Volume2 className="w-4 h-4 text-[#3182F6]" />
                          <span className="text-sm font-medium text-[#191F28]">음성 인식 결과</span>
                          {currentQuestionRecording.durationSeconds && (
                            <Badge variant="outline" className="text-xs">
                              {formatDuration(currentQuestionRecording.durationSeconds)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-[#4B5563] whitespace-pre-wrap">
                          {currentQuestionRecording.sttText}
                        </p>
                      </div>
                      
                      {/* Voice Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            voiceRecorder.reset();
                            queryClient.invalidateQueries({ queryKey: ['video-recordings', selectedSessionId] });
                          }}
                          data-testid="btn-rerecord"
                        >
                          <Mic className="w-4 h-4 mr-1" />
                          다시 녹음
                        </Button>
                        <Button
                          className="flex-1 bg-[#3182F6]"
                          onClick={handleGetVoiceFeedback}
                          disabled={!currentQuestionRecording?.sttText || getVoiceFeedbackMutation.isPending}
                          data-testid="btn-voice-feedback"
                        >
                          {getVoiceFeedbackMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 mr-1" />
                          )}
                          AI 피드백 받기
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Voice Feedback Display */}
                  {isVoiceMode && currentQuestionRecording?.overallScore && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-[#191F28] flex items-center gap-2">
                          <Brain className="w-5 h-5 text-[#3182F6]" />
                          AI 피드백 (음성)
                        </h4>
                      </div>
                      
                      {/* Scores */}
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: '질문 이해도', score: currentQuestionRecording.understandingScore },
                          { label: '직무 적합도', score: currentQuestionRecording.fitScore },
                          { label: '논리 구조', score: currentQuestionRecording.logicScore },
                          { label: '구체성', score: currentQuestionRecording.specificityScore },
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
                          {currentQuestionRecording.overallScore}/5
                        </span>
                      </div>
                      
                      {/* Improvement Suggestion */}
                      {currentQuestionRecording.improvementSuggestion && (
                        <div className="p-3 bg-[#FFF8E1] rounded-lg">
                          <p className="text-xs font-medium text-amber-800 mb-1">개선 제안</p>
                          <p className="text-sm text-amber-700">{currentQuestionRecording.improvementSuggestion}</p>
                        </div>
                      )}
                      
                      {/* Improved Answer */}
                      {currentQuestionRecording.improvedAnswer && (
                        <div className="p-3 bg-[#E8F3FF] rounded-lg">
                          <p className="text-xs font-medium text-[#3182F6] mb-1">AI 첨삭 답변</p>
                          <p className="text-sm text-[#4B5563] whitespace-pre-wrap">{currentQuestionRecording.improvedAnswer}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Feedback Display (Text mode only) */}
              {!isVoiceMode && showFeedback && currentQuestion.answer?.overallScore && (
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
  
  // Loading state with skeleton
  if (loadingSessions || loadingSession) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center mb-8 pt-6">
          <Skeleton className="h-8 w-40 mx-auto mb-2" />
          <Skeleton className="h-5 w-64 mx-auto" />
        </div>
        <Card className="toss-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="toss-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
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
