import {
  users,
  profiles,
  careerAnalyses,
  personalEssays,
  kompassGoals,
  careers,
  careerStats,
  aiJobs,
  visitorMetrics,
  pageSettings,
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
  type CareerStats,
  type UpdateUserIdentity,
  type AiJob,
  type InsertAiJob,
  type AiJobStatus,
  type UserRole,
  type VisitorMetrics,
  type InsertVisitorMetrics,
  type PageSettings,
  type InsertPageSettings,
  DEFAULT_PAGE_CONFIGS,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, and, inArray, sql, count, gte, lte, sum } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserCredits(userId: string, credits: number): Promise<void>;
  deductUserCredits(userId: string, amount: number): Promise<boolean>;
  updateUserIdentity(userId: string, data: UpdateUserIdentity): Promise<User>;

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
  
  // Career Stats
  getCareerStats(key: string): Promise<CareerStats | undefined>;
  upsertCareerStats(key: string, data: any): Promise<CareerStats>;

  // AI Jobs
  createAiJob(job: InsertAiJob): Promise<AiJob>;
  getAiJob(id: string): Promise<AiJob | undefined>;
  getAiJobsByUser(userId: string): Promise<AiJob[]>;
  getPendingJobs(type?: string): Promise<AiJob[]>;
  updateAiJobStatus(id: string, status: AiJobStatus, progress?: number): Promise<AiJob>;
  updateAiJobResult(id: string, result: any): Promise<AiJob>;
  updateAiJobError(id: string, error: string): Promise<AiJob>;

  // Admin functions
  getAllUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserRole(userId: string, role: UserRole): Promise<User>;
  updateUserCreditsAdmin(userId: string, credits: number): Promise<User>;
  getSystemStats(): Promise<{
    totalUsers: number;
    totalProfiles: number;
    totalAnalyses: number;
    totalEssays: number;
    pendingJobs: number;
    processingJobs: number;
  }>;
  getAiJobStats(): Promise<{
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    avgTokensPerJob: number;
    jobsByType: Record<string, number>;
  }>;

  // Visitor Metrics
  upsertVisitorMetrics(date: string, hour: number, pageViews: number, uniqueVisitors: number, newUsers?: number): Promise<VisitorMetrics>;
  getVisitorMetricsByDateRange(startDate: string, endDate: string): Promise<VisitorMetrics[]>;
  getTodayMetrics(): Promise<{ pageViews: number; uniqueVisitors: number; newUsers: number }>;
  getTrafficOverview(): Promise<{
    today: { pageViews: number; uniqueVisitors: number; newUsers: number };
    yesterday: { pageViews: number; uniqueVisitors: number; newUsers: number };
    last7Days: { pageViews: number; uniqueVisitors: number; newUsers: number };
    last30Days: { pageViews: number; uniqueVisitors: number; newUsers: number };
    dailyData: Array<{ date: string; pageViews: number; uniqueVisitors: number }>;
  }>;

  // Page Settings (Role-based visibility)
  getAllPageSettings(): Promise<PageSettings[]>;
  getPageSettings(slug: string): Promise<PageSettings | undefined>;
  upsertPageSettings(settings: InsertPageSettings): Promise<PageSettings>;
  updatePageAllowedRoles(slug: string, allowedRoles: string[] | null, updatedBy: string): Promise<PageSettings>;
  resetPageSettings(slug: string): Promise<void>;
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

  async updateUserIdentity(userId: string, data: UpdateUserIdentity): Promise<User> {
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.birthDate !== undefined) {
      updateData.birthDate = data.birthDate ? (typeof data.birthDate === 'string' ? new Date(data.birthDate) : data.birthDate) : null;
    }
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
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

  // Career Stats implementation
  async getCareerStats(key: string): Promise<CareerStats | undefined> {
    const [stats] = await db
      .select()
      .from(careerStats)
      .where(eq(careerStats.statsKey, key));
    return stats;
  }

  async upsertCareerStats(key: string, data: any): Promise<CareerStats> {
    const [stats] = await db
      .insert(careerStats)
      .values({ statsKey: key, statsData: data })
      .onConflictDoUpdate({
        target: careerStats.statsKey,
        set: { statsData: data, computedAt: new Date() },
      })
      .returning();
    return stats;
  }

  // AI Jobs implementation
  async createAiJob(jobData: InsertAiJob): Promise<AiJob> {
    const [job] = await db
      .insert(aiJobs)
      .values(jobData)
      .returning();
    return job;
  }

  async getAiJob(id: string): Promise<AiJob | undefined> {
    const [job] = await db
      .select()
      .from(aiJobs)
      .where(eq(aiJobs.id, id));
    return job;
  }

  async getAiJobsByUser(userId: string): Promise<AiJob[]> {
    return await db
      .select()
      .from(aiJobs)
      .where(eq(aiJobs.userId, userId))
      .orderBy(desc(aiJobs.queuedAt));
  }

  async getPendingJobs(type?: string): Promise<AiJob[]> {
    const statusFilter = inArray(aiJobs.status, ['queued', 'processing']);
    if (type) {
      return await db
        .select()
        .from(aiJobs)
        .where(and(statusFilter, eq(aiJobs.type, type)))
        .orderBy(aiJobs.queuedAt);
    }
    return await db
      .select()
      .from(aiJobs)
      .where(statusFilter)
      .orderBy(aiJobs.queuedAt);
  }

  async updateAiJobStatus(id: string, status: AiJobStatus, progress?: number): Promise<AiJob> {
    const updateData: Record<string, any> = { status };
    if (progress !== undefined) {
      updateData.progress = progress;
    }
    if (status === 'processing') {
      updateData.startedAt = new Date();
    }
    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
    }
    
    const [job] = await db
      .update(aiJobs)
      .set(updateData)
      .where(eq(aiJobs.id, id))
      .returning();
    return job;
  }

  async updateAiJobResult(id: string, result: any): Promise<AiJob> {
    const [job] = await db
      .update(aiJobs)
      .set({ 
        result, 
        status: 'completed' as AiJobStatus, 
        progress: 100,
        completedAt: new Date() 
      })
      .where(eq(aiJobs.id, id))
      .returning();
    return job;
  }

  async updateAiJobError(id: string, error: string): Promise<AiJob> {
    const [job] = await db
      .update(aiJobs)
      .set({ 
        error, 
        status: 'failed' as AiJobStatus,
        completedAt: new Date() 
      })
      .where(eq(aiJobs.id, id))
      .returning();
    return job;
  }

  // Admin functions
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserCreditsAdmin(userId: string, credits: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ credits, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    totalProfiles: number;
    totalAnalyses: number;
    totalEssays: number;
    pendingJobs: number;
    processingJobs: number;
  }> {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [profileCount] = await db.select({ count: count() }).from(profiles);
    const [analysisCount] = await db.select({ count: count() }).from(careerAnalyses);
    const [essayCount] = await db.select({ count: count() }).from(personalEssays);
    const [pendingCount] = await db.select({ count: count() }).from(aiJobs).where(eq(aiJobs.status, 'pending'));
    const [processingCount] = await db.select({ count: count() }).from(aiJobs).where(eq(aiJobs.status, 'processing'));

    return {
      totalUsers: userCount.count,
      totalProfiles: profileCount.count,
      totalAnalyses: analysisCount.count,
      totalEssays: essayCount.count,
      pendingJobs: pendingCount.count,
      processingJobs: processingCount.count,
    };
  }

  async getAiJobStats(): Promise<{
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    avgTokensPerJob: number;
    jobsByType: Record<string, number>;
  }> {
    const allJobs = await db.select().from(aiJobs);
    const completed = allJobs.filter(j => j.status === 'completed');
    const failed = allJobs.filter(j => j.status === 'failed');
    
    // Calculate average tokens (assuming result contains token info)
    let totalTokens = 0;
    let tokenCount = 0;
    for (const job of completed) {
      if (job.result && typeof job.result === 'object') {
        const result = job.result as any;
        if (result.inputTokens) {
          totalTokens += result.inputTokens;
          tokenCount++;
        }
        if (result.outputTokens) {
          totalTokens += result.outputTokens;
        }
      }
    }
    
    // Count jobs by type
    const jobsByType: Record<string, number> = {};
    for (const job of allJobs) {
      jobsByType[job.type] = (jobsByType[job.type] || 0) + 1;
    }

    return {
      totalJobs: allJobs.length,
      completedJobs: completed.length,
      failedJobs: failed.length,
      avgTokensPerJob: tokenCount > 0 ? Math.round(totalTokens / tokenCount) : 0,
      jobsByType,
    };
  }

  // Visitor Metrics implementation
  async upsertVisitorMetrics(date: string, hour: number, pageViews: number, uniqueVisitors: number, newUsers: number = 0): Promise<VisitorMetrics> {
    const [metrics] = await db
      .insert(visitorMetrics)
      .values({ date, hour, pageViews, uniqueVisitors, newUsers })
      .onConflictDoUpdate({
        target: [visitorMetrics.date, visitorMetrics.hour],
        set: { 
          pageViews: sql`${visitorMetrics.pageViews} + ${pageViews}`,
          uniqueVisitors: sql`${visitorMetrics.uniqueVisitors} + ${uniqueVisitors}`,
          newUsers: sql`${visitorMetrics.newUsers} + ${newUsers}`,
          updatedAt: new Date(),
        },
      })
      .returning();
    return metrics;
  }

  async getVisitorMetricsByDateRange(startDate: string, endDate: string): Promise<VisitorMetrics[]> {
    return db
      .select()
      .from(visitorMetrics)
      .where(and(
        gte(visitorMetrics.date, startDate),
        lte(visitorMetrics.date, endDate)
      ))
      .orderBy(desc(visitorMetrics.date), visitorMetrics.hour);
  }

  async getTodayMetrics(): Promise<{ pageViews: number; uniqueVisitors: number; newUsers: number }> {
    const today = new Date().toISOString().split('T')[0];
    const metrics = await db
      .select()
      .from(visitorMetrics)
      .where(eq(visitorMetrics.date, today));
    
    return metrics.reduce((acc, m) => ({
      pageViews: acc.pageViews + m.pageViews,
      uniqueVisitors: acc.uniqueVisitors + m.uniqueVisitors,
      newUsers: acc.newUsers + m.newUsers,
    }), { pageViews: 0, uniqueVisitors: 0, newUsers: 0 });
  }

  async getTrafficOverview(): Promise<{
    today: { pageViews: number; uniqueVisitors: number; newUsers: number };
    yesterday: { pageViews: number; uniqueVisitors: number; newUsers: number };
    last7Days: { pageViews: number; uniqueVisitors: number; newUsers: number };
    last30Days: { pageViews: number; uniqueVisitors: number; newUsers: number };
    dailyData: Array<{ date: string; pageViews: number; uniqueVisitors: number }>;
  }> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const allMetrics = await db
      .select()
      .from(visitorMetrics)
      .where(gte(visitorMetrics.date, thirtyDaysAgo))
      .orderBy(visitorMetrics.date, visitorMetrics.hour);

    const aggregateByDates = (metrics: VisitorMetrics[], dates: string[]) => {
      return metrics
        .filter(m => dates.includes(m.date))
        .reduce((acc, m) => ({
          pageViews: acc.pageViews + m.pageViews,
          uniqueVisitors: acc.uniqueVisitors + m.uniqueVisitors,
          newUsers: acc.newUsers + m.newUsers,
        }), { pageViews: 0, uniqueVisitors: 0, newUsers: 0 });
    };

    // Group by date for daily data
    const dailyMap = new Map<string, { pageViews: number; uniqueVisitors: number }>();
    for (const m of allMetrics) {
      const existing = dailyMap.get(m.date) || { pageViews: 0, uniqueVisitors: 0 };
      dailyMap.set(m.date, {
        pageViews: existing.pageViews + m.pageViews,
        uniqueVisitors: existing.uniqueVisitors + m.uniqueVisitors,
      });
    }
    
    const dailyData = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get date ranges
    const last7Dates: string[] = [];
    const last30Dates: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      last30Dates.push(d);
      if (i < 7) last7Dates.push(d);
    }

    return {
      today: aggregateByDates(allMetrics, [today]),
      yesterday: aggregateByDates(allMetrics, [yesterday]),
      last7Days: aggregateByDates(allMetrics, last7Dates),
      last30Days: aggregateByDates(allMetrics, last30Dates),
      dailyData,
    };
  }

  // Page Settings
  async getAllPageSettings(): Promise<PageSettings[]> {
    const dbSettings = await db.select().from(pageSettings);
    
    // Merge with defaults for pages not in DB
    const result: PageSettings[] = [];
    const slugsInDb = new Set(dbSettings.map(s => s.slug));
    
    // Add DB records
    result.push(...dbSettings);
    
    // Add defaults for pages not in DB
    for (const [slug, config] of Object.entries(DEFAULT_PAGE_CONFIGS)) {
      if (!slugsInDb.has(slug)) {
        result.push({
          slug,
          title: config.title,
          description: null,
          defaultRoles: config.defaultRoles,
          allowedRoles: null,
          isLocked: config.isLocked ? 1 : 0,
          updatedBy: null,
          updatedAt: null,
        });
      }
    }
    
    return result;
  }

  async getPageSettings(slug: string): Promise<PageSettings | undefined> {
    const [setting] = await db.select().from(pageSettings).where(eq(pageSettings.slug, slug));
    
    if (setting) return setting;
    
    // Return default if exists
    const config = DEFAULT_PAGE_CONFIGS[slug];
    if (config) {
      return {
        slug,
        title: config.title,
        description: null,
        defaultRoles: config.defaultRoles,
        allowedRoles: null,
        isLocked: config.isLocked ? 1 : 0,
        updatedBy: null,
        updatedAt: null,
      };
    }
    
    return undefined;
  }

  async upsertPageSettings(settings: InsertPageSettings): Promise<PageSettings> {
    const [result] = await db
      .insert(pageSettings)
      .values(settings)
      .onConflictDoUpdate({
        target: pageSettings.slug,
        set: {
          title: settings.title,
          description: settings.description,
          defaultRoles: settings.defaultRoles,
          allowedRoles: settings.allowedRoles,
          isLocked: settings.isLocked,
          updatedBy: settings.updatedBy,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async updatePageAllowedRoles(slug: string, allowedRoles: string[] | null, updatedBy: string): Promise<PageSettings> {
    // First check if page exists in DB
    const [existing] = await db.select().from(pageSettings).where(eq(pageSettings.slug, slug));
    
    if (existing) {
      // Update existing
      const [result] = await db
        .update(pageSettings)
        .set({ allowedRoles, updatedBy, updatedAt: new Date() })
        .where(eq(pageSettings.slug, slug))
        .returning();
      return result;
    } else {
      // Insert from defaults
      const config = DEFAULT_PAGE_CONFIGS[slug];
      if (!config) {
        throw new Error(`Page ${slug} not found`);
      }
      
      const [result] = await db
        .insert(pageSettings)
        .values({
          slug,
          title: config.title,
          defaultRoles: config.defaultRoles,
          allowedRoles,
          isLocked: config.isLocked ? 1 : 0,
          updatedBy,
        })
        .returning();
      return result;
    }
  }

  async resetPageSettings(slug: string): Promise<void> {
    // Delete from DB to reset to defaults
    await db.delete(pageSettings).where(eq(pageSettings.slug, slug));
  }
}

export const storage = new DatabaseStorage();
