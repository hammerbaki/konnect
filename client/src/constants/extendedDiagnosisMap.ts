export interface QuestionMapping {
  riasec?: { R?: number; I?: number; A?: number; S?: number; E?: number; C?: number };
  work?: { 
    axis1_left?: number; axis1_right?: number;
    axis2_left?: number; axis2_right?: number;
    axis3_left?: number; axis3_right?: number;
    axis4_left?: number; axis4_right?: number;
  };
  temp?: { novelty?: number; stability?: number; persistence?: number; sensitivity?: number };
  reverse?: boolean;
}

export const EXTENDED_DIAGNOSIS_MAP: Record<string, QuestionMapping> = {
  "1": { riasec: { R: 1 }, work: { axis1_left: 0.5 }, temp: {}, reverse: false },
  "2": { riasec: { I: 1 }, work: { axis2_right: 0.5 }, temp: { persistence: 0.3 }, reverse: false },
  "3": { riasec: { A: 1 }, work: { axis2_right: 0.5 }, temp: { novelty: 0.3 }, reverse: false },
  "4": { riasec: { S: 1 }, work: { axis1_left: 0.5, axis3_right: 0.3 }, temp: { sensitivity: 0.3 }, reverse: false },
  "5": { riasec: { E: 1 }, work: { axis1_left: 0.5 }, temp: {}, reverse: false },
  "6": { riasec: { C: 1 }, work: { axis4_left: 0.5 }, temp: { stability: 0.3 }, reverse: false },
  "7": { riasec: { R: 0.5 }, work: { axis4_left: 0.3 }, temp: { persistence: 0.3 }, reverse: false },
  "8": { riasec: { I: 0.5 }, work: { axis2_right: 0.3 }, temp: {}, reverse: false },
  "9": { riasec: { A: 0.5 }, work: { axis4_right: 0.3 }, temp: { novelty: 0.3 }, reverse: false },
  "10": { riasec: { S: 0.5 }, work: { axis3_right: 0.3 }, temp: { sensitivity: 0.3 }, reverse: false },
  "11": { riasec: { E: 0.5 }, work: { axis1_left: 0.3 }, temp: {}, reverse: false },
  "12": { riasec: { C: 0.5 }, work: { axis4_left: 0.3 }, temp: { stability: 0.3 }, reverse: false },
  "13": { riasec: { R: 1 }, work: { axis1_right: 0.5 }, temp: { persistence: 0.3 }, reverse: false },
  "14": { riasec: { I: 1 }, work: { axis2_right: 0.5 }, temp: {}, reverse: false },
  "15": { riasec: { A: 1 }, work: { axis4_right: 0.5 }, temp: { novelty: 0.5 }, reverse: false },
  "16": { riasec: { S: 1 }, work: { axis1_left: 0.5 }, temp: { sensitivity: 0.5 }, reverse: false },
  "17": { riasec: { E: 1 }, work: { axis1_left: 0.5 }, temp: {}, reverse: false },
  "18": { riasec: { C: 1 }, work: { axis4_left: 0.5 }, temp: { stability: 0.5 }, reverse: false },
  "19": { riasec: { R: 0.5, I: 0.5 }, work: { axis2_left: 0.3 }, temp: {}, reverse: false },
  "20": { riasec: { A: 0.5, S: 0.5 }, work: { axis3_right: 0.3 }, temp: { sensitivity: 0.3 }, reverse: false },
  "21": { riasec: { E: 0.5, C: 0.5 }, work: { axis4_left: 0.3 }, temp: {}, reverse: false },
  "22": { riasec: { R: 1 }, work: { axis1_right: 0.5 }, temp: { persistence: 0.3 }, reverse: false },
  "23": { riasec: { I: 1 }, work: { axis2_right: 0.5 }, temp: {}, reverse: false },
  "24": { riasec: { A: 1 }, work: { axis4_right: 0.5 }, temp: { novelty: 0.3 }, reverse: false },
  "25": { riasec: { S: 1 }, work: { axis3_right: 0.5 }, temp: { sensitivity: 0.3 }, reverse: false },
  "26": { riasec: { E: 1 }, work: { axis1_left: 0.5 }, temp: {}, reverse: false },
  "27": { riasec: { C: 1 }, work: { axis4_left: 0.5 }, temp: { stability: 0.3 }, reverse: false },
  "28": { riasec: { R: 0.5 }, work: { axis2_left: 0.3 }, temp: {}, reverse: false },
  "29": { riasec: { I: 0.5 }, work: { axis2_right: 0.3 }, temp: {}, reverse: false },
  "30": { riasec: { A: 0.5 }, work: { axis4_right: 0.3 }, temp: { novelty: 0.3 }, reverse: false },
  "31": { riasec: { S: 0.5 }, work: { axis1_left: 0.3, axis3_right: 0.3 }, temp: {}, reverse: false },
  "32": { riasec: { E: 0.5 }, work: { axis1_left: 0.3 }, temp: {}, reverse: false },
  "33": { riasec: { C: 0.5 }, work: { axis4_left: 0.3 }, temp: { persistence: 0.3 }, reverse: false },
  "34": { riasec: { R: 1 }, work: { axis1_right: 0.5 }, temp: {}, reverse: false },
  "35": { riasec: { I: 1 }, work: { axis2_right: 0.5 }, temp: {}, reverse: false },
  "36": { riasec: { A: 1 }, work: { axis4_right: 0.5 }, temp: { novelty: 0.5 }, reverse: false },
  "37": { riasec: { S: 1 }, work: { axis3_right: 0.5 }, temp: { sensitivity: 0.5 }, reverse: false },
  "38": { riasec: { E: 1 }, work: { axis1_left: 0.5 }, temp: {}, reverse: false },
  "39": { riasec: { C: 1 }, work: { axis4_left: 0.5 }, temp: { stability: 0.5 }, reverse: false },
  "40": { riasec: { R: 0.5, C: 0.5 }, work: { axis4_left: 0.3 }, temp: { persistence: 0.3 }, reverse: false },
  "41": { riasec: { I: 0.5, A: 0.5 }, work: { axis2_right: 0.3 }, temp: { novelty: 0.3 }, reverse: false },
  "42": { riasec: { S: 0.5, E: 0.5 }, work: { axis1_left: 0.3 }, temp: {}, reverse: false },
  "43": { riasec: { R: 1 }, work: { axis1_right: 0.5 }, temp: {}, reverse: false },
  "44": { riasec: { I: 1 }, work: { axis2_right: 0.5 }, temp: {}, reverse: false },
  "45": { riasec: { A: 1 }, work: { axis4_right: 0.5 }, temp: { novelty: 0.3 }, reverse: false },
  "46": { riasec: { S: 1 }, work: { axis3_right: 0.5 }, temp: { sensitivity: 0.3 }, reverse: false },
  "47": { riasec: { E: 1 }, work: { axis1_left: 0.5 }, temp: {}, reverse: false },
  "48": { riasec: { C: 1 }, work: { axis4_left: 0.5 }, temp: { stability: 0.3 }, reverse: false },
  "49": { riasec: { R: 0.5 }, work: { axis2_left: 0.3 }, temp: { persistence: 0.3 }, reverse: false },
  "50": { riasec: { I: 0.5 }, work: { axis2_right: 0.3 }, temp: {}, reverse: false },
  "51": { riasec: { A: 0.5 }, work: { axis4_right: 0.3 }, temp: { novelty: 0.3 }, reverse: false },
  "52": { riasec: { S: 0.5 }, work: { axis1_left: 0.3 }, temp: { sensitivity: 0.3 }, reverse: false },
  "53": { riasec: { E: 0.5 }, work: { axis1_left: 0.3 }, temp: {}, reverse: false },
  "54": { riasec: { C: 0.5 }, work: { axis4_left: 0.3 }, temp: { stability: 0.3 }, reverse: false },
  "55": { riasec: { R: 1 }, work: { axis1_right: 0.5 }, temp: {}, reverse: false },
  "56": { riasec: { I: 1 }, work: { axis2_right: 0.5, axis3_left: 0.3 }, temp: {}, reverse: false },
  "57": { riasec: { A: 1 }, work: { axis4_right: 0.5 }, temp: { novelty: 0.5 }, reverse: false },
  "58": { riasec: { S: 1 }, work: { axis3_right: 0.5 }, temp: { sensitivity: 0.5 }, reverse: false },
  "59": { riasec: { E: 1 }, work: { axis1_left: 0.5 }, temp: {}, reverse: false },
  "60": { riasec: { C: 1 }, work: { axis4_left: 0.5 }, temp: { stability: 0.5, persistence: 0.3 }, reverse: false },
  "61": { riasec: { R: 0.5, I: 0.5 }, work: { axis2_left: 0.3 }, temp: {}, reverse: false },
  "62": { riasec: { A: 0.5, E: 0.5 }, work: { axis1_left: 0.3 }, temp: { novelty: 0.3 }, reverse: false },
  "63": { riasec: { S: 0.5, C: 0.5 }, work: { axis4_left: 0.3 }, temp: {}, reverse: false },
  "64": { riasec: { R: 1 }, work: { axis1_right: 0.5 }, temp: { persistence: 0.3 }, reverse: false },
  "65": { riasec: { I: 1 }, work: { axis2_right: 0.5 }, temp: {}, reverse: false },
  "66": { riasec: { A: 1 }, work: { axis4_right: 0.5 }, temp: { novelty: 0.3 }, reverse: false },
  "67": { riasec: { S: 1 }, work: { axis3_right: 0.5 }, temp: { sensitivity: 0.3 }, reverse: false },
  "68": { riasec: { E: 1 }, work: { axis1_left: 0.5 }, temp: {}, reverse: false },
  "69": { riasec: { C: 1 }, work: { axis4_left: 0.5 }, temp: { stability: 0.3 }, reverse: false },
  "70": { riasec: { R: 0.5 }, work: { axis2_left: 0.3 }, temp: {}, reverse: false },
  "71": { riasec: { I: 0.5 }, work: { axis2_right: 0.3 }, temp: {}, reverse: false },
  "72": { riasec: { A: 0.5 }, work: { axis4_right: 0.3 }, temp: { novelty: 0.3 }, reverse: false },
  "73": { riasec: { S: 0.5 }, work: { axis1_left: 0.3 }, temp: { sensitivity: 0.3 }, reverse: false },
  "74": { riasec: { E: 0.5 }, work: { axis1_left: 0.3 }, temp: {}, reverse: false },
  "75": { riasec: { C: 0.5 }, work: { axis4_left: 0.3 }, temp: { persistence: 0.3 }, reverse: false },
  "76": { riasec: { R: 1, C: 0.5 }, work: { axis4_left: 0.5 }, temp: { persistence: 0.5 }, reverse: false },
  "77": { riasec: { I: 1, A: 0.5 }, work: { axis2_right: 0.5 }, temp: { novelty: 0.3 }, reverse: false },
  "78": { riasec: { S: 1, E: 0.5 }, work: { axis1_left: 0.5, axis3_right: 0.3 }, temp: { sensitivity: 0.3 }, reverse: false },
  "79": { riasec: { A: 1, S: 0.5 }, work: { axis3_right: 0.5 }, temp: { sensitivity: 0.5, novelty: 0.3 }, reverse: false },
  "80": { riasec: { E: 1, C: 0.5 }, work: { axis4_left: 0.3 }, temp: { stability: 0.3 }, reverse: false },
};

