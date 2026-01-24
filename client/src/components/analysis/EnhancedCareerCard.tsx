import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
    Briefcase, TrendingUp, CheckCircle2, AlertTriangle, Zap,
    FolderOpen, Users, Heart, Compass, ArrowRight, Award,
    ChevronDown, ChevronUp, MapPin, Cpu, BadgeCheck, HelpCircle,
    BookOpen, DollarSign, BarChart3, TrendingDown, AlertCircle,
    GraduationCap, Target
} from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import type { 
    CareerRecommendation, 
    SalaryRange, 
    JobDemandData, 
    CompetencyEvidence, 
    StrengthWeaknessItem 
} from "@/types/career-analysis";

interface EnhancedCareerCardProps {
    career: CareerRecommendation;
    index: number;
    isExpanded: boolean;
    onToggle: (value: string) => void;
    onExportToKompass: (career: CareerRecommendation) => void;
    matchScoreLabel: string;
}

const SECTION_ID_MAP: Record<string, string> = {
    '직무 요약': 'job-summary',
    '핵심 업무': 'core-tasks',
    '필요 역량': 'required-skills',
    '진입 경로': 'entry-path'
};

const getSectionTestId = (title: string): string => {
    return SECTION_ID_MAP[title] || title.replace(/\s+/g, '-').toLowerCase();
};

const TextExpandableSection = ({ 
    title, 
    icon: Icon, 
    text,
    iconColor = "text-[#3182F6]",
    bgColor = "bg-[#F9FAFB]"
}: { 
    title: string; 
    icon: any; 
    text?: string;
    iconColor?: string;
    bgColor?: string;
}) => {
    const [expanded, setExpanded] = useState(false);
    const textRef = useRef<HTMLParagraphElement>(null);
    const [needsExpansion, setNeedsExpansion] = useState(false);

    useEffect(() => {
        if (textRef.current) {
            const lineHeight = parseInt(getComputedStyle(textRef.current).lineHeight) || 20;
            const maxHeight = lineHeight * 3;
            setNeedsExpansion(textRef.current.scrollHeight > maxHeight + 4);
        }
    }, [text]);

    if (!text) {
        return (
            <div className={cn("rounded-xl p-4 border border-[#E5E8EB]", bgColor)}>
                <div className="flex items-center gap-2 mb-3">
                    <Icon className={cn("h-4 w-4", iconColor)} />
                    <h6 className="text-sm font-bold text-[#191F28]">{title}</h6>
                </div>
                <p className="text-sm text-[#B0B8C1]">정보 준비중</p>
            </div>
        );
    }

    return (
        <div className={cn("rounded-xl p-4 border border-[#E5E8EB]", bgColor)}>
            <div className="flex items-center gap-2 mb-3">
                <Icon className={cn("h-4 w-4", iconColor)} />
                <h6 className="text-sm font-bold text-[#191F28]">{title}</h6>
            </div>
            <p 
                ref={textRef}
                className={cn(
                    "text-sm text-[#4E5968] leading-relaxed whitespace-pre-line",
                    !expanded && needsExpansion && "line-clamp-3"
                )}
            >
                {text}
            </p>
            {needsExpansion && (
                <button 
                    onClick={() => setExpanded(!expanded)}
                    className="mt-3 text-xs text-[#3182F6] font-medium flex items-center gap-1 hover:underline"
                    data-testid={`button-expand-${getSectionTestId(title)}`}
                >
                    {expanded ? <><ChevronUp className="h-3 w-3" /> 접기</> : <><ChevronDown className="h-3 w-3" /> 더보기</>}
                </button>
            )}
        </div>
    );
};

