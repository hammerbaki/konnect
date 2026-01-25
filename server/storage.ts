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
  giftPointLedger,
  giftPointTransactions,
  referrals,
  iapTransactions,
  groups,
  groupMembers,
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
  type GiftPointLedger,
  type InsertGiftPointLedger,
  type GiftPointTransaction,
  type InsertGiftPointTransaction,
  type GiftPointSourceType,
  type Referral,
  type IapTransaction,
  type InsertIapTransaction,
  type IapStatus,
  type KjobsAssessment,
  type InsertKjobsAssessment,
  type Group,
  type InsertGroup,
  type GroupMember,
  type InsertGroupMember,
  type GroupWithStats,
  type GroupMemberWithUser,
  type GroupMemberRole,
  IAP_PRODUCTS,
  systemSettings,
  redemptionCodes,
  redemptionHistory,
  kjobsAssessments,
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
  deleteUser(userId: string): Promise<void>;
  updateUserCredits(userId: string, credits: number): Promise<void>;
  deductUserCredits(userId: string, amount: number): Promise<boolean>;
  addUserCredits(userId: string, amount: number, reason?: string): Promise<boolean>;
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
  updateAiJobResult(id: string, result: any, tokenUsage?: {
    inputTokens?: number;
    outputTokens?: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
    totalTokens?: number;
    estimatedCostCents?: number;
  }): Promise<AiJob>;
  updateAiJobError(id: string, error: string): Promise<AiJob>;
  getRecentAiJobsForAdmin(limit?: number): Promise<Array<AiJob & { user: { email: string | null; displayName: string | null } | null; profile: { type: string | null; title: string | null } | null }>>;

  // Admin functions
  getAllUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserRole(userId: string, role: UserRole): Promise<User>;
  updateUserCreditsAdmin(userId: string, credits: number): Promise<User>;
  adminCreateUser(data: { email: string; firstName?: string; lastName?: string; role?: string; credits?: number }): Promise<User>;
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
  setDailyUniqueVisitors(date: string, uniqueVisitors: number): Promise<VisitorMetrics>;
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

  // Gift Points (GP)
  getUserGiftPointBalance(userId: string): Promise<number>;
  getActiveGiftPointLedger(userId: string): Promise<GiftPointLedger[]>;
  addGiftPoints(userId: string, amount: number, source: GiftPointSourceType, options?: {
    sourceId?: string;
    description?: string;
    expiresAt?: Date;
    createdBy?: string;
  }): Promise<GiftPointLedger>;
  deductGiftPoints(userId: string, amount: number, description: string): Promise<{ gpUsed: number; creditsUsed: number }>;
  getExpiringGiftPoints(userId: string, withinDays: number): Promise<GiftPointLedger[]>;
  expireOldGiftPoints(): Promise<number>; // Returns count of expired entries
  getGiftPointLedger(userId: string, limit?: number): Promise<GiftPointLedger[]>;
  getGiftPointTransactions(userId: string, limit?: number): Promise<GiftPointTransaction[]>;
  updateUserGiftPoints(userId: string, giftPoints: number): Promise<void>;
  deductUserPointsWithPriority(userId: string, amount: number, description: string): Promise<{ 
    gpUsed: number; 
    creditsUsed: number; 
    success: boolean;
    errorCode?: 'user_not_found' | 'insufficient_balance';
    gpBalance?: number;
    creditBalance?: number;
    totalRequired?: number;
  }>;

  // Referrals
  getUserByReferralCode(code: string): Promise<User | undefined>;
  generateReferralCode(userId: string): Promise<string>;
  createReferral(inviterId: string, inviteeId: string, referralCode: string): Promise<Referral>;
  getReferralByInvitee(inviteeId: string): Promise<Referral | undefined>;
  getReferralsByInviter(inviterId: string): Promise<Array<Referral & { invitee: { email: string | null; displayName: string | null; createdAt: Date | null } | null }>>;
  updateReferralRewards(referralId: string, inviterGp: number, inviteeGp: number): Promise<Referral>;
  getReferralStats(): Promise<{
    totalReferrals: number;
    totalGpAwarded: number;
    topInviters: Array<{ userId: string; displayName: string | null; email: string | null; referralCount: number; totalGpEarned: number }>;
  }>;
  getUserReferralSummary(userId: string): Promise<{
    referralCode: string | null;
    totalReferred: number;
    totalGpEarned: number;
  }>;

  // K-JOBS Assessments
  createKjobsAssessment(data: InsertKjobsAssessment): Promise<KjobsAssessment>;
  getKjobsAssessment(id: string): Promise<KjobsAssessment | undefined>;
  updateKjobsAssessment(id: string, data: Partial<KjobsAssessment>): Promise<KjobsAssessment>;
  getIncompleteKjobsAssessment(userId: string): Promise<KjobsAssessment | undefined>;
  getLatestCompletedKjobsAssessment(userId: string): Promise<KjobsAssessment | undefined>;
  getKjobsAssessmentsByUser(userId: string): Promise<KjobsAssessment[]>;

  // Groups
  createGroup(data: InsertGroup): Promise<Group>;
  getGroup(id: string): Promise<Group | undefined>;
  updateGroup(id: string, data: Partial<InsertGroup>): Promise<Group>;
  deleteGroup(id: string): Promise<void>;
  getGroupsByOwner(ownerId: string): Promise<Group[]>;
  getAllGroups(): Promise<GroupWithStats[]>;
  getGroupWithStats(id: string): Promise<GroupWithStats | undefined>;

  // Group Members
  addGroupMember(data: InsertGroupMember): Promise<GroupMember>;
  removeGroupMember(groupId: string, userId: string): Promise<void>;
  updateGroupMemberRole(groupId: string, userId: string, role: GroupMemberRole): Promise<GroupMember>;
  getGroupMembers(groupId: string): Promise<GroupMemberWithUser[]>;
  getUserGroups(userId: string): Promise<Array<Group & { role: GroupMemberRole }>>;
  isGroupMember(groupId: string, userId: string): Promise<boolean>;
  getGroupMemberRole(groupId: string, userId: string): Promise<GroupMemberRole | undefined>;
  getGroupMemberAnalyses(groupId: string): Promise<Array<CareerAnalysis & { user: Pick<User, 'id' | 'email' | 'displayName'> }>>;
  getUserManagedGroupMemberIds(userId: string): Promise<string[]>;
  getUserManagedGroups(userId: string): Promise<Array<Group & { role: GroupMemberRole }>>;
  getGroupStats(groupId: string): Promise<{
    totalMembers: number;
    completedAnalyses: number;
    completedProfiles: number;
    completedGoals: number;
    completedEssays: number;
    progressRate: number;
    profileTypeBreakdown: Array<{ type: string; count: number }>;
    analysisTypeBreakdown: Array<{ type: string; count: number }>;
  }>;
  getGroupDetailedStats(groupId: string): Promise<{
    recentAnalyses: Array<{
      userId: string;
      userName: string | null;
      profileType: string;
      analysisDate: string;
      summary: string | null;
    }>;
    profileTypeStats: Array<{ type: string; label: string; count: number; withAnalysis: number }>;
  }>;
  getGroupMemberProgress(groupId: string): Promise<Array<{
    userId: string;
    email: string;
    displayName: string | null;
    profileImageUrl: string | null;
    hasProfile: boolean;
    hasAnalysis: boolean;
    hasGoals: boolean;
    hasEssay: boolean;
    analysisDate: string | null;
    profileType: string | null;
    progressScore: number;
  }>>;
  getGroupMemberDetail(memberId: string): Promise<{
    user: {
      id: string;
      email: string;
      displayName: string | null;
      profileImageUrl: string | null;
      createdAt: string;
    };
    profile: {
      id: string;
      profileType: string;
      name: string | null;
      createdAt: string;
      updatedAt: string | null;
    } | null;
    analysis: {
      id: string;
      status: string;
      createdAt: string;
      analysisResult: any;
    } | null;
    goals: Array<{
      id: string;
      title: string;
      status: string;
      progress: number;
    }>;
    essays: Array<{
      id: string;
      title: string | null;
      createdAt: string;
    }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if this is a new user
    const userId = userData.id;
    if (!userId) {
      throw new Error('User ID is required for upsert');
    }
    const existingUser = await this.getUser(userId);
    const isNewUser = !existingUser;
    
    // Check if email exists with a different user ID (e.g., after account deletion and re-registration)
    if (userData.email) {
      const [existingByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));
      
      if (existingByEmail && existingByEmail.id !== userId) {
        // Delete the old record with the same email (orphaned from Supabase Auth)
        await db.delete(users).where(eq(users.id, existingByEmail.id));
        console.log(`Deleted orphaned user record with email ${userData.email} (old ID: ${existingByEmail.id}, new ID: ${userData.id})`);
      }
    }
    
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
    
    // Apply signup bonus - use ledger as source of truth
    // Check flag first for efficiency, but rely on ledger check for correctness
    if (user.signupBonusAwarded === 1) {
      // Already awarded
      return user;
    }
    
    try {
      // Check if bonus already exists in ledger (authoritative check)
      const existingBonus = await db
        .select({ id: giftPointLedger.id })
        .from(giftPointLedger)
        .where(and(
          eq(giftPointLedger.userId, user.id),
          eq(giftPointLedger.source, 'signup')
        ))
        .limit(1);
      
      if (existingBonus.length > 0) {
        // Already awarded, just sync the flag
        await db.update(users).set({ signupBonusAwarded: 1 }).where(eq(users.id, user.id));
        return user;
      }
      
      // Try to claim the flag atomically - prevents concurrent awards
      const [claimed] = await db
        .update(users)
        .set({ signupBonusAwarded: 1 })
        .where(and(
          eq(users.id, user.id),
          eq(users.signupBonusAwarded, 0)
        ))
        .returning({ id: users.id });
      
      if (!claimed) {
        // Another request already claimed it
        return user;
      }
      
      // Get settings
      const signupBonusSetting = await this.getSystemSetting('signup_bonus');
      const signupBonus = signupBonusSetting && !isNaN(Number(signupBonusSetting)) ? Number(signupBonusSetting) : 1000;
      
      if (signupBonus > 0) {
        const expirationDaysSetting = await this.getSystemSetting('gp_default_expiration_days');
        const expirationDays = Number(expirationDaysSetting) || 90;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expirationDays);
        
        try {
          // Use the existing addGiftPoints method which handles all invariants correctly
          await this.addGiftPoints(user.id, signupBonus, 'signup', {
            description: '회원가입 축하 보너스',
            expiresAt,
          });
          console.log(`Awarded ${signupBonus}GP signup bonus to user ${user.id} (${user.email})`);
        } catch (gpError) {
          // GP award failed - reset flag for retry
          console.error('Error awarding signup bonus GP, resetting flag:', gpError);
          await db.update(users).set({ signupBonusAwarded: 0 }).where(eq(users.id, user.id));
        }
      }
    } catch (error) {
      console.error('Error applying signup bonus GP:', error);
    }
    
    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete all related data in proper order (respecting foreign keys)
    // Note: Some tables have ON DELETE CASCADE, others need manual deletion
    
    // 1. Delete gift point transactions and ledger
    await db.delete(giftPointTransactions).where(eq(giftPointTransactions.userId, userId));
    await db.delete(giftPointLedger).where(eq(giftPointLedger.userId, userId));
    
    // 2. Delete referrals (as inviter or invitee)
    await db.delete(referrals).where(eq(referrals.inviterId, userId));
    await db.delete(referrals).where(eq(referrals.inviteeId, userId));
    
    // 3. Delete notifications
    await db.delete(notifications).where(eq(notifications.userId, userId));
    
    // 4. Delete point transactions and payments
    await db.delete(pointTransactions).where(eq(pointTransactions.userId, userId));
    await db.delete(payments).where(eq(payments.userId, userId));
    
    // 5. Delete user sessions
    await db.delete(userSessions).where(eq(userSessions.userId, userId));
    
    // 6. Delete AI jobs
    await db.delete(aiJobs).where(eq(aiJobs.userId, userId));
    
    // 7. Delete kompass goals (linked to profiles, but some may be orphaned)
    const userProfiles = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, userId));
    for (const profile of userProfiles) {
      await db.delete(kompassGoals).where(eq(kompassGoals.profileId, profile.id));
    }
    
    // 8. Delete personal essays
    for (const profile of userProfiles) {
      await db.delete(personalEssays).where(eq(personalEssays.profileId, profile.id));
    }
    
    // 9. Delete career analyses
    for (const profile of userProfiles) {
      await db.delete(careerAnalyses).where(eq(careerAnalyses.profileId, profile.id));
    }
    
    // 10. Delete profiles
    await db.delete(profiles).where(eq(profiles.userId, userId));
    
    // 11. Finally, delete the user
    await db.delete(users).where(eq(users.id, userId));
    
    console.log(`Completely deleted user ${userId} and all related data`);
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

  async addUserCredits(userId: string, amount: number, reason?: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) {
      return false;
    }
    await this.updateUserCredits(userId, user.credits + amount);
    console.log(`Added ${amount} credits to user ${userId}${reason ? ` - ${reason}` : ''}`);
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

  async updateAiJobResult(id: string, result: any, tokenUsage?: {
    inputTokens?: number;
    outputTokens?: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
    totalTokens?: number;
    estimatedCostCents?: number;
  }): Promise<AiJob> {
    const updateData: Record<string, any> = { 
      result, 
      status: 'completed' as AiJobStatus, 
      progress: 100,
      completedAt: new Date() 
    };
    
    if (tokenUsage) {
      if (tokenUsage.inputTokens !== undefined) updateData.inputTokens = tokenUsage.inputTokens;
      if (tokenUsage.outputTokens !== undefined) updateData.outputTokens = tokenUsage.outputTokens;
      if (tokenUsage.cacheReadTokens !== undefined) updateData.cacheReadTokens = tokenUsage.cacheReadTokens;
      if (tokenUsage.cacheWriteTokens !== undefined) updateData.cacheWriteTokens = tokenUsage.cacheWriteTokens;
      if (tokenUsage.totalTokens !== undefined) updateData.totalTokens = tokenUsage.totalTokens;
      if (tokenUsage.estimatedCostCents !== undefined) updateData.estimatedCostCents = tokenUsage.estimatedCostCents;
    }
    
    const [job] = await db
      .update(aiJobs)
      .set(updateData)
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

  async getRecentAiJobsForAdmin(limit: number = 50): Promise<Array<AiJob & { user: { email: string | null; displayName: string | null } | null; profile: { type: string | null; title: string | null } | null }>> {
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
        inputTokens: aiJobs.inputTokens,
        outputTokens: aiJobs.outputTokens,
        cacheReadTokens: aiJobs.cacheReadTokens,
        cacheWriteTokens: aiJobs.cacheWriteTokens,
        totalTokens: aiJobs.totalTokens,
        estimatedCostCents: aiJobs.estimatedCostCents,
        queuedAt: aiJobs.queuedAt,
        startedAt: aiJobs.startedAt,
        completedAt: aiJobs.completedAt,
        userEmail: users.email,
        userDisplayName: users.displayName,
        profileType: profiles.type,
        profileTitle: profiles.title,
      })
      .from(aiJobs)
      .leftJoin(users, eq(aiJobs.userId, users.id))
      .leftJoin(profiles, eq(aiJobs.profileId, profiles.id))
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
      inputTokens: job.inputTokens,
      outputTokens: job.outputTokens,
      cacheReadTokens: job.cacheReadTokens,
      cacheWriteTokens: job.cacheWriteTokens,
      totalTokens: job.totalTokens,
      estimatedCostCents: job.estimatedCostCents,
      queuedAt: job.queuedAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      user: job.userEmail || job.userDisplayName ? {
        email: job.userEmail,
        displayName: job.userDisplayName,
      } : null,
      profile: job.profileType || job.profileTitle ? {
        type: job.profileType,
        title: job.profileTitle,
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

  async adminCreateUser(data: { email: string; firstName?: string; lastName?: string; role?: string; credits?: number }): Promise<User> {
    const existingUser = await this.getUserByEmail(data.email);
    if (existingUser) {
      throw new Error('이미 등록된 이메일입니다.');
    }
    
    const userId = crypto.randomUUID();
    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        email: data.email,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        role: (data.role as any) || 'user',
        credits: data.credits || 100,
      })
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

  // Set unique visitors count (replaces instead of adding - for daily totals from Redis SET)
  async setDailyUniqueVisitors(date: string, uniqueVisitors: number): Promise<VisitorMetrics> {
    const [metrics] = await db
      .insert(visitorMetrics)
      .values({ date, hour: 0, pageViews: 0, uniqueVisitors, newUsers: 0 })
      .onConflictDoUpdate({
        target: [visitorMetrics.date, visitorMetrics.hour],
        set: { 
          uniqueVisitors: uniqueVisitors,
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

  async redeemCode(userId: string, code: string): Promise<{ success: boolean; message: string; pointsAwarded?: number; isGiftPoints?: boolean }> {
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
    
    // Award Gift Points (GP) instead of regular credits
    await this.addGiftPoints(userId, redemption.pointAmount, 'coupon', {
      sourceId: redemption.id,
      description: `쿠폰 사용: ${redemption.code}`,
    });
    
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
      message: `${redemption.pointAmount.toLocaleString()} GP(기프트 포인트)가 지급되었습니다!`,
      pointsAwarded: redemption.pointAmount,
      isGiftPoints: true
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

  // Gift Points (GP) Implementation
  async getUserGiftPointBalance(userId: string): Promise<number> {
    const result = await db
      .select({ total: sum(giftPointLedger.remainingAmount) })
      .from(giftPointLedger)
      .where(and(
        eq(giftPointLedger.userId, userId),
        eq(giftPointLedger.isExpired, 0),
        gte(giftPointLedger.expiresAt, new Date())
      ));
    return Number(result[0]?.total) || 0;
  }

  async getActiveGiftPointLedger(userId: string): Promise<GiftPointLedger[]> {
    return db
      .select()
      .from(giftPointLedger)
      .where(and(
        eq(giftPointLedger.userId, userId),
        eq(giftPointLedger.isExpired, 0),
        gte(giftPointLedger.expiresAt, new Date())
      ))
      .orderBy(giftPointLedger.expiresAt); // FIFO by expiration date
  }

  async addGiftPoints(
    userId: string, 
    amount: number, 
    source: GiftPointSourceType, 
    options?: {
      sourceId?: string;
      description?: string;
      expiresAt?: Date;
      createdBy?: string;
    }
  ): Promise<GiftPointLedger> {
    // Get default expiration period if not specified
    let expiresAt = options?.expiresAt;
    if (!expiresAt) {
      const defaultDays = await this.getSystemSetting('gp_default_expiration_days');
      const days = parseInt(defaultDays || '365', 10);
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
    }

    // Create ledger entry
    const [ledgerEntry] = await db
      .insert(giftPointLedger)
      .values({
        userId,
        amount,
        remainingAmount: amount,
        source,
        sourceId: options?.sourceId || null,
        description: options?.description || null,
        expiresAt,
        createdBy: options?.createdBy || null,
      })
      .returning();

    // Update user's cached GP balance
    const newBalance = await this.getUserGiftPointBalance(userId);
    await this.updateUserGiftPoints(userId, newBalance);

    // Create transaction record
    await db.insert(giftPointTransactions).values({
      userId,
      ledgerId: ledgerEntry.id,
      amount,
      balanceAfter: newBalance,
      type: 'award',
      description: options?.description || `${source} GP 지급`,
      createdBy: options?.createdBy || null,
    });

    console.log(`Added ${amount} GP to user ${userId} (source: ${source}, expires: ${expiresAt.toISOString()})`);
    return ledgerEntry;
  }

  async deductGiftPoints(userId: string, amount: number, description: string): Promise<{ gpUsed: number; creditsUsed: number }> {
    // Get active ledger entries sorted by expiration (FIFO)
    const activeEntries = await this.getActiveGiftPointLedger(userId);
    
    let remainingToDeduct = amount;
    let gpUsed = 0;

    for (const entry of activeEntries) {
      if (remainingToDeduct <= 0) break;

      const deductFromEntry = Math.min(entry.remainingAmount, remainingToDeduct);
      const newRemaining = entry.remainingAmount - deductFromEntry;

      await db
        .update(giftPointLedger)
        .set({ 
          remainingAmount: newRemaining,
          isExpired: newRemaining === 0 ? 1 : 0,
          updatedAt: new Date()
        })
        .where(eq(giftPointLedger.id, entry.id));

      gpUsed += deductFromEntry;
      remainingToDeduct -= deductFromEntry;
    }

    // Update user's cached GP balance
    const newBalance = await this.getUserGiftPointBalance(userId);
    await this.updateUserGiftPoints(userId, newBalance);

    // Create transaction record for GP usage
    if (gpUsed > 0) {
      await db.insert(giftPointTransactions).values({
        userId,
        ledgerId: null,
        amount: -gpUsed,
        balanceAfter: newBalance,
        type: 'usage',
        description,
      });
    }

    return { gpUsed, creditsUsed: remainingToDeduct };
  }

  async getExpiringGiftPoints(userId: string, withinDays: number): Promise<GiftPointLedger[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);

    return db
      .select()
      .from(giftPointLedger)
      .where(and(
        eq(giftPointLedger.userId, userId),
        eq(giftPointLedger.isExpired, 0),
        gte(giftPointLedger.expiresAt, new Date()),
        lte(giftPointLedger.expiresAt, futureDate)
      ))
      .orderBy(giftPointLedger.expiresAt);
  }

  async expireOldGiftPoints(): Promise<number> {
    const now = new Date();
    
    // Find entries to expire
    const toExpire = await db
      .select()
      .from(giftPointLedger)
      .where(and(
        eq(giftPointLedger.isExpired, 0),
        lte(giftPointLedger.expiresAt, now)
      ));

    if (toExpire.length === 0) return 0;

    // Mark them as expired
    await db
      .update(giftPointLedger)
      .set({ isExpired: 1, updatedAt: now })
      .where(and(
        eq(giftPointLedger.isExpired, 0),
        lte(giftPointLedger.expiresAt, now)
      ));

    // Update affected users' cached GP balance and create transaction records
    const userIds = Array.from(new Set(toExpire.map(e => e.userId)));
    for (const userId of userIds) {
      const expiredAmount = toExpire
        .filter(e => e.userId === userId)
        .reduce((sum, e) => sum + e.remainingAmount, 0);

      if (expiredAmount > 0) {
        const newBalance = await this.getUserGiftPointBalance(userId);
        await this.updateUserGiftPoints(userId, newBalance);

        await db.insert(giftPointTransactions).values({
          userId,
          ledgerId: null,
          amount: -expiredAmount,
          balanceAfter: newBalance,
          type: 'expire',
          description: '기프트 포인트 만료',
        });
      }
    }

    console.log(`Expired ${toExpire.length} GP entries for ${userIds.length} users`);
    return toExpire.length;
  }

  async getGiftPointLedger(userId: string, limit: number = 50): Promise<GiftPointLedger[]> {
    return db
      .select()
      .from(giftPointLedger)
      .where(eq(giftPointLedger.userId, userId))
      .orderBy(desc(giftPointLedger.createdAt))
      .limit(limit);
  }

  async getGiftPointTransactions(userId: string, limit: number = 50): Promise<GiftPointTransaction[]> {
    return db
      .select()
      .from(giftPointTransactions)
      .where(eq(giftPointTransactions.userId, userId))
      .orderBy(desc(giftPointTransactions.createdAt))
      .limit(limit);
  }

  async updateUserGiftPoints(userId: string, giftPoints: number): Promise<void> {
    await db
      .update(users)
      .set({ giftPoints })
      .where(eq(users.id, userId));
  }

  async deductUserPointsWithPriority(
    userId: string, 
    amount: number, 
    description: string
  ): Promise<{ 
    gpUsed: number; 
    creditsUsed: number; 
    success: boolean;
    errorCode?: 'user_not_found' | 'insufficient_balance';
    gpBalance?: number;
    creditBalance?: number;
    totalRequired?: number;
  }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { 
        gpUsed: 0, 
        creditsUsed: 0, 
        success: false,
        errorCode: 'user_not_found',
      };
    }

    // Check total available (GP + credits)
    const gpBalance = await this.getUserGiftPointBalance(userId);
    const totalAvailable = gpBalance + user.credits;

    if (totalAvailable < amount) {
      return { 
        gpUsed: 0, 
        creditsUsed: 0, 
        success: false,
        errorCode: 'insufficient_balance',
        gpBalance,
        creditBalance: user.credits,
        totalRequired: amount,
      };
    }

    // First, try to use GP (FIFO by expiration)
    const { gpUsed, creditsUsed: remainingAfterGP } = await this.deductGiftPoints(userId, amount, description);

    // If GP wasn't enough, deduct from regular credits
    let creditsUsed = 0;
    if (remainingAfterGP > 0) {
      creditsUsed = remainingAfterGP;
      const newCredits = user.credits - creditsUsed;
      await this.updateUserCredits(userId, newCredits);

      // Log credit usage in point transactions
      await this.createPointTransaction({
        userId,
        amount: -creditsUsed,
        balanceAfter: newCredits,
        type: 'usage',
        description,
      });
    }

    console.log(`Deducted ${amount} points from user ${userId}: ${gpUsed} GP + ${creditsUsed} credits`);
    return { 
      gpUsed, 
      creditsUsed, 
      success: true,
      gpBalance: gpBalance - gpUsed,
      creditBalance: user.credits - creditsUsed,
    };
  }

  // Referral methods
  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, code));
    return user;
  }

  async generateReferralCode(userId: string): Promise<string> {
    // Generate a unique 8-character code
    const generateCode = (): string => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar chars (0,O,1,I)
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let code = generateCode();
    let attempts = 0;
    
    // Ensure uniqueness
    while (attempts < 10) {
      const existing = await this.getUserByReferralCode(code);
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    // Update user with the code
    await db
      .update(users)
      .set({ referralCode: code })
      .where(eq(users.id, userId));

    return code;
  }

  async createReferral(inviterId: string, inviteeId: string, referralCode: string): Promise<Referral> {
    const [referral] = await db
      .insert(referrals)
      .values({
        inviterId,
        inviteeId,
        referralCode,
        status: 'completed',
      })
      .returning();
    return referral;
  }

  async getReferralByInvitee(inviteeId: string): Promise<Referral | undefined> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.inviteeId, inviteeId));
    return referral;
  }

  async getReferralsByInviter(inviterId: string): Promise<Array<Referral & { invitee: { email: string | null; displayName: string | null; createdAt: Date | null } | null }>> {
    const result = await db
      .select({
        referral: referrals,
        invitee: {
          email: users.email,
          displayName: users.displayName,
          createdAt: users.createdAt,
        },
      })
      .from(referrals)
      .leftJoin(users, eq(referrals.inviteeId, users.id))
      .where(eq(referrals.inviterId, inviterId))
      .orderBy(desc(referrals.createdAt));

    return result.map(r => ({
      ...r.referral,
      invitee: r.invitee,
    }));
  }

  async updateReferralRewards(referralId: string, inviterGp: number, inviteeGp: number): Promise<Referral> {
    const [referral] = await db
      .update(referrals)
      .set({
        inviterGpAwarded: inviterGp,
        inviteeGpAwarded: inviteeGp,
        status: 'rewarded',
        rewardedAt: new Date(),
      })
      .where(eq(referrals.id, referralId))
      .returning();
    return referral;
  }

  async getReferralStats(): Promise<{
    totalReferrals: number;
    totalGpAwarded: number;
    topInviters: Array<{ userId: string; displayName: string | null; email: string | null; referralCount: number; totalGpEarned: number }>;
  }> {
    // Get total referrals count
    const [countResult] = await db
      .select({ count: count() })
      .from(referrals);
    const totalReferrals = countResult?.count ?? 0;

    // Get total GP awarded
    const [gpResult] = await db
      .select({
        inviterTotal: sum(referrals.inviterGpAwarded),
        inviteeTotal: sum(referrals.inviteeGpAwarded),
      })
      .from(referrals);
    const totalGpAwarded = (Number(gpResult?.inviterTotal) || 0) + (Number(gpResult?.inviteeTotal) || 0);

    // Get top inviters
    const topInvitersResult = await db
      .select({
        userId: referrals.inviterId,
        referralCount: count(),
        totalGpEarned: sum(referrals.inviterGpAwarded),
      })
      .from(referrals)
      .groupBy(referrals.inviterId)
      .orderBy(desc(count()))
      .limit(10);

    // Get user info for top inviters
    const topInviters = await Promise.all(
      topInvitersResult.map(async (r) => {
        const user = await this.getUser(r.userId);
        return {
          userId: r.userId,
          displayName: user?.displayName ?? null,
          email: user?.email ?? null,
          referralCount: r.referralCount,
          totalGpEarned: Number(r.totalGpEarned) || 0,
        };
      })
    );

    return { totalReferrals, totalGpAwarded, topInviters };
  }

  async getUserReferralSummary(userId: string): Promise<{
    referralCode: string | null;
    totalReferred: number;
    totalGpEarned: number;
  }> {
    const user = await this.getUser(userId);
    
    // Get referral count and GP earned
    const [stats] = await db
      .select({
        totalReferred: count(),
        totalGpEarned: sum(referrals.inviterGpAwarded),
      })
      .from(referrals)
      .where(eq(referrals.inviterId, userId));

    return {
      referralCode: user?.referralCode ?? null,
      totalReferred: stats?.totalReferred ?? 0,
      totalGpEarned: Number(stats?.totalGpEarned) || 0,
    };
  }

  // ===== IAP (In-App Purchase) Methods =====
  
  async createIapTransaction(data: InsertIapTransaction): Promise<IapTransaction> {
    const [result] = await db.insert(iapTransactions).values(data).returning();
    return result;
  }

  async getIapTransactionByTransactionId(transactionId: string): Promise<IapTransaction | undefined> {
    const [result] = await db
      .select()
      .from(iapTransactions)
      .where(eq(iapTransactions.transactionId, transactionId));
    return result;
  }

  async getIapTransactionsByUser(userId: string, limit: number = 50): Promise<IapTransaction[]> {
    return db
      .select()
      .from(iapTransactions)
      .where(eq(iapTransactions.userId, userId))
      .orderBy(desc(iapTransactions.createdAt))
      .limit(limit);
  }

  async updateIapTransactionStatus(
    transactionId: string,
    status: IapStatus,
    options?: {
      verifiedAt?: Date;
      rawResponse?: any;
      errorMessage?: string;
    }
  ): Promise<IapTransaction | undefined> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };
    
    if (options?.verifiedAt) updateData.verifiedAt = options.verifiedAt;
    if (options?.rawResponse) updateData.rawResponse = options.rawResponse;
    if (options?.errorMessage) updateData.errorMessage = options.errorMessage;

    const [result] = await db
      .update(iapTransactions)
      .set(updateData)
      .where(eq(iapTransactions.transactionId, transactionId))
      .returning();
    return result;
  }

  async processVerifiedIapPurchase(
    userId: string,
    transactionId: string,
    productId: string
  ): Promise<{ success: boolean; pointsAwarded: number; message: string }> {
    // Check if product exists
    const product = IAP_PRODUCTS[productId];
    if (!product) {
      return { success: false, pointsAwarded: 0, message: `Unknown product: ${productId}` };
    }

    // Check if already processed (idempotency)
    const existing = await this.getIapTransactionByTransactionId(transactionId);
    if (existing?.status === 'verified') {
      return { 
        success: true, 
        pointsAwarded: existing.pointsAwarded, 
        message: 'Purchase already processed' 
      };
    }

    const totalPoints = product.points + product.bonusPoints;

    // Award credits (paid points, not GP)
    await this.addUserPoints(userId, totalPoints, 'purchase', `인앱결제: ${product.displayName}`);

    return { 
      success: true, 
      pointsAwarded: totalPoints, 
      message: `${totalPoints.toLocaleString()} 포인트가 지급되었습니다!` 
    };
  }

  getIapProductInfo(productId: string): { points: number; bonusPoints: number; displayName: string } | undefined {
    return IAP_PRODUCTS[productId];
  }

  getAllIapProducts(): Record<string, { points: number; bonusPoints: number; displayName: string }> {
    return IAP_PRODUCTS;
  }

  // K-JOBS Assessments
  async createKjobsAssessment(data: InsertKjobsAssessment): Promise<KjobsAssessment> {
    const [assessment] = await db
      .insert(kjobsAssessments)
      .values(data)
      .returning();
    return assessment;
  }

  async getKjobsAssessment(id: string): Promise<KjobsAssessment | undefined> {
    const [assessment] = await db
      .select()
      .from(kjobsAssessments)
      .where(eq(kjobsAssessments.id, id));
    return assessment;
  }

  async updateKjobsAssessment(id: string, data: Partial<KjobsAssessment>): Promise<KjobsAssessment> {
    const [assessment] = await db
      .update(kjobsAssessments)
      .set(data)
      .where(eq(kjobsAssessments.id, id))
      .returning();
    return assessment;
  }

  async getIncompleteKjobsAssessment(userId: string): Promise<KjobsAssessment | undefined> {
    const [assessment] = await db
      .select()
      .from(kjobsAssessments)
      .where(and(
        eq(kjobsAssessments.userId, userId),
        inArray(kjobsAssessments.status, ['pending', 'in_progress'])
      ))
      .orderBy(desc(kjobsAssessments.createdAt))
      .limit(1);
    return assessment;
  }

  async getLatestCompletedKjobsAssessment(userId: string): Promise<KjobsAssessment | undefined> {
    const [assessment] = await db
      .select()
      .from(kjobsAssessments)
      .where(and(
        eq(kjobsAssessments.userId, userId),
        eq(kjobsAssessments.status, 'completed')
      ))
      .orderBy(desc(kjobsAssessments.completedAt))
      .limit(1);
    return assessment;
  }

  async getKjobsAssessmentsByUser(userId: string): Promise<KjobsAssessment[]> {
    return db
      .select()
      .from(kjobsAssessments)
      .where(eq(kjobsAssessments.userId, userId))
      .orderBy(desc(kjobsAssessments.createdAt));
  }

  // ===== Groups =====
  async createGroup(data: InsertGroup): Promise<Group> {
    const [group] = await db.insert(groups).values(data).returning();
    // Add owner as a member with 'owner' role
    await db.insert(groupMembers).values({
      groupId: group.id,
      userId: data.ownerId,
      role: 'owner',
    });
    return group;
  }

  async getGroup(id: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async updateGroup(id: string, data: Partial<InsertGroup>): Promise<Group> {
    const [group] = await db
      .update(groups)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(groups.id, id))
      .returning();
    return group;
  }

  async deleteGroup(id: string): Promise<void> {
    await db.delete(groups).where(eq(groups.id, id));
  }

  async getGroupsByOwner(ownerId: string): Promise<Group[]> {
    return db.select().from(groups).where(eq(groups.ownerId, ownerId));
  }

  async getAllGroups(): Promise<GroupWithStats[]> {
    const allGroups = await db.select().from(groups).orderBy(desc(groups.createdAt));
    
    const groupsWithStats: GroupWithStats[] = await Promise.all(
      allGroups.map(async (group) => {
        const [memberCount] = await db
          .select({ count: count() })
          .from(groupMembers)
          .where(eq(groupMembers.groupId, group.id));
        
        const memberUserIds = await db
          .select({ userId: groupMembers.userId })
          .from(groupMembers)
          .where(eq(groupMembers.groupId, group.id));
        
        let analysisCount = 0;
        let lastActivityAt: Date | null = null;
        
        if (memberUserIds.length > 0) {
          const userIds = memberUserIds.map(m => m.userId);
          const profilesResult = await db
            .select({ id: profiles.id })
            .from(profiles)
            .where(inArray(profiles.userId, userIds));
          
          if (profilesResult.length > 0) {
            const profileIds = profilesResult.map(p => p.id);
            const [analysisResult] = await db
              .select({ count: count() })
              .from(careerAnalyses)
              .where(inArray(careerAnalyses.profileId, profileIds));
            analysisCount = analysisResult?.count ?? 0;
            
            const [lastAnalysis] = await db
              .select({ createdAt: careerAnalyses.createdAt })
              .from(careerAnalyses)
              .where(inArray(careerAnalyses.profileId, profileIds))
              .orderBy(desc(careerAnalyses.createdAt))
              .limit(1);
            lastActivityAt = lastAnalysis?.createdAt ?? null;
          }
        }
        
        return {
          ...group,
          memberCount: memberCount?.count ?? 0,
          analysisCount,
          lastActivityAt,
        };
      })
    );
    
    return groupsWithStats;
  }

  async getGroupWithStats(id: string): Promise<GroupWithStats | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    if (!group) return undefined;
    
    const [memberCount] = await db
      .select({ count: count() })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, id));
    
    const memberUserIds = await db
      .select({ userId: groupMembers.userId })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, id));
    
    let analysisCount = 0;
    let lastActivityAt: Date | null = null;
    
    if (memberUserIds.length > 0) {
      const userIds = memberUserIds.map(m => m.userId);
      const profilesResult = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(inArray(profiles.userId, userIds));
      
      if (profilesResult.length > 0) {
        const profileIds = profilesResult.map(p => p.id);
        const [analysisResult] = await db
          .select({ count: count() })
          .from(careerAnalyses)
          .where(inArray(careerAnalyses.profileId, profileIds));
        analysisCount = analysisResult?.count ?? 0;
        
        const [lastAnalysis] = await db
          .select({ createdAt: careerAnalyses.createdAt })
          .from(careerAnalyses)
          .where(inArray(careerAnalyses.profileId, profileIds))
          .orderBy(desc(careerAnalyses.createdAt))
          .limit(1);
        lastActivityAt = lastAnalysis?.createdAt ?? null;
      }
    }
    
    return {
      ...group,
      memberCount: memberCount?.count ?? 0,
      analysisCount,
      lastActivityAt,
    };
  }

  // ===== Group Members =====
  async addGroupMember(data: InsertGroupMember): Promise<GroupMember> {
    const [member] = await db.insert(groupMembers).values(data).returning();
    return member;
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await db.delete(groupMembers).where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))
    );
  }

  async updateGroupMemberRole(groupId: string, userId: string, role: GroupMemberRole): Promise<GroupMember> {
    const [member] = await db
      .update(groupMembers)
      .set({ role })
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .returning();
    return member;
  }

  async getGroupMembers(groupId: string): Promise<GroupMemberWithUser[]> {
    const members = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));
    
    const membersWithUsers: GroupMemberWithUser[] = await Promise.all(
      members.map(async (member) => {
        const [user] = await db
          .select({
            id: users.id,
            email: users.email,
            displayName: users.displayName,
            profileImageUrl: users.profileImageUrl,
          })
          .from(users)
          .where(eq(users.id, member.userId));
        
        // Get analysis count for this user
        const userProfiles = await db
          .select({ id: profiles.id })
          .from(profiles)
          .where(eq(profiles.userId, member.userId));
        
        let analysisCount = 0;
        let lastAnalyzedAt: Date | null = null;
        
        if (userProfiles.length > 0) {
          const profileIds = userProfiles.map(p => p.id);
          const [countResult] = await db
            .select({ count: count() })
            .from(careerAnalyses)
            .where(inArray(careerAnalyses.profileId, profileIds));
          analysisCount = countResult?.count ?? 0;
          
          const [lastAnalysis] = await db
            .select({ createdAt: careerAnalyses.createdAt })
            .from(careerAnalyses)
            .where(inArray(careerAnalyses.profileId, profileIds))
            .orderBy(desc(careerAnalyses.createdAt))
            .limit(1);
          lastAnalyzedAt = lastAnalysis?.createdAt ?? null;
        }
        
        return {
          ...member,
          user: user || { id: member.userId, email: null, displayName: null, profileImageUrl: null },
          analysisCount,
          lastAnalyzedAt,
        };
      })
    );
    
    return membersWithUsers;
  }

  async getUserGroups(userId: string): Promise<Array<Group & { role: GroupMemberRole }>> {
    const memberships = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId));
    
    const groupsWithRole = await Promise.all(
      memberships.map(async (membership) => {
        const [group] = await db.select().from(groups).where(eq(groups.id, membership.groupId));
        return group ? { ...group, role: membership.role as GroupMemberRole } : null;
      })
    );
    
    return groupsWithRole.filter((g): g is Group & { role: GroupMemberRole } => g !== null);
  }

  async isGroupMember(groupId: string, userId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
    return !!member;
  }

  async getGroupMemberRole(groupId: string, userId: string): Promise<GroupMemberRole | undefined> {
    const [member] = await db
      .select({ role: groupMembers.role })
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
    return member?.role as GroupMemberRole | undefined;
  }

  async getGroupMemberAnalyses(groupId: string): Promise<Array<CareerAnalysis & { user: Pick<User, 'id' | 'email' | 'displayName'> }>> {
    const memberUserIds = await db
      .select({ userId: groupMembers.userId })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));
    
    if (memberUserIds.length === 0) return [];
    
    const userIds = memberUserIds.map(m => m.userId);
    
    // Get all profiles for these users
    const userProfiles = await db
      .select()
      .from(profiles)
      .where(inArray(profiles.userId, userIds));
    
    if (userProfiles.length === 0) return [];
    
    const profileIds = userProfiles.map(p => p.id);
    const profileUserMap = new Map(userProfiles.map(p => [p.id, p.userId]));
    
    // Get all analyses for these profiles
    const analyses = await db
      .select()
      .from(careerAnalyses)
      .where(inArray(careerAnalyses.profileId, profileIds))
      .orderBy(desc(careerAnalyses.createdAt));
    
    // Get user info for each analysis
    const analysesWithUsers = await Promise.all(
      analyses.map(async (analysis) => {
        const userId = profileUserMap.get(analysis.profileId);
        if (!userId) return null;
        
        const [user] = await db
          .select({
            id: users.id,
            email: users.email,
            displayName: users.displayName,
          })
          .from(users)
          .where(eq(users.id, userId));
        
        return {
          ...analysis,
          user: user || { id: userId, email: null, displayName: null },
        };
      })
    );
    
    return analysesWithUsers.filter((a): a is CareerAnalysis & { user: Pick<User, 'id' | 'email' | 'displayName'> } => a !== null);
  }

  async getUserManagedGroups(userId: string): Promise<Array<Group & { role: GroupMemberRole }>> {
    // Get groups where user is admin, consultant, or teacher
    const memberships = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.userId, userId),
          inArray(groupMembers.role, ['admin', 'consultant', 'teacher'])
        )
      );
    
    const groupsWithRole = await Promise.all(
      memberships.map(async (membership) => {
        const [group] = await db.select().from(groups).where(eq(groups.id, membership.groupId));
        return group ? { ...group, role: membership.role as GroupMemberRole } : null;
      })
    );
    
    return groupsWithRole.filter((g): g is Group & { role: GroupMemberRole } => g !== null);
  }

  async getUserManagedGroupMemberIds(userId: string): Promise<string[]> {
    // Get all groups where user is admin, consultant, or teacher
    const managedGroups = await this.getUserManagedGroups(userId);
    
    if (managedGroups.length === 0) return [];
    
    const groupIds = managedGroups.map(g => g.id);
    
    // Get all member user IDs from these groups
    const members = await db
      .select({ userId: groupMembers.userId })
      .from(groupMembers)
      .where(inArray(groupMembers.groupId, groupIds));
    
    // Return unique user IDs
    return Array.from(new Set(members.map(m => m.userId)));
  }

  async getGroupStats(groupId: string): Promise<{
    totalMembers: number;
    completedAnalyses: number;
    completedProfiles: number;
    completedGoals: number;
    completedEssays: number;
    progressRate: number;
    profileTypeBreakdown: Array<{ type: string; count: number }>;
    analysisTypeBreakdown: Array<{ type: string; count: number }>;
  }> {
    // Get all group member user IDs
    const memberRows = await db
      .select({ userId: groupMembers.userId })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));
    
    const memberUserIds = memberRows.map(m => m.userId);
    const totalMembers = memberUserIds.length;
    
    if (totalMembers === 0) {
      return {
        totalMembers: 0,
        completedAnalyses: 0,
        completedProfiles: 0,
        completedGoals: 0,
        completedEssays: 0,
        progressRate: 0,
        profileTypeBreakdown: [],
        analysisTypeBreakdown: [],
      };
    }
    
    // Get profiles for these users
    const userProfiles = await db
      .select()
      .from(profiles)
      .where(inArray(profiles.userId, memberUserIds));
    
    const completedProfiles = new Set(userProfiles.map(p => p.userId)).size;
    const profileIds = userProfiles.map(p => p.id);
    
    // Calculate profile type breakdown
    const profileTypeCounts: Record<string, number> = {};
    userProfiles.forEach(p => {
      profileTypeCounts[p.type] = (profileTypeCounts[p.type] || 0) + 1;
    });
    const profileTypeBreakdown = Object.entries(profileTypeCounts).map(([type, count]) => ({
      type,
      count,
    }));
    
    // Get analyses (any analysis counts as completed since schema doesn't have status)
    let completedAnalyses = 0;
    const analysisTypeCounts: Record<string, number> = {};
    if (profileIds.length > 0) {
      const analyses = await db
        .select()
        .from(careerAnalyses)
        .where(inArray(careerAnalyses.profileId, profileIds));
      const usersWithAnalysis = new Set(
        analyses.map(a => userProfiles.find(p => p.id === a.profileId)?.userId)
      );
      completedAnalyses = usersWithAnalysis.size;
      
      // Calculate analysis type breakdown based on profile type
      analyses.forEach(a => {
        const profile = userProfiles.find(p => p.id === a.profileId);
        if (profile) {
          analysisTypeCounts[profile.type] = (analysisTypeCounts[profile.type] || 0) + 1;
        }
      });
    }
    const analysisTypeBreakdown = Object.entries(analysisTypeCounts).map(([type, count]) => ({
      type,
      count,
    }));
    
    // Get profiles with goals (goals are linked via profileId)
    let completedGoals = 0;
    if (profileIds.length > 0) {
      const goalsResult = await db
        .select({ profileId: kompassGoals.profileId })
        .from(kompassGoals)
        .where(inArray(kompassGoals.profileId, profileIds));
      const profilesWithGoals = new Set(goalsResult.map(g => g.profileId));
      const usersWithGoals = new Set(
        Array.from(profilesWithGoals).map(pId => userProfiles.find(p => p.id === pId)?.userId)
      );
      completedGoals = usersWithGoals.size;
    }
    
    // Get profiles with essays (essays are linked via profileId)
    let completedEssays = 0;
    if (profileIds.length > 0) {
      const essaysResult = await db
        .select({ profileId: personalEssays.profileId })
        .from(personalEssays)
        .where(inArray(personalEssays.profileId, profileIds));
      const profilesWithEssays = new Set(essaysResult.map(e => e.profileId));
      const usersWithEssays = new Set(
        Array.from(profilesWithEssays).map(pId => userProfiles.find(p => p.id === pId)?.userId)
      );
      completedEssays = usersWithEssays.size;
    }
    
    // Calculate progress rate (average of profile + analysis completion)
    const progressRate = Math.round(
      ((completedProfiles / totalMembers) * 50 + (completedAnalyses / totalMembers) * 50)
    );
    
    return {
      totalMembers,
      completedAnalyses,
      completedProfiles,
      completedGoals,
      completedEssays,
      progressRate,
      profileTypeBreakdown,
      analysisTypeBreakdown,
    };
  }

  async getGroupDetailedStats(groupId: string): Promise<{
    recentAnalyses: Array<{
      userId: string;
      userName: string | null;
      profileType: string;
      analysisDate: string;
      summary: string | null;
    }>;
    profileTypeStats: Array<{ type: string; label: string; count: number; withAnalysis: number }>;
  }> {
    const profileTypeLabels: Record<string, string> = {
      general: "구직자",
      international: "외국인유학생",
      university: "대학생",
      high: "고등학생",
      middle: "중학생",
      elementary: "초등학생",
    };
    
    // Get all group member user IDs
    const memberRows = await db
      .select({ userId: groupMembers.userId })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));
    
    const memberUserIds = memberRows.map(m => m.userId);
    if (memberUserIds.length === 0) {
      return { recentAnalyses: [], profileTypeStats: [] };
    }
    
    // Get profiles and users
    const userProfiles = await db
      .select({
        profile: profiles,
        user: {
          id: users.id,
          displayName: users.displayName,
          email: users.email,
        },
      })
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(inArray(profiles.userId, memberUserIds));
    
    const profileIds = userProfiles.map(p => p.profile.id);
    
    // Get analyses
    let analysesList: any[] = [];
    if (profileIds.length > 0) {
      analysesList = await db
        .select()
        .from(careerAnalyses)
        .where(inArray(careerAnalyses.profileId, profileIds))
        .orderBy(desc(careerAnalyses.createdAt))
        .limit(10);
    }
    
    // Build recent analyses
    const recentAnalyses = analysesList.map(a => {
      const profileData = userProfiles.find(p => p.profile.id === a.profileId);
      let summary: string | null = null;
      if (a.stats && typeof a.stats === 'object') {
        summary = a.stats.overview?.summary || a.stats.summary || null;
      }
      return {
        userId: profileData?.user.id || '',
        userName: profileData?.user.displayName || profileData?.user.email?.split('@')[0] || null,
        profileType: profileData?.profile.type || 'general',
        analysisDate: a.createdAt?.toISOString() || '',
        summary,
      };
    });
    
    // Build profile type stats
    const profileTypeCounts: Record<string, { count: number; withAnalysis: number }> = {};
    Object.keys(profileTypeLabels).forEach(type => {
      profileTypeCounts[type] = { count: 0, withAnalysis: 0 };
    });
    
    userProfiles.forEach(p => {
      const type = p.profile.type;
      if (!profileTypeCounts[type]) {
        profileTypeCounts[type] = { count: 0, withAnalysis: 0 };
      }
      profileTypeCounts[type].count++;
      
      // Check if has analysis
      const hasAnalysis = analysesList.some(a => a.profileId === p.profile.id);
      if (hasAnalysis) {
        profileTypeCounts[type].withAnalysis++;
      }
    });
    
    const profileTypeStats = Object.entries(profileTypeCounts)
      .filter(([_, data]) => data.count > 0)
      .map(([type, data]) => ({
        type,
        label: profileTypeLabels[type] || type,
        count: data.count,
        withAnalysis: data.withAnalysis,
      }));
    
    return { recentAnalyses, profileTypeStats };
  }

  async getGroupMemberProgress(groupId: string): Promise<Array<{
    userId: string;
    email: string;
    displayName: string | null;
    profileImageUrl: string | null;
    hasProfile: boolean;
    hasAnalysis: boolean;
    hasGoals: boolean;
    hasEssay: boolean;
    analysisDate: string | null;
    profileType: string | null;
    progressScore: number;
  }>> {
    // Get all group members with user info
    const memberRows = await db
      .select({
        userId: groupMembers.userId,
        email: users.email,
        displayName: users.displayName,
        profileImageUrl: users.profileImageUrl,
      })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, groupId));
    
    const memberUserIds = memberRows.map(m => m.userId);
    if (memberUserIds.length === 0) return [];
    
    // Get profiles for these users
    const userProfiles = await db
      .select()
      .from(profiles)
      .where(inArray(profiles.userId, memberUserIds));
    const profilesByUser = new Map(userProfiles.map(p => [p.userId, p]));
    
    // Get analyses for these profiles
    const profileIds = userProfiles.map(p => p.id);
    let analysesByProfile = new Map<string, any>();
    if (profileIds.length > 0) {
      const analyses = await db
        .select()
        .from(careerAnalyses)
        .where(inArray(careerAnalyses.profileId, profileIds));
      analysesByProfile = new Map(analyses.map(a => [a.profileId, a]));
    }
    
    // Get profiles with goals (goals are linked via profileId)
    let profilesWithGoals = new Set<string>();
    if (profileIds.length > 0) {
      const goalsResult = await db
        .select({ profileId: kompassGoals.profileId })
        .from(kompassGoals)
        .where(inArray(kompassGoals.profileId, profileIds));
      profilesWithGoals = new Set(goalsResult.map(g => g.profileId));
    }
    
    // Get profiles with essays (essays are linked via profileId)
    let profilesWithEssays = new Set<string>();
    if (profileIds.length > 0) {
      const essaysResult = await db
        .select({ profileId: personalEssays.profileId })
        .from(personalEssays)
        .where(inArray(personalEssays.profileId, profileIds));
      profilesWithEssays = new Set(essaysResult.map(e => e.profileId));
    }
    
    return memberRows.map(member => {
      const profile = profilesByUser.get(member.userId);
      const analysis = profile ? analysesByProfile.get(profile.id) : null;
      const hasGoals = profile ? profilesWithGoals.has(profile.id) : false;
      const hasEssay = profile ? profilesWithEssays.has(profile.id) : false;
      
      // Calculate progress score (0-100)
      let progressScore = 0;
      if (profile) progressScore += 25;
      if (analysis) progressScore += 50;
      if (hasGoals) progressScore += 15;
      if (hasEssay) progressScore += 10;
      
      return {
        userId: member.userId,
        email: member.email || '',
        displayName: member.displayName,
        profileImageUrl: member.profileImageUrl,
        hasProfile: !!profile,
        hasAnalysis: !!analysis,
        hasGoals,
        hasEssay,
        analysisDate: analysis?.createdAt?.toISOString() || null,
        profileType: profile?.type || null,
        progressScore,
      };
    });
  }

  async getGroupMemberDetail(memberId: string): Promise<{
    user: {
      id: string;
      email: string;
      displayName: string | null;
      profileImageUrl: string | null;
      createdAt: string;
    };
    profile: {
      id: string;
      profileType: string;
      name: string | null;
      createdAt: string;
      updatedAt: string | null;
    } | null;
    analysis: {
      id: string;
      status: string;
      createdAt: string;
      analysisResult: any;
    } | null;
    goals: Array<{
      id: string;
      title: string;
      status: string;
      progress: number;
    }>;
    essays: Array<{
      id: string;
      title: string | null;
      createdAt: string;
    }>;
  }> {
    // Get user info
    const [user] = await db.select().from(users).where(eq(users.id, memberId));
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get profile
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, memberId));
    
    // Get latest analysis
    let analysis = null;
    if (profile) {
      const [latestAnalysis] = await db
        .select()
        .from(careerAnalyses)
        .where(eq(careerAnalyses.profileId, profile.id))
        .orderBy(desc(careerAnalyses.createdAt))
        .limit(1);
      
      if (latestAnalysis) {
        analysis = {
          id: latestAnalysis.id.toString(),
          status: 'completed', // Analysis exists means it's completed
          createdAt: latestAnalysis.createdAt?.toISOString() || '',
          analysisResult: latestAnalysis.stats || latestAnalysis.summary || null,
        };
      }
    }
    
    // Get goals (linked via profileId)
    let goalRows: Array<{ id: string; progress: number; targetYear: number }> = [];
    if (profile) {
      goalRows = await db
        .select({
          id: kompassGoals.id,
          progress: kompassGoals.progress,
          targetYear: kompassGoals.targetYear,
        })
        .from(kompassGoals)
        .where(eq(kompassGoals.profileId, profile.id))
        .limit(10);
    }
    
    // Get essays (linked via profileId)
    let essayRows: Array<{ id: string; title: string | null; createdAt: Date | null }> = [];
    if (profile) {
      essayRows = await db
        .select({
          id: personalEssays.id,
          title: personalEssays.title,
          createdAt: personalEssays.createdAt,
        })
        .from(personalEssays)
        .where(eq(personalEssays.profileId, profile.id))
        .limit(10);
    }
    
    return {
      user: {
        id: user.id,
        email: user.email || '',
        displayName: user.displayName,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt?.toISOString() || '',
      },
      profile: profile ? {
        id: profile.id.toString(),
        profileType: profile.type, // Schema uses 'type' not 'profileType'
        name: profile.title, // Schema uses 'title' not 'name'
        createdAt: profile.createdAt?.toISOString() || '',
        updatedAt: profile.updatedAt?.toISOString() || null,
      } : null,
      analysis,
      goals: goalRows.map(g => ({
        id: g.id.toString(),
        title: `${g.targetYear}년 목표`, // Goals don't have title field, use year
        status: 'active',
        progress: g.progress || 0,
      })),
      essays: essayRows.map(e => ({
        id: e.id.toString(),
        title: e.title,
        createdAt: e.createdAt?.toISOString() || '',
      })),
    };
  }
}

export const storage = new DatabaseStorage();
