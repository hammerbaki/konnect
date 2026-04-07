import { Router, type IRouter } from "express";
import { db, aptitudeAnalysesTable, cachedMajorsTable, cachedJobsTable, jobInterestMappingTable } from "@workspace/db";
import { eq, desc, inArray } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { invokeLLM, safeJsonParse } from "../lib/llm";
import { APTITUDE_TEST_DATA } from "../data/aptitude-test-data";

const router: IRouter = Router();

interface InterestCategory {
  id: string;
  name: string;
  description: string;
  relatedJobCategories: string[];
}
interface AptitudeAbility {
  id: string;
  name: string;
  description: string;
}
interface Question {
  id: number;
  text: string;
  category?: string;
  ability?: string;
  type: "interest" | "aptitude";
}
interface AptitudeTestData {
  interestCategories: InterestCategory[];
  aptitudeAbilities: AptitudeAbility[];
  questions: { interest: Question[]; aptitude: Question[] };
}

const TEST_DATA = APTITUDE_TEST_DATA as unknown as AptitudeTestData;

const INTEREST_CAT_MAP = Object.fromEntries(
  TEST_DATA.interestCategories.map(c => [c.id, c])
);
const ABILITY_MAP = Object.fromEntries(
  TEST_DATA.aptitudeAbilities.map(a => [a.id, a])
);
const ALL_QUESTIONS = [
  ...TEST_DATA.questions.interest,
  ...TEST_DATA.questions.aptitude,
];

const formatAnalysis = (a: { createdAt: Date; [key: string]: unknown }) => ({
  ...a,
  createdAt: a.createdAt.toISOString(),
});

router.get("/aptitude/questions", async (_req, res): Promise<void> => {
  res.json({
    interestCategories: TEST_DATA.interestCategories,
    aptitudeAbilities: TEST_DATA.aptitudeAbilities,
    questions: ALL_QUESTIONS,
  });
});

router.get("/aptitude", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const analyses = await db.select().from(aptitudeAnalysesTable)
    .where(eq(aptitudeAnalysesTable.userId, user.id))
    .orderBy(desc(aptitudeAnalysesTable.createdAt));
  res.json(analyses.map(formatAnalysis));
});

router.get("/aptitude/latest", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const [latest] = await db.select().from(aptitudeAnalysesTable)
    .where(eq(aptitudeAnalysesTable.userId, user.id))
    .orderBy(desc(aptitudeAnalysesTable.createdAt)).limit(1);
  res.json(latest ? formatAnalysis(latest) : null);
});

function calcScore(answers: Record<string, number>, qIds: number[]): number {
  const total = qIds.reduce((s, id) => s + (answers[`q${id}`] ?? 3), 0);
  return Math.round(((total - qIds.length) / (qIds.length * 4)) * 100);
}

type RecommendedMajor = {
  name: string;
  matchRate: number;
  description: string;
  relatedJobs: string[];
  demand: string | null;
};
type LLMRecommendation = { name: unknown; matchRate: unknown; description: unknown };
type LLMAnalysisResult = { recommendedMajors: LLMRecommendation[]; analysisText: string };

function isLLMAnalysisResult(v: unknown): v is LLMAnalysisResult {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return Array.isArray(r.recommendedMajors) && typeof r.analysisText === "string";
}
function isValidRec(item: LLMRecommendation): boolean {
  return typeof item.name === "string" && item.name.length > 0 &&
    typeof item.matchRate === "number" && typeof item.description === "string";
}

