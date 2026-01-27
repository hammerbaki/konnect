-- ============================================
-- Konnect Production Database Migration
-- Date: 2026-01-27
-- Features: Groups Dashboard, Interview Prep, Page Settings
-- ============================================

-- NOTE: Run this script in the Replit Database Panel 
-- Select "Production" environment before executing

-- ===== 1. PAGE SETTINGS TABLE (Role-based page visibility) =====
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

-- ===== 2. GROUPS TABLE (그룹 관리) =====
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

-- Add logo_url column if table already exists
ALTER TABLE groups ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);

CREATE INDEX IF NOT EXISTS "IDX_groups_owner" ON groups(owner_id);
CREATE INDEX IF NOT EXISTS "IDX_groups_active" ON groups(is_active);

-- ===== 3. GROUP MEMBERS TABLE (그룹 멤버십) =====
CREATE TABLE IF NOT EXISTS group_members (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  group_id VARCHAR NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMP DEFAULT NOW(),
  invited_by VARCHAR REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS "IDX_group_members_group" ON group_members(group_id);
CREATE INDEX IF NOT EXISTS "IDX_group_members_user" ON group_members(user_id);
CREATE INDEX IF NOT EXISTS "IDX_group_members_role" ON group_members(role);
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_group_members_unique" ON group_members(group_id, user_id);

-- ===== 4. INTERVIEW SESSIONS TABLE (면접 준비 세션) =====
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

CREATE INDEX IF NOT EXISTS "IDX_interview_sessions_user" ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS "IDX_interview_sessions_profile" ON interview_sessions(profile_id);
CREATE INDEX IF NOT EXISTS "IDX_interview_sessions_status" ON interview_sessions(status);

-- ===== 5. INTERVIEW QUESTIONS TABLE (면접 질문) =====
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

CREATE INDEX IF NOT EXISTS "IDX_interview_questions_session" ON interview_questions(session_id);
CREATE INDEX IF NOT EXISTS "IDX_interview_questions_category" ON interview_questions(category);

-- ===== 6. INTERVIEW ANSWERS TABLE (면접 답변) =====
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

CREATE INDEX IF NOT EXISTS "IDX_interview_answers_question" ON interview_answers(question_id);
CREATE INDEX IF NOT EXISTS "IDX_interview_answers_session" ON interview_answers(session_id);
CREATE INDEX IF NOT EXISTS "IDX_interview_answers_user" ON interview_answers(user_id);
CREATE INDEX IF NOT EXISTS "IDX_interview_answers_bookmarked" ON interview_answers(is_bookmarked);

-- ===== 7. VIDEO INTERVIEW RECORDINGS TABLE (화상 면접 녹화) =====
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

CREATE INDEX IF NOT EXISTS "IDX_video_recordings_session" ON video_interview_recordings(session_id);
CREATE INDEX IF NOT EXISTS "IDX_video_recordings_question" ON video_interview_recordings(question_id);
CREATE INDEX IF NOT EXISTS "IDX_video_recordings_user" ON video_interview_recordings(user_id);
CREATE INDEX IF NOT EXISTS "IDX_video_recordings_stt_status" ON video_interview_recordings(stt_status);
CREATE INDEX IF NOT EXISTS "IDX_video_recordings_bookmarked" ON video_interview_recordings(is_bookmarked);

-- ===== 8. UPDATE USER ROLES (사용자 역할 업데이트) =====
-- wowkjobs@gmail.com을 admin으로, ckm5430@kjobs.co.kr을 staff로 설정
UPDATE users SET role = 'admin' WHERE email = 'wowkjobs@gmail.com';
UPDATE users SET role = 'staff' WHERE email = 'ckm5430@kjobs.co.kr';

-- ===== 9. JOB DEMAND CACHE TABLE (워크넷 구인수요지표 캐시) =====
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

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_job_demand_cache_keyword" ON job_demand_cache(job_keyword);
CREATE INDEX IF NOT EXISTS "IDX_job_demand_cache_expires" ON job_demand_cache(expires_at);

-- ===== 10. K-JOBS ASSESSMENTS TABLE (K-JOBS 진단 결과) =====
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

CREATE INDEX IF NOT EXISTS "IDX_kjobs_assessments_user" ON kjobs_assessments(user_id);
CREATE INDEX IF NOT EXISTS "IDX_kjobs_assessments_profile" ON kjobs_assessments(profile_id);
CREATE INDEX IF NOT EXISTS "IDX_kjobs_assessments_type" ON kjobs_assessments(test_type);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Tables created/updated:
-- 1. page_settings - 페이지 접근 권한 설정
-- 2. groups - 그룹 관리
-- 3. group_members - 그룹 멤버십
-- 4. interview_sessions - 면접 준비 세션
-- 5. interview_questions - 면접 질문
-- 6. interview_answers - 면접 답변
-- 7. video_interview_recordings - 화상 면접 녹화
-- 8. job_demand_cache - 워크넷 구인수요 캐시
-- 9. kjobs_assessments - K-JOBS 진단 결과
-- ============================================
