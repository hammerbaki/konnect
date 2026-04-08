export const APTITUDE_QUESTIONS = [
  { id: 1,  text: "자연현상이나 과학적 원리에 호기심이 많다",                       category: "interest",  key: "SCI"      },
  { id: 2,  text: "실험이나 탐구 활동을 즐긴다",                                    category: "interest",  key: "SCI"      },
  { id: 3,  text: "기계나 장치가 어떻게 작동하는지 알고 싶다",                      category: "interest",  key: "ENG"      },
  { id: 4,  text: "수학·물리를 활용한 문제 해결에 흥미가 있다",                     category: "interest",  key: "ENG"      },
  { id: 5,  text: "사람들의 건강과 질병에 관심이 많다",                              category: "interest",  key: "MED"      },
  { id: 6,  text: "아픈 사람을 돌보거나 치료하는 일에 보람을 느낀다",               category: "interest",  key: "MED"      },
  { id: 7,  text: "경제나 경영 분야 뉴스에 관심이 있다",                            category: "interest",  key: "BIZ"      },
  { id: 8,  text: "어떤 일을 효율적으로 기획하고 조직하는 걸 좋아한다",             category: "interest",  key: "BIZ"      },
  { id: 9,  text: "규칙·제도·법에 관심이 있고 공정함을 중시한다",                   category: "interest",  key: "LAW"      },
  { id: 10, text: "토론이나 논쟁에서 내 주장을 논리적으로 펼치는 걸 좋아한다",      category: "interest",  key: "LAW"      },
  { id: 11, text: "지식을 전달하거나 가르치는 것이 즐겁다",                          category: "interest",  key: "EDU"      },
  { id: 12, text: "어린이나 청소년의 성장과 발달에 관심이 많다",                    category: "interest",  key: "EDU"      },
  { id: 13, text: "그림·음악·글쓰기 등 예술적 표현 활동을 즐긴다",                 category: "interest",  key: "ART"      },
  { id: 14, text: "새로운 디자인이나 아이디어를 만들어내는 것이 좋다",              category: "interest",  key: "ART"      },
  { id: 15, text: "프로그래밍이나 디지털 기술에 흥미가 있다",                       category: "interest",  key: "IT"       },
  { id: 16, text: "데이터나 알고리즘으로 문제를 해결하는 게 재미있다",              category: "interest",  key: "IT"       },
  { id: 17, text: "사회 문제나 불평등에 관심이 많고 변화를 만들고 싶다",            category: "interest",  key: "SOC"      },
  { id: 18, text: "봉사·복지·상담 등 사람을 돕는 활동에 보람을 느낀다",            category: "interest",  key: "SOC"      },
  { id: 19, text: "글쓰기나 말하기로 내 생각을 잘 표현할 수 있다",                 category: "aptitude",  key: "VERBAL"   },
  { id: 20, text: "책이나 글에서 핵심 내용을 빠르게 파악한다",                     category: "aptitude",  key: "VERBAL"   },
  { id: 21, text: "수학 계산이나 논리적 추론이 어렵지 않다",                       category: "aptitude",  key: "MATH"     },
  { id: 22, text: "통계나 숫자 데이터를 분석하는 게 잘 맞는다",                    category: "aptitude",  key: "MATH"     },
  { id: 23, text: "지도나 도면을 보고 공간 구조를 머릿속에 그릴 수 있다",          category: "aptitude",  key: "SPATIAL"  },
  { id: 24, text: "복잡한 도형이나 입체적 구조를 잘 이해한다",                     category: "aptitude",  key: "SPATIAL"  },
  { id: 25, text: "새로운 아이디어나 해결책을 자주 떠올린다",                      category: "aptitude",  key: "CREATIVE" },
  { id: 26, text: "틀에 박히지 않은 방식으로 생각하는 걸 즐긴다",                  category: "aptitude",  key: "CREATIVE" },
  { id: 27, text: "다른 사람의 말을 잘 듣고 감정을 이해한다",                      category: "aptitude",  key: "SOCIAL"   },
  { id: 28, text: "여러 사람과 협력하거나 갈등을 조율하는 데 자신 있다",            category: "aptitude",  key: "SOCIAL"   },
  { id: 29, text: "목표를 세우고 스스로 계획적으로 실행할 수 있다",                category: "aptitude",  key: "SELF"     },
  { id: 30, text: "어려운 상황에서도 침착하게 자기 관리를 잘 한다",                category: "aptitude",  key: "SELF"     },
];

