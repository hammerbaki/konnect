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
  navy: [15, 30, 61] as [number, number, number],
  primary: [49, 130, 246] as [number, number, number],
  gold: [212, 175, 55] as [number, number, number],
  accent: [0, 191, 165] as [number, number, number],
  text: [33, 37, 41] as [number, number, number],
  textSecondary: [73, 80, 87] as [number, number, number],
  textMuted: [134, 142, 150] as [number, number, number],
  success: [25, 135, 84] as [number, number, number],
  warning: [255, 193, 7] as [number, number, number],
  danger: [220, 53, 69] as [number, number, number],
  light: [248, 249, 250] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  border: [222, 226, 230] as [number, number, number],
};

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

async function loadFontAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const chunkSize = 32768;
    let binary = '';
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(binary);
  } catch (error) {
    console.error('Font loading error:', error);
    return null;
  }
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
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
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;
  let currentPage = 1;

  let koreanFontLoaded = false;
  
  const fontUrls = [
    '/fonts/Pretendard-Regular.otf',
    '/fonts/NotoSansKR-Regular.ttf',
  ];
  
  for (const fontUrl of fontUrls) {
    try {
      const fontBase64 = await loadFontAsBase64(fontUrl);
      if (fontBase64 && fontBase64.length > 1000) {
        const fontName = fontUrl.includes('Pretendard') ? 'Pretendard' : 'NotoSansKR';
        const extension = fontUrl.split('.').pop() || 'ttf';
        pdf.addFileToVFS(`${fontName}.${extension}`, fontBase64);
        pdf.addFont(`${fontName}.${extension}`, fontName, 'normal');
        pdf.setFont(fontName, 'normal');
        koreanFontLoaded = true;
        console.log(`Korean font loaded: ${fontName}`);
        break;
      }
    } catch (e) {
      console.warn(`Failed to load font ${fontUrl}:`, e);
    }
  }

  const setFont = (size: number, _weight: 'normal' | 'bold' = 'normal') => {
    if (koreanFontLoaded) {
      const currentFont = pdf.getFont().fontName;
      pdf.setFont(currentFont, 'normal');
    } else {
      pdf.setFont('helvetica', _weight);
    }
    pdf.setFontSize(size);
  };

  const wrapText = (text: string, maxWidth: number): string[] => {
    if (!text) return [''];
    return pdf.splitTextToSize(text, maxWidth);
  };

  const drawPageFooter = () => {
    pdf.setFillColor(...COLORS.navy);
    pdf.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    
    pdf.setFontSize(7);
    pdf.setTextColor(...COLORS.white);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Konnect AI Career Analysis Platform', margin, pageHeight - 5);
    pdf.text(`Page ${currentPage}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
    pdf.text(`© ${new Date().getFullYear()} Konnect`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  };

  const addPage = () => {
    pdf.addPage();
    currentPage++;
    y = 25;
  };

  const checkPageBreak = (height: number): boolean => {
    if (y + height > pageHeight - 20) {
      drawPageFooter();
      addPage();
      return true;
    }
    return false;
  };

  pdf.setFillColor(...COLORS.navy);
  pdf.rect(0, 0, pageWidth, 50, 'F');

  const logoBase64 = await loadImageAsBase64('/konnect-logo.png');
  if (logoBase64) {
    pdf.addImage(logoBase64, 'PNG', margin, 10, 45, 15);
  } else {
    pdf.setFontSize(22);
    pdf.setTextColor(...COLORS.white);
    pdf.setFont('helvetica', 'bold');
    pdf.text('KONNECT', margin, 22);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Your AI Career Solution', margin, 28);
  }

  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.white);
  pdf.setFont('helvetica', 'bold');
  pdf.text('AI CAREER ANALYSIS REPORT', pageWidth - margin, 18, { align: 'right' });
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(200, 200, 220);
  const reportId = `KR-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  pdf.text(`Report ID: ${reportId}`, pageWidth - margin, 26, { align: 'right' });
  pdf.text(`Date: ${metadata.analysisDate || new Date().toLocaleDateString('ko-KR')}`, pageWidth - margin, 32, { align: 'right' });

  pdf.setFillColor(...COLORS.gold);
  pdf.roundedRect(pageWidth - margin - 28, 38, 28, 8, 1, 1, 'F');
  pdf.setFontSize(6);
  pdf.setTextColor(...COLORS.navy);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CERTIFIED REPORT', pageWidth - margin - 14, 43.5, { align: 'center' });

  y = 60;

  pdf.setFillColor(...COLORS.light);
  pdf.roundedRect(margin, y, contentWidth, 55, 4, 4, 'F');

  pdf.setFillColor(...COLORS.primary);
  pdf.circle(margin + 25, y + 27.5, 20, 'F');
  
  pdf.setFontSize(24);
  pdf.setTextColor(...COLORS.white);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${career.matchScore}`, margin + 25, y + 26, { align: 'center' });
  pdf.setFontSize(10);
  pdf.text('%', margin + 25, y + 35, { align: 'center' });
  
  pdf.setFontSize(6);
  pdf.text('MATCH SCORE', margin + 25, y + 43, { align: 'center' });

  const titleX = margin + 55;
  const titleMaxWidth = contentWidth - 65;
  
  setFont(16, 'bold');
  pdf.setTextColor(...COLORS.text);
  const titleLines = wrapText(career.title, titleMaxWidth);
  pdf.text(titleLines.slice(0, 2), titleX, y + 15);
  
  const titleHeight = Math.min(titleLines.length, 2) * 6;
  
  setFont(9);
  pdf.setTextColor(...COLORS.textSecondary);
  const descLines = wrapText(career.description, titleMaxWidth);
  pdf.text(descLines.slice(0, 3), titleX, y + titleHeight + 22);

  y += 65;

  pdf.setFontSize(11);
  pdf.setTextColor(...COLORS.navy);
  pdf.setFont('helvetica', 'bold');
  pdf.text('OVERVIEW', margin, y);
  
  pdf.setDrawColor(...COLORS.primary);
  pdf.setLineWidth(2);
  pdf.line(margin, y + 3, margin + 25, y + 3);
  
  y += 12;

  const boxWidth = (contentWidth - 10) / 2;
  
  pdf.setFillColor(...COLORS.white);
  pdf.setDrawColor(...COLORS.border);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin, y, boxWidth, 32, 3, 3, 'FD');
  
  pdf.setFillColor(...COLORS.primary);
  pdf.roundedRect(margin, y, 4, 32, 2, 0, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.textMuted);
  pdf.setFont('helvetica', 'bold');
  pdf.text('COMPENSATION', margin + 10, y + 10);
  
  setFont(10, 'bold');
  pdf.setTextColor(...COLORS.text);
  if (career.salary) {
    const salaryLines = wrapText(career.salary, boxWidth - 20);
    pdf.text(salaryLines.slice(0, 2), margin + 10, y + 20);
  }

  pdf.setFillColor(...COLORS.white);
  pdf.roundedRect(margin + boxWidth + 10, y, boxWidth, 32, 3, 3, 'FD');
  
  pdf.setFillColor(...COLORS.accent);
  pdf.roundedRect(margin + boxWidth + 10, y, 4, 32, 2, 0, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.textMuted);
  pdf.setFont('helvetica', 'bold');
  pdf.text('MARKET OUTLOOK', margin + boxWidth + 20, y + 10);
  
  setFont(10, 'bold');
  pdf.setTextColor(...COLORS.text);
  if (career.jobOutlook) {
    const outlookLines = wrapText(career.jobOutlook, boxWidth - 20);
    pdf.text(outlookLines.slice(0, 2), margin + boxWidth + 20, y + 20);
  }

  y += 42;

  if (career.competencies && career.competencies.length > 0) {
    checkPageBreak(55);
    
    pdf.setFontSize(11);
    pdf.setTextColor(...COLORS.navy);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPETENCY ANALYSIS', margin, y);
    
    pdf.setDrawColor(...COLORS.primary);
    pdf.setLineWidth(2);
    pdf.line(margin, y + 3, margin + 45, y + 3);
    
    y += 15;

    const compCount = Math.min(career.competencies.length, 5);
    const barHeight = 8;
    const barSpacing = 14;
    
    career.competencies.slice(0, 5).forEach((comp, i) => {
      const barY = y + i * barSpacing;
      const percentage = Math.round((comp.A / comp.fullMark) * 100);
      
      setFont(9);
      pdf.setTextColor(...COLORS.text);
      pdf.text(comp.subject, margin, barY + 5);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...COLORS.primary);
      pdf.text(`${percentage}%`, margin + contentWidth, barY + 5, { align: 'right' });
      
      const barStartX = margin + 50;
      const barWidth = contentWidth - 80;
      
      pdf.setFillColor(...COLORS.light);
      pdf.roundedRect(barStartX, barY, barWidth, barHeight, 2, 2, 'F');
      
      const gradientWidth = Math.max(4, barWidth * (percentage / 100));
      if (percentage >= 70) {
        pdf.setFillColor(...COLORS.success);
      } else if (percentage >= 50) {
        pdf.setFillColor(...COLORS.primary);
      } else {
        pdf.setFillColor(...COLORS.warning);
      }
      pdf.roundedRect(barStartX, barY, gradientWidth, barHeight, 2, 2, 'F');
    });
    
    y += compCount * barSpacing + 10;
  }

  if (career.strengths?.length || career.weaknesses?.length) {
    checkPageBreak(75);
    
    pdf.setFontSize(11);
    pdf.setTextColor(...COLORS.navy);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SWOT ANALYSIS', margin, y);
    
    pdf.setDrawColor(...COLORS.primary);
    pdf.setLineWidth(2);
    pdf.line(margin, y + 3, margin + 30, y + 3);
    
    y += 12;

    const halfWidth = (contentWidth - 8) / 2;
    const sectionY = y;
    const sectionHeight = 60;
    
    if (career.strengths?.length) {
      pdf.setFillColor(236, 253, 245);
      pdf.roundedRect(margin, sectionY, halfWidth, sectionHeight, 4, 4, 'F');
      
      pdf.setFillColor(...COLORS.success);
      pdf.roundedRect(margin, sectionY, halfWidth, 18, 4, 0, 'F');
      pdf.rect(margin, sectionY + 14, halfWidth, 4, 'F');
      
      pdf.setFontSize(9);
      pdf.setTextColor(...COLORS.white);
      pdf.setFont('helvetica', 'bold');
      pdf.text('STRENGTHS', margin + halfWidth / 2, sectionY + 11, { align: 'center' });
      
      setFont(8);
      pdf.setTextColor(...COLORS.textSecondary);
      
      let itemY = sectionY + 26;
      career.strengths.slice(0, 4).forEach((s) => {
        pdf.setFillColor(...COLORS.success);
        pdf.circle(margin + 8, itemY - 1.5, 1.5, 'F');
        
        const lines = wrapText(s, halfWidth - 18);
        pdf.text(lines[0], margin + 14, itemY);
        itemY += 9;
      });
    }
    
    if (career.weaknesses?.length) {
      pdf.setFillColor(255, 243, 205);
      pdf.roundedRect(margin + halfWidth + 8, sectionY, halfWidth, sectionHeight, 4, 4, 'F');
      
      pdf.setFillColor(...COLORS.danger);
      pdf.roundedRect(margin + halfWidth + 8, sectionY, halfWidth, 18, 4, 0, 'F');
      pdf.rect(margin + halfWidth + 8, sectionY + 14, halfWidth, 4, 'F');
      
      pdf.setFontSize(9);
      pdf.setTextColor(...COLORS.white);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AREAS TO DEVELOP', margin + halfWidth + 8 + halfWidth / 2, sectionY + 11, { align: 'center' });
      
      setFont(8);
      pdf.setTextColor(...COLORS.textSecondary);
      
      let itemY = sectionY + 26;
      career.weaknesses.slice(0, 4).forEach((w) => {
        pdf.setFillColor(...COLORS.danger);
        pdf.circle(margin + halfWidth + 16, itemY - 1.5, 1.5, 'F');
        
        const lines = wrapText(w, halfWidth - 18);
        pdf.text(lines[0], margin + halfWidth + 22, itemY);
        itemY += 9;
      });
    }
    
    y += sectionHeight + 10;
  }

  if (career.actions) {
    checkPageBreak(30);
    
    pdf.setFontSize(11);
    pdf.setTextColor(...COLORS.navy);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RECOMMENDED ACTION PLAN', margin, y);
    
    pdf.setDrawColor(...COLORS.primary);
    pdf.setLineWidth(2);
    pdf.line(margin, y + 3, margin + 55, y + 3);
    
    y += 12;
    
    const drawActionCard = (
      title: string,
      subtitle: string,
      items: string[] | undefined,
      iconLetter: string,
      accentColor: [number, number, number],
      bgColor: [number, number, number]
    ) => {
      if (!items?.length) return;
      
      checkPageBreak(50);
      
      pdf.setFillColor(...bgColor);
      pdf.roundedRect(margin, y, contentWidth, 42, 4, 4, 'F');
      
      pdf.setFillColor(...accentColor);
      pdf.circle(margin + 15, y + 14, 10, 'F');
      
      pdf.setFontSize(14);
      pdf.setTextColor(...COLORS.white);
      pdf.setFont('helvetica', 'bold');
      pdf.text(iconLetter, margin + 15, y + 17, { align: 'center' });
      
      pdf.setFontSize(11);
      pdf.setTextColor(...COLORS.text);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin + 32, y + 12);
      
      setFont(8);
      pdf.setTextColor(...COLORS.textMuted);
      pdf.text(subtitle, margin + 32, y + 19);
      
      setFont(8);
      pdf.setTextColor(...COLORS.textSecondary);
      
      let itemY = y + 28;
      items.slice(0, 2).forEach((item, i) => {
        const lines = wrapText(`${i + 1}. ${item}`, contentWidth - 40);
        pdf.text(lines[0], margin + 32, itemY);
        itemY += 7;
      });
      
      y += 48;
    };
    
    drawActionCard('Portfolio', '포트폴리오 구축', career.actions.portfolio, 'P', COLORS.primary, [239, 246, 255]);
    drawActionCard('Networking', '네트워크 확장', career.actions.networking, 'N', [139, 92, 246], [245, 243, 255]);
    drawActionCard('Mindset', '마인드셋 개발', career.actions.mindset, 'M', [236, 72, 153], [253, 242, 248]);
  }

  checkPageBreak(25);
  y += 5;
  
  pdf.setDrawColor(...COLORS.border);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  
  y += 8;
  
  pdf.setFontSize(7);
  pdf.setTextColor(...COLORS.textMuted);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Disclaimer: This report was generated by Konnect AI Career Analysis System.', margin, y);
  pdf.text('The results provided are for informational purposes only and should not replace professional career counseling.', margin, y + 5);
  
  setFont(7);
  const profileTypeText = getProfileTypeKorean(metadata.profileType);
  pdf.text(`Profile Type: ${profileTypeText} | Generated: ${new Date().toISOString().slice(0, 10)}`, margin, y + 12);

  drawPageFooter();

  const safeTitle = career.title
    .replace(/[^a-zA-Z0-9가-힣\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 20);
  const fileName = `Konnect_Career_Report_${safeTitle}_${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(fileName);
}
