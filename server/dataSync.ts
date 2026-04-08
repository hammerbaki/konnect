/**
 * Data Sync Service
 * - CareerNet API: 학과 설명(description), 관련 과목, 수요 전망 업데이트
 * - GPT-4o-mini: 누락된 학과·직업 설명 배치 생성
 * - 직업 중복 제거 (cached_jobs)
 * - 대학 데이터 품질 리포트
 */
import { db } from "./db";
import { cachedMajors, cachedJobs } from "@shared/schema";
import { eq, isNull, or, sql } from "drizzle-orm";

const CAREERNET_KEY = process.env.CAREERNET_API_KEY || "";
const CAREERNET_BASE = "https://www.career.go.kr/cnet/openapi/getOpenApi.json";
const CAREERNET_NEW_BASE = "https://www.career.go.kr/cnet/front/openapi";

// ---- CareerNet: fetch job list (gubun=job) ----
export async function fetchCareerNetJobs(): Promise<CareerNetJob[]> {
  if (!CAREERNET_KEY) throw new Error("CAREERNET_API_KEY not set");
  const allJobs: CareerNetJob[] = [];
  const seenSeqs = new Set<string>();
  let page = 1;
  while (true) {
    const url = `${CAREERNET_BASE}?apiKey=${CAREERNET_KEY}&svcType=api&svcCode=JOB&contentType=json&gubun=job&pageIndex=${page}&pageCount=100`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    const items: CareerNetJob[] = data?.dataSearch?.content ?? [];
    if (items.length === 0) break;
    for (const j of items) {
      if (!seenSeqs.has(j.jobdicSeq)) {
        seenSeqs.add(j.jobdicSeq);
        allJobs.push(j);
      }
    }
    const total = parseInt(items[0]?.totalCount || '0');
    if (allJobs.length >= total) break;
    page++;
  }
  return allJobs;
}

// ---- CareerNet: fetch major list (gubun=univ_list) ----
export async function fetchCareerNetMajors(): Promise<CareerNetMajor[]> {
  if (!CAREERNET_KEY) throw new Error("CAREERNET_API_KEY not set");
  const url = `${CAREERNET_BASE}?apiKey=${CAREERNET_KEY}&svcType=api&svcCode=MAJOR&contentType=json&gubun=univ_list&pageIndex=1&pageCount=500`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CareerNet major list HTTP ${res.status}`);
  const data = await res.json();
  return data?.dataSearch?.content ?? [];
}

interface CareerNetMajor {
  lClass: string;
  facilName: string;
  majorSeq: string;
  mClass: string;
  totalCount: string;
}

interface CareerNetJob {
  job: string;
  profession: string;
  summary: string;
  salery?: string;
  jobdicSeq: string;
  prospect?: string;
  totalCount?: string;
}

// ---- GPT-4o-mini: generate descriptions for missing majors ----
export async function generateMajorDescriptions(
  onProgress?: (msg: string) => void
): Promise<{ updated: number; errors: number }> {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });

  // Get all majors missing descriptions
  const rows = await db.execute(sql`
    SELECT id, major_name, category, related_jobs
    FROM cached_majors
    WHERE description IS NULL OR description = ''
    ORDER BY id
  `);
  const items = (rows as any).rows ?? [];
  onProgress?.(`설명 없는 학과: ${items.length}개`);

  let updated = 0;
  let errors = 0;
  const BATCH = 15;

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const prompt = batch.map((m: any, idx: number) => {
      const jobs = Array.isArray(m.related_jobs) ? m.related_jobs.join(', ') : (m.related_jobs || '');
      return `${idx + 1}. 학과명: ${m.major_name}, 계열: ${m.category || '미분류'}, 관련직업: ${jobs || '없음'}`;
    }).join('\n');

    try {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `다음 대학 학과들에 대해 각각 2~3문장의 간결한 학과 소개를 작성하세요. 
번호 순서대로, JSON 배열로만 응답하세요: [{"id": 번호, "desc": "소개문"}]

${prompt}`,
        }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = res.choices[0]?.message?.content || '{}';
      let parsed: any;
      try {
        const raw = JSON.parse(content);
        parsed = raw.descriptions || raw.items || raw.result || (Array.isArray(raw) ? raw : null);
        if (!parsed) {
          // Try to find array in object
          const arrKey = Object.keys(raw).find(k => Array.isArray(raw[k]));
          if (arrKey) parsed = raw[arrKey];
        }
      } catch { errors += batch.length; continue; }

      if (!Array.isArray(parsed)) { errors += batch.length; continue; }

      for (let j = 0; j < Math.min(parsed.length, batch.length); j++) {
        const desc = parsed[j]?.desc || parsed[j]?.description || parsed[j]?.text;
        if (desc && desc.trim().length > 10) {
          await db.execute(sql`
            UPDATE cached_majors SET description = ${desc.trim()}, synced_at = NOW()
            WHERE id = ${batch[j].id}
          `);
          updated++;
        } else {
          errors++;
        }
      }
      onProgress?.(`학과 설명 생성 진행: ${i + batch.length}/${items.length}`);
    } catch (err: any) {
      errors += batch.length;
      onProgress?.(`배치 오류: ${err.message}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 300));
  }

  onProgress?.(`학과 설명 생성 완료: 업데이트 ${updated}개, 오류 ${errors}개`);
  return { updated, errors };
}

