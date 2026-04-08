/**
 * 직업 전수 재수집 스크립트 — CareerNet 신규 API
 * 실행: npx tsx scripts/run-sync-jobs.ts
 */
import { syncJobsFromCareerNetNew } from "../server/dataSync";

async function main() {
  console.log("=== 직업 전수 재수집 시작 ===");
  const result = await syncJobsFromCareerNetNew((msg) => console.log(msg));
  console.log("=== 완료 ===", result);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
