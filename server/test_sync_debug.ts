import { syncCareerMajorSeq, normalizeMajorName } from './dataSync';
import { db } from './db';
import { cachedMajors } from '../shared/schema';
import { sql } from 'drizzle-orm';

async function main() {
  // normalizeMajorName 검증
  const tests = ['컴퓨터공학과','간호학과','물리치료과','약학부','컴퓨터공학전공','도시공학과','사회학과','생명공학과'];
  console.log('=== normalizeMajorName 검증 ===');
  tests.forEach(t => console.log(`  ${t} → ${normalizeMajorName(t)}`));
  
  // CareerNet MAJOR API에서 샘플 수집
  const CAREERNET_KEY = process.env.CAREERNET_API_KEY;
  const CAREERNET_URL = 'https://www.career.go.kr/cnet/openapi/getOpenApi';
  console.log('\n=== CareerNet MAJOR 첫 페이지 샘플 20개 ===');
  const url = `${CAREERNET_URL}?apiKey=${CAREERNET_KEY}&svcType=api&svcCode=MAJOR&contentType=json&gubun=univ_list&pageIndex=1&pageCount=20`;
  const res = await fetch(url);
  const data = await res.json();
  const items = data?.dataSearch?.content ?? [];
  const mClassSample = items.slice(0,20).map((i: any) => i.mClass);
  console.log(JSON.stringify(mClassSample, null, 2));
  
  // DB 샘플
  const rows = await db.select({ majorName: cachedMajors.majorName }).from(cachedMajors).limit(20);
  console.log('\n=== DB major_name 샘플 20개 ===');
  console.log(JSON.stringify(rows.map(r => r.majorName), null, 2));
  
  // 매핑 시도 예시 - 사회학과
  console.log('\n=== "사회학과" 매핑 시도 ===');
  const norm = normalizeMajorName('사회학과');
  console.log('norm:', norm);
  console.log('Map에 있어야 하는 키: "사회학과" (key+"과"), "사회학" (norm)');
  
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
