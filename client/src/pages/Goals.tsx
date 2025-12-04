import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, Flag, Compass, X } from "lucide-react";
import { MOCK_VISIONS, generateTree } from "@/lib/mockData";
import { useLocation } from "wouter";
import { useMobileAction } from "@/lib/MobileActionContext";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Goals() {
  const [_, setLocation] = useLocation();
  const { setAction } = useMobileAction();
  const { toast } = useToast();
  
  // Creation Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTargetYear, setNewTargetYear] = useState(String(new Date().getFullYear() + 3));
  const [newDescription, setNewDescription] = useState("");

  const handleNewKompass = () => {
    setIsCreateModalOpen(true);
  };

  const handleSubmit = () => {
      if (!newTitle || !newTargetYear) {
          toast({ title: "필수 입력 항목", description: "목표 제목과 목표 연도를 입력해주세요.", variant: "destructive" });
          return;
      }

      const newId = String(MOCK_VISIONS.length + 1);
      const newKompass = generateTree(newId, newTitle, parseInt(newTargetYear));
      newKompass.description = newDescription;
      
      // In a real app, this would be a server call. 
      // For mockup, we push to the exported array (which persists in memory until refresh)
      MOCK_VISIONS.unshift(newKompass);
      
      setIsCreateModalOpen(false);
      setNewTitle("");
      setNewDescription("");
      toast({ title: "Kompass 생성 완료", description: "새로운 목표 나침반이 생성되었습니다." });
  };

  useEffect(() => {
    setAction({
      icon: Plus,
      label: "추가",
      onClick: handleNewKompass
    });
    return () => setAction(null);
  }, []);

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto pb-20 px-4 md:px-0">
        <div className="text-center mb-8 pt-6">
            <h2 className="text-[28px] font-bold text-[#191F28]">Kompass</h2>
            <p className="text-[#8B95A1] mt-2 text-lg">나만의 커리어 나침반을 관리하세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Card */}
            <Card 
                className="toss-card hover:shadow-md transition-all border-2 border-dashed border-[#E5E8EB] bg-[#F9FAFB] cursor-pointer flex flex-col items-center justify-center min-h-[240px] group"
                onClick={handleNewKompass}
            >
                <div className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6 text-[#B0B8C1] group-hover:text-[#3182F6]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#8B95A1] group-hover:text-[#3182F6]">새 Kompass 만들기</h3>
                </div>
            </Card>

            {/* Existing Kompass Cards */}
            {MOCK_VISIONS.map((vision) => (
                <Card 
                    key={vision.id} 
                    className="toss-card hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-[#3182F6] group relative overflow-hidden"
                    onClick={() => setLocation(`/goals/${vision.id}`)}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Compass className="w-24 h-24 text-[#3182F6]" />
                    </div>
                    
                    <CardContent className="p-6 flex flex-col h-full justify-between relative z-10">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-[#E8F3FF] text-[#3182F6] px-3 py-1 rounded-full text-xs font-bold">
                                    Target {vision.targetYear}
                                </div>
                                <ChevronRight className="w-5 h-5 text-[#B0B8C1] group-hover:text-[#3182F6] transition-colors" />
                            </div>
                            
                            <h3 className="text-xl font-bold text-[#191F28] mb-2 line-clamp-2 h-14">
                                {vision.title}
                            </h3>
                            <p className="text-[#4E5968] text-sm mb-6 line-clamp-2 h-10">
                                {vision.description}
                            </p>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm text-[#8B95A1]">전체 달성률</span>
                                <span className="text-lg font-bold text-[#3182F6]">{vision.progress}%</span>
                            </div>
                            <Progress value={vision.progress} className="h-2" indicatorClassName="bg-[#3182F6]" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>

        {/* Create Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#191F28]">새 Kompass 만들기</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-bold text-[#333D4B]">목표 제목 (Kompass)</Label>
                        <Input 
                            id="title" 
                            placeholder="예: 유니콘 기업 CPO 되기" 
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="h-12 rounded-xl border-[#E5E8EB] focus-visible:ring-[#3182F6]"
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
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="desc" className="text-sm font-bold text-[#333D4B]">설명 (선택)</Label>
                        <Textarea 
                            id="desc" 
                            placeholder="이 목표를 달성하고 싶은 이유나 구체적인 모습을 적어보세요." 
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            className="min-h-[100px] rounded-xl border-[#E5E8EB] focus-visible:ring-[#3182F6] resize-none"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button 
                        onClick={handleSubmit} 
                        className="w-full h-12 bg-[#3182F6] hover:bg-[#2b72d7] text-white font-bold rounded-xl text-lg"
                    >
                        Kompass 생성하기
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
}