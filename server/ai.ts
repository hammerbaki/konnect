import Anthropic from "@anthropic-ai/sdk";
import type { Profile } from "@shared/schema";

// Using Replit AI Integrations for Anthropic - no API key needed, charges to credits
const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

// Helper function to check if error is rate limit or quota violation
function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

// Simple concurrency limiter (replaces p-limit)
function createLimiter(concurrency: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  
  return async function<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = async () => {
        active++;
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          active--;
          if (queue.length > 0) {
            const next = queue.shift();
            if (next) next();
          }
        }
      };
      
      if (active < concurrency) {
        run();
      } else {
        queue.push(run);
      }
    });
  };
}

// Simple retry with exponential backoff (replaces p-retry)
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: { retries: number; minTimeout: number; maxTimeout: number; factor: number }
): Promise<T> {
  let lastError: Error | undefined;
  let timeout = options.minTimeout;
  
  for (let attempt = 0; attempt <= options.retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // If it's not a rate limit error, don't retry
      if (!isRateLimitError(error)) {
        throw error;
      }
      
      if (attempt < options.retries) {
        await new Promise(resolve => setTimeout(resolve, timeout));
        timeout = Math.min(timeout * options.factor, options.maxTimeout);
      }
    }
  }
  
  throw lastError;
}

// Rate limiter: max 2 concurrent requests
const limit = createLimiter(2);

// Profile-specific system prompts for career analysis
const getAnalysisSystemPrompt = (profileType: string): string => {
  const basePrompt = `당신은 한국의 커리어 컨설턴트 AI입니다. 사용자의 프로필을 분석하여 진로 방향을 제시합니다. 모든 응답은 한국어로 작성하세요.`;

  const specificPrompts: Record<string, string> = {
    elementary: `초등학생의 흥미와 재능을 발견하고 다양한 직업 세계를 소개하는데 초점을 맞추세요.`,
    middle: `중학생의 적성과 관심사를 파악하고 고등학교 진로 선택을 돕는데 초점을 맞추세요.`,
    high: `고등학생의 대학 진학 목표를 위해 학업 역량, 내신, 수능, 입시 전략을 분석하세요.`,
    university: `대학생의 취업 준비를 위해 전공 역량, 인턴십, 자격증, 포트폴리오 개발을 분석하세요.`,
    general: `구직자의 이직 및 경력 개발을 위해 직무 경험, 역량, 연봉 협상, 승진 전략을 분석하세요.`,
  };

  return `${basePrompt}\n\n${specificPrompts[profileType] || specificPrompts.general}`;
};

