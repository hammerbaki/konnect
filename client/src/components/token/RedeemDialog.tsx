import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ticket, Loader2 } from "lucide-react";
import { useState, ReactNode } from "react";
import { useTokens } from "@/lib/TokenContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface RedeemDialogProps {
  children?: ReactNode;
}

export function RedeemDialog({ children }: RedeemDialogProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { refreshCredits } = useTokens();
  const { toast } = useToast();

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/redeem', { code });
      const data = await response.json();
      
      // Refresh credits from database
      await refreshCredits();
      
      setOpen(false);
      setCode("");
      toast({
        title: "토큰 충전 완료",
        description: data.message || `${data.creditsAdded} 크레딧이 충전되었습니다.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "충전 실패",
        description: error?.message || "코드 등록 중 오류가 발생했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" className="bg-[#FFB300] hover:bg-[#FFCA28] text-white border-none shadow-sm gap-2 rounded-lg font-bold">
            <Ticket className="h-4 w-4" />
            토큰 충전
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border-none">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#191F28]">액세스 토큰 등록</DialogTitle>
          <DialogDescription className="text-[#8B95A1] mt-2">
            관리자로부터 발급받은 코드를 입력하여<br/>분석 크레딧을 충전하세요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleRedeem}>
          <div className="grid gap-5 py-6">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-[#4E5968] font-semibold">토큰 코드</Label>
              <Input
                id="code"
                placeholder="예: KNC-8829-XJ"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="uppercase tracking-widest font-mono h-12 rounded-xl bg-[#F2F4F6] border-none text-center text-lg font-bold focus-visible:ring-[#FFB300]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isLoading || !code}
              className="w-full h-12 rounded-xl bg-[#191F28] hover:bg-[#333D4B] text-white font-bold text-base"
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              코드 등록하기
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
