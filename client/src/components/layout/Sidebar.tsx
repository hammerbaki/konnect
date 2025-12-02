import { Link, useLocation } from "wouter";
import { LayoutDashboard, PieChart, Target, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { href: "/analysis", icon: PieChart, label: "Career Analysis" },
    { href: "/goals", icon: Target, label: "Goals & Tracking" },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
            K
          </div>
          Konnect
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t p-4">
        <Link href="/">
          <a className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="h-4 w-4" />
            Sign Out
          </a>
        </Link>
      </div>
    </div>
  );
}
