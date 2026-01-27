import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ChevronDown,
  ChevronUp,
  Star,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
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
  international_university: Globe,
  international: Globe,
  university: GraduationCap,
  high: School,
  middle: BookOpen,
  elementary: Backpack,
};

const profileTypeLabels: Record<string, string> = {
  general: "구직자",
  international_university: "외국인유학생",
  international: "외국인유학생",
  university: "대학생",
  high: "고등학생",
  middle: "중학생",
  elementary: "초등학생",
};

export default function GroupMemberDetail() {
  const params = useParams<{ groupId: string; memberId: string }>();
  const { groupId, memberId } = params;
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    strengths: true,
    weaknesses: true,
    recommendations: true,
  });

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

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </>
    );
  }

  if (!member) {
    return (
      <>
        <div className="p-6 text-center">
          <p className="text-gray-500">멤버 정보를 찾을 수 없습니다</p>
        </div>
      </>
    );
  }

  const ProfileIcon = member.profile?.profileType
    ? profileTypeIcons[member.profile.profileType] || User
    : User;

  // Parse analysis result
  const analysisResult = member.analysis?.analysisResult;
  const hasDetailedAnalysis = analysisResult && typeof analysisResult === "object";

  // Handle foreignStudentData structure (international profile type)
  const foreignStudentData = analysisResult?.foreignStudentData;
  const isForeignStudentAnalysis = !!foreignStudentData;

  // Extract common analysis fields - handle both regular and foreignStudent structures
  const overview = analysisResult?.overview || {};
  const strengths = analysisResult?.strengths || analysisResult?.강점 || [];
  const weaknesses = analysisResult?.weaknesses || analysisResult?.약점 || analysisResult?.개선점 || [];
  
  // For foreignStudent, recommendations are nested differently
  const recommendations = foreignStudentData?.recommendations || 
                          analysisResult?.recommendations || 
                          analysisResult?.추천 || 
                          analysisResult?.career_recommendations || [];
  
  // Summary extraction
  const summary = foreignStudentData?.summary?.oneLine || 
                  overview?.summary || 
                  analysisResult?.summary || 
                  analysisResult?.요약 || 
                  null;
  
  // Foreign student specific data
  const fitScore = foreignStudentData?.fit?.score;
  const fitReasons = foreignStudentData?.fit?.reasons || [];
  const visaWarning = foreignStudentData?.visaWarning;
  const dataGaps = foreignStudentData?.dataGaps || [];
  const actionPlan = foreignStudentData?.actionPlan;
  const readyNowJobs = foreignStudentData?.recommendations?.readyNow || [];
  const afterPrepJobs = foreignStudentData?.recommendations?.afterPrep || [];
  
  const careerSuggestions = analysisResult?.careerSuggestions || analysisResult?.career_suggestions || [];
  const skillAnalysis = analysisResult?.skillAnalysis || analysisResult?.skill_analysis || null;
  const personalityTraits = analysisResult?.personalityTraits || analysisResult?.personality || [];

  return (
    <>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
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
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-xl" data-testid="text-member-name">
                    {member.user.displayName || member.user.email.split("@")[0]}
                  </CardTitle>
                  {member.profile?.profileType && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <ProfileIcon className="h-3 w-3" />
                      {profileTypeLabels[member.profile.profileType] || member.profile.profileType}
                    </Badge>
                  )}
                </div>
                <p className="text-gray-500">{member.user.email}</p>
                <p className="text-sm text-gray-400">
                  가입일: {format(new Date(member.user.createdAt), "yyyy년 M월 d일", { locale: ko })}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Badge variant={member.profile ? "default" : "outline"} className="justify-center">
                  프로필 {member.profile ? "완료" : "미작성"}
                </Badge>
                <Badge variant={member.analysis ? "default" : "outline"} className="justify-center">
                  분석 {member.analysis ? "완료" : "미완료"}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">개요</TabsTrigger>
            <TabsTrigger value="analysis" data-testid="tab-analysis" disabled={!member.analysis}>
              분석 결과
            </TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">활동</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
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
                          {format(new Date(member.analysis.createdAt), "yyyy.M.d HH:mm", { locale: ko })}
                        </span>
                      </div>
                      {summary && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-gray-600 line-clamp-3">{summary}</p>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setActiveTab("analysis")}
                        data-testid="button-view-full-analysis"
                      >
                        상세 분석 보기
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <XCircle className="h-4 w-4" />
                      <span>커리어 분석이 아직 진행되지 않았습니다</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
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
                      {member.goals.slice(0, 5).map((goal) => (
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
                      {member.goals.length > 5 && (
                        <p className="text-sm text-gray-500 text-center pt-2">
                          +{member.goals.length - 5}개 더 있음
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
                      {member.essays.slice(0, 5).map((essay) => (
                        <div key={essay.id} className="flex items-center justify-between">
                          <span className="text-sm truncate flex-1 mr-2">{essay.title || "제목 없음"}</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(essay.createdAt), "M.d", { locale: ko })}
                          </span>
                        </div>
                      ))}
                      {member.essays.length > 5 && (
                        <p className="text-sm text-gray-500 text-center pt-2">
                          +{member.essays.length - 5}개 더 있음
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
          </TabsContent>

          <TabsContent value="analysis" className="mt-6 space-y-6">
            {member.analysis && hasDetailedAnalysis ? (
              <>
                {summary && (
                  <Card data-testid="card-analysis-summary">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        분석 요약
                        {fitScore !== undefined && (
                          <Badge variant="secondary" className="ml-2">
                            적합도 {fitScore}점
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed">{summary}</p>
                    </CardContent>
                  </Card>
                )}

                {visaWarning && (
                  <Card data-testid="card-visa-warning" className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-700">
                        <AlertTriangle className="h-5 w-5" />
                        비자 관련 안내
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-orange-800">{visaWarning}</p>
                    </CardContent>
                  </Card>
                )}

                {fitReasons.length > 0 && (
                  <Card data-testid="card-fit-analysis">
                    <CardHeader className="cursor-pointer" onClick={() => toggleSection("fitReasons")}>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-blue-500" />
                          적합도 분석
                          <Badge variant="secondary">{fitReasons.length}개 항목</Badge>
                        </div>
                        {expandedSections.fitReasons ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    {expandedSections.fitReasons !== false && (
                      <CardContent>
                        <ul className="space-y-3">
                          {fitReasons.map((reason: any, index: number) => (
                            <li 
                              key={index} 
                              className={`flex gap-3 p-3 rounded-lg ${
                                reason.impact === 'positive' ? 'bg-green-50' :
                                reason.impact === 'negative' ? 'bg-red-50' : 'bg-gray-50'
                              }`}
                            >
                              {reason.impact === 'positive' ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                              ) : reason.impact === 'negative' ? (
                                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900">{reason.field}</span>
                                  <Badge variant="outline" className="text-xs">{reason.value}</Badge>
                                </div>
                                <p className="text-sm text-gray-600">{reason.note}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    )}
                  </Card>
                )}

                {readyNowJobs.length > 0 && (
                  <Card data-testid="card-ready-now-jobs">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        지금 바로 지원 가능한 직무
                        <Badge variant="default" className="bg-green-500">{readyNowJobs.length}개</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {readyNowJobs.map((job: any, index: number) => (
                          <div key={index} className="p-4 bg-green-50 rounded-lg">
                            <p className="font-semibold text-green-800 mb-2">{job.role}</p>
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">추천 이유:</p>
                                <ul className="list-disc list-inside text-sm text-gray-700">
                                  {job.reasons?.map((r: string, i: number) => (
                                    <li key={i}>{r}</li>
                                  ))}
                                </ul>
                              </div>
                              {job.requiredNext && job.requiredNext.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-green-200">
                                  <p className="text-xs text-gray-500 mb-1">준비 사항:</p>
                                  <ul className="list-disc list-inside text-sm text-gray-600">
                                    {job.requiredNext.map((r: string, i: number) => (
                                      <li key={i}>{r}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {afterPrepJobs.length > 0 && (
                  <Card data-testid="card-after-prep-jobs">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-500" />
                        준비 후 도전 가능한 직무
                        <Badge variant="secondary">{afterPrepJobs.length}개</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {afterPrepJobs.map((job: any, index: number) => (
                          <div key={index} className="p-4 bg-blue-50 rounded-lg">
                            <p className="font-semibold text-blue-800 mb-2">{job.role}</p>
                            {job.missingConditions && job.missingConditions.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs text-gray-500 mb-1">필요 조건:</p>
                                <ul className="list-disc list-inside text-sm text-red-600">
                                  {job.missingConditions.map((c: string, i: number) => (
                                    <li key={i}>{c}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {job.howToFill && job.howToFill.length > 0 && (
                              <div className="pt-2 border-t border-blue-200">
                                <p className="text-xs text-gray-500 mb-1">준비 방법:</p>
                                <ul className="list-disc list-inside text-sm text-gray-700">
                                  {job.howToFill.map((h: string, i: number) => (
                                    <li key={i}>{h}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {actionPlan && (
                  <Card data-testid="card-action-plan">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-500" />
                        실행 계획
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        {actionPlan.shortTerm && actionPlan.shortTerm.length > 0 && (
                          <div className="p-4 bg-green-50 rounded-lg">
                            <p className="font-semibold text-green-800 mb-2">단기 (1-3개월)</p>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {actionPlan.shortTerm.slice(0, 5).map((item: string, i: number) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {actionPlan.midTerm && actionPlan.midTerm.length > 0 && (
                          <div className="p-4 bg-yellow-50 rounded-lg">
                            <p className="font-semibold text-yellow-800 mb-2">중기 (3-6개월)</p>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {actionPlan.midTerm.slice(0, 5).map((item: string, i: number) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {actionPlan.longTerm && actionPlan.longTerm.length > 0 && (
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="font-semibold text-blue-800 mb-2">장기 (6개월 이상)</p>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {actionPlan.longTerm.slice(0, 5).map((item: string, i: number) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {dataGaps.length > 0 && (
                  <Card data-testid="card-data-gaps">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        추가 정보 필요
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {dataGaps.map((gap: string, i: number) => (
                          <li key={i}>{gap}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {Array.isArray(strengths) && strengths.length > 0 && (
                  <Card data-testid="card-strengths">
                    <CardHeader className="cursor-pointer" onClick={() => toggleSection("strengths")}>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-500" />
                          강점
                          <Badge variant="secondary">{strengths.length}개</Badge>
                        </div>
                        {expandedSections.strengths ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    {expandedSections.strengths && (
                      <CardContent>
                        <ul className="space-y-3">
                          {strengths.map((item: any, index: number) => (
                            <li key={index} className="flex gap-3 p-3 bg-green-50 rounded-lg">
                              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                              <span className="text-gray-700">
                                {typeof item === "string" ? item : item.description || item.title || JSON.stringify(item)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    )}
                  </Card>
                )}

                {Array.isArray(weaknesses) && weaknesses.length > 0 && (
                  <Card data-testid="card-weaknesses">
                    <CardHeader className="cursor-pointer" onClick={() => toggleSection("weaknesses")}>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          개선점
                          <Badge variant="secondary">{weaknesses.length}개</Badge>
                        </div>
                        {expandedSections.weaknesses ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    {expandedSections.weaknesses && (
                      <CardContent>
                        <ul className="space-y-3">
                          {weaknesses.map((item: any, index: number) => (
                            <li key={index} className="flex gap-3 p-3 bg-orange-50 rounded-lg">
                              <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                              <span className="text-gray-700">
                                {typeof item === "string" ? item : item.description || item.title || JSON.stringify(item)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    )}
                  </Card>
                )}

                {Array.isArray(recommendations) && recommendations.length > 0 && (
                  <Card data-testid="card-recommendations">
                    <CardHeader className="cursor-pointer" onClick={() => toggleSection("recommendations")}>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-blue-500" />
                          추천사항
                          <Badge variant="secondary">{recommendations.length}개</Badge>
                        </div>
                        {expandedSections.recommendations ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    {expandedSections.recommendations && (
                      <CardContent>
                        <ul className="space-y-3">
                          {recommendations.map((item: any, index: number) => (
                            <li key={index} className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                              <Lightbulb className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <span className="text-gray-700">
                                  {typeof item === "string" ? item : item.description || item.title || item.recommendation || JSON.stringify(item)}
                                </span>
                                {item.reason && (
                                  <p className="text-sm text-gray-500 mt-1">{item.reason}</p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    )}
                  </Card>
                )}

                {Array.isArray(careerSuggestions) && careerSuggestions.length > 0 && (
                  <Card data-testid="card-career-suggestions">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-purple-500" />
                        추천 직업
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {careerSuggestions.map((career: any, index: number) => (
                          <div key={index} className="p-4 bg-purple-50 rounded-lg">
                            <p className="font-medium text-gray-900">
                              {typeof career === "string" ? career : career.title || career.name || JSON.stringify(career)}
                            </p>
                            {career.match_score && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm text-gray-500">적합도:</span>
                                <Badge variant="secondary">{career.match_score}%</Badge>
                              </div>
                            )}
                            {career.reason && (
                              <p className="text-sm text-gray-600 mt-2">{career.reason}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {Array.isArray(personalityTraits) && personalityTraits.length > 0 && (
                  <Card data-testid="card-personality">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-indigo-500" />
                        성격 특성
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {personalityTraits.map((trait: any, index: number) => (
                          <Badge key={index} variant="outline" className="px-3 py-1">
                            {typeof trait === "string" ? trait : trait.name || trait.trait || JSON.stringify(trait)}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {skillAnalysis && (
                  <Card data-testid="card-skills">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-teal-500" />
                        역량 분석
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {typeof skillAnalysis === "object" ? (
                        <div className="space-y-3">
                          {Object.entries(skillAnalysis).map(([skill, value]: [string, any]) => (
                            <div key={skill} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{skill}</span>
                                <span className="text-gray-500">
                                  {typeof value === "number" ? `${value}%` : value}
                                </span>
                              </div>
                              {typeof value === "number" && (
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-teal-500 rounded-full"
                                    style={{ width: `${Math.min(100, value)}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-700">{String(skillAnalysis)}</p>
                      )}
                    </CardContent>
                  </Card>
                )}

              </>
            ) : member.analysis ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>분석 결과 데이터가 없습니다</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>아직 커리어 분석이 진행되지 않았습니다</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-6 space-y-6">
            <Card data-testid="card-activity-timeline">
              <CardHeader>
                <CardTitle>활동 타임라인</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {member.user.createdAt && (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">회원 가입</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(member.user.createdAt), "yyyy년 M월 d일", { locale: ko })}
                        </p>
                      </div>
                    </div>
                  )}
                  {member.profile?.createdAt && (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <ProfileIcon className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">프로필 작성</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(member.profile.createdAt), "yyyy년 M월 d일", { locale: ko })}
                        </p>
                      </div>
                    </div>
                  )}
                  {member.analysis?.createdAt && (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">커리어 분석 완료</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(member.analysis.createdAt), "yyyy년 M월 d일", { locale: ko })}
                        </p>
                      </div>
                    </div>
                  )}
                  {member.goals.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Target className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">목표 {member.goals.length}개 설정</p>
                        <p className="text-sm text-gray-500">진행률: 평균 {Math.round(member.goals.reduce((sum, g) => sum + g.progress, 0) / member.goals.length)}%</p>
                      </div>
                    </div>
                  )}
                  {member.essays.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-pink-600" />
                      </div>
                      <div>
                        <p className="font-medium">자기소개서 {member.essays.length}개 작성</p>
                        <p className="text-sm text-gray-500">
                          최근: {member.essays[0]?.title || "제목 없음"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
