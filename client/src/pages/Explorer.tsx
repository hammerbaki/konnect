import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, Filter, Briefcase, DollarSign, TrendingUp, ArrowRight, Building2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "wouter";
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
    category: string;
    description: string;
    tags: string[];
    matchScore?: number; // Mock score for sorting
}

export default function Explorer() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("전체");
    const [visibleCount, setVisibleCount] = useState(20);

    // Process and memoize the data
    const { careers, categories } = useMemo(() => {
        const processed: ProcessedCareer[] = ((rawData as any).career_data as RawCareerItem[]).map(item => {
            let category = "기타";
            let tags: string[] = [];
            
            try {
                const detail = JSON.parse(item.detail_data);
                const jobSum = detail?.tabs?.['1']?.data?.jobSum;
                
                if (jobSum) {
                    // Use Large Class as main category
                    if (jobSum.jobLrclNm) category = jobSum.jobLrclNm;
                    
                    // Create tags from Medium/Small classes
                    if (jobSum.jobMdclNm) tags.push(jobSum.jobMdclNm);
                    if (jobSum.jobSmclNm && jobSum.jobSmclNm !== item.name) tags.push(jobSum.jobSmclNm);
                }
            } catch (e) {
                // Fallback if JSON parse fails
                category = item.category !== "No Category" ? item.category : "기타";
            }

            return {
                id: item.id,
                title: item.name,
                category,
                description: item.description,
                tags: tags.slice(0, 3),
                matchScore: Math.floor(Math.random() * 20) + 80 // Mock match score 80-99%
            };
        });

        // Extract unique categories
        const uniqueCategories = ["전체", ...Array.from(new Set(processed.map(c => c.category))).sort()];

        return { careers: processed, categories: uniqueCategories };
    }, []);

    // Filter logic
    const filteredCareers = useMemo(() => {
        return careers.filter(career => {
            const matchesSearch = career.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                career.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === "전체" || career.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [careers, searchQuery, selectedCategory]);

    // Pagination (Infinite scroll simulation)
    const visibleCareers = filteredCareers.slice(0, visibleCount);

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 20);
    };

    return (
        <Layout>
            <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6">
                
                {/* Header */}
                <div className="mb-10 text-center space-y-4">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 mb-2">
                        <Search className="h-8 w-8 text-[#3182F6]" />
                    </div>
                    <h2 className="text-[32px] font-bold text-[#191F28] leading-tight">
                        직업 탐색
                    </h2>
                    <p className="text-[#4E5968] text-lg max-w-xl mx-auto">
                        {careers.length}개의 직업 정보를 탐색하고<br/>나에게 맞는 커리어 패스를 발견해보세요.
                    </p>
                </div>

                {/* Search & Filter */}
                <div className="sticky top-0 bg-[#F9FAFB] pt-4 pb-6 z-10 space-y-4 px-1">
                    <div className="relative max-w-2xl mx-auto">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-[#8B95A1]" />
                        </div>
                        <Input 
                            className="pl-12 h-14 text-lg rounded-2xl border-none shadow-md bg-white focus-visible:ring-2 focus-visible:ring-[#3182F6]"
                            placeholder="직무명, 키워드 검색 (예: 의사, 개발자, 마케터)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Category Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-start md:justify-center px-2">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                                    selectedCategory === category
                                        ? "bg-[#333D4B] text-white shadow-md"
                                        : "bg-white text-[#6B7684] border border-[#E5E8EB] hover:bg-[#F2F4F6]"
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Grid */}
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                    {visibleCareers.map((career) => (
                        <Card key={career.id} className="border-[#E5E8EB] shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-[#3182F6] group bg-white">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <Badge variant="secondary" className="bg-blue-50 text-[#3182F6] hover:bg-blue-50 border-none mb-2">
                                        {career.category}
                                    </Badge>
                                    <ArrowRight className="h-5 w-5 text-[#B0B8C1] group-hover:text-[#3182F6] transition-colors" />
                                </div>
                                <CardTitle className="text-xl font-bold text-[#191F28]">
                                    {career.title}
                                </CardTitle>
                                <CardDescription className="line-clamp-2 mt-1.5 text-[#4E5968] min-h-[40px]">
                                    {career.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-3">
                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {career.tags.map((tag) => (
                                            <span key={tag} className="px-2.5 py-1 rounded-md bg-[#F2F4F6] text-[#4E5968] text-xs font-medium">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Empty State */}
                {filteredCareers.length === 0 && (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#F2F4F6] mb-4">
                            <Search className="h-8 w-8 text-[#8B95A1]" />
                        </div>
                        <h3 className="text-lg font-bold text-[#191F28]">검색 결과가 없습니다</h3>
                        <p className="text-[#8B95A1]">다른 검색어나 카테고리를 선택해보세요.</p>
                    </div>
                )}

                {/* Load More */}
                {visibleCount < filteredCareers.length && (
                    <div className="mt-8 text-center">
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