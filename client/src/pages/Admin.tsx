import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, Settings, Coins, Activity, 
  RefreshCw, Search, Shield, User, Crown,
  BarChart3, Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp, Eye,
  ChevronUp, ChevronDown, Gift, Plus, Minus
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/AuthContext";

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  credits: number;
  giftPoints: number;
  role: string;
  createdAt: string | null;
}

interface GiftPointStats {
  totalGiftPoints: number;
  totalUsersWithGP: number;
  expiringIn30Days: number;
  expiringIn30DaysUsers: number;
}

interface GiftPointLedgerEntry {
  id: string;
  userId: string;
  originalAmount: number;
  remainingAmount: number;
  reason: string | null;
  expiresAt: string;
  isExpired: number;
  createdAt: string;
  user?: { email: string | null; displayName: string | null };
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

interface QueueStats {
  goal: { queued: number; processing: number };
  essay: { queued: number; processing: number };
  essay_revision: { queued: number; processing: number };
  analysis: { queued: number; processing: number };
  totalProcessing: number;
}

interface RecentJob {
  id: string;
  userId: string;
  profileId: string | null;
  type: string;
  status: string;
  progress: number | null;
  estimatedProgress: number;
  error: string | null;
  payload: Record<string, unknown> | null;
  inputTokens: number | null;
  outputTokens: number | null;
  cacheReadTokens: number | null;
  cacheWriteTokens: number | null;
  totalTokens: number | null;
  estimatedCostCents: number | null;
  queuedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  user: { email: string | null; displayName: string | null } | null;
  profile: { type: string | null; title: string | null } | null;
}


interface TrafficStats {
  today: { pageViews: number; uniqueVisitors: number; newUsers: number };
  yesterday: { pageViews: number; uniqueVisitors: number; newUsers: number };
  last7Days: { pageViews: number; uniqueVisitors: number; newUsers: number };
  last30Days: { pageViews: number; uniqueVisitors: number; newUsers: number };
  dailyData: Array<{ date: string; pageViews: number; uniqueVisitors: number }>;
}

interface PageSettings {
  slug: string;
  title: string;
  description: string | null;
  defaultRoles: string[];
  allowedRoles: string[] | null;
  isLocked: number;
  updatedBy: string | null;
  updatedAt: string | null;
}

interface UserSession {
  id: string;
  userId: string;
  eventType: string;
  loginAt: string;
  logoutAt: string | null;
  sessionDuration: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  user: {
    id: string;
    email: string | null;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

interface PointPackage {
  id: string;
  name: string;
  points: number;
  price: number;
  bonusPoints: number;
  description: string | null;
  isActive: number;
  sortOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
}

interface ServicePricing {
  id: string;
  name: string;
  description: string | null;
  pointCost: number;
  isActive: number;
  updatedAt: string | null;
  updatedBy: string | null;
}

interface RedemptionCode {
  id: string;
  code: string;
  pointAmount: number;
  maxUses: number | null;
  currentUses: number;
  isActive: number;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

const DEFAULT_SERVICE_PRICING: Record<string, { name: string; description: string; pointCost: number }> = {
  analysis: { name: '진로 분석', description: 'AI 기반 진로 분석 1회', pointCost: 100 },
  essay: { name: '자기소개서 생성', description: 'AI 자기소개서 작성 1회', pointCost: 100 },
  essay_revision: { name: '자기소개서 수정', description: 'AI 자기소개서 수정 1회', pointCost: 30 },
  goal_yearly: { name: '연간 목표 생성', description: 'AI 연간 목표 생성', pointCost: 100 },
  goal_half_yearly: { name: '반기 목표 생성', description: 'AI 반기 목표 생성', pointCost: 80 },
  goal_monthly: { name: '월간 목표 생성', description: 'AI 월간 목표 생성', pointCost: 50 },
  goal_weekly: { name: '주간 목표 생성', description: 'AI 주간 목표 생성', pointCost: 30 },
  goal_daily: { name: '일간 목표 생성', description: 'AI 일간 목표 생성', pointCost: 20 },
};

const COLORS = ['#3182F6', '#7C3AED', '#059669', '#D97706', '#EC4899', '#6B7280'];

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCredits, setEditingCredits] = useState<{ userId: string; credits: number } | null>(null);
  const [editingPackage, setEditingPackage] = useState<PointPackage | null>(null);
  const [newPackage, setNewPackage] = useState<Partial<PointPackage> | null>(null);
  const [editingPricing, setEditingPricing] = useState<{ id: string; pointCost: number } | null>(null);
  const [editingSignupBonus, setEditingSignupBonus] = useState<number | null>(null);
  const [newCoupon, setNewCoupon] = useState<{code: string; pointAmount: number; maxUses: number | null; expiresAt: string | null} | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<RedemptionCode | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingQueue, setIsRefreshingQueue] = useState(false);
  const [isRefreshingJobs, setIsRefreshingJobs] = useState(false);
  const [gpSearchQuery, setGpSearchQuery] = useState("");
  const [selectedUserForGP, setSelectedUserForGP] = useState<AdminUser | null>(null);
  const [gpAmount, setGpAmount] = useState<number>(100);
  const [gpReason, setGpReason] = useState<string>("");

  const { user: currentUser, isLoading: userLoading } = useAuth();

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

  const { data: queueStats, refetch: refetchQueueStats } = useQuery<QueueStats>({
    queryKey: ['/api/ai/queue/stats'],
    enabled: isStaffOrAdmin,
    retry: false,
    refetchInterval: 3000,
  });

  const { data: recentJobs = [], refetch: refetchRecentJobs } = useQuery<RecentJob[]>({
    queryKey: ['/api/admin/jobs/recent'],
    enabled: isStaffOrAdmin,
    retry: false,
    refetchInterval: 3000,
  });

  const { data: trafficStats, refetch: refetchTraffic } = useQuery<TrafficStats>({
    queryKey: ['/api/admin/stats/traffic'],
    enabled: isStaffOrAdmin,
    retry: false,
  });

  const { data: userSessions = [], refetch: refetchSessions } = useQuery<UserSession[]>({
    queryKey: ['/api/admin/sessions'],
    enabled: isStaffOrAdmin,
    retry: false,
  });

  const { data: pageSettings = [], isLoading: pagesLoading, refetch: refetchPages } = useQuery<PageSettings[]>({
    queryKey: ['/api/admin/page-visibility'],
    enabled: isStaffOrAdmin,
    retry: false,
  });

  const { data: pointPackages = [], isLoading: packagesLoading, refetch: refetchPackages } = useQuery<PointPackage[]>({
    queryKey: ['/api/admin/packages'],
    enabled: isStaffOrAdmin,
    retry: false,
  });

