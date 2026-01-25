import { 
  EXTENDED_DIAGNOSIS_MAP, 
  QuestionMapping,
  RIASEC_LABELS,
  RIASEC_DESCRIPTIONS,
  WORK_STYLE_LABELS,
  TEMPERAMENT_LABELS 
} from "@/constants/extendedDiagnosisMap";

interface KJobsQuestion {
  id: string;
  questionNumber: number;
  questionText: string;
  questionType: "likert" | "forced_choice";
  optionA: string | null;
  optionB: string | null;
}

export interface RIASECResult {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
  top3: string[];
  code: string;
  narrative: string;
}

export interface WorkStyleAxis {
  leftLabel: string;
  rightLabel: string;
  left: number;
  right: number;
  verdict: string;
}

export interface WorkStyle4Result {
  axis1: WorkStyleAxis;
  axis2: WorkStyleAxis;
  axis3: WorkStyleAxis;
  axis4: WorkStyleAxis;
  narrative: string;
}

export interface Temperament4Result {
  novelty: number;
  stability: number;
  persistence: number;
  sensitivity: number;
  narrative: string;
}

export interface EvidenceHighlight {
  questionId: string;
  questionText: string;
  answer: string;
  affected: string[];
  note: string;
}

export interface ExtendedResult {
  riasec: RIASECResult;
  workStyle4: WorkStyle4Result;
  temperament4: Temperament4Result;
  evidence: {
    highlights: EvidenceHighlight[];
    caution: string;
  };
  quality: {
    warnings: string[];
    coverage: { riasec: number; work: number; temp: number };
  };
}

function normalizeAnswer(answer: number | string, questionType: "likert" | "forced_choice", reverse: boolean): number {
  let norm: number;
  if (questionType === "likert") {
    norm = (Number(answer) - 1) / 4;
  } else {
    norm = answer === "A" ? 1 : 0;
  }
  return reverse ? 1 - norm : norm;
}

function calculateAxisVerdict(left: number, right: number, leftLabel: string, rightLabel: string): string {
  const diff = Math.abs(left - right);
  if (diff < 12) return "균형형";
  return left > right ? leftLabel : rightLabel;
}