// Profile-specific data extraction for analysis
const getProfileContextData = (profile: Profile, userIdentity?: { displayName?: string; gender?: string; birthDate?: string | Date }): string => {
  const profileData = profile.profileData as any || {};
  
  let context = `## 프로필 유형: ${profile.type}\n## 제목: ${profile.title}\n\n`;

  // Add shared user identity info if available
  if (userIdentity) {
    context += `### 기본 인적사항\n`;
    context += `- 이름: ${userIdentity.displayName || profileData.basic_name || '미제공'}\n`;
    context += `- 성별: ${userIdentity.gender === 'male' ? '남성' : userIdentity.gender === 'female' ? '여성' : '미제공'}\n`;
    if (userIdentity.birthDate) {
      const birthDate = new Date(userIdentity.birthDate);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      context += `- 나이: ${age}세 (${birthDate.getFullYear()}년생)\n`;
    }
    context += `\n`;
  }

  // Add basic profile info if available
  if (profileData.basic_bio) {
    context += `- 한 줄 소개: ${profileData.basic_bio}\n`;
  }
  if (profileData.basic_role) {
    context += `- 현재 역할: ${profileData.basic_role}\n`;
  }
  if (profileData.basic_location) {
    context += `- 거주지: ${profileData.basic_location}\n`;
  }

  switch (profile.type) {
    case 'elementary':
      context += `\n### 초등학생 프로필 정보\n`;
      context += `- 학교명: ${profileData.elem_schoolName || '미제공'}\n`;
      context += `- 학년: ${profileData.elem_grade || '미제공'}\n`;
      context += `- 관심 분야: ${profileData.elem_interests || '미제공'}\n`;
      context += `- 좋아하는 활동: ${profileData.elem_activities || '미제공'}\n`;
      context += `- 좋아하는 과목: ${profileData.elem_favoriteSubject || '미제공'}\n`;
      context += `- 장래 희망: ${profileData.elem_dreamJob || '미제공'}\n`;
      break;
      
    case 'middle':
      context += `\n### 중학생 프로필 정보\n`;
      context += `- 학교명: ${profileData.mid_schoolName || '미제공'}\n`;
      context += `- 학년: ${profileData.mid_grade || '미제공'}\n`;
      context += `- 적성: ${profileData.mid_aptitude || '미제공'}\n`;
      context += `- 관심 과목: ${profileData.mid_favoriteSubjects?.join(', ') || '미제공'}\n`;
      context += `- 동아리 활동: ${profileData.mid_clubActivities || '미제공'}\n`;
      context += `- 진로 희망: ${profileData.mid_careerGoal || '미제공'}\n`;
      break;
      
    case 'high':
      context += `\n### 고등학생 프로필 정보\n`;
      context += `- 학교명: ${profileData.high_schoolName || '미제공'}\n`;
      context += `- 학년: ${profileData.high_grade || '미제공'}\n`;
      context += `- 계열: ${profileData.high_track || '미제공'}\n`;
      context += `- 내신 등급: ${profileData.high_gpa || '미제공'}\n`;
      context += `- 희망 대학: ${profileData.high_desiredUniversity || '미제공'}\n`;
      context += `- 희망 학과: ${profileData.high_desiredMajor || '미제공'}\n`;
      context += `- 수상 경력: ${profileData.high_awards || '미제공'}\n`;
      context += `- 동아리 활동: ${profileData.high_clubs || '미제공'}\n`;
      context += `- 봉사 활동: ${profileData.high_volunteer || '미제공'}\n`;
      context += `- 성격/강점: ${profileData.high_personality || '미제공'}\n`;
      context += `- 진로 고민: ${profileData.high_concerns || '미제공'}\n`;
      break;
      
    case 'university':
      context += `\n### 대학생 프로필 정보\n`;
      context += `- 대학교: ${profileData.univ_universityName || '미제공'}\n`;
      context += `- 전공: ${profileData.univ_major || '미제공'}\n`;
      context += `- 부전공/복수전공: ${profileData.univ_minor || '미제공'}\n`;
      context += `- 학년: ${profileData.univ_grade || '미제공'}\n`;
      context += `- 학점: ${profileData.univ_gpa || '미제공'}\n`;
      context += `- 희망 직무: ${profileData.univ_desiredJob || '미제공'}\n`;
      context += `- 희망 산업: ${profileData.univ_desiredIndustry || '미제공'}\n`;
      context += `- 인턴십 상태: ${profileData.univ_internshipStatus || '미제공'}\n`;
      context += `- 어학 점수: ${profileData.univ_languageTests?.map((t: any) => `${t.type}: ${t.score}`).join(', ') || '미제공'}\n`;
      context += `- 자격증: ${profileData.univ_certificates || '미제공'}\n`;
      context += `- 취업 준비도: ${profileData.univ_careerReadiness || '미제공'}\n`;
      context += `- 진로 목표 명확성: ${profileData.univ_careerGoalClear || '미제공'}\n`;
      context += `- 개발하고 싶은 역량: ${profileData.univ_skillsToDevelop?.join(', ') || '미제공'}\n`;
      break;
      
    case 'general':
      context += `\n### 구직자/직장인 프로필 정보\n`;
      
      // 현재 상태
      context += `\n#### 현재 상태\n`;
      context += `- 고용 상태: ${getEmploymentStatusLabel(profileData.gen_currentStatus)}\n`;
      context += `- 이전 직장 만족도: ${profileData.gen_prevJobSatisfaction || '미제공'}/5\n`;
      context += `- 이직/구직 사유: ${getReasonForChangeLabel(profileData.gen_reasonForChange)}\n`;
      
      // 경력 사항
      if (profileData.gen_workExperience && profileData.gen_workExperience.length > 0) {
        context += `\n#### 경력 사항 (${profileData.gen_workExperience.length}개)\n`;
        profileData.gen_workExperience.forEach((exp: any, idx: number) => {
          context += `${idx + 1}. ${exp.role} @ ${exp.company}\n`;
          if (exp.startDate) {
            const start = new Date(exp.startDate);
            const end = exp.endDate ? new Date(exp.endDate) : new Date();
            const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
            context += `   - 기간: ${months}개월\n`;
          }
          if (exp.description) {
            context += `   - 업무 내용: ${exp.description}\n`;
          }
        });
      } else {
        context += `\n#### 경력 사항: 없음 (신입)\n`;
      }
      
      // 보유 역량
      context += `\n#### 보유 역량\n`;
      context += `- 핵심 스킬: ${profileData.gen_skills?.join(', ') || '미제공'}\n`;
      
      // 희망 커리어 방향
      context += `\n#### 희망 커리어 방향\n`;
      context += `- 희망 산업: ${profileData.gen_desiredIndustry || '미제공'}\n`;
      context += `- 희망 직무: ${profileData.gen_desiredRole || '미제공'}\n`;
      context += `- 근무 스타일: ${getWorkStyleLabel(profileData.gen_workStyle)}\n`;
      context += `- 직장 선택 기준: ${profileData.gen_workValues?.map((v: string) => getWorkValueLabel(v)).join(', ') || '미제공'}\n`;
      
      // 보상 기대
      context += `\n#### 보상 기대\n`;
      if (profileData.gen_salaryNoPreference) {
        context += `- 희망 연봉: 상관없음\n`;
      } else {
        context += `- 희망 연봉: ${profileData.gen_salary ? `${profileData.gen_salary.toLocaleString()}만원` : '미제공'}\n`;
      }
      
      // 근무 환경 선호
      context += `\n#### 근무 환경 선호\n`;
      if (profileData.gen_environmentNoPreference) {
        context += `- 환경 선호: 상관없음\n`;
      } else {
        context += `- 환경 선호: ${profileData.gen_environmentPreferences?.map((e: string) => getEnvironmentLabel(e)).join(', ') || '미제공'}\n`;
      }
      
      // 고민
      context += `\n#### 현재 커리어 고민\n`;
      context += `${profileData.gen_concerns || '미제공'}\n`;
      break;
  }

  return context;
};

