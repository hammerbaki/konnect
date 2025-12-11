import Anthropic from "@anthropic-ai/sdk";
import type { Profile } from "@shared/schema";
import { checkAIRateLimit, type RateLimitResult } from "./rateLimiter";

// Using Replit AI Integrations for Anthropic - no API key needed, charges to credits
const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

// Export rate limit check for use in routes
export { checkAIRateLimit, type RateLimitResult };

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
      context += `- 학년: ${profileData.elem_grade || '미제공'}학년\n`;
      context += `- 장래희망 (되고 싶은 사람): ${profileData.elem_dreamJob || '미제공'}\n`;
      context += `- 부모님 희망: ${profileData.elem_parentsHope || '미제공'}\n`;
      context += `- 좋아하는 과목: ${profileData.elem_favoriteSubject || '미제공'}\n`;
      context += `- 싫어하는 과목: ${profileData.elem_dislikedSubject || '미제공'}\n`;
      context += `- 나의 강점: ${profileData.elem_strengths || '미제공'}\n`;
      context += `- 관심 분야: ${profileData.elem_interests || '미제공'}\n`;
      context += `- 취미/좋아하는 활동: ${profileData.elem_hobbies || '미제공'}\n`;
      context += `- 고민/걱정: ${profileData.elem_concerns || '미제공'}\n`;
      break;
      
    case 'middle':
      context += `\n### 중학생 프로필 정보\n`;
      context += `- 학교명: ${profileData.mid_schoolName || '미제공'}\n`;
      context += `- 학년: ${profileData.mid_grade || '미제공'}학년\n`;
      context += `- 반: ${profileData.mid_class || '미제공'}\n`;
      context += `- 학업 수준: ${getMidAcademicLabel(profileData.mid_academicScore)}\n`;
      context += `- 좋아하는 과목: ${profileData.mid_favoriteSubject || '미제공'}\n`;
      context += `- 싫어하는 과목: ${profileData.mid_dislikedSubject || '미제공'}\n`;
      context += `- 나의 강점: ${profileData.mid_strengths || '미제공'}\n`;
      context += `- 관심 분야: ${profileData.mid_interests || '미제공'}\n`;
      context += `- 취미: ${profileData.mid_hobbies || '미제공'}\n`;
      context += `- 장래희망: ${profileData.mid_dreamJob || '미제공'}\n`;
      context += `- 희망 고등학교 유형: ${getHighSchoolPlanLabel(profileData.mid_highSchoolPlan)}\n`;
      context += `- 현재 고민: ${profileData.mid_concerns || '미제공'}\n`;
      break;
      
    case 'high':
      context += `\n### 고등학생 프로필 정보\n`;
      context += `- 학교명: ${profileData.high_schoolName || '미제공'}\n`;
      context += `- 학년: ${profileData.high_grade || '미제공'}학년\n`;
      context += `- 반: ${profileData.high_class || '미제공'}\n`;
      context += `- 내신 등급: ${profileData.high_academicScore || '미제공'}등급\n`;
      context += `- 계열 (전공 트랙): ${getMajorTrackLabel(profileData.high_majorTrack)}\n`;
      context += `- 희망 대학: ${profileData.high_hopeUniversity || '미제공'}\n`;
      context += `- 희망 진로/직업: ${profileData.high_careerHope || '미제공'}\n`;
      context += `- 비교과 활동 현황: ${getActivityStatusLabel(profileData.high_activityStatus)}\n`;
      context += `- 좋아하는 과목: ${profileData.high_favoriteSubject || '미제공'}\n`;
      context += `- 싫어하는 과목: ${profileData.high_dislikedSubject || '미제공'}\n`;
      context += `- MBTI: ${profileData.high_mbti || '미제공'}\n`;
      context += `- 취미: ${profileData.high_hobbies || '미제공'}\n`;
      context += `- 유학 희망 여부: ${profileData.high_studyAbroad ? '예' : '아니오'}\n`;
      context += `- 스트레스 수준: ${profileData.high_stressLevel || '미제공'}/5\n`;
      context += `- 수면 패턴: ${profileData.high_sleepPattern || '미제공'}시간\n`;
      
      // Subject scores
      if (profileData.high_subject_scores) {
        const scores = profileData.high_subject_scores;
        context += `\n#### 과목별 성적\n`;
        context += `- 국어: ${scores.korean || '미제공'}등급\n`;
        context += `- 수학: ${scores.math || '미제공'}등급\n`;
        context += `- 영어: ${scores.english || '미제공'}등급\n`;
        context += `- 사회: ${scores.social || '미제공'}등급\n`;
        context += `- 과학: ${scores.science || '미제공'}등급\n`;
        context += `- 한국사: ${scores.history || '미제공'}등급\n`;
        context += `- 제2외국어: ${scores.second_lang || '미제공'}등급\n`;
      }
      
      context += `\n#### 현재 고민\n`;
      context += `${profileData.high_concerns || '미제공'}\n`;
      break;
      
    case 'university':
      context += `\n### 대학생 프로필 정보\n`;
      context += `- 대학교: ${profileData.univ_schoolName || '미제공'}\n`;
      context += `- 전공 계열: ${getMajorCategoryLabel(profileData.univ_majorCategory)}\n`;
      context += `- 전공명: ${profileData.univ_majorName || '미제공'}\n`;
      context += `- 학년: ${profileData.univ_grade || '미제공'}학년\n`;
      context += `- 학기: ${profileData.univ_semester || '미제공'}학기\n`;
      context += `- 학점 (GPA): ${profileData.univ_gpa || '미제공'}\n`;
      context += `- 어학 점수: ${profileData.univ_languageTests?.map((t: any) => `${t.type}: ${t.score}`).join(', ') || '미제공'}\n`;
      context += `- 자격증: ${profileData.univ_certificates || '미제공'}\n`;
      context += `- 취업 준비 정도: ${getCareerReadinessLabel(profileData.univ_careerReadiness)}\n`;
      context += `- 진로 목표 명확성: ${getCareerGoalClearLabel(profileData.univ_careerGoalClear)}\n`;
      context += `- 인턴십 경험: ${getInternshipStatusLabel(profileData.univ_internshipStatus)}\n`;
      context += `- 개발하고 싶은 역량: ${profileData.univ_skillsToDevelop?.join(', ') || '미제공'}\n`;
      
      // Wellbeing info
      context += `\n#### 대학 생활 현황\n`;
      context += `- 학업 스트레스: ${profileData.univ_academicStress || '미제공'}/5\n`;
      context += `- 경제적 스트레스: ${profileData.univ_financialStress || '미제공'}/5\n`;
      context += `- 수면 시간: ${profileData.univ_sleepHours || '미제공'}시간\n`;
      context += `- 정신 건강: ${profileData.univ_mentalWellbeing || '미제공'}/5\n`;
      context += `- 주당 근무 시간: ${profileData.univ_workloadWorkHours || '0'}시간\n`;
      context += `- 주당 공부 시간: ${profileData.univ_workloadStudyHours || '미제공'}시간\n`;
      
      context += `\n#### 현재 고민\n`;
      context += `${profileData.univ_concerns || '미제공'}\n`;
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

