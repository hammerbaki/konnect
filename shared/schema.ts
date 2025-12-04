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

// ===== USERS TABLE (Required for Replit Auth) =====
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  credits: integer("credits").notNull().default(10), // Free credits for AI usage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

// ===== PROFILES TABLE =====
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // elementary, middle, high, university, general
  title: text("title").notNull(),
  icon: varchar("icon", { length: 50 }), // icon identifier
  color: varchar("color", { length: 50 }), // color class
  lastAnalyzed: timestamp("last_analyzed"),
  profileData: jsonb("profile_data"), // Flexible JSONB for profile-specific fields
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
  summary: text("summary"), // Main AI insight summary
  stats: jsonb("stats"), // { label1, val1, label2, val2, label3, val3 }
  chartData: jsonb("chart_data"), // { radar: [...], bar: [...] }
  recommendations: jsonb("recommendations"), // Array of recommended careers/paths
  aiRawResponse: text("ai_raw_response"), // Full Claude response for debugging
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
  category: varchar("category", { length: 50 }).notNull(), // 고등학생, 대학생, 구직자
  topic: varchar("topic", { length: 100 }).notNull(), // Specific essay topic
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
  visionData: jsonb("vision_data").notNull(), // Entire goal tree hierarchy
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
