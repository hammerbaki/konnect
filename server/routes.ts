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

export async function registerRoutes(app: Express): Promise<Server> {
  // ===== Setup Auth Middleware =====
  await setupAuth(app);

  // ===== Auth Routes =====
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ===== Profile Routes =====
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
      // Verify ownership
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

  // ===== Career Analysis Routes =====
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

  // ===== Personal Essay Routes =====
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

  // ===== Kompass Goal Routes =====
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

  const httpServer = createServer(app);
  return httpServer;
}
