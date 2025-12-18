import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  real,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ===== SESSION TABLE (Required for Replit Auth) =====
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles
export type UserRole = 'user' | 'staff' | 'admin';

// ===== USERS TABLE (with shared identity fields) =====
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  credits: integer("credits").notNull().default(1000),
  role: varchar("role", { length: 20 }).notNull().default('user'), // 'user' | 'staff' | 'admin'
  // Shared identity fields (consistent across all profile types)
  displayName: varchar("display_name", { length: 100 }),
  gender: varchar("gender", { length: 20 }),
  birthDate: timestamp("birth_date"),
  // User settings fields
  phone: varchar("phone", { length: 20 }),
  marketingConsent: integer("marketing_consent").notNull().default(0), // 0 = false, 1 = true
  emailNotifications: integer("email_notifications").notNull().default(1), // 0 = false, 1 = true
  pushNotifications: integer("push_notifications").notNull().default(1), // 0 = false, 1 = true
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const updateUserIdentitySchema = z.object({
  displayName: z.string().optional(),
  email: z.string().optional(),
  gender: z.string().optional(),
  birthDate: z.preprocess(
    (val) => (typeof val === 'string' ? new Date(val) : val),
    z.union([z.date(), z.null()]).optional()
  ),
});

export const updateUserSettingsSchema = z.object({
  phone: z.string().nullable().optional(),
  marketingConsent: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
});

export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpdateUserIdentity = z.infer<typeof updateUserIdentitySchema>;

// ===== CAREERS TABLE (Korean Career Data) =====
export const careers = pgTable("careers", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  category: varchar("category"),
  description: text("description"),
  fullData: jsonb("full_data"),
  detailData: jsonb("detail_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_careers_category").on(table.category),
  index("IDX_careers_name").on(table.name),
]);

export const insertCareerSchema = createInsertSchema(careers).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertCareer = z.infer<typeof insertCareerSchema>;
export type Career = typeof careers.$inferSelect;

// ===== CAREER STATS TABLE (Pre-computed statistics) =====
export const careerStats = pgTable("career_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  statsKey: varchar("stats_key", { length: 50 }).notNull().unique(),
  statsData: jsonb("stats_data").notNull(),
  computedAt: timestamp("computed_at").defaultNow(),
});

export const insertCareerStatsSchema = createInsertSchema(careerStats).omit({
  id: true,
  computedAt: true,
});

export type InsertCareerStats = z.infer<typeof insertCareerStatsSchema>;
export type CareerStats = typeof careerStats.$inferSelect;

// ===== PROFILES TABLE =====
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  title: text("title").notNull(),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 50 }),
  lastAnalyzed: timestamp("last_analyzed"),
  profileData: jsonb("profile_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  analyses: many(careerAnalyses),
  essays: many(personalEssays),
  kompassGoals: many(kompassGoals),
}));

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

