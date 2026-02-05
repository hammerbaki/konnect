import html2pdf from 'html2pdf.js';

export interface CareerReportData {
  title: string;
  matchScore: number;
  description: string;
  salary: string;
  jobOutlook: string;
  strengths: string[];
  weaknesses: string[];
  competencies?: { subject: string; A: number; fullMark: number }[];
  actions?: {
    portfolio?: string[];
    networking?: string[];
    mindset?: string[];
  };
}

export interface KJobsDiagnosisData {
  careerDna?: string;
  keywords?: string[];
  scores?: Record<string, number>;
  recommendedJobs?: { title: string; matchScore?: number }[];
}

export interface ReportMetadata {
  userName: string;
  profileType: string;
  analysisDate: string;
  profileTitle: string;
}

export interface GroupMemberReportData {
  userName: string;
  email: string;
  profileType: string;
  analysisDate: string;
  summary?: string;
  fitScore?: number;
  visaWarning?: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  fitReasons?: string[];
  readyNowJobs?: Array<{ role?: string; title?: string; reasons?: string[]; requiredNext?: string[] }>;
  afterPrepJobs?: Array<{ role?: string; title?: string; missingConditions?: string[]; howToFill?: string[] }>;
  actionPlan?: {
    immediate?: string[];
    shortTerm?: string[];
    longTerm?: string[];
  };
}

function getProfileTypeKorean(type: string): string {
  const labels: Record<string, string> = {
    general: '구직자',
    university: '대학생',
    high: '고등학생',
    middle: '중학생',
    elementary: '초등학생',
    international_university: '외국인유학생',
    international: '외국인유학생',
  };
  return labels[type] || type;
}

function getScoreLabelKorean(key: string): string {
  const labels: Record<string, string> = {
    valuesPurpose: '가치관/목적의식',
    careerInterests: '직업 흥미도',
    interactionStyle: '대인관계 유형',
    pressureResponse: '스트레스 대응력',
    analyticalThinking: '분석적 사고력',
    creativity: '창의성',
    leadership: '리더십',
    teamwork: '협업 능력',
    communication: '의사소통',
    problemSolving: '문제해결력',
    adaptability: '적응력',
    technicalSkills: '기술 역량',
  };
  return labels[key] || key;
}

