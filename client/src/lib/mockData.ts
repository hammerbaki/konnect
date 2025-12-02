export interface CareerGoal {
  id: string;
  title: string;
  targetDate: string;
  status: "pending" | "in-progress" | "completed";
  progress: number;
  steps: {
    id: string;
    title: string;
    isCompleted: boolean;
  }[];
}

export interface CareerAnalysis {
  score: number;
  matchLevel: "High" | "Medium" | "Low";
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  marketTrend: "상승세" | "안정적" | "하락세";
  skillsGap: string[];
  strengths: string[];
}

export interface UserProfile {
  name: string;
  email: string;
  credits: number;
  hardConditions: {
    location: string[];
    salaryMin: number;
    excludedIndustries: string[];
  };
  softConditions: {
    interests: string[];
    personalityType: string;
  };
  education: {
    degree: string;
    gpa: number;
    graduationYear: number;
  };
}

export const MOCK_GOALS: CareerGoal[] = [
  {
    id: "1",
    title: "시니어 PM 직무 전환",
    targetDate: "2025-12-31",
    status: "in-progress",
    progress: 45,
    steps: [
      { id: "s1", title: "Agile(애자일) 자격증 취득", isCompleted: true },
      { id: "s2", title: "크로스 펑셔널 프로젝트 리딩", isCompleted: true },
      { id: "s3", title: "주니어 PM 멘토링 경험", isCompleted: false },
      { id: "s4", title: "시니어 포지션 지원하기", isCompleted: false },
    ],
  },
  {
    id: "2",
    title: "데이터 사이언스 역량 강화",
    targetDate: "2025-06-30",
    status: "pending",
    progress: 15,
    steps: [
      { id: "d1", title: "파이썬 데이터 분석 과정 수료", isCompleted: true },
      { id: "d2", title: "고급 SQL 쿼리 마스터", isCompleted: false },
      { id: "d3", title: "포트폴리오 프로젝트 구축", isCompleted: false },
    ],
  },
];

export const MOCK_ANALYSIS: CareerAnalysis = {
  score: 85,
  matchLevel: "High",
  salaryRange: { min: 120000, max: 160000, currency: "USD" },
  marketTrend: "상승세",
  skillsGap: ["고급 SQL 활용 능력", "팀 리더십", "전략적 기획"],
  strengths: ["제품 생애주기 관리", "사용자 리서치", "이해관계자 관리"],
};