// ---- GPT-4o-mini: generate descriptions for missing jobs ----
export async function generateJobDescriptions(
  onProgress?: (msg: string) => void
): Promise<{ updated: number; errors: number }> {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });

  const rows = await db.execute(sql`
    SELECT id, job_name, field, salary, growth
    FROM cached_jobs
    WHERE description IS NULL OR description = ''
    ORDER BY id
  `);
  const items = (rows as any).rows ?? [];
  onProgress?.(`설명 없는 직업: ${items.length}개`);

  let updated = 0;
  let errors = 0;
  const BATCH = 20;

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const prompt = batch.map((j: any, idx: number) =>
      `${idx + 1}. 직업명: ${j.job_name}, 분야: ${j.field || '기타'}`
    ).join('\n');

    try {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `다음 직업들에 대해 각각 2~3문장의 간결한 직업 소개를 작성하세요. 주요 업무와 필요 역량을 포함하세요.
번호 순서대로, JSON 배열로만 응답하세요: [{"id": 번호, "desc": "소개문"}]

${prompt}`,
        }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 2500,
      });

      const content = res.choices[0]?.message?.content || '{}';
      let parsed: any;
      try {
        const raw = JSON.parse(content);
        parsed = raw.descriptions || raw.items || raw.result || (Array.isArray(raw) ? raw : null);
        if (!parsed) {
          const arrKey = Object.keys(raw).find(k => Array.isArray(raw[k]));
          if (arrKey) parsed = raw[arrKey];
        }
      } catch { errors += batch.length; continue; }

      if (!Array.isArray(parsed)) { errors += batch.length; continue; }

      for (let j = 0; j < Math.min(parsed.length, batch.length); j++) {
        const desc = parsed[j]?.desc || parsed[j]?.description || parsed[j]?.text;
        if (desc && desc.trim().length > 10) {
          await db.execute(sql`
            UPDATE cached_jobs SET description = ${desc.trim()}, synced_at = NOW()
            WHERE id = ${batch[j].id}
          `);
          updated++;
        } else {
          errors++;
        }
      }
      onProgress?.(`직업 설명 생성 진행: ${i + batch.length}/${items.length}`);
    } catch (err: any) {
      errors += batch.length;
      onProgress?.(`배치 오류: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 300));
  }

  onProgress?.(`직업 설명 생성 완료: 업데이트 ${updated}개, 오류 ${errors}개`);
  return { updated, errors };
}

// ---- Sync: fill job descriptions from CareerNet (where possible) ----
export async function syncJobDescriptionsFromCareerNet(
  onProgress?: (msg: string) => void
): Promise<{ updated: number; failed: number; skipped: number }> {
  if (!CAREERNET_KEY) throw new Error("CAREERNET_API_KEY not set");

  onProgress?.("CareerNet 직업 데이터 조회 중...");
  const cnJobs = await fetchCareerNetJobs();
  onProgress?.(`CareerNet 직업 ${cnJobs.length}개 수신`);

  function stripped(s: string) {
    return s.replace(/[^가-힣a-zA-Z0-9]/g, '').toLowerCase();
  }

  const cnMap = new Map<string, CareerNetJob>();
  for (const j of cnJobs) {
    cnMap.set(stripped(j.job), j);
  }

  const rows = await db.execute(sql`
    SELECT id, job_name FROM cached_jobs WHERE description IS NULL OR description = ''
  `);
  const items = (rows as any).rows ?? [];

  let updated = 0, failed = 0, skipped = 0;
  for (const item of items) {
    const cn = cnMap.get(stripped(item.job_name));
    if (cn && cn.summary && cn.summary.trim().length > 5) {
      await db.execute(sql`
        UPDATE cached_jobs SET description = ${cn.summary.trim().slice(0, 1000)}, synced_at = NOW()
        WHERE id = ${item.id}
      `);
      updated++;
    } else {
      failed++;
    }
  }

  onProgress?.(`CareerNet 직업 동기화 완료: 업데이트 ${updated}개`);
  return { updated, failed, skipped };
}

// ---- Remove duplicate jobs ----
export async function removeDuplicateJobs(): Promise<{ removed: number }> {
  const result = await db.execute(sql`
    DELETE FROM cached_jobs
    WHERE id IN (
      SELECT id FROM (
        SELECT id,
          ROW_NUMBER() OVER (
            PARTITION BY job_name
            ORDER BY
              CASE WHEN description IS NOT NULL AND description != '' THEN 0 ELSE 1 END,
              CASE WHEN salary IS NOT NULL AND salary > 0 THEN 0 ELSE 1 END,
              id ASC
          ) AS rn
        FROM cached_jobs
      ) ranked
      WHERE rn > 1
    )
  `);
  const removed = (result as any).rowCount ?? 0;
  return { removed };
}

// ---- GPT-4o-mini: enrich demand + related jobs for all majors ----
export async function enrichMajorRelatedData(
  onProgress?: (msg: string) => void
): Promise<{ demandUpdated: number; jobsUpdated: number; errors: number }> {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });

  // 1. Fetch all job names from cached_jobs as reference
  const allJobsResult = await db.execute(sql`SELECT job_name FROM cached_jobs ORDER BY job_name`);
  const allJobNames: string[] = ((allJobsResult as any).rows ?? []).map((r: any) => r.job_name);
  const jobListStr = allJobNames.join(', ');
  onProgress?.(`직업 참조 목록: ${allJobNames.length}개 로드됨`);

  // 2. Find majors needing enrichment: missing demand OR ≤3 related jobs
  const rows = await db.execute(sql`
    SELECT id, major_name, category, related_jobs,
      CASE WHEN demand IS NULL OR demand = '' THEN true ELSE false END as needs_demand,
      CASE WHEN related_jobs IS NULL OR jsonb_array_length(related_jobs) <= 3 THEN true ELSE false END as needs_jobs
    FROM cached_majors
    WHERE (demand IS NULL OR demand = '')
       OR (related_jobs IS NULL OR jsonb_array_length(related_jobs) <= 3)
    ORDER BY major_name
  `);
  const items = (rows as any).rows ?? [];
  onProgress?.(`보강이 필요한 학과: ${items.length}개 (수요 없음 또는 직업 ≤3개)`);

  let demandUpdated = 0;
  let jobsUpdated = 0;
  let errors = 0;
  const BATCH = 10;

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);

    const batchDesc = batch.map((m: any, idx: number) => {
      const currentJobs = Array.isArray(m.related_jobs) ? m.related_jobs.join(', ') : '';
      return `${idx + 1}. 학과명: ${m.major_name}, 계열: ${m.category || '미분류'}, 현재 직업: ${currentJobs || '없음'}`;
    }).join('\n');

    try {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `당신은 한국 대학 전공 데이터 전문가입니다.
다음 학과들의 취업 수요 전망과 관련 직업을 분석해 주세요.

[참고 직업 목록 - 반드시 이 목록에서만 선택]
${jobListStr}

[학과 목록]
${batchDesc}

각 학과에 대해:
1. 취업 수요 전망 (demand): "매우 높음", "높음", "보통", "낮음", "매우 낮음" 중 하나
2. 관련 직업 (jobs): 위 참고 목록에서 해당 학과와 가장 관련있는 직업 5~8개를 정확한 이름으로 선택

반드시 아래 JSON 형식으로만 응답하세요:
{"items": [{"idx": 1, "demand": "높음", "jobs": ["직업1", "직업2", ...]}, ...]}`,
        }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 3000,
      });

      const content = res.choices[0]?.message?.content || '{}';
      let parsed: any;
      try {
        const raw = JSON.parse(content);
        parsed = raw.items || raw.result || (Array.isArray(raw) ? raw : null);
        if (!parsed) {
          const arrKey = Object.keys(raw).find(k => Array.isArray(raw[k]));
          if (arrKey) parsed = raw[arrKey];
        }
      } catch { errors += batch.length; continue; }

      if (!Array.isArray(parsed)) { errors += batch.length; continue; }

      for (let j = 0; j < Math.min(parsed.length, batch.length); j++) {
        const item = batch[j];
        const result = parsed[j];
        if (!result) { errors++; continue; }

        const needsDemand = !item.demand || item.demand === '';
        const needsJobs = !item.related_jobs || (Array.isArray(item.related_jobs) && item.related_jobs.length <= 3);

        // Validate demand value
        const validDemand = ['매우 높음', '높음', '보통', '낮음', '매우 낮음'];
        const demand = validDemand.includes(result.demand) ? result.demand : null;

        // Validate jobs — only keep those that exist in the reference list
        const rawJobs: string[] = Array.isArray(result.jobs) ? result.jobs : [];
        const validJobs = rawJobs.filter(j => allJobNames.includes(j)).slice(0, 8);

        if (needsDemand && demand) {
          await db.execute(sql`
            UPDATE cached_majors SET demand = ${demand}, synced_at = NOW()
            WHERE id = ${item.id}
          `);
          demandUpdated++;
        }

        if (needsJobs && validJobs.length >= 3) {
          await db.execute(sql`
            UPDATE cached_majors SET related_jobs = ${JSON.stringify(validJobs)}::jsonb, synced_at = NOW()
            WHERE id = ${item.id}
          `);
          jobsUpdated++;
        } else if (needsJobs && validJobs.length < 3) {
          errors++;
        }
      }

      onProgress?.(`보강 진행: ${Math.min(i + BATCH, items.length)}/${items.length} (수요 ${demandUpdated}개, 직업 ${jobsUpdated}개 업데이트)`);
    } catch (err: any) {
      errors += batch.length;
      onProgress?.(`배치 오류: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 400));
  }

  onProgress?.(`보강 완료: 수요 ${demandUpdated}개, 직업 ${jobsUpdated}개 업데이트, 오류 ${errors}개`);
  return { demandUpdated, jobsUpdated, errors };
}

