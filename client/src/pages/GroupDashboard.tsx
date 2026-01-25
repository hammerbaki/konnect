import { useState } from "react";
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
} from "lucide-react";
import { getAuthHeaders } from "@/lib/queryClient";

interface GroupStats {
  totalMembers: number;
  completedAnalyses: number;
  completedProfiles: number;
  completedGoals: number;
  completedEssays: number;
  progressRate: number;
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
}

export default function GroupDashboard() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

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

  const filteredMembers = members?.filter((member) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      member.email.toLowerCase().includes(searchLower) ||
      (member.displayName?.toLowerCase() || "").includes(searchLower)
    );
  });

  const getProgressBadge = (score: number) => {
    if (score >= 75) return { label: "완료", variant: "default" as const, color: "bg-green-500" };
    if (score >= 50) return { label: "진행중", variant: "secondary" as const, color: "bg-blue-500" };
    if (score >= 25) return { label: "시작", variant: "outline" as const, color: "bg-yellow-500" };
    return { label: "미시작", variant: "outline" as const, color: "bg-gray-400" };
  };

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
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="overview" data-testid="tab-overview">통계 개요</TabsTrigger>
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
                              <p className="font-medium text-gray-900">
                                {member.displayName || member.email.split("@")[0]}
                              </p>
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
