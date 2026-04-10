import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

export function Layout({ children, hideNav }: LayoutProps) {
  if (hideNav) {
    return (
      <div className="min-h-screen w-full bg-[#F2F4F6]">
        {children}
      </div>
    );
  }
  
  return (
    <div className="flex h-screen-dvh w-full overflow-hidden bg-[#F2F4F6]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full w-[280px] flex-col border-r border-transparent">
         <Sidebar />
      </div>
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-5 md:p-10 pb-[calc(100px+env(safe-area-inset-bottom,0px))] md:pb-10 scroll-smooth">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
