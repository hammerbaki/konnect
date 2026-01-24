/**
 * 워크넷 채용정보 API 연동 모듈
 * - 공공데이터포털 워크넷 채용정보 API 활용
 * - 직무별 구인수요(채용공고 건수) 조회
 * - 12시간~1일 캐시 저장
 */

import { db } from './db';
import { jobDemandCache } from '@shared/schema';
import { eq, lt } from 'drizzle-orm';

const WORKNET_API_BASE = 'https://openapi.work.go.kr/opi/opi/opia/wantedApi.do';
const CACHE_HOURS = 12; // 캐시 유효시간 (시간)

// KONNECT 직무 → 워크넷 검색 키워드 매핑
const JOB_KEYWORD_MAPPING: Record<string, string[]> = {
  // IT개발
  '소프트웨어 개발자': ['소프트웨어 개발', '프로그래머', 'SW개발'],
  '웹 개발자': ['웹개발자', '웹프로그래머', '프론트엔드', '백엔드'],
  '앱 개발자': ['앱개발자', '모바일개발', 'iOS개발', '안드로이드'],
  '데이터 엔지니어': ['데이터엔지니어', '데이터분석', 'AI엔지니어'],
  '클라우드 엔지니어': ['클라우드', 'AWS', '인프라엔지니어'],
  '정보보안 전문가': ['정보보안', '보안전문가', '사이버보안'],
  // 디자인
  'UX 디자이너': ['UX디자이너', 'UI디자이너', 'UX/UI'],
  'UI 디자이너': ['UI디자이너', 'UX/UI', '웹디자이너'],
  '그래픽 디자이너': ['그래픽디자이너', '시각디자인'],
  '제품 디자이너': ['제품디자이너', '산업디자인'],
  // 기획/마케팅
  '서비스 기획자': ['서비스기획', '기획자', 'PM'],
  '프로젝트 매니저': ['PM', '프로젝트매니저', '프로젝트관리'],
  '마케팅 매니저': ['마케팅', '마케터', '디지털마케팅'],
  '콘텐츠 마케터': ['콘텐츠마케팅', 'SNS마케팅'],
  '브랜드 매니저': ['브랜드매니저', '브랜드마케팅'],
  // 영업/비즈니스
  '영업 관리자': ['영업관리', '영업담당', '세일즈'],
  '사업개발 매니저': ['사업개발', 'BD', '비즈니스개발'],
  '고객성공 매니저': ['고객성공', 'CS매니저', '고객관리'],
  // 연구개발
  '연구원': ['연구원', 'R&D', '연구개발'],
  '바이오 연구원': ['바이오', '생명과학', '제약연구'],
  // 경영/관리
  '인사 담당자': ['인사담당', 'HR', '채용담당'],
  '재무 담당자': ['재무담당', '회계', '경리'],
  '법무 담당자': ['법무', '계약관리'],
  // 교육
  '교사': ['교사', '강사', '교육'],
  '교육 컨설턴트': ['교육컨설턴트', '진로상담'],
  // 의료/헬스
  '간호사': ['간호사', '임상간호'],
  '의료기사': ['의료기사', '방사선사', '임상병리'],
  '물리치료사': ['물리치료사', '재활치료'],
  // 콘텐츠
  '영상 편집자': ['영상편집', '영상제작', '유튜브'],
  '작가': ['작가', '카피라이터', '콘텐츠작가'],
  // 병원 관련
  '병원 경영기획': ['병원경영', '의료경영', '병원기획'],
};

// 워크넷 API 키 가져오기
function getWorknetApiKey(): string | null {
  return process.env.WORKNET_API_KEY || null;
}

// 날짜를 YYYYMMDD 형식으로 변환
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export interface JobDemandResult {
  jobKeyword: string;
  demandCount: number;
  periodDays: number;
  dataSource: string;
  fetchedAt: Date;
  expiresAt: Date;
  fromCache: boolean;
}

/**
 * 워크넷 API에서 채용공고 건수 조회
 */
