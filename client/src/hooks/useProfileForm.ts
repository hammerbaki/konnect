import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ProfileDataType, ProfileType, getDefaultProfileData } from '@/components/profile/types';
import { useDebounce } from './useDebounce';

interface UseProfileFormOptions {
  user: any;
  selectedType: ProfileType;
}

export function useProfileForm({ user, selectedType }: UseProfileFormOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [profileData, setProfileData] = useState<ProfileDataType>(getDefaultProfileData(selectedType));
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const isInitialLoad = useRef(true);
  const lastLoadedProfileId = useRef<string | null>(null);
  const lastLoadedIdentityId = useRef<string | null>(null);
  const profileDataRef = useRef(profileData);
  const selectedTypeRef = useRef(selectedType);

  useEffect(() => { profileDataRef.current = profileData; }, [profileData]);
  useEffect(() => { selectedTypeRef.current = selectedType; }, [selectedType]);

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
        basic_name: userIdentity.displayName || "",
        basic_email: userIdentity.email || "",
        basic_gender: userIdentity.gender || undefined,
        basic_birthDate: userIdentity.birthDate ? new Date(userIdentity.birthDate) : null,
      }));
    }
  }, [userIdentity?.id]);

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
  }, [toast, saveIdentityMutation, saveProfileMutation]);

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
      setProfileData(prev => ({ ...prev, type: newType }));
    }
  }, [selectedType]);

  const handleSave = useCallback(() => performSave(true), [performSave]);

  return {
    profileData,
    setProfileData,
    updateField,
    updateNestedField,
    isSaving,
    isLoading: isLoadingIdentity || isLoadingProfile,
    hasUnsavedChanges,
    handleSave,
    handleTypeChange,
    userIdentity,
    serverProfile,
  };
}
