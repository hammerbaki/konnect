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

function getProfileTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    general: 'Job Seeker',
    university: 'University',
    high: 'High School',
    middle: 'Middle School',
    elementary: 'Elementary',
  };
  return labels[type] || type;
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
  } = {}
): Promise<HTMLCanvasElement> {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.backgroundColor = 'transparent';
  container.style.fontFamily = "'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
  container.style.fontSize = style.fontSize || '14px';
  container.style.fontWeight = style.fontWeight || 'normal';
  container.style.color = style.color || '#191F28';
  container.style.maxWidth = style.maxWidth || '500px';
  container.style.lineHeight = style.lineHeight || '1.5';
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
    pdf.text('Konnect - AI Career Analysis Platform', margin, pageHeight - 10);
    pdf.text(`${new Date().getFullYear()} Konnect. All rights reserved.`, pageWidth - margin, pageHeight - 10, { align: 'right' });
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
    
    if (yPos + imgHeight > pageHeight - 30) {
      addPage();
      yPos = y;
    }
    
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, yPos, imgWidth, imgHeight);
    return imgHeight;
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

  const titleCanvas = await createKoreanTextImage(career.title, {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#FFFFFF',
    maxWidth: '400px',
  });
  const titleWidth = Math.min(contentWidth - 10, 100);
  const titleHeight = (titleCanvas.height / titleCanvas.width) * titleWidth / 2;
  pdf.addImage(titleCanvas.toDataURL('image/png'), 'PNG', margin, 38, titleWidth, titleHeight);

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
  pdf.text(reportId, certBoxX + 25, y + 12);
  pdf.text(metadata.analysisDate || new Date().toLocaleDateString('en-US'), certBoxX + 25, y + 20);
  
  const profileInfo = `${getProfileTypeLabel(metadata.profileType)}`;
  pdf.text(profileInfo, certBoxX + 25, y + 28);

  y += 45;

  pdf.setFillColor(...hexToRgb(COLORS.primary));
  pdf.circle(margin + 20, y + 20, 18, 'F');
  
  pdf.setFontSize(22);
  pdf.setTextColor(...hexToRgb(COLORS.white));
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${career.matchScore}%`, margin + 20, y + 23, { align: 'center' });
  
  pdf.setFontSize(7);
  pdf.text('Match', margin + 20, y + 30, { align: 'center' });

  const careerTitleCanvas = await createKoreanTextImage(career.title, {
    fontSize: '20px',
    fontWeight: 'bold',
    color: COLORS.text,
    maxWidth: '380px',
  });
  const careerTitleWidth = Math.min(contentWidth - 50, 120);
  const careerTitleHeight = (careerTitleCanvas.height / careerTitleCanvas.width) * careerTitleWidth / 2;
  pdf.addImage(careerTitleCanvas.toDataURL('image/png'), 'PNG', margin + 45, y + 5, careerTitleWidth, careerTitleHeight);

  const descHeight = await addKoreanText(career.description, margin + 45, y + careerTitleHeight + 10, contentWidth - 50, {
    fontSize: '12px',
    color: COLORS.textLight,
  });

  y += Math.max(45, careerTitleHeight + descHeight + 15);

  checkPageBreak(40);
  
  const infoBoxWidth = (contentWidth - 5) / 2;
  
  pdf.setFillColor(...hexToRgb(COLORS.background));
  pdf.roundedRect(margin, y, infoBoxWidth, 35, 2, 2, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(...hexToRgb(COLORS.textMuted));
  pdf.text('Information', margin + 5, y + 8);
  
  if (career.salary) {
    await addKoreanText(career.salary, margin + 5, y + 12, infoBoxWidth - 10, {
      fontSize: '11px',
      fontWeight: 'bold',
      color: COLORS.text,
    });
  }

  pdf.setFillColor(...hexToRgb(COLORS.background));
  pdf.roundedRect(margin + infoBoxWidth + 5, y, infoBoxWidth, 35, 2, 2, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(...hexToRgb(COLORS.textMuted));
  pdf.setFont('helvetica', 'normal');
  pdf.text('Outlook', margin + infoBoxWidth + 10, y + 8);
  
  if (career.jobOutlook) {
    await addKoreanText(career.jobOutlook, margin + infoBoxWidth + 10, y + 12, infoBoxWidth - 10, {
      fontSize: '11px',
      fontWeight: 'bold',
      color: COLORS.text,
    });
  }

  y += 45;

  if (career.competencies && career.competencies.length > 0) {
    checkPageBreak(50);
    
    pdf.setFillColor(...hexToRgb(COLORS.background));
    pdf.roundedRect(margin, y, contentWidth, 45, 2, 2, 'F');
    
    pdf.setFontSize(11);
    pdf.setTextColor(...hexToRgb(COLORS.primary));
    pdf.setFont('helvetica', 'bold');
    pdf.text('Core Competencies', margin + 5, y + 10);
    
    const competencyText = career.competencies
      .map(c => `${c.subject}: ${Math.round((c.A / c.fullMark) * 100)}%`)
      .join('  |  ');
    
    await addKoreanText(competencyText, margin + 5, y + 15, contentWidth - 10, {
      fontSize: '10px',
      color: COLORS.textLight,
    });
    
    y += 50;
  }

  if (career.strengths?.length || career.weaknesses?.length) {
    checkPageBreak(70);
    
    const halfWidth = (contentWidth - 5) / 2;
    const sectionStartY = y;
    
    if (career.strengths?.length) {
      pdf.setFillColor(...hexToRgb('#F0FDF4'));
      pdf.roundedRect(margin, y, halfWidth, 60, 2, 2, 'F');
      
      pdf.setFontSize(11);
      pdf.setTextColor(...hexToRgb(COLORS.success));
      pdf.setFont('helvetica', 'bold');
      pdf.text('Strengths', margin + 5, y + 10);
      
      const strengthsText = career.strengths.slice(0, 4).map((s, i) => `${i + 1}. ${s}`).join('\n');
      await addKoreanText(strengthsText, margin + 5, y + 14, halfWidth - 10, {
        fontSize: '9px',
        color: COLORS.textLight,
      });
    }
    
    if (career.weaknesses?.length) {
      pdf.setFillColor(...hexToRgb('#FFF7ED'));
      pdf.roundedRect(margin + halfWidth + 5, sectionStartY, halfWidth, 60, 2, 2, 'F');
      
      pdf.setFontSize(11);
      pdf.setTextColor(...hexToRgb(COLORS.warning));
      pdf.setFont('helvetica', 'bold');
      pdf.text('Areas to Improve', margin + halfWidth + 10, sectionStartY + 10);
      
      const weaknessesText = career.weaknesses.slice(0, 4).map((w, i) => `${i + 1}. ${w}`).join('\n');
      await addKoreanText(weaknessesText, margin + halfWidth + 10, sectionStartY + 14, halfWidth - 10, {
        fontSize: '9px',
        color: COLORS.textLight,
      });
    }
    
    y += 70;
  }

  if (career.actions) {
    checkPageBreak(30);
    
    pdf.setFontSize(14);
    pdf.setTextColor(...hexToRgb(COLORS.text));
    pdf.setFont('helvetica', 'bold');
    pdf.text('Recommended Actions', margin, y);
    y += 10;
    
    const drawActionSection = async (
      title: string,
      items: string[] | undefined,
      color: string,
      bgColor: string
    ) => {
      if (!items?.length) return;
      
      checkPageBreak(45);
      
      pdf.setFillColor(...hexToRgb(bgColor));
      pdf.roundedRect(margin, y, contentWidth, 40, 2, 2, 'F');
      
      pdf.setFillColor(...hexToRgb(color));
      pdf.roundedRect(margin + 3, y + 3, 6, 34, 1, 1, 'F');
      
      pdf.setFontSize(10);
      pdf.setTextColor(...hexToRgb(COLORS.text));
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin + 15, y + 10);
      
      const itemsText = items.slice(0, 3).map((item, i) => `${i + 1}. ${item}`).join('\n');
      await addKoreanText(itemsText, margin + 15, y + 14, contentWidth - 25, {
        fontSize: '9px',
        color: COLORS.textLight,
      });
      
      y += 45;
    };
    
    await drawActionSection('Portfolio', career.actions.portfolio, COLORS.primary, '#EFF6FF');
    await drawActionSection('Networking', career.actions.networking, COLORS.purple, '#FAF5FF');
    await drawActionSection('Mindset', career.actions.mindset, COLORS.rose, '#FFF1F2');
  }

  checkPageBreak(40);
  y += 10;
  
  pdf.setFillColor(...hexToRgb(COLORS.background));
  pdf.roundedRect(margin, y, contentWidth, 25, 3, 3, 'F');
  
  pdf.setDrawColor(...hexToRgb(COLORS.border));
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin, y, contentWidth, 25, 3, 3, 'S');
  
  pdf.setFontSize(7);
  pdf.setTextColor(...hexToRgb(COLORS.textMuted));
  pdf.setFont('helvetica', 'italic');
  pdf.text('This report was generated by Konnect AI analysis system. Results are for reference only.', margin + 5, y + 8);
  pdf.text('Professional career counseling is recommended for actual career decisions.', margin + 5, y + 14);
  
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated on ${new Date().toLocaleDateString('en-US')} by Konnect AI`, margin + 5, y + 20);

  drawFooter();

  const safeTitle = career.title.replace(/[^a-zA-Z0-9가-힣\s]/g, '').replace(/\s+/g, '_').substring(0, 30);
  const fileName = `Konnect_Career_Report_${safeTitle}_${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(fileName);
}