// Helper functions for middle school
function getMidAcademicLabel(score: string): string {
  const labels: Record<string, string> = {
    'top': '상위권',
    'upper_mid': '중상위권',
    'mid': '중위권',
    'lower_mid': '중하위권',
    'low': '하위권'
  };
  return labels[score] || score || '미제공';
}

function getHighSchoolPlanLabel(plan: string): string {
  const labels: Record<string, string> = {
    'general': '일반계고',
    'specialized': '특성화고',
    'science': '과학고/영재고',
    'foreign': '외국어고/국제고',
    'arts': '예술고/체육고',
    'undecided': '미정'
  };
  return labels[plan] || plan || '미제공';
}

// Helper functions for high school
function getMajorTrackLabel(track: string): string {
  const labels: Record<string, string> = {
    'humanities': '인문계',
    'natural': '자연계',
    'arts': '예체능',
    'vocational': '실업계',
    'undecided': '미정'
  };
  return labels[track] || track || '미제공';
}

function getActivityStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'very_active': '매우 활발',
    'active': '활발',
    'moderate': '보통',
    'inactive': '부족',
    'none': '거의 없음'
  };
  return labels[status] || status || '미제공';
}

// Helper functions for university
function getMajorCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'humanities': '인문계열',
    'social': '사회계열',
    'business': '경영/경제계열',
    'natural': '자연계열',
    'engineering': '공학계열',
    'medical': '의약계열',
    'arts': '예체능계열',
    'education': '교육계열'
  };
  return labels[category] || category || '미제공';
}

function getCareerReadinessLabel(readiness: string): string {
  const labels: Record<string, string> = {
    'very_ready': '매우 준비됨',
    'ready': '준비됨',
    'preparing': '준비 중',
    'not_started': '아직 시작 안함',
    'confused': '혼란스러움'
  };
  return labels[readiness] || readiness || '미제공';
}