// Helper functions for label conversion
function getEmploymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'employed': '재직 중',
    'unemployed': '구직 중',
    'freelance': '프리랜서',
    'startup': '창업/사업',
    'career_break': '경력 보류 중'
  };
  return labels[status] || status || '미제공';
}

function getReasonForChangeLabel(reason: string): string {
  const labels: Record<string, string> = {
    'growth': '성장 기회 부족',
    'compensation': '연봉 불만족',
    'culture': '조직 문화/인간관계',
    'aptitude': '적성 불일치',
    'stability': '고용 불안정',
    'burnout': '업무 과다/번아웃',
    'new_challenge': '새로운 분야 도전'
  };
  return labels[reason] || reason || '미제공';
}

function getWorkStyleLabel(style: string): string {
  const labels: Record<string, string> = {
    'office': '사무실 출근',
    'remote': '재택근무',
    'hybrid': '하이브리드',
    'flexible': '자유로운 근무'
  };
  return labels[style] || style || '미제공';
}

function getWorkValueLabel(value: string): string {
  const labels: Record<string, string> = {
    'growth': '성장 가능성',
    'balance': '워라밸',
    'money': '높은 연봉',
    'culture': '수평적 문화',
    'stability': '고용 안정',
    'autonomy': '자율성'
  };
  return labels[value] || value;
}

function getEnvironmentLabel(env: string): string {
  const labels: Record<string, string> = {
    'brain': '지식 집약적 업무',
    'sedentary': '좌식 근무',
    'active': '활동적 근무',
    'industrial': '제조/생산 현장',
    'challenging': '도전적 환경'
  };
  return labels[env] || env;
}

// Career analysis response type
export interface CareerAnalysisResult {
  summary: string;
  stats: { label1: string; val1: string; label2: string; val2: string; label3: string; val3: string };
  chartData: {
    radar: Array<{ subject: string; A: number; fullMark: number }>;
    bar: Array<{ name: string; val: number }>;
  };
  careerRecommendations: Array<{
    title: string;
    description: string;
    matchScore: number;
    salary: string;
    requiredSkills: string[];
    jobOutlook: string;
  }>;
  skillAnalysis: {
    strengths: string[];
    weaknesses: string[];
    developmentPlan: string[];
  };
  rawResponse: string;
}

