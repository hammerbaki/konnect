import { Bell, Search, User, Coins } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RedeemDialog } from "@/components/token/RedeemDialog";
import { useTokens } from "@/lib/TokenContext";

export function Header() {
  const { credits } = useTokens();

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-4 bg-[#F2F4F6] px-6 md:px-10">
      <div className="w-full flex-1">
        <form>
          <div className="relative max-w-[480px]">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-[#B0B8C1]" />
            <Input
              type="search"
              placeholder="분석 결과, 목표, 트렌드 검색..."
              className="w-full h-12 bg-white border-none pl-12 rounded-[20px] shadow-sm text-base placeholder:text-[#B0B8C1] focus-visible:ring-[#3182F6]"
            />
          </div>
        </form>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 mr-2 bg-white px-4 py-2 rounded-full shadow-sm">
          <Coins className="h-5 w-5 text-[#FFB300]" />
          <span className="text-sm font-bold text-[#191F28]">{credits} 토큰</span>
        </div>
        <RedeemDialog />
        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-white text-[#8B95A1] hover:text-[#3182F6] shadow-sm hover:bg-white ml-2">
          <Bell className="h-5 w-5" />
          <span className="sr-only">알림</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 ml-1 p-0 overflow-hidden border-2 border-white shadow-sm">
              <div className="flex h-full w-full items-center justify-center bg-[#3182F6]/10 text-[#3182F6] font-bold text-sm">
                JD
              </div>
              <span className="sr-only">메뉴 열기</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-[20px] p-2 border-none shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <DropdownMenuLabel className="px-3 py-2 text-sm font-bold text-[#191F28]">내 계정</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#F2F4F6]" />
            <DropdownMenuItem className="rounded-[12px] px-3 py-2.5 text-[#4E5968] focus:bg-[#F2F4F6] focus:text-[#191F28] font-medium cursor-pointer">
              프로필 설정
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-[12px] px-3 py-2.5 text-[#4E5968] focus:bg-[#F2F4F6] focus:text-[#191F28] font-medium cursor-pointer">
              환경설정
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#F2F4F6]" />
            <DropdownMenuItem className="rounded-[12px] px-3 py-2.5 text-[#E44E48] focus:bg-red-50 focus:text-[#E44E48] font-medium cursor-pointer">
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
