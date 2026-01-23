import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { School, AlertTriangle } from "lucide-react";
import { ProfileFormProps } from './types';

const GRADES = [1, 2, 3];
const CLASSES = Array.from({ length: 15 }, (_, i) => i + 1);
const GRADE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const MAJOR_TRACKS = ["인문계열", "사회계열", "자연계열", "공학계열", "의약계열", "교육계열", "예체능계열", "기타"];
const MBTI_TYPES = ["ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP", "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ"];
const SUBJECTS = [
  { id: 'korean', label: '국어' },
  { id: 'math', label: '수학' },
  { id: 'english', label: '영어' },
  { id: 'social', label: '사회' },
  { id: 'science', label: '과학' },
  { id: 'history', label: '한국사' },
];

const HighSchoolFormComponent: React.FC<ProfileFormProps> = ({ profileData, updateField, updateNestedField }) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <School className="h-5 w-5 text-[#3182F6]" /> 학교 생활 정보 (고등)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>학교명</Label>
            <Input 
              placeholder="예: 한국고등학교"
              value={profileData.high_schoolName}
              onChange={(e) => updateField('high_schoolName', e.target.value)}
              className="h-12 rounded-xl bg-[#F2F4F6] border-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>학년</Label>
              <Select 
                value={profileData.high_grade} 
                onValueChange={(val) => updateField('high_grade', val)}
              >
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                  <SelectValue placeholder="학년 선택" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map(g => (
                    <SelectItem key={g} value={g.toString()}>{g}학년</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>반</Label>
              <Select 
                value={profileData.high_class} 
                onValueChange={(val) => updateField('high_class', val)}
              >
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                  <SelectValue placeholder="반 선택" />
                </SelectTrigger>
                <SelectContent>
                  {CLASSES.map(c => (
                    <SelectItem key={c} value={c.toString()}>{c}반</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>평균 내신 등급</Label>
            <Select 
              value={profileData.high_academicScore} 
              onValueChange={(val) => updateField('high_academicScore', val)}
            >
              <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                <SelectValue placeholder="등급 선택" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_LEVELS.map(s => (
                  <SelectItem key={s} value={s.toString()}>{s}등급</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2">
            <Label className="text-base font-bold text-[#191F28] mb-4 block">주요 과목 성적 (내신)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SUBJECTS.map((subj) => (
                <div key={subj.id} className="space-y-1">
                  <Label className="text-xs text-[#8B95A1]">{subj.label}</Label>
                  <Select 
                    value={profileData.high_subject_scores[subj.id as keyof typeof profileData.high_subject_scores]} 
                    onValueChange={(val) => updateNestedField('high_subject_scores', subj.id, val)}
                  >
                    <SelectTrigger className="h-10 bg-[#F2F4F6] border-none rounded-lg">
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_LEVELS.map(s => (
                        <SelectItem key={s} value={s.toString()}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>희망 학업계열</Label>
            <Select 
              value={profileData.high_majorTrack} 
              onValueChange={(val) => updateField('high_majorTrack', val)}
            >
              <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                <SelectValue placeholder="계열 선택" />
              </SelectTrigger>
              <SelectContent>
                {MAJOR_TRACKS.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div id="field-high_hopeUniversity" className="space-y-2 transition-all duration-300">
            <Label>희망 대학</Label>
            <Input 
              placeholder="예: 서울대학교, 연세대학교" 
              value={profileData.high_hopeUniversity}
              onChange={(e) => updateField('high_hopeUniversity', e.target.value)}
              className="h-12 rounded-xl bg-[#F2F4F6] border-none"
            />
          </div>

          <div id="field-high_careerHope" className="space-y-2 transition-all duration-300">
            <Label>진로 희망</Label>
            <Input 
              placeholder="예: 소프트웨어 개발자, 의사" 
              value={profileData.high_careerHope}
              onChange={(e) => updateField('high_careerHope', e.target.value)}
              className="h-12 rounded-xl bg-[#F2F4F6] border-none"
            />
          </div>

          <div className="space-y-2">
            <Label>활동 참여 현황</Label>
            <Textarea 
              value={profileData.high_activityStatus}
              onChange={(e) => updateField('high_activityStatus', e.target.value)}
              placeholder="동아리, 봉사활동, 교내 대회 등 참여한 활동을 적어주세요." 
              className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>좋아하는 과목</Label>
              <Input 
                value={profileData.high_favoriteSubject}
                onChange={(e) => updateField('high_favoriteSubject', e.target.value)}
                className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                placeholder="예: 수학"
              />
            </div>
            <div className="space-y-2">
              <Label>싫어하는 과목</Label>
              <Input 
                value={profileData.high_dislikedSubject}
                onChange={(e) => updateField('high_dislikedSubject', e.target.value)}
                className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                placeholder="예: 영어"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>성격 특성 (MBTI)</Label>
              <Select 
                value={profileData.high_mbti} 
                onValueChange={(val) => updateField('high_mbti', val)}
              >
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                  <SelectValue placeholder="MBTI 선택" />
                </SelectTrigger>
                <SelectContent>
                  {MBTI_TYPES.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex flex-col justify-center">
              <Label className="mb-2">유학 희망 여부</Label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="study-abroad" 
                  checked={profileData.high_studyAbroad}
                  onCheckedChange={(checked) => updateField('high_studyAbroad', checked as boolean)}
                />
                <label htmlFor="study-abroad" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  희망함
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>취미 / 관심사</Label>
            <Input 
              value={profileData.high_hobbies}
              onChange={(e) => updateField('high_hobbies', e.target.value)}
              className="h-12 rounded-xl bg-[#F2F4F6] border-none"
              placeholder="예: 독서, 게임, 축구"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-[#F2F4F6]">
            <h4 className="font-bold text-[#191F28] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#FF5252]" /> 심리/정서 상태 체크
            </h4>
            <p className="text-xs text-[#8B95A1] -mt-2">
              학생의 정서적 안정을 위해 솔직하게 답변해주세요. (비공개 처리됩니다)
            </p>
            
            <div className="space-y-3">
              <Label>최근 2주간 느끼는 스트레스 정도</Label>
              <Select 
                value={profileData.high_stressLevel} 
                onValueChange={(val) => updateField('high_stressLevel', val)}
              >
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                  <SelectValue placeholder="선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">거의 없음 (편안함)</SelectItem>
                  <SelectItem value="moderate">가끔 스트레스를 받음</SelectItem>
                  <SelectItem value="high">자주 스트레스를 받음</SelectItem>
                  <SelectItem value="severe">매우 심한 스트레스를 받음 (힘듦)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>최근 수면 패턴의 변화</Label>
              <Select 
                value={profileData.high_sleepPattern} 
                onValueChange={(val) => updateField('high_sleepPattern', val)}
              >
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                  <SelectValue placeholder="선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">변화 없음 (잘 잠)</SelectItem>
                  <SelectItem value="insomnia">잠들기 어렵거나 자주 깸</SelectItem>
                  <SelectItem value="hypersomnia">평소보다 너무 많이 잠</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label>진로 고민 사항</Label>
            <Textarea 
              value={profileData.high_concerns}
              onChange={(e) => updateField('high_concerns', e.target.value)}
              placeholder="진로와 관련하여 현재 가장 고민되는 점을 자유롭게 적어주세요." 
              className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const HighSchoolForm = memo(HighSchoolFormComponent);
