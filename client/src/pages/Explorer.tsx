import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, Filter, ArrowRight, Building2, Briefcase, X } from "lucide-react";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import rawData from "@/lib/careerData.json";

// Type definition for the raw JSON data
interface RawCareerItem {
    id: string;
    name: string;
    category: string;
    description: string;
    full_data: string;
    detail_data: string;
}

interface ProcessedCareer {
    id: string;
    title: string;
    largeClass: string; // 대분류
    mediumClass: string; // 중분류
    description: string;
    tags: string[];
    salary?: string;
}

export default function Explorer() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLargeClass, setSelectedLargeClass] = useState<string>("all");
    const [selectedMediumClass, setSelectedMediumClass] = useState<string>("all");
    const [visibleCount, setVisibleCount] = useState(20);

    // Process and memoize the data
    const { careers, hierarchy } = useMemo(() => {
        const hierarchyMap = new Map<string, Set<string>>();
        
        const processed: ProcessedCareer[] = ((rawData as any).career_data as RawCareerItem[]).map(item => {
            let largeClass = "기타";
            let mediumClass = "기타";
            let tags: string[] = [];
            let salary = "정보 없음";
            
            try {
                const detail = JSON.parse(item.detail_data);
                const jobSum = detail?.tabs?.['1']?.data?.jobSum;
                const salaryData = detail?.tabs?.['2']?.data?.wageInfo?.avg_pay;

                if (jobSum) {
                    if (jobSum.jobLrclNm) largeClass = jobSum.jobLrclNm;
                    if (jobSum.jobMdclNm) mediumClass = jobSum.jobMdclNm;
                    
                    if (jobSum.jobSmclNm && jobSum.jobSmclNm !== item.name) tags.push(jobSum.jobSmclNm);
                }
                
                if (salaryData) {
                   salary = `${Math.round(salaryData)}만원`;
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
                description: item.description,
                tags: tags.slice(0, 3),
                salary
            };
        });

        // Sort Hierarchy
        const sortedHierarchy: Record<string, string[]> = {};
        Array.from(hierarchyMap.keys()).sort().forEach(key => {
            sortedHierarchy[key] = Array.from(hierarchyMap.get(key) || []).sort();
        });

        return { careers: processed, hierarchy: sortedHierarchy };
    }, []);

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
    const handleLoadMore = () => setVisibleCount(prev => prev + 20);

    const availableMediumClasses = selectedLargeClass !== "all" ? hierarchy[selectedLargeClass] : [];

    return (
        <Layout>
            <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6 px-4">
                
                {/* Header */}
                <div className="mb-8 text-center space-y-3">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-blue-50 mb-2">
                        <Building2 className="h-7 w-7 text-[#3182F6]" />
                    </div>
                    <h2 className="text-[28px] font-bold text-[#191F28] leading-tight">
                        직업 정보 탐색
                    </h2>
                    <p className="text-[#4E5968] text-base">
                        표준 직업 분류 체계에 따른 5,000+개의 직업 정보를 확인하세요.
                    </p>
                </div>

                {/* Smart Filter Section */}
                <div className="bg-white border border-[#E5E8EB] rounded-2xl p-5 shadow-sm mb-8 z-20">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* 1. Search Input */}
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-[#8B95A1]" />
                            </div>
                            <Input 
                                className="pl-10 h-11 text-base rounded-xl border-[#E5E8EB] bg-[#F9FAFB] focus-visible:ring-[#3182F6] focus-visible:bg-white transition-all"
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
                                    {Object.keys(hierarchy).map((large) => (
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
                                <Badge variant="secondary" className="bg-blue-50 text-[#3182F6] hover:bg-blue-100 gap-1 pr-1.5">
                                    {selectedLargeClass}
                                    <X 
                                        className="h-3 w-3 cursor-pointer hover:text-blue-700" 
                                        onClick={() => handleLargeClassChange("all")}
                                    />
                                </Badge>
                            )}
                            
                            {selectedMediumClass !== "all" && (
                                <Badge variant="secondary" className="bg-blue-50 text-[#3182F6] hover:bg-blue-100 gap-1 pr-1.5">
                                    {selectedMediumClass}
                                    <X 
                                        className="h-3 w-3 cursor-pointer hover:text-blue-700" 
                                        onClick={() => handleMediumClassChange("all")}
                                    />
                                </Badge>
                            )}

                            {searchQuery && (
                                <Badge variant="secondary" className="bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB] gap-1 pr-1.5">
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
                        검색 결과 <span className="text-[#3182F6]">{filteredCareers.length}</span>건
                    </h3>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visibleCareers.map((career) => (
                        <Card key={career.id} className="border-[#E5E8EB] shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-[#3182F6] group bg-white flex flex-col">
                            <CardHeader className="pb-3 flex-1">
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge variant="outline" className="bg-[#F9FAFB] text-[#4E5968] border-[#E5E8EB] font-normal">
                                        {career.largeClass}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-blue-50 text-[#3182F6] hover:bg-blue-50 border-none">
                                        {career.mediumClass}
                                    </Badge>
                                </div>
                                <CardTitle className="text-lg font-bold text-[#191F28] mb-1 group-hover:text-[#3182F6] transition-colors flex items-center justify-between">
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
                                            <span key={tag} className="text-[11px] font-medium text-[#8B95A1] bg-[#F2F4F6] px-2 py-1 rounded-md">
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

                {/* Empty State */}
                {filteredCareers.length === 0 && (
                    <div className="bg-white border border-[#E5E8EB] rounded-2xl p-12 text-center">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#F2F4F6] mb-4">
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
                            className="h-12 px-8 rounded-xl font-bold border-[#E5E8EB] text-[#4E5968] hover:bg-[#F2F4F6]"
                        >
                            더 보기 ({Math.min(visibleCount, filteredCareers.length)} / {filteredCareers.length})
                        </Button>
                    </div>
                )}
            </div>
        </Layout>
    );
}