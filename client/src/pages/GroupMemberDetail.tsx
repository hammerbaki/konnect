import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  User,
  FileText,
  Target,
  CheckCircle2,
  XCircle,
  Calendar,
  Briefcase,
  GraduationCap,
  Globe,
  School,
  BookOpen,
  Backpack,
} from "lucide-react";
import { getAuthHeaders } from "@/lib/queryClient";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface MemberDetail {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    profileImageUrl: string | null;
    createdAt: string;
  };
  profile: {
    id: string;
    profileType: string;
    name: string | null;
    createdAt: string;
    updatedAt: string | null;
  } | null;
  analysis: {
    id: string;
    status: string;
    createdAt: string;
    analysisResult: any;
  } | null;
  goals: Array<{
    id: string;
    title: string;
    status: string;
    progress: number;
  }>;
  essays: Array<{
    id: string;
    title: string | null;
    createdAt: string;
  }>;
}

const profileTypeIcons: Record<string, typeof Briefcase> = {
  general: Briefcase,
  international: Globe,
  university: GraduationCap,
  high: School,
  middle: BookOpen,
  elementary: Backpack,
};

const profileTypeLabels: Record<string, string> = {
  general: "구직자",
  international: "외국인유학생",
  university: "대학생",
  high: "고등학생",
  middle: "중학생",
  elementary: "초등학생",
};

export default function GroupMemberDetail() {
  const params = useParams<{ groupId: string; memberId: string }>();
  const { groupId, memberId } = params;

  const { data: member, isLoading } = useQuery<MemberDetail>({
    queryKey: ["group-member-detail", groupId, memberId],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/groups/${groupId}/members/${memberId}/detail`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch member detail");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </Layout>
    );
  }

  if (!member) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <p className="text-gray-500">멤버 정보를 찾을 수 없습니다</p>
        </div>
      </Layout>
    );
  }

  const ProfileIcon = member.profile?.profileType
    ? profileTypeIcons[member.profile.profileType] || User
    : User;

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/group/${groupId}`}>
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              돌아가기
            </Button>
          </Link>
        </div>

        <Card data-testid="card-member-info">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {member.user.profileImageUrl ? (
                  <img src={member.user.profileImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-gray-500" />
                )}
              </div>
              <div>
                <CardTitle className="text-xl" data-testid="text-member-name">
                  {member.user.displayName || member.user.email.split("@")[0]}
                </CardTitle>
                <p className="text-gray-500">{member.user.email}</p>
                <p className="text-sm text-gray-400">
                  가입일: {format(new Date(member.user.createdAt), "yyyy년 M월 d일", { locale: ko })}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card data-testid="card-profile-status">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ProfileIcon className="h-5 w-5" />
                프로필 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              {member.profile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">프로필 유형</span>
                    <Badge variant="secondary">
                      {profileTypeLabels[member.profile.profileType] || member.profile.profileType}
                    </Badge>
                  </div>
                  {member.profile.name && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">이름</span>
                      <span className="font-medium">{member.profile.name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">작성일</span>
                    <span className="text-sm">
                      {format(new Date(member.profile.createdAt), "yyyy.M.d", { locale: ko })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-medium">프로필 작성 완료</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <XCircle className="h-4 w-4" />
                  <span>프로필이 아직 작성되지 않았습니다</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-analysis-status">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                커리어 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              {member.analysis ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">분석 상태</span>
                    <Badge variant={member.analysis.status === "completed" ? "default" : "secondary"}>
                      {member.analysis.status === "completed" ? "완료" : "진행중"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">분석일</span>
                    <span className="text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(member.analysis.createdAt), "yyyy.M.d", { locale: ko })}
                    </span>
                  </div>
                  {member.analysis.status === "completed" && member.analysis.analysisResult && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {typeof member.analysis.analysisResult === "object"
                          ? member.analysis.analysisResult.overview?.summary ||
                            member.analysis.analysisResult.summary ||
                            "분석 결과가 있습니다"
                          : "분석 결과가 있습니다"}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <XCircle className="h-4 w-4" />
                  <span>커리어 분석이 아직 진행되지 않았습니다</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-goals-status">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5" />
                목표 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              {member.goals.length > 0 ? (
                <div className="space-y-3">
                  {member.goals.slice(0, 3).map((goal) => (
                    <div key={goal.id} className="flex items-center justify-between">
                      <span className="text-sm truncate flex-1 mr-2">{goal.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{goal.progress}%</span>
                        <Badge variant={goal.status === "completed" ? "default" : "outline"} className="text-xs">
                          {goal.status === "completed" ? "완료" : "진행중"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {member.goals.length > 3 && (
                    <p className="text-sm text-gray-500 text-center pt-2">
                      +{member.goals.length - 3}개 더 있음
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <XCircle className="h-4 w-4" />
                  <span>설정된 목표가 없습니다</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-essays-status">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                자기소개서
              </CardTitle>
            </CardHeader>
            <CardContent>
              {member.essays.length > 0 ? (
                <div className="space-y-3">
                  {member.essays.slice(0, 3).map((essay) => (
                    <div key={essay.id} className="flex items-center justify-between">
                      <span className="text-sm truncate flex-1 mr-2">{essay.title || "제목 없음"}</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(essay.createdAt), "M.d", { locale: ko })}
                      </span>
                    </div>
                  ))}
                  {member.essays.length > 3 && (
                    <p className="text-sm text-gray-500 text-center pt-2">
                      +{member.essays.length - 3}개 더 있음
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <XCircle className="h-4 w-4" />
                  <span>작성된 자기소개서가 없습니다</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
