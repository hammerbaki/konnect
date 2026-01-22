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

const COLORS = {
  primary: '#3182F6',
  secondary: '#1565C0',
  accent: '#00BFA5',
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
  gold: '#D4AF37',
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

function getProfileTypeLabelEn(type: string): string {
  const labels: Record<string, string> = {
    general: 'Job Seeker',
    university: 'University Student',
    high: 'High School Student',
    middle: 'Middle School Student',
    elementary: 'Elementary Student',
  };
  return labels[type] || type;
}

async function loadLogoAsBase64(): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Canvas context not available'));
      }
    };
    img.onerror = reject;
    img.src = '/konnect-logo.png';
  });
}

async function createKoreanTextImage(
  text: string,
  style: {
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    maxWidth?: string;
    lineHeight?: string;
    textAlign?: string;
    backgroundColor?: string;
  } = {}
): Promise<HTMLCanvasElement> {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.backgroundColor = style.backgroundColor || 'transparent';
  container.style.fontFamily = "'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
  container.style.fontSize = style.fontSize || '14px';
  container.style.fontWeight = style.fontWeight || 'normal';
  container.style.color = style.color || '#191F28';
  container.style.maxWidth = style.maxWidth || '500px';
  container.style.lineHeight = style.lineHeight || '1.6';
  container.style.textAlign = style.textAlign || 'left';
  container.style.padding = '4px';
  container.style.whiteSpace = 'pre-wrap';
  container.style.wordBreak = 'keep-all';
  container.innerText = text;
  
  document.body.appendChild(container);
  
  try {
    const canvas = await html2canvas(container, {
      backgroundColor: null,
      scale: 2,
      logging: false,
    });
    return canvas;
  } finally {
    document.body.removeChild(container);
  }
}

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
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const addPage = () => {
    pdf.addPage();
    y = margin;
    drawPageBorder();
  };

  const checkPageBreak = (height: number): boolean => {
    if (y + height > pageHeight - 25) {
      addPage();
      return true;
    }
    return false;
  };

  const drawPageBorder = () => {
    pdf.setDrawColor(...hexToRgb(COLORS.primary));
    pdf.setLineWidth(0.5);
    pdf.rect(8, 8, pageWidth - 16, pageHeight - 16);
  };

  const drawFooter = () => {
    const footerY = pageHeight - 12;
    pdf.setFontSize(7);
    pdf.setTextColor(...hexToRgb(COLORS.textMuted));
    pdf.text('Konnect AI Career Analysis Platform', margin, footerY);
    pdf.text(`Page ${pdf.getCurrentPageInfo().pageNumber}`, pageWidth / 2, footerY, { align: 'center' });
    pdf.text(`© ${new Date().getFullYear()} Konnect`, pageWidth - margin, footerY, { align: 'right' });
  };

  const addKoreanText = async (
    text: string,
    x: number,
    yPos: number,
    maxWidthMm: number,
    style: {
      fontSize?: string;
      fontWeight?: string;
      color?: string;
    } = {}
  ): Promise<number> => {
    const maxWidthPx = Math.round(maxWidthMm * 3.78);
    const canvas = await createKoreanTextImage(text, {
      ...style,
      maxWidth: `${maxWidthPx}px`,
    });
    
    const imgWidth = maxWidthMm;
    const imgHeight = (canvas.height / canvas.width) * imgWidth / 2;
    
    if (yPos + imgHeight > pageHeight - 25) {
      addPage();
      yPos = y;
    }
    
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, yPos, imgWidth, imgHeight);
    return imgHeight;
  };

  drawPageBorder();

  let logoBase64: string | null = null;
  try {
    logoBase64 = await loadLogoAsBase64();
  } catch (e) {
    console.warn('Could not load logo:', e);
  }

  y = 15;
  
  if (logoBase64) {
    pdf.addImage(logoBase64, 'PNG', margin, y, 45, 15);
  } else {
    pdf.setFontSize(20);
    pdf.setTextColor(...hexToRgb(COLORS.primary));
    pdf.setFont('helvetica', 'bold');
    pdf.text('KONNECT', margin, y + 10);
  }

  pdf.setFontSize(8);
  pdf.setTextColor(...hexToRgb(COLORS.textMuted));
  pdf.setFont('helvetica', 'normal');
  pdf.text('AI Career Analysis Report', pageWidth - margin, y + 5, { align: 'right' });
  
  const reportId = `KR-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  pdf.text(`Report ID: ${reportId}`, pageWidth - margin, y + 10, { align: 'right' });
  pdf.text(`Generated: ${metadata.analysisDate || new Date().toLocaleDateString('ko-KR')}`, pageWidth - margin, y + 15, { align: 'right' });

  y += 25;
  
  pdf.setDrawColor(...hexToRgb(COLORS.border));
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);
  
  y += 8;

  pdf.setFillColor(...hexToRgb('#F0F7FF'));
  pdf.roundedRect(margin, y, contentWidth, 50, 4, 4, 'F');
  
  pdf.setFillColor(...hexToRgb(COLORS.primary));
  pdf.circle(margin + 22, y + 25, 18, 'F');
  
  pdf.setFontSize(24);
  pdf.setTextColor(...hexToRgb(COLORS.white));
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${career.matchScore}%`, margin + 22, y + 27, { align: 'center' });
  
  pdf.setFontSize(7);
  pdf.text('MATCH', margin + 22, y + 34, { align: 'center' });

  const titleCanvas = await createKoreanTextImage(career.title, {
    fontSize: '22px',
    fontWeight: 'bold',
    color: COLORS.text,
    maxWidth: '400px',
  });
  const titleWidth = Math.min(contentWidth - 55, 120);
  const titleHeight = Math.min((titleCanvas.height / titleCanvas.width) * titleWidth / 2, 12);
  pdf.addImage(titleCanvas.toDataURL('image/png'), 'PNG', margin + 48, y + 8, titleWidth, titleHeight);

  const descHeight = await addKoreanText(
    career.description.length > 150 ? career.description.substring(0, 150) + '...' : career.description,
    margin + 48,
    y + titleHeight + 12,
    contentWidth - 55,
    { fontSize: '11px', color: COLORS.textLight }
  );

  y += 58;

  pdf.setFillColor(...hexToRgb('#FFFBEB'));
  pdf.roundedRect(pageWidth - margin - 55, y - 50, 50, 20, 2, 2, 'F');
  
  pdf.setDrawColor(...hexToRgb(COLORS.gold));
  pdf.setLineWidth(0.8);
  pdf.roundedRect(pageWidth - margin - 55, y - 50, 50, 20, 2, 2, 'S');
  
  pdf.setFontSize(7);
  pdf.setTextColor(...hexToRgb(COLORS.gold));
  pdf.setFont('helvetica', 'bold');
  pdf.text('CERTIFIED', pageWidth - margin - 30, y - 43, { align: 'center' });
  
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.text('KONNECT VERIFIED', pageWidth - margin - 30, y - 37, { align: 'center' });

  const infoBoxWidth = (contentWidth - 8) / 2;
  
  pdf.setFillColor(...hexToRgb(COLORS.background));
  pdf.roundedRect(margin, y, infoBoxWidth, 28, 2, 2, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(...hexToRgb(COLORS.primary));
  pdf.setFont('helvetica', 'bold');
  pdf.text('INFORMATION', margin + 5, y + 8);
  
  if (career.salary) {
    await addKoreanText(career.salary, margin + 5, y + 11, infoBoxWidth - 10, {
      fontSize: '10px',
      fontWeight: 'bold',
      color: COLORS.text,
    });
  }

  pdf.setFillColor(...hexToRgb(COLORS.background));
  pdf.roundedRect(margin + infoBoxWidth + 8, y, infoBoxWidth, 28, 2, 2, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(...hexToRgb(COLORS.accent));
  pdf.setFont('helvetica', 'bold');
  pdf.text('OUTLOOK', margin + infoBoxWidth + 13, y + 8);
  
  if (career.jobOutlook) {
    await addKoreanText(career.jobOutlook, margin + infoBoxWidth + 13, y + 11, infoBoxWidth - 10, {
      fontSize: '10px',
      fontWeight: 'bold',
      color: COLORS.text,
    });
  }

  y += 35;

  if (career.competencies && career.competencies.length > 0) {
    checkPageBreak(35);
    
    pdf.setFillColor(...hexToRgb('#F0F4FF'));
    pdf.roundedRect(margin, y, contentWidth, 30, 2, 2, 'F');
    
    pdf.setFontSize(9);
    pdf.setTextColor(...hexToRgb(COLORS.primary));
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPETENCY ANALYSIS', margin + 5, y + 8);
    
    const compWidth = contentWidth / career.competencies.length;
    career.competencies.forEach((comp, i) => {
      const barX = margin + 5 + i * compWidth;
      const percentage = Math.round((comp.A / comp.fullMark) * 100);
      const barWidth = Math.min(compWidth - 8, 25);
      
      pdf.setFillColor(...hexToRgb(COLORS.border));
      pdf.roundedRect(barX, y + 18, barWidth, 4, 1, 1, 'F');
      
      pdf.setFillColor(...hexToRgb(COLORS.primary));
      pdf.roundedRect(barX, y + 18, barWidth * (percentage / 100), 4, 1, 1, 'F');
      
      pdf.setFontSize(6);
      pdf.setTextColor(...hexToRgb(COLORS.textLight));
      pdf.text(`${comp.subject}: ${percentage}%`, barX, y + 27);
    });
    
    y += 35;
  }

  if (career.strengths?.length || career.weaknesses?.length) {
    checkPageBreak(55);
    
    const halfWidth = (contentWidth - 8) / 2;
    const sectionStartY = y;
    
    if (career.strengths?.length) {
      pdf.setFillColor(...hexToRgb('#ECFDF5'));
      pdf.roundedRect(margin, y, halfWidth, 50, 2, 2, 'F');
      
      pdf.setDrawColor(...hexToRgb(COLORS.success));
      pdf.setLineWidth(2);
      pdf.line(margin, y, margin, y + 50);
      
      pdf.setFontSize(9);
      pdf.setTextColor(...hexToRgb(COLORS.success));
      pdf.setFont('helvetica', 'bold');
      pdf.text('STRENGTHS', margin + 5, y + 9);
      
      const strengthsText = career.strengths.slice(0, 4).map((s, i) => `${i + 1}. ${s}`).join('\n');
      await addKoreanText(strengthsText, margin + 5, y + 12, halfWidth - 10, {
        fontSize: '9px',
        color: COLORS.textLight,
      });
    }
    
    if (career.weaknesses?.length) {
      pdf.setFillColor(...hexToRgb('#FEF3C7'));
      pdf.roundedRect(margin + halfWidth + 8, sectionStartY, halfWidth, 50, 2, 2, 'F');
      
      pdf.setDrawColor(...hexToRgb(COLORS.warning));
      pdf.setLineWidth(2);
      pdf.line(margin + halfWidth + 8, sectionStartY, margin + halfWidth + 8, sectionStartY + 50);
      
      pdf.setFontSize(9);
      pdf.setTextColor(...hexToRgb(COLORS.warning));
      pdf.setFont('helvetica', 'bold');
      pdf.text('AREAS TO IMPROVE', margin + halfWidth + 13, sectionStartY + 9);
      
      const weaknessesText = career.weaknesses.slice(0, 4).map((w, i) => `${i + 1}. ${w}`).join('\n');
      await addKoreanText(weaknessesText, margin + halfWidth + 13, sectionStartY + 12, halfWidth - 10, {
        fontSize: '9px',
        color: COLORS.textLight,
      });
    }
    
    y += 58;
  }

  if (career.actions) {
    checkPageBreak(25);
    
    pdf.setFontSize(11);
    pdf.setTextColor(...hexToRgb(COLORS.text));
    pdf.setFont('helvetica', 'bold');
    pdf.text('ACTION PLAN', margin, y);
    y += 8;
    
    const drawActionSection = async (
      title: string,
      koreanTitle: string,
      items: string[] | undefined,
      color: string,
      bgColor: string,
      icon: string
    ) => {
      if (!items?.length) return;
      
      checkPageBreak(38);
      
      pdf.setFillColor(...hexToRgb(bgColor));
      pdf.roundedRect(margin, y, contentWidth, 35, 2, 2, 'F');
      
      pdf.setFillColor(...hexToRgb(color));
      pdf.circle(margin + 12, y + 10, 6, 'F');
      
      pdf.setFontSize(10);
      pdf.setTextColor(...hexToRgb(COLORS.white));
      pdf.setFont('helvetica', 'bold');
      pdf.text(icon, margin + 12, y + 12, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setTextColor(...hexToRgb(color));
      pdf.text(title, margin + 22, y + 11);
      
      pdf.setFontSize(7);
      pdf.setTextColor(...hexToRgb(COLORS.textMuted));
      pdf.text(koreanTitle, margin + 22 + pdf.getTextWidth(title) + 3, y + 11);
      
      const itemsText = items.slice(0, 3).map((item, i) => `${i + 1}. ${item}`).join('\n');
      await addKoreanText(itemsText, margin + 8, y + 15, contentWidth - 16, {
        fontSize: '9px',
        color: COLORS.textLight,
      });
      
      y += 40;
    };
    
    await drawActionSection('Portfolio', '포트폴리오', career.actions.portfolio, COLORS.primary, '#EFF6FF', 'P');
    await drawActionSection('Networking', '네트워킹', career.actions.networking, COLORS.purple, '#FAF5FF', 'N');
    await drawActionSection('Mindset', '마인드셋', career.actions.mindset, COLORS.rose, '#FFF1F2', 'M');
  }

  checkPageBreak(30);
  y += 5;
  
  pdf.setFillColor(...hexToRgb('#F8FAFC'));
  pdf.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
  
  pdf.setDrawColor(...hexToRgb(COLORS.border));
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, y, contentWidth, 22, 2, 2, 'S');
  
  pdf.setFontSize(7);
  pdf.setTextColor(...hexToRgb(COLORS.textMuted));
  pdf.setFont('helvetica', 'italic');
  pdf.text('This report was generated by Konnect AI Career Analysis System.', margin + 5, y + 7);
  pdf.text('Results are for reference only. Professional career counseling is recommended for actual decisions.', margin + 5, y + 12);
  
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Profile: ${getProfileTypeLabelEn(metadata.profileType)} | Generated: ${new Date().toLocaleDateString('en-US')}`, margin + 5, y + 18);

  drawFooter();

  const safeTitle = career.title.replace(/[^a-zA-Z0-9가-힣\s]/g, '').replace(/\s+/g, '_').substring(0, 25);
  const fileName = `Konnect_Report_${safeTitle}_${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(fileName);
}
