import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, Flag, Compass } from "lucide-react";
import { MOCK_VISIONS } from "@/lib/mockData";
import { useLocation } from "wouter";
import { useMobileAction } from "@/lib/MobileActionContext";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Goals() {
  const [_, setLocation] = useLocation();
  const { setAction } = useMobileAction();
  const { toast } = useToast();

  const handleNewKompass = () => {
    toast({
      title: "새 Kompass 만들기",
      description: "준비 중인 기능입니다.",
    });
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
      </div>
    </Layout>
  );
}