function getCareerGoalClearLabel(clarity: string): string {
  const labels: Record<string, string> = {
    'very_clear': '매우 명확',
    'clear': '명확',
    'somewhat': '어느 정도',
    'unclear': '불명확',
    'no_idea': '전혀 모르겠음'
  };
  return labels[clarity] || clarity || '미제공';
}

function getInternshipStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'completed': '완료',
    'in_progress': '진행 중',
    'planned': '예정',
    'searching': '찾는 중',
    'none': '없음'
  };
  return labels[status] || status || '미제공';
}

// Career-specific action categories
export interface CareerActions {
  portfolio: string[];   // What to build/create
  networking: string[];  // Who to connect with
  mindset: string[];     // Mindset/attitude shifts
}

// Career recommendation with career-specific insights
export interface CareerRecommendation {
  title: string;
  description: string;
  matchScore: number;
  salary: string;
  jobOutlook: string;
  // Career-specific insights
  competencies: Array<{ subject: string; A: number; fullMark: number }>;
  strengths: string[];
  weaknesses: string[];
  actions: CareerActions;
}

// Career analysis response type
export interface CareerAnalysisResult {
  summary: string;
  stats: { label1: string; val1: string; label2: string; val2: string; label3: string; val3: string };
  careerRecommendations: CareerRecommendation[];
  rawResponse: string;
}

// Get profile-type specific context for the prompt
function getProfileTypeContext(profileType: string): { 
  statsExample: { label1: string; val1: string; label2: string; val2: string; label3: string; val3: string };
  careerExampleTitle: string;
  competencySubjects: string[];
  actionContext: string;
} {
  switch (profileType) {
    case 'elementary':
      return {
        statsExample: { label1: "흥미 발견도", val1: "매우 높음", label2: "추천 분야", val2: "과학탐구", label3: "탐구력", val3: "높음" },
        careerExampleTitle: "꿈 직업 (예: 과학자, 유튜버)",
        competencySubjects: ["호기심", "창의력", "협동심", "표현력", "집중력"],
        actionContext: "초등학생에게 적합한 쉽고 재미있는 언어로 작성. 포트폴리오는 '만들기 프로젝트', 네트워킹은 '친구/선생님과 함께하기', 마인드셋은 '꿈을 키우는 마음가짐'"
      };
    case 'middle':
      return {
        statsExample: { label1: "적성 파악도", val1: "높음", label2: "추천 계열", val2: "자연계", label3: "진로 명확도", val3: "탐색중" },
        careerExampleTitle: "고등학교 유형 + 진로 (예: 과학고 → 연구원)",
        competencySubjects: ["학습능력", "창의력", "사회성", "자기주도성", "탐구력"],
        actionContext: "중학생의 고등학교 선택과 진로 탐색에 초점. 포트폴리오는 '탐구보고서/프로젝트', 네트워킹은 '멘토/동아리', 마인드셋은 '진로 탐색 자세'"
      };
    case 'high':
      return {
        statsExample: { label1: "입시 경쟁력", val1: "상위 20%", label2: "추천 학과", val2: "컴퓨터공학", label3: "합격 가능성", val3: "높음" },
        careerExampleTitle: "대학 학과 (예: 서울대 컴퓨터공학과)",
        competencySubjects: ["학업역량", "진로역량", "공동체역량", "자기관리", "창의융합"],
        actionContext: "대학 입시와 학과 선택에 초점. 포트폴리오는 '생기부 활동/세특', 네트워킹은 '선배/교수 상담', 마인드셋은 '입시 극복 마인드'"
      };
    case 'university':
      return {
        statsExample: { label1: "취업 경쟁력", val1: "상위 25%", label2: "추천 직무", val2: "PM", label3: "취업 가능성", val3: "높음" },
        careerExampleTitle: "인턴십/신입 직무 (예: 삼성전자 마케팅)",
        competencySubjects: ["전공역량", "실무경험", "어학능력", "대외활동", "자격증"],
        actionContext: "취업 준비와 인턴십에 초점. 포트폴리오는 '프로젝트/자격증', 네트워킹은 '현직자 커피챗/링크드인', 마인드셋은 '취준 마인드셋'"
      };
    default: // general
      return {
        statsExample: { label1: "시장 경쟁력", val1: "상위 20%", label2: "추천 직무", val2: "시니어 PM", label3: "이직 성공률", val3: "높음" },
        careerExampleTitle: "커리어/이직 기회",
        competencySubjects: ["전문성", "커뮤니케이션", "리더십", "문제해결", "적응력"],
        actionContext: "경력 개발과 이직에 초점. 포트폴리오는 '성과 정리/사이드프로젝트', 네트워킹은 '업계 인맥/헤드헌터', 마인드셋은 '커리어 성장 마인드'"
      };
  }
}

