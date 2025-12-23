import { Search, Menu } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { RedeemDialog } from "@/components/token/RedeemDialog";
import { NotificationBell } from "@/components/NotificationBell";
import { useTokens } from "@/lib/TokenContext";
import { useAuth } from "@/lib/AuthContext";
import { Sidebar } from "./Sidebar";
import { Link, useLocation } from "wouter";

export function Header() {
  const { credits, giftPoints } = useTokens();
  const { logout, user } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const initials = user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-[72px] items-center gap-2 sm:gap-4 bg-[#F2F4F6] px-3 sm:px-4 md:px-10">
      
      {/* Mobile Menu Trigger */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9 sm:h-10 sm:w-10">
              <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-[#191F28]" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-[#F2F4F6] border-none w-[280px]">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Mobile Logo */}
      <div className="md:hidden flex-1">
        <Link href="/" data-testid="link-logo-home">
          <img src="/konnect-logo.png" alt="Konnect" className="h-6 w-auto cursor-pointer" />
        </Link>
      </div>

      {/* Desktop Search - Hidden for now */}
      <div className="hidden flex-1">
        <form>
          <div className="relative max-w-[480px]">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-[#B0B8C1]" />
            <Input
              type="search"
              placeholder="분석 결과, 목표, 트렌드 검색..."
              className="w-full h-12 bg-white border-none pl-12 rounded-xl shadow-sm text-base placeholder:text-[#B0B8C1] focus-visible:ring-[#3182F6]"
            />
          </div>
        </form>
      </div>
      {/* Spacer for flex layout */}
      <div className="hidden md:block flex-1" />

      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
        <div className="hidden md:flex items-center mr-2 bg-white px-4 py-2 rounded-full shadow-sm" data-testid="header-points-display">
          <span className="text-sm font-bold text-[#10B981]" title="기프트 포인트 (무료)">{giftPoints.toLocaleString()}GP</span>
          <span className="mx-2 text-gray-300">|</span>
          <span className="text-sm font-bold text-[#191F28]" title="유료 포인트">{credits.toLocaleString()}P</span>
        </div>
        {/* Mobile Token Display Compact */}
        <div className="md:hidden flex items-center bg-white px-2.5 py-1.5 rounded-full shadow-sm" data-testid="header-points-display-mobile">
          <span className="text-xs font-bold text-[#10B981]">{giftPoints.toLocaleString()}GP</span>
          <span className="mx-1.5 text-gray-300">|</span>
          <span className="text-xs font-bold text-[#191F28]">{credits.toLocaleString()}P</span>
        </div>

        <div className="hidden md:block">
            <RedeemDialog />
        </div>

        <NotificationBell />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 ml-1 p-0 overflow-hidden border-2 border-white shadow-sm">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#3182F6]/10 text-[#3182F6] font-bold text-sm">
                  {initials}
                </div>
              )}
              <span className="sr-only">메뉴 열기</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 border-none shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <DropdownMenuLabel className="px-3 py-2 text-sm font-bold text-[#191F28]">내 계정</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#F2F4F6]" />
            
            {/* Mobile Only Items */}
            <div className="md:hidden">
                <RedeemDialog>
                  <button className="w-full text-left rounded-lg px-3 py-2.5 font-medium cursor-pointer text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#191F28] text-sm">
                      포인트 충전
                  </button>
                </RedeemDialog>
                 <DropdownMenuSeparator className="bg-[#F2F4F6]" />
            </div>

            <DropdownMenuItem asChild className="rounded-lg px-3 py-2.5 text-[#4E5968] focus:bg-[#F2F4F6] focus:text-[#191F28] font-medium cursor-pointer">
              <Link href="/profile">
                프로필 설정
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-lg px-3 py-2.5 text-[#4E5968] focus:bg-[#F2F4F6] focus:text-[#191F28] font-medium cursor-pointer">
              <Link href="/settings">
                환경설정
              </Link>
            </DropdownMenuItem>
            <RedeemDialog>
              <button className="w-full text-left rounded-lg px-3 py-2.5 text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#191F28] font-medium cursor-pointer text-sm">
                포인트 충전
              </button>
            </RedeemDialog>
            <DropdownMenuSeparator className="bg-[#F2F4F6]" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="rounded-lg px-3 py-2.5 text-[#E44E48] focus:bg-red-50 focus:text-[#E44E48] font-medium cursor-pointer"
            >
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
