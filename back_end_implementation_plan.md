# Konnect Backend Implementation Plan

## Overview
Transform the Konnect prototype into a fully functional Korean AI career guidance platform with authentication, database persistence, and Claude AI-powered analysis.

---

## Phase 1: Foundation & Database Schema ✅

### 1.1 Database Setup
- [ ] Create PostgreSQL database
- [ ] Configure Drizzle ORM
- [ ] Set up database migrations

### 1.2 Core Data Models (`shared/schema.ts`)
- [ ] **Users Table**
  - id, email, password_hash, name, created_at
  
- [ ] **Profiles Table** (Multi-profile support)
  - id, user_id, type (elementary/middle/high/university/general)
  - title, icon, color, last_analyzed
  - profile_data (JSONB for flexible schema per type)
  
- [ ] **Career Analysis Table**
  - id, profile_id, analysis_date
  - summary, stats (JSONB)
  - chart_data (JSONB: radar, bar charts)
  - recommendations (JSONB array)
  - ai_raw_response (full Claude response)
  
- [ ] **Personal Essays Table**
  - id, profile_id, category, topic
  - title, content, draft_version
  - created_at, updated_at
  
- [ ] **Kompass Goals Table**
  - id, profile_id, target_year
  - vision_data (JSONB: entire goal hierarchy)
  - progress, created_at, updated_at

### 1.3 Storage Interface (`server/storage.ts`)
- [ ] User CRUD operations
- [ ] Profile CRUD operations
- [ ] Analysis CRUD operations
- [ ] Essay CRUD operations
- [ ] Kompass CRUD operations

---

## Phase 2: Authentication System

### 2.1 Replit Auth Integration
- [ ] Search for Replit authentication integration
- [ ] Set up auth connector/blueprint
- [ ] Configure session management
- [ ] Implement middleware for protected routes

### 2.2 Auth API Routes (`server/routes.ts`)
- [ ] POST /api/auth/signup
- [ ] POST /api/auth/login
- [ ] POST /api/auth/logout
- [ ] GET /api/auth/me (current user)

### 2.3 Frontend Integration
- [ ] Update Profile page with real auth
- [ ] Add login/signup forms
- [ ] Protect routes requiring authentication
- [ ] Handle auth state globally

---

## Phase 3: Core Backend APIs

