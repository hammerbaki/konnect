/**
 * 학과 전수 재수집 스크립트 — CareerNet MAJOR API 신규 파라미터
 * 실행: npx tsx scripts/run-sync-majors.ts
 */
import { syncMajorsFromCareerNetNew } from "../server/dataSync";

async function main() {
  console.log("=== 학과 전수 재수집 시작 ===");
  const result = await syncMajorsFromCareerNetNew((msg) => console.log(msg));
  console.log("=== 완료 ===", result);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