function createIntegratedReportHTML(
  career: CareerReportData, 
  metadata: ReportMetadata,
  kjobsData?: KJobsDiagnosisData
): string {
  const reportId = `KR-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  
  const kjobsSection = kjobsData ? `
    <!-- K-JOBS 진로진단 결과 -->
    <div class="avoid-break" style="margin-bottom: 30px; page-break-inside: avoid;">
      <h2 style="font-size: 16px; font-weight: 700; color: #6366F1; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #6366F1; display: flex; align-items: center;">
        <span style="margin-right: 8px;">🧬</span> K-JOBS 진로진단 결과
      </h2>
      
      <!-- Career DNA -->
      ${kjobsData.careerDna ? `
        <div style="background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); padding: 20px; border-radius: 12px; margin-bottom: 15px; text-align: center;">
          <div style="font-size: 12px; color: #6366F1; font-weight: 600; margin-bottom: 8px;">Career DNA</div>
          <div style="font-size: 22px; font-weight: 800; color: #4338CA;">${kjobsData.careerDna}</div>
        </div>
      ` : ''}
      
      <!-- Keywords -->
      ${kjobsData.keywords && kjobsData.keywords.length > 0 ? `
        <div style="margin-bottom: 15px;">
          <div style="font-size: 12px; color: #6366F1; font-weight: 600; margin-bottom: 10px;">핵심 키워드</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${kjobsData.keywords.slice(0, 6).map(keyword => `
              <span style="background: #EEF2FF; color: #4338CA; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 500;">${keyword}</span>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <!-- Scores -->
      ${kjobsData.scores && Object.keys(kjobsData.scores).length > 0 ? `
        <div style="background: #F8FAFC; padding: 20px; border-radius: 12px;">
          <div style="font-size: 12px; color: #6366F1; font-weight: 600; margin-bottom: 12px;">역량 점수</div>
          ${Object.entries(kjobsData.scores).slice(0, 6).map(([key, value]) => `
            <div style="margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 12px; color: #4A5568;">${getScoreLabelKorean(key)}</span>
                <span style="font-size: 12px; font-weight: 700; color: #6366F1;">${value}점</span>
              </div>
              <div style="height: 6px; background: #E2E8F0; border-radius: 3px; overflow: hidden;">
                <div style="width: ${Math.min(value, 100)}%; height: 100%; background: linear-gradient(90deg, #6366F1, #8B5CF6); border-radius: 3px;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <!-- Recommended Jobs from K-JOBS -->
      ${kjobsData.recommendedJobs && kjobsData.recommendedJobs.length > 0 ? `
        <div style="margin-top: 15px;">
          <div style="font-size: 12px; color: #6366F1; font-weight: 600; margin-bottom: 10px;">진로진단 추천 직업</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${kjobsData.recommendedJobs.slice(0, 5).map((job, i) => `
              <span style="background: white; border: 1px solid #C7D2FE; color: #4338CA; padding: 6px 12px; border-radius: 8px; font-size: 11px;">
                ${i + 1}. ${job.title}${job.matchScore ? ` (${job.matchScore}%)` : ''}
              </span>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  ` : '';
  
  return `
    <style>
      .pdf-page { 
        min-height: 1100px; 
        page-break-after: always; 
        page-break-inside: avoid;
        padding-bottom: 40px;
      }
      .pdf-page:last-child { page-break-after: avoid; }
      .section-box, .avoid-break {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    </style>
    <div id="pdf-report-container" style="width: 794px; padding: 40px; font-family: 'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif; background: white; color: #191F28;">
      <!-- Page 1: Header + K-JOBS -->
      <div class="pdf-page">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0F1E3D 0%, #1a2d5c 100%); padding: 30px; margin: -40px -40px 30px -40px; border-radius: 0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-size: 28px; font-weight: 800; color: white; margin-bottom: 8px;">
              <span style="color: #3182F6;">K</span><span style="color: #FFD700;">o</span><span style="color: #FF6B6B;">n</span><span style="color: #4ECDC4;">n</span><span style="color: #FFD700;">e</span><span style="color: #3182F6;">c</span><span style="color: #FF6B6B;">t</span>
            </div>
            <div style="font-size: 12px; color: #A0AEC0;">Your AI Career Solution</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 16px; font-weight: 700; color: white; margin-bottom: 8px;">통합 커리어 분석 리포트</div>
            <div style="font-size: 11px; color: #A0AEC0; margin-bottom: 4px;">Report ID: ${reportId}</div>
            <div style="font-size: 11px; color: #A0AEC0;">Date: ${metadata.analysisDate}</div>
            <div style="margin-top: 12px; background: linear-gradient(135deg, #D4AF37, #F5D76E); color: #0F1E3D; padding: 6px 16px; border-radius: 20px; font-size: 10px; font-weight: 700; display: inline-block;">
              CERTIFIED REPORT
            </div>
          </div>
        </div>
      </div>

      <!-- User Info Banner -->
      <div style="background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%); padding: 16px 20px; border-radius: 12px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 14px; font-weight: 600; color: #0369A1;">${metadata.userName}</span>
          <span style="font-size: 12px; color: #0EA5E9; margin-left: 8px;">${getProfileTypeKorean(metadata.profileType)}</span>
        </div>
        <div style="font-size: 11px; color: #0284C7;">분석일: ${metadata.analysisDate}</div>
      </div>

      ${kjobsSection}
      </div><!-- End Page 1 -->

      <!-- Page 2: AI Career Analysis -->
      <div class="pdf-page">
      <!-- AI Career Analysis Section -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 16px; font-weight: 700; color: #3182F6; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #3182F6; display: flex; align-items: center;">
          <span style="margin-right: 8px;">🤖</span> AI 커리어 분석 결과
        </h2>
      </div>

      <!-- Match Score Section -->
      <div class="avoid-break" style="display: flex; align-items: center; margin-bottom: 30px; padding: 25px; background: #F8FAFC; border-radius: 16px; border: 1px solid #E2E8F0;">
        <div style="width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #3182F6 0%, #1565C0 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; margin-right: 25px; box-shadow: 0 4px 15px rgba(49, 130, 246, 0.3);">
          <span style="font-size: 32px; font-weight: 800; color: white;">${career.matchScore}</span>
          <span style="font-size: 14px; color: rgba(255,255,255,0.9);">%</span>
          <span style="font-size: 9px; color: rgba(255,255,255,0.8); margin-top: 2px;">MATCH SCORE</span>
        </div>
        <div style="flex: 1;">
          <h1 style="font-size: 26px; font-weight: 800; color: #191F28; margin: 0 0 10px 0;">${career.title}</h1>
          <p style="font-size: 14px; color: #4A5568; line-height: 1.6; margin: 0;">${career.description || '해당 직업에 대한 상세 정보입니다.'}</p>
        </div>
      </div>

      <!-- Overview Section -->
      <div class="avoid-break" style="margin-bottom: 30px;">
        <h3 style="font-size: 14px; font-weight: 700; color: #191F28; margin-bottom: 15px;">개요</h3>
        <div style="display: flex; gap: 20px;">
          <div style="flex: 1; background: #F8FAFC; padding: 20px; border-radius: 12px; border-left: 4px solid #00BFA5;">
            <div style="font-size: 11px; font-weight: 600; color: #00BFA5; margin-bottom: 8px; text-transform: uppercase;">연봉 정보</div>
            <div style="font-size: 14px; color: #191F28; line-height: 1.6;">${career.salary || '정보 없음'}</div>
          </div>
          <div style="flex: 1; background: #F8FAFC; padding: 20px; border-radius: 12px; border-left: 4px solid #6366F1;">
            <div style="font-size: 11px; font-weight: 600; color: #6366F1; margin-bottom: 8px; text-transform: uppercase;">시장 전망</div>
            <div style="font-size: 14px; color: #191F28; line-height: 1.6;">${career.jobOutlook || '정보 없음'}</div>
          </div>
        </div>
      </div>

      <!-- Competency Section -->
      ${career.competencies && career.competencies.length > 0 ? `
        <div class="avoid-break" style="margin-bottom: 30px; page-break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: 700; color: #191F28; margin-bottom: 15px;">역량 분석</h3>
          <div style="background: #F8FAFC; padding: 20px; border-radius: 12px;">
            ${career.competencies.map(comp => `
              <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="font-size: 13px; font-weight: 600; color: #191F28;">${comp.subject}</span>
                  <span style="font-size: 13px; font-weight: 700; color: #3182F6;">${Math.round(comp.A / comp.fullMark * 100)}%</span>
                </div>
                <div style="height: 8px; background: #E2E8F0; border-radius: 4px; overflow: hidden;">
                  <div style="width: ${comp.A / comp.fullMark * 100}%; height: 100%; background: linear-gradient(90deg, #3182F6, #00BFA5); border-radius: 4px;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Strengths & Weaknesses -->
      <div class="section-box avoid-break" style="display: flex; gap: 20px; margin-bottom: 30px; page-break-inside: avoid;">
        <div style="flex: 1;">
          <h3 style="font-size: 14px; font-weight: 700; color: #198754; margin-bottom: 15px;">강점</h3>
          <div style="background: #F0FDF4; padding: 15px; border-radius: 12px; border: 1px solid #BBF7D0;">
            ${career.strengths && career.strengths.length > 0 
              ? career.strengths.slice(0, 4).map(s => `<div style="font-size: 12px; color: #166534; margin-bottom: 6px; padding-left: 15px; position: relative;"><span style="position: absolute; left: 0; color: #22C55E;">✓</span> ${s}</div>`).join('')
              : '<div style="font-size: 12px; color: #86EFAC;">정보 없음</div>'}
          </div>
        </div>
        <div style="flex: 1;">
          <h3 style="font-size: 14px; font-weight: 700; color: #DC2626; margin-bottom: 15px;">개선점</h3>
          <div style="background: #FEF2F2; padding: 15px; border-radius: 12px; border: 1px solid #FECACA;">
            ${career.weaknesses && career.weaknesses.length > 0
              ? career.weaknesses.slice(0, 4).map(w => `<div style="font-size: 12px; color: #991B1B; margin-bottom: 6px; padding-left: 15px; position: relative;"><span style="position: absolute; left: 0; color: #EF4444;">!</span> ${w}</div>`).join('')
              : '<div style="font-size: 12px; color: #FCA5A5;">정보 없음</div>'}
          </div>
        </div>
      </div>

      <!-- Action Plan -->
      ${career.actions && (career.actions.portfolio?.length || career.actions.networking?.length || career.actions.mindset?.length) ? `
        <div class="section-box avoid-break" style="margin-bottom: 30px; page-break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: 700; color: #191F28; margin-bottom: 12px;">액션 플랜</h3>
          <div style="display: flex; gap: 12px;">
            ${career.actions.portfolio && career.actions.portfolio.length > 0 ? `
              <div style="flex: 1; background: linear-gradient(135deg, #EBF4FF 0%, #F0F7FF 100%); padding: 14px; border-radius: 12px;">
                <div style="font-size: 11px; font-weight: 700; color: #3182F6; margin-bottom: 10px;">📁 포트폴리오</div>
                ${career.actions.portfolio.slice(0, 3).map(item => `<div style="font-size: 11px; color: #1E40AF; margin-bottom: 5px; line-height: 1.4;">• ${item}</div>`).join('')}
              </div>
            ` : ''}
            ${career.actions.networking && career.actions.networking.length > 0 ? `
              <div style="flex: 1; background: linear-gradient(135deg, #E0F2F1 0%, #F0FDF4 100%); padding: 14px; border-radius: 12px;">
                <div style="font-size: 11px; font-weight: 700; color: #00897B; margin-bottom: 10px;">🤝 네트워킹</div>
                ${career.actions.networking.slice(0, 3).map(item => `<div style="font-size: 11px; color: #065F46; margin-bottom: 5px; line-height: 1.4;">• ${item}</div>`).join('')}
              </div>
            ` : ''}
            ${career.actions.mindset && career.actions.mindset.length > 0 ? `
              <div style="flex: 1; background: linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 100%); padding: 14px; border-radius: 12px;">
                <div style="font-size: 11px; font-weight: 700; color: #D97706; margin-bottom: 10px;">💡 마인드셋</div>
                ${career.actions.mindset.slice(0, 3).map(item => `<div style="font-size: 11px; color: #92400E; margin-bottom: 5px; line-height: 1.4;">• ${item}</div>`).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 11px; color: #8B95A1;">
          본 리포트는 K-JOBS 진로진단과 AI 분석을 통합한 결과입니다.
        </div>
        <div style="font-size: 11px; color: #8B95A1;">
          © ${new Date().getFullYear()} Konnect AI Career Platform
        </div>
      </div>
      </div><!-- End Page 2 -->
    </div>
  `;
}

export async function generateCareerReportPDF(
  career: CareerReportData,
  metadata: ReportMetadata,
  kjobsData?: KJobsDiagnosisData
): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.innerHTML = createIntegratedReportHTML(career, metadata, kjobsData);
  document.body.appendChild(container);

  const reportElement = container.querySelector('#pdf-report-container') as HTMLElement;
  
  const fileName = `Konnect_${career.title.replace(/\s+/g, '_')}_통합분석리포트_${metadata.analysisDate.replace(/\./g, '')}.pdf`;
  
  const opt = {
    margin: 0,
    filename: fileName,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    },
    jsPDF: { 
      unit: 'mm' as const, 
      format: 'a4' as const, 
      orientation: 'portrait' as const
    },
    pagebreak: { 
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: '.avoid-break'
    }
  };

  try {
    await html2pdf().set(opt).from(reportElement).save();
  } finally {
    document.body.removeChild(container);
  }
}

function createGroupMemberReportHTML(data: GroupMemberReportData): string {
  const reportId = `GMR-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  
  const visaSection = data.visaWarning ? `
    <div class="avoid-break" style="margin-bottom: 25px; background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #F59E0B;">
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 20px;">⚠️</span>
        <div>
          <div style="font-size: 14px; font-weight: 700; color: #92400E; margin-bottom: 8px;">비자 관련 안내</div>
          <div style="font-size: 13px; color: #78350F; line-height: 1.6;">${data.visaWarning}</div>
        </div>
      </div>
    </div>
  ` : '';

  const fitReasonsSection = data.fitReasons && data.fitReasons.length > 0 ? `
    <div class="avoid-break" style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: 700; color: #191F28; margin-bottom: 15px; display: flex; align-items: center;">
        <span style="margin-right: 8px;">📊</span> 적합도 분석
      </h3>
      <div style="background: #F8FAFC; padding: 20px; border-radius: 12px;">
        ${data.fitReasons.map((reason, i) => `
          <div style="margin-bottom: ${i < data.fitReasons!.length - 1 ? '12px' : '0'}; padding-left: 20px; position: relative;">
            <span style="position: absolute; left: 0; color: #3182F6;">•</span>
            <span style="font-size: 13px; color: #4A5568; line-height: 1.6;">${reason}</span>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  const readyNowSection = data.readyNowJobs && data.readyNowJobs.length > 0 ? `
    <div class="avoid-break" style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: 700; color: #059669; margin-bottom: 15px; display: flex; align-items: center;">
        <span style="margin-right: 8px;">✅</span> 지금 바로 도전 가능한 직무
      </h3>
      <div style="background: #ECFDF5; padding: 20px; border-radius: 12px; border: 1px solid #A7F3D0;">
        ${data.readyNowJobs.map((job, i) => `
          <div style="margin-bottom: ${i < data.readyNowJobs!.length - 1 ? '15px' : '0'};">
            <div style="font-size: 14px; font-weight: 600; color: #065F46; margin-bottom: 4px;">${job.role || job.title || '직무'}</div>
            ${job.reasons && job.reasons.length > 0 ? `<div style="font-size: 12px; color: #047857;">${job.reasons.join(', ')}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  const afterPrepSection = data.afterPrepJobs && data.afterPrepJobs.length > 0 ? `
    <div class="avoid-break" style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: 700; color: #6366F1; margin-bottom: 15px; display: flex; align-items: center;">
        <span style="margin-right: 8px;">🎯</span> 준비 후 도전 추천 직무
      </h3>
      <div style="background: #EEF2FF; padding: 20px; border-radius: 12px; border: 1px solid #C7D2FE;">
        ${data.afterPrepJobs.map((job, i) => `
          <div style="margin-bottom: ${i < data.afterPrepJobs!.length - 1 ? '15px' : '0'};">
            <div style="font-size: 14px; font-weight: 600; color: #4338CA; margin-bottom: 4px;">${job.role || job.title || '직무'}</div>
            ${job.missingConditions && job.missingConditions.length > 0 ? `<div style="font-size: 12px; color: #4F46E5;">필요 조건: ${job.missingConditions.join(', ')}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  const actionPlanSection = data.actionPlan ? `
    <div class="avoid-break" style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: 700; color: #191F28; margin-bottom: 15px; display: flex; align-items: center;">
        <span style="margin-right: 8px;">📋</span> 실행 계획
      </h3>
      <div style="display: flex; gap: 15px; flex-wrap: wrap;">
        ${data.actionPlan.immediate && data.actionPlan.immediate.length > 0 ? `
          <div style="flex: 1; min-width: 200px; background: #FEF2F2; padding: 15px; border-radius: 12px; border-left: 4px solid #DC2626;">
            <div style="font-size: 12px; font-weight: 600; color: #DC2626; margin-bottom: 10px;">즉시 실행</div>
            ${data.actionPlan.immediate.map(item => `<div style="font-size: 12px; color: #7F1D1D; margin-bottom: 6px;">• ${item}</div>`).join('')}
          </div>
        ` : ''}
        ${data.actionPlan.shortTerm && data.actionPlan.shortTerm.length > 0 ? `
          <div style="flex: 1; min-width: 200px; background: #FEF3C7; padding: 15px; border-radius: 12px; border-left: 4px solid #F59E0B;">
            <div style="font-size: 12px; font-weight: 600; color: #D97706; margin-bottom: 10px;">단기 목표</div>
            ${data.actionPlan.shortTerm.map(item => `<div style="font-size: 12px; color: #78350F; margin-bottom: 6px;">• ${item}</div>`).join('')}
          </div>
        ` : ''}
        ${data.actionPlan.longTerm && data.actionPlan.longTerm.length > 0 ? `
          <div style="flex: 1; min-width: 200px; background: #ECFDF5; padding: 15px; border-radius: 12px; border-left: 4px solid #10B981;">
            <div style="font-size: 12px; font-weight: 600; color: #059669; margin-bottom: 10px;">장기 목표</div>
            ${data.actionPlan.longTerm.map(item => `<div style="font-size: 12px; color: #065F46; margin-bottom: 6px;">• ${item}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  ` : '';

  return `
    <style>
      @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
      .pdf-page { 
        min-height: 1100px; 
        page-break-after: always; 
        page-break-inside: avoid;
        padding-bottom: 40px;
      }
      .pdf-page:last-child { page-break-after: avoid; }
      .section-box, .avoid-break {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    </style>
    <div id="pdf-member-report-container" style="width: 794px; padding: 40px; font-family: 'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif; background: white; color: #191F28;">
      <div class="pdf-page">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0F1E3D 0%, #1a2d5c 100%); padding: 30px; margin: -40px -40px 30px -40px; border-radius: 0;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 28px; font-weight: 800; color: white; margin-bottom: 8px;">
                <span style="color: #3182F6;">K</span><span style="color: #FFD700;">o</span><span style="color: #FF6B6B;">n</span><span style="color: #4ECDC4;">n</span><span style="color: #FFD700;">e</span><span style="color: #3182F6;">c</span><span style="color: #FF6B6B;">t</span>
              </div>
              <div style="font-size: 12px; color: #A0AEC0;">Your AI Career Solution</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 16px; font-weight: 700; color: white; margin-bottom: 8px;">커리어 분석 리포트</div>
              <div style="font-size: 11px; color: #A0AEC0; margin-bottom: 4px;">Report ID: ${reportId}</div>
              <div style="font-size: 11px; color: #A0AEC0;">Date: ${data.analysisDate}</div>
              <div style="margin-top: 12px; background: linear-gradient(135deg, #D4AF37, #F5D76E); color: #0F1E3D; padding: 6px 16px; border-radius: 20px; font-size: 10px; font-weight: 700; display: inline-block;">
                CERTIFIED REPORT
              </div>
            </div>
          </div>
        </div>

        <!-- User Info Banner -->
        <div style="background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%); padding: 20px; border-radius: 12px; margin-bottom: 25px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="font-size: 18px; font-weight: 700; color: #0369A1; margin-bottom: 4px;">${data.userName}</div>
              <div style="font-size: 12px; color: #0284C7;">${data.email}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="background: #0EA5E9; color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;">${getProfileTypeKorean(data.profileType)}</span>
              ${data.fitScore !== undefined ? `
                <span style="background: linear-gradient(135deg, #3182F6, #1565C0); color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;">적합도 ${data.fitScore}점</span>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Summary -->
        ${data.summary ? `
          <div class="avoid-break" style="margin-bottom: 25px; background: linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%); padding: 25px; border-radius: 12px; border-left: 4px solid #3182F6;">
            <h3 style="font-size: 14px; font-weight: 700; color: #3182F6; margin-bottom: 12px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">📝</span> 분석 요약
            </h3>
            <p style="font-size: 14px; color: #4A5568; line-height: 1.8; margin: 0;">${data.summary}</p>
          </div>
        ` : ''}

        ${visaSection}

        ${fitReasonsSection}

        <!-- Strengths & Weaknesses -->
        <div class="section-box avoid-break" style="display: flex; gap: 20px; margin-bottom: 25px;">
          <div style="flex: 1;">
            <h3 style="font-size: 14px; font-weight: 700; color: #198754; margin-bottom: 15px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">💪</span> 강점
            </h3>
            <div style="background: #F0FDF4; padding: 20px; border-radius: 12px; border: 1px solid #BBF7D0;">
              ${data.strengths && data.strengths.length > 0 
                ? data.strengths.map(s => `<div style="font-size: 13px; color: #166534; margin-bottom: 8px; padding-left: 20px; position: relative;"><span style="position: absolute; left: 0; color: #22C55E;">✓</span> ${s}</div>`).join('')
                : '<div style="font-size: 13px; color: #86EFAC;">정보 없음</div>'}
            </div>
          </div>
          <div style="flex: 1;">
            <h3 style="font-size: 14px; font-weight: 700; color: #DC2626; margin-bottom: 15px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">📈</span> 개선점
            </h3>
            <div style="background: #FEF2F2; padding: 20px; border-radius: 12px; border: 1px solid #FECACA;">
              ${data.weaknesses && data.weaknesses.length > 0 
                ? data.weaknesses.map(w => `<div style="font-size: 13px; color: #991B1B; margin-bottom: 8px; padding-left: 20px; position: relative;"><span style="position: absolute; left: 0; color: #EF4444;">!</span> ${w}</div>`).join('')
                : '<div style="font-size: 13px; color: #FCA5A5;">정보 없음</div>'}
            </div>
          </div>
        </div>

        ${readyNowSection}
        ${afterPrepSection}

        <!-- Recommendations -->
        ${data.recommendations && data.recommendations.length > 0 ? `
          <div class="avoid-break" style="margin-bottom: 25px;">
            <h3 style="font-size: 14px; font-weight: 700; color: #191F28; margin-bottom: 15px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">💡</span> 추천 사항
            </h3>
            <div style="background: #FFFBEB; padding: 20px; border-radius: 12px; border: 1px solid #FDE68A;">
              ${data.recommendations.map((rec, i) => `
                <div style="margin-bottom: ${i < data.recommendations.length - 1 ? '12px' : '0'}; padding-left: 25px; position: relative;">
                  <span style="position: absolute; left: 0; font-size: 14px; color: #D97706;">${i + 1}.</span>
                  <span style="font-size: 13px; color: #78350F; line-height: 1.6;">${rec}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${actionPlanSection}

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 11px; color: #8B95A1;">
            본 리포트는 AI 분석을 기반으로 생성되었습니다.
          </div>
          <div style="font-size: 11px; color: #8B95A1;">
            © ${new Date().getFullYear()} Konnect AI Career Platform
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function generateGroupMemberReportPDF(data: GroupMemberReportData): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.innerHTML = createGroupMemberReportHTML(data);
  document.body.appendChild(container);

  const reportElement = container.querySelector('#pdf-member-report-container') as HTMLElement;
  
  const safeUserName = data.userName.replace(/[^a-zA-Z0-9가-힣]/g, '_');
  const fileName = `Konnect_${safeUserName}_분석리포트_${data.analysisDate.replace(/\./g, '')}.pdf`;
  
  const opt = {
    margin: 0,
    filename: fileName,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    },
    jsPDF: { 
      unit: 'mm' as const, 
      format: 'a4' as const, 
      orientation: 'portrait' as const
    },
    pagebreak: { 
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: '.avoid-break'
    }
  };

  try {
    await html2pdf().set(opt).from(reportElement).save();
  } finally {
    document.body.removeChild(container);
  }
}