// Get the universal prompt template with career-specific structure
function getProfileTypePrompt(profileType: string): string {
  const context = getProfileTypeContext(profileType);
  
  return `{
  "summary": "전체 분석 요약 (간결하게 1-2문장, 핵심만)",
  "stats": {
    "label1": "${context.statsExample.label1}",
    "val1": "${context.statsExample.val1}",
    "label2": "${context.statsExample.label2}",
    "val2": "해당 분야명",
    "label3": "${context.statsExample.label3}",
    "val3": "높음/보통/노력필요"
  },
  "careerRecommendations": [
    {
      "title": "${context.careerExampleTitle}",
      "description": "이 진로가 적합한 이유 (2-3문장)",
      "matchScore": 92,
      "salary": "특징/연봉 정보",
      "jobOutlook": "전망 설명",
      "competencies": [
        { "subject": "${context.competencySubjects[0]}", "A": 85, "fullMark": 150 },
        { "subject": "${context.competencySubjects[1]}", "A": 90, "fullMark": 150 },
        { "subject": "${context.competencySubjects[2]}", "A": 75, "fullMark": 150 },
        { "subject": "${context.competencySubjects[3]}", "A": 80, "fullMark": 150 },
        { "subject": "${context.competencySubjects[4]}", "A": 70, "fullMark": 150 }
      ],
      "strengths": [
        "이 진로에 맞는 강점 1 (구체적으로)",
        "이 진로에 맞는 강점 2",
        "이 진로에 맞는 강점 3"
      ],
      "weaknesses": [
        "이 진로를 위해 보완할 점 1",
        "이 진로를 위해 보완할 점 2"
      ],
      "actions": {
        "portfolio": [
          "만들어야 할 것 1 (구체적이고 실행 가능하게)",
          "만들어야 할 것 2"
        ],
        "networking": [
          "만나야 할 사람/커뮤니티 1",
          "참여할 활동/모임 2"
        ],
        "mindset": [
          "갖춰야 할 마음가짐 1 (따뜻하고 격려하는 톤)",
          "갖춰야 할 마음가짐 2"
        ]
      }
    }
  ]
}

중요 지침:
- ${context.actionContext}
- 각 추천 진로마다 해당 진로에 특화된 역량, 강점, 보완점, 액션을 제공하세요.
- actions의 각 카테고리는 실행 가능하고 구체적인 조언을 담아주세요.
- mindset은 사용자의 마음을 움직이는 따뜻하고 격려하는 톤으로 작성하세요.
- 3개의 추천 항목을 반드시 제공하세요.`;
}

