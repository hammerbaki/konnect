import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  FileText,
  CheckCircle2,
  Clock,
  Search,
  ChevronRight,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Eye,
  PieChart,
  Briefcase,
  GraduationCap,
  School,
  BookOpen,
  Backpack,
  Globe,
} from "lucide-react";
import { getAuthHeaders } from "@/lib/queryClient";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

interface GroupStats {
  totalMembers: number;
  completedAnalyses: number;
  completedProfiles: number;
  completedGoals: number;
  completedEssays: number;
  progressRate: number;
  profileTypeBreakdown: Array<{ type: string; count: number }>;
  analysisTypeBreakdown: Array<{ type: string; count: number }>;
}

interface DetailedStats {
  recentAnalyses: Array<{
    userId: string;
    userName: string | null;
    profileType: string;
    analysisDate: string;
    summary: string | null;
  }>;
  profileTypeStats: Array<{ type: string; label: string; count: number; withAnalysis: number }>;
}

interface MemberProgress {
  userId: string;
  email: string;
  displayName: string | null;
  profileImageUrl: string | null;
  hasProfile: boolean;
  hasAnalysis: boolean;
  hasGoals: boolean;
  hasEssay: boolean;
  analysisDate: string | null;
  profileType: string | null;
  progressScore: number;
}

interface GroupInfo {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  allowedProfileTypes?: string[];
  logoUrl?: string;
}

const profileTypeLabels: Record<string, string> = {
  general: "구직자",
  international: "외국인유학생",
  university: "대학생",
  high: "고등학생",
  middle: "중학생",
  elementary: "초등학생",
};

const profileTypeIcons: Record<string, typeof Briefcase> = {
  general: Briefcase,
  international: Globe,
  university: GraduationCap,
  high: School,
  middle: BookOpen,
  elementary: Backpack,
};

const COLORS = ["#3182F6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface ProfileFieldStats {
  totalProfiles: number;
  fieldStats: Record<string, Array<{ value: string; count: number; percentage: number }>>;
  selfIntroResponses?: Array<{
    question: string;
    responses: Array<{ userName: string; response: string }>;
  }>;
}

