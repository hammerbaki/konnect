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
  Armchair, HardHat, AlertTriangle, Plus, Trash2, X, Check, Search, Calendar as CalendarIcon
} from "lucide-react";
import { ProfileFormProps } from './types';
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

const GeneralFormComponent: React.FC<ProfileFormProps> = ({ profileData, updateField }) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [showWorkExperienceDialog, setShowWorkExperienceDialog] = useState(false);
  const [workExpForm, setWorkExpForm] = useState({ company: '', role: '', startDate: null as Date | null, endDate: null as Date | null, description: '' });
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [showSalaryPicker, setShowSalaryPicker] = useState(false);

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
    </div>
  );
};

export const GeneralForm = memo(GeneralFormComponent);
