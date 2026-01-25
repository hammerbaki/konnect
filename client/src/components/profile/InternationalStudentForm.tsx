import { memo, useState, useCallback, useMemo } from "react";
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
  Wrench, FileText, Plus, Edit2, Trash2, Building2, Award, Check, Search, X
} from "lucide-react";
import { ProfileFormProps, IntlEducationItem, IntlWorkExperienceItem, IntlCertificateItem } from "./types";

const NATIONALITY_OPTIONS = [
  { value: "VN", label: "베트남 (Vietnam)" },
  { value: "CN", label: "중국 (China)" },
  { value: "UZ", label: "우즈베키스탄 (Uzbekistan)" },
  { value: "MN", label: "몽골 (Mongolia)" },
  { value: "NP", label: "네팔 (Nepal)" },
  { value: "ID", label: "인도네시아 (Indonesia)" },
  { value: "PH", label: "필리핀 (Philippines)" },
  { value: "TH", label: "태국 (Thailand)" },
  { value: "MY", label: "말레이시아 (Malaysia)" },
  { value: "JP", label: "일본 (Japan)" },
  { value: "TW", label: "대만 (Taiwan)" },
  { value: "IN", label: "인도 (India)" },
  { value: "BD", label: "방글라데시 (Bangladesh)" },
  { value: "PK", label: "파키스탄 (Pakistan)" },
  { value: "KZ", label: "카자흐스탄 (Kazakhstan)" },
  { value: "RU", label: "러시아 (Russia)" },
  { value: "US", label: "미국 (USA)" },
  { value: "DE", label: "독일 (Germany)" },
  { value: "FR", label: "프랑스 (France)" },
  { value: "OTHER", label: "기타 (Other)" },
];

const SALARY_OPTIONS = [
  { value: "3000", label: "3,000만원" },
  { value: "3500", label: "3,500만원" },
  { value: "4000", label: "4,000만원" },
  { value: "4500", label: "4,500만원" },
  { value: "5000", label: "5,000만원" },
  { value: "5500", label: "5,500만원" },
  { value: "6000", label: "6,000만원" },
  { value: "6500", label: "6,500만원" },
  { value: "7000", label: "7,000만원" },
  { value: "7500", label: "7,500만원" },
  { value: "8000", label: "8,000만원" },
  { value: "8500", label: "8,500만원" },
  { value: "9000", label: "9,000만원" },
  { value: "9500", label: "9,500만원" },
  { value: "10000", label: "1억원" },
  { value: "negotiable", label: "협의 가능" },
];

const NATIVE_LANGUAGE_OPTIONS = [
  { value: "vi", label: "베트남어 (Vietnamese)" },
  { value: "zh", label: "중국어 (Chinese)" },
  { value: "uz", label: "우즈베크어 (Uzbek)" },
  { value: "mn", label: "몽골어 (Mongolian)" },
  { value: "ne", label: "네팔어 (Nepali)" },
  { value: "id", label: "인도네시아어 (Indonesian)" },
  { value: "tl", label: "따갈로그어 (Tagalog)" },
  { value: "th", label: "태국어 (Thai)" },
  { value: "ms", label: "말레이어 (Malay)" },
  { value: "ja", label: "일본어 (Japanese)" },
  { value: "hi", label: "힌디어 (Hindi)" },
  { value: "bn", label: "벵골어 (Bengali)" },
  { value: "ur", label: "우르두어 (Urdu)" },
  { value: "kk", label: "카자흐어 (Kazakh)" },
  { value: "ru", label: "러시아어 (Russian)" },
  { value: "en", label: "영어 (English)" },
  { value: "de", label: "독일어 (German)" },
  { value: "fr", label: "프랑스어 (French)" },
  { value: "es", label: "스페인어 (Spanish)" },
  { value: "OTHER", label: "기타 (Other)" },
];

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
  { value: "none", label: "선택 안함" },
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
  { value: "none", label: "선택 안함" },
  { value: "TOEIC", label: "TOEIC" },
  { value: "TOEFL", label: "TOEFL" },
  { value: "IELTS", label: "IELTS" },
  { value: "other", label: "기타" },
];

