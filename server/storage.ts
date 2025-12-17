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
  userSessions,
  pageSettings,
  pointPackages,
  payments,
  pointTransactions,
  servicePricing,
  notifications,
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
  type UpdateUserSettings,
  type AiJob,
  type InsertAiJob,
  type AiJobStatus,
  type UserRole,
  type VisitorMetrics,
  type InsertVisitorMetrics,
  type UserSession,
  type InsertUserSession,
  type PageSettings,
  type InsertPageSettings,
  type PointPackage,
  type InsertPointPackage,
  type Payment,
  type InsertPayment,
  type PaymentStatus,
  type PointTransaction,
  type InsertPointTransaction,
  type ServicePricing,
  type InsertServicePricing,
  type SystemSettings,
  type InsertSystemSettings,
  type RedemptionCode,
  type CreateRedemptionCode,
  type RedemptionHistory,
  type Notification,
  type InsertNotification,
  systemSettings,
  redemptionCodes,
  redemptionHistory,
  DEFAULT_PAGE_CONFIGS,
  NEW_PAGE_DEFAULT_ROLES,
  DEFAULT_SERVICE_PRICING,
  DEFAULT_SYSTEM_SETTINGS,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, and, inArray, sql, count, gte, lte, sum, isNull } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserCredits(userId: string, credits: number): Promise<void>;
  deductUserCredits(userId: string, amount: number): Promise<boolean>;
  updateUserIdentity(userId: string, data: UpdateUserIdentity): Promise<User>;
  updateUserSettings(userId: string, settings: UpdateUserSettings): Promise<User>;
  getUserSettings(userId: string): Promise<{ phone: string | null; marketingConsent: boolean; emailNotifications: boolean; pushNotifications: boolean } | undefined>;

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
  getRecentAiJobsForAdmin(limit?: number): Promise<Array<AiJob & { user: { email: string | null; displayName: string | null } | null }>>;

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

  // User Sessions (Login/Logout tracking)
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  updateUserSessionLogout(sessionId: string): Promise<UserSession>;
  getActiveSessionByUser(userId: string): Promise<UserSession | undefined>;
  getUserSessionHistory(limit?: number): Promise<Array<UserSession & { user: User | null }>>;
  getUserSessionsByUser(userId: string, limit?: number): Promise<UserSession[]>;

  // Page Settings (Role-based visibility)
  getAllPageSettings(): Promise<PageSettings[]>;
  getPageSettings(slug: string): Promise<PageSettings | undefined>;
  upsertPageSettings(settings: InsertPageSettings): Promise<PageSettings>;
  updatePageAllowedRoles(slug: string, allowedRoles: string[] | null, updatedBy: string): Promise<PageSettings>;
  resetPageSettings(slug: string): Promise<void>;

  // Point Packages
  getActivePointPackages(): Promise<PointPackage[]>;
  getAllPointPackages(): Promise<PointPackage[]>;
  getPointPackage(id: string): Promise<PointPackage | undefined>;
  createPointPackage(pkg: InsertPointPackage): Promise<PointPackage>;
  updatePointPackage(id: string, data: Partial<InsertPointPackage>): Promise<PointPackage>;

  // Payments
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentByOrderId(orderId: string): Promise<Payment | undefined>;
  updatePaymentStatus(id: string, status: PaymentStatus, data?: Partial<Payment>): Promise<Payment>;
  getPaymentsByUser(userId: string): Promise<Payment[]>;

  // Point Transactions
  createPointTransaction(transaction: InsertPointTransaction): Promise<PointTransaction>;
  getPointTransactionsByUser(userId: string, limit?: number): Promise<PointTransaction[]>;
  addUserPoints(userId: string, amount: number, type: string, description: string, createdBy?: string, paymentId?: string): Promise<PointTransaction>;

  // Service Pricing
  getAllServicePricing(): Promise<ServicePricing[]>;
  getServicePricing(id: string): Promise<ServicePricing | undefined>;
  upsertServicePricing(pricing: InsertServicePricing): Promise<ServicePricing>;
  updateServicePricing(id: string, data: Partial<ServicePricing>, updatedBy: string): Promise<ServicePricing>;
  getServiceCost(serviceType: string): Promise<number>;

  // System Settings
  getSystemSetting(key: string): Promise<string | undefined>;
  upsertSystemSetting(key: string, value: string, description: string | null, updatedBy: string | null): Promise<SystemSettings>;
  getAllSystemSettings(): Promise<SystemSettings[]>;

  // Redemption Codes
  getAllRedemptionCodes(): Promise<RedemptionCode[]>;
  getRedemptionCode(id: string): Promise<RedemptionCode | undefined>;
  getRedemptionCodeByCode(code: string): Promise<RedemptionCode | undefined>;
  createRedemptionCode(codeData: CreateRedemptionCode, createdBy: string): Promise<RedemptionCode>;
  updateRedemptionCode(id: string, data: Partial<CreateRedemptionCode>): Promise<RedemptionCode>;
  deleteRedemptionCode(id: string): Promise<void>;
  redeemCode(userId: string, code: string): Promise<{ success: boolean; message: string; pointsAwarded?: number }>;
  getRedemptionHistory(userId: string): Promise<RedemptionHistory[]>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationAsRead(id: string): Promise<Notification>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
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

  async updateUserSettings(userId: string, settings: UpdateUserSettings): Promise<User> {
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (settings.phone !== undefined) updateData.phone = settings.phone;
    if (settings.marketingConsent !== undefined) updateData.marketingConsent = settings.marketingConsent ? 1 : 0;
    if (settings.emailNotifications !== undefined) updateData.emailNotifications = settings.emailNotifications ? 1 : 0;
    if (settings.pushNotifications !== undefined) updateData.pushNotifications = settings.pushNotifications ? 1 : 0;
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserSettings(userId: string): Promise<{ phone: string | null; marketingConsent: boolean; emailNotifications: boolean; pushNotifications: boolean } | undefined> {
    const [user] = await db.select({
      phone: users.phone,
      marketingConsent: users.marketingConsent,
      emailNotifications: users.emailNotifications,
      pushNotifications: users.pushNotifications,
    }).from(users).where(eq(users.id, userId));
    
    if (!user) return undefined;
    
    return {
      phone: user.phone,
      marketingConsent: user.marketingConsent === 1,
      emailNotifications: user.emailNotifications === 1,
      pushNotifications: user.pushNotifications === 1,
    };
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

  async getRecentAiJobsForAdmin(limit: number = 50): Promise<Array<AiJob & { user: { email: string | null; displayName: string | null } | null }>> {
    const jobs = await db
      .select({
        id: aiJobs.id,
        userId: aiJobs.userId,
        profileId: aiJobs.profileId,
        type: aiJobs.type,
        status: aiJobs.status,
        progress: aiJobs.progress,
        payload: aiJobs.payload,
        result: aiJobs.result,
        error: aiJobs.error,
        queuedAt: aiJobs.queuedAt,
        startedAt: aiJobs.startedAt,
        completedAt: aiJobs.completedAt,
        userEmail: users.email,
        userDisplayName: users.displayName,
      })
      .from(aiJobs)
      .leftJoin(users, eq(aiJobs.userId, users.id))
      .orderBy(desc(aiJobs.queuedAt))
      .limit(limit);
    
    return jobs.map(job => ({
      id: job.id,
      userId: job.userId,
      profileId: job.profileId,
      type: job.type,
      status: job.status,
      progress: job.progress,
      payload: job.payload,
      result: job.result,
      error: job.error,
      queuedAt: job.queuedAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      user: job.userEmail || job.userDisplayName ? {
        email: job.userEmail,
        displayName: job.userDisplayName,
      } : null,
    }));
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

  // User Sessions
  async createUserSession(sessionData: InsertUserSession): Promise<UserSession> {
    const [session] = await db
      .insert(userSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async updateUserSessionLogout(sessionId: string): Promise<UserSession> {
    const session = await db.select().from(userSessions).where(eq(userSessions.id, sessionId));
    if (!session[0]) throw new Error("Session not found");
    
    const loginAt = session[0].loginAt;
    const logoutAt = new Date();
    const durationSeconds = Math.floor((logoutAt.getTime() - loginAt.getTime()) / 1000);

    const [updated] = await db
      .update(userSessions)
      .set({ 
        logoutAt, 
        sessionDuration: durationSeconds,
        eventType: 'logout'
      })
      .where(eq(userSessions.id, sessionId))
      .returning();
    return updated;
  }

  async getActiveSessionByUser(userId: string): Promise<UserSession | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(and(
        eq(userSessions.userId, userId),
        eq(userSessions.eventType, 'login'),
        isNull(userSessions.logoutAt)
      ))
      .orderBy(desc(userSessions.loginAt))
      .limit(1);
    return session;
  }

  async getUserSessionHistory(limit: number = 50): Promise<Array<UserSession & { user: User | null }>> {
    const sessionsData = await db
      .select()
      .from(userSessions)
      .orderBy(desc(userSessions.loginAt))
      .limit(limit);

    // Fetch users for sessions
    const userIds = Array.from(new Set(sessionsData.map(s => s.userId)));
    const usersData = userIds.length > 0 
      ? await db.select().from(users).where(inArray(users.id, userIds))
      : [];
    
    const userMap = new Map(usersData.map(u => [u.id, u]));
    
    return sessionsData.map(s => ({
      ...s,
      user: userMap.get(s.userId) || null,
    }));
  }

  async getUserSessionsByUser(userId: string, limit: number = 20): Promise<UserSession[]> {
    return db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, userId))
      .orderBy(desc(userSessions.loginAt))
      .limit(limit);
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
    
    // Return default if exists in known pages
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
    
    // For unknown pages, default to staff/admin only
    return {
      slug,
      title: slug,
      description: null,
      defaultRoles: NEW_PAGE_DEFAULT_ROLES,
      allowedRoles: null,
      isLocked: 0,
      updatedBy: null,
      updatedAt: null,
    };
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
    // Prevent empty arrays - fall back to null (use defaults)
    const rolesValue = allowedRoles && allowedRoles.length > 0 ? allowedRoles : null;
    
    // First check if page exists in DB
    const [existing] = await db.select().from(pageSettings).where(eq(pageSettings.slug, slug));
    
    if (existing) {
      // Update existing
      const [result] = await db
        .update(pageSettings)
        .set({ allowedRoles: rolesValue, updatedBy, updatedAt: new Date() })
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
          allowedRoles: rolesValue,
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

  // Point Packages
  async getActivePointPackages(): Promise<PointPackage[]> {
    return db
      .select()
      .from(pointPackages)
      .where(eq(pointPackages.isActive, 1))
      .orderBy(pointPackages.sortOrder);
  }

  async getAllPointPackages(): Promise<PointPackage[]> {
    return db
      .select()
      .from(pointPackages)
      .orderBy(pointPackages.sortOrder);
  }

  async getPointPackage(id: string): Promise<PointPackage | undefined> {
    const [pkg] = await db.select().from(pointPackages).where(eq(pointPackages.id, id));
    return pkg;
  }

  async createPointPackage(pkg: InsertPointPackage): Promise<PointPackage> {
    const [result] = await db.insert(pointPackages).values(pkg).returning();
    return result;
  }

  async updatePointPackage(id: string, data: Partial<InsertPointPackage>): Promise<PointPackage> {
    const [result] = await db
      .update(pointPackages)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pointPackages.id, id))
      .returning();
    return result;
  }

  // Payments
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [result] = await db.insert(payments).values(payment).returning();
    return result;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPaymentByOrderId(orderId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.orderId, orderId));
    return payment;
  }

  async updatePaymentStatus(id: string, status: PaymentStatus, data?: Partial<Payment>): Promise<Payment> {
    const updateData: any = { status, updatedAt: new Date() };
    if (data) {
      Object.assign(updateData, data);
    }
    const [result] = await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();
    return result;
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    return db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  // Point Transactions
  async createPointTransaction(transaction: InsertPointTransaction): Promise<PointTransaction> {
    const [result] = await db.insert(pointTransactions).values(transaction).returning();
    return result;
  }

  async getPointTransactionsByUser(userId: string, limit: number = 50): Promise<PointTransaction[]> {
    return db
      .select()
      .from(pointTransactions)
      .where(eq(pointTransactions.userId, userId))
      .orderBy(desc(pointTransactions.createdAt))
      .limit(limit);
  }

  async addUserPoints(
    userId: string, 
    amount: number, 
    type: string, 
    description: string, 
    createdBy?: string, 
    paymentId?: string
  ): Promise<PointTransaction> {
    // Get current balance
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const newBalance = user.credits + amount;
    
    // Update user credits
    await this.updateUserCredits(userId, newBalance);
    
    // Create transaction record
    const transaction = await this.createPointTransaction({
      userId,
      paymentId: paymentId || null,
      amount,
      balanceAfter: newBalance,
      type,
      description,
      createdBy: createdBy || null,
    });
    
    return transaction;
  }

  // Service Pricing
  async getAllServicePricing(): Promise<ServicePricing[]> {
    return db.select().from(servicePricing);
  }

  async getServicePricing(id: string): Promise<ServicePricing | undefined> {
    const [pricing] = await db.select().from(servicePricing).where(eq(servicePricing.id, id));
    return pricing;
  }

  async upsertServicePricing(pricing: InsertServicePricing): Promise<ServicePricing> {
    const [result] = await db
      .insert(servicePricing)
      .values(pricing)
      .onConflictDoUpdate({
        target: servicePricing.id,
        set: {
          name: pricing.name,
          description: pricing.description,
          pointCost: pricing.pointCost,
          isActive: pricing.isActive,
          updatedAt: new Date(),
          updatedBy: pricing.updatedBy,
        },
      })
      .returning();
    return result;
  }

  async updateServicePricing(id: string, data: Partial<ServicePricing>, updatedBy: string): Promise<ServicePricing> {
    const [result] = await db
      .update(servicePricing)
      .set({ ...data, updatedAt: new Date(), updatedBy })
      .where(eq(servicePricing.id, id))
      .returning();
    return result;
  }

  async getServiceCost(serviceType: string): Promise<number> {
    const pricing = await this.getServicePricing(serviceType);
    if (pricing) {
      return pricing.pointCost;
    }
    // Fallback to defaults if not in database
    const defaults = DEFAULT_SERVICE_PRICING as Record<string, { pointCost: number }>;
    return defaults[serviceType]?.pointCost ?? 100;
  }

  // System Settings
  async getSystemSetting(key: string): Promise<string | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    if (setting) {
      return setting.value;
    }
    // Fallback to defaults
    return DEFAULT_SYSTEM_SETTINGS[key]?.value;
  }

  async upsertSystemSetting(key: string, value: string, description: string | null, updatedBy: string | null): Promise<SystemSettings> {
    const [result] = await db
      .insert(systemSettings)
      .values({ key, value, description, updatedBy })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value, description, updatedAt: new Date(), updatedBy },
      })
      .returning();
    return result;
  }

  async getAllSystemSettings(): Promise<SystemSettings[]> {
    return db.select().from(systemSettings);
  }

  // Redemption Codes
  async getAllRedemptionCodes(): Promise<RedemptionCode[]> {
    return db.select().from(redemptionCodes).orderBy(desc(redemptionCodes.createdAt));
  }

  async getRedemptionCode(id: string): Promise<RedemptionCode | undefined> {
    const [code] = await db.select().from(redemptionCodes).where(eq(redemptionCodes.id, id));
    return code;
  }

  async getRedemptionCodeByCode(code: string): Promise<RedemptionCode | undefined> {
    const [result] = await db.select().from(redemptionCodes).where(eq(redemptionCodes.code, code.toUpperCase()));
    return result;
  }

  async createRedemptionCode(codeData: CreateRedemptionCode, createdBy: string): Promise<RedemptionCode> {
    const [result] = await db
      .insert(redemptionCodes)
      .values({
        code: codeData.code.toUpperCase(),
        pointAmount: codeData.pointAmount,
        maxUses: codeData.maxUses ?? null,
        isActive: codeData.isActive ?? 1,
        expiresAt: codeData.expiresAt ?? null,
        createdBy,
      })
      .returning();
    return result;
  }

  async updateRedemptionCode(id: string, data: Partial<CreateRedemptionCode>): Promise<RedemptionCode> {
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.pointAmount !== undefined) updateData.pointAmount = data.pointAmount;
    if (data.maxUses !== undefined) updateData.maxUses = data.maxUses;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;

    const [result] = await db
      .update(redemptionCodes)
      .set(updateData)
      .where(eq(redemptionCodes.id, id))
      .returning();
    return result;
  }

  async deleteRedemptionCode(id: string): Promise<void> {
    await db.delete(redemptionCodes).where(eq(redemptionCodes.id, id));
  }

  async redeemCode(userId: string, code: string): Promise<{ success: boolean; message: string; pointsAwarded?: number }> {
    const redemption = await this.getRedemptionCodeByCode(code);
    
    if (!redemption) {
      return { success: false, message: '존재하지 않는 쿠폰 코드입니다' };
    }
    
    if (redemption.isActive !== 1) {
      return { success: false, message: '비활성화된 쿠폰입니다' };
    }
    
    if (redemption.expiresAt && new Date(redemption.expiresAt) < new Date()) {
      return { success: false, message: '만료된 쿠폰입니다' };
    }
    
    if (redemption.maxUses !== null && redemption.currentUses >= redemption.maxUses) {
      return { success: false, message: '사용 횟수가 초과된 쿠폰입니다' };
    }
    
    // Check if user already redeemed this code
    const [existing] = await db
      .select()
      .from(redemptionHistory)
      .where(and(
        eq(redemptionHistory.userId, userId),
        eq(redemptionHistory.codeId, redemption.id)
      ));
    
    if (existing) {
      return { success: false, message: '이미 사용한 쿠폰입니다' };
    }
    
    // Award points
    await this.addUserPoints(userId, redemption.pointAmount, 'coupon', `쿠폰 사용: ${redemption.code}`);
    
    // Record redemption history
    await db.insert(redemptionHistory).values({
      userId,
      codeId: redemption.id,
      pointsAwarded: redemption.pointAmount,
    });
    
    // Increment usage count
    await db
      .update(redemptionCodes)
      .set({ currentUses: redemption.currentUses + 1, updatedAt: new Date() })
      .where(eq(redemptionCodes.id, redemption.id));
    
    return { 
      success: true, 
      message: `${redemption.pointAmount.toLocaleString()} 포인트가 지급되었습니다!`,
      pointsAwarded: redemption.pointAmount 
    };
  }

  async getRedemptionHistory(userId: string): Promise<RedemptionHistory[]> {
    return db
      .select()
      .from(redemptionHistory)
      .where(eq(redemptionHistory.userId, userId))
      .orderBy(desc(redemptionHistory.redeemedAt));
  }

  // Notifications
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [result] = await db.insert(notifications).values(notification).returning();
    return result;
  }

  async getNotificationsByUser(userId: string, limit: number = 20): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, 0)
      ));
    return result?.count ?? 0;
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const [result] = await db
      .update(notifications)
      .set({ isRead: 1, readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return result;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: 1, readAt: new Date() })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, 0)
      ));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }
}

export const storage = new DatabaseStorage();