// ---- CareerNet: enrich per-major employment rate and salary ----
export async function enrichMajorCareerNetData(
  onProgress?: (msg: string) => void
): Promise<{ updated: number; matched: number; errors: number }> {
  if (!CAREERNET_KEY) {
    onProgress?.('CAREERNET_API_KEY 미설정 — 학과별 취업률 동기화 건너뜀');
    return { updated: 0, matched: 0, errors: 0 };
  }

  // Check if already done
  const needCheck = await db.execute(sql`
    SELECT COUNT(*) as cnt FROM cached_majors WHERE employment_rate IS NULL
  `);
  const needCount = parseInt(String((needCheck as any).rows?.[0]?.cnt ?? '0'));
  if (needCount === 0) {
    onProgress?.('학과별 취업률 데이터 이미 완료됨 — 건너뜀');
    return { updated: 0, matched: 0, errors: 0 };
  }
  onProgress?.(`${needCount}개 학과에 CareerNet 학과별 취업률 데이터 보강 시작`);

  // Fetch all CareerNet major list (20 per page)
  const CAREERNET_URL = 'https://www.career.go.kr/cnet/openapi/getOpenApi';
  const careerNetList: Array<{ mClass: string; majorSeq: string }> = [];
  let page = 1;
  while (true) {
    const url = `${CAREERNET_URL}?apiKey=${CAREERNET_KEY}&svcType=api&svcCode=MAJOR&contentType=json&gubun=univ_list&pageIndex=${page}&pageCount=20`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    const items: Array<{ mClass: string; majorSeq: string; totalCount?: string }> =
      data?.dataSearch?.content ?? [];
    if (items.length === 0) break;
    careerNetList.push(...items);
    const total = parseInt(items[0]?.totalCount ?? '0');
    if (careerNetList.length >= total) break;
    page++;
    if (page > 60) break; // safety cap
    await new Promise(r => setTimeout(r, 100)); // polite delay
  }
  onProgress?.(`CareerNet 학과 목록: ${careerNetList.length}개 로드됨`);

  // Build multi-key lookup: original name, name+과, name stripped of 과
  const nameToSeq = new Map<string, string>();
  for (const m of careerNetList) {
    const key = m.mClass?.trim();
    if (!key || !m.majorSeq) continue;
    // exact name
    if (!nameToSeq.has(key)) nameToSeq.set(key, m.majorSeq);
    // stripped key (remove trailing 과 → allows DB "간호학" to match CareerNet "간호학과")
    const stripped = key.endsWith('과') ? key.slice(0, -1) : key;
    if (!nameToSeq.has(stripped)) nameToSeq.set(stripped, m.majorSeq);
  }

  // Get all cached_majors needing update
  const allMajors = await db.select({ id: cachedMajors.id, majorName: cachedMajors.majorName })
    .from(cachedMajors);

  // CareerNet mClass 샘플 로그 (첫 10개)
  const cnSample = careerNetList.slice(0, 10).map(m => m.mClass);
  onProgress?.(`CareerNet mClass 샘플 10개: ${JSON.stringify(cnSample)}`);

  let updated = 0;
  let matched = 0;
  let errors = 0;

  for (const major of allMajors) {
    const dbName = major.majorName ?? '';
    // 양방향 매칭: exact → normalized(과/부/전공 제거) → +과
    const norm = normalizeMajorName(dbName);
    const majorSeq = nameToSeq.get(dbName) || nameToSeq.get(norm) || nameToSeq.get(dbName + '과');

    if (!majorSeq) continue; // no match — skip
    matched++;

    try {
      const url = `${CAREERNET_URL}?apiKey=${CAREERNET_KEY}&svcType=api&svcCode=MAJOR_VIEW&contentType=json&gubun=univ_list&majorSeq=${majorSeq}`;
      const res = await fetch(url);
      if (!res.ok) { errors++; continue; }
      const data = await res.json();
      const content = data?.dataSearch?.content?.[0];
      if (!content) { errors++; continue; }

      // Parse employment: e.g. "<strong>80</strong> % 이상" or "70 ~ 80 %"
      const empRaw: string = content.employment ?? '';
      const empStripped = empRaw.replace(/<[^>]*>/g, '').trim();
      let empRate: number | null = null;
      const rangeMatch = empStripped.match(/(\d+(?:\.\d+)?)\s*[~～]\s*(\d+(?:\.\d+)?)/);
      if (rangeMatch) {
        empRate = (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;
      } else {
        const singleMatch = empStripped.match(/(\d+(?:\.\d+)?)/);
        if (singleMatch) empRate = parseFloat(singleMatch[1]);
      }

      // Parse salary (만원): e.g. "284.1"
      const salaryWan = parseFloat(content.salary ?? '0') || null;

      await db.update(cachedMajors)
        .set({
          employmentRate: empRate,
          avgSalaryDistribution: {
            avg_monthly_wan: salaryWan,
            raw_employment: empRaw,
            raw_salary: content.salary ?? null,
            source: 'careernet',
          } as any,
        })
        .where(eq(cachedMajors.id, major.id));

      updated++;
      if (updated % 20 === 0) onProgress?.(`  진행중: ${updated}개 완료 (${allMajors.length}개 중)`);
      await new Promise(r => setTimeout(r, 120)); // polite delay
    } catch (e: any) {
      onProgress?.(`  오류 [${major.majorName}]: ${e.message}`);
      errors++;
    }
  }

  onProgress?.(
    `CareerNet 학과별 데이터 완료 — 업데이트: ${updated}개, 매칭: ${matched}개, 오류: ${errors}개`
  );
  return { updated, matched, errors };
}

// ---- CareerNet: enrich per-major aptitude data (lstMiddleAptd, lstHighAptd) ----
export async function enrichMajorAptitudeData(
  onProgress?: (msg: string) => void
): Promise<{ matched: number; updated: number; skipped: number; errors: number }> {
  if (!CAREERNET_KEY) {
    onProgress?.('CAREERNET_API_KEY 미설정 — 적성 데이터 동기화 건너뜀');
    return { matched: 0, updated: 0, skipped: 0, errors: 0 };
  }

  onProgress?.('CareerNet 학과 목록 로드 중...');

  // Fetch all CareerNet major list
  const CAREERNET_URL = 'https://www.career.go.kr/cnet/openapi/getOpenApi';
  const careerNetList: Array<{ mClass: string; majorSeq: string }> = [];
  let page = 1;
  while (true) {
    const url = `${CAREERNET_URL}?apiKey=${CAREERNET_KEY}&svcType=api&svcCode=MAJOR&contentType=json&gubun=univ_list&pageIndex=${page}&pageCount=20`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    const items: Array<{ mClass: string; majorSeq: string; totalCount?: string }> =
      data?.dataSearch?.content ?? [];
    if (items.length === 0) break;
    careerNetList.push(...items);
    const total = parseInt(items[0]?.totalCount ?? '0');
    if (careerNetList.length >= total) break;
    page++;
    if (page > 60) break;
    await new Promise(r => setTimeout(r, 100));
  }
  onProgress?.(`CareerNet 학과 목록: ${careerNetList.length}개 로드됨`);

  // Build name → majorSeq lookup
  const nameToSeq = new Map<string, string>();
  for (const m of careerNetList) {
    const key = m.mClass?.trim();
    if (!key || !m.majorSeq) continue;
    if (!nameToSeq.has(key)) nameToSeq.set(key, m.majorSeq);
    const stripped = key.endsWith('과') ? key.slice(0, -1) : key;
    if (!nameToSeq.has(stripped)) nameToSeq.set(stripped, m.majorSeq);
  }

  // Get all cached_majors
  const allMajors = await db.select({
    id: cachedMajors.id,
    majorName: cachedMajors.majorName,
    aptitudeMiddle: cachedMajors.aptitudeMiddle,
    aptitudeHigh: cachedMajors.aptitudeHigh,
  }).from(cachedMajors);

  let matched = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const major of allMajors) {
    const dbName = major.majorName ?? '';
    const majorSeq = nameToSeq.get(dbName) || nameToSeq.get(dbName + '과');
    if (!majorSeq) continue;
    matched++;

    // Skip if already has data (either column set means the API was already called)
    if (major.aptitudeMiddle !== null || major.aptitudeHigh !== null) {
      skipped++;
      continue;
    }

    try {
      const url = `${CAREERNET_URL}?apiKey=${CAREERNET_KEY}&svcType=api&svcCode=MAJOR_VIEW&contentType=json&gubun=univ_list&majorSeq=${majorSeq}`;
      const res = await fetch(url);
      if (!res.ok) { errors++; continue; }
      const data = await res.json();
      const content = data?.dataSearch?.content?.[0];
      if (!content) { errors++; continue; }

      const aptMiddle = content.lstMiddleAptd ?? null;
      const aptHigh = content.lstHighAptd ?? null;

      await db.update(cachedMajors)
        .set({
          aptitudeMiddle: aptMiddle as any,
          aptitudeHigh: aptHigh as any,
          syncedAt: new Date(),
        })
        .where(eq(cachedMajors.id, major.id));

      updated++;
      if (updated % 20 === 0) onProgress?.(`  진행중: ${updated}개 완료 (${matched}개 매칭 중)`);
      await new Promise(r => setTimeout(r, 120));
    } catch (e: any) {
      onProgress?.(`  오류 [${major.majorName}]: ${e.message}`);
      errors++;
    }
  }

  onProgress?.(`적성 데이터 동기화 완료 — 매칭: ${matched}개, 업데이트: ${updated}개, 건너뜀: ${skipped}개, 오류: ${errors}개`);
  return { matched, updated, skipped, errors };
}

