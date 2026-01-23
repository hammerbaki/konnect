import React, { memo, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { 
  Briefcase, BrainCircuit, TrendingUp, Sparkles, PenTool, DollarSign, Smile, Shield, Zap, 
  Armchair, HardHat, AlertTriangle, Plus, Trash2, X, Check, Search, Calendar as CalendarIcon,
  Languages, Award, BadgeCheck, Users, Edit2, GraduationCap
} from "lucide-react";
import { ProfileFormProps, LanguageTest, LicenseItem, AwardItem, ReferenceItem, EducationItem } from './types';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { SalaryWheelPicker } from '@/components/ui/wheel-picker';

const CURRENT_STATUS_OPTIONS = [
  { value: "employed", label: "재직 중 (이직 준비)" },
  { value: "unemployed", label: "구직 중 (미취업/퇴사)" },
  { value: "freelance", label: "프리랜서 / 계약직" },
  { value: "student", label: "취업 준비생 (졸업 예정/유예)" },
];

const REASON_FOR_CHANGE = [
  { value: "growth", label: "성장 기회 부족 (더 배우고 싶어서)" },
  { value: "compensation", label: "연봉 및 보상 불만족" },
  { value: "culture", label: "조직 문화 및 인간관계" },
  { value: "aptitude", label: "적성에 맞지 않는 업무" },
  { value: "stability", label: "고용 불안정" },
  { value: "burnout", label: "업무 과다 및 번아웃" },
  { value: "new_challenge", label: "새로운 분야 도전" },
];

const WORK_STYLES = [
  { value: "independent", label: "독립적으로 일하는 것 선호" },
  { value: "team", label: "팀과 협업하며 일하는 것 선호" },
  { value: "leadership", label: "리더십을 발휘하는 역할 선호" },
  { value: "support", label: "안정적으로 지원하는 역할 선호" },
];

const WORK_VALUE_OPTIONS = [
  { id: 'growth', label: '성장 가능성', icon: TrendingUp },
  { id: 'balance', label: '워라밸', icon: Armchair },
  { id: 'money', label: '높은 연봉', icon: DollarSign },
  { id: 'culture', label: '수평적 문화', icon: Smile },
  { id: 'stability', label: '고용 안정', icon: Shield },
  { id: 'autonomy', label: '자율성', icon: Zap },
];

const ENVIRONMENT_OPTIONS = [
  { id: 'brain', label: '지식 집약적 업무 (Brain Using)', icon: BrainCircuit, desc: '육체적 노동보다는 정신적 노동 중심' },
  { id: 'sedentary', label: '좌식 근무 (Sitting)', icon: Armchair, desc: '주로 앉아서 하는 사무직 환경' },
  { id: 'active', label: '활동적 근무 (Active)', icon: Zap, desc: '이동이 많거나 현장 활동이 포함됨' },
  { id: 'industrial', label: '제조/생산 현장 (Industrial)', icon: HardHat, desc: '공장, 건설 등 생산 현장 환경' },
  { id: 'challenging', label: '도전적 환경 (Challenging)', icon: AlertTriangle, desc: '위험 요소가 있거나 강도 높은 업무' },
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

const LANGUAGE_EXAM_OPTIONS = [
  { value: "TOPIK", label: "TOPIK (한국어능력시험)" },
  { value: "TOEIC", label: "TOEIC" },
  { value: "TOEFL", label: "TOEFL" },
  { value: "IELTS", label: "IELTS" },
  { value: "JLPT", label: "JLPT (일본어능력시험)" },
  { value: "HSK", label: "HSK (중국어)" },
  { value: "DELF", label: "DELF/DALF (프랑스어)" },
  { value: "DELE", label: "DELE (스페인어)" },
  { value: "OTHER", label: "기타" },
];

const LICENSE_CATEGORY_OPTIONS = [
  { value: "certificate", label: "자격증" },
  { value: "license", label: "면허" },
];

const LICENSE_STATUS_OPTIONS = [
  { value: "acquired", label: "취득" },
  { value: "preparing", label: "준비중" },
  { value: "expired", label: "만료" },
];

const AWARD_TYPE_OPTIONS = [
  { value: "award", label: "수상" },
  { value: "competition", label: "공모전" },
  { value: "contest", label: "대회" },
  { value: "other", label: "기타" },
];

const AWARD_RANK_OPTIONS = [
  { value: "grand", label: "대상" },
  { value: "gold", label: "최우수상/금상" },
  { value: "silver", label: "우수상/은상" },
  { value: "bronze", label: "장려상/동상" },
  { value: "participation", label: "참가상" },
  { value: "other", label: "기타" },
];

const REFERENCE_RELATION_OPTIONS = [
  { value: "professor", label: "교수" },
  { value: "supervisor", label: "직장상사" },
  { value: "colleague", label: "동료" },
  { value: "acquaintance", label: "지인" },
  { value: "other", label: "기타" },
];

const EDUCATION_LEVEL_OPTIONS = [
  { value: "elementary", label: "초등학교 졸업" },
  { value: "middle", label: "중학교 졸업" },
  { value: "high", label: "고등학교 졸업" },
  { value: "university", label: "대학·대학원 이상 졸업" },
  { value: "other", label: "기타 학력" },
];

const GRADUATION_STATUS_OPTIONS = [
  { value: "graduated", label: "졸업" },
  { value: "enrolled", label: "재학" },
  { value: "expected", label: "졸업예정" },
  { value: "dropped", label: "중퇴" },
  { value: "leave", label: "휴학" },
];

const UNIVERSITY_TYPE_OPTIONS = [
  { value: "2year", label: "전문대 (2~3년제)" },
  { value: "4year", label: "대학교 (4년제)" },
  { value: "graduate", label: "대학원" },
  { value: "abroad", label: "해외대학" },
];

const MAJOR_CATEGORY_OPTIONS = [
  { value: "humanities", label: "인문계열" },
  { value: "social", label: "사회계열" },
  { value: "business", label: "상경계열" },
  { value: "engineering", label: "공학계열" },
  { value: "science", label: "자연계열" },
  { value: "medical", label: "의약계열" },
  { value: "art", label: "예체능계열" },
  { value: "education", label: "교육계열" },
  { value: "other", label: "기타" },
];

const GeneralFormComponent: React.FC<ProfileFormProps> = ({ profileData, updateField }) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [showWorkExperienceDialog, setShowWorkExperienceDialog] = useState(false);
  const [workExpForm, setWorkExpForm] = useState({ company: '', role: '', startDate: null as Date | null, endDate: null as Date | null, description: '' });
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [showSalaryPicker, setShowSalaryPicker] = useState(false);
  
  const [showLanguageTestDialog, setShowLanguageTestDialog] = useState(false);
  const [editingLanguageTestId, setEditingLanguageTestId] = useState<number | null>(null);
  const [languageTestForm, setLanguageTestForm] = useState<Omit<LanguageTest, 'id'>>({
    examName: '', scoreType: 'score', scoreValue: '', acquiredDate: '', isPending: false, expiryDate: '', note: ''
  });
  
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);
  const [editingLicenseId, setEditingLicenseId] = useState<number | null>(null);
  const [licenseForm, setLicenseForm] = useState<Omit<LicenseItem, 'id'>>({
    category: 'certificate', licenseType: '', title: '', issuer: '', status: 'acquired', acquiredDate: '', licenseNumber: '', expiryDate: ''
  });
  
  const [showAwardDialog, setShowAwardDialog] = useState(false);
  const [editingAwardId, setEditingAwardId] = useState<number | null>(null);
  const [awardForm, setAwardForm] = useState<Omit<AwardItem, 'id'>>({
    awardType: 'award', rank: '', titleAndHost: '', awardDate: '', note: ''
  });
  
  const [showReferenceDialog, setShowReferenceDialog] = useState(false);
  const [editingReferenceId, setEditingReferenceId] = useState<number | null>(null);
  const [referenceForm, setReferenceForm] = useState<Omit<ReferenceItem, 'id'>>({
    relation: 'professor', name: '', organization: '', phone: '', email: '', note: ''
  });

  const [showEducationDialog, setShowEducationDialog] = useState(false);
  const [editingEducationId, setEditingEducationId] = useState<number | null>(null);
  const [educationForm, setEducationForm] = useState<Omit<EducationItem, 'id'>>({
    educationLevel: 'university', schoolName: '', graduationStatus: 'graduated', entranceDate: '', graduationDate: '', 
    isGed: false, isTransfer: false, universityType: '4year', major: '', subMajor: '', gpa: '', gpaScale: '4.5', dayNight: 'day', region: '', majorCategory: ''
  });

  const addWorkExperience = useCallback(() => {
    if (!workExpForm.company || !workExpForm.role || !workExpForm.startDate) {
      toast({ title: "필수 항목을 입력해주세요", description: "회사명, 직무, 시작일은 필수입니다.", variant: "destructive", duration: 3000 });
      return;
    }
    const newExp = {
      id: Date.now(),
      company: workExpForm.company,
      role: workExpForm.role,
      startDate: workExpForm.startDate,
      endDate: workExpForm.endDate,
      description: workExpForm.description,
    };
    updateField('gen_workExperience', [...profileData.gen_workExperience, newExp]);
    setWorkExpForm({ company: '', role: '', startDate: null, endDate: null, description: '' });
    setShowWorkExperienceDialog(false);
  }, [workExpForm, profileData.gen_workExperience, updateField, toast]);

  const deleteWorkExperience = useCallback((id: number) => {
    updateField('gen_workExperience', profileData.gen_workExperience.filter(exp => exp.id !== id));
  }, [profileData.gen_workExperience, updateField]);

  const toggleWorkValue = useCallback((value: string) => {
    const exists = profileData.gen_workValues.includes(value);
    if (exists) {
      updateField('gen_workValues', profileData.gen_workValues.filter(v => v !== value));
    } else if (profileData.gen_workValues.length < 3) {
      updateField('gen_workValues', [...profileData.gen_workValues, value]);
    }
  }, [profileData.gen_workValues, updateField]);

  const toggleEnvironmentPreference = useCallback((pref: string) => {
    if (profileData.gen_environmentNoPreference) return;
    const exists = profileData.gen_environmentPreferences.includes(pref);
    if (exists) {
      updateField('gen_environmentPreferences', profileData.gen_environmentPreferences.filter(p => p !== pref));
    } else {
      updateField('gen_environmentPreferences', [...profileData.gen_environmentPreferences, pref]);
    }
  }, [profileData.gen_environmentPreferences, profileData.gen_environmentNoPreference, updateField]);

  const toggleSkill = useCallback((skill: string) => {
    const exists = profileData.gen_skills.includes(skill);
    if (exists) {
      updateField('gen_skills', profileData.gen_skills.filter(s => s !== skill));
    } else {
      updateField('gen_skills', [...profileData.gen_skills, skill]);
    }
  }, [profileData.gen_skills, updateField]);

  const filteredCategories = useMemo(() => {
    const query = skillSearchQuery.toLowerCase().trim();
    if (!query) return SKILL_CATEGORIES;
    return SKILL_CATEGORIES.map(cat => ({
      ...cat,
      skills: cat.skills.filter(skill => 
        skill.toLowerCase().includes(query) || 
        cat.category.toLowerCase().includes(query)
      )
    })).filter(cat => cat.skills.length > 0);
  }, [skillSearchQuery]);

  const resetLanguageTestForm = useCallback(() => {
    setLanguageTestForm({ examName: '', scoreType: 'score', scoreValue: '', acquiredDate: '', isPending: false, expiryDate: '', note: '' });
    setEditingLanguageTestId(null);
  }, []);

  const addOrUpdateLanguageTest = useCallback(() => {
    if (!languageTestForm.examName || (!languageTestForm.isPending && !languageTestForm.scoreValue)) {
      toast({ title: "필수 항목을 입력해주세요", description: "시험명과 점수/등급은 필수입니다.", variant: "destructive", duration: 3000 });
      return;
    }
    const tests = profileData.gen_languageTests || [];
    if (editingLanguageTestId !== null) {
      updateField('gen_languageTests', tests.map(t => t.id === editingLanguageTestId ? { ...languageTestForm, id: editingLanguageTestId } : t));
      toast({ title: "어학 정보가 수정되었습니다", duration: 2000 });
    } else {
      updateField('gen_languageTests', [...tests, { ...languageTestForm, id: Date.now() }]);
      toast({ title: "어학 정보가 추가되었습니다", duration: 2000 });
    }
    resetLanguageTestForm();
    setShowLanguageTestDialog(false);
  }, [languageTestForm, editingLanguageTestId, profileData.gen_languageTests, updateField, toast, resetLanguageTestForm]);

  const editLanguageTest = useCallback((item: LanguageTest) => {
    setLanguageTestForm({ examName: item.examName, scoreType: item.scoreType, scoreValue: item.scoreValue, acquiredDate: item.acquiredDate, isPending: item.isPending, expiryDate: item.expiryDate || '', note: item.note || '' });
    setEditingLanguageTestId(item.id);
    setShowLanguageTestDialog(true);
  }, []);

  const deleteLanguageTest = useCallback((id: number) => {
    updateField('gen_languageTests', (profileData.gen_languageTests || []).filter(t => t.id !== id));
    toast({ title: "어학 정보가 삭제되었습니다", duration: 2000 });
  }, [profileData.gen_languageTests, updateField, toast]);

  const resetLicenseForm = useCallback(() => {
    setLicenseForm({ category: 'certificate', licenseType: '', title: '', issuer: '', status: 'acquired', acquiredDate: '', licenseNumber: '', expiryDate: '' });
    setEditingLicenseId(null);
  }, []);

  const addOrUpdateLicense = useCallback(() => {
    if (!licenseForm.title || !licenseForm.issuer) {
      toast({ title: "필수 항목을 입력해주세요", description: "자격/면허명과 발급기관은 필수입니다.", variant: "destructive", duration: 3000 });
      return;
    }
    const licenses = profileData.gen_licenses || [];
    if (editingLicenseId !== null) {
      updateField('gen_licenses', licenses.map(l => l.id === editingLicenseId ? { ...licenseForm, id: editingLicenseId } : l));
      toast({ title: "자격증/면허 정보가 수정되었습니다", duration: 2000 });
    } else {
      updateField('gen_licenses', [...licenses, { ...licenseForm, id: Date.now() }]);
      toast({ title: "자격증/면허가 추가되었습니다", duration: 2000 });
    }
    resetLicenseForm();
    setShowLicenseDialog(false);
  }, [licenseForm, editingLicenseId, profileData.gen_licenses, updateField, toast, resetLicenseForm]);

  const editLicense = useCallback((item: LicenseItem) => {
    setLicenseForm({ category: item.category, licenseType: item.licenseType, title: item.title, issuer: item.issuer, status: item.status, acquiredDate: item.acquiredDate || '', licenseNumber: item.licenseNumber || '', expiryDate: item.expiryDate || '' });
    setEditingLicenseId(item.id);
    setShowLicenseDialog(true);
  }, []);

  const deleteLicense = useCallback((id: number) => {
    updateField('gen_licenses', (profileData.gen_licenses || []).filter(l => l.id !== id));
    toast({ title: "자격증/면허가 삭제되었습니다", duration: 2000 });
  }, [profileData.gen_licenses, updateField, toast]);

  const resetAwardForm = useCallback(() => {
    setAwardForm({ awardType: 'award', rank: '', titleAndHost: '', awardDate: '', note: '' });
    setEditingAwardId(null);
  }, []);

  const addOrUpdateAward = useCallback(() => {
    if (!awardForm.titleAndHost || !awardForm.awardDate) {
      toast({ title: "필수 항목을 입력해주세요", description: "수상/공모전명과 날짜는 필수입니다.", variant: "destructive", duration: 3000 });
      return;
    }
    const awards = profileData.gen_awards || [];
    if (editingAwardId !== null) {
      updateField('gen_awards', awards.map(a => a.id === editingAwardId ? { ...awardForm, id: editingAwardId } : a));
      toast({ title: "수상/공모전 정보가 수정되었습니다", duration: 2000 });
    } else {
      updateField('gen_awards', [...awards, { ...awardForm, id: Date.now() }]);
      toast({ title: "수상/공모전이 추가되었습니다", duration: 2000 });
    }
    resetAwardForm();
    setShowAwardDialog(false);
  }, [awardForm, editingAwardId, profileData.gen_awards, updateField, toast, resetAwardForm]);

  const editAward = useCallback((item: AwardItem) => {
    setAwardForm({ awardType: item.awardType, rank: item.rank, titleAndHost: item.titleAndHost, awardDate: item.awardDate, note: item.note || '' });
    setEditingAwardId(item.id);
    setShowAwardDialog(true);
  }, []);

  const deleteAward = useCallback((id: number) => {
    updateField('gen_awards', (profileData.gen_awards || []).filter(a => a.id !== id));
    toast({ title: "수상/공모전이 삭제되었습니다", duration: 2000 });
  }, [profileData.gen_awards, updateField, toast]);

  const resetReferenceForm = useCallback(() => {
    setReferenceForm({ relation: 'professor', name: '', organization: '', phone: '', email: '', note: '' });
    setEditingReferenceId(null);
  }, []);

  const addOrUpdateReference = useCallback(() => {
    if (!referenceForm.name || !referenceForm.phone) {
      toast({ title: "필수 항목을 입력해주세요", description: "추천인 성명과 연락처는 필수입니다.", variant: "destructive", duration: 3000 });
      return;
    }
    const refs = profileData.gen_references || [];
    if (editingReferenceId !== null) {
      updateField('gen_references', refs.map(r => r.id === editingReferenceId ? { ...referenceForm, id: editingReferenceId } : r));
      toast({ title: "추천인 정보가 수정되었습니다", duration: 2000 });
    } else {
      updateField('gen_references', [...refs, { ...referenceForm, id: Date.now() }]);
      toast({ title: "추천인이 추가되었습니다", duration: 2000 });
    }
    resetReferenceForm();
    setShowReferenceDialog(false);
  }, [referenceForm, editingReferenceId, profileData.gen_references, updateField, toast, resetReferenceForm]);

  const editReference = useCallback((item: ReferenceItem) => {
    setReferenceForm({ relation: item.relation, name: item.name, organization: item.organization || '', phone: item.phone, email: item.email || '', note: item.note || '' });
    setEditingReferenceId(item.id);
    setShowReferenceDialog(true);
  }, []);

  const deleteReference = useCallback((id: number) => {
    updateField('gen_references', (profileData.gen_references || []).filter(r => r.id !== id));
    toast({ title: "추천인이 삭제되었습니다", duration: 2000 });
  }, [profileData.gen_references, updateField, toast]);

  const resetEducationForm = useCallback(() => {
    setEducationForm({
      educationLevel: 'university', schoolName: '', graduationStatus: 'graduated', entranceDate: '', graduationDate: '',
      isGed: false, isTransfer: false, universityType: '4year', major: '', subMajor: '', gpa: '', gpaScale: '4.5', dayNight: 'day', region: '', majorCategory: ''
    });
    setEditingEducationId(null);
  }, []);

  const addOrUpdateEducation = useCallback(() => {
    if (!educationForm.schoolName || !educationForm.graduationStatus) {
      toast({ title: "필수 항목을 입력해주세요", description: "학교명과 졸업여부는 필수입니다.", variant: "destructive", duration: 3000 });
      return;
    }
    const edus = profileData.gen_educations || [];
    if (editingEducationId !== null) {
      updateField('gen_educations', edus.map(e => e.id === editingEducationId ? { ...educationForm, id: editingEducationId } : e));
      toast({ title: "학력 정보가 수정되었습니다", duration: 2000 });
    } else {
      updateField('gen_educations', [...edus, { ...educationForm, id: Date.now() }]);
      toast({ title: "학력이 추가되었습니다", duration: 2000 });
    }
    resetEducationForm();
    setShowEducationDialog(false);
  }, [educationForm, editingEducationId, profileData.gen_educations, updateField, toast, resetEducationForm]);

  const editEducation = useCallback((item: EducationItem) => {
    setEducationForm({
      educationLevel: item.educationLevel, schoolName: item.schoolName, graduationStatus: item.graduationStatus, 
      entranceDate: item.entranceDate, graduationDate: item.graduationDate || '',
      isGed: item.isGed || false, isTransfer: item.isTransfer || false, universityType: item.universityType || '4year', 
      major: item.major || '', subMajor: item.subMajor || '', gpa: item.gpa || '', gpaScale: item.gpaScale || '4.5', 
      dayNight: item.dayNight || 'day', region: item.region || '', majorCategory: item.majorCategory || ''
    });
    setEditingEducationId(item.id);
    setShowEducationDialog(true);
  }, []);

  const deleteEducation = useCallback((id: number) => {
    updateField('gen_educations', (profileData.gen_educations || []).filter(e => e.id !== id));
    toast({ title: "학력이 삭제되었습니다", duration: 2000 });
  }, [profileData.gen_educations, updateField, toast]);

  const SalaryPickerContent = () => {
    if (isMobile) {
      return (
        <div className="pb-4">
          <SalaryWheelPicker value={profileData.gen_salary} onChange={(val) => updateField('gen_salary', val)} />
          <DrawerClose asChild>
            <Button className="w-full mt-8 rounded-xl h-12 text-lg font-bold">완료</Button>
          </DrawerClose>
        </div>
      );
    }

    const [inputValue, setInputValue] = useState(profileData.gen_salary.toLocaleString());
    return (
      <div className="flex flex-col p-4 space-y-6">
        <div className="space-y-2">
          <Label className="text-[#4E5968]">연봉 입력 (만원)</Label>
          <div className="relative">
            <Input 
              value={inputValue}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/[^0-9]/g, '');
                const numValue = parseInt(rawValue, 10);
                if (!isNaN(numValue)) {
                  setInputValue(numValue.toLocaleString());
                  updateField('gen_salary', numValue);
                } else if (rawValue === '') {
                  setInputValue('');
                  updateField('gen_salary', 0);
                }
              }}
              className="h-16 text-2xl font-bold pl-4 pr-12 rounded-xl border-[#E5E8EB] focus:border-[#3182F6] focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B95A1] font-bold text-lg">만원</span>
          </div>
          <p className="text-sm text-[#8B95A1]">
            * 성과급 및 기타 수당을 포함한 세전 연봉을 입력해주세요.
          </p>
        </div>
        <Button 
          className="w-full rounded-xl h-12 text-lg font-bold bg-[#3182F6]"
          onClick={() => setShowSalaryPicker(false)}
        >
          입력 완료
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5 text-[#3182F6]" /> 현재 상태 및 이직/구직 의도
          </CardTitle>
          <CardDescription>현재 상황과 새로운 기회를 찾는 이유를 알려주세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>현재 구직 상태</Label>
            <Select 
              value={profileData.gen_currentStatus} 
              onValueChange={(val) => updateField('gen_currentStatus', val)}
            >
              <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                <SelectValue placeholder="현재 상태 선택" />
              </SelectTrigger>
              <SelectContent>
                {CURRENT_STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>구직사유</Label>
            <Select 
              value={profileData.gen_reasonForChange} 
              onValueChange={(val) => updateField('gen_reasonForChange', val)}
            >
              <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                <SelectValue placeholder="가장 큰 이유 선택" />
              </SelectTrigger>
              <SelectContent>
                {REASON_FOR_CHANGE.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5 text-[#6366F1]" /> 경력 사항
          </CardTitle>
          <CardDescription>주요 경력과 근무 이력을 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {profileData.gen_workExperience.map((exp) => (
            <div key={exp.id} className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E8EB] space-y-3 relative group">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-[#191F28] text-lg">{exp.role}</h4>
                  <p className="text-[#4E5968] font-medium">{exp.company}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-[#B0B8C1] hover:text-[#E44E48] hover:bg-red-50"
                  onClick={() => deleteWorkExperience(exp.id)}
                  data-testid={`button-delete-work-exp-${exp.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-[#8B95A1]">
                <CalendarIcon className="h-4 w-4" />
                <span>{exp.startDate ? format(exp.startDate, 'yyyy.MM') : ''} - {exp.endDate ? format(exp.endDate, 'yyyy.MM') : '현재'}</span>
              </div>

              {exp.description && (
                <p className="text-sm text-[#4E5968] whitespace-pre-line pl-3 border-l-2 border-[#E5E8EB]">
                  {exp.description}
                </p>
              )}
            </div>
          ))}

          <Button 
            type="button"
            variant="outline" 
            className="w-full h-12 rounded-xl border-dashed border-[#B0B8C1] text-[#8B95A1] hover:text-[#3182F6] hover:border-[#3182F6] hover:bg-blue-50 font-bold"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowWorkExperienceDialog(true);
            }}
            data-testid="button-add-work-experience"
          >
            <Plus className="h-5 w-5 mr-2" /> 경력 추가하기
          </Button>
        </CardContent>
      </Card>

      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="h-5 w-5 text-[#6366F1]" /> 학력
          </CardTitle>
          <CardDescription>최종 학력 및 학력 사항을 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(profileData.gen_educations || []).map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E8EB] space-y-2 relative group" data-testid={`card-education-${item.id}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#191F28]" data-testid={`text-education-school-${item.id}`}>{item.schoolName}</h4>
                    <Badge variant="outline" className="text-xs border-indigo-400 text-indigo-600" data-testid={`badge-education-level-${item.id}`}>
                      {EDUCATION_LEVEL_OPTIONS.find(o => o.value === item.educationLevel)?.label}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${item.graduationStatus === 'graduated' ? 'border-green-400 text-green-600' : item.graduationStatus === 'enrolled' ? 'border-blue-400 text-blue-600' : 'border-amber-400 text-amber-600'}`} data-testid={`badge-education-status-${item.id}`}>
                      {GRADUATION_STATUS_OPTIONS.find(o => o.value === item.graduationStatus)?.label}
                    </Badge>
                  </div>
                  {item.major && <p className="text-[#4E5968] text-sm" data-testid={`text-education-major-${item.id}`}>{item.major}{item.subMajor ? ` / ${item.subMajor}` : ''}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-[#3182F6] hover:bg-blue-50" onClick={() => editEducation(item)} data-testid={`button-edit-education-${item.id}`}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-[#E44E48] hover:bg-red-50" onClick={() => deleteEducation(item.id)} data-testid={`button-delete-education-${item.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-[#8B95A1]">
                {item.entranceDate && <span data-testid={`text-education-entrance-${item.id}`}>입학: {item.entranceDate}</span>}
                {item.graduationDate && <span data-testid={`text-education-graduation-${item.id}`}>• 졸업: {item.graduationDate}</span>}
                {item.gpa && <span data-testid={`text-education-gpa-${item.id}`}>• 학점: {item.gpa}/{item.gpaScale || '4.5'}</span>}
                {item.isTransfer && <Badge variant="secondary" className="text-xs" data-testid={`badge-education-transfer-${item.id}`}>편입</Badge>}
                {item.isGed && <Badge variant="secondary" className="text-xs" data-testid={`badge-education-ged-${item.id}`}>검정고시</Badge>}
              </div>
            </div>
          ))}
          <Button 
            type="button" variant="outline" 
            className="w-full h-12 rounded-xl border-dashed border-[#B0B8C1] text-[#8B95A1] hover:text-[#3182F6] hover:border-[#3182F6] hover:bg-blue-50 font-bold"
            onClick={(e) => { e.preventDefault(); resetEducationForm(); setShowEducationDialog(true); }}
            data-testid="button-add-education"
          >
            <Plus className="h-5 w-5 mr-2" /> 학력 추가하기
          </Button>
        </CardContent>
      </Card>

      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Languages className="h-5 w-5 text-[#10B981]" /> 어학(외국어) 시험/역량
          </CardTitle>
          <CardDescription>보유한 어학 점수 및 역량을 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(profileData.gen_languageTests || []).map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E8EB] space-y-2 relative group" data-testid={`card-language-${item.id}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#191F28]" data-testid={`text-language-exam-${item.id}`}>{LANGUAGE_EXAM_OPTIONS.find(o => o.value === item.examName)?.label || item.examName}</h4>
                    {item.isPending && <Badge variant="outline" className="text-xs border-amber-400 text-amber-600" data-testid={`badge-language-pending-${item.id}`}>준비중</Badge>}
                  </div>
                  {!item.isPending && (
                    <p className="text-[#4E5968] font-medium" data-testid={`text-language-score-${item.id}`}>{item.scoreType === 'grade' ? '등급' : '점수'}: {item.scoreValue}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-[#3182F6] hover:bg-blue-50" onClick={() => editLanguageTest(item)} data-testid={`button-edit-language-${item.id}`}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-[#E44E48] hover:bg-red-50" onClick={() => deleteLanguageTest(item.id)} data-testid={`button-delete-language-${item.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#8B95A1]">
                {item.acquiredDate && <span data-testid={`text-language-acquired-${item.id}`}>취득일: {item.acquiredDate}</span>}
                {item.expiryDate && <span data-testid={`text-language-expiry-${item.id}`}>• 만료일: {item.expiryDate}</span>}
              </div>
              {item.note && <p className="text-sm text-[#8B95A1]" data-testid={`text-language-note-${item.id}`}>{item.note}</p>}
            </div>
          ))}
          <Button 
            type="button" variant="outline" 
            className="w-full h-12 rounded-xl border-dashed border-[#B0B8C1] text-[#8B95A1] hover:text-[#3182F6] hover:border-[#3182F6] hover:bg-blue-50 font-bold"
            onClick={(e) => { e.preventDefault(); resetLanguageTestForm(); setShowLanguageTestDialog(true); }}
            data-testid="button-add-language"
          >
            <Plus className="h-5 w-5 mr-2" /> 어학 시험 추가하기
          </Button>
        </CardContent>
      </Card>

      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BadgeCheck className="h-5 w-5 text-[#F59E0B]" /> 자격증/면허
          </CardTitle>
          <CardDescription>보유한 자격증 및 면허를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(profileData.gen_licenses || []).map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E8EB] space-y-2 relative group" data-testid={`card-license-${item.id}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#191F28]" data-testid={`text-license-title-${item.id}`}>{item.title}</h4>
                    <Badge variant="outline" className={`text-xs ${item.status === 'acquired' ? 'border-green-400 text-green-600' : item.status === 'preparing' ? 'border-amber-400 text-amber-600' : 'border-red-400 text-red-600'}`} data-testid={`badge-license-status-${item.id}`}>
                      {LICENSE_STATUS_OPTIONS.find(o => o.value === item.status)?.label}
                    </Badge>
                  </div>
                  <p className="text-[#4E5968] text-sm" data-testid={`text-license-issuer-${item.id}`}>{item.issuer}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-[#3182F6] hover:bg-blue-50" onClick={() => editLicense(item)} data-testid={`button-edit-license-${item.id}`}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-[#E44E48] hover:bg-red-50" onClick={() => deleteLicense(item.id)} data-testid={`button-delete-license-${item.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#8B95A1]">
                <Badge variant="secondary" className="text-xs" data-testid={`badge-license-category-${item.id}`}>{LICENSE_CATEGORY_OPTIONS.find(o => o.value === item.category)?.label}</Badge>
                {item.licenseType && <span data-testid={`text-license-type-${item.id}`}>• {item.licenseType}</span>}
                {item.acquiredDate && <span data-testid={`text-license-acquired-${item.id}`}>• 취득일: {item.acquiredDate}</span>}
              </div>
              {item.licenseNumber && <p className="text-sm text-[#8B95A1]" data-testid={`text-license-number-${item.id}`}>자격번호: {item.licenseNumber}</p>}
            </div>
          ))}
          <Button 
            type="button" variant="outline" 
            className="w-full h-12 rounded-xl border-dashed border-[#B0B8C1] text-[#8B95A1] hover:text-[#3182F6] hover:border-[#3182F6] hover:bg-blue-50 font-bold"
            onClick={(e) => { e.preventDefault(); resetLicenseForm(); setShowLicenseDialog(true); }}
            data-testid="button-add-license"
          >
            <Plus className="h-5 w-5 mr-2" /> 자격증/면허 추가하기
          </Button>
        </CardContent>
      </Card>

      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5 text-[#EC4899]" /> 수상/공모전
          </CardTitle>
          <CardDescription>수상 경력 및 공모전 입상 이력을 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(profileData.gen_awards || []).map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E8EB] space-y-2 relative group" data-testid={`card-award-${item.id}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#191F28]" data-testid={`text-award-title-${item.id}`}>{item.titleAndHost}</h4>
                    <Badge variant="outline" className="text-xs border-purple-400 text-purple-600" data-testid={`badge-award-type-${item.id}`}>
                      {AWARD_TYPE_OPTIONS.find(o => o.value === item.awardType)?.label}
                    </Badge>
                  </div>
                  {item.rank && <p className="text-[#4E5968] text-sm" data-testid={`text-award-rank-${item.id}`}>{AWARD_RANK_OPTIONS.find(o => o.value === item.rank)?.label || item.rank}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-[#3182F6] hover:bg-blue-50" onClick={() => editAward(item)} data-testid={`button-edit-award-${item.id}`}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-[#E44E48] hover:bg-red-50" onClick={() => deleteAward(item.id)} data-testid={`button-delete-award-${item.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#8B95A1]">
                <CalendarIcon className="h-4 w-4" />
                <span data-testid={`text-award-date-${item.id}`}>{item.awardDate}</span>
              </div>
              {item.note && <p className="text-sm text-[#8B95A1]" data-testid={`text-award-note-${item.id}`}>{item.note}</p>}
            </div>
          ))}
          <Button 
            type="button" variant="outline" 
            className="w-full h-12 rounded-xl border-dashed border-[#B0B8C1] text-[#8B95A1] hover:text-[#3182F6] hover:border-[#3182F6] hover:bg-blue-50 font-bold"
            onClick={(e) => { e.preventDefault(); resetAwardForm(); setShowAwardDialog(true); }}
            data-testid="button-add-award"
          >
            <Plus className="h-5 w-5 mr-2" /> 수상/공모전 추가하기
          </Button>
        </CardContent>
      </Card>

      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BrainCircuit className="h-5 w-5 text-[#00BFA5]" /> 보유 역량 및 스킬
          </CardTitle>
          <CardDescription>보유한 역량을 선택하거나 직접 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B0B8C1]" />
            <Input 
              value={skillSearchQuery}
              onChange={(e) => setSkillSearchQuery(e.target.value)}
              placeholder="스킬 검색..."
              className="pl-10 h-11 rounded-xl bg-[#F9FAFB] border-[#E5E8EB] focus:border-[#3182F6] focus:ring-2 focus:ring-blue-100"
              data-testid="input-skill-search"
            />
            {skillSearchQuery && (
              <button
                onClick={() => setSkillSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B0B8C1] hover:text-[#4E5968]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {profileData.gen_skills.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-[#F9FAFB] rounded-xl">
              {profileData.gen_skills.map((skill) => (
                <Badge 
                  key={skill} 
                  variant="secondary" 
                  className="bg-[#E8F3FF] text-[#3182F6] hover:bg-[#D0E8FF] cursor-pointer px-3 py-1.5 text-sm font-medium"
                  onClick={() => toggleSkill(skill)}
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
                    const isSelected = profileData.gen_skills.includes(skill);
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

          <div className="pt-3 border-t border-[#F2F4F6]">
            <Label className="text-sm font-bold text-[#4E5968] mb-2 block">직접 입력</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="보유한 스킬을 직접 입력하세요"
                className="flex-1 h-10 rounded-xl bg-[#F2F4F6] border-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.currentTarget;
                    const value = input.value.trim();
                    if (value && !profileData.gen_skills.includes(value)) {
                      updateField('gen_skills', [...profileData.gen_skills, value]);
                      input.value = '';
                    }
                  }
                }}
                data-testid="input-custom-skill"
              />
              <Button 
                type="button"
                variant="outline"
                className="h-10 px-4 rounded-xl"
                onClick={(e) => {
                  const input = (e.currentTarget.previousSibling as HTMLInputElement);
                  const value = input.value.trim();
                  if (value && !profileData.gen_skills.includes(value)) {
                    updateField('gen_skills', [...profileData.gen_skills, value]);
                    input.value = '';
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-[#FFB300]" /> 희망 커리어 방향
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div id="field-gen_desiredIndustry" className="space-y-2 transition-all duration-300">
            <Label>희망 산업 분야</Label>
            <Input 
              placeholder="예: IT/플랫폼, 금융, 헬스케어" 
              value={profileData.gen_desiredIndustry}
              onChange={(e) => updateField('gen_desiredIndustry', e.target.value)}
              className="h-12 rounded-xl bg-[#F2F4F6] border-none"
            />
          </div>
          <div id="field-gen_desiredRole" className="space-y-2 transition-all duration-300">
            <Label>희망 직무</Label>
            <Input 
              placeholder="예: 서비스 기획자, 마케터" 
              value={profileData.gen_desiredRole}
              onChange={(e) => updateField('gen_desiredRole', e.target.value)}
              className="h-12 rounded-xl bg-[#F2F4F6] border-none"
            />
          </div>
          <div className="space-y-2">
            <Label>선호하는 업무 스타일</Label>
            <Select 
              value={profileData.gen_workStyle} 
              onValueChange={(val) => updateField('gen_workStyle', val)}
            >
              <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                <SelectValue placeholder="업무 스타일 선택" />
              </SelectTrigger>
              <SelectContent>
                {WORK_STYLES.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-[#FFB300]" /> 직업 가치관
          </CardTitle>
          <CardDescription>
            직업 선택 시 가장 중요하게 생각하는 가치 3가지를 선택해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {WORK_VALUE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = profileData.gen_workValues.includes(option.id);
              const isDisabled = !isSelected && profileData.gen_workValues.length >= 3;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleWorkValue(option.id)}
                  disabled={isDisabled}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    isSelected 
                      ? 'border-[#3182F6] bg-[#E8F3FF]' 
                      : isDisabled 
                        ? 'border-[#E5E8EB] bg-[#F9FAFB] opacity-50 cursor-not-allowed' 
                        : 'border-[#E5E8EB] hover:border-[#3182F6] hover:bg-[#F9FAFB]'
                  }`}
                >
                  <Icon className={`h-6 w-6 ${isSelected ? 'text-[#3182F6]' : 'text-[#8B95A1]'}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-[#3182F6]' : 'text-[#4E5968]'}`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-[#00BFA5]" /> 희망 연봉
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox 
              id="salary-no-pref" 
              checked={profileData.gen_salaryNoPreference}
              onCheckedChange={(checked) => {
                updateField('gen_salaryNoPreference', checked as boolean);
                if (checked) updateField('gen_salary', 0);
              }}
            />
            <label htmlFor="salary-no-pref" className="text-sm font-medium leading-none">
              희망 연봉 없음 (협의 가능)
            </label>
          </div>
          
          {!profileData.gen_salaryNoPreference && (
            isMobile ? (
              <Drawer open={showSalaryPicker} onOpenChange={setShowSalaryPicker}>
                <button
                  onClick={() => setShowSalaryPicker(true)}
                  className="w-full h-14 rounded-xl bg-[#F9FAFB] border border-[#E5E8EB] px-4 text-left text-lg font-bold text-[#191F28] hover:bg-[#E8F3FF] hover:border-[#3182F6] transition-colors flex items-center justify-between"
                >
                  <span>{profileData.gen_salary > 0 ? `${profileData.gen_salary.toLocaleString()} 만원` : '연봉 선택'}</span>
                  <DollarSign className="h-5 w-5 text-[#B0B8C1]" />
                </button>
                <DrawerContent className="max-h-[85vh] outline-none">
                  <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[#E5E8EB] mt-3 mb-1" />
                  <DrawerHeader className="text-left">
                    <DrawerTitle>희망 연봉 선택</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4 pb-8 overflow-y-auto">
                    <SalaryPickerContent />
                  </div>
                </DrawerContent>
              </Drawer>
            ) : (
              <Dialog open={showSalaryPicker} onOpenChange={setShowSalaryPicker}>
                <button
                  onClick={() => setShowSalaryPicker(true)}
                  className="w-full h-14 rounded-xl bg-[#F9FAFB] border border-[#E5E8EB] px-4 text-left text-lg font-bold text-[#191F28] hover:bg-[#E8F3FF] hover:border-[#3182F6] transition-colors flex items-center justify-between"
                >
                  <span>{profileData.gen_salary > 0 ? `${profileData.gen_salary.toLocaleString()} 만원` : '연봉 선택'}</span>
                  <DollarSign className="h-5 w-5 text-[#B0B8C1]" />
                </button>
                <DialogContent className="sm:max-w-[425px] md:max-w-xl bg-white border-none shadow-2xl rounded-[24px] p-0 overflow-hidden gap-0 [&>button]:hidden">
                  <DialogHeader className="p-6 pb-4 border-b border-[#F2F4F6] flex flex-row items-center justify-between space-y-0">
                    <DialogTitle className="text-xl font-bold text-[#191F28]">희망 연봉 선택</DialogTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-[#F2F4F6] hover:bg-[#E5E8EB]" onClick={() => setShowSalaryPicker(false)}>
                      <X className="h-4 w-4 text-[#333D4B]" />
                    </Button>
                  </DialogHeader>
                  <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <SalaryPickerContent />
                  </div>
                </DialogContent>
              </Dialog>
            )
          )}
        </CardContent>
      </Card>

      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BrainCircuit className="h-5 w-5 text-[#6366F1]" /> 선호 근무 환경
          </CardTitle>
          <CardDescription>선호하는 근무 환경을 선택해주세요 (복수 선택 가능)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox 
              id="env-no-pref" 
              checked={profileData.gen_environmentNoPreference}
              onCheckedChange={(checked) => {
                updateField('gen_environmentNoPreference', checked as boolean);
                if (checked) updateField('gen_environmentPreferences', []);
              }}
            />
            <label htmlFor="env-no-pref" className="text-sm font-medium leading-none">
              특별한 선호 없음
            </label>
          </div>

          <div className={`space-y-3 ${profileData.gen_environmentNoPreference ? 'opacity-50 pointer-events-none' : ''}`}>
            {ENVIRONMENT_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = profileData.gen_environmentPreferences.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleEnvironmentPreference(option.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-start gap-3 text-left ${
                    isSelected 
                      ? 'border-[#3182F6] bg-[#E8F3FF]' 
                      : 'border-[#E5E8EB] hover:border-[#3182F6] hover:bg-[#F9FAFB]'
                  }`}
                >
                  <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-[#3182F6]' : 'text-[#8B95A1]'}`} />
                  <div>
                    <span className={`text-sm font-medium block ${isSelected ? 'text-[#3182F6]' : 'text-[#191F28]'}`}>
                      {option.label}
                    </span>
                    <span className="text-xs text-[#8B95A1]">{option.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PenTool className="h-5 w-5 text-[#FF5252]" /> 진로 고민
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>현재 가장 큰 고민</Label>
            <Textarea 
              value={profileData.gen_concerns}
              onChange={(e) => updateField('gen_concerns', e.target.value)}
              placeholder="이직, 진로 변경 등 현재 가장 고민되는 점을 적어주세요." 
              className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-[#8B5CF6]" /> 추천인(레퍼런스)
          </CardTitle>
          <CardDescription>추천인 정보를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(profileData.gen_references || []).map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E8EB] space-y-2 relative group" data-testid={`card-reference-${item.id}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#191F28]" data-testid={`text-reference-name-${item.id}`}>{item.name}</h4>
                    <Badge variant="outline" className="text-xs border-indigo-400 text-indigo-600" data-testid={`badge-reference-relation-${item.id}`}>
                      {REFERENCE_RELATION_OPTIONS.find(o => o.value === item.relation)?.label}
                    </Badge>
                  </div>
                  {item.organization && <p className="text-[#4E5968] text-sm" data-testid={`text-reference-org-${item.id}`}>{item.organization}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-[#3182F6] hover:bg-blue-50" onClick={() => editReference(item)} data-testid={`button-edit-reference-${item.id}`}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-[#E44E48] hover:bg-red-50" onClick={() => deleteReference(item.id)} data-testid={`button-delete-reference-${item.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-[#8B95A1]">
                <span data-testid={`text-reference-phone-${item.id}`}>📞 {item.phone}</span>
                {item.email && <span data-testid={`text-reference-email-${item.id}`}>• ✉️ {item.email}</span>}
              </div>
              {item.note && <p className="text-sm text-[#8B95A1]" data-testid={`text-reference-note-${item.id}`}>{item.note}</p>}
            </div>
          ))}
          <Button 
            type="button" variant="outline" 
            className="w-full h-12 rounded-xl border-dashed border-[#B0B8C1] text-[#8B95A1] hover:text-[#3182F6] hover:border-[#3182F6] hover:bg-blue-50 font-bold"
            onClick={(e) => { e.preventDefault(); resetReferenceForm(); setShowReferenceDialog(true); }}
            data-testid="button-add-reference"
          >
            <Plus className="h-5 w-5 mr-2" /> 추천인 추가하기
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showWorkExperienceDialog} onOpenChange={setShowWorkExperienceDialog}>
        <DialogContent className="sm:max-w-md rounded-[24px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#191F28]">경력 추가</DialogTitle>
            <DialogDescription className="text-sm text-[#8B95A1]">
              이전 직장 경력을 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>회사명 *</Label>
              <Input 
                placeholder="예: 삼성전자"
                value={workExpForm.company}
                onChange={(e) => setWorkExpForm({...workExpForm, company: e.target.value})}
                className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                data-testid="input-work-company"
              />
            </div>
            <div className="space-y-2">
              <Label>직무 *</Label>
              <Input 
                placeholder="예: 마케팅 매니저"
                value={workExpForm.role}
                onChange={(e) => setWorkExpForm({...workExpForm, role: e.target.value})}
                className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                data-testid="input-work-role"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>시작일 *</Label>
                <Input 
                  type="month"
                  value={workExpForm.startDate ? format(workExpForm.startDate, 'yyyy-MM') : ''}
                  onChange={(e) => setWorkExpForm({...workExpForm, startDate: e.target.value ? new Date(e.target.value + '-01') : null})}
                  className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                  data-testid="input-work-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label>종료일</Label>
                <Input 
                  type="month"
                  placeholder="현재 재직 중"
                  value={workExpForm.endDate ? format(workExpForm.endDate, 'yyyy-MM') : ''}
                  onChange={(e) => setWorkExpForm({...workExpForm, endDate: e.target.value ? new Date(e.target.value + '-01') : null})}
                  className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                  data-testid="input-work-end-date"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>업무 설명</Label>
              <Textarea 
                placeholder="담당했던 주요 업무나 성과를 입력해주세요."
                value={workExpForm.description}
                onChange={(e) => setWorkExpForm({...workExpForm, description: e.target.value})}
                className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none"
                data-testid="input-work-description"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-xl border-[#E5E8EB]"
              onClick={() => {
                setWorkExpForm({ company: '', role: '', startDate: null, endDate: null, description: '' });
                setShowWorkExperienceDialog(false);
              }}
              data-testid="button-cancel-add-work"
            >
              취소
            </Button>
            <Button 
              className="flex-1 h-12 rounded-xl bg-[#3182F6] font-bold"
              onClick={addWorkExperience}
              data-testid="button-confirm-add-work"
            >
              추가하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLanguageTestDialog} onOpenChange={(open) => { if (!open) resetLanguageTestForm(); setShowLanguageTestDialog(open); }}>
        <DialogContent className="sm:max-w-md rounded-[24px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#191F28]">{editingLanguageTestId ? '어학 정보 수정' : '어학 시험 추가'}</DialogTitle>
            <DialogDescription className="text-sm text-[#8B95A1]">어학 시험 점수 또는 역량을 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>시험명 *</Label>
              <Select value={languageTestForm.examName} onValueChange={(val) => setLanguageTestForm({...languageTestForm, examName: val})}>
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-language-exam"><SelectValue placeholder="시험 선택" /></SelectTrigger>
                <SelectContent>
                  {LANGUAGE_EXAM_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="lang-pending" checked={languageTestForm.isPending} onCheckedChange={(checked) => setLanguageTestForm({...languageTestForm, isPending: checked as boolean})} data-testid="checkbox-language-pending" />
              <label htmlFor="lang-pending" className="text-sm font-medium leading-none">준비중/응시예정</label>
            </div>
            {!languageTestForm.isPending && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>점수 유형 *</Label>
                    <Select value={languageTestForm.scoreType} onValueChange={(val) => setLanguageTestForm({...languageTestForm, scoreType: val as 'grade' | 'score'})}>
                      <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-language-score-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="score">점수</SelectItem>
                        <SelectItem value="grade">등급</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{languageTestForm.scoreType === 'grade' ? '등급' : '점수'} *</Label>
                    <Input placeholder={languageTestForm.scoreType === 'grade' ? '예: N1, 6급' : '예: 950'} value={languageTestForm.scoreValue} onChange={(e) => setLanguageTestForm({...languageTestForm, scoreValue: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-language-score" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>취득일</Label>
                    <Input type="date" value={languageTestForm.acquiredDate} onChange={(e) => setLanguageTestForm({...languageTestForm, acquiredDate: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-language-acquired-date" />
                  </div>
                  <div className="space-y-2">
                    <Label>만료일</Label>
                    <Input type="date" value={languageTestForm.expiryDate || ''} onChange={(e) => setLanguageTestForm({...languageTestForm, expiryDate: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-language-expiry-date" />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>비고</Label>
              <Textarea placeholder="추가 설명이 있다면 입력하세요." value={languageTestForm.note || ''} onChange={(e) => setLanguageTestForm({...languageTestForm, note: e.target.value})} className="min-h-[80px] rounded-xl bg-[#F2F4F6] border-none resize-none" data-testid="textarea-language-note" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-12 rounded-xl border-[#E5E8EB]" onClick={() => { resetLanguageTestForm(); setShowLanguageTestDialog(false); }} data-testid="button-cancel-language">취소</Button>
            <Button className="flex-1 h-12 rounded-xl bg-[#3182F6] font-bold" onClick={addOrUpdateLanguageTest} data-testid="button-submit-language">{editingLanguageTestId ? '수정하기' : '추가하기'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLicenseDialog} onOpenChange={(open) => { if (!open) resetLicenseForm(); setShowLicenseDialog(open); }}>
        <DialogContent className="sm:max-w-md rounded-[24px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#191F28]">{editingLicenseId ? '자격증/면허 수정' : '자격증/면허 추가'}</DialogTitle>
            <DialogDescription className="text-sm text-[#8B95A1]">자격증 또는 면허 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>구분 *</Label>
                <Select value={licenseForm.category} onValueChange={(val) => setLicenseForm({...licenseForm, category: val as 'license' | 'certificate'})}>
                  <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-license-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LICENSE_CATEGORY_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>상태 *</Label>
                <Select value={licenseForm.status} onValueChange={(val) => setLicenseForm({...licenseForm, status: val as 'acquired' | 'preparing' | 'expired'})}>
                  <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-license-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LICENSE_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>종류</Label>
              <Input placeholder="예: 국가기술, 민간, 운전면허 등" value={licenseForm.licenseType} onChange={(e) => setLicenseForm({...licenseForm, licenseType: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-license-type" />
            </div>
            <div className="space-y-2">
              <Label>자격/면허명 *</Label>
              <Input placeholder="예: 정보처리기사, 1종 보통" value={licenseForm.title} onChange={(e) => setLicenseForm({...licenseForm, title: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-license-title" />
            </div>
            <div className="space-y-2">
              <Label>발급기관 *</Label>
              <Input placeholder="예: 한국산업인력공단" value={licenseForm.issuer} onChange={(e) => setLicenseForm({...licenseForm, issuer: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-license-issuer" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>취득일</Label>
                <Input type="date" value={licenseForm.acquiredDate || ''} onChange={(e) => setLicenseForm({...licenseForm, acquiredDate: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-license-acquired-date" />
              </div>
              <div className="space-y-2">
                <Label>만료일</Label>
                <Input type="date" value={licenseForm.expiryDate || ''} onChange={(e) => setLicenseForm({...licenseForm, expiryDate: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-license-expiry-date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>자격번호</Label>
              <Input placeholder="자격증 번호 (선택)" value={licenseForm.licenseNumber || ''} onChange={(e) => setLicenseForm({...licenseForm, licenseNumber: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-license-number" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-12 rounded-xl border-[#E5E8EB]" onClick={() => { resetLicenseForm(); setShowLicenseDialog(false); }} data-testid="button-cancel-license">취소</Button>
            <Button className="flex-1 h-12 rounded-xl bg-[#3182F6] font-bold" onClick={addOrUpdateLicense} data-testid="button-submit-license">{editingLicenseId ? '수정하기' : '추가하기'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAwardDialog} onOpenChange={(open) => { if (!open) resetAwardForm(); setShowAwardDialog(open); }}>
        <DialogContent className="sm:max-w-md rounded-[24px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#191F28]">{editingAwardId ? '수상/공모전 수정' : '수상/공모전 추가'}</DialogTitle>
            <DialogDescription className="text-sm text-[#8B95A1]">수상 경력 또는 공모전 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>유형 *</Label>
                <Select value={awardForm.awardType} onValueChange={(val) => setAwardForm({...awardForm, awardType: val as 'award' | 'competition' | 'contest' | 'other'})}>
                  <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-award-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AWARD_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>순위/등급</Label>
                <Select value={awardForm.rank} onValueChange={(val) => setAwardForm({...awardForm, rank: val})}>
                  <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-award-rank"><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent>
                    {AWARD_RANK_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>상명/공모전명 + 주최기관 *</Label>
              <Input placeholder="예: 전국 창업경진대회 최우수상 (중소벤처기업부)" value={awardForm.titleAndHost} onChange={(e) => setAwardForm({...awardForm, titleAndHost: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-award-title" />
            </div>
            <div className="space-y-2">
              <Label>수상/입상일 *</Label>
              <Input type="date" value={awardForm.awardDate} onChange={(e) => setAwardForm({...awardForm, awardDate: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-award-date" />
            </div>
            <div className="space-y-2">
              <Label>비고</Label>
              <Textarea placeholder="추가 설명이 있다면 입력하세요." value={awardForm.note || ''} onChange={(e) => setAwardForm({...awardForm, note: e.target.value})} className="min-h-[80px] rounded-xl bg-[#F2F4F6] border-none resize-none" data-testid="textarea-award-note" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-12 rounded-xl border-[#E5E8EB]" onClick={() => { resetAwardForm(); setShowAwardDialog(false); }} data-testid="button-cancel-award">취소</Button>
            <Button className="flex-1 h-12 rounded-xl bg-[#3182F6] font-bold" onClick={addOrUpdateAward} data-testid="button-submit-award">{editingAwardId ? '수정하기' : '추가하기'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReferenceDialog} onOpenChange={(open) => { if (!open) resetReferenceForm(); setShowReferenceDialog(open); }}>
        <DialogContent className="sm:max-w-md rounded-[24px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#191F28]">{editingReferenceId ? '추천인 수정' : '추천인 추가'}</DialogTitle>
            <DialogDescription className="text-sm text-[#8B95A1]">추천인 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>관계 *</Label>
              <Select value={referenceForm.relation} onValueChange={(val) => setReferenceForm({...referenceForm, relation: val as 'professor' | 'supervisor' | 'colleague' | 'acquaintance' | 'other'})}>
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-reference-relation"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REFERENCE_RELATION_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>추천인 성명 *</Label>
              <Input placeholder="예: 홍길동" value={referenceForm.name} onChange={(e) => setReferenceForm({...referenceForm, name: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-reference-name" />
            </div>
            <div className="space-y-2">
              <Label>소속/기관</Label>
              <Input placeholder="예: ㅇㅇ대학교 경영학과" value={referenceForm.organization || ''} onChange={(e) => setReferenceForm({...referenceForm, organization: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-reference-org" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>연락처 *</Label>
                <Input placeholder="010-0000-0000" value={referenceForm.phone} onChange={(e) => setReferenceForm({...referenceForm, phone: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-reference-phone" />
              </div>
              <div className="space-y-2">
                <Label>이메일</Label>
                <Input placeholder="email@example.com" value={referenceForm.email || ''} onChange={(e) => setReferenceForm({...referenceForm, email: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-reference-email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>비고</Label>
              <Textarea placeholder="추가 설명이 있다면 입력하세요." value={referenceForm.note || ''} onChange={(e) => setReferenceForm({...referenceForm, note: e.target.value})} className="min-h-[80px] rounded-xl bg-[#F2F4F6] border-none resize-none" data-testid="textarea-reference-note" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-12 rounded-xl border-[#E5E8EB]" onClick={() => { resetReferenceForm(); setShowReferenceDialog(false); }} data-testid="button-cancel-reference">취소</Button>
            <Button className="flex-1 h-12 rounded-xl bg-[#3182F6] font-bold" onClick={addOrUpdateReference} data-testid="button-submit-reference">{editingReferenceId ? '수정하기' : '추가하기'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEducationDialog} onOpenChange={(open) => { if (!open) resetEducationForm(); setShowEducationDialog(open); }}>
        <DialogContent className="sm:max-w-lg rounded-[24px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#191F28]">{editingEducationId ? '학력 수정' : '학력 추가'}</DialogTitle>
            <DialogDescription className="text-sm text-[#8B95A1]">학력 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>학력 구분 *</Label>
              <Select value={educationForm.educationLevel} onValueChange={(val) => setEducationForm({...educationForm, educationLevel: val as EducationItem['educationLevel']})}>
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-education-level"><SelectValue placeholder="학력 구분 선택" /></SelectTrigger>
                <SelectContent>
                  {EDUCATION_LEVEL_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {educationForm.educationLevel === 'university' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>대학구분 *</Label>
                  <Select value={educationForm.universityType || '4year'} onValueChange={(val) => setEducationForm({...educationForm, universityType: val as EducationItem['universityType']})}>
                    <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-education-university-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNIVERSITY_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>전공계열</Label>
                  <Select value={educationForm.majorCategory || ''} onValueChange={(val) => setEducationForm({...educationForm, majorCategory: val})}>
                    <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-education-major-category"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                      {MAJOR_CATEGORY_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>학교명 *</Label>
                <Input placeholder="학교명 입력" value={educationForm.schoolName} onChange={(e) => setEducationForm({...educationForm, schoolName: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-education-school" />
              </div>
              <div className="space-y-2">
                <Label>졸업여부 *</Label>
                <Select value={educationForm.graduationStatus} onValueChange={(val) => setEducationForm({...educationForm, graduationStatus: val as EducationItem['graduationStatus']})}>
                  <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-education-graduation-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRADUATION_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(educationForm.educationLevel === 'university' || educationForm.educationLevel === 'high') && (
              <div className="flex items-center gap-4">
                {educationForm.educationLevel === 'high' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox id="edu-ged" checked={educationForm.isGed || false} onCheckedChange={(checked) => setEducationForm({...educationForm, isGed: checked as boolean})} data-testid="checkbox-education-ged" />
                    <label htmlFor="edu-ged" className="text-sm font-medium leading-none">대입 검정고시</label>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox id="edu-transfer" checked={educationForm.isTransfer || false} onCheckedChange={(checked) => setEducationForm({...educationForm, isTransfer: checked as boolean})} data-testid="checkbox-education-transfer" />
                  <label htmlFor="edu-transfer" className="text-sm font-medium leading-none">편입</label>
                </div>
              </div>
            )}

            {educationForm.educationLevel === 'university' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>전공 *</Label>
                  <Input placeholder="예: 경영학과" value={educationForm.major || ''} onChange={(e) => setEducationForm({...educationForm, major: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-education-major" />
                </div>
                <div className="space-y-2">
                  <Label>추가전공</Label>
                  <Input placeholder="복수/부전공" value={educationForm.subMajor || ''} onChange={(e) => setEducationForm({...educationForm, subMajor: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-education-sub-major" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>입학년월</Label>
                <Input type="month" value={educationForm.entranceDate} onChange={(e) => setEducationForm({...educationForm, entranceDate: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-education-entrance" />
              </div>
              <div className="space-y-2">
                <Label>졸업년월</Label>
                <Input type="month" value={educationForm.graduationDate || ''} onChange={(e) => setEducationForm({...educationForm, graduationDate: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-education-graduation" />
              </div>
            </div>

            {educationForm.educationLevel === 'university' && (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>학점</Label>
                  <Input placeholder="예: 3.8" value={educationForm.gpa || ''} onChange={(e) => setEducationForm({...educationForm, gpa: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-education-gpa" />
                </div>
                <div className="space-y-2">
                  <Label>만점기준</Label>
                  <Select value={educationForm.gpaScale || '4.5'} onValueChange={(val) => setEducationForm({...educationForm, gpaScale: val})}>
                    <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-education-gpa-scale"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4.5">4.5</SelectItem>
                      <SelectItem value="4.3">4.3</SelectItem>
                      <SelectItem value="4.0">4.0</SelectItem>
                      <SelectItem value="100">100점</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>주/야간</Label>
                  <Select value={educationForm.dayNight || 'day'} onValueChange={(val) => setEducationForm({...educationForm, dayNight: val as 'day' | 'night'})}>
                    <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-education-day-night"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">주간</SelectItem>
                      <SelectItem value="night">야간</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {educationForm.educationLevel === 'university' && (
              <div className="space-y-2">
                <Label>지역</Label>
                <Input placeholder="예: 서울" value={educationForm.region || ''} onChange={(e) => setEducationForm({...educationForm, region: e.target.value})} className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="input-education-region" />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-12 rounded-xl border-[#E5E8EB]" onClick={() => { resetEducationForm(); setShowEducationDialog(false); }} data-testid="button-cancel-education">취소</Button>
            <Button className="flex-1 h-12 rounded-xl bg-[#3182F6] font-bold" onClick={addOrUpdateEducation} data-testid="button-submit-education">{editingEducationId ? '수정하기' : '추가하기'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const GeneralForm = memo(GeneralFormComponent);