const SKILL_CATEGORIES = [
  { category: "기획/PM", skills: ["프로젝트 관리", "서비스 기획", "제품 기획", "UX 기획", "전략 기획", "요구사항 분석", "일정 관리", "리스크 관리"] },
  { category: "데이터/분석", skills: ["데이터 분석", "SQL", "Python", "통계 분석", "BI 도구", "A/B 테스트", "데이터 시각화", "머신러닝"] },
  { category: "개발", skills: ["프론트엔드", "백엔드", "모바일 앱", "DevOps", "클라우드", "API 설계", "데이터베이스", "보안"] },
  { category: "디자인", skills: ["UI 디자인", "UX 디자인", "그래픽 디자인", "브랜딩", "Figma", "Adobe Suite", "모션 그래픽", "프로토타이핑"] },
  { category: "마케팅/세일즈", skills: ["디지털 마케팅", "콘텐츠 마케팅", "퍼포먼스 마케팅", "영업", "고객 관리", "브랜드 마케팅", "SNS 마케팅", "광고 운영"] },
  { category: "운영/CS", skills: ["서비스 운영", "고객 응대", "CS 관리", "품질 관리", "프로세스 개선", "VoC 분석", "클레임 처리", "운영 자동화"] },
  { category: "문서/리서치", skills: ["문서 작성", "보고서 작성", "프레젠테이션", "시장 조사", "경쟁사 분석", "사용자 리서치", "인터뷰", "설문 설계"] },
  { category: "언어/커뮤니케이션", skills: ["영어", "일본어", "중국어", "커뮤니케이션", "협상", "발표", "미팅 진행", "갈등 조정"] },
];

