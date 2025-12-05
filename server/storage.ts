import {
  users,
  profiles,
  careerAnalyses,
  personalEssays,
  kompassGoals,
  careers,
  magicLinkTokens,
  type User,
  type UpsertUser,
  type Profile,
  type InsertProfile,
  type CareerAnalysis,
  type InsertCareerAnalysis,
  type PersonalEssay,
  type InsertPersonalEssay,
  type KompassGoal,
  type InsertKompassGoal,
  type Career,
  type MagicLinkToken,
  type InsertMagicLinkToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt, isNull, ilike } from "drizzle-orm";

export interface IStorage {
  // ===== User Operations =====
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(email: string, passwordHash?: string | null): Promise<User>;
  updateUserCredits(userId: string, credits: number): Promise<void>;
  deductUserCredits(userId: string, amount: number): Promise<boolean>;
  verifyUserEmail(userId: string): Promise<void>;

  // ===== Magic Link Token Operations =====
  createMagicLinkToken(data: InsertMagicLinkToken): Promise<MagicLinkToken>;
  getMagicLinkToken(token: string): Promise<MagicLinkToken | undefined>;
  markMagicLinkUsed(id: string): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;

  // ===== Profile Operations =====
  getProfilesByUser(userId: string): Promise<Profile[]>;
  getProfile(id: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, data: Partial<InsertProfile>): Promise<Profile>;
  deleteProfile(id: string): Promise<void>;

  // ===== Career Analysis Operations =====
  getAnalysesByProfile(profileId: string): Promise<CareerAnalysis[]>;
  getAnalysis(id: string): Promise<CareerAnalysis | undefined>;
  createAnalysis(analysis: InsertCareerAnalysis): Promise<CareerAnalysis>;
  deleteAnalysis(id: string): Promise<void>;

  // ===== Personal Essay Operations =====
  getEssaysByProfile(profileId: string): Promise<PersonalEssay[]>;
  getEssay(id: string): Promise<PersonalEssay | undefined>;
  createEssay(essay: InsertPersonalEssay): Promise<PersonalEssay>;
  updateEssay(id: string, data: Partial<InsertPersonalEssay>): Promise<PersonalEssay>;
  deleteEssay(id: string): Promise<void>;

  // ===== Kompass Goal Operations =====
  getKompassByProfile(profileId: string): Promise<KompassGoal[]>;
  getKompass(id: string): Promise<KompassGoal | undefined>;
  createKompass(kompass: InsertKompassGoal): Promise<KompassGoal>;
  updateKompass(id: string, data: Partial<InsertKompassGoal>): Promise<KompassGoal>;
  deleteKompass(id: string): Promise<void>;

  // ===== Career Data Operations =====
  getAllCareers(): Promise<Career[]>;
  getCareerById(id: string): Promise<Career | undefined>;
  searchCareers(query: string): Promise<Career[]>;
  getCareersByCategory(category: string): Promise<Career[]>;
}

