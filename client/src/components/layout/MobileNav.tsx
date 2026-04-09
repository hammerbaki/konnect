import { Link, useLocation } from "wouter";
import { LayoutDashboard, PieChart, Target, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobileAction } from "@/lib/MobileActionContext";
import React from "react";

export function MobileNav() {
  const [location] = useLocation();
  const { action } = useMobileAction();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "홈" },
    { href: "/profile", icon: User, label: "프로필" },
    { href: "/analysis", icon: PieChart, label: "커리어" },
    { href: "/goals", icon: Target, label: "목표" },
  ];

  const handleActionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (action?.onClick) {
      action.onClick();
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location === item.href;

          if (index === 2 && action && location !== "/dashboard") {
            return (
              <React.Fragment key="action-group">
                <button
                  onClick={handleActionClick}
                  className={cn(
                    "relative -top-5 h-12 w-12 rounded-full flex items-center justify-center",
                    "shadow-[0_4px_16px_rgba(50,14,157,0.30)] transition-all duration-200 active:scale-95"
                  )}
                  style={{ background: "linear-gradient(135deg, #320e9d, #4a16e0)" }}
                >
                  {action?.icon ? (
                    <action.icon className="h-5 w-5 text-white" />
                  ) : (
                    <Plus className="h-5 w-5 text-white" />
                  )}
                </button>
                <Link key={item.href} href={item.href}>
                  <span
                    className={cn(
                      "flex flex-col items-center gap-0.5 px-2 py-1 transition-all",
                      isActive ? "text-dream" : "text-muted-foreground"
                    )}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </span>
                </Link>
              </React.Fragment>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 transition-all",
                  isActive ? "text-dream" : "text-muted-foreground"
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
