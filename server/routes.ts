import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./supabaseAuth";
import {
  insertProfileSchema,
  insertCareerAnalysisSchema,
  insertPersonalEssaySchema,
  insertKompassGoalSchema,
  updateUserIdentitySchema,
  updateUserSettingsSchema,
  createPointPackageSchema,
  updatePointPackageSchema,
  type AiJobType,
  payments,
} from "@shared/schema";
import { z } from "zod";
import { generateCareerAnalysis, generatePersonalEssay, generateGoals, type GoalLevel, checkAIRateLimit } from "./ai";
import { createRateLimitMiddleware, checkRedisConnection, redis } from "./rateLimiter";
import { startWorker, submitQueuedJob } from "./aiWorker";
import { getQueueStats, estimateProgress } from "./jobQueue";
import { db } from "./db";
import { desc } from "drizzle-orm";

// Helper functions for profile defaults
function getProfileTitle(type: string): string {
  const titles: Record<string, string> = {
    general: '일반 프로필',
    university: '대학생 프로필',
    high: '고등학생 프로필',
    middle: '중학생 프로필',
    elementary: '초등학생 프로필',
  };
  return titles[type] || '프로필';
}

function getProfileIcon(type: string): string {
  const icons: Record<string, string> = {
    general: 'briefcase',
    university: 'graduation-cap',
    high: 'book-open',
    middle: 'pencil',
    elementary: 'star',
  };
  return icons[type] || 'user';
}

