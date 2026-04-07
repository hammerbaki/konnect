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
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
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
    <header className="sticky top-0 z-30 flex h-14 sm:h-[60px] items-center gap-2 sm:gap-4 bg-background/95 backdrop-blur-sm border-b border-border px-3 sm:px-4 md:px-8">
      
      {/* Mobile Menu Trigger */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9 sm:h-10 sm:w-10 hover:bg-secondary">
              <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-sidebar border-none w-[260px]" aria-describedby={undefined}>
            <VisuallyHidden.Root>
              <SheetTitle>메뉴</SheetTitle>
            </VisuallyHidden.Root>
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
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="분석 결과, 목표, 트렌드 검색..."
              className="w-full h-12 bg-card border-none pl-12 rounded-xl shadow-sm text-base placeholder:text-muted-foreground"
            />
          </div>
        </form>
      </div>
      <div className="hidden md:block flex-1" />

      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
        {/* Desktop Points Display */}
        <div className="hidden md:flex items-center mr-2 bg-card px-4 py-1.5 rounded-full border border-border shadow-sm" data-testid="header-points-display">
          <span className="text-xs font-bold text-emerald-600" title="선물 학습권 (무료)">{giftPoints.toLocaleString()}번</span>
          <span className="mx-2 text-border">|</span>
          <span className="text-xs font-bold text-dream" title="유료 학습권">{credits.toLocaleString()}번</span>
        </div>
        {/* Mobile Token Display Compact */}
        <div className="md:hidden flex items-center bg-card px-2.5 py-1.5 rounded-full border border-border shadow-sm" data-testid="header-points-display-mobile">
          <span className="text-xs font-bold text-emerald-600">{giftPoints.toLocaleString()}번</span>
          <span className="mx-1.5 text-border">|</span>
          <span className="text-xs font-bold text-dream">{credits.toLocaleString()}번</span>
        </div>

        <div className="hidden md:block">
            <RedeemDialog />
        </div>

        <NotificationBell />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 ml-1 p-0 overflow-hidden border-2 border-border shadow-sm">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-dream/10 text-dream font-bold text-sm">
                  {initials}
                </div>
              )}
              <span className="sr-only">메뉴 열기</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 border border-border shadow-[0_8px_30px_rgba(50,14,157,0.1)]">
            <DropdownMenuLabel className="px-3 py-2 text-sm font-bold text-foreground">내 계정</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            
            {/* Mobile Only Items */}
            <div className="md:hidden">
                <RedeemDialog>
                  <button className="w-full text-left rounded-lg px-3 py-2.5 font-medium cursor-pointer text-muted-foreground hover:bg-secondary hover:text-foreground text-sm">
                      학습권 충전
                  </button>
                </RedeemDialog>
                 <DropdownMenuSeparator className="bg-border" />
            </div>

            <DropdownMenuItem asChild className="rounded-lg px-3 py-2.5 text-muted-foreground focus:bg-secondary focus:text-foreground font-medium cursor-pointer">
              <Link href="/profile">
                프로필 설정
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-lg px-3 py-2.5 text-muted-foreground focus:bg-secondary focus:text-foreground font-medium cursor-pointer">
              <Link href="/settings">
                환경설정
              </Link>
            </DropdownMenuItem>
            <RedeemDialog>
              <button className="w-full text-left rounded-lg px-3 py-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground font-medium cursor-pointer text-sm">
                학습권 충전
              </button>
            </RedeemDialog>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="rounded-lg px-3 py-2.5 text-destructive focus:bg-red-50 focus:text-destructive font-medium cursor-pointer"
            >
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