const ListExpandableSection = ({ 
    title, 
    icon: Icon, 
    items, 
    maxLines = 3,
    iconColor = "text-[#3182F6]",
    bgColor = "bg-[#F9FAFB]"
}: { 
    title: string; 
    icon: any; 
    items?: string[]; 
    maxLines?: number;
    iconColor?: string;
    bgColor?: string;
}) => {
    const [expanded, setExpanded] = useState(false);
    const safeItems = items || [];
    const displayItems = expanded ? safeItems : safeItems.slice(0, maxLines);
    const hasMore = safeItems.length > maxLines;

    return (
        <div className={cn("rounded-xl p-4 border border-[#E5E8EB]", bgColor)}>
            <div className="flex items-center gap-2 mb-3">
                <Icon className={cn("h-4 w-4", iconColor)} />
                <h6 className="text-sm font-bold text-[#191F28]">{title}</h6>
            </div>
            {safeItems.length === 0 ? (
                <p className="text-sm text-[#B0B8C1]">정보 준비중</p>
            ) : (
                <>
                    <ul className="space-y-1.5">
                        {displayItems.map((item, i) => (
                            <li key={i} className="text-sm text-[#4E5968] flex items-start gap-2">
                                <span className="text-[#B0B8C1] shrink-0">•</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                    {hasMore && (
                        <button 
                            onClick={() => setExpanded(!expanded)}
                            className="mt-3 text-xs text-[#3182F6] font-medium flex items-center gap-1 hover:underline"
                            data-testid={`button-expand-${getSectionTestId(title)}`}
                        >
                            {expanded ? <><ChevronUp className="h-3 w-3" /> 접기</> : <><ChevronDown className="h-3 w-3" /> 더보기 ({safeItems.length - maxLines}개)</>}
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

const SalaryRangeBar = ({ ranges }: { ranges: SalaryRange[] }) => {
    const maxSalary = Math.max(...ranges.map(r => r.max));
    
    return (
        <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E8EB]">
            <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-4 w-4 text-[#00BFA5]" />
                <h6 className="text-sm font-bold text-[#191F28]">경력별 연봉 범위</h6>
            </div>
            <div className="space-y-3">
                {ranges.map((range, i) => (
                    <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="font-medium text-[#4E5968]">{range.level}</span>
                            <span className="text-[#8B95A1]">{range.min.toLocaleString()}만 ~ {range.max.toLocaleString()}만원</span>
                        </div>
                        <div className="relative h-3 bg-[#E5E8EB] rounded-full overflow-hidden">
                            <div 
                                className="absolute h-full bg-gradient-to-r from-[#3182F6] to-[#00BFA5] rounded-full"
                                style={{ 
                                    left: `${(range.min / maxSalary) * 100}%`,
                                    width: `${((range.max - range.min) / maxSalary) * 100}%`
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const JobDemandIndicators = ({ demand }: { demand?: JobDemandData }) => {
    if (!demand) {
        return (
            <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E8EB]">
                <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="h-4 w-4 text-[#8B95A1]" />
                    <h6 className="text-sm font-bold text-[#191F28]">구인 수요 지표</h6>
                </div>
                <div className="flex items-center justify-center py-6 text-[#8B95A1]">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span className="text-sm">데이터 준비중</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E8EB]">
            <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-[#6366F1]" />
                <h6 className="text-sm font-bold text-[#191F28]">구인 수요 지표</h6>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-[#E5E8EB]">
                    <p className="text-[10px] text-[#8B95A1] mb-1">최근 30일</p>
                    <p className="text-lg font-bold text-[#191F28]">{demand.last30Days?.toLocaleString() || '-'}건</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-[#E5E8EB]">
                    <p className="text-[10px] text-[#8B95A1] mb-1">전월 대비</p>
                    <div className="flex items-center gap-1">
                        {demand.changeRate !== undefined && (
                            <>
                                {demand.changeRate >= 0 ? (
                                    <TrendingUp className="h-4 w-4 text-[#00BFA5]" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-[#E44E48]" />
                                )}
                                <span className={cn("text-lg font-bold", demand.changeRate >= 0 ? "text-[#00BFA5]" : "text-[#E44E48]")}>
                                    {demand.changeRate >= 0 ? '+' : ''}{demand.changeRate}%
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>
            {demand.topRegions && demand.topRegions.length > 0 && (
                <div className="mt-3">
                    <p className="text-[10px] text-[#8B95A1] mb-2 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> 상위 채용 지역
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {demand.topRegions.slice(0, 3).map((region, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] bg-white">
                                {i + 1}. {region}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
            {demand.topSkills && demand.topSkills.length > 0 && (
                <div className="mt-3">
                    <p className="text-[10px] text-[#8B95A1] mb-2 flex items-center gap-1">
                        <Cpu className="h-3 w-3" /> 요구 스킬 TOP 10
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {demand.topSkills.slice(0, 10).map((skill, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] bg-[#E8F3FF] text-[#3182F6] border-none">
                                {skill}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const CompetencyRadarWithEvidence = ({ 
    competencies, 
    evidences 
}: { 
    competencies: Array<{ subject: string; A: number; fullMark: number }>;
    evidences?: CompetencyEvidence[];
}) => {
    const [selectedCompetency, setSelectedCompetency] = useState<string | null>(null);
    const selectedEvidence = evidences?.find(e => e.subject === selectedCompetency);

    return (
        <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E8EB]">
            <h5 className="text-sm font-bold text-[#191F28] mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-[#3182F6]" /> 역량 분석
            </h5>
            <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={competencies}>
                        <PolarGrid stroke="#E5E8EB" />
                        <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fill: '#4E5968', fontSize: 10, cursor: 'pointer' }}
                            onClick={(e: any) => setSelectedCompetency(e.value)}
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                        <Radar name="역량" dataKey="A" stroke="#3182F6" fill="#3182F6" fillOpacity={0.3} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            {evidences && evidences.length > 0 && (
                <div className="mt-3">
                    <p className="text-[10px] text-[#8B95A1] mb-2 flex items-center gap-1">
                        <HelpCircle className="h-3 w-3" /> 역량을 클릭하면 근거를 확인할 수 있습니다
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {competencies.map((comp, i) => {
                            const hasEvidence = evidences.some(e => e.subject === comp.subject && e.evidences.length > 0);
                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelectedCompetency(comp.subject === selectedCompetency ? null : comp.subject)}
                                    className={cn(
                                        "text-[10px] px-2 py-1 rounded-full border transition-colors",
                                        selectedCompetency === comp.subject
                                            ? "bg-[#3182F6] text-white border-[#3182F6]"
                                            : hasEvidence 
                                                ? "bg-white text-[#4E5968] border-[#E5E8EB] hover:border-[#3182F6]"
                                                : "bg-[#F2F4F6] text-[#B0B8C1] border-[#E5E8EB]"
                                    )}
                                >
                                    {comp.subject} {hasEvidence ? `(${comp.A}점)` : '(근거 부족)'}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            {selectedEvidence && selectedEvidence.evidences.length > 0 && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-[#3182F6]/30">
                    <p className="text-xs font-bold text-[#3182F6] mb-2">"{selectedCompetency}" 점수 근거</p>
                    <ul className="space-y-1">
                        {selectedEvidence.evidences.slice(0, 3).map((evidence, i) => (
                            <li key={i} className="text-xs text-[#4E5968] flex items-start gap-1.5">
                                <CheckCircle2 className="h-3 w-3 text-[#00BFA5] shrink-0 mt-0.5" />
                                {evidence}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const StrengthWeaknessWithEvidence = ({ 
    items, 
    type 
}: { 
    items?: StrengthWeaknessItem[]; 
    type: 'strength' | 'weakness';
}) => {
    const isStrength = type === 'strength';
    const bgColor = isStrength ? "bg-[#F0FDF4]" : "bg-[#FFF7ED]";
    const iconColor = isStrength ? "text-[#00BFA5]" : "text-[#F59E0B]";
    const Icon = isStrength ? CheckCircle2 : AlertTriangle;
    const title = isStrength ? "강점" : "보완점";

    if (!items || items.length === 0) {
        return (
            <div className={cn("rounded-xl p-4", bgColor)}>
                <h5 className={cn("text-sm font-bold mb-3 flex items-center gap-2", iconColor)}>
                    <Icon className="h-4 w-4" /> {title}
                </h5>
                <p className="text-sm text-[#8B95A1]">분석 데이터가 없습니다</p>
            </div>
        );
    }

    return (
        <div className={cn("rounded-xl p-4", bgColor)}>
            <h5 className={cn("text-sm font-bold mb-3 flex items-center gap-2", iconColor)}>
                <Icon className="h-4 w-4" /> {title}
            </h5>
            <ul className="space-y-3">
                {items.map((item, i) => (
                    <li key={i} className="bg-white/60 rounded-lg p-3">
                        <p className="text-sm font-medium text-[#191F28] mb-2 flex items-start gap-2">
                            <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", iconColor)} />
                            {item.summary}
                        </p>
                        {item.evidences.length > 0 ? (
                            <ul className="ml-6 space-y-1 mb-2">
                                {item.evidences.slice(0, 3).map((ev, j) => (
                                    <li key={j} className="text-xs text-[#8B95A1] flex items-start gap-1">
                                        <span className="text-[#B0B8C1]">•</span> {ev}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="ml-6 text-xs text-[#B0B8C1] mb-2">(근거 부족)</p>
                        )}
                        {item.recommendedAction && (
                            <p className="text-xs text-[#3182F6] font-medium flex items-center gap-1 ml-6">
                                <Zap className="h-3 w-3" /> {item.recommendedAction}
                            </p>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const MajorAndCertsSection = ({ 
    majorFit, 
    certs 
}: { 
    majorFit?: { majorName: string; fitReasons: string[] };
    certs?: { name: string; type: 'required' | 'preferred' | 'alternative'; relatedSkill: string }[];
}) => {
    if (!majorFit && (!certs || certs.length === 0)) return null;

    const certTypeLabels = { required: '필수', preferred: '우대', alternative: '대체' };
    const certTypeBg = { required: 'bg-red-100 text-red-700', preferred: 'bg-blue-100 text-blue-700', alternative: 'bg-gray-100 text-gray-700' };

    return (
        <div className="grid md:grid-cols-2 gap-4">
            {majorFit && (
                <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E8EB]">
                    <div className="flex items-center gap-2 mb-3">
                        <GraduationCap className="h-4 w-4 text-[#6366F1]" />
                        <h6 className="text-sm font-bold text-[#191F28]">전공 적합도</h6>
                    </div>
                    <p className="text-sm font-medium text-[#191F28] mb-2">{majorFit.majorName}</p>
                    <div className="flex flex-wrap gap-1.5">
                        {majorFit.fitReasons.map((reason, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] bg-[#E8E8FF] text-[#6366F1] border-none">
                                {reason}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
            {certs && certs.length > 0 && (
                <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E8EB]">
                    <div className="flex items-center gap-2 mb-3">
                        <BadgeCheck className="h-4 w-4 text-[#00BFA5]" />
                        <h6 className="text-sm font-bold text-[#191F28]">추천 자격증</h6>
                    </div>
                    <ul className="space-y-2">
                        {certs.map((cert, i) => (
                            <li key={i} className="flex items-center justify-between bg-white rounded-lg p-2 border border-[#E5E8EB]">
                                <div className="flex items-center gap-2">
                                    <Badge className={cn("text-[10px] px-1.5", certTypeBg[cert.type])}>
                                        {certTypeLabels[cert.type]}
                                    </Badge>
                                    <span className="text-sm text-[#191F28]">{cert.name}</span>
                                </div>
                                <span className="text-[10px] text-[#8B95A1]">{cert.relatedSkill}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export function EnhancedCareerCard({
    career,
    index,
    isExpanded,
    onToggle,
    onExportToKompass,
    matchScoreLabel
}: EnhancedCareerCardProps) {
    const defaultSalaryRanges: SalaryRange[] = career.salary ? [
        { level: '신입', min: 2800, max: 3500 },
        { level: '3년차', min: 3500, max: 4500 },
        { level: '5년차', min: 4500, max: 6000 },
        { level: '10년차', min: 6000, max: 9000 },
    ] : [];

    const salaryRanges = career.salaryRanges || defaultSalaryRanges;

    return (
        <Card className={cn(
            "border transition-all duration-300",
            isExpanded ? "border-[#3182F6] shadow-lg" : "border-[#E5E8EB] hover:border-[#3182F6]/50"
        )}>
            <Accordion type="single" collapsible value={isExpanded ? `career-${index}` : ""} onValueChange={onToggle}>
                <AccordionItem value={`career-${index}`} className="border-none">
                    <AccordionTrigger className="px-5 py-4 hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-2">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3182F6] to-[#1565C0] flex items-center justify-center shrink-0">
                                    <span className="text-lg font-bold text-white">{career.matchScore}%</span>
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="text-base font-bold text-[#191F28]">{career.title}</h4>
                                        {index === 0 && (
                                            <Badge className="bg-[#E8F3FF] text-[#3182F6] hover:bg-[#E8F3FF] border-none px-2 py-0.5 text-[10px]">
                                                AI Pick
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-[#8B95A1] mb-1">{matchScoreLabel} · 진로진단 적합도 {career.matchScore}%</p>
                                    {/* 진단 기반 추천 근거 태그 */}
                                    {career.strengths && career.strengths.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1" data-testid={`tags-recommendation-basis-${index}`}>
                                            {career.strengths.slice(0, 3).map((strength, i) => (
                                                <Badge 
                                                    key={i} 
                                                    variant="outline" 
                                                    className="text-[9px] px-1.5 py-0 h-4 bg-[#F0FDF4] text-[#16A34A] border-[#16A34A]/30"
                                                    data-testid={`tag-strength-${index}-${i}`}
                                                >
                                                    {strength.length > 12 ? strength.substring(0, 12) + '...' : strength}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-5 pb-5">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <TextExpandableSection
                                    title="직무 요약"
                                    icon={Briefcase}
                                    text={career.jobSummary || career.description}
                                />
                                <ListExpandableSection
                                    title="핵심 업무"
                                    icon={Target}
                                    items={career.coreTasks}
                                    maxLines={3}
                                />
                                <ListExpandableSection
                                    title="필요 역량"
                                    icon={Award}
                                    items={career.requiredSkills}
                                    maxLines={3}
                                    iconColor="text-[#6366F1]"
                                />
                                <ListExpandableSection
                                    title="진입 경로"
                                    icon={BookOpen}
                                    items={career.entryPath}
                                    maxLines={3}
                                    iconColor="text-[#F59E0B]"
                                />
                            </div>

                            {salaryRanges.length > 0 && (
                                <SalaryRangeBar ranges={salaryRanges} />
                            )}

                            <JobDemandIndicators demand={career.jobDemand} />

                            {career.competencies && career.competencies.length > 0 && (
                                <CompetencyRadarWithEvidence 
                                    competencies={career.competencies}
                                    evidences={career.competencyEvidences}
                                />
                            )}

                            <div className="grid md:grid-cols-2 gap-4">
                                <StrengthWeaknessWithEvidence 
                                    items={career.strengthDetails || career.strengths?.map(s => ({ summary: s, evidences: [], recommendedAction: undefined }))}
                                    type="strength"
                                />
                                <StrengthWeaknessWithEvidence 
                                    items={career.weaknessDetails || career.weaknesses?.map(w => ({ summary: w, evidences: [], recommendedAction: undefined }))}
                                    type="weakness"
                                />
                            </div>

                            <MajorAndCertsSection 
                                majorFit={career.majorFit}
                                certs={career.recommendedCerts}
                            />

                            {career.actions && (
                                <div className="space-y-4">
                                    <h5 className="text-base font-bold text-[#191F28] flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-[#3182F6]" /> 추천 액션
                                    </h5>
                                    
                                    <div className="grid gap-4">
                                        {career.actions.portfolio?.length > 0 && (
                                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-8 h-8 rounded-lg bg-[#3182F6] flex items-center justify-center">
                                                        <FolderOpen className="h-4 w-4 text-white" />
                                                    </div>
                                                    <div>
                                                        <h6 className="text-sm font-bold text-[#191F28]">포트폴리오</h6>
                                                        <p className="text-[10px] text-[#8B95A1]">만들고 준비할 것들</p>
                                                    </div>
                                                </div>
                                                <ul className="space-y-2">
                                                    {career.actions.portfolio.map((item, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-[#4E5968] bg-white/60 rounded-lg p-2.5">
                                                            <div className="w-5 h-5 rounded-full bg-[#3182F6]/10 flex items-center justify-center shrink-0 mt-0.5">
                                                                <span className="text-[10px] font-bold text-[#3182F6]">{i + 1}</span>
                                                            </div>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {career.actions.networking?.length > 0 && (
                                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                                                        <Users className="h-4 w-4 text-white" />
                                                    </div>
                                                    <div>
                                                        <h6 className="text-sm font-bold text-[#191F28]">네트워킹</h6>
                                                        <p className="text-[10px] text-[#8B95A1]">만나고 연결할 사람들</p>
                                                    </div>
                                                </div>
                                                <ul className="space-y-2">
                                                    {career.actions.networking.map((item, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-[#4E5968] bg-white/60 rounded-lg p-2.5">
                                                            <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                                                <span className="text-[10px] font-bold text-purple-600">{i + 1}</span>
                                                            </div>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {career.actions.mindset?.length > 0 && (
                                            <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl p-4 border border-rose-100">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center">
                                                        <Heart className="h-4 w-4 text-white" />
                                                    </div>
                                                    <div>
                                                        <h6 className="text-sm font-bold text-[#191F28]">마인드셋</h6>
                                                        <p className="text-[10px] text-[#8B95A1]">갖춰야 할 마음가짐</p>
                                                    </div>
                                                </div>
                                                <ul className="space-y-2">
                                                    {career.actions.mindset.map((item, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-[#4E5968] bg-white/60 rounded-lg p-2.5">
                                                            <div className="w-5 h-5 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                                                <Heart className="h-3 w-3 text-rose-500" />
                                                            </div>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button 
                                    onClick={() => onExportToKompass(career)}
                                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#3182F6] to-[#1565C0] text-white font-bold hover:opacity-90 transition-opacity"
                                    data-testid={`button-export-kompass-${index}`}
                                >
                                    <Compass className="h-5 w-5 mr-2" />
                                    Kompass
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
}
