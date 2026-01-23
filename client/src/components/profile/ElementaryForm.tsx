import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Star } from "lucide-react";
import { ProfileFormProps } from './types';

const SUBJECTS = ["국어", "수학", "영어", "사회", "과학", "체육", "음악", "미술", "코딩/컴퓨터", "기타"];
const GRADES = [1, 2, 3, 4, 5, 6];

const ElementaryFormComponent: React.FC<ProfileFormProps> = ({ profileData, updateField }) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <Card className="toss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-[#FFB300]" /> 나의 꿈과 관심사
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>학교명</Label>
            <Input 
              placeholder="예: 한국초등학교" 
              value={profileData.elem_schoolName}
              onChange={(e) => updateField('elem_schoolName', e.target.value)}
              className="h-12 rounded-xl bg-[#F2F4F6] border-none"
            />
          </div>
          <div className="space-y-2">
            <Label>학년</Label>
            <Select 
              value={profileData.elem_grade} 
              onValueChange={(val) => updateField('elem_grade', val)}
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
          
          <Separator className="my-2"/>

          <div className="space-y-2">
            <Label>장래희망 (되고 싶은 사람)</Label>
            <Input 
              placeholder="예: 과학자, 유튜버, 선생님" 
              value={profileData.elem_dreamJob}
              onChange={(e) => updateField('elem_dreamJob', e.target.value)}
              className="h-12 rounded-xl bg-[#F2F4F6] border-none"
            />
          </div>
          <div className="space-y-2">
            <Label>부모님이 원하시는 나의 직업 (선택)</Label>
            <Input 
              placeholder="부모님은 어떤 직업을 추천해주시나요?" 
              value={profileData.elem_parentsHope}
              onChange={(e) => updateField('elem_parentsHope', e.target.value)}
              className="h-12 rounded-xl bg-[#F2F4F6] border-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>가장 좋아하는 과목</Label>
              <Select 
                value={profileData.elem_favoriteSubject} 
                onValueChange={(val) => updateField('elem_favoriteSubject', val)}
              >
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                  <SelectValue placeholder="과목 선택" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(subj => (
                    <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>가장 싫어하는 과목</Label>
              <Select 
                value={profileData.elem_dislikedSubject} 
                onValueChange={(val) => updateField('elem_dislikedSubject', val)}
              >
                <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                  <SelectValue placeholder="과목 선택" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(subj => (
                    <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>내가 잘하는 것 (강점)</Label>
            <Input 
              value={profileData.elem_strengths}
              onChange={(e) => updateField('elem_strengths', e.target.value)}
              placeholder="예: 만들기, 발표하기, 친구 도와주기" 
              className="h-12 rounded-xl bg-[#F2F4F6] border-none"
            />
          </div>

          <div className="space-y-2">
            <Label>평소 관심있는 분야</Label>
            <Input 
              value={profileData.elem_interests}
              onChange={(e) => updateField('elem_interests', e.target.value)}
              placeholder="예: 우주, 공룡, 로봇, 요리" 
              className="h-12 rounded-xl bg-[#F2F4F6] border-none"
            />
          </div>

          <div className="space-y-2">
            <Label>좋아하는 것 (취미)</Label>
            <Textarea 
              value={profileData.elem_hobbies}
              onChange={(e) => updateField('elem_hobbies', e.target.value)}
              placeholder="예: 레고 조립하기, 친구들과 축구하기" 
              className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label>요즘 가장 큰 고민</Label>
            <Textarea 
              value={profileData.elem_concerns}
              onChange={(e) => updateField('elem_concerns', e.target.value)}
              placeholder="학교 생활이나 친구 관계 등 요즘 하는 고민이 있다면 적어주세요." 
              className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const ElementaryForm = memo(ElementaryFormComponent);
