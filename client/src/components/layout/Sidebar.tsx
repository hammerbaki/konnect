import { Link, useLocation } from "wouter";
import { LayoutDashboard, PieChart, Target, LogOut, User, FileText, Layers, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "홈" },
    { href: "/profile", icon: User, label: "내 프로필" },
    { href: "/analysis", icon: PieChart, label: "커리어 분석" },
    { href: "/goals", icon: Target, label: "목표 관리" },
    { href: "/personal-statement", icon: FileText, label: "자기소개서" },
    { href: "/explorer", icon: Search, label: "직업 탐색" },
  ];

  return (
    <div className="h-full flex flex-col bg-white border-r border-[#E5E8EB]">
      <div className="flex h-16 items-center px-6 mb-6">
        <img src="/logo.png" alt="Konnect Logo" className="h-8 w-auto" />
      </div>

      <div className="flex-1 px-4">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "flex items-center gap-4 rounded-xl px-5 py-4 text-base font-semibold transition-all duration-200",
                    isActive
                      ? "bg-white text-[#3182F6] shadow-sm scale-[1.02]"
                      : "text-[#8B95A1] hover:bg-white/50 hover:text-[#4E5968]"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "text-[#3182F6]" : "text-[#B0B8C1]")} />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <Link href="/">
          <a className="flex w-full items-center gap-3 rounded-xl px-5 py-3 text-sm font-medium text-[#8B95A1] hover:bg-red-50 hover:text-[#E44E48] transition-colors">
            <LogOut className="h-4 w-4" />
            로그아웃
          </a>
        </Link>
      </div>
    </div>
  );
}
