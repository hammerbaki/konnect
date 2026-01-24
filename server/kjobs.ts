
const API_BASE_URL = 'https://mytest.kjobs.co.kr';

function getApiKey(): string {
  const apiKey = process.env.KJOBS_API_KEY;
  if (!apiKey) {
    throw new Error('KJOBS_API_KEY environment variable is not set');
  }
  return apiKey;
}

interface KJobsSession {
  sessionId: string;
  totalQuestions: number;
  currentQuestion: number;
}

interface KJobsQuestion {
  id: string;
  questionNumber: number;
  questionText: string;
  questionType: 'likert' | 'forced_choice';
  axis: string;
  facet: string;
  options: null;
  optionA: string | null;
  optionB: string | null;
  reverseScored: boolean;
}

interface KJobsRecommendedJob {
  jobId: number;
  title: string;
  matchPercentage: number;
  keyCompetencies: string[];
}

interface KJobsGrowthPlan {
  thirtyDays: string[];
  sixtyDays: string[];
  ninetyDays: string[];
}

interface KJobsResult {
  resultId: string;
  sessionId: string;
  careerDna: string;
  scores: {
    careerInterests: number;
    workNeeds: number;
    interactionStyle: number;
    pressureResponse: number;
    selfIdentity: number;
    executionLearning: number;
    valuesPurpose: number;
  };
  facetScores: Record<string, number>;
  keywords: string[];
  recommendedJobs: KJobsRecommendedJob[];
  growthPlan: KJobsGrowthPlan;
}

type KJobsAnswers = Record<string, number | string>;

async function makeRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH';
    body?: object;
  } = {}
): Promise<T> {
  const { method = 'GET', body } = options;

  const headers: Record<string, string> = {
    'X-API-Key': getApiKey(),
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`K-JOBS API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

export async function initSession(externalUserId?: string): Promise<KJobsSession> {
  return makeRequest<KJobsSession>('/api/embed/init', {
    method: 'POST',
    body: externalUserId ? { externalUserId } : {},
  });
}

export async function getQuestions(): Promise<KJobsQuestion[]> {
  return makeRequest<KJobsQuestion[]>('/api/embed/questions');
}

export async function updateSessionProgress(
  sessionId: string,
  currentQuestion: number,
  answers: KJobsAnswers
): Promise<{ id: string; currentQuestion: number; answers: KJobsAnswers }> {
  return makeRequest(`/api/embed/sessions/${sessionId}`, {
    method: 'PATCH',
    body: { currentQuestion, answers },
  });
}

export async function submitAssessment(
  sessionId: string,
  answers: KJobsAnswers
): Promise<KJobsResult> {
  return makeRequest<KJobsResult>('/api/embed/submit', {
    method: 'POST',
    body: { sessionId, answers },
  });
}

export async function getResult(resultId: string): Promise<KJobsResult> {
  return makeRequest<KJobsResult>(`/api/embed/results/${resultId}`);
}

export type { KJobsSession, KJobsQuestion, KJobsResult, KJobsAnswers, KJobsRecommendedJob, KJobsGrowthPlan };
