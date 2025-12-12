import { useEffect } from "react";
import { useLocation } from "wouter";
import { getSupabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = await getSupabase();
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          setLocation("/login");
          return;
        }
        
        setLocation("/dashboard");
      } catch (error) {
        console.error("Auth callback error:", error);
        setLocation("/login");
      }
    };

    handleCallback();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F4F6]">
      <div className="text-center">
        <img 
          src="/konnect-logo.png" 
          alt="Konnect" 
          className="h-12 w-auto mx-auto mb-6"
        />
        <Loader2 className="h-8 w-8 animate-spin text-[#3182F6] mx-auto mb-4" />
        <p className="text-[#4E5968]">로그인 중...</p>
      </div>
    </div>
  );
}
