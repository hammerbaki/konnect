import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, supabaseAdmin } from "./supabaseAuth";
import {
  insertProfileSchema,
  insertCareerAnalysisSchema,
  insertPersonalEssaySchema,
  insertKompassGoalSchema,
  updateUserIdentitySchema,
  updateUserSettingsSchema,
  createPointPackageSchema,
  updatePointPackageSchema,
  verifyIapSchema,
  IAP_PRODUCTS,
  type AiJobType,
  type IapPlatform,
  payments,
} from "@shared/schema";
import { z } from "zod";
import { generateCareerAnalysis, generateForeignStudentAnalysis, generatePersonalEssay, generateGoals, type GoalLevel, checkAIRateLimit } from "./ai";
import { generateInterviewQuestions, generateAnswerFeedback, improveAnswer } from "./interview-ai";
import { interviewSessions, interviewQuestions, interviewAnswers } from "@shared/schema";
import { fetchCompanyInfo } from "./webFetcher";
import { createRateLimitMiddleware, checkRedisConnection, redis } from "./rateLimiter";
import { startWorker, submitQueuedJob } from "./aiWorker";
import { getQueueStats, estimateProgress } from "./jobQueue";
import { db } from "./db";
import { handleKJobsSSO, generateTestToken, ssoMiddleware } from "./kjobs-sso";
import { desc, count, sum, and, eq, gte, lte, gt } from "drizzle-orm";
import { giftPointLedger, users, referrals } from "@shared/schema";

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

