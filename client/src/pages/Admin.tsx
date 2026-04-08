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
  ChevronUp, ChevronDown, Gift, Plus, Minus, UserPlus, Trash2, Loader2, Download, Users2, X,
  Briefcase, GraduationCap, FileText, Target, Mic, ClipboardList, ChevronRight, Calendar, MapPin,
  Database
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
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

// Group types
interface GroupWithStats {
  id: string;
  name: string;
  description: string | null;
  iconEmoji: string | null;
  color: string | null;
  logoUrl: string | null;
  ownerId: string;
  isActive: number;
  memberCount: number;
  analysisCount: number;
  lastActivityAt: string | null;
  createdAt: string | null;
  allowedProfileTypes?: string[];
}

interface GroupMemberWithUser {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  joinedAt: string | null;
  user: {
    id: string;
    email: string | null;
    displayName: string | null;
    profileImageUrl: string | null;
  };
  analysisCount?: number;
  lastAnalyzedAt?: string | null;
}

interface GroupAnalysis {
  id: string;
  profileId: string;
  title: string | null;
  desiredJob: string | null;
  createdAt: string | null;
  aiResult: any;
  user: {
    id: string;
    email: string | null;
    displayName: string | null;
  };
}

// Group Management Tab Component
function GroupManagementTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState<GroupWithStats | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupEmoji, setNewGroupEmoji] = useState("👥");
  const [newGroupColor, setNewGroupColor] = useState("#3B82F6");
  const [newGroupLogoUrl, setNewGroupLogoUrl] = useState("");
  const [newGroupProfileTypes, setNewGroupProfileTypes] = useState<string[]>(['general', 'international_university', 'university', 'high', 'middle', 'elementary']);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<string>("member");
  
  const PROFILE_TYPE_OPTIONS = [
    { value: 'general', label: '구직자' },
    { value: 'international_university', label: '외국인유학생' },
    { value: 'university', label: '대학생' },
    { value: 'high', label: '고등학생' },
    { value: 'middle', label: '중학생' },
    { value: 'elementary', label: '초등학생' },
  ];
  const [viewMode, setViewMode] = useState<'groups' | 'members' | 'analyses' | 'settings'>('groups');
  const [editProfileTypes, setEditProfileTypes] = useState<string[]>([]);

  // Fetch all groups
  const { data: groups = [], isLoading: isLoadingGroups, refetch: refetchGroups } = useQuery<GroupWithStats[]>({
    queryKey: ['/api/admin/groups'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/groups');
      return res.json();
    },
  });

  // Fetch group members when a group is selected
  const { data: groupMembers = [], isLoading: isLoadingMembers, refetch: refetchMembers } = useQuery<GroupMemberWithUser[]>({
    queryKey: ['/api/admin/groups', selectedGroup?.id, 'members'],
    queryFn: async () => {
      if (!selectedGroup) return [];
      const res = await apiRequest('GET', `/api/admin/groups/${selectedGroup.id}/members`);
      return res.json();
    },
    enabled: !!selectedGroup,
  });

  // Fetch group analyses when viewing analyses
  const { data: groupAnalyses = [], isLoading: isLoadingAnalyses, refetch: refetchAnalyses } = useQuery<GroupAnalysis[]>({
    queryKey: ['/api/admin/groups', selectedGroup?.id, 'analyses'],
    queryFn: async () => {
      if (!selectedGroup) return [];
      const res = await apiRequest('GET', `/api/admin/groups/${selectedGroup.id}/analyses`);
      return res.json();
    },
    enabled: !!selectedGroup && viewMode === 'analyses',
  });

  // Create group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({ title: "오류", description: "그룹 이름을 입력하세요.", variant: "destructive" });
      return;
    }
    try {
      await apiRequest('POST', '/api/admin/groups', {
        name: newGroupName,
        description: newGroupDescription || null,
        iconEmoji: newGroupEmoji,
        color: newGroupColor,
        logoUrl: newGroupLogoUrl || null,
        allowedProfileTypes: newGroupProfileTypes,
      });
      toast({ title: "성공", description: "그룹이 생성되었습니다." });
      setShowCreateModal(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setNewGroupEmoji("👥");
      setNewGroupColor("#3B82F6");
      setNewGroupLogoUrl("");
      setNewGroupProfileTypes(['general', 'international_university', 'university', 'high', 'middle', 'elementary']);
      refetchGroups();
    } catch (error: any) {
      toast({ title: "오류", description: error.message || "그룹 생성에 실패했습니다.", variant: "destructive" });
    }
  };

  // Add member to group
  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !selectedGroup) {
      toast({ title: "오류", description: "이메일을 입력하세요.", variant: "destructive" });
      return;
    }
    try {
      await apiRequest('POST', `/api/admin/groups/${selectedGroup.id}/members`, {
        userEmail: newMemberEmail,
        role: newMemberRole,
      });
      toast({ title: "성공", description: "멤버가 추가되었습니다." });
      setShowMemberModal(false);
      setNewMemberEmail("");
      setNewMemberRole("member");
      refetchMembers();
      refetchGroups();
    } catch (error: any) {
      toast({ title: "오류", description: error.message || "멤버 추가에 실패했습니다.", variant: "destructive" });
    }
  };

  // Remove member from group
  const handleRemoveMember = async (memberId: string) => {
    if (!selectedGroup) return;
    try {
      await apiRequest('DELETE', `/api/admin/groups/${selectedGroup.id}/members/${memberId}`);
      toast({ title: "성공", description: "멤버가 제거되었습니다." });
      refetchMembers();
      refetchGroups();
    } catch (error: any) {
      toast({ title: "오류", description: error.message || "멤버 제거에 실패했습니다.", variant: "destructive" });
    }
  };

  // Update member role
  const handleUpdateMemberRole = async (memberId: string, role: string) => {
    if (!selectedGroup) return;
    try {
      await apiRequest('PATCH', `/api/admin/groups/${selectedGroup.id}/members/${memberId}/role`, { role });
      toast({ title: "성공", description: "역할이 변경되었습니다." });
      refetchMembers();
    } catch (error: any) {
      toast({ title: "오류", description: error.message || "역할 변경에 실패했습니다.", variant: "destructive" });
    }
  };

  // Delete group
  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("정말 이 그룹을 삭제하시겠습니까?")) return;
    try {
      await apiRequest('DELETE', `/api/admin/groups/${groupId}`);
      toast({ title: "성공", description: "그룹이 삭제되었습니다." });
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
        setViewMode('groups');
      }
      refetchGroups();
    } catch (error: any) {
      toast({ title: "오류", description: error.message || "그룹 삭제에 실패했습니다.", variant: "destructive" });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-500 text-white"><Shield className="h-3 w-3 mr-1" />그룹관리자</Badge>;
      case 'consultant':
        return <Badge className="bg-blue-500 text-white"><Briefcase className="h-3 w-3 mr-1" />컨설턴트</Badge>;
      case 'teacher':
        return <Badge className="bg-green-500 text-white"><GraduationCap className="h-3 w-3 mr-1" />선생님</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white"><User className="h-3 w-3 mr-1" />멤버</Badge>;
    }
  };

  // Group list view
  if (viewMode === 'groups' || !selectedGroup) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">그룹 목록</h3>
          <Button onClick={() => setShowCreateModal(true)} className="bg-[#3182F6]" data-testid="button-create-group">
            <Plus className="h-4 w-4 mr-2" />
            새 그룹 만들기
          </Button>
        </div>

        {isLoadingGroups ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-[#8B95A1]">
              <Users2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>아직 생성된 그룹이 없습니다.</p>
              <p className="text-sm mt-2">새 그룹을 만들어 회원들을 관리해 보세요.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map(group => (
              <Card 
                key={group.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => { setSelectedGroup(group); setViewMode('members'); }}
                data-testid={`card-group-${group.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{group.iconEmoji || '👥'}</span>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                      data-testid={`button-delete-group-${group.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {group.description && (
                    <p className="text-sm text-[#8B95A1] mb-3 line-clamp-2">{group.description}</p>
                  )}
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-[#8B95A1]" />
                      <span>{group.memberCount}명</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4 text-[#8B95A1]" />
                      <span>분석 {group.analysisCount}건</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Group Modal */}
        <AlertDialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>새 그룹 만들기</AlertDialogTitle>
              <AlertDialogDescription>
                그룹을 만들어 회원들을 관리하고 분석 결과를 확인하세요.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">그룹 이름 *</label>
                <Input 
                  value={newGroupName} 
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="예: 2025년 신입사원반"
                  className="mt-1"
                  data-testid="input-group-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">설명</label>
                <Input 
                  value={newGroupDescription} 
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="그룹 설명을 입력하세요"
                  className="mt-1"
                  data-testid="input-group-description"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">아이콘</label>
                  <Input 
                    value={newGroupEmoji} 
                    onChange={(e) => setNewGroupEmoji(e.target.value)}
                    placeholder="👥"
                    className="mt-1 text-center text-2xl"
                    maxLength={2}
                    data-testid="input-group-emoji"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">색상</label>
                  <Input 
                    type="color"
                    value={newGroupColor} 
                    onChange={(e) => setNewGroupColor(e.target.value)}
                    className="mt-1 h-10 p-1"
                    data-testid="input-group-color"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">로고 URL</label>
                <Input 
                  value={newGroupLogoUrl} 
                  onChange={(e) => setNewGroupLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="mt-1"
                  data-testid="input-group-logo-url"
                />
                <p className="text-xs text-muted-foreground mt-1">학교/기관 로고 이미지 URL을 입력하세요</p>
              </div>
              <div>
                <label className="text-sm font-medium">표시할 프로필 유형 *</label>
                <p className="text-xs text-muted-foreground mb-2">그룹 대시보드에 표시할 프로필 유형을 선택하세요</p>
                <div className="grid grid-cols-2 gap-2">
                  {PROFILE_TYPE_OPTIONS.map((option) => (
                    <label 
                      key={option.value} 
                      className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-gray-50 ${
                        newGroupProfileTypes.includes(option.value) ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={newGroupProfileTypes.includes(option.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewGroupProfileTypes([...newGroupProfileTypes, option.value]);
                          } else {
                            setNewGroupProfileTypes(newGroupProfileTypes.filter(t => t !== option.value));
                          }
                        }}
                        className="rounded"
                        data-testid={`checkbox-profile-${option.value}`}
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleCreateGroup} className="bg-[#3182F6]">
                그룹 만들기
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Group detail view (members or analyses)
  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => { setSelectedGroup(null); setViewMode('groups'); }}
          data-testid="button-back-to-groups"
        >
          ← 그룹 목록
        </Button>
        <div className="flex items-center gap-3">
          {selectedGroup.logoUrl ? (
            <img 
              src={selectedGroup.logoUrl} 
              alt={selectedGroup.name} 
              className="h-10 w-10 object-contain rounded"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <span className="text-2xl">{selectedGroup.iconEmoji || '👥'}</span>
          )}
          <h3 className="text-lg font-semibold">{selectedGroup.name}</h3>
        </div>
      </div>

      {/* Sub-tabs for members and analyses */}
      <div className="flex gap-2 border-b pb-2">
        <Button 
          variant={viewMode === 'members' ? 'default' : 'ghost'}
          onClick={() => setViewMode('members')}
          className={viewMode === 'members' ? 'bg-[#3182F6]' : ''}
          data-testid="button-view-members"
        >
          <Users className="h-4 w-4 mr-2" />
          멤버 ({selectedGroup.memberCount})
        </Button>
        <Button 
          variant={viewMode === 'analyses' ? 'default' : 'ghost'}
          onClick={() => setViewMode('analyses')}
          className={viewMode === 'analyses' ? 'bg-[#3182F6]' : ''}
          data-testid="button-view-analyses"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          분석 결과 ({selectedGroup.analysisCount})
        </Button>
        <Button 
          variant={viewMode === 'settings' ? 'default' : 'ghost'}
          onClick={() => {
            setViewMode('settings');
            setEditProfileTypes(selectedGroup.allowedProfileTypes || ['general', 'international_university', 'university', 'high', 'middle', 'elementary']);
          }}
          className={viewMode === 'settings' ? 'bg-[#3182F6]' : ''}
          data-testid="button-view-settings"
        >
          <Settings className="h-4 w-4 mr-2" />
          설정
        </Button>
      </div>

      {/* Members view */}
      {viewMode === 'members' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowMemberModal(true)} className="bg-[#3182F6]" data-testid="button-add-member">
              <UserPlus className="h-4 w-4 mr-2" />
              멤버 추가
            </Button>
          </div>

          {isLoadingMembers ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : groupMembers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-[#8B95A1]">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>아직 멤버가 없습니다.</p>
                <p className="text-sm mt-2">이메일로 멤버를 초대하세요.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {groupMembers.map(member => (
                <Card key={member.id} data-testid={`card-member-${member.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#F2F4F6] flex items-center justify-center">
                          {member.user.profileImageUrl ? (
                            <img src={member.user.profileImageUrl} alt="" className="w-10 h-10 rounded-full" />
                          ) : (
                            <User className="h-5 w-5 text-[#8B95A1]" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{member.user.displayName || member.user.email || '이름 없음'}</div>
                          <div className="text-sm text-[#8B95A1]">{member.user.email}</div>
                        </div>
                        {getRoleBadge(member.role)}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-[#8B95A1]">
                          분석 {member.analysisCount || 0}건
                        </div>
                        {member.role !== 'owner' && (
                          <div className="flex items-center gap-2">
                            <Select 
                              value={member.role} 
                              onValueChange={(role) => handleUpdateMemberRole(member.userId, role)}
                            >
                              <SelectTrigger className="w-24 h-8" data-testid={`select-role-${member.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">멤버</SelectItem>
                                <SelectItem value="teacher">선생님</SelectItem>
                                <SelectItem value="consultant">컨설턴트</SelectItem>
                                <SelectItem value="admin">그룹관리자</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleRemoveMember(member.userId)}
                              data-testid={`button-remove-member-${member.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Add Member Modal */}
          <AlertDialog open={showMemberModal} onOpenChange={setShowMemberModal}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>멤버 추가</AlertDialogTitle>
                <AlertDialogDescription>
                  이메일 주소로 기존 회원을 그룹에 추가합니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">이메일 주소 *</label>
                  <Input 
                    value={newMemberEmail} 
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="member@example.com"
                    className="mt-1"
                    data-testid="input-member-email"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">역할</label>
                  <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                    <SelectTrigger className="mt-1" data-testid="select-member-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">멤버</SelectItem>
                      <SelectItem value="teacher">선생님</SelectItem>
                      <SelectItem value="consultant">컨설턴트</SelectItem>
                      <SelectItem value="admin">그룹관리자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleAddMember} className="bg-[#3182F6]">
                  멤버 추가
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Analyses view */}
      {viewMode === 'analyses' && (
        <div className="space-y-4">
          {isLoadingAnalyses ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : groupAnalyses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-[#8B95A1]">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>아직 분석 결과가 없습니다.</p>
                <p className="text-sm mt-2">멤버들이 진로 분석을 진행하면 여기에 표시됩니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {groupAnalyses.map(analysis => (
                <Card key={analysis.id} data-testid={`card-analysis-${analysis.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{analysis.user.displayName || analysis.user.email || '이름 없음'}</div>
                        <div className="text-sm text-[#8B95A1]">{analysis.user.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-[#3182F6]">{analysis.desiredJob || analysis.title || '직업 미정'}</div>
                        <div className="text-sm text-[#8B95A1]">
                          {analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString('ko-KR') : '날짜 없음'}
                        </div>
                      </div>
                    </div>
                    {analysis.aiResult?.summary && (
                      <p className="mt-3 text-sm text-[#4E5968] line-clamp-2">{analysis.aiResult.summary}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings view */}
      {viewMode === 'settings' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                그룹 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-[#4E5968] block mb-3">
                  표시할 프로필 유형 *
                </label>
                <p className="text-sm text-[#8B95A1] mb-4">
                  그룹 대시보드에 표시할 프로필 유형을 선택하세요.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {PROFILE_TYPE_OPTIONS.map(option => (
                    <label 
                      key={option.value}
                      className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        editProfileTypes.includes(option.value) 
                          ? 'border-[#3182F6] bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={editProfileTypes.includes(option.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditProfileTypes([...editProfileTypes, option.value]);
                          } else {
                            setEditProfileTypes(editProfileTypes.filter(t => t !== option.value));
                          }
                        }}
                        className="w-4 h-4 text-[#3182F6] rounded"
                        data-testid={`checkbox-profile-${option.value}`}
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={async () => {
                    if (editProfileTypes.length === 0) {
                      toast({ title: "오류", description: "최소 하나의 프로필 유형을 선택하세요.", variant: "destructive" });
                      return;
                    }
                    try {
                      await apiRequest('PUT', `/api/admin/groups/${selectedGroup.id}`, {
                        allowedProfileTypes: editProfileTypes,
                      });
                      toast({ title: "성공", description: "그룹 설정이 저장되었습니다." });
                      refetchGroups();
                    } catch (error: any) {
                      toast({ title: "오류", description: error.message || "설정 저장에 실패했습니다.", variant: "destructive" });
                    }
                  }}
                  className="bg-[#3182F6]"
                  data-testid="button-save-settings"
                >
                  설정 저장
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

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
  const [gpExpiresAt, setGpExpiresAt] = useState<string>("");
  const [editingInviterGp, setEditingInviterGp] = useState<number | null>(null);
  const [editingInviteeGp, setEditingInviteeGp] = useState<number | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "user" as "user" | "staff" | "admin",
    credits: 100,
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<string>("overview");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const toggleExpanded = (id: string) => setExpandedItems(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const { user: currentUser, isLoading: userLoading, getAccessToken } = useAuth();

  const isAdmin = currentUser?.role === 'admin';
  const isStaff = currentUser?.role === 'staff';
  const isStaffOrAdmin = isAdmin || isStaff;

  // Fetch user's managed groups (where user is admin/consultant/teacher)
  const { data: managedGroups = [] } = useQuery<Array<{ id: string; name: string; iconEmoji: string | null; color: string | null; role: string }>>({
    queryKey: ['/api/my-managed-groups'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/my-managed-groups');
      return res.json();
    },
    enabled: !!currentUser && !isStaffOrAdmin,
  });

  // Check if user is a group manager (has managed groups)
  const isGroupManager = managedGroups.length > 0;
  const hasAdminAccess = isStaffOrAdmin || isGroupManager;

  // Fetch managed group member IDs for filtering
  const [managedGroupMemberIds, setManagedGroupMemberIds] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const fetchManagedMembers = async () => {
      if (!isGroupManager || isStaffOrAdmin) return;
      
      const allMemberIds = new Set<string>();
      for (const group of managedGroups) {
        try {
          const res = await apiRequest('GET', `/api/admin/groups/${group.id}/members`);
          const members = await res.json();
          members.forEach((m: any) => allMemberIds.add(m.userId));
        } catch (error) {
          console.error('Failed to fetch group members:', error);
        }
      }
      setManagedGroupMemberIds(allMemberIds);
    };
    
    fetchManagedMembers();
  }, [managedGroups, isGroupManager, isStaffOrAdmin]);

  const { data: users = [], isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
    enabled: hasAdminAccess,
    retry: false,
  });

  const { data: userDetail, isLoading: userDetailLoading, error: userDetailError } = useQuery({
    queryKey: ['/api/admin/users', selectedUserForDetail, 'detail'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/admin/users/${selectedUserForDetail}/detail`);
      if (!res.ok) throw new Error('Failed to fetch user detail');
      return res.json();
    },
    enabled: !!selectedUserForDetail,
    retry: false,
  });

  // Filter users based on group membership for group managers
  const filteredUsers = useMemo(() => {
    if (isStaffOrAdmin) return users;
    if (!isGroupManager) return [];
    return users.filter(user => managedGroupMemberIds.has(user.id));
  }, [users, isStaffOrAdmin, isGroupManager, managedGroupMemberIds]);

  // Fetch all groups for assignment
  const { data: allGroups = [] } = useQuery<Array<{ id: string; name: string; iconEmoji: string | null; color: string | null }>>({
    queryKey: ['/api/admin/groups'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/groups');
      return res.json();
    },
    enabled: isStaffOrAdmin,
  });

  // State for user group management
  const [editingUserGroups, setEditingUserGroups] = useState<string | null>(null);
  const [loadingGroupActions, setLoadingGroupActions] = useState<Set<string>>(new Set());

  // Preload all users' groups when visiting admin page
  const { data: userGroupsCache = {}, refetch: refetchAllUserGroups } = useQuery<Record<string, Array<{ id: string; name: string; iconEmoji: string | null; color: string | null; role: string }>>>({
    queryKey: ['/api/admin/users/groups/all'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/users/groups/all');
      return res.json();
    },
    enabled: isStaffOrAdmin,
    staleTime: 30000,
  });

  const handleAddToGroup = async (userId: string, groupId: string) => {
    const actionKey = `add-${userId}-${groupId}`;
    setLoadingGroupActions(prev => new Set(prev).add(actionKey));
    try {
      await apiRequest('POST', `/api/admin/users/${userId}/groups/${groupId}`, { role: 'member' });
      await refetchAllUserGroups();
      toast({ title: "그룹 추가 완료", description: "사용자가 그룹에 추가되었습니다." });
    } catch (error) {
      toast({ title: "오류", description: "그룹 추가에 실패했습니다.", variant: "destructive" });
    } finally {
      setLoadingGroupActions(prev => {
        const next = new Set(prev);
        next.delete(actionKey);
        return next;
      });
    }
  };

  const handleRemoveFromGroup = async (userId: string, groupId: string) => {
    const actionKey = `remove-${userId}-${groupId}`;
    setLoadingGroupActions(prev => new Set(prev).add(actionKey));
    try {
      await apiRequest('DELETE', `/api/admin/users/${userId}/groups/${groupId}`);
      await refetchAllUserGroups();
      toast({ title: "그룹 제거 완료", description: "사용자가 그룹에서 제거되었습니다." });
    } catch (error) {
      toast({ title: "오류", description: "그룹 제거에 실패했습니다.", variant: "destructive" });
    } finally {
      setLoadingGroupActions(prev => {
        const next = new Set(prev);
        next.delete(actionKey);
        return next;
      });
    }
  };

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

  interface ReferralStats {
    totalReferrals: number;
    totalGpAwarded: number;
    topInviters: Array<{ userId: string; displayName: string | null; email: string | null; referralCount: number; totalGpEarned: number }>;
    currentSettings: { inviterGp: number; inviteeGp: number };
  }

  const { data: referralStats, refetch: refetchReferralStats } = useQuery<ReferralStats>({
    queryKey: ['/api/admin/referrals/stats'],
    enabled: isStaffOrAdmin,
    retry: false,
  });

  const downloadTrafficCSV = () => {
    if (!trafficStats?.dailyData || trafficStats.dailyData.length === 0) {
      toast({ title: "다운로드 실패", description: "다운로드할 데이터가 없습니다.", variant: "destructive" });
      return;
    }
    
    const headers = ['날짜', '페이지뷰', '순 방문자'];
    const rows = trafficStats.dailyData.map(row => [
      new Date(row.date).toLocaleDateString('ko-KR'),
      row.pageViews.toString(),
      row.uniqueVisitors.toString()
    ]);
    
    const summaryRows = [
      [],
      ['=== 요약 ==='],
      ['기간', '페이지뷰', '순 방문자'],
      ['오늘', trafficStats.today.pageViews.toString(), trafficStats.today.uniqueVisitors.toString()],
      ['어제', trafficStats.yesterday.pageViews.toString(), trafficStats.yesterday.uniqueVisitors.toString()],
      ['최근 7일', trafficStats.last7Days.pageViews.toString(), trafficStats.last7Days.uniqueVisitors.toString()],
      ['최근 30일', trafficStats.last30Days.pageViews.toString(), trafficStats.last30Days.uniqueVisitors.toString()],
    ];
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      ...summaryRows.map(row => row.join(','))
    ].join('\n');
    
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `konnect_traffic_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({ title: "다운로드 완료", description: "트래픽 데이터가 CSV 파일로 저장되었습니다." });
  };

  // Merge database pricing with defaults for display
  const servicePricing = Object.entries(DEFAULT_SERVICE_PRICING).map(([id, defaults]) => {
    const dbPricing = servicePricingData.find(p => p.id === id);
    return dbPricing || { id, ...defaults, isActive: 1, updatedAt: null, updatedBy: null };
  });

  const signupBonus = parseInt(systemSettings.signup_bonus?.value || '1000', 10);
  const gpExpirationDays = parseInt(systemSettings.gp_default_expiration_days?.value || '90', 10);
  const [editingGpExpirationDays, setEditingGpExpirationDays] = useState<number | null>(null);

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
        description: '신규 가입 시 지급되는 학습권' 
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

  const updateGpExpirationMutation = useMutation({
    mutationFn: async (days: number) => {
      const res = await apiRequest('PATCH', '/api/admin/system-settings/gp_default_expiration_days', { 
        value: days.toString(), 
        description: '선물 학습권 기본 만료 기간 (일)' 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system-settings'] });
      setEditingGpExpirationDays(null);
      toast({ title: "업데이트 완료", description: "선물 학습권 기본 만료 기간이 변경되었습니다." });
    },
    onError: () => {
      toast({ title: "오류", description: "만료 기간 업데이트에 실패했습니다.", variant: "destructive" });
    },
  });

  const updateReferralSettingsMutation = useMutation({
    mutationFn: async (data: { inviterGp: number; inviteeGp: number }) => {
      const res = await apiRequest('PUT', '/api/admin/referrals/settings', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/referrals/stats'] });
      setEditingInviterGp(null);
      setEditingInviteeGp(null);
      toast({ title: "업데이트 완료", description: "추천 보상이 설정되었습니다." });
    },
    onError: () => {
      toast({ title: "오류", description: "추천 보상 설정에 실패했습니다.", variant: "destructive" });
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
    mutationFn: async ({ userId, amount, reason, expiresAt }: { userId: string; amount: number; reason: string; expiresAt?: string }) => {
      const res = await apiRequest('POST', '/api/admin/gift-points/add', { 
        userId, 
        amount, 
        description: reason,
        expiresAt: expiresAt || undefined 
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || '선물 학습권 지급에 실패했습니다.');
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gift-points/stats'] });
      setSelectedUserForGP(null);
      setGpAmount(100);
      setGpReason("");
      setGpExpiresAt("");
      toast({ 
        title: "선물 학습권 지급 완료", 
        description: `${variables.amount.toLocaleString()}번이 지급되었습니다. 새 선물 학습권 잔액: ${data.newGiftPoints.toLocaleString()}번` 
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
      <>
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
      </>
    );
  }

  if (!isStaffOrAdmin) {
    return (
      <>
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
      </>
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
      toast({ title: "학습권 변경 완료", description: "사용자 학습권이 변경되었습니다." });
    },
    onError: () => {
      toast({ title: "오류", description: "학습권 변경에 실패했습니다.", variant: "destructive" });
    },
  });

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
        toast({ title: "회원 삭제 완료", description: `${userToDelete.displayName || userToDelete.email || '사용자'}님이 삭제되었습니다.` });
        setUserToDelete(null);
      } else {
        const data = await response.json();
        toast({ title: "삭제 실패", description: data.message || "회원을 삭제하는 중 오류가 발생했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "삭제 실패", description: "회원을 삭제하는 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRegisterUser = async () => {
    if (!newUserData.email.trim()) {
      toast({ title: "오류", description: "이메일을 입력해주세요.", variant: "destructive" });
      return;
    }
    
    setIsRegistering(true);
    try {
      const res = await apiRequest('POST', '/api/admin/users', newUserData);
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
        toast({ title: "회원 등록 완료", description: `${newUserData.email}님이 등록되었습니다.` });
        setShowRegisterDialog(false);
        setNewUserData({ email: "", firstName: "", lastName: "", role: "user", credits: 100 });
      } else {
        const data = await res.json();
        toast({ title: "등록 실패", description: data.message || "회원을 등록하는 중 오류가 발생했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "등록 실패", description: "회원을 등록하는 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setIsRegistering(false);
    }
  };

  const createPackageMutation = useMutation({
    mutationFn: async (pkg: Partial<PointPackage>) => {
      const res = await apiRequest('POST', '/api/admin/packages', pkg);
      if (!res.ok) throw new Error('Failed to create package');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/packages'] });
      setNewPackage(null);
      toast({ title: "패키지 생성 완료", description: "새 학습권 패키지가 생성되었습니다." });
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
      toast({ title: "패키지 수정 완료", description: "학습권 패키지가 수정되었습니다." });
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
      toast({ title: "패키지 비활성화", description: "학습권 패키지가 비활성화되었습니다." });
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

  const [isSyncingAptitude, setIsSyncingAptitude] = useState(false);
  const [aptitudeSyncResult, setAptitudeSyncResult] = useState<{
    matched: number; updated: number; skipped: number; errors: number;
  } | null>(null);

  const handleSyncAptitude = async () => {
    setIsSyncingAptitude(true);
    setAptitudeSyncResult(null);
    try {
      const res = await apiRequest('POST', '/api/admin/sync-aptitude', {});
      const data = await res.json();
      setAptitudeSyncResult({ matched: data.matched, updated: data.updated, skipped: data.skipped, errors: data.errors });
      toast({ title: "적성 데이터 동기화 완료", description: `매칭: ${data.matched}개, 업데이트: ${data.updated}개, 건너뜀: ${data.skipped}개, 오류: ${data.errors}개` });
    } catch (err: any) {
      toast({ title: "동기화 오류", description: err.message, variant: "destructive" });
    } finally {
      setIsSyncingAptitude(false);
    }
  };

  const searchFilteredUsers = filteredUsers.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-[#FF5B5B]/10 text-[#FF5B5B] border-0 text-[11px] font-bold px-2 py-0.5 rounded-lg"><Crown className="h-3 w-3 mr-1" />관리자</Badge>;
      case 'staff':
        return <Badge className="bg-[#7C3AED]/10 text-[#7C3AED] border-0 text-[11px] font-bold px-2 py-0.5 rounded-lg"><Shield className="h-3 w-3 mr-1" />스태프</Badge>;
      default:
        return <Badge className="bg-[#E5E8EB] text-[#8B95A1] border-0 text-[11px] font-medium px-2 py-0.5 rounded-lg"><User className="h-3 w-3 mr-1" />일반</Badge>;
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
    <>
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
              학습권 시스템
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
              선물 학습권
            </TabsTrigger>
            <TabsTrigger value="groups" className="rounded-lg px-4" data-testid="tab-groups">
              <Users2 className="h-4 w-4 mr-2" />
              그룹 관리
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8B95A1]" />
                <Input
                  placeholder="이메일 또는 이름으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 bg-white border border-[#E5E8EB] rounded-2xl h-12 text-[#191F28] placeholder:text-[#C4C9D0] focus:border-[#3182F6] focus:ring-2 focus:ring-[#3182F6]/10 transition-all"
                  data-testid="input-search-users"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-[#F2F4F6] rounded-2xl px-4 py-2.5">
                  <Users className="h-4 w-4 text-[#3182F6]" />
                  <span className="text-sm font-bold text-[#191F28]">{users.length}</span>
                  <span className="text-xs text-[#8B95A1]">명</span>
                </div>
                {isStaffOrAdmin && (
                  <Button
                    onClick={() => setShowRegisterDialog(true)}
                    className="bg-[#3182F6] hover:bg-[#1B64DA] text-white rounded-2xl h-11 px-5 shadow-sm shadow-blue-500/20 transition-all hover:shadow-md hover:shadow-blue-500/25"
                    data-testid="button-register-user"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    회원 등록
                  </Button>
                )}
              </div>
            </div>

            {usersLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-[#F2F4F6]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-[#F2F4F6] rounded-lg" />
                        <div className="h-3 w-48 bg-[#F2F4F6] rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchFilteredUsers.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
                <Users className="h-12 w-12 mx-auto mb-3 text-[#C4C9D0]" />
                <p className="text-[#8B95A1] font-medium">사용자가 없습니다.</p>
                <p className="text-sm text-[#C4C9D0] mt-1">검색어를 변경해보세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchFilteredUsers.map((user) => (
                  <div key={user.id} className="bg-white rounded-2xl shadow-sm border border-[#F2F4F6] hover:border-[#3182F6]/20 hover:shadow-md transition-all duration-200" data-testid={`row-user-${user.id}`}>
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="shrink-0">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#3182F6] to-[#1B64DA] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-[#191F28] text-base truncate">
                              {user.displayName || user.email || 'Unknown'}
                            </h3>
                            {getRoleBadge(user.role)}
                            {userGroupsCache[user.id]?.slice(0, 2).map((group) => (
                              <Badge
                                key={group.id}
                                className="text-[10px] px-1.5 py-0 h-5 border-0 font-medium"
                                style={{ backgroundColor: (group.color || '#E5E8EB') + '20', color: group.color || '#8B95A1' }}
                              >
                                {group.iconEmoji || '📁'} {group.name}
                              </Badge>
                            ))}
                            {(userGroupsCache[user.id]?.length || 0) > 2 && (
                              <span className="text-[10px] text-[#8B95A1]">+{(userGroupsCache[user.id]?.length || 0) - 2}</span>
                            )}
                          </div>
                          <p className="text-sm text-[#8B95A1] truncate">{user.email}</p>
                          <p className="text-xs text-[#C4C9D0] mt-0.5">
                            가입일 {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            {isStaffOrAdmin && editingCredits?.userId === user.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={editingCredits.credits}
                                  onChange={(e) => setEditingCredits({ userId: user.id, credits: parseInt(e.target.value) || 0 })}
                                  className="w-24 h-9 text-right rounded-xl border-[#E5E8EB] focus:border-[#3182F6]"
                                  data-testid={`input-credits-${user.id}`}
                                />
                                <Button 
                                  size="sm"
                                  className="h-9 rounded-xl bg-[#3182F6] hover:bg-[#1B64DA] text-white px-3"
                                  onClick={() => updateCreditsMutation.mutate({ userId: user.id, credits: editingCredits.credits })}
                                  data-testid={`button-save-credits-${user.id}`}
                                >
                                  저장
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="h-9 rounded-xl text-[#8B95A1] hover:bg-[#F2F4F6]"
                                  onClick={() => setEditingCredits(null)}
                                >
                                  취소
                                </Button>
                              </div>
                            ) : (
                              <div 
                                className={`flex items-center gap-1.5 bg-[#3182F6]/5 rounded-xl px-3 py-2 ${isStaffOrAdmin ? 'cursor-pointer hover:bg-[#3182F6]/10 transition-colors' : ''}`}
                                onClick={() => isStaffOrAdmin && setEditingCredits({ userId: user.id, credits: user.credits })}
                                data-testid={`text-credits-${user.id}`}
                              >
                                <Coins className="h-3.5 w-3.5 text-[#3182F6]" />
                                <span className="font-bold text-[#3182F6] text-sm">{user.credits.toLocaleString()}</span>
                                <span className="text-xs text-[#3182F6]/60">P</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F2F4F6]">
                        <div className="flex items-center gap-2 flex-wrap">
                          {(isAdmin || isStaff) && (
                            <Select
                              value={user.role}
                              onValueChange={(role) => updateRoleMutation.mutate({ userId: user.id, role })}
                              disabled={!isAdmin && user.role === 'admin'}
                            >
                              <SelectTrigger className="w-[110px] h-9 rounded-xl border-[#E5E8EB] text-sm" data-testid={`select-role-${user.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">일반</SelectItem>
                                <SelectItem value="staff">스태프</SelectItem>
                                {isAdmin && <SelectItem value="admin">관리자</SelectItem>}
                              </SelectContent>
                            </Select>
                          )}
                          {isStaffOrAdmin && (
                            <Popover 
                              open={editingUserGroups === user.id} 
                              onOpenChange={(open) => setEditingUserGroups(open ? user.id : null)}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-9 px-3 gap-1.5 rounded-xl border-[#E5E8EB] text-[#4E5968] hover:bg-[#F2F4F6] hover:border-[#3182F6]/30 transition-colors"
                                  data-testid={`button-user-groups-${user.id}`}
                                >
                                  <Users2 className="h-3.5 w-3.5" />
                                  <span className="text-xs font-medium">
                                    {userGroupsCache[user.id]?.length 
                                      ? `그룹 ${userGroupsCache[user.id].length}` 
                                      : "그룹"}
                                  </span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72 p-4 rounded-2xl shadow-lg border-[#E5E8EB]" align="end">
                                <div className="space-y-3">
                                  <div className="font-bold text-sm text-[#191F28]">그룹 관리</div>
                                  
                                  <div className="space-y-2">
                                    <p className="text-xs font-medium text-[#8B95A1]">소속 그룹</p>
                                    {userGroupsCache[user.id]?.length ? (
                                      <div className="flex flex-wrap gap-1.5">
                                        {userGroupsCache[user.id].map((group) => (
                                          <Badge
                                            key={group.id}
                                            className="pl-2 pr-1 py-0.5 flex items-center gap-1 text-xs rounded-lg"
                                            style={{ backgroundColor: group.color || '#E5E8EB', color: '#191F28' }}
                                          >
                                            {group.iconEmoji || '📁'} {group.name}
                                            <button
                                              onClick={() => handleRemoveFromGroup(user.id, group.id)}
                                              className="ml-1 hover:bg-black/10 rounded p-0.5"
                                              disabled={loadingGroupActions.has(`remove-${user.id}-${group.id}`)}
                                            >
                                              {loadingGroupActions.has(`remove-${user.id}-${group.id}`) ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                              ) : (
                                                <X className="h-3 w-3" />
                                              )}
                                            </button>
                                          </Badge>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-[#C4C9D0]">소속된 그룹이 없습니다</p>
                                    )}
                                  </div>
                                  
                                  {allGroups.filter(g => !userGroupsCache[user.id]?.some(ug => ug.id === g.id)).length > 0 && (
                                    <div className="space-y-2 border-t border-[#F2F4F6] pt-3">
                                      <p className="text-xs font-medium text-[#8B95A1]">그룹 추가</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {allGroups
                                          .filter(g => !userGroupsCache[user.id]?.some(ug => ug.id === g.id))
                                          .map((group) => {
                                            const isLoading = loadingGroupActions.has(`add-${user.id}-${group.id}`);
                                            return (
                                              <Badge
                                                key={group.id}
                                                className={`cursor-pointer hover:opacity-80 text-xs flex items-center gap-1 rounded-lg transition-opacity ${isLoading ? 'opacity-70' : ''}`}
                                                style={{ backgroundColor: group.color || '#E5E8EB', color: '#191F28' }}
                                                onClick={() => !isLoading && handleAddToGroup(user.id, group.id)}
                                              >
                                                {isLoading ? (
                                                  <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                  '+'
                                                )}
                                                {group.iconEmoji || '📁'} {group.name}
                                              </Badge>
                                            );
                                          })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                          {isAdmin && user.id !== currentUser?.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 p-0 rounded-xl text-[#C4C9D0] hover:text-red-500 hover:bg-red-50 transition-colors"
                              onClick={() => setUserToDelete(user)}
                              data-testid={`button-delete-user-${user.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 px-4 rounded-xl text-[#3182F6] hover:bg-[#3182F6]/5 font-medium text-sm gap-1.5 transition-colors"
                          onClick={() => { setSelectedUserForDetail(user.id); setDetailTab("overview"); }}
                          data-testid={`btn-user-detail-${user.id}`}
                        >
                          자세히 보기
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  <p className="text-xs text-[#8B95A1]">평균 학습권</p>
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

            {/* Aptitude Data Sync Card */}
            {isAdmin && (
              <Card className="toss-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5 text-[#3182F6]" />
                    적성 데이터 동기화
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#8B95A1] mb-4">
                    커리어넷 MAJOR_VIEW API에서 학과별 적성 데이터(lstMiddleAptd, lstHighAptd)를 수집합니다. 이미 데이터가 있는 학과는 건너뜁니다.
                  </p>
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handleSyncAptitude}
                      disabled={isSyncingAptitude}
                      className="bg-[#3182F6] hover:bg-[#1B64DA] text-white rounded-xl"
                      data-testid="button-sync-aptitude"
                    >
                      {isSyncingAptitude ? "동기화 중..." : "적성 데이터 동기화"}
                    </Button>
                    {aptitudeSyncResult && (
                      <div className="flex gap-4 text-sm" data-testid="aptitude-sync-result">
                        <span className="text-[#191F28]">매칭: <strong>{aptitudeSyncResult.matched}</strong>개</span>
                        <span className="text-green-600">업데이트: <strong>{aptitudeSyncResult.updated}</strong>개</span>
                        <span className="text-amber-600">건너뜀: <strong>{aptitudeSyncResult.skipped}</strong>개</span>
                        <span className="text-red-600">오류: <strong>{aptitudeSyncResult.errors}</strong>개</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tokens" className="space-y-6">
            <Card className="toss-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coins className="h-5 w-5 text-[#3182F6]" />
                  학습권 가격 정책
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
                              <span className="text-[#191F28] font-bold">학습권</span>
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
                              {pricing.pointCost.toLocaleString()} 학습권
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
                <CardTitle className="text-lg">학습권 통계</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#F2F4F6] rounded-xl text-center">
                    <p className="text-sm text-[#8B95A1]">전체 발행 학습권</p>
                    <p className="text-2xl font-bold text-[#191F28]">
                      {users.reduce((sum, u) => sum + u.credits, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-[#F2F4F6] rounded-xl text-center">
                    <p className="text-sm text-[#8B95A1]">평균 보유 학습권</p>
                    <p className="text-2xl font-bold text-[#191F28]">
                      {users.length > 0 ? Math.round(users.reduce((sum, u) => sum + u.credits, 0) / users.length).toLocaleString() : 0}
                    </p>
                  </div>
                  <div className="p-4 bg-[#F2F4F6] rounded-xl text-center">
                    <p className="text-sm text-[#8B95A1]">소진된 학습권 (추정)</p>
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
                            <label className="text-sm text-[#8B95A1]">학습권</label>
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
                            <label className="text-sm text-[#8B95A1]">보너스 학습권</label>
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
                                    <label className="text-sm text-[#8B95A1]">학습권</label>
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
                                    <label className="text-sm text-[#8B95A1]">보너스 학습권</label>
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
                                      <span className="text-[#3182F6] font-bold">{pkg.points.toLocaleString()} 학습권</span>
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
            <div className="flex justify-end mb-2">
              <Button 
                onClick={downloadTrafficCSV}
                variant="outline"
                className="rounded-lg"
                data-testid="button-download-traffic-csv"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV 다운로드
              </Button>
            </div>
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
                  <p className="text-sm text-[#8B95A1] mb-1">총 선물 학습권 잔액</p>
                  <p className="text-2xl font-bold text-[#10B981]">{(gpStats?.totalGiftPoints || 0).toLocaleString()}번</p>
                </CardContent>
              </Card>
              <Card className="toss-card">
                <CardContent className="p-4">
                  <p className="text-sm text-[#8B95A1] mb-1">선물 학습권 보유 회원</p>
                  <p className="text-2xl font-bold text-[#191F28]">{gpStats?.totalUsersWithGP || 0}명</p>
                </CardContent>
              </Card>
              <Card className="toss-card">
                <CardContent className="p-4">
                  <p className="text-sm text-[#8B95A1] mb-1">30일 내 만료 선물 학습권</p>
                  <p className="text-2xl font-bold text-amber-500">{(gpStats?.expiringIn30Days || 0).toLocaleString()}번</p>
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
                  선물 학습권 지급
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
                              <p className="text-sm font-bold text-[#10B981]">{(u.giftPoints || 0).toLocaleString()}번</p>
                              <p className="text-xs text-[#8B95A1]">{u.credits.toLocaleString()}번</p>
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
                            <p className="text-sm text-[#10B981] mt-1">현재 선물 학습권: {(selectedUserForGP.giftPoints || 0).toLocaleString()}번</p>
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
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-sm font-medium text-[#4E5968] mb-1 block">지급할 선물 학습권</label>
                            <Input
                              type="number"
                              value={gpAmount}
                              onChange={(e) => setGpAmount(parseInt(e.target.value) || 0)}
                              className="bg-white"
                              placeholder="100"
                              data-testid="input-gp-amount"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-[#4E5968] mb-1 block">만료일 (선택)</label>
                            <Input
                              type="date"
                              value={gpExpiresAt}
                              onChange={(e) => setGpExpiresAt(e.target.value)}
                              className="bg-white"
                              data-testid="input-gp-expires"
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
                        <p className="text-xs text-[#8B95A1] mt-2">
                          만료일을 지정하지 않으면 기본 90일 후 만료됩니다.
                        </p>
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => addGPMutation.mutate({
                              userId: selectedUserForGP.id,
                              amount: gpAmount,
                              reason: gpReason || '관리자 지급',
                              expiresAt: gpExpiresAt || undefined
                            })}
                            disabled={addGPMutation.isPending || gpAmount <= 0}
                            className="bg-[#10B981] hover:bg-[#059669] text-white"
                            data-testid="button-add-gp"
                          >
                            {addGPMutation.isPending ? '처리 중...' : (
                              <>
                                <Plus className="h-4 w-4 mr-1" />
                                {gpAmount.toLocaleString()}번 지급
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

            {/* GP Global Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <span className="text-[#191F28] font-bold">번</span>
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
                      <p className="text-2xl font-bold text-[#10B981]">{signupBonus.toLocaleString()}번</p>
                      <p className="text-sm text-[#8B95A1]">신규 가입 시 무료 제공</p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* GP Default Expiration */}
              <Card className="toss-card border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-amber-600" />
                      <p className="font-bold text-[#191F28]">선물 학습권 기본 유효기간</p>
                    </div>
                    {editingGpExpirationDays === null && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingGpExpirationDays(gpExpirationDays)}
                        className="text-amber-600 hover:text-amber-700"
                        data-testid="button-edit-gp-expiration"
                      >
                        수정
                      </Button>
                    )}
                  </div>
                  {editingGpExpirationDays !== null ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editingGpExpirationDays}
                          onChange={(e) => setEditingGpExpirationDays(parseInt(e.target.value) || 0)}
                          className="w-32 bg-white"
                          min={1}
                          data-testid="input-gp-expiration-days"
                        />
                        <span className="text-[#191F28] font-bold">일</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateGpExpirationMutation.mutate(editingGpExpirationDays)}
                          disabled={updateGpExpirationMutation.isPending}
                          className="bg-amber-500 hover:bg-amber-600 text-white"
                          data-testid="button-save-gp-expiration"
                        >
                          저장
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingGpExpirationDays(null)}
                          data-testid="button-cancel-gp-expiration"
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-amber-600">{gpExpirationDays.toLocaleString()}일</p>
                      <p className="text-sm text-[#8B95A1]">신규 선물 학습권 지급 후 만료까지</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Referral Program Settings */}
            <Card className="toss-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#3182F6]" />
                  친구 추천 프로그램
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Referral Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-[#F2F4F6] rounded-xl p-4">
                      <p className="text-sm text-[#8B95A1] mb-1">총 추천 수</p>
                      <p className="text-2xl font-bold text-[#191F28]">{referralStats?.totalReferrals || 0}건</p>
                    </div>
                    <div className="bg-[#10B981]/10 rounded-xl p-4">
                      <p className="text-sm text-[#10B981] mb-1">지급된 선물 학습권</p>
                      <p className="text-2xl font-bold text-[#10B981]">{(referralStats?.totalGpAwarded || 0).toLocaleString()}번</p>
                    </div>
                    <div className="bg-[#3182F6]/10 rounded-xl p-4 md:col-span-1 col-span-2">
                      <p className="text-sm text-[#3182F6] mb-1">활성 추천인</p>
                      <p className="text-2xl font-bold text-[#3182F6]">{referralStats?.topInviters?.length || 0}명</p>
                    </div>
                  </div>

                  {/* Referral Reward Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Inviter Reward */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Gift className="h-5 w-5 text-[#10B981]" />
                          <p className="font-bold text-[#191F28]">추천인 보상</p>
                        </div>
                        {editingInviterGp === null && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingInviterGp(referralStats?.currentSettings?.inviterGp || 500);
                              setEditingInviteeGp(referralStats?.currentSettings?.inviteeGp || 500);
                            }}
                            className="text-[#10B981] hover:text-[#059669]"
                            data-testid="button-edit-referral-inviter"
                          >
                            수정
                          </Button>
                        )}
                      </div>
                      {editingInviterGp !== null ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editingInviterGp}
                              onChange={(e) => setEditingInviterGp(parseInt(e.target.value) || 0)}
                              className="w-32 bg-white"
                              min={0}
                              data-testid="input-referral-inviter"
                            />
                            <span className="text-[#191F28] font-bold">번</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-bold text-[#10B981]">{(referralStats?.currentSettings?.inviterGp || 500).toLocaleString()}번</p>
                          <p className="text-sm text-[#8B95A1]">친구 초대 시 받는 선물 학습권</p>
                        </>
                      )}
                    </div>

                    {/* Invitee Reward */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-5 w-5 text-[#3182F6]" />
                          <p className="font-bold text-[#191F28]">피추천인 보상</p>
                        </div>
                      </div>
                      {editingInviteeGp !== null ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editingInviteeGp}
                              onChange={(e) => setEditingInviteeGp(parseInt(e.target.value) || 0)}
                              className="w-32 bg-white"
                              min={0}
                              data-testid="input-referral-invitee"
                            />
                            <span className="text-[#191F28] font-bold">번</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-bold text-[#3182F6]">{(referralStats?.currentSettings?.inviteeGp || 500).toLocaleString()}번</p>
                          <p className="text-sm text-[#8B95A1]">초대받아 가입 시 받는 선물 학습권</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Save/Cancel buttons for referral settings */}
                  {editingInviterGp !== null && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => updateReferralSettingsMutation.mutate({
                          inviterGp: editingInviterGp ?? 500,
                          inviteeGp: editingInviteeGp ?? 500
                        })}
                        disabled={updateReferralSettingsMutation.isPending}
                        className="bg-[#3182F6] hover:bg-[#2b72d7] text-white"
                        data-testid="button-save-referral-settings"
                      >
                        {updateReferralSettingsMutation.isPending ? '저장 중...' : '추천 보상 저장'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingInviterGp(null);
                          setEditingInviteeGp(null);
                        }}
                        data-testid="button-cancel-referral-settings"
                      >
                        취소
                      </Button>
                    </div>
                  )}

                  {/* Top Inviters */}
                  {referralStats?.topInviters && referralStats.topInviters.length > 0 && (
                    <div>
                      <p className="font-bold text-[#191F28] mb-3">상위 추천인</p>
                      <div className="border rounded-xl overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-[#F2F4F6]">
                            <tr>
                              <th className="p-3 text-left text-sm font-medium text-[#4E5968]">사용자</th>
                              <th className="p-3 text-center text-sm font-medium text-[#4E5968]">추천 수</th>
                              <th className="p-3 text-right text-sm font-medium text-[#4E5968]">받은 선물 학습권</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {referralStats.topInviters.map((inviter, index) => (
                              <tr key={inviter.userId} className="hover:bg-[#F9FAFB]">
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-[#8B95A1]">#{index + 1}</span>
                                    <div>
                                      <p className="font-medium text-[#191F28]">{inviter.displayName || inviter.email || 'Unknown'}</p>
                                      <p className="text-xs text-[#8B95A1]">{inviter.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 text-center font-bold text-[#191F28]">{inviter.referralCount}명</td>
                                <td className="p-3 text-right font-bold text-[#10B981]">{inviter.totalGpEarned.toLocaleString()}번</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
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
                          <label className="text-sm text-[#8B95A1]">선물 학습권</label>
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
                                  <label className="text-sm text-[#8B95A1]">선물 학습권</label>
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
                                  <span className="text-[#10B981] font-bold">{coupon.pointAmount.toLocaleString()}번</span>
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
                  선물 학습권 보유 회원 목록
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
                          <p className="text-lg font-bold text-[#10B981]">{(u.giftPoints || 0).toLocaleString()}번</p>
                          <p className="text-sm text-[#8B95A1]">{u.credits.toLocaleString()}번</p>
                        </div>
                      </div>
                    ))}
                  {users.filter(u => (u.giftPoints || 0) > 0).length === 0 && (
                    <div className="p-8 text-center text-[#8B95A1]">
                      선물 학습권을 보유한 회원이 없습니다.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Groups Management Tab */}
          <TabsContent value="groups" className="space-y-6">
            <GroupManagementTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Register User Dialog */}
      <AlertDialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#3182F6]" />
              회원 등록
            </AlertDialogTitle>
            <AlertDialogDescription>
              새로운 회원을 시스템에 등록합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#191F28]">이메일 *</label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                className="bg-[#F2F4F6] border-none rounded-xl"
                data-testid="input-register-email"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#191F28]">성</label>
                <Input
                  placeholder="홍"
                  value={newUserData.lastName}
                  onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                  className="bg-[#F2F4F6] border-none rounded-xl"
                  data-testid="input-register-lastname"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#191F28]">이름</label>
                <Input
                  placeholder="길동"
                  value={newUserData.firstName}
                  onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                  className="bg-[#F2F4F6] border-none rounded-xl"
                  data-testid="input-register-firstname"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#191F28]">역할</label>
                <Select
                  value={newUserData.role}
                  onValueChange={(value) => setNewUserData({ ...newUserData, role: value as any })}
                >
                  <SelectTrigger className="bg-[#F2F4F6] border-none rounded-xl" data-testid="select-register-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">일반 회원</SelectItem>
                    <SelectItem value="staff">스태프</SelectItem>
                    {isAdmin && <SelectItem value="admin">관리자</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#191F28]">초기 학습권</label>
                <Input
                  type="number"
                  min={0}
                  value={newUserData.credits}
                  onChange={(e) => setNewUserData({ ...newUserData, credits: parseInt(e.target.value) || 0 })}
                  className="bg-[#F2F4F6] border-none rounded-xl"
                  data-testid="input-register-credits"
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRegistering}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRegisterUser}
              disabled={isRegistering || !newUserData.email.trim()}
              className="bg-[#3182F6] hover:bg-[#1B64DA]"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  등록 중...
                </>
              ) : (
                "회원 등록"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              회원 삭제 확인
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3 pt-2">
                <p>
                  <span className="font-bold text-[#191F28]">{userToDelete?.displayName || userToDelete?.email || '이 사용자'}</span>님을 정말 삭제하시겠습니까?
                </p>
                <p className="text-red-600 font-medium">
                  경고: 이 작업은 되돌릴 수 없습니다!
                </p>
                <p className="text-sm">
                  삭제 시 다음 정보가 모두 삭제됩니다:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>모든 프로필 정보</li>
                  <li>저장된 분석 결과</li>
                  <li>작성한 자기소개서</li>
                  <li>목표 관리 데이터</li>
                  <li>보유 학습권 및 선물 학습권</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  삭제 중...
                </>
              ) : (
                "회원 삭제"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!selectedUserForDetail} onOpenChange={(open) => { if (!open) { setSelectedUserForDetail(null); setDetailTab("overview"); } }}>
        <DialogContent className="max-w-4xl h-[85vh] overflow-hidden flex flex-col p-0 rounded-2xl border border-[#F2F4F6] shadow-lg" data-testid="modal-user-detail">
          <DialogHeader className="sr-only">
            <DialogTitle>{userDetail?.user?.displayName || '사용자 상세'}</DialogTitle>
            <DialogDescription>{userDetail?.user?.email || ''}</DialogDescription>
          </DialogHeader>

          {userDetailLoading ? (
            <div className="p-8 space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-[#F2F4F6] animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-40 bg-[#F2F4F6] rounded-xl animate-pulse" />
                  <div className="h-4 w-56 bg-[#F2F4F6] rounded-xl animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-20 bg-[#F2F4F6] rounded-2xl animate-pulse" />)}
              </div>
              <div className="h-40 bg-[#F2F4F6] rounded-2xl animate-pulse" />
            </div>
          ) : userDetailError ? (
            <div className="p-12 text-center">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-[#191F28] font-medium mb-1">정보를 불러올 수 없습니다</p>
              <p className="text-sm text-[#8B95A1]">잠시 후 다시 시도해주세요.</p>
            </div>
          ) : userDetail ? (
            (() => {
              const FIELD_LABELS: Record<string, string> = {
                basic_name: '이름', basic_email: '이메일', basic_location: '위치', basic_bio: '자기소개',
                basic_gender: '성별', basic_birthDate: '생년월일',
                intl_nationality: '국적', intl_phone: '전화번호', intl_address: '주소',
                intl_currentVisaType: '비자 유형', intl_visaExpiryDate: '비자 만료일',
                intl_availableWorkType: '근무 가능 형태', intl_partTimeHoursPerWeek: '주당 근무 가능 시간',
                intl_desiredPosition: '희망 직무', intl_preferredLocation: '희망 근무지',
                intl_expectedSalary: '희망 연봉', intl_availableStartDate: '근무 가능 시작일',
                intl_nativeLanguage: '모국어', intl_koreanLevel: '한국어 수준', intl_topikLevel: 'TOPIK 급수',
                intl_englishLevel: '영어 수준', intl_englishTestName: '영어시험명', intl_englishTestScore: '영어 시험 점수',
                intl_otherLanguages: '기타 언어', intl_computerItSkills: 'IT 기술', intl_experienceStatus: '경력 상태',
                intl_reasonForComingToKorea: '한국 방문 이유', intl_reasonForKoreaEmployment: '한국 취업 이유',
                intl_strengthsAndPersonality: '강점 및 성격', intl_bestThingInKorea: '한국에서 가장 좋은 점',
                gen_currentStatus: '현재 상태', gen_prevJobSatisfaction: '이전 직장 만족도',
                gen_reasonForChange: '이직/취업 사유', gen_desiredIndustry: '희망 산업', gen_desiredRole: '희망 직무',
                gen_workStyle: '근무 형태', gen_salary: '희망 연봉', gen_concerns: '고민/걱정',
                gen_salaryNoPreference: '연봉 무관', gen_environmentNoPreference: '환경 무관',
                univ_schoolName: '학교명', univ_majorCategory: '전공 계열', univ_majorName: '전공명',
                univ_grade: '학년', univ_semester: '학기', univ_gpa: '학점', univ_certificates: '자격증',
                univ_concerns: '고민', univ_desiredIndustry: '희망 산업', univ_internshipStatus: '인턴 경험',
                univ_careerReadiness: '취업 준비도', univ_careerGoalClear: '진로 목표 명확도',
                univ_academicStress: '학업 스트레스', univ_financialStress: '경제적 스트레스',
                univ_sleepHours: '수면 시간', univ_mentalWellbeing: '정신 건강',
                univ_workloadWorkHours: '근무 시간', univ_workloadStudyHours: '학습 시간',
                univ_belongingScore: '소속감 점수', univ_hasSupportPerson: '지지자 여부',
                univ_facultyRespect: '교수 존중', univ_classComfort: '수업 편안함',
                univ_serviceBarriers: '서비스 장벽',
                high_schoolName: '학교명', high_grade: '학년', high_class: '반',
                high_academicScore: '성적', high_majorTrack: '계열', high_hopeUniversity: '희망 대학',
                high_careerHope: '희망 직업', high_mbti: 'MBTI', high_hobbies: '취미',
                high_activityStatus: '활동 상태', high_concerns: '고민',
                high_favoriteSubject: '좋아하는 과목', high_dislikedSubject: '싫어하는 과목',
                high_studyAbroad: '해외 유학 희망', high_stressLevel: '스트레스 수준', high_sleepPattern: '수면 패턴',
                mid_schoolName: '학교명', mid_grade: '학년', mid_class: '반',
                mid_academicScore: '성적', mid_interests: '관심사', mid_hobbies: '취미',
                mid_favoriteSubject: '좋아하는 과목', mid_dislikedSubject: '싫어하는 과목',
                mid_dreamJob: '장래 희망', mid_highSchoolPlan: '고등학교 계획', mid_concerns: '고민', mid_strengths: '장점',
                elem_schoolName: '학교명', elem_grade: '학년', elem_dreamJob: '장래 희망',
                elem_strengths: '장점', elem_interests: '관심사', elem_hobbies: '취미', elem_concerns: '고민',
                elem_favoriteSubject: '좋아하는 과목', elem_dislikedSubject: '싫어하는 과목', elem_parentsHope: '부모님 희망',
              };
              const renderObjectReadable = (obj: any, depth = 0): React.ReactNode => {
                if (obj === null || obj === undefined) return <span className="text-[#C4C9D0]">-</span>;
                if (typeof obj === 'string') return <p className="text-sm text-[#191F28] leading-relaxed whitespace-pre-wrap">{obj}</p>;
                if (typeof obj === 'number' || typeof obj === 'boolean') return <span className="text-sm text-[#191F28]">{String(obj)}</span>;
                if (Array.isArray(obj)) {
                  if (obj.length === 0) return <span className="text-[#C4C9D0] text-sm">없음</span>;
                  if (obj.every((item: any) => typeof item === 'string' || typeof item === 'number')) {
                    return <p className="text-sm text-[#191F28]">{obj.join(', ')}</p>;
                  }
                  return (
                    <div className="space-y-2">
                      {obj.map((item: any, i: number) => (
                        <div key={i} className={depth === 0 ? "bg-[#F8F9FA] rounded-xl p-3" : ""}>
                          {typeof item === 'string' || typeof item === 'number' ? (
                            <p className="text-sm text-[#191F28]">{String(item)}</p>
                          ) : typeof item === 'object' ? (
                            renderObjectReadable(item, depth + 1)
                          ) : <p className="text-sm text-[#191F28]">{String(item)}</p>}
                        </div>
                      ))}
                    </div>
                  );
                }
                if (typeof obj === 'object') {
                  const entries = Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== '');
                  if (entries.length === 0) return <span className="text-[#C4C9D0] text-sm">없음</span>;
                  return (
                    <div className={`space-y-2 ${depth === 0 ? '' : ''}`}>
                      {entries.map(([key, val]) => {
                        const label = key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim();
                        const isComplex = typeof val === 'object' && val !== null;
                        return (
                          <div key={key}>
                            <p className="text-[11px] text-[#8B95A1] font-medium mb-0.5">{label}</p>
                            {isComplex ? renderObjectReadable(val, depth + 1) : (
                              <p className="text-sm text-[#191F28] leading-relaxed whitespace-pre-wrap">{String(val)}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                return <span className="text-sm text-[#191F28]">{String(obj)}</span>;
              };
              const renderField = (label: string, value: any) => {
                if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
                  return (<div className="py-1"><p className="text-[11px] text-[#8B95A1] font-medium">{label}</p><p className="text-sm text-[#C4C9D0]">미입력</p></div>);
                }
                if (typeof value === 'object' && !Array.isArray(value)) {
                  return (<div className="py-1"><p className="text-[11px] text-[#8B95A1] font-medium mb-1">{label}</p>{renderObjectReadable(value)}</div>);
                }
                const displayValue = Array.isArray(value) ? value.join(', ') : typeof value === 'boolean' ? (value ? '예' : '아니오') : String(value);
                return (<div className="py-1"><p className="text-[11px] text-[#8B95A1] font-medium">{label}</p><p className="text-sm text-[#191F28] break-words leading-relaxed">{displayValue}</p></div>);
              };
              const renderFieldSection = (title: string, fields: Array<{label: string, value: any}>) => (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-[#3182F6] uppercase tracking-wider">{title}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-[#F8F9FA] rounded-xl p-3">
                    {fields.map((f, i) => <div key={i}>{renderField(f.label, f.value)}</div>)}
                  </div>
                </div>
              );
              const getProfileTypeBadge = (type: string) => {
                const map: Record<string, string> = { general: '구직자', university: '대학생', international_university: '외국인유학생', high: '고등학생', middle: '중학생', elementary: '초등학생' };
                return map[type] || type;
              };
              const renderProfileFields = (profile: any) => {
                const pd = profile.profileData || {};
                const type = pd.type || profile.type;
                const sections: Array<{title: string, fields: Array<{label: string, value: any}>}> = [];
                sections.push({ title: '기본 정보', fields: [
                  { label: FIELD_LABELS.basic_name, value: pd.basic_name },
                  { label: FIELD_LABELS.basic_email, value: pd.basic_email },
                  { label: FIELD_LABELS.basic_location, value: pd.basic_location },
                  { label: FIELD_LABELS.basic_gender, value: pd.basic_gender === 'male' ? '남성' : pd.basic_gender === 'female' ? '여성' : pd.basic_gender },
                  { label: FIELD_LABELS.basic_birthDate, value: pd.basic_birthDate ? new Date(pd.basic_birthDate).toLocaleDateString('ko-KR') : null },
                  { label: FIELD_LABELS.basic_bio, value: pd.basic_bio },
                ]});
                if (type === 'international_university') {
                  sections.push({ title: '개인 정보', fields: [
                    { label: FIELD_LABELS.intl_nationality, value: pd.intl_nationality },
                    { label: FIELD_LABELS.intl_phone, value: pd.intl_phone },
                    { label: FIELD_LABELS.intl_address, value: pd.intl_address },
                  ]});
                  sections.push({ title: '비자 정보', fields: [
                    { label: FIELD_LABELS.intl_currentVisaType, value: pd.intl_currentVisaType },
                    { label: FIELD_LABELS.intl_visaExpiryDate, value: pd.intl_visaExpiryDate },
                    { label: FIELD_LABELS.intl_availableWorkType, value: pd.intl_availableWorkType },
                    { label: FIELD_LABELS.intl_partTimeHoursPerWeek, value: pd.intl_partTimeHoursPerWeek },
                  ]});
                  sections.push({ title: '취업 희망', fields: [
                    { label: FIELD_LABELS.intl_desiredPosition, value: pd.intl_desiredPosition },
                    { label: FIELD_LABELS.intl_preferredLocation, value: pd.intl_preferredLocation },
                    { label: FIELD_LABELS.intl_expectedSalary, value: pd.intl_expectedSalary },
                    { label: FIELD_LABELS.intl_availableStartDate, value: pd.intl_availableStartDate },
                  ]});
                  if (pd.intl_educations?.length > 0) {
                    sections.push({ title: '학력', fields: pd.intl_educations.map((edu: any, idx: number) => ({
                      label: `학력 ${idx + 1}`,
                      value: [edu.schoolName, edu.schoolCountry, edu.major, edu.degree, edu.periodStart && edu.periodEnd ? `${edu.periodStart}~${edu.periodEnd}` : null, edu.isEnrolled ? '재학중' : null].filter(Boolean).join(' / '),
                    }))});
                  }
                  if (pd.intl_workExperiences?.length > 0) {
                    sections.push({ title: '경력', fields: pd.intl_workExperiences.map((exp: any, idx: number) => ({
                      label: `경력 ${idx + 1}`,
                      value: [exp.companyName, exp.companyCountry, exp.positionAndRole, exp.periodStart && exp.periodEnd ? `${exp.periodStart}~${exp.periodEnd}` : null, exp.mainTasksAndAchievements].filter(Boolean).join(' / '),
                    }))});
                  }
                  sections.push({ title: '언어 능력', fields: [
                    { label: FIELD_LABELS.intl_nativeLanguage, value: pd.intl_nativeLanguage },
                    { label: FIELD_LABELS.intl_koreanLevel, value: pd.intl_koreanLevel },
                    { label: FIELD_LABELS.intl_topikLevel, value: pd.intl_topikLevel },
                    { label: FIELD_LABELS.intl_englishLevel, value: pd.intl_englishLevel },
                    { label: FIELD_LABELS.intl_englishTestName, value: pd.intl_englishTestName },
                    { label: FIELD_LABELS.intl_englishTestScore, value: pd.intl_englishTestScore },
                    { label: FIELD_LABELS.intl_otherLanguages, value: pd.intl_otherLanguages },
                  ]});
                  sections.push({ title: '기술 및 자격', fields: [
                    { label: '스킬', value: pd.intl_skills },
                    { label: FIELD_LABELS.intl_computerItSkills, value: pd.intl_computerItSkills },
                    { label: '자격증', value: pd.intl_certificates?.map((c: any) => `${c.name}(${c.issuer})`).join(', ') },
                    { label: FIELD_LABELS.intl_experienceStatus, value: pd.intl_experienceStatus },
                  ]});
                  sections.push({ title: '자기 소개', fields: [
                    { label: FIELD_LABELS.intl_reasonForComingToKorea, value: pd.intl_reasonForComingToKorea },
                    { label: FIELD_LABELS.intl_reasonForKoreaEmployment, value: pd.intl_reasonForKoreaEmployment },
                    { label: FIELD_LABELS.intl_strengthsAndPersonality, value: pd.intl_strengthsAndPersonality },
                    { label: FIELD_LABELS.intl_bestThingInKorea, value: pd.intl_bestThingInKorea },
                  ]});
                } else if (type === 'general') {
                  sections.push({ title: '현재 상태', fields: [
                    { label: FIELD_LABELS.gen_currentStatus, value: pd.gen_currentStatus },
                    { label: FIELD_LABELS.gen_prevJobSatisfaction, value: pd.gen_prevJobSatisfaction },
                    { label: FIELD_LABELS.gen_reasonForChange, value: pd.gen_reasonForChange },
                    { label: FIELD_LABELS.gen_concerns, value: pd.gen_concerns },
                  ]});
                  sections.push({ title: '희망 직무', fields: [
                    { label: FIELD_LABELS.gen_desiredIndustry, value: pd.gen_desiredIndustry },
                    { label: FIELD_LABELS.gen_desiredRole, value: pd.gen_desiredRole },
                    { label: FIELD_LABELS.gen_workStyle, value: pd.gen_workStyle },
                    { label: FIELD_LABELS.gen_salary, value: pd.gen_salaryNoPreference ? '무관' : pd.gen_salary ? `${pd.gen_salary}만원` : null },
                    { label: '근무 가치관', value: pd.gen_workValues },
                    { label: '환경 선호', value: pd.gen_environmentNoPreference ? '무관' : pd.gen_environmentPreferences },
                  ]});
                  sections.push({ title: '스킬', fields: [
                    { label: '보유 기술', value: pd.gen_skills },
                  ]});
                  if (pd.gen_workExperience?.length > 0) {
                    sections.push({ title: '경력', fields: pd.gen_workExperience.map((exp: any, idx: number) => ({
                      label: `경력 ${idx + 1}`,
                      value: [exp.company, exp.role, exp.description].filter(Boolean).join(' / '),
                    }))});
                  }
                  if (pd.gen_languageTests?.length > 0) {
                    sections.push({ title: '어학 시험', fields: pd.gen_languageTests.map((lt: any, idx: number) => ({
                      label: `시험 ${idx + 1}`,
                      value: [lt.examName, lt.scoreType === 'grade' ? `급수: ${lt.scoreValue}` : `점수: ${lt.scoreValue}`, lt.acquiredDate].filter(Boolean).join(' / '),
                    }))});
                  }
                  if (pd.gen_licenses?.length > 0) {
                    sections.push({ title: '자격증/면허', fields: pd.gen_licenses.map((lic: any, idx: number) => ({
                      label: `자격 ${idx + 1}`,
                      value: [lic.title, lic.issuer, lic.status === 'acquired' ? '취득' : lic.status === 'preparing' ? '준비중' : '만료', lic.acquiredDate].filter(Boolean).join(' / '),
                    }))});
                  }
                  if (pd.gen_awards?.length > 0) {
                    sections.push({ title: '수상 경력', fields: pd.gen_awards.map((aw: any, idx: number) => ({
                      label: `수상 ${idx + 1}`,
                      value: [aw.titleAndHost, aw.rank, aw.awardDate].filter(Boolean).join(' / '),
                    }))});
                  }
                  if (pd.gen_references?.length > 0) {
                    sections.push({ title: '추천인', fields: pd.gen_references.map((ref: any, idx: number) => ({
                      label: `추천인 ${idx + 1}`,
                      value: [ref.name, ref.organization, ref.relation].filter(Boolean).join(' / '),
                    }))});
                  }
                  if (pd.gen_educations?.length > 0) {
                    sections.push({ title: '학력', fields: pd.gen_educations.map((edu: any, idx: number) => ({
                      label: `학력 ${idx + 1}`,
                      value: [edu.schoolName, edu.educationLevel, edu.major, edu.graduationStatus === 'graduated' ? '졸업' : edu.graduationStatus === 'enrolled' ? '재학' : edu.graduationStatus, edu.gpa ? `GPA ${edu.gpa}` : null].filter(Boolean).join(' / '),
                    }))});
                  }
                } else if (type === 'university') {
                  sections.push({ title: '학교 정보', fields: [
                    { label: FIELD_LABELS.univ_schoolName, value: pd.univ_schoolName },
                    { label: FIELD_LABELS.univ_majorCategory, value: pd.univ_majorCategory },
                    { label: FIELD_LABELS.univ_majorName, value: pd.univ_majorName },
                    { label: FIELD_LABELS.univ_grade, value: pd.univ_grade },
                    { label: FIELD_LABELS.univ_semester, value: pd.univ_semester },
                    { label: FIELD_LABELS.univ_gpa, value: pd.univ_gpa },
                  ]});
                  sections.push({ title: '진로 준비', fields: [
                    { label: FIELD_LABELS.univ_careerReadiness, value: pd.univ_careerReadiness },
                    { label: FIELD_LABELS.univ_careerGoalClear, value: pd.univ_careerGoalClear },
                    { label: FIELD_LABELS.univ_desiredIndustry, value: pd.univ_desiredIndustry },
                    { label: FIELD_LABELS.univ_internshipStatus, value: pd.univ_internshipStatus },
                    { label: '개발할 기술', value: pd.univ_skillsToDevelop },
                  ]});
                  if (pd.univ_languageTests?.length > 0) {
                    sections.push({ title: '어학 시험', fields: pd.univ_languageTests.map((lt: any, idx: number) => ({
                      label: `시험 ${idx + 1}`,
                      value: [lt.type, lt.score].filter(Boolean).join(': '),
                    }))});
                  }
                  sections.push({ title: '자격 및 기타', fields: [
                    { label: FIELD_LABELS.univ_certificates, value: pd.univ_certificates },
                    { label: FIELD_LABELS.univ_concerns, value: pd.univ_concerns },
                    { label: '이용 서비스', value: pd.univ_servicesUsed },
                    { label: FIELD_LABELS.univ_serviceBarriers, value: pd.univ_serviceBarriers },
                  ]});
                  sections.push({ title: '웰빙 지표', fields: [
                    { label: FIELD_LABELS.univ_academicStress, value: pd.univ_academicStress },
                    { label: FIELD_LABELS.univ_financialStress, value: pd.univ_financialStress },
                    { label: FIELD_LABELS.univ_sleepHours, value: pd.univ_sleepHours },
                    { label: FIELD_LABELS.univ_mentalWellbeing, value: pd.univ_mentalWellbeing },
                    { label: FIELD_LABELS.univ_workloadWorkHours, value: pd.univ_workloadWorkHours },
                    { label: FIELD_LABELS.univ_workloadStudyHours, value: pd.univ_workloadStudyHours },
                    { label: FIELD_LABELS.univ_belongingScore, value: pd.univ_belongingScore },
                    { label: FIELD_LABELS.univ_hasSupportPerson, value: pd.univ_hasSupportPerson },
                    { label: FIELD_LABELS.univ_facultyRespect, value: pd.univ_facultyRespect },
                    { label: FIELD_LABELS.univ_classComfort, value: pd.univ_classComfort },
                  ]});
                } else if (type === 'high') {
                  sections.push({ title: '학교 정보', fields: [
                    { label: FIELD_LABELS.high_schoolName, value: pd.high_schoolName },
                    { label: FIELD_LABELS.high_grade, value: pd.high_grade },
                    { label: FIELD_LABELS.high_class, value: pd.high_class },
                    { label: FIELD_LABELS.high_majorTrack, value: pd.high_majorTrack },
                    { label: FIELD_LABELS.high_academicScore, value: pd.high_academicScore },
                  ]});
                  if (pd.high_subject_scores) {
                    const ss = pd.high_subject_scores;
                    sections.push({ title: '과목별 성적', fields: [
                      { label: '국어', value: ss.korean }, { label: '수학', value: ss.math },
                      { label: '영어', value: ss.english }, { label: '사회', value: ss.social },
                      { label: '과학', value: ss.science }, { label: '한국사', value: ss.history },
                      { label: '제2외국어', value: ss.second_lang },
                    ]});
                  }
                  if (pd.high_balance) {
                    const bl = pd.high_balance;
                    sections.push({ title: '균형 지표', fields: [
                      { label: '학업', value: bl.academic }, { label: '활동', value: bl.activity },
                      { label: '독서', value: bl.reading }, { label: '봉사', value: bl.volunteer },
                      { label: '진로', value: bl.career },
                    ]});
                  }
                  sections.push({ title: '진로 및 관심사', fields: [
                    { label: FIELD_LABELS.high_hopeUniversity, value: pd.high_hopeUniversity },
                    { label: FIELD_LABELS.high_careerHope, value: pd.high_careerHope },
                    { label: FIELD_LABELS.high_activityStatus, value: pd.high_activityStatus },
                    { label: FIELD_LABELS.high_favoriteSubject, value: pd.high_favoriteSubject },
                    { label: FIELD_LABELS.high_dislikedSubject, value: pd.high_dislikedSubject },
                    { label: FIELD_LABELS.high_mbti, value: pd.high_mbti },
                    { label: FIELD_LABELS.high_hobbies, value: pd.high_hobbies },
                    { label: FIELD_LABELS.high_studyAbroad, value: pd.high_studyAbroad },
                    { label: FIELD_LABELS.high_concerns, value: pd.high_concerns },
                    { label: FIELD_LABELS.high_stressLevel, value: pd.high_stressLevel },
                    { label: FIELD_LABELS.high_sleepPattern, value: pd.high_sleepPattern },
                  ]});
                } else if (type === 'middle') {
                  sections.push({ title: '학교 정보', fields: [
                    { label: FIELD_LABELS.mid_schoolName, value: pd.mid_schoolName },
                    { label: FIELD_LABELS.mid_grade, value: pd.mid_grade },
                    { label: FIELD_LABELS.mid_class, value: pd.mid_class },
                    { label: FIELD_LABELS.mid_academicScore, value: pd.mid_academicScore },
                  ]});
                  sections.push({ title: '관심사 및 진로', fields: [
                    { label: FIELD_LABELS.mid_favoriteSubject, value: pd.mid_favoriteSubject },
                    { label: FIELD_LABELS.mid_dislikedSubject, value: pd.mid_dislikedSubject },
                    { label: FIELD_LABELS.mid_interests, value: pd.mid_interests },
                    { label: FIELD_LABELS.mid_hobbies, value: pd.mid_hobbies },
                    { label: FIELD_LABELS.mid_dreamJob, value: pd.mid_dreamJob },
                    { label: FIELD_LABELS.mid_strengths, value: pd.mid_strengths },
                    { label: FIELD_LABELS.mid_highSchoolPlan, value: pd.mid_highSchoolPlan },
                    { label: FIELD_LABELS.mid_concerns, value: pd.mid_concerns },
                  ]});
                } else if (type === 'elementary') {
                  sections.push({ title: '학교 정보', fields: [
                    { label: FIELD_LABELS.elem_schoolName, value: pd.elem_schoolName },
                    { label: FIELD_LABELS.elem_grade, value: pd.elem_grade },
                  ]});
                  sections.push({ title: '관심사 및 꿈', fields: [
                    { label: FIELD_LABELS.elem_favoriteSubject, value: pd.elem_favoriteSubject },
                    { label: FIELD_LABELS.elem_dislikedSubject, value: pd.elem_dislikedSubject },
                    { label: FIELD_LABELS.elem_dreamJob, value: pd.elem_dreamJob },
                    { label: FIELD_LABELS.elem_strengths, value: pd.elem_strengths },
                    { label: FIELD_LABELS.elem_interests, value: pd.elem_interests },
                    { label: FIELD_LABELS.elem_hobbies, value: pd.elem_hobbies },
                    { label: FIELD_LABELS.elem_concerns, value: pd.elem_concerns },
                    { label: FIELD_LABELS.elem_parentsHope, value: pd.elem_parentsHope },
                  ]});
                }
                return sections;
              };
              return (<>
              <div className="bg-white border-b border-[#F2F4F6] px-6 pr-12 pt-6 pb-5 flex-shrink-0">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#3182F6] to-[#1B64DA] flex items-center justify-center text-white font-bold text-xl shrink-0">
                    {(userDetail.user.displayName || userDetail.user.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-[#191F28] truncate">
                      {userDetail.user.displayName || `${userDetail.user.firstName || ''} ${userDetail.user.lastName || ''}`.trim() || '이름 없음'}
                    </h2>
                    <p className="text-[#8B95A1] text-sm truncate">{userDetail.user.email || '-'}</p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {getRoleBadge(userDetail.user.role)}
                      <Badge className="bg-[#F2F4F6] text-[#4E5968] border-0 text-[11px] px-2 py-0.5 rounded-lg">
                        {userDetail.user.gender === 'male' ? '남성' : userDetail.user.gender === 'female' ? '여성' : '-'}
                      </Badge>
                      <Badge className="bg-[#F2F4F6] text-[#4E5968] border-0 text-[11px] px-2 py-0.5 rounded-lg">
                        가입 {userDetail.user.createdAt ? new Date(userDetail.user.createdAt).toLocaleDateString('ko-KR') : '-'}
                      </Badge>
                      {userDetail.user.birthDate && (
                        <Badge className="bg-[#F2F4F6] text-[#4E5968] border-0 text-[11px] px-2 py-0.5 rounded-lg">
                          {new Date(userDetail.user.birthDate).toLocaleDateString('ko-KR')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <div className="bg-[#EFF6FF] rounded-2xl px-4 py-2.5 text-center min-w-[72px]">
                      <p className="text-lg font-bold text-[#3182F6]">{(userDetail.user.credits || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-[#8B95A1] font-medium">학습권</p>
                    </div>
                    <div className="bg-[#F3EEFF] rounded-2xl px-4 py-2.5 text-center min-w-[72px]">
                      <p className="text-lg font-bold text-[#7C3AED]">{(userDetail.user.giftPoints || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-[#8B95A1] font-medium">선물 학습권</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative flex gap-1 px-4 pt-1 bg-white overflow-x-auto flex-shrink-0" style={{ boxShadow: 'inset 0 -1px 0 #F2F4F6' }}>
                {[
                  { key: "overview", label: "개요", icon: <User className="h-3.5 w-3.5" /> },
                  { key: "profiles", label: "프로필", icon: <Briefcase className="h-3.5 w-3.5" /> },
                  { key: "analyses", label: "분석", icon: <BarChart3 className="h-3.5 w-3.5" /> },
                  { key: "essays", label: "자기소개서", icon: <FileText className="h-3.5 w-3.5" /> },
                  { key: "kompass", label: "목표관리", icon: <Target className="h-3.5 w-3.5" /> },
                  { key: "interviews", label: "면접", icon: <Mic className="h-3.5 w-3.5" /> },
                  { key: "assessments", label: "진로진단", icon: <ClipboardList className="h-3.5 w-3.5" /> },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setDetailTab(tab.key)}
                    className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                      detailTab === tab.key
                        ? "text-[#3182F6]"
                        : "text-[#8B95A1] hover:text-[#4E5968]"
                    }`}
                    data-testid={`tab-detail-${tab.key}`}
                  >
                    {tab.icon}
                    {tab.label}
                    {detailTab === tab.key && (
                      <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#3182F6] rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              <div className="overflow-y-auto flex-1 min-h-0 bg-[#F8F9FA]">
                {detailTab === "overview" && (
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { key: "profiles", label: "프로필", count: userDetail.profiles?.length || 0, color: "#3182F6", icon: <Briefcase className="h-4 w-4" /> },
                        { key: "analyses", label: "분석", count: userDetail.analyses?.length || 0, color: "#059669", icon: <BarChart3 className="h-4 w-4" /> },
                        { key: "essays", label: "자기소개서", count: userDetail.essays?.length || 0, color: "#D97706", icon: <FileText className="h-4 w-4" /> },
                        { key: "kompass", label: "목표관리", count: userDetail.kompass?.length || 0, color: "#7C3AED", icon: <Target className="h-4 w-4" /> },
                        { key: "interviews", label: "면접", count: userDetail.interviews?.length || 0, color: "#EC4899", icon: <Mic className="h-4 w-4" /> },
                        { key: "assessments", label: "진로진단", count: userDetail.assessments?.length || 0, color: "#6B7280", icon: <ClipboardList className="h-4 w-4" /> },
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => setDetailTab(item.key)}
                          className="bg-white rounded-2xl p-3 hover:shadow-md transition-all duration-200 text-center group border border-[#F2F4F6] hover:border-transparent"
                          data-testid={`card-count-${item.key}`}
                        >
                          <div className="mx-auto mb-2 h-8 w-8 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: item.color + '10', color: item.color }}>
                            {item.icon}
                          </div>
                          <p className="text-xl font-bold text-[#191F28]">{item.count}</p>
                          <p className="text-[10px] text-[#8B95A1] font-medium">{item.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {detailTab === "profiles" && (
                  <div className="p-5 space-y-3">
                    {(!userDetail.profiles || userDetail.profiles.length === 0) ? (
                      <div className="text-center py-16">
                        <div className="h-14 w-14 mx-auto mb-3 rounded-2xl bg-[#3182F6]/5 flex items-center justify-center">
                          <Briefcase className="h-7 w-7 text-[#3182F6]/30" />
                        </div>
                        <p className="text-[#8B95A1] font-medium">등록된 프로필이 없습니다.</p>
                      </div>
                    ) : userDetail.profiles.map((profile: any) => {
                      const isExpanded = expandedItems.has(`profile-${profile.id}`);
                      const sections = renderProfileFields(profile);
                      return (
                        <div key={profile.id} className="bg-white rounded-2xl border border-[#F2F4F6] hover:border-[#3182F6]/20 hover:shadow-md transition-all duration-200" data-testid={`profile-item-${profile.id}`}>
                          <button
                            className="w-full px-5 py-4 flex items-center justify-between text-left"
                            onClick={() => toggleExpanded(`profile-${profile.id}`)}
                            data-testid={`button-expand-profile-${profile.id}`}
                          >
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <Badge className="bg-[#3182F6]/10 text-[#3182F6] border-0 text-[11px] font-bold px-2.5 py-0.5 rounded-lg">
                                {getProfileTypeBadge(profile.type)}
                              </Badge>
                              <p className="font-bold text-[#191F28]">{profile.title || '제목 없음'}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right text-xs text-[#C4C9D0] space-y-0.5">
                                {profile.lastAnalyzed && <p>분석 {new Date(profile.lastAnalyzed).toLocaleDateString('ko-KR')}</p>}
                                <p>생성 {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('ko-KR') : '-'}</p>
                              </div>
                              <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-[#3182F6]/10' : 'bg-[#F2F4F6]'}`}>
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-[#3182F6]" /> : <ChevronDown className="h-4 w-4 text-[#8B95A1]" />}
                              </div>
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="px-5 pb-5 space-y-4 border-t border-[#F2F4F6] pt-4" data-testid={`profile-detail-${profile.id}`}>
                              {sections.map((section, idx) => (
                                <div key={idx}>{renderFieldSection(section.title, section.fields)}</div>
                              ))}
                              {sections.length === 0 && (
                                <p className="text-sm text-[#C4C9D0]">프로필 데이터가 없습니다.</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {detailTab === "analyses" && (
                  <div className="p-5 space-y-3">
                    {(!userDetail.analyses || userDetail.analyses.length === 0) ? (
                      <div className="text-center py-16">
                        <div className="h-14 w-14 mx-auto mb-3 rounded-2xl bg-[#059669]/5 flex items-center justify-center">
                          <BarChart3 className="h-7 w-7 text-[#059669]/30" />
                        </div>
                        <p className="text-[#8B95A1] font-medium">진행된 분석이 없습니다.</p>
                      </div>
                    ) : userDetail.analyses.map((analysis: any) => {
                      const isExpanded = expandedItems.has(`analysis-${analysis.id}`);
                      let rec = analysis.recommendations || {};
                      if (typeof rec === 'string') { try { rec = JSON.parse(rec); } catch { rec = {}; } }
                      const ai = { summary: analysis.summary, stats: analysis.stats, overallFit: rec.overallFit, recommendations: rec };
                      const foreignData = rec.foreignStudentData;
                      const careers = rec.careers;
                      return (
                        <div key={analysis.id} className="bg-white rounded-2xl border border-[#F2F4F6] hover:border-[#059669]/20 hover:shadow-md transition-all duration-200" data-testid={`analysis-item-${analysis.id}`}>
                          <button
                            className="w-full px-5 py-4 flex items-center justify-between text-left"
                            onClick={() => toggleExpanded(`analysis-${analysis.id}`)}
                            data-testid={`button-expand-analysis-${analysis.id}`}
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className="bg-[#059669]/10 text-[#059669] border-0 text-[11px] font-bold px-2.5 py-0.5 rounded-lg">{analysis.profileName || '프로필'}</Badge>
                                {analysis.profileType && <Badge variant="outline" className="text-[10px] border-[#E5E8EB] text-[#8B95A1] px-1.5 py-0 rounded-md">{analysis.profileType}</Badge>}
                              </div>
                              {analysis.summary && <p className="text-xs text-[#8B95A1] line-clamp-1">{typeof analysis.summary === 'string' ? analysis.summary.slice(0, 120) : typeof analysis.summary === 'object' && (analysis.summary as any).desiredRole ? (analysis.summary as any).desiredRole : ''}</p>}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs text-[#C4C9D0] whitespace-nowrap">
                                {analysis.analysisDate ? new Date(analysis.analysisDate).toLocaleDateString('ko-KR') : analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString('ko-KR') : '-'}
                              </span>
                              <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-[#059669]/10' : 'bg-[#F2F4F6]'}`}>
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-[#059669]" /> : <ChevronDown className="h-4 w-4 text-[#8B95A1]" />}
                              </div>
                            </div>
                          </button>
                          {isExpanded && (() => {
                            const summaryObj = typeof ai.summary === 'object' && ai.summary ? ai.summary : null;
                            const summaryStr = typeof ai.summary === 'string' ? ai.summary : (typeof analysis.summary === 'string' ? analysis.summary : null);
                            const st = analysis.stats || ai.stats;
                            const overallFit = ai.overallFit || rec.overallFit;
                            const allCareers = careers || rec.recommendedCareers || [];
                            const readyNow = foreignData?.recommendations?.readyNow || foreignData?.readyJobs || [];
                            const afterPrep = foreignData?.recommendations?.afterPrep || foreignData?.afterPrepJobs || [];
                            const fitData = foreignData?.fit || (foreignData?.fitScore !== undefined ? { score: foreignData.fitScore, reasons: foreignData.fitReasons } : null);
                            const actPlan = foreignData?.actionPlan;
                            return (
                            <div className="px-5 pb-5 space-y-4 border-t border-[#F2F4F6] pt-4" data-testid={`analysis-detail-${analysis.id}`}>
                              {(summaryStr || summaryObj) && (
                                <div className="bg-[#F8F9FA] rounded-2xl p-4">
                                  <p className="text-[11px] font-bold text-[#3182F6] uppercase tracking-wider mb-2">분석 요약</p>
                                  {summaryStr && <p className="text-sm text-[#191F28] whitespace-pre-wrap leading-relaxed">{summaryStr}</p>}
                                  {summaryObj && (
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                      {summaryObj.desiredRole && (
                                        <div className="bg-white rounded-xl p-3 border border-[#E5E8EB]">
                                          <p className="text-[10px] text-[#8B95A1] mb-0.5">희망 직무</p>
                                          <p className="text-sm font-medium text-[#191F28]">{summaryObj.desiredRole}</p>
                                        </div>
                                      )}
                                      {summaryObj.major && (
                                        <div className="bg-white rounded-xl p-3 border border-[#E5E8EB]">
                                          <p className="text-[10px] text-[#8B95A1] mb-0.5">전공</p>
                                          <p className="text-sm font-medium text-[#191F28]">{summaryObj.major}</p>
                                        </div>
                                      )}
                                      {summaryObj.visaType && (
                                        <div className="bg-white rounded-xl p-3 border border-[#E5E8EB]">
                                          <p className="text-[10px] text-[#8B95A1] mb-0.5">비자 유형</p>
                                          <p className="text-sm font-medium text-[#191F28]">{summaryObj.visaType}</p>
                                        </div>
                                      )}
                                      {(summaryObj.korean || summaryObj.koreanLevel) && (
                                        <div className="bg-white rounded-xl p-3 border border-[#E5E8EB]">
                                          <p className="text-[10px] text-[#8B95A1] mb-0.5">한국어 수준</p>
                                          <p className="text-sm font-medium text-[#191F28]">
                                            {typeof summaryObj.korean === 'object' ? `${summaryObj.korean.level || ''}${summaryObj.korean.topik ? ` (TOPIK ${summaryObj.korean.topik})` : ''}` : summaryObj.koreanLevel || summaryObj.korean || '-'}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {st && (
                                <div className="grid grid-cols-3 gap-2">
                                  {st.label1 !== undefined ? (
                                    <>
                                      <div className="bg-[#F8F9FA] rounded-xl p-3 text-center">
                                        <p className="text-[10px] text-[#8B95A1] font-medium">{st.label1}</p>
                                        <p className="text-sm font-bold text-[#3182F6]">{st.val1}</p>
                                      </div>
                                      <div className="bg-[#F8F9FA] rounded-xl p-3 text-center">
                                        <p className="text-[10px] text-[#8B95A1] font-medium">{st.label2}</p>
                                        <p className="text-sm font-bold text-[#191F28]">{st.val2}</p>
                                      </div>
                                      <div className="bg-[#F8F9FA] rounded-xl p-3 text-center">
                                        <p className="text-[10px] text-[#8B95A1] font-medium">{st.label3}</p>
                                        <p className="text-sm font-bold text-[#059669]">{st.val3}</p>
                                      </div>
                                    </>
                                  ) : Object.entries(st as Record<string, any>).filter(([k]) => !k.startsWith('label') && !k.startsWith('val')).map(([k, v]) => (
                                    <div key={k} className="bg-[#F8F9FA] rounded-xl p-3 text-center">
                                      <p className="text-[10px] text-[#8B95A1] font-medium">{k}</p>
                                      <p className="text-sm font-bold text-[#191F28]">{String(v)}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {overallFit && (
                                <div className="bg-[#F0FDF4] rounded-xl p-3">
                                  <p className="text-[11px] font-bold text-[#059669] uppercase tracking-wider mb-1">전체 적합도</p>
                                  <p className="text-sm text-[#191F28] leading-relaxed">{typeof overallFit === 'string' ? overallFit : renderObjectReadable(overallFit)}</p>
                                </div>
                              )}

                              {foreignData && (
                                <div className="space-y-3 bg-[#FFFBEB] rounded-2xl p-4">
                                  <p className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider">외국인 유학생 분석</p>

                                  {foreignData.visaWarning && (
                                    <div className="bg-[#FEF2F2] rounded-xl p-3 flex items-start gap-2">
                                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-[11px] font-bold text-amber-700 mb-0.5">비자 안내</p>
                                        <p className="text-xs text-amber-700 leading-relaxed">{foreignData.visaWarning}</p>
                                      </div>
                                    </div>
                                  )}

                                  {fitData && (
                                    <div className="bg-white/70 rounded-xl p-3 space-y-2">
                                      <div className="flex items-center gap-2">
                                        <p className="text-[11px] font-bold text-[#191F28]">희망 직무 적합도</p>
                                        {fitData.score !== undefined && (
                                          <Badge className={`border-0 text-[11px] font-bold px-2 py-0.5 rounded-lg ${fitData.score >= 70 ? 'bg-[#059669]/10 text-[#059669]' : fitData.score >= 40 ? 'bg-[#D97706]/10 text-[#D97706]' : 'bg-red-100 text-red-700'}`}>
                                            {fitData.score}점
                                          </Badge>
                                        )}
                                      </div>
                                      {fitData.reasons && Array.isArray(fitData.reasons) && fitData.reasons.length > 0 && (
                                        <div className="space-y-1">
                                          {fitData.reasons.map((r: any, i: number) => {
                                            const reasonText = typeof r === 'string' ? r : (r.note || r.text || r.reason || r.description || '');
                                            const fieldLabel = typeof r === 'object' && r.field ? r.field : '';
                                            const fieldValue = typeof r === 'object' && r.value ? r.value : '';
                                            if (!reasonText && !fieldLabel) return null;
                                            return (
                                              <div key={i} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${r.impact === 'positive' ? 'bg-green-50' : r.impact === 'negative' ? 'bg-red-50' : 'bg-gray-50'}`}>
                                                <span className="shrink-0">{r.impact === 'positive' ? '✅' : r.impact === 'negative' ? '⚠️' : 'ℹ️'}</span>
                                                <span className="text-[#4E5968]">
                                                  {fieldLabel && <strong className="text-[#191F28]">{fieldLabel}{fieldValue ? `: ${fieldValue}` : ''}</strong>}
                                                  {fieldLabel && reasonText ? ' — ' : ''}{reasonText}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                      {typeof fitData.reasons === 'string' && <p className="text-xs text-[#4E5968]">{fitData.reasons}</p>}
                                    </div>
                                  )}

                                  {readyNow.length > 0 && (
                                    <div>
                                      <p className="text-[11px] font-bold text-[#059669] mb-2">바로 가능한 직업</p>
                                      <div className="space-y-1.5">
                                        {readyNow.map((j: any, i: number) => (
                                          <div key={i} className="bg-white/70 rounded-xl p-3">
                                            <p className="text-sm font-medium text-[#191F28]">{typeof j === 'string' ? j : j.role || j.title || j.name || `직업 ${i + 1}`}</p>
                                            {j.reasons && Array.isArray(j.reasons) && <p className="text-xs text-[#8B95A1] mt-0.5 leading-relaxed">{j.reasons.join(', ')}</p>}
                                            {j.reason && typeof j.reason === 'string' && <p className="text-xs text-[#8B95A1] mt-0.5 leading-relaxed">{j.reason}</p>}
                                            {j.description && <p className="text-xs text-[#8B95A1] mt-0.5 leading-relaxed">{j.description}</p>}
                                            {j.requiredNext && Array.isArray(j.requiredNext) && j.requiredNext.length > 0 && (
                                              <div className="mt-1 flex flex-wrap gap-1">
                                                {j.requiredNext.map((r: string, ri: number) => (
                                                  <Badge key={ri} className="bg-blue-50 text-blue-700 border-0 text-[10px] px-1.5 py-0 rounded-md">{r}</Badge>
                                                ))}
                                              </div>
                                            )}
                                            {j.requirements && <p className="text-xs text-[#D97706] mt-0.5">{Array.isArray(j.requirements) ? j.requirements.join(', ') : j.requirements}</p>}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {afterPrep.length > 0 && (
                                    <div>
                                      <p className="text-[11px] font-bold text-[#3182F6] mb-2">준비 후 가능한 직업</p>
                                      <div className="space-y-1.5">
                                        {afterPrep.map((j: any, i: number) => (
                                          <div key={i} className="bg-white/70 rounded-xl p-3">
                                            <p className="text-sm font-medium text-[#191F28]">{typeof j === 'string' ? j : j.role || j.title || j.name || `직업 ${i + 1}`}</p>
                                            {j.reason && typeof j.reason === 'string' && <p className="text-xs text-[#8B95A1] mt-0.5 leading-relaxed">{j.reason}</p>}
                                            {j.missingConditions && Array.isArray(j.missingConditions) && j.missingConditions.length > 0 && (
                                              <div className="mt-1 flex flex-wrap gap-1">
                                                {j.missingConditions.map((c: string, ci: number) => (
                                                  <Badge key={ci} className="bg-amber-50 text-amber-700 border-0 text-[10px] px-1.5 py-0 rounded-md">{c}</Badge>
                                                ))}
                                              </div>
                                            )}
                                            {j.conditions && Array.isArray(j.conditions) && (
                                              <div className="mt-1 flex flex-wrap gap-1">
                                                {j.conditions.map((c: string, ci: number) => (
                                                  <Badge key={ci} className="bg-amber-50 text-amber-700 border-0 text-[10px] px-1.5 py-0 rounded-md">{c}</Badge>
                                                ))}
                                              </div>
                                            )}
                                            {j.howToFill && Array.isArray(j.howToFill) && (
                                              <div className="mt-1">
                                                <p className="text-[10px] text-[#8B95A1] mb-0.5">채우는 방법</p>
                                                <ul className="text-xs text-[#4E5968] space-y-0.5 list-disc list-inside">
                                                  {j.howToFill.map((h: string, hi: number) => <li key={hi}>{h}</li>)}
                                                </ul>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {actPlan && (
                                    <div className="bg-white/70 rounded-xl p-3">
                                      <p className="text-[11px] font-bold text-[#191F28] mb-2">실행 계획</p>
                                      <div className="space-y-2">
                                        {(actPlan.shortTerm || actPlan.short) && (
                                          <div className="flex gap-2">
                                            <Badge className="bg-[#3182F6]/10 text-[#3182F6] border-0 text-[10px] px-2 py-0 shrink-0">단기</Badge>
                                            <p className="text-xs text-[#4E5968] leading-relaxed">{Array.isArray(actPlan.shortTerm || actPlan.short) ? (actPlan.shortTerm || actPlan.short).join(', ') : (actPlan.shortTerm || actPlan.short)}</p>
                                          </div>
                                        )}
                                        {(actPlan.midTerm || actPlan.mid) && (
                                          <div className="flex gap-2">
                                            <Badge className="bg-[#7C3AED]/10 text-[#7C3AED] border-0 text-[10px] px-2 py-0 shrink-0">중기</Badge>
                                            <p className="text-xs text-[#4E5968] leading-relaxed">{Array.isArray(actPlan.midTerm || actPlan.mid) ? (actPlan.midTerm || actPlan.mid).join(', ') : (actPlan.midTerm || actPlan.mid)}</p>
                                          </div>
                                        )}
                                        {(actPlan.longTerm || actPlan.long) && (
                                          <div className="flex gap-2">
                                            <Badge className="bg-[#059669]/10 text-[#059669] border-0 text-[10px] px-2 py-0 shrink-0">장기</Badge>
                                            <p className="text-xs text-[#4E5968] leading-relaxed">{Array.isArray(actPlan.longTerm || actPlan.long) ? (actPlan.longTerm || actPlan.long).join(', ') : (actPlan.longTerm || actPlan.long)}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {foreignData.dataGaps && (
                                    <div className="bg-white/70 rounded-xl p-3">
                                      <p className="text-[11px] font-bold text-[#8B95A1] mb-1">데이터 누락</p>
                                      <p className="text-xs text-[#4E5968] leading-relaxed">{Array.isArray(foreignData.dataGaps) ? foreignData.dataGaps.join(', ') : foreignData.dataGaps}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {allCareers.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-[11px] font-bold text-[#3182F6] uppercase tracking-wider">AI 추천 직업</p>
                                  {allCareers.map((career: any, idx: number) => (
                                    <div key={idx} className="bg-[#F8F9FA] rounded-xl p-4 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-[#3182F6] text-white flex items-center justify-center font-bold text-xs">{idx + 1}</div>
                                          <p className="text-sm font-bold text-[#191F28]">{career.title || career.name || `직업 ${idx + 1}`}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {(career.matchPercentage || career.fitScore) && (
                                            <Badge className="bg-[#3182F6]/10 text-[#3182F6] border-0 text-[11px] font-bold px-2 py-0.5 rounded-lg">
                                              적합도 {career.matchPercentage || career.fitScore}%
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      {career.description && <p className="text-xs text-[#4E5968] leading-relaxed">{career.description}</p>}
                                      {career.reason && <p className="text-xs text-[#4E5968] leading-relaxed">{career.reason}</p>}
                                      {career.fitReasons && (
                                        <div className="text-xs text-[#8B95A1] leading-relaxed">{Array.isArray(career.fitReasons) ? career.fitReasons.join(' / ') : career.fitReasons}</div>
                                      )}
                                      {career.requiredSkills && (
                                        <div className="flex flex-wrap gap-1">
                                          {(Array.isArray(career.requiredSkills) ? career.requiredSkills : [career.requiredSkills]).map((skill: string, si: number) => (
                                            <Badge key={si} className="bg-[#F2F4F6] text-[#4E5968] border-0 text-[10px] px-2 py-0 rounded-md">{skill}</Badge>
                                          ))}
                                        </div>
                                      )}
                                      {career.growthPath && (
                                        <div>
                                          <p className="text-[10px] text-[#8B95A1] mb-0.5">성장 경로</p>
                                          <p className="text-xs text-[#4E5968] leading-relaxed">{Array.isArray(career.growthPath) ? career.growthPath.join(' → ') : career.growthPath}</p>
                                        </div>
                                      )}
                                      {career.salary && (
                                        <p className="text-xs text-[#059669]">예상 연봉: {career.salary}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {!summaryStr && !summaryObj && !st && allCareers.length === 0 && !foreignData && ai && Object.keys(ai).length > 0 && (
                                <div className="bg-[#F8F9FA] rounded-2xl p-4">
                                  <p className="text-[11px] font-bold text-[#3182F6] uppercase tracking-wider mb-2">분석 결과</p>
                                  {renderObjectReadable(ai)}
                                </div>
                              )}
                            </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}

                {detailTab === "essays" && (
                  <div className="p-5 space-y-3">
                    {(!userDetail.essays || userDetail.essays.length === 0) ? (
                      <div className="text-center py-16">
                        <div className="h-14 w-14 mx-auto mb-3 rounded-2xl bg-[#D97706]/5 flex items-center justify-center">
                          <FileText className="h-7 w-7 text-[#D97706]/30" />
                        </div>
                        <p className="text-[#8B95A1] font-medium">작성된 자기소개서가 없습니다.</p>
                      </div>
                    ) : userDetail.essays.map((essay: any) => (
                      <div key={essay.id} className="bg-white rounded-2xl border border-[#F2F4F6] p-5" data-testid={`essay-item-${essay.id}`}>
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <Badge className="bg-[#D97706]/10 text-[#D97706] border-0 text-[11px] font-bold px-2.5 py-0.5 rounded-lg">{essay.profileName || '프로필'}</Badge>
                          {essay.essayType && <Badge className="bg-[#F2F4F6] text-[#4E5968] border-0 text-[11px] px-2 py-0.5 rounded-lg">{essay.essayType}</Badge>}
                          {essay.category && <Badge className="bg-[#F2F4F6] text-[#4E5968] border-0 text-[11px] px-2 py-0.5 rounded-lg">{essay.category}</Badge>}
                          {essay.topic && <Badge className="bg-[#F2F4F6] text-[#4E5968] border-0 text-[11px] px-2 py-0.5 rounded-lg">{essay.topic}</Badge>}
                          {essay.content && <span className="text-[11px] text-[#C4C9D0] ml-auto font-medium">{essay.content.length}자</span>}
                        </div>
                        {essay.title && <p className="text-sm font-bold text-[#191F28] mb-2">{essay.title}</p>}
                        <div className="bg-[#F8F9FA] rounded-xl p-4 max-h-48 overflow-y-auto mb-3" data-testid={`essay-content-${essay.id}`}>
                          <p className="text-sm text-[#4E5968] whitespace-pre-wrap leading-relaxed">{essay.content || '내용 없음'}</p>
                        </div>
                        {essay.aiResult && (
                          <div className="bg-[#EFF6FF] rounded-xl p-4 max-h-32 overflow-y-auto mb-3">
                            <p className="text-[11px] font-bold text-[#3182F6] mb-1.5">AI 결과</p>
                            {typeof essay.aiResult === 'string' ? (
                              <p className="text-xs text-[#191F28] whitespace-pre-wrap leading-relaxed">{essay.aiResult}</p>
                            ) : renderObjectReadable(essay.aiResult)}
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-[#C4C9D0] pt-2 border-t border-[#F2F4F6]">
                          {essay.draftVersion && <span className="bg-[#F2F4F6] px-2 py-0.5 rounded-md">v{essay.draftVersion}</span>}
                          <span>생성 {essay.createdAt ? new Date(essay.createdAt).toLocaleDateString('ko-KR') : '-'}</span>
                          {essay.updatedAt && <span>수정 {new Date(essay.updatedAt).toLocaleDateString('ko-KR')}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {detailTab === "kompass" && (
                  <div className="p-5 space-y-3">
                    {(!userDetail.kompass || userDetail.kompass.length === 0) ? (
                      <div className="text-center py-16">
                        <div className="h-14 w-14 mx-auto mb-3 rounded-2xl bg-[#7C3AED]/5 flex items-center justify-center">
                          <Target className="h-7 w-7 text-[#7C3AED]/30" />
                        </div>
                        <p className="text-[#8B95A1] font-medium">등록된 목표가 없습니다.</p>
                      </div>
                    ) : userDetail.kompass.map((goal: any) => {
                      const isExpanded = expandedItems.has(`kompass-${goal.id}`);
                      return (
                        <div key={goal.id} className="bg-white rounded-2xl border border-[#F2F4F6] hover:border-[#7C3AED]/20 hover:shadow-md transition-all duration-200" data-testid={`kompass-item-${goal.id}`}>
                          <button
                            className="w-full px-5 py-4 flex items-center justify-between text-left"
                            onClick={() => toggleExpanded(`kompass-${goal.id}`)}
                            data-testid={`button-expand-kompass-${goal.id}`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className="bg-[#7C3AED]/10 text-[#7C3AED] border-0 text-[11px] font-bold px-2.5 py-0.5 rounded-lg">{goal.profileName || '프로필'}</Badge>
                                {goal.level && <Badge className="bg-[#F2F4F6] text-[#4E5968] border-0 text-[11px] px-2 py-0.5 rounded-lg">{goal.level}</Badge>}
                                {goal.targetYear && <Badge className="bg-[#F2F4F6] text-[#4E5968] border-0 text-[11px] px-2 py-0.5 rounded-lg">{goal.targetYear}년</Badge>}
                              </div>
                              <p className="font-bold text-[#191F28]">{goal.title || '제목 없음'}</p>
                              {goal.progress !== undefined && goal.progress !== null && (
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-1.5 bg-[#F2F4F6] rounded-full overflow-hidden">
                                    <div className="h-full bg-[#7C3AED] rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
                                  </div>
                                  <span className="text-[11px] font-medium text-[#7C3AED]">{goal.progress}%</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-xs text-[#C4C9D0] text-right space-y-0.5">
                                {goal.startDate && <p>시작 {new Date(goal.startDate).toLocaleDateString('ko-KR')}</p>}
                                {goal.endDate && <p>종료 {new Date(goal.endDate).toLocaleDateString('ko-KR')}</p>}
                              </div>
                              <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-[#7C3AED]/10' : 'bg-[#F2F4F6]'}`}>
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-[#7C3AED]" /> : <ChevronDown className="h-4 w-4 text-[#8B95A1]" />}
                              </div>
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="px-5 pb-5 space-y-3 border-t border-[#F2F4F6] pt-4" data-testid={`kompass-detail-${goal.id}`}>
                              {goal.visionData && (
                                <div>
                                  <p className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider mb-2">비전 데이터</p>
                                  <div className="bg-[#F8F9FA] rounded-xl p-4 max-h-48 overflow-y-auto">
                                    {typeof goal.visionData === 'string' ? (
                                      <p className="text-xs text-[#191F28] whitespace-pre-wrap leading-relaxed">{goal.visionData}</p>
                                    ) : renderObjectReadable(goal.visionData)}
                                  </div>
                                </div>
                              )}
                              {goal.aiResult && (
                                <div>
                                  <p className="text-[11px] font-bold text-[#3182F6] uppercase tracking-wider mb-2">AI 결과</p>
                                  <div className="bg-[#EFF6FF] rounded-xl p-4 max-h-32 overflow-y-auto">
                                    {typeof goal.aiResult === 'string' ? (
                                      <p className="text-xs text-[#191F28] whitespace-pre-wrap leading-relaxed">{goal.aiResult}</p>
                                    ) : renderObjectReadable(goal.aiResult)}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {detailTab === "interviews" && (
                  <div className="p-5 space-y-3">
                    {(!userDetail.interviews || userDetail.interviews.length === 0) ? (
                      <div className="text-center py-16">
                        <div className="h-14 w-14 mx-auto mb-3 rounded-2xl bg-[#EC4899]/5 flex items-center justify-center">
                          <Mic className="h-7 w-7 text-[#EC4899]/30" />
                        </div>
                        <p className="text-[#8B95A1] font-medium">면접 기록이 없습니다.</p>
                      </div>
                    ) : userDetail.interviews.map((interview: any) => (
                      <div key={interview.id} className="bg-white rounded-2xl border border-[#F2F4F6] p-5" data-testid={`interview-item-${interview.id}`}>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {interview.sessionType && <Badge className="bg-[#EC4899]/10 text-[#EC4899] border-0 text-[11px] font-bold px-2.5 py-0.5 rounded-lg">{interview.sessionType}</Badge>}
                              <Badge className={`border-0 text-[11px] font-bold px-2.5 py-0.5 rounded-lg ${interview.status === 'completed' ? 'bg-[#059669]/10 text-[#059669]' : interview.status === 'in_progress' ? 'bg-[#3182F6]/10 text-[#3182F6]' : 'bg-[#F2F4F6] text-[#8B95A1]'}`}>
                                {interview.status === 'completed' ? '완료' : interview.status === 'in_progress' ? '진행 중' : interview.status || '대기'}
                              </Badge>
                            </div>
                            {interview.jobTitle && <p className="text-sm font-bold text-[#191F28]">{interview.jobTitle}</p>}
                            {interview.companyName && <p className="text-xs text-[#8B95A1]">{interview.companyName}</p>}
                            <div className="flex items-center gap-2">
                              <div className="bg-[#F2F4F6] rounded-lg px-2.5 py-1">
                                <span className="text-[11px] font-medium text-[#4E5968]">질문 {interview.totalQuestions || 0}개</span>
                              </div>
                              {interview.completedQuestions && (
                                <div className="bg-[#059669]/10 rounded-lg px-2.5 py-1">
                                  <span className="text-[11px] font-medium text-[#059669]">완료 {interview.completedQuestions}개</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-[11px] text-[#C4C9D0] text-right ml-4 space-y-0.5">
                            <p>생성 {interview.createdAt ? new Date(interview.createdAt).toLocaleDateString('ko-KR') : '-'}</p>
                            {interview.completedAt && <p>완료 {new Date(interview.completedAt).toLocaleDateString('ko-KR')}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {detailTab === "assessments" && (
                  <div className="p-5 space-y-3">
                    {(!userDetail.assessments || userDetail.assessments.length === 0) ? (
                      <div className="text-center py-16">
                        <div className="h-14 w-14 mx-auto mb-3 rounded-2xl bg-[#6B7280]/5 flex items-center justify-center">
                          <ClipboardList className="h-7 w-7 text-[#6B7280]/30" />
                        </div>
                        <p className="text-[#8B95A1] font-medium">진로진단 기록이 없습니다.</p>
                      </div>
                    ) : userDetail.assessments.map((assessment: any) => {
                      const isExpanded = expandedItems.has(`assessment-${assessment.id}`);
                      return (
                        <div key={assessment.id} className="bg-white rounded-2xl border border-[#F2F4F6] hover:border-[#6B7280]/20 hover:shadow-md transition-all duration-200" data-testid={`assessment-item-${assessment.id}`}>
                          <button
                            className="w-full px-5 py-4 flex items-center justify-between text-left"
                            onClick={() => toggleExpanded(`assessment-${assessment.id}`)}
                            data-testid={`button-expand-assessment-${assessment.id}`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`border-0 text-[11px] font-bold px-2.5 py-0.5 rounded-lg ${assessment.status === 'completed' ? 'bg-[#059669]/10 text-[#059669]' : assessment.status === 'in_progress' ? 'bg-[#3182F6]/10 text-[#3182F6]' : 'bg-[#F2F4F6] text-[#8B95A1]'}`}>
                                  {assessment.status === 'completed' ? '완료' : assessment.status === 'in_progress' ? '진행 중' : assessment.status || '대기'}
                                </Badge>
                                {assessment.profileType && <Badge className="bg-[#6B7280]/10 text-[#6B7280] border-0 text-[11px] font-bold px-2.5 py-0.5 rounded-lg">{assessment.profileType}</Badge>}
                              </div>
                              {assessment.careerDna && <p className="text-sm font-bold text-[#191F28]">Career DNA: {assessment.careerDna}</p>}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-[11px] text-[#C4C9D0] text-right space-y-0.5">
                                <p>생성 {assessment.createdAt ? new Date(assessment.createdAt).toLocaleDateString('ko-KR') : '-'}</p>
                                {assessment.completedAt && <p>완료 {new Date(assessment.completedAt).toLocaleDateString('ko-KR')}</p>}
                              </div>
                              <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-[#6B7280]/10' : 'bg-[#F2F4F6]'}`}>
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-[#6B7280]" /> : <ChevronDown className="h-4 w-4 text-[#8B95A1]" />}
                              </div>
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="px-5 pb-5 space-y-4 border-t border-[#F2F4F6] pt-4" data-testid={`assessment-detail-${assessment.id}`}>
                              {assessment.careerDna && renderFieldSection('Career DNA', [{ label: '유형', value: assessment.careerDna }])}
                              {assessment.scores && (
                                <div>
                                  <p className="text-[11px] font-bold text-[#3182F6] uppercase tracking-wider mb-2">점수</p>
                                  <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(assessment.scores as Record<string, any>).map(([k, v]) => (
                                      <div key={k} className="bg-[#F8F9FA] rounded-xl p-3 text-center">
                                        <p className="text-[10px] text-[#8B95A1] font-medium">{k}</p>
                                        <p className="text-sm font-bold text-[#191F28]">{String(v)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {assessment.keywords && (
                                <div>
                                  <p className="text-[11px] font-bold text-[#3182F6] uppercase tracking-wider mb-2">키워드</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(Array.isArray(assessment.keywords) ? assessment.keywords : []).map((kw: string, i: number) => (
                                      <Badge key={i} className="bg-[#F2F4F6] text-[#4E5968] border-0 text-[11px] px-2.5 py-0.5 rounded-lg">{kw}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {assessment.recommendedJobs && (
                                <div>
                                  <p className="text-[11px] font-bold text-[#3182F6] uppercase tracking-wider mb-2">추천 직업</p>
                                  <div className="space-y-1.5">
                                    {(Array.isArray(assessment.recommendedJobs) ? assessment.recommendedJobs : []).map((job: any, i: number) => (
                                      <div key={i} className="bg-[#F8F9FA] rounded-xl p-3">
                                        <p className="text-sm font-medium text-[#191F28]">{typeof job === 'string' ? job : job.title || job.name || Object.values(job).filter(v => typeof v === 'string').join(', ') || '-'}</p>
                                        {job.matchScore && <p className="text-xs font-medium text-[#059669] mt-0.5">매칭: {job.matchScore}</p>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {assessment.growthPlan && (
                                <div>
                                  <p className="text-[11px] font-bold text-[#3182F6] uppercase tracking-wider mb-2">성장 계획</p>
                                  <div className="bg-[#F8F9FA] rounded-xl p-4 max-h-32 overflow-y-auto">
                                    {typeof assessment.growthPlan === 'string' ? (
                                      <p className="text-xs text-[#191F28] whitespace-pre-wrap leading-relaxed">{assessment.growthPlan}</p>
                                    ) : renderObjectReadable(assessment.growthPlan)}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>);
            })()
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
