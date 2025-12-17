import { JSDOM } from "jsdom";

export interface CompanyInfo {
  name?: string;
  description?: string;
  mission?: string;
  values?: string[];
  culture?: string;
  products?: string;
  recentNews?: string[];
  jobRequirements?: string;
  industryKeywords?: string[];
  rawContent?: string;
}

export interface FetchResult {
  success: boolean;
  info?: CompanyInfo;
  error?: string;
}

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchWithTimeout(url: string, timeout = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractTextContent(element: Element | null): string {
  if (!element) return "";
  return element.textContent?.trim() || "";
}

function extractMetaContent(document: Document, name: string): string {
  const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  return meta?.getAttribute("content") || "";
}

function extractMainContent(document: Document): string {
  const contentSelectors = [
    "main",
    "article",
    '[role="main"]',
    ".content",
    ".main-content",
    "#content",
    "#main",
    ".about",
    ".company",
    ".mission",
    ".vision",
    ".values",
    ".culture",
  ];
  
  let content = "";
  
  for (const selector of contentSelectors) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const text = extractTextContent(el);
      if (text.length > 50) {
        content += text + "\n\n";
      }
    });
  }
  
  if (content.length < 200) {
    const body = document.querySelector("body");
    if (body) {
      const scripts = body.querySelectorAll("script, style, nav, header, footer, aside, iframe, noscript");
      scripts.forEach(el => el.remove());
      content = extractTextContent(body);
    }
  }
  
  return content.slice(0, 15000);
}

function extractCompanyName(document: Document, url: string): string {
  const ogTitle = extractMetaContent(document, "og:site_name");
  if (ogTitle) return ogTitle;
  
  const title = document.querySelector("title");
  if (title) {
    const titleText = extractTextContent(title);
    const cleanTitle = titleText.split(/[|\-–—]/)[0].trim();
    return cleanTitle;
  }
  
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "").split(".")[0];
  } catch {
    return "";
  }
}

function extractMissionAndValues(content: string): { mission?: string; values?: string[] } {
  const missionKeywords = ["미션", "mission", "사명", "비전", "vision", "목표", "goal"];
  const valuesKeywords = ["가치", "values", "핵심가치", "core values", "인재상", "문화"];
  
  const lines = content.split(/\n/).filter(line => line.trim().length > 0);
  let mission: string | undefined;
  const values: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (missionKeywords.some(k => line.includes(k)) && !mission) {
      mission = lines.slice(i, i + 3).join(" ").slice(0, 500);
    }
    
    if (valuesKeywords.some(k => line.includes(k))) {
      const nextLines = lines.slice(i + 1, i + 6);
      for (const nextLine of nextLines) {
        if (nextLine.length > 10 && nextLine.length < 200) {
          values.push(nextLine.trim());
        }
      }
    }
  }
  
  return { mission, values: values.slice(0, 5) };
}

function extractKeywords(content: string): string[] {
  const koreanKeywords = [
    "혁신", "성장", "도전", "창의", "소통", "협업", "글로벌", "디지털", "고객",
    "품질", "기술", "전문성", "리더십", "열정", "책임", "신뢰", "정직", "존중",
    "지속가능", "ESG", "친환경", "안전", "효율", "최고", "차별화", "경쟁력",
  ];
  
  const englishKeywords = [
    "innovation", "growth", "challenge", "creativity", "communication", "collaboration",
    "global", "digital", "customer", "quality", "technology", "expertise", "leadership",
    "passion", "responsibility", "trust", "integrity", "respect", "sustainability",
  ];
  
  const allKeywords = [...koreanKeywords, ...englishKeywords];
  const contentLower = content.toLowerCase();
  
  return allKeywords.filter(keyword => 
    contentLower.includes(keyword.toLowerCase())
  ).slice(0, 10);
}

export async function fetchCompanyInfo(url: string): Promise<FetchResult> {
  try {
    if (!url || !url.startsWith("http")) {
      return { success: false, error: "유효한 URL을 입력해주세요." };
    }
    
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      return { success: false, error: `웹페이지를 가져올 수 없습니다. (상태: ${response.status})` };
    }
    
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    const mainContent = extractMainContent(document);
    const companyName = extractCompanyName(document, url);
    const description = extractMetaContent(document, "og:description") || 
                       extractMetaContent(document, "description");
    const { mission, values } = extractMissionAndValues(mainContent);
    const keywords = extractKeywords(mainContent);
    
    const info: CompanyInfo = {
      name: companyName,
      description: description.slice(0, 500),
      mission,
      values,
      industryKeywords: keywords,
      rawContent: mainContent.slice(0, 5000),
    };
    
    return { success: true, info };
  } catch (error: any) {
    console.error("Error fetching company info:", error);
    
    if (error.name === "AbortError") {
      return { success: false, error: "웹페이지 로딩 시간이 초과되었습니다." };
    }
    
    return { success: false, error: error.message || "웹페이지를 분석할 수 없습니다." };
  }
}

export async function fetchMultiplePages(urls: string[]): Promise<CompanyInfo> {
  const results = await Promise.all(
    urls.slice(0, 3).map(url => fetchCompanyInfo(url))
  );
  
  const combinedInfo: CompanyInfo = {
    values: [],
    industryKeywords: [],
  };
  
  for (const result of results) {
    if (result.success && result.info) {
      if (!combinedInfo.name && result.info.name) {
        combinedInfo.name = result.info.name;
      }
      if (!combinedInfo.description && result.info.description) {
        combinedInfo.description = result.info.description;
      }
      if (!combinedInfo.mission && result.info.mission) {
        combinedInfo.mission = result.info.mission;
      }
      if (result.info.values) {
        combinedInfo.values = [...(combinedInfo.values || []), ...result.info.values];
      }
      if (result.info.industryKeywords) {
        combinedInfo.industryKeywords = [...(combinedInfo.industryKeywords || []), ...result.info.industryKeywords];
      }
      if (result.info.rawContent) {
        combinedInfo.rawContent = (combinedInfo.rawContent || "") + "\n\n" + result.info.rawContent;
      }
    }
  }
  
  if (combinedInfo.values) {
    combinedInfo.values = Array.from(new Set(combinedInfo.values)).slice(0, 8);
  }
  if (combinedInfo.industryKeywords) {
    combinedInfo.industryKeywords = Array.from(new Set(combinedInfo.industryKeywords)).slice(0, 10);
  }
  if (combinedInfo.rawContent) {
    combinedInfo.rawContent = combinedInfo.rawContent.slice(0, 8000);
  }
  
  return combinedInfo;
}
