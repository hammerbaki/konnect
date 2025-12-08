import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertProfileSchema,
  insertCareerAnalysisSchema,
  insertPersonalEssaySchema,
  insertKompassGoalSchema,
} from "@shared/schema";
import { z } from "zod";
import { generateCareerAnalysis, generatePersonalEssay } from "./ai";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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
      const userId = req.user.claims.sub;
      const profiles = await storage.getProfilesByUser(userId);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });

  app.get('/api/profiles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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

  app.patch('/api/kompass/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const profile = await storage.getProfile(req.params.profileId);
      
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.credits < 1) {
        return res.status(402).json({ message: "크레딧이 부족합니다. 분석을 생성하려면 최소 1 크레딧이 필요합니다." });
      }

      const deducted = await storage.deductUserCredits(userId, 1);
      if (!deducted) {
        return res.status(402).json({ message: "크레딧 차감 중 오류가 발생했습니다." });
      }

      const result = await generateCareerAnalysis(profile);

      const analysis = await storage.createAnalysis({
        profileId: req.params.profileId,
        summary: result.summary,
        stats: result.stats,
        chartData: result.chartData,
        recommendations: result.recommendations,
        aiRawResponse: result.rawResponse,
      });

      await storage.updateProfile(req.params.profileId, {
        lastAnalyzed: new Date(),
      });

      res.status(201).json(analysis);
    } catch (error) {
      console.error("Error generating analysis:", error);
      res.status(500).json({ message: "AI 분석 생성 중 오류가 발생했습니다." });
    }
  });

  app.post('/api/profiles/:profileId/generate-essay', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfile(req.params.profileId);
      
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { category, topic, context } = req.body;
      if (!category || !topic) {
        return res.status(400).json({ message: "카테고리와 주제는 필수입니다." });
      }

      const user = await storage.getUser(userId);
      if (!user || user.credits < 1) {
        return res.status(402).json({ message: "크레딧이 부족합니다. 자기소개서 생성을 위해 최소 1 크레딧이 필요합니다." });
      }

      const deducted = await storage.deductUserCredits(userId, 1);
      if (!deducted) {
        return res.status(402).json({ message: "크레딧 차감 중 오류가 발생했습니다." });
      }

      const result = await generatePersonalEssay(
        profile.type,
        category,
        topic,
        context
      );

      const essay = await storage.createEssay({
        profileId: req.params.profileId,
        category,
        topic,
        title: result.title,
        content: result.content,
        draftVersion: 1,
      });

      res.status(201).json(essay);
    } catch (error) {
      console.error("Error generating essay:", error);
      res.status(500).json({ message: "자기소개서 생성 중 오류가 발생했습니다." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