  const { data: servicePricingData = [], refetch: refetchPricing } = useQuery<ServicePricing[]>({
    queryKey: ['/api/service-pricing'],
    enabled: isStaffOrAdmin,
    retry: false,
  });

  const { data: systemSettings = {}, refetch: refetchSettings } = useQuery<Record<string, { value: string; description: string | null }>>({
    queryKey: ['/api/admin/system-settings'],
    enabled: isStaffOrAdmin,
    retry: false,
  });

  const { data: redemptionCodes = [], refetch: refetchCoupons } = useQuery<RedemptionCode[]>({
    queryKey: ['/api/admin/redemption-codes'],
    enabled: isStaffOrAdmin,
    retry: false,
  });

  const { data: gpStats, refetch: refetchGPStats } = useQuery<GiftPointStats>({
    queryKey: ['/api/admin/gift-points/stats'],
    enabled: isStaffOrAdmin,
    retry: false,
  });

  // Merge database pricing with defaults for display
  const servicePricing = Object.entries(DEFAULT_SERVICE_PRICING).map(([id, defaults]) => {
    const dbPricing = servicePricingData.find(p => p.id === id);
    return dbPricing || { id, ...defaults, isActive: 1, updatedAt: null, updatedBy: null };
  });

  const signupBonus = parseInt(systemSettings.signup_bonus?.value || '1000', 10);

