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
export const DEFAULT_PAGE_CONFIGS: Record<string, { title: string; defaultRoles: UserRole[]; isLocked?: boolean }> = {
  '/dashboard': { title: '대시보드', defaultRoles: ['user', 'staff', 'admin'] },
  '/profile': { title: '프로필', defaultRoles: ['user', 'staff', 'admin'] },
  '/analysis': { title: 'AI 분석', defaultRoles: ['user', 'staff', 'admin'] },
  '/goals': { title: '목표 관리', defaultRoles: ['user', 'staff', 'admin'] },
  '/kompass': { title: 'Kompass', defaultRoles: ['user', 'staff', 'admin'] },
  '/essays': { title: '자기소개서', defaultRoles: ['user', 'staff', 'admin'] },
  '/explorer': { title: '직업 탐색', defaultRoles: ['user', 'staff', 'admin'] },
  '/settings': { title: '설정', defaultRoles: ['user', 'staff', 'admin'] },
  '/recharge': { title: '포인트 충전', defaultRoles: ['user', 'staff', 'admin'] },
  '/admin': { title: '관리자', defaultRoles: ['staff', 'admin'], isLocked: true },
};
