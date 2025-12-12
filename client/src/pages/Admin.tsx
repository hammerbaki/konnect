import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, Settings, Coins, Activity, 
  RefreshCw, Search, Shield, User, Crown,
  BarChart3, Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp, Eye
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  credits: number;
  role: string;
  createdAt: string | null;
}

interface SystemStats {
  totalUsers: number;
  totalProfiles: number;
  totalAnalyses: number;
  totalEssays: number;
  pendingJobs: number;
  processingJobs: number;
}

interface AiStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  avgTokensPerJob: number;
  jobsByType: Record<string, number>;
}

interface CurrentUser {
  id: string;
  role?: string;
}

interface TrafficStats {
  today: { pageViews: number; uniqueVisitors: number; newUsers: number };
  yesterday: { pageViews: number; uniqueVisitors: number; newUsers: number };
  last7Days: { pageViews: number; uniqueVisitors: number; newUsers: number };
  last30Days: { pageViews: number; uniqueVisitors: number; newUsers: number };
  dailyData: Array<{ date: string; pageViews: number; uniqueVisitors: number }>;
}

const COLORS = ['#3182F6', '#7C3AED', '#059669', '#D97706', '#EC4899', '#6B7280'];

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCredits, setEditingCredits] = useState<{ userId: string; credits: number } | null>(null);

  const { data: currentUser, isLoading: userLoading } = useQuery<CurrentUser>({
    queryKey: ['/api/auth/user'],
  });

  const isAdmin = currentUser?.role === 'admin';
  const isStaff = currentUser?.role === 'staff';
  const isStaffOrAdmin = isAdmin || isStaff;

  const { data: users = [], isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
    enabled: isStaffOrAdmin,
    retry: false,
  });

  const { data: systemStats, isLoading: statsLoading, refetch: refetchStats } = useQuery<SystemStats>({
    queryKey: ['/api/admin/stats/system'],
    enabled: isStaffOrAdmin,
    retry: false,
  });

  const { data: aiStats, refetch: refetchAiStats } = useQuery<AiStats>({
    queryKey: ['/api/admin/stats/ai'],
    enabled: isStaffOrAdmin,
    retry: false,
  });

  const { data: trafficStats, refetch: refetchTraffic } = useQuery<TrafficStats>({
    queryKey: ['/api/admin/stats/traffic'],
    enabled: isStaffOrAdmin,
    retry: false,
  });

  if (userLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="toss-card">
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="toss-card">
            <div className="p-6 border-b border-[#E5E8EB]">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-9 w-24 rounded-xl" />
              </div>
            </div>
            <div className="p-6">
              <Skeleton className="h-10 w-full mb-4 rounded-xl" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-[#E5E8EB]">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!isStaffOrAdmin) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20 text-center">
          <Card className="toss-card">
            <CardContent className="p-8">
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-bold text-[#191F28] mb-2">접근 권한이 없습니다</h2>
              <p className="text-[#8B95A1] mb-6">
                이 페이지는 관리자 또는 스태프만 접근할 수 있습니다.
              </p>
              <Button onClick={() => setLocation('/dashboard')} className="w-full bg-[#3182F6]">
                대시보드로 돌아가기
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/users/${userId}/role`, { role });
      if (!res.ok) throw new Error('Failed to update role');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "역할 변경 완료", description: "사용자 역할이 변경되었습니다." });
    },
    onError: () => {
      toast({ title: "오류", description: "역할 변경에 실패했습니다.", variant: "destructive" });
    },
  });

  const updateCreditsMutation = useMutation({
    mutationFn: async ({ userId, credits }: { userId: string; credits: number }) => {
      const res = await apiRequest('PATCH', `/api/admin/users/${userId}/credits`, { credits });
      if (!res.ok) throw new Error('Failed to update credits');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setEditingCredits(null);
      toast({ title: "포인트 변경 완료", description: "사용자 포인트가 변경되었습니다." });
    },
    onError: () => {
      toast({ title: "오류", description: "포인트 변경에 실패했습니다.", variant: "destructive" });
    },
  });

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500 text-white"><Crown className="h-3 w-3 mr-1" />관리자</Badge>;
      case 'staff':
        return <Badge className="bg-purple-500 text-white"><Shield className="h-3 w-3 mr-1" />스태프</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white"><User className="h-3 w-3 mr-1" />일반</Badge>;
    }
  };

  const jobTypeLabels: Record<string, string> = {
    career_analysis: '진로 분석',
    essay_generation: '자소서 생성',
    essay_revision: '자소서 수정',
    goal: '목표 생성',
  };

  const jobsByTypeData = aiStats?.jobsByType 
    ? Object.entries(aiStats.jobsByType).map(([type, count]) => ({
        name: jobTypeLabels[type] || type,
        value: count,
      }))
    : [];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[28px] font-bold text-[#191F28] flex items-center gap-2">
            <Settings className="h-8 w-8 text-[#3182F6]" />
            관리자 대시보드
          </h2>
          <Button 
            variant="outline" 
            onClick={() => {
              refetchUsers();
              refetchStats();
              refetchAiStats();
              refetchTraffic();
            }}
            className="rounded-xl"
            data-testid="button-refresh-admin"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="bg-[#F2F4F6] p-1 rounded-xl">
            <TabsTrigger value="members" className="rounded-lg px-4" data-testid="tab-members">
              <Users className="h-4 w-4 mr-2" />
              회원 관리
            </TabsTrigger>
            <TabsTrigger value="monitor" className="rounded-lg px-4" data-testid="tab-monitor">
              <Activity className="h-4 w-4 mr-2" />
              시스템 모니터
            </TabsTrigger>
            <TabsTrigger value="tokens" className="rounded-lg px-4" data-testid="tab-tokens">
              <Coins className="h-4 w-4 mr-2" />
              포인트 시스템
            </TabsTrigger>
            <TabsTrigger value="traffic" className="rounded-lg px-4" data-testid="tab-traffic">
              <TrendingUp className="h-4 w-4 mr-2" />
              트래픽
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8B95A1]" />
                <Input
                  placeholder="이메일 또는 이름으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#F2F4F6] border-none rounded-xl h-12"
                  data-testid="input-search-users"
                />
              </div>
              <Badge className="bg-[#3182F6] text-white px-4 py-2">
                총 {users.length}명
              </Badge>
            </div>

            <Card className="toss-card">
              <CardContent className="p-0">
                {usersLoading ? (
                  <div className="p-8 text-center text-[#8B95A1]">로딩 중...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-[#8B95A1]">사용자가 없습니다.</div>
                ) : (
                  <div className="divide-y divide-[#F2F4F6]">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="p-4 flex items-center justify-between" data-testid={`row-user-${user.id}`}>
                        <div className="flex-1">
                          <p className="font-bold text-[#191F28]">
                            {user.displayName || user.email || 'Unknown'}
                          </p>
                          <p className="text-sm text-[#8B95A1]">{user.email}</p>
                          <p className="text-xs text-[#8B95A1]">
                            가입일: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            {isAdmin && editingCredits?.userId === user.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={editingCredits.credits}
                                  onChange={(e) => setEditingCredits({ userId: user.id, credits: parseInt(e.target.value) || 0 })}
                                  className="w-24 h-8 text-right"
                                  data-testid={`input-credits-${user.id}`}
                                />
                                <Button 
                                  size="sm" 
                                  onClick={() => updateCreditsMutation.mutate({ userId: user.id, credits: editingCredits.credits })}
                                  data-testid={`button-save-credits-${user.id}`}
                                >
                                  저장
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setEditingCredits(null)}
                                >
                                  취소
                                </Button>
                              </div>
                            ) : (
                              <p 
                                className={`font-bold text-[#3182F6] ${isAdmin ? 'cursor-pointer hover:underline' : ''}`}
                                onClick={() => isAdmin && setEditingCredits({ userId: user.id, credits: user.credits })}
                                data-testid={`text-credits-${user.id}`}
                              >
                                {user.credits.toLocaleString()} 포인트
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getRoleBadge(user.role)}
                            {(isAdmin || isStaff) ? (
                              <Select
                                value={user.role}
                                onValueChange={(role) => updateRoleMutation.mutate({ userId: user.id, role })}
                                disabled={!isAdmin && user.role === 'admin'}
                              >
                                <SelectTrigger className="w-24 h-8" data-testid={`select-role-${user.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">일반</SelectItem>
                                  <SelectItem value="staff">스태프</SelectItem>
                                  {isAdmin && <SelectItem value="admin">관리자</SelectItem>}
                                </SelectContent>
                              </Select>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitor" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="toss-card">
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 mx-auto mb-2 text-[#3182F6]" />
                  <p className="text-2xl font-bold text-[#191F28]">{systemStats?.totalUsers || 0}</p>
                  <p className="text-xs text-[#8B95A1]">전체 사용자</p>
                </CardContent>
              </Card>
              <Card className="toss-card">
                <CardContent className="p-4 text-center">
                  <User className="h-6 w-6 mx-auto mb-2 text-[#7C3AED]" />
                  <p className="text-2xl font-bold text-[#191F28]">{systemStats?.totalProfiles || 0}</p>
                  <p className="text-xs text-[#8B95A1]">전체 프로필</p>
                </CardContent>
              </Card>
              <Card className="toss-card">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-6 w-6 mx-auto mb-2 text-[#059669]" />
                  <p className="text-2xl font-bold text-[#191F28]">{systemStats?.totalAnalyses || 0}</p>
                  <p className="text-xs text-[#8B95A1]">분석 완료</p>
                </CardContent>
              </Card>
              <Card className="toss-card">
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-[#D97706]" />
                  <p className="text-2xl font-bold text-[#191F28]">{systemStats?.pendingJobs || 0}</p>
                  <p className="text-xs text-[#8B95A1]">대기 중</p>
                </CardContent>
              </Card>
              <Card className="toss-card">
                <CardContent className="p-4 text-center">
                  <Activity className="h-6 w-6 mx-auto mb-2 text-[#EC4899]" />
                  <p className="text-2xl font-bold text-[#191F28]">{systemStats?.processingJobs || 0}</p>
                  <p className="text-xs text-[#8B95A1]">처리 중</p>
                </CardContent>
              </Card>
              <Card className="toss-card">
                <CardContent className="p-4 text-center">
                  <Coins className="h-6 w-6 mx-auto mb-2 text-[#6B7280]" />
                  <p className="text-2xl font-bold text-[#191F28]">{aiStats?.avgTokensPerJob?.toLocaleString() || 0}</p>
                  <p className="text-xs text-[#8B95A1]">평균 포인트</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="toss-card">
                <CardHeader>
                  <CardTitle className="text-lg">AI 작업 현황</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-[#F2F4F6] rounded-xl">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>완료된 작업</span>
                      </div>
                      <span className="font-bold text-green-600">{aiStats?.completedJobs || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#F2F4F6] rounded-xl">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span>실패한 작업</span>
                      </div>
                      <span className="font-bold text-red-600">{aiStats?.failedJobs || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#F2F4F6] rounded-xl">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-500" />
                        <span>전체 작업</span>
                      </div>
                      <span className="font-bold text-[#3182F6]">{aiStats?.totalJobs || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="toss-card">
                <CardHeader>
                  <CardTitle className="text-lg">서비스별 사용량</CardTitle>
                </CardHeader>
                <CardContent>
                  {jobsByTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={jobsByTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {jobsByTypeData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-[#8B95A1]">
                      데이터가 없습니다
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tokens" className="space-y-6">
            <Card className="toss-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coins className="h-5 w-5 text-[#3182F6]" />
                  포인트 가격 정책
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#F2F4F6] rounded-xl">
                      <p className="font-bold text-[#191F28] mb-2">진로 분석</p>
                      <p className="text-2xl font-bold text-[#3182F6]">100 포인트</p>
                      <p className="text-sm text-[#8B95A1]">AI 기반 진로 분석 1회</p>
                    </div>
                    <div className="p-4 bg-[#F2F4F6] rounded-xl">
                      <p className="font-bold text-[#191F28] mb-2">자기소개서 생성</p>
                      <p className="text-2xl font-bold text-[#3182F6]">100 포인트</p>
                      <p className="text-sm text-[#8B95A1]">AI 자기소개서 작성 1회</p>
                    </div>
                    <div className="p-4 bg-[#F2F4F6] rounded-xl">
                      <p className="font-bold text-[#191F28] mb-2">자기소개서 수정</p>
                      <p className="text-2xl font-bold text-[#7C3AED]">30 포인트</p>
                      <p className="text-sm text-[#8B95A1]">AI 자기소개서 수정 1회</p>
                    </div>
                    <div className="p-4 bg-[#F2F4F6] rounded-xl">
                      <p className="font-bold text-[#191F28] mb-2">전략 목표 생성</p>
                      <p className="text-2xl font-bold text-[#3182F6]">100 포인트</p>
                      <p className="text-sm text-[#8B95A1]">연간/반기 목표 AI 생성</p>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="font-bold text-[#191F28] mb-2">신규 가입 혜택</p>
                    <p className="text-2xl font-bold text-[#059669]">1,000 포인트</p>
                    <p className="text-sm text-[#8B95A1]">신규 가입 시 무료 제공</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="toss-card">
              <CardHeader>
                <CardTitle className="text-lg">포인트 통계</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#F2F4F6] rounded-xl text-center">
                    <p className="text-sm text-[#8B95A1]">전체 발행 포인트</p>
                    <p className="text-2xl font-bold text-[#191F28]">
                      {users.reduce((sum, u) => sum + u.credits, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-[#F2F4F6] rounded-xl text-center">
                    <p className="text-sm text-[#8B95A1]">평균 보유 포인트</p>
                    <p className="text-2xl font-bold text-[#191F28]">
                      {users.length > 0 ? Math.round(users.reduce((sum, u) => sum + u.credits, 0) / users.length).toLocaleString() : 0}
                    </p>
                  </div>
                  <div className="p-4 bg-[#F2F4F6] rounded-xl text-center">
                    <p className="text-sm text-[#8B95A1]">소진된 포인트 (추정)</p>
                    <p className="text-2xl font-bold text-[#191F28]">
                      {((aiStats?.completedJobs || 0) * 100).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="traffic" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="toss-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-5 w-5 text-[#3182F6]" />
                    <span className="text-sm text-[#8B95A1]">오늘 방문</span>
                  </div>
                  <p className="text-2xl font-bold text-[#191F28]">
                    {trafficStats?.today.pageViews.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-[#8B95A1]">
                    순 방문자 {trafficStats?.today.uniqueVisitors || 0}명
                  </p>
                </CardContent>
              </Card>
              <Card className="toss-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-5 w-5 text-[#7C3AED]" />
                    <span className="text-sm text-[#8B95A1]">어제 방문</span>
                  </div>
                  <p className="text-2xl font-bold text-[#191F28]">
                    {trafficStats?.yesterday.pageViews.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-[#8B95A1]">
                    순 방문자 {trafficStats?.yesterday.uniqueVisitors || 0}명
                  </p>
                </CardContent>
              </Card>
              <Card className="toss-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-[#059669]" />
                    <span className="text-sm text-[#8B95A1]">7일 합계</span>
                  </div>
                  <p className="text-2xl font-bold text-[#191F28]">
                    {trafficStats?.last7Days.pageViews.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-[#8B95A1]">
                    순 방문자 {trafficStats?.last7Days.uniqueVisitors || 0}명
                  </p>
                </CardContent>
              </Card>
              <Card className="toss-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-[#D97706]" />
                    <span className="text-sm text-[#8B95A1]">30일 합계</span>
                  </div>
                  <p className="text-2xl font-bold text-[#191F28]">
                    {trafficStats?.last30Days.pageViews.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-[#8B95A1]">
                    순 방문자 {trafficStats?.last30Days.uniqueVisitors || 0}명
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="toss-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#3182F6]" />
                  일별 트래픽 추이
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trafficStats?.dailyData && trafficStats.dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trafficStats.dailyData.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E8EB" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('ko-KR')}
                        formatter={(value, name) => [
                          value.toLocaleString(),
                          name === 'pageViews' ? '페이지뷰' : '순 방문자'
                        ]}
                      />
                      <Legend 
                        formatter={(value) => value === 'pageViews' ? '페이지뷰' : '순 방문자'}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pageViews" 
                        stroke="#3182F6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="uniqueVisitors" 
                        stroke="#7C3AED" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-[#8B95A1]">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-[#E5E8EB]" />
                      <p>아직 트래픽 데이터가 없습니다</p>
                      <p className="text-sm">방문자가 생기면 이곳에 차트가 표시됩니다</p>
                    </div>
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
