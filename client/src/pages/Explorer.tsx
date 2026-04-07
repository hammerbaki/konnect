import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, ArrowRight, Building2, Briefcase, X, GraduationCap, TrendingUp, Smile, Activity, Star, Users, Award, BookOpen, Link2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// Type definition for the API response
interface CareerApiItem {
    id: string;
    name: string;
    category: string | null;
    description: string | null;
    fullData: any | null;
    detailData: any | null;
    createdAt: string | null;
    updatedAt: string | null;
}

interface ProcessedCareer {
    id: string;
    title: string;
    largeClass: string; // 대분류
    mediumClass: string; // 중분류
    description: string; // Summary
    tags: string[];
    salary?: string;
    salaryNum?: number; // numeric salary for sorting
    duties?: string;
    education?: string;
    satisfaction?: number;
    prospect?: string;
    abilities?: { name: string; score: number; desc: string }[];
    personality?: { name: string; score: number; desc: string }[];
    relatedJobs?: { id: string; name: string }[];
    relatedMajors?: { code: string; name: string }[];
    relatedCerts?: string[];
    interestType?: string;
}

import careerImages from "@/lib/careerImages.json";
import { MOCK_USER } from "@/lib/mockData";

// Component for Detail Content
function CareerDetailContent({ career }: { career: ProcessedCareer }) {
    // Helper to format duties with bullet points
    const formattedDuties = career.duties?.split('\n').filter(line => line.trim().length > 0).map(line => line.replace(/^-/, '').trim()) || [];
    const [imageError, setImageError] = useState(false);
    
    // Determine which image(s) to show
    const careerImagesMap = careerImages as Record<string, { male?: string, female?: string }>;
    const images = careerImagesMap[career.id];
    const userGender = MOCK_USER.gender;
    
    let primaryImage: string | null = null;
    let secondaryImage: string | null = null;

    if (images) {
        if (userGender === 'male' && images.male) {
            primaryImage = images.male;
        } else if (userGender === 'female' && images.female) {
            primaryImage = images.female;
        } else {
            // If gender not set or image for gender missing, prioritize existing ones
            if (images.male) primaryImage = images.male;
            if (images.female) {
                if (primaryImage) secondaryImage = images.female;
                else primaryImage = images.female;
            }
        }
    }

    return (
        <div className="flex-1 overflow-y-auto p-0">
            <Tabs defaultValue="overview" className="w-full">
                <div className="sticky top-0 z-10 bg-white border-b border-[#F2F4F6] px-5 pt-2">
                    <TabsList className="w-full justify-start h-12 p-0 bg-transparent space-x-6">
                        <TabsTrigger value="overview" className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-[#320e9d] data-[state=active]:text-[#320e9d] data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-[#8B95A1]">
                            개요
                        </TabsTrigger>
                        <TabsTrigger value="duties" className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-[#320e9d] data-[state=active]:text-[#320e9d] data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-[#8B95A1]">
                            하는 일
                        </TabsTrigger>
                        <TabsTrigger value="preparation" className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-[#320e9d] data-[state=active]:text-[#320e9d] data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-[#8B95A1]">
                            준비 방법
                        </TabsTrigger>
                        <TabsTrigger value="fit" className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-[#320e9d] data-[state=active]:text-[#320e9d] data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-[#8B95A1]">
                            적성 및 흥미
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="p-5 pb-10">
                    <TabsContent value="overview" className="mt-0 space-y-6">
                        {/* Career Images */}
                        {!imageError && primaryImage && (
                            <div className="w-full rounded-xl overflow-hidden bg-white mb-4 border border-[#E5E8EB] grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-1">
                                <div className="aspect-video relative">
                                     <img 
                                        src={primaryImage} 
                                        alt={career.title}
                                        className="w-full h-full object-contain absolute inset-0"
                                        onError={() => setImageError(true)}
                                    />
                                </div>
                                {secondaryImage && (
                                    <div className="aspect-video relative">
                                        <img 
                                            src={secondaryImage} 
                                            alt={`${career.title} alternate`}
                                            className="w-full h-full object-contain absolute inset-0"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Header Info */}
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <Badge variant="outline" className="bg-[#F9FAFB] text-[#4E5968] border-[#E5E8EB] font-normal">
                                    {career.largeClass}
                                </Badge>
                                <Badge variant="secondary" className="bg-dream/10 text-[#320e9d] hover:bg-dream/10 border-none">
                                    {career.mediumClass}
                                </Badge>
                                <Badge variant="outline" className="text-[#8B95A1] border-[#E5E8EB] font-normal text-xs">
                                    ID: {career.id}
                                </Badge>
                            </div>
                            <h2 className="text-[24px] font-bold text-[#191F28] leading-tight mb-3">{career.title}</h2>
                            <p className="text-[#4E5968] text-lg leading-relaxed">
                                {career.description}
                            </p>
                        </div>

                        {/* Key Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#F2F4F6]">
                                <div className="flex items-center gap-2 text-[#8B95A1] mb-1.5">
                                    <span className="font-bold text-sm">₩</span>
                                    <span className="text-xs font-bold">평균 연봉</span>
                                </div>
                                <p className="text-lg font-bold text-[#191F28]">{career.salary || "정보 없음"}</p>
                            </div>
                            <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#F2F4F6]">
                                <div className="flex items-center gap-2 text-[#8B95A1] mb-1.5">
                                    <Smile className="h-4 w-4" />
                                    <span className="text-xs font-bold">직업 만족도</span>
                                </div>
                                <div className="flex items-end gap-1">
                                    <p className="text-lg font-bold text-[#191F28]">{career.satisfaction || 0}%</p>
                                    {career.satisfaction && career.satisfaction > 70 && (
                                        <span className="text-xs font-medium text-[#320e9d] mb-1">높음</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Prospect */}
                        {career.prospect && (
                            <div className="bg-dream/10 border border-blue-100 rounded-xl p-5">
                                <h4 className="text-[#320e9d] text-sm font-bold flex items-center gap-2 mb-2">
                                    <TrendingUp className="h-4 w-4" /> 향후 전망
                                </h4>
                                <p className="text-[#4E5968] text-sm leading-relaxed">
                                    {career.prospect}
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="duties" className="mt-0">
                        <div className="space-y-4">
                            <h3 className="font-bold text-[#191F28] text-lg flex items-center gap-2">
                                <Activity className="h-5 w-5 text-[#320e9d]" /> 주요 업무
                            </h3>
                            <div className="space-y-3">
                                {formattedDuties.map((duty, i) => (
                                    <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-[#E5E8EB] shadow-sm">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#320e9d] shrink-0 mt-2" />
                                        <p className="font-medium text-[#333D4B] text-base leading-snug">{duty}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="preparation" className="mt-0">
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-[#191F28] text-lg flex items-center gap-2 mb-4">
                                    <GraduationCap className="h-5 w-5 text-[#320e9d]" /> 교육 및 자격
                                </h3>
                                <div className="prose prose-sm text-[#4E5968] bg-[#F9FAFB] p-5 rounded-xl border border-[#F2F4F6] leading-relaxed whitespace-pre-line">
                                    {career.education || "관련 정보가 없습니다."}
                                </div>
                            </div>
                            
                            {career.tags.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-[#191F28] mb-3">관련 키워드</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {career.tags.map((tag) => (
                                            <span key={tag} className="px-3 py-1.5 rounded-lg bg-background text-[#4E5968] text-sm font-medium">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="fit" className="mt-0 space-y-8">
                        {career.abilities && career.abilities.length > 0 && (
                            <div>
                                <h3 className="font-bold text-[#191F28] text-lg flex items-center gap-2 mb-4">
                                    <Star className="h-5 w-5 text-[#320e9d]" /> 핵심 역량
                                </h3>
                                <div className="space-y-4">
                                    {career.abilities.map((abil, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-[#333D4B]">{abil.name}</span>
                                                <span className="text-xs font-medium text-[#8B95A1]">{abil.score}점</span>
                                            </div>
                                            <Progress value={(abil.score / 5) * 100} className="h-2 bg-background" />
                                            <p className="text-xs text-[#6B7684]">{abil.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {career.personality && career.personality.length > 0 && (
                            <div>
                                <h3 className="font-bold text-[#191F28] text-lg flex items-center gap-2 mb-4">
                                    <Smile className="h-5 w-5 text-[#320e9d]" /> 성격 및 가치관
                                </h3>
                                <div className="grid gap-3">
                                    {career.personality.map((pers, i) => (
                                        <div key={i} className="p-4 bg-[#F9FAFB] rounded-xl border border-[#F2F4F6]">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-[#333D4B]">{pers.name}</span>
                                                <span className="text-xs font-bold text-[#320e9d] bg-dream/10 px-2 py-0.5 rounded-full">{pers.score}점</span>
                                            </div>
                                            <p className="text-sm text-[#6B7684] leading-snug">{pers.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

// Responsive Modal Wrapper
function ResponsiveCareerDetail({ career, open, onOpenChange }: { career: ProcessedCareer | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    const isMobile = useIsMobile();

    if (!career) return null;

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent className="h-[85vh] rounded-t-[24px] flex flex-col outline-none">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[#E5E8EB] mt-3 mb-1" />
                    <div className="flex justify-between items-center px-5 py-3 border-b border-[#F2F4F6]">
                        <DrawerTitle className="text-[18px] font-bold text-[#191F28]">직업 상세 정보</DrawerTitle>
                        <DrawerClose asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background hover:bg-[#E5E8EB]">
                                <X className="h-4 w-4 text-[#333D4B]" />
                            </Button>
                        </DrawerClose>
                    </div>
                    <CareerDetailContent career={career} />
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-[24px] gap-0 bg-white border-none shadow-2xl [&>button]:hidden">
                <DialogHeader className="p-6 pb-4 border-b border-[#F2F4F6] flex-shrink-0 flex flex-row justify-between items-center space-y-0">
                    <DialogTitle className="text-[24px] font-bold text-[#191F28]">직업 상세 정보</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-background">
                            <X className="h-5 w-5 text-[#333D4B]" />
                        </Button>
                    </DialogClose>
                </DialogHeader>
                <CareerDetailContent career={career} />
            </DialogContent>
        </Dialog>
    );
}

// Server-computed stats type
interface ServerStats {
    totalCareers: number;
    totalCategories: number;
    topSalary: { name: string; salary: number }[];
    topSatisfaction: { name: string; satisfaction: number }[];
    categoryData: { name: string; value: number }[];
    avgSatisfaction: string;
    hierarchy: Record<string, string[]>;
}

export default function Explorer() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLargeClass, setSelectedLargeClass] = useState<string>("all");
    const [selectedMediumClass, setSelectedMediumClass] = useState<string>("all");
    const [visibleCount, setVisibleCount] = useState(30);
    
    // Modal State
    const [selectedCareer, setSelectedCareer] = useState<ProcessedCareer | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Server-computed stats (loads fast, cached for 10 minutes)
    const { data: serverStats, isLoading: statsLoading } = useQuery<ServerStats>({
        queryKey: ['/api/careers/stats/overview'],
        staleTime: 10 * 60 * 1000, // Cache for 10 minutes
        gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    });

    // Career data (cached for 10 minutes)
    const { data: rawData, isLoading, error: loadError } = useQuery<CareerApiItem[]>({
        queryKey: ['/api/careers'],
        staleTime: 10 * 60 * 1000, // Cache for 10 minutes
        gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    });

    const handleCardClick = (career: ProcessedCareer) => {
        setSelectedCareer(career);
        setIsModalOpen(true);
    };


    // Process and memoize the data
    const { careers, hierarchy } = useMemo(() => {
        if (!rawData) return { careers: [], hierarchy: {} };
        
        const hierarchyMap = new Map<string, Set<string>>();
        
        const processed: ProcessedCareer[] = rawData.map(item => {
            let largeClass = "기타";
            let mediumClass = "기타";
            let tags: string[] = [];
            let salary = "정보 없음";
            let duties = "";
            let education = "";
            let satisfaction = 0;
            let prospect = "";
            let abilities: { name: string; score: number; desc: string }[] = [];
            let personality: { name: string; score: number; desc: string }[] = [];
            
            try {
                const detail = item.detailData;
                
                // Tab 1: Summary
                const jobSum = detail?.tabs?.['1']?.data?.jobSum;
                if (jobSum) {
                    if (jobSum.jobLrclNm) largeClass = jobSum.jobLrclNm;
                    if (jobSum.jobMdclNm) mediumClass = jobSum.jobMdclNm;
                    if (jobSum.jobSmclNm && jobSum.jobSmclNm !== item.name) tags.push(jobSum.jobSmclNm);
                }

                // Tab 2: Doing (Duties)
                const jobsDo = detail?.tabs?.['2']?.data?.jobsDo;
                if (jobsDo && jobsDo.execJob) {
                    duties = jobsDo.execJob;
                }

                // Tab 3: Education/Training
                const eduData = detail?.tabs?.['3']?.data?.way;
                if (eduData && eduData.technKnow) {
                    education = eduData.technKnow;
                }

                // Tab 4: Salary & Prospect
                const salData = detail?.tabs?.['4']?.data?.salProspect;
                if (salData) {
                    if (salData.sal) {
                        // Extract average salary: "평균(50%) 13000만원" -> "1억 3,000만원"
                        // Simple regex to find the number after 50%
                        const match = salData.sal.match(/평균\(50%\)\s*(\d+)/);
                        if (match && match[1]) {
                            const amount = parseInt(match[1]);
                            salary = amount >= 10000 
                                ? `${(amount/10000).toFixed(1)}억원` 
                                : `${amount.toLocaleString()}만원`;
                        } else {
                            salary = salData.sal;
                        }
                    }
                    if (salData.jobSatis) {
                        satisfaction = parseFloat(salData.jobSatis);
                    }
                    if (salData.jobProspect) {
                        prospect = salData.jobProspect;
                    }
                }

                // Tab 5: Abilities
                const abilData = detail?.tabs?.['5']?.data?.ablKnwEnv;
                if (abilData && Array.isArray(abilData.jobAbilCmpr)) {
                    abilities = abilData.jobAbilCmpr.slice(0, 5).map((a: any) => ({
                        name: a.jobAblNmCmpr,
                        score: parseFloat(a.jobAblStatusCmpr),
                        desc: a.jobAblContCmpr
                    }));
                }

                // Tab 6: Personality
                const persData = detail?.tabs?.['6']?.data?.chrIntrVals;
                if (persData && Array.isArray(persData.jobChrCmpr)) {
                    personality = persData.jobChrCmpr.slice(0, 3).map((p: any) => ({
                        name: p.jobChrNmCmpr,
                        score: parseFloat(p.jobChrStatusCmpr),
                        desc: p.jobChrContCmpr
                    }));
                }

            } catch (e) {
                // Fallback
            }
            
            // Extract additional fields
            let relatedJobs: { id: string; name: string }[] = [];
            let relatedMajors: { code: string; name: string }[] = [];
            let relatedCerts: string[] = [];
            let interestType = "";
            let salaryNum = 0;
            
            try {
                const detail = item.detailData;
                const jobSum = detail?.tabs?.['1']?.data?.jobSum;
                
                // Related Jobs
                if (jobSum?.relJobList && Array.isArray(jobSum.relJobList)) {
                    relatedJobs = jobSum.relJobList.slice(0, 5).map((j: any) => ({
                        id: j.jobCd,
                        name: j.jobNm
                    }));
                }
                
                // Related Majors
                const wayData = detail?.tabs?.['3']?.data?.way;
                if (wayData?.relMajorList) {
                    const major = wayData.relMajorList;
                    if (major.majorNm) {
                        relatedMajors = [{ code: major.majorCd || '', name: major.majorNm }];
                    }
                }
                
                // Related Certifications
                if (wayData?.relCertList) {
                    const cert = wayData.relCertList;
                    if (cert.certNm) {
                        relatedCerts = [cert.certNm];
                    }
                }
                
                // Interest Type
                if (jobSum?.jobIntrst) {
                    interestType = jobSum.jobIntrst;
                }
                
                // Numeric salary for sorting
                const salData = detail?.tabs?.['4']?.data?.salProspect;
                if (salData?.sal) {
                    const match = salData.sal.match(/평균\(50%\)\s*(\d+)/);
                    if (match && match[1]) {
                        salaryNum = parseInt(match[1]);
                    }
                }
            } catch (e) {
                // Fallback
            }
            
            // Build Hierarchy
            if (!hierarchyMap.has(largeClass)) {
                hierarchyMap.set(largeClass, new Set());
            }
            hierarchyMap.get(largeClass)?.add(mediumClass);

            return {
                id: item.id,
                title: item.name,
                largeClass,
                mediumClass,
                description: item.description || "",
                tags: tags.slice(0, 3),
                salary,
                salaryNum,
                duties,
                education,
                satisfaction,
                prospect,
                abilities,
                personality,
                relatedJobs,
                relatedMajors,
                relatedCerts,
                interestType
            };
        });

        // Sort Hierarchy
        const sortedHierarchy: Record<string, string[]> = {};
        Array.from(hierarchyMap.keys()).sort().forEach(key => {
            sortedHierarchy[key] = Array.from(hierarchyMap.get(key) || []).sort();
        });

        return { careers: processed, hierarchy: sortedHierarchy };
    }, [rawData]);

    // Use server-computed stats (pre-calculated, fast)
    const stats = serverStats;
    
    // Use hierarchy from server stats (fallback to computed if not available)
    const displayHierarchy = serverStats?.hierarchy || hierarchy;

    const CHART_COLORS = ['#320e9d', '#00BFA5', '#9852F8', '#FFB300', '#E44E48', '#8B95A1'];

    // Filter logic
    const filteredCareers = useMemo(() => {
        return careers.filter(career => {
            const matchesSearch = career.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                career.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                career.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const matchesLarge = selectedLargeClass === "all" || career.largeClass === selectedLargeClass;
            const matchesMedium = selectedMediumClass === "all" || career.mediumClass === selectedMediumClass;

            return matchesSearch && matchesLarge && matchesMedium;
        });
    }, [careers, searchQuery, selectedLargeClass, selectedMediumClass]);

    // Reset medium class when large class changes
    const handleLargeClassChange = (value: string) => {
        setSelectedLargeClass(value);
        setSelectedMediumClass("all");
        setVisibleCount(20);
    };

    const handleMediumClassChange = (value: string) => {
        setSelectedMediumClass(value);
        setVisibleCount(20);
    };

    // Pagination
    const visibleCareers = filteredCareers.slice(0, visibleCount);
    const handleLoadMore = () => setVisibleCount(prev => prev + 30);

    const availableMediumClasses = selectedLargeClass !== "all" ? displayHierarchy[selectedLargeClass] : [];

    // Skeleton card component for loading state
    const SkeletonCard = () => (
        <Card className="border-[#E5E8EB] shadow-sm animate-pulse">
            <CardContent className="p-5">
                <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex gap-2">
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    // Show skeleton UI while loading (shows stats if available, skeleton cards for careers)
    if (isLoading) {
        return (
            <>
                <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6 px-4">
                    {/* Header */}
                    <div className="mb-8 text-center space-y-3">
                        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-dream/10 mb-2">
                            <Building2 className="h-7 w-7 text-[#320e9d]" />
                        </div>
                        <h2 className="text-[28px] font-bold text-[#191F28] leading-tight">
                            직업 정보 탐색
                        </h2>
                        <p className="text-[#4E5968] text-base">
                            {stats?.totalCareers ? `${stats.totalCareers}개의 직업 정보를 불러오는 중...` : '직업 정보를 불러오는 중...'}
                        </p>
                    </div>
                    
                    {/* Stats skeleton or real stats (loads first) */}
                    {statsLoading ? (
                        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[1,2,3,4].map(i => (
                                <Card key={i} className="border-[#E5E8EB] shadow-sm">
                                    <CardContent className="p-4 text-center space-y-2">
                                        <Skeleton className="h-10 w-10 rounded-full mx-auto" />
                                        <Skeleton className="h-7 w-16 mx-auto" />
                                        <Skeleton className="h-3 w-12 mx-auto" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : stats && (
                        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Card className="border-[#E5E8EB] shadow-sm">
                                <CardContent className="p-4 text-center">
                                    <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-dream/10 mb-2">
                                        <Briefcase className="h-5 w-5 text-[#320e9d]" />
                                    </div>
                                    <div className="text-2xl font-bold text-[#191F28]">{stats.totalCareers}</div>
                                    <div className="text-xs text-[#8B95A1]">총 직업 수</div>
                                </CardContent>
                            </Card>
                            <Card className="border-[#E5E8EB] shadow-sm">
                                <CardContent className="p-4 text-center">
                                    <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-green-50 mb-2">
                                        <Smile className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="text-2xl font-bold text-[#191F28]">{stats.avgSatisfaction}</div>
                                    <div className="text-xs text-[#8B95A1]">평균 만족도</div>
                                </CardContent>
                            </Card>
                            <Card className="border-[#E5E8EB] shadow-sm">
                                <CardContent className="p-4 text-center">
                                    <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-purple-50 mb-2">
                                        <span className="text-purple-600 font-bold text-lg">₩</span>
                                    </div>
                                    <div className="text-2xl font-bold text-[#191F28]">
                                        {stats.topSalary?.[0]?.salary 
                                            ? (stats.topSalary[0].salary >= 10000 
                                                ? `${(stats.topSalary[0].salary / 10000).toFixed(1)}억`
                                                : `${stats.topSalary[0].salary.toLocaleString()}만`)
                                            : '데이터 없음'}
                                    </div>
                                    <div className="text-xs text-[#8B95A1]">최고 연봉</div>
                                </CardContent>
                            </Card>
                            <Card className="border-[#E5E8EB] shadow-sm">
                                <CardContent className="p-4 text-center">
                                    <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-orange-50 mb-2">
                                        <Users className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div className="text-2xl font-bold text-[#191F28]">{stats.totalCategories}</div>
                                    <div className="text-xs text-[#8B95A1]">직군 분류</div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    
                    {/* Career cards skeleton */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-6 w-32" />
                        </div>
                        <div className="grid gap-4">
                            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Error state
    if (loadError) {
        return (
            <>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-50 mb-2">
                            <X className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-[#191F28]">직업 데이터를 불러오는데 실패했습니다.</h2>
                        <Button onClick={() => window.location.reload()} variant="outline">
                            다시 시도
                        </Button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6 px-4">
                
                {/* Header */}
                <div className="mb-8 text-center space-y-3">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-dream/10 mb-2">
                        <Building2 className="h-7 w-7 text-[#320e9d]" />
                    </div>
                    <h2 className="text-[28px] font-bold text-[#191F28] leading-tight">
                        직업 정보 탐색
                    </h2>
                    <p className="text-[#4E5968] text-base">
                        표준 직업 분류 체계에 따른 {stats?.totalCareers || 0}개의 직업 정보를 확인하세요.
                    </p>
                </div>

                {/* Statistics Dashboard */}
                {stats && (
                    <div className="mb-8 space-y-4">
                        {/* Quick Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Card className="border-[#E5E8EB] shadow-sm">
                                <CardContent className="p-4 text-center">
                                    <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-dream/10 mb-2">
                                        <Briefcase className="h-5 w-5 text-[#320e9d]" />
                                    </div>
                                    <div className="text-2xl font-bold text-[#191F28]">{stats.totalCareers}</div>
                                    <div className="text-xs text-[#8B95A1]">총 직업 수</div>
                                </CardContent>
                            </Card>
                            <Card className="border-[#E5E8EB] shadow-sm">
                                <CardContent className="p-4 text-center">
                                    <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-green-50 mb-2">
                                        <Smile className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="text-2xl font-bold text-[#191F28]">{stats.avgSatisfaction}</div>
                                    <div className="text-xs text-[#8B95A1]">평균 만족도</div>
                                </CardContent>
                            </Card>
                            <Card className="border-[#E5E8EB] shadow-sm">
                                <CardContent className="p-4 text-center">
                                    <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-purple-50 mb-2">
                                        <span className="text-purple-600 font-bold text-lg">₩</span>
                                    </div>
                                    <div className="text-2xl font-bold text-[#191F28]">
                                        {stats.topSalary?.[0]?.salary 
                                            ? (stats.topSalary[0].salary >= 10000 
                                                ? `${(stats.topSalary[0].salary / 10000).toFixed(1)}억`
                                                : `${stats.topSalary[0].salary.toLocaleString()}만`)
                                            : '데이터 없음'}
                                    </div>
                                    <div className="text-xs text-[#8B95A1]">최고 연봉</div>
                                </CardContent>
                            </Card>
                            <Card className="border-[#E5E8EB] shadow-sm">
                                <CardContent className="p-4 text-center">
                                    <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-orange-50 mb-2">
                                        <Users className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div className="text-2xl font-bold text-[#191F28]">{stats.totalCategories || Object.keys(displayHierarchy).length || 0}</div>
                                    <div className="text-xs text-[#8B95A1]">직군 분류</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Top Salary Chart */}
                            <Card className="border-[#E5E8EB] shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <span className="text-[#320e9d] font-bold text-sm">₩</span>
                                        연봉 TOP 5
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <ResponsiveContainer width="100%" height={150}>
                                        <BarChart data={stats.topSalary} layout="vertical" margin={{ left: 0, right: 10 }}>
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 11 }} />
                                            <Tooltip formatter={(v: number) => v >= 10000 ? `${(v/10000).toFixed(1)}억원` : `${v.toLocaleString()}만원`} />
                                            <Bar dataKey="salary" fill="#320e9d" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Category Distribution */}
                            <Card className="border-[#E5E8EB] shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-[#9852F8]" />
                                        직군별 분포
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <ResponsiveContainer width="100%" height={150}>
                                        <PieChart>
                                            <Pie
                                                data={stats.categoryData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={35}
                                                outerRadius={55}
                                                dataKey="value"
                                                nameKey="name"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                labelLine={false}
                                            >
                                                {stats.categoryData.map((_, idx) => (
                                                    <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v: number) => `${v}개`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Smart Filter Section */}
                <div className="bg-white border border-[#E5E8EB] rounded-2xl p-5 shadow-sm mb-8 z-20">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* 1. Search Input */}
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-[#8B95A1]" />
                            </div>
                            <Input 
                                className="pl-10 h-11 text-base rounded-xl border-[#E5E8EB] bg-[#F9FAFB] focus-visible:ring-[#320e9d] focus-visible:bg-white transition-all"
                                placeholder="직업명, 키워드로 검색..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* 2. Large Class Filter */}
                        <div className="w-full md:w-[220px]">
                            <Select value={selectedLargeClass} onValueChange={handleLargeClassChange}>
                                <SelectTrigger className="h-11 rounded-xl border-[#E5E8EB] bg-white font-medium text-[#333D4B]">
                                    <SelectValue placeholder="직군 대분류 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="font-bold">전체 직군</SelectItem>
                                    {Object.keys(displayHierarchy).map((large) => (
                                        <SelectItem key={large} value={large}>{large}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 3. Medium Class Filter (Dependent) */}
                        <div className="w-full md:w-[220px]">
                            <Select 
                                value={selectedMediumClass} 
                                onValueChange={handleMediumClassChange}
                                disabled={selectedLargeClass === "all"}
                            >
                                <SelectTrigger className="h-11 rounded-xl border-[#E5E8EB] bg-white font-medium text-[#333D4B]">
                                    <SelectValue placeholder="직군 중분류 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="font-bold">전체 중분류</SelectItem>
                                    {availableMediumClasses?.map((medium) => (
                                        <SelectItem key={medium} value={medium}>{medium}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    {/* Active Filters Badges */}
                    {(selectedLargeClass !== "all" || searchQuery) && (
                        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[#F2F4F6]">
                            <span className="text-xs font-bold text-[#8B95A1] mr-1">적용된 필터:</span>
                            
                            {selectedLargeClass !== "all" && (
                                <Badge variant="secondary" className="bg-dream/10 text-[#320e9d] hover:bg-blue-100 gap-1 pr-1.5">
                                    {selectedLargeClass}
                                    <X 
                                        className="h-3 w-3 cursor-pointer hover:text-blue-700" 
                                        onClick={() => handleLargeClassChange("all")}
                                    />
                                </Badge>
                            )}
                            
                            {selectedMediumClass !== "all" && (
                                <Badge variant="secondary" className="bg-dream/10 text-[#320e9d] hover:bg-blue-100 gap-1 pr-1.5">
                                    {selectedMediumClass}
                                    <X 
                                        className="h-3 w-3 cursor-pointer hover:text-blue-700" 
                                        onClick={() => handleMediumClassChange("all")}
                                    />
                                </Badge>
                            )}

                            {searchQuery && (
                                <Badge variant="secondary" className="bg-background text-[#4E5968] hover:bg-[#E5E8EB] gap-1 pr-1.5">
                                    "{searchQuery}" 검색
                                    <X 
                                        className="h-3 w-3 cursor-pointer hover:text-gray-700" 
                                        onClick={() => setSearchQuery("")}
                                    />
                                </Badge>
                            )}

                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-xs text-[#8B95A1] hover:text-[#E44E48] ml-auto"
                                onClick={() => {
                                    setSearchQuery("");
                                    handleLargeClassChange("all");
                                }}
                            >
                                초기화
                            </Button>
                        </div>
                    )}
                </div>

                {/* Results Grid */}
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="font-bold text-[#191F28] text-lg">
                        검색 결과 <span className="text-[#320e9d]">{filteredCareers.length}</span>건
                    </h3>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visibleCareers.map((career) => (
                        <Card 
                            key={career.id} 
                            onClick={() => handleCardClick(career)}
                            className="border-[#E5E8EB] shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-[#320e9d] group bg-white flex flex-col"
                        >
                            <CardHeader className="pb-3 flex-1">
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge variant="outline" className="bg-[#F9FAFB] text-[#4E5968] border-[#E5E8EB] font-normal">
                                        {career.largeClass}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-dream/10 text-[#320e9d] hover:bg-dream/10 border-none">
                                        {career.mediumClass}
                                    </Badge>
                                </div>
                                <CardTitle className="text-lg font-bold text-[#191F28] mb-1 group-hover:text-[#320e9d] transition-colors flex items-center justify-between">
                                    {career.title}
                                    <ArrowRight className="h-4 w-4 text-[#B0B8C1] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                </CardTitle>
                                <CardDescription className="line-clamp-2 text-sm text-[#6B7684]">
                                    {career.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0 mt-auto">
                                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#F2F4F6]">
                                    {career.tags.length > 0 ? (
                                        career.tags.map((tag) => (
                                            <span key={tag} className="text-[11px] font-medium text-[#8B95A1] bg-background px-2 py-1 rounded-md">
                                                #{tag}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-[11px] text-[#B0B8C1] px-1 py-1">태그 정보 없음</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <ResponsiveCareerDetail 
                    career={selectedCareer} 
                    open={isModalOpen} 
                    onOpenChange={setIsModalOpen} 
                />

                {/* Empty State */}
                {filteredCareers.length === 0 && (
                    <div className="bg-white border border-[#E5E8EB] rounded-2xl p-12 text-center">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-background mb-4">
                            <Filter className="h-8 w-8 text-[#B0B8C1]" />
                        </div>
                        <h3 className="text-lg font-bold text-[#191F28] mb-1">검색 결과가 없습니다</h3>
                        <p className="text-[#8B95A1]">필터를 변경하거나 다른 키워드로 검색해보세요.</p>
                        <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => {
                                setSearchQuery("");
                                handleLargeClassChange("all");
                            }}
                        >
                            필터 초기화
                        </Button>
                    </div>
                )}

                {/* Load More */}
                {visibleCount < filteredCareers.length && (
                    <div className="mt-10 text-center">
                        <Button 
                            variant="outline" 
                            onClick={handleLoadMore}
                            className="h-12 px-8 rounded-xl font-bold border-[#E5E8EB] text-[#4E5968] hover:bg-background"
                        >
                            더 보기 ({Math.min(visibleCount, filteredCareers.length)} / {filteredCareers.length})
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}