export default function GroupDashboard() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedProfileType, setSelectedProfileType] = useState("");
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  // Get allowed profile types from group, default to all if not set
  const allowedProfileTypes = group?.allowedProfileTypes || ['general', 'international', 'university', 'high', 'middle', 'elementary'];

  // Set default profile type when group loads
  useEffect(() => {
    if (group && allowedProfileTypes.length > 0 && !selectedProfileType) {
      setSelectedProfileType(allowedProfileTypes[0]);
    }
  }, [group, allowedProfileTypes, selectedProfileType]);

  const toggleFieldExpanded = (fieldLabel: string) => {
    setExpandedFields(prev => ({ ...prev, [fieldLabel]: !prev[fieldLabel] }));
  };

  const toggleQuestionExpanded = (question: string) => {
    setExpandedQuestions(prev => ({ ...prev, [question]: !prev[question] }));
  };

  const { data: group, isLoading: groupLoading } = useQuery<GroupInfo>({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/groups/${groupId}`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch group");
      return res.json();
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery<GroupStats>({
    queryKey: ["group-stats", groupId],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/groups/${groupId}/stats`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: detailedStats } = useQuery<DetailedStats>({
    queryKey: ["group-detailed-stats", groupId],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/groups/${groupId}/stats/detailed`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch detailed stats");
      return res.json();
    },
  });

  const { data: members, isLoading: membersLoading } = useQuery<MemberProgress[]>({
    queryKey: ["group-members-progress", groupId],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/groups/${groupId}/members/progress`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
  });

  const { data: fieldStats } = useQuery<ProfileFieldStats>({
    queryKey: ["group-field-stats", groupId, selectedProfileType],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/groups/${groupId}/stats/fields/${selectedProfileType}`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch field stats");
      return res.json();
    },
    enabled: activeTab === "overview" && !!selectedProfileType,
  });

  const filteredMembers = members?.filter((member) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      member.email.toLowerCase().includes(searchLower) ||
      (member.displayName?.toLowerCase() || "").includes(searchLower)
    );
    // Filter by allowed profile types (if member has a profile type)
    const matchesProfileType = !member.profileType || allowedProfileTypes.includes(member.profileType);
    return matchesSearch && matchesProfileType;
  });

  const getProgressBadge = (score: number) => {
    if (score >= 75) return { label: "완료", variant: "default" as const, color: "bg-green-500" };
    if (score >= 50) return { label: "진행중", variant: "secondary" as const, color: "bg-blue-500" };
    if (score >= 25) return { label: "시작", variant: "outline" as const, color: "bg-yellow-500" };
    return { label: "미시작", variant: "outline" as const, color: "bg-gray-400" };
  };

  // Prepare chart data
  const chartData = detailedStats?.profileTypeStats.map((item, index) => ({
    name: item.label,
    type: item.type,
    프로필: item.count,
    분석완료: item.withAnalysis,
    color: COLORS[index % COLORS.length],
  })) || [];

  if (groupLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="text-group-name">
              {group?.name || "그룹"} 대시보드
            </h1>
            <p className="text-gray-500 mt-1">{group?.description || "그룹 멤버들의 진행현황을 확인하세요"}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">통계 개요</TabsTrigger>
            <TabsTrigger value="analysis" data-testid="tab-analysis">분석 현황</TabsTrigger>
            <TabsTrigger value="members" data-testid="tab-members">학생 목록</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card data-testid="card-total-members">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">총 인원</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalMembers || 0}명</div>
                </CardContent>
              </Card>

              <Card data-testid="card-completed-analyses">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">분석 완료</CardTitle>
                  <FileText className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.completedAnalyses || 0}명</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats?.totalMembers ? Math.round((stats.completedAnalyses / stats.totalMembers) * 100) : 0}% 완료
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-completed-profiles">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">프로필 작성</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.completedProfiles || 0}명</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats?.totalMembers ? Math.round((stats.completedProfiles / stats.totalMembers) * 100) : 0}% 완료
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-progress-rate">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">평균 진행률</CardTitle>
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.progressRate || 0}%</div>
                  <Progress value={stats?.progressRate || 0} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6" data-testid="card-progress-breakdown">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  진행 현황 상세
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">프로필 작성 완료</span>
                    <div className="flex items-center gap-2">
                      <Progress value={stats?.totalMembers ? (stats.completedProfiles / stats.totalMembers) * 100 : 0} className="w-32" />
                      <span className="text-sm font-medium w-16 text-right">
                        {stats?.completedProfiles || 0}/{stats?.totalMembers || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">커리어 분석 완료</span>
                    <div className="flex items-center gap-2">
                      <Progress value={stats?.totalMembers ? (stats.completedAnalyses / stats.totalMembers) * 100 : 0} className="w-32" />
                      <span className="text-sm font-medium w-16 text-right">
                        {stats?.completedAnalyses || 0}/{stats?.totalMembers || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">목표 설정 완료</span>
                    <div className="flex items-center gap-2">
                      <Progress value={stats?.totalMembers ? (stats.completedGoals / stats.totalMembers) * 100 : 0} className="w-32" />
                      <span className="text-sm font-medium w-16 text-right">
                        {stats?.completedGoals || 0}/{stats?.totalMembers || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">자기소개서 작성</span>
                    <div className="flex items-center gap-2">
                      <Progress value={stats?.totalMembers ? (stats.completedEssays / stats.totalMembers) * 100 : 0} className="w-32" />
                      <span className="text-sm font-medium w-16 text-right">
                        {stats?.completedEssays || 0}/{stats?.totalMembers || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Field Statistics */}
            <Card className="mt-6" data-testid="card-field-stats">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    프로필 필드별 통계
                  </div>
                  <select
                    value={selectedProfileType}
                    onChange={(e) => setSelectedProfileType(e.target.value)}
                    className="text-sm font-normal px-3 py-1.5 border rounded-md bg-white"
                    data-testid="select-profile-type"
                  >
                    {allowedProfileTypes.map((type) => (
                      <option key={type} value={type}>{profileTypeLabels[type] || type}</option>
                    ))}
                  </select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fieldStats && Object.keys(fieldStats.fieldStats).length > 0 ? (
                  <div className="space-y-6">
                    <p className="text-sm text-gray-600">
                      학생 {fieldStats.totalProfiles}명 프로필 분석
                    </p>
                    
                    {/* Field Statistics by Category */}
                    <div className="space-y-6">
                      {Object.entries(fieldStats.fieldStats).map(([fieldLabel, values]) => {
                        const isExpanded = expandedFields[fieldLabel];
                        const displayValues = isExpanded ? values : values.slice(0, 5);
                        const hasMore = values.length > 5;
                        
                        return (
                          <div key={fieldLabel} className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-100 px-4 py-3 border-b">
                              <h4 className="font-medium text-gray-900">{fieldLabel}</h4>
                            </div>
                            <div className="p-4 space-y-2">
                              {displayValues.map((item) => (
                                <div key={item.value} className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-sm text-gray-700 truncate">{item.value}</span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="w-32 bg-gray-200 rounded-full h-2.5">
                                      <div
                                        className="bg-blue-500 h-2.5 rounded-full transition-all"
                                        style={{ width: `${item.percentage}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-gray-600 w-16 text-right">
                                      {item.count}명 ({item.percentage}%)
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {hasMore && (
                                <button
                                  onClick={() => toggleFieldExpanded(fieldLabel)}
                                  className="text-sm text-blue-600 hover:text-blue-800 font-medium pt-2 flex items-center gap-1"
                                  data-testid={`btn-expand-${fieldLabel}`}
                                >
                                  {isExpanded ? (
                                    <>접기</>
                                  ) : (
                                    <>+{values.length - 5}개 더 보기</>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Self-Introduction Responses */}
                    {fieldStats.selfIntroResponses && fieldStats.selfIntroResponses.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          자기소개 상세 응답
                        </h3>
                        <div className="space-y-4">
                          {fieldStats.selfIntroResponses.map((item) => {
                            const isExpanded = expandedQuestions[item.question];
                            
                            return (
                              <div key={item.question} className="border rounded-lg overflow-hidden">
                                <button
                                  onClick={() => toggleQuestionExpanded(item.question)}
                                  className="w-full bg-blue-50 px-4 py-3 border-b flex items-center justify-between hover:bg-blue-100 transition-colors"
                                  data-testid={`btn-toggle-${item.question}`}
                                >
                                  <h4 className="font-medium text-gray-900">{item.question}</h4>
                                  <span className="text-sm text-blue-600 font-medium">
                                    {item.responses.length}명 응답 {isExpanded ? '▲' : '▼'}
                                  </span>
                                </button>
                                {isExpanded && (
                                  <div className="divide-y max-h-80 overflow-y-auto">
                                    {item.responses.map((resp, idx) => (
                                      <div key={idx} className="p-4">
                                        <p className="text-xs text-gray-500 mb-1">{resp.userName}</p>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{resp.response}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>선택한 프로필 유형의 데이터가 없습니다.</p>
                    <p className="text-sm mt-1">그룹에 해당 유형의 프로필이 등록되면 통계가 표시됩니다.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="mt-6 space-y-6">
            <Card data-testid="card-recent-analyses">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  최근 분석 결과
                </CardTitle>
              </CardHeader>
              <CardContent>
                {detailedStats?.recentAnalyses && detailedStats.recentAnalyses.length > 0 ? (
                  <div className="divide-y">
                    {detailedStats.recentAnalyses.map((analysis, index) => (
                      <div key={index} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{analysis.userName || "알 수 없음"}</span>
                              <Badge variant="secondary" className="text-xs">
                                {profileTypeLabels[analysis.profileType] || analysis.profileType}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mb-2">
                              {format(new Date(analysis.analysisDate), "yyyy년 M월 d일 HH:mm", { locale: ko })}
                            </p>
                            {analysis.summary && (
                              <p className="text-sm text-gray-700 line-clamp-2 bg-gray-50 p-3 rounded-lg">
                                {analysis.summary}
                              </p>
                            )}
                          </div>
                          <Link href={`/group/${groupId}/member/${analysis.userId}`}>
                            <Button variant="outline" size="sm" data-testid={`button-view-analysis-${index}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              상세보기
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>아직 분석 결과가 없습니다</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-analysis-by-type">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  유형별 분석 완료 현황
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {detailedStats?.profileTypeStats.map((item, index) => {
                    const Icon = profileTypeIcons[item.type] || Briefcase;
                    const percentage = item.count > 0 ? Math.round((item.withAnalysis / item.count) * 100) : 0;
                    return (
                      <div key={item.type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" style={{ color: COLORS[index % COLORS.length] }} />
                            <span className="text-sm font-medium">{item.label}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {item.withAnalysis}/{item.count}명 ({percentage}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    학생 목록 ({filteredMembers?.length || 0}명)
                  </CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="이름 또는 이메일 검색"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-members"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                  </div>
                ) : filteredMembers?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>검색 결과가 없습니다</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredMembers?.map((member) => {
                      const progress = getProgressBadge(member.progressScore);
                      const Icon = member.profileType ? profileTypeIcons[member.profileType] || Briefcase : null;
                      return (
                        <div
                          key={member.userId}
                          className="flex items-center justify-between py-4 hover:bg-gray-50 rounded-lg px-2 -mx-2"
                          data-testid={`row-member-${member.userId}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {member.profileImageUrl ? (
                                <img src={member.profileImageUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-sm font-medium text-gray-600">
                                  {(member.displayName || member.email)[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">
                                  {member.displayName || member.email.split("@")[0]}
                                </p>
                                {member.profileType && Icon && (
                                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    <Icon className="h-3 w-3" />
                                    {profileTypeLabels[member.profileType]}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-2">
                              <Badge variant={member.hasProfile ? "default" : "outline"} className="text-xs">
                                프로필 {member.hasProfile ? "O" : "X"}
                              </Badge>
                              <Badge variant={member.hasAnalysis ? "default" : "outline"} className="text-xs">
                                분석 {member.hasAnalysis ? "O" : "X"}
                              </Badge>
                            </div>
                            <Badge className={`${progress.color} text-white`}>
                              {progress.label}
                            </Badge>
                            <Link href={`/group/${groupId}/member/${member.userId}`}>
                              <Button variant="ghost" size="sm" data-testid={`button-view-member-${member.userId}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                상세
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
