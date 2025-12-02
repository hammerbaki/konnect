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
  recommendedRoles: {
    title: string;
    matchScore: number;
    description: string;
    requirements: string[];
    salary: string;
  }[];
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
  recommendedRoles: [
    {
      title: "시니어 프로덕트 매니저",
      matchScore: 92,
      description: "제품의 전체 라이프사이클을 주도하고 비즈니스 목표 달성을 위한 전략을 수립합니다.",
      requirements: ["5년 이상의 PM 경력", "데이터 분석 능력", "Agile 방법론 숙련"],
      salary: "₩8,000 ~ 12,000만"
    },
    {
      title: "프로덕트 오너 (PO)",
      matchScore: 85,
      description: "개발 팀과 밀접하게 협업하며 백로그를 관리하고 제품 가치를 극대화합니다.",
      requirements: ["CSPO 자격증 우대", "JIRA/Confluence 숙련", "기술적 이해도"],
      salary: "₩7,000 ~ 10,000만"
    },
    {
      title: "전략 기획 매니저",
      matchScore: 78,
      description: "회사의 장기적인 성장 전략을 수립하고 신규 사업 기회를 발굴합니다.",
      requirements: ["컨설팅 경험 우대", "재무 모델링 능력", "시장 분석 역량"],
      salary: "₩7,500 ~ 11,000만"
    }
  ]
};
