import { pgTable, serial, varchar, real, integer, timestamp } from "drizzle-orm/pg-core";

export const universityInfoTable = pgTable("university_info", {
  id: serial("id").primaryKey(),
  univName: varchar("univ_name", { length: 200 }).notNull(),
  campusType: varchar("campus_type", { length: 50 }),
  schoolType: varchar("school_type", { length: 50 }),
  univType: varchar("univ_type", { length: 50 }),
  foundationType: varchar("foundation_type", { length: 50 }),
  region: varchar("region", { length: 50 }),
  admissionQuota: integer("admission_quota"),
  graduateCount: integer("graduate_count"),
  studentCount: integer("student_count"),
  competitionRate: real("competition_rate"),
  admissionRate: real("admission_rate"),
  employmentRate: real("employment_rate"),
  foreignStudentCount: integer("foreign_student_count"),
  scholarshipPerStudent: integer("scholarship_per_student"),
  avgTuition: integer("avg_tuition"),
  educationCostPerStudent: integer("education_cost_per_student"),
  dormitoryRate: real("dormitory_rate"),
  syncedAt: timestamp("synced_at").defaultNow(),
});

export type UniversityInfo = typeof universityInfoTable.$inferSelect;
export type InsertUniversityInfo = typeof universityInfoTable.$inferInsert;
