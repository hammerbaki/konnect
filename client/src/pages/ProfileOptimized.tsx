import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { useMobileAction } from "@/lib/MobileActionContext";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState, useCallback, useRef, Suspense, lazy, useMemo, memo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSearch } from "wouter";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ProfileDataType, ProfileType, getDefaultProfileData, ProfileFormProps } from "@/components/profile/types";
import { ResponsiveModal, ResponsiveDatePickerContent } from "@/components/profile";
import { useDebounce } from "@/hooks/useDebounce";

const ElementaryForm = lazy(() => import("@/components/profile/ElementaryForm").then(m => ({ default: m.ElementaryForm })));
const MiddleSchoolForm = lazy(() => import("@/components/profile/MiddleSchoolForm").then(m => ({ default: m.MiddleSchoolForm })));
const HighSchoolForm = lazy(() => import("@/components/profile/HighSchoolForm").then(m => ({ default: m.HighSchoolForm })));
const UniversityForm = lazy(() => import("@/components/profile/UniversityForm").then(m => ({ default: m.UniversityForm })));
const GeneralForm = lazy(() => import("@/components/profile/GeneralForm").then(m => ({ default: m.GeneralForm })));
const InternationalStudentForm = lazy(() => import("@/components/profile/InternationalStudentForm").then(m => ({ default: m.InternationalStudentForm })));

const ProfileFormSkeleton = memo(() => (
  <div className="space-y-6 animate-pulse">
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
      <div className="space-y-4">
        <div className="h-12 bg-gray-100 rounded-xl" />
        <div className="h-12 bg-gray-100 rounded-xl" />
        <div className="h-12 bg-gray-100 rounded-xl" />
      </div>
    </div>
  </div>
));

const PROFILE_TYPE_OPTIONS = [
  { id: 'general' as ProfileType, label: '구직자' },
  { id: 'international' as ProfileType, label: '외국인유학생' },
  { id: 'university' as ProfileType, label: '대학생' },
  { id: 'high' as ProfileType, label: '고등학생' },
  { id: 'middle' as ProfileType, label: '중학생' },
  { id: 'elementary' as ProfileType, label: '초등학생' },
];

