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
  type AiJobType,
} from "@shared/schema";
import { z } from "zod";
import { generateCareerAnalysis, generatePersonalEssay, generateGoals, type GoalLevel, checkAIRateLimit } from "./ai";
import { createRateLimitMiddleware, checkRedisConnection } from "./rateLimiter";
import { startWorker, submitJobWithFastPath } from "./aiWorker";
import { getQueueStats, estimateProgress } from "./jobQueue";

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
  
  // Check Redis connection for logging purposes
  const redisConnected = await checkRedisConnection();
  if (redisConnected) {
    console.log("✓ Redis connected - global rate limiting enabled");
  } else {
    console.log("⚠ Redis not connected - using in-memory rate limiting fallback");
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
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

  // Redeem token code for credits
  app.post('/api/redeem', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { code } = req.body;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: "유효한 코드를 입력해 주세요." });
      }
      
      const normalizedCode = code.trim().toUpperCase();
      
      // Simple demo codes - in production, this would check a database table
      let creditsToAdd = 0;
      if (normalizedCode === "DEMO" || normalizedCode === "KONNECT") {
        creditsToAdd = 500;
      } else if (normalizedCode.startsWith("KNC-") && normalizedCode.length >= 8) {
        creditsToAdd = 500;
      } else if (normalizedCode.length >= 10) {
        creditsToAdd = 1000;
      } else {
        return res.status(400).json({ message: "유효하지 않은 코드입니다. 다시 확인해 주세요." });
      }
      
      // Get current user credits and add new ones
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }
      
      const newCredits = (user.credits || 0) + creditsToAdd;
      await storage.updateUserCredits(userId, newCredits);
      
      res.json({ 
        message: `${creditsToAdd} 크레딧이 충전되었습니다.`,
        creditsAdded: creditsToAdd,
        totalCredits: newCredits,
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
      if (!user || user.credits < 100) {
        return res.status(402).json({ message: "크레딧이 부족합니다. 분석을 생성하려면 최소 100 크레딧이 필요합니다." });
      }

      const deducted = await storage.deductUserCredits(userId, 100);
      if (!deducted) {
        return res.status(402).json({ message: "크레딧 차감 중 오류가 발생했습니다." });
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
      if (!user || user.credits < 100) {
        return res.status(402).json({ message: "크레딧이 부족합니다. 자기소개서 생성을 위해 최소 100 크레딧이 필요합니다." });
      }

      const deducted = await storage.deductUserCredits(userId, 100);
      if (!deducted) {
        return res.status(402).json({ message: "크레딧 차감 중 오류가 발생했습니다." });
      }

      // Submit job to queue instead of processing directly
      const { jobId, immediate } = await submitJobWithFastPath(
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

      res.status(202).json({ 
        jobId,
        immediate,
        message: immediate ? "자기소개서 생성을 시작합니다." : "대기열에 추가되었습니다.",
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

      // Strategic levels (year, half) require 100 credits
      const isStrategicLevel = level === 'year' || level === 'half';
      
      if (isStrategicLevel) {
        const user = await storage.getUser(userId);
        if (!user || user.credits < 100) {
          return res.status(402).json({ 
            message: "크레딧이 부족합니다. 연도/반기 목표 생성을 위해 최소 100 크레딧이 필요합니다.",
            requiredCredits: 100,
            currentCredits: user?.credits || 0,
          });
        }

        const deducted = await storage.deductUserCredits(userId, 100);
        if (!deducted) {
          return res.status(402).json({ message: "크레딧 차감 중 오류가 발생했습니다." });
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
        creditsUsed: isStrategicLevel ? 100 : 0,
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
      
      // Check credits for expensive operations (100 credits each)
      if (type === 'analysis' || type === 'essay') {
        const user = await storage.getUser(userId);
        if (!user || user.credits < 100) {
          return res.status(402).json({ 
            message: "크레딧이 부족합니다.",
            requiredCredits: 100,
            currentCredits: user?.credits || 0,
          });
        }
        
        const deducted = await storage.deductUserCredits(userId, 100);
        if (!deducted) {
          return res.status(402).json({ message: "크레딧 차감 중 오류가 발생했습니다." });
        }
      }
      
      // Essay revision costs 30 credits
      if (type === 'essay_revision') {
        const user = await storage.getUser(userId);
        if (!user || user.credits < 30) {
          return res.status(402).json({ 
            message: "크레딧이 부족합니다. 수정을 위해 30 크레딧이 필요합니다.",
            requiredCredits: 30,
            currentCredits: user?.credits || 0,
          });
        }
        
        const deducted = await storage.deductUserCredits(userId, 30);
        if (!deducted) {
          return res.status(402).json({ message: "크레딧 차감 중 오류가 발생했습니다." });
        }
      }
      
      // For goals, check if strategic level requires credits (100 credits)
      if (type === 'goal' && payload?.level) {
        const isStrategicLevel = payload.level === 'year' || payload.level === 'half';
        if (isStrategicLevel) {
          const user = await storage.getUser(userId);
          if (!user || user.credits < 100) {
            return res.status(402).json({ 
              message: "크레딧이 부족합니다. 연도/반기 목표 생성을 위해 최소 100 크레딧이 필요합니다.",
              requiredCredits: 100,
              currentCredits: user?.credits || 0,
            });
          }
          
          const deducted = await storage.deductUserCredits(userId, 100);
          if (!deducted) {
            return res.status(402).json({ message: "크레딧 차감 중 오류가 발생했습니다." });
          }
        }
      }
      
      const result = await submitJobWithFastPath(
        userId,
        profileId || null,
        type as AiJobType,
        payload
      );
      
      res.json({
        jobId: result.jobId,
        immediate: result.immediate,
        status: result.immediate ? 'processing' : 'queued',
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
  
  // Start the AI worker
  startWorker();

  const httpServer = createServer(app);
  return httpServer;
}
