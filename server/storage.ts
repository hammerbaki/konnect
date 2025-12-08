import {
  users,
  profiles,
  careerAnalyses,
  personalEssays,
  kompassGoals,
  careers,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserCredits(userId: string, credits: number): Promise<void>;
  deductUserCredits(userId: string, amount: number): Promise<boolean>;

  getProfilesByUser(userId: string): Promise<Profile[]>;
  getProfile(id: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, data: Partial<InsertProfile>): Promise<Profile>;
  deleteProfile(id: string): Promise<void>;

  getAnalysesByProfile(profileId: string): Promise<CareerAnalysis[]>;
  getAnalysis(id: string): Promise<CareerAnalysis | undefined>;
  createAnalysis(analysis: InsertCareerAnalysis): Promise<CareerAnalysis>;
  deleteAnalysis(id: string): Promise<void>;

  getEssaysByProfile(profileId: string): Promise<PersonalEssay[]>;
  getEssay(id: string): Promise<PersonalEssay | undefined>;
  createEssay(essay: InsertPersonalEssay): Promise<PersonalEssay>;
  updateEssay(id: string, data: Partial<InsertPersonalEssay>): Promise<PersonalEssay>;
  deleteEssay(id: string): Promise<void>;

  getKompassByProfile(profileId: string): Promise<KompassGoal[]>;
  getKompass(id: string): Promise<KompassGoal | undefined>;
  createKompass(kompass: InsertKompassGoal): Promise<KompassGoal>;
  updateKompass(id: string, data: Partial<InsertKompassGoal>): Promise<KompassGoal>;
  deleteKompass(id: string): Promise<void>;

  getAllCareers(): Promise<Career[]>;
  getCareerById(id: string): Promise<Career | undefined>;
  searchCareers(query: string): Promise<Career[]>;
  getCareersByCategory(category: string): Promise<Career[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
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