function getProfileColor(type: string): string {
  const colors: Record<string, string> = {
    general: '#3182F6',
    university: '#7C3AED',
    high: '#059669',
    middle: '#D97706',
    elementary: '#EC4899',
  };
  return colors[type] || '#3182F6';
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Apply global rate limiting unconditionally (uses in-memory fallback if Redis is down)
  app.use('/api', createRateLimitMiddleware());
  
  // In development, skip Redis connection check to conserve commands
  const isDevelopment = process.env.NODE_ENV !== "production";
  if (isDevelopment) {
    console.log("✓ Development mode: Using in-memory rate limiting (Redis commands conserved)");
  } else {
    // Check Redis connection for logging purposes (production only)
    const redisConnected = await checkRedisConnection();
    if (redisConnected) {
      console.log("✓ Redis connected - global rate limiting enabled");
    } else {
      console.log("⚠ Redis not connected - using in-memory rate limiting fallback");
    }
  }

  app.get('/api/config', (_req, res) => {
    res.json({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    });
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Track login session
      try {
        const existingSession = await storage.getActiveSessionByUser(userId);
        const now = new Date();
        
        if (existingSession) {
          // Check if session is stale (more than 6 hours old)
          const sessionAge = now.getTime() - new Date(existingSession.loginAt).getTime();
          const SIX_HOURS = 6 * 60 * 60 * 1000;
          
          if (sessionAge > SIX_HOURS) {
            // Auto-close the stale session
            await storage.updateUserSessionLogout(existingSession.id);
            // Create a new session
            await storage.createUserSession({
              userId,
              eventType: 'login',
              loginAt: now,
              ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null,
              userAgent: req.headers['user-agent'] || null,
            });
          }
          // If session is still fresh, don't create a new one (same browsing session)
        } else {
          // No active session, create a new one
          await storage.createUserSession({
            userId,
            eventType: 'login',
            loginAt: now,
            ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null,
            userAgent: req.headers['user-agent'] || null,
          });
        }
      } catch (sessionError) {
        console.error("Error tracking session:", sessionError);
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout endpoint - marks session as ended
  app.post('/api/auth/logout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Find active session and mark it as logged out
      const activeSession = await storage.getActiveSessionByUser(userId);
      if (activeSession) {
        await storage.updateUserSessionLogout(activeSession.id);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error logging out:", error);
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  // Get user identity (shared info from users table)
  app.get('/api/user-identity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return identity fields from user
      // Korean style: LastName + FirstName (no space)
      res.json({
        id: user.id,
        displayName: user.displayName || (user.lastName && user.firstName 
          ? `${user.lastName}${user.firstName}` 
          : user.lastName || user.firstName || user.email?.split('@')[0] || ''),
        email: user.email || '',
        gender: user.gender || null,
        birthDate: user.birthDate || null,
      });
    } catch (error) {
      console.error("Error fetching user identity:", error);
      res.status(500).json({ message: "Failed to fetch user identity" });
    }
  });

  // Update user identity (updates users table)
  app.patch('/api/user-identity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = updateUserIdentitySchema.parse(req.body);
      
      const user = await storage.updateUserIdentity(userId, data);
      
      res.json({
        id: user.id,
        displayName: user.displayName || '',
        email: user.email || '',
        gender: user.gender || null,
        birthDate: user.birthDate || null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating user identity:", error);
      res.status(500).json({ message: "Failed to update user identity" });
    }
  });

  // Get user settings
  app.get('/api/user-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const settings = await storage.getUserSettings(userId);
      
      // Return defaults if settings not found (shouldn't happen, but defensive)
      res.json(settings || {
        phone: null,
        marketingConsent: false,
        emailNotifications: true,
        pushNotifications: true,
      });
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch user settings" });
    }
  });

  // Update user settings
  app.patch('/api/user-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = updateUserSettingsSchema.parse(req.body);
      
      const user = await storage.updateUserSettings(userId, data);
      
      res.json({
        phone: user.phone,
        marketingConsent: user.marketingConsent === 1,
        emailNotifications: user.emailNotifications === 1,
        pushNotifications: user.pushNotifications === 1,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update user settings" });
    }
  });

  // Redeem token code for credits (uses database-backed redemption codes)
  app.post('/api/redeem', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { code } = req.body;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: "유효한 코드를 입력해 주세요." });
      }
      
      // Use database-backed redemption system
      const result = await storage.redeemCode(userId, code.trim());
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }
      
      // Get updated user credits
      const user = await storage.getUser(userId);
      
      res.json({ 
        message: result.message,
        creditsAdded: result.pointsAwarded,
        totalCredits: user?.credits || 0,
      });
    } catch (error) {
      console.error("Error redeeming code:", error);
      res.status(500).json({ message: "코드 등록 중 오류가 발생했습니다." });
    }
  });

  app.get('/api/careers', async (_req, res) => {
    try {
      const careers = await storage.getAllCareers();
      res.json(careers);
    } catch (error) {
      console.error("Error fetching careers:", error);
      res.status(500).json({ message: "Failed to fetch careers" });
    }
  });

  app.get('/api/careers/search', async (req, res) => {
    try {
      const query = req.query.q as string || '';
      const careers = await storage.searchCareers(query);
      res.json(careers);
    } catch (error) {
      console.error("Error searching careers:", error);
      res.status(500).json({ message: "Failed to search careers" });
    }
  });

  app.get('/api/careers/category/:category', async (req, res) => {
    try {
      const careers = await storage.getCareersByCategory(req.params.category);
      res.json(careers);
    } catch (error) {
      console.error("Error fetching careers by category:", error);
      res.status(500).json({ message: "Failed to fetch careers by category" });
    }
  });

  app.get('/api/careers/:id', async (req, res) => {
    try {
      const career = await storage.getCareerById(req.params.id);
      if (!career) {
        return res.status(404).json({ message: "Career not found" });
      }
      res.json(career);
    } catch (error) {
      console.error("Error fetching career:", error);
      res.status(500).json({ message: "Failed to fetch career" });
    }
  });

  // Get pre-computed career statistics (or compute if not cached)
  app.get('/api/careers/stats/overview', async (_req, res) => {
    try {
      // Try to get cached stats first
      let cached = await storage.getCareerStats('overview');
      
      // If stats don't exist or are older than 7 days, recompute
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (!cached || (cached.computedAt && cached.computedAt < oneWeekAgo)) {
        // Compute stats from careers data
        const allCareers = await storage.getAllCareers();
        
        // Process career data for statistics
        const processedData: { title: string; salary: number; satisfaction: number; largeClass: string }[] = [];
        
        for (const career of allCareers) {
          const detail = career.detailData as any;
          let salaryNum = 0;
          let satisfaction = 0;
          let largeClass = "기타";
          
          try {
            const jobSum = detail?.tabs?.['1']?.data?.jobSum;
            if (jobSum?.jobLrclNm) largeClass = jobSum.jobLrclNm;
            
            const salData = detail?.tabs?.['4']?.data?.salProspect;
            if (salData?.sal) {
              const match = salData.sal.match(/평균\(50%\)\s*(\d+)/);
              if (match && match[1]) salaryNum = parseInt(match[1]);
            }
            if (salData?.jobSatis) {
              satisfaction = parseFloat(salData.jobSatis);
            }
          } catch (e) {
            // Skip errors
          }
          
          processedData.push({
            title: career.name,
            salary: salaryNum,
            satisfaction,
            largeClass
          });
        }
        
        // Top 5 highest paying careers
        const topSalary = [...processedData]
          .filter(c => c.salary > 0)
          .sort((a, b) => b.salary - a.salary)
          .slice(0, 5)
          .map(c => ({ name: c.title.slice(0, 8), salary: c.salary }));
        
        // Top 5 most satisfying careers
        const topSatisfaction = [...processedData]
          .filter(c => c.satisfaction > 0)
          .sort((a, b) => b.satisfaction - a.satisfaction)
          .slice(0, 5)
          .map(c => ({ name: c.title.slice(0, 8), satisfaction: c.satisfaction }));
        
        // Careers by category
        const categoryCount = new Map<string, number>();
        processedData.forEach(c => {
          categoryCount.set(c.largeClass, (categoryCount.get(c.largeClass) || 0) + 1);
        });
        const categoryData = Array.from(categoryCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, value]) => ({ name: name.replace('직', ''), value }));
        
        // Average satisfaction
        const validSatisfaction = processedData.filter(c => c.satisfaction > 0);
        const avgSatisfaction = validSatisfaction.length > 0
          ? (validSatisfaction.reduce((sum, c) => sum + c.satisfaction, 0) / validSatisfaction.length).toFixed(1)
          : "0";
        
        // Build hierarchy
        const hierarchyMap = new Map<string, Set<string>>();
        for (const career of allCareers) {
          const detail = career.detailData as any;
          try {
            const jobSum = detail?.tabs?.['1']?.data?.jobSum;
            const largeClass = jobSum?.jobLrclNm || "기타";
            const mediumClass = jobSum?.jobMdclNm || "기타";
            
            if (!hierarchyMap.has(largeClass)) {
              hierarchyMap.set(largeClass, new Set());
            }
            hierarchyMap.get(largeClass)!.add(mediumClass);
          } catch (e) {
            // Skip errors
          }
        }
        
        const hierarchy: Record<string, string[]> = {};
        Array.from(hierarchyMap.keys()).sort().forEach(key => {
          hierarchy[key] = Array.from(hierarchyMap.get(key) || []).sort();
        });
        
        const statsData = {
          totalCareers: allCareers.length,
          totalCategories: Object.keys(hierarchy).length,
          topSalary,
          topSatisfaction,
          categoryData,
          avgSatisfaction,
          hierarchy
        };
        
        // Cache the computed stats
        cached = await storage.upsertCareerStats('overview', statsData);
      }
      
      res.json(cached.statsData);
    } catch (error) {
      console.error("Error fetching career stats:", error);
      res.status(500).json({ message: "Failed to fetch career stats" });
    }
  });

  app.get('/api/profiles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profiles = await storage.getProfilesByUser(userId);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });

  // Get or create the user's active profile by type
  app.get('/api/user-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const type = (req.query.type as string) || 'general';
      
      // Try to find existing profile of this type
      const profiles = await storage.getProfilesByUser(userId);
      let profile = profiles.find(p => p.type === type);
      
      // If no profile exists for this type, create one
      if (!profile) {
        profile = await storage.createProfile({
          userId,
          type,
          title: getProfileTitle(type),
          icon: getProfileIcon(type),
          color: getProfileColor(type),
          profileData: {},
        });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Save/update the user's active profile
  app.put('/api/user-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { type, profileData, title } = req.body;
      
      if (!type) {
        return res.status(400).json({ message: "Profile type is required" });
      }
      
      // Find existing profile of this type
      const profiles = await storage.getProfilesByUser(userId);
      let profile = profiles.find(p => p.type === type);
      
      if (profile) {
        // Update existing profile
        profile = await storage.updateProfile(profile.id, {
          profileData,
          title: title || profile.title,
        });
      } else {
        // Create new profile
        profile = await storage.createProfile({
          userId,
          type,
          title: title || getProfileTitle(type),
          icon: getProfileIcon(type),
          color: getProfileColor(type),
          profileData,
        });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error saving user profile:", error);
      res.status(500).json({ message: "Failed to save user profile" });
    }
  });

  app.get('/api/profiles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      const userId = req.user.id;
      if (profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/profiles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertProfileSchema.parse({ ...req.body, userId });
      const profile = await storage.createProfile(data);
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating profile:", error);
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  app.patch('/api/profiles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      if (profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updateProfile(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.delete('/api/profiles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      if (profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteProfile(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ message: "Failed to delete profile" });
    }
  });

  app.get('/api/profiles/:profileId/analyses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getProfile(req.params.profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const analyses = await storage.getAnalysesByProfile(req.params.profileId);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });

  app.post('/api/profiles/:profileId/analyses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getProfile(req.params.profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const data = insertCareerAnalysisSchema.parse({
        ...req.body,
        profileId: req.params.profileId,
      });
      
      const analysis = await storage.createAnalysis(data);
      res.status(201).json(analysis);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating analysis:", error);
      res.status(500).json({ message: "Failed to create analysis" });
    }
  });

  app.delete('/api/analyses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const analysis = await storage.getAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      const profile = await storage.getProfile(analysis.profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteAnalysis(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting analysis:", error);
      res.status(500).json({ message: "Failed to delete analysis" });
    }
  });

  app.get('/api/profiles/:profileId/essays', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getProfile(req.params.profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const essays = await storage.getEssaysByProfile(req.params.profileId);
      res.json(essays);
    } catch (error) {
      console.error("Error fetching essays:", error);
      res.status(500).json({ message: "Failed to fetch essays" });
    }
  });

  app.post('/api/profiles/:profileId/essays', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getProfile(req.params.profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const data = insertPersonalEssaySchema.parse({
        ...req.body,
        profileId: req.params.profileId,
      });
      
      const essay = await storage.createEssay(data);
      res.status(201).json(essay);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating essay:", error);
      res.status(500).json({ message: "Failed to create essay" });
    }
  });

  app.patch('/api/essays/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const essay = await storage.getEssay(req.params.id);
      if (!essay) {
        return res.status(404).json({ message: "Essay not found" });
      }
      const profile = await storage.getProfile(essay.profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updateEssay(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating essay:", error);
      res.status(500).json({ message: "Failed to update essay" });
    }
  });

  app.delete('/api/essays/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const essay = await storage.getEssay(req.params.id);
      if (!essay) {
        return res.status(404).json({ message: "Essay not found" });
      }
      const profile = await storage.getProfile(essay.profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteEssay(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting essay:", error);
      res.status(500).json({ message: "Failed to delete essay" });
    }
  });

  app.get('/api/profiles/:profileId/kompass', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getProfile(req.params.profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const kompass = await storage.getKompassByProfile(req.params.profileId);
      res.json(kompass);
    } catch (error) {
      console.error("Error fetching kompass goals:", error);
      res.status(500).json({ message: "Failed to fetch kompass goals" });
    }
  });

  app.post('/api/profiles/:profileId/kompass', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getProfile(req.params.profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const data = insertKompassGoalSchema.parse({
        ...req.body,
        profileId: req.params.profileId,
      });
      
      const kompass = await storage.createKompass(data);
      res.status(201).json(kompass);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating kompass:", error);
      res.status(500).json({ message: "Failed to create kompass" });
    }
  });

  // Get all kompass goals for current user (across all profiles)
  app.get('/api/kompass', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profiles = await storage.getProfilesByUser(userId);
      
      // Get all kompass for all user profiles
      const allKompass = [];
      for (const profile of profiles) {
        const profileKompass = await storage.getKompassByProfile(profile.id);
        allKompass.push(...profileKompass.map(k => ({
          ...k,
          profileTitle: profile.title,
          profileType: profile.type,
        })));
      }
      
      // Sort by updatedAt descending
      allKompass.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
      
      res.json(allKompass);
    } catch (error) {
      console.error("Error fetching all kompass:", error);
      res.status(500).json({ message: "Failed to fetch kompass goals" });
    }
  });

  // Get single kompass by ID
  app.get('/api/kompass/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const kompass = await storage.getKompass(req.params.id);
      if (!kompass) {
        return res.status(404).json({ message: "Kompass를 찾을 수 없습니다." });
      }
      const profile = await storage.getProfile(kompass.profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "접근 권한이 없습니다." });
      }
      res.json(kompass);
    } catch (error) {
      console.error("Error fetching kompass:", error);
      res.status(500).json({ message: "Failed to fetch kompass" });
    }
  });

  app.patch('/api/kompass/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const kompass = await storage.getKompass(req.params.id);
      if (!kompass) {
        return res.status(404).json({ message: "Kompass not found" });
      }
      const profile = await storage.getProfile(kompass.profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updateKompass(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating kompass:", error);
      res.status(500).json({ message: "Failed to update kompass" });
    }
  });

  app.delete('/api/kompass/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const kompass = await storage.getKompass(req.params.id);
      if (!kompass) {
        return res.status(404).json({ message: "Kompass not found" });
      }
      const profile = await storage.getProfile(kompass.profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteKompass(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting kompass:", error);
      res.status(500).json({ message: "Failed to delete kompass" });
    }
  });

  app.post('/api/profiles/:profileId/generate-analysis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getProfile(req.params.profileId);
      
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Check rate limit before processing
      const rateLimitResult = await checkAIRateLimit(userId, "analysis");
      res.setHeader("X-RateLimit-Limit", rateLimitResult.limit);
      res.setHeader("X-RateLimit-Remaining", rateLimitResult.remaining);
      res.setHeader("X-RateLimit-Reset", rateLimitResult.reset);
      if (!rateLimitResult.success) {
        return res.status(429).json({ 
          message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
          retryAfter: rateLimitResult.retryAfter
        });
      }

      const user = await storage.getUser(userId);
      const analysisCost = await storage.getServiceCost('analysis');
      if (!user || user.credits < analysisCost) {
        return res.status(402).json({ message: `포인트가 부족합니다. 분석을 생성하려면 최소 ${analysisCost} 포인트가 필요합니다.` });
      }

      const deducted = await storage.deductUserCredits(userId, analysisCost);
      if (!deducted) {
        return res.status(402).json({ message: "포인트 차감 중 오류가 발생했습니다." });
      }

      // Get user identity for comprehensive profile data
      const userIdentity = {
        displayName: user.displayName || undefined,
        gender: user.gender || undefined,
        birthDate: user.birthDate || undefined,
      };

      const result = await generateCareerAnalysis(profile, userIdentity);

      // Store careerRecommendations in the recommendations field
      const analysis = await storage.createAnalysis({
        profileId: req.params.profileId,
        summary: result.summary,
        stats: result.stats,
        chartData: null,
        recommendations: {
          careers: result.careerRecommendations,
        },
        aiRawResponse: result.rawResponse,
      });

      await storage.updateProfile(req.params.profileId, {
        lastAnalyzed: new Date(),
      });

      res.status(201).json(analysis);
    } catch (error: any) {
      console.error("Error generating analysis:", error);
      console.error("Error stack:", error?.stack);
      console.error("Error message:", error?.message);
      res.status(500).json({ message: "AI 분석 생성 중 오류가 발생했습니다.", details: error?.message });
    }
  });

  app.post('/api/profiles/:profileId/generate-essay', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getProfile(req.params.profileId);
      
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Check rate limit before processing
      const rateLimitResult = await checkAIRateLimit(userId, "essay");
      res.setHeader("X-RateLimit-Limit", rateLimitResult.limit);
      res.setHeader("X-RateLimit-Remaining", rateLimitResult.remaining);
      res.setHeader("X-RateLimit-Reset", rateLimitResult.reset);
      if (!rateLimitResult.success) {
        return res.status(429).json({ 
          message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
          retryAfter: rateLimitResult.retryAfter
        });
      }

      const { category, topic, context } = req.body;
      if (!category || !topic) {
        return res.status(400).json({ message: "카테고리와 주제는 필수입니다." });
      }

      const user = await storage.getUser(userId);
      const essayCost = await storage.getServiceCost('essay');
      if (!user || user.credits < essayCost) {
        return res.status(402).json({ message: `포인트가 부족합니다. 자기소개서 생성을 위해 최소 ${essayCost} 포인트가 필요합니다.` });
      }

      const deducted = await storage.deductUserCredits(userId, essayCost);
      if (!deducted) {
        return res.status(402).json({ message: "포인트 차감 중 오류가 발생했습니다." });
      }

      // Submit job to queue for background processing
      const { jobId, status } = await submitQueuedJob(
        userId,
        req.params.profileId,
        "essay",
        {
          profileType: profile.type,
          category,
          topic,
          context,
        }
      );

      // Return status from queue (processing if immediate, queued if waiting)
      res.status(202).json({ 
        jobId,
        status,
        immediate: status === "processing",
        message: status === "processing" ? "자기소개서 생성을 시작합니다." : "대기열에 추가되었습니다.",
      });
    } catch (error) {
      console.error("Error generating essay:", error);
      res.status(500).json({ message: "자기소개서 생성 중 오류가 발생했습니다." });
    }
  });

  // New endpoint: Complete essay job and save to database
  app.post('/api/ai/jobs/:jobId/complete-essay', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const job = await storage.getAiJob(req.params.jobId);

      if (!job || job.userId !== userId) {
        return res.status(404).json({ message: "작업을 찾을 수 없습니다." });
      }

      if (job.status !== "completed" || !job.result) {
        return res.status(400).json({ message: "작업이 아직 완료되지 않았습니다." });
      }

      if (job.type !== "essay") {
        return res.status(400).json({ message: "자기소개서 작업이 아닙니다." });
      }

      const payload = job.payload as any;
      const result = job.result as { title: string; content: string };

      const essay = await storage.createEssay({
        profileId: job.profileId!,
        category: payload.category,
        topic: payload.topic,
        title: result.title,
        content: result.content,
        draftVersion: 1,
      });

      res.status(201).json(essay);
    } catch (error) {
      console.error("Error completing essay job:", error);
      res.status(500).json({ message: "자기소개서 저장 중 오류가 발생했습니다." });
    }
  });

  // Complete essay revision job and update existing essay
  app.post('/api/ai/jobs/:jobId/complete-essay-revision', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const job = await storage.getAiJob(req.params.jobId);

      if (!job || job.userId !== userId) {
        return res.status(404).json({ message: "작업을 찾을 수 없습니다." });
      }

      if (job.status !== "completed" || !job.result) {
        return res.status(400).json({ message: "작업이 아직 완료되지 않았습니다." });
      }

      if (job.type !== "essay_revision") {
        return res.status(400).json({ message: "자기소개서 수정 작업이 아닙니다." });
      }

      const payload = job.payload as any;
      const result = job.result as { title: string; content: string };
      const essayId = payload.essayId;

      if (!essayId) {
        return res.status(400).json({ message: "수정할 자기소개서 ID가 없습니다." });
      }

      // Get the existing essay to increment version
      const existingEssay = await storage.getEssay(essayId);
      if (!existingEssay) {
        return res.status(404).json({ message: "수정할 자기소개서를 찾을 수 없습니다." });
      }

      // Update the essay with new content
      const updatedEssay = await storage.updateEssay(essayId, {
        title: result.title,
        content: result.content,
        draftVersion: (existingEssay.draftVersion || 1) + 1,
      });

      res.status(200).json(updatedEssay);
    } catch (error) {
      console.error("Error completing essay revision job:", error);
      res.status(500).json({ message: "자기소개서 수정 저장 중 오류가 발생했습니다." });
    }
  });

  // AI Goal Suggestions endpoint
  // Strategic levels (year, half) cost 1 credit
  // Tactical levels (month, week, day) are free
  const goalSuggestSchema = z.object({
    level: z.enum(['year', 'half', 'month', 'week', 'day']),
    visionTitle: z.string(),
    visionDescription: z.string(),
    targetYear: z.number(),
    ancestorChain: z.array(z.object({
      level: z.string(),
      title: z.string(),
      description: z.string().optional(),
    })),
    siblings: z.array(z.object({ title: z.string() })).optional(),
    count: z.number().min(1).max(10).optional(),
  });

  app.post('/api/goals/ai-suggest', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = goalSuggestSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ message: "잘못된 요청입니다.", errors: parsed.error.errors });
      }

      const { level, visionTitle, visionDescription, targetYear, ancestorChain, siblings, count } = parsed.data;
      
      // Check rate limit before processing
      const rateLimitResult = await checkAIRateLimit(userId, "goals");
      res.setHeader("X-RateLimit-Limit", rateLimitResult.limit);
      res.setHeader("X-RateLimit-Remaining", rateLimitResult.remaining);
      res.setHeader("X-RateLimit-Reset", rateLimitResult.reset);
      if (!rateLimitResult.success) {
        return res.status(429).json({ 
          message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
          retryAfter: rateLimitResult.retryAfter
        });
      }

      // Strategic levels (year, half) require credits
      const isStrategicLevel = level === 'year' || level === 'half';
      let goalCost = 0;
      
      if (isStrategicLevel) {
        goalCost = await storage.getServiceCost('goal_strategic');
        const user = await storage.getUser(userId);
        if (!user || user.credits < goalCost) {
          return res.status(402).json({ 
            message: `포인트가 부족합니다. 연도/반기 목표 생성을 위해 최소 ${goalCost} 포인트가 필요합니다.`,
            requiredCredits: goalCost,
            currentCredits: user?.credits || 0,
          });
        }

        const deducted = await storage.deductUserCredits(userId, goalCost);
        if (!deducted) {
          return res.status(402).json({ message: "포인트 차감 중 오류가 발생했습니다." });
        }
      }

      const result = await generateGoals(
        level as GoalLevel,
        { visionTitle, visionDescription, targetYear, ancestorChain, siblings },
        count
      );

      // Return updated credits if strategic level was used
      let updatedCredits: number | undefined;
      if (isStrategicLevel) {
        const user = await storage.getUser(userId);
        updatedCredits = user?.credits;
      }

      res.json({
        suggestions: result.suggestions,
        creditsUsed: goalCost,
        remainingCredits: updatedCredits,
      });
    } catch (error: any) {
      console.error("Error generating goal suggestions:", error);
      res.status(500).json({ message: "AI 목표 생성 중 오류가 발생했습니다.", details: error?.message });
    }
  });

  // ===== AI JOB QUEUE ENDPOINTS =====
  
  // Submit a new AI job
  app.post('/api/ai/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { type, profileId, payload } = req.body;
      
      if (!type || !['analysis', 'essay', 'essay_revision', 'goal'].includes(type)) {
        return res.status(400).json({ message: "Invalid job type" });
      }
      
      // Check rate limit
      const operationType = type === 'goal' ? 'goals' : (type === 'essay_revision' ? 'essay' : type);
      const rateLimitResult = await checkAIRateLimit(userId, operationType as 'analysis' | 'goals' | 'essay');
      res.setHeader("X-RateLimit-Limit", rateLimitResult.limit);
      res.setHeader("X-RateLimit-Remaining", rateLimitResult.remaining);
      res.setHeader("X-RateLimit-Reset", rateLimitResult.reset);
      
      if (!rateLimitResult.success) {
        return res.status(429).json({ 
          message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
          retryAfter: rateLimitResult.retryAfter
        });
      }
      
      // Determine cost based on job type
      let requiredCredits = 0;
      if (type === 'analysis') {
        requiredCredits = await storage.getServiceCost('analysis');
      } else if (type === 'essay') {
        requiredCredits = await storage.getServiceCost('essay');
      } else if (type === 'essay_revision') {
        requiredCredits = await storage.getServiceCost('essay_revision');
      } else if (type === 'goal' && payload?.level) {
        const isStrategicLevel = payload.level === 'year' || payload.level === 'half';
        if (isStrategicLevel) {
          requiredCredits = await storage.getServiceCost('goal_strategic');
        }
      }
      
      // Check and deduct credits if required
      if (requiredCredits > 0) {
        const user = await storage.getUser(userId);
        if (!user || user.credits < requiredCredits) {
          return res.status(402).json({ 
            message: `포인트가 부족합니다. ${requiredCredits} 포인트가 필요합니다.`,
            requiredCredits,
            currentCredits: user?.credits || 0,
          });
        }
        
        const deducted = await storage.deductUserCredits(userId, requiredCredits);
        if (!deducted) {
          return res.status(402).json({ message: "포인트 차감 중 오류가 발생했습니다." });
        }
      }
      
      const result = await submitQueuedJob(
        userId,
        profileId || null,
        type as AiJobType,
        payload
      );
      
      // Return status from queue (processing if immediate, queued if waiting)
      res.json({
        jobId: result.jobId,
        status: result.status,
        immediate: result.status === "processing",
      });
    } catch (error: any) {
      console.error("Error submitting AI job:", error);
      res.status(500).json({ message: "AI 작업 제출 중 오류가 발생했습니다." });
    }
  });
  
  // Get job status
  app.get('/api/ai/jobs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const jobId = req.params.id;
      
      const job = await storage.getAiJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "작업을 찾을 수 없습니다." });
      }
      
      if (job.userId !== userId) {
        return res.status(403).json({ message: "접근 권한이 없습니다." });
      }
      
      const progress = estimateProgress(job);
      
      res.json({
        id: job.id,
        type: job.type,
        status: job.status,
        progress,
        result: job.result,
        error: job.error,
        queuedAt: job.queuedAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      });
    } catch (error: any) {
      console.error("Error fetching job status:", error);
      res.status(500).json({ message: "작업 상태 조회 중 오류가 발생했습니다." });
    }
  });
  
  // Get queue stats
  app.get('/api/ai/queue/stats', isAuthenticated, async (_req, res) => {
    try {
      const stats = await getQueueStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching queue stats:", error);
      res.status(500).json({ message: "큐 상태 조회 중 오류가 발생했습니다." });
    }
  });

  // ===== NOTIFICATIONS ROUTES =====
  // Get user notifications
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const notifications = await storage.getNotificationsByUser(userId, limit);
      res.json(notifications);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "알림 조회 중 오류가 발생했습니다." });
    }
  });

  // Get unread notification count
  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error: any) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "알림 개수 조회 중 오류가 발생했습니다." });
    }
  });

  // Mark notification as read
  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = req.params.id;
      const notification = await storage.markNotificationAsRead(notificationId);
      res.json(notification);
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "알림 읽음 처리 중 오류가 발생했습니다." });
    }
  });

  // Mark all notifications as read
  app.patch('/api/notifications/read-all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error marking all as read:", error);
      res.status(500).json({ message: "알림 전체 읽음 처리 중 오류가 발생했습니다." });
    }
  });

  // Delete notification
  app.delete('/api/notifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = req.params.id;
      await storage.deleteNotification(notificationId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "알림 삭제 중 오류가 발생했습니다." });
    }
  });

  // ===== ADMIN ROUTES =====
  // Middleware for admin/staff access (read-only operations)
  const requireStaffOrAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }
      
      const user = await storage.getUser(userId);
      const role = user?.role || 'user'; // Default to 'user' if role is null
      if (role !== 'admin' && role !== 'staff') {
        return res.status(403).json({ message: "관리자 권한이 필요합니다." });
      }
      
      req.userRole = role;
      next();
    } catch (error) {
      console.error("Admin check error:", error);
      res.status(500).json({ message: "권한 확인 중 오류가 발생했습니다." });
    }
  };

  // Middleware for admin-only access (write operations)
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }
      
      const user = await storage.getUser(userId);
      const role = user?.role || 'user'; // Default to 'user' if role is null
      if (role !== 'admin') {
        return res.status(403).json({ message: "관리자 권한이 필요합니다." });
      }
      
      req.userRole = role;
      next();
    } catch (error) {
      console.error("Admin check error:", error);
      res.status(500).json({ message: "권한 확인 중 오류가 발생했습니다." });
    }
  };

  // Get all users (admin/staff can view)
  app.get('/api/admin/users', isAuthenticated, requireStaffOrAdmin, async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "사용자 목록 조회 중 오류가 발생했습니다." });
    }
  });

  // Zod schemas for admin PATCH requests
  const updateRoleSchema = z.object({
    role: z.enum(['user', 'staff', 'admin']),
  });

  const updateCreditsSchema = z.object({
    credits: z.number().int().min(0).max(10000000),
  });

  // Update user role (admin/staff - staff cannot promote to admin)
  app.patch('/api/admin/users/:id/role', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const targetUserId = req.params.id;
      const currentUserRole = req.userRole;
      const parsed = updateRoleSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ message: "유효하지 않은 역할입니다.", errors: parsed.error.errors });
      }
      
      // Staff cannot promote users to admin
      if (currentUserRole === 'staff' && parsed.data.role === 'admin') {
        return res.status(403).json({ message: "스태프는 관리자 역할을 부여할 수 없습니다." });
      }
      
      const user = await storage.updateUserRole(targetUserId, parsed.data.role);
      res.json(user);
    } catch (error: any) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "역할 변경 중 오류가 발생했습니다." });
    }
  });

  // Update user credits (staff and admin can add points)
  app.patch('/api/admin/users/:id/credits', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const targetUserId = req.params.id;
      const parsed = updateCreditsSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ message: "유효하지 않은 포인트 값입니다.", errors: parsed.error.errors });
      }
      
      const user = await storage.updateUserCreditsAdmin(targetUserId, parsed.data.credits);
      res.json(user);
    } catch (error: any) {
      console.error("Error updating user credits:", error);
      res.status(500).json({ message: "포인트 변경 중 오류가 발생했습니다." });
    }
  });

  // Get system stats (admin/staff can view)
  app.get('/api/admin/stats/system', isAuthenticated, requireStaffOrAdmin, async (_req, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching system stats:", error);
      res.status(500).json({ message: "시스템 통계 조회 중 오류가 발생했습니다." });
    }
  });

  // Get AI job stats (admin/staff can view)
  app.get('/api/admin/stats/ai', isAuthenticated, requireStaffOrAdmin, async (_req, res) => {
    try {
      const stats = await storage.getAiJobStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching AI stats:", error);
      res.status(500).json({ message: "AI 통계 조회 중 오류가 발생했습니다." });
    }
  });

  // Get recent AI jobs for admin with progress info
  app.get('/api/admin/jobs/recent', isAuthenticated, requireStaffOrAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const jobs = await storage.getRecentAiJobsForAdmin(limit);
      
      const jobsWithProgress = jobs.map(job => {
        let estimatedProgress = job.progress || 0;
        
        if (job.status === 'processing' && job.startedAt) {
          const startTime = job.startedAt instanceof Date 
            ? job.startedAt.getTime() 
            : new Date(job.startedAt).getTime();
          const elapsed = Date.now() - startTime;
          const estimatedDuration = job.type === 'goal' ? 15000 : 45000;
          estimatedProgress = Math.min(90, 10 + (elapsed / estimatedDuration) * 80);
        } else if (job.status === 'completed') {
          estimatedProgress = 100;
        } else if (job.status === 'queued') {
          estimatedProgress = 5;
        }
        
        return {
          ...job,
          estimatedProgress: Math.round(estimatedProgress),
        };
      });
      
      res.json(jobsWithProgress);
    } catch (error: any) {
      console.error("Error fetching recent jobs:", error);
      res.status(500).json({ message: "작업 목록 조회 중 오류가 발생했습니다." });
    }
  });

  // Get traffic stats (admin/staff can view)
  app.get('/api/admin/stats/traffic', isAuthenticated, requireStaffOrAdmin, async (_req, res) => {
    try {
      const trafficData = await storage.getTrafficOverview();
      res.json(trafficData);
    } catch (error: any) {
      console.error("Error fetching traffic stats:", error);
      res.status(500).json({ message: "트래픽 통계 조회 중 오류가 발생했습니다." });
    }
  });

  // Get user session history (admin/staff can view)
  app.get('/api/admin/sessions', isAuthenticated, requireStaffOrAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const sessions = await storage.getUserSessionHistory(limit);
      res.json(sessions);
    } catch (error: any) {
      console.error("Error fetching session history:", error);
      res.status(500).json({ message: "세션 기록 조회 중 오류가 발생했습니다." });
    }
  });

  // ===== PAGE VISIBILITY ENDPOINTS =====

  // Get all page visibility settings (for admin dashboard)
  app.get('/api/admin/page-visibility', isAuthenticated, requireStaffOrAdmin, async (_req, res) => {
    try {
      const settings = await storage.getAllPageSettings();
      res.json(settings);
    } catch (error: any) {
      console.error("Error fetching page settings:", error);
      res.status(500).json({ message: "페이지 설정 조회 중 오류가 발생했습니다." });
    }
  });

  // Update page visibility (staff and admin)
  app.patch('/api/admin/page-visibility/:slug', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const slug = decodeURIComponent(req.params.slug);
      const { allowedRoles } = req.body;

      // Validate allowedRoles
      if (allowedRoles !== null && !Array.isArray(allowedRoles)) {
        return res.status(400).json({ message: "allowedRoles must be an array or null" });
      }

      if (allowedRoles) {
        const validRoles = ['user', 'staff', 'admin'];
        for (const role of allowedRoles) {
          if (!validRoles.includes(role)) {
            return res.status(400).json({ message: `Invalid role: ${role}` });
          }
        }
      }

      const result = await storage.updatePageAllowedRoles(slug, allowedRoles, user.id);
      res.json(result);
    } catch (error: any) {
      console.error("Error updating page visibility:", error);
      res.status(500).json({ message: "페이지 설정 업데이트 중 오류가 발생했습니다." });
    }
  });

  // Reset page visibility to defaults (staff and admin)
  app.post('/api/admin/page-visibility/:slug/reset', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);

      const slug = decodeURIComponent(req.params.slug);
      await storage.resetPageSettings(slug);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error resetting page settings:", error);
      res.status(500).json({ message: "페이지 설정 초기화 중 오류가 발생했습니다." });
    }
  });

  // Get page visibility for a specific page (authenticated users)
  app.get('/api/page-visibility/:slug', isAuthenticated, async (req: any, res) => {
    try {
      const slug = decodeURIComponent(req.params.slug);
      const settings = await storage.getPageSettings(slug);
      
      if (!settings) {
        return res.status(404).json({ message: "Page not found" });
      }

      // Get effective roles (allowedRoles if set, otherwise defaultRoles)
      const effectiveRoles = settings.allowedRoles || settings.defaultRoles;
      
      res.json({
        slug: settings.slug,
        title: settings.title,
        allowedRoles: effectiveRoles,
        isLocked: settings.isLocked === 1,
      });
    } catch (error: any) {
      console.error("Error fetching page visibility:", error);
      res.status(500).json({ message: "페이지 설정 조회 중 오류가 발생했습니다." });
    }
  });

  // Get all page visibility settings for current user (to cache on frontend)
  app.get('/api/page-visibility', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const allSettings = await storage.getAllPageSettings();
      
      // Return simplified visibility map for the user
      const visibilityMap: Record<string, boolean> = {};
      for (const setting of allSettings) {
        const effectiveRoles = setting.allowedRoles || setting.defaultRoles;
        visibilityMap[setting.slug] = effectiveRoles.includes(user.role);
      }

      res.json({
        userRole: user.role,
        pages: visibilityMap,
      });
    } catch (error: any) {
      console.error("Error fetching page visibility map:", error);
      res.status(500).json({ message: "페이지 설정 조회 중 오류가 발생했습니다." });
    }
  });

  // Track page view (public endpoint for analytics, uses Redis for efficient counting)
  app.post('/api/track/pageview', async (req: any, res) => {
    try {
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const hour = now.getHours();
      const userId = req.user?.id;
      
      // Use Redis for real-time counting if available
      if (redis) {
        const pageViewKey = `pageviews:${date}:${hour}`;
        const uniqueVisitorKey = `visitors:${date}`;
        const visitorId = userId || req.ip || 'anonymous';
        
        // Increment page views
        await redis.incr(pageViewKey);
        
        // Track unique visitors with set
        const isNew = await redis.sadd(uniqueVisitorKey, visitorId);
        
        // Set TTL for keys (48 hours)
        await redis.expire(pageViewKey, 48 * 60 * 60);
        await redis.expire(uniqueVisitorKey, 48 * 60 * 60);
        
        res.json({ tracked: true });
      } else {
        // Fallback: direct database insert (less efficient)
        await storage.upsertVisitorMetrics(date, hour, 1, 1, 0);
        res.json({ tracked: true });
      }
    } catch (error: any) {
      console.error("Error tracking pageview:", error);
      res.status(200).json({ tracked: false }); // Silent fail
    }
  });

  // Get recent AI jobs for monitoring (admin/staff can view)
  app.get('/api/admin/jobs', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const allJobs = await storage.getPendingJobs();
      res.json(allJobs.slice(0, limit));
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "작업 목록 조회 중 오류가 발생했습니다." });
    }
  });
  
  // Admin: View processing map to debug stuck jobs
  app.get('/api/admin/jobs/processing-map', isAuthenticated, requireStaffOrAdmin, async (req, res) => {
    try {
      if (!redis) {
        return res.json({ processing: {}, message: "Development mode - in-memory queue" });
      }
      
      const processing = await redis.hgetall<Record<string, string>>("ai:processing") || {};
      
      // Get job details for each processing job
      const processingDetails = await Promise.all(
        Object.entries(processing).map(async ([jobId, type]) => {
          const job = await storage.getAiJob(jobId);
          return {
            jobId,
            type,
            status: job?.status || "not_found",
            startedAt: job?.startedAt,
            isStale: job?.status === "completed" || job?.status === "failed" || !job,
          };
        })
      );
      
      res.json({ 
        processing, 
        details: processingDetails,
        staleCount: processingDetails.filter(d => d.isStale).length,
      });
    } catch (error: any) {
      console.error("Error fetching processing map:", error);
      res.status(500).json({ message: "처리 중 맵 조회 오류" });
    }
  });

  // Admin: Clear stale processing entries
  app.post('/api/admin/jobs/clear-stale', isAuthenticated, requireStaffOrAdmin, async (req, res) => {
    try {
      if (!redis) {
        return res.json({ cleared: 0, message: "Development mode - nothing to clear" });
      }
      
      const processing = await redis.hgetall<Record<string, string>>("ai:processing") || {};
      let clearedCount = 0;
      
      for (const [jobId, type] of Object.entries(processing)) {
        const job = await storage.getAiJob(jobId);
        
        // Clear if job is completed, failed, or not found
        if (!job || job.status === "completed" || job.status === "failed") {
          await redis.hdel("ai:processing", jobId);
          clearedCount++;
          console.log(`Cleared stale processing entry: ${jobId} (${type})`);
        }
      }
      
      res.json({ cleared: clearedCount, message: `Cleared ${clearedCount} stale entries` });
    } catch (error: any) {
      console.error("Error clearing stale entries:", error);
      res.status(500).json({ message: "스테일 항목 제거 오류" });
    }
  });
  
  // ==================== ADMIN POINT PACKAGE MANAGEMENT ====================

  // Get all point packages (including inactive) for admin
  app.get('/api/admin/packages', isAuthenticated, requireStaffOrAdmin, async (_req, res) => {
    try {
      const packages = await storage.getAllPointPackages();
      res.json(packages);
    } catch (error: any) {
      console.error("Error fetching admin packages:", error);
      res.status(500).json({ message: "패키지 조회 중 오류가 발생했습니다." });
    }
  });

  // Create a new point package
  app.post('/api/admin/packages', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const parsed = createPointPackageSchema.safeParse(req.body);
      
      if (!parsed.success) {
        const errorMessage = parsed.error.errors.map(e => e.message).join(', ');
        return res.status(400).json({ message: errorMessage || "유효하지 않은 패키지 정보입니다." });
      }
      
      const newPackage = await storage.createPointPackage(parsed.data);
      res.json(newPackage);
    } catch (error: any) {
      console.error("Error creating package:", error);
      res.status(500).json({ message: "패키지 생성 중 오류가 발생했습니다." });
    }
  });

  // Update a point package
  app.patch('/api/admin/packages/:id', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const packageId = req.params.id;
      const parsed = updatePointPackageSchema.safeParse(req.body);
      
      if (!parsed.success) {
        const errorMessage = parsed.error.errors.map(e => e.message).join(', ');
        return res.status(400).json({ message: errorMessage || "유효하지 않은 패키지 정보입니다." });
      }
      
      // Filter out undefined values
      const updateData = Object.fromEntries(
        Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
      );
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "수정할 내용이 없습니다." });
      }
      
      const updatedPackage = await storage.updatePointPackage(packageId, updateData);
      res.json(updatedPackage);
    } catch (error: any) {
      console.error("Error updating package:", error);
      res.status(500).json({ message: "패키지 수정 중 오류가 발생했습니다." });
    }
  });

  // Delete (deactivate) a point package
  app.delete('/api/admin/packages/:id', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const packageId = req.params.id;
      await storage.updatePointPackage(packageId, { isActive: 0 });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting package:", error);
      res.status(500).json({ message: "패키지 삭제 중 오류가 발생했습니다." });
    }
  });

  // ==================== ADMIN SERVICE PRICING MANAGEMENT ====================

  // Get all service pricing (public for display, admin for editing)
  app.get('/api/service-pricing', async (_req, res) => {
    try {
      const pricing = await storage.getAllServicePricing();
      res.json(pricing);
    } catch (error: any) {
      console.error("Error fetching service pricing:", error);
      res.status(500).json({ message: "서비스 가격 조회 중 오류가 발생했습니다." });
    }
  });

  // Initialize default service pricing (admin only)
  app.post('/api/admin/service-pricing/init', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { DEFAULT_SERVICE_PRICING } = await import("@shared/schema");
      const results = [];
      
      for (const [id, config] of Object.entries(DEFAULT_SERVICE_PRICING)) {
        const pricing = await storage.upsertServicePricing({
          id,
          name: config.name,
          description: config.description,
          pointCost: config.pointCost,
          isActive: 1,
          updatedBy: req.user.id,
        });
        results.push(pricing);
      }
      
      res.json(results);
    } catch (error: any) {
      console.error("Error initializing service pricing:", error);
      res.status(500).json({ message: "서비스 가격 초기화 중 오류가 발생했습니다." });
    }
  });

  // Update service pricing (admin only)
  app.patch('/api/admin/service-pricing/:id', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const serviceId = req.params.id;
      const { updateServicePricingSchema } = await import("@shared/schema");
      
      const parsed = updateServicePricingSchema.safeParse(req.body);
      if (!parsed.success) {
        const errorMessage = parsed.error.errors.map(e => e.message).join(', ');
        return res.status(400).json({ message: errorMessage || "유효하지 않은 가격 정보입니다." });
      }
      
      const updateData = Object.fromEntries(
        Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
      );
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "수정할 내용이 없습니다." });
      }
      
      const updatedPricing = await storage.updateServicePricing(serviceId, updateData, req.user.id);
      res.json(updatedPricing);
    } catch (error: any) {
      console.error("Error updating service pricing:", error);
      res.status(500).json({ message: "서비스 가격 수정 중 오류가 발생했습니다." });
    }
  });

  // ==================== SYSTEM SETTINGS ROUTES ====================
  
  // Get all system settings (admin only)
  app.get('/api/admin/system-settings', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const settings = await storage.getAllSystemSettings();
      
      // Merge with defaults for any missing settings
      const { DEFAULT_SYSTEM_SETTINGS } = await import("@shared/schema");
      const result: Record<string, { value: string; description: string | null }> = {};
      
      // Add defaults first
      for (const [key, config] of Object.entries(DEFAULT_SYSTEM_SETTINGS)) {
        result[key] = { value: config.value, description: config.description };
      }
      
      // Override with DB values
      for (const setting of settings) {
        result[setting.key] = { value: setting.value, description: setting.description };
      }
      
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ message: "시스템 설정 조회 중 오류가 발생했습니다." });
    }
  });

  // Update system setting (admin only)
  app.patch('/api/admin/system-settings/:key', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { key } = req.params;
      const { value, description } = req.body;
      
      if (value === undefined) {
        return res.status(400).json({ message: "값이 필요합니다." });
      }
      
      const setting = await storage.upsertSystemSetting(key, String(value), description ?? null, req.user.id);
      res.json(setting);
    } catch (error: any) {
      console.error("Error updating system setting:", error);
      res.status(500).json({ message: "시스템 설정 수정 중 오류가 발생했습니다." });
    }
  });

  // Get signup bonus (public for display)
  app.get('/api/signup-bonus', async (_req, res) => {
    try {
      const bonus = await storage.getSystemSetting('signup_bonus');
      res.json({ amount: parseInt(bonus || '1000', 10) });
    } catch (error: any) {
      console.error("Error fetching signup bonus:", error);
      res.json({ amount: 1000 }); // Default fallback
    }
  });

  // ==================== REDEMPTION CODE ROUTES ====================
  
  // Get all redemption codes (admin/staff only)
  app.get('/api/admin/redemption-codes', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const codes = await storage.getAllRedemptionCodes();
      res.json(codes);
    } catch (error: any) {
      console.error("Error fetching redemption codes:", error);
      res.status(500).json({ message: "쿠폰 코드 조회 중 오류가 발생했습니다." });
    }
  });

  // Create redemption code (admin/staff only)
  app.post('/api/admin/redemption-codes', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { createRedemptionCodeSchema } = await import("@shared/schema");
      const parsed = createRedemptionCodeSchema.safeParse(req.body);
      
      if (!parsed.success) {
        const errorMessage = parsed.error.errors.map(e => e.message).join(', ');
        return res.status(400).json({ message: errorMessage || "유효하지 않은 쿠폰 정보입니다." });
      }
      
      // Check for duplicate code
      const existing = await storage.getRedemptionCodeByCode(parsed.data.code);
      if (existing) {
        return res.status(400).json({ message: "이미 존재하는 쿠폰 코드입니다." });
      }
      
      const code = await storage.createRedemptionCode(parsed.data, req.user.id);
      res.json(code);
    } catch (error: any) {
      console.error("Error creating redemption code:", error);
      res.status(500).json({ message: "쿠폰 코드 생성 중 오류가 발생했습니다." });
    }
  });

  // Update redemption code (admin/staff only)
  app.patch('/api/admin/redemption-codes/:id', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { createRedemptionCodeSchema } = await import("@shared/schema");
      const parsed = createRedemptionCodeSchema.partial().safeParse(req.body);
      
      if (!parsed.success) {
        const errorMessage = parsed.error.errors.map(e => e.message).join(', ');
        return res.status(400).json({ message: errorMessage || "유효하지 않은 쿠폰 정보입니다." });
      }
      
      // Check for duplicate code if changing code
      if (parsed.data.code) {
        const existing = await storage.getRedemptionCodeByCode(parsed.data.code);
        if (existing && existing.id !== id) {
          return res.status(400).json({ message: "이미 존재하는 쿠폰 코드입니다." });
        }
      }
      
      const code = await storage.updateRedemptionCode(id, parsed.data);
      res.json(code);
    } catch (error: any) {
      console.error("Error updating redemption code:", error);
      res.status(500).json({ message: "쿠폰 코드 수정 중 오류가 발생했습니다." });
    }
  });

  // Delete redemption code (admin/staff only)
  app.delete('/api/admin/redemption-codes/:id', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteRedemptionCode(id);
      res.json({ message: "쿠폰 코드가 삭제되었습니다." });
    } catch (error: any) {
      console.error("Error deleting redemption code:", error);
      res.status(500).json({ message: "쿠폰 코드 삭제 중 오류가 발생했습니다." });
    }
  });

  // Redeem a code (authenticated users)
  app.post('/api/redeem-code', isAuthenticated, async (req: any, res) => {
    try {
      const { code } = req.body;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ success: false, message: "쿠폰 코드를 입력해주세요." });
      }
      
      const result = await storage.redeemCode(req.user.id, code.trim());
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Error redeeming code:", error);
      res.status(500).json({ success: false, message: "쿠폰 사용 중 오류가 발생했습니다." });
    }
  });

  // ==================== PAYMENT ROUTES (Toss Payments) ====================
  
  // Get Toss client key for frontend
  app.get('/api/payments/config', isAuthenticated, async (req: any, res) => {
    res.json({
      clientKey: process.env.TOSS_TEST_CLIENT_KEY,
    });
  });

  // Get available point packages
  app.get('/api/payments/packages', isAuthenticated, async (req: any, res) => {
    try {
      const packages = await storage.getActivePointPackages();
      res.json(packages);
    } catch (error: any) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "패키지 조회 중 오류가 발생했습니다." });
    }
  });

  // Initialize payment (create order)
  app.post('/api/payments/init', isAuthenticated, async (req: any, res) => {
    try {
      const { packageId, amount, pointsToAdd, orderName } = req.body;
      const userId = req.user.id;
      
      // Generate unique order ID
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create pending payment record
      const payment = await storage.createPayment({
        userId,
        packageId: packageId || null,
        orderId,
        orderName: orderName || '포인트 충전',
        amount,
        pointsToAdd,
        status: 'pending',
      });
      
      res.json({
        paymentId: payment.id,
        orderId: payment.orderId,
        orderName: payment.orderName,
        amount: payment.amount,
      });
    } catch (error: any) {
      console.error("Error initializing payment:", error);
      res.status(500).json({ message: "결제 초기화 중 오류가 발생했습니다." });
    }
  });

  // Confirm payment (called after Toss success redirect)
  app.post('/api/payments/confirm', isAuthenticated, async (req: any, res) => {
    try {
      const { paymentKey, orderId, amount } = req.body;
      const userId = req.user.id;
      
      // Find pending payment
      const payment = await storage.getPaymentByOrderId(orderId);
      if (!payment) {
        return res.status(404).json({ message: "결제 정보를 찾을 수 없습니다." });
      }
      
      if (payment.userId !== userId) {
        return res.status(403).json({ message: "권한이 없습니다." });
      }
      
      if (payment.status !== 'pending') {
        return res.status(400).json({ message: "이미 처리된 결제입니다." });
      }
      
      // Verify amount matches
      if (payment.amount !== Number(amount)) {
        return res.status(400).json({ message: "결제 금액이 일치하지 않습니다." });
      }
      
      // Call Toss Payments confirm API
      const secretKey = process.env.TOSS_TEST_SECRET_KEY;
      const authorization = Buffer.from(`${secretKey}:`).toString('base64');
      
      const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authorization}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: Number(amount),
        }),
      });
      
      const tossResult = await tossResponse.json();
      
      if (!tossResponse.ok) {
        // Payment failed
        await storage.updatePaymentStatus(payment.id, 'failed', {
          paymentKey,
          failReason: tossResult.message || 'Unknown error',
          rawResponse: tossResult,
        });
        return res.status(400).json({ 
          message: tossResult.message || "결제 승인에 실패했습니다.",
          code: tossResult.code,
        });
      }
      
      // Payment successful - update payment record
      await storage.updatePaymentStatus(payment.id, 'done', {
        paymentKey,
        method: tossResult.method,
        approvedAt: tossResult.approvedAt ? new Date(tossResult.approvedAt) : new Date(),
        receiptUrl: tossResult.receipt?.url || null,
        rawResponse: tossResult,
      });
      
      // Add points to user
      await storage.addUserPoints(
        userId,
        payment.pointsToAdd,
        'purchase',
        `${payment.orderName} 결제`,
        undefined,
        payment.id
      );
      
      // Get updated user
      const user = await storage.getUser(userId);
      
      res.json({
        success: true,
        payment: {
          id: payment.id,
          amount: payment.amount,
          pointsAdded: payment.pointsToAdd,
          method: tossResult.method,
          receiptUrl: tossResult.receipt?.url,
        },
        newBalance: user?.credits || 0,
      });
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "결제 승인 중 오류가 발생했습니다." });
    }
  });

  // Handle payment failure
  app.post('/api/payments/fail', isAuthenticated, async (req: any, res) => {
    try {
      const { orderId, code, message } = req.body;
      
      const payment = await storage.getPaymentByOrderId(orderId);
      if (payment) {
        await storage.updatePaymentStatus(payment.id, 'failed', {
          failReason: `${code}: ${message}`,
        });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error handling payment failure:", error);
      res.status(500).json({ message: "결제 실패 처리 중 오류가 발생했습니다." });
    }
  });

  // Get user's payment history
  app.get('/api/payments/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const payments = await storage.getPaymentsByUser(userId);
      res.json(payments);
    } catch (error: any) {
      console.error("Error fetching payment history:", error);
      res.status(500).json({ message: "결제 내역 조회 중 오류가 발생했습니다." });
    }
  });

  // Get user's point transaction history
  app.get('/api/points/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getPointTransactionsByUser(userId, limit);
      res.json(transactions);
    } catch (error: any) {
      console.error("Error fetching point history:", error);
      res.status(500).json({ message: "포인트 내역 조회 중 오류가 발생했습니다." });
    }
  });

  // Admin: Create point package
  app.post('/api/admin/packages', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const pkg = await storage.createPointPackage(req.body);
      res.json(pkg);
    } catch (error: any) {
      console.error("Error creating package:", error);
      res.status(500).json({ message: "패키지 생성 중 오류가 발생했습니다." });
    }
  });

  // Admin: Get all payments
  app.get('/api/admin/payments', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      // For now, just get all payments (can be optimized later with pagination)
      const allPayments = await db.select().from(payments).orderBy(desc(payments.createdAt)).limit(100);
      res.json(allPayments);
    } catch (error: any) {
      console.error("Error fetching all payments:", error);
      res.status(500).json({ message: "결제 내역 조회 중 오류가 발생했습니다." });
    }
  });

  // Start the AI worker
  startWorker();

  // Background task to flush Redis visitor metrics to PostgreSQL hourly
  async function flushRedisMetricsToDB() {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Flush metrics from the previous hour
      for (let hoursAgo = 1; hoursAgo <= 24; hoursAgo++) {
        const pastTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
        const date = pastTime.toISOString().split('T')[0];
        const hour = pastTime.getHours();
        
        const pageViewKey = `pageviews:${date}:${hour}`;
        const uniqueVisitorKey = `visitors:${date}`;
        
        try {
          const pageViews = await redis.get(pageViewKey);
          const uniqueVisitors = await redis.scard(uniqueVisitorKey);
          
          if (pageViews && Number(pageViews) > 0) {
            await storage.upsertVisitorMetrics(date, hour, Number(pageViews), 0, 0);
            await redis.del(pageViewKey);
          }
          
          // Update unique visitors count for the day (only on last hour check)
          if (hoursAgo === 1 && uniqueVisitors && Number(uniqueVisitors) > 0) {
            await storage.upsertVisitorMetrics(date, 0, 0, Number(uniqueVisitors), 0);
          }
        } catch (err) {
          console.error(`Failed to flush metrics for ${date}:${hour}`, err);
        }
      }
      
      console.log(`✓ Visitor metrics flushed to database at ${now.toISOString()}`);
    } catch (error) {
      console.error("Error flushing visitor metrics:", error);
    }
  }

  // Flush metrics every hour
  setInterval(flushRedisMetricsToDB, 60 * 60 * 1000);
  
  // Initial flush after 1 minute
  setTimeout(flushRedisMetricsToDB, 60 * 1000);

  const httpServer = createServer(app);
  return httpServer;
}
