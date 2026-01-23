export interface CareerActions {
    portfolio: string[];
    networking: string[];
    mindset: string[];
}

export interface SalaryRange {
    level: string;
    min: number;
    max: number;
}

export interface JobDemandData {
    last30Days?: number;
    last90Days?: number;
    changeRate?: number;
    topRegions?: string[];
    topSkills?: string[];
}

export interface CompetencyEvidence {
    subject: string;
    score: number;
    evidences: string[];
}

export interface StrengthWeaknessItem {
    summary: string;
    evidences: string[];
    recommendedAction?: string;
}

export interface CareerRecommendation {
    title: string;
    description: string;
    matchScore: number;
    salary: string;
    salaryRanges?: SalaryRange[];
    jobOutlook: string;
    jobDemand?: JobDemandData;
    jobSummary?: string;
    coreTasks?: string[];
    requiredSkills?: string[];
    entryPath?: string[];
    competencies: Array<{ subject: string; A: number; fullMark: number }>;
    competencyEvidences?: CompetencyEvidence[];
    strengths: string[];
    strengthDetails?: StrengthWeaknessItem[];
    weaknesses: string[];
    weaknessDetails?: StrengthWeaknessItem[];
    majorFit?: { majorName: string; fitReasons: string[] };
    recommendedCerts?: { name: string; type: 'required' | 'preferred' | 'alternative'; relatedSkill: string }[];
    actions: CareerActions;
}
