export type ProfileType = "elementary" | "middle" | "high" | "university" | "general";

export type ProfileDataType = {
  type: ProfileType;
  basic_name: string;
  basic_role: string;
  basic_email: string;
  basic_location: string;
  basic_bio: string;
  basic_gender: "male" | "female" | undefined;
  basic_birthDate: Date | null;
  elem_schoolName: string;
  elem_grade: string;
  elem_favoriteSubject: string;
  elem_dislikedSubject: string;
  elem_dreamJob: string;
  elem_strengths: string;
  elem_interests: string;
  elem_hobbies: string;
  elem_concerns: string;
  elem_parentsHope: string;
  mid_schoolName: string;
  mid_grade: string;
  mid_class: string;
  mid_academicScore: string;
  mid_favoriteSubject: string;
  mid_dislikedSubject: string;
  mid_interests: string;
  mid_hobbies: string;
  mid_dreamJob: string;
  mid_highSchoolPlan: string;
  mid_concerns: string;
  mid_strengths: string;
  high_schoolName: string;
  high_grade: string;
  high_class: string;
  high_academicScore: string;
  high_majorTrack: string;
  high_hopeUniversity: string;
  high_careerHope: string;
  high_activityStatus: string;
  high_favoriteSubject: string;
  high_dislikedSubject: string;
  high_mbti: string;
  high_hobbies: string;
  high_studyAbroad: boolean;
  high_concerns: string;
  high_stressLevel: string;
  high_sleepPattern: string;
  high_subject_scores: { korean: string; math: string; english: string; social: string; science: string; history: string; second_lang: string };
  high_balance: { academic: number; activity: number; reading: number; volunteer: number; career: number };
  univ_schoolName: string;
  univ_majorCategory: string;
  univ_majorName: string;
  univ_grade: string;
  univ_semester: string;
  univ_gpa: string;
  univ_languageTests: { id: number; type: string; score: string }[];
  univ_certificates: string;
  univ_concerns: string;
  univ_academicStress: string;
  univ_financialStress: string;
  univ_sleepHours: string;
  univ_mentalWellbeing: string;
  univ_workloadWorkHours: string;
  univ_workloadStudyHours: string;
  univ_belongingScore: string;
  univ_hasSupportPerson: boolean;
  univ_facultyRespect: string;
  univ_classComfort: string;
  univ_servicesUsed: string[];
  univ_serviceBarriers: string;
  univ_careerReadiness: string;
  univ_careerGoalClear: string;
  univ_desiredIndustry: string;
  univ_internshipStatus: string;
  univ_skillsToDevelop: string[];
  gen_currentStatus: string;
  gen_workExperience: WorkExperience[];
  gen_skills: string[];
  gen_prevJobSatisfaction: string;
  gen_reasonForChange: string;
  gen_desiredIndustry: string;
  gen_desiredRole: string;
  gen_workStyle: string;
  gen_workValues: string[];
  gen_salary: number;
  gen_salaryNoPreference: boolean;
  gen_environmentPreferences: string[];
  gen_environmentNoPreference: boolean;
  gen_concerns: string;
};

export type WorkExperience = {
  id: number;
  company: string;
  role: string;
  startDate: Date | null;
  endDate: Date | null;
  description: string;
};

export type LanguageScore = {
  id: number;
  type: string;
  score: string;
};

export const getDefaultProfileData = (type: ProfileType = "general"): ProfileDataType => ({
  type,
  basic_name: "",
  basic_role: "",
  basic_email: "",
  basic_location: "Seoul, South Korea",
  basic_bio: "",
  basic_gender: undefined,
  basic_birthDate: null,
  elem_schoolName: "",
  elem_grade: "",
  elem_favoriteSubject: "",
  elem_dislikedSubject: "",
  elem_dreamJob: "",
  elem_strengths: "",
  elem_interests: "",
  elem_hobbies: "",
  elem_concerns: "",
  elem_parentsHope: "",
  mid_schoolName: "",
  mid_grade: "",
  mid_class: "",
  mid_academicScore: "",
  mid_favoriteSubject: "",
  mid_dislikedSubject: "",
  mid_interests: "",
  mid_hobbies: "",
  mid_dreamJob: "",
  mid_highSchoolPlan: "",
  mid_concerns: "",
  mid_strengths: "",
  high_schoolName: "",
  high_grade: "",
  high_class: "",
  high_academicScore: "",
  high_majorTrack: "",
  high_hopeUniversity: "",
  high_careerHope: "",
  high_activityStatus: "",
  high_favoriteSubject: "",
  high_dislikedSubject: "",
  high_mbti: "",
  high_hobbies: "",
  high_studyAbroad: false,
  high_concerns: "",
  high_stressLevel: "",
  high_sleepPattern: "",
  high_subject_scores: { korean: "", math: "", english: "", social: "", science: "", history: "", second_lang: "" },
  high_balance: { academic: 50, activity: 50, reading: 50, volunteer: 50, career: 50 },
  univ_schoolName: "",
  univ_majorCategory: "",
  univ_majorName: "",
  univ_grade: "",
  univ_semester: "",
  univ_gpa: "",
  univ_languageTests: [],
  univ_certificates: "",
  univ_concerns: "",
  univ_academicStress: "",
  univ_financialStress: "",
  univ_sleepHours: "",
  univ_mentalWellbeing: "",
  univ_workloadWorkHours: "",
  univ_workloadStudyHours: "",
  univ_belongingScore: "",
  univ_hasSupportPerson: false,
  univ_facultyRespect: "",
  univ_classComfort: "",
  univ_servicesUsed: [],
  univ_serviceBarriers: "",
  univ_careerReadiness: "",
  univ_careerGoalClear: "",
  univ_desiredIndustry: "",
  univ_internshipStatus: "",
  univ_skillsToDevelop: [],
  gen_currentStatus: "",
  gen_workExperience: [],
  gen_skills: [],
  gen_prevJobSatisfaction: "",
  gen_reasonForChange: "",
  gen_desiredIndustry: "",
  gen_desiredRole: "",
  gen_workStyle: "",
  gen_workValues: [],
  gen_salary: 5000,
  gen_salaryNoPreference: false,
  gen_environmentPreferences: [],
  gen_environmentNoPreference: false,
  gen_concerns: "",
});

export interface ProfileFormProps {
  profileData: ProfileDataType;
  updateField: <K extends keyof ProfileDataType>(field: K, value: ProfileDataType[K]) => void;
  updateNestedField: <K extends keyof ProfileDataType>(field: K, key: string, value: any) => void;
}
