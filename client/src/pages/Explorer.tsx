import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, Filter, Briefcase, DollarSign, TrendingUp, ArrowRight, Building2 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

// Placeholder data until user provides the full JSON
const MOCK_CAREERS = [
    {
        id: 1,
        title: "Product Manager",
        category: "기획/비즈니스",
        salary: "5,000 ~ 8,000만원",
        description: "제품의 전체 수명 주기를 관리하고 비즈니스 목표를 달성하기 위한 전략을 수립합니다.",
        tags: ["Communication", "Data Analysis", "Strategy"],
        demand: "High"
    },
    {
        id: 2,
        title: "Frontend Developer",
        category: "개발",
        salary: "4,500 ~ 7,500만원",
        description: "웹/앱 서비스의 사용자 인터페이스를 구현하고 사용자 경험을 최적화합니다.",
        tags: ["React", "TypeScript", "UI/UX"],
        demand: "Very High"
    },
    {
        id: 3,
        title: "Data Scientist",
        category: "데이터",
        salary: "5,500 ~ 9,000만원",
        description: "대규모 데이터를 분석하여 비즈니스 인사이트를 도출하고 예측 모델을 개발합니다.",
        tags: ["Python", "Machine Learning", "SQL"],
        demand: "High"
    },
    {
        id: 4,
        title: "UX Designer",
        category: "디자인",
        salary: "4,000 ~ 7,000만원",
        description: "사용자 리서치를 바탕으로 직관적이고 편리한 서비스 경험을 설계합니다.",
        tags: ["Figma", "User Research", "Prototyping"],
        demand: "Medium"
    },
    {
        id: 5,
        title: "Digital Marketer",
        category: "마케팅",
        salary: "3,800 ~ 6,500만원",
        description: "다양한 디지털 채널을 활용하여 브랜드 인지도를 높이고 고객 획득을 주도합니다.",
        tags: ["SEO", "Content Marketing", "Analytics"],
        demand: "Medium"
    }
];

const CATEGORIES = ["전체", "기획/비즈니스", "개발", "데이터", "디자인", "마케팅", "영업"];

export default function Explorer() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("전체");

    const filteredCareers = MOCK_CAREERS.filter(career => {
        const matchesSearch = career.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            career.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "전체" || career.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <Layout>
            <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6">
                
                {/* Header */}
                <div className="mb-10 text-center space-y-4">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 mb-2">
                        <Search className="h-8 w-8 text-[#3182F6]" />
                    </div>
                    <h2 className="text-[32px] font-bold text-[#191F28] leading-tight">
                        커리어 탐색
                    </h2>
                    <p className="text-[#4E5968] text-lg max-w-xl mx-auto">
                        500+개의 다양한 직무 정보를 탐색하고<br/>나에게 맞는 커리어 패스를 발견해보세요.
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
                            placeholder="직무명, 키워드 검색 (예: 프로덕트 매니저)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Category Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-start md:justify-center px-2">
                        {CATEGORIES.map((category) => (
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
                    {filteredCareers.map((career) => (
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
                                <CardDescription className="line-clamp-2 mt-1.5 text-[#4E5968]">
                                    {career.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2 text-sm text-[#6B7684]">
                                        <DollarSign className="h-4 w-4" />
                                        <span>평균 연봉: <span className="font-bold text-[#333D4B]">{career.salary}</span></span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
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

                {filteredCareers.length === 0 && (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#F2F4F6] mb-4">
                            <Search className="h-8 w-8 text-[#8B95A1]" />
                        </div>
                        <h3 className="text-lg font-bold text-[#191F28]">검색 결과가 없습니다</h3>
                        <p className="text-[#8B95A1]">다른 검색어나 카테고리를 선택해보세요.</p>
                    </div>
                )}

            </div>
        </Layout>
    );
}