export class DatabaseStorage implements IStorage {
  // ===== User Operations =====
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(email: string, passwordHash?: string | null): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash })
      .returning();
    return user;
  }

  async updateUserCredits(userId: string, credits: number): Promise<void> {
    await db
      .update(users)
      .set({ credits })
      .where(eq(users.id, userId));
  }

  async deductUserCredits(userId: string, amount: number): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || user.credits < amount) {
      return false;
    }
    await this.updateUserCredits(userId, user.credits - amount);
    return true;
  }

  async verifyUserEmail(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.id, userId));
  }

  // ===== Magic Link Token Operations =====
  async createMagicLinkToken(data: InsertMagicLinkToken): Promise<MagicLinkToken> {
    const [token] = await db
      .insert(magicLinkTokens)
      .values(data)
      .returning();
    return token;
  }

  async getMagicLinkToken(token: string): Promise<MagicLinkToken | undefined> {
    const [result] = await db
      .select()
      .from(magicLinkTokens)
      .where(and(
        eq(magicLinkTokens.token, token),
        isNull(magicLinkTokens.usedAt)
      ));
    return result;
  }

  async markMagicLinkUsed(id: string): Promise<void> {
    await db
      .update(magicLinkTokens)
      .set({ usedAt: new Date() })
      .where(eq(magicLinkTokens.id, id));
  }

  async cleanupExpiredTokens(): Promise<void> {
    // Retry logic for transient DNS errors in production
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await db
          .delete(magicLinkTokens)
          .where(lt(magicLinkTokens.expiresAt, new Date()));
        return;
      } catch (error: any) {
        const isTransient = error.message?.includes('EAI_AGAIN') || 
                           error.message?.includes('ENOTFOUND') ||
                           error.message?.includes('ECONNREFUSED');
        if (isTransient && attempt < maxRetries) {
          console.log(`Retry ${attempt}/${maxRetries} for token cleanup after DNS error`);
          await new Promise(r => setTimeout(r, 2000 * attempt)); // Exponential backoff
          continue;
        }
        throw error;
      }
    }
  }

  // ===== Profile Operations =====
  async getProfilesByUser(userId: string): Promise<Profile[]> {
    return await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .orderBy(desc(profiles.updatedAt));
  }

  async getProfile(id: string): Promise<Profile | undefined> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, id));
    return profile;
  }

  async createProfile(profileData: InsertProfile): Promise<Profile> {
    const [profile] = await db
      .insert(profiles)
      .values(profileData)
      .returning();
    return profile;
  }

  async updateProfile(id: string, data: Partial<InsertProfile>): Promise<Profile> {
    const [profile] = await db
      .update(profiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    return profile;
  }

  async deleteProfile(id: string): Promise<void> {
    await db.delete(profiles).where(eq(profiles.id, id));
  }

  // ===== Career Analysis Operations =====
  async getAnalysesByProfile(profileId: string): Promise<CareerAnalysis[]> {
    return await db
      .select()
      .from(careerAnalyses)
      .where(eq(careerAnalyses.profileId, profileId))
      .orderBy(desc(careerAnalyses.analysisDate));
  }

  async getAnalysis(id: string): Promise<CareerAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(careerAnalyses)
      .where(eq(careerAnalyses.id, id));
    return analysis;
  }

  async createAnalysis(analysisData: InsertCareerAnalysis): Promise<CareerAnalysis> {
    const [analysis] = await db
      .insert(careerAnalyses)
      .values(analysisData)
      .returning();
    return analysis;
  }

  async deleteAnalysis(id: string): Promise<void> {
    await db.delete(careerAnalyses).where(eq(careerAnalyses.id, id));
  }

  // ===== Personal Essay Operations =====
  async getEssaysByProfile(profileId: string): Promise<PersonalEssay[]> {
    return await db
      .select()
      .from(personalEssays)
      .where(eq(personalEssays.profileId, profileId))
      .orderBy(desc(personalEssays.updatedAt));
  }

  async getEssay(id: string): Promise<PersonalEssay | undefined> {
    const [essay] = await db
      .select()
      .from(personalEssays)
      .where(eq(personalEssays.id, id));
    return essay;
  }

  async createEssay(essayData: InsertPersonalEssay): Promise<PersonalEssay> {
    const [essay] = await db
      .insert(personalEssays)
      .values(essayData)
      .returning();
    return essay;
  }

  async updateEssay(id: string, data: Partial<InsertPersonalEssay>): Promise<PersonalEssay> {
    const [essay] = await db
      .update(personalEssays)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(personalEssays.id, id))
      .returning();
    return essay;
  }

  async deleteEssay(id: string): Promise<void> {
    await db.delete(personalEssays).where(eq(personalEssays.id, id));
  }

  // ===== Kompass Goal Operations =====
  async getKompassByProfile(profileId: string): Promise<KompassGoal[]> {
    return await db
      .select()
      .from(kompassGoals)
      .where(eq(kompassGoals.profileId, profileId))
      .orderBy(desc(kompassGoals.updatedAt));
  }

  async getKompass(id: string): Promise<KompassGoal | undefined> {
    const [kompass] = await db
      .select()
      .from(kompassGoals)
      .where(eq(kompassGoals.id, id));
    return kompass;
  }

  async createKompass(kompassData: InsertKompassGoal): Promise<KompassGoal> {
    const [kompass] = await db
      .insert(kompassGoals)
      .values(kompassData)
      .returning();
    return kompass;
  }

  async updateKompass(id: string, data: Partial<InsertKompassGoal>): Promise<KompassGoal> {
    const [kompass] = await db
      .update(kompassGoals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(kompassGoals.id, id))
      .returning();
    return kompass;
  }

  async deleteKompass(id: string): Promise<void> {
    await db.delete(kompassGoals).where(eq(kompassGoals.id, id));
  }

  // ===== Career Data Operations =====
  async getAllCareers(): Promise<Career[]> {
    return await db.select().from(careers);
  }

  async getCareerById(id: string): Promise<Career | undefined> {
    const [career] = await db.select().from(careers).where(eq(careers.id, id));
    return career;
  }

  async searchCareers(query: string): Promise<Career[]> {
    return await db
      .select()
      .from(careers)
      .where(ilike(careers.name, `%${query}%`));
  }

  async getCareersByCategory(category: string): Promise<Career[]> {
    return await db
      .select()
      .from(careers)
      .where(eq(careers.category, category));
  }
}

export const storage = new DatabaseStorage();