// Convert AI-generated plan to VisionData structure for Kompass
function convertAIPlanToVisionData(
  aiPlan: any,
  idSuffix: string,
  title: string,
  targetYear: number,
  startMonth: number
): any {
  const vision: any = {
    id: `vision-${idSuffix}`,
    title: title,
    description: aiPlan.visionDescription || "나의 커리어 목표를 향한 여정",
    targetYear: targetYear,
    progress: 0,
    children: []
  };

  // Process each year from AI plan
  for (const yearGoal of aiPlan.yearlyGoals || []) {
    const yearNode: any = {
      id: `y${yearGoal.year}-${idSuffix}`,
      title: yearGoal.title || `${yearGoal.year}년 목표`,
      description: yearGoal.description || "",
      dateDisplay: String(yearGoal.year),
      progress: 0,
      children: []
    };

    // Process half-yearly goals
    for (const halfGoal of yearGoal.halfYearlyGoals || []) {
      const halfNode: any = {
        id: `h${halfGoal.half}-${yearGoal.year}-${idSuffix}`,
        title: halfGoal.title || (halfGoal.half === 1 ? "상반기 목표" : "하반기 목표"),
        description: halfGoal.description || "",
        dateDisplay: halfGoal.half === 1 ? "01-06" : "07-12",
        progress: 0,
        children: []
      };

      // Process monthly goals
      for (const monthGoal of halfGoal.monthlyGoals || []) {
        const monthNode: any = {
          id: `m${monthGoal.month}-${yearGoal.year}-${idSuffix}`,
          title: monthGoal.title || `${monthGoal.month}월 목표`,
          description: "",
          dateDisplay: String(monthGoal.month).padStart(2, '0'),
          progress: 0,
          children: []
        };

        // Create weeks with AI-generated tasks
        const daysInMonth = new Date(yearGoal.year, monthGoal.month, 0).getDate();
        const numberOfWeeks = Math.ceil(daysInMonth / 7);
        const keyTasks = monthGoal.keyTasks || [];

        for (let w = 1; w <= numberOfWeeks; w++) {
          const weekStartDay = (w - 1) * 7 + 1;
          const weekEndDay = Math.min(w * 7, daysInMonth);
          
          const weekNode: any = {
            id: `w${w}-m${monthGoal.month}-${yearGoal.year}-${idSuffix}`,
            title: `${w}주차`,
            description: "",
            dateDisplay: `${String(monthGoal.month).padStart(2, '0')}.${String(weekStartDay).padStart(2, '0')}-${String(weekEndDay).padStart(2, '0')}`,
            progress: 0,
            children: []
          };

          // Create daily nodes with tasks distributed across weeks
          for (let d = weekStartDay; d <= weekEndDay; d++) {
            const dayNode: any = {
              id: `d${d}-m${monthGoal.month}-${yearGoal.year}-${idSuffix}`,
              title: `${d}일`,
              date: `${yearGoal.year}-${String(monthGoal.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
              dateDisplay: `${yearGoal.year}.${String(monthGoal.month).padStart(2, '0')}.${String(d).padStart(2, '0')}`,
              progress: 0,
              todos: []
            };

            // Add key tasks to the first day of each week
            if (d === weekStartDay && keyTasks.length > 0) {
              const taskIndex = (w - 1) % keyTasks.length;
              dayNode.todos.push({
                id: `todo-${d}-m${monthGoal.month}-${yearGoal.year}-${idSuffix}`,
                title: keyTasks[taskIndex],
                completed: false
              });
            }

            weekNode.children.push(dayNode);
          }

          monthNode.children.push(weekNode);
        }

        halfNode.children.push(monthNode);
      }

      yearNode.children.push(halfNode);
    }

    vision.children.push(yearNode);
  }

  return vision;
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Apply SSO middleware globally to handle tokens at any URL
  app.use(ssoMiddleware);

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

  app.get('/api/sso/kjobs', handleKJobsSSO);

  // SSO session check endpoint - for frontend to detect SSO login
  app.get('/api/sso/session', async (req: any, res) => {
    const session = req.session as any;
    if (session?.userId && session?.ssoProvider === 'kjobs') {
      const ssoUser = await storage.getUser(session.userId);
      if (ssoUser) {
        return res.json({
          authenticated: true,
          provider: 'kjobs',
          user: {
            id: ssoUser.id,
            email: ssoUser.email,
            firstName: ssoUser.firstName,
            lastName: ssoUser.lastName,
            displayName: ssoUser.displayName || `${ssoUser.firstName || ''} ${ssoUser.lastName || ''}`.trim(),
            credits: ssoUser.credits,
            giftPoints: ssoUser.giftPoints,
            role: ssoUser.role,
          }
        });
      }
    }
    return res.json({ authenticated: false });
  });

  if (process.env.NODE_ENV === 'development') {
    app.get('/api/sso/kjobs/test-token', (req, res) => {
      try {
        const userId = req.query.userId as string || 'test-user-123';
        const email = req.query.email as string;
        const name = req.query.name as string;
        const token = generateTestToken(userId, email, name);
        res.json({ token, testUrl: `/api/sso/kjobs?token=${token}` });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });
  }

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

  // Delete account endpoint - removes user from Supabase and our database
  app.delete('/api/auth/delete-account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (!supabaseAdmin) {
        return res.status(503).json({ message: "인증 서비스를 사용할 수 없습니다." });
      }
      
      // Delete user from Supabase Auth
      const { error: supabaseError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (supabaseError) {
        console.error("Supabase delete error:", supabaseError);
        return res.status(500).json({ message: "계정 삭제에 실패했습니다. 잠시 후 다시 시도해주세요." });
      }
      
      // Delete user data from our database (cascading should handle most relations)
      try {
        await storage.deleteUser(userId);
      } catch (dbError) {
        console.error("Database delete error (non-fatal, user already removed from auth):", dbError);
      }
      
      res.json({ success: true, message: "계정이 성공적으로 삭제되었습니다." });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "계정 삭제에 실패했습니다." });
    }
  });

  // ===== MOBILE APP API ENDPOINTS =====
  // Unified user endpoint for mobile apps (combines identity, credits, settings)
  app.get('/api/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get GP balance
      const gpBalance = await storage.getUserGiftPointBalance(userId);
      
      // Return comprehensive user data for mobile apps
      res.json({
        id: user.id,
        email: user.email || '',
        displayName: user.displayName || (user.lastName && user.firstName 
          ? `${user.lastName}${user.firstName}` 
          : user.lastName || user.firstName || user.email?.split('@')[0] || ''),
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        profileImageUrl: user.profileImageUrl || null,
        gender: user.gender || null,
        birthDate: user.birthDate || null,
        credits: user.credits || 0,
        giftPoints: gpBalance || 0,
        referralCode: user.referralCode || null,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user data" });
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

  // Redeem token code for GP (Gift Points) - uses database-backed redemption codes
  app.post('/api/redeem', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { code } = req.body;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: "유효한 코드를 입력해 주세요." });
      }
      
      // Use database-backed redemption system (now awards GP instead of credits)
      const result = await storage.redeemCode(userId, code.trim());
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }
      
      // Get updated user balances
      const user = await storage.getUser(userId);
      
      res.json({ 
        message: result.message,
        gpAdded: result.pointsAwarded, // Gift Points added
        isGiftPoints: result.isGiftPoints,
        totalGiftPoints: user?.giftPoints || 0,
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

  // AI-powered Kompass generation
  app.post('/api/profiles/:profileId/kompass/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getProfile(req.params.profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { title, targetYear, description } = req.body;
      if (!title || !targetYear) {
        return res.status(400).json({ message: "Title and targetYear are required" });
      }

      // Get user's birth date to calculate age
      const user = await storage.getUser(userId);
      let userAge: number | null = null;
      if (user?.birthDate) {
        const today = new Date();
        const birthDate = new Date(user.birthDate);
        userAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          userAge--;
        }
      }

      // Generate AI plan
      const { generateKompassPlan } = await import('./ai');
      const aiPlan = await generateKompassPlan(profile, title, targetYear, userAge, description);
      
      // Convert AI plan to visionData structure
      const startYear = new Date().getFullYear();
      const startMonth = new Date().getMonth() + 1;
      const idSuffix = `ai-${Date.now()}`;
      
      const visionData = convertAIPlanToVisionData(aiPlan, idSuffix, title, targetYear, startMonth);
      
      // Create the kompass with AI-generated data
      const data = insertKompassGoalSchema.parse({
        profileId: req.params.profileId,
        targetYear,
        startMonth,
        visionData,
      });
      
      const kompass = await storage.createKompass(data);
      res.status(201).json(kompass);
    } catch (error: any) {
      console.error("Error generating AI kompass:", error);
      res.status(500).json({ message: error.message || "Failed to generate AI kompass" });
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

      const analysisCost = await storage.getServiceCost('analysis');
      
      // Deduct with GP priority (GP first, then regular credits) - includes balance check
      const deductResult = await storage.deductUserPointsWithPriority(userId, analysisCost, '진로 분석 생성');
      if (!deductResult.success) {
        if (deductResult.errorCode === 'insufficient_balance') {
          return res.status(402).json({ 
            message: `포인트가 부족합니다. 분석을 생성하려면 최소 ${analysisCost} 포인트가 필요합니다.`,
            requiredCredits: deductResult.totalRequired,
            currentCredits: deductResult.creditBalance,
            giftPoints: deductResult.gpBalance,
          });
        }
        return res.status(402).json({ message: "포인트 차감 중 오류가 발생했습니다." });
      }

      // Get user for profile data
      const user = await storage.getUser(userId);

      // Get user identity for comprehensive profile data
      const userIdentity = {
        displayName: user?.displayName || undefined,
        gender: user?.gender || undefined,
        birthDate: user?.birthDate || undefined,
      };

      // Branch based on profile type
      let analysis;
      
      if (profile.type === 'international') {
        // Use specialized foreign student (international) analysis
        const result = await generateForeignStudentAnalysis(profile, userIdentity);
        
        analysis = await storage.createAnalysis({
          profileId: req.params.profileId,
          summary: result.summary.oneLine,
          stats: {
            label1: "취업 준비도",
            val1: result.fit.score >= 70 ? "높음" : result.fit.score >= 40 ? "보통" : "준비필요",
            label2: "TOPIK",
            val2: result.summary.korean.topik || "미입력",
            label3: "비자",
            val3: result.summary.visaType || "미입력",
          },
          chartData: null,
          recommendations: {
            profileType: 'international',
            foreignStudentData: result,
          },
          aiRawResponse: result.rawResponse,
        });
      } else {
        // Use standard analysis for other profile types
        const kjobsAssessment = await storage.getLatestCompletedKjobsAssessment(userId);
        const kjobsTestResult = kjobsAssessment ? {
          careerDna: kjobsAssessment.careerDna || undefined,
          scores: kjobsAssessment.scores as Record<string, number> | undefined,
          facetScores: kjobsAssessment.facetScores as Record<string, number> | undefined,
          keywords: kjobsAssessment.keywords as string[] | undefined,
          recommendedJobs: kjobsAssessment.recommendedJobs as Array<{ title: string; matchPercentage: number; keyCompetencies: string[] }> | undefined,
        } : null;

        const result = await generateCareerAnalysis(profile, userIdentity, kjobsTestResult);

        analysis = await storage.createAnalysis({
          profileId: req.params.profileId,
          summary: result.summary,
          stats: result.stats,
          chartData: null,
          recommendations: {
            careers: result.careerRecommendations,
          },
          aiRawResponse: result.rawResponse,
        });
      }

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

      const { category, topic, context, targetInfo } = req.body;
      if (!category || !topic) {
        return res.status(400).json({ message: "카테고리와 주제는 필수입니다." });
      }

      const essayCost = await storage.getServiceCost('essay');
      
      // Deduct with GP priority (GP first, then regular credits) - includes balance check
      const deductResult = await storage.deductUserPointsWithPriority(userId, essayCost, '자기소개서 생성');
      if (!deductResult.success) {
        if (deductResult.errorCode === 'insufficient_balance') {
          return res.status(402).json({ 
            message: `포인트가 부족합니다. 자기소개서 생성을 위해 최소 ${essayCost} 포인트가 필요합니다.`,
            requiredCredits: deductResult.totalRequired,
            currentCredits: deductResult.creditBalance,
            giftPoints: deductResult.gpBalance,
          });
        }
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
          targetInfo,
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

  // Fetch company/school information from URL for essay generation
  app.post('/api/fetch-company-info', isAuthenticated, async (req: any, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: "URL은 필수입니다." });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ message: "올바른 URL 형식이 아닙니다." });
      }

      const result = await fetchCompanyInfo(url);
      
      if (!result.success) {
        return res.status(422).json({ 
          message: result.error || "웹페이지 정보를 가져올 수 없습니다.",
          success: false 
        });
      }

      res.json({ 
        success: true, 
        info: result.info 
      });
    } catch (error: any) {
      console.error("Error fetching company info:", error);
      res.status(500).json({ 
        message: "웹페이지 분석 중 오류가 발생했습니다.", 
        success: false 
      });
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
        
        // Deduct with GP priority (GP first, then regular credits) - includes balance check
        const deductResult = await storage.deductUserPointsWithPriority(userId, goalCost, '목표 생성');
        if (!deductResult.success) {
          if (deductResult.errorCode === 'insufficient_balance') {
            return res.status(402).json({ 
              message: `포인트가 부족합니다. 연도/반기 목표 생성을 위해 최소 ${goalCost} 포인트가 필요합니다.`,
              requiredCredits: deductResult.totalRequired,
              currentCredits: deductResult.creditBalance,
              giftPoints: deductResult.gpBalance,
            });
          }
          return res.status(402).json({ message: "포인트 차감 중 오류가 발생했습니다." });
        }
      }

      // Create AI job record for token tracking
      const job = await storage.createAiJob({
        userId,
        profileId: null,
        type: 'goal',
        status: 'processing',
        progress: 0,
        payload: { level, visionTitle, visionDescription, targetYear },
      });

      const result = await generateGoals(
        level as GoalLevel,
        { visionTitle, visionDescription, targetYear, ancestorChain, siblings },
        count
      );

      // Save token usage to the job
      const tokenUsage = result.tokenUsage ? {
        inputTokens: result.tokenUsage.inputTokens,
        outputTokens: result.tokenUsage.outputTokens,
        cacheReadTokens: result.tokenUsage.cacheReadTokens,
        cacheWriteTokens: result.tokenUsage.cacheWriteTokens,
        totalTokens: result.tokenUsage.totalTokens,
        estimatedCostCents: result.tokenUsage.estimatedCostCents,
      } : undefined;
      
      await storage.updateAiJobResult(job.id, result, tokenUsage);

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
        tokenUsage: tokenUsage,
      });
    } catch (error: any) {
      console.error("Error generating goal suggestions:", error);
      res.status(500).json({ message: "AI 목표 생성 중 오류가 발생했습니다.", details: error?.message });
    }
  });

  // Generate all goal levels at once (year, half, month, week, day)
  app.post('/api/goals/ai-suggest-all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { visionTitle, visionDescription, targetYear, visionStructure } = req.body;
      
      if (!visionTitle || !targetYear || !visionStructure) {
        return res.status(400).json({ message: "필수 데이터가 누락되었습니다." });
      }
      
      // Check rate limit
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

      // Full plan generation costs 100 points
      const planCost = 100;
      
      // Deduct with GP priority
      const deductResult = await storage.deductUserPointsWithPriority(userId, planCost, '전체 액션 플랜 생성');
      if (!deductResult.success) {
        if (deductResult.errorCode === 'insufficient_balance') {
          return res.status(402).json({ 
            message: `포인트가 부족합니다. 전체 액션 플랜 생성을 위해 ${planCost} 포인트가 필요합니다.`,
            requiredCredits: deductResult.totalRequired,
            currentCredits: deductResult.creditBalance,
            giftPoints: deductResult.gpBalance,
          });
        }
        return res.status(402).json({ message: "포인트 차감 중 오류가 발생했습니다." });
      }

      // Create AI job record
      const job = await storage.createAiJob({
        userId,
        profileId: null,
        type: 'goal',
        status: 'processing',
        progress: 0,
        payload: { type: 'full_plan', visionTitle, targetYear },
      });

      const { generateFullActionPlan } = await import('./ai');
      const result = await generateFullActionPlan(
        visionTitle,
        visionDescription || '',
        targetYear,
        visionStructure
      );

      // Save token usage
      const tokenUsage = result.tokenUsage ? {
        inputTokens: result.tokenUsage.inputTokens,
        outputTokens: result.tokenUsage.outputTokens,
        cacheReadTokens: result.tokenUsage.cacheReadTokens,
        cacheWriteTokens: result.tokenUsage.cacheWriteTokens,
        totalTokens: result.tokenUsage.totalTokens,
        estimatedCostCents: result.tokenUsage.estimatedCostCents,
      } : undefined;
      
      await storage.updateAiJobResult(job.id, result, tokenUsage);

      // Get updated user credits
      const user = await storage.getUser(userId);

      res.json({
        years: result.years,
        creditsUsed: planCost,
        remainingCredits: user?.credits,
        tokenUsage: tokenUsage,
      });
    } catch (error: any) {
      console.error("Error generating full action plan:", error);
      res.status(500).json({ message: "전체 액션 플랜 생성 중 오류가 발생했습니다.", details: error?.message });
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
      
      // Check and deduct credits if required (using GP priority)
      if (requiredCredits > 0) {
        // Deduct with GP priority (GP first, then regular credits) - includes balance check
        const deductResult = await storage.deductUserPointsWithPriority(userId, requiredCredits, 'AI 서비스 사용');
        if (!deductResult.success) {
          if (deductResult.errorCode === 'insufficient_balance') {
            return res.status(402).json({ 
              message: `포인트가 부족합니다. ${requiredCredits} 포인트가 필요합니다.`,
              requiredCredits: deductResult.totalRequired,
              currentCredits: deductResult.creditBalance,
              giftPoints: deductResult.gpBalance,
            });
          }
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

  // Cancel a job and refund points
  app.post('/api/ai/jobs/:id/cancel', isAuthenticated, async (req: any, res) => {
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
      
      // Only allow cancelling queued or processing jobs
      if (job.status !== 'queued' && job.status !== 'processing') {
        return res.status(400).json({ 
          message: "이미 완료되었거나 실패한 작업은 취소할 수 없습니다.",
          status: job.status,
        });
      }
      
      // Calculate refund amount based on job type
      let refundAmount = 0;
      const jobType = job.type as AiJobType;
      const payload = job.payload as any;
      
      if (jobType === 'analysis') {
        refundAmount = await storage.getServiceCost('analysis');
      } else if (jobType === 'essay') {
        refundAmount = await storage.getServiceCost('essay');
      } else if (jobType === 'essay_revision') {
        refundAmount = await storage.getServiceCost('essay_revision');
      } else if (jobType === 'goal' && payload?.level) {
        const isStrategicLevel = payload.level === 'year' || payload.level === 'half';
        if (isStrategicLevel) {
          refundAmount = await storage.getServiceCost('goal_strategic');
        }
      }
      
      // Mark job as failed with cancellation message
      await storage.updateAiJobError(jobId, "사용자가 작업을 취소했습니다.");
      
      // Clear from Redis processing map if present
      try {
        const { clearProcessingEntry } = await import("./jobQueue");
        await clearProcessingEntry(jobId);
      } catch (err) {
        console.error("Error clearing processing entry:", err);
      }
      
      // Refund points
      if (refundAmount > 0) {
        await storage.addUserCredits(userId, refundAmount, "작업 취소 환불");
      }
      
      const user = await storage.getUser(userId);
      
      res.json({
        success: true,
        message: "작업이 취소되었습니다.",
        refundedAmount: refundAmount,
        currentCredits: user?.credits || 0,
      });
    } catch (error: any) {
      console.error("Error cancelling job:", error);
      res.status(500).json({ message: "작업 취소 중 오류가 발생했습니다." });
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

  // Get all users (admin/staff can view all, group managers see only their group members)
  app.get('/api/admin/users', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "인증이 필요합니다." });
      
      const user = await storage.getUser(userId);
      const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';
      
      // Staff/admin can see all users
      if (isStaffOrAdmin) {
        const users = await storage.getAllUsers();
        return res.json(users);
      }
      
      // Check if user is a group manager (admin/consultant/teacher in any group)
      const managedMemberIds = await storage.getUserManagedGroupMemberIds(userId);
      if (managedMemberIds.length === 0) {
        return res.status(403).json({ message: "권한이 없습니다." });
      }
      
      // Server-side filtering: only return members of managed groups
      const allUsers = await storage.getAllUsers();
      const memberIdSet = new Set(managedMemberIds);
      const filteredUsers = allUsers.filter(u => memberIdSet.has(u.id));
      res.json(filteredUsers);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "사용자 목록 조회 중 오류가 발생했습니다." });
    }
  });

  // Admin: Create new user (회원 등록)
  const adminCreateUserSchema = z.object({
    email: z.string().email("유효한 이메일을 입력해주세요."),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    role: z.enum(['user', 'staff', 'admin']).optional().default('user'),
    credits: z.number().int().min(0).optional().default(100),
  });

  app.post('/api/admin/users', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const currentUserRole = req.userRole;
      const parsed = adminCreateUserSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ message: "유효하지 않은 입력입니다.", errors: parsed.error.errors });
      }
      
      // Staff cannot create admin users
      if (currentUserRole === 'staff' && parsed.data.role === 'admin') {
        return res.status(403).json({ message: "스태프는 관리자 계정을 생성할 수 없습니다." });
      }
      
      const user = await storage.adminCreateUser(parsed.data);
      res.status(201).json(user);
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.message === '이미 등록된 이메일입니다.') {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: "회원 등록 중 오류가 발생했습니다." });
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

  // Delete user (admin only)
  app.delete('/api/admin/users/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const targetUserId = req.params.id;
      const currentUserId = req.userId;
      
      // Prevent self-deletion
      if (targetUserId === currentUserId) {
        return res.status(400).json({ message: "자신의 계정은 삭제할 수 없습니다." });
      }
      
      // Check if target user exists
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }
      
      // Delete from Supabase Auth first
      try {
        if (supabaseAdmin) {
          const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
          if (authError) {
            console.error("Error deleting user from Supabase Auth:", authError);
            // Continue anyway - user might already be deleted from auth
          }
        }
      } catch (authError) {
        console.error("Error deleting user from Supabase Auth:", authError);
        // Continue anyway
      }
      
      // Delete from local database
      await storage.deleteUser(targetUserId);
      
      console.log(`Admin deleted user: ${targetUserId} (${targetUser.email})`);
      res.json({ success: true, message: "회원이 삭제되었습니다." });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "회원 삭제 중 오류가 발생했습니다." });
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

      // Debug log for admin visibility issues
      console.log(`[PageVisibility] User ${user.email} (role: ${user.role}) - /admin access: ${visibilityMap['/admin']}`);

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
      
      // Add points to user (regular credits for purchased points)
      await storage.addUserPoints(
        userId,
        payment.pointsToAdd,
        'purchase',
        `${payment.orderName} 결제`,
        undefined,
        payment.id
      );
      
      // Check if package has bonus points and award as GP
      let bonusGpAwarded = 0;
      if (payment.packageId) {
        const pkg = await storage.getPointPackage(payment.packageId);
        if (pkg && pkg.bonusPoints > 0) {
          await storage.addGiftPoints(userId, pkg.bonusPoints, 'bonus', {
            sourceId: payment.id,
            description: `${payment.orderName} 보너스 GP`,
          });
          bonusGpAwarded = pkg.bonusPoints;
        }
      }
      
      // Get updated user
      const user = await storage.getUser(userId);
      
      res.json({
        success: true,
        payment: {
          id: payment.id,
          amount: payment.amount,
          pointsAdded: payment.pointsToAdd,
          bonusGpAdded: bonusGpAwarded,
          method: tossResult.method,
          receiptUrl: tossResult.receipt?.url,
        },
        newBalance: user?.credits || 0,
        newGiftPoints: user?.giftPoints || 0,
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

  // ===== GIFT POINTS (GP) API ENDPOINTS =====

  // Get user's GP balance and summary
  app.get('/api/gift-points/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      const gpBalance = await storage.getUserGiftPointBalance(userId);
      const expiringIn30Days = await storage.getExpiringGiftPoints(userId, 30);
      
      // Calculate expiring amount
      const expiringAmount = expiringIn30Days.reduce((sum, entry) => sum + entry.remainingAmount, 0);
      
      res.json({
        giftPoints: gpBalance,
        credits: user?.credits || 0,
        totalBalance: gpBalance + (user?.credits || 0),
        expiringIn30Days: expiringAmount,
        expiringEntries: expiringIn30Days.map(e => ({
          id: e.id,
          amount: e.remainingAmount,
          expiresAt: e.expiresAt,
          source: e.source,
        })),
      });
    } catch (error: any) {
      console.error("Error fetching GP balance:", error);
      res.status(500).json({ message: "GP 잔액 조회 중 오류가 발생했습니다." });
    }
  });

  // Get user's GP ledger (all entries)
  app.get('/api/gift-points/ledger', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const ledger = await storage.getGiftPointLedger(userId, limit);
      res.json(ledger);
    } catch (error: any) {
      console.error("Error fetching GP ledger:", error);
      res.status(500).json({ message: "GP 원장 조회 중 오류가 발생했습니다." });
    }
  });

  // Get user's GP transaction history
  app.get('/api/gift-points/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getGiftPointTransactions(userId, limit);
      res.json(transactions);
    } catch (error: any) {
      console.error("Error fetching GP transactions:", error);
      res.status(500).json({ message: "GP 내역 조회 중 오류가 발생했습니다." });
    }
  });

  // Admin: Add GP to user
  app.post('/api/admin/gift-points/add', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.id;
      const { userId, amount, description, expiresAt } = req.body;
      
      if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ message: "유효한 사용자 ID와 금액을 입력해 주세요." });
      }
      
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }
      
      const entry = await storage.addGiftPoints(userId, amount, 'admin', {
        description: description || `관리자 지급 (by ${adminId})`,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        createdBy: adminId,
      });
      
      // Get updated balances
      const updatedUser = await storage.getUser(userId);
      
      res.json({
        success: true,
        message: `${amount.toLocaleString()} GP가 지급되었습니다.`,
        entry,
        newGiftPoints: updatedUser?.giftPoints || 0,
        newCredits: updatedUser?.credits || 0,
      });
    } catch (error: any) {
      console.error("Error adding GP:", error);
      res.status(500).json({ message: "GP 지급 중 오류가 발생했습니다." });
    }
  });

  // Admin: Get GP statistics
  app.get('/api/admin/gift-points/stats', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      // Get total GP from all users
      const totalGPResult = await db
        .select({
          total: sum(users.giftPoints),
        })
        .from(users);
      
      // Get count of users with GP > 0
      const usersWithGPResult = await db
        .select({
          count: count(),
        })
        .from(users)
        .where(gt(users.giftPoints, 0));
      
      // Get entries expiring in next 30 days
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      
      const expiringSoon = await db
        .select({
          totalRemaining: sum(giftPointLedger.remainingAmount),
        })
        .from(giftPointLedger)
        .where(and(
          eq(giftPointLedger.isExpired, 0),
          gte(giftPointLedger.expiresAt, new Date()),
          lte(giftPointLedger.expiresAt, thirtyDaysLater)
        ));
      
      // Get count of unique users with expiring GP
      const expiringUsersResult = await db
        .selectDistinct({
          userId: giftPointLedger.userId,
        })
        .from(giftPointLedger)
        .where(and(
          eq(giftPointLedger.isExpired, 0),
          gte(giftPointLedger.expiresAt, new Date()),
          lte(giftPointLedger.expiresAt, thirtyDaysLater),
          gt(giftPointLedger.remainingAmount, 0)
        ));
      
      res.json({
        totalGiftPoints: Number(totalGPResult[0]?.total) || 0,
        totalUsersWithGP: Number(usersWithGPResult[0]?.count) || 0,
        expiringIn30Days: Number(expiringSoon[0]?.totalRemaining) || 0,
        expiringIn30DaysUsers: expiringUsersResult.length,
      });
    } catch (error: any) {
      console.error("Error fetching GP stats:", error);
      res.status(500).json({ message: "GP 통계 조회 중 오류가 발생했습니다." });
    }
  });

  // Admin: Manually expire old GP entries
  app.post('/api/admin/gift-points/expire', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const expiredCount = await storage.expireOldGiftPoints();
      res.json({
        success: true,
        message: `${expiredCount}개의 만료된 GP 항목이 처리되었습니다.`,
        expiredCount,
      });
    } catch (error: any) {
      console.error("Error expiring GP:", error);
      res.status(500).json({ message: "GP 만료 처리 중 오류가 발생했습니다." });
    }
  });

  // Admin: Get user's GP ledger
  app.get('/api/admin/users/:userId/gift-points', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const [gpBalance, ledger, transactions] = await Promise.all([
        storage.getUserGiftPointBalance(userId),
        storage.getGiftPointLedger(userId, limit),
        storage.getGiftPointTransactions(userId, limit),
      ]);
      
      res.json({
        balance: gpBalance,
        ledger,
        transactions,
      });
    } catch (error: any) {
      console.error("Error fetching user GP:", error);
      res.status(500).json({ message: "사용자 GP 조회 중 오류가 발생했습니다." });
    }
  });

  // Admin: Update GP default expiration setting
  app.put('/api/admin/gift-points/settings', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.id;
      const { defaultExpirationDays } = req.body;
      
      if (!defaultExpirationDays || defaultExpirationDays < 1 || defaultExpirationDays > 3650) {
        return res.status(400).json({ message: "만료 기간은 1일에서 3650일 사이여야 합니다." });
      }
      
      await storage.upsertSystemSetting(
        'gp_default_expiration_days',
        String(defaultExpirationDays),
        '기프트 포인트 기본 만료 기간 (일)',
        adminId
      );
      
      res.json({
        success: true,
        message: `GP 기본 만료 기간이 ${defaultExpirationDays}일로 설정되었습니다.`,
        defaultExpirationDays,
      });
    } catch (error: any) {
      console.error("Error updating GP settings:", error);
      res.status(500).json({ message: "GP 설정 업데이트 중 오류가 발생했습니다." });
    }
  });

  // ===== REFERRAL ROUTES =====

  // Get user's referral info (code, stats)
  app.get('/api/referral/info', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let summary = await storage.getUserReferralSummary(userId);
      
      // Generate referral code if not exists
      if (!summary.referralCode) {
        const code = await storage.generateReferralCode(userId);
        summary = { ...summary, referralCode: code };
      }
      
      // Get GP reward settings
      const inviterGpSetting = await storage.getSystemSetting('referral_inviter_gp');
      const inviteeGpSetting = await storage.getSystemSetting('referral_invitee_gp');
      
      res.json({
        ...summary,
        referralLink: `${req.protocol}://${req.get('host')}?ref=${summary.referralCode}`,
        inviterReward: Number(inviterGpSetting) || 500,
        inviteeReward: Number(inviteeGpSetting) || 500,
      });
    } catch (error: any) {
      console.error("Error fetching referral info:", error);
      res.status(500).json({ message: "추천 정보 조회 중 오류가 발생했습니다." });
    }
  });

  // Get list of users referred by current user
  app.get('/api/referral/invitees', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const referrals = await storage.getReferralsByInviter(userId);
      res.json(referrals);
    } catch (error: any) {
      console.error("Error fetching invitees:", error);
      res.status(500).json({ message: "추천 목록 조회 중 오류가 발생했습니다." });
    }
  });

  // Claim referral reward (called after signup with referral code)
  app.post('/api/referral/claim', isAuthenticated, async (req: any, res) => {
    try {
      const inviteeId = req.user.id;
      const { referralCode } = req.body;
      
      console.log(`Referral claim attempt: inviteeId=${inviteeId}, referralCode=${referralCode}`);
      
      if (!referralCode) {
        console.log('Referral claim failed: No referral code provided');
        return res.status(400).json({ message: "추천 코드가 필요합니다." });
      }
      
      // Check if user was already referred
      const existingReferral = await storage.getReferralByInvitee(inviteeId);
      if (existingReferral) {
        console.log(`Referral claim failed: User ${inviteeId} already has referral`);
        return res.status(400).json({ message: "이미 추천 보상을 받으셨습니다." });
      }
      
      // Find inviter by referral code
      const inviter = await storage.getUserByReferralCode(referralCode);
      if (!inviter) {
        console.log(`Referral claim failed: Invalid referral code ${referralCode}`);
        return res.status(404).json({ message: "유효하지 않은 추천 코드입니다." });
      }
      
      console.log(`Found inviter: ${inviter.id} (${inviter.email}) for code ${referralCode}`);
      
      // Can't refer yourself
      if (inviter.id === inviteeId) {
        console.log('Referral claim failed: Self-referral attempt');
        return res.status(400).json({ message: "자기 자신은 추천할 수 없습니다." });
      }
      
      // Get GP reward amounts from settings
      const inviterGpSetting = await storage.getSystemSetting('referral_inviter_gp');
      const inviteeGpSetting = await storage.getSystemSetting('referral_invitee_gp');
      const inviterGp = Number(inviterGpSetting) || 500;
      const inviteeGp = Number(inviteeGpSetting) || 500;
      
      // Get GP expiration setting
      const expirationDays = await storage.getSystemSetting('gp_default_expiration_days');
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + (Number(expirationDays) || 90));
      
      // Create referral record
      const referral = await storage.createReferral(inviter.id, inviteeId, referralCode);
      
      // Award GP to both parties
      let inviterAwardSuccess = false;
      let inviteeAwardSuccess = false;
      
      if (inviterGp > 0) {
        try {
          console.log(`Awarding ${inviterGp} GP to INVITER ${inviter.id} (${inviter.email})`);
          await storage.addGiftPoints(inviter.id, inviterGp, 'referral', {
            sourceId: referral.id,
            description: `친구 추천 보상 (피추천인: ${req.user.email || '신규 사용자'})`,
            expiresAt: expirationDate,
          });
          inviterAwardSuccess = true;
          console.log(`Successfully awarded ${inviterGp} GP to INVITER ${inviter.id}`);
        } catch (inviterError) {
          console.error(`Failed to award GP to inviter ${inviter.id}:`, inviterError);
          // Continue to award invitee even if inviter fails
        }
      } else {
        inviterAwardSuccess = true; // No GP to award
      }
      
      if (inviteeGp > 0) {
        try {
          console.log(`Awarding ${inviteeGp} GP to INVITEE ${inviteeId} (${req.user.email})`);
          await storage.addGiftPoints(inviteeId, inviteeGp, 'referral', {
            sourceId: referral.id,
            description: `추천인 보상 (추천인: ${inviter.email || inviter.displayName || '회원'})`,
            expiresAt: expirationDate,
          });
          inviteeAwardSuccess = true;
          console.log(`Successfully awarded ${inviteeGp} GP to INVITEE ${inviteeId}`);
        } catch (inviteeError) {
          console.error(`Failed to award GP to invitee ${inviteeId}:`, inviteeError);
        }
      } else {
        inviteeAwardSuccess = true; // No GP to award
      }
      
      // Log partial failure warning
      if (!inviterAwardSuccess || !inviteeAwardSuccess) {
        console.warn(`Referral claim partial failure: inviter=${inviterAwardSuccess}, invitee=${inviteeAwardSuccess}`);
      }
      
      // Update referral with reward amounts
      await storage.updateReferralRewards(referral.id, inviterGp, inviteeGp);
      
      // Update user's referred_by field
      await db
        .update(users)
        .set({ referredByUserId: inviter.id })
        .where(eq(users.id, inviteeId));
      
      console.log(`Referral claim SUCCESS: inviter=${inviter.id} (+${inviterGp}GP), invitee=${inviteeId} (+${inviteeGp}GP)`);
      
      res.json({
        success: true,
        message: `추천 보상이 지급되었습니다! ${inviteeGp}GP를 받으셨습니다.`,
        gpAwarded: inviteeGp,
      });
    } catch (error: any) {
      console.error("Error claiming referral:", error);
      res.status(500).json({ message: "추천 보상 처리 중 오류가 발생했습니다." });
    }
  });

  // Admin: Get referral stats
  app.get('/api/admin/referrals/stats', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getReferralStats();
      
      // Get current reward settings
      const inviterGpSetting = await storage.getSystemSetting('referral_inviter_gp');
      const inviteeGpSetting = await storage.getSystemSetting('referral_invitee_gp');
      
      res.json({
        ...stats,
        currentSettings: {
          inviterGp: Number(inviterGpSetting) || 500,
          inviteeGp: Number(inviteeGpSetting) || 500,
        },
      });
    } catch (error: any) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ message: "추천 통계 조회 중 오류가 발생했습니다." });
    }
  });

  // Admin: Get all referrals list
  app.get('/api/admin/referrals', isAuthenticated, requireStaffOrAdmin, async (req: any, res) => {
    try {
      const allReferrals = await db
        .select({
          referral: referrals,
          inviter: {
            id: users.id,
            email: users.email,
            displayName: users.displayName,
          },
        })
        .from(referrals)
        .leftJoin(users, eq(referrals.inviterId, users.id))
        .orderBy(desc(referrals.createdAt))
        .limit(100);
      
      // Get invitee info separately
      const result = await Promise.all(
        allReferrals.map(async (r) => {
          const invitee = await storage.getUser(r.referral.inviteeId);
          return {
            ...r.referral,
            inviter: r.inviter,
            invitee: invitee ? {
              id: invitee.id,
              email: invitee.email,
              displayName: invitee.displayName,
            } : null,
          };
        })
      );
      
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching all referrals:", error);
      res.status(500).json({ message: "추천 목록 조회 중 오류가 발생했습니다." });
    }
  });

  // Admin: Update referral GP settings
  app.put('/api/admin/referrals/settings', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.id;
      const { inviterGp, inviteeGp } = req.body;
      
      if (inviterGp < 0 || inviteeGp < 0) {
        return res.status(400).json({ message: "보상 금액은 0 이상이어야 합니다." });
      }
      
      await storage.upsertSystemSetting(
        'referral_inviter_gp',
        String(inviterGp),
        '추천인에게 지급되는 GP',
        adminId
      );
      
      await storage.upsertSystemSetting(
        'referral_invitee_gp',
        String(inviteeGp),
        '피추천인에게 지급되는 GP',
        adminId
      );
      
      res.json({
        success: true,
        message: `추천 보상이 설정되었습니다. (추천인: ${inviterGp}GP, 피추천인: ${inviteeGp}GP)`,
        inviterGp,
        inviteeGp,
      });
    } catch (error: any) {
      console.error("Error updating referral settings:", error);
      res.status(500).json({ message: "추천 설정 업데이트 중 오류가 발생했습니다." });
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

  // ===== IAP (In-App Purchase) API ENDPOINTS =====

  // Get available IAP products
  app.get('/api/iap/products', async (_req, res) => {
    try {
      const products = Object.entries(IAP_PRODUCTS).map(([productId, info]) => ({
        productId,
        ...info,
        totalPoints: info.points + info.bonusPoints,
      }));
      res.json(products);
    } catch (error: any) {
      console.error("Error fetching IAP products:", error);
      res.status(500).json({ message: "상품 목록 조회 중 오류가 발생했습니다." });
    }
  });

  // Verify and process IAP purchase (Apple App Store)
  app.post('/api/iap/verify/apple', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = verifyIapSchema.parse(req.body);

      if (validatedData.platform !== 'apple') {
        return res.status(400).json({ message: "Invalid platform for Apple verification" });
      }

      // Check for duplicate transaction (idempotency)
      const existingTx = await storage.getIapTransactionByTransactionId(validatedData.transactionId);
      if (existingTx) {
        if (existingTx.status === 'verified') {
          return res.json({
            success: true,
            message: "Purchase already verified",
            pointsAwarded: existingTx.pointsAwarded,
            alreadyProcessed: true,
          });
        } else if (existingTx.status === 'failed') {
          return res.status(400).json({ 
            message: "This transaction was previously rejected",
            reason: existingTx.errorMessage,
          });
        }
      }

      // Get product info
      const productInfo = storage.getIapProductInfo(validatedData.productId);
      if (!productInfo) {
        return res.status(400).json({ message: `Unknown product: ${validatedData.productId}` });
      }

      const totalPoints = productInfo.points + productInfo.bonusPoints;

      // Create pending transaction record
      const iapTransaction = await storage.createIapTransaction({
        userId,
        platform: 'apple',
        productId: validatedData.productId,
        transactionId: validatedData.transactionId,
        originalTransactionId: validatedData.originalTransactionId || null,
        receiptData: validatedData.receiptData,
        pointsAwarded: totalPoints,
        status: 'pending',
      });

      // Verify with Apple's App Store Server API
      // In production, you would call Apple's verifyReceipt endpoint
      // For now, we'll implement a placeholder that can be replaced with actual verification
      
      const appleSharedSecret = process.env.APPLE_IAP_SHARED_SECRET;
      if (!appleSharedSecret) {
        console.warn("APPLE_IAP_SHARED_SECRET not set - using sandbox mode without verification");
      }

      // Apple verification endpoint (use sandbox for testing)
      const verifyUrl = process.env.NODE_ENV === 'production'
        ? 'https://buy.itunes.apple.com/verifyReceipt'
        : 'https://sandbox.itunes.apple.com/verifyReceipt';

      try {
        const verifyResponse = await fetch(verifyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            'receipt-data': validatedData.receiptData,
            'password': appleSharedSecret || '',
            'exclude-old-transactions': true,
          }),
        });

        const verifyResult = await verifyResponse.json();

        // Apple status codes: 0 = success
        // 21007 = sandbox receipt sent to production (retry with sandbox)
        // 21008 = production receipt sent to sandbox
        if (verifyResult.status === 0) {
          // Verify the product_id matches
          const latestReceipt = verifyResult.latest_receipt_info?.[0] || verifyResult.receipt?.in_app?.[0];
          
          if (!latestReceipt) {
            await storage.updateIapTransactionStatus(validatedData.transactionId, 'failed', {
              errorMessage: 'No receipt info found in Apple response',
              rawResponse: verifyResult,
            });
            return res.status(400).json({ message: "Invalid receipt data from Apple" });
          }
          
          // Extract Apple's canonical transaction ID (this is what we should use for uniqueness)
          const appleTransactionId = latestReceipt.transaction_id || latestReceipt.original_transaction_id;
          const appleOriginalTransactionId = latestReceipt.original_transaction_id;
          
          if (!appleTransactionId) {
            await storage.updateIapTransactionStatus(validatedData.transactionId, 'failed', {
              errorMessage: 'No transaction ID in Apple response',
              rawResponse: verifyResult,
            });
            return res.status(400).json({ message: "Invalid transaction data from Apple" });
          }
          
          // SECURITY: Check for replay attack - see if this Apple transaction was already processed
          const existingAppleTx = await storage.getIapTransactionByTransactionId(appleTransactionId);
          if (existingAppleTx && existingAppleTx.status === 'verified') {
            // This Apple receipt was already used - prevent replay attack
            return res.status(400).json({ 
              message: "This purchase has already been processed",
              alreadyProcessed: true,
            });
          }
          
          if (latestReceipt.product_id === validatedData.productId) {
            // Update transaction record with Apple's canonical transaction ID
            await storage.updateIapTransactionStatus(validatedData.transactionId, 'pending', {
              rawResponse: verifyResult,
            });
            
            // Success - award points using Apple's canonical transaction ID
            const result = await storage.processVerifiedIapPurchase(userId, appleTransactionId, validatedData.productId);
            
            await storage.updateIapTransactionStatus(validatedData.transactionId, 'verified', {
              verifiedAt: new Date(),
              rawResponse: verifyResult,
            });

            const user = await storage.getUser(userId);
            
            return res.json({
              success: true,
              message: result.message,
              pointsAwarded: result.pointsAwarded,
              newBalance: user?.credits || 0,
              appleTransactionId: appleTransactionId,
            });
          } else {
            // Product mismatch
            await storage.updateIapTransactionStatus(validatedData.transactionId, 'failed', {
              errorMessage: 'Product ID mismatch',
              rawResponse: verifyResult,
            });
            return res.status(400).json({ message: "Product verification failed - ID mismatch" });
          }
        } else if (verifyResult.status === 21007) {
          // Sandbox receipt sent to production - retry with sandbox URL
          console.log("Received sandbox receipt (21007), retrying with sandbox URL");
          
          const sandboxUrl = 'https://sandbox.itunes.apple.com/verifyReceipt';
          const sandboxResponse = await fetch(sandboxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              'receipt-data': validatedData.receiptData,
              'password': appleSharedSecret || '',
              'exclude-old-transactions': true,
            }),
          });
          
          const sandboxResult = await sandboxResponse.json();
          
          if (sandboxResult.status === 0) {
            const latestReceipt = sandboxResult.latest_receipt_info?.[0] || sandboxResult.receipt?.in_app?.[0];
            
            if (!latestReceipt) {
              await storage.updateIapTransactionStatus(validatedData.transactionId, 'failed', {
                errorMessage: 'No receipt info in sandbox response',
                rawResponse: sandboxResult,
              });
              return res.status(400).json({ message: "Invalid sandbox receipt data" });
            }
            
            // Extract Apple's canonical transaction ID
            const appleTransactionId = latestReceipt.transaction_id || latestReceipt.original_transaction_id;
            
            if (!appleTransactionId) {
              await storage.updateIapTransactionStatus(validatedData.transactionId, 'failed', {
                errorMessage: 'No transaction ID in sandbox response',
                rawResponse: sandboxResult,
              });
              return res.status(400).json({ message: "Invalid sandbox transaction data" });
            }
            
            // SECURITY: Check for replay attack
            const existingAppleTx = await storage.getIapTransactionByTransactionId(appleTransactionId);
            if (existingAppleTx && existingAppleTx.status === 'verified') {
              return res.status(400).json({ 
                message: "This purchase has already been processed",
                alreadyProcessed: true,
              });
            }
            
            if (latestReceipt.product_id === validatedData.productId) {
              const result = await storage.processVerifiedIapPurchase(userId, appleTransactionId, validatedData.productId);
              
              await storage.updateIapTransactionStatus(validatedData.transactionId, 'verified', {
                verifiedAt: new Date(),
                rawResponse: { ...sandboxResult, note: 'Sandbox receipt verified via retry' },
              });

              const user = await storage.getUser(userId);
              
              return res.json({
                success: true,
                message: result.message,
                pointsAwarded: result.pointsAwarded,
                newBalance: user?.credits || 0,
                sandbox: true,
                appleTransactionId: appleTransactionId,
              });
            }
          }
          
          // Sandbox retry also failed
          await storage.updateIapTransactionStatus(validatedData.transactionId, 'failed', {
            errorMessage: `Sandbox verification failed with status: ${sandboxResult.status}`,
            rawResponse: sandboxResult,
          });
          
          return res.status(400).json({ 
            message: "Sandbox verification failed",
            appleStatus: sandboxResult.status,
          });
        } else if (verifyResult.status === 21008) {
          // Production receipt sent to sandbox - retry with production URL
          console.log("Received production receipt (21008), retrying with production URL");
          
          const productionUrl = 'https://buy.itunes.apple.com/verifyReceipt';
          const productionResponse = await fetch(productionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              'receipt-data': validatedData.receiptData,
              'password': appleSharedSecret || '',
              'exclude-old-transactions': true,
            }),
          });
          
          const productionResult = await productionResponse.json();
          
          if (productionResult.status === 0) {
            const latestReceipt = productionResult.latest_receipt_info?.[0] || productionResult.receipt?.in_app?.[0];
            
            if (!latestReceipt) {
              await storage.updateIapTransactionStatus(validatedData.transactionId, 'failed', {
                errorMessage: 'No receipt info in production response',
                rawResponse: productionResult,
              });
              return res.status(400).json({ message: "Invalid production receipt data" });
            }
            
            // Extract Apple's canonical transaction ID
            const appleTransactionId = latestReceipt.transaction_id || latestReceipt.original_transaction_id;
            
            if (!appleTransactionId) {
              await storage.updateIapTransactionStatus(validatedData.transactionId, 'failed', {
                errorMessage: 'No transaction ID in production response',
                rawResponse: productionResult,
              });
              return res.status(400).json({ message: "Invalid production transaction data" });
            }
            
            // SECURITY: Check for replay attack
            const existingAppleTx = await storage.getIapTransactionByTransactionId(appleTransactionId);
            if (existingAppleTx && existingAppleTx.status === 'verified') {
              return res.status(400).json({ 
                message: "This purchase has already been processed",
                alreadyProcessed: true,
              });
            }
            
            if (latestReceipt.product_id === validatedData.productId) {
              const result = await storage.processVerifiedIapPurchase(userId, appleTransactionId, validatedData.productId);
              
              await storage.updateIapTransactionStatus(validatedData.transactionId, 'verified', {
                verifiedAt: new Date(),
                rawResponse: { ...productionResult, note: 'Production receipt verified via retry' },
              });

              const user = await storage.getUser(userId);
              
              return res.json({
                success: true,
                message: result.message,
                pointsAwarded: result.pointsAwarded,
                newBalance: user?.credits || 0,
                appleTransactionId: appleTransactionId,
              });
            }
          }
          
          // Production retry also failed
          await storage.updateIapTransactionStatus(validatedData.transactionId, 'failed', {
            errorMessage: `Production verification failed with status: ${productionResult.status}`,
            rawResponse: productionResult,
          });
          
          return res.status(400).json({ 
            message: "Production verification failed",
            appleStatus: productionResult.status,
          });
        }

        // Verification failed
        await storage.updateIapTransactionStatus(validatedData.transactionId, 'failed', {
          errorMessage: `Apple verification failed with status: ${verifyResult.status}`,
          rawResponse: verifyResult,
        });

        return res.status(400).json({ 
          message: "Purchase verification failed",
          appleStatus: verifyResult.status,
        });

      } catch (verifyError: any) {
        console.error("Apple verification error:", verifyError);
        
        // If Apple verification fails but we're in development, we can optionally accept it
        if (process.env.NODE_ENV !== 'production' && process.env.IAP_SKIP_VERIFICATION === 'true') {
          console.warn("Development mode: Skipping Apple verification");
          
          const result = await storage.processVerifiedIapPurchase(userId, validatedData.transactionId, validatedData.productId);
          
          await storage.updateIapTransactionStatus(validatedData.transactionId, 'verified', {
            verifiedAt: new Date(),
            rawResponse: { note: 'Development mode - verification skipped' },
          });

          const user = await storage.getUser(userId);
          
          return res.json({
            success: true,
            message: result.message,
            pointsAwarded: result.pointsAwarded,
            newBalance: user?.credits || 0,
            devMode: true,
          });
        }

        await storage.updateIapTransactionStatus(validatedData.transactionId, 'failed', {
          errorMessage: verifyError.message,
        });

        return res.status(500).json({ message: "Apple verification service error" });
      }

    } catch (error: any) {
      console.error("IAP Apple verification error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "인앱결제 검증 중 오류가 발생했습니다." });
    }
  });

  // Verify and process IAP purchase (Google Play Store)
  app.post('/api/iap/verify/google', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = verifyIapSchema.parse(req.body);

      if (validatedData.platform !== 'google') {
        return res.status(400).json({ message: "Invalid platform for Google verification" });
      }

      // Check for duplicate transaction (idempotency)
      const existingTx = await storage.getIapTransactionByTransactionId(validatedData.transactionId);
      if (existingTx) {
        if (existingTx.status === 'verified') {
          return res.json({
            success: true,
            message: "Purchase already verified",
            pointsAwarded: existingTx.pointsAwarded,
            alreadyProcessed: true,
          });
        } else if (existingTx.status === 'failed') {
          return res.status(400).json({ 
            message: "This transaction was previously rejected",
            reason: existingTx.errorMessage,
          });
        }
      }

      // Get product info
      const productInfo = storage.getIapProductInfo(validatedData.productId);
      if (!productInfo) {
        return res.status(400).json({ message: `Unknown product: ${validatedData.productId}` });
      }

      const totalPoints = productInfo.points + productInfo.bonusPoints;

      // Create pending transaction record
      const iapTransaction = await storage.createIapTransaction({
        userId,
        platform: 'google',
        productId: validatedData.productId,
        transactionId: validatedData.transactionId,
        originalTransactionId: validatedData.originalTransactionId || null,
        receiptData: validatedData.receiptData,
        pointsAwarded: totalPoints,
        status: 'pending',
      });

      // Google Play verification requires service account credentials
      // The receiptData for Google should be the purchase token
      const packageName = process.env.ANDROID_PACKAGE_NAME || 'careers.konnect';
      const googleServiceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

      if (!googleServiceAccountKey) {
        console.warn("GOOGLE_SERVICE_ACCOUNT_KEY not set");
        
        // In development, optionally skip verification
        if (process.env.NODE_ENV !== 'production' && process.env.IAP_SKIP_VERIFICATION === 'true') {
          console.warn("Development mode: Skipping Google verification");
          
          const result = await storage.processVerifiedIapPurchase(userId, validatedData.transactionId, validatedData.productId);
          
          await storage.updateIapTransactionStatus(validatedData.transactionId, 'verified', {
            verifiedAt: new Date(),
            rawResponse: { note: 'Development mode - verification skipped' },
          });

          const user = await storage.getUser(userId);
          
          return res.json({
            success: true,
            message: result.message,
            pointsAwarded: result.pointsAwarded,
            newBalance: user?.credits || 0,
            devMode: true,
          });
        }

        return res.status(500).json({ message: "Google Play verification not configured" });
      }

      try {
        // For production, you would use the Google Play Developer API
        // This requires OAuth2 with service account credentials
        // https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products/get
        
        // Parse the service account key
        const serviceAccount = JSON.parse(googleServiceAccountKey);
        
        // Get OAuth2 access token using service account
        // In a real implementation, you'd use googleapis library or similar
        // For now, we'll just accept the purchase in development
        
        // Placeholder for Google verification
        // const accessToken = await getGoogleAccessToken(serviceAccount);
        // const verifyUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${validatedData.productId}/tokens/${validatedData.receiptData}`;
        
        // Since full Google verification requires googleapis library,
        // we'll implement a simplified version
        
        console.log(`Google verification for ${validatedData.productId} - purchase token received`);
        
        // For MVP, we'll trust the purchase if we have a valid token format
        // In production, implement full Google Play Developer API verification
        if (validatedData.receiptData && validatedData.receiptData.length > 10) {
          const result = await storage.processVerifiedIapPurchase(userId, validatedData.transactionId, validatedData.productId);
          
          await storage.updateIapTransactionStatus(validatedData.transactionId, 'verified', {
            verifiedAt: new Date(),
            rawResponse: { note: 'Simplified verification - implement full API for production' },
          });

          const user = await storage.getUser(userId);
          
          return res.json({
            success: true,
            message: result.message,
            pointsAwarded: result.pointsAwarded,
            newBalance: user?.credits || 0,
          });
        }

        await storage.updateIapTransactionStatus(validatedData.transactionId, 'failed', {
          errorMessage: 'Invalid purchase token format',
        });

        return res.status(400).json({ message: "Invalid purchase token" });

      } catch (verifyError: any) {
        console.error("Google verification error:", verifyError);
        
        await storage.updateIapTransactionStatus(validatedData.transactionId, 'failed', {
          errorMessage: verifyError.message,
        });

        return res.status(500).json({ message: "Google Play verification error" });
      }

    } catch (error: any) {
      console.error("IAP Google verification error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "인앱결제 검증 중 오류가 발생했습니다." });
    }
  });

  // Get user's IAP transaction history
  app.get('/api/iap/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getIapTransactionsByUser(userId, limit);
      res.json(transactions);
    } catch (error: any) {
      console.error("Error fetching IAP history:", error);
      res.status(500).json({ message: "인앱결제 내역 조회 중 오류가 발생했습니다." });
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
          if (!redis) continue;
          const pageViews = await redis.get(pageViewKey);
          const uniqueVisitors = await redis.scard(uniqueVisitorKey);
          
          if (pageViews && Number(pageViews) > 0) {
            await storage.upsertVisitorMetrics(date, hour, Number(pageViews), 0, 0);
            await redis.del(pageViewKey);
          }
          
          // Update unique visitors count for the day (SET instead of ADD to avoid double-counting)
          if (hoursAgo === 1 && uniqueVisitors && Number(uniqueVisitors) > 0) {
            await storage.setDailyUniqueVisitors(date, Number(uniqueVisitors));
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

  // ===== K-JOBS ASSESSMENT ROUTES =====

  const kjobsInitSchema = z.object({
    profileId: z.string().uuid().optional(),
  });

  const kjobsProgressSchema = z.object({
    currentQuestion: z.number().int().min(1).max(80),
    answers: z.record(z.union([z.number(), z.string()])),
  });

  const kjobsSubmitSchema = z.object({
    answers: z.record(z.union([z.number(), z.string()])),
  });
  
  // Initialize K-JOBS assessment session
  app.post('/api/kjobs/init', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const parseResult = kjobsInitSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid request body', details: parseResult.error.issues });
      }
      const { profileId } = parseResult.data;
      
      // Check for existing incomplete assessment
      const existing = await storage.getIncompleteKjobsAssessment(userId);
      if (existing) {
        return res.json({
          assessmentId: existing.id,
          sessionId: existing.sessionId,
          currentQuestion: existing.currentQuestion,
          answers: existing.answers || {},
          resumed: true
        });
      }
      
      // Initialize K-JOBS session
      const kjobsApi = await import('./kjobs');
      const session = await kjobsApi.initSession(userId);
      
      // Create assessment record
      const assessment = await storage.createKjobsAssessment({
        userId,
        profileId: profileId || null,
        sessionId: session.sessionId,
        status: 'pending',
        currentQuestion: 1,
        answers: {},
      });
      
      res.json({
        assessmentId: assessment.id,
        sessionId: session.sessionId,
        totalQuestions: session.totalQuestions,
        currentQuestion: 1,
        resumed: false
      });
    } catch (error: any) {
      console.error('K-JOBS init error:', error);
      res.status(500).json({ error: error.message || 'Failed to initialize assessment' });
    }
  });
  
  // Get K-JOBS questions
  app.get('/api/kjobs/questions', isAuthenticated, async (_req, res) => {
    try {
      const kjobsApi = await import('./kjobs');
      const questions = await kjobsApi.getQuestions();
      res.json(questions);
    } catch (error: any) {
      console.error('K-JOBS questions error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch questions' });
    }
  });
  
  // Save K-JOBS progress
  app.patch('/api/kjobs/:assessmentId/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { assessmentId } = req.params;
      
      const parseResult = kjobsProgressSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid request body', details: parseResult.error.issues });
      }
      const { currentQuestion, answers } = parseResult.data;
      
      const assessment = await storage.getKjobsAssessment(assessmentId);
      if (!assessment || assessment.userId !== userId) {
        return res.status(404).json({ error: 'Assessment not found' });
      }
      
      // Update local record
      await storage.updateKjobsAssessment(assessmentId, {
        currentQuestion,
        answers,
        status: 'in_progress',
      });
      
      // Update K-JOBS session (optional, for resume across devices)
      if (assessment.sessionId) {
        try {
          const kjobsApi = await import('./kjobs');
          await kjobsApi.updateSessionProgress(assessment.sessionId, currentQuestion, answers);
        } catch (e) {
          console.warn('K-JOBS session sync failed:', e);
        }
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('K-JOBS progress error:', error);
      res.status(500).json({ error: error.message || 'Failed to save progress' });
    }
  });
  
  // Submit K-JOBS assessment
  app.post('/api/kjobs/:assessmentId/submit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { assessmentId } = req.params;
      
      const parseResult = kjobsSubmitSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid request body', details: parseResult.error.issues });
      }
      const { answers } = parseResult.data;
      
      const assessment = await storage.getKjobsAssessment(assessmentId);
      if (!assessment || assessment.userId !== userId) {
        return res.status(404).json({ error: 'Assessment not found' });
      }
      
      if (!assessment.sessionId) {
        return res.status(400).json({ error: 'Invalid assessment session' });
      }
      
      // Submit to K-JOBS API
      const kjobsApi = await import('./kjobs');
      const result = await kjobsApi.submitAssessment(assessment.sessionId, answers);
      
      // Save results
      await storage.updateKjobsAssessment(assessmentId, {
        status: 'completed',
        answers,
        resultId: result.resultId,
        careerDna: result.careerDna,
        scores: result.scores,
        facetScores: result.facetScores,
        keywords: result.keywords,
        recommendedJobs: result.recommendedJobs,
        growthPlan: result.growthPlan,
        completedAt: new Date(),
      });
      
      res.json({
        success: true,
        resultId: result.resultId,
        careerDna: result.careerDna,
        scores: result.scores,
        keywords: result.keywords,
        recommendedJobs: result.recommendedJobs,
        growthPlan: result.growthPlan,
      });
    } catch (error: any) {
      console.error('K-JOBS submit error:', error);
      res.status(500).json({ error: error.message || 'Failed to submit assessment' });
    }
  });
  
  // Get K-JOBS assessment result
  app.get('/api/kjobs/result/:assessmentId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { assessmentId } = req.params;
      
      const assessment = await storage.getKjobsAssessment(assessmentId);
      if (!assessment || assessment.userId !== userId) {
        return res.status(404).json({ error: 'Assessment not found' });
      }
      
      if (assessment.status !== 'completed') {
        return res.status(400).json({ error: 'Assessment not completed' });
      }
      
      res.json({
        id: assessment.id,
        careerDna: assessment.careerDna,
        scores: assessment.scores,
        facetScores: assessment.facetScores,
        keywords: assessment.keywords,
        recommendedJobs: assessment.recommendedJobs,
        growthPlan: assessment.growthPlan,
        completedAt: assessment.completedAt,
      });
    } catch (error: any) {
      console.error('K-JOBS result error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch result' });
    }
  });
  
  // Get user's latest completed K-JOBS assessment
  app.get('/api/kjobs/latest', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const assessment = await storage.getLatestCompletedKjobsAssessment(userId);
      if (!assessment) {
        return res.json(null);
      }
      
      res.json({
        id: assessment.id,
        careerDna: assessment.careerDna,
        scores: assessment.scores,
        facetScores: assessment.facetScores,
        keywords: assessment.keywords,
        recommendedJobs: assessment.recommendedJobs,
        growthPlan: assessment.growthPlan,
        completedAt: assessment.completedAt,
      });
    } catch (error: any) {
      console.error('K-JOBS latest error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch assessment' });
    }
  });

  // ==================== JOB DEMAND API (워크넷 구인수요지표) ====================
  
  // Get job demand for a single job title
  app.get('/api/job-demand/:jobTitle', async (req, res) => {
    try {
      const { jobTitle } = req.params;
      if (!jobTitle) {
        return res.status(400).json({ message: "직무명이 필요합니다." });
      }
      
      const { getJobDemand } = await import('./worknet');
      const result = await getJobDemand(decodeURIComponent(jobTitle));
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching job demand:", error);
      res.status(500).json({ message: "구인수요 조회 중 오류가 발생했습니다." });
    }
  });
  
  // Get job demand for multiple job titles
  app.post('/api/job-demand/batch', async (req, res) => {
    try {
      const { jobTitles } = req.body;
      if (!Array.isArray(jobTitles) || jobTitles.length === 0) {
        return res.status(400).json({ message: "직무 목록이 필요합니다." });
      }
      
      // Limit to 10 jobs per request
      const limitedTitles = jobTitles.slice(0, 10);
      
      const { getJobDemandBatch } = await import('./worknet');
      const resultsMap = await getJobDemandBatch(limitedTitles);
      
      // Convert Map to object for JSON response
      const results: Record<string, any> = {};
      resultsMap.forEach((value, key) => {
        results[key] = value;
      });
      
      res.json(results);
    } catch (error: any) {
      console.error("Error fetching job demand batch:", error);
      res.status(500).json({ message: "구인수요 일괄 조회 중 오류가 발생했습니다." });
    }
  });

  // ==================== INTERVIEW PREPARATION API (면접 준비) ====================
  
  // Get user's interview sessions
  app.get('/api/interview/sessions', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }
      
      const sessions = await db
        .select()
        .from(interviewSessions)
        .where(eq(interviewSessions.userId, userId))
        .orderBy(desc(interviewSessions.createdAt));
      
      res.json(sessions);
    } catch (error: any) {
      console.error("Error fetching interview sessions:", error?.message);
      console.error("Error stack:", error?.stack);
      res.status(500).json({ message: "면접 세션 조회 중 오류가 발생했습니다.", details: error?.message });
    }
  });
  
  // Get a specific interview session with questions
  app.get('/api/interview/sessions/:sessionId', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const { sessionId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }
      
      const [session] = await db
        .select()
        .from(interviewSessions)
        .where(and(
          eq(interviewSessions.id, sessionId),
          eq(interviewSessions.userId, userId)
        ));
      
      if (!session) {
        return res.status(404).json({ message: "세션을 찾을 수 없습니다." });
      }
      
      const questions = await db
        .select()
        .from(interviewQuestions)
        .where(eq(interviewQuestions.sessionId, sessionId))
        .orderBy(interviewQuestions.questionOrder);
      
      const answers = await db
        .select()
        .from(interviewAnswers)
        .where(eq(interviewAnswers.sessionId, sessionId));
      
      const answersMap: Record<string, typeof answers[0]> = {};
      answers.forEach(a => {
        answersMap[a.questionId] = a;
      });
      
      res.json({
        session,
        questions: questions.map(q => ({
          ...q,
          answer: answersMap[q.id] || null,
        })),
      });
    } catch (error: any) {
      console.error("Error fetching interview session:", error);
      res.status(500).json({ message: "면접 세션 조회 중 오류가 발생했습니다." });
    }
  });
  
  // Create a new interview session and generate questions
  app.post('/api/interview/sessions', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }
      
      const { profileId, desiredJob, sessionType = 'practice' } = req.body;
      
      if (!profileId || !desiredJob) {
        return res.status(400).json({ message: "프로필 ID와 희망직무가 필요합니다." });
      }
      
      // Get profile data
      const profile = await storage.getProfile(profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(404).json({ message: "프로필을 찾을 수 없습니다." });
      }
      
      // Get KJOBS result if exists
      const kjobsResult = await storage.getLatestCompletedKjobsAssessment(userId);
      
      // Get latest analysis if exists
      const analyses = await storage.getAnalysesByProfile(profileId);
      const latestAnalysis = analyses.length > 0 ? analyses[0] : null;
      
      // Prepare profile data for AI
      const profileData = profile.profileData as any || {};
      const profileInput = {
        strengths: profileData.strengths || [],
        weaknesses: profileData.weaknesses || [],
        experiences: profileData.experiences || [],
        skills: profileData.skills || [],
        education: profileData.education || '',
        certifications: profileData.certifications || [],
      };
      
      // Extract kjobs keywords safely
      const kjobsKeywords = kjobsResult?.keywords as any;
      
      // Generate interview questions
      const generatedQuestions = await generateInterviewQuestions({
        desiredJob,
        profileType: profile.type,
        profileData: profileInput,
        kjobsResult: kjobsResult ? {
          topStrengths: kjobsKeywords?.strengths || [],
          topWeaknesses: kjobsKeywords?.weaknesses || [],
          recommendedJobs: (kjobsResult.recommendedJobs as any[]) || [],
        } : undefined,
        analysisResult: latestAnalysis ? {
          recommendations: latestAnalysis.recommendations,
          competencies: (latestAnalysis as any).competencies,
        } : undefined,
      });
      
      // Create session
      const [newSession] = await db.insert(interviewSessions).values({
        userId,
        profileId,
        desiredJob,
        sessionType,
        status: 'active',
        totalQuestions: generatedQuestions.length,
        answeredQuestions: 0,
        profileSnapshot: profile.profileData,
        kjobsSnapshot: kjobsResult ? {
          careerDna: kjobsResult.careerDna,
          keywords: kjobsResult.keywords,
        } : null,
        analysisSnapshot: latestAnalysis ? {
          recommendations: latestAnalysis.recommendations,
        } : null,
      }).returning();
      
      // Insert questions
      const questionsToInsert = generatedQuestions.map((q, idx) => ({
        sessionId: newSession.id,
        category: q.category,
        questionOrder: idx + 1,
        question: q.question,
        questionReason: q.questionReason,
        guideText: q.guideText || null,
        relatedStrength: q.relatedStrength || null,
        relatedWeakness: q.relatedWeakness || null,
        difficulty: q.difficulty,
      }));
      
      await db.insert(interviewQuestions).values(questionsToInsert);
      
      res.json({
        session: newSession,
        questionCount: generatedQuestions.length,
      });
    } catch (error: any) {
      console.error("Error creating interview session:", error?.message || error);
      console.error("Error stack:", error?.stack);
      res.status(500).json({ 
        message: "면접 세션 생성 중 오류가 발생했습니다.",
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      });
    }
  });
  
  // Submit an answer and get feedback
  app.post('/api/interview/answers', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }
      
      const { questionId, answer } = req.body;
      
      if (!questionId || !answer) {
        return res.status(400).json({ message: "질문 ID와 답변이 필요합니다." });
      }
      
      // Get question and session
      const [question] = await db
        .select()
        .from(interviewQuestions)
        .where(eq(interviewQuestions.id, questionId));
      
      if (!question) {
        return res.status(404).json({ message: "질문을 찾을 수 없습니다." });
      }
      
      const [session] = await db
        .select()
        .from(interviewSessions)
        .where(eq(interviewSessions.id, question.sessionId));
      
      if (!session || session.userId !== userId) {
        return res.status(403).json({ message: "접근 권한이 없습니다." });
      }
      
      // Generate AI feedback
      const feedback = await generateAnswerFeedback(
        question.question,
        question.category,
        answer,
        session.desiredJob,
        {
          strengths: (session.kjobsSnapshot as any)?.keywords?.strengths || [],
          weaknesses: (session.kjobsSnapshot as any)?.keywords?.weaknesses || [],
        }
      );
      
      // Check if answer already exists
      const [existingAnswer] = await db
        .select()
        .from(interviewAnswers)
        .where(eq(interviewAnswers.questionId, questionId));
      
      let savedAnswer;
      if (existingAnswer) {
        // Update existing answer
        [savedAnswer] = await db
          .update(interviewAnswers)
          .set({
            answer,
            feedbackJson: feedback,
            understandingScore: feedback.understandingScore,
            fitScore: feedback.fitScore,
            logicScore: feedback.logicScore,
            specificityScore: feedback.specificityScore,
            overallScore: feedback.overallScore,
            improvementSuggestion: feedback.improvementSuggestion,
            improvedAnswer: feedback.improvedAnswer,
            updatedAt: new Date(),
          })
          .where(eq(interviewAnswers.id, existingAnswer.id))
          .returning();
      } else {
        // Insert new answer
        [savedAnswer] = await db.insert(interviewAnswers).values({
          questionId,
          sessionId: question.sessionId,
          userId,
          answer,
          feedbackJson: feedback,
          understandingScore: feedback.understandingScore,
          fitScore: feedback.fitScore,
          logicScore: feedback.logicScore,
          specificityScore: feedback.specificityScore,
          overallScore: feedback.overallScore,
          improvementSuggestion: feedback.improvementSuggestion,
          improvedAnswer: feedback.improvedAnswer,
        }).returning();
        
        // Update session answered count
        await db
          .update(interviewSessions)
          .set({
            answeredQuestions: session.answeredQuestions + 1,
            updatedAt: new Date(),
          })
          .where(eq(interviewSessions.id, session.id));
      }
      
      res.json({
        answer: savedAnswer,
        feedback,
      });
    } catch (error: any) {
      console.error("Error submitting interview answer:", error);
      res.status(500).json({ message: "답변 제출 중 오류가 발생했습니다." });
    }
  });
  
  // Save answer without feedback (for notes)
  app.post('/api/interview/answers/save', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }
      
      const { questionId, answer } = req.body;
      
      if (!questionId || !answer) {
        return res.status(400).json({ message: "질문 ID와 답변이 필요합니다." });
      }
      
      // Verify question exists and belongs to user
      const [question] = await db
        .select()
        .from(interviewQuestions)
        .where(eq(interviewQuestions.id, questionId));
      
      if (!question) {
        return res.status(404).json({ message: "질문을 찾을 수 없습니다." });
      }
      
      const [session] = await db
        .select()
        .from(interviewSessions)
        .where(eq(interviewSessions.id, question.sessionId));
      
      if (!session || session.userId !== userId) {
        return res.status(403).json({ message: "접근 권한이 없습니다." });
      }
      
      // Check if answer already exists
      const [existingAnswer] = await db
        .select()
        .from(interviewAnswers)
        .where(eq(interviewAnswers.questionId, questionId));
      
      let savedAnswer;
      if (existingAnswer) {
        [savedAnswer] = await db
          .update(interviewAnswers)
          .set({
            answer,
            updatedAt: new Date(),
          })
          .where(eq(interviewAnswers.id, existingAnswer.id))
          .returning();
      } else {
        [savedAnswer] = await db.insert(interviewAnswers).values({
          questionId,
          sessionId: question.sessionId,
          userId,
          answer,
        }).returning();
        
        // Update session answered count
        await db
          .update(interviewSessions)
          .set({
            answeredQuestions: session.answeredQuestions + 1,
            updatedAt: new Date(),
          })
          .where(eq(interviewSessions.id, session.id));
      }
      
      res.json({ answer: savedAnswer });
    } catch (error: any) {
      console.error("Error saving interview answer:", error);
      res.status(500).json({ message: "답변 저장 중 오류가 발생했습니다." });
    }
  });
  
  // Get AI-improved answer
  app.post('/api/interview/answers/improve', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }
      
      const { questionId, answer } = req.body;
      
      if (!questionId || !answer) {
        return res.status(400).json({ message: "질문 ID와 답변이 필요합니다." });
      }
      
      // Get question and session
      const [question] = await db
        .select()
        .from(interviewQuestions)
        .where(eq(interviewQuestions.id, questionId));
      
      if (!question) {
        return res.status(404).json({ message: "질문을 찾을 수 없습니다." });
      }
      
      const [session] = await db
        .select()
        .from(interviewSessions)
        .where(eq(interviewSessions.id, question.sessionId));
      
      if (!session || session.userId !== userId) {
        return res.status(403).json({ message: "접근 권한이 없습니다." });
      }
      
      const improvedAnswerText = await improveAnswer(
        question.question,
        answer,
        session.desiredJob
      );
      
      res.json({ improvedAnswer: improvedAnswerText });
    } catch (error: any) {
      console.error("Error improving answer:", error);
      res.status(500).json({ message: "답변 첨삭 중 오류가 발생했습니다." });
    }
  });
  
  // Toggle bookmark on answer
  app.patch('/api/interview/answers/:answerId/bookmark', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const { answerId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }
      
      const [answer] = await db
        .select()
        .from(interviewAnswers)
        .where(eq(interviewAnswers.id, answerId));
      
      if (!answer || answer.userId !== userId) {
        return res.status(404).json({ message: "답변을 찾을 수 없습니다." });
      }
      
      const [updated] = await db
        .update(interviewAnswers)
        .set({
          isBookmarked: answer.isBookmarked === 1 ? 0 : 1,
          updatedAt: new Date(),
        })
        .where(eq(interviewAnswers.id, answerId))
        .returning();
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error toggling bookmark:", error);
      res.status(500).json({ message: "북마크 토글 중 오류가 발생했습니다." });
    }
  });
  
  // Get all bookmarked answers
  app.get('/api/interview/bookmarks', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }
      
      const bookmarkedAnswers = await db
        .select({
          answer: interviewAnswers,
          question: interviewQuestions,
          session: interviewSessions,
        })
        .from(interviewAnswers)
        .innerJoin(interviewQuestions, eq(interviewAnswers.questionId, interviewQuestions.id))
        .innerJoin(interviewSessions, eq(interviewAnswers.sessionId, interviewSessions.id))
        .where(and(
          eq(interviewAnswers.userId, userId),
          eq(interviewAnswers.isBookmarked, 1)
        ))
        .orderBy(desc(interviewAnswers.updatedAt));
      
      res.json(bookmarkedAnswers);
    } catch (error: any) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "북마크 조회 중 오류가 발생했습니다." });
    }
  });
  
  // Complete an interview session
  app.patch('/api/interview/sessions/:sessionId/complete', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const { sessionId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }
      
      const [session] = await db
        .select()
        .from(interviewSessions)
        .where(eq(interviewSessions.id, sessionId));
      
      if (!session || session.userId !== userId) {
        return res.status(404).json({ message: "세션을 찾을 수 없습니다." });
      }
      
      const [updated] = await db
        .update(interviewSessions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(interviewSessions.id, sessionId))
        .returning();
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error completing session:", error);
      res.status(500).json({ message: "세션 완료 처리 중 오류가 발생했습니다." });
    }
  });

  // ===== VIDEO INTERVIEW ROUTES (화상 면접) =====
  
  // Import audio processing functions (for STT)
  const { speechToText, ensureCompatibleFormat } = await import('./replit_integrations/audio/client');
  const { videoInterviewRecordings } = await import('@shared/schema');
  
  // Get all video recordings for a session
  app.get('/api/interview/video-recordings/:sessionId', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const { sessionId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }
      
      const recordings = await db
        .select()
        .from(videoInterviewRecordings)
        .where(and(
          eq(videoInterviewRecordings.sessionId, sessionId),
          eq(videoInterviewRecordings.userId, userId)
        ))
        .orderBy(videoInterviewRecordings.questionOrder);
      
      res.json(recordings);
    } catch (error: any) {
      console.error("Error fetching video recordings:", error);
      res.status(500).json({ message: "녹화 기록을 불러오는 중 오류가 발생했습니다." });
    }
  });
  
  // Get single video recording
  app.get('/api/interview/video-recordings/:sessionId/:questionId', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const { sessionId, questionId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }
      
      const [recording] = await db
        .select()
        .from(videoInterviewRecordings)
        .where(and(
          eq(videoInterviewRecordings.sessionId, sessionId),
          eq(videoInterviewRecordings.questionId, questionId),
          eq(videoInterviewRecordings.userId, userId)
        ));
      
      res.json(recording || null);
    } catch (error: any) {
      console.error("Error fetching video recording:", error);
      res.status(500).json({ message: "녹화 기록을 불러오는 중 오류가 발생했습니다." });
    }
  });
  
  // Create/update video recording with audio transcription
  app.post('/api/interview/video-recordings', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const { sessionId, questionId, questionOrder, audioBase64, durationSeconds } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }
      
      if (!sessionId || !questionId || !audioBase64) {
        return res.status(400).json({ message: "필수 정보가 누락되었습니다." });
      }
      
      // Validate audio size (max 15MB base64 = ~11MB actual)
      const MAX_BASE64_SIZE = 15 * 1024 * 1024;
      if (audioBase64.length > MAX_BASE64_SIZE) {
        return res.status(413).json({ message: "녹음 파일이 너무 큽니다. 10MB 이하로 녹음해주세요." });
      }
      
      // Check if recording already exists
      const [existing] = await db
        .select()
        .from(videoInterviewRecordings)
        .where(and(
          eq(videoInterviewRecordings.sessionId, sessionId),
          eq(videoInterviewRecordings.questionId, questionId),
          eq(videoInterviewRecordings.userId, userId)
        ));
      
      // Perform STT transcription
      let sttText = '';
      let sttStatus = 'pending';
      let sttError = null;
      
      try {
        const audioBuffer = Buffer.from(audioBase64, 'base64');
        const { buffer: convertedBuffer, format } = await ensureCompatibleFormat(audioBuffer);
        sttText = await speechToText(convertedBuffer, format);
        sttStatus = 'completed';
      } catch (sttErr: any) {
        console.error('STT Error:', sttErr);
        sttStatus = 'failed';
        sttError = sttErr.message || 'STT 변환에 실패했습니다.';
      }
      
      if (existing) {
        // Update existing recording
        const [updated] = await db
          .update(videoInterviewRecordings)
          .set({
            sttText,
            sttStatus,
            sttError,
            durationSeconds: durationSeconds || 0,
            updatedAt: new Date(),
          })
          .where(eq(videoInterviewRecordings.id, existing.id))
          .returning();
        
        res.json(updated);
      } else {
        // Create new recording
        const [created] = await db
          .insert(videoInterviewRecordings)
          .values({
            sessionId,
            questionId,
            userId,
            questionOrder: questionOrder || 0,
            sttText,
            sttStatus,
            sttError,
            durationSeconds: durationSeconds || 0,
          })
          .returning();
        
        res.json(created);
      }
    } catch (error: any) {
      console.error("Error creating video recording:", error);
      res.status(500).json({ message: "녹화 저장 중 오류가 발생했습니다." });
    }
  });
  
  // Get AI feedback on video recording (transcribed text)
  app.post('/api/interview/video-recordings/:recordingId/feedback', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const { recordingId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }
      
      // Get the recording
      const [recording] = await db
        .select()
        .from(videoInterviewRecordings)
        .where(and(
          eq(videoInterviewRecordings.id, recordingId),
          eq(videoInterviewRecordings.userId, userId)
        ));
      
      if (!recording) {
        return res.status(404).json({ message: "녹화 기록을 찾을 수 없습니다." });
      }
      
      if (!recording.sttText || recording.sttStatus !== 'completed') {
        return res.status(400).json({ message: "음성 인식이 완료되지 않았습니다." });
      }
      
      // Get the session and question
      const [session] = await db
        .select()
        .from(interviewSessions)
        .where(eq(interviewSessions.id, recording.sessionId));
      
      const [question] = await db
        .select()
        .from(interviewQuestions)
        .where(eq(interviewQuestions.id, recording.questionId));
      
      if (!session || !question) {
        return res.status(404).json({ message: "세션 또는 질문을 찾을 수 없습니다." });
      }
      
      // Generate AI feedback
      const feedback = await generateAnswerFeedback(
        question.question,
        question.category || 'basic',
        recording.sttText,
        session.desiredJob
      );
      
      // Update the recording with feedback
      const [updated] = await db
        .update(videoInterviewRecordings)
        .set({
          feedbackJson: feedback,
          understandingScore: feedback.understandingScore,
          fitScore: feedback.fitScore,
          logicScore: feedback.logicScore,
          specificityScore: feedback.specificityScore,
          overallScore: feedback.overallScore,
          improvementSuggestion: feedback.improvementSuggestion,
          improvedAnswer: feedback.improvedAnswer,
          updatedAt: new Date(),
        })
        .where(eq(videoInterviewRecordings.id, recordingId))
        .returning();
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error generating video feedback:", error);
      res.status(500).json({ message: "AI 피드백 생성 중 오류가 발생했습니다." });
    }
  });
  
  // Toggle bookmark on video recording
  app.patch('/api/interview/video-recordings/:recordingId/bookmark', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const { recordingId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }
      
      const [recording] = await db
        .select()
        .from(videoInterviewRecordings)
        .where(and(
          eq(videoInterviewRecordings.id, recordingId),
          eq(videoInterviewRecordings.userId, userId)
        ));
      
      if (!recording) {
        return res.status(404).json({ message: "녹화 기록을 찾을 수 없습니다." });
      }
      
      const [updated] = await db
        .update(videoInterviewRecordings)
        .set({
          isBookmarked: recording.isBookmarked === 1 ? 0 : 1,
          updatedAt: new Date(),
        })
        .where(eq(videoInterviewRecordings.id, recordingId))
        .returning();
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error toggling bookmark:", error);
      res.status(500).json({ message: "북마크 토글 중 오류가 발생했습니다." });
    }
  });
  
  // Update user note on video recording
  app.patch('/api/interview/video-recordings/:recordingId/note', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const { recordingId } = req.params;
      const { note } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }
      
      const [recording] = await db
        .select()
        .from(videoInterviewRecordings)
        .where(and(
          eq(videoInterviewRecordings.id, recordingId),
          eq(videoInterviewRecordings.userId, userId)
        ));
      
      if (!recording) {
        return res.status(404).json({ message: "녹화 기록을 찾을 수 없습니다." });
      }
      
      const [updated] = await db
        .update(videoInterviewRecordings)
        .set({
          userNote: note,
          updatedAt: new Date(),
        })
        .where(eq(videoInterviewRecordings.id, recordingId))
        .returning();
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating note:", error);
      res.status(500).json({ message: "메모 저장 중 오류가 발생했습니다." });
    }
  });

  // ===== Groups API Routes =====
  
  // Get all groups (admin only)
  app.get('/api/admin/groups', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "인증이 필요합니다." });
      
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
        return res.status(403).json({ message: "관리자 권한이 필요합니다." });
      }
      
      const groups = await storage.getAllGroups();
      res.json(groups);
    } catch (error: any) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "그룹 목록 조회 중 오류가 발생했습니다." });
    }
  });
  
  // Create a new group (admin only)
  app.post('/api/admin/groups', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "인증이 필요합니다." });
      
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
        return res.status(403).json({ message: "관리자 권한이 필요합니다." });
      }
      
      const { name, description, iconEmoji, color } = req.body;
      if (!name) {
        return res.status(400).json({ message: "그룹 이름은 필수입니다." });
      }
      
      const group = await storage.createGroup({
        name,
        description: description || null,
        iconEmoji: iconEmoji || '👥',
        color: color || '#3B82F6',
        ownerId: userId,
      });
      
      res.json(group);
    } catch (error: any) {
      console.error("Error creating group:", error);
      res.status(500).json({ message: "그룹 생성 중 오류가 발생했습니다." });
    }
  });
  
  // Get single group with stats
  app.get('/api/admin/groups/:groupId', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "인증이 필요합니다." });
      
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
        // Check if user is a member of this group
        const isMember = await storage.isGroupMember(req.params.groupId, userId);
        if (!isMember) {
          return res.status(403).json({ message: "권한이 없습니다." });
        }
      }
      
      const group = await storage.getGroupWithStats(req.params.groupId);
      if (!group) {
        return res.status(404).json({ message: "그룹을 찾을 수 없습니다." });
      }
      
      res.json(group);
    } catch (error: any) {
      console.error("Error fetching group:", error);
      res.status(500).json({ message: "그룹 조회 중 오류가 발생했습니다." });
    }
  });
  
  // Update group
  app.patch('/api/admin/groups/:groupId', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "인증이 필요합니다." });
      
      const user = await storage.getUser(userId);
      const group = await storage.getGroup(req.params.groupId);
      
      if (!group) {
        return res.status(404).json({ message: "그룹을 찾을 수 없습니다." });
      }
      
      // Check admin or group admin
      const memberRole = await storage.getGroupMemberRole(req.params.groupId, userId);
      const isAdmin = user?.role === 'admin' || user?.role === 'staff';
      const isGroupAdmin = memberRole === 'admin';
      
      if (!isAdmin && !isGroupAdmin) {
        return res.status(403).json({ message: "권한이 없습니다." });
      }
      
      const { name, description, iconEmoji, color, isActive } = req.body;
      const updatedGroup = await storage.updateGroup(req.params.groupId, {
        name: name || group.name,
        description: description !== undefined ? description : group.description,
        iconEmoji: iconEmoji || group.iconEmoji,
        color: color || group.color,
        isActive: isActive !== undefined ? isActive : group.isActive,
      });
      
      res.json(updatedGroup);
    } catch (error: any) {
      console.error("Error updating group:", error);
      res.status(500).json({ message: "그룹 수정 중 오류가 발생했습니다." });
    }
  });
  
  // Delete group (admin only)
  app.delete('/api/admin/groups/:groupId', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "인증이 필요합니다." });
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "관리자 권한이 필요합니다." });
      }
      
      await storage.deleteGroup(req.params.groupId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting group:", error);
      res.status(500).json({ message: "그룹 삭제 중 오류가 발생했습니다." });
    }
  });
  
  // Get group members
  app.get('/api/admin/groups/:groupId/members', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "인증이 필요합니다." });
      
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin' || user?.role === 'staff';
      
      if (!isAdmin) {
        // Check if user is a group manager (admin/consultant/teacher)
        const memberRole = await storage.getGroupMemberRole(req.params.groupId, userId);
        if (!memberRole || memberRole === 'member') {
          return res.status(403).json({ message: "권한이 없습니다." });
        }
      }
      
      const members = await storage.getGroupMembers(req.params.groupId);
      res.json(members);
    } catch (error: any) {
      console.error("Error fetching group members:", error);
      res.status(500).json({ message: "그룹 멤버 조회 중 오류가 발생했습니다." });
    }
  });
  
  // Add member to group
  app.post('/api/admin/groups/:groupId/members', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "인증이 필요합니다." });
      
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin' || user?.role === 'staff';
      
      if (!isAdmin) {
        const memberRole = await storage.getGroupMemberRole(req.params.groupId, userId);
        if (!memberRole || memberRole === 'member') {
          return res.status(403).json({ message: "권한이 없습니다." });
        }
      }
      
      const { userEmail, role } = req.body;
      if (!userEmail) {
        return res.status(400).json({ message: "사용자 이메일은 필수입니다." });
      }
      
      // Find user by email
      const targetUser = await storage.getUserByEmail(userEmail);
      if (!targetUser) {
        return res.status(404).json({ message: "해당 이메일의 사용자를 찾을 수 없습니다." });
      }
      
      // Check if already a member
      const isAlreadyMember = await storage.isGroupMember(req.params.groupId, targetUser.id);
      if (isAlreadyMember) {
        return res.status(400).json({ message: "이미 그룹 멤버입니다." });
      }
      
      const member = await storage.addGroupMember({
        groupId: req.params.groupId,
        userId: targetUser.id,
        role: role || 'member',
        invitedBy: userId,
      });
      
      res.json(member);
    } catch (error: any) {
      console.error("Error adding group member:", error);
      res.status(500).json({ message: "멤버 추가 중 오류가 발생했습니다." });
    }
  });
  
  // Remove member from group
  app.delete('/api/admin/groups/:groupId/members/:memberId', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "인증이 필요합니다." });
      
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin' || user?.role === 'staff';
      
      if (!isAdmin) {
        const memberRole = await storage.getGroupMemberRole(req.params.groupId, userId);
        if (!memberRole || memberRole === 'member') {
          return res.status(403).json({ message: "권한이 없습니다." });
        }
      }
      
      await storage.removeGroupMember(req.params.groupId, req.params.memberId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error removing group member:", error);
      res.status(500).json({ message: "멤버 제거 중 오류가 발생했습니다." });
    }
  });
  
  // Update member role
  app.patch('/api/admin/groups/:groupId/members/:memberId/role', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "인증이 필요합니다." });
      
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin' || user?.role === 'staff';
      
      if (!isAdmin) {
        const memberRole = await storage.getGroupMemberRole(req.params.groupId, userId);
        if (memberRole !== 'admin') {
          return res.status(403).json({ message: "그룹관리자만 역할을 변경할 수 있습니다." });
        }
      }
      
      const { role } = req.body;
      if (!role || !['admin', 'consultant', 'teacher', 'member'].includes(role)) {
        return res.status(400).json({ message: "유효하지 않은 역할입니다." });
      }
      
      const member = await storage.updateGroupMemberRole(req.params.groupId, req.params.memberId, role);
      res.json(member);
    } catch (error: any) {
      console.error("Error updating member role:", error);
      res.status(500).json({ message: "역할 변경 중 오류가 발생했습니다." });
    }
  });
  
  // Get group member analyses (for group admins/owners)
  app.get('/api/admin/groups/:groupId/analyses', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "인증이 필요합니다." });
      
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin' || user?.role === 'staff';
      
      if (!isAdmin) {
        const memberRole = await storage.getGroupMemberRole(req.params.groupId, userId);
        if (!memberRole || memberRole === 'member') {
          return res.status(403).json({ message: "그룹 관리자만 분석 결과를 볼 수 있습니다." });
        }
      }
      
      const analyses = await storage.getGroupMemberAnalyses(req.params.groupId);
      res.json(analyses);
    } catch (error: any) {
      console.error("Error fetching group analyses:", error);
      res.status(500).json({ message: "분석 결과 조회 중 오류가 발생했습니다." });
    }
  });
  
  // Get user's groups
  app.get('/api/my-groups', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "인증이 필요합니다." });
      
      const groups = await storage.getUserGroups(userId);
      res.json(groups);
    } catch (error: any) {
      console.error("Error fetching user groups:", error);
      res.status(500).json({ message: "그룹 목록 조회 중 오류가 발생했습니다." });
    }
  });

  // Get user's managed groups (where user is admin/consultant/teacher)
  app.get('/api/my-managed-groups', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "인증이 필요합니다." });
      
      const groups = await storage.getUserManagedGroups(userId);
      res.json(groups);
    } catch (error: any) {
      console.error("Error fetching managed groups:", error);
      res.status(500).json({ message: "관리 그룹 목록 조회 중 오류가 발생했습니다." });
    }
  });

  // ===== GROUP DASHBOARD API =====
  
  // Get group info (for group managers)
  app.get('/api/groups/:groupId', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "인증이 필요합니다." });
      
      const user = await storage.getUser(userId);
      const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';
      
      if (!isStaffOrAdmin) {
        const memberRole = await storage.getGroupMemberRole(req.params.groupId, userId);
        if (!memberRole || memberRole === 'member') {
          return res.status(403).json({ message: "권한이 없습니다." });
        }
      }
      
      const group = await storage.getGroup(req.params.groupId);
      if (!group) {
        return res.status(404).json({ message: "그룹을 찾을 수 없습니다." });
      }
      res.json(group);
    } catch (error: any) {
      console.error("Error fetching group:", error);
      res.status(500).json({ message: "그룹 조회 중 오류가 발생했습니다." });
    }
  });
  
  // Get group statistics (for group managers)
  app.get('/api/groups/:groupId/stats', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "인증이 필요합니다." });
      
      const user = await storage.getUser(userId);
      const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';
      
      if (!isStaffOrAdmin) {
        const memberRole = await storage.getGroupMemberRole(req.params.groupId, userId);
        if (!memberRole || memberRole === 'member') {
          return res.status(403).json({ message: "권한이 없습니다." });
        }
      }
      
      const stats = await storage.getGroupStats(req.params.groupId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching group stats:", error);
      res.status(500).json({ message: "그룹 통계 조회 중 오류가 발생했습니다." });
    }
  });
  
  // Get detailed group statistics (for group managers)
  app.get('/api/groups/:groupId/stats/detailed', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "인증이 필요합니다." });
      
      const user = await storage.getUser(userId);
      const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';
      
      if (!isStaffOrAdmin) {
        const memberRole = await storage.getGroupMemberRole(req.params.groupId, userId);
        if (!memberRole || memberRole === 'member') {
          return res.status(403).json({ message: "권한이 없습니다." });
        }
      }
      
      const detailedStats = await storage.getGroupDetailedStats(req.params.groupId);
      res.json(detailedStats);
    } catch (error: any) {
      console.error("Error fetching detailed group stats:", error);
      res.status(500).json({ message: "상세 통계 조회 중 오류가 발생했습니다." });
    }
  });
  
  // Get profile field statistics for a specific profile type (for group managers)
  app.get('/api/groups/:groupId/stats/fields/:profileType', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "인증이 필요합니다." });
      
      const user = await storage.getUser(userId);
      const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';
      
      if (!isStaffOrAdmin) {
        const memberRole = await storage.getGroupMemberRole(req.params.groupId, userId);
        if (!memberRole || memberRole === 'member') {
          return res.status(403).json({ message: "권한이 없습니다." });
        }
      }
      
      const fieldStats = await storage.getGroupProfileFieldStats(req.params.groupId, req.params.profileType);
      res.json(fieldStats);
    } catch (error: any) {
      console.error("Error fetching profile field stats:", error);
      res.status(500).json({ message: "프로필 필드 통계 조회 중 오류가 발생했습니다." });
    }
  });
  
  // Get group member progress (for group managers)
  app.get('/api/groups/:groupId/members/progress', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "인증이 필요합니다." });
      
      const user = await storage.getUser(userId);
      const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';
      
      if (!isStaffOrAdmin) {
        const memberRole = await storage.getGroupMemberRole(req.params.groupId, userId);
        if (!memberRole || memberRole === 'member') {
          return res.status(403).json({ message: "권한이 없습니다." });
        }
      }
      
      const memberProgress = await storage.getGroupMemberProgress(req.params.groupId);
      res.json(memberProgress);
    } catch (error: any) {
      console.error("Error fetching member progress:", error);
      res.status(500).json({ message: "멤버 진행현황 조회 중 오류가 발생했습니다." });
    }
  });
  
  // Get group member detail (for group managers)
  app.get('/api/groups/:groupId/members/:memberId/detail', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "인증이 필요합니다." });
      
      const user = await storage.getUser(userId);
      const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';
      
      if (!isStaffOrAdmin) {
        const memberRole = await storage.getGroupMemberRole(req.params.groupId, userId);
        if (!memberRole || memberRole === 'member') {
          return res.status(403).json({ message: "권한이 없습니다." });
        }
      }
      
      // Check if the member is in the group
      const isMember = await storage.isGroupMember(req.params.groupId, req.params.memberId);
      if (!isMember) {
        return res.status(404).json({ message: "그룹 멤버를 찾을 수 없습니다." });
      }
      
      const memberDetail = await storage.getGroupMemberDetail(req.params.memberId);
      res.json(memberDetail);
    } catch (error: any) {
      console.error("Error fetching member detail:", error);
      res.status(500).json({ message: "멤버 상세정보 조회 중 오류가 발생했습니다." });
    }
  });

  // Admin: Get specific user's groups
  app.get('/api/admin/users/:userId/groups', isAuthenticated, requireStaffOrAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const groups = await storage.getUserGroups(userId);
      res.json(groups);
    } catch (error: any) {
      console.error("Error fetching user groups:", error);
      res.status(500).json({ message: "사용자 그룹 조회 중 오류가 발생했습니다." });
    }
  });

  // Admin: Add user to group
  const addUserToGroupSchema = z.object({
    role: z.enum(['member', 'admin', 'consultant', 'teacher']).optional().default('member'),
  });

  app.post('/api/admin/users/:userId/groups/:groupId', isAuthenticated, requireStaffOrAdmin, async (req, res) => {
    try {
      const { userId, groupId } = req.params;
      const parsed = addUserToGroupSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ message: "유효하지 않은 입력입니다.", errors: parsed.error.errors });
      }
      
      const isMember = await storage.isGroupMember(groupId, userId);
      if (isMember) {
        return res.status(409).json({ message: "이미 그룹에 속해 있습니다." });
      }
      
      const member = await storage.addGroupMember({ groupId, userId, role: parsed.data.role });
      res.status(201).json(member);
    } catch (error: any) {
      console.error("Error adding user to group:", error);
      res.status(500).json({ message: "그룹에 사용자 추가 중 오류가 발생했습니다." });
    }
  });

  // Admin: Remove user from group
  app.delete('/api/admin/users/:userId/groups/:groupId', isAuthenticated, requireStaffOrAdmin, async (req, res) => {
    try {
      const { userId, groupId } = req.params;
      
      const isMember = await storage.isGroupMember(groupId, userId);
      if (!isMember) {
        return res.status(404).json({ message: "그룹 멤버십을 찾을 수 없습니다." });
      }
      
      await storage.removeGroupMember(groupId, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error removing user from group:", error);
      res.status(500).json({ message: "그룹에서 사용자 제거 중 오류가 발생했습니다." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
