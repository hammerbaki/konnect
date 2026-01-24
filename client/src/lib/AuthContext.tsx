import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getSupabase } from "./supabase";
import type { Session, User as SupabaseUser, SupabaseClient } from "@supabase/supabase-js";

const REFERRAL_CODE_KEY = 'konnect_referral_code';

function saveReferralCode(code: string) {
  console.log('[Referral] Saving referral code:', code);
  localStorage.setItem(REFERRAL_CODE_KEY, code);
}

function getReferralCode(): string | null {
  const code = localStorage.getItem(REFERRAL_CODE_KEY);
  console.log('[Referral] Retrieved referral code from localStorage:', code);
  return code;
}

function clearReferralCode() {
  localStorage.removeItem(REFERRAL_CODE_KEY);
}

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
  credits: number;
  giftPoints: number;
  role: 'user' | 'staff' | 'admin';
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithKakao: () => Promise<void>;
  signInWithOtp: (email: string) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const referralClaimAttempted = useRef(false);

  // Capture referral code from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    console.log('[Referral] Checking URL for referral code:', refCode);
    if (refCode) {
      saveReferralCode(refCode);
      // Clean URL without reload
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const claimReferralReward = useCallback(async (accessToken: string) => {
    const referralCode = getReferralCode();
    console.log('[Referral] claimReferralReward called, code:', referralCode, 'alreadyAttempted:', referralClaimAttempted.current);
    if (!referralCode || referralClaimAttempted.current) {
      console.log('[Referral] Skipping claim - no code or already attempted');
      return;
    }
    
    referralClaimAttempted.current = true;
    console.log('[Referral] Attempting to claim referral with code:', referralCode);
    
    try {
      const response = await fetch('/api/referral/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ referralCode }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('[Referral] Claim succeeded:', result.message);
        clearReferralCode();
      } else {
        const error = await response.json();
        console.log('[Referral] Claim failed:', error.message);
        // Clear code even on failure to prevent repeated attempts
        clearReferralCode();
      }
    } catch (error) {
      console.error('[Referral] Error claiming referral:', error);
      // Reset flag on network error to allow retry
      referralClaimAttempted.current = false;
    }
  }, []);

  const fetchUserData = useCallback(async (accessToken: string, isNewSession: boolean = false) => {
    console.log('[Auth] fetchUserData called, isNewSession:', isNewSession);
    try {
      const response = await fetch("/api/auth/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        
        // Try to claim referral reward on new session
        if (isNewSession) {
          console.log('[Referral] New session detected, triggering claim');
          claimReferralReward(accessToken);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    }
  }, [claimReferralReward]);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    async function initAuth() {
      try {
        const supabase = await getSupabase();
        setSupabaseClient(supabase);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          if (sessionError.message?.includes('refresh_token_not_found') || 
              (sessionError as any).code === 'refresh_token_not_found') {
            console.log("[Auth] Refresh token not found, clearing session");
            await supabase.auth.signOut();
            setSession(null);
            setSupabaseUser(null);
            setUser(null);
            setIsLoading(false);
            return;
          }
        }
        
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        
        if (session?.access_token) {
          await fetchUserData(session.access_token);
        }
        
        const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'TOKEN_REFRESHED' && !session) {
              console.log("[Auth] Token refresh failed, signing out");
              setSession(null);
              setSupabaseUser(null);
              setUser(null);
              return;
            }
            
            setSession(session);
            setSupabaseUser(session?.user ?? null);
            if (session?.access_token) {
              const isNewSession = event === 'SIGNED_IN' || event === 'USER_UPDATED';
              await fetchUserData(session.access_token, isNewSession);
            } else {
              setUser(null);
            }
          }
        );
        subscription = sub;
      } catch (error: any) {
        console.error("Failed to initialize auth:", error);
        if (error?.code === 'refresh_token_not_found' || 
            error?.message?.includes('refresh_token_not_found')) {
          setSession(null);
          setSupabaseUser(null);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchUserData]);

  const logout = async () => {
    // Track logout in backend
    if (session?.access_token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
      } catch (error) {
        console.error("Error tracking logout:", error);
      }
    }
    
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
  };

  const refreshUser = async () => {
    if (session?.access_token) {
      await fetchUserData(session.access_token);
    }
  };

  const signInWithGoogle = async () => {
    if (!supabaseClient) return;
    await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signInWithApple = async () => {
    if (!supabaseClient) return;
    await supabaseClient.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signInWithKakao = async () => {
    if (!supabaseClient) return;
    await supabaseClient.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signInWithOtp = async (email: string) => {
    if (!supabaseClient) return { error: new Error("Supabase not initialized") };
    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const verifyOtp = async (email: string, token: string) => {
    if (!supabaseClient) return { error: new Error("Supabase not initialized") };
    const { error } = await supabaseClient.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    return { error };
  };

  const signInWithPassword = async (email: string, password: string) => {
    if (!supabaseClient) return { error: new Error("Supabase not initialized") };
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUpWithPassword = async (email: string, password: string) => {
    if (!supabaseClient) return { error: new Error("Supabase not initialized") };
    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    if (!supabaseClient) return { error: new Error("Supabase not initialized") };
    const { error } = await supabaseClient.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const resetPasswordForEmail = async (email: string) => {
    if (!supabaseClient) return { error: new Error("Supabase not initialized") };
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  const getAccessToken = async () => {
    if (!supabaseClient) return null;
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.access_token ?? null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        isLoading,
        isAuthenticated: !!session && !!user,
        logout,
        refreshUser,
        signInWithGoogle,
        signInWithApple,
        signInWithKakao,
        signInWithOtp,
        verifyOtp,
        signInWithPassword,
        signUpWithPassword,
        updatePassword,
        resetPasswordForEmail,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
