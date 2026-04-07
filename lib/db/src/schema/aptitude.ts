import { pgTable, serial, integer, text, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const aptitudeAnalysesTable = pgTable("aptitude_analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  surveyAnswers: json("survey_answers").$type<Record<string, number>>(),
  radarData: json("radar_data").$type<{ category: string; score: number }[]>(),
  recommendedMajors: json("recommended_majors").$type<{ name: string; matchRate: number; description: string; relatedJobs?: string[]; demand?: string | null }[]>(),
  analysisText: text("analysis_text"),
  interestScores: json("interest_scores").$type<{ category: string; categoryName: string; score: number }[]>(),
  aptitudeScores: json("aptitude_scores").$type<{ ability: string; abilityName: string; score: number }[]>(),
  recommendedJobs: json("recommended_jobs").$type<{ name: string; field: string; salary?: number | null; interestCategory: string }[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAptitudeAnalysisSchema = createInsertSchema(aptitudeAnalysesTable).omit({ id: true, createdAt: true });
export type InsertAptitudeAnalysis = z.infer<typeof insertAptitudeAnalysisSchema>;
export type AptitudeAnalysis = typeof aptitudeAnalysesTable.$inferSelect;
