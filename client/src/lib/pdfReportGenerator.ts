import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

export interface ReportMetadata {
  userName: string;
  profileType: string;
  analysisDate: string;
  profileTitle: string;
}

function getProfileTypeKorean(type: string): string {
  const labels: Record<string, string> = {
    general: '구직자',
    university: '대학생',
    high: '고등학생',
    middle: '중학생',
    elementary: '초등학생',
  };
  return labels[type] || type;
}

function createReportHTML(career: CareerReportData, metadata: ReportMetadata): string {
  const reportId = `KR-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  
  return `
    <div id="pdf-report-container" style="width: 794px; padding: 40px; font-family: 'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif; background: white; color: #191F28;">
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
            <div style="font-size: 16px; font-weight: 700; color: white; margin-bottom: 8px;">AI 커리어 분석 리포트</div>
            <div style="font-size: 11px; color: #A0AEC0; margin-bottom: 4px;">Report ID: ${reportId}</div>
            <div style="font-size: 11px; color: #A0AEC0;">Date: ${metadata.analysisDate}</div>
            <div style="margin-top: 12px; background: linear-gradient(135deg, #D4AF37, #F5D76E); color: #0F1E3D; padding: 6px 16px; border-radius: 20px; font-size: 10px; font-weight: 700; display: inline-block;">
              CERTIFIED REPORT
            </div>
          </div>
        </div>
      </div>

      <!-- Match Score Section -->
      <div style="display: flex; align-items: center; margin-bottom: 30px; padding: 25px; background: #F8FAFC; border-radius: 16px; border: 1px solid #E2E8F0;">
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
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 16px; font-weight: 700; color: #3182F6; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #3182F6;">개요</h2>
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
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 16px; font-weight: 700; color: #3182F6; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #3182F6;">역량 분석</h2>
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
      <div style="display: flex; gap: 20px; margin-bottom: 30px;">
        <div style="flex: 1;">
          <h2 style="font-size: 16px; font-weight: 700; color: #198754; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #198754;">강점</h2>
          <div style="background: #F0FDF4; padding: 20px; border-radius: 12px; border: 1px solid #BBF7D0;">
            ${career.strengths && career.strengths.length > 0 
              ? career.strengths.map(s => `<div style="font-size: 13px; color: #166534; margin-bottom: 8px; padding-left: 15px; position: relative;"><span style="position: absolute; left: 0; color: #22C55E;">✓</span> ${s}</div>`).join('')
              : '<div style="font-size: 13px; color: #86EFAC;">정보 없음</div>'}
          </div>
        </div>
        <div style="flex: 1;">
          <h2 style="font-size: 16px; font-weight: 700; color: #DC2626; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #DC2626;">개선점</h2>
          <div style="background: #FEF2F2; padding: 20px; border-radius: 12px; border: 1px solid #FECACA;">
            ${career.weaknesses && career.weaknesses.length > 0
              ? career.weaknesses.map(w => `<div style="font-size: 13px; color: #991B1B; margin-bottom: 8px; padding-left: 15px; position: relative;"><span style="position: absolute; left: 0; color: #EF4444;">!</span> ${w}</div>`).join('')
              : '<div style="font-size: 13px; color: #FCA5A5;">정보 없음</div>'}
          </div>
        </div>
      </div>

      <!-- Action Plan -->
      ${career.actions && (career.actions.portfolio?.length || career.actions.networking?.length || career.actions.mindset?.length) ? `
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 16px; font-weight: 700; color: #3182F6; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #3182F6;">액션 플랜</h2>
          <div style="display: flex; gap: 15px;">
            ${career.actions.portfolio && career.actions.portfolio.length > 0 ? `
              <div style="flex: 1; background: linear-gradient(135deg, #EBF4FF 0%, #F0F7FF 100%); padding: 18px; border-radius: 12px;">
                <div style="font-size: 12px; font-weight: 700; color: #3182F6; margin-bottom: 12px;">📁 포트폴리오</div>
                ${career.actions.portfolio.map(item => `<div style="font-size: 12px; color: #1E40AF; margin-bottom: 6px; line-height: 1.5;">• ${item}</div>`).join('')}
              </div>
            ` : ''}
            ${career.actions.networking && career.actions.networking.length > 0 ? `
              <div style="flex: 1; background: linear-gradient(135deg, #E0F2F1 0%, #F0FDF4 100%); padding: 18px; border-radius: 12px;">
                <div style="font-size: 12px; font-weight: 700; color: #00897B; margin-bottom: 12px;">🤝 네트워킹</div>
                ${career.actions.networking.map(item => `<div style="font-size: 12px; color: #065F46; margin-bottom: 6px; line-height: 1.5;">• ${item}</div>`).join('')}
              </div>
            ` : ''}
            ${career.actions.mindset && career.actions.mindset.length > 0 ? `
              <div style="flex: 1; background: linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 100%); padding: 18px; border-radius: 12px;">
                <div style="font-size: 12px; font-weight: 700; color: #D97706; margin-bottom: 12px;">💡 마인드셋</div>
                ${career.actions.mindset.map(item => `<div style="font-size: 12px; color: #92400E; margin-bottom: 6px; line-height: 1.5;">• ${item}</div>`).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 11px; color: #8B95A1;">
          분석 대상: ${metadata.userName} (${getProfileTypeKorean(metadata.profileType)})
        </div>
        <div style="font-size: 11px; color: #8B95A1;">
          © ${new Date().getFullYear()} Konnect AI Career Platform
        </div>
      </div>
    </div>
  `;
}

export async function generateCareerReportPDF(
  career: CareerReportData,
  metadata: ReportMetadata
): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.innerHTML = createReportHTML(career, metadata);
  document.body.appendChild(container);

  const reportElement = container.querySelector('#pdf-report-container') as HTMLElement;
  
  try {
    const canvas = await html2canvas(reportElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const fileName = `Konnect_${career.title.replace(/\s+/g, '_')}_분석리포트_${metadata.analysisDate.replace(/\./g, '')}.pdf`;
    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
}
