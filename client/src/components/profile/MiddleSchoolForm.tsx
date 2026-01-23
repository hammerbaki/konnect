import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { School } from "lucide-react";
import { ProfileFormProps } from './types';

const GRADES = [1, 2, 3];
const CLASSES = Array.from({ length: 15 }, (_, i) => i + 1);
const HIGH_SCHOOL_PLANS = [
  { value: "general", label: "일반고등학교" },
  { value: "special_purpose", label: "특수목적고 (과학고/외고 등)" },
  { value: "specialized", label: "특성화고등학교" },
  { value: "autonomous", label: "자율형 사립고" },
  { value: "undecided", label: "아직 모르겠음" },
];
const ACADEMIC_SCORES = [
  { value: "high", label: "상위권 (90점 이상)" },
  { value: "mid-high", label: "중상위권 (80-90점)" },
  { value: "mid", label: "중위권 (70-80점)" },
  { value: "mid-low", label: "중하위권 (60-70점)" },
  { value: "low", label: "하위권 (60점 미만)" },
];

const MiddleSchoolFormComponent: React.FC<ProfileFormProps> = ({ profileData, updateField }) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <School className="h-5 w-5 text-[#3182F6]" /> 학교 생활 정보 (중등)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>학교명</Label>
            <Input 
              placeholder="예: 한국중학교"
              value={profileData.mid_schoolName}
              onChange={(e) => updateField('mid_schoolName', e.target.value)}
              className="h-12 rounded-xl bg-[#F2F4F6] border-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>학년</Label>
              <Select 
                value={profileData.mid_grade} 
                onValueChange={(val) => updateField('mid_grade', val)}
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
                value={profileData.mid_class} 
                onValueChange={(val) => updateField('mid_class', val)}
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
            <Label>주요 과목 성적 (대략적인 수준)</Label>
            <Select 
              value={profileData.mid_academicScore} 
              onValueChange={(val) => updateField('mid_academicScore', val)}
            >
              <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                <SelectValue placeholder="성적 수준 선택" />
              </SelectTrigger>
              <SelectContent>
                {ACADEMIC_SCORES.map(score => (
                  <SelectItem key={score.value} value={score.value}>{score.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>좋아하는 과목</Label>
              <Input 
                value={profileData.mid_favoriteSubject}
                onChange={(e) => updateField('mid_favoriteSubject', e.target.value)}
                className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                placeholder="예: 수학, 체육"
              />
            </div>
            <div className="space-y-2">
              <Label>싫어하는 과목</Label>
              <Input 
                value={profileData.mid_dislikedSubject}
                onChange={(e) => updateField('mid_dislikedSubject', e.target.value)}
                className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                placeholder="예: 영어"
              />
            </div>
          </div>

          <Separator className="my-2"/>

          <div className="space-y-2">
            <Label>장래희망</Label>
            <Input 
              placeholder="예: 프로그래머, 디자이너" 
              value={profileData.mid_dreamJob}
              onChange={(e) => updateField('mid_dreamJob', e.target.value)}
              className="h-12 rounded-xl bg-[#F2F4F6] border-none"
            />
          </div>

          <div className="space-y-2">
            <Label>고등학교 진학 계획</Label>
            <Select 
              value={profileData.mid_highSchoolPlan} 
              onValueChange={(val) => updateField('mid_highSchoolPlan', val)}
            >
              <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                <SelectValue placeholder="진학 희망 고교 유형" />
              </SelectTrigger>
              <SelectContent>
                {HIGH_SCHOOL_PLANS.map(plan => (
                  <SelectItem key={plan.value} value={plan.value}>{plan.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>나의 장점 (성격/재능)</Label>
            <Input 
              value={profileData.mid_strengths}
              onChange={(e) => updateField('mid_strengths', e.target.value)}
              placeholder="예: 끈기 있음, 리더십, 손재주가 좋음" 
              className="h-12 rounded-xl bg-[#F2F4F6] border-none"
            />
          </div>

          <div className="space-y-2">
            <Label>관심 분야 / 동아리 활동</Label>
            <Textarea 
              value={profileData.mid_interests}
              onChange={(e) => updateField('mid_interests', e.target.value)}
              placeholder="관심있는 분야나 현재 활동 중인 동아리에 대해 적어주세요." 
              className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label>취미 생활</Label>
            <Input 
              value={profileData.mid_hobbies}
              onChange={(e) => updateField('mid_hobbies', e.target.value)}
              placeholder="예: 유튜브 시청, 게임, 운동" 
              className="h-12 rounded-xl bg-[#F2F4F6] border-none"
            />
          </div>

          <div className="space-y-2">
            <Label>진로/학업 고민</Label>
            <Textarea 
              value={profileData.mid_concerns}
              onChange={(e) => updateField('mid_concerns', e.target.value)}
              placeholder="고등학교 진학이나 성적 등 현재 가장 큰 고민은 무엇인가요?" 
              className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const MiddleSchoolForm = memo(MiddleSchoolFormComponent);
