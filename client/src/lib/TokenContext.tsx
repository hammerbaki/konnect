import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext";

interface TokenContextType {
  credits: number;
  isLoading: boolean;
  refreshCredits: () => Promise<void>;
  deductCredit: (amount?: number) => boolean;
  addCredits: (amount: number) => void;
  restoreCredits: (amount: number) => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated, getAccessToken, refreshUser } = useAuth();
  const { toast } = useToast();

  const refreshCredits = useCallback(async () => {
    if (!isAuthenticated) {
      setCredits(0);
      setIsLoading(false);
      return;
    }

    try {
      const token = await getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      const response = await fetch("/api/auth/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
  }, [isAuthenticated, getAccessToken]);

  useEffect(() => {
    if (user) {
      setCredits(user.credits || 0);
      setIsLoading(false);
    }
  }, [user]);

  const deductCredit = useCallback((amount: number = 100) => {
    if (credits >= amount) {
      setCredits(prev => prev - amount);
      return true;
    }
    return false;
  }, [credits]);
  
  const restoreCredits = useCallback((amount: number) => {
    setCredits(prev => prev + amount);
  }, []);

  const addCredits = useCallback((amount: number) => {
    setCredits(prev => prev + amount);
    toast({
      title: "토큰 충전 완료",
      description: `${amount} 토큰이 성공적으로 충전되었습니다.`,
    });
  }, [toast]);

  return (
    <TokenContext.Provider value={{ credits, isLoading, refreshCredits, deductCredit, addCredits, restoreCredits }}>
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
