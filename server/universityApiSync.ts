import { db } from "./db";
import { universityInfo } from "@shared/schema";
import { eq } from "drizzle-orm";

const API_KEY = process.env.PUBLIC_DATA_API_KEY || "";

const API1_ENDPOINT = "https://api.data.go.kr/openapi/tn_pubr_public_univ_main_api";
const API2_ENDPOINT = "https://api.data.go.kr/openapi/tn_pubr_public_univ_entrn_rate_api";

async function fetchApiPage(endpoint: string, page: number, perPage: number): Promise<any> {
  const url = `${endpoint}?serviceKey=${API_KEY}&page=${page}&perPage=${perPage}&returnType=JSON`;

  console.log(`[UniversityAPI] Fetching: ${endpoint} page=${page} perPage=${perPage}`);

  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${text}`);
  }

  const data = await resp.json();
  return data;
}

function extractItems(data: any): any[] {
  if (!data) return [];

  if (Array.isArray(data.data)) return data.data;

  const body = data?.response?.body;
  if (body) {
    const items = body.items;
    if (Array.isArray(items)) return items;
    if (items && Array.isArray(items.item)) return items.item;
  }

  if (Array.isArray(data.items)) return data.items;

  return [];
}

function extractTotalCount(data: any): number {
  if (typeof data.totalCount === "number") return data.totalCount;
  if (typeof data.matchCount === "number") return data.matchCount;
  const body = data?.response?.body;
  if (body && typeof body.totalCount === "number") return body.totalCount;
  return 0;
}

async function fetchAllPages(endpoint: string): Promise<any[]> {
  const samplePage = await fetchApiPage(endpoint, 1, 5);
  console.log(`[UniversityAPI] Sample response from ${endpoint}:`);
  console.log(JSON.stringify(samplePage, null, 2));

  const totalCount = extractTotalCount(samplePage);
  console.log(`[UniversityAPI] Total records: ${totalCount}`);

  if (totalCount <= 5) {
    return extractItems(samplePage);
  }

  const perPage = 100;
  const totalPages = Math.ceil(totalCount / perPage);
  const allItems: any[] = [];

  for (let page = 1; page <= totalPages; page++) {
    const pageData = await fetchApiPage(endpoint, page, perPage);
    const items = extractItems(pageData);
    allItems.push(...items);
    console.log(`[UniversityAPI] Fetched page ${page}/${totalPages}, items so far: ${allItems.length}`);

    await new Promise((r) => setTimeout(r, 100));
  }

  return allItems;
}

function normalizeUnivName(name: string): string {
  return (name || "").trim().replace(/\s+/g, " ");
}

function parseNumber(val: any): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

function parseInteger(val: any): number | null {
  const n = parseNumber(val);
  return n === null ? null : Math.round(n);
}

export async function syncUniversityApi(): Promise<{
  api1Matched: number;
  api1Unmatched: string[];
  api2Matched: number;
  api2Unmatched: string[];
  errors: string[];
}> {
  if (!API_KEY) {
    throw new Error("PUBLIC_DATA_API_KEY 환경변수가 설정되지 않았습니다. API 동기화를 진행할 수 없습니다.");
  }

  const errors: string[] = [];
  let api1Matched = 0;
  let api1Unmatched: string[] = [];
  let api2Matched = 0;
  let api2Unmatched: string[] = [];

  const existingRows = await db.select({ id: universityInfo.id, univName: universityInfo.univName }).from(universityInfo);
  const nameToId = new Map<string, number>();
  for (const row of existingRows) {
    if (row.univName) {
      nameToId.set(normalizeUnivName(row.univName), row.id);
    }
  }

  console.log(`[UniversityAPI] Loaded ${nameToId.size} universities from DB`);

  // --- API 1: 학교별 기본 현황 ---
  try {
    const api1Items = await fetchAllPages(API1_ENDPOINT);
    console.log(`[UniversityAPI] API1 total items fetched: ${api1Items.length}`);

    const unmatchedSet = new Set<string>();

    for (const item of api1Items) {
      const rawName =
        item.학교명 ||
        item.univNm ||
        item.schoolNm ||
        item.univ_name ||
        item.schNm ||
        item.한글학교명 ||
        "";
      const name = normalizeUnivName(rawName);
      if (!name) continue;

      const id = nameToId.get(name);
      if (!id) {
        unmatchedSet.add(name);
        continue;
      }

      const updateData: Record<string, any> = { syncedAt: new Date() };

      const competitionRate = parseNumber(
        item.경쟁률 ?? item.competition_rate ?? item.cmpttRate ?? null
      );
      if (competitionRate !== null) updateData.competitionRate = competitionRate;

      const admissionQuota = parseInteger(
        item.입학정원 ?? item.admsn_quota ?? item.admiQuota ?? null
      );
      if (admissionQuota !== null) updateData.admissionQuota = admissionQuota;

      const studentCount = parseInteger(
        item.재학생수 ?? item.stdntCo ?? item.student_count ?? null
      );
      if (studentCount !== null) updateData.studentCount = studentCount;

      const graduateCount = parseInteger(
        item.졸업생수 ?? item.grad_count ?? item.grdtCo ?? null
      );
      if (graduateCount !== null) updateData.graduateCount = graduateCount;

      const avgTuition = parseNumber(
        item.평균등록금 ?? item.avg_tuition ?? item.tutnFee ?? null
      );
      if (avgTuition !== null) updateData.avgTuition = avgTuition;

      const scholarshipPerStudent = parseInteger(
        item.학생1인당장학금 ?? item.scholarship_per_student ?? item.schlrAmtPerSe ?? null
      );
      if (scholarshipPerStudent !== null) updateData.scholarshipPerStudent = scholarshipPerStudent;

      const dormitoryRate = parseNumber(
        item.기숙사수용률 ?? item.dormitory_rate ?? item.drmtryRate ?? null
      );
      if (dormitoryRate !== null) updateData.dormitoryRate = dormitoryRate;

      const educationCostPerStudent = parseInteger(
        item.학생1인당교육비 ?? item.education_cost_per_student ?? item.edctnExpnsPerSe ?? null
      );
      if (educationCostPerStudent !== null) updateData.educationCostPerStudent = educationCostPerStudent;

      const foreignStudentCount = parseInteger(
        item.외국인학생수 ?? item.foreign_student_count ?? item.frnlsStdntCo ?? null
      );
      if (foreignStudentCount !== null) updateData.foreignStudentCount = foreignStudentCount;

      await db.update(universityInfo).set(updateData).where(eq(universityInfo.id, id));
      api1Matched++;
    }

    api1Unmatched = Array.from(unmatchedSet);
    console.log(`[UniversityAPI] API1: matched=${api1Matched}, unmatched=${api1Unmatched.length}`);
  } catch (err: any) {
    const msg = `API1 error: ${err.message}`;
    console.error(`[UniversityAPI] ${msg}`);
    errors.push(msg);
  }

  // --- API 2: 취업률 ---
  try {
    const api2Items = await fetchAllPages(API2_ENDPOINT);
    console.log(`[UniversityAPI] API2 total items fetched: ${api2Items.length}`);

    const unmatchedSet = new Set<string>();

    for (const item of api2Items) {
      const rawName =
        item.학교명 ||
        item.univNm ||
        item.schoolNm ||
        item.univ_name ||
        item.schNm ||
        item.한글학교명 ||
        "";
      const name = normalizeUnivName(rawName);
      if (!name) continue;

      const id = nameToId.get(name);
      if (!id) {
        unmatchedSet.add(name);
        continue;
      }

      const employmentRate = parseNumber(
        item.취업률 ?? item.employment_rate ?? item.emplRate ?? null
      );
      if (employmentRate === null) continue;

      await db
        .update(universityInfo)
        .set({ employmentRate, syncedAt: new Date() })
        .where(eq(universityInfo.id, id));
      api2Matched++;
    }

    api2Unmatched = Array.from(unmatchedSet);
    console.log(`[UniversityAPI] API2: matched=${api2Matched}, unmatched=${api2Unmatched.length}`);
  } catch (err: any) {
    const msg = `API2 error: ${err.message}`;
    console.error(`[UniversityAPI] ${msg}`);
    errors.push(msg);
  }

  return { api1Matched, api1Unmatched, api2Matched, api2Unmatched, errors };
}