export function getExtendedResult(
  questions: KJobsQuestion[],
  answers: Record<string, number | string>
): ExtendedResult {
  const riasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const riasecMax = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  
  const workScores = {
    axis1_left: 0, axis1_right: 0,
    axis2_left: 0, axis2_right: 0,
    axis3_left: 0, axis3_right: 0,
    axis4_left: 0, axis4_right: 0,
  };
  const workMax = { ...workScores };
  
  const tempScores = { novelty: 0, stability: 0, persistence: 0, sensitivity: 0 };
  const tempMax = { ...tempScores };
  
  const questionContributions: Array<{
    questionId: string;
    questionText: string;
    answer: string;
    norm: number;
    affected: string[];
    contributions: Record<string, number>;
  }> = [];
  
  const scaleQuestionCounts = {
    riasec: new Set<string>(),
    work: new Set<string>(),
    temp: new Set<string>(),
  };

  for (const question of questions) {
    const answer = answers[question.id];
    if (answer === undefined) continue;
    
    const qNum = question.questionNumber.toString();
    const mapping: QuestionMapping = EXTENDED_DIAGNOSIS_MAP[qNum] || {};
    const norm = normalizeAnswer(answer, question.questionType, mapping.reverse || false);
    
    const affected: string[] = [];
    const contributions: Record<string, number> = {};
    
    if (mapping.riasec) {
      scaleQuestionCounts.riasec.add(qNum);
      for (const [key, weight] of Object.entries(mapping.riasec)) {
        if (weight) {
          const k = key as keyof typeof riasecScores;
          riasecScores[k] += norm * weight;
          riasecMax[k] += weight;
          affected.push(k);
          contributions[k] = norm * weight;
        }
      }
    }
    
    if (mapping.work) {
      scaleQuestionCounts.work.add(qNum);
      for (const [key, weight] of Object.entries(mapping.work)) {
        if (weight) {
          const k = key as keyof typeof workScores;
          workScores[k] += norm * weight;
          workMax[k] += weight;
          affected.push(key);
          contributions[key] = norm * weight;
        }
      }
    }
    
    if (mapping.temp) {
      scaleQuestionCounts.temp.add(qNum);
      for (const [key, weight] of Object.entries(mapping.temp)) {
        if (weight) {
          const k = key as keyof typeof tempScores;
          tempScores[k] += norm * weight;
          tempMax[k] += weight;
          affected.push(key);
          contributions[key] = norm * weight;
        }
      }
    }
    
    if (affected.length > 0) {
      questionContributions.push({
        questionId: question.id,
        questionText: question.questionText,
        answer: String(answer),
        norm,
        affected,
        contributions,
      });
    }
  }
  
  const normalizedRiasec: Record<string, number> = {};
  for (const key of ["R", "I", "A", "S", "E", "C"] as const) {
    normalizedRiasec[key] = riasecMax[key] > 0 
      ? Math.round((riasecScores[key] / riasecMax[key]) * 100) 
      : 50;
  }
  
  const sortedRiasec = Object.entries(normalizedRiasec)
    .sort((a, b) => b[1] - a[1]);
  const top3 = sortedRiasec.slice(0, 3).map(([k]) => k);
  const riasecCode = top3.join("-");
  
  const riasecNarrative = `당신의 직무성향 코드는 ${riasecCode}입니다. ` +
    `${RIASEC_LABELS[top3[0]]}이 가장 높게 나타났으며, ` +
    `${RIASEC_DESCRIPTIONS[top3[0]]}`;
  
  function normalizeWorkAxis(leftKey: keyof typeof workScores, rightKey: keyof typeof workScores) {
    const leftRaw = workMax[leftKey] > 0 ? (workScores[leftKey] / workMax[leftKey]) * 100 : 50;
    const rightRaw = workMax[rightKey] > 0 ? (workScores[rightKey] / workMax[rightKey]) * 100 : 50;
    return { left: Math.round(leftRaw), right: Math.round(rightRaw) };
  }
  
  const axis1 = normalizeWorkAxis("axis1_left", "axis1_right");
  const axis2 = normalizeWorkAxis("axis2_left", "axis2_right");
  const axis3 = normalizeWorkAxis("axis3_left", "axis3_right");
  const axis4 = normalizeWorkAxis("axis4_left", "axis4_right");
  
  const axis1Verdict = calculateAxisVerdict(axis1.left, axis1.right, WORK_STYLE_LABELS.axis1.left, WORK_STYLE_LABELS.axis1.right);
  const axis2Verdict = calculateAxisVerdict(axis2.left, axis2.right, WORK_STYLE_LABELS.axis2.left, WORK_STYLE_LABELS.axis2.right);
  const axis3Verdict = calculateAxisVerdict(axis3.left, axis3.right, WORK_STYLE_LABELS.axis3.left, WORK_STYLE_LABELS.axis3.right);
  const axis4Verdict = calculateAxisVerdict(axis4.left, axis4.right, WORK_STYLE_LABELS.axis4.left, WORK_STYLE_LABELS.axis4.right);

  const workStyle4: WorkStyle4Result = {
    axis1: {
      leftLabel: WORK_STYLE_LABELS.axis1.left,
      rightLabel: WORK_STYLE_LABELS.axis1.right,
      ...axis1,
      verdict: axis1Verdict,
    },
    axis2: {
      leftLabel: WORK_STYLE_LABELS.axis2.left,
      rightLabel: WORK_STYLE_LABELS.axis2.right,
      ...axis2,
      verdict: axis2Verdict,
    },
    axis3: {
      leftLabel: WORK_STYLE_LABELS.axis3.left,
      rightLabel: WORK_STYLE_LABELS.axis3.right,
      ...axis3,
      verdict: axis3Verdict,
    },
    axis4: {
      leftLabel: WORK_STYLE_LABELS.axis4.left,
      rightLabel: WORK_STYLE_LABELS.axis4.right,
      ...axis4,
      verdict: axis4Verdict,
    },
    narrative: `업무 스타일 분석 결과, ${axis1Verdict}, ${axis2Verdict}, ${axis3Verdict}, ${axis4Verdict} 성향이 나타났습니다.`,
  };
  
  const normalizedTemp: Record<string, number> = {};
  for (const key of ["novelty", "stability", "persistence", "sensitivity"] as const) {
    normalizedTemp[key] = tempMax[key] > 0 
      ? Math.round((tempScores[key] / tempMax[key]) * 100) 
      : 50;
  }
  
  const tempHighest = Object.entries(normalizedTemp)
    .sort((a, b) => b[1] - a[1])[0];
  
  const temperament4: Temperament4Result = {
    novelty: normalizedTemp.novelty,
    stability: normalizedTemp.stability,
    persistence: normalizedTemp.persistence,
    sensitivity: normalizedTemp.sensitivity,
    narrative: `직무기질 분석에서 ${TEMPERAMENT_LABELS[tempHighest[0]]} 특성이 상대적으로 높게 나타났습니다.`,
  };
  
  const sortedContributions = questionContributions
    .sort((a, b) => {
      const aSum = Object.values(a.contributions).reduce((s, v) => s + Math.abs(v), 0);
      const bSum = Object.values(b.contributions).reduce((s, v) => s + Math.abs(v), 0);
      return bSum - aSum;
    })
    .slice(0, 6);
  
  const highlights: EvidenceHighlight[] = sortedContributions.map(c => ({
    questionId: c.questionId,
    questionText: c.questionText,
    answer: c.answer,
    affected: c.affected,
    note: `이 응답이 ${c.affected.slice(0, 2).join(", ")} 성향 점수에 영향을 주었습니다.`,
  }));
  
  const warnings: string[] = [];
  if (scaleQuestionCounts.riasec.size < 10) {
    warnings.push("RIASEC 분석에 사용된 문항 수가 적어 정확도가 낮을 수 있습니다.");
  }
  if (scaleQuestionCounts.work.size < 8) {
    warnings.push("업무성향 분석에 사용된 문항 수가 적어 정확도가 낮을 수 있습니다.");
  }
  if (scaleQuestionCounts.temp.size < 6) {
    warnings.push("직무기질 분석에 사용된 문항 수가 적어 정확도가 낮을 수 있습니다.");
  }
  
  return {
    riasec: {
      ...normalizedRiasec as { R: number; I: number; A: number; S: number; E: number; C: number },
      top3,
      code: riasecCode,
      narrative: riasecNarrative,
    },
    workStyle4,
    temperament4,
    evidence: {
      highlights,
      caution: "본 결과는 진로상담 참고자료이며 임상/심리진단이 아닙니다.",
    },
    quality: {
      warnings,
      coverage: {
        riasec: Math.min(scaleQuestionCounts.riasec.size / 20, 1),
        work: Math.min(scaleQuestionCounts.work.size / 16, 1),
        temp: Math.min(scaleQuestionCounts.temp.size / 12, 1),
      },
    },
  };
}
