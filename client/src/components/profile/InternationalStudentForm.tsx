import { memo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Globe, Plane, Briefcase, GraduationCap, Languages, 
  Wrench, FileText, Info, CheckCircle, Plus, Edit2, Trash2, Building2
} from "lucide-react";
import { ProfileFormProps, IntlEducationItem, IntlWorkExperienceItem } from "./types";

const VISA_TYPE_OPTIONS = [
  { value: "D-2", label: "D-2 (유학)" },
  { value: "D-4", label: "D-4 (어학연수)" },
  { value: "D-10", label: "D-10 (구직)" },
  { value: "F-2", label: "F-2 (거주)" },
  { value: "F-5", label: "F-5 (영주)" },
  { value: "E-7", label: "E-7 (특정활동)" },
  { value: "other", label: "기타" },
];

const WORK_TYPE_OPTIONS = [
  { value: "fulltime", label: "정규직" },
  { value: "contract", label: "계약직" },
  { value: "intern", label: "인턴" },
  { value: "parttime", label: "아르바이트" },
];

const EXPERIENCE_STATUS_OPTIONS = [
  { value: "newcomer", label: "신입" },
  { value: "experienced", label: "경력" },
  { value: "none", label: "관련 경력 없음" },
];

const LANGUAGE_LEVEL_OPTIONS = [
  { value: "advanced", label: "상 (Advanced)" },
  { value: "intermediate", label: "중 (Intermediate)" },
  { value: "beginner", label: "하 (Beginner)" },
];

const TOPIK_LEVEL_OPTIONS = [
  { value: "", label: "선택 안함" },
  { value: "1", label: "1급" },
  { value: "2", label: "2급" },
  { value: "3", label: "3급" },
  { value: "4", label: "4급" },
  { value: "5", label: "5급" },
  { value: "6", label: "6급" },
];

const DEGREE_OPTIONS = [
  { value: "bachelor", label: "학사" },
  { value: "master", label: "석사" },
  { value: "phd", label: "박사" },
  { value: "associate", label: "전문학사" },
  { value: "other", label: "기타" },
];

const ENGLISH_TEST_OPTIONS = [
  { value: "", label: "선택 안함" },
  { value: "TOEIC", label: "TOEIC" },
  { value: "TOEFL", label: "TOEFL" },
  { value: "IELTS", label: "IELTS" },
  { value: "other", label: "기타" },
];

