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
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
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
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
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
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
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

// ---- Data quality report ----
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