// ---- Normalize major name: strip trailing suffixes ----
// 순서: 2글자 접미사 먼저 제거 후 단일 글자 제거
// "컴퓨터공학과" → "컴퓨터공학" / "약학부" → "약학" / "컴퓨터공학전공" → "컴퓨터공학"
export function normalizeMajorName(name: string): string {
  return name
    .replace(/전공$/, '')
    .replace(/[과부]$/, '')
    .trim();
}

// ---- Refill empty related_majors for jobs using CareerNet JOB API ----
export async function refillEmptyRelatedMajors(
  onProgress?: (msg: string) => void
): Promise<{ checked: number; filled: number; unchanged: number }> {
  if (!CAREERNET_KEY) {
    onProgress?.('CAREERNET_API_KEY 미설정 — related_majors 재수집 건너뜀');
    return { checked: 0, filled: 0, unchanged: 0 };
  }

  // Find jobs with NULL or empty related_majors
  const emptyJobs = await db.execute(sql`
    SELECT id, job_name, job_seq
    FROM cached_jobs
    WHERE related_majors IS NULL
       OR related_majors = '[]'::jsonb
       OR jsonb_array_length(related_majors) = 0
    ORDER BY id
  `);
  const items: Array<{ id: number; job_name: string; job_seq: string | null }> =
    (emptyJobs as any).rows ?? [];
  onProgress?.(`related_majors 빈 직업: ${items.length}개`);

  if (items.length === 0) return { checked: 0, filled: 0, unchanged: 0 };

  // Build jobdicSeq → related_majors map by fetching all pages from CareerNet JOB API
  onProgress?.('커리어넷 JOB API 전체 페이지 수집 중...');
  const seqToMajors = new Map<string, string[]>();
  let page = 1;
  let totalFetched = 0;
  while (true) {
    const url = `${CAREERNET_BASE}?apiKey=${CAREERNET_KEY}&svcType=api&svcCode=JOB&contentType=json&gubun=job&pageIndex=${page}&pageCount=100`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    const cnItems: any[] = data?.dataSearch?.content ?? [];
    if (cnItems.length === 0) break;

    for (const j of cnItems) {
      const seq = String(j.jobdicSeq ?? '').trim();
      if (!seq) continue;
      const majors: string[] = Array.isArray(j.relatedMajor)
        ? j.relatedMajor
        : typeof j.relatedMajor === 'string' && j.relatedMajor.trim()
          ? j.relatedMajor.split(/[,，、]+/).map((s: string) => s.trim()).filter(Boolean)
          : [];
      if (!seqToMajors.has(seq)) seqToMajors.set(seq, majors);
    }

    totalFetched += cnItems.length;
    const total = parseInt(cnItems[0]?.totalCount ?? '0');
    if (totalFetched >= total) break;
    page++;
    if (page > 100) break;
    await new Promise(r => setTimeout(r, 1000));
  }
  onProgress?.(`커리어넷 JOB API 매핑 완료: ${seqToMajors.size}개 직업`);

  let filled = 0;
  let unchanged = 0;

  for (const item of items) {
    const seq = String(item.job_seq ?? '').trim();
    const majors = seq ? (seqToMajors.get(seq) ?? []) : [];
    if (majors.length > 0) {
      await db.execute(sql`
        UPDATE cached_jobs
        SET related_majors = ${JSON.stringify(majors)}::jsonb, synced_at = NOW()
        WHERE id = ${item.id}
      `);
      filled++;
    } else {
      unchanged++;
    }
  }

  onProgress?.(`related_majors 재수집 완료: ${filled}개 채워짐, ${unchanged}개 API에도 빈값`);
  return { checked: items.length, filled, unchanged };
}

