import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface TokenContextType {
  credits: number;
  deductCredit: () => boolean;
  addCredits: (amount: number) => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export function TokenProvider({ children }: { children: React.ReactNode }) {
  // Initialize with 1 credit for demo purposes, or 0 as per strict requirement
  const [credits, setCredits] = useState(2); 
  const { toast } = useToast();

  const deductCredit = () => {
    if (credits > 0) {
      setCredits(prev => prev - 1);
      return true;
    }
    return false;
  };

  const addCredits = (amount: number) => {
    setCredits(prev => prev + amount);
    toast({
      title: "Tokens Added",
      description: `Successfully added ${amount} tokens to your account.`,
      duration: 3000,
    });
  };

  return (
    <TokenContext.Provider value={{ credits, deductCredit, addCredits }}>
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
