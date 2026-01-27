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
    <div className="flex h-screen-dvh w-full overflow-hidden bg-[#F2F4F6]">
      <div className="hidden md:flex h-full w-[280px] flex-col border-r border-transparent">
        <Sidebar />
      </div>
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-5 md:p-10 pb-[100px] md:pb-10 scroll-smooth">
          <Suspense fallback={<ContentSkeleton />}>
            {children}
          </Suspense>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