router.post("/aptitude/analyze", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const { answers } = req.body as { answers: Record<string, number> };
  if (!answers) { res.status(400).json({ error: "answers가 필요합니다." }); return; }

  const interestQMap: Record<string, number[]> = {};
  for (const q of TEST_DATA.questions.interest) {
    if (!q.category) continue;
    if (!interestQMap[q.category]) interestQMap[q.category] = [];
    interestQMap[q.category].push(q.id);
  }
  const aptitudeQMap: Record<string, number[]> = {};
  for (const q of TEST_DATA.questions.aptitude) {
    if (!q.ability) continue;
    if (!aptitudeQMap[q.ability]) aptitudeQMap[q.ability] = [];
    aptitudeQMap[q.ability].push(q.id);
  }

  const interestScores = Object.entries(interestQMap).map(([cat, qIds]) => ({
    category: cat,
    categoryName: INTEREST_CAT_MAP[cat]?.name ?? cat,
    score: calcScore(answers, qIds),
  })).sort((a, b) => b.score - a.score);

  const aptitudeScores = Object.entries(aptitudeQMap).map(([ab, qIds]) => ({
    ability: ab,
    abilityName: ABILITY_MAP[ab]?.name ?? ab,
    score: calcScore(answers, qIds),
  })).sort((a, b) => b.score - a.score);

  const radarData = aptitudeScores.map(a => ({ category: a.abilityName, score: a.score }));

  const top3Interest = interestScores.slice(0, 3).map(s => s.category);

  req.log.info({ top3Interest, interestScores }, "Interest scores computed");

  const mappingRows = await db.select()
    .from(jobInterestMappingTable)
    .where(
      inArray(jobInterestMappingTable.primaryCategory, top3Interest)
    );
  const secondaryRows = await db.select()
    .from(jobInterestMappingTable)
    .where(
      inArray(jobInterestMappingTable.secondaryCategory as any, top3Interest)
    );

  const allHollandCodes = [
    ...new Set([
      ...mappingRows.map(r => r.hollandCode),
      ...secondaryRows.map(r => r.hollandCode),
    ])
  ];

  req.log.info({ allHollandCodes }, "Holland codes from interest mapping");

  const matchedJobs = allHollandCodes.length > 0
    ? await db.select({
        jobName: cachedJobsTable.jobName,
        field: cachedJobsTable.field,
        salary: cachedJobsTable.salary,
        hollandCode: cachedJobsTable.hollandCode,
        relatedMajors: cachedJobsTable.relatedMajors,
      }).from(cachedJobsTable)
        .where(inArray(cachedJobsTable.hollandCode, allHollandCodes))
        .limit(60)
    : [];

  const hollandToInterest = new Map<string, string>();
  for (const r of mappingRows) hollandToInterest.set(r.hollandCode, r.primaryCategory);
  for (const r of secondaryRows) {
    if (!hollandToInterest.has(r.hollandCode)) hollandToInterest.set(r.hollandCode, r.secondaryCategory!);
  }

  const recommendedJobs = matchedJobs
    .filter(j => j.hollandCode && hollandToInterest.has(j.hollandCode))
    .slice(0, 15)
    .map(j => ({
      name: j.jobName,
      field: j.field ?? "",
      salary: j.salary ?? null,
      interestCategory: hollandToInterest.get(j.hollandCode!) ?? "",
    }));

  const majorNameSet = new Set<string>();
  for (const job of matchedJobs) {
    for (const m of (job.relatedMajors ?? [])) majorNameSet.add(m);
  }
  const majorCandidateNames = [...majorNameSet].slice(0, 40);

  let candidateMajors: { name: string; demand: string | null; relatedJobs: string[] | null }[] = [];
  if (majorCandidateNames.length > 0) {
    const dbMajors = await db.select({
      majorName: cachedMajorsTable.majorName,
      demand: cachedMajorsTable.demand,
      relatedJobs: cachedMajorsTable.relatedJobs,
    }).from(cachedMajorsTable)
      .limit(20);

    candidateMajors = dbMajors
      .filter(m => majorCandidateNames.some(n =>
        m.majorName.includes(n) || n.includes(m.majorName)
      ))
      .map(m => ({ name: m.majorName, demand: m.demand ?? null, relatedJobs: m.relatedJobs ?? null }));
  }

  if (candidateMajors.length < 5) {
    const topAptitude = aptitudeScores[0]?.ability;
    const aptitudeToCachedCategory: Record<string, string[]> = {
      VERBAL: ["인문", "사회"],
      MATH: ["자연", "공학"],
      SPATIAL: ["공학", "예체능"],
      CREATIVE: ["예체능", "인문"],
      SOCIAL: ["사회", "인문"],
      SELF: ["인문", "사회"],
    };
    const fallbackCategories = topAptitude ? (aptitudeToCachedCategory[topAptitude] ?? []) : ["공학", "사회"];
    const fallbackRows = await db.select({
      majorName: cachedMajorsTable.majorName,
      demand: cachedMajorsTable.demand,
      relatedJobs: cachedMajorsTable.relatedJobs,
    }).from(cachedMajorsTable)
      .where(inArray(cachedMajorsTable.category, fallbackCategories))
      .limit(15);
    const usedNames = new Set(candidateMajors.map(m => m.name));
    for (const r of fallbackRows) {
      if (!usedNames.has(r.majorName)) {
        candidateMajors.push({ name: r.majorName, demand: r.demand ?? null, relatedJobs: r.relatedJobs ?? null });
        if (candidateMajors.length >= 20) break;
      }
    }
  }

  req.log.info({ candidateCount: candidateMajors.length }, "Major candidates fetched");

  const interestSummary = interestScores.map(s =>
    `${s.categoryName}(${s.category}): ${s.score}점`
  ).join(", ");
  const aptitudeSummary = aptitudeScores.map(s =>
    `${s.abilityName}(${s.ability}): ${s.score}점`
  ).join(", ");
  const top3Names = interestScores.slice(0, 3).map(s => s.categoryName).join(", ");
  const strong3 = aptitudeScores.slice(0, 3).map(s => s.abilityName).join(", ");
  const weak2 = aptitudeScores.slice(-2).map(s => s.abilityName).join(", ");

  const candidateSection = candidateMajors.length > 0
    ? `\n\n아래는 학생의 흥미·적성에 맞춰 DB에서 추출한 실제 학과 후보입니다. 반드시 이 목록에서만 3개를 선택하세요:\n${
        candidateMajors.map(m => {
          const jobs = m.relatedJobs?.slice(0, 3).join(", ") ?? "";
          const demand = m.demand ? ` (수요: ${m.demand})` : "";
          return `- ${m.name}${demand}${jobs ? ` | 관련직업: ${jobs}` : ""}`;
        }).join("\n")
      }\n`
    : "";

  const prompt = `학생 적성검사 결과입니다.

[흥미 분야 점수] ${interestSummary}
[주요 흥미 분야] ${top3Names}

[적성 능력 점수] ${aptitudeSummary}
[강점 능력] ${strong3}
[보완 능력] ${weak2}
${candidateSection}
이 학생에게 맞는 대학 전공 3가지를 추천하고 분석해주세요.${candidateMajors.length > 0 ? " 추천하는 전공명은 반드시 위 후보 목록에 있는 학과명 그대로 사용하세요." : ""} 다음 JSON 형식으로만 응답하세요:
\`\`\`json
{
  "recommendedMajors": [
    {"name": "전공명", "matchRate": 85, "description": "이 전공이 어울리는 이유 2문장"},
    {"name": "전공명", "matchRate": 78, "description": "이 전공이 어울리는 이유 2문장"},
    {"name": "전공명", "matchRate": 72, "description": "이 전공이 어울리는 이유 2문장"}
  ],
  "analysisText": "학생의 흥미·적성을 종합한 분석 (3-4문장, 주요 흥미 분야와 강점 능력을 연결해서 설명)"
}
\`\`\``;

  const candidateNameSet = new Set(candidateMajors.map(m => m.name));
  const candidateMap = new Map(candidateMajors.map(m => [m.name, m]));

  const defaultResult = {
    radarData,
    interestScores,
    aptitudeScores,
    recommendedJobs,
    recommendedMajors: [
      { name: "분석 실패", matchRate: 0, description: "AI 분석에 실패했습니다. 다시 시도해 주세요.", relatedJobs: [], demand: null },
    ] as RecommendedMajor[],
    analysisText: "AI 분석 결과를 생성하지 못했습니다. 다시 시도해 주세요.",
  };

  let aiResult = defaultResult;

  try {
    const llmResponse = await invokeLLM(prompt);
    const parsed = safeJsonParse<unknown>(llmResponse, null);

    if (isLLMAnalysisResult(parsed)) {
      const enrichedMajors: RecommendedMajor[] = [];
      if (candidateMajors.length > 0) {
        for (const item of parsed.recommendedMajors) {
          if (!isValidRec(item)) continue;
          const name = item.name as string;
          if (!candidateNameSet.has(name)) continue;
          const dbRecord = candidateMap.get(name)!;
          enrichedMajors.push({
            name,
            matchRate: item.matchRate as number,
            description: item.description as string,
            relatedJobs: dbRecord.relatedJobs ?? [],
            demand: dbRecord.demand ?? null,
          });
          if (enrichedMajors.length === 3) break;
        }
        if (enrichedMajors.length < 3) {
          const used = new Set(enrichedMajors.map(m => m.name));
          let fi = 0;
          for (const c of candidateMajors) {
            if (enrichedMajors.length >= 3) break;
            if (used.has(c.name)) continue;
            enrichedMajors.push({ name: c.name, matchRate: 60 - fi * 5, description: "적성 분석 결과를 바탕으로 추천된 학과입니다.", relatedJobs: c.relatedJobs ?? [], demand: c.demand ?? null });
            fi++;
          }
        }
      } else {
        for (const item of parsed.recommendedMajors.slice(0, 3)) {
          if (!isValidRec(item)) continue;
          enrichedMajors.push({ name: item.name as string, matchRate: item.matchRate as number, description: item.description as string, relatedJobs: [], demand: null });
        }
      }
      if (enrichedMajors.length > 0) {
        aiResult = { radarData, interestScores, aptitudeScores, recommendedJobs, analysisText: parsed.analysisText, recommendedMajors: enrichedMajors };
      }
    }
  } catch (err) {
    req.log.error({ err }, "LLM call failed for aptitude analysis");
  }

  const [analysis] = await db.insert(aptitudeAnalysesTable).values({
    userId: user.id,
    surveyAnswers: answers,
    radarData: aiResult.radarData,
    recommendedMajors: aiResult.recommendedMajors,
    analysisText: aiResult.analysisText,
    interestScores: aiResult.interestScores,
    aptitudeScores: aiResult.aptitudeScores,
    recommendedJobs: aiResult.recommendedJobs,
  }).returning();

  res.json(formatAnalysis(analysis));
});

export default router;
