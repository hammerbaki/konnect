import { Suspense } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { ContentSkeleton } from "@/components/PageSkeleton";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <div className="flex h-screen-dvh w-full overflow-hidden bg-background">
      <div className="hidden md:flex h-full w-[240px] flex-col border-r border-border flex-shrink-0">
        <Sidebar />
      </div>
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-5 md:px-8 md:py-8 pb-[calc(100px+env(safe-area-inset-bottom,0px))] md:pb-10 scroll-smooth">
          <Suspense fallback={<ContentSkeleton />}>
            {children}
          </Suspense>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
