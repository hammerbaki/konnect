import Anthropic from "@anthropic-ai/sdk";
import { InterviewQuestion, InterviewSession } from "@shared/schema";

// Using Replit AI Integrations for Anthropic - no API key needed, charges to credits
const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

export interface InterviewGenerationInput {
  desiredJob: string;
  profileType: string;
  profileData: {
    strengths?: string[];
    weaknesses?: string[];
    experiences?: string[];
    skills?: string[];
    education?: string;
    certifications?: string[];
  };
  kjobsResult?: {
    topStrengths?: string[];
    topWeaknesses?: string[];
    recommendedJobs?: any[];
  };
  analysisResult?: {
    recommendations?: any;
    competencies?: any;
  };
}

export interface GeneratedQuestion {
  category: 'basic' | 'job_specific' | 'self_intro' | 'star';
  question: string;
  questionReason: string;
  guideText?: string;
  relatedStrength?: string;
  relatedWeakness?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AnswerFeedback {
  understandingScore: number;
  fitScore: number;
  logicScore: number;
  specificityScore: number;
  overallScore: number;
  improvementSuggestion: string;
  improvedAnswer: string;
  detailedFeedback: {
    understanding: string;
    fit: string;
    logic: string;
    specificity: string;
  };
}

export async function generateInterviewQuestions(
  input: InterviewGenerationInput
): Promise<GeneratedQuestion[]> {
  const { desiredJob, profileType, profileData, kjobsResult, analysisResult } = input;

  const systemPrompt = `당신은 한국의 면접 전문가입니다. 지원자의 희망직무와 프로필을 기반으로 실제 면접에서 나올 수 있는 질문을 생성합니다.

질문은 4개 카테고리로 구분됩니다:
1. basic (기본 면접 질문): 지원동기, 강점/약점, 협업 경험, 갈등 해결, 실패 경험, 스트레스 대응, 직무 선택 이유
2. job_specific (희망직무 기반 직무 질문): 해당 직무의 핵심 역할과 직접 연결된 실무 질문
3. self_intro (1분 자기소개): 자기소개 질문과 답변 가이드
4. star (상황·행동 질문 STAR 기반): 실제 업무 상황을 가정한 행동 기반 질문

각 질문에는:
- question: 면접 질문
- questionReason: 왜 이 질문이 나왔는지 간단한 설명 (지원자에게 보여줄 내용)
- guideText: 답변 가이드 (self_intro 카테고리에서 중요)
- relatedStrength: 이 질문이 어떤 강점을 어필할 수 있는지
- relatedWeakness: 이 질문이 어떤 약점을 보완할 수 있는지
- difficulty: easy/medium/hard

응답은 반드시 JSON 형식으로, questions 배열을 포함해야 합니다.`;

  const userPrompt = `다음 지원자 정보를 바탕으로 면접 질문을 생성해주세요.

희망직무: ${desiredJob}
지원자 유형: ${profileType}

지원자 정보:
${profileData.strengths?.length ? `- 강점: ${profileData.strengths.join(', ')}` : ''}
${profileData.weaknesses?.length ? `- 약점/개선점: ${profileData.weaknesses.join(', ')}` : ''}
${profileData.experiences?.length ? `- 경험: ${profileData.experiences.join(', ')}` : ''}
${profileData.skills?.length ? `- 보유 스킬: ${profileData.skills.join(', ')}` : ''}
${profileData.education ? `- 학력: ${profileData.education}` : ''}
${profileData.certifications?.length ? `- 자격증: ${profileData.certifications.join(', ')}` : ''}

${kjobsResult?.topStrengths?.length ? `진로진단 상위 역량: ${kjobsResult.topStrengths.join(', ')}` : ''}
${kjobsResult?.topWeaknesses?.length ? `진로진단 취약 역량: ${kjobsResult.topWeaknesses.join(', ')}` : ''}

생성 규칙:
1. basic 카테고리: 5개 질문 (지원동기 1개, 강점/약점 관련 2개, 경험 관련 2개)
2. job_specific 카테고리: 5개 질문 (${desiredJob} 직무에 특화된 실무 질문)
3. self_intro 카테고리: 2개 질문 (1분 자기소개, 직무 연결 자기소개)
4. star 카테고리: 3개 질문 (상황-행동-결과 구조 질문)

총 15개 질문을 생성해주세요.

JSON 형식으로 응답:
{
  "questions": [
    {
      "category": "basic",
      "question": "질문 내용",
      "questionReason": "이 질문이 나온 이유",
      "guideText": "답변 가이드 (선택)",
      "relatedStrength": "관련 강점",
      "relatedWeakness": "관련 약점",
      "difficulty": "medium"
    }
  ]
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      messages: [
        { role: "user", content: userPrompt }
      ],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON response");
    }

    // Sanitize JSON - remove trailing commas before ] or }
    let jsonStr = jsonMatch[0];
    jsonStr = jsonStr.replace(/,\s*([\]\}])/g, '$1');
    
    try {
      const parsed = JSON.parse(jsonStr);
      return parsed.questions || [];
    } catch (parseError) {
      console.error("[Interview AI] JSON parse error, attempting cleanup:", parseError);
      // More aggressive cleanup
      jsonStr = jsonStr.replace(/,(\s*[\]\}])/g, '$1');
      jsonStr = jsonStr.replace(/[\x00-\x1F\x7F]/g, ' ');
      const parsed = JSON.parse(jsonStr);
      return parsed.questions || [];
    }
  } catch (error) {
    console.error("[Interview AI] Question generation error:", error);
    throw error;
  }
}

export async function generateAnswerFeedback(
  question: string,
  questionCategory: string,
  answer: string,
  desiredJob: string,
  context?: {
    strengths?: string[];
    weaknesses?: string[];
  }
): Promise<AnswerFeedback> {
  const systemPrompt = `당신은 한국의 면접 코치입니다. 지원자의 면접 답변을 분석하고 건설적인 피드백을 제공합니다.

피드백은 '평가'가 아닌 '준비·연습' 중심의 톤을 유지합니다.
격려하면서도 구체적인 개선점을 제시합니다.

각 항목을 1-5점으로 평가하고 상세 피드백을 제공합니다:
1. 질문 이해도 (understanding): 질문의 의도를 정확히 파악했는지
2. 직무 적합도 (fit): 희망직무와 연결되는 답변인지
3. 논리 구조 (logic): 답변의 논리적 흐름이 좋은지
4. 구체성 (specificity): 구체적인 예시나 수치가 포함되었는지
5. 종합 점수 (overall): 전체적인 답변 품질

또한 개선된 답변 예시를 제공합니다.`;

  const userPrompt = `희망직무: ${desiredJob}
질문 카테고리: ${questionCategory}
질문: ${question}
${context?.strengths?.length ? `지원자 강점: ${context.strengths.join(', ')}` : ''}
${context?.weaknesses?.length ? `지원자 약점: ${context.weaknesses.join(', ')}` : ''}

지원자 답변:
${answer}

다음 JSON 형식으로 피드백을 제공해주세요:
{
  "understandingScore": 1-5,
  "fitScore": 1-5,
  "logicScore": 1-5,
  "specificityScore": 1-5,
  "overallScore": 1-5,
  "improvementSuggestion": "개선 제안 (2-3문장)",
  "improvedAnswer": "개선된 답변 예시 (지원자의 답변을 기반으로 더 나은 버전)",
  "detailedFeedback": {
    "understanding": "질문 이해도에 대한 구체적 피드백",
    "fit": "직무 적합도에 대한 구체적 피드백",
    "logic": "논리 구조에 대한 구체적 피드백",
    "specificity": "구체성에 대한 구체적 피드백"
  }
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      messages: [
        { role: "user", content: userPrompt }
      ],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("[Interview AI] Feedback generation error:", error);
    throw error;
  }
}

export async function improveAnswer(
  question: string,
  originalAnswer: string,
  desiredJob: string
): Promise<string> {
  const systemPrompt = `당신은 면접 답변 첨삭 전문가입니다. 지원자의 답변을 더 효과적으로 개선해주세요.

원래 답변의 핵심 내용과 스타일을 유지하면서:
1. STAR 기법 적용 (상황-행동-결과)
2. 구체적인 수치나 예시 추가
3. 직무와의 연결성 강화
4. 간결하면서도 임팩트 있는 표현

개선된 답변만 출력합니다. 설명이나 부연은 제외합니다.`;

  const userPrompt = `희망직무: ${desiredJob}
질문: ${question}
원래 답변: ${originalAnswer}

개선된 답변:`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      messages: [
        { role: "user", content: userPrompt }
      ],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    return content.text.trim();
  } catch (error) {
    console.error("[Interview AI] Answer improvement error:", error);
    throw error;
  }
}
