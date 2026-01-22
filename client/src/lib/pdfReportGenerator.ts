import jsPDF from 'jspdf';

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

const COLORS = {
  primary: '#3182F6',
  secondary: '#1565C0',
  text: '#191F28',
  textLight: '#4E5968',
  textMuted: '#8B95A1',
  success: '#00BFA5',
  warning: '#F59E0B',
  background: '#F9FAFB',
  white: '#FFFFFF',
  border: '#E5E8EB',
  purple: '#9333EA',
  rose: '#F43F5E',
};

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

export async function generateCareerReportPDF(
  career: CareerReportData,
  metadata: ReportMetadata
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addPage = () => {
    pdf.addPage();
    y = margin;
    drawFooter();
  };

  const checkPageBreak = (height: number) => {
    if (y + height > pageHeight - 30) {
      addPage();
      return true;
    }
    return false;
  };

  const drawFooter = () => {
    pdf.setFontSize(8);
    pdf.setTextColor(...hexToRgb(COLORS.textMuted));
    pdf.text('Konnect - AI 진로 분석 플랫폼', margin, pageHeight - 10);
    pdf.text(`© ${new Date().getFullYear()} Konnect. All rights reserved.`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  };

  pdf.setFillColor(...hexToRgb(COLORS.primary));
  pdf.rect(0, 0, pageWidth, 55, 'F');
  
  pdf.setFillColor(...hexToRgb(COLORS.secondary));
  pdf.rect(0, 50, pageWidth, 5, 'F');

  pdf.setFontSize(28);
  pdf.setTextColor(...hexToRgb(COLORS.white));
  pdf.setFont('helvetica', 'bold');
  pdf.text('KONNECT', margin, 25);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('AI Career Analysis Report', margin, 33);

  pdf.setFontSize(16);
  pdf.text(career.title, margin, 45);

  y = 70;

  pdf.setFillColor(...hexToRgb('#E8F3FF'));
  pdf.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F');
  
  pdf.setFillColor(...hexToRgb(COLORS.primary));
  pdf.roundedRect(margin + 3, y + 3, 50, 29, 2, 2, 'F');
  
  pdf.setFontSize(9);
  pdf.setTextColor(...hexToRgb(COLORS.white));
  pdf.setFont('helvetica', 'bold');
  pdf.text('CERTIFIED', margin + 28, y + 14, { align: 'center' });
  
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text('KONNECT', margin + 28, y + 20, { align: 'center' });
  pdf.text('VERIFIED', margin + 28, y + 25, { align: 'center' });

  pdf.setFontSize(9);
  pdf.setTextColor(...hexToRgb(COLORS.text));
  pdf.setFont('helvetica', 'bold');
  const certBoxX = margin + 60;
  pdf.text('Report No:', certBoxX, y + 12);
  pdf.text('Generated:', certBoxX, y + 20);
  pdf.text('Profile:', certBoxX, y + 28);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...hexToRgb(COLORS.textLight));
  const reportId = `KR-${Date.now().toString(36).toUpperCase()}`;
  pdf.text(reportId, certBoxX + 30, y + 12);
  pdf.text(metadata.analysisDate, certBoxX + 30, y + 20);
  pdf.text(`${metadata.profileTitle} (${getProfileTypeLabel(metadata.profileType)})`, certBoxX + 30, y + 28);

  y += 45;

  pdf.setFillColor(...hexToRgb(COLORS.primary));
  pdf.circle(margin + 20, y + 20, 18, 'F');
  
  pdf.setFontSize(22);
  pdf.setTextColor(...hexToRgb(COLORS.white));
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${career.matchScore}%`, margin + 20, y + 23, { align: 'center' });
  
  pdf.setFontSize(7);
  pdf.text('Match', margin + 20, y + 30, { align: 'center' });

  pdf.setFontSize(18);
  pdf.setTextColor(...hexToRgb(COLORS.text));
  pdf.setFont('helvetica', 'bold');
  pdf.text(career.title, margin + 45, y + 15);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...hexToRgb(COLORS.textLight));
  
  const descLines = pdf.splitTextToSize(career.description, contentWidth - 50);
  pdf.text(descLines, margin + 45, y + 25);
  
  y += 50 + (descLines.length - 1) * 5;

  checkPageBreak(40);
  
  const infoBoxWidth = (contentWidth - 5) / 2;
  
  pdf.setFillColor(...hexToRgb(COLORS.background));
  pdf.roundedRect(margin, y, infoBoxWidth, 30, 2, 2, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(...hexToRgb(COLORS.textMuted));
  pdf.text('Information / 정보', margin + 5, y + 8);
  
  pdf.setFontSize(10);
  pdf.setTextColor(...hexToRgb(COLORS.text));
  pdf.setFont('helvetica', 'bold');
  const salaryLines = pdf.splitTextToSize(career.salary || '-', infoBoxWidth - 10);
  pdf.text(salaryLines.slice(0, 2), margin + 5, y + 18);

  pdf.setFillColor(...hexToRgb(COLORS.background));
  pdf.roundedRect(margin + infoBoxWidth + 5, y, infoBoxWidth, 30, 2, 2, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(...hexToRgb(COLORS.textMuted));
  pdf.setFont('helvetica', 'normal');
  pdf.text('Outlook / 전망', margin + infoBoxWidth + 10, y + 8);
  
  pdf.setFontSize(10);
  pdf.setTextColor(...hexToRgb(COLORS.text));
  pdf.setFont('helvetica', 'bold');
  const outlookLines = pdf.splitTextToSize(career.jobOutlook || '-', infoBoxWidth - 10);
  pdf.text(outlookLines.slice(0, 2), margin + infoBoxWidth + 10, y + 18);

  y += 40;

  if (career.strengths?.length || career.weaknesses?.length) {
    checkPageBreak(60);
    
    const halfWidth = (contentWidth - 5) / 2;
    
    if (career.strengths?.length) {
      pdf.setFillColor(...hexToRgb('#F0FDF4'));
      const strengthHeight = 20 + career.strengths.length * 10;
      pdf.roundedRect(margin, y, halfWidth, Math.min(strengthHeight, 80), 2, 2, 'F');
      
      pdf.setFontSize(11);
      pdf.setTextColor(...hexToRgb(COLORS.success));
      pdf.setFont('helvetica', 'bold');
      pdf.text('Strengths / 강점', margin + 5, y + 10);
      
      pdf.setFontSize(9);
      pdf.setTextColor(...hexToRgb(COLORS.textLight));
      pdf.setFont('helvetica', 'normal');
      
      let itemY = y + 18;
      career.strengths.slice(0, 5).forEach((s) => {
        const lines = pdf.splitTextToSize(`• ${s}`, halfWidth - 10);
        pdf.text(lines[0], margin + 5, itemY);
        itemY += 8;
      });
    }
    
    if (career.weaknesses?.length) {
      pdf.setFillColor(...hexToRgb('#FFF7ED'));
      const weaknessHeight = 20 + career.weaknesses.length * 10;
      pdf.roundedRect(margin + halfWidth + 5, y, halfWidth, Math.min(weaknessHeight, 80), 2, 2, 'F');
      
      pdf.setFontSize(11);
      pdf.setTextColor(...hexToRgb(COLORS.warning));
      pdf.setFont('helvetica', 'bold');
      pdf.text('Areas to Improve / 보완점', margin + halfWidth + 10, y + 10);
      
      pdf.setFontSize(9);
      pdf.setTextColor(...hexToRgb(COLORS.textLight));
      pdf.setFont('helvetica', 'normal');
      
      let itemY = y + 18;
      career.weaknesses.slice(0, 5).forEach((w) => {
        const lines = pdf.splitTextToSize(`• ${w}`, halfWidth - 10);
        pdf.text(lines[0], margin + halfWidth + 10, itemY);
        itemY += 8;
      });
    }
    
    const maxItems = Math.max(career.strengths?.length || 0, career.weaknesses?.length || 0);
    y += 25 + Math.min(maxItems, 5) * 10;
  }

  if (career.actions) {
    checkPageBreak(30);
    
    pdf.setFontSize(14);
    pdf.setTextColor(...hexToRgb(COLORS.text));
    pdf.setFont('helvetica', 'bold');
    pdf.text('Recommended Actions / 추천 액션', margin, y);
    y += 10;
    
    const drawActionSection = (
      title: string, 
      subtitle: string, 
      items: string[] | undefined, 
      color: string,
      bgColor: string
    ) => {
      if (!items?.length) return;
      
      checkPageBreak(25 + items.length * 10);
      
      const sectionHeight = 18 + Math.min(items.length, 4) * 10;
      pdf.setFillColor(...hexToRgb(bgColor));
      pdf.roundedRect(margin, y, contentWidth, sectionHeight, 2, 2, 'F');
      
      pdf.setFillColor(...hexToRgb(color));
      pdf.roundedRect(margin + 3, y + 3, 6, sectionHeight - 6, 1, 1, 'F');
      
      pdf.setFontSize(10);
      pdf.setTextColor(...hexToRgb(COLORS.text));
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin + 15, y + 10);
      
      pdf.setFontSize(7);
      pdf.setTextColor(...hexToRgb(COLORS.textMuted));
      pdf.setFont('helvetica', 'normal');
      pdf.text(subtitle, margin + 15 + pdf.getTextWidth(title) + 5, y + 10);
      
      pdf.setFontSize(9);
      pdf.setTextColor(...hexToRgb(COLORS.textLight));
      let itemY = y + 18;
      items.slice(0, 4).forEach((item, i) => {
        const lines = pdf.splitTextToSize(`${i + 1}. ${item}`, contentWidth - 20);
        pdf.text(lines[0], margin + 15, itemY);
        itemY += 8;
      });
      
      y += sectionHeight + 5;
    };
    
    drawActionSection('Portfolio', '포트폴리오', career.actions.portfolio, COLORS.primary, '#EFF6FF');
    drawActionSection('Networking', '네트워킹', career.actions.networking, COLORS.purple, '#FAF5FF');
    drawActionSection('Mindset', '마인드셋', career.actions.mindset, COLORS.rose, '#FFF1F2');
  }

  checkPageBreak(40);
  y += 10;
  
  pdf.setFillColor(...hexToRgb(COLORS.background));
  pdf.roundedRect(margin, y, contentWidth, 30, 3, 3, 'F');
  
  pdf.setDrawColor(...hexToRgb(COLORS.border));
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin, y, contentWidth, 30, 3, 3, 'S');
  
  pdf.setFontSize(8);
  pdf.setTextColor(...hexToRgb(COLORS.textMuted));
  pdf.setFont('helvetica', 'italic');
  const disclaimer = '본 리포트는 Konnect AI 분석 시스템에 의해 생성되었습니다. 분석 결과는 참고용이며, 실제 진로 결정 시에는 전문 상담을 권장합니다.';
  const disclaimerLines = pdf.splitTextToSize(disclaimer, contentWidth - 10);
  pdf.text(disclaimerLines, margin + 5, y + 10);
  
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated on ${new Date().toLocaleDateString('ko-KR')} by Konnect AI`, margin + 5, y + 24);

  drawFooter();

  const fileName = `Konnect_Career_Report_${career.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(fileName);
}

function getProfileTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    general: '구직자',
    university: '대학생',
    high: '고등학생',
    middle: '중학생',
    elementary: '초등학생',
  };
  return labels[type] || type;
}
