import { pgTable, serial, varchar, text, json, timestamp, real, integer, numeric } from "drizzle-orm/pg-core";

export const cachedMajorsTable = pgTable("cached_majors", {
  id: serial("id").primaryKey(),
  majorSeq: varchar("major_seq", { length: 50 }),
  majorName: varchar("major_name", { length: 200 }).notNull(),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  relatedJobs: json("related_jobs").$type<string[]>(),
  relatedSubjects: json("related_subjects").$type<string[]>(),
  universities: json("universities").$type<{
    univName: string;
    univSeq?: string;
    competition?: number;
    employmentRate?: number;
    tuition?: number;
    scholarship?: number;
    region?: string;
    type?: string;
  }[]>(),
  hollandCode: varchar("holland_code", { length: 20 }),
  demand: varchar("demand", { length: 50 }),
  dataSource: varchar("data_source", { length: 50 }),
  syncedAt: timestamp("synced_at").defaultNow(),
  employmentRate: numeric("employment_rate", { precision: 5, scale: 2 }),
  employmentRateMale: numeric("employment_rate_male", { precision: 5, scale: 2 }),
  employmentRateFemale: numeric("employment_rate_female", { precision: 5, scale: 2 }),
  avgSalaryDistribution: json("avg_salary_distribution").$type<{ label: string; value: number }[]>(),
  jobSatisfaction: json("job_satisfaction").$type<{ label: string; value: number }[]>(),
});

export type CachedMajor = typeof cachedMajorsTable.$inferSelect;
export type InsertCachedMajor = typeof cachedMajorsTable.$inferInsert;

export const cachedJobsTable = pgTable("cached_jobs", {
  id: serial("id").primaryKey(),
  jobSeq: varchar("job_seq", { length: 50 }),
  jobName: varchar("job_name", { length: 200 }).notNull(),
  field: varchar("field", { length: 100 }),
  description: text("description"),
  relatedMajors: json("related_majors").$type<string[]>(),
  salary: integer("salary"),
  growth: varchar("growth", { length: 50 }),
  qualifications: json("qualifications").$type<string[]>(),
  hollandCode: varchar("holland_code", { length: 20 }),
  syncedAt: timestamp("synced_at").defaultNow(),
});

export type CachedJob = typeof cachedJobsTable.$inferSelect;
export type InsertCachedJob = typeof cachedJobsTable.$inferInsert;

export const jobInterestMappingTable = pgTable("job_interest_mapping", {
  id: serial("id").primaryKey(),
  hollandCode: varchar("holland_code", { length: 100 }).notNull().unique(),
  primaryCategory: varchar("primary_category", { length: 10 }).notNull(),
  secondaryCategory: varchar("secondary_category", { length: 10 }),
});

export type JobInterestMapping = typeof jobInterestMappingTable.$inferSelect;
export type InsertJobInterestMapping = typeof jobInterestMappingTable.$inferInsert;