// Generate career analysis using Claude Haiku (cheapest model for testing)
export async function generateCareerAnalysis(
  profile: Profile, 
  userIdentity?: { displayName?: string; gender?: string; birthDate?: string | Date }
): Promise<CareerAnalysisResult> {
  return limit(() =>
    retryWithBackoff(
      async () => {
        const systemPrompt = getAnalysisSystemPrompt(profile.type);
        const contextData = getProfileContextData(profile, userIdentity);

        const prompt = `${contextData}

---

위 프로필 정보를 철저히 분석하여 맞춤형 커리어 분석 결과를 제공해주세요.
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "summary": "전체 분석 요약 (2-3문장, 사용자의 강점과 가능성 강조)",
  "stats": {
    "label1": "시장 경쟁력",
    "val1": "Top 30%",
    "label2": "추천 직무",
    "val2": "직무명",
    "label3": "성공 가능성",
    "val3": "높음/보통/낮음"
  },
  "chartData": {
    "radar": [
      { "subject": "전문성", "A": 85, "fullMark": 150 },
      { "subject": "커뮤니케이션", "A": 90, "fullMark": 150 },
      { "subject": "리더십", "A": 75, "fullMark": 150 },
      { "subject": "문제해결", "A": 80, "fullMark": 150 },
      { "subject": "창의성", "A": 70, "fullMark": 150 }
    ],
    "bar": [
      { "name": "현재", "val": 65 },
      { "name": "6개월 후", "val": 80 },
      { "name": "목표", "val": 95 }
    ]
  },
  "careerRecommendations": [
    {
      "title": "추천 직무 1",
      "description": "해당 직무가 적합한 이유 설명",
      "matchScore": 92,
      "salary": "연봉 범위 (예: 4,000-6,000만원)",
      "requiredSkills": ["필요 역량 1", "필요 역량 2"],
      "jobOutlook": "전망 설명"
    },
    {
      "title": "추천 직무 2",
      "description": "해당 직무가 적합한 이유 설명",
      "matchScore": 85,
      "salary": "연봉 범위",
      "requiredSkills": ["필요 역량 1", "필요 역량 2"],
      "jobOutlook": "전망 설명"
    },
    {
      "title": "추천 직무 3",
      "description": "해당 직무가 적합한 이유 설명",
      "matchScore": 78,
      "salary": "연봉 범위",
      "requiredSkills": ["필요 역량 1", "필요 역량 2"],
      "jobOutlook": "전망 설명"
    }
  ],
  "skillAnalysis": {
    "strengths": ["강점 1", "강점 2", "강점 3"],
    "weaknesses": ["보완점 1", "보완점 2"],
    "developmentPlan": ["추천 액션 1", "추천 액션 2", "추천 액션 3"]
  }
}

중요: 
- 프로필 정보를 기반으로 현실적이고 구체적인 분석을 제공하세요.
- 한국 취업 시장 기준으로 연봉과 전망을 분석하세요.
- matchScore는 프로필과의 적합도를 0-100 사이 숫자로 표시합니다.
- 반드시 유효한 JSON만 반환하세요.`;

        const message = await anthropic.messages.create({
          model: "claude-3-haiku-20240307", // Using cheapest model for testing
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const content = message.content[0];
        if (content.type !== "text") {
          throw new Error("Unexpected response type");
        }

        const rawResponse = content.text;
        
        // Parse JSON from response
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No valid JSON found in response");
        }

        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          summary: parsed.summary || "분석 중 오류가 발생했습니다.",
          stats: parsed.stats || { label1: "분석중", val1: "-", label2: "분석중", val2: "-", label3: "분석중", val3: "-" },
          chartData: parsed.chartData || { radar: [], bar: [] },
          careerRecommendations: parsed.careerRecommendations || [],
          skillAnalysis: parsed.skillAnalysis || { strengths: [], weaknesses: [], developmentPlan: [] },
          rawResponse,
        };
      },
      {
        retries: 7,
        minTimeout: 2000,
        maxTimeout: 128000,
        factor: 2,
      }
    )
  );
}

// Generate personal essay using Claude
export async function generatePersonalEssay(
  profileType: string,
  category: string,
  topic: string,
  essayContext?: string
): Promise<{
  title: string;
  content: string;
  rawResponse: string;
}> {
  return limit(() =>
    retryWithBackoff(
      async () => {
        const systemPrompt = `당신은 한국의 자기소개서 전문 작가입니다. ${category}를 위한 자기소개서를 작성합니다. 모든 응답은 한국어로 작성하세요.`;

        const prompt = `주제: ${topic}
${essayContext ? `추가 정보: ${essayContext}` : ''}

위 주제에 대한 자기소개서를 작성하세요. 다음 JSON 형식으로 반환하세요:

{
  "title": "자기소개서 제목",
  "content": "자기소개서 본문 (3-5단락, 각 단락은 구체적 경험과 배운 점 포함)"
}

**반드시 유효한 JSON만 반환하세요. 추가 설명 없이 JSON만 출력하세요.**`;

        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 8192,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const msgContent = message.content[0];
        if (msgContent.type !== "text") {
          throw new Error("Unexpected response type");
        }

        const rawResponse = msgContent.text;
        
        // Parse JSON from response
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No valid JSON found in response");
        }

        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          title: parsed.title || "자기소개서",
          content: parsed.content || "내용을 생성할 수 없습니다.",
          rawResponse,
        };
      },
      {
        retries: 7,
        minTimeout: 2000,
        maxTimeout: 128000,
        factor: 2,
      }
    )
  );
}