### 3.1 Profile Management
- [ ] GET /api/profiles (list user's profiles)
- [ ] POST /api/profiles (create new profile)
- [ ] PATCH /api/profiles/:id (update profile)
- [ ] DELETE /api/profiles/:id (delete profile)

### 3.2 Personal Essay APIs
- [ ] GET /api/essays?profile_id=X (list essays)
- [ ] POST /api/essays (create new essay)
- [ ] PATCH /api/essays/:id (update essay)
- [ ] DELETE /api/essays/:id (delete essay)
- [ ] GET /api/essays/:id (get specific essay)

### 3.3 Kompass APIs
- [ ] GET /api/kompass?profile_id=X (list goals)
- [ ] POST /api/kompass (create new goal tree)
- [ ] PATCH /api/kompass/:id (update entire goal structure)
- [ ] DELETE /api/kompass/:id (delete goal)
- [ ] GET /api/kompass/:id (get specific goal tree)

### 3.4 Analysis APIs
- [ ] GET /api/analysis/history?profile_id=X (past analyses)
- [ ] GET /api/analysis/:id (specific analysis)
- [ ] DELETE /api/analysis/:id (delete analysis)

---

## Phase 4: AI Integration (Claude API) 🎯

### 4.1 Claude API Setup
- [ ] Search for Claude/Anthropic integration in Replit
- [ ] Configure API key management (secrets)
- [ ] Set up rate limiting and token budget tracking
- [ ] Implement retry logic with exponential backoff

### 4.2 AI Analysis Strategy

#### Profile-Specific Prompts
Each profile type requires different analysis approach:

**High School Profile:**
- Input: 내신 등급, 수능 모의고사 점수, 활동 기록, 관심 분야
- Output: 추천 학과/대학, 합격 확률, 필요 보완 사항, 학습 로드맵

**University Profile:**
- Input: 전공, 학점, 프로젝트 경험, 자격증, 희망 직무
- Output: 추천 인턴십/직무, 역량 분석, 필요 스킬, 취업 전략

**General/Job Seeker Profile:**
- Input: 경력, 보유 스킬, 희망 연봉, 이직 사유
- Output: 추천 포지션, 시장 경쟁력, 연봉 예측, 커리어 로드맵

#### Token Management
- **Analysis Request**: ~5,000-8,000 tokens (input profile + prompt)
- **Response**: ~3,000-5,000 tokens (structured analysis)
- **Rate Limit**: Track daily/hourly usage per user
- **Cost Control**: Implement user credit system (already in TokenContext)

#### RAG Strategy (Future Enhancement)
- Store successful analysis patterns
- Build knowledge base of career paths by industry
- Use vector embeddings for similar profile matching
- Cache common analysis results

### 4.3 Analysis API Implementation
- [ ] POST /api/analysis/generate
  - Accept profile_id
  - Validate user has credits
  - Fetch profile data from DB
  - Build profile-specific prompt
  - Call Claude API with structured output
  - Parse response into analysis schema
  - Save to database
  - Deduct user credits
  - Return analysis result

### 4.4 Prompt Engineering
- [ ] Create base system prompt (Korean language, career counselor persona)
- [ ] High school analysis prompt template
- [ ] University analysis prompt template
- [ ] General/job seeker analysis prompt template
- [ ] Structured output format (JSON schema for consistency)

### 4.5 Error Handling
- [ ] Handle API rate limits (429 errors)
- [ ] Handle token limit exceeded
- [ ] Handle invalid responses
- [ ] Graceful degradation if AI unavailable
- [ ] User-friendly error messages in Korean

---

## Phase 5: AI Personal Essay Generation

### 5.1 Essay Generation API
- [ ] POST /api/essays/generate
  - Accept profile_id, category, topic
  - Validate required profile fields
  - Build topic-specific prompt
  - Call Claude API
  - Save draft to database
  - Return generated essay

### 5.2 Essay Prompts by Category
- [ ] **고등학생 (대입)**
  - 지원동기, 학업계획, 자기소개
- [ ] **대학생 (취업)**
  - 지원동기, 경험 및 역량, 입사 후 포부
- [ ] **구직자 (이직)**
  - 이직 사유, 직무 경험, 경력 목표

### 5.3 Iterative Editing
- [ ] Support multiple draft versions
- [ ] Allow user feedback → AI refinement
- [ ] Track version history

---

## Phase 6: Testing & Optimization

### 6.1 Backend Testing
- [ ] Test all API endpoints
- [ ] Validate authentication flow
- [ ] Test database transactions
- [ ] Load testing for Claude API calls

### 6.2 Frontend Integration
- [ ] Replace all mock data with API calls
- [ ] Implement loading states
- [ ] Error handling UI
- [ ] Optimistic updates for better UX

### 6.3 Performance
- [ ] Cache frequently accessed data
- [ ] Optimize database queries
- [ ] Implement pagination for lists
- [ ] Background job for AI processing (if needed)

---

## Phase 7: Production Readiness

### 7.1 Security
- [ ] SQL injection prevention (Drizzle handles this)
- [ ] XSS protection
- [ ] CSRF tokens for forms
- [ ] Rate limiting per user/IP
- [ ] Input validation on all endpoints

### 7.2 Monitoring
- [ ] Log AI API usage and costs
- [ ] Track user credits consumption
- [ ] Error tracking
- [ ] Performance metrics

### 7.3 Deployment
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Secrets management verified
- [ ] Deployment testing

---

## Implementation Order (Topological Sort)

```
1. Database Schema → Storage Interface
   ↓
2. Authentication System
   ↓
3. Profile Management APIs
   ↓
4. Kompass APIs (simpler, no AI)
   ↓
5. Essay Management APIs (CRUD only)
   ↓
6. Claude API Setup & Integration
   ↓
7. AI Analysis Generation
   ↓
8. AI Essay Generation
   ↓
9. Frontend Integration
   ↓
10. Testing & Polish
```

---

## Key Technical Decisions

### Why Drizzle ORM?
- Type-safe queries
- Already configured in mockup stack
- Excellent PostgreSQL support
- Migration system built-in

### Why Replit Auth?
- Native integration with platform
- Session management handled
- Easy user management
- Quick setup

### Why Claude API?
- Superior Korean language understanding
- Excellent structured output
- Long context window (100k+ tokens)
- Strong reasoning for career analysis

### Token Budget Strategy
- Free tier: 10 credits (2 analyses + 2 essays)
- Each analysis: 3 credits
- Each essay generation: 2 credits
- Prevent abuse with rate limiting

---

## Success Metrics

- [ ] User can create account and login
- [ ] User can manage multiple profiles
- [ ] AI generates accurate, Korean career analysis
- [ ] AI generates personalized essays
- [ ] Kompass goals persist and sync
- [ ] Essay history saved and searchable
- [ ] System handles 100+ concurrent users
- [ ] Average AI response time < 10 seconds
- [ ] 99%+ uptime

---

## Next Steps

**Starting Now:**
1. Create PostgreSQL database
2. Define all schemas in `shared/schema.ts`
3. Implement storage interface in `server/storage.ts`
4. Set up basic API routes structure
5. Search for authentication integration
6. Implement Phase 1 & 2 first before AI integration
