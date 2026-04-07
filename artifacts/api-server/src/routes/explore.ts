import { Router, type IRouter } from "express";
import { db, majorsTable, careersTable, universityInfoTable, cachedMajorsTable, cachedJobsTable } from "@workspace/db";
import { ilike, or, eq, desc, sql, and } from "drizzle-orm";
import { invokeLLM, safeJsonParse } from "../lib/llm";

const router: IRouter = Router();

router.get("/explore/majors", async (req, res): Promise<void> => {
  const { category, search } = req.query as Record<string, string>;

  let query = db.select().from(majorsTable).$dynamic();
  const conditions: any[] = [];

  if (category && category !== "all" && category !== "전체") {
    conditions.push(eq(majorsTable.category, category));
  }
  if (search) {
    conditions.push(or(
      ilike(majorsTable.name, `%${search}%`),
      ilike(majorsTable.description, `%${search}%`),
    ));
  }

  if (conditions.length > 0) {
    const { and } = await import("drizzle-orm");
    query = query.where(and(...conditions));
  }

  const [majors, apiSourceCounts] = await Promise.all([
    query,
    db
      .select({
        dataSource: cachedMajorsTable.dataSource,
        count: sql<number>`count(*)::int`,
      })
      .from(cachedMajorsTable)
      .groupBy(cachedMajorsTable.dataSource),
  ]);

  const hasPublicApiData = apiSourceCounts.some(r => r.dataSource === "공공데이터포털");
  const apiSource = hasPublicApiData ? "공공데이터포털" : "키워드매칭";
  res.setHeader("X-Api-Source", encodeURIComponent(apiSource));
  res.setHeader("X-Api-Source-Description", "Cached-majors data source. Full JSON metadata: GET /api/explore/cached-majors/meta");

  res.json(majors);
});

router.get("/explore/careers", async (req, res): Promise<void> => {
  const { search, majorCategory } = req.query as Record<string, string>;

  let query = db.select().from(careersTable).$dynamic();
  const conditions: any[] = [];

  if (search) {
    conditions.push(or(
      ilike(careersTable.name, `%${search}%`),
      ilike(careersTable.description, `%${search}%`),
    ));
  }
  if (majorCategory && majorCategory !== "all") {
    conditions.push(eq(careersTable.category, majorCategory));
  }

  if (conditions.length > 0) {
    const { and } = await import("drizzle-orm");
    query = query.where(and(...conditions));
  }

  const careers = await query;
  res.json(careers);
});

router.get("/explore/universities", async (req, res): Promise<void> => {
  const { search, region, foundationType, sortBy, limit, offset } = req.query as Record<string, string>;

  const conditions: any[] = [];

  if (search) {
    conditions.push(ilike(universityInfoTable.univName, `%${search}%`));
  }
  if (region && region !== "전체") {
    conditions.push(eq(universityInfoTable.region, region));
  }
  if (foundationType && foundationType !== "전체") {
    conditions.push(eq(universityInfoTable.foundationType, foundationType));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const orderMap: Record<string, any> = {
    competition_rate: sql`competition_rate DESC NULLS LAST`,
    employment_rate: sql`employment_rate DESC NULLS LAST`,
    scholarship: sql`scholarship_per_student DESC NULLS LAST`,
    tuition: sql`avg_tuition ASC NULLS LAST`,
    dormitory: sql`dormitory_rate DESC NULLS LAST`,
  };
  const orderBy = orderMap[sortBy ?? ""] ?? sql`competition_rate DESC NULLS LAST`;

  const pageLimit = Math.min(parseInt(limit ?? "30", 10), 100);
  const pageOffset = parseInt(offset ?? "0", 10);

  const [countResult, universities] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(universityInfoTable).where(whereClause),
    db.select().from(universityInfoTable)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageLimit)
      .offset(pageOffset),
  ]);

  res.json({ total: countResult[0]?.count ?? 0, universities });
});

