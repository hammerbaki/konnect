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
import { useState } from "react";
import { useTokens } from "@/lib/TokenContext";
import { useToast } from "@/hooks/use-toast";

export function RedeemDialog() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { addCredits } = useTokens();
  const { toast } = useToast();

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock API call
    setTimeout(() => {
      setIsLoading(false);
      if (code.trim().toUpperCase() === "DEMO" || code.length > 5) {
        addCredits(5);
        setOpen(false);
        setCode("");
        toast({
          title: "토큰 충전 완료",
          description: "5 토큰이 성공적으로 충전되었습니다.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "유효하지 않은 코드",
          description: "입력하신 코드가 만료되었거나 잘못되었습니다.",
        });
      }
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-[#FFB300] hover:bg-[#FFCA28] text-white border-none shadow-sm gap-2 rounded-[12px] font-bold">
          <Ticket className="h-4 w-4" />
          토큰 충전
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[24px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border-none">
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
                className="uppercase tracking-widest font-mono h-12 rounded-[16px] bg-[#F2F4F6] border-none text-center text-lg font-bold focus-visible:ring-[#FFB300]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isLoading || !code}
              className="w-full h-12 rounded-[16px] bg-[#191F28] hover:bg-[#333D4B] text-white font-bold text-base"
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