const InternationalStudentFormComponent = ({ profileData, updateField }: ProfileFormProps) => {
  const { toast } = useToast();

  const [showEducationDialog, setShowEducationDialog] = useState(false);
  const [editingEducationId, setEditingEducationId] = useState<number | null>(null);
  const [educationForm, setEducationForm] = useState<Omit<IntlEducationItem, 'id'>>({
    schoolName: '', schoolCountry: '', major: '', degree: 'bachelor', periodStart: '', periodEnd: '', isEnrolled: false
  });

  const [showWorkDialog, setShowWorkDialog] = useState(false);
  const [editingWorkId, setEditingWorkId] = useState<number | null>(null);
  const [workForm, setWorkForm] = useState<Omit<IntlWorkExperienceItem, 'id'>>({
    companyName: '', companyCountry: '', positionAndRole: '', periodStart: '', periodEnd: '', mainTasksAndAchievements: ''
  });

  const resetEducationForm = useCallback(() => {
    setEducationForm({ schoolName: '', schoolCountry: '', major: '', degree: 'bachelor', periodStart: '', periodEnd: '', isEnrolled: false });
    setEditingEducationId(null);
  }, []);

  const addOrUpdateEducation = useCallback(() => {
    if (!educationForm.schoolName || !educationForm.major) {
      toast({ title: "필수 항목을 입력해주세요", description: "학교명과 전공은 필수입니다.", variant: "destructive", duration: 3000 });
      return;
    }
    const edus = profileData.intl_educations || [];
    if (editingEducationId !== null) {
      updateField('intl_educations', edus.map(e => e.id === editingEducationId ? { ...educationForm, id: editingEducationId } : e));
      toast({ title: "학력 정보가 수정되었습니다", duration: 2000 });
    } else {
      updateField('intl_educations', [...edus, { ...educationForm, id: Date.now() }]);
      toast({ title: "학력이 추가되었습니다", duration: 2000 });
    }
    resetEducationForm();
    setShowEducationDialog(false);
  }, [educationForm, editingEducationId, profileData.intl_educations, updateField, toast, resetEducationForm]);

  const editEducation = useCallback((item: IntlEducationItem) => {
    setEducationForm({ schoolName: item.schoolName, schoolCountry: item.schoolCountry, major: item.major, degree: item.degree, periodStart: item.periodStart, periodEnd: item.periodEnd, isEnrolled: item.isEnrolled });
    setEditingEducationId(item.id);
    setShowEducationDialog(true);
  }, []);

  const deleteEducation = useCallback((id: number) => {
    updateField('intl_educations', (profileData.intl_educations || []).filter(e => e.id !== id));
    toast({ title: "학력이 삭제되었습니다", duration: 2000 });
  }, [profileData.intl_educations, updateField, toast]);

  const resetWorkForm = useCallback(() => {
    setWorkForm({ companyName: '', companyCountry: '', positionAndRole: '', periodStart: '', periodEnd: '', mainTasksAndAchievements: '' });
    setEditingWorkId(null);
  }, []);

  const addOrUpdateWork = useCallback(() => {
    if (!workForm.companyName || !workForm.positionAndRole) {
      toast({ title: "필수 항목을 입력해주세요", description: "회사명과 직무는 필수입니다.", variant: "destructive", duration: 3000 });
      return;
    }
    const works = profileData.intl_workExperiences || [];
    if (editingWorkId !== null) {
      updateField('intl_workExperiences', works.map(w => w.id === editingWorkId ? { ...workForm, id: editingWorkId } : w));
      toast({ title: "경력이 수정되었습니다", duration: 2000 });
    } else {
      updateField('intl_workExperiences', [...works, { ...workForm, id: Date.now() }]);
      toast({ title: "경력이 추가되었습니다", duration: 2000 });
    }
    resetWorkForm();
    setShowWorkDialog(false);
  }, [workForm, editingWorkId, profileData.intl_workExperiences, updateField, toast, resetWorkForm]);

  const editWork = useCallback((item: IntlWorkExperienceItem) => {
    setWorkForm({ companyName: item.companyName, companyCountry: item.companyCountry, positionAndRole: item.positionAndRole, periodStart: item.periodStart, periodEnd: item.periodEnd, mainTasksAndAchievements: item.mainTasksAndAchievements });
    setEditingWorkId(item.id);
    setShowWorkDialog(true);
  }, []);

  const deleteWork = useCallback((id: number) => {
    updateField('intl_workExperiences', (profileData.intl_workExperiences || []).filter(w => w.id !== id));
    toast({ title: "경력이 삭제되었습니다", duration: 2000 });
  }, [profileData.intl_workExperiences, updateField, toast]);

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-[#3182F6]" /> 기본 정보 (Basic Information)
          </CardTitle>
          <CardDescription>외국인 유학생 기본 인적사항을 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>국적 (Nationality) *</Label>
              <Input value={profileData.intl_nationality} onChange={(e) => updateField('intl_nationality', e.target.value)} placeholder="예: Vietnam, China, USA" className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-intl-nationality" />
            </div>
            <div className="space-y-2">
              <Label>성별 (Gender)</Label>
              <Select value={profileData.intl_gender || ''} onValueChange={(val) => updateField('intl_gender', val as "male" | "female" | "")}>
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-intl-gender"><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">남성 (Male)</SelectItem>
                  <SelectItem value="female">여성 (Female)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>연락처 (Phone) *</Label>
              <Input value={profileData.intl_phone} onChange={(e) => updateField('intl_phone', e.target.value)} placeholder="010-0000-0000" className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-intl-phone" />
            </div>
            <div className="space-y-2">
              <Label>주소 (Address)</Label>
              <Input value={profileData.intl_address} onChange={(e) => updateField('intl_address', e.target.value)} placeholder="현재 거주지 주소" className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-intl-address" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visa Information */}
      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plane className="h-5 w-5 text-[#00BFA5]" /> 체류 정보 (Visa Information)
          </CardTitle>
          <CardDescription>비자 및 근무 가능 정보를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>현재 비자 유형 *</Label>
              <Select value={profileData.intl_currentVisaType} onValueChange={(val) => updateField('intl_currentVisaType', val)}>
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-intl-visa-type"><SelectValue placeholder="비자 선택" /></SelectTrigger>
                <SelectContent>
                  {VISA_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>비자 만료일</Label>
              <Input type="date" value={profileData.intl_visaExpiryDate} onChange={(e) => updateField('intl_visaExpiryDate', e.target.value)} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-intl-visa-expiry" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>근무 가능 형태</Label>
              <Select value={profileData.intl_availableWorkType} onValueChange={(val) => updateField('intl_availableWorkType', val)}>
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-intl-work-type"><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>
                  {WORK_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>파트타임 가능 시간 (주당)</Label>
              <Input value={profileData.intl_partTimeHoursPerWeek} onChange={(e) => updateField('intl_partTimeHoursPerWeek', e.target.value)} placeholder="예: 20시간 이내" className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-intl-parttime-hours" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Preference */}
      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5 text-[#6366F1]" /> 희망 근무 조건 (Job Preference)
          </CardTitle>
          <CardDescription>희망하는 근무 조건을 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>희망 직무 *</Label>
              <Input value={profileData.intl_desiredPosition} onChange={(e) => updateField('intl_desiredPosition', e.target.value)} placeholder="예: 소프트웨어 개발자, 마케팅 담당" className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-intl-desired-position" />
            </div>
            <div className="space-y-2">
              <Label>희망 근무 지역</Label>
              <Input value={profileData.intl_preferredLocation} onChange={(e) => updateField('intl_preferredLocation', e.target.value)} placeholder="예: 서울, 경기" className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-intl-preferred-location" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>희망 급여</Label>
              <Input value={profileData.intl_expectedSalary} onChange={(e) => updateField('intl_expectedSalary', e.target.value)} placeholder="예: 3,000만원, 협의 가능" className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-intl-expected-salary" />
            </div>
            <div className="space-y-2">
              <Label>근무 가능 시작일</Label>
              <Input type="date" value={profileData.intl_availableStartDate} onChange={(e) => updateField('intl_availableStartDate', e.target.value)} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-intl-available-start" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Education */}
      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="h-5 w-5 text-[#FFB300]" /> 학력 사항 (Education)
          </CardTitle>
          <CardDescription>학력 정보를 입력하세요 (복수 등록 가능)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(profileData.intl_educations || []).map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E8EB] space-y-2" data-testid={`card-intl-education-${item.id}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#191F28]" data-testid={`text-intl-education-school-${item.id}`}>{item.schoolName}</h4>
                    {item.isEnrolled && <Badge variant="outline" className="text-xs border-blue-400 text-blue-600">재학중</Badge>}
                  </div>
                  <p className="text-[#4E5968] text-sm">{item.major} • {DEGREE_OPTIONS.find(o => o.value === item.degree)?.label}</p>
                  <p className="text-[#8B95A1] text-xs">{item.schoolCountry} | {item.periodStart} ~ {item.isEnrolled ? '현재' : item.periodEnd}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-[#3182F6]" onClick={() => editEducation(item)} data-testid={`button-edit-intl-education-${item.id}`}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-[#E44E48]" onClick={() => deleteEducation(item.id)} data-testid={`button-delete-intl-education-${item.id}`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" className="w-full h-12 rounded-xl border-dashed border-[#B0B8C1] text-[#8B95A1] hover:text-[#3182F6] hover:border-[#3182F6] font-bold" onClick={() => { resetEducationForm(); setShowEducationDialog(true); }} data-testid="button-add-intl-education">
            <Plus className="h-5 w-5 mr-2" /> 학력 추가하기
          </Button>
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-[#EC4899]" /> 경력 사항 (Work Experience)
          </CardTitle>
          <CardDescription>경력 정보를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>경력 구분</Label>
            <Select value={profileData.intl_experienceStatus} onValueChange={(val) => updateField('intl_experienceStatus', val)}>
              <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-intl-experience-status"><SelectValue placeholder="선택" /></SelectTrigger>
              <SelectContent>
                {EXPERIENCE_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {(profileData.intl_workExperiences || []).map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E8EB] space-y-2" data-testid={`card-intl-work-${item.id}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-[#191F28]" data-testid={`text-intl-work-company-${item.id}`}>{item.companyName}</h4>
                  <p className="text-[#4E5968] text-sm">{item.positionAndRole}</p>
                  <p className="text-[#8B95A1] text-xs">{item.companyCountry} | {item.periodStart} ~ {item.periodEnd || '현재'}</p>
                  {item.mainTasksAndAchievements && <p className="text-sm text-[#6B7684] mt-1">{item.mainTasksAndAchievements}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-[#3182F6]" onClick={() => editWork(item)} data-testid={`button-edit-intl-work-${item.id}`}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-[#E44E48]" onClick={() => deleteWork(item.id)} data-testid={`button-delete-intl-work-${item.id}`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" className="w-full h-12 rounded-xl border-dashed border-[#B0B8C1] text-[#8B95A1] hover:text-[#3182F6] hover:border-[#3182F6] font-bold" onClick={() => { resetWorkForm(); setShowWorkDialog(true); }} data-testid="button-add-intl-work">
            <Plus className="h-5 w-5 mr-2" /> 경력 추가하기
          </Button>
        </CardContent>
      </Card>

      {/* Language Skills */}
      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Languages className="h-5 w-5 text-[#10B981]" /> 언어 능력 (Language Skills)
          </CardTitle>
          <CardDescription>언어 능력 및 어학 점수를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>모국어 (Native Language)</Label>
              <Input value={profileData.intl_nativeLanguage} onChange={(e) => updateField('intl_nativeLanguage', e.target.value)} placeholder="예: Vietnamese, Chinese" className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-intl-native-language" />
            </div>
            <div className="space-y-2">
              <Label>한국어 수준</Label>
              <Select value={profileData.intl_koreanLevel} onValueChange={(val) => updateField('intl_koreanLevel', val)}>
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-intl-korean-level"><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>
                  {LANGUAGE_LEVEL_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>TOPIK 급수</Label>
              <Select value={profileData.intl_topikLevel} onValueChange={(val) => updateField('intl_topikLevel', val)}>
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-intl-topik-level"><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>
                  {TOPIK_LEVEL_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>영어 수준</Label>
              <Select value={profileData.intl_englishLevel} onValueChange={(val) => updateField('intl_englishLevel', val)}>
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-intl-english-level"><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>
                  {LANGUAGE_LEVEL_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>영어 시험명</Label>
              <Select value={profileData.intl_englishTestName} onValueChange={(val) => updateField('intl_englishTestName', val)}>
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-intl-english-test"><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>
                  {ENGLISH_TEST_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>영어 시험 점수</Label>
              <Input value={profileData.intl_englishTestScore} onChange={(e) => updateField('intl_englishTestScore', e.target.value)} placeholder="예: 850, 7.5" className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-intl-english-score" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>기타 언어</Label>
            <Input value={profileData.intl_otherLanguages} onChange={(e) => updateField('intl_otherLanguages', e.target.value)} placeholder="예: Japanese (중), French (하)" className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-intl-other-languages" />
          </div>
        </CardContent>
      </Card>

      {/* Skills & Competencies */}
      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5 text-[#F59E0B]" /> 보유 역량 및 기술 (Skills & Competencies)
          </CardTitle>
          <CardDescription>직무 관련 기술 및 자격증을 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>직무 관련 기술</Label>
            <Textarea value={profileData.intl_jobRelatedSkills} onChange={(e) => updateField('intl_jobRelatedSkills', e.target.value)} placeholder="예: Python, React, 데이터 분석, 마케팅 기획" className="min-h-[80px] rounded-xl bg-[#F2F4F6] border-none resize-none" data-testid="textarea-intl-job-skills" />
          </div>
          <div className="space-y-2">
            <Label>컴퓨터/IT 활용 능력</Label>
            <Textarea value={profileData.intl_computerItSkills} onChange={(e) => updateField('intl_computerItSkills', e.target.value)} placeholder="예: MS Office, Photoshop, SAP, Excel 고급" className="min-h-[80px] rounded-xl bg-[#F2F4F6] border-none resize-none" data-testid="textarea-intl-it-skills" />
          </div>
          <div className="space-y-2">
            <Label>자격증</Label>
            <Textarea value={profileData.intl_certificates} onChange={(e) => updateField('intl_certificates', e.target.value)} placeholder="예: 정보처리기사, SQLD, AWS Certified" className="min-h-[80px] rounded-xl bg-[#F2F4F6] border-none resize-none" data-testid="textarea-intl-certificates" />
          </div>
        </CardContent>
      </Card>

      {/* Self Introduction */}
      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-[#8B5CF6]" /> 자기소개 (Short Introduction)
          </CardTitle>
          <CardDescription>간단한 자기소개를 작성하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>한국 취업을 희망하는 이유</Label>
            <Textarea value={profileData.intl_reasonForKoreaEmployment} onChange={(e) => updateField('intl_reasonForKoreaEmployment', e.target.value)} placeholder="한국에서 취업하고 싶은 이유를 작성하세요" className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none" data-testid="textarea-intl-reason-korea" />
          </div>
          <div className="space-y-2">
            <Label>본인의 강점 및 성격</Label>
            <Textarea value={profileData.intl_strengthsAndPersonality} onChange={(e) => updateField('intl_strengthsAndPersonality', e.target.value)} placeholder="본인의 강점과 성격을 설명하세요" className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none" data-testid="textarea-intl-strengths" />
          </div>
          <div className="space-y-2">
            <Label>회사에 기여할 수 있는 부분</Label>
            <Textarea value={profileData.intl_contributionToCompany} onChange={(e) => updateField('intl_contributionToCompany', e.target.value)} placeholder="회사에 어떻게 기여할 수 있는지 작성하세요" className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none" data-testid="textarea-intl-contribution" />
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5 text-[#6B7684]" /> 기타 사항 (Additional Information)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>근무 가능 요일/시간</Label>
            <Input value={profileData.intl_availableDaysHours} onChange={(e) => updateField('intl_availableDaysHours', e.target.value)} placeholder="예: 월~금 09:00-18:00, 주말 가능" className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-intl-available-days" />
          </div>
          <div className="space-y-2">
            <Label>특이사항</Label>
            <Textarea value={profileData.intl_specialNotes} onChange={(e) => updateField('intl_specialNotes', e.target.value)} placeholder="기타 특이사항이 있다면 작성하세요" className="min-h-[80px] rounded-xl bg-[#F2F4F6] border-none resize-none" data-testid="textarea-intl-special-notes" />
          </div>
        </CardContent>
      </Card>

      {/* Certification */}
      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5 text-[#10B981]" /> 사실 확인 (Certification)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox id="certify-true" checked={profileData.intl_certifyTrue} onCheckedChange={(checked) => updateField('intl_certifyTrue', checked as boolean)} data-testid="checkbox-intl-certify" />
            <label htmlFor="certify-true" className="text-sm font-medium leading-none cursor-pointer">
              위 기재 내용이 사실과 다름없음을 확인합니다.
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>작성일</Label>
              <Input type="date" value={profileData.intl_dateSigned} onChange={(e) => updateField('intl_dateSigned', e.target.value)} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-intl-date-signed" />
            </div>
            <div className="space-y-2">
              <Label>서명 이름</Label>
              <Input value={profileData.intl_applicantSignatureName} onChange={(e) => updateField('intl_applicantSignatureName', e.target.value)} placeholder="작성자 이름" className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-intl-signature-name" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Education Dialog */}
      <Dialog open={showEducationDialog} onOpenChange={(open) => { if (!open) resetEducationForm(); setShowEducationDialog(open); }}>
        <DialogContent className="sm:max-w-md rounded-[24px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#191F28]">{editingEducationId ? '학력 수정' : '학력 추가'}</DialogTitle>
            <DialogDescription className="text-sm text-[#8B95A1]">학력 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>학교명 *</Label>
              <Input value={educationForm.schoolName} onChange={(e) => setEducationForm({...educationForm, schoolName: e.target.value})} placeholder="학교명" className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-dialog-intl-education-school" />
            </div>
            <div className="space-y-2">
              <Label>국가</Label>
              <Input value={educationForm.schoolCountry} onChange={(e) => setEducationForm({...educationForm, schoolCountry: e.target.value})} placeholder="예: Korea, Vietnam" className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-dialog-intl-education-country" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>전공 *</Label>
                <Input value={educationForm.major} onChange={(e) => setEducationForm({...educationForm, major: e.target.value})} placeholder="전공" className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-dialog-intl-education-major" />
              </div>
              <div className="space-y-2">
                <Label>학위</Label>
                <Select value={educationForm.degree} onValueChange={(val) => setEducationForm({...educationForm, degree: val})}>
                  <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-dialog-intl-education-degree"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEGREE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>시작일</Label>
                <Input type="month" value={educationForm.periodStart} onChange={(e) => setEducationForm({...educationForm, periodStart: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-dialog-intl-education-start" />
              </div>
              <div className="space-y-2">
                <Label>종료일</Label>
                <Input type="month" value={educationForm.periodEnd} onChange={(e) => setEducationForm({...educationForm, periodEnd: e.target.value})} disabled={educationForm.isEnrolled} className="h-12 rounded-xl bg-[#F2F4F6] border-none disabled:opacity-50" data-testid="input-dialog-intl-education-end" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="edu-enrolled" checked={educationForm.isEnrolled} onCheckedChange={(checked) => setEducationForm({...educationForm, isEnrolled: checked as boolean})} data-testid="checkbox-dialog-intl-education-enrolled" />
              <label htmlFor="edu-enrolled" className="text-sm font-medium">재학중</label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-12 rounded-xl border-[#E5E8EB]" onClick={() => { resetEducationForm(); setShowEducationDialog(false); }} data-testid="button-cancel-intl-education">취소</Button>
            <Button className="flex-1 h-12 rounded-xl bg-[#3182F6] font-bold" onClick={addOrUpdateEducation} data-testid="button-submit-intl-education">{editingEducationId ? '수정하기' : '추가하기'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Work Experience Dialog */}
      <Dialog open={showWorkDialog} onOpenChange={(open) => { if (!open) resetWorkForm(); setShowWorkDialog(open); }}>
        <DialogContent className="sm:max-w-md rounded-[24px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#191F28]">{editingWorkId ? '경력 수정' : '경력 추가'}</DialogTitle>
            <DialogDescription className="text-sm text-[#8B95A1]">경력 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>회사명 *</Label>
              <Input value={workForm.companyName} onChange={(e) => setWorkForm({...workForm, companyName: e.target.value})} placeholder="회사명" className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-dialog-intl-work-company" />
            </div>
            <div className="space-y-2">
              <Label>국가</Label>
              <Input value={workForm.companyCountry} onChange={(e) => setWorkForm({...workForm, companyCountry: e.target.value})} placeholder="예: Korea, Vietnam" className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-dialog-intl-work-country" />
            </div>
            <div className="space-y-2">
              <Label>직무 및 역할 *</Label>
              <Input value={workForm.positionAndRole} onChange={(e) => setWorkForm({...workForm, positionAndRole: e.target.value})} placeholder="예: 소프트웨어 개발자" className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-dialog-intl-work-position" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>시작일</Label>
                <Input type="month" value={workForm.periodStart} onChange={(e) => setWorkForm({...workForm, periodStart: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-dialog-intl-work-start" />
              </div>
              <div className="space-y-2">
                <Label>종료일</Label>
                <Input type="month" value={workForm.periodEnd} onChange={(e) => setWorkForm({...workForm, periodEnd: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-dialog-intl-work-end" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>주요 업무 및 성과</Label>
              <Textarea value={workForm.mainTasksAndAchievements} onChange={(e) => setWorkForm({...workForm, mainTasksAndAchievements: e.target.value})} placeholder="주요 업무와 성과를 작성하세요" className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none" data-testid="textarea-dialog-intl-work-tasks" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-12 rounded-xl border-[#E5E8EB]" onClick={() => { resetWorkForm(); setShowWorkDialog(false); }} data-testid="button-cancel-intl-work">취소</Button>
            <Button className="flex-1 h-12 rounded-xl bg-[#3182F6] font-bold" onClick={addOrUpdateWork} data-testid="button-submit-intl-work">{editingWorkId ? '수정하기' : '추가하기'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const InternationalStudentForm = memo(InternationalStudentFormComponent);
