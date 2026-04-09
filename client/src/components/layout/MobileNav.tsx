import { Link, useLocation } from "wouter";
import { LayoutDashboard, Brain, Star, BookOpen, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "대시보드" },
    { href: "/aptitude",  icon: Brain,           label: "분석" },
    { href: "/dream",     icon: Star,            label: "꿈 선언" },
    { href: "/explore",   icon: BookOpen,        label: "학과 탐색" },
    { href: "/lectures",  icon: Users,           label: "커뮤니티" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || location.startsWith(item.href + "/");

          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 transition-all",
                  isActive ? "text-dream" : "text-muted-foreground"
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[9.5px] font-medium">{item.label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
