import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  LayoutDashboard,
  PieChart,
  Target,
  LogOut,
  User,
  FileText,
  Search,
  Settings,
  Coins,
  Shield,
  ChevronDown,
  ChevronRight,
  Briefcase,
  GraduationCap,
  School,
  BookOpen,
  Backpack,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { usePageAccess } from "@/lib/usePageAccess";

const profileSubItems = [
  { id: "general", label: "구직자", icon: Briefcase },
  { id: "university", label: "대학생", icon: GraduationCap },
  { id: "high", label: "고등학생", icon: School },
  { id: "middle", label: "중학생", icon: BookOpen },
  { id: "elementary", label: "초등학생", icon: Backpack },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { logout } = useAuth();
  const { canAccess, userRole } = usePageAccess();
  const [profileExpanded, setProfileExpanded] = useState(location.startsWith("/profile"));

  const isAdminOrStaff = userRole === "admin" || userRole === "staff";

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const allNavItems = [
    { href: "/dashboard", slug: "/dashboard", icon: LayoutDashboard, label: "대시보드" },
    { href: "/profile", slug: "/profile", icon: User, label: "내 프로필", hasSubmenu: true },
    { href: "/analysis", slug: "/analysis", icon: PieChart, label: "커리어 분석" },
    { href: "/goals", slug: "/goals", icon: Target, label: "목표 관리" },
    { href: "/personal-statement", slug: "/essays", icon: FileText, label: "자기소개서" },
    { href: "/explorer", slug: "/explorer", icon: Search, label: "직업 탐색" },
  ];

  const allBottomItems = [
    { href: "/recharge", slug: "/recharge", icon: Coins, label: "포인트 충전" },
    { href: "/settings", slug: "/settings", icon: Settings, label: "설정" },
    { href: "/admin", slug: "/admin", icon: Shield, label: "관리자", adminOnly: true },
  ];

  const navItems = allNavItems.filter(item => canAccess(item.slug));
  const bottomItems = allBottomItems.filter(item => {
    if (item.adminOnly && !isAdminOrStaff) return false;
    return canAccess(item.slug);
  });

  const isProfileActive = location.startsWith("/profile");

  return (
    <div className="h-full flex flex-col bg-white border-r border-[#E5E8EB]">
      <div className="flex h-16 items-center px-6 mb-6">
        <Link href="/" data-testid="link-sidebar-logo-home">
          <img
            src="/konnect-logo.png"
            alt="Konnect Logo"
            className="h-8 w-auto cursor-pointer"
          />
        </Link>
      </div>

      <div className="flex-1 px-4 flex flex-col overflow-y-auto">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            if (item.hasSubmenu && item.href === "/profile") {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => setProfileExpanded(!profileExpanded)}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-xl px-5 py-4 text-base font-semibold transition-all duration-200",
                      isProfileActive
                        ? "bg-white text-[#3182F6] shadow-sm"
                        : "text-[#8B95A1] hover:bg-white/50 hover:text-[#4E5968]",
                    )}
                    data-testid="button-profile-menu-toggle"
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isProfileActive ? "text-[#3182F6]" : "text-[#B0B8C1]",
                      )}
                    />
                    {item.label}
                    <span className="ml-auto">
                      {profileExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                  
                  {profileExpanded && (
                    <div className="ml-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                      {profileSubItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const subHref = `/profile?type=${subItem.id}`;
                        const isSubActive = location === "/profile" && 
                          new URLSearchParams(window.location.search).get("type") === subItem.id;
                        
                        return (
                          <Link
                            key={subItem.id}
                            href={subHref}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
                              isSubActive
                                ? "bg-blue-50 text-[#3182F6]"
                                : "text-[#8B95A1] hover:bg-gray-50 hover:text-[#4E5968]",
                            )}
                            data-testid={`link-profile-type-${subItem.id}`}
                          >
                            <SubIcon className={cn(
                              "h-4 w-4",
                              isSubActive ? "text-[#3182F6]" : "text-[#B0B8C1]"
                            )} />
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 rounded-xl px-5 py-4 text-base font-semibold transition-all duration-200",
                  isActive
                    ? "bg-white text-[#3182F6] shadow-sm scale-[1.02]"
                    : "text-[#8B95A1] hover:bg-white/50 hover:text-[#4E5968]",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-[#3182F6]" : "text-[#B0B8C1]",
                  )}
                />
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
                    : "text-[#8B95A1] hover:bg-gray-50 hover:text-[#4E5968]",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "text-[#3182F6]" : "text-[#B0B8C1]",
                  )}
                />
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
