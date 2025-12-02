import { Link, useLocation } from "wouter";
import { LayoutDashboard, PieChart, Target, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobileAction } from "@/lib/MobileActionContext";
import { Button } from "@/components/ui/button";
import React from "react";

export function MobileNav() {
  const [location] = useLocation();
  const { action } = useMobileAction();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "홈" },
    { href: "/analysis", icon: PieChart, label: "분석" },
    { href: "/goals", icon: Target, label: "목표" },
    { href: "/profile", icon: User, label: "프로필" },
  ];

  const handleActionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (action?.onClick) {
      action.onClick();
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[80px] bg-white border-t border-[#E5E8EB] px-6 pb-4 flex items-center justify-between z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {navItems.map((item, index) => {
        // Insert Special Button in the middle
        if (index === 2) {
            return (
                <React.Fragment key="special-action-wrapper">
                   <div className="relative -top-6">
                        <Button 
                            onClick={handleActionClick}
                            className={cn(
                                "h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95",
                                action 
                                    ? "bg-[#3182F6] hover:bg-[#2b72d7] text-white shadow-blue-500/30" 
                                    : "bg-[#3182F6] hover:bg-[#2b72d7] text-white"
                            )}
                        >
                            {action?.icon ? (
                                <action.icon className="h-6 w-6" />
                            ) : (
                                <Plus className="h-6 w-6" />
                            )}
                        </Button>
                   </div>
                   <Link key={item.href} href={item.href}>
                    <a className="flex flex-col items-center justify-center gap-1 min-w-[60px]">
                        <item.icon 
                            className={cn(
                                "h-6 w-6 transition-colors",
                                location === item.href ? "text-[#191F28]" : "text-[#B0B8C1]"
                            )} 
                        />
                        <span 
                            className={cn(
                                "text-[11px] font-medium transition-colors",
                                location === item.href ? "text-[#191F28]" : "text-[#B0B8C1]"
                            )}
                        >
                            {item.label}
                        </span>
                    </a>
                  </Link>
                </React.Fragment>
            );
        }

        return (
          <Link key={item.href} href={item.href}>
            <a className="flex flex-col items-center justify-center gap-1 min-w-[60px]">
              <item.icon 
                className={cn(
                  "h-6 w-6 transition-colors",
                  location === item.href ? "text-[#191F28]" : "text-[#B0B8C1]"
                )} 
              />
              <span 
                className={cn(
                  "text-[11px] font-medium transition-colors",
                  location === item.href ? "text-[#191F28]" : "text-[#B0B8C1]"
                )}
              >
                {item.label}
              </span>
            </a>
          </Link>
        );
      })}
    </div>
  );
}