// ---- Sync career_major_seq from CareerNet MAJOR API ----
export async function syncCareerMajorSeq(
  onProgress?: (msg: string) => void
): Promise<{ total: number; mapped: number; unmatched: number; unmatchedNames: string[] }> {
  if (!CAREERNET_KEY) {
    onProgress?.('CAREERNET_API_KEY 미설정 — career_major_seq 동기화 건너뜀');
    return { total: 0, mapped: 0, unmatched: 0, unmatchedNames: [] };
  }

  onProgress?.('커리어넷 MAJOR API 목록 수집 중...');
  const CAREERNET_URL = 'https://www.career.go.kr/cnet/openapi/getOpenApi';
  const cnList: Array<{ mClass: string; majorSeq: string }> = [];
  let page = 1;
  while (true) {
    const url = `${CAREERNET_URL}?apiKey=${CAREERNET_KEY}&svcType=api&svcCode=MAJOR&contentType=json&gubun=univ_list&pageIndex=${page}&pageCount=20`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    const items: Array<{ mClass: string; majorSeq: string; totalCount?: string }> =
      data?.dataSearch?.content ?? [];
    if (items.length === 0) break;
    cnList.push(...items);
    const total = parseInt(items[0]?.totalCount ?? '0');
    if (cnList.length >= total) break;
    page++;
    if (page > 60) break;
    await new Promise(r => setTimeout(r, 500));
  }
  onProgress?.(`커리어넷 MAJOR 목록: ${cnList.length}개 로드됨`);

  // Build multi-key lookup: original, normalized, original+과, normalized+과
  const nameToSeq = new Map<string, number>();
  for (const m of cnList) {
    const key = m.mClass?.trim();
    if (!key || !m.majorSeq) continue;
    const seq = parseInt(m.majorSeq);
    if (!nameToSeq.has(key)) nameToSeq.set(key, seq);
    const norm = normalizeMajorName(key);
    if (!nameToSeq.has(norm)) nameToSeq.set(norm, seq);
    if (!nameToSeq.has(key + '과')) nameToSeq.set(key + '과', seq);
    if (!nameToSeq.has(norm + '과')) nameToSeq.set(norm + '과', seq);
  }

  const allMajors = await db.select({
    id: cachedMajors.id,
    majorName: cachedMajors.majorName,
  }).from(cachedMajors);

  let mapped = 0;
  const unmatchedNames: string[] = [];

  for (const major of allMajors) {
    const dbName = (major.majorName ?? '').trim();
    const norm = normalizeMajorName(dbName);
    const seq =
      nameToSeq.get(dbName) ??
      nameToSeq.get(norm) ??
      nameToSeq.get(dbName + '과') ??
      nameToSeq.get(norm + '과');

    if (seq != null) {
      await db.execute(sql`
        UPDATE cached_majors SET career_major_seq = ${seq} WHERE id = ${major.id}
      `);
      mapped++;
    } else {
      unmatchedNames.push(dbName);
    }
  }

  const unmatched = unmatchedNames.length;
  onProgress?.(`career_major_seq 매핑 완료: ${allMajors.length}개 중 ${mapped}개 매핑됨, ${unmatched}개 미매칭`);
  onProgress?.(`미매칭 상위 10개: ${JSON.stringify(unmatchedNames.slice(0, 10))}`);
  return { total: allMajors.length, mapped, unmatched, unmatchedNames: unmatchedNames.slice(0, 10) };
}