const ProfileTypeSelector = memo(({ 
  selectedType, 
  onTypeChange 
}: { 
  selectedType: ProfileType; 
  onTypeChange: (type: ProfileType) => void;
}) => (
  <div className="mb-8">
    <Label className="text-[#4E5968] font-bold mb-3 block">프로필 유형 선택</Label>
    <div className="flex flex-wrap gap-2">
      {PROFILE_TYPE_OPTIONS.map((typeOption) => (
        <button
          key={typeOption.id}
          onClick={() => onTypeChange(typeOption.id)}
          className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all ${
            selectedType === typeOption.id
              ? "bg-[#3182F6] text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-100"
              : "bg-white text-[#8B95A1] border border-[#E5E8EB] hover:bg-[#F2F4F6]"
          }`}
        >
          {typeOption.label}
        </button>
      ))}
    </div>
  </div>
));

const BasicInfoCard = memo(({ 
  profileData, 
  updateField, 
  userProfileImage, 
  userEmail 
}: { 
  profileData: ProfileDataType; 
  updateField: <K extends keyof ProfileDataType>(field: K, value: ProfileDataType[K]) => void;
  userProfileImage: string | null;
  userEmail: string;
}) => (
  <Card className="toss-card">
    <CardContent className="pt-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative shrink-0">
          {userProfileImage ? (
            <img 
              src={userProfileImage} 
              alt="Profile" 
              className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-[#F2F4F6] flex items-center justify-center text-xl font-bold text-[#3182F6] border-2 border-white shadow-md">
              {profileData.basic_name ? profileData.basic_name.charAt(0).toUpperCase() : "U"}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-[#191F28] truncate">{profileData.basic_name || "이름을 입력하세요"}</h3>
          <p className="text-sm text-[#8B95A1]">{profileData.basic_email || userEmail}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-[#8B95A1] font-medium">이름</Label>
          <Input 
            value={profileData.basic_name}
            onChange={(e) => updateField('basic_name', e.target.value)}
            placeholder="홍길동"
            className="h-11 rounded-xl bg-[#F9FAFB] border-[#E5E8EB] focus:border-[#3182F6] focus:ring-2 focus:ring-blue-100"
            data-testid="input-basic-name"
          />
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-xs text-[#8B95A1] font-medium">이메일</Label>
          <Input 
            value={profileData.basic_email}
            onChange={(e) => updateField('basic_email', e.target.value)}
            placeholder="email@example.com"
            className="h-11 rounded-xl bg-[#F9FAFB] border-[#E5E8EB] focus:border-[#3182F6] focus:ring-2 focus:ring-blue-100"
            data-testid="input-basic-email"
          />
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-xs text-[#8B95A1] font-medium">소속국가</Label>
          <Input 
            value={profileData.basic_location}
            onChange={(e) => updateField('basic_location', e.target.value)}
            placeholder="대한민국"
            className="h-11 rounded-xl bg-[#F9FAFB] border-[#E5E8EB] focus:border-[#3182F6] focus:ring-2 focus:ring-blue-100"
            data-testid="input-basic-location"
          />
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-xs text-[#8B95A1] font-medium">생년월일</Label>
          <ResponsiveModal
            trigger={
              <button 
                className="w-full h-11 rounded-xl bg-[#F9FAFB] border border-[#E5E8EB] px-3 text-left text-sm text-[#4E5968] hover:bg-[#E8F3FF] hover:border-[#3182F6] transition-colors flex items-center gap-2"
                data-testid="button-basic-birthdate"
              >
                <CalendarIcon className="h-4 w-4 text-[#B0B8C1]" />
                <span>{profileData.basic_birthDate ? format(profileData.basic_birthDate, 'yyyy.MM.dd') : '선택'}</span>
              </button>
            }
            title="생년월일 선택"
          >
            <ResponsiveDatePickerContent 
              value={profileData.basic_birthDate} 
              onChange={(date) => updateField('basic_birthDate', date)} 
            />
          </ResponsiveModal>
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-xs text-[#8B95A1] font-medium">성별</Label>
          <div className="flex gap-1 h-11 items-center">
            <Button 
              variant="outline" 
              size="sm"
              className={`h-8 px-3 rounded-lg text-xs ${profileData.basic_gender === 'male' ? 'bg-blue-50 border-[#3182F6] text-[#3182F6] font-bold' : 'border-[#E5E8EB] text-[#8B95A1]'}`}
              onClick={() => updateField('basic_gender', 'male')}
            >
              남성
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className={`h-8 px-3 rounded-lg text-xs ${profileData.basic_gender === 'female' ? 'bg-blue-50 border-[#3182F6] text-[#3182F6] font-bold' : 'border-[#E5E8EB] text-[#8B95A1]'}`}
              onClick={() => updateField('basic_gender', 'female')}
            >
              여성
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-[#F2F4F6]">
        <div className="space-y-1.5">
          <Label className="text-xs text-[#8B95A1] font-medium">한줄소개</Label>
          <Input 
            value={profileData.basic_bio}
            onChange={(e) => updateField('basic_bio', e.target.value)}
            placeholder="간단한 자기소개를 입력하세요"
            className="h-11 rounded-xl bg-[#F9FAFB] border-[#E5E8EB] focus:border-[#3182F6] focus:ring-2 focus:ring-blue-100"
            data-testid="input-basic-bio"
          />
        </div>
      </div>
    </CardContent>
  </Card>
));

export default function ProfileOptimized() {
  const { setAction } = useMobileAction();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const searchString = useSearch();

  const userName = user ? 
    (user.lastName && user.firstName ? `${user.lastName}${user.firstName}` : user.lastName || user.firstName || user.email?.split("@")[0] || "")
    : "";
  const userEmail = user?.email || "";
  const userProfileImage = user?.profileImageUrl || null;

  const [profileData, setProfileData] = useState<ProfileDataType>(getDefaultProfileData());
  const [isSaving, setIsSaving] = useState(false);
  const [selectedType, setSelectedType] = useState<ProfileType>("general");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavedStatus, setShowSavedStatus] = useState(false);
  
  const isInitialLoad = useRef(true);
  const hasScrolledToField = useRef(false);
  const profileDataRef = useRef(profileData);
  const selectedTypeRef = useRef(selectedType);
  const lastLoadedProfileId = useRef<string | null>(null);
  const lastLoadedIdentityId = useRef<string | null>(null);

  useEffect(() => { profileDataRef.current = profileData; }, [profileData]);
  useEffect(() => { selectedTypeRef.current = selectedType; }, [selectedType]);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const typeParam = params.get('type') as ProfileType | null;
    
    if (typeParam && ['elementary', 'middle', 'high', 'university', 'general', 'international'].includes(typeParam)) {
      if (typeParam !== selectedType) {
        setSelectedType(typeParam);
      }
    }
  }, [searchString]);

  useEffect(() => {
    if (hasScrolledToField.current) return;
    
    const params = new URLSearchParams(searchString);
    const fieldKey = params.get('field');
    
    if (fieldKey) {
      const fieldTypeMap: Record<string, ProfileType> = {
        'high_': 'high',
        'univ_': 'university',
        'gen_': 'general',
        'elem_': 'elementary',
        'mid_': 'middle',
        'intl_': 'international',
      };
      
      const prefix = Object.keys(fieldTypeMap).find(p => fieldKey.startsWith(p));
      const targetProfileType = prefix ? fieldTypeMap[prefix] : null;
      
      if (targetProfileType && targetProfileType !== selectedType) {
        setSelectedType(targetProfileType);
        return;
      }
      
      const attemptScroll = (attemptsLeft: number) => {
        const element = document.getElementById(`field-${fieldKey}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-[#3182F6]', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-[#3182F6]', 'ring-offset-2');
          }, 3000);
          hasScrolledToField.current = true;
        } else if (attemptsLeft > 0) {
          setTimeout(() => attemptScroll(attemptsLeft - 1), 200);
        }
      };
      
      setTimeout(() => attemptScroll(10), 300);
    }
  }, [searchString, selectedType]);

  const { data: userIdentity, isLoading: isLoadingIdentity } = useQuery({
    queryKey: ['/api/user-identity'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user-identity');
      return response.json();
    },
    enabled: !!user,
    staleTime: 30000,
  });
  
  const { data: serverProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['/api/user-profile', selectedType],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/user-profile?type=${selectedType}`);
      return response.json();
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const saveIdentityMutation = useMutation({
    mutationFn: async (data: { displayName?: string; email?: string; gender?: string; birthDate?: Date | null }) => {
      const response = await apiRequest('PATCH', '/api/user-identity', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-identity'] });
    },
  });
  
  const saveProfileMutation = useMutation({
    mutationFn: async (data: { type: string; profileData: Record<string, any> }) => {
      const response = await apiRequest('PUT', '/api/user-profile', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
    },
  });

  useEffect(() => {
    if (userIdentity && userIdentity.id !== lastLoadedIdentityId.current) {
      lastLoadedIdentityId.current = userIdentity.id;
      
      setProfileData(prev => ({
        ...prev,
        basic_name: userIdentity.displayName || userName || "",
        basic_email: userIdentity.email || userEmail || "",
        basic_gender: userIdentity.gender || undefined,
        basic_birthDate: userIdentity.birthDate ? new Date(userIdentity.birthDate) : null,
      }));
    }
  }, [userIdentity?.id, userName, userEmail]);
  
  useEffect(() => {
    if (serverProfile && serverProfile.id !== lastLoadedProfileId.current) {
      lastLoadedProfileId.current = serverProfile.id;
      
      const savedData = (serverProfile.profileData || {}) as Record<string, any>;
      const parsedData = { ...savedData };
      
      if (parsedData.gen_workExperience) {
        parsedData.gen_workExperience = parsedData.gen_workExperience.map((exp: any) => ({
          ...exp,
          startDate: exp.startDate ? new Date(exp.startDate) : null,
          endDate: exp.endDate ? new Date(exp.endDate) : null,
        }));
      }
      
      setProfileData(prev => ({
        ...getDefaultProfileData(selectedType),
        ...parsedData,
        type: selectedType,
        basic_name: prev.basic_name,
        basic_email: prev.basic_email,
        basic_gender: prev.basic_gender,
        basic_birthDate: prev.basic_birthDate,
      }));
      isInitialLoad.current = false;
    }
  }, [serverProfile?.id, selectedType]);

  const performSave = useCallback(async (showToast = true) => {
    if (isSaving) return;
    setIsSaving(true);
    
    const currentData = profileDataRef.current;
    
    const identityData = {
      displayName: currentData.basic_name || undefined,
      email: currentData.basic_email || undefined,
      gender: currentData.basic_gender || undefined,
      birthDate: currentData.basic_birthDate || undefined,
    };
    
    const { 
      type, 
      basic_name, 
      basic_email, 
      basic_gender, 
      basic_birthDate, 
      ...profileSpecificData 
    } = currentData;
    
    try {
      await Promise.all([
        saveIdentityMutation.mutateAsync(identityData),
        saveProfileMutation.mutateAsync({
          type: selectedTypeRef.current,
          profileData: profileSpecificData,
        }),
      ]);
      
      setHasUnsavedChanges(false);
      setShowSavedStatus(true);
      
      setTimeout(() => setShowSavedStatus(false), 3000);
      
      if (showToast) {
        toast({
          title: "프로필 저장 완료",
          description: "프로필 정보가 성공적으로 저장되었습니다.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      if (showToast) {
        toast({
          title: "저장 실패",
          description: "프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.",
          variant: "destructive",
          duration: 4000,
        });
      }
    } finally {
      setIsSaving(false);
    }
  }, [toast, saveIdentityMutation, saveProfileMutation, isSaving]);

  const debouncedAutoSave = useDebounce(() => {
    if (hasUnsavedChanges && !isInitialLoad.current) {
      performSave(false);
    }
  }, 3000);

  const updateField = useCallback(<K extends keyof ProfileDataType>(
    field: K, 
    value: ProfileDataType[K]
  ) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    debouncedAutoSave();
  }, [debouncedAutoSave]);

  const updateNestedField = useCallback(<K extends keyof ProfileDataType>(
    field: K,
    key: string,
    value: any
  ) => {
    setProfileData(prev => ({
      ...prev,
      [field]: { ...(prev[field] as object), [key]: value }
    }));
    setHasUnsavedChanges(true);
    debouncedAutoSave();
  }, [debouncedAutoSave]);

  const handleTypeChange = useCallback((newType: ProfileType) => {
    if (newType !== selectedType) {
      lastLoadedProfileId.current = null;
      setSelectedType(newType);
      setProfileData(prev => ({ ...prev, type: newType }));
    }
  }, [selectedType]);

  const handleSave = useCallback(() => performSave(true), [performSave]);

  useEffect(() => {
    setAction({
      icon: isSaving ? Loader2 : Save,
      label: isSaving ? "저장 중..." : "저장",
      onClick: handleSave,
      disabled: isSaving,
    });
    return () => setAction(null);
  }, [isSaving, setAction, handleSave]);

  const formProps: ProfileFormProps = useMemo(() => ({
    profileData,
    updateField,
    updateNestedField,
  }), [profileData, updateField, updateNestedField]);

  const renderProfileForm = useMemo(() => {
    switch (selectedType) {
      case 'elementary':
        return <ElementaryForm {...formProps} />;
      case 'middle':
        return <MiddleSchoolForm {...formProps} />;
      case 'high':
        return <HighSchoolForm {...formProps} />;
      case 'university':
        return <UniversityForm {...formProps} />;
      case 'international':
        return <InternationalStudentForm {...formProps} />;
      case 'general':
      default:
        return <GeneralForm {...formProps} />;
    }
  }, [selectedType, formProps]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[28px] font-bold text-[#191F28]">내 프로필</h2>
            <p className="text-[#8B95A1] mt-1 text-lg">AI 분석의 정확도를 높이기 위해 정보를 입력해주세요.</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {(hasUnsavedChanges || isSaving) && (
              <span className="text-xs text-[#FFB300] flex items-center gap-1.5 font-medium">
                <span className="inline-block w-1.5 h-1.5 bg-[#FFB300] rounded-full animate-pulse" />
                자동 저장중...
              </span>
            )}
            {showSavedStatus && !hasUnsavedChanges && !isSaving && (
              <span className="text-xs text-[#00BFA5] flex items-center gap-1.5 font-medium">
                <span className="inline-block w-1.5 h-1.5 bg-[#00BFA5] rounded-full" />
                자동 저장 완료
              </span>
            )}
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="gap-2 h-12 px-6 rounded-xl bg-[#3182F6] hover:bg-[#2b72d7] shadow-lg shadow-blue-500/20 font-bold text-base disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} 
              {isSaving ? "저장 중..." : "저장하기"}
            </Button>
          </div>
        </div>

        <BasicInfoCard 
          profileData={profileData} 
          updateField={updateField} 
          userProfileImage={userProfileImage} 
          userEmail={userEmail} 
        />

        <div className="space-y-6">
          <Suspense fallback={<ProfileFormSkeleton />}>
            {renderProfileForm}
          </Suspense>
        </div>
      </div>
    </Layout>
  );
}