// ===== CAREER ANALYSES TABLE =====
export const careerAnalyses = pgTable("career_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  analysisDate: timestamp("analysis_date").defaultNow(),
  summary: text("summary"),
  stats: jsonb("stats"),
  chartData: jsonb("chart_data"),
  recommendations: jsonb("recommendations"),
  aiRawResponse: text("ai_raw_response"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const careerAnalysesRelations = relations(careerAnalyses, ({ one }) => ({
  profile: one(profiles, {
    fields: [careerAnalyses.profileId],
    references: [profiles.id],
  }),
}));

export const insertCareerAnalysisSchema = createInsertSchema(careerAnalyses).omit({
  id: true,
  createdAt: true,
});

export type InsertCareerAnalysis = z.infer<typeof insertCareerAnalysisSchema>;
export type CareerAnalysis = typeof careerAnalyses.$inferSelect;

// ===== PERSONAL ESSAYS TABLE =====
export const personalEssays = pgTable("personal_essays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 50 }).notNull(),
  topic: varchar("topic", { length: 100 }).notNull(),
  title: text("title"),
  content: text("content"),
  draftVersion: integer("draft_version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const personalEssaysRelations = relations(personalEssays, ({ one }) => ({
  profile: one(profiles, {
    fields: [personalEssays.profileId],
    references: [profiles.id],
  }),
}));

export const insertPersonalEssaySchema = createInsertSchema(personalEssays).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPersonalEssay = z.infer<typeof insertPersonalEssaySchema>;
export type PersonalEssay = typeof personalEssays.$inferSelect;

// ===== KOMPASS GOALS TABLE =====
export const kompassGoals = pgTable("kompass_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  targetYear: integer("target_year").notNull(),
  visionData: jsonb("vision_data").notNull(),
  progress: integer("progress").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const kompassGoalsRelations = relations(kompassGoals, ({ one }) => ({
  profile: one(profiles, {
    fields: [kompassGoals.profileId],
    references: [profiles.id],
  }),
}));

export const insertKompassGoalSchema = createInsertSchema(kompassGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertKompassGoal = z.infer<typeof insertKompassGoalSchema>;
export type KompassGoal = typeof kompassGoals.$inferSelect;

// ===== AI JOBS TABLE (Queue-based AI processing) =====
export const aiJobs = pgTable("ai_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  profileId: varchar("profile_id")
    .references(() => profiles.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // 'analysis' | 'essay' | 'goal'
  status: varchar("status", { length: 20 }).notNull().default("queued"), // 'queued' | 'processing' | 'completed' | 'failed'
  progress: integer("progress").notNull().default(0), // 0-100
  payload: jsonb("payload"), // Input data for the AI job
  result: jsonb("result"), // Output from AI
  error: text("error"), // Error message if failed
  inputTokens: integer("input_tokens").default(0), // Claude API input tokens
  outputTokens: integer("output_tokens").default(0), // Claude API output tokens
  cacheReadTokens: integer("cache_read_tokens").default(0), // Claude API cache read tokens
  cacheWriteTokens: integer("cache_write_tokens").default(0), // Claude API cache write tokens
  totalTokens: integer("total_tokens").default(0), // Total tokens used
  estimatedCostCents: integer("estimated_cost_cents").default(0), // Estimated cost in USD cents
  queuedAt: timestamp("queued_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("IDX_ai_jobs_user").on(table.userId),
  index("IDX_ai_jobs_status").on(table.status),
]);

export const aiJobsRelations = relations(aiJobs, ({ one }) => ({
  user: one(users, {
    fields: [aiJobs.userId],
    references: [users.id],
  }),
  profile: one(profiles, {
    fields: [aiJobs.profileId],
    references: [profiles.id],
  }),
}));

export const insertAiJobSchema = createInsertSchema(aiJobs).omit({
  id: true,
  queuedAt: true,
  startedAt: true,
  completedAt: true,
});

export type InsertAiJob = z.infer<typeof insertAiJobSchema>;
export type AiJob = typeof aiJobs.$inferSelect;
export type AiJobType = 'analysis' | 'essay' | 'essay_revision' | 'goal';
export type AiJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

// ===== VISITOR METRICS TABLE (Hourly aggregated analytics) =====
export const visitorMetrics = pgTable("visitor_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  hour: integer("hour").notNull(), // 0-23
  pageViews: integer("page_views").notNull().default(0),
  uniqueVisitors: integer("unique_visitors").notNull().default(0),
  newUsers: integer("new_users").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_visitor_metrics_date").on(table.date),
  uniqueIndex("IDX_visitor_metrics_date_hour_unique").on(table.date, table.hour),
]);

export const insertVisitorMetricsSchema = createInsertSchema(visitorMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVisitorMetrics = z.infer<typeof insertVisitorMetricsSchema>;
export type VisitorMetrics = typeof visitorMetrics.$inferSelect;

// ===== USER SESSIONS TABLE (Login/Logout tracking) =====
export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventType: varchar("event_type", { length: 20 }).notNull(), // 'login' | 'logout'
  loginAt: timestamp("login_at").notNull().defaultNow(),
  logoutAt: timestamp("logout_at"),
  sessionDuration: integer("session_duration"), // Duration in seconds
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_user_sessions_user_id").on(table.userId),
  index("IDX_user_sessions_login_at").on(table.loginAt),
]);

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;

// ===== PAGE SETTINGS TABLE (Role-based page visibility) =====
export const pageSettings = pgTable("page_settings", {
  slug: varchar("slug", { length: 100 }).primaryKey(), // e.g., "/dashboard", "/admin"
  title: varchar("title", { length: 100 }).notNull(), // Display name e.g., "대시보드"
  description: text("description"), // Optional description
  defaultRoles: text("default_roles").array().notNull(), // Default roles that can access ['user', 'staff', 'admin']
  allowedRoles: text("allowed_roles").array(), // Override roles (null = use defaultRoles)
  isLocked: integer("is_locked").notNull().default(0), // 1 = cannot be changed by admin UI
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pageSettingsRelations = relations(pageSettings, ({ one }) => ({
  updater: one(users, {
    fields: [pageSettings.updatedBy],
    references: [users.id],
  }),
}));

export const insertPageSettingsSchema = createInsertSchema(pageSettings).omit({
  updatedAt: true,
});

export const updatePageSettingsSchema = z.object({
  allowedRoles: z.array(z.enum(['user', 'staff', 'admin'])).nullable(),
});

export type InsertPageSettings = z.infer<typeof insertPageSettingsSchema>;
export type PageSettings = typeof pageSettings.$inferSelect;
export type UpdatePageSettings = z.infer<typeof updatePageSettingsSchema>;

// Default page configurations (used when no DB record exists)
// New pages default to staff/admin only - explicitly add 'user' role in config to make visible to all
export const DEFAULT_PAGE_CONFIGS: Record<string, { title: string; defaultRoles: UserRole[]; isLocked?: boolean }> = {
  '/dashboard': { title: '대시보드', defaultRoles: ['user', 'staff', 'admin'] },
  '/profile': { title: '프로필', defaultRoles: ['user', 'staff', 'admin'] },
  '/analysis': { title: 'AI 분석', defaultRoles: ['user', 'staff', 'admin'] },
  '/goals': { title: '목표 관리', defaultRoles: ['user', 'staff', 'admin'] },
  '/kompass': { title: 'Kompass', defaultRoles: ['user', 'staff', 'admin'] },
  '/essays': { title: '자기소개서', defaultRoles: ['user', 'staff', 'admin'] },
  '/explorer': { title: '직업 탐색', defaultRoles: ['user', 'staff', 'admin'] },
  '/settings': { title: '설정', defaultRoles: ['user', 'staff', 'admin'] },
  '/recharge': { title: '포인트 충전', defaultRoles: ['staff', 'admin'] },
  '/admin': { title: '관리자', defaultRoles: ['staff', 'admin'], isLocked: true },
};

// Default roles for newly created pages not in DEFAULT_PAGE_CONFIGS
export const NEW_PAGE_DEFAULT_ROLES: UserRole[] = ['staff', 'admin'];

// ===== POINT PACKAGES TABLE (Available point packages for purchase) =====
export const pointPackages = pgTable("point_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  points: integer("points").notNull(),
  price: integer("price").notNull(), // Price in KRW
  bonusPoints: integer("bonus_points").notNull().default(0),
  description: text("description"),
  isActive: integer("is_active").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPointPackageSchema = createInsertSchema(pointPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createPointPackageSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다"),
  points: z.coerce.number().int().positive("포인트는 양수여야 합니다"),
  price: z.coerce.number().int().positive("가격은 양수여야 합니다"),
  bonusPoints: z.coerce.number().int().min(0).default(0),
  description: z.string().nullable().optional(),
  isActive: z.coerce.number().int().min(0).max(1).default(1),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const updatePointPackageSchema = z.object({
  name: z.string().min(1).optional(),
  points: z.coerce.number().int().positive().optional(),
  price: z.coerce.number().int().positive().optional(),
  bonusPoints: z.coerce.number().int().min(0).optional(),
  description: z.string().nullable().optional(),
  isActive: z.coerce.number().int().min(0).max(1).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export type InsertPointPackage = z.infer<typeof insertPointPackageSchema>;
export type CreatePointPackage = z.infer<typeof createPointPackageSchema>;
export type UpdatePointPackage = z.infer<typeof updatePointPackageSchema>;
export type PointPackage = typeof pointPackages.$inferSelect;

// Payment status type
export type PaymentStatus = 'pending' | 'ready' | 'done' | 'canceled' | 'partial_canceled' | 'aborted' | 'expired' | 'failed';

// ===== PAYMENTS TABLE (Toss Payments transactions) =====
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  packageId: varchar("package_id")
    .references(() => pointPackages.id),
  orderId: varchar("order_id", { length: 100 }).notNull().unique(),
  orderName: varchar("order_name", { length: 200 }).notNull(),
  amount: integer("amount").notNull(), // Amount in KRW
  pointsToAdd: integer("points_to_add").notNull(),
  status: varchar("status", { length: 30 }).notNull().default('pending'), // PaymentStatus
  paymentKey: varchar("payment_key", { length: 200 }),
  method: varchar("method", { length: 50 }), // 카드, 가상계좌, etc.
  approvedAt: timestamp("approved_at"),
  receiptUrl: text("receipt_url"),
  failReason: text("fail_reason"),
  rawResponse: jsonb("raw_response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_payments_user_id").on(table.userId),
  index("IDX_payments_order_id").on(table.orderId),
  index("IDX_payments_status").on(table.status),
]);

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  package: one(pointPackages, {
    fields: [payments.packageId],
    references: [pointPackages.id],
  }),
}));

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// ===== POINT TRANSACTIONS TABLE (Point change history) =====
export const pointTransactions = pgTable("point_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  paymentId: varchar("payment_id")
    .references(() => payments.id),
  amount: integer("amount").notNull(), // Positive for credit, negative for debit
  balanceAfter: integer("balance_after").notNull(),
  type: varchar("type", { length: 30 }).notNull(), // 'purchase' | 'usage' | 'admin_add' | 'admin_deduct' | 'refund' | 'bonus'
  description: text("description"),
  createdBy: varchar("created_by").references(() => users.id), // For admin operations
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_point_transactions_user_id").on(table.userId),
  index("IDX_point_transactions_type").on(table.type),
]);

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
  user: one(users, {
    fields: [pointTransactions.userId],
    references: [users.id],
  }),
  payment: one(payments, {
    fields: [pointTransactions.paymentId],
    references: [payments.id],
  }),
  creator: one(users, {
    fields: [pointTransactions.createdBy],
    references: [users.id],
  }),
}));

