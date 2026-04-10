/*
 * CommunityTabNav — mobile-only tab bar for switching between community pages
 */
import { Link, useLocation } from "wouter";
import { Monitor, BookOpen, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/lectures",  label: "인강",   icon: Monitor,  color: "text-indigo",     activeBg: "bg-indigo/10",     border: "border-indigo/40"   },
  { href: "/workbooks", label: "문제집",  icon: BookOpen, color: "text-vermillion", activeBg: "bg-vermillion/10", border: "border-vermillion/40" },
  { href: "/academies", label: "학원",    icon: MapPin,   color: "text-gold",       activeBg: "bg-amber-500/10",  border: "border-amber-400/40" },
];

export function CommunityTabNav() {
  const [location] = useLocation();

  return (
    <div className="md:hidden flex gap-2 mb-4">
      {tabs.map(({ href, label, icon: Icon, color, activeBg, border }) => {
        const isActive = location === href;
        return (
          <Link key={href} href={href} className="flex-1">
            <span
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all w-full",
                isActive
                  ? cn(color, activeBg, border)
                  : "text-muted-foreground border-border bg-secondary/40"
              )}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 1.5} />
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