router.get("/explore/categories", async (req, res): Promise<void> => {
  const [majorCats, jobFields] = await Promise.all([
    db
      .select({ category: cachedMajorsTable.category })
      .from(cachedMajorsTable)
      .groupBy(cachedMajorsTable.category)
      .orderBy(sql`CASE category
        WHEN '공학' THEN 1 WHEN '의약' THEN 2 WHEN '사회' THEN 3
        WHEN '인문' THEN 4 WHEN '자연' THEN 5 WHEN '예체능' THEN 6 ELSE 7 END`),
    db
      .select({ field: cachedJobsTable.field })
      .from(cachedJobsTable)
      .groupBy(cachedJobsTable.field)
      .orderBy(cachedJobsTable.field),
  ]);

  res.json({
    majorCategories: ["전체", ...majorCats.map(r => r.category).filter(Boolean)],
    jobFields: ["전체", ...jobFields.map(r => r.field).filter(Boolean)],
    demandOptions: ["전체", "매우 높음", "높음", "보통", "낮음"],
  });
});

router.get("/explore/cached-majors/meta", async (req, res): Promise<void> => {
  const dataSourceCounts = await db
    .select({
      dataSource: cachedMajorsTable.dataSource,
      count: sql<number>`count(*)::int`,
    })
    .from(cachedMajorsTable)
    .groupBy(cachedMajorsTable.dataSource);

  const hasPublicApiData = dataSourceCounts.some(r => r.dataSource === "공공데이터포털");
  const apiSource = hasPublicApiData ? "공공데이터포털" : "키워드매칭";

  const totalResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cachedMajorsTable);
  const withUnivResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cachedMajorsTable)
    .where(sql`universities IS NOT NULL AND json_typeof(universities::json) = 'array' AND json_array_length(universities) > 0`);

  res.json({
    apiSource,
    dataSourceBreakdown: dataSourceCounts,
    total: totalResult[0]?.count ?? 0,
    withUniversities: withUnivResult[0]?.count ?? 0,
  });
});

router.get("/explore/cached-majors", async (req, res): Promise<void> => {
  const { category, search, demand } = req.query as Record<string, string>;

  const conditions: any[] = [];

  if (category && category !== "all" && category !== "전체") {
    conditions.push(eq(cachedMajorsTable.category, category));
  }
  if (demand && demand !== "all" && demand !== "전체") {
    conditions.push(eq(cachedMajorsTable.demand, demand));
  }
  if (search) {
    conditions.push(or(
      ilike(cachedMajorsTable.majorName, `%${search}%`),
      ilike(cachedMajorsTable.description, `%${search}%`),
    ));
  }

  let query = db.select().from(cachedMajorsTable).$dynamic();
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const categoryOrder = sql`CASE category
    WHEN '공학계열' THEN 1
    WHEN '의약계열' THEN 2
    WHEN '사회계열' THEN 3
    WHEN '인문계열' THEN 4
    WHEN '자연계열' THEN 5
    WHEN '예체능계열' THEN 6
    ELSE 7
  END`;
  const [majors, apiSourceCounts] = await Promise.all([
    query.orderBy(categoryOrder, cachedMajorsTable.majorSeq),
    db
      .select({
        dataSource: cachedMajorsTable.dataSource,
        count: sql<number>`count(*)::int`,
      })
      .from(cachedMajorsTable)
      .groupBy(cachedMajorsTable.dataSource),
  ]);

  const hasPublicApiData = apiSourceCounts.some(r => r.dataSource === "공공데이터포털");
  const apiSource = hasPublicApiData ? "공공데이터포털" : "키워드매칭";

  res.setHeader("X-Api-Source", encodeURIComponent(apiSource));
  res.setHeader("X-Data-Source-Breakdown", encodeURIComponent(JSON.stringify(apiSourceCounts)));

  res.json(majors.map(m => ({
    id: m.id,
    majorSeq: m.majorSeq,
    majorName: m.majorName,
    category: m.category,
    description: m.description,
    relatedJobs: m.relatedJobs,
    relatedSubjects: m.relatedSubjects,
    universities: m.universities,
    hollandCode: m.hollandCode,
    demand: m.demand,
    dataSource: m.dataSource,
    syncedAt: m.syncedAt,
    employmentRate: m.employmentRate != null ? parseFloat(String(m.employmentRate)) : null,
    employmentRateMale: m.employmentRateMale != null ? parseFloat(String(m.employmentRateMale)) : null,
    employmentRateFemale: m.employmentRateFemale != null ? parseFloat(String(m.employmentRateFemale)) : null,
    avgSalaryDistribution: m.avgSalaryDistribution,
    jobSatisfaction: m.jobSatisfaction,
  })));
});

