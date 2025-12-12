import { Link, useLocation } from "wouter";
import { LayoutDashboard, PieChart, Target, LogOut, User, FileText, Search, Settings, Coins, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface UserData {
  id: string;
  role?: string;
}

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { logout } = useAuth();

  const { data: user } = useQuery<UserData>({
    queryKey: ['/api/auth/user'],
  });

  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "대시보드" },
    { href: "/profile", icon: User, label: "내 프로필" },
    { href: "/analysis", icon: PieChart, label: "커리어 분석" },
    { href: "/goals", icon: Target, label: "목표 관리" },
    { href: "/personal-statement", icon: FileText, label: "자기소개서" },
    { href: "/explorer", icon: Search, label: "직업 탐색" },
  ];

  const bottomItems = [
      { href: "/recharge", icon: Coins, label: "포인트 충전" },
      { href: "/settings", icon: Settings, label: "설정" },
      ...(isAdminOrStaff ? [{ href: "/admin", icon: Shield, label: "관리자" }] : []),
  ];

  return (
    <div className="h-full flex flex-col bg-white border-r border-[#E5E8EB]">
      <div className="flex h-16 items-center px-6 mb-6">
        <img src="/konnect-logo.png" alt="Konnect Logo" className="h-8 w-auto" />
      </div>

      <div className="flex-1 px-4 flex flex-col">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 rounded-xl px-5 py-4 text-base font-semibold transition-all duration-200",
                  isActive
                    ? "bg-white text-[#3182F6] shadow-sm scale-[1.02]"
                    : "text-[#8B95A1] hover:bg-white/50 hover:text-[#4E5968]"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-[#3182F6]" : "text-[#B0B8C1]")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-auto pt-4 border-t border-[#F2F4F6] space-y-2 mb-2">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-50 text-[#3182F6]"
                    : "text-[#8B95A1] hover:bg-gray-50 hover:text-[#4E5968]"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-[#3182F6]" : "text-[#B0B8C1]")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-4 pt-0">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-5 py-3 text-sm font-medium text-[#8B95A1] hover:bg-red-50 hover:text-[#E44E48] transition-colors"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      </div>
    </div>
  );
}
