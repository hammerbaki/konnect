export interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

export interface DailyGoal {
  id: string;
  title: string; // e.g., "Day 1: Study SQL Basics"
  progress: number; // calculated from todos
  todos: Todo[];
}

export interface WeeklyGoal {
  id: string;
  title: string; // e.g., "Week 1: Python Fundamentals"
  progress: number; // calculated from children
  children: DailyGoal[];
}

export interface MonthlyGoal {
  id: string;
  title: string; // e.g., "January: Data Analysis Foundation"
  progress: number;
  children: WeeklyGoal[];
}

export interface HalfYearlyGoal {
  id: string;
  title: string; // e.g., "H1: Technical Skills Acquisition"
  progress: number;
  children: MonthlyGoal[];
}

export interface YearlyGoal {
  id: string;
  title: string; // e.g., "2025: Career Transition Year"
  progress: number;
  children: HalfYearlyGoal[];
}

export interface VisionGoal {
  id: string;
  title: string;
  description: string;
  targetYear: number;
  progress: number;
  children: YearlyGoal[];
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

// Mock Data for the Vision Tree
export const MOCK_VISION: VisionGoal = {
  id: "vision-1",
  title: "CPO (Chief Product Officer)",
  description: "유니콘 기업 규모의 제품 총괄 리더십 확보 및 글로벌 서비스 런칭 경험",
  targetYear: 2028,
  progress: 35,
  children: [
    {
      id: "year-2025",
      title: "2025: 시니어 PM 전환",
      progress: 45,
      children: [
        {
          id: "h1-2025",
          title: "2025 상반기: 핵심 역량 강화",
          progress: 60,
          children: [
            {
              id: "m1-2025",
              title: "1월: 데이터 분석 기초",
              progress: 80,
              children: [
                {
                  id: "w1-m1",
                  title: "1주차: SQL 집중 학습",
                  progress: 100,
                  children: [
                    {
                      id: "d1-w1",
                      title: "Day 1: SELECT/FROM",
                      progress: 100,
                      todos: [
                        { id: "t1", title: "SQL 강의 1-3강 수강", completed: true },
                        { id: "t2", title: "기초 예제 10문제 풀이", completed: true },
                        { id: "t3", title: "학습 내용 블로그 정리", completed: true },
                      ]
                    },
                    {
                      id: "d2-w1",
                      title: "Day 2: WHERE/GROUP BY",
                      progress: 100,
                      todos: [
                        { id: "t4", title: "SQL 강의 4-6강 수강", completed: true },
                        { id: "t5", title: "프로그래머스 Level 1 문제 풀이", completed: true },
                        { id: "t6", title: "실습 데이터셋 쿼리 작성", completed: true },
                      ]
                    }
                  ]
                },
                {
                  id: "w2-m1",
                  title: "2주차: Python 데이터 처리",
                  progress: 60,
                  children: [] // Simplified for brevity
                }
              ]
            },
            {
              id: "m2-2025",
              title: "2월: 제품 지표 설계",
              progress: 40,
              children: []
            }
          ]
        },
        {
          id: "h2-2025",
          title: "2025 하반기: 실무 리딩 경험",
          progress: 20,
          children: []
        }
      ]
    },
    {
      id: "year-2026",
      title: "2026: 헤드급 매니저 성장",
      progress: 10,
      children: []
    },
    {
      id: "year-2027",
      title: "2027: 사업 개발 역량 확보",
      progress: 0,
      children: []
    }
  ]
};

export const MOCK_GOALS: any[] = []; // Deprecated, using MOCK_VISION instead

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
