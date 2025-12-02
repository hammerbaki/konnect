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
  marketTrend: "Rising" | "Stable" | "Declining";
  skillsGap: string[];
  strengths: string[];
}

export interface UserProfile {
  name: string;
  email: string;
  token: string;
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
    title: "Senior Product Manager Transition",
    targetDate: "2025-12-31",
    status: "in-progress",
    progress: 45,
    steps: [
      { id: "s1", title: "Complete Agile Certification", isCompleted: true },
      { id: "s2", title: "Lead Cross-functional Project", isCompleted: true },
      { id: "s3", title: "Mentor Junior PM", isCompleted: false },
      { id: "s4", title: "Apply for Senior Roles", isCompleted: false },
    ],
  },
  {
    id: "2",
    title: "Data Science Proficiency",
    targetDate: "2025-06-30",
    status: "pending",
    progress: 15,
    steps: [
      { id: "d1", title: "Python for Data Science Course", isCompleted: true },
      { id: "d2", title: "SQL Advanced Mastery", isCompleted: false },
      { id: "d3", title: "Build Portfolio Project", isCompleted: false },
    ],
  },
];

export const MOCK_ANALYSIS: CareerAnalysis = {
  score: 85,
  matchLevel: "High",
  salaryRange: { min: 120000, max: 160000, currency: "USD" },
  marketTrend: "Rising",
  skillsGap: ["Advanced SQL", "Team Leadership", "Strategic Planning"],
  strengths: ["Product Lifecycle", "User Research", "Stakeholder Management"],
};