// ---- Data quality report ----
// ---- [NEW] CareerNet 신규 API: 직업 전수 재수집 (552개) ----
// /front/openapi/jobs.json 목록 + /front/openapi/job.json 상세
export async function syncJobsFromCareerNetNew(
  onProgress?: (msg: string) => void
): Promise<{ upserted: number; inserted: number; noWage: number; errors: number }> {
  const log = (msg: string) => { onProgress?.(msg); console.log("[syncJobsNew]", msg); };
  const key = CAREERNET_KEY || "d0b761c825e0a9e4b163e05c50d0bad8";
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  // ── 1. 목록 전수 수집 (56 pages × 10) ──
  log("직업 목록 수집 시작 (56 페이지)");
  const allJobs: Array<{ job_cd: number; job_nm: string; wage: string; job_category?: string; seq: number; work?: string; top_nm?: string }> = [];
  for (let page = 1; page <= 56; page++) {
    try {
      const url = `${CAREERNET_NEW_BASE}/jobs.json?apiKey=${key}&pageIndex=${page}&pageSize=10`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const data = await res.json();
      const jobs = data.jobs ?? [];
      if (jobs.length === 0) break;
      allJobs.push(...jobs);
      if (page % 10 === 0) log(`  목록 수집: ${page}페이지 완료, 누적 ${allJobs.length}개`);
      await sleep(150);
    } catch (e) {
      log(`  목록 ${page}페이지 오류: ${e}`);
      await sleep(500);
    }
  }
  log(`목록 수집 완료: ${allJobs.length}개 직업`);

  // ── 2. 기존 DB job_name 목록 로드 (매칭용) ──
  const existingRows = await db.execute(sql`SELECT id, job_name, salary FROM cached_jobs`);
  const existingByName = new Map<string, { id: number; salary: number | null }>();
  for (const row of (existingRows as any).rows ?? []) {
    existingByName.set((row.job_name as string).trim(), { id: row.id as number, salary: row.salary as number | null });
  }
  const maxIdRow = await db.execute(sql`SELECT COALESCE(MAX(id), 0) as max_id FROM cached_jobs`);
  let nextId = ((maxIdRow as any).rows?.[0]?.max_id as number ?? 0) + 1;

  // ── 3. 상세 수집 + Upsert ──
  let upserted = 0, inserted = 0, noWage = 0, errors = 0;
  log(`상세 수집 + DB 저장 시작 (${allJobs.length}개)`);

  for (let i = 0; i < allJobs.length; i++) {
    const job = allJobs[i];
    try {
      const detailUrl = `${CAREERNET_NEW_BASE}/job.json?apiKey=${key}&seq=${job.job_cd}`;
      const detailRes = await fetch(detailUrl, { signal: AbortSignal.timeout(15000) });
      const detail = await detailRes.json();
      const baseInfo = detail.baseInfo ?? {};

      // 급여 파싱: "3,833" → 38,330,000원
      const wageRaw = (baseInfo.wage ?? "").trim();
      let salary: number | null = null;
      if (wageRaw && wageRaw !== "0") {
        const wageNum = parseInt(wageRaw.replace(/,/g, ""), 10);
        if (!isNaN(wageNum) && wageNum > 0) salary = wageNum * 10000;
      }
      if (!salary) noWage++;

      // 관련 학과: departList → 학과명 배열
      const relatedMajors = (detail.departList ?? []).map((d: any) => d.depart_name as string).filter(Boolean);

      // 설명: job.json baseInfo에는 summary/work 없음 → 목록 API의 job.work 사용
      const description = (job.work ?? "").trim() || null;
      const wageSource = (baseInfo.wage_source ?? "").slice(0, 500) || null;

      const jobName = (job.job_nm ?? "").trim();
      const field = (job.job_category ?? job.top_nm ?? "").trim() || null;
      const now = new Date();

      const existing = existingByName.get(jobName);
      if (existing) {
        // UPDATE
        await db.execute(sql`
          UPDATE cached_jobs SET
            salary = ${salary},
            wage_source = ${wageSource},
            description = COALESCE(NULLIF(${description}, ''), description),
            field = COALESCE(${field}, field),
            related_majors = ${JSON.stringify(relatedMajors)}::jsonb,
            job_seq = ${String(job.job_cd)},
            synced_at = ${now}
          WHERE id = ${existing.id}
        `);
        upserted++;
      } else {
        // INSERT
        await db.execute(sql`
          INSERT INTO cached_jobs (id, job_seq, job_name, field, description, related_majors, salary, wage_source, growth, qualifications, holland_code, synced_at)
          VALUES (
            ${nextId},
            ${String(job.job_cd)},
            ${jobName},
            ${field},
            ${description},
            ${JSON.stringify(relatedMajors)}::jsonb,
            ${salary},
            ${wageSource},
            NULL,
            '[]'::jsonb,
            NULL,
            ${now}
          )
        `);
        existingByName.set(jobName, { id: nextId, salary });
        nextId++;
        inserted++;
      }

      if ((i + 1) % 50 === 0) log(`  상세 처리: ${i + 1}/${allJobs.length} (저장: ${upserted + inserted}개, 급여없음: ${noWage}개)`);
      await sleep(200);
    } catch (e) {
      log(`  오류 (${job.job_nm}): ${e}`);
      errors++;
      await sleep(300);
    }
  }

  log(`완료: 업데이트=${upserted}, 신규=${inserted}, 급여없음=${noWage}, 오류=${errors}`);
  return { upserted, inserted, noWage, errors };
}

