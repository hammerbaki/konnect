# Konnect Dashboard Data Mapping

This document outlines how user profile data fields map to specific analytics and visualizations on the Staff/Teacher Dashboard.

## 1. High School Dashboard (고등학생)

### A. Academic Performance & Aptitude (학업 및 적성 분석)
| Profile Field | Dashboard Visualization | Purpose |
|--------------|------------------------|---------|
| `high_academicScore` (Avg Grade) | **Academic Performance Trend** (Line Chart) | Track overall academic standing over time. |
| `high_subject_scores` (Korean, Math, Eng, etc.) | **Subject Strength Radar** (Radar Chart) | Identify strong/weak subjects to suggest suitable majors. |
| `high_favoriteSubject` / `high_dislikedSubject` | **Interest vs. Aptitude Matrix** (Scatter/Quadrant) | Compare what they like vs. what they score well in. |

### B. Career Direction & Aspirations (진로 방향성)
| Profile Field | Dashboard Visualization | Purpose |
|--------------|------------------------|---------|
| `high_majorTrack` (Humanities/Sciences/etc.) | **Track Distribution** (Pie Chart) | View student distribution across major tracks. |
| `high_hopeUniversity` & `high_careerHope` | **Goal Gap Analysis** (Text/Bar) | Assess gap between current grades and target university requirements. |
| `high_mbti` | **Personality-Career Fit** (Tag Cloud/Heatmap) | Match student personality types with common successful career paths. |

### C. Student Well-being & Risk Monitoring (생활 및 정서 관리)
> *Note: Restricted access for counseling staff only*
| Profile Field | Dashboard Visualization | Purpose |
|--------------|------------------------|---------|
| `high_stressLevel` | **Stress Level Heatmap** (Color Coded Grid) | Identify students at risk of burnout or high anxiety. |
| `high_sleepPattern` | **Physical Condition Indicator** (Icon/Gauge) | Monitor basic lifestyle stability affecting academic focus. |
| `high_concerns` | **Keyword Analysis** (Word Cloud) | Extract common themes in student worries (e.g., "Grades", "Relationships"). |

---

## 2. University Dashboard (대학생)

### A. Career Readiness & Competency (취업 준비도 및 역량)
| Profile Field | Dashboard Visualization | Purpose |
|--------------|------------------------|---------|
| `univ_careerReadiness` (1-5) | **Career Confidence Index** (Gauge Chart) | Measure subjective readiness for the job market. |
| `univ_careerGoalClear` (1-5) | **Goal Clarity Trends** (Bar Chart) | Track how clear students are about their future path by year. |
| `univ_gpa` / `univ_languageTests` / `univ_certificates` | **Hard Skills Inventory** (Table/Checklist) | Quantify objective qualifications (Spec) status. |
| `univ_internshipStatus` | **Experience Funnel** (Funnel Chart) | Track conversion from "Planning" → "In Progress" → "Completed". |

### B. Resource & Time Management (자원 관리 및 지속가능성)
| Profile Field | Dashboard Visualization | Purpose |
|--------------|------------------------|---------|
| `univ_workloadWorkHours` vs `univ_workloadStudyHours` | **Time Allocation Balance** (Stacked Bar) | Analyze economic burden vs. study time (Work-Study balance). |
| `univ_academicStress` / `univ_financialStress` | **Barrier Analysis** (Multi-Bar Chart) | Identify primary blockers to career preparation (Money vs. Study Load). |
| `univ_mentalWellbeing` (Energy Level) | **Burnout Risk Monitor** (Traffic Light System) | Flag students needing immediate counseling support. |

### C. Engagement & Support Network (교내 활동 및 네트워크)
| Profile Field | Dashboard Visualization | Purpose |
|--------------|------------------------|---------|
| `univ_belongingScore` | **Institutional Bond Score** (Line Chart) | Measure retention risk and school engagement. |
| `univ_hasSupportPerson` (Mentor/Friend) | **Social Capital Indicator** (Pie Chart) | Percentage of students with/without a support system. |
| `univ_servicesUsed` | **Resource Effectiveness** (Bar Chart) | Track which support centers (Career, Counseling, etc.) are most utilized. |
| `univ_skillsToDevelop` | **Skills Demand Map** (Treemap) | Identify which training programs or workshops the school should open next. |