  const initServicePricingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/service-pricing/init', {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-pricing'] });
      toast({
        title: "초기화 완료",
        description: "서비스 가격이 초기화되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "서비스 가격 초기화에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const updateServicePricingMutation = useMutation({
    mutationFn: async ({ id, pointCost }: { id: string; pointCost: number }) => {
      const res = await apiRequest('PATCH', `/api/admin/service-pricing/${id}`, { pointCost });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-pricing'] });
      setEditingPricing(null);
      toast({
        title: "업데이트 완료",
        description: "서비스 가격이 변경되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "서비스 가격 업데이트에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const updateSignupBonusMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest('PATCH', '/api/admin/system-settings/signup_bonus', { 
        value: amount.toString(), 
        description: '신규 가입 시 지급되는 포인트' 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system-settings'] });
      setEditingSignupBonus(null);
      toast({ title: "업데이트 완료", description: "신규 가입 보너스가 변경되었습니다." });
    },
    onError: () => {
      toast({ title: "오류", description: "보너스 업데이트에 실패했습니다.", variant: "destructive" });
    },
  });

  const createCouponMutation = useMutation({
    mutationFn: async (data: { code: string; pointAmount: number; maxUses: number | null; expiresAt: string | null }) => {
      const res = await apiRequest('POST', '/api/admin/redemption-codes', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/redemption-codes'] });
      setNewCoupon(null);
      toast({ title: "쿠폰 생성 완료", description: "새 쿠폰이 생성되었습니다." });
    },
    onError: (error: any) => {
      toast({ title: "오류", description: error?.message || "쿠폰 생성에 실패했습니다.", variant: "destructive" });
    },
  });

  const updateCouponMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RedemptionCode> }) => {
      const res = await apiRequest('PATCH', `/api/admin/redemption-codes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/redemption-codes'] });
      setEditingCoupon(null);
      toast({ title: "쿠폰 업데이트 완료", description: "쿠폰이 수정되었습니다." });
    },
    onError: () => {
      toast({ title: "오류", description: "쿠폰 수정에 실패했습니다.", variant: "destructive" });
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/admin/redemption-codes/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/redemption-codes'] });
      toast({ title: "삭제 완료", description: "쿠폰이 삭제되었습니다." });
    },
    onError: () => {
      toast({ title: "오류", description: "쿠폰 삭제에 실패했습니다.", variant: "destructive" });
    },
  });

  const addGPMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      const res = await apiRequest('POST', '/api/admin/gift-points/add', { userId, amount, reason });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || '기프트 포인트 지급에 실패했습니다.');
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gift-points/stats'] });
      setSelectedUserForGP(null);
      setGpAmount(100);
      setGpReason("");
      toast({ 
        title: "기프트 포인트 지급 완료", 
        description: `${variables.amount.toLocaleString()}GP가 지급되었습니다. 새 GP 잔액: ${data.newGiftPoints.toLocaleString()}GP` 
      });
    },
    onError: (error: Error) => {
      toast({ title: "오류", description: error.message, variant: "destructive" });
    },
  });

  const updatePageVisibilityMutation = useMutation({
    mutationFn: async ({ slug, allowedRoles }: { slug: string; allowedRoles: string[] | null }) => {
      const res = await apiRequest('PATCH', `/api/admin/page-visibility/${encodeURIComponent(slug)}`, { allowedRoles });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/page-visibility'] });
      queryClient.invalidateQueries({ queryKey: ['page-visibility'] });
      toast({
        title: "페이지 설정 업데이트",
        description: "페이지 가시성이 변경되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "페이지 설정 업데이트에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const resetPageSettingsMutation = useMutation({
    mutationFn: async (slug: string) => {
      const res = await apiRequest('POST', `/api/admin/page-visibility/${encodeURIComponent(slug)}/reset`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/page-visibility'] });
      queryClient.invalidateQueries({ queryKey: ['page-visibility'] });
      toast({
        title: "초기화 완료",
        description: "페이지 설정이 기본값으로 초기화되었습니다.",
      });
    },
  });

  const toggleRole = (page: PageSettings, role: string) => {
    if (page.isLocked) return;
    const currentRoles = page.allowedRoles || page.defaultRoles;
    let newRoles: string[];
    
    if (currentRoles.includes(role)) {
      newRoles = currentRoles.filter(r => r !== role);
    } else {
      newRoles = [...currentRoles, role];
    }

    if (newRoles.length === 0) {
      toast({
        title: "최소 1개 역할 필요",
        description: "최소 1개의 역할이 페이지에 접근할 수 있어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    updatePageVisibilityMutation.mutate({ slug: page.slug, allowedRoles: newRoles });
  };

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

  const createPackageMutation = useMutation({
    mutationFn: async (pkg: Partial<PointPackage>) => {
      const res = await apiRequest('POST', '/api/admin/packages', pkg);
      if (!res.ok) throw new Error('Failed to create package');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/packages'] });
      setNewPackage(null);
      toast({ title: "패키지 생성 완료", description: "새 포인트 패키지가 생성되었습니다." });
    },
    onError: () => {
      toast({ title: "오류", description: "패키지 생성에 실패했습니다.", variant: "destructive" });
    },
  });

  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<PointPackage> & { id: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/packages/${id}`, data);
      if (!res.ok) throw new Error('Failed to update package');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/packages'] });
      setEditingPackage(null);
      toast({ title: "패키지 수정 완료", description: "포인트 패키지가 수정되었습니다." });
    },
    onError: () => {
      toast({ title: "오류", description: "패키지 수정에 실패했습니다.", variant: "destructive" });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/admin/packages/${id}`);
      if (!res.ok) throw new Error('Failed to delete package');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/packages'] });
      toast({ title: "패키지 비활성화", description: "포인트 패키지가 비활성화되었습니다." });
    },
    onError: () => {
      toast({ title: "오류", description: "패키지 삭제에 실패했습니다.", variant: "destructive" });
    },
  });

  // Sort packages by sortOrder for display
  const sortedPackages = [...pointPackages].sort((a, b) => a.sortOrder - b.sortOrder);

  // Reorder packages by swapping with adjacent item
  const handleReorderPackage = async (pkgId: string, direction: 'up' | 'down') => {
    const currentIndex = sortedPackages.findIndex(p => p.id === pkgId);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedPackages.length) return;
    
    const currentPkg = sortedPackages[currentIndex];
    const targetPkg = sortedPackages[targetIndex];
    
    // Swap sortOrder values
    try {
      await apiRequest('PATCH', `/api/admin/packages/${currentPkg.id}`, { sortOrder: targetPkg.sortOrder });
      await apiRequest('PATCH', `/api/admin/packages/${targetPkg.id}`, { sortOrder: currentPkg.sortOrder });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/packages'] });
    } catch {
      toast({ title: "오류", description: "순서 변경에 실패했습니다.", variant: "destructive" });
    }
  };

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
            onClick={async () => {
              setIsRefreshing(true);
              await Promise.all([
                refetchUsers(),
                refetchStats(),
                refetchAiStats(),
                refetchQueueStats(),
                refetchTraffic(),
                refetchPages(),
                refetchPackages(),
              ]);
              setIsRefreshing(false);
            }}
            disabled={isRefreshing}
            className="rounded-xl"
            data-testid="button-refresh-admin"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? '새로고침 중...' : '새로고침'}
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
            <TabsTrigger value="pages" className="rounded-lg px-4" data-testid="tab-pages">
              <Eye className="h-4 w-4 mr-2" />
              페이지 관리
            </TabsTrigger>
            <TabsTrigger value="giftpoints" className="rounded-lg px-4" data-testid="tab-giftpoints">
              <Gift className="h-4 w-4 mr-2" />
              기프트 포인트
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
                            {isStaffOrAdmin && editingCredits?.userId === user.id ? (
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
                                className={`font-bold text-[#3182F6] ${isStaffOrAdmin ? 'cursor-pointer hover:underline' : ''}`}
                                onClick={() => isStaffOrAdmin && setEditingCredits({ userId: user.id, credits: user.credits })}
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

            {/* Real-time Job Queue Monitor */}
            <Card className="toss-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#3182F6]" />
                  실시간 작업 큐 모니터
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm text-[#8B95A1]">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    자동 갱신 (3초)
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setIsRefreshingQueue(true);
                      await refetchQueueStats();
                      setIsRefreshingQueue(false);
                    }}
                    disabled={isRefreshingQueue}
                    className="rounded-lg"
                    data-testid="button-refresh-queue"
                  >
                    <RefreshCw className={`h-3 w-3 ${isRefreshingQueue ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {/* Analysis Queue */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200" data-testid="queue-analysis">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">진로 분석</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{queueStats?.analysis?.queued || 0}</p>
                        <p className="text-xs text-blue-500">대기</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-800">{queueStats?.analysis?.processing || 0}</p>
                        <p className="text-xs text-blue-500">처리중</p>
                      </div>
                    </div>
                  </div>

                  {/* Essay Queue */}
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200" data-testid="queue-essay">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-purple-800">자기소개서</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{queueStats?.essay?.queued || 0}</p>
                        <p className="text-xs text-purple-500">대기</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-800">{queueStats?.essay?.processing || 0}</p>
                        <p className="text-xs text-purple-500">처리중</p>
                      </div>
                    </div>
                  </div>

                  {/* Goal Queue */}
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200" data-testid="queue-goal">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">목표 생성</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{queueStats?.goal?.queued || 0}</p>
                        <p className="text-xs text-green-500">대기</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-800">{queueStats?.goal?.processing || 0}</p>
                        <p className="text-xs text-green-500">처리중</p>
                      </div>
                    </div>
                  </div>

                  {/* Total Processing */}
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200" data-testid="queue-total">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <span className="font-medium text-orange-800">전체 현황</span>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-orange-600">{queueStats?.totalProcessing || 0}</p>
                      <p className="text-xs text-orange-500">총 처리중</p>
                    </div>
                  </div>
                </div>

                {/* Rate Limit Info */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    API 제한 설정
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-lg font-bold text-[#3182F6]">30</p>
                      <p className="text-xs text-gray-500">요청/분 (Shared Rate Limit)</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-lg font-bold text-[#7C3AED]">3</p>
                      <p className="text-xs text-gray-500">동시 분석</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-lg font-bold text-[#059669]">2</p>
                      <p className="text-xs text-gray-500">동시 자소서</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-lg font-bold text-[#D97706]">3</p>
                      <p className="text-xs text-gray-500">동시 목표</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Jobs List */}
            <Card className="toss-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#3182F6]" />
                  최근 AI 작업 목록
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#3182F6] text-white">
                    {recentJobs.filter(j => j.status === 'processing' || j.status === 'queued').length}개 진행 중
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setIsRefreshingJobs(true);
                      await refetchRecentJobs();
                      setIsRefreshingJobs(false);
                    }}
                    disabled={isRefreshingJobs}
                    className="rounded-lg"
                    data-testid="button-refresh-jobs"
                  >
                    <RefreshCw className={`h-3 w-3 ${isRefreshingJobs ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {recentJobs.length === 0 ? (
                    <div className="text-center text-[#8B95A1] py-8">
                      최근 작업이 없습니다
                    </div>
                  ) : (
                    recentJobs.slice(0, 20).map((job) => {
                      const typeLabels: Record<string, string> = {
                        analysis: '진로 분석',
                        essay: '자기소개서',
                        essay_revision: '자소서 수정',
                        goal: '목표 생성',
                      };
                      const statusColors: Record<string, string> = {
                        queued: 'bg-yellow-100 text-yellow-800',
                        processing: 'bg-blue-100 text-blue-800',
                        completed: 'bg-green-100 text-green-800',
                        failed: 'bg-red-100 text-red-800',
                      };
                      const statusLabels: Record<string, string> = {
                        queued: '대기',
                        processing: '처리중',
                        completed: '완료',
                        failed: '실패',
                      };
                      
                      const goalLevelLabels: Record<string, string> = {
                        year: '연간',
                        half: '반기',
                        month: '월간',
                        week: '주간',
                        day: '일간',
                      };
                      
                      const elapsedTime = job.startedAt 
                        ? Math.round((Date.now() - new Date(job.startedAt).getTime()) / 1000)
                        : null;
                      
                      return (
                        <div 
                          key={job.id} 
                          className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E8EB]"
                          data-testid={`job-row-${job.id}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={`${statusColors[job.status] || 'bg-gray-100 text-gray-800'} text-xs`}>
                                {statusLabels[job.status] || job.status}
                              </Badge>
                              <span className="font-medium text-[#191F28]">
                                {typeLabels[job.type] || job.type}
                                {job.type === 'goal' && (job.payload as any)?.level && (
                                  <span className="text-[#8B95A1] font-normal ml-1">
                                    ({goalLevelLabels[(job.payload as any).level] || (job.payload as any).level})
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#8B95A1]">
                              <span>{job.user?.displayName || job.user?.email || '알 수 없음'}</span>
                              {job.profile?.type && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white">
                                  {job.profile.type === 'high' ? '고등' : 
                                   job.profile.type === 'university' ? '대학' : 
                                   job.profile.type === 'general' ? '일반' :
                                   job.profile.type === 'middle' ? '중등' :
                                   job.profile.type === 'elementary' ? '초등' : job.profile.type}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {(job.status === 'processing' || job.status === 'queued') && (
                            <div className="mb-2">
                              <div className="flex items-center justify-between text-xs text-[#8B95A1] mb-1">
                                <span>진행률</span>
                                <span>{job.estimatedProgress}%</span>
                              </div>
                              <Progress value={job.estimatedProgress} className="h-2" />
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-[#8B95A1]">
                            <span>
                              {job.queuedAt 
                                ? new Date(job.queuedAt).toLocaleString('ko-KR', { 
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                  })
                                : '-'
                              }
                            </span>
                            {job.status === 'processing' && elapsedTime !== null && (
                              <span className="text-blue-600">
                                {elapsedTime}초 경과
                              </span>
                            )}
                            {job.status === 'completed' && job.completedAt && job.startedAt && (
                              <span className="text-green-600">
                                {Math.round((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)}초 소요
                              </span>
                            )}
                            {job.status === 'failed' && (
                              <span className="text-red-600 truncate max-w-[200px]" title={job.error || ''}>
                                {job.error || '오류 발생'}
                              </span>
                            )}
                          </div>
                          
                          {/* Token usage display for completed jobs */}
                          {job.status === 'completed' && job.totalTokens && job.totalTokens > 0 && (
                            <div className="flex items-center gap-3 text-xs text-[#8B95A1] mt-1">
                              <span title="입력 토큰">IN: {job.inputTokens?.toLocaleString() || 0}</span>
                              <span title="출력 토큰">OUT: {job.outputTokens?.toLocaleString() || 0}</span>
                              <span title="총 토큰">총: {job.totalTokens?.toLocaleString()}</span>
                              {job.estimatedCostCents && job.estimatedCostCents > 0 && (
                                <span className="text-amber-600 font-medium" title="예상 비용">
                                  ${(job.estimatedCostCents / 100).toFixed(3)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tokens" className="space-y-6">
            <Card className="toss-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coins className="h-5 w-5 text-[#3182F6]" />
                  포인트 가격 정책
                </CardTitle>
                {servicePricingData.length === 0 && (
                  <Button
                    onClick={() => initServicePricingMutation.mutate()}
                    disabled={initServicePricingMutation.isPending}
                    className="bg-[#3182F6] hover:bg-[#1B64DA] text-white rounded-xl"
                    data-testid="button-init-pricing"
                  >
                    {initServicePricingMutation.isPending ? "초기화 중..." : "가격 초기화"}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {servicePricing.map((pricing) => (
                      <div
                        key={pricing.id}
                        className="p-4 bg-[#F2F4F6] rounded-xl"
                        data-testid={`card-pricing-${pricing.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-[#191F28]">{pricing.name}</p>
                          {editingPricing?.id !== pricing.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingPricing({ id: pricing.id, pointCost: pricing.pointCost })}
                              className="text-[#3182F6] hover:text-[#1B64DA]"
                              data-testid={`button-edit-pricing-${pricing.id}`}
                            >
                              수정
                            </Button>
                          )}
                        </div>
                        {editingPricing?.id === pricing.id ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={editingPricing.pointCost}
                                onChange={(e) => setEditingPricing({ ...editingPricing, pointCost: parseInt(e.target.value) || 0 })}
                                className="w-24"
                                min={0}
                                data-testid={`input-pricing-${pricing.id}`}
                              />
                              <span className="text-[#191F28] font-bold">포인트</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateServicePricingMutation.mutate({ id: pricing.id, pointCost: editingPricing.pointCost })}
                                disabled={updateServicePricingMutation.isPending}
                                className="bg-[#3182F6] hover:bg-[#1B64DA] text-white"
                                data-testid={`button-save-pricing-${pricing.id}`}
                              >
                                저장
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingPricing(null)}
                                data-testid={`button-cancel-pricing-${pricing.id}`}
                              >
                                취소
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className={`text-2xl font-bold ${pricing.id === 'essay_revision' ? 'text-[#7C3AED]' : 'text-[#3182F6]'}`}>
                              {pricing.pointCost.toLocaleString()} 포인트
                            </p>
                            <p className="text-sm text-[#8B95A1]">{pricing.description}</p>
                          </>
                        )}
                      </div>
                    ))}
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

            <Card className="toss-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coins className="h-5 w-5 text-[#059669]" />
                  충전 패키지 관리
                </CardTitle>
                <Button
                  onClick={() => setNewPackage({ name: '', points: 100, price: 5000, bonusPoints: 0, isActive: 1, sortOrder: sortedPackages.length + 1 })}
                  className="bg-[#3182F6] hover:bg-[#1B64DA] text-white rounded-xl"
                  data-testid="button-add-package"
                >
                  새 패키지 추가
                </Button>
              </CardHeader>
              <CardContent>
                {packagesLoading ? (
                  <div className="p-8 text-center text-[#8B95A1]">로딩 중...</div>
                ) : (
                  <div className="space-y-4">
                    {newPackage && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-4" data-testid="form-new-package">
                        <p className="font-bold text-[#191F28]">새 패키지 추가</p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm text-[#8B95A1]">패키지 이름</label>
                            <Input
                              value={newPackage.name || ''}
                              onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                              placeholder="예: 스타터"
                              className="mt-1"
                              data-testid="input-new-package-name"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-[#8B95A1]">포인트</label>
                            <Input
                              type="number"
                              value={newPackage.points || 0}
                              onChange={(e) => setNewPackage({ ...newPackage, points: parseInt(e.target.value) || 0 })}
                              className="mt-1"
                              data-testid="input-new-package-points"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-[#8B95A1]">가격 (원)</label>
                            <Input
                              type="number"
                              value={newPackage.price || 0}
                              onChange={(e) => setNewPackage({ ...newPackage, price: parseInt(e.target.value) || 0 })}
                              className="mt-1"
                              data-testid="input-new-package-price"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-[#8B95A1]">보너스 포인트</label>
                            <Input
                              type="number"
                              value={newPackage.bonusPoints || 0}
                              onChange={(e) => setNewPackage({ ...newPackage, bonusPoints: parseInt(e.target.value) || 0 })}
                              className="mt-1"
                              data-testid="input-new-package-bonus"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-[#8B95A1]">설명 (태그)</label>
                            <Input
                              value={newPackage.description || ''}
                              onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                              placeholder="예: 인기"
                              className="mt-1"
                              data-testid="input-new-package-description"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => createPackageMutation.mutate(newPackage)}
                            disabled={!newPackage.name || !newPackage.points || !newPackage.price || createPackageMutation.isPending}
                            className="bg-[#059669] hover:bg-[#047857] text-white"
                            data-testid="button-save-new-package"
                          >
                            {createPackageMutation.isPending ? '저장 중...' : '저장'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setNewPackage(null)}
                            data-testid="button-cancel-new-package"
                          >
                            취소
                          </Button>
                        </div>
                      </div>
                    )}

                    {sortedPackages.length === 0 ? (
                      <div className="p-8 text-center text-[#8B95A1]">등록된 패키지가 없습니다.</div>
                    ) : (
                      <div className="divide-y divide-[#F2F4F6]">
                        {sortedPackages.map((pkg, index) => (
                          <div key={pkg.id} className="py-4" data-testid={`row-package-${pkg.id}`}>
                            {editingPackage?.id === pkg.id ? (
                              <div className="space-y-4 p-4 bg-[#F2F4F6] rounded-xl">
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  <div>
                                    <label className="text-sm text-[#8B95A1]">패키지 이름</label>
                                    <Input
                                      value={editingPackage.name}
                                      onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                                      className="mt-1"
                                      data-testid={`input-edit-name-${pkg.id}`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm text-[#8B95A1]">포인트</label>
                                    <Input
                                      type="number"
                                      value={editingPackage.points}
                                      onChange={(e) => setEditingPackage({ ...editingPackage, points: parseInt(e.target.value) || 0 })}
                                      className="mt-1"
                                      data-testid={`input-edit-points-${pkg.id}`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm text-[#8B95A1]">가격 (원)</label>
                                    <Input
                                      type="number"
                                      value={editingPackage.price}
                                      onChange={(e) => setEditingPackage({ ...editingPackage, price: parseInt(e.target.value) || 0 })}
                                      className="mt-1"
                                      data-testid={`input-edit-price-${pkg.id}`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm text-[#8B95A1]">보너스 포인트</label>
                                    <Input
                                      type="number"
                                      value={editingPackage.bonusPoints}
                                      onChange={(e) => setEditingPackage({ ...editingPackage, bonusPoints: parseInt(e.target.value) || 0 })}
                                      className="mt-1"
                                      data-testid={`input-edit-bonus-${pkg.id}`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm text-[#8B95A1]">설명 (태그)</label>
                                    <Input
                                      value={editingPackage.description || ''}
                                      onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                                      className="mt-1"
                                      data-testid={`input-edit-description-${pkg.id}`}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <label className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={editingPackage.isActive === 1}
                                      onChange={(e) => setEditingPackage({ ...editingPackage, isActive: e.target.checked ? 1 : 0 })}
                                      className="rounded"
                                      data-testid={`input-edit-active-${pkg.id}`}
                                    />
                                    활성화
                                  </label>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => updatePackageMutation.mutate(editingPackage)}
                                    disabled={updatePackageMutation.isPending}
                                    className="bg-[#3182F6] hover:bg-[#1B64DA] text-white"
                                    data-testid={`button-save-edit-${pkg.id}`}
                                  >
                                    {updatePackageMutation.isPending ? '저장 중...' : '저장'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => setEditingPackage(null)}
                                    data-testid={`button-cancel-edit-${pkg.id}`}
                                  >
                                    취소
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleReorderPackage(pkg.id, 'up')}
                                      disabled={index === 0}
                                      className="h-6 w-6 p-0"
                                      data-testid={`button-move-up-${pkg.id}`}
                                    >
                                      <ChevronUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleReorderPackage(pkg.id, 'down')}
                                      disabled={index === sortedPackages.length - 1}
                                      className="h-6 w-6 p-0"
                                      data-testid={`button-move-down-${pkg.id}`}
                                    >
                                      <ChevronDown className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <span className="text-sm text-[#8B95A1] font-medium w-6 text-center">{index + 1}</span>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-[#191F28]">{pkg.name}</p>
                                      {pkg.description && (
                                        <Badge className="bg-[#3182F6] text-white text-xs">{pkg.description}</Badge>
                                      )}
                                      {pkg.isActive === 0 && (
                                        <Badge variant="outline" className="text-[#8B95A1]">비활성</Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-[#8B95A1]">
                                      <span className="text-[#3182F6] font-bold">{pkg.points.toLocaleString()} 포인트</span>
                                      <span>₩{pkg.price.toLocaleString()}</span>
                                      {pkg.bonusPoints > 0 && (
                                        <span className="text-[#059669]">+{pkg.bonusPoints} 보너스</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingPackage(pkg)}
                                    className="rounded-lg"
                                    data-testid={`button-edit-package-${pkg.id}`}
                                  >
                                    수정
                                  </Button>
                                  {pkg.isActive === 1 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (confirm('이 패키지를 비활성화 하시겠습니까?')) {
                                          deletePackageMutation.mutate(pkg.id);
                                        }
                                      }}
                                      className="rounded-lg text-red-500 border-red-200 hover:bg-red-50"
                                      data-testid={`button-delete-package-${pkg.id}`}
                                    >
                                      비활성화
                                    </Button>
                                  )}
                                  {pkg.isActive === 0 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updatePackageMutation.mutate({ id: pkg.id, isActive: 1 })}
                                      className="rounded-lg text-[#059669] border-green-200 hover:bg-green-50"
                                      data-testid={`button-activate-package-${pkg.id}`}
                                    >
                                      활성화
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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

            {/* User Sessions History */}
            <Card className="toss-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#059669]" />
                  사용자 세션 기록
                </CardTitle>
                <p className="text-sm text-[#8B95A1]">
                  로그인/로그아웃 기록 및 체류 시간
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {userSessions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#F9FAFB] border-b border-[#E5E8EB]">
                        <tr>
                          <th className="px-4 py-3 text-left text-[#4E5968] font-medium">사용자</th>
                          <th className="px-4 py-3 text-left text-[#4E5968] font-medium">상태</th>
                          <th className="px-4 py-3 text-left text-[#4E5968] font-medium">로그인 시간</th>
                          <th className="px-4 py-3 text-left text-[#4E5968] font-medium">로그아웃 시간</th>
                          <th className="px-4 py-3 text-left text-[#4E5968] font-medium">체류 시간</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F2F4F6]">
                        {userSessions.slice(0, 20).map((session) => {
                          const userName = session.user?.displayName 
                            || (session.user?.lastName && session.user?.firstName 
                              ? `${session.user.lastName}${session.user.firstName}` 
                              : session.user?.email?.split('@')[0] || '알 수 없음');
                          
                          const formatDuration = (seconds: number | null) => {
                            if (!seconds) return '-';
                            if (seconds < 60) return `${seconds}초`;
                            if (seconds < 3600) return `${Math.floor(seconds / 60)}분`;
                            const hours = Math.floor(seconds / 3600);
                            const mins = Math.floor((seconds % 3600) / 60);
                            return `${hours}시간 ${mins}분`;
                          };
                          
                          const formatTime = (dateStr: string | null) => {
                            if (!dateStr) return '-';
                            const date = new Date(dateStr);
                            return date.toLocaleString('ko-KR', {
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                          };

                          return (
                            <tr key={session.id} className="hover:bg-[#F9FAFB]">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-[#3182F6]/10 flex items-center justify-center">
                                    <User className="h-4 w-4 text-[#3182F6]" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-[#191F28]">{userName}</p>
                                    <p className="text-xs text-[#8B95A1]">{session.user?.email || '-'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {session.eventType === 'login' ? (
                                  <Badge className="bg-green-100 text-green-700">활성</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[#8B95A1]">종료</Badge>
                                )}
                              </td>
                              <td className="px-4 py-3 text-[#4E5968]">
                                {formatTime(session.loginAt)}
                              </td>
                              <td className="px-4 py-3 text-[#4E5968]">
                                {formatTime(session.logoutAt)}
                              </td>
                              <td className="px-4 py-3">
                                <span className={session.sessionDuration ? "font-medium text-[#059669]" : "text-[#8B95A1]"}>
                                  {formatDuration(session.sessionDuration)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-[#8B95A1]">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-[#E5E8EB]" />
                    <p>아직 세션 기록이 없습니다</p>
                    <p className="text-sm">사용자가 로그인하면 이곳에 기록이 표시됩니다</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="space-y-6">
            <Card className="toss-card">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                  <Eye className="h-5 w-5 text-[#3182F6]" />
                  페이지별 접근 권한 관리
                </CardTitle>
                <p className="text-sm text-[#8B95A1]">
                  각 페이지에 접근할 수 있는 역할을 설정합니다. 관리자만 수정할 수 있습니다.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {pagesLoading ? (
                  <div className="p-8 text-center text-[#8B95A1]">로딩 중...</div>
                ) : (
                  <div className="divide-y divide-[#F2F4F6]">
                    {pageSettings.map((page) => {
                      const effectiveRoles = page.allowedRoles || page.defaultRoles;
                      const isModified = page.allowedRoles !== null;
                      
                      return (
                        <div 
                          key={page.slug} 
                          className={`p-4 ${page.isLocked ? 'bg-[#F9FAFB]' : ''}`}
                          data-testid={`row-page-${page.slug.replace('/', '-')}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-[#191F28]">{page.title}</h4>
                              <code className="text-xs bg-[#F2F4F6] px-2 py-0.5 rounded text-[#8B95A1]">{page.slug}</code>
                              {page.isLocked === 1 && (
                                <Badge variant="outline" className="text-xs">
                                  <Shield className="h-3 w-3 mr-1" />
                                  잠금
                                </Badge>
                              )}
                              {isModified && !page.isLocked && (
                                <Badge className="bg-amber-100 text-amber-700 text-xs">수정됨</Badge>
                              )}
                            </div>
                            {isModified && !page.isLocked && isStaffOrAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resetPageSettingsMutation.mutate(page.slug)}
                                className="text-xs text-[#8B95A1] hover:text-[#191F28]"
                                data-testid={`button-reset-${page.slug.replace('/', '-')}`}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                초기화
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-[#8B95A1] mr-2">접근 권한:</span>
                            {['user', 'staff', 'admin'].map((role) => {
                              const isActive = effectiveRoles.includes(role);
                              const roleLabel = role === 'user' ? '일반 사용자' : role === 'staff' ? '스태프' : '관리자';
                              const roleIcon = role === 'user' ? <User className="h-3 w-3" /> : role === 'staff' ? <Shield className="h-3 w-3" /> : <Crown className="h-3 w-3" />;
                              
                              return (
                                <Button
                                  key={role}
                                  variant={isActive ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => toggleRole(page, role)}
                                  disabled={page.isLocked === 1 || !isStaffOrAdmin || updatePageVisibilityMutation.isPending}
                                  className={`text-xs ${
                                    isActive 
                                      ? 'bg-[#3182F6] hover:bg-[#1B64DA] text-white' 
                                      : 'border-[#E5E8EB] text-[#8B95A1]'
                                  } ${page.isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                                  data-testid={`toggle-${page.slug.replace('/', '-')}-${role}`}
                                >
                                  {roleIcon}
                                  <span className="ml-1">{roleLabel}</span>
                                </Button>
                              );
                            })}
                          </div>
                          {page.updatedAt && (
                            <p className="text-xs text-[#8B95A1] mt-2">
                              마지막 수정: {new Date(page.updatedAt).toLocaleString('ko-KR')}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {!isStaffOrAdmin && (
              <Card className="toss-card border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="text-sm">페이지 권한 수정은 관리자 또는 스태프만 가능합니다.</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="giftpoints" className="space-y-6">
            {/* GP Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="toss-card">
                <CardContent className="p-4">
                  <p className="text-sm text-[#8B95A1] mb-1">총 GP 잔액</p>
                  <p className="text-2xl font-bold text-[#10B981]">{(gpStats?.totalGiftPoints || 0).toLocaleString()}GP</p>
                </CardContent>
              </Card>
              <Card className="toss-card">
                <CardContent className="p-4">
                  <p className="text-sm text-[#8B95A1] mb-1">GP 보유 회원</p>
                  <p className="text-2xl font-bold text-[#191F28]">{gpStats?.totalUsersWithGP || 0}명</p>
                </CardContent>
              </Card>
              <Card className="toss-card">
                <CardContent className="p-4">
                  <p className="text-sm text-[#8B95A1] mb-1">30일 내 만료 GP</p>
                  <p className="text-2xl font-bold text-amber-500">{(gpStats?.expiringIn30Days || 0).toLocaleString()}GP</p>
                </CardContent>
              </Card>
              <Card className="toss-card">
                <CardContent className="p-4">
                  <p className="text-sm text-[#8B95A1] mb-1">30일 내 만료 대상</p>
                  <p className="text-2xl font-bold text-amber-500">{gpStats?.expiringIn30DaysUsers || 0}명</p>
                </CardContent>
              </Card>
            </div>

            {/* GP Management */}
            <Card className="toss-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="h-5 w-5 text-[#10B981]" />
                  기프트 포인트 지급
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* User Search */}
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8B95A1]" />
                      <Input
                        placeholder="회원 이메일 또는 이름으로 검색..."
                        value={gpSearchQuery}
                        onChange={(e) => setGpSearchQuery(e.target.value)}
                        className="pl-10 bg-[#F2F4F6] border-none rounded-xl h-12"
                        data-testid="input-gp-search"
                      />
                    </div>
                  </div>

                  {/* User List for Selection */}
                  {gpSearchQuery.length >= 2 && (
                    <div className="border rounded-xl max-h-48 overflow-y-auto divide-y">
                      {users
                        .filter(u => {
                          const query = gpSearchQuery.toLowerCase();
                          return (
                            (u.email || '').toLowerCase().includes(query) ||
                            (u.displayName || '').toLowerCase().includes(query) ||
                            (u.firstName || '').toLowerCase().includes(query) ||
                            (u.lastName || '').toLowerCase().includes(query)
                          );
                        })
                        .slice(0, 10)
                        .map(u => (
                          <div
                            key={u.id}
                            className={`p-3 cursor-pointer hover:bg-[#F2F4F6] flex items-center justify-between ${selectedUserForGP?.id === u.id ? 'bg-blue-50' : ''}`}
                            onClick={() => setSelectedUserForGP(u)}
                            data-testid={`gp-user-select-${u.id}`}
                          >
                            <div>
                              <p className="font-medium text-[#191F28]">{u.displayName || u.email || 'Unknown'}</p>
                              <p className="text-sm text-[#8B95A1]">{u.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-[#10B981]">{(u.giftPoints || 0).toLocaleString()}GP</p>
                              <p className="text-xs text-[#8B95A1]">{u.credits.toLocaleString()}P</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Selected User & GP Form */}
                  {selectedUserForGP && (
                    <Card className="border-[#10B981] bg-emerald-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-bold text-[#191F28]">{selectedUserForGP.displayName || selectedUserForGP.email}</p>
                            <p className="text-sm text-[#8B95A1]">{selectedUserForGP.email}</p>
                            <p className="text-sm text-[#10B981] mt-1">현재 GP: {(selectedUserForGP.giftPoints || 0).toLocaleString()}GP</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUserForGP(null)}
                            className="text-[#8B95A1]"
                          >
                            취소
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium text-[#4E5968] mb-1 block">지급할 GP</label>
                            <Input
                              type="number"
                              value={gpAmount}
                              onChange={(e) => setGpAmount(parseInt(e.target.value) || 0)}
                              className="bg-white"
                              placeholder="100"
                              data-testid="input-gp-amount"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-[#4E5968] mb-1 block">지급 사유</label>
                            <Input
                              value={gpReason}
                              onChange={(e) => setGpReason(e.target.value)}
                              className="bg-white"
                              placeholder="예: 이벤트 당첨, 보상 지급 등"
                              data-testid="input-gp-reason"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => addGPMutation.mutate({
                              userId: selectedUserForGP.id,
                              amount: gpAmount,
                              reason: gpReason || '관리자 지급'
                            })}
                            disabled={addGPMutation.isPending || gpAmount <= 0}
                            className="bg-[#10B981] hover:bg-[#059669] text-white"
                            data-testid="button-add-gp"
                          >
                            {addGPMutation.isPending ? '처리 중...' : (
                              <>
                                <Plus className="h-4 w-4 mr-1" />
                                {gpAmount.toLocaleString()}GP 지급
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Signup Bonus */}
            <Card className="toss-card border-emerald-200 bg-emerald-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-[#10B981]" />
                    <p className="font-bold text-[#191F28]">신규 가입 혜택</p>
                  </div>
                  {editingSignupBonus === null && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingSignupBonus(signupBonus)}
                      className="text-[#10B981] hover:text-[#059669]"
                      data-testid="button-edit-signup-bonus"
                    >
                      수정
                    </Button>
                  )}
                </div>
                {editingSignupBonus !== null ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editingSignupBonus}
                        onChange={(e) => setEditingSignupBonus(parseInt(e.target.value) || 0)}
                        className="w-32 bg-white"
                        min={0}
                        data-testid="input-signup-bonus"
                      />
                      <span className="text-[#191F28] font-bold">GP</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateSignupBonusMutation.mutate(editingSignupBonus)}
                        disabled={updateSignupBonusMutation.isPending}
                        className="bg-[#10B981] hover:bg-[#059669] text-white"
                        data-testid="button-save-signup-bonus"
                      >
                        저장
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingSignupBonus(null)}
                        data-testid="button-cancel-signup-bonus"
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-[#10B981]">{signupBonus.toLocaleString()}GP</p>
                    <p className="text-sm text-[#8B95A1]">신규 가입 시 무료 제공</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Coupon Code Management */}
            <Card className="toss-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coins className="h-5 w-5 text-[#7C3AED]" />
                  쿠폰 코드 관리
                </CardTitle>
                <Button
                  onClick={() => setNewCoupon({ code: '', pointAmount: 500, maxUses: null, expiresAt: null })}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl"
                  data-testid="button-add-coupon"
                >
                  새 쿠폰 추가
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {newCoupon && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-4" data-testid="form-new-coupon">
                      <p className="font-bold text-[#191F28]">새 쿠폰 추가</p>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="text-sm text-[#8B95A1]">쿠폰 코드</label>
                          <Input
                            value={newCoupon.code}
                            onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                            placeholder="예: WELCOME2024"
                            className="mt-1"
                            data-testid="input-new-coupon-code"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-[#8B95A1]">GP</label>
                          <Input
                            type="number"
                            value={newCoupon.pointAmount}
                            onChange={(e) => setNewCoupon({ ...newCoupon, pointAmount: parseInt(e.target.value) || 0 })}
                            className="mt-1"
                            data-testid="input-new-coupon-points"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-[#8B95A1]">최대 사용 횟수 (빈칸=무제한)</label>
                          <Input
                            type="number"
                            value={newCoupon.maxUses ?? ''}
                            onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: e.target.value ? parseInt(e.target.value) : null })}
                            placeholder="무제한"
                            className="mt-1"
                            data-testid="input-new-coupon-max-uses"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-[#8B95A1]">만료일 (선택)</label>
                          <Input
                            type="date"
                            value={newCoupon.expiresAt ?? ''}
                            onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value || null })}
                            className="mt-1"
                            data-testid="input-new-coupon-expires"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => createCouponMutation.mutate(newCoupon)}
                          disabled={createCouponMutation.isPending || !newCoupon.code || newCoupon.pointAmount <= 0}
                          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                          data-testid="button-save-new-coupon"
                        >
                          {createCouponMutation.isPending ? '생성 중...' : '쿠폰 생성'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setNewCoupon(null)}
                          data-testid="button-cancel-new-coupon"
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  )}

                  {redemptionCodes.length === 0 ? (
                    <div className="p-8 text-center text-[#8B95A1]">
                      등록된 쿠폰이 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {redemptionCodes.map((coupon) => (
                        <div
                          key={coupon.id}
                          className={`p-4 rounded-xl border ${coupon.isActive === 1 ? 'bg-white border-[#E5E8EB]' : 'bg-gray-100 border-gray-200'}`}
                          data-testid={`card-coupon-${coupon.id}`}
                        >
                          {editingCoupon?.id === coupon.id ? (
                            <div className="space-y-4">
                              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                  <label className="text-sm text-[#8B95A1]">쿠폰 코드</label>
                                  <Input
                                    value={editingCoupon.code}
                                    onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                                    className="mt-1"
                                    data-testid={`input-edit-coupon-code-${coupon.id}`}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm text-[#8B95A1]">GP</label>
                                  <Input
                                    type="number"
                                    value={editingCoupon.pointAmount}
                                    onChange={(e) => setEditingCoupon({ ...editingCoupon, pointAmount: parseInt(e.target.value) || 0 })}
                                    className="mt-1"
                                    data-testid={`input-edit-coupon-points-${coupon.id}`}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm text-[#8B95A1]">최대 사용 횟수</label>
                                  <Input
                                    type="number"
                                    value={editingCoupon.maxUses ?? ''}
                                    onChange={(e) => setEditingCoupon({ ...editingCoupon, maxUses: e.target.value ? parseInt(e.target.value) : null })}
                                    placeholder="무제한"
                                    className="mt-1"
                                    data-testid={`input-edit-coupon-max-uses-${coupon.id}`}
                                  />
                                </div>
                                <div className="flex items-center gap-2 mt-6">
                                  <label className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={editingCoupon.isActive === 1}
                                      onChange={(e) => setEditingCoupon({ ...editingCoupon, isActive: e.target.checked ? 1 : 0 })}
                                      className="rounded"
                                      data-testid={`input-edit-coupon-active-${coupon.id}`}
                                    />
                                    활성화
                                  </label>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => updateCouponMutation.mutate({ id: coupon.id, data: editingCoupon })}
                                  disabled={updateCouponMutation.isPending}
                                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                                  data-testid={`button-save-edit-coupon-${coupon.id}`}
                                >
                                  {updateCouponMutation.isPending ? '저장 중...' : '저장'}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setEditingCoupon(null)}
                                  data-testid={`button-cancel-edit-coupon-${coupon.id}`}
                                >
                                  취소
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-[#191F28] font-mono">{coupon.code}</p>
                                  {coupon.isActive === 0 && (
                                    <Badge variant="outline" className="text-[#8B95A1]">비활성</Badge>
                                  )}
                                  {coupon.expiresAt && new Date(coupon.expiresAt) < new Date() && (
                                    <Badge variant="outline" className="text-red-500 border-red-200">만료됨</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-[#8B95A1]">
                                  <span className="text-[#10B981] font-bold">{coupon.pointAmount.toLocaleString()}GP</span>
                                  <span>사용: {coupon.currentUses}{coupon.maxUses ? `/${coupon.maxUses}` : ''}</span>
                                  {coupon.expiresAt && (
                                    <span>만료: {new Date(coupon.expiresAt).toLocaleDateString('ko-KR')}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingCoupon(coupon)}
                                  className="rounded-lg"
                                  data-testid={`button-edit-coupon-${coupon.id}`}
                                >
                                  수정
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm('이 쿠폰을 삭제하시겠습니까?')) {
                                      deleteCouponMutation.mutate(coupon.id);
                                    }
                                  }}
                                  className="rounded-lg text-red-500 border-red-200 hover:bg-red-50"
                                  data-testid={`button-delete-coupon-${coupon.id}`}
                                >
                                  삭제
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Users with GP List */}
            <Card className="toss-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#3182F6]" />
                  GP 보유 회원 목록
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-[#F2F4F6]">
                  {users
                    .filter(u => (u.giftPoints || 0) > 0)
                    .sort((a, b) => (b.giftPoints || 0) - (a.giftPoints || 0))
                    .slice(0, 20)
                    .map(u => (
                      <div key={u.id} className="p-4 flex items-center justify-between" data-testid={`gp-user-row-${u.id}`}>
                        <div>
                          <p className="font-bold text-[#191F28]">{u.displayName || u.email || 'Unknown'}</p>
                          <p className="text-sm text-[#8B95A1]">{u.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#10B981]">{(u.giftPoints || 0).toLocaleString()}GP</p>
                          <p className="text-sm text-[#8B95A1]">{u.credits.toLocaleString()}P</p>
                        </div>
                      </div>
                    ))}
                  {users.filter(u => (u.giftPoints || 0) > 0).length === 0 && (
                    <div className="p-8 text-center text-[#8B95A1]">
                      GP를 보유한 회원이 없습니다.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