// ---- [NEW] CareerNet 신규 파라미터: 학과 전수 재수집 (501개) ----
// MAJOR API: thisPage/perPage=200  + MAJOR_VIEW: gubun=univ_list
export async function syncMajorsFromCareerNetNew(
  onProgress?: (msg: string) => void
): Promise<{ upserted: number; inserted: number; errors: number }> {
  const log = (msg: string) => { onProgress?.(msg); console.log("[syncMajorsNew]", msg); };
  const key = CAREERNET_KEY || "d0b761c825e0a9e4b163e05c50d0bad8";
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  // ── 1. 목록 전수 수집 (3 pages × 200) ──
  log("학과 목록 수집 시작 (3 페이지)");
  const allMajors: Array<{ majorSeq: string; mClass: string; lClass: string }> = [];
  for (let page = 1; page <= 3; page++) {
    try {
      const url = `${CAREERNET_BASE}?apiKey=${key}&svcType=api&svcCode=MAJOR&contentType=json&gubun=univ_list&thisPage=${page}&perPage=200`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const data = await res.json();
      const items = data.dataSearch?.content ?? [];
      allMajors.push(...items);
      log(`  페이지 ${page}: ${items.length}개 수집, 누적 ${allMajors.length}개`);
      await sleep(200);
    } catch (e) {
      log(`  목록 ${page}페이지 오류: ${e}`);
    }
  }
  log(`목록 수집 완료: ${allMajors.length}개 학과`);

  // ── 2. 기존 DB 로드 (매칭용) ──
  const existingRows = await db.execute(sql`SELECT id, major_name, career_major_seq FROM cached_majors`);
  const existingBySeq = new Map<number, number>(); // careerMajorSeq → id
  const existingByName = new Map<string, number>(); // majorName → id
  for (const row of (existingRows as any).rows ?? []) {
    if (row.career_major_seq) existingBySeq.set(row.career_major_seq as number, row.id as number);
    existingByName.set((row.major_name as string).trim(), row.id as number);
  }
  const maxIdRow = await db.execute(sql`SELECT COALESCE(MAX(id), 0) as max_id FROM cached_majors`);
  let nextId = ((maxIdRow as any).rows?.[0]?.max_id as number ?? 0) + 1;

  // ── 3. 상세 수집 + Upsert ──
  let upserted = 0, inserted = 0, errors = 0;
  log(`상세 수집 + DB 저장 시작 (${allMajors.length}개)`);

  for (let i = 0; i < allMajors.length; i++) {
    const major = allMajors[i];
    const seqNum = parseInt(major.majorSeq, 10);
    try {
      const detailUrl = `${CAREERNET_BASE}?apiKey=${key}&svcType=api&svcCode=MAJOR_VIEW&contentType=json&majorSeq=${major.majorSeq}&gubun=univ_list`;
      const detailRes = await fetch(detailUrl, { signal: AbortSignal.timeout(20000) });
      const detailData = await detailRes.json();
      const d = detailData.dataSearch?.content?.[0];
      if (!d) {
        log(`  데이터 없음: ${major.mClass} (seq=${major.majorSeq})`);
        errors++;
        await sleep(200);
        continue;
      }

      // 취업률 파싱: "<strong>60</strong> % 이상" → 60
      const employmentText = d.employment ?? "";
      const empMatch = employmentText.match(/(\d+(?:\.\d+)?)/);
      const employmentRate = empMatch ? parseFloat(empMatch[1]) : null;

      // 초임 월급여: "186.9" 만원 → 그대로 저장 (avgSalaryDistribution에 {initial: 186.9} 형태)
      const initSalaryRaw = (d.salary ?? "").toString().trim();
      const initSalary = initSalaryRaw ? parseFloat(initSalaryRaw) : null;
      const avgSalaryDistribution = initSalary ? { initial: initSalary, unit: "만원/월" } : null;

      // 홀랜드 흥미 유형
      const hollandCode = (d.interest ?? "").trim() || null;

      // 관련 고교 과목 (JSON → text)
      const relatedSubjects = d.relate_subject ? JSON.stringify(d.relate_subject) : null;

      // 개설 대학 (JSON 배열)
      const universities = d.university ? d.university : null;

      // 적성 데이터
      const aptitudeHigh = d.lstHighAptd ?? null;
      const aptitudeMiddle = d.lstMiddleAptd ?? null;

      // 설명
      const description = (d.summary ?? "").trim() || null;

      const now = new Date();
      const majorName = (major.mClass ?? "").trim();
      const category = (major.lClass ?? d.lClass ?? "").trim() || null;

      // 매칭: careerMajorSeq → majorName 순
      const existingId = existingBySeq.get(seqNum) ?? existingByName.get(majorName);

      if (existingId) {
        // UPDATE
        await db.execute(sql`
          UPDATE cached_majors SET
            major_name = ${majorName},
            category = COALESCE(${category}, category),
            description = COALESCE(NULLIF(${description}, ''), description),
            related_subjects = ${relatedSubjects},
            universities = ${universities ? JSON.stringify(universities) : null}::jsonb,
            holland_code = COALESCE(${hollandCode}, holland_code),
            employment_rate = COALESCE(${employmentRate}, employment_rate),
            avg_salary_distribution = ${avgSalaryDistribution ? JSON.stringify(avgSalaryDistribution) : null}::jsonb,
            aptitude_high = ${aptitudeHigh ? JSON.stringify(aptitudeHigh) : null}::jsonb,
            aptitude_middle = ${aptitudeMiddle ? JSON.stringify(aptitudeMiddle) : null}::jsonb,
            career_major_seq = ${seqNum},
            synced_at = ${now}
          WHERE id = ${existingId}
        `);
        upserted++;
      } else {
        // INSERT
        await db.execute(sql`
          INSERT INTO cached_majors (
            id, major_seq, major_name, category, description, related_jobs, related_subjects,
            universities, holland_code, demand, synced_at, data_source,
            employment_rate, avg_salary_distribution, aptitude_high, aptitude_middle, career_major_seq
          ) VALUES (
            ${nextId},
            ${major.majorSeq},
            ${majorName},
            ${category},
            ${description},
            '[]'::jsonb,
            ${relatedSubjects},
            ${universities ? JSON.stringify(universities) : null}::jsonb,
            ${hollandCode},
            NULL,
            ${now},
            'CareerNet',
            ${employmentRate},
            ${avgSalaryDistribution ? JSON.stringify(avgSalaryDistribution) : null}::jsonb,
            ${aptitudeHigh ? JSON.stringify(aptitudeHigh) : null}::jsonb,
            ${aptitudeMiddle ? JSON.stringify(aptitudeMiddle) : null}::jsonb,
            ${seqNum}
          )
        `);
        existingByName.set(majorName, nextId);
        existingBySeq.set(seqNum, nextId);
        nextId++;
        inserted++;
      }

      if ((i + 1) % 50 === 0) log(`  처리: ${i + 1}/${allMajors.length} (업데이트=${upserted}, 신규=${inserted})`);
      await sleep(200);
    } catch (e) {
      log(`  오류 (${major.mClass}): ${e}`);
      errors++;
      await sleep(300);
    }
  }

  log(`완료: 업데이트=${upserted}, 신규=${inserted}, 오류=${errors}`);
  return { upserted, inserted, errors };
}