async function fetchWorknetDemand(keyword: string): Promise<number> {
  const apiKey = getWorknetApiKey();
  if (!apiKey) {
    console.log('[Worknet] API key not configured, returning 0');
    return 0;
  }

  try {
    // 최근 30일 기준
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const params = new URLSearchParams({
      authKey: apiKey,
      callTP: 'L',
      returnType: 'XML',
      startPage: '1',
      display: '1',
      keyword: keyword,
      registBgnDt: formatDate(startDate),
      registEndDt: formatDate(endDate),
    });

    const response = await fetch(`${WORKNET_API_BASE}?${params.toString()}`);
    
    if (!response.ok) {
      console.error(`[Worknet] API error: ${response.status}`);
      return 0;
    }

    const xmlText = await response.text();
    
    // XML에서 total 값 추출 (간단한 파싱)
    const totalMatch = xmlText.match(/<total>(\d+)<\/total>/);
    if (totalMatch && totalMatch[1]) {
      return parseInt(totalMatch[1], 10);
    }

    return 0;
  } catch (error) {
    console.error('[Worknet] Fetch error:', error);
    return 0;
  }
}

/**
 * 직무에 대한 구인수요 조회 (캐시 우선)
 */
export async function getJobDemand(jobTitle: string): Promise<JobDemandResult> {
  // 1. 캐시에서 조회
  const cached = await db
    .select()
    .from(jobDemandCache)
    .where(eq(jobDemandCache.jobKeyword, jobTitle))
    .limit(1);

  const now = new Date();

  if (cached.length > 0 && cached[0].expiresAt > now) {
    // 캐시가 유효함
    return {
      jobKeyword: cached[0].jobKeyword,
      demandCount: cached[0].demandCount,
      periodDays: cached[0].periodDays,
      dataSource: cached[0].dataSource,
      fetchedAt: cached[0].fetchedAt,
      expiresAt: cached[0].expiresAt,
      fromCache: true,
    };
  }

  // 2. 워크넷 API 호출
  const keywords = JOB_KEYWORD_MAPPING[jobTitle] || [jobTitle];
  let totalDemand = 0;

  // 여러 키워드로 검색하여 합산
  for (const kw of keywords.slice(0, 2)) { // 최대 2개 키워드만 검색 (API 호출 제한)
    const count = await fetchWorknetDemand(kw);
    totalDemand += count;
  }

  // 3. 캐시 저장 (12시간 유효)
  const expiresAt = new Date(now.getTime() + CACHE_HOURS * 60 * 60 * 1000);

  if (cached.length > 0) {
    // 기존 캐시 업데이트
    await db
      .update(jobDemandCache)
      .set({
        demandCount: totalDemand,
        fetchedAt: now,
        expiresAt: expiresAt,
        updatedAt: now,
      })
      .where(eq(jobDemandCache.jobKeyword, jobTitle));
  } else {
    // 새 캐시 생성
    await db.insert(jobDemandCache).values({
      jobKeyword: jobTitle,
      demandCount: totalDemand,
      periodDays: 30,
      dataSource: 'worknet',
      fetchedAt: now,
      expiresAt: expiresAt,
    });
  }

  return {
    jobKeyword: jobTitle,
    demandCount: totalDemand,
    periodDays: 30,
    dataSource: 'worknet',
    fetchedAt: now,
    expiresAt: expiresAt,
    fromCache: false,
  };
}

/**
 * 여러 직무에 대한 구인수요 일괄 조회
 */
export async function getJobDemandBatch(jobTitles: string[]): Promise<Map<string, JobDemandResult>> {
  const results = new Map<string, JobDemandResult>();
  
  // 병렬 처리 (최대 5개씩)
  const batchSize = 5;
  for (let i = 0; i < jobTitles.length; i += batchSize) {
    const batch = jobTitles.slice(i, i + batchSize);
    const promises = batch.map(title => getJobDemand(title));
    const batchResults = await Promise.all(promises);
    
    batchResults.forEach((result, idx) => {
      results.set(batch[idx], result);
    });
  }

  return results;
}

/**
 * 만료된 캐시 정리
 */
export async function cleanExpiredCache(): Promise<number> {
  const now = new Date();
  const result = await db
    .delete(jobDemandCache)
    .where(lt(jobDemandCache.expiresAt, now));
  
  return 0; // Drizzle doesn't return count, just acknowledge cleanup
}
