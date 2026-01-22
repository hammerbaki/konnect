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
  primary: [49, 130, 246] as [number, number, number],
  secondary: [21, 101, 192] as [number, number, number],
  accent: [0, 191, 165] as [number, number, number],
  text: [25, 31, 40] as [number, number, number],
  textLight: [78, 89, 104] as [number, number, number],
  textMuted: [139, 149, 161] as [number, number, number],
  success: [16, 185, 129] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  background: [249, 250, 251] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  border: [229, 232, 235] as [number, number, number],
  gold: [180, 140, 50] as [number, number, number],
};

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

async function loadFontAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

async function loadLogoAsBase64(): Promise<string | null> {
  try {
    const response = await fetch('/konnect-logo.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
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
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 20;

  let koreanFontLoaded = false;
  try {
    const fontBase64 = await loadFontAsBase64('/fonts/NotoSansKR-Regular.ttf');
    pdf.addFileToVFS('NotoSansKR-Regular.ttf', fontBase64);
    pdf.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal');
    koreanFontLoaded = true;
  } catch (e) {
    console.warn('Could not load Korean font, using default:', e);
  }

  const setKoreanFont = (size: number, style: 'normal' | 'bold' = 'normal') => {
    if (koreanFontLoaded) {
      pdf.setFont('NotoSansKR', style);
    } else {
      pdf.setFont('helvetica', style);
    }
    pdf.setFontSize(size);
  };

  const addPage = () => {
    pdf.addPage();
    y = 25;
    drawHeader();
  };

  const checkPageBreak = (height: number): boolean => {
    if (y + height > pageHeight - 25) {
      addPage();
      return true;
    }
    return false;
  };

  const drawHeader = () => {
    pdf.setDrawColor(...COLORS.primary);
    pdf.setLineWidth(0.5);
    pdf.line(marginLeft, 15, pageWidth - marginRight, 15);
    
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.textMuted);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Konnect AI Career Analysis Report', marginLeft, 12);
    pdf.text(`Page ${pdf.getCurrentPageInfo().pageNumber}`, pageWidth - marginRight, 12, { align: 'right' });
  };

  const drawFooter = () => {
    const footerY = pageHeight - 10;
    pdf.setDrawColor(...COLORS.border);
    pdf.setLineWidth(0.3);
    pdf.line(marginLeft, footerY - 5, pageWidth - marginRight, footerY - 5);
    
    pdf.setFontSize(7);
    pdf.setTextColor(...COLORS.textMuted);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Konnect - Your AI Career Solution', marginLeft, footerY);
    pdf.text(`© ${new Date().getFullYear()} Konnect. All rights reserved.`, pageWidth - marginRight, footerY, { align: 'right' });
  };

  const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
    setKoreanFont(fontSize);
    return pdf.splitTextToSize(text, maxWidth);
  };

  const logoBase64 = await loadLogoAsBase64();

  if (logoBase64) {
    pdf.addImage(logoBase64, 'PNG', marginLeft, y, 50, 16);
  } else {
    pdf.setFontSize(24);
    pdf.setTextColor(...COLORS.primary);
    pdf.setFont('helvetica', 'bold');
    pdf.text('KONNECT', marginLeft, y + 12);
  }

  pdf.setFontSize(9);
  pdf.setTextColor(...COLORS.textMuted);
  pdf.setFont('helvetica', 'normal');
  const reportId = `KR-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  pdf.text(`Report ID: ${reportId}`, pageWidth - marginRight, y + 4, { align: 'right' });
  pdf.text(`Date: ${metadata.analysisDate || new Date().toLocaleDateString('ko-KR')}`, pageWidth - marginRight, y + 9, { align: 'right' });
  pdf.text(`Profile: ${getProfileTypeLabel(metadata.profileType)}`, pageWidth - marginRight, y + 14, { align: 'right' });

  y += 25;

  pdf.setDrawColor(...COLORS.border);
  pdf.setLineWidth(0.5);
  pdf.line(marginLeft, y, pageWidth - marginRight, y);
  y += 8;

  pdf.setFillColor(...COLORS.primary);
  pdf.circle(marginLeft + 18, y + 18, 16, 'F');
  
  pdf.setFontSize(20);
  pdf.setTextColor(...COLORS.white);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${career.matchScore}%`, marginLeft + 18, y + 20, { align: 'center' });
  
  pdf.setFontSize(7);
  pdf.text('MATCH', marginLeft + 18, y + 27, { align: 'center' });

  const titleX = marginLeft + 45;
  const titleMaxWidth = contentWidth - 90;
  
  setKoreanFont(18, 'bold');
  pdf.setTextColor(...COLORS.text);
  const titleLines = wrapText(career.title, titleMaxWidth, 18);
  pdf.text(titleLines, titleX, y + 10);
  
  const titleHeight = titleLines.length * 7;
  
  setKoreanFont(10);
  pdf.setTextColor(...COLORS.textLight);
  const descLines = wrapText(career.description, titleMaxWidth, 10);
  const truncatedDesc = descLines.slice(0, 3);
  if (descLines.length > 3) {
    truncatedDesc[2] = truncatedDesc[2].substring(0, truncatedDesc[2].length - 3) + '...';
  }
  pdf.text(truncatedDesc, titleX, y + titleHeight + 16);

  pdf.setFillColor(255, 251, 235);
  pdf.setDrawColor(...COLORS.gold);
  pdf.setLineWidth(1);
  const certX = pageWidth - marginRight - 35;
  pdf.roundedRect(certX, y, 35, 22, 2, 2, 'FD');
  
  pdf.setFontSize(7);
  pdf.setTextColor(...COLORS.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CERTIFIED', certX + 17.5, y + 9, { align: 'center' });
  pdf.setFontSize(5);
  pdf.setFont('helvetica', 'normal');
  pdf.text('KONNECT VERIFIED', certX + 17.5, y + 15, { align: 'center' });

  y += 50;

  const boxWidth = (contentWidth - 10) / 2;
  const boxHeight = 30;
  
  pdf.setFillColor(...COLORS.background);
  pdf.roundedRect(marginLeft, y, boxWidth, boxHeight, 3, 3, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.primary);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INFORMATION', marginLeft + 8, y + 10);
  
  if (career.salary) {
    setKoreanFont(10, 'bold');
    pdf.setTextColor(...COLORS.text);
    const salaryLines = wrapText(career.salary, boxWidth - 16, 10);
    pdf.text(salaryLines.slice(0, 2), marginLeft + 8, y + 20);
  }

  pdf.setFillColor(...COLORS.background);
  pdf.roundedRect(marginLeft + boxWidth + 10, y, boxWidth, boxHeight, 3, 3, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.accent);
  pdf.setFont('helvetica', 'bold');
  pdf.text('OUTLOOK', marginLeft + boxWidth + 18, y + 10);
  
  if (career.jobOutlook) {
    setKoreanFont(10, 'bold');
    pdf.setTextColor(...COLORS.text);
    const outlookLines = wrapText(career.jobOutlook, boxWidth - 16, 10);
    pdf.text(outlookLines.slice(0, 2), marginLeft + boxWidth + 18, y + 20);
  }

  y += boxHeight + 12;

  if (career.competencies && career.competencies.length > 0) {
    checkPageBreak(45);
    
    pdf.setFillColor(240, 244, 255);
    pdf.roundedRect(marginLeft, y, contentWidth, 40, 3, 3, 'F');
    
    pdf.setFontSize(10);
    pdf.setTextColor(...COLORS.primary);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPETENCY ANALYSIS', marginLeft + 8, y + 12);
    
    const compCount = Math.min(career.competencies.length, 5);
    const compWidth = (contentWidth - 20) / compCount;
    
    career.competencies.slice(0, 5).forEach((comp, i) => {
      const barX = marginLeft + 10 + i * compWidth;
      const percentage = Math.round((comp.A / comp.fullMark) * 100);
      const barMaxWidth = compWidth - 15;
      
      pdf.setFillColor(...COLORS.border);
      pdf.roundedRect(barX, y + 22, barMaxWidth, 6, 2, 2, 'F');
      
      pdf.setFillColor(...COLORS.primary);
      const filledWidth = Math.max(4, barMaxWidth * (percentage / 100));
      pdf.roundedRect(barX, y + 22, filledWidth, 6, 2, 2, 'F');
      
      setKoreanFont(7);
      pdf.setTextColor(...COLORS.textLight);
      pdf.text(comp.subject, barX, y + 34);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...COLORS.primary);
      pdf.text(`${percentage}%`, barX + barMaxWidth, y + 34, { align: 'right' });
    });
    
    y += 48;
  }

  if (career.strengths?.length || career.weaknesses?.length) {
    checkPageBreak(70);
    
    const halfWidth = (contentWidth - 10) / 2;
    const sectionY = y;
    
    if (career.strengths?.length) {
      pdf.setFillColor(236, 253, 245);
      pdf.roundedRect(marginLeft, sectionY, halfWidth, 60, 3, 3, 'F');
      
      pdf.setDrawColor(...COLORS.success);
      pdf.setLineWidth(3);
      pdf.line(marginLeft, sectionY, marginLeft, sectionY + 60);
      
      pdf.setFontSize(10);
      pdf.setTextColor(...COLORS.success);
      pdf.setFont('helvetica', 'bold');
      pdf.text('STRENGTHS', marginLeft + 10, sectionY + 12);
      
      setKoreanFont(9);
      pdf.setTextColor(...COLORS.textLight);
      
      let itemY = sectionY + 22;
      career.strengths.slice(0, 4).forEach((s, i) => {
        const lines = wrapText(`${i + 1}. ${s}`, halfWidth - 20, 9);
        pdf.text(lines[0], marginLeft + 10, itemY);
        itemY += 10;
      });
    }
    
    if (career.weaknesses?.length) {
      pdf.setFillColor(254, 243, 199);
      pdf.roundedRect(marginLeft + halfWidth + 10, sectionY, halfWidth, 60, 3, 3, 'F');
      
      pdf.setDrawColor(...COLORS.warning);
      pdf.setLineWidth(3);
      pdf.line(marginLeft + halfWidth + 10, sectionY, marginLeft + halfWidth + 10, sectionY + 60);
      
      pdf.setFontSize(10);
      pdf.setTextColor(...COLORS.warning);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AREAS TO IMPROVE', marginLeft + halfWidth + 20, sectionY + 12);
      
      setKoreanFont(9);
      pdf.setTextColor(...COLORS.textLight);
      
      let itemY = sectionY + 22;
      career.weaknesses.slice(0, 4).forEach((w, i) => {
        const lines = wrapText(`${i + 1}. ${w}`, halfWidth - 20, 9);
        pdf.text(lines[0], marginLeft + halfWidth + 20, itemY);
        itemY += 10;
      });
    }
    
    y += 70;
  }

  if (career.actions) {
    checkPageBreak(30);
    
    pdf.setFontSize(12);
    pdf.setTextColor(...COLORS.text);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ACTION PLAN', marginLeft, y);
    y += 10;
    
    const drawActionSection = (
      title: string,
      koreanTitle: string,
      items: string[] | undefined,
      color: [number, number, number],
      bgColor: [number, number, number]
    ) => {
      if (!items?.length) return;
      
      checkPageBreak(45);
      
      pdf.setFillColor(...bgColor);
      pdf.roundedRect(marginLeft, y, contentWidth, 40, 3, 3, 'F');
      
      pdf.setFillColor(...color);
      pdf.circle(marginLeft + 12, y + 12, 7, 'F');
      
      pdf.setFontSize(10);
      pdf.setTextColor(...COLORS.white);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title.charAt(0), marginLeft + 12, y + 14, { align: 'center' });
      
      pdf.setFontSize(11);
      pdf.setTextColor(...color);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, marginLeft + 25, y + 13);
      
      setKoreanFont(8);
      pdf.setTextColor(...COLORS.textMuted);
      pdf.text(koreanTitle, marginLeft + 25 + pdf.getTextWidth(title) + 3, y + 13);
      
      setKoreanFont(9);
      pdf.setTextColor(...COLORS.textLight);
      
      let itemY = y + 24;
      items.slice(0, 3).forEach((item, i) => {
        const lines = wrapText(`${i + 1}. ${item}`, contentWidth - 30, 9);
        pdf.text(lines[0], marginLeft + 12, itemY);
        itemY += 8;
      });
      
      y += 48;
    };
    
    drawActionSection('Portfolio', '포트폴리오', career.actions.portfolio, COLORS.primary, [239, 246, 255]);
    drawActionSection('Networking', '네트워킹', career.actions.networking, [147, 51, 234], [250, 245, 255]);
    drawActionSection('Mindset', '마인드셋', career.actions.mindset, [244, 63, 94], [255, 241, 242]);
  }

  checkPageBreak(35);
  y += 8;
  
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(marginLeft, y, contentWidth, 25, 3, 3, 'F');
  
  pdf.setDrawColor(...COLORS.border);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(marginLeft, y, contentWidth, 25, 3, 3, 'S');
  
  pdf.setFontSize(7);
  pdf.setTextColor(...COLORS.textMuted);
  pdf.setFont('helvetica', 'italic');
  pdf.text('This report was generated by Konnect AI Career Analysis System.', marginLeft + 8, y + 8);
  pdf.text('Results are for reference only. Professional career counseling is recommended for actual career decisions.', marginLeft + 8, y + 14);
  
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated: ${new Date().toLocaleDateString('en-US')} | Profile: ${getProfileTypeLabel(metadata.profileType)}`, marginLeft + 8, y + 20);

  drawFooter();

  const safeTitle = career.title
    .replace(/[^a-zA-Z0-9가-힣\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 20);
  const fileName = `Konnect_Report_${safeTitle}_${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(fileName);
}
