import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Express, RequestHandler, Request } from "express";
import { storage } from "./storage";

// Extend Express Request to include user property
export interface AuthenticatedUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      userRole?: string;
    }
  }
}

// Initialize Supabase client safely - never crash
let supabaseAdmin: SupabaseClient | null = null;

try {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (supabaseUrl && supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } else {
    console.warn('WARNING: Supabase credentials not configured - auth will not work');
  }
} catch (err) {
  console.error('Error initializing Supabase client (non-fatal):', err);
}

export { supabaseAdmin };

export async function setupAuth(app: Express) {
  console.log("Setting up Supabase Auth...");
  
  app.set("trust proxy", 1);
  
  console.log("✓ Supabase Auth configured");
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // First, check for SSO session (K-JOBS SSO)
  const session = req.session as any;
  if (session?.userId && session?.ssoProvider === 'kjobs') {
    const ssoUser = await storage.getUser(session.userId);
    if (ssoUser) {
      req.user = {
        id: ssoUser.id,
        email: ssoUser.email || undefined,
        user_metadata: {
          first_name: ssoUser.firstName,
          last_name: ssoUser.lastName,
        },
      };
      return next();
    }
  }
  
  // Then check for Supabase Bearer token
  if (!supabaseAdmin) {
    return res.status(503).json({ message: "Authentication service unavailable" });
  }
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const token = authHeader.split(" ")[1];
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    await storage.upsertUser({
      id: user.id,
      email: user.email || null,
      firstName: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(" ")[0] || null,
      lastName: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || null,
      profileImageUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    });
    
    req.user = {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    };
    
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
