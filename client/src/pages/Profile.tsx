import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { User, Mail, MapPin, Briefcase, School, Save, Building, Calendar as CalendarIcon, Award, Link as LinkIcon, Trash2, Check, HardHat, Zap, Armchair, BrainCircuit, AlertTriangle, X, TrendingUp, DollarSign, Smile, Shield, BookOpen, GraduationCap, PenTool, Star, Plus, Sparkles, CheckCircle2, Edit2, Languages, Loader2 } from "lucide-react";
import { useMobileAction } from "@/lib/MobileActionContext";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { DateWheelPicker, SalaryWheelPicker, WheelPicker } from "@/components/ui/wheel-picker";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

function ResponsiveClose({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) {
    const isMobile = useIsMobile();
    if (isMobile) return <DrawerClose asChild={asChild}>{children}</DrawerClose>;
    return <DialogClose asChild={asChild}>{children}</DialogClose>;
}

function ResponsiveDatePickerContent({ 
    value, 
    onChange, 
    isEndDate = false,
    hideButton = false
}: { 
    value: Date | null, 
    onChange: (date: Date | null) => void,
    isEndDate?: boolean,
    hideButton?: boolean
}) {
    const isMobile = useIsMobile();
    
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
    const [day, setDay] = useState('');
    const [isCurrent, setIsCurrent] = useState(false);

    // Initialize with correctly formatted date
    useEffect(() => {
        if (value) {
            setYear(format(value, 'yyyy'));
            setMonth(format(value, 'M')); // changed from MM to M to remove leading zeros
            setDay(format(value, 'd'));   // changed from dd to d to remove leading zeros
            setIsCurrent(false);
        } else if (isEndDate && value === null) {
            setIsCurrent(true);
            setYear('');
            setMonth('');
            setDay('');
        }
    }, [value, isEndDate]); 

    const updateDate = (y: string, m: string, d: string) => {
        // Allow partial inputs to be typed, but only update parent when valid
        if (y.length === 4 && m.length > 0 && d.length > 0) {
            const yearNum = parseInt(y);
            const monthNum = parseInt(m) - 1;
            const dayNum = parseInt(d);
            
            const newDate = new Date(yearNum, monthNum, dayNum);
            const currentYear = new Date().getFullYear();
            
            // Validation for parent update
            if (yearNum > currentYear) return; 
            if (parseInt(m) > 12 || parseInt(m) < 1) return;
            
            const daysInMonth = new Date(yearNum, parseInt(m), 0).getDate();
            if (dayNum > daysInMonth || dayNum < 1) return;

            if (!isNaN(newDate.getTime()) && 
                newDate.getMonth() === monthNum) {
                onChange(newDate);
            }
        }
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
        const currentYear = new Date().getFullYear();
        // Only limit year if it's fully typed and exceeds current year
        if (val.length === 4 && parseInt(val) > currentYear) {
            val = currentYear.toString();
        }
        setYear(val);
        updateDate(val, month, day);
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove auto-clamping to allow easier editing
        let val = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
        setMonth(val);
        updateDate(year, val, day);
    };

    const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove auto-clamping to allow easier editing
        let val = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
        setDay(val);
        updateDate(year, month, val);
    };

    const handleCurrentChange = (checked: boolean) => {
        setIsCurrent(checked);
        if (checked) {
            onChange(null);
            setYear('');
            setMonth('');
            setDay('');
        } else {
            // Reset to today or empty when unchecked? 
            // Let's leave empty so they have to input
        }
    };

    if (isMobile) {
        return (
            <div className="pb-4">
                {isEndDate && (
                    <div className="flex items-center space-x-2 mb-4 px-4">
                        <Checkbox 
                            id="current-mobile" 
                            checked={isCurrent}
                            onCheckedChange={handleCurrentChange}
                        />
                        <label
                            htmlFor="current-mobile"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            현재 재직 중
                        </label>
                    </div>
                )}
                {!isCurrent && (
                    <DateWheelPicker value={value || new Date()} onChange={onChange} />
                )}
                {!hideButton && (
                    <ResponsiveClose asChild>
                        <Button className="w-full mt-4 rounded-xl h-12 text-lg font-bold">완료</Button>
                    </ResponsiveClose>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-6 w-full space-y-6">
             <div className="space-y-3 w-full">
                <div className="flex justify-between items-center">
                    <Label className="text-[#4E5968] font-medium">날짜를 입력해주세요</Label>
                    {isEndDate && (
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="current-desktop" 
                                checked={isCurrent}
                                onCheckedChange={handleCurrentChange}
                            />
                            <label
                                htmlFor="current-desktop"
                                className="text-sm font-medium leading-none cursor-pointer select-none"
                            >
                                현재 재직 중
                            </label>
                        </div>
                    )}
                </div>
                
                <div className={`flex items-center gap-2 transition-opacity ${isCurrent ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                    <div className="relative flex-1">
                        <Input 
                            value={year}
                            onChange={handleYearChange}
                            className="h-14 text-xl font-medium rounded-xl border-[#E5E8EB] focus:border-[#3182F6] focus:ring-2 focus:ring-blue-100 transition-all text-center"
                            placeholder="YYYY"
                            maxLength={4}
                            disabled={isCurrent}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B95A1] text-sm font-medium">년</span>
                    </div>
                    <div className="relative w-[28%]">
                        <Input 
                            value={month}
                            onChange={handleMonthChange}
                            className="h-14 text-xl font-medium rounded-xl border-[#E5E8EB] focus:border-[#3182F6] focus:ring-2 focus:ring-blue-100 transition-all text-center"
                            placeholder="MM"
                            maxLength={2}
                            disabled={isCurrent}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B95A1] text-sm font-medium">월</span>
                    </div>
                    <div className="relative w-[28%]">
                        <Input 
                            value={day}
                            onChange={handleDayChange}
                            className="h-14 text-xl font-medium rounded-xl border-[#E5E8EB] focus:border-[#3182F6] focus:ring-2 focus:ring-blue-100 transition-all text-center"
                            placeholder="DD"
                            maxLength={2}
                            disabled={isCurrent}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B95A1] text-sm font-medium">일</span>
                    </div>
                </div>
            </div>
            {!hideButton && (
                <ResponsiveClose asChild>
                    <Button className="w-full rounded-xl h-12 text-lg font-bold bg-[#3182F6]">입력 완료</Button>
                </ResponsiveClose>
            )}
        </div>
    );
}

function ResponsiveModal({ 
    trigger, 
    title, 
    description, 
    children, 
    open, 
    onOpenChange 
}: { 
    trigger: React.ReactNode; 
    title: string; 
    description?: string; 
    children: React.ReactNode; 
    open?: boolean; 
    onOpenChange?: (open: boolean) => void; 
}) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerTrigger asChild>{trigger}</DrawerTrigger>
                <DrawerContent className="max-h-[85vh] outline-none">
                     <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[#E5E8EB] mt-3 mb-1" />
                    <DrawerHeader className="text-left">
                        <DrawerTitle>{title}</DrawerTitle>
                        {description && <CardDescription>{description}</CardDescription>}
                    </DrawerHeader>
                    <div className="p-4 pb-8 overflow-y-auto">
                        {children}
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px] md:max-w-xl bg-white border-none shadow-2xl rounded-[24px] p-0 overflow-hidden gap-0 [&>button]:hidden">
                <DialogHeader className="p-6 pb-4 border-b border-[#F2F4F6] flex flex-row items-center justify-between space-y-0">
                    <div className="space-y-1 text-left">
                        <DialogTitle className="text-xl font-bold text-[#191F28]">{title}</DialogTitle>
                         {description && <DialogDescription>{description}</DialogDescription>}
                    </div>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-[#F2F4F6] hover:bg-[#E5E8EB]">
                            <X className="h-4 w-4 text-[#333D4B]" />
                        </Button>
                    </DialogClose>
                </DialogHeader>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ResponsiveSalaryInputContent({ value, onChange }: { value: number, onChange: (val: number) => void }) {
    const isMobile = useIsMobile();
    const [inputValue, setInputValue] = useState(value.toLocaleString());

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^0-9]/g, '');
        const numValue = parseInt(rawValue, 10);
        
        if (!isNaN(numValue)) {
            setInputValue(numValue.toLocaleString());
            onChange(numValue);
        } else if (rawValue === '') {
             setInputValue('');
             onChange(0);
        }
    };

    if (isMobile) {
        return (
            <div className="pb-4">
                <SalaryWheelPicker value={value} onChange={onChange} />
                <ResponsiveClose asChild>
                    <Button className="w-full mt-8 rounded-xl h-12 text-lg font-bold">완료</Button>
                </ResponsiveClose>
            </div>
        );
    }

    return (
        <div className="flex flex-col p-4 space-y-6">
            <div className="space-y-2">
                <Label className="text-[#4E5968]">연봉 입력 (만원)</Label>
                <div className="relative">
                    <Input 
                        value={inputValue}
                        onChange={handleInputChange}
                        className="h-16 text-2xl font-bold pl-4 pr-12 rounded-xl border-[#E5E8EB] focus:border-[#3182F6] focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B95A1] font-bold text-lg">만원</span>
                </div>
                <p className="text-sm text-[#8B95A1]">
                    * 성과급 및 기타 수당을 포함한 세전 연봉을 입력해주세요.
                </p>
            </div>
             <ResponsiveClose asChild>
                <Button className="w-full rounded-xl h-12 text-lg font-bold bg-[#3182F6]">입력 완료</Button>
            </ResponsiveClose>
        </div>
    );
}


// Type for profile data structure
type ProfileDataType = {
  type: "elementary" | "middle" | "high" | "university" | "general";
  basic_name: string;
  basic_role: string;
  basic_email: string;
  basic_location: string;
  basic_bio: string;
  basic_gender: "male" | "female" | undefined;
  basic_birthDate: Date | null;
  elem_schoolName: string;
  elem_grade: string;
  elem_favoriteSubject: string;
  elem_dislikedSubject: string;
  elem_dreamJob: string;
  elem_strengths: string;
  elem_interests: string;
  elem_hobbies: string;
  elem_concerns: string;
  elem_parentsHope: string;
  mid_schoolName: string;
  mid_grade: string;
  mid_class: string;
  mid_academicScore: string;
  mid_favoriteSubject: string;
  mid_dislikedSubject: string;
  mid_interests: string;
  mid_hobbies: string;
  mid_dreamJob: string;
  mid_highSchoolPlan: string;
  mid_concerns: string;
  mid_strengths: string;
  high_schoolName: string;
  high_grade: string;
  high_class: string;
  high_academicScore: string;
  high_majorTrack: string;
  high_hopeUniversity: string;
  high_careerHope: string;
  high_activityStatus: string;
  high_favoriteSubject: string;
  high_dislikedSubject: string;
  high_mbti: string;
  high_hobbies: string;
  high_studyAbroad: boolean;
  high_concerns: string;
  high_stressLevel: string;
  high_sleepPattern: string;
  high_subject_scores: { korean: string; math: string; english: string; social: string; science: string; history: string; second_lang: string };
  high_balance: { academic: number; activity: number; reading: number; volunteer: number; career: number };
  univ_schoolName: string;
  univ_majorCategory: string;
  univ_majorName: string;
  univ_grade: string;
  univ_semester: string;
  univ_gpa: string;
  univ_languageTests: { id: number; type: string; score: string }[];
  univ_certificates: string;
  univ_concerns: string;
  univ_academicStress: string;
  univ_financialStress: string;
  univ_sleepHours: string;
  univ_mentalWellbeing: string;
  univ_workloadWorkHours: string;
  univ_workloadStudyHours: string;
  univ_belongingScore: string;
  univ_hasSupportPerson: boolean;
  univ_facultyRespect: string;
  univ_classComfort: string;
  univ_servicesUsed: string[];
  univ_serviceBarriers: string;
  univ_careerReadiness: string;
  univ_careerGoalClear: string;
  univ_internshipStatus: string;
  univ_skillsToDevelop: string[];
  gen_currentStatus: string;
  gen_workExperience: any[];
  gen_skills: string[];
  gen_prevJobSatisfaction: string;
  gen_reasonForChange: string;
  gen_desiredIndustry: string;
  gen_desiredRole: string;
  gen_workStyle: string;
  gen_workValues: string[];
  gen_salary: number;
  gen_salaryNoPreference: boolean;
  gen_environmentPreferences: string[];
  gen_environmentNoPreference: boolean;
  gen_concerns: string;
};

// Default profile data structure
const getDefaultProfileData = (type: ProfileDataType["type"] = "general"): ProfileDataType => ({
  type,
  basic_name: "",
  basic_role: "",
  basic_email: "",
  basic_location: "Seoul, South Korea",
  basic_bio: "",
  basic_gender: undefined,
  basic_birthDate: null,
  elem_schoolName: "",
  elem_grade: "",
  elem_favoriteSubject: "",
  elem_dislikedSubject: "",
  elem_dreamJob: "",
  elem_strengths: "",
  elem_interests: "",
  elem_hobbies: "",
  elem_concerns: "",
  elem_parentsHope: "",
  mid_schoolName: "",
  mid_grade: "",
  mid_class: "",
  mid_academicScore: "",
  mid_favoriteSubject: "",
  mid_dislikedSubject: "",
  mid_interests: "",
  mid_hobbies: "",
  mid_dreamJob: "",
  mid_highSchoolPlan: "",
  mid_concerns: "",
  mid_strengths: "",
  high_schoolName: "",
  high_grade: "",
  high_class: "",
  high_academicScore: "",
  high_majorTrack: "",
  high_hopeUniversity: "",
  high_careerHope: "",
  high_activityStatus: "",
  high_favoriteSubject: "",
  high_dislikedSubject: "",
  high_mbti: "",
  high_hobbies: "",
  high_studyAbroad: false,
  high_concerns: "",
  high_stressLevel: "",
  high_sleepPattern: "",
  high_subject_scores: { korean: "", math: "", english: "", social: "", science: "", history: "", second_lang: "" },
  high_balance: { academic: 50, activity: 50, reading: 50, volunteer: 50, career: 50 },
  univ_schoolName: "",
  univ_majorCategory: "",
  univ_majorName: "",
  univ_grade: "",
  univ_semester: "",
  univ_gpa: "",
  univ_languageTests: [],
  univ_certificates: "",
  univ_concerns: "",
  univ_academicStress: "",
  univ_financialStress: "",
  univ_sleepHours: "",
  univ_mentalWellbeing: "",
  univ_workloadWorkHours: "",
  univ_workloadStudyHours: "",
  univ_belongingScore: "",
  univ_hasSupportPerson: false,
  univ_facultyRespect: "",
  univ_classComfort: "",
  univ_servicesUsed: [],
  univ_serviceBarriers: "",
  univ_careerReadiness: "",
  univ_careerGoalClear: "",
  univ_internshipStatus: "",
  univ_skillsToDevelop: [],
  gen_currentStatus: "",
  gen_workExperience: [],
  gen_skills: [],
  gen_prevJobSatisfaction: "",
  gen_reasonForChange: "",
  gen_desiredIndustry: "",
  gen_desiredRole: "",
  gen_workStyle: "",
  gen_workValues: [],
  gen_salary: 5000,
  gen_salaryNoPreference: false,
  gen_environmentPreferences: [],
  gen_environmentNoPreference: false,
  gen_concerns: "",
});

export default function Profile() {
  const { setAction } = useMobileAction();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Build user's full name from auth context
  const userName = user ? 
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email?.split("@")[0] || "" 
    : "";
  const userEmail = user?.email || "";
  const userProfileImage = user?.profileImageUrl || null;

  // State Management with Prefixed Fields for Analysis Isolation
  const [profileData, setProfileData] = useState<ProfileDataType>(getDefaultProfileData());
  const [isSaving, setIsSaving] = useState(false);

  // Current profile type for API calls
  const currentType = profileData.type;

  // Fetch profile data from API
  const { data: serverProfile, isLoading: isLoadingProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['/api/user-profile', currentType],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/user-profile?type=${currentType}`);
      return response.json();
    },
    enabled: !!user,
    staleTime: 0,
  });

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (data: { type: string; profileData: Record<string, any> }) => {
      const response = await apiRequest('PUT', '/api/user-profile', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-profile'] });
      toast({
        title: "프로필 저장 완료",
        description: "프로필 정보가 성공적으로 저장되었습니다.",
      });
      setIsSaving(false);
    },
    onError: (error) => {
      console.error('Error saving profile:', error);
      toast({
        title: "저장 실패",
        description: "프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  // Load profile data from server when it changes
  useEffect(() => {
    if (serverProfile?.profileData) {
      const savedData = serverProfile.profileData as Record<string, any>;
      
      // Parse dates back from strings
      if (savedData.basic_birthDate) {
        savedData.basic_birthDate = new Date(savedData.basic_birthDate);
      }
      if (savedData.gen_workExperience) {
        savedData.gen_workExperience = savedData.gen_workExperience.map((exp: any) => ({
          ...exp,
          startDate: exp.startDate ? new Date(exp.startDate) : null,
          endDate: exp.endDate ? new Date(exp.endDate) : null,
        }));
      }
      
      // Merge with defaults to ensure all fields exist
      setProfileData(prev => ({
        ...getDefaultProfileData(currentType),
        ...savedData,
        type: currentType,
        // Keep auth-based values as defaults if not saved
        basic_name: savedData.basic_name || userName || "",
        basic_email: savedData.basic_email || userEmail || "",
      }));
    } else if (serverProfile && !serverProfile.profileData) {
      // New profile, initialize with user info from auth
      setProfileData(prev => ({
        ...getDefaultProfileData(currentType),
        basic_name: userName || "",
        basic_email: userEmail || "",
      }));
    }
  }, [serverProfile, currentType, userName, userEmail]);

  // Handle save
  const handleSave = useCallback(() => {
    if (isSaving) return;
    setIsSaving(true);
    
    // Prepare data for saving (excluding the type field from profileData)
    const { type, ...dataToSave } = profileData;
    
    saveProfileMutation.mutate({
      type: currentType,
      profileData: dataToSave,
    });
  }, [profileData, currentType, isSaving, saveProfileMutation]);

  // Handle profile type change
  const handleTypeChange = useCallback((newType: ProfileDataType["type"]) => {
    setProfileData(prev => ({ ...prev, type: newType }));
  }, []);

  // Refetch when type changes
  useEffect(() => {
    if (user) {
      refetchProfile();
    }
  }, [currentType, user, refetchProfile]);

  // Set mobile action button
  useEffect(() => {
    setAction({
      icon: isSaving ? Loader2 : Save,
      label: isSaving ? "저장 중..." : "저장",
      onClick: handleSave,
      disabled: isSaving,
    });
    return () => setAction(null);
  }, [handleSave, isSaving, setAction]);

  // Initialize with auth user info (only once)
  useEffect(() => {
    if (user && !serverProfile) {
      setProfileData(prev => ({
        ...prev,
        basic_name: userName || prev.basic_name,
        basic_email: userEmail || prev.basic_email,
      }));
    }
  }, [user, userName, userEmail, serverProfile]);

  const toggleWorkValue = (value: string) => {
      setProfileData(prev => {
          const exists = prev.gen_workValues.includes(value);
          if (exists) {
              return { ...prev, gen_workValues: prev.gen_workValues.filter(v => v !== value) };
          } else {
              if (prev.gen_workValues.length >= 3) return prev; // Limit to 3
              return { ...prev, gen_workValues: [...prev.gen_workValues, value] };
          }
      });
  };

  const toggleEnvironmentPreference = (pref: string) => {
      if (profileData.gen_environmentNoPreference) return;
      setProfileData(prev => {
          const exists = prev.gen_environmentPreferences.includes(pref);
          if (exists) {
              return { ...prev, gen_environmentPreferences: prev.gen_environmentPreferences.filter(p => p !== pref) };
          } else {
              return { ...prev, gen_environmentPreferences: [...prev.gen_environmentPreferences, pref] };
          }
      });
  };

  const toggleEnvironmentNoPreference = (checked: boolean) => {
        setProfileData(prev => ({
            ...prev,
            gen_environmentNoPreference: checked,
            gen_environmentPreferences: checked ? [] : prev.gen_environmentPreferences
        }));
  };

  const toggleSalaryNoPreference = (checked: boolean) => {
        setProfileData(prev => ({
            ...prev,
            gen_salaryNoPreference: checked,
            gen_salary: checked ? 0 : prev.gen_salary
        }));
  };

    // Options data
    const workValueOptions = [
      { id: 'growth', label: '성장 가능성', icon: TrendingUp },
      { id: 'balance', label: '워라밸', icon: Armchair },
      { id: 'money', label: '높은 연봉', icon: DollarSign },
      { id: 'culture', label: '수평적 문화', icon: Smile },
      { id: 'stability', label: '고용 안정', icon: Shield },
      { id: 'autonomy', label: '자율성', icon: Zap },
    ];

    const environmentOptions = [
      { id: 'brain', label: '지식 집약적 업무 (Brain Using)', icon: BrainCircuit, desc: '육체적 노동보다는 정신적 노동 중심' },
      { id: 'sedentary', label: '좌식 근무 (Sitting)', icon: Armchair, desc: '주로 앉아서 하는 사무직 환경' },
      { id: 'active', label: '활동적 근무 (Active)', icon: Zap, desc: '이동이 많거나 현장 활동이 포함됨' },
      { id: 'industrial', label: '제조/생산 현장 (Industrial)', icon: HardHat, desc: '공장, 건설 등 생산 현장 환경' },
      { id: 'challenging', label: '도전적 환경 (Challenging)', icon: AlertTriangle, desc: '위험 요소가 있거나 강도 높은 업무' },
  ];

  // Render different content based on profile type
  const renderProfileFields = () => {
      switch (profileData.type) {
        case 'elementary':
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
                                    onChange={(e) => setProfileData({...profileData, elem_schoolName: e.target.value})}
                                    className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>학년</Label>
                                <Select 
                                    value={profileData.elem_grade} 
                                    onValueChange={(val) => setProfileData({...profileData, elem_grade: val})}
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                        <SelectValue placeholder="학년 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5, 6].map(g => (
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
                                    onChange={(e) => setProfileData({...profileData, elem_dreamJob: e.target.value})}
                                    className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>부모님이 원하시는 나의 직업 (선택)</Label>
                                <Input 
                                    placeholder="부모님은 어떤 직업을 추천해주시나요?" 
                                    value={profileData.elem_parentsHope}
                                    onChange={(e) => setProfileData({...profileData, elem_parentsHope: e.target.value})}
                                    className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>가장 좋아하는 과목</Label>
                                    <Select 
                                        value={profileData.elem_favoriteSubject} 
                                        onValueChange={(val) => setProfileData({...profileData, elem_favoriteSubject: val})}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                            <SelectValue placeholder="과목 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["국어", "수학", "영어", "사회", "과학", "체육", "음악", "미술", "코딩/컴퓨터", "기타"].map(subj => (
                                                <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>가장 싫어하는 과목</Label>
                                    <Select 
                                        value={profileData.elem_dislikedSubject} 
                                        onValueChange={(val) => setProfileData({...profileData, elem_dislikedSubject: val})}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                            <SelectValue placeholder="과목 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["국어", "수학", "영어", "사회", "과학", "체육", "음악", "미술", "코딩/컴퓨터", "기타"].map(subj => (
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
                                    onChange={(e) => setProfileData({...profileData, elem_strengths: e.target.value})}
                                    placeholder="예: 만들기, 발표하기, 친구 도와주기" 
                                    className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>평소 관심있는 분야</Label>
                                <Input 
                                    value={profileData.elem_interests}
                                    onChange={(e) => setProfileData({...profileData, elem_interests: e.target.value})}
                                    placeholder="예: 우주, 공룡, 로봇, 요리" 
                                    className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>좋아하는 것 (취미)</Label>
                                <Textarea 
                                    value={profileData.elem_hobbies}
                                    onChange={(e) => setProfileData({...profileData, elem_hobbies: e.target.value})}
                                    placeholder="예: 레고 조립하기, 친구들과 축구하기" 
                                    className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none"
                                />
                            </div>
                             <div className="space-y-2">
                                <Label>요즘 가장 큰 고민</Label>
                                <Textarea 
                                    value={profileData.elem_concerns}
                                    onChange={(e) => setProfileData({...profileData, elem_concerns: e.target.value})}
                                    placeholder="학교 생활이나 친구 관계 등 요즘 하는 고민이 있다면 적어주세요." 
                                    className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none"
                                />
                            </div>
                        </CardContent>
                     </Card>
                </div>
            );
        
        case 'middle':
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
                                    onChange={(e) => setProfileData({...profileData, mid_schoolName: e.target.value})}
                                    className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>학년</Label>
                                    <Select 
                                        value={profileData.mid_grade} 
                                        onValueChange={(val) => setProfileData({...profileData, mid_grade: val})}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                            <SelectValue placeholder="학년 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3].map(g => (
                                                <SelectItem key={g} value={g.toString()}>{g}학년</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>반</Label>
                                    <Select 
                                        value={profileData.mid_class} 
                                        onValueChange={(val) => setProfileData({...profileData, mid_class: val})}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                            <SelectValue placeholder="반 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({length: 15}, (_, i) => i + 1).map(c => (
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
                                    onValueChange={(val) => setProfileData({...profileData, mid_academicScore: val})}
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                        <SelectValue placeholder="성적 수준 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="high">상위권 (90점 이상)</SelectItem>
                                        <SelectItem value="mid-high">중상위권 (80-90점)</SelectItem>
                                        <SelectItem value="mid">중위권 (70-80점)</SelectItem>
                                        <SelectItem value="mid-low">중하위권 (60-70점)</SelectItem>
                                        <SelectItem value="low">하위권 (60점 미만)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>좋아하는 과목</Label>
                                    <Input 
                                        value={profileData.mid_favoriteSubject}
                                        onChange={(e) => setProfileData({...profileData, mid_favoriteSubject: e.target.value})}
                                        className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                                        placeholder="예: 수학, 체육"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>싫어하는 과목</Label>
                                    <Input 
                                        value={profileData.mid_dislikedSubject}
                                        onChange={(e) => setProfileData({...profileData, mid_dislikedSubject: e.target.value})}
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
                                    onChange={(e) => setProfileData({...profileData, mid_dreamJob: e.target.value})}
                                    className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>고등학교 진학 계획</Label>
                                <Select 
                                    value={profileData.mid_highSchoolPlan} 
                                    onValueChange={(val) => setProfileData({...profileData, mid_highSchoolPlan: val})}
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                        <SelectValue placeholder="진학 희망 고교 유형" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">일반고등학교</SelectItem>
                                        <SelectItem value="special_purpose">특수목적고 (과학고/외고 등)</SelectItem>
                                        <SelectItem value="specialized">특성화고등학교</SelectItem>
                                        <SelectItem value="autonomous">자율형 사립고</SelectItem>
                                        <SelectItem value="undecided">아직 모르겠음</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>나의 장점 (성격/재능)</Label>
                                <Input 
                                    value={profileData.mid_strengths}
                                    onChange={(e) => setProfileData({...profileData, mid_strengths: e.target.value})}
                                    placeholder="예: 끈기 있음, 리더십, 손재주가 좋음" 
                                    className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>관심 분야 / 동아리 활동</Label>
                                <Textarea 
                                    value={profileData.mid_interests}
                                    onChange={(e) => setProfileData({...profileData, mid_interests: e.target.value})}
                                    placeholder="관심있는 분야나 현재 활동 중인 동아리에 대해 적어주세요." 
                                    className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>취미 생활</Label>
                                <Input 
                                    value={profileData.mid_hobbies}
                                    onChange={(e) => setProfileData({...profileData, mid_hobbies: e.target.value})}
                                    placeholder="예: 유튜브 시청, 게임, 운동" 
                                    className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>진로/학업 고민</Label>
                                <Textarea 
                                    value={profileData.mid_concerns}
                                    onChange={(e) => setProfileData({...profileData, mid_concerns: e.target.value})}
                                    placeholder="고등학교 진학이나 성적 등 현재 가장 큰 고민은 무엇인가요?" 
                                    className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );

        case 'high':
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
                                    onChange={(e) => setProfileData({...profileData, high_schoolName: e.target.value})}
                                    className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>학년</Label>
                                    <Select 
                                        value={profileData.high_grade} 
                                        onValueChange={(val) => setProfileData({...profileData, high_grade: val})}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                            <SelectValue placeholder="학년 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3].map(g => (
                                                <SelectItem key={g} value={g.toString()}>{g}학년</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>반</Label>
                                    <Select 
                                        value={profileData.high_class} 
                                        onValueChange={(val) => setProfileData({...profileData, high_class: val})}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                            <SelectValue placeholder="반 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({length: 15}, (_, i) => i + 1).map(c => (
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
                                    onValueChange={(val) => setProfileData({...profileData, high_academicScore: val})}
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                        <SelectValue placeholder="등급 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(s => (
                                            <SelectItem key={s} value={s.toString()}>{s}등급</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="pt-2">
                                <Label className="text-base font-bold text-[#191F28] mb-4 block">주요 과목 성적 (내신)</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {[
                                        { id: 'korean', label: '국어' },
                                        { id: 'math', label: '수학' },
                                        { id: 'english', label: '영어' },
                                        { id: 'social', label: '사회' },
                                        { id: 'science', label: '과학' },
                                        { id: 'history', label: '한국사' },
                                    ].map((subj) => (
                                        <div key={subj.id} className="space-y-1">
                                            <Label className="text-xs text-[#8B95A1]">{subj.label}</Label>
                                            <Select 
                                                value={profileData.high_subject_scores[subj.id as keyof typeof profileData.high_subject_scores]} 
                                                onValueChange={(val) => setProfileData({
                                                    ...profileData,
                                                    high_subject_scores: { ...profileData.high_subject_scores, [subj.id]: val }
                                                })}
                                            >
                                                <SelectTrigger className="h-10 bg-[#F2F4F6] border-none rounded-lg">
                                                    <SelectValue placeholder="선택" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(s => (
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
                                    onValueChange={(val) => setProfileData({...profileData, high_majorTrack: val})}
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                        <SelectValue placeholder="계열 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["인문계열", "사회계열", "자연계열", "공학계열", "의약계열", "교육계열", "예체능계열", "기타"].map(m => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>희망 대학</Label>
                                <Input 
                                    placeholder="예: 서울대학교, 연세대학교" 
                                    value={profileData.high_hopeUniversity}
                                    onChange={(e) => setProfileData({...profileData, high_hopeUniversity: e.target.value})}
                                    className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>진로 희망</Label>
                                <Input 
                                    placeholder="예: 소프트웨어 개발자, 의사" 
                                    value={profileData.high_careerHope}
                                    onChange={(e) => setProfileData({...profileData, high_careerHope: e.target.value})}
                                    className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>활동 참여 현황</Label>
                                <Textarea 
                                    value={profileData.high_activityStatus}
                                    onChange={(e) => setProfileData({...profileData, high_activityStatus: e.target.value})}
                                    placeholder="동아리, 봉사활동, 교내 대회 등 참여한 활동을 적어주세요." 
                                    className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>좋아하는 과목</Label>
                                    <Input 
                                        value={profileData.high_favoriteSubject}
                                        onChange={(e) => setProfileData({...profileData, high_favoriteSubject: e.target.value})}
                                        className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                                        placeholder="예: 수학"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>싫어하는 과목</Label>
                                    <Input 
                                        value={profileData.high_dislikedSubject}
                                        onChange={(e) => setProfileData({...profileData, high_dislikedSubject: e.target.value})}
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
                                        onValueChange={(val) => setProfileData({...profileData, high_mbti: val})}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                            <SelectValue placeholder="MBTI 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP", "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ"].map(m => (
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
                                            onCheckedChange={(checked) => setProfileData({...profileData, high_studyAbroad: checked as boolean})}
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
                                    onChange={(e) => setProfileData({...profileData, high_hobbies: e.target.value})}
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
                                        onValueChange={(val) => setProfileData({...profileData, high_stressLevel: val})}
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
                                        onValueChange={(val) => setProfileData({...profileData, high_sleepPattern: val})}
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
                                    onChange={(e) => setProfileData({...profileData, high_concerns: e.target.value})}
                                    placeholder="진로와 관련하여 현재 가장 고민되는 점을 자유롭게 적어주세요." 
                                    className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );

        case 'university':
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
                                    placeholder="예: 한국대학교" 
                                    value={profileData.univ_schoolName}
                                    onChange={(e) => setProfileData({...profileData, univ_schoolName: e.target.value})}
                                    className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>전공 계열</Label>
                                <Select 
                                    value={profileData.univ_majorCategory} 
                                    onValueChange={(val) => setProfileData({...profileData, univ_majorCategory: val})}
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                        <SelectValue placeholder="전공 계열 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["인문학", "사회과학", "경영/경제", "자연과학", "공학", "의약학", "농수해양", "생활과학", "예체능", "교육"].map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>상세 전공 (학과명)</Label>
                                <Input 
                                    placeholder="예: 경영학과, 컴퓨터공학부" 
                                    value={profileData.univ_majorName}
                                    onChange={(e) => setProfileData({...profileData, univ_majorName: e.target.value})}
                                    className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>학년</Label>
                                    <Select 
                                        value={profileData.univ_grade} 
                                        onValueChange={(val) => setProfileData({...profileData, univ_grade: val})}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                            <SelectValue placeholder="학년 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3, 4, 5].map(g => (
                                                <SelectItem key={g} value={g.toString()}>{g === 5 ? "5학년 이상 (초과)" : `${g}학년`}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>학기</Label>
                                    <Select 
                                        value={profileData.univ_semester} 
                                        onValueChange={(val) => setProfileData({...profileData, univ_semester: val})}
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
                                    onValueChange={(val) => setProfileData({...profileData, univ_gpa: val})}
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                        <SelectValue placeholder="학점 선택 (4.5 만점 기준)" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {Array.from({length: 46}, (_, i) => (4.5 - (i * 0.1)).toFixed(1)).map(score => (
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
                                            onClick={() => setProfileData(prev => ({
                                                ...prev, 
                                                univ_languageTests: prev.univ_languageTests.filter(t => t.id !== test.id)
                                            }))}
                                        >
                                            <X className="h-4 w-4 text-[#B0B8C1]" />
                                        </Button>
                                    </div>
                                ))}
                                
                                <div className="flex gap-2">
                                    <Select onValueChange={(type) => {
                                        const score = prompt("점수 또는 등급을 입력해주세요 (예: 850, IH):");
                                        if (score) {
                                            setProfileData(prev => ({
                                                ...prev,
                                                univ_languageTests: [...prev.univ_languageTests, { id: Date.now(), type, score }]
                                            }));
                                        }
                                    }}>
                                        <SelectTrigger className="h-12 rounded-xl border-dashed border-[#B0B8C1] text-[#8B95A1] hover:text-[#3182F6] hover:border-[#3182F6] hover:bg-blue-50 font-bold justify-center">
                                            <Plus className="h-5 w-5 mr-2" /> 어학 점수 추가하기
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["TOEIC", "TOEIC Speaking", "OPIc", "TOEFL", "TEPS", "JLPT", "HSK", "기타"].map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2 mt-4">
                                <Label>기타 자격증 / 수상 경력</Label>
                                <Textarea 
                                    value={profileData.univ_certificates}
                                    onChange={(e) => setProfileData({...profileData, univ_certificates: e.target.value})}
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
                                    onValueChange={(val) => setProfileData({...profileData, univ_careerReadiness: val})}
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
                                    onValueChange={(val) => setProfileData({...profileData, univ_careerGoalClear: val})}
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

                            <div className="space-y-2">
                                <Label>인턴십/현장실습 경험</Label>
                                <Select 
                                    value={profileData.univ_internshipStatus} 
                                    onValueChange={(val) => setProfileData({...profileData, univ_internshipStatus: val})}
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
                                    {["의사소통", "리더십", "팀워크", "문제해결", "데이터분석", "외국어", "IT/SW역량", "직무전문성"].map((skill) => (
                                        <div key={skill} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`skill-${skill}`} 
                                                checked={profileData.univ_skillsToDevelop.includes(skill)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setProfileData({...profileData, univ_skillsToDevelop: [...profileData.univ_skillsToDevelop, skill]});
                                                    } else {
                                                        setProfileData({...profileData, univ_skillsToDevelop: profileData.univ_skillsToDevelop.filter(s => s !== skill)});
                                                    }
                                                }}
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
                                            onValueChange={(val) => setProfileData({...profileData, univ_academicStress: val})}
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
                                            onValueChange={(val) => setProfileData({...profileData, univ_financialStress: val})}
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
                                            onChange={(e) => setProfileData({...profileData, univ_sleepHours: e.target.value})}
                                            className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>현재 심리적 에너지 수준</Label>
                                        <Select 
                                            value={profileData.univ_mentalWellbeing} 
                                            onValueChange={(val) => setProfileData({...profileData, univ_mentalWellbeing: val})}
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
                                                onChange={(e) => setProfileData({...profileData, univ_workloadWorkHours: e.target.value})}
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
                                                onChange={(e) => setProfileData({...profileData, univ_workloadStudyHours: e.target.value})}
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
                                            onValueChange={(val) => setProfileData({...profileData, univ_belongingScore: val})}
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
                                                    onCheckedChange={(c) => setProfileData({...profileData, univ_hasSupportPerson: true})}
                                                />
                                                <label htmlFor="support-yes">네</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id="support-no" 
                                                    checked={!profileData.univ_hasSupportPerson}
                                                    onCheckedChange={(c) => setProfileData({...profileData, univ_hasSupportPerson: false})}
                                                />
                                                <label htmlFor="support-no">아니오</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <Separator />

                            <div className="space-y-4">
                                <h4 className="font-bold text-sm text-[#4E5968]">교내 커리어 지원 리소스 활용</h4>
                                <div className="space-y-3">
                                    <Label>이번 학기 이용한 교내 서비스 (중복 선택)</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {["학업상담/튜터링", "심리상담센터", "진로/취업센터", "글쓰기센터", "장학/복지팀", "창업지원단", "현장실습지원센터"].map((service) => (
                                            <div key={service} className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id={`service-${service}`} 
                                                    checked={profileData.univ_servicesUsed.includes(service)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setProfileData({...profileData, univ_servicesUsed: [...profileData.univ_servicesUsed, service]});
                                                        } else {
                                                            setProfileData({...profileData, univ_servicesUsed: profileData.univ_servicesUsed.filter(s => s !== service)});
                                                        }
                                                    }}
                                                />
                                                <label htmlFor={`service-${service}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                    {service}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </CardContent>
                    </Card>

                    <Card className="toss-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <AlertTriangle className="h-5 w-5 text-[#FF5252]" /> 취업/진로 고민
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label>현재 가장 큰 고민</Label>
                                <Textarea 
                                    value={profileData.univ_concerns}
                                    onChange={(e) => setProfileData({...profileData, univ_concerns: e.target.value})}
                                    placeholder="취업 준비, 진로 선택 등 현재 가장 고민되는 점을 적어주세요." 
                                    className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
             );

        case 'general':
        default:
            return (
                <div className="space-y-6 animate-in fade-in">
                    {/* Current Status & Satisfaction */}
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
                                    onValueChange={(val) => setProfileData({...profileData, gen_currentStatus: val})}
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                        <SelectValue placeholder="현재 상태 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="employed">재직 중 (이직 준비)</SelectItem>
                                        <SelectItem value="unemployed">구직 중 (미취업/퇴사)</SelectItem>
                                        <SelectItem value="freelance">프리랜서 / 계약직</SelectItem>
                                        <SelectItem value="student">취업 준비생 (졸업 예정/유예)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>이전(또는 현재) 직무 만족도</Label>
                                <Select 
                                    value={profileData.gen_prevJobSatisfaction} 
                                    onValueChange={(val) => setProfileData({...profileData, gen_prevJobSatisfaction: val})}
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                        <SelectValue placeholder="만족도 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">매우 만족 (5점)</SelectItem>
                                        <SelectItem value="4">만족하는 편 (4점)</SelectItem>
                                        <SelectItem value="3">보통 (3점)</SelectItem>
                                        <SelectItem value="2">불만족 (2점)</SelectItem>
                                        <SelectItem value="1">매우 불만족 (1점)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>새로운 일을 찾는 주된 이유</Label>
                                <Select 
                                    value={profileData.gen_reasonForChange} 
                                    onValueChange={(val) => setProfileData({...profileData, gen_reasonForChange: val})}
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                        <SelectValue placeholder="가장 큰 이유 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="growth">성장 기회 부족 (더 배우고 싶어서)</SelectItem>
                                        <SelectItem value="compensation">연봉 및 보상 불만족</SelectItem>
                                        <SelectItem value="culture">조직 문화 및 인간관계</SelectItem>
                                        <SelectItem value="aptitude">적성에 맞지 않는 업무</SelectItem>
                                        <SelectItem value="stability">고용 불안정</SelectItem>
                                        <SelectItem value="burnout">업무 과다 및 번아웃</SelectItem>
                                        <SelectItem value="new_challenge">새로운 분야 도전</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Skills & Experience */}
                    <Card className="toss-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BrainCircuit className="h-5 w-5 text-[#00BFA5]" /> 보유 역량 및 경력
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {/* Work Experience List */}
                             <div className="space-y-3 mb-6">
                                <Label>주요 경력 사항</Label>
                                {profileData.gen_workExperience.map((exp) => (
                                    <div key={exp.id} className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E8EB] space-y-3 relative group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-[#191F28] text-lg">{exp.role}</h4>
                                                <p className="text-[#4E5968] font-medium">{exp.company}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-[#E44E48] hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-sm text-[#8B95A1]">
                                            <CalendarIcon className="h-4 w-4" />
                                            <span>{format(exp.startDate, 'yyyy.MM')} - {exp.endDate ? format(exp.endDate, 'yyyy.MM') : '현재'}</span>
                                        </div>

                                        <p className="text-sm text-[#4E5968] whitespace-pre-line pl-3 border-l-2 border-[#E5E8EB]">
                                            {exp.description}
                                        </p>
                                    </div>
                                ))}

                                <Button variant="outline" className="w-full h-12 rounded-xl border-dashed border-[#B0B8C1] text-[#8B95A1] hover:text-[#3182F6] hover:border-[#3182F6] hover:bg-blue-50 font-bold">
                                    <Plus className="h-5 w-5 mr-2" /> 경력 추가하기
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <Label>보유 핵심 스킬 (Transferable Skills)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {["프로젝트 관리", "데이터 분석", "커뮤니케이션", "영업/협상", "마케팅", "디자인", "개발/코딩", "문서 작성", "외국어"].map((skill) => (
                                        <div key={skill} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`skill-${skill}`} 
                                                checked={profileData.gen_skills.includes(skill)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setProfileData({...profileData, gen_skills: [...profileData.gen_skills, skill]});
                                                    } else {
                                                        setProfileData({...profileData, gen_skills: profileData.gen_skills.filter(s => s !== skill)});
                                                    }
                                                }}
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

                    {/* Desired Direction */}
                    <Card className="toss-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TrendingUp className="h-5 w-5 text-[#FFB300]" /> 희망 커리어 방향
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>희망 산업 분야</Label>
                                <Input 
                                    placeholder="예: IT/플랫폼, 금융, 헬스케어" 
                                    value={profileData.gen_desiredIndustry}
                                    onChange={(e) => setProfileData({...profileData, gen_desiredIndustry: e.target.value})}
                                    className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>희망 직무</Label>
                                <Input 
                                    placeholder="예: 서비스 기획자, 마케터" 
                                    value={profileData.gen_desiredRole}
                                    onChange={(e) => setProfileData({...profileData, gen_desiredRole: e.target.value})}
                                    className="h-12 rounded-xl bg-[#F2F4F6] border-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>선호하는 업무 스타일</Label>
                                <Select 
                                    value={profileData.gen_workStyle} 
                                    onValueChange={(val) => setProfileData({...profileData, gen_workStyle: val})}
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                        <SelectValue placeholder="업무 스타일 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="independent">독립적으로 일하는 것 선호</SelectItem>
                                        <SelectItem value="team">팀과 협업하며 일하는 것 선호</SelectItem>
                                        <SelectItem value="leadership">리더십을 발휘하는 역할 선호</SelectItem>
                                        <SelectItem value="support">안정적으로 지원하는 역할 선호</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Work Values */}
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
                                {workValueOptions.map((option) => {
                                    const Icon = option.icon;
                                    const isSelected = profileData.gen_workValues.includes(option.id);
                                    return (
                                        <div 
                                            key={option.id}
                                            onClick={() => toggleWorkValue(option.id)}
                                            className={`
                                                cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center
                                                ${isSelected 
                                                    ? 'border-[#3182F6] bg-blue-50 text-[#3182F6]' 
                                                    : 'border-[#F2F4F6] bg-white hover:border-[#E5E8EB] text-[#8B95A1]'}
                                            `}
                                        >
                                            <Icon className={`h-6 w-6 ${isSelected ? 'text-[#3182F6]' : 'text-[#B0B8C1]'}`} />
                                            <span className="font-bold text-sm">{option.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Salary & Environment */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="toss-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <DollarSign className="h-5 w-5 text-[#00BFA5]" /> 희망 연봉
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Checkbox 
                                        id="salary-none" 
                                        checked={profileData.gen_salaryNoPreference}
                                        onCheckedChange={toggleSalaryNoPreference}
                                    />
                                    <label htmlFor="salary-none" className="text-sm font-medium leading-none text-[#4E5968] cursor-pointer">
                                        상관 없음 (면접 후 협의)
                                    </label>
                                </div>
                                
                                <ResponsiveModal
                                    open={!profileData.gen_salaryNoPreference ? undefined : false}
                                    trigger={
                                        <Button 
                                            variant="outline" 
                                            className={`w-full h-14 text-lg font-bold justify-between px-4 rounded-xl border-[#E5E8EB] ${profileData.gen_salaryNoPreference ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={profileData.gen_salaryNoPreference}
                                        >
                                            <span className="text-[#191F28]">
                                                {profileData.gen_salary > 0 ? `${profileData.gen_salary.toLocaleString()}만원` : "연봉 입력"}
                                            </span>
                                            <span className="text-[#8B95A1] text-sm font-normal">이상</span>
                                        </Button>
                                    }
                                    title="희망 연봉 입력"
                                    description="희망하는 최소 연봉을 입력해주세요."
                                >
                                    <ResponsiveSalaryInputContent 
                                        value={profileData.gen_salary} 
                                        onChange={(val) => setProfileData(prev => ({ ...prev, gen_salary: val }))} 
                                    />
                                </ResponsiveModal>
                            </CardContent>
                        </Card>

                        <Card className="toss-card">
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Building className="h-5 w-5 text-[#333D4B]" /> 선호 근무 환경
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Checkbox 
                                        id="env-none" 
                                        checked={profileData.gen_environmentNoPreference}
                                        onCheckedChange={toggleEnvironmentNoPreference}
                                    />
                                    <label htmlFor="env-none" className="text-sm font-medium leading-none text-[#4E5968] cursor-pointer">
                                        상관 없음
                                    </label>
                                </div>

                                <ResponsiveModal
                                    open={!profileData.gen_environmentNoPreference ? undefined : false}
                                    trigger={
                                        <Button 
                                            variant="outline" 
                                            className={`w-full h-14 text-lg font-bold justify-between px-4 rounded-xl border-[#E5E8EB] ${profileData.gen_environmentNoPreference ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={profileData.gen_environmentNoPreference}
                                        >
                                            <span className="text-[#191F28] truncate max-w-[80%] text-left">
                                                {profileData.gen_environmentPreferences.length > 0 
                                                    ? `${profileData.gen_environmentPreferences.length}개 선택됨` 
                                                    : "근무 환경 선택"}
                                            </span>
                                            <span className="text-[#8B95A1] text-2xl font-light leading-none mb-1">›</span>
                                        </Button>
                                    }
                                    title="선호 근무 환경"
                                    description="선호하는 근무 환경을 모두 선택해주세요."
                                >
                                    <div className="space-y-3 pb-4">
                                        {environmentOptions.map((option) => {
                                            const isSelected = profileData.gen_environmentPreferences.includes(option.id);
                                            const Icon = option.icon;
                                            return (
                                                <div 
                                                    key={option.id}
                                                    onClick={() => toggleEnvironmentPreference(option.id)}
                                                    className={`
                                                        flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all
                                                        ${isSelected 
                                                            ? 'border-[#3182F6] bg-blue-50' 
                                                            : 'border-[#F2F4F6] hover:border-[#E5E8EB]'}
                                                    `}
                                                >
                                                    <div className={`p-2 rounded-full mr-4 ${isSelected ? 'bg-white text-[#3182F6]' : 'bg-[#F2F4F6] text-[#B0B8C1]'}`}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={`font-bold ${isSelected ? 'text-[#191F28]' : 'text-[#4E5968]'}`}>
                                                            {option.label}
                                                        </p>
                                                        <p className="text-xs text-[#8B95A1] mt-0.5">
                                                            {option.desc}
                                                        </p>
                                                    </div>
                                                    {isSelected && <CheckCircle2 className="h-5 w-5 text-[#3182F6]" />}
                                                </div>
                                            );
                                        })}
                                        <ResponsiveClose asChild>
                                            <Button className="w-full mt-4 rounded-xl h-12 text-lg font-bold bg-[#3182F6]">선택 완료</Button>
                                        </ResponsiveClose>
                                    </div>
                                </ResponsiveModal>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <Card className="toss-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <AlertTriangle className="h-5 w-5 text-[#FF5252]" /> 커리어 고민
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label>현재 가장 큰 고민</Label>
                                <Textarea 
                                    value={profileData.gen_concerns}
                                    onChange={(e) => setProfileData({...profileData, gen_concerns: e.target.value})}
                                    placeholder="이직, 직무 변경, 연봉 협상 등 현재 커리어와 관련된 가장 큰 고민을 적어주세요." 
                                    className="min-h-[100px] rounded-xl bg-[#F2F4F6] border-none resize-none"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
      }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[28px] font-bold text-[#191F28]">내 프로필</h2>
            <p className="text-[#8B95A1] mt-1 text-lg">AI 분석의 정확도를 높이기 위해 정보를 입력해주세요.</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="gap-2 h-12 px-6 rounded-xl bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/20 font-bold text-base hidden md:flex disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} 
            {isSaving ? "저장 중..." : "저장하기"}
          </Button>
        </div>

        {/* Profile Type Selector */}
        <div className="mb-8">
            <Label className="text-[#4E5968] font-bold mb-3 block">프로필 유형 선택</Label>
            <div className="flex flex-wrap gap-2">
                {[
                    { id: 'general', label: '일반 (직장인)' },
                    { id: 'university', label: '대학생' },
                    { id: 'high', label: '고등학생' },
                    { id: 'middle', label: '중학생' },
                    { id: 'elementary', label: '초등학생' },
                ].map((type) => (
                    <button
                        key={type.id}
                        onClick={() => setProfileData(prev => ({ ...prev, type: type.id as any }))}
                        className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all ${
                            profileData.type === type.id
                                ? "bg-[#3182F6] text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-100"
                                : "bg-white text-[#8B95A1] border border-[#E5E8EB] hover:bg-[#F2F4F6]"
                        }`}
                    >
                        {type.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid gap-8 md:grid-cols-[320px_1fr]">
          {/* Profile Overview Card */}
          <div className="space-y-6">
            <Card className="toss-card">
              <CardContent className="pt-8 flex flex-col items-center text-center">
                <div className="relative mb-4 group cursor-pointer">
                  {userProfileImage ? (
                    <img 
                      src={userProfileImage} 
                      alt="Profile" 
                      className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-[#F2F4F6] flex items-center justify-center text-2xl font-bold text-[#3182F6] border-4 border-white shadow-lg group-hover:scale-105 transition-transform">
                      {profileData.basic_name ? profileData.basic_name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 h-8 w-8 bg-white rounded-full border shadow-sm flex items-center justify-center">
                      <Edit2 className="h-4 w-4 text-[#8B95A1]" />
                  </div>
                </div>
                
                {/* Editable Name & Role */}
                <div className="w-full space-y-2 mb-6">
                    <Input 
                        value={profileData.basic_name}
                        onChange={(e) => setProfileData({...profileData, basic_name: e.target.value})}
                        className="text-center text-xl font-bold border-none shadow-none focus-visible:ring-0 bg-transparent h-auto p-0 hover:bg-[#F2F4F6] rounded-lg transition-colors"
                    />
                    <Input 
                        value={profileData.basic_role}
                        onChange={(e) => setProfileData({...profileData, basic_role: e.target.value})}
                        className="text-center text-[#8B95A1] font-medium border-none shadow-none focus-visible:ring-0 bg-transparent h-auto p-0 hover:bg-[#F2F4F6] rounded-lg transition-colors"
                        placeholder="직책 또는 한 줄 소개 입력"
                    />
                </div>
                
                <div className="mt-2 w-full space-y-3 text-left">
                  <div className="flex items-center gap-3 text-[#4E5968] text-sm font-medium p-3 rounded-xl bg-[#F9FAFB] group focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Mail className="h-4 w-4 text-[#B0B8C1] shrink-0" />
                    <Input 
                        value={profileData.basic_email}
                        onChange={(e) => setProfileData({...profileData, basic_email: e.target.value})}
                        className="border-none shadow-none focus-visible:ring-0 bg-transparent h-auto p-0 text-sm text-[#4E5968]"
                    />
                  </div>
                  <div className="flex items-center gap-3 text-[#4E5968] text-sm font-medium p-3 rounded-xl bg-[#F9FAFB] group focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <MapPin className="h-4 w-4 text-[#B0B8C1] shrink-0" />
                    <Input 
                        value={profileData.basic_location}
                        onChange={(e) => setProfileData({...profileData, basic_location: e.target.value})}
                        className="border-none shadow-none focus-visible:ring-0 bg-transparent h-auto p-0 text-sm text-[#4E5968]"
                    />
                  </div>
                  
                  {/* Gender / Birthdate - Clickable Trigger */}
                  <ResponsiveModal
                        trigger={
                            <div className="flex items-center gap-3 text-[#4E5968] text-sm font-medium p-3 rounded-xl bg-[#F9FAFB] hover:bg-[#E8F3FF] hover:text-[#3182F6] cursor-pointer transition-colors">
                                <User className="h-4 w-4 text-[#B0B8C1]" />
                                <span>
                                    {profileData.basic_gender === 'male' ? '남성' : profileData.basic_gender === 'female' ? '여성' : '성별'} 
                                    {' / '} 
                                    {profileData.basic_birthDate ? format(profileData.basic_birthDate, 'yyyy.MM.dd') : '생년월일'}
                                </span>
                            </div>
                        }
                        title="기본 정보 수정"
                    >
                        <div className="space-y-6 p-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-[#8B95A1]">성별</Label>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        className={`flex-1 h-12 rounded-xl border-[#E5E8EB] ${profileData.basic_gender === 'male' ? 'bg-blue-50 border-[#3182F6] text-[#3182F6] font-bold' : 'text-[#4E5968]'}`}
                                        onClick={() => setProfileData({...profileData, basic_gender: 'male'})}
                                    >
                                        남성
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className={`flex-1 h-12 rounded-xl border-[#E5E8EB] ${profileData.basic_gender === 'female' ? 'bg-blue-50 border-[#3182F6] text-[#3182F6] font-bold' : 'text-[#4E5968]'}`}
                                        onClick={() => setProfileData({...profileData, basic_gender: 'female'})}
                                    >
                                        여성
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-[#8B95A1]">생년월일</Label>
                                <ResponsiveDatePickerContent 
                                    value={profileData.basic_birthDate} 
                                    onChange={(date) => setProfileData(prev => ({ ...prev, basic_birthDate: date }))} 
                                    hideButton={true}
                                />
                            </div>
                            <ResponsiveClose asChild>
                                <Button className="w-full rounded-xl h-12 text-lg font-bold bg-[#3182F6]">완료</Button>
                            </ResponsiveClose>
                        </div>
                    </ResponsiveModal>
                </div>

                <Separator className="my-6 bg-[#E5E8EB]" />
                
                <div className="w-full space-y-2">
                    <Label className="text-left block mb-2 text-[#4E5968]">한 줄 소개</Label>
                    <Textarea 
                        value={profileData.basic_bio}
                        onChange={(e) => setProfileData({...profileData, basic_bio: e.target.value})}
                        className="bg-[#F9FAFB] border-none rounded-xl min-h-[80px] text-sm resize-none focus-visible:ring-2 focus-visible:ring-blue-100 transition-all"
                    />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Form Area - Dynamic based on Type */}
          <div className="space-y-6">
               {renderProfileFields()}
          </div>
        </div>
      </div>
    </Layout>
  );
}
