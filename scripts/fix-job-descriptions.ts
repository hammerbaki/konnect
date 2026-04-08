/**
 * 직업 description 복구 스크립트
 * jobs.json 목록 API의 'work' 필드를 description으로 설정
 * (description이 없는 직업만 업데이트, 기존 것 보존)
 */
import { db } from "../server/db";
import { sql } from "drizzle-orm";

const KEY = "d0b761c825e0a9e4b163e05c50d0bad8";
const BASE = "https://www.career.go.kr/cnet/front/openapi/jobs.json";
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log("=== 직업 description 복구 시작 ===");
  
  // 1. 목록 전수 수집 (work 필드 포함)
  const allJobs: Array<{ job_cd: number; job_nm: string; work?: string }> = [];
  for (let page = 1; page <= 56; page++) {
    try {
      const res = await fetch(`${BASE}?apiKey=${KEY}&pageIndex=${page}&pageSize=10`, { signal: AbortSignal.timeout(10000) });
      const data = await res.json();
      const jobs = data.jobs ?? [];
      if (jobs.length === 0) break;
      allJobs.push(...jobs);
      await sleep(100);
    } catch (e) {
      console.log(`  p${page} 오류:`, e);
      await sleep(300);
    }
  }
  console.log(`목록 수집 완료: ${allJobs.length}개`);

  // 2. description 없는 직업만 업데이트
  let updated = 0, skipped = 0, noWork = 0;
  for (const job of allJobs) {
    const name = (job.job_nm ?? "").trim();
    const work = (job.work ?? "").trim();
    if (!work) { noWork++; continue; }
    
    const res = await db.execute(sql`
      UPDATE cached_jobs
      SET description = ${work}
      WHERE job_name = ${name}
        AND (description IS NULL OR description = '')
    `);
    const rowCount = (res as any).rowCount ?? 0;
    if (rowCount > 0) updated++;
    else skipped++;
  }

  console.log(`완료: 업데이트=${updated}, 이미있음=${skipped}, work없음=${noWork}`);
  
  // 3. 검증
  const r = await db.execute(sql`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN description IS NOT NULL AND description != '' THEN 1 END) as with_desc
    FROM cached_jobs
  `);
  console.log("검증:", (r as any).rows?.[0]);
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