export const RIASEC_LABELS: Record<string, string> = {
  R: "현실형 (Realistic)",
  I: "탐구형 (Investigative)",
  A: "예술형 (Artistic)",
  S: "사회형 (Social)",
  E: "진취형 (Enterprising)",
  C: "관습형 (Conventional)",
};

export const RIASEC_DESCRIPTIONS: Record<string, string> = {
  R: "실용적이고 손으로 직접 하는 활동을 선호합니다",
  I: "분석적이고 탐구하는 활동을 선호합니다",
  A: "창의적이고 예술적인 표현을 선호합니다",
  S: "사람을 돕고 협력하는 활동을 선호합니다",
  E: "리더십을 발휘하고 설득하는 활동을 선호합니다",
  C: "체계적이고 정확한 업무를 선호합니다",
};

export const WORK_STYLE_LABELS = {
  axis1: { left: "대인 중심", right: "개인 몰입" },
  axis2: { left: "사실/경험", right: "아이디어/가능성" },
  axis3: { left: "논리 기반", right: "공감/가치" },
  axis4: { left: "구조/계획", right: "유연/즉흥" },
};

export const TEMPERAMENT_LABELS: Record<string, string> = {
  novelty: "변화선호",
  stability: "안정선호",
  persistence: "지속력",
  sensitivity: "대인민감도",
};
