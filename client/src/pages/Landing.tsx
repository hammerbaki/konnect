import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Mock validation
    setTimeout(() => {
      if (token.length > 3) {
        setLocation("/dashboard");
      } else {
        setError("Invalid token. Please check your access code.");
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Background Abstract Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md px-4"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-primary text-primary-foreground mb-4 shadow-lg">
            <span className="text-3xl font-bold">K</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Konnect</h1>
          <p className="text-muted-foreground mt-2">AI-Powered Career Intelligence Platform</p>
        </div>

        <Card className="border-slate-200 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Access Portal</CardTitle>
            <CardDescription>
              Enter your organization-provided access token to continue.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-9" 
                    placeholder="Enter Access Token" 
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              
              <div className="bg-blue-50 rounded-md p-3">
                <div className="flex gap-2 text-sm text-blue-700">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>Secure access ensures personalized career data protection.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Access Platform"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="mt-6 text-center text-xs text-muted-foreground">
          &copy; 2025 Konnect.careers. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
