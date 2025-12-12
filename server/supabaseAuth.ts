import { createClient } from "@supabase/supabase-js";
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

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function setupAuth(app: Express) {
  console.log("Setting up Supabase Auth...");
  
  app.set("trust proxy", 1);
  
  console.log("✓ Supabase Auth configured");
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
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
