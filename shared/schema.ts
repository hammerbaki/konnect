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

// ===== USERS TABLE (with shared identity fields) =====
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  credits: real("credits").notNull().default(10),
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
