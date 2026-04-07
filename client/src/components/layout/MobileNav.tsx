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
    { href: "/dashboard", icon: LayoutDashboard, label: "대시보드" },
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-border shadow-[0_-4px_24px_rgba(50,14,157,0.08)] rounded-t-[20px]" />
      
      <div className="relative min-h-[64px] px-4 sm:px-6 pt-2 pb-1 flex items-start justify-around safe-area-bottom-compact">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          if (index === 2 && location !== "/dashboard") {
            return [
              <div key="special-action-button" className="relative -top-8">
                <Button 
                  onClick={handleActionClick}
                  className={cn(
                    "h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95",
                    "shadow-[0_8px_24px_rgba(50,14,157,0.35)]",
                    "border-[4px] border-white/50 backdrop-blur-sm"
                  )}
                  style={{ background: "linear-gradient(135deg, #320e9d, #4a16e0)" }}
                >
                  {action?.icon ? (
                    <action.icon className="h-7 w-7 text-white" />
                  ) : (
                    <Plus className="h-7 w-7 text-white" />
                  )}
                </Button>
                {action && (
                  <div className="absolute inset-0 rounded-full opacity-20 animate-ping -z-10" style={{ backgroundColor: "#320e9d" }} />
                )}
              </div>,
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1.5 min-w-[60px] relative group"
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-all duration-300",
                  isActive ? "bg-dream/10" : "bg-transparent"
                )}>
                  <Icon 
                    className={cn(
                      "h-6 w-6 transition-colors duration-300",
                      isActive ? "text-dream" : "text-muted-foreground group-hover:text-foreground"
                    )} 
                  />
                </div>
                <span 
                  className={cn(
                    "text-[11px] font-bold transition-colors duration-300",
                    isActive ? "text-dream" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            ];
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1.5 min-w-[60px] relative group"
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-300",
                isActive ? "bg-dream/10" : "bg-transparent"
              )}>
                <Icon 
                  className={cn(
                    "h-6 w-6 transition-colors duration-300",
                    isActive ? "text-dream" : "text-muted-foreground group-hover:text-foreground"
                  )} 
                />
              </div>
              <span 
                className={cn(
                  "text-[11px] font-bold transition-colors duration-300",
                  isActive ? "text-dream" : "text-muted-foreground"
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
