import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { User, Mail, MapPin, Briefcase, School, Globe, Plus, GraduationCap, Sparkles, Save, Building, Calendar as CalendarIcon, Award, Link as LinkIcon, Trash2, Check, HardHat, Zap, Armchair, BrainCircuit, AlertTriangle, X } from "lucide-react";
import { useMobileAction } from "@/lib/MobileActionContext";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { DateWheelPicker, SalaryWheelPicker, WheelPicker } from "@/components/ui/wheel-picker";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";

function ResponsiveClose({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) {
    const isMobile = useIsMobile();
    if (isMobile) return <DrawerClose asChild={asChild}>{children}</DrawerClose>;
    return <DialogClose asChild={asChild}>{children}</DialogClose>;
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

function ResponsiveDatePickerContent({ value, onChange }: { value: Date, onChange: (date: Date) => void }) {
    const isMobile = useIsMobile();
    const [inputValue, setInputValue] = useState('');

    // Initialize with correctly formatted date
    useEffect(() => {
        if (value) {
            setInputValue(format(value, 'yyyy. MM. dd'));
        }
    }, []); // Run once on mount to set initial value, allow user to type freely afterwards without fighting updates

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);

        // Try to parse standard format yyyy. MM. dd or yyyyMMdd
        const digits = val.replace(/\D/g, '');
        if (digits.length === 8) {
            const year = parseInt(digits.substring(0, 4));
            const month = parseInt(digits.substring(4, 6)) - 1;
            const day = parseInt(digits.substring(6, 8));
            
            const newDate = new Date(year, month, day);
            // Validate date is real (e.g. not 2024.13.01)
            if (!isNaN(newDate.getTime()) && newDate.getMonth() === month) {
                onChange(newDate);
            }
        }
    };

    if (isMobile) {
        return (
            <div className="pb-4">
                <DateWheelPicker value={value} onChange={onChange} />
                <ResponsiveClose asChild>
                    <Button className="w-full mt-4 rounded-xl h-12 text-lg font-bold">완료</Button>
                </ResponsiveClose>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-6 w-full space-y-6">
             <div className="space-y-3 w-full">
                <Label className="text-[#4E5968] font-medium">날짜를 입력해주세요</Label>
                <Input 
                    value={inputValue}
                    onChange={handleInputChange}
                    className="h-14 text-xl font-medium rounded-xl border-[#E5E8EB] focus:border-[#3182F6] focus:ring-2 focus:ring-blue-100 transition-all text-center tracking-wide"
                    placeholder="YYYY. MM. DD"
                    maxLength={14} 
                />
                 <p className="text-sm text-[#8B95A1]">
                    예시: 2024. 03. 01
                </p>
            </div>
            <ResponsiveClose asChild>
                <Button className="w-full rounded-xl h-12 text-lg font-bold bg-[#3182F6]">입력 완료</Button>
            </ResponsiveClose>
        </div>
    );
}

function ResponsiveYearPickerContent({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    const isMobile = useIsMobile();
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 50}, (_, i) => (currentYear - 40 + i).toString());

    if (isMobile) {
        return (
            <div className="pb-4">
                 <div className="flex justify-center">
                    <div className="w-full max-w-xs">
                        <div className="relative flex flex-col items-center justify-center h-48 w-full overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y select-none">
                                <WheelPicker 
                                items={years}
                                value={value}
                                onChange={onChange} 
                                label="년"
                                />
                        </div>
                    </div>
                </div>
                <ResponsiveClose asChild>
                    <Button className="w-full mt-4 rounded-xl h-12 text-lg font-bold">완료</Button>
                </ResponsiveClose>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[400px]">
            <ScrollArea className="flex-1 pr-4">
                <div className="grid grid-cols-4 gap-2">
                    {years.reverse().map((year) => (
                        <Button
                            key={year}
                            variant={value === year ? "default" : "outline"}
                            className={`h-12 rounded-xl font-medium ${value === year ? "bg-[#3182F6] hover:bg-[#2b72d7]" : "border-[#E5E8EB] hover:bg-[#F2F4F6] text-[#4E5968]"}`}
                            onClick={() => onChange(year)}
                        >
                            {year}
                        </Button>
                    ))}
                </div>
            </ScrollArea>
             <ResponsiveClose asChild>
                <Button className="w-full mt-6 rounded-xl h-12 text-lg font-bold bg-[#3182F6]">선택 완료</Button>
            </ResponsiveClose>
        </div>
    );
}

function ResponsiveSalaryInputContent({ value, onChange }: { value: number, onChange: (val: number) => void }) {
    const isMobile = useIsMobile();
    const [inputValue, setInputValue] = useState(value.toLocaleString());

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove commas and non-digit characters
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

export default function Profile() {
  const { setAction } = useMobileAction();
  const { toast } = useToast();

  // State Management
  const [profileData, setProfileData] = useState({
    name: "John Doe",
    role: "Product Manager",
    bio: "데이터 기반의 의사결정을 선호하는 PM입니다.",
    experienceYears: 5,
    salary: 6000,
    environmentPreferences: [] as string[],
    workExperience: [
        {
            id: 1,
            role: "Senior Product Manager",
            company: "Tech Corp Inc.",
            startDate: new Date(2021, 2, 1), // March 2021
            endDate: new Date(2023, 11, 1), // Dec 2023
            description: "- B2B SaaS 제품 기획 및 런칭 주도\n- 3분기 연속 매출 목표 120% 달성"
        },
        {
            id: 2,
            role: "Product Owner",
            company: "Startup X",
            startDate: new Date(2019, 0, 1), // Jan 2019
            endDate: new Date(2021, 1, 1), // Feb 2021
            description: "- 모바일 앱 2.0 리뉴얼 프로젝트 PM\n- DAU 300% 성장 견인"
        }
    ]
  });

  const handleSave = () => {
    toast({
      title: "프로필 저장 완료",
      description: "프로필 정보가 성공적으로 업데이트되었습니다.",
    });
  };

  useEffect(() => {
    setAction({
      icon: Save,
      label: "저장",
      onClick: handleSave
    });
    return () => setAction(null);
  }, []);

  const handleExperienceChange = (val: number[]) => {
      setProfileData(prev => ({ ...prev, experienceYears: val[0] }));
  };

  const toggleEnvironmentPreference = (pref: string) => {
      setProfileData(prev => {
          const exists = prev.environmentPreferences.includes(pref);
          if (exists) {
              return { ...prev, environmentPreferences: prev.environmentPreferences.filter(p => p !== pref) };
          } else {
              return { ...prev, environmentPreferences: [...prev.environmentPreferences, pref] };
          }
      });
  };

  // Update work experience date
  const updateWorkExpDate = (id: number, field: 'startDate' | 'endDate', date: Date) => {
      setProfileData(prev => ({
          ...prev,
          workExperience: prev.workExperience.map(exp => 
              exp.id === id ? { ...exp, [field]: date } : exp
          )
      }));
  };

  const environmentOptions = [
      { id: 'brain', label: '지식 집약적 업무 (Brain Using)', icon: BrainCircuit, desc: '육체적 노동보다는 정신적 노동 중심' },
      { id: 'sedentary', label: '좌식 근무 (Sitting)', icon: Armchair, desc: '주로 앉아서 하는 사무직 환경' },
      { id: 'active', label: '활동적 근무 (Active)', icon: Zap, desc: '이동이 많거나 현장 활동이 포함됨' },
      { id: 'industrial', label: '제조/생산 현장 (Industrial)', icon: HardHat, desc: '공장, 건설 등 생산 현장 환경' },
      { id: 'challenging', label: '도전적 환경 (Challenging)', icon: AlertTriangle, desc: '위험 요소가 있거나 강도 높은 업무' },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[28px] font-bold text-[#191F28]">내 프로필</h2>
            <p className="text-[#8B95A1] mt-1 text-lg">AI 분석의 정확도를 높이기 위해 정보를 입력해주세요.</p>
          </div>
          <Button onClick={handleSave} className="gap-2 h-12 px-6 rounded-xl bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/20 font-bold text-base hidden md:flex">
            <Save className="h-5 w-5" /> 저장하기
          </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-[320px_1fr]">
          {/* Profile Overview Card - Sticky */}
          <div className="space-y-6">
            <Card className="toss-card sticky top-24">
              <CardContent className="pt-8 flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="h-24 w-24 rounded-full bg-[#F2F4F6] flex items-center justify-center text-2xl font-bold text-[#3182F6] border-4 border-white shadow-lg">
                    JD
                  </div>
                  <div className="absolute bottom-0 right-0 h-6 w-6 bg-[#00BFA5] rounded-full border-2 border-white" />
                </div>
                <h3 className="text-xl font-bold text-[#191F28]">{profileData.name}</h3>
                <p className="text-[#8B95A1] font-medium">{profileData.role}</p>
                
                <div className="mt-6 w-full space-y-3 text-left">
                  <div className="flex items-center gap-3 text-[#4E5968] text-sm font-medium p-3 rounded-xl bg-[#F9FAFB]">
                    <Mail className="h-4 w-4 text-[#B0B8C1]" />
                    john.doe@example.com
                  </div>
                  <div className="flex items-center gap-3 text-[#4E5968] text-sm font-medium p-3 rounded-xl bg-[#F9FAFB]">
                    <MapPin className="h-4 w-4 text-[#B0B8C1]" />
                    Seoul, South Korea
                  </div>
                  <div className="flex items-center gap-3 text-[#4E5968] text-sm font-medium p-3 rounded-xl bg-[#F9FAFB]">
                    <Briefcase className="h-4 w-4 text-[#B0B8C1]" />
                    {profileData.experienceYears}년차
                  </div>
                </div>

                <div className="w-full mt-6 pt-6 border-t border-[#F2F4F6]">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-[#4E5968]">프로필 완성도</span>
                        <span className="text-sm font-bold text-[#3182F6]">85%</span>
                    </div>
                    <div className="h-2 w-full bg-[#F2F4F6] rounded-full overflow-hidden">
                        <div className="h-full bg-[#3182F6] w-[85%]" />
                    </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Form Area */}
          <div className="space-y-8">
            
            {/* 1. Basic Info */}
            <section className="space-y-4">
                <h3 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                    <User className="h-5 w-5 text-[#3182F6]" /> 기본 정보
                </h3>
                <Card className="toss-card">
                <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[#4E5968]">이름</Label>
                        <Input 
                            value={profileData.name} 
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                            className="bg-[#F2F4F6] border-none rounded-xl h-12" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[#4E5968]">현재 직무</Label>
                        <Input 
                            value={profileData.role} 
                            onChange={(e) => setProfileData({...profileData, role: e.target.value})}
                            className="bg-[#F2F4F6] border-none rounded-xl h-12" 
                        />
                    </div>
                    </div>
                    <div className="space-y-2">
                    <Label className="text-[#4E5968]">한줄 소개</Label>
                    <Input 
                        value={profileData.bio} 
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        className="bg-[#F2F4F6] border-none rounded-xl h-12" 
                    />
                    </div>
                </CardContent>
                </Card>
            </section>

            {/* 2. Work Experience (Expanded) with Date Picker Drawers */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-[#3182F6]" /> 경력 사항
                    </h3>
                    <Button variant="ghost" size="sm" className="text-[#3182F6] hover:bg-blue-50">
                        <Plus className="h-4 w-4 mr-1" /> 추가
                    </Button>
                </div>
                
                <Card className="toss-card">
                    <CardContent className="p-6 space-y-6">
                        {profileData.workExperience.map((exp, index) => (
                            <div key={exp.id} className="space-y-4">
                                {index > 0 && <Separator className="bg-[#F2F4F6] my-6" />}
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-[#191F28] text-lg">{exp.role}</h4>
                                        <p className="text-[#4E5968] font-medium">{exp.company}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-[#B0B8C1] hover:text-red-500">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[#8B95A1] text-xs">시작일</Label>
                                        <ResponsiveModal
                                            trigger={
                                                <Button variant="outline" className="w-full h-12 justify-start text-left bg-[#F2F4F6] border-none rounded-xl font-normal text-[#191F28]">
                                                    {format(exp.startDate, 'yyyy. MM. dd')}
                                                </Button>
                                            }
                                            title="시작일 선택"
                                        >
                                            <ResponsiveDatePickerContent 
                                                value={exp.startDate} 
                                                onChange={(date) => updateWorkExpDate(exp.id, 'startDate', date)}
                                            />
                                        </ResponsiveModal>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[#8B95A1] text-xs">종료일</Label>
                                        <ResponsiveModal
                                            trigger={
                                                <Button variant="outline" className="w-full h-12 justify-start text-left bg-[#F2F4F6] border-none rounded-xl font-normal text-[#191F28]">
                                                    {format(exp.endDate, 'yyyy. MM. dd')}
                                                </Button>
                                            }
                                            title="종료일 선택"
                                        >
                                            <ResponsiveDatePickerContent 
                                                value={exp.endDate} 
                                                onChange={(date) => updateWorkExpDate(exp.id, 'endDate', date)}
                                            />
                                        </ResponsiveModal>
                                    </div>
                                </div>
                                
                                <Textarea 
                                    className="bg-[#F2F4F6] border-none rounded-xl min-h-[80px] resize-none text-sm" 
                                    defaultValue={exp.description}
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>

            {/* 3. Education (Expanded) */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-[#3182F6]" /> 학력
                    </h3>
                    <Button variant="ghost" size="sm" className="text-[#3182F6] hover:bg-blue-50">
                        <Plus className="h-4 w-4 mr-1" /> 추가
                    </Button>
                </div>
                <Card className="toss-card">
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[#4E5968]">학교명</Label>
                                    <Input defaultValue="한국대학교" className="bg-[#F2F4F6] border-none rounded-xl h-12" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#4E5968]">전공</Label>
                                    <Input defaultValue="경영학과" className="bg-[#F2F4F6] border-none rounded-xl h-12" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[#4E5968]">학위</Label>
                                    <Select defaultValue="bachelors">
                                        <SelectTrigger className="h-12 rounded-xl bg-[#F2F4F6] border-none">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bachelors">학사 (대졸)</SelectItem>
                                            <SelectItem value="masters">석사</SelectItem>
                                            <SelectItem value="phd">박사</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#4E5968]">졸업년도</Label>
                                    <ResponsiveModal
                                        trigger={
                                            <Button variant="outline" className="w-full h-12 justify-start text-left bg-[#F2F4F6] border-none rounded-xl font-normal text-[#191F28]">
                                                2018
                                            </Button>
                                        }
                                        title="졸업년도 선택"
                                    >
                                        <ResponsiveYearPickerContent 
                                            value={"2018"}
                                            onChange={(val) => {}} 
                                        />
                                    </ResponsiveModal>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

             {/* 4. Skills & Experience Years Slider */}
             <section className="space-y-4">
                <h3 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                    <Award className="h-5 w-5 text-[#3182F6]" /> 스킬 및 경력
                </h3>
                <Card className="toss-card">
                    <CardContent className="p-6 space-y-6">
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-[#4E5968] font-bold">총 경력 연수 (자동 계산)</Label>
                                <span className="text-[#3182F6] font-bold text-lg">{profileData.experienceYears}년</span>
                            </div>
                            <Slider 
                                value={[profileData.experienceYears]} 
                                onValueChange={handleExperienceChange}
                                max={20} 
                                step={1} 
                                className="py-2" 
                            />
                            <p className="text-xs text-[#8B95A1]">상단의 프로필 카드에도 반영됩니다.</p>
                        </div>

                        <Separator className="bg-[#F2F4F6]" />

                        <div className="space-y-3">
                             <Label className="text-[#4E5968] font-bold">보유 스킬</Label>
                             <div className="flex flex-wrap gap-2">
                                {["Product Strategy", "User Research", "Data Analysis", "SQL", "Figma"].map((skill) => (
                                    <Badge key={skill} variant="secondary" className="bg-[#E8F3FF] text-[#1B64DA] hover:bg-[#D2E6FF] px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer">
                                    {skill} X
                                    </Badge>
                                ))}
                                <Button variant="outline" size="sm" className="rounded-lg border-dashed border-[#B0B8C1] text-[#8B95A1] hover:text-[#3182F6] hover:border-[#3182F6] h-8">
                                    <Plus className="h-4 w-4 mr-1" /> 추가
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* 5. Work Environment & Conditions */}
            <section className="space-y-4">
                <h3 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#FFB300]" /> 근무 환경 및 조건
                </h3>
                <Card className="toss-card">
                    <CardContent className="p-6 space-y-6">
                         
                        {/* Work Environment Drawer */}
                        <div className="space-y-2">
                            <Label className="text-[#4E5968]">선호 근무 환경 (중복 선택 가능)</Label>
                            <ResponsiveModal
                                trigger={
                                    <Button 
                                        variant="ghost" 
                                        className="w-full h-auto min-h-[56px] py-3 px-4 justify-between text-left bg-[#F2F4F6] hover:bg-[#E5E8EB] border-none rounded-xl font-medium text-[#191F28] whitespace-normal items-start"
                                    >
                                        <div className="flex flex-wrap gap-2 flex-1 items-center">
                                            {profileData.environmentPreferences.length > 0 
                                                ? profileData.environmentPreferences.map(prefId => {
                                                    const option = environmentOptions.find(opt => opt.id === prefId);
                                                    // Extract Korean label part only for cleaner look
                                                    const label = option ? option.label.split('(')[0].trim() : prefId;
                                                    return (
                                                        <Badge 
                                                            key={prefId} 
                                                            variant="secondary" 
                                                            className="bg-white text-[#333D4B] hover:bg-white px-3 py-1.5 rounded-lg text-sm font-medium border border-[#E5E8EB] shadow-sm"
                                                        >
                                                            {label}
                                                        </Badge>
                                                    );
                                                })
                                                : <span className="text-[#B0B8C1] py-1">근무 환경 선택하기</span>
                                            }
                                        </div>
                                        <span className="text-[#3182F6] text-sm font-bold ml-2 mt-1.5 shrink-0">선택 &gt;</span>
                                    </Button>
                                }
                                title="근무 환경 기본 설정"
                                description="기피하거나 선호하는 근무 환경을 미리 설정하여 필터링합니다."
                            >
                                <div className="space-y-4">
                                    {environmentOptions.map((opt) => (
                                        <div 
                                            key={opt.id} 
                                            className="flex items-center space-x-4 p-4 rounded-xl border border-[#F2F4F6] bg-white cursor-pointer hover:bg-gray-50 transition-colors active:bg-gray-100"
                                            onClick={() => toggleEnvironmentPreference(opt.id)}
                                        >
                                            <div className={`p-3 rounded-full ${profileData.environmentPreferences.includes(opt.id) ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                <opt.icon className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <label htmlFor={opt.id} className="text-base font-bold text-[#191F28] block mb-1 cursor-pointer pointer-events-none">
                                                    {opt.label}
                                                </label>
                                                <p className="text-xs text-[#8B95A1]">{opt.desc}</p>
                                            </div>
                                            <Checkbox 
                                                id={opt.id} 
                                                checked={profileData.environmentPreferences.includes(opt.id)}
                                                onCheckedChange={() => toggleEnvironmentPreference(opt.id)}
                                                className="h-6 w-6 rounded-full pointer-events-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <ResponsiveClose asChild>
                                    <Button className="w-full mt-6 rounded-xl h-14 text-lg font-bold bg-[#3182F6]">설정 완료</Button>
                                </ResponsiveClose>
                            </ResponsiveModal>
                        </div>

                        {/* Salary Drawer */}
                        <div className="space-y-2">
                            <Label className="text-[#4E5968]">희망 연봉 (만원)</Label>
                            <ResponsiveModal
                                trigger={
                                    <Button variant="outline" className="w-full h-14 justify-start text-left bg-[#F2F4F6] border-none rounded-xl font-bold text-xl text-[#191F28]">
                                        {profileData.salary.toLocaleString()} 만원
                                    </Button>
                                }
                                title="희망 연봉 설정"
                                description="4자리 숫자를 스크롤하여 설정하세요."
                            >
                                <ResponsiveSalaryInputContent 
                                    value={profileData.salary} 
                                    onChange={(val) => setProfileData({...profileData, salary: val})}
                                />
                            </ResponsiveModal>
                        </div>

                        <div className="space-y-2">
                             <Label className="text-[#4E5968]">직업적 관심사</Label>
                             <Textarea 
                                defaultValue="다양한 팀과 협업하며 복잡한 사용자 문제를 데이터 기반으로 해결하는 것을 즐깁니다."
                                className="min-h-[100px] bg-[#F2F4F6] border-none rounded-xl resize-none p-4 text-base"
                             />
                        </div>
                    </CardContent>
                </Card>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}