// Generate career analysis using Claude
export async function generateCareerAnalysis(
  profile: Profile, 
  userIdentity?: { displayName?: string; gender?: string; birthDate?: string | Date }
): Promise<CareerAnalysisResult> {
  return limit(() =>
    retryWithBackoff(
      async () => {
        const systemPrompt = getAnalysisSystemPrompt(profile.type);
        const contextData = getProfileContextData(profile, userIdentity);
        const profileTypePrompt = getProfileTypePrompt(profile.type);

        const prompt = `${contextData}

---

위 프로필 정보를 철저히 분석하여 맞춤형 분석 결과를 제공해주세요.
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

${profileTypePrompt}

추가 지침:
- matchScore는 프로필과의 적합도를 0-100 사이 숫자로 표시합니다.
- 3개의 추천 항목을 제공하세요.
- 반드시 유효한 JSON만 반환하세요.`;

        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-5", // Using supported model
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
        
        // Transform career recommendations to ensure proper structure
        const careerRecommendations: CareerRecommendation[] = (parsed.careerRecommendations || []).map((rec: any) => ({
          title: rec.title || "추천 진로",
          description: rec.description || "",
          matchScore: rec.matchScore || 0,
          salary: rec.salary || "",
          jobOutlook: rec.jobOutlook || "",
          competencies: rec.competencies || [],
          strengths: rec.strengths || [],
          weaknesses: rec.weaknesses || [],
          actions: {
            portfolio: rec.actions?.portfolio || [],
            networking: rec.actions?.networking || [],
            mindset: rec.actions?.mindset || [],
          },
        }));
        
        return {
          summary: parsed.summary || "분석 중 오류가 발생했습니다.",
          stats: parsed.stats || { label1: "분석중", val1: "-", label2: "분석중", val2: "-", label3: "분석중", val3: "-" },
          careerRecommendations,
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

// Goal level types for AI generation
export type GoalLevel = 'year' | 'half' | 'month' | 'week' | 'day';

interface GoalContext {
  visionTitle: string;
  visionDescription: string;
  targetYear: number;
  ancestorChain: { level: string; title: string; description?: string }[];
  siblings?: { title: string }[];
}

interface GeneratedGoal {
  title: string;
  description: string;
  bullets: string[];
}

// Get output count based on level
function getOutputCountForLevel(level: GoalLevel): number {
  switch (level) {
    case 'year': return 3; // Usually 3 years for a vision
    case 'half': return 2; // H1, H2
    case 'month': return 6; // 6 months per half
    case 'week': return 4; // 4 weeks per month
    case 'day': return 7; // 7 days per week (todos)
    default: return 3;
  }
}

// Get level-specific prompt
function getLevelPrompt(level: GoalLevel, count: number): string {
  const prompts: Record<GoalLevel, string> = {
    year: `${count}개의 연도별 목표를 생성하세요. 각 목표는 해당 연도에 달성해야 할 핵심 마일스톤입니다.`,
    half: `${count}개의 반기별 목표를 생성하세요. 상반기(H1)와 하반기(H2)로 나누어 구체적인 목표를 설정하세요.`,
    month: `${count}개의 월별 목표를 생성하세요. 각 월에 집중해야 할 구체적인 액션을 포함하세요.`,
    week: `${count}개의 주간 목표를 생성하세요. 이번 달 목표 달성을 위한 주별 마일스톤입니다.`,
    day: `${count}개의 일일 할 일(TODO)을 생성하세요. 이번 주 목표 달성을 위한 구체적인 작업입니다.`,
  };
  return prompts[level];
}

// Generate goals at a specific level using AI
export async function generateGoals(
  level: GoalLevel,
  context: GoalContext,
  customCount?: number
): Promise<{
  suggestions: GeneratedGoal[];
  rawResponse: string;
}> {
  return limit(() =>
    retryWithBackoff(
      async () => {
        const count = customCount || getOutputCountForLevel(level);
        
        // Build ancestor context string
        const ancestorContext = context.ancestorChain
          .map(a => `- ${a.level}: ${a.title}${a.description ? ` (${a.description})` : ''}`)
          .join('\n');
        
        const siblingContext = context.siblings?.length 
          ? `\n\n기존 항목 (중복 피하기):\n${context.siblings.map(s => `- ${s.title}`).join('\n')}`
          : '';

        const systemPrompt = `당신은 한국의 목표 설정 전문가입니다. 사용자의 비전과 상위 목표를 바탕으로 구체적이고 실행 가능한 하위 목표를 생성합니다.
        
중요 규칙:
1. 모든 응답은 한국어로 작성
2. 각 목표는 상위 목표 달성에 직접적으로 기여해야 함
3. 구체적이고 측정 가능한 목표 설정
4. 현실적이고 동기부여가 되는 표현 사용
5. 기존 형제 항목과 중복되지 않게 작성`;

        const prompt = `## 비전
제목: ${context.visionTitle}
설명: ${context.visionDescription}
목표 연도: ${context.targetYear}년

## 상위 목표 체인
${ancestorContext || '(최상위 레벨)'}${siblingContext}

## 요청
${getLevelPrompt(level, count)}

다음 JSON 형식으로 반환하세요:
{
  "suggestions": [
    {
      "title": "목표의 핵심 제목 (10자 이내 간결하게)",
      "bullets": [
        "구체적인 실행 항목 1",
        "구체적인 실행 항목 2",
        "구체적인 실행 항목 3"
      ]
    }
  ]
}

중요: 
- title은 핵심 키워드만 간결하게 (예: "역량 강화", "자격증 취득")
- bullets는 3-5개의 구체적인 실행 과제로 작성
- 각 bullet은 측정 가능하고 실행 가능해야 함

**반드시 유효한 JSON만 반환하세요. 추가 설명 없이 JSON만 출력하세요.**`;

        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 2048,
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
        
        const suggestions: GeneratedGoal[] = (parsed.suggestions || []).map((s: any) => ({
          title: s.title || "목표",
          description: s.description || "",
          bullets: s.bullets || [],
        }));
        
        return {
          suggestions,
          rawResponse,
        };
      },
      {
        retries: 5,
        minTimeout: 2000,
        maxTimeout: 64000,
        factor: 2,
      }
    )
  );
}
