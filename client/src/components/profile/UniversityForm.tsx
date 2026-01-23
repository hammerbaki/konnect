import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GraduationCap, Languages, Briefcase, Smile, PenTool, Plus, X } from "lucide-react";
import { ProfileFormProps } from './types';
import { useToast } from '@/hooks/use-toast';

const MAJOR_CATEGORIES = [
  "인문계열", "사회계열", "교육계열", "자연계열", 
  "공학계열", "의약계열", "예체능계열", "융합/특수계열"
];
const GRADES = [1, 2, 3, 4, 5];
const GPA_OPTIONS = Array.from({ length: 46 }, (_, i) => (4.5 - (i * 0.1)).toFixed(1));
const LANGUAGE_TESTS = ["TOEIC", "TOEIC Speaking", "OPIc", "TOEFL", "TEPS", "JLPT", "HSK", "DELF/DALF", "TestDaF", "기타"];
const SKILLS_TO_DEVELOP = ["의사소통", "리더십", "팀워크", "문제해결", "데이터분석", "외국어", "IT/SW역량", "직무전문성"];

const UniversityFormComponent: React.FC<ProfileFormProps> = ({ profileData, updateField }) => {
  const { toast } = useToast();
  const [showLanguageScoreDialog, setShowLanguageScoreDialog] = useState(false);
  const [languageScoreForm, setLanguageScoreForm] = useState({ type: '', score: '' });

  const addLanguageScore = () => {
    if (!languageScoreForm.type || !languageScoreForm.score) {
      toast({ title: "필수 항목을 입력해주세요", description: "시험 유형과 점수를 모두 입력해주세요.", variant: "destructive", duration: 3000 });
      return;
    }
    const newScore = { id: Date.now(), type: languageScoreForm.type, score: languageScoreForm.score };
    updateField('univ_languageTests', [...profileData.univ_languageTests, newScore]);
    setLanguageScoreForm({ type: '', score: '' });
    setShowLanguageScoreDialog(false);
  };

  const deleteLanguageScore = (id: number) => {
    updateField('univ_languageTests', profileData.univ_languageTests.filter(t => t.id !== id));
  };

  const toggleSkill = (skill: string, checked: boolean) => {
    if (checked) {
      updateField('univ_skillsToDevelop', [...profileData.univ_skillsToDevelop, skill]);
    } else {
      updateField('univ_skillsToDevelop', profileData.univ_skillsToDevelop.filter(s => s !== skill));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="h-5 w-5 text-[#3182F6]" /> 학력 및 전공 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>대학교</Label>
            <Input 
              placeholder="예: 서울대학교" 
              value={profileData.univ_schoolName}
              onChange={(e) => updateField('univ_schoolName', e.target.value)}
              className="h-12 rounded-xl bg-[#F2F4F6] border-none"
            />
          </div>
          <div className="space-y-2">
            <Label>전공 계열</Label>
            <Select 
              value={profileData.univ_majorCategory} 
              onValueChange={(val) => updateField('univ_majorCategory', val)}
            >
              <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                <SelectValue placeholder="계열 선택" />
              </SelectTrigger>
              <SelectContent>
                {MAJOR_CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div id="field-univ_majorName" className="space-y-2 transition-all duration-300">
            <Label>상세 전공 (학과명)</Label>
            <Input 
              placeholder="예: 경영학과, 컴퓨터공학부" 
              value={profileData.univ_majorName}
              onChange={(e) => updateField('univ_majorName', e.target.value)}
              className="h-12 rounded-xl bg-[#F2F4F6] border-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>학년</Label>
              <Select 
                value={profileData.univ_grade} 
                onValueChange={(val) => updateField('univ_grade', val)}
              >
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                  <SelectValue placeholder="학년 선택" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map(g => (
                    <SelectItem key={g} value={g.toString()}>{g === 5 ? "5학년 이상 (초과)" : `${g}학년`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>학기</Label>
              <Select 
                value={profileData.univ_semester} 
                onValueChange={(val) => updateField('univ_semester', val)}
              >
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                  <SelectValue placeholder="학기 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1학기</SelectItem>
                  <SelectItem value="2">2학기</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>총 학점 (GPA)</Label>
            <Select 
              value={profileData.univ_gpa} 
              onValueChange={(val) => updateField('univ_gpa', val)}
            >
              <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                <SelectValue placeholder="학점 선택 (4.5 만점 기준)" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {GPA_OPTIONS.map(score => (
                  <SelectItem key={score} value={score}>{score}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Languages className="h-5 w-5 text-[#FFB300]" /> 어학 및 자격증
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>어학 점수</Label>
            {profileData.univ_languageTests.map((test) => (
              <div key={test.id} className="flex items-center gap-2">
                <div className="flex-1 p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E8EB] text-sm font-medium">
                  {test.type} <span className="text-[#3182F6] font-bold ml-2">{test.score}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteLanguageScore(test.id)}
                  data-testid={`button-delete-language-${test.id}`}
                >
                  <X className="h-4 w-4 text-[#B0B8C1]" />
                </Button>
              </div>
            ))}
            
            <Button 
              type="button"
              variant="outline" 
              className="w-full h-12 rounded-xl border-dashed border-[#B0B8C1] text-[#8B95A1] hover:text-[#3182F6] hover:border-[#3182F6] hover:bg-blue-50 font-bold"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowLanguageScoreDialog(true);
              }}
              data-testid="button-add-language-score"
            >
              <Plus className="h-5 w-5 mr-2" /> 어학 점수 추가하기
            </Button>
          </div>
          <div className="space-y-2 mt-4">
            <Label>기타 자격증 / 수상 경력</Label>
            <Textarea 
              value={profileData.univ_certificates}
              onChange={(e) => updateField('univ_certificates', e.target.value)}
              placeholder="취득한 자격증이나 공모전 수상 내역을 입력해주세요." 
              className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5 text-[#00BFA5]" /> 경력 준비 및 역량
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>취업 준비도 (자신감)</Label>
            <Select 
              value={profileData.univ_careerReadiness} 
              onValueChange={(val) => updateField('univ_careerReadiness', val)}
            >
              <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                <SelectValue placeholder="선택해주세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">매우 준비됨 (자신있음)</SelectItem>
                <SelectItem value="4">어느 정도 준비됨</SelectItem>
                <SelectItem value="3">보통</SelectItem>
                <SelectItem value="2">아직 부족함</SelectItem>
                <SelectItem value="1">전혀 준비되지 않음</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>진로 목표 명확성</Label>
            <Select 
              value={profileData.univ_careerGoalClear} 
              onValueChange={(val) => updateField('univ_careerGoalClear', val)}
            >
              <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                <SelectValue placeholder="선택해주세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">매우 명확함</SelectItem>
                <SelectItem value="4">비교적 명확함</SelectItem>
                <SelectItem value="3">고민 중임</SelectItem>
                <SelectItem value="2">잘 모르겠음</SelectItem>
                <SelectItem value="1">전혀 없음</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div id="field-univ_desiredIndustry" className="space-y-2 transition-all duration-300">
            <Label>희망 산업 분야</Label>
            <Input 
              placeholder="예: IT/플랫폼, 금융, 헬스케어, 제조업" 
              value={profileData.univ_desiredIndustry}
              onChange={(e) => updateField('univ_desiredIndustry', e.target.value)}
              className="h-12 rounded-xl bg-[#F2F4F6] border-none"
            />
          </div>

          <div className="space-y-2">
            <Label>인턴십/현장실습 경험</Label>
            <Select 
              value={profileData.univ_internshipStatus} 
              onValueChange={(val) => updateField('univ_internshipStatus', val)}
            >
              <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                <SelectValue placeholder="경험 여부 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">완료함 (경험 있음)</SelectItem>
                <SelectItem value="in_progress">현재 진행 중</SelectItem>
                <SelectItem value="planning">계획 중임</SelectItem>
                <SelectItem value="none">없음 / 계획 없음</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>개발하고 싶은 핵심 역량 (중복 선택)</Label>
            <div className="grid grid-cols-2 gap-2">
              {SKILLS_TO_DEVELOP.map((skill) => (
                <div key={skill} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`skill-${skill}`} 
                    checked={profileData.univ_skillsToDevelop.includes(skill)}
                    onCheckedChange={(checked) => toggleSkill(skill, checked as boolean)}
                  />
                  <label htmlFor={`skill-${skill}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {skill}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smile className="h-5 w-5 text-[#FFB300]" /> 커리어 준비 환경 및 리소스 점검
          </CardTitle>
          <CardDescription>성공적인 커리어 로드맵 설계를 위해 현재 준비 환경을 점검합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-[#4E5968]">준비 집중도 및 컨디션</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>학업/취업 준비 스트레스</Label>
                <Select 
                  value={profileData.univ_academicStress} 
                  onValueChange={(val) => updateField('univ_academicStress', val)}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                    <SelectValue placeholder="1 (낮음) - 5 (높음)" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={n.toString()}>{n}점 ({n===1?'낮음':n===5?'높음':''})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>경제적 고민 수준</Label>
                <Select 
                  value={profileData.univ_financialStress} 
                  onValueChange={(val) => updateField('univ_financialStress', val)}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                    <SelectValue placeholder="1 (낮음) - 5 (높음)" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={n.toString()}>{n}점 ({n===1?'낮음':n===5?'높음':''})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>일 평균 수면 시간 (컨디션 관리)</Label>
                <Input 
                  type="number"
                  placeholder="시간 입력 (예: 6)" 
                  value={profileData.univ_sleepHours}
                  onChange={(e) => updateField('univ_sleepHours', e.target.value)}
                  className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                />
              </div>
              <div className="space-y-2">
                <Label>현재 심리적 에너지 수준</Label>
                <Select 
                  value={profileData.univ_mentalWellbeing} 
                  onValueChange={(val) => updateField('univ_mentalWellbeing', val)}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Thriving">매우 좋음 (Thriving)</SelectItem>
                    <SelectItem value="Managing">보통/관리 중 (Managing)</SelectItem>
                    <SelectItem value="Struggling">다소 지침 (Struggling)</SelectItem>
                    <SelectItem value="In crisis">번아웃/충전 필요 (In crisis)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-bold text-sm text-[#4E5968]">시간 자원 관리 (주간 평균 시간)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>경제 활동 (아르바이트 등)</Label>
                <div className="relative">
                  <Input 
                    type="number"
                    placeholder="0" 
                    value={profileData.univ_workloadWorkHours}
                    onChange={(e) => updateField('univ_workloadWorkHours', e.target.value)}
                    className="h-12 rounded-xl bg-[#F2F4F6] border-none pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#8B95A1]">시간</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>전공 학습 및 취업 준비</Label>
                <div className="relative">
                  <Input 
                    type="number"
                    placeholder="0" 
                    value={profileData.univ_workloadStudyHours}
                    onChange={(e) => updateField('univ_workloadStudyHours', e.target.value)}
                    className="h-12 rounded-xl bg-[#F2F4F6] border-none pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#8B95A1]">시간</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-bold text-sm text-[#4E5968]">인적 네트워크 (Social Capital)</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>교내 네트워킹/소속감</Label>
                <Select 
                  value={profileData.univ_belongingScore} 
                  onValueChange={(val) => updateField('univ_belongingScore', val)}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                    <SelectValue placeholder="1 (전혀 없음) - 5 (매우 높음)" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={n.toString()}>{n}점</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <Label className="flex-1">진로 고민을 나눌 수 있는 멘토 또는 동료가 있나요?</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="support-yes" 
                      checked={profileData.univ_hasSupportPerson}
                      onCheckedChange={() => updateField('univ_hasSupportPerson', true)}
                    />
                    <label htmlFor="support-yes">네</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="support-no" 
                      checked={!profileData.univ_hasSupportPerson}
                      onCheckedChange={() => updateField('univ_hasSupportPerson', false)}
                    />
                    <label htmlFor="support-no">아니오</label>
                  </div>
                </div>
              </div>
            </div>
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
              value={profileData.univ_concerns}
              onChange={(e) => updateField('univ_concerns', e.target.value)}
              placeholder="취업 준비, 진로 선택 등 현재 가장 고민되는 점을 적어주세요." 
              className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={showLanguageScoreDialog} onOpenChange={setShowLanguageScoreDialog}>
        <DialogContent className="sm:max-w-md rounded-[24px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#191F28]">어학 점수 추가</DialogTitle>
            <DialogDescription className="text-sm text-[#8B95A1]">
              보유한 어학 시험 점수를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>시험 유형 *</Label>
              <Select 
                value={languageScoreForm.type} 
                onValueChange={(val) => setLanguageScoreForm({...languageScoreForm, type: val})}
              >
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none" data-testid="select-language-type">
                  <SelectValue placeholder="시험 선택" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_TESTS.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>점수 또는 등급 *</Label>
              <Input 
                placeholder="예: 850, IH, N2"
                value={languageScoreForm.score}
                onChange={(e) => setLanguageScoreForm({...languageScoreForm, score: e.target.value})}
                className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                data-testid="input-language-score"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-xl border-[#E5E8EB]"
              onClick={() => {
                setLanguageScoreForm({ type: '', score: '' });
                setShowLanguageScoreDialog(false);
              }}
              data-testid="button-cancel-add-language"
            >
              취소
            </Button>
            <Button 
              className="flex-1 h-12 rounded-xl bg-[#3182F6] font-bold"
              onClick={addLanguageScore}
              data-testid="button-confirm-add-language"
            >
              추가하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const UniversityForm = memo(UniversityFormComponent);