export const INTEREST_KEYS  = ["SCI", "ENG", "MED", "BIZ", "LAW", "EDU", "ART", "IT", "SOC"] as const;
export const APTITUDE_KEYS  = ["VERBAL", "MATH", "SPATIAL", "CREATIVE", "SOCIAL", "SELF"] as const;

export const JOB_FIELD_MAPPING: Record<string, string[]> = {
  SCI: ['연구직 및 공학 기술직'],
  ENG: ['연구직 및 공학 기술직', '건설·채굴직', '설치·정비·생산직'],
  MED: ['보건·의료직'],
  BIZ: ['경영·사무·금융·보험직', '영업·판매·운전·운송직'],
  LAW: ['교육·법률·사회복지·경찰·소방직 및 군인'],
  EDU: ['교육·법률·사회복지·경찰·소방직 및 군인'],
  ART: ['예술·디자인·방송·스포츠직'],
  IT:  ['연구직 및 공학 기술직'],
  SOC: ['교육·법률·사회복지·경찰·소방직 및 군인', '미용·여행·숙박·음식·경비·청소직'],
};

export const KEYWORD_FILTER: Record<string, string[]> = {
  SCI: ['연구', '과학', '물리', '화학', '생물', '수학', '통계', '천문', '지질', '해양', '환경'],
  IT:  ['프로그래', '소프트웨어', '웹', '앱', '데이터', '정보보안', 'AI', '인공지능', '시스템', '네트워크', '클라우드', 'IT', '컴퓨터'],
  ENG: ['기계', '건설', '토목', '전기', '전자', '제조', '화공', '재료', '설계', '엔지니어', '기술자', '기사'],
  LAW: ['법', '변호', '검사', '판사', '행정', '공무원', '경찰', '소방', '세무', '관세', '외교'],
  EDU: ['교사', '교수', '강사', '상담', '복지', '보육', '특수교육', '사서'],
  SOC: ['기자', '작가', '통역', '번역', '큐레이터', '사회', '심리', '문화', '여행', '미용'],
};

export const INTEREST_LABELS_KR: Record<string, string> = {
  SCI: "과학·자연", ENG: "공학·기술", MED: "의료·보건", BIZ: "경영·경제",
  LAW: "법·행정", EDU: "교육·사회복지", ART: "예술·문화", IT: "IT·컴퓨터", SOC: "사회·봉사",
};

export const APTITUDE_LABELS_KR: Record<string, string> = {
  VERBAL: "언어·표현", MATH: "수리·논리", SPATIAL: "공간·시각", CREATIVE: "창의·사고", SOCIAL: "대인·공감", SELF: "자기관리",
};

export type JobCandidate = {
  jobName: string | null;
  field: string | null;
  salary: number | null;
  growth: string | null;
  relatedMajors: unknown;
  description: string | null;
};

export function prioritizeByKeywords(
  jobs: JobCandidate[],
  activeCats: string[],
  sharedField: string
): JobCandidate[] {
  const allKws = activeCats.flatMap(c => KEYWORD_FILTER[c] || []);
  if (allKws.length === 0) return jobs;
  const matched: JobCandidate[] = [];
  const unmatched: JobCandidate[] = [];
  for (const j of jobs) {
    if (j.field === sharedField && allKws.some(kw => j.jobName?.includes(kw))) {
      matched.push(j);
    } else {
      unmatched.push(j);
    }
  }
  return [...matched, ...unmatched];
}

export function computeScores(answers: { questionId: number; score: number }[]) {
  const interestScores: Record<string, number> = {};
  const aptitudeScores: Record<string, number> = {};
  for (const key of INTEREST_KEYS) interestScores[key] = 0;
  for (const key of APTITUDE_KEYS)  aptitudeScores[key] = 0;

  for (const answer of answers) {
    const question = APTITUDE_QUESTIONS.find(q => q.id === answer.questionId);
    if (!question) continue;
    const score = Math.min(5, Math.max(1, answer.score));
    if (question.category === "interest") {
      interestScores[question.key] = (interestScores[question.key] || 0) + score;
    } else {
      aptitudeScores[question.key] = (aptitudeScores[question.key] || 0) + score;
    }
  }
  for (const k of INTEREST_KEYS) interestScores[k] = Math.round((interestScores[k] / 10) * 100);
  for (const k of APTITUDE_KEYS)  aptitudeScores[k] = Math.round((aptitudeScores[k] / 10) * 100);

  const top3 = Object.entries(interestScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  return { interestScores, aptitudeScores, top3 };
}