export const insertPointTransactionSchema = createInsertSchema(pointTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertPointTransaction = z.infer<typeof insertPointTransactionSchema>;
export type PointTransaction = typeof pointTransactions.$inferSelect;

// ===== SERVICE PRICING TABLE (Configurable point costs for AI services) =====
export type ServiceType = 'analysis' | 'essay' | 'essay_revision' | 'goal_yearly' | 'goal_half_yearly' | 'goal_monthly' | 'goal_weekly' | 'goal_daily';

export const servicePricing = pgTable("service_pricing", {
  id: varchar("id").primaryKey(), // Service type key (e.g., 'analysis', 'essay')
  name: varchar("name", { length: 100 }).notNull(), // Display name in Korean
  description: text("description"), // Short description
  pointCost: integer("point_cost").notNull().default(100),
  isActive: integer("is_active").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const insertServicePricingSchema = createInsertSchema(servicePricing).omit({
  updatedAt: true,
});

export const updateServicePricingSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  pointCost: z.coerce.number().int().min(0).optional(),
  isActive: z.coerce.number().int().min(0).max(1).optional(),
});

export type InsertServicePricing = z.infer<typeof insertServicePricingSchema>;
export type UpdateServicePricing = z.infer<typeof updateServicePricingSchema>;
export type ServicePricing = typeof servicePricing.$inferSelect;

// Default service pricing configurations
export const DEFAULT_SERVICE_PRICING: Record<ServiceType, { name: string; description: string; pointCost: number }> = {
  analysis: { name: '진로 분석', description: 'AI 기반 진로 분석 1회', pointCost: 100 },
  essay: { name: '자기소개서 생성', description: 'AI 자기소개서 작성 1회', pointCost: 100 },
  essay_revision: { name: '자기소개서 수정', description: 'AI 자기소개서 수정 1회', pointCost: 30 },
  goal_yearly: { name: '연간 목표 생성', description: 'AI 연간 목표 생성', pointCost: 100 },
  goal_half_yearly: { name: '반기 목표 생성', description: 'AI 반기 목표 생성', pointCost: 80 },
  goal_monthly: { name: '월간 목표 생성', description: 'AI 월간 목표 생성', pointCost: 50 },
  goal_weekly: { name: '주간 목표 생성', description: 'AI 주간 목표 생성', pointCost: 30 },
  goal_daily: { name: '일간 목표 생성', description: 'AI 일간 목표 생성', pointCost: 20 },
};

// ===== SYSTEM SETTINGS TABLE (Configurable system values) =====
export const systemSettings = pgTable("system_settings", {
  key: varchar("key").primaryKey(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  updatedAt: true,
});

export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
export type SystemSettings = typeof systemSettings.$inferSelect;

// Default system settings
export const DEFAULT_SYSTEM_SETTINGS: Record<string, { value: string; description: string }> = {
  signup_bonus: { value: '1000', description: '신규 가입 시 지급되는 포인트' },
};

// ===== REDEMPTION CODES TABLE (Coupon codes for points) =====
export const redemptionCodes = pgTable("redemption_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  pointAmount: integer("point_amount").notNull(),
  maxUses: integer("max_uses"), // null = unlimited
  currentUses: integer("current_uses").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  expiresAt: timestamp("expires_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_redemption_codes_code").on(table.code),
]);

export const insertRedemptionCodeSchema = createInsertSchema(redemptionCodes).omit({
  id: true,
  currentUses: true,
  createdAt: true,
  updatedAt: true,
});

export const createRedemptionCodeSchema = z.object({
  code: z.string().min(1, "코드는 필수입니다").max(50),
  pointAmount: z.coerce.number().int().positive("포인트는 양수여야 합니다"),
  maxUses: z.coerce.number().int().positive().nullable().optional(),
  isActive: z.coerce.number().int().min(0).max(1).default(1),
  expiresAt: z.preprocess(
    (val) => (typeof val === 'string' && val ? new Date(val) : val),
    z.union([z.date(), z.null()]).optional()
  ),
});

export type InsertRedemptionCode = z.infer<typeof insertRedemptionCodeSchema>;
export type CreateRedemptionCode = z.infer<typeof createRedemptionCodeSchema>;
export type RedemptionCode = typeof redemptionCodes.$inferSelect;

// ===== REDEMPTION HISTORY TABLE (Track who used which codes) =====
export const redemptionHistory = pgTable("redemption_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  codeId: varchar("code_id").notNull().references(() => redemptionCodes.id),
  pointsAwarded: integer("points_awarded").notNull(),
  redeemedAt: timestamp("redeemed_at").defaultNow(),
}, (table) => [
  index("IDX_redemption_history_user").on(table.userId),
  index("IDX_redemption_history_code").on(table.codeId),
]);

export const insertRedemptionHistorySchema = createInsertSchema(redemptionHistory).omit({
  id: true,
  redeemedAt: true,
});

export type InsertRedemptionHistory = z.infer<typeof insertRedemptionHistorySchema>;
export type RedemptionHistory = typeof redemptionHistory.$inferSelect;

// ===== NOTIFICATIONS TABLE (User notifications for completed jobs, etc.) =====
export type NotificationType = 'analysis_complete' | 'essay_complete' | 'goal_complete' | 'system' | 'points_added';

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 30 }).notNull(), // NotificationType
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  linkUrl: varchar("link_url", { length: 500 }), // Optional deep link
  sourceJobId: varchar("source_job_id").references(() => aiJobs.id, { onDelete: "set null" }),
  isRead: integer("is_read").notNull().default(0), // 0 = unread, 1 = read
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_notifications_user").on(table.userId),
  index("IDX_notifications_user_unread").on(table.userId, table.isRead),
  index("IDX_notifications_created").on(table.createdAt),
]);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  sourceJob: one(aiJobs, {
    fields: [notifications.sourceJobId],
    references: [aiJobs.id],
  }),
}));

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  readAt: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
