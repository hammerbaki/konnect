import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext";

interface TokenContextType {
  credits: number;
  isLoading: boolean;
  refreshCredits: () => Promise<void>;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const refreshCredits = useCallback(async () => {
    if (!isAuthenticated) {
      setCredits(0);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      });
      
      if (response.ok) {
        const userData = await response.json();
        setCredits(userData.credits || 0);
      }
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) {
      setCredits(user.credits || 0);
      setIsLoading(false);
    }
  }, [user]);

  return (
    <TokenContext.Provider value={{ credits, isLoading, refreshCredits }}>
      {children}
    </TokenContext.Provider>
  );
}

export function useTokens() {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error("useTokens must be used within a TokenProvider");
  }
  return context;
}