router.get("/explore/jobs", async (req, res): Promise<void> => {
  const { search, category, limit, offset } = req.query as Record<string, string>;

  const conditions: any[] = [];
  if (search) {
    conditions.push(or(
      ilike(cachedJobsTable.jobName, `%${search}%`),
      ilike(cachedJobsTable.description, `%${search}%`),
    ));
  }
  if (category && category !== "전체" && category !== "all") {
    conditions.push(eq(cachedJobsTable.field, category));
  }

  const pageLimit = Math.min(parseInt(limit ?? "600", 10), 600);
  const pageOffset = parseInt(offset ?? "0", 10);

  let query = db.select().from(cachedJobsTable).$dynamic();
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  const jobs = await query.orderBy(cachedJobsTable.jobName).limit(pageLimit).offset(pageOffset);

  const allMajors = await db.select({
    majorName: cachedMajorsTable.majorName,
    category: cachedMajorsTable.category,
    demand: cachedMajorsTable.demand,
    universities: cachedMajorsTable.universities,
  }).from(cachedMajorsTable);

  const majorsByName = new Map<string, typeof allMajors[0]>();
  for (const m of allMajors) {
    majorsByName.set(m.majorName, m);
  }

  const enriched = jobs.map(job => {
    const relatedNames: string[] = Array.isArray(job.relatedMajors)
      ? job.relatedMajors as string[]
      : [];

    const majorDetails = relatedNames.flatMap(name => {
      if (majorsByName.has(name)) return [majorsByName.get(name)!];
      const fuzzy = allMajors.filter(m =>
        m.majorName.includes(name) || name.includes(m.majorName)
      );
      return fuzzy.slice(0, 2);
    });

    const unique = [...new Map(majorDetails.map(m => [m.majorName, m])).values()];

    const extractOutlook = (growth: string | null): string | null => {
      if (!growth) return null;
      if (growth.includes("매우 증가") || growth.includes("크게 증가")) return "매우 좋음";
      if (growth.includes("다소 증가") || growth.includes("늘어날") || growth.includes("증가할")) return "좋음";
      if (growth.includes("유지")) return "보통";
      if (growth.includes("다소 감소") || growth.includes("다소감소")) return "보통 이하";
      if (growth.includes("감소할") || growth.includes("줄어들")) return "감소";
      return null;
    };

    return {
      id: job.id,
      name: job.jobName,
      category: job.field,
      description: job.description,
      relatedMajors: job.relatedMajors,
      averageSalary: job.salary ? Math.round(job.salary / 10000) : null,
      employmentOutlook: extractOutlook(job.growth),
      majorDetails: unique.slice(0, 5).map(m => ({
        majorName: m.majorName,
        category: m.category,
        demand: m.demand,
        universities: (m.universities as any[])?.slice(0, 4) ?? [],
      })),
    };
  });

  res.json(enriched);
});

