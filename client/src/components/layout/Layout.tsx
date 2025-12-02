import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F2F4F6]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full w-[280px] flex-col border-r border-transparent">
         <Sidebar />
      </div>
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:p-10 pb-[100px] md:pb-10">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
