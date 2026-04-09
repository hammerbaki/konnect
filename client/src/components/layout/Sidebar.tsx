import { Link, useLocation, useSearch } from "wouter";
import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Globe,
  Brain,
  Mic,
  Users,
  Star,
  LayoutGrid,
  PenLine,
  Sunrise,
  TrendingUp,
  Route,
  Monitor,
  BookMarked,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { usePageAccess } from "@/lib/usePageAccess";
import { getAuthHeaders } from "@/lib/queryClient";

interface ManagedGroup {
  id: string;
  name: string;
  role: string;
}

const profileSubItems = [
  { id: "general", label: "구직자", icon: Briefcase },
  { id: "international_university", label: "외국인유학생", icon: Globe },
  { id: "university", label: "대학생", icon: GraduationCap },
  { id: "high", label: "고등학생", icon: School },
  { id: "middle", label: "중학생", icon: BookOpen },
  { id: "elementary", label: "초등학생", icon: Backpack },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const { logout, isAuthenticated } = useAuth();
  const { canAccess, userRole } = usePageAccess();
  const [profileExpanded, setProfileExpanded] = useState(location.startsWith("/profile"));
  const [groupsExpanded, setGroupsExpanded] = useState(location.startsWith("/group"));

  const isAdminOrStaff = userRole === "admin" || userRole === "staff";

  const { data: managedGroups = [] } = useQuery<ManagedGroup[]>({
    queryKey: ["managed-groups"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/my-managed-groups", {
        headers,
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const prefetchPageData = useCallback(async (href: string) => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) return;

    const prefetchMap: Record<string, string[]> = {
      "/dashboard": ["/api/profiles", "/api/notifications"],
      "/profile": ["/api/profiles", "/api/user-profile"],
      "/mytest": ["/api/kjobs/latest", "/api/profiles"],
      "/analysis": ["/api/profiles", "/api/kjobs/latest"],
      "/goals": ["/api/profiles"],
      "/personal-statement": ["/api/profiles"],
      "/interview": ["/api/profiles"],
      "/explorer": [],
      "/explore": ["/api/explore/categories"],
      "/aptitude": ["/api/aptitude/questions", "/api/aptitude/latest"],
      "/recharge": ["/api/point-packages", "/api/credit-history"],
      "/settings": ["/api/user-settings"],
      "/admin": ["/api/admin/users", "/api/admin/groups"],
    };

    const endpoints = prefetchMap[href] || [];
    
    endpoints.forEach(endpoint => {
      queryClient.prefetchQuery({
        queryKey: [endpoint],
        queryFn: async () => {
          const res = await fetch(endpoint, {
            headers,
            credentials: "include",
          });
          if (!res.ok) throw new Error("Prefetch failed");
          return res.json();
        },
        staleTime: 60 * 1000,
      });
    });
  }, [queryClient]);

  // Production — 출시 서비스 (최상단 고정)
  const productionNavItems = [
    { href: "/aptitude", slug: "/aptitude", icon: Brain, label: "진로 흥미 분석" },
    { href: "/dream", slug: "/dream", icon: Star, label: "꿈 선언" },
    { href: "/explore", slug: "/explore", icon: BookOpen, label: "학과/직업 탐색" },
  ];

  const coreNavItems = [
    { href: "/dashboard", slug: "/dashboard", icon: LayoutDashboard, label: "대시보드" },
    { href: "/profile", slug: "/profile", icon: User, label: "내 프로필", hasSubmenu: true },
  ];

  const aiNavItems = [
    { href: "/mytest", slug: "/mytest", icon: GraduationCap, label: "진로진단" },
    { href: "/analysis", slug: "/analysis", icon: PieChart, label: "커리어 분석" },
    { href: "/goals", slug: "/goals", icon: Target, label: "목표 관리" },
    { href: "/personal-statement", slug: "/essays", icon: FileText, label: "자기소개서" },
    { href: "/interview", slug: "/interview", icon: Mic, label: "면접 준비" },
  ];

  const exploreNavItems = [
    { href: "/explorer", slug: "/explorer", icon: Search, label: "직업 탐색" },
  ];

  // v3 꿈을 잇다 — 별도 섹션 (slug = href, filterItems 연동)
  const v3NavItemsRaw = [
    { href: "/boards", slug: "/boards", icon: LayoutGrid, label: "꿈 보드" },
    { href: "/stories", slug: "/stories", icon: PenLine, label: "스토리" },
    { href: "/reconnect", slug: "/reconnect", icon: Sunrise, label: "다시, 잇다" },
    { href: "/journey", slug: "/journey", icon: Route, label: "나의 여정" },
    { href: "/growth", slug: "/growth", icon: TrendingUp, label: "성장 대시보드" },
  ];

  // v3 학습 도구 섹션 (slug = href, filterItems 연동)
  const studyNavItemsRaw = [
    { href: "/lectures", slug: "/lectures", icon: Monitor, label: "인강 비교" },
    { href: "/workbooks", slug: "/workbooks", icon: BookMarked, label: "문제집 리뷰" },
    { href: "/academies", slug: "/academies", icon: MapPin, label: "학원 찾기" },
  ];

  const allBottomItems = [
    { href: "/recharge", slug: "/recharge", icon: Coins, label: "학습권 충전", accent: true },
    { href: "/settings", slug: "/settings", icon: Settings, label: "설정" },
    { href: "/admin", slug: "/admin", icon: Shield, label: "관리자", adminOnly: true },
  ];

  const filterItems = <T extends { slug: string; adminOnly?: boolean }>(items: T[]) =>
    items.filter(item => {
      if (item.adminOnly && !isAdminOrStaff) return false;
      return canAccess(item.slug);
    });

  const filteredProduction = filterItems(productionNavItems);
  const filteredCore = filterItems(coreNavItems);
  const filteredAI = filterItems(aiNavItems);
  const filteredExplore = filterItems(exploreNavItems);
  const bottomItems = filterItems(allBottomItems);
  const filteredV3 = filterItems(v3NavItemsRaw);
  const filteredStudy = filterItems(studyNavItemsRaw);

  const isProfileActive = location.startsWith("/profile");

  const renderNavItem = (item: typeof coreNavItems[0]) => {
    const Icon = item.icon;
    const isActive = location === item.href;

    if (item.hasSubmenu && item.href === "/profile") {
      return (
        <div key={item.href}>
          <button
            onClick={() => setProfileExpanded(!profileExpanded)}
            className={cn(
              "flex w-full items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-all",
              isProfileActive
                ? "bg-dream text-white font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
            data-testid="button-profile-menu-toggle"
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {profileExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            )}
          </button>
          
          {profileExpanded && (
            <div className="ml-3 mt-1 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
              {profileSubItems.map((subItem) => {
                const SubIcon = subItem.icon;
                const subHref = `/profile?type=${subItem.id}`;
                const isSubActive = location === "/profile" && 
                  new URLSearchParams(searchString).get("type") === subItem.id;
                
                return (
                  <Link
                    key={subItem.id}
                    href={subHref}
                    onMouseEnter={() => prefetchPageData("/profile")}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-all",
                      isSubActive
                        ? "bg-dream/10 text-dream font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                    data-testid={`link-profile-type-${subItem.id}`}
                  >
                    <SubIcon className={cn("h-3.5 w-3.5", isSubActive ? "text-dream" : "")} />
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
        onMouseEnter={() => prefetchPageData(item.href)}
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-all",
          isActive
            ? "bg-dream text-white font-semibold"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="h-full flex flex-col bg-sidebar border-r border-border">
      {/* Logo */}
      <div className="flex h-14 items-center px-4 mb-1">
        <Link href="/" data-testid="link-sidebar-logo-home" className="flex items-center gap-2">
          <img
            src="/konnect-logo.png"
            alt="Konnect Logo"
            className="h-7 w-auto cursor-pointer"
          />
        </Link>
      </div>

      <div className="flex-1 px-3 flex flex-col overflow-y-auto space-y-4 pb-2">

        {/* ── 출시 서비스 ── */}
        {filteredProduction.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 px-3 mb-1.5">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-dream">서비스</p>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-coral text-white px-1.5 py-0.5 rounded-full leading-none">
                LIVE
              </span>
            </div>
            <div className="space-y-0.5">
              {filteredProduction.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href || location.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onMouseEnter={() => prefetchPageData(item.href)}
                    data-testid={`link-production-${item.slug.replace("/", "")}`}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-all font-medium border",
                      isActive
                        ? "bg-dream text-white font-semibold border-dream shadow-sm"
                        : "text-ink border-dream/20 bg-dream/5 hover:bg-dream/10 hover:border-dream/40"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 학습 도구 section */}
        {filteredStudy.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 px-3 mb-1.5">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-dream">학습 도구</p>
          </div>
          <div className="space-y-0.5">
            {filteredStudy.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-all font-medium border",
                    isActive
                      ? "bg-dream text-white font-semibold border-dream shadow-sm"
                      : "text-ink border-dream/20 bg-dream/5 hover:bg-dream/10 hover:border-dream/40"
                  )}
                  data-testid={`link-study-${item.href.replace("/", "")}`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
        )}

        {/* ── 개발 중 구분선 ── */}
        <div className="flex items-center gap-2 px-1">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground/50 flex-shrink-0">개발 중</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Core section */}
        {filteredCore.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold px-3 mb-1.5 text-dream">
              홈
            </p>
            <div className="space-y-0.5">
              {filteredCore.map(renderNavItem)}
            </div>
          </div>
        )}

        {/* AI Tools section */}
        {filteredAI.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold px-3 mb-1.5 text-coral">
              AI 도구
            </p>
            <div className="space-y-0.5">
              {filteredAI.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onMouseEnter={() => prefetchPageData(item.href)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-all",
                      isActive
                        ? "bg-dream text-white font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Explore section */}
        {filteredExplore.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold px-3 mb-1.5 text-gold">
              탐색
            </p>
            <div className="space-y-0.5">
              {filteredExplore.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onMouseEnter={() => prefetchPageData(item.href)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-all",
                      isActive
                        ? "bg-dream text-white font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* v3 꿈을 잇다 section */}
        {filteredV3.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 px-3 mb-1.5">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-gold">꿈을 잇다</p>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-gold text-white px-1.5 py-0.5 rounded-full leading-none">
              v3
            </span>
          </div>
          <div className="space-y-0.5">
            {filteredV3.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || location.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-all",
                    isActive
                      ? "bg-gold text-white font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                  data-testid={`link-v3-${item.href.replace("/", "")}`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        )}

        {/* Managed Groups section */}
        {managedGroups.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold px-3 mb-1.5 text-muted-foreground">
              그룹
            </p>
            <div className="space-y-0.5">
              <button
                onClick={() => setGroupsExpanded(!groupsExpanded)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-all",
                  location.startsWith("/group")
                    ? "bg-dream text-white font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                data-testid="button-groups-menu-toggle"
              >
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left">그룹 대시보드</span>
                {groupsExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                )}
              </button>
              
              {groupsExpanded && (
                <div className="ml-3 mt-1 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                  {managedGroups.map((group) => {
                    const groupHref = `/group/${group.id}`;
                    const isActive = location === groupHref || location.startsWith(`/group/${group.id}/`);
                    
                    return (
                      <Link
                        key={group.id}
                        href={groupHref}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-all",
                          isActive
                            ? "bg-dream/10 text-dream font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                        )}
                        data-testid={`link-group-${group.id}`}
                      >
                        <GraduationCap className={cn("h-3.5 w-3.5", isActive ? "text-dream" : "")} />
                        {group.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom items */}
      <div className="px-3 py-3 border-t border-border space-y-0.5">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => prefetchPageData(item.href)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-all",
                isActive
                  ? item.accent
                    ? "bg-coral text-white font-semibold"
                    : "bg-dream text-white font-semibold"
                  : item.accent
                    ? "text-coral hover:bg-coral/10 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          로그아웃
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center">
          © 2026 <span className="text-dream font-semibold">Konnect</span> — 꿈을 잇다.
        </p>
      </div>
    </div>
  );
}
