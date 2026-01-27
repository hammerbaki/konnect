-- ============================================
-- Konnect Production Database Migration
-- STEP-BY-STEP WITH VERIFICATION
-- Date: 2026-01-27
-- ============================================

-- IMPORTANT: Run each step INDIVIDUALLY in the Replit Database Panel
-- After each step, run the verification query to confirm success
-- Select "Production" environment before executing

-- ============================================
-- STEP 0: PRE-MIGRATION CHECK
-- ============================================
-- Run this first to see current state

SELECT 'EXISTING TABLES' as check_type, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Expected: Should show existing tables (users, profiles, career_analyses, etc.)


-- ============================================
-- STEP 1: PAGE SETTINGS TABLE
-- ============================================

-- 1a. Create table
CREATE TABLE IF NOT EXISTS page_settings (
  slug VARCHAR(100) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  default_roles TEXT[] NOT NULL,
  allowed_roles TEXT[],
  is_locked INTEGER NOT NULL DEFAULT 0,
  updated_by VARCHAR REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 1b. VERIFICATION - Run after 1a:
SELECT 
  'page_settings' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'page_settings';
-- Expected: column_count = 8


-- ============================================
-- STEP 2: GROUPS TABLE
-- ============================================

-- 2a. Create table
CREATE TABLE IF NOT EXISTS groups (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_emoji VARCHAR(10) DEFAULT '👥',
  color VARCHAR(20) DEFAULT '#3B82F6',
  logo_url VARCHAR(500),
  owner_id VARCHAR NOT NULL REFERENCES users(id),
  settings JSONB DEFAULT '{}',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2b. Add logo_url if table already exists (safe to run multiple times)
ALTER TABLE groups ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);

-- 2c. Create indexes
CREATE INDEX IF NOT EXISTS "IDX_groups_owner" ON groups(owner_id);
CREATE INDEX IF NOT EXISTS "IDX_groups_active" ON groups(is_active);

-- 2d. VERIFICATION - Run after 2a-2c:
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'groups'
ORDER BY ordinal_position;
-- Expected: 11 columns including logo_url


-- ============================================
-- STEP 3: GROUP MEMBERS TABLE
-- ============================================

-- 3a. Create table
CREATE TABLE IF NOT EXISTS group_members (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  group_id VARCHAR NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMP DEFAULT NOW(),
  invited_by VARCHAR REFERENCES users(id)
);

-- 3b. Create indexes
CREATE INDEX IF NOT EXISTS "IDX_group_members_group" ON group_members(group_id);
CREATE INDEX IF NOT EXISTS "IDX_group_members_user" ON group_members(user_id);
CREATE INDEX IF NOT EXISTS "IDX_group_members_role" ON group_members(role);
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_group_members_unique" ON group_members(group_id, user_id);

-- 3c. VERIFICATION:
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'group_members'
ORDER BY ordinal_position;
-- Expected: 7 columns (id, group_id, user_id, role, permissions, joined_at, invited_by)


-- ============================================
-- STEP 4: INTERVIEW SESSIONS TABLE
-- ============================================

-- 4a. Create table
CREATE TABLE IF NOT EXISTS interview_sessions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL,
  profile_id VARCHAR NOT NULL,
  desired_job VARCHAR(200) NOT NULL,
  session_type VARCHAR(50) NOT NULL DEFAULT 'practice',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  total_questions INTEGER NOT NULL DEFAULT 0,
  answered_questions INTEGER NOT NULL DEFAULT 0,
  profile_snapshot JSONB,
  kjobs_snapshot JSONB,
  analysis_snapshot JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- 4b. Create indexes
CREATE INDEX IF NOT EXISTS "IDX_interview_sessions_user" ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS "IDX_interview_sessions_profile" ON interview_sessions(profile_id);
CREATE INDEX IF NOT EXISTS "IDX_interview_sessions_status" ON interview_sessions(status);

-- 4c. VERIFICATION:
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'interview_sessions'
ORDER BY ordinal_position;
-- Expected: 14 columns


-- ============================================
-- STEP 5: INTERVIEW QUESTIONS TABLE
-- ============================================

-- 5a. Create table
CREATE TABLE IF NOT EXISTS interview_questions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id VARCHAR NOT NULL,
  category VARCHAR(30) NOT NULL,
  question_order INTEGER NOT NULL,
  question TEXT NOT NULL,
  question_reason TEXT,
  guide_text TEXT,
  related_strength VARCHAR(100),
  related_weakness VARCHAR(100),
  difficulty VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5b. Create indexes
CREATE INDEX IF NOT EXISTS "IDX_interview_questions_session" ON interview_questions(session_id);
CREATE INDEX IF NOT EXISTS "IDX_interview_questions_category" ON interview_questions(category);

-- 5c. VERIFICATION:
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'interview_questions'
ORDER BY ordinal_position;
-- Expected: 11 columns


-- ============================================
-- STEP 6: INTERVIEW ANSWERS TABLE
-- ============================================

-- 6a. Create table
CREATE TABLE IF NOT EXISTS interview_answers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  question_id VARCHAR NOT NULL,
  session_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  answer TEXT NOT NULL,
  feedback_json JSONB,
  understanding_score INTEGER,
  fit_score INTEGER,
  logic_score INTEGER,
  specificity_score INTEGER,
  overall_score INTEGER,
  improvement_suggestion TEXT,
  improved_answer TEXT,
  is_bookmarked INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6b. Create indexes
CREATE INDEX IF NOT EXISTS "IDX_interview_answers_question" ON interview_answers(question_id);
CREATE INDEX IF NOT EXISTS "IDX_interview_answers_session" ON interview_answers(session_id);
CREATE INDEX IF NOT EXISTS "IDX_interview_answers_user" ON interview_answers(user_id);
CREATE INDEX IF NOT EXISTS "IDX_interview_answers_bookmarked" ON interview_answers(is_bookmarked);

-- 6c. VERIFICATION:
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'interview_answers'
ORDER BY ordinal_position;
-- Expected: 16 columns


-- ============================================
-- STEP 7: VIDEO INTERVIEW RECORDINGS TABLE
-- ============================================

-- 7a. Create table
CREATE TABLE IF NOT EXISTS video_interview_recordings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id VARCHAR NOT NULL,
  question_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  question_order INTEGER NOT NULL,
  video_url VARCHAR(500),
  audio_url VARCHAR(500),
  duration_seconds INTEGER DEFAULT 0,
  file_size INTEGER DEFAULT 0,
  mime_type VARCHAR(50),
  stt_text TEXT,
  stt_status VARCHAR(20) DEFAULT 'pending',
  stt_error TEXT,
  feedback_json JSONB,
  understanding_score INTEGER,
  fit_score INTEGER,
  logic_score INTEGER,
  specificity_score INTEGER,
  overall_score INTEGER,
  improvement_suggestion TEXT,
  improved_answer TEXT,
  is_bookmarked INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7b. Create indexes
CREATE INDEX IF NOT EXISTS "IDX_video_recordings_session" ON video_interview_recordings(session_id);
CREATE INDEX IF NOT EXISTS "IDX_video_recordings_question" ON video_interview_recordings(question_id);
CREATE INDEX IF NOT EXISTS "IDX_video_recordings_user" ON video_interview_recordings(user_id);
CREATE INDEX IF NOT EXISTS "IDX_video_recordings_stt_status" ON video_interview_recordings(stt_status);
CREATE INDEX IF NOT EXISTS "IDX_video_recordings_bookmarked" ON video_interview_recordings(is_bookmarked);

-- 7c. VERIFICATION:
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'video_interview_recordings'
ORDER BY ordinal_position;
-- Expected: 24 columns


-- ============================================
-- STEP 8: JOB DEMAND CACHE TABLE
-- ============================================

-- 8a. Create table
CREATE TABLE IF NOT EXISTS job_demand_cache (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  job_keyword VARCHAR(200) NOT NULL,
  worknet_occupation_code VARCHAR(20),
  demand_count INTEGER NOT NULL DEFAULT 0,
  period_days INTEGER NOT NULL DEFAULT 30,
  data_source VARCHAR(50) NOT NULL DEFAULT 'worknet',
  fetched_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  raw_response JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 8b. Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_job_demand_cache_keyword" ON job_demand_cache(job_keyword);
CREATE INDEX IF NOT EXISTS "IDX_job_demand_cache_expires" ON job_demand_cache(expires_at);

-- 8c. VERIFICATION:
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'job_demand_cache'
ORDER BY ordinal_position;
-- Expected: 11 columns


-- ============================================
-- STEP 9: K-JOBS ASSESSMENTS TABLE
-- ============================================

-- 9a. Create table
CREATE TABLE IF NOT EXISTS kjobs_assessments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id VARCHAR,
  test_type VARCHAR(50) NOT NULL DEFAULT 'career_interest',
  answers JSONB NOT NULL,
  result_data JSONB,
  scores JSONB,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 9b. Create indexes
CREATE INDEX IF NOT EXISTS "IDX_kjobs_assessments_user" ON kjobs_assessments(user_id);
CREATE INDEX IF NOT EXISTS "IDX_kjobs_assessments_profile" ON kjobs_assessments(profile_id);
CREATE INDEX IF NOT EXISTS "IDX_kjobs_assessments_type" ON kjobs_assessments(test_type);

-- 9c. VERIFICATION:
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'kjobs_assessments'
ORDER BY ordinal_position;
-- Expected: 10 columns


-- ============================================
-- STEP 10: UPDATE USER ROLES
-- ============================================

-- 10a. Check current roles first
SELECT email, role FROM users WHERE email IN ('wowkjobs@gmail.com', 'ckm5430@kjobs.co.kr');

-- 10b. Update roles
UPDATE users SET role = 'admin' WHERE email = 'wowkjobs@gmail.com';
UPDATE users SET role = 'staff' WHERE email = 'ckm5430@kjobs.co.kr';

-- 10c. VERIFICATION:
SELECT email, role FROM users WHERE email IN ('wowkjobs@gmail.com', 'ckm5430@kjobs.co.kr');
-- Expected: wowkjobs@gmail.com = admin, ckm5430@kjobs.co.kr = staff


-- ============================================
-- FINAL VERIFICATION
-- ============================================

-- Run this to confirm all tables are created:
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN (
    'page_settings',
    'groups', 
    'group_members',
    'interview_sessions',
    'interview_questions',
    'interview_answers',
    'video_interview_recordings',
    'job_demand_cache',
    'kjobs_assessments'
  )
ORDER BY table_name;

-- Expected results:
-- | table_name                 | column_count |
-- |---------------------------|--------------|
-- | group_members             | 7            |
-- | groups                    | 11           |
-- | interview_answers         | 16           |
-- | interview_questions       | 11           |
-- | interview_sessions        | 14           |
-- | job_demand_cache          | 11           |
-- | kjobs_assessments         | 10           |
-- | page_settings             | 8            |
-- | video_interview_recordings| 24           |


-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
