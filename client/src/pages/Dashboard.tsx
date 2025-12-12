import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Compass, 
  FileText, 
  BarChart3, 
  ChevronRight, 
  Sparkles,
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  Coins
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Fetch user identity for credits
  const { data: userIdentity } = useQuery({
    queryKey: ['/api/user-identity'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user-identity');
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch profiles
  const { data: profiles } = useQuery({
    queryKey: ['/api/profiles'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/profiles');
      return response.json();
    },
    enabled: !!user,
  });

  // Get first profile ID if exists
  const firstProfileId = profiles?.[0]?.id;

  // Fetch analyses for the first profile
  const { data: analyses } = useQuery({
    queryKey: ['/api/profiles', firstProfileId, 'analyses'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/profiles/${firstProfileId}/analyses`);
      return response.json();
    },
    enabled: !!firstProfileId,
  });

  // Fetch essays for the first profile
  const { data: essays } = useQuery({
    queryKey: ['/api/profiles', firstProfileId, 'essays'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/profiles/${firstProfileId}/essays`);
      return response.json();
    },
    enabled: !!firstProfileId,
  });

  // Fetch kompass for the first profile
  const { data: kompass } = useQuery({
    queryKey: ['/api/profiles', firstProfileId, 'kompass'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/profiles/${firstProfileId}/kompass`);
      return response.json();
    },
    enabled: !!firstProfileId,
  });

  const userName = user?.displayName 
    || (user?.lastName && user?.firstName ? `${user.lastName}${user.firstName}` : null)
    || user?.firstName || user?.lastName || user?.email?.split('@')[0] || '사용자';

  const credits = user?.credits ?? 1000;
  const profileCount = profiles?.length ?? 0;
  const analysisCount = analyses?.length ?? 0;
  const essayCount = essays?.length ?? 0;
  const kompassCount = kompass?.length ?? 0;

  // Quick action cards data
  const quickActions = [
    {
      title: "프로필",
      description: "내 정보 관리",
      icon: User,
      color: "#3182F6",
      bgColor: "bg-blue-50",
      href: "/profile",
      stat: profileCount > 0 ? `${profileCount}개 프로필` : "작성하기",
    },
    {
      title: "AI 분석",
      description: "커리어 분석",
      icon: BarChart3,
      color: "#00BFA5",
      bgColor: "bg-emerald-50",
      href: "/analysis",
      stat: analysisCount > 0 ? `${analysisCount}개 분석` : "시작하기",
    },
    {
      title: "Kompass",
      description: "목표 관리",
      icon: Compass,
      color: "#FFB300",
      bgColor: "bg-amber-50",
      href: "/goals",
      stat: kompassCount > 0 ? `${kompassCount}개 목표` : "목표 설정",
    },
    {
      title: "자기소개서",
      description: "에세이 작성",
      icon: FileText,
      color: "#9852F8",
      bgColor: "bg-purple-50",
      href: "/personal-statement",
      stat: essayCount > 0 ? `${essayCount}개 작성` : "작성하기",
    },
  ];

  return (
    <Layout>
      <div className="space-y-5 sm:space-y-8 pb-6 sm:pb-10">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-[28px] font-bold text-[#191F28]">
              안녕하세요, {userName}님
            </h2>
            <p className="text-[#8B95A1] mt-0.5 sm:mt-1 text-sm sm:text-lg">
              오늘도 커리어 성장을 위한 한 걸음을 시작해보세요.
            </p>
          </div>
          
          {/* Credits Display - Hidden on mobile (shown in header) */}
          <Card className="hidden md:flex toss-card px-5 py-4 items-center gap-3 w-fit">
            <div className="p-2.5 bg-amber-50 rounded-xl">
              <Coins className="h-5 w-5 text-[#FFB300]" />
            </div>
            <div>
              <p className="text-sm text-[#8B95A1] font-medium">보유 포인트</p>
              <p className="text-xl font-bold text-[#191F28]">{credits}개</p>
            </div>
          </Card>
        </div>

        {/* Quick Actions Grid - Horizontal scroll on small screens */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <Card className="toss-card p-3 sm:p-5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group h-full" data-testid={`card-action-${action.title}`}>
                  <div className="flex flex-col h-full">
                    <div className={`p-2 sm:p-3 ${action.bgColor} rounded-lg sm:rounded-xl w-fit mb-2 sm:mb-4`}>
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: action.color }} />
                    </div>
                    <h3 className="text-sm sm:text-lg font-bold text-[#191F28] mb-0.5 sm:mb-1">{action.title}</h3>
                    <p className="text-xs sm:text-sm text-[#8B95A1] mb-2 sm:mb-3 hidden sm:block">{action.description}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-semibold" style={{ color: action.color }}>
                        {action.stat}
                      </span>
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-[#B0B8C1] group-hover:text-[#3182F6] transition-colors" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Kompass Progress Card */}
          <Card className="toss-card p-6">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#3182F6]" /> Kompass 목표
                </CardTitle>
                <Link href="/goals">
                  <Button variant="ghost" size="sm" className="text-[#3182F6] font-bold">
                    전체보기 <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <CardDescription className="text-[#8B95A1] mt-1">
                목표를 향한 여정을 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0 mt-4 space-y-4">
              {kompass && kompass.length > 0 ? (
                <div className="space-y-3">
                  {kompass.slice(0, 3).map((goal: any) => (
                    <div key={goal.id} className="p-4 bg-[#F9FAFB] rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[#191F28] text-sm truncate flex-1">
                          {goal.title}
                        </span>
                      </div>
                      <Link href={`/goals/${goal.id}`}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full rounded-lg border-[#3182F6] text-[#3182F6] font-semibold hover:bg-[#3182F6]/10"
                          data-testid={`button-today-goal-${goal.id}`}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          오늘의 목표 보기
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {kompass.length > 3 && (
                    <Link href="/goals">
                      <Button variant="ghost" className="w-full text-[#8B95A1] text-sm">
                        +{kompass.length - 3}개 더 보기
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-[#F9FAFB] rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="h-5 w-5 text-[#3182F6]" />
                    <span className="font-bold text-[#191F28]">목표 설정하기</span>
                  </div>
                  <p className="text-sm text-[#8B95A1]">
                    Kompass에서 커리어 목표를 설정해보세요.
                  </p>
                  <Link href="/goals">
                    <Button className="w-full mt-4 rounded-xl h-11 bg-[#3182F6] font-bold" data-testid="button-go-to-kompass">
                      새 목표 만들기
                    </Button>
                  </Link>
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#4E5968] font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#00BFA5]" /> 설정된 목표
                  </span>
                  <span className="text-[#00BFA5] font-bold">{kompassCount}개</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#4E5968] font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#FFB300]" /> 활성 프로필
                  </span>
                  <span className="text-[#FFB300] font-bold">{profileCount}개</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Summary Card */}
          <Card className="toss-card p-6">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#00BFA5]" /> AI 커리어 분석
                </CardTitle>
                <Link href="/analysis">
                  <Button variant="ghost" size="sm" className="text-[#00BFA5] font-bold">
                    전체보기 <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <CardDescription className="text-[#8B95A1] mt-1">
                AI가 분석한 나의 커리어 인사이트
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0 mt-4">
              {analysisCount > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-[#F0FDF9] rounded-xl border border-[#00BFA5]/20">
                    <p className="text-sm text-[#00BFA5] font-semibold mb-1">최근 분석 완료</p>
                    <p className="text-[#4E5968] text-sm">
                      {analysisCount}개의 커리어 분석이 있습니다.
                    </p>
                  </div>
                  <Link href="/analysis">
                    <Button variant="outline" className="w-full rounded-xl h-11 border-[#00BFA5] text-[#00BFA5] font-bold hover:bg-[#00BFA5]/10" data-testid="button-view-analysis">
                      분석 결과 보기
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="p-4 bg-[#F9FAFB] rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <BarChart3 className="h-5 w-5 text-[#00BFA5]" />
                    <span className="font-bold text-[#191F28]">분석 시작하기</span>
                  </div>
                  <p className="text-sm text-[#8B95A1] mb-4">
                    프로필을 바탕으로 AI가 맞춤형 커리어 분석을 제공합니다.
                  </p>
                  <Link href="/analysis">
                    <Button className="w-full rounded-xl h-11 bg-[#00BFA5] font-bold hover:bg-[#00BFA5]/90" data-testid="button-start-analysis">
                      AI 분석 시작 (100 포인트)
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Completion Card */}
          <Card className="toss-card p-6">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                  <User className="h-5 w-5 text-[#3182F6]" /> 프로필 현황
                </CardTitle>
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="text-[#3182F6] font-bold">
                    수정하기 <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[#4E5968] font-medium">프로필 완성도</span>
                  <span className="text-[#3182F6] font-bold">{profileCount > 0 ? '작성됨' : '미작성'}</span>
                </div>
                <Progress 
                  value={profileCount > 0 ? 60 : 0} 
                  className="h-3 bg-[#F2F4F6]" 
                  indicatorClassName="bg-[#3182F6]" 
                />
                <p className="text-sm text-[#8B95A1]">
                  {profileCount > 0 
                    ? '프로필 정보를 더 상세히 입력하면 더 정확한 분석을 받을 수 있어요.'
                    : '프로필을 작성하면 AI 분석과 맞춤 추천을 받을 수 있어요.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Essays Card */}
          <Card className="toss-card p-6">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#9852F8]" /> 자기소개서
                </CardTitle>
                <Link href="/personal-statement">
                  <Button variant="ghost" size="sm" className="text-[#9852F8] font-bold">
                    전체보기 <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0 mt-4">
              {essayCount > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-[#F5F0FF] rounded-xl border border-[#9852F8]/20">
                    <p className="text-sm text-[#9852F8] font-semibold mb-1">작성된 에세이</p>
                    <p className="text-[#4E5968] text-sm">
                      {essayCount}개의 자기소개서가 있습니다.
                    </p>
                  </div>
                  <Link href="/personal-statement">
                    <Button variant="outline" className="w-full rounded-xl h-11 border-[#9852F8] text-[#9852F8] font-bold hover:bg-[#9852F8]/10" data-testid="button-view-essays">
                      에세이 보기
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-[#8B95A1]">
                    AI가 도와주는 자기소개서 작성으로 취업 준비를 시작해보세요.
                  </p>
                  <Link href="/personal-statement">
                    <Button className="w-full rounded-xl h-11 bg-[#9852F8] font-bold hover:bg-[#9852F8]/90" data-testid="button-write-essay">
                      자기소개서 작성 (100 포인트)
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
