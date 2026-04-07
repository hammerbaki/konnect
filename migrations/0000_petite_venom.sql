CREATE TABLE "ai_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"profile_id" varchar,
	"type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'queued' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"payload" jsonb,
	"result" jsonb,
	"error" text,
	"input_tokens" integer DEFAULT 0,
	"output_tokens" integer DEFAULT 0,
	"cache_read_tokens" integer DEFAULT 0,
	"cache_write_tokens" integer DEFAULT 0,
	"total_tokens" integer DEFAULT 0,
	"estimated_cost_cents" integer DEFAULT 0,
	"queued_at" timestamp DEFAULT now(),
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "cached_jobs" (
	"id" integer PRIMARY KEY NOT NULL,
	"job_seq" text,
	"job_name" text,
	"field" text,
	"description" text,
	"related_majors" jsonb DEFAULT '[]'::jsonb,
	"salary" integer,
	"growth" text,
	"qualifications" jsonb DEFAULT '[]'::jsonb,
	"holland_code" text,
	"synced_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cached_majors" (
	"id" integer PRIMARY KEY NOT NULL,
	"major_seq" text,
	"major_name" text,
	"category" text,
	"description" text,
	"related_jobs" jsonb DEFAULT '[]'::jsonb,
	"related_subjects" text,
	"universities" jsonb,
	"holland_code" text,
	"demand" text,
	"synced_at" timestamp DEFAULT now(),
	"data_source" text,
	"employment_rate" real,
	"employment_rate_male" real,
	"employment_rate_female" real,
	"avg_salary_distribution" jsonb,
	"job_satisfaction" jsonb
);
--> statement-breakpoint
CREATE TABLE "career_analyses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" varchar NOT NULL,
	"analysis_date" timestamp DEFAULT now(),
	"summary" text,
	"stats" jsonb,
	"chart_data" jsonb,
	"recommendations" jsonb,
	"ai_raw_response" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "career_stats" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stats_key" varchar(50) NOT NULL,
	"stats_data" jsonb NOT NULL,
	"computed_at" timestamp DEFAULT now(),
	CONSTRAINT "career_stats_stats_key_unique" UNIQUE("stats_key")
);
--> statement-breakpoint
CREATE TABLE "careers" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"category" varchar,
	"description" text,
	"full_data" jsonb,
	"detail_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gift_point_ledger" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" integer NOT NULL,
	"remaining_amount" integer NOT NULL,
	"source" varchar(30) NOT NULL,
	"source_id" varchar,
	"description" text,
	"expires_at" timestamp NOT NULL,
	"is_expired" integer DEFAULT 0 NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gift_point_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"ledger_id" varchar,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"type" varchar(30) NOT NULL,
	"description" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"joined_at" timestamp DEFAULT now(),
	"invited_by" varchar
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon_emoji" varchar(10) DEFAULT '👥',
	"color" varchar(20) DEFAULT '#3B82F6',
	"logo_url" varchar(500),
	"owner_id" varchar NOT NULL,
	"allowed_profile_types" jsonb DEFAULT '["general","international_university","university","high","middle","elementary"]'::jsonb,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "iap_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"platform" varchar(10) NOT NULL,
	"product_id" varchar(200) NOT NULL,
	"transaction_id" varchar(200) NOT NULL,
	"original_transaction_id" varchar(200),
	"receipt_data" text,
	"points_awarded" integer NOT NULL,
	"price_amount" integer,
	"price_currency" varchar(10),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp,
	"expires_at" timestamp,
	"raw_response" jsonb,
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "iap_transactions_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
CREATE TABLE "interview_answers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" varchar NOT NULL,
	"session_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"answer" text NOT NULL,
	"feedback_json" jsonb,
	"understanding_score" integer,
	"fit_score" integer,
	"logic_score" integer,
	"specificity_score" integer,
	"overall_score" integer,
	"improvement_suggestion" text,
	"improved_answer" text,
	"is_bookmarked" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interview_questions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"category" varchar(30) NOT NULL,
	"question_order" integer NOT NULL,
	"question" text NOT NULL,
	"question_reason" text,
	"guide_text" text,
	"related_strength" varchar(100),
	"related_weakness" varchar(100),
	"difficulty" varchar(20) DEFAULT 'medium',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interview_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"profile_id" varchar NOT NULL,
	"desired_job" varchar(200) NOT NULL,
	"session_type" varchar(50) DEFAULT 'practice' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"total_questions" integer DEFAULT 0 NOT NULL,
	"answered_questions" integer DEFAULT 0 NOT NULL,
	"profile_snapshot" jsonb,
	"kjobs_snapshot" jsonb,
	"analysis_snapshot" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "job_demand_cache" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_keyword" varchar(200) NOT NULL,
	"worknet_occupation_code" varchar(20),
	"demand_count" integer DEFAULT 0 NOT NULL,
	"period_days" integer DEFAULT 30 NOT NULL,
	"data_source" varchar(50) DEFAULT 'worknet' NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"raw_response" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kjobs_assessments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"profile_id" varchar,
	"session_id" varchar(100),
	"result_id" varchar(100),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"current_question" integer DEFAULT 1 NOT NULL,
	"answers" jsonb,
	"career_dna" text,
	"scores" jsonb,
	"facet_scores" jsonb,
	"keywords" jsonb,
	"recommended_jobs" jsonb,
	"growth_plan" jsonb,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "kompass_goals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" varchar NOT NULL,
	"target_year" integer NOT NULL,
	"start_month" integer DEFAULT 1 NOT NULL,
	"vision_data" jsonb NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar(30) NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"link_url" varchar(500),
	"source_job_id" varchar,
	"is_read" integer DEFAULT 0 NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "page_settings" (
	"slug" varchar(100) PRIMARY KEY NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" text,
	"default_roles" text[] NOT NULL,
	"allowed_roles" text[],
	"is_locked" integer DEFAULT 0 NOT NULL,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"package_id" varchar,
	"order_id" varchar(100) NOT NULL,
	"order_name" varchar(200) NOT NULL,
	"amount" integer NOT NULL,
	"points_to_add" integer NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"payment_key" varchar(200),
	"method" varchar(50),
	"approved_at" timestamp,
	"receipt_url" text,
	"fail_reason" text,
	"raw_response" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payments_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "personal_essays" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" varchar NOT NULL,
	"category" varchar(50) NOT NULL,
	"topic" varchar(100) NOT NULL,
	"title" text,
	"content" text,
	"draft_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "point_packages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"points" integer NOT NULL,
	"price" integer NOT NULL,
	"bonus_points" integer DEFAULT 0 NOT NULL,
	"description" text,
	"is_active" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "point_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"payment_id" varchar,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"type" varchar(30) NOT NULL,
	"description" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"icon" varchar(50),
	"color" varchar(50),
	"last_analyzed" timestamp,
	"profile_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "redemption_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"point_amount" integer NOT NULL,
	"max_uses" integer,
	"current_uses" integer DEFAULT 0 NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "redemption_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "redemption_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"code_id" varchar NOT NULL,
	"points_awarded" integer NOT NULL,
	"redeemed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inviter_id" varchar NOT NULL,
	"invitee_id" varchar NOT NULL,
	"referral_code" varchar(12) NOT NULL,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"inviter_gp_awarded" integer DEFAULT 0,
	"invitee_gp_awarded" integer DEFAULT 0,
	"rewarded_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_pricing" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"point_cost" integer DEFAULT 100 NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" varchar
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" varchar PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" varchar
);
--> statement-breakpoint
CREATE TABLE "university_info" (
	"id" integer PRIMARY KEY NOT NULL,
	"univ_name" text,
	"campus_type" text,
	"school_type" text,
	"univ_type" text,
	"foundation_type" text,
	"region" text,
	"admission_quota" integer,
	"graduate_count" integer,
	"student_count" integer,
	"competition_rate" real,
	"admission_rate" real,
	"employment_rate" real,
	"foreign_student_count" integer,
	"scholarship_per_student" integer,
	"avg_tuition" real,
	"education_cost_per_student" integer,
	"dormitory_rate" real,
	"synced_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"event_type" varchar(20) NOT NULL,
	"login_at" timestamp DEFAULT now() NOT NULL,
	"logout_at" timestamp,
	"session_duration" integer,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"credits" integer DEFAULT 0 NOT NULL,
	"gift_points" integer DEFAULT 0 NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"display_name" varchar(100),
	"gender" varchar(20),
	"birth_date" timestamp,
	"phone" varchar(20),
	"marketing_consent" integer DEFAULT 0 NOT NULL,
	"email_notifications" integer DEFAULT 1 NOT NULL,
	"push_notifications" integer DEFAULT 1 NOT NULL,
	"referral_code" varchar(12),
	"referred_by_user_id" varchar,
	"signup_bonus_awarded" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "video_interview_recordings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"question_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"question_order" integer NOT NULL,
	"video_url" varchar(500),
	"audio_url" varchar(500),
	"duration_seconds" integer DEFAULT 0,
	"file_size" integer DEFAULT 0,
	"mime_type" varchar(50),
	"stt_text" text,
	"stt_status" varchar(20) DEFAULT 'pending',
	"stt_error" text,
	"feedback_json" jsonb,
	"understanding_score" integer,
	"fit_score" integer,
	"logic_score" integer,
	"specificity_score" integer,
	"overall_score" integer,
	"improvement_suggestion" text,
	"improved_answer" text,
	"user_note" text,
	"is_bookmarked" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "visitor_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" varchar(10) NOT NULL,
	"hour" integer NOT NULL,
	"page_views" integer DEFAULT 0 NOT NULL,
	"unique_visitors" integer DEFAULT 0 NOT NULL,
	"new_users" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_analyses" ADD CONSTRAINT "career_analyses_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_point_ledger" ADD CONSTRAINT "gift_point_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_point_ledger" ADD CONSTRAINT "gift_point_ledger_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_point_transactions" ADD CONSTRAINT "gift_point_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_point_transactions" ADD CONSTRAINT "gift_point_transactions_ledger_id_gift_point_ledger_id_fk" FOREIGN KEY ("ledger_id") REFERENCES "public"."gift_point_ledger"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_point_transactions" ADD CONSTRAINT "gift_point_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iap_transactions" ADD CONSTRAINT "iap_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kjobs_assessments" ADD CONSTRAINT "kjobs_assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kjobs_assessments" ADD CONSTRAINT "kjobs_assessments_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kompass_goals" ADD CONSTRAINT "kompass_goals_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_source_job_id_ai_jobs_id_fk" FOREIGN KEY ("source_job_id") REFERENCES "public"."ai_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_settings" ADD CONSTRAINT "page_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_package_id_point_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."point_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_essays" ADD CONSTRAINT "personal_essays_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemption_codes" ADD CONSTRAINT "redemption_codes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemption_history" ADD CONSTRAINT "redemption_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemption_history" ADD CONSTRAINT "redemption_history_code_id_redemption_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."redemption_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_invitee_id_users_id_fk" FOREIGN KEY ("invitee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_pricing" ADD CONSTRAINT "service_pricing_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_ai_jobs_user" ON "ai_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_ai_jobs_status" ON "ai_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_careers_category" ON "careers" USING btree ("category");--> statement-breakpoint
CREATE INDEX "IDX_careers_name" ON "careers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "IDX_gp_ledger_user" ON "gift_point_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_gp_ledger_expires" ON "gift_point_ledger" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "IDX_gp_ledger_user_active" ON "gift_point_ledger" USING btree ("user_id","is_expired");--> statement-breakpoint
CREATE INDEX "IDX_gp_transactions_user" ON "gift_point_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_gp_transactions_type" ON "gift_point_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "IDX_group_members_group" ON "group_members" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "IDX_group_members_user" ON "group_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_group_members_role" ON "group_members" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "IDX_group_members_unique" ON "group_members" USING btree ("group_id","user_id");--> statement-breakpoint
CREATE INDEX "IDX_groups_owner" ON "groups" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "IDX_groups_active" ON "groups" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "IDX_iap_transactions_user_id" ON "iap_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_iap_transactions_transaction_id" ON "iap_transactions" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "IDX_iap_transactions_platform" ON "iap_transactions" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "IDX_iap_transactions_status" ON "iap_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_interview_answers_question" ON "interview_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "IDX_interview_answers_session" ON "interview_answers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_interview_answers_user" ON "interview_answers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_interview_answers_bookmarked" ON "interview_answers" USING btree ("is_bookmarked");--> statement-breakpoint
CREATE INDEX "IDX_interview_questions_session" ON "interview_questions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_interview_questions_category" ON "interview_questions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "IDX_interview_sessions_user" ON "interview_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_interview_sessions_profile" ON "interview_sessions" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "IDX_interview_sessions_status" ON "interview_sessions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "IDX_job_demand_cache_keyword" ON "job_demand_cache" USING btree ("job_keyword");--> statement-breakpoint
CREATE INDEX "IDX_job_demand_cache_expires" ON "job_demand_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "IDX_kjobs_assessments_user" ON "kjobs_assessments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_kjobs_assessments_profile" ON "kjobs_assessments" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "IDX_kjobs_assessments_status" ON "kjobs_assessments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_notifications_user" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_notifications_user_unread" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "IDX_notifications_created" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_payments_user_id" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_payments_order_id" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "IDX_payments_status" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_point_transactions_user_id" ON "point_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_point_transactions_type" ON "point_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "IDX_redemption_codes_code" ON "redemption_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "IDX_redemption_history_user" ON "redemption_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_redemption_history_code" ON "redemption_history" USING btree ("code_id");--> statement-breakpoint
CREATE INDEX "IDX_referrals_inviter" ON "referrals" USING btree ("inviter_id");--> statement-breakpoint
CREATE INDEX "IDX_referrals_invitee" ON "referrals" USING btree ("invitee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "IDX_referrals_invitee_unique" ON "referrals" USING btree ("invitee_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "IDX_user_sessions_user_id" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_user_sessions_login_at" ON "user_sessions" USING btree ("login_at");--> statement-breakpoint
CREATE INDEX "IDX_video_recordings_session" ON "video_interview_recordings" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_video_recordings_question" ON "video_interview_recordings" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "IDX_video_recordings_user" ON "video_interview_recordings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_video_recordings_stt_status" ON "video_interview_recordings" USING btree ("stt_status");--> statement-breakpoint
CREATE INDEX "IDX_video_recordings_bookmarked" ON "video_interview_recordings" USING btree ("is_bookmarked");--> statement-breakpoint
CREATE INDEX "IDX_visitor_metrics_date" ON "visitor_metrics" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "IDX_visitor_metrics_date_hour_unique" ON "visitor_metrics" USING btree ("date","hour");