router.post("/explore/recommend", async (req, res): Promise<void> => {
  const { personality, interests, grades, preferredEnvironment, careerGoal } = req.body;

  // --- RAG: 키워드 추출 ---
  const rawKeywords: string[] = [
    ...(Array.isArray(interests) ? interests : []),
    ...(personality ? personality.split(/[\s,]+/) : []),
    ...(careerGoal ? careerGoal.split(/[\s,]+/) : []),
  ].map((k: string) => k.trim()).filter((k: string) => k.length >= 2);

  // 중복 제거
  const keywords = [...new Set(rawKeywords)];

  // --- RAG: DB 검색 ---
  const buildMajorConditions = (kws: string[]) =>
    kws.map(kw =>
      or(
        ilike(cachedMajorsTable.majorName, `%${kw}%`),
        ilike(cachedMajorsTable.description, `%${kw}%`),
        sql`${cachedMajorsTable.relatedJobs}::text ilike ${'%' + kw + '%'}`,
      )
    );

  const buildJobConditions = (kws: string[]) =>
    kws.map(kw =>
      or(
        ilike(cachedJobsTable.jobName, `%${kw}%`),
        ilike(cachedJobsTable.description, `%${kw}%`),
        sql`${cachedJobsTable.relatedMajors}::text ilike ${'%' + kw + '%'}`,
      )
    );

  let [contextMajors, contextJobs] = await Promise.all([
    keywords.length > 0
      ? db.select({
          majorName: cachedMajorsTable.majorName,
          category: cachedMajorsTable.category,
          relatedJobs: cachedMajorsTable.relatedJobs,
          demand: cachedMajorsTable.demand,
        }).from(cachedMajorsTable)
          .where(or(...buildMajorConditions(keywords)))
          .limit(15)
      : [],
    keywords.length > 0
      ? db.select({
          jobName: cachedJobsTable.jobName,
          field: cachedJobsTable.field,
          salary: cachedJobsTable.salary,
          growth: cachedJobsTable.growth,
        }).from(cachedJobsTable)
          .where(or(...buildJobConditions(keywords)))
          .limit(15)
      : [],
  ]);

  // --- RAG: 폴백 처리 (검색 결과 0건) ---
  if (contextMajors.length === 0) {
    contextMajors = await db.select({
      majorName: cachedMajorsTable.majorName,
      category: cachedMajorsTable.category,
      relatedJobs: cachedMajorsTable.relatedJobs,
      demand: cachedMajorsTable.demand,
    }).from(cachedMajorsTable)
      .orderBy(cachedMajorsTable.majorSeq)
      .limit(20);
  }

  if (contextJobs.length === 0) {
    contextJobs = await db.select({
      jobName: cachedJobsTable.jobName,
      field: cachedJobsTable.field,
      salary: cachedJobsTable.salary,
      growth: cachedJobsTable.growth,
    }).from(cachedJobsTable)
      .orderBy(cachedJobsTable.jobName)
      .limit(20);
  }

  // --- RAG: 컨텍스트 텍스트 생성 ---
  const majorsContext = contextMajors.map(m =>
    `- ${m.majorName} (계열: ${m.category ?? "미상"}, 수요: ${m.demand ?? "미상"}, 관련직업: ${(m.relatedJobs as string[] | null)?.slice(0, 3).join("/") ?? "미상"})`
  ).join("\n");

  const extractOutlookText = (growth: string | null): string => {
    if (!growth) return "미상";
    if (growth.includes("매우 증가") || growth.includes("크게 증가")) return "매우 좋음";
    if (growth.includes("다소 증가") || growth.includes("늘어날") || growth.includes("증가할")) return "좋음";
    if (growth.includes("유지")) return "보통";
    if (growth.includes("다소 감소") || growth.includes("다소감소")) return "보통 이하";
    if (growth.includes("감소할") || growth.includes("줄어들")) return "감소";
    return "미상";
  };

  const jobsContext = contextJobs.map(j =>
    `- ${j.jobName} (분야: ${j.field ?? "미상"}, 평균연봉: ${j.salary ? Math.round(j.salary / 10000) + "만원" : "미상"}, 전망: ${extractOutlookText(j.growth)})`
  ).join("\n");

  const majorNamesList = contextMajors.map(m => m.majorName).join(", ");
  const jobNamesList = contextJobs.map(j => j.jobName).join(", ");

  // --- RAG 주입 프롬프트 ---
  const prompt = `당신은 대한민국 입시 전문 상담사입니다. 아래에 제공된 [추천 가능 학과 목록]과 [추천 가능 직업 목록]에 있는 항목만을 사용하여 학생에게 맞는 전공과 직업을 추천해야 합니다. 목록에 없는 학과나 직업은 절대 추천하지 마세요.

[추천 가능 학과 목록]
${majorsContext}

[추천 가능 직업 목록]
${jobsContext}

[학생 정보]
성향: ${personality || "미기재"}
관심 분야: ${interests?.join(", ") || "미기재"}
성적: ${grades ? Object.entries(grades).map(([k, v]) => `${k}: ${v}`).join(", ") : "미기재"}
선호 환경: ${preferredEnvironment || "미기재"}
진로 목표: ${careerGoal || "미기재"}

위 [추천 가능 학과 목록]과 [추천 가능 직업 목록]에 있는 항목만 사용하여 추천하세요. "name" 필드의 값은 목록에 있는 이름과 정확히 일치해야 합니다. 추천 가능 학과 목록: [${majorNamesList}]. 추천 가능 직업 목록: [${jobNamesList}].

다음 JSON 형식으로만 응답하세요:
\`\`\`json
{
  "recommendedMajors": [
    {"name": "전공명", "matchRate": 90, "description": "추천 이유"}
  ],
  "recommendedCareers": [
    {"id": 1, "name": "직업명", "category": "분야", "description": "설명", "averageSalary": 4000, "employmentOutlook": "매우 좋음"}
  ],
  "analysisText": "종합 분석 (3-4문장)",
  "studyPlan": "학습 계획 (2-3문장)"
}
\`\`\``;

  // Build lookup Sets for post-validation
  const allowedMajorNames = new Set(contextMajors.map(m => m.majorName));
  const allowedJobNames = new Set(contextJobs.map(j => j.jobName));

  const defaultResult = {
    recommendedMajors: [{ name: "분석 실패", matchRate: 0, description: "다시 시도해 주세요." }],
    recommendedCareers: [],
    analysisText: "AI 분석에 실패했습니다.",
    studyPlan: null,
  };

  let result = defaultResult;
  try {
    const response = await invokeLLM(prompt);
    const parsed = safeJsonParse<any>(response, null);
    if (parsed?.recommendedMajors) {
      // --- Post-validation: filter to only DB-verified names ---
      const rawMajors: any[] = Array.isArray(parsed.recommendedMajors) ? parsed.recommendedMajors : [];
      const rawCareers: any[] = Array.isArray(parsed.recommendedCareers) ? parsed.recommendedCareers : [];

      const filteredMajors = rawMajors.filter(
        (m: any) => m?.name && allowedMajorNames.has(m.name)
      );
      const filteredCareers = rawCareers.filter(
        (c: any) => c?.name && allowedJobNames.has(c.name)
      );

      // Fallback: if all filtered out, use top items from retrieved context
      const finalMajors = filteredMajors.length > 0
        ? filteredMajors
        : contextMajors.slice(0, 3).map((m, i) => ({
            name: m.majorName,
            matchRate: 80 - i * 5,
            description: `${m.category ?? ""} 계열 학과로 관심 분야와 관련이 있습니다.`,
          }));

      const finalCareers = filteredCareers.length > 0
        ? filteredCareers
        : contextJobs.slice(0, 3).map((j, i) => ({
            id: i + 1,
            name: j.jobName,
            category: j.field ?? "",
            description: `${j.field ?? ""} 분야의 직업으로 진로 목표와 관련이 있습니다.`,
            averageSalary: j.salary ? Math.round(j.salary / 10000) : null,
            employmentOutlook: extractOutlookText(j.growth),
          }));

      result = {
        ...parsed,
        recommendedMajors: finalMajors,
        recommendedCareers: finalCareers,
      };
    }
  } catch (err) {
    req.log.error({ err }, "LLM failed for explore recommend");
  }

  res.json(result);
});

export default router;