export async function getDataQualityReport() {
  const [majorStats, jobStats, univStats] = await Promise.all([
    db.execute(sql`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN description IS NOT NULL AND description != '' THEN 1 END) as with_desc,
        COUNT(CASE WHEN related_subjects IS NOT NULL THEN 1 END) as with_subjects,
        COUNT(CASE WHEN demand IS NOT NULL THEN 1 END) as with_demand
      FROM cached_majors
    `),
    db.execute(sql`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN description IS NOT NULL AND description != '' THEN 1 END) as with_desc,
        COUNT(CASE WHEN salary IS NOT NULL AND salary > 0 THEN 1 END) as with_salary,
        (SELECT COUNT(*) FROM (SELECT job_name FROM cached_jobs GROUP BY job_name HAVING COUNT(*) > 1) d) as duplicates
      FROM cached_jobs
    `),
    db.execute(sql`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN competition_rate > 0 THEN 1 END) as with_comp,
        COUNT(CASE WHEN employment_rate > 0 THEN 1 END) as with_emp,
        COUNT(CASE WHEN dormitory_rate > 0 THEN 1 END) as with_dorm,
        COUNT(CASE WHEN avg_tuition > 0 THEN 1 END) as with_tuition
      FROM university_info
    `),
  ]);

  return {
    majors: (majorStats as any).rows?.[0],
    jobs: (jobStats as any).rows?.[0],
    universities: (univStats as any).rows?.[0],
  };
}
