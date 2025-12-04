import Anthropic from "@anthropic-ai/sdk";
import pLimit from "p-limit";
import pRetry from "p-retry";
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

// Rate limiter: max 2 concurrent requests
const limit = pLimit(2);

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
const getProfileContextData = (profile: Profile): string => {
  const profileData = profile.profileData as any || {};
  
  let context = `프로필 유형: ${profile.type}\n제목: ${profile.title}\n\n`;

  switch (profile.type) {
    case 'elementary':
      context += `관심 분야: ${profileData.interests || '미제공'}\n`;
      context += `좋아하는 활동: ${profileData.activities || '미제공'}\n`;
      break;
    case 'middle':
      context += `적성: ${profileData.aptitude || '미제공'}\n`;
      context += `관심 과목: ${profileData.subjects || '미제공'}\n`;
      break;
    case 'high':
      context += `내신 등급: ${profileData.grade || '미제공'}\n`;
      context += `목표 대학: ${profileData.targetUniversity || '미제공'}\n`;
      context += `희망 전공: ${profileData.major || '미제공'}\n`;
      break;
    case 'university':
      context += `전공: ${profileData.major || '미제공'}\n`;
      context += `인턴십 경험: ${profileData.internships || '미제공'}\n`;
      context += `희망 직무: ${profileData.targetJob || '미제공'}\n`;
      break;
    case 'general':
      context += `현재 직무: ${profileData.currentJob || '미제공'}\n`;
      context += `경력: ${profileData.experience || '미제공'}\n`;
      context += `목표: ${profileData.goals || '미제공'}\n`;
      break;
  }

  return context;
};

// Generate career analysis using Claude
export async function generateCareerAnalysis(profile: Profile): Promise<{
  summary: string;
  stats: { label1: string; val1: string; label2: string; val2: string; label3: string; val3: string };
  chartData: {
    radar: Array<{ subject: string; score: number }>;
    bar: Array<{ name: string; value: number }>;
  };
  recommendations: string[];
  rawResponse: string;
}> {
  return limit(() =>
    pRetry(
      async () => {
        try {
          const systemPrompt = getAnalysisSystemPrompt(profile.type);
          const context = getProfileContextData(profile);

          const prompt = `${context}

위 프로필을 분석하여 다음 항목을 JSON 형식으로 제공하세요:

1. summary: 전체 분석 요약 (2-3문장)
2. stats: 3가지 주요 지표
   - label1, val1: 첫 번째 지표 (예: "강점 영역", "논리적 사고")
   - label2, val2: 두 번째 지표 (예: "추천 직업군", "데이터 분석가")
   - label3, val3: 세 번째 지표 (예: "성장 가능성", "높음")
3. chartData:
   - radar: 6개 역량 평가 [{ subject: "역량명", score: 0-100 }] (예: 제품 전략, 사용자 리서치, 데이터 분석, 커뮤니케이션, 리더십, 창의성)
   - bar: 3개 진로 예측 [{ name: "항목명", value: 0-100 }] (고등학생: 합격 가능성, 대학생/구직자: 취업/이직 성공률, 연봉 경쟁력)
4. recommendations: 추천 진로/액션 아이템 3-5개 (문자열 배열)

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
            recommendations: parsed.recommendations || [],
            rawResponse,
          };
        } catch (error: any) {
          if (isRateLimitError(error)) {
            throw error;
          }
          // Don't retry non-rate-limit errors
          const abortError = new Error(error.message) as any;
          abortError.name = 'AbortError';
          throw abortError;
        }
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
  context?: string
): Promise<{
  title: string;
  content: string;
  rawResponse: string;
}> {
  return limit(() =>
    pRetry(
      async () => {
        try {
          const systemPrompt = `당신은 한국의 자기소개서 전문 작가입니다. ${category}를 위한 자기소개서를 작성합니다. 모든 응답은 한국어로 작성하세요.`;

          const prompt = `주제: ${topic}
${context ? `추가 정보: ${context}` : ''}

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
            title: parsed.title || "자기소개서",
            content: parsed.content || "내용을 생성할 수 없습니다.",
            rawResponse,
          };
        } catch (error: any) {
          if (isRateLimitError(error)) {
            throw error;
          }
          // Don't retry non-rate-limit errors
          const abortError = new Error(error.message) as any;
          abortError.name = 'AbortError';
          throw abortError;
        }
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
