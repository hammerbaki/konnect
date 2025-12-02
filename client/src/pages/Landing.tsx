import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, Mail, User } from "lucide-react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Mock auth
    setTimeout(() => {
      if (email && password) {
        setLocation("/dashboard");
      } else {
        setError("Please fill in all fields.");
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
            <CardTitle className="text-xl">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
            <CardDescription>
              {isLogin ? "Sign in to access your career dashboard." : "Get started with your professional journey."}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="name"
                      className="pl-9" 
                      placeholder="John Doe" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email"
                    type="email"
                    className="pl-9" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {isLogin && (
                    <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password"
                    type="password"
                    className="pl-9" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  type="button"
                  onClick={() => setIsLogin(!isLogin)} 
                  className="text-primary font-medium hover:underline focus:outline-none"
                >
                  {isLogin ? "Sign up" : "Login"}
                </button>
              </div>
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
