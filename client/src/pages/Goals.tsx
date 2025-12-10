import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronRight, Compass, Sparkles, FolderOpen, Users, Heart, Loader2, Pencil, Trash2, ExternalLink, Calendar } from "lucide-react";
import { generateTree, VisionGoal } from "@/lib/mockData";
import { useLocation } from "wouter";
import { useMobileAction } from "@/lib/MobileActionContext";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ImportedCareerData {
  title: string;
  actions: {
    portfolio: string[];
    networking: string[];
    mindset: string[];
  };
  strengths: string[];
  weaknesses: string[];
}

interface KompassItem {
  id: string;
  profileId: string;
  targetYear: number;
  visionData: VisionGoal;
  progress: number;
  profileTitle?: string;
  profileType?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Profile {
  id: string;
  title: string;
  type: string;
}

export default function Goals() {
  const [_, setLocation] = useLocation();
  const { setAction } = useMobileAction();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTargetYear, setNewTargetYear] = useState(String(new Date().getFullYear() + 3));
  const [newDescription, setNewDescription] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [importedData, setImportedData] = useState<ImportedCareerData | null>(null);

  // Detail Modal State
  const [selectedKompass, setSelectedKompass] = useState<KompassItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTargetYear, setEditTargetYear] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: kompassList = [], isLoading: isLoadingKompass } = useQuery<KompassItem[]>({
    queryKey: ['/api/kompass'],
  });

  const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery<Profile[]>({
    queryKey: ['/api/profiles'],
  });

  const createKompassMutation = useMutation({
    mutationFn: async (data: { profileId: string; targetYear: number; visionData: VisionGoal }) => {
      const response = await apiRequest('POST', `/api/profiles/${data.profileId}/kompass`, {
        targetYear: data.targetYear,
        visionData: data.visionData,
        progress: 0,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/kompass'] });
      setIsCreateModalOpen(false);
      setNewTitle("");
      setNewDescription("");
      setSelectedProfileId("");
      setImportedData(null);
      toast({ 
        title: "Kompass 생성 완료", 
        description: importedData 
          ? "AI 분석 기반 목표가 생성되었습니다!" 
          : "새로운 목표 나침반이 생성되었습니다." 
      });
    },
    onError: (error: any) => {
      toast({
        title: "생성 실패",
        description: error.message || "Kompass 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const updateKompassMutation = useMutation({
    mutationFn: async (data: { id: string; visionData: VisionGoal; targetYear: number; progress: number }) => {
      const response = await apiRequest('PATCH', `/api/kompass/${data.id}`, {
        visionData: data.visionData,
        targetYear: data.targetYear,
        progress: data.progress,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/kompass'] });
      setIsDetailModalOpen(false);
      setSelectedKompass(null);
      toast({ title: "저장 완료", description: "변경 사항이 저장되었습니다." });
    },
    onError: (error: any) => {
      toast({
        title: "저장 실패",
        description: error.message || "저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const deleteKompassMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/kompass/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/kompass'] });
      setIsDetailModalOpen(false);
      setSelectedKompass(null);
      setIsDeleteDialogOpen(false);
      toast({ title: "삭제 완료", description: "Kompass가 삭제되었습니다." });
    },
    onError: (error: any) => {
      toast({
        title: "삭제 실패",
        description: error.message || "삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const imported = sessionStorage.getItem('kompass_import');
    if (imported) {
      try {
        const data: ImportedCareerData = JSON.parse(imported);
        setImportedData(data);
        setNewTitle(data.title);
        setNewTargetYear(String(new Date().getFullYear() + 3));
        
        const actionItems = [
          ...(data.actions?.portfolio || []).map(a => `📁 ${a}`),
          ...(data.actions?.networking || []).map(a => `🤝 ${a}`),
          ...(data.actions?.mindset || []).map(a => `💭 ${a}`),
        ];
        setNewDescription(actionItems.join('\n'));
        
        setIsCreateModalOpen(true);
        sessionStorage.removeItem('kompass_import');
        
        toast({ 
          title: "분석에서 가져왔어요!", 
          description: "목표와 액션 플랜을 확인하고 수정해보세요."
        });
      } catch (e) {
        console.error('Failed to parse imported data:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (profiles.length > 0 && !selectedProfileId) {
      setSelectedProfileId(profiles[0].id);
    }
  }, [profiles, selectedProfileId]);

  const handleNewKompass = () => {
    setImportedData(null);
    setNewTitle("");
    setNewDescription("");
    if (profiles.length > 0) {
      setSelectedProfileId(profiles[0].id);
    }
    setIsCreateModalOpen(true);
  };

  const handleSubmit = () => {
    if (!newTitle || !newTargetYear) {
      toast({ title: "필수 입력 항목", description: "목표 제목과 목표 연도를 입력해주세요.", variant: "destructive" });
      return;
    }

    if (!selectedProfileId) {
      toast({ title: "프로필 선택 필요", description: "Kompass를 연결할 프로필을 선택해주세요.", variant: "destructive" });
      return;
    }

    const targetYear = parseInt(newTargetYear);
    const visionData = generateTree(`temp-${Date.now()}`, newTitle, targetYear);
    visionData.description = newDescription;

    createKompassMutation.mutate({
      profileId: selectedProfileId,
      targetYear,
      visionData,
    });
  };

  const handleCardClick = (kompass: KompassItem) => {
    setSelectedKompass(kompass);
    setEditTitle(kompass.visionData.title);
    setEditDescription(kompass.visionData.description || "");
    setEditTargetYear(String(kompass.targetYear));
    setIsDetailModalOpen(true);
  };

  const handleSaveDetail = () => {
    if (!selectedKompass) return;
    
    if (!editTitle.trim()) {
      toast({ title: "제목을 입력해주세요", variant: "destructive" });
      return;
    }
    
    const updatedVisionData = {
      ...selectedKompass.visionData,
      title: editTitle,
      description: editDescription,
    };

    updateKompassMutation.mutate({
      id: selectedKompass.id,
      visionData: updatedVisionData,
      targetYear: parseInt(editTargetYear),
      progress: selectedKompass.progress,
    });
  };

  const handleDeleteKompass = () => {
    if (!selectedKompass) return;
    deleteKompassMutation.mutate(selectedKompass.id);
  };

  useEffect(() => {
    setAction({
      icon: Plus,
      label: "추가",
      onClick: handleNewKompass
    });
    return () => setAction(null);
  }, [profiles]);

  const isLoading = isLoadingKompass || isLoadingProfiles;

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto pb-20 px-4 md:px-0">
        <div className="text-center mb-8 pt-6">
            <h2 className="text-[28px] font-bold text-[#191F28]">Kompass</h2>
            <p className="text-[#8B95A1] mt-2 text-lg">나만의 커리어 나침반을 관리하세요</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#3182F6]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card 
                  className="toss-card hover:shadow-md transition-all border-2 border-dashed border-[#E5E8EB] bg-[#F9FAFB] cursor-pointer flex flex-col items-center justify-center min-h-[240px] group"
                  onClick={handleNewKompass}
                  data-testid="button-create-kompass"
              >
                  <div className="p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Plus className="w-6 h-6 text-[#B0B8C1] group-hover:text-[#3182F6]" />
                      </div>
                      <h3 className="text-lg font-bold text-[#8B95A1] group-hover:text-[#3182F6]">새 Kompass 만들기</h3>
                  </div>
              </Card>

              {kompassList.map((kompass) => {
                const vision = kompass.visionData;
                return (
                  <Card 
                      key={kompass.id} 
                      className="toss-card hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-[#3182F6] group relative overflow-hidden"
                      onClick={() => handleCardClick(kompass)}
                      data-testid={`card-kompass-${kompass.id}`}
                  >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Compass className="w-24 h-24 text-[#3182F6]" />
                      </div>
                      
                      <CardContent className="p-6 flex flex-col h-full justify-between relative z-10">
                          <div>
                              <div className="flex items-center justify-between mb-4">
                                  <div className="bg-[#E8F3FF] text-[#3182F6] px-3 py-1 rounded-full text-xs font-bold">
                                      Target {kompass.targetYear}
                                  </div>
                                  <ChevronRight className="w-5 h-5 text-[#B0B8C1] group-hover:text-[#3182F6] transition-colors" />
                              </div>
                              
                              <h3 className="text-xl font-bold text-[#191F28] mb-2 line-clamp-2 h-14">
                                  {vision.title}
                              </h3>
                              {kompass.profileTitle && (
                                <Badge variant="outline" className="text-xs mb-2">
                                  {kompass.profileTitle}
                                </Badge>
                              )}
                          </div>

                          <div>
                              <div className="flex justify-between items-end mb-2">
                                  <span className="text-sm text-[#8B95A1]">전체 달성률</span>
                                  <span className="text-lg font-bold text-[#3182F6]">{kompass.progress}%</span>
                              </div>
                              <Progress value={kompass.progress} className="h-2" indicatorClassName="bg-[#3182F6]" />
                          </div>
                      </CardContent>
                  </Card>
                );
              })}
          </div>
        )}

        {/* Create Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
            setIsCreateModalOpen(open);
            if (!open) setImportedData(null);
        }}>
            <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <DialogTitle className="text-xl font-bold text-[#191F28]">
                            {importedData ? '목표로 저장하기' : '새 Kompass 만들기'}
                        </DialogTitle>
                        {importedData && (
                            <Badge className="bg-gradient-to-r from-[#3182F6] to-[#1565C0] text-white border-none">
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI 분석
                            </Badge>
                        )}
                    </div>
                    {importedData && (
                        <DialogDescription className="text-sm text-[#8B95A1]">
                            커리어 분석에서 추천받은 목표를 Kompass로 저장하세요
                        </DialogDescription>
                    )}
                </DialogHeader>
                
                <div className="space-y-5 py-4">
                    {importedData && (
                        <div className="bg-gradient-to-br from-[#F8FAFC] to-white rounded-xl p-4 border border-[#E5E8EB] space-y-3">
                            <h4 className="text-sm font-bold text-[#191F28]">AI가 추천한 액션 플랜</h4>
                            
                            {importedData.actions.portfolio?.length > 0 && (
                                <div className="flex items-start gap-2">
                                    <FolderOpen className="h-4 w-4 text-[#3182F6] mt-0.5 shrink-0" />
                                    <div className="text-xs text-[#4E5968]">
                                        {importedData.actions.portfolio.slice(0, 2).join(' / ')}
                                    </div>
                                </div>
                            )}
                            
                            {importedData.actions.networking?.length > 0 && (
                                <div className="flex items-start gap-2">
                                    <Users className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                                    <div className="text-xs text-[#4E5968]">
                                        {importedData.actions.networking.slice(0, 2).join(' / ')}
                                    </div>
                                </div>
                            )}
                            
                            {importedData.actions.mindset?.length > 0 && (
                                <div className="flex items-start gap-2">
                                    <Heart className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                                    <div className="text-xs text-[#4E5968]">
                                        {importedData.actions.mindset.slice(0, 2).join(' / ')}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="profile" className="text-sm font-bold text-[#333D4B]">연결할 프로필</Label>
                        <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                          <SelectTrigger className="h-12 rounded-xl border-[#E5E8EB]" data-testid="select-profile">
                            <SelectValue placeholder="프로필을 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            {profiles.map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {profile.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-bold text-[#333D4B]">목표 제목 (Kompass)</Label>
                        <Input 
                            id="title" 
                            placeholder="예: 유니콘 기업 CPO 되기" 
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="h-12 rounded-xl border-[#E5E8EB] focus-visible:ring-[#3182F6]"
                            data-testid="input-kompass-title"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="year" className="text-sm font-bold text-[#333D4B]">목표 연도</Label>
                        <Input 
                            id="year" 
                            type="number"
                            placeholder="예: 2028" 
                            value={newTargetYear}
                            onChange={(e) => setNewTargetYear(e.target.value)}
                            className="h-12 rounded-xl border-[#E5E8EB] focus-visible:ring-[#3182F6]"
                            data-testid="input-target-year"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="desc" className="text-sm font-bold text-[#333D4B]">
                            {importedData ? '액션 플랜 (수정 가능)' : '설명 (선택)'}
                        </Label>
                        <Textarea 
                            id="desc" 
                            placeholder="이 목표를 달성하고 싶은 이유나 구체적인 모습을 적어보세요." 
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            className="min-h-[120px] rounded-xl border-[#E5E8EB] focus-visible:ring-[#3182F6] resize-none text-sm"
                            data-testid="input-description"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button 
                        onClick={handleSubmit}
                        disabled={createKompassMutation.isPending || !selectedProfileId}
                        className={cn(
                            "w-full h-12 text-white font-bold rounded-xl text-lg",
                            importedData 
                                ? "bg-gradient-to-r from-[#3182F6] to-[#1565C0] hover:opacity-90"
                                : "bg-[#3182F6] hover:bg-[#2b72d7]"
                        )}
                        data-testid="button-submit-kompass"
                    >
                        {createKompassMutation.isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : importedData ? (
                            <><Compass className="h-5 w-5 mr-2" /> 목표로 저장하기</>
                        ) : (
                            'Kompass 생성하기'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={(open) => {
            if (!open) {
              setIsDetailModalOpen(false);
              setSelectedKompass(null);
            }
        }}>
            <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-bold text-[#191F28] flex items-center gap-2">
                            <Compass className="h-5 w-5 text-[#3182F6]" />
                            Kompass 상세
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  if (selectedKompass) {
                                    setIsDetailModalOpen(false);
                                    setLocation(`/goals/${selectedKompass.id}`);
                                  }
                                }}
                                className="text-[#3182F6] hover:text-[#2b72d7] hover:bg-[#E8F3FF]"
                                data-testid="button-open-detail-page"
                            >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                상세 페이지
                            </Button>
                        </div>
                    </div>
                </DialogHeader>
                
                {selectedKompass && (
                  <div className="space-y-5 py-4">
                      {/* Progress Overview */}
                      <div className="bg-gradient-to-br from-[#F8FAFC] to-white rounded-xl p-4 border border-[#E5E8EB]">
                          <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-medium text-[#4E5968]">전체 달성률</span>
                              <span className="text-2xl font-bold text-[#3182F6]">{selectedKompass.progress}%</span>
                          </div>
                          <Progress value={selectedKompass.progress} className="h-3" indicatorClassName="bg-gradient-to-r from-[#3182F6] to-[#1565C0]" />
                      </div>

                      {/* Profile Badge */}
                      {selectedKompass.profileTitle && (
                          <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-sm">
                                  {selectedKompass.profileTitle}
                              </Badge>
                          </div>
                      )}
                      
                      <div className="space-y-2">
                          <Label htmlFor="edit-title" className="text-sm font-bold text-[#333D4B]">목표 제목</Label>
                          <Input 
                              id="edit-title" 
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="h-12 rounded-xl border-[#E5E8EB] focus-visible:ring-[#3182F6]"
                              data-testid="input-edit-title"
                          />
                      </div>

                      <div className="space-y-2">
                          <Label htmlFor="edit-year" className="text-sm font-bold text-[#333D4B] flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              목표 연도
                          </Label>
                          <Input 
                              id="edit-year" 
                              type="number"
                              value={editTargetYear}
                              onChange={(e) => setEditTargetYear(e.target.value)}
                              className="h-12 rounded-xl border-[#E5E8EB] focus-visible:ring-[#3182F6]"
                              data-testid="input-edit-year"
                          />
                      </div>

                      <div className="space-y-2">
                          <Label htmlFor="edit-desc" className="text-sm font-bold text-[#333D4B]">설명</Label>
                          <Textarea 
                              id="edit-desc" 
                              placeholder="목표에 대한 설명을 입력하세요."
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="min-h-[120px] rounded-xl border-[#E5E8EB] focus-visible:ring-[#3182F6] resize-none text-sm"
                              data-testid="input-edit-description"
                          />
                      </div>
                  </div>
                )}

                <DialogFooter className="flex flex-col gap-3 sm:flex-row">
                    <Button 
                        variant="outline"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                        data-testid="button-delete-kompass"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                    </Button>
                    <Button 
                        onClick={handleSaveDetail}
                        disabled={updateKompassMutation.isPending}
                        className="flex-1 bg-[#3182F6] hover:bg-[#2b72d7] text-white font-bold rounded-xl"
                        data-testid="button-save-kompass"
                    >
                        {updateKompassMutation.isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <Pencil className="h-4 w-4 mr-2" />
                                저장하기
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Kompass를 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                이 작업은 되돌릴 수 없습니다. 모든 목표와 진행 상황이 영구적으로 삭제됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteKompass}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                disabled={deleteKompassMutation.isPending}
              >
                {deleteKompassMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "삭제"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </Layout>
  );
}
