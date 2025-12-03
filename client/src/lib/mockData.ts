
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

export interface DailyGoal {
  id: string;
  title: string; // e.g., "Day 1"
  date?: string;
  dateDisplay?: string; // YYYY.MM.DD
  progress: number; // calculated from todos
  todos: Todo[];
}

export interface WeeklyGoal {
  id: string;
  title: string; // e.g., "Week 1"
  description?: string;
  dateDisplay?: string; // MM.DD-MM.DD
  progress: number; // calculated from children
  children: DailyGoal[];
}

export interface MonthlyGoal {
  id: string;
  title: string; // e.g., "January"
  description?: string;
  dateDisplay?: string; // MM
  progress: number;
  children: WeeklyGoal[];
}

export interface HalfYearlyGoal {
  id: string;
  title: string; // e.g., "H1"
  description?: string;
  dateDisplay?: string; // MM-MM
  progress: number;
  children: MonthlyGoal[];
}

export interface YearlyGoal {
  id: string;
  title: string; // e.g., "2025"
  description?: string;
  dateDisplay?: string; // YYYY
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

export function generateTree(idSuffix: string, title: string, targetYear: number, startYear: number = new Date().getFullYear()): VisionGoal {
    const vision: VisionGoal = {
        id: `vision-${idSuffix}`,
        title: title,
        description: "유니콘 기업 규모의 제품 총괄 리더십 확보 및 글로벌 서비스 런칭 경험",
        targetYear: targetYear,
        progress: 0,
        children: []
    };

    const yearlyDescriptions = ["시니어 PM 전환 및 핵심 역량 확보", "헤드급 매니저 성장 및 팀 리딩", "사업 개발 역량 및 창업 준비"];
    const halfYearlyDescriptions = ["기초 역량 강화 및 자격증 취득", "실무 프로젝트 리딩 및 성과 창출"];
    const monthlyDescriptions = [
        "데이터 분석 기초 다지기", "제품 지표 설계 및 분석", "사용자 리서치 심화", 
        "A/B 테스트 설계 및 실행", "서비스 기획 및 문서화", "MVP 출시 및 운영"
    ];
    const weeklyDescriptions = ["SQL 문법 마스터", "Python 데이터 분석", "Tableau 시각화", "지표 대시보드 구축"];

    // 3 Years
    for (let y = 0; y < 3; y++) {
        const yearVal = startYear + y;
        const year: YearlyGoal = {
            id: `year-${yearVal}-${idSuffix}`,
            title: `${yearVal}년`,
            description: yearlyDescriptions[y] || "커리어 성장 목표 달성",
            dateDisplay: `${yearVal}`,
            progress: 0,
            children: []
        };

        // 2 Half Years per Year
        for (let h = 1; h <= 2; h++) {
            const halfStartMonth = h === 1 ? 1 : 7;
            const halfEndMonth = h === 1 ? 6 : 12;
            const half: HalfYearlyGoal = {
                id: `h${h}-${yearVal}-${idSuffix}`,
                title: `${yearVal}년 ${h === 1 ? "상반기" : "하반기"}`,
                description: halfYearlyDescriptions[h-1] || "반기별 핵심 성과 달성",
                dateDisplay: `${String(halfStartMonth).padStart(2, '0')}-${String(halfEndMonth).padStart(2, '0')}`,
                progress: 0,
                children: []
            };

            // 6 Months per Half Year
            for (let m = 1; m <= 6; m++) {
                const monthNum = (h - 1) * 6 + m;
                const month: MonthlyGoal = {
                    id: `m${monthNum}-${yearVal}-${idSuffix}`,
                    title: `${monthNum}월`,
                    description: monthlyDescriptions[(m-1) % monthlyDescriptions.length],
                    dateDisplay: `${String(monthNum).padStart(2, '0')}`,
                    progress: 0,
                    children: []
                };

                // 4 Weeks per Month
                for (let w = 1; w <= 4; w++) {
                    const weekStartDay = (w - 1) * 7 + 1;
                    const weekEndDay = w * 7;
                    
                    const week: WeeklyGoal = {
                        id: `w${w}-m${monthNum}-${yearVal}-${idSuffix}`,
                        title: `${w}주차`,
                        description: weeklyDescriptions[(w-1) % weeklyDescriptions.length],
                        dateDisplay: `${String(monthNum).padStart(2, '0')}.${String(weekStartDay).padStart(2, '0')}-${String(monthNum).padStart(2, '0')}.${String(weekEndDay).padStart(2, '0')}`,
                        progress: 0,
                        children: []
                    };

                    // 7 Days per Week
                    for (let d = 1; d <= 7; d++) {
                        const dayNum = (w - 1) * 7 + d;
                        const day: DailyGoal = {
                            id: `d${d}-w${w}-m${monthNum}-${yearVal}-${idSuffix}`,
                            title: `Day ${d}`,
                            dateDisplay: `${yearVal}.${String(monthNum).padStart(2, '0')}.${String(dayNum).padStart(2, '0')}`,
                            progress: 0,
                            todos: [
                                { id: `t1-${d}-${idSuffix}`, title: "핵심 과제 수행", completed: false },
                                { id: `t2-${d}-${idSuffix}`, title: "학습 내용 정리", completed: false },
                                { id: `t3-${d}-${idSuffix}`, title: "다음 단계 계획", completed: false }
                            ]
                        };
                        week.children.push(day);
                    }
                    month.children.push(week);
                }
                half.children.push(month);
            }
            year.children.push(half);
        }
        vision.children.push(year);
    }
    
    // Random progress for demo
    if (idSuffix === '1') {
        const demoWeek = vision.children[0].children[0].children[0].children[0];
        if (demoWeek && demoWeek.children[0]) {
            demoWeek.children[0].progress = 66;
            demoWeek.children[0].todos[0].completed = true;
            demoWeek.children[0].todos[1].completed = true;
        }
        vision.children[0].children[0].children[0].children[0].progress = 30; 
        vision.children[0].children[0].children[0].progress = 10;
        vision.children[0].children[0].progress = 5;
        vision.children[0].progress = 2;
        vision.progress = 1;
    }

    return vision;
}

export const MOCK_VISION = generateTree('1', "CPO (Chief Product Officer)", 2028);

export const MOCK_VISIONS = [
    MOCK_VISION,
    generateTree('2', "Global Tech Lead", 2030),
    generateTree('3', "Startup Founder", 2027)
];

export const MOCK_GOALS: any[] = []; 

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