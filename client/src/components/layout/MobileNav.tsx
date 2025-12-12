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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] rounded-t-[28px]" />
      
      <div className="relative h-[72px] px-4 sm:px-6 pb-2 pt-2 flex items-center justify-around">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          if (index === 2 && location !== "/dashboard") {
            return (
              <React.Fragment key="special-action-wrapper">
                <div className="relative -top-8">
                  <Button 
                    onClick={handleActionClick}
                    className={cn(
                      "h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95",
                      "bg-gradient-to-br from-[#3182F6] to-[#1B64DA]",
                      "shadow-[0_8px_24px_rgba(49,130,246,0.4)]",
                      "border-[4px] border-white/50 backdrop-blur-sm"
                    )}
                  >
                    {action?.icon ? (
                      <action.icon className="h-7 w-7 text-white" />
                    ) : (
                      <Plus className="h-7 w-7 text-white" />
                    )}
                  </Button>
                  {action && (
                    <div className="absolute inset-0 rounded-full bg-[#3182F6] opacity-20 animate-ping -z-10" />
                  )}
                </div>
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center gap-1.5 min-w-[60px] relative group"
                >
                  <div className={cn(
                    "p-1.5 rounded-xl transition-all duration-300",
                    isActive ? "bg-blue-50" : "bg-transparent"
                  )}>
                    <Icon 
                      className={cn(
                        "h-6 w-6 transition-colors duration-300",
                        isActive ? "text-[#3182F6]" : "text-[#B0B8C1] group-hover:text-[#8B95A1]"
                      )} 
                    />
                  </div>
                  <span 
                    className={cn(
                      "text-[11px] font-bold transition-colors duration-300",
                      isActive ? "text-[#3182F6]" : "text-[#B0B8C1]"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </React.Fragment>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1.5 min-w-[60px] relative group"
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-300",
                isActive ? "bg-blue-50" : "bg-transparent"
              )}>
                <Icon 
                  className={cn(
                    "h-6 w-6 transition-colors duration-300",
                    isActive ? "text-[#3182F6]" : "text-[#B0B8C1] group-hover:text-[#8B95A1]"
                  )} 
                />
              </div>
              <span 
                className={cn(
                  "text-[11px] font-bold transition-colors duration-300",
                  isActive ? "text-[#3182F6]" : "text-[#B0B8C1]"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