const InternationalStudentFormComponent = ({ profileData, updateField }: ProfileFormProps) => {
  const { toast } = useToast();
  const [skillSearchQuery, setSkillSearchQuery] = useState('');

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

  const [showCertDialog, setShowCertDialog] = useState(false);
  const [editingCertId, setEditingCertId] = useState<number | null>(null);
  const [certForm, setCertForm] = useState<Omit<IntlCertificateItem, 'id'>>({
    name: '', issuer: '', acquiredDate: '', expiryDate: ''
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

  const resetCertForm = useCallback(() => {
    setCertForm({ name: '', issuer: '', acquiredDate: '', expiryDate: '' });
    setEditingCertId(null);
  }, []);

  const addOrUpdateCert = useCallback(() => {
    if (!certForm.name) {
      toast({ title: "자격증명을 입력해주세요", variant: "destructive", duration: 3000 });
      return;
    }
    const certs = profileData.intl_certificates || [];
    if (editingCertId !== null) {
      updateField('intl_certificates', certs.map(c => c.id === editingCertId ? { ...certForm, id: editingCertId } : c));
      toast({ title: "자격증이 수정되었습니다", duration: 2000 });
    } else {
      updateField('intl_certificates', [...certs, { ...certForm, id: Date.now() }]);
      toast({ title: "자격증이 추가되었습니다", duration: 2000 });
    }
    resetCertForm();
    setShowCertDialog(false);
  }, [certForm, editingCertId, profileData.intl_certificates, updateField, toast, resetCertForm]);

  const editCert = useCallback((item: IntlCertificateItem) => {
    setCertForm({ name: item.name, issuer: item.issuer, acquiredDate: item.acquiredDate, expiryDate: item.expiryDate || '' });
    setEditingCertId(item.id);
    setShowCertDialog(true);
  }, []);

  const deleteCert = useCallback((id: number) => {
    updateField('intl_certificates', (profileData.intl_certificates || []).filter(c => c.id !== id));
    toast({ title: "자격증이 삭제되었습니다", duration: 2000 });
  }, [profileData.intl_certificates, updateField, toast]);

  const toggleSkill = useCallback((skill: string) => {
    const skills = profileData.intl_skills || [];
    const exists = skills.includes(skill);
    if (exists) {
      updateField('intl_skills', skills.filter(s => s !== skill));
    } else {
      updateField('intl_skills', [...skills, skill]);
    }
  }, [profileData.intl_skills, updateField]);

  const filteredCategories = useMemo(() => {
    const query = skillSearchQuery.toLowerCase().trim();
    if (!query) return SKILL_CATEGORIES;
    return SKILL_CATEGORIES.map(cat => ({
      ...cat,
      skills: cat.skills.filter(skill => skill.toLowerCase().includes(query))
    })).filter(cat => cat.skills.length > 0);
  }, [skillSearchQuery]);

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
          <div className="space-y-2">
            <Label>국적 (Nationality) *</Label>
            <Select value={profileData.intl_nationality} onValueChange={(val) => updateField('intl_nationality', val)}>
              <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-intl-nationality"><SelectValue placeholder="국적을 선택하세요" /></SelectTrigger>
              <SelectContent>
                {NATIONALITY_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
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
          <div className="space-y-2">
            <Label>근무 가능 형태</Label>
            <Select value={profileData.intl_availableWorkType} onValueChange={(val) => updateField('intl_availableWorkType', val)}>
              <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-intl-work-type"><SelectValue placeholder="선택" /></SelectTrigger>
              <SelectContent>
                {WORK_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
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
              <Label>희망 급여 *</Label>
              <Select value={profileData.intl_expectedSalary} onValueChange={(val) => updateField('intl_expectedSalary', val)}>
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-intl-expected-salary"><SelectValue placeholder="희망 급여 선택" /></SelectTrigger>
                <SelectContent>
                  {SALARY_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
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
          <div className="space-y-2">
            <Label>모국어 (Native Language) *</Label>
            <Select value={profileData.intl_nativeLanguage} onValueChange={(val) => updateField('intl_nativeLanguage', val)}>
              <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-intl-native-language"><SelectValue placeholder="모국어를 선택하세요" /></SelectTrigger>
              <SelectContent>
                {NATIVE_LANGUAGE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>한국어 수준</Label>
              <Select value={profileData.intl_koreanLevel} onValueChange={(val) => updateField('intl_koreanLevel', val)}>
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-intl-korean-level"><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>
                  {LANGUAGE_LEVEL_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>TOPIK 급수</Label>
              <Select value={profileData.intl_topikLevel} onValueChange={(val) => updateField('intl_topikLevel', val)}>
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-intl-topik-level"><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>
                  {TOPIK_LEVEL_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
          <CardDescription>직무 관련 기술을 선택하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A1]" />
            <Input
              placeholder="스킬 검색..."
              value={skillSearchQuery}
              onChange={(e) => setSkillSearchQuery(e.target.value)}
              className="pl-9 h-11 rounded-xl bg-[#F2F4F6] border-none"
              data-testid="input-intl-skill-search"
            />
          </div>

          {(profileData.intl_skills || []).length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-[#F9FAFB] rounded-xl">
              {(profileData.intl_skills || []).map((skill) => (
                <Badge 
                  key={skill} 
                  variant="secondary" 
                  className="bg-[#3182F6] text-white hover:bg-[#2563EB] cursor-pointer px-3 py-1 text-sm"
                  onClick={() => toggleSkill(skill)}
                  data-testid={`badge-intl-skill-${skill}`}
                >
                  {skill}
                  <X className="h-3 w-3 ml-1.5" />
                </Badge>
              ))}
            </div>
          )}

          {filteredCategories.length === 0 ? (
            <div className="text-center py-6 text-[#8B95A1]">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">'{skillSearchQuery}' 에 해당하는 스킬이 없습니다.</p>
              <p className="text-xs mt-1">아래에서 직접 입력해 추가할 수 있어요.</p>
            </div>
          ) : (
            filteredCategories.map((categoryGroup) => (
              <div key={categoryGroup.category} className="space-y-2">
                <Label className="text-sm font-bold text-[#4E5968]">{categoryGroup.category}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {categoryGroup.skills.map((skill) => {
                    const isSelected = (profileData.intl_skills || []).includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isSelected 
                            ? "bg-[#3182F6] text-white shadow-sm" 
                            : "bg-[#F2F4F6] text-[#6B7684] hover:bg-[#E5E8EB]"
                        }`}
                        data-testid={`button-intl-skill-${skill}`}
                      >
                        {isSelected && <Check className="h-3 w-3 inline mr-1" />}
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          <div className="space-y-2">
            <Label className="text-sm text-[#6B7684]">직접 입력</Label>
            <div className="flex gap-2">
              <Input
                placeholder="스킬 직접 입력 후 Enter"
                className="flex-1 h-11 rounded-xl bg-[#F2F4F6] border-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.currentTarget;
                    const value = input.value.trim();
                    if (value && !(profileData.intl_skills || []).includes(value)) {
                      updateField('intl_skills', [...(profileData.intl_skills || []), value]);
                      input.value = '';
                    }
                  }
                }}
                data-testid="input-intl-custom-skill"
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 px-4 rounded-xl border-[#3182F6] text-[#3182F6] hover:bg-[#3182F6] hover:text-white"
                onClick={(e) => {
                  const input = (e.currentTarget.previousSibling as HTMLInputElement);
                  const value = input.value.trim();
                  if (value && !(profileData.intl_skills || []).includes(value)) {
                    updateField('intl_skills', [...(profileData.intl_skills || []), value]);
                    input.value = '';
                  }
                }}
                data-testid="button-add-intl-custom-skill"
              >
                추가
              </Button>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-[#E5E8EB]">
            <Label>컴퓨터/IT 활용 능력</Label>
            <Textarea value={profileData.intl_computerItSkills} onChange={(e) => updateField('intl_computerItSkills', e.target.value)} placeholder="예: MS Office, Photoshop, SAP, Excel 고급" className="min-h-[80px] rounded-xl bg-[#F2F4F6] border-none resize-none" data-testid="textarea-intl-it-skills" />
          </div>
        </CardContent>
      </Card>

      {/* Certificates Section */}
      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5 text-[#8B5CF6]" /> 자격증 (Certificates)
          </CardTitle>
          <CardDescription>보유한 자격증을 등록하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(profileData.intl_certificates || []).map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E8EB] space-y-2" data-testid={`card-intl-cert-${item.id}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-[#191F28]">{item.name}</h4>
                  <p className="text-[#4E5968] text-sm">{item.issuer}</p>
                  <p className="text-[#8B95A1] text-xs">취득일: {item.acquiredDate}{item.expiryDate ? ` | 만료일: ${item.expiryDate}` : ''}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-[#3182F6]" onClick={() => editCert(item)} data-testid={`button-edit-intl-cert-${item.id}`}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-[#E44E48]" onClick={() => deleteCert(item.id)} data-testid={`button-delete-intl-cert-${item.id}`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" className="w-full h-12 rounded-xl border-dashed border-[#B0B8C1] text-[#8B95A1] hover:text-[#3182F6] hover:border-[#3182F6] font-bold" onClick={() => { resetCertForm(); setShowCertDialog(true); }} data-testid="button-add-intl-cert">
            <Plus className="h-5 w-5 mr-2" /> 자격증 추가하기
          </Button>
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
            <Label>한국에 오게 된 이유 / 경로</Label>
            <Textarea value={profileData.intl_reasonForComingToKorea} onChange={(e) => updateField('intl_reasonForComingToKorea', e.target.value)} placeholder="한국에 오게 된 계기나 경로를 작성하세요" className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none" data-testid="textarea-intl-reason-coming" />
          </div>
          <div className="space-y-2">
            <Label>한국 취업을 희망하는 이유</Label>
            <Textarea value={profileData.intl_reasonForKoreaEmployment} onChange={(e) => updateField('intl_reasonForKoreaEmployment', e.target.value)} placeholder="한국에서 취업하고 싶은 이유를 작성하세요" className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none" data-testid="textarea-intl-reason-korea" />
          </div>
          <div className="space-y-2">
            <Label>본인의 강점 및 성격</Label>
            <Textarea value={profileData.intl_strengthsAndPersonality} onChange={(e) => updateField('intl_strengthsAndPersonality', e.target.value)} placeholder="본인의 강점과 성격을 설명하세요" className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none" data-testid="textarea-intl-strengths" />
          </div>
          <div className="space-y-2">
            <Label>한국에서 가장 좋았던 것과 그 이유</Label>
            <Textarea value={profileData.intl_bestThingInKorea} onChange={(e) => updateField('intl_bestThingInKorea', e.target.value)} placeholder="한국에서 가장 좋았던 경험이나 것, 그리고 그 이유를 작성하세요" className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none" data-testid="textarea-intl-best-korea" />
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

      {/* Certificate Dialog */}
      <Dialog open={showCertDialog} onOpenChange={(open) => { if (!open) resetCertForm(); setShowCertDialog(open); }}>
        <DialogContent className="sm:max-w-md rounded-[24px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#191F28]">{editingCertId ? '자격증 수정' : '자격증 추가'}</DialogTitle>
            <DialogDescription className="text-sm text-[#8B95A1]">자격증 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>자격증명 *</Label>
              <Input value={certForm.name} onChange={(e) => setCertForm({...certForm, name: e.target.value})} placeholder="예: 정보처리기사, SQLD" className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-dialog-intl-cert-name" />
            </div>
            <div className="space-y-2">
              <Label>발급 기관</Label>
              <Input value={certForm.issuer} onChange={(e) => setCertForm({...certForm, issuer: e.target.value})} placeholder="예: 한국산업인력공단" className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-dialog-intl-cert-issuer" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>취득일</Label>
                <Input type="date" value={certForm.acquiredDate} onChange={(e) => setCertForm({...certForm, acquiredDate: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-dialog-intl-cert-acquired" />
              </div>
              <div className="space-y-2">
                <Label>만료일 (선택)</Label>
                <Input type="date" value={certForm.expiryDate} onChange={(e) => setCertForm({...certForm, expiryDate: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-dialog-intl-cert-expiry" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-12 rounded-xl border-[#E5E8EB]" onClick={() => { resetCertForm(); setShowCertDialog(false); }} data-testid="button-cancel-intl-cert">취소</Button>
            <Button className="flex-1 h-12 rounded-xl bg-[#3182F6] font-bold" onClick={addOrUpdateCert} data-testid="button-submit-intl-cert">{editingCertId ? '수정하기' : '추가하기'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const InternationalStudentForm = memo(InternationalStudentFormComponent);
