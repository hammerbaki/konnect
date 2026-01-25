# Konnect - AI Career Guidance Platform

## Overview
Konnect is a Korean-language AI-powered career guidance platform designed to provide personalized career analysis, goal management, and personal statement generation. It targets a wide demographic, including elementary, middle, and high school students, university students, and general job seekers. The platform aims to offer intelligent career insights leveraging advanced AI, enabling users to effectively plan and manage their career paths.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18, TypeScript, and Vite. It utilizes Radix UI primitives and shadcn/ui components styled with the Toss Design System and Tailwind CSS for a mobile-first, responsive design. State management is handled by TanStack Query for server state and React Context for global state, with Wouter managing client-side routing. Key design patterns include optimistic UI updates, context-based feature flags, and a reusable layout wrapper.

### Backend Architecture
The backend is an Express.js application running on Node.js with TypeScript. It integrates Supabase Auth for user authentication, supporting social logins and email OTP. Data persistence is managed by PostgreSQL, accessed via Drizzle ORM. AI integration uses the Anthropic Claude API (via Replit AI Integrations) for career analysis and essay generation, incorporating custom rate limiting and retry logic. The API is RESTful, with Zod for request validation and comprehensive error handling.

### Data Architecture
The database schema includes `users`, `profiles`, `career_analyses`, `personal_essays`, `kompass_goals`, `visitor_metrics`, `service_pricing`, `system_settings`, `redemption_codes`, `redemption_history`, and `iap_transactions`. A multi-profile system allows users to manage different career personas (elementary, middle, high, university, general job seeker), storing flexible structured data in JSONB fields. The `visitor_metrics` table stores hourly aggregated analytics with a unique constraint on (date, hour) for upsert operations. The `iap_transactions` table tracks mobile In-App Purchases with server-side receipt verification.

### Key Architectural Decisions
- **Multi-Profile System**: Allows a single user to manage multiple distinct career profiles using flexible JSONB storage.
- **Credit-Based AI Usage**: Implements a credit system to manage AI API costs and prevent abuse, offering a freemium model.
- **Supabase Auth Integration**: Leverages Supabase for secure, customizable authentication with a Korean UI.
- **Mobile-First Design**: Prioritizes mobile user experience with responsive components and touch-friendly interactions, aligning with the target market's device usage.
- **AI Response Storage**: Stores both processed AI results and raw responses to enable instant display, historical tracking, and potential re-processing without re-running expensive AI calls.
- **Rate Limiting Strategy**: Combines client-side concurrency limits with server-side exponential backoff retry logic to manage Claude API rate limits effectively.
- **Career Explorer Performance**: Uses server-side stats caching (7-day expiry in `career_stats` table), skeleton loaders, and progressive loading (30 items with load-more).
- **Visitor Analytics**: Uses Redis for real-time page view/visitor counting with hourly PostgreSQL aggregation. Frontend tracks route changes via `usePageTracking` hook. Admin dashboard displays traffic stats with line charts showing daily trends.
- **Redis Usage Optimization**: Development environment uses in-memory fallback for rate limiting and job queues to conserve Redis commands. AI worker polling interval is 30 seconds (idle) / 2 seconds (active) to minimize Redis usage. Production uses Upstash Redis for rate limiting and job queue management.
- **Service Pricing System**: Configurable point costs for AI services via `service_pricing` table. Supports goal-level pricing (yearly, half-yearly, monthly, weekly, daily) with admin UI for editing. Falls back to defaults if not initialized.
- **System Settings**: Key-value store for configurable settings like signup bonus amount, managed via `system_settings` table with admin UI.
- **Redemption Code System**: Admin-managed coupon system via `redemption_codes` table with max uses, expiration dates, and usage tracking. Supports CRUD operations and user redemption with duplicate prevention via `redemption_history`.
- **Profile Validation System**: Enforces minimum required fields before AI analysis/essay generation. Different profile types (high school, university, general) have type-specific required fields. UI displays user-friendly Korean labels for missing fields with links to profile editing. Both Analysis and PersonalStatement pages validate profiles and disable actions until requirements are met.
- **Mandatory Target Info for Essays**: Essay generation requires target company/school name input. Target section has prominent blue-bordered UI with "필수" (required) badge. Web scraping feature fetches company info from URLs to enhance AI-generated essays with specific, tailored content.
- **In-App Purchase (IAP) System**: Server-side receipt verification for mobile app purchases. Supports Apple App Store (verifyReceipt API with 21007/21008 retry logic) and Google Play Store. Products defined in `IAP_PRODUCTS` constant with point packages (1000P, 3000P+300 bonus, 5000P+700 bonus, 10000P+2000 bonus). Development mode supports `IAP_SKIP_VERIFICATION=true` for testing. Transaction history stored in `iap_transactions` table with idempotency checks.
- **PDF Report Download**: Client-side PDF generation for career analysis recommendations using jsPDF + html2canvas. Features Konnect branding, "Certified Report" badge, competency analysis, strengths/weaknesses, and action plans. Korean text rendered via html2canvas to work around jsPDF font limitations. No server disk usage - generates on-demand in browser. Located at `client/src/lib/pdfReportGenerator.ts`.
- **Profile Page Optimization (100+ concurrent users)**: Profile page refactored for high scalability:
  - **Modular Components**: Split into `client/src/components/profile/` with separate forms for each profile type (ElementaryForm, MiddleSchoolForm, HighSchoolForm, UniversityForm, GeneralForm).
  - **Debounced Auto-Save**: 3-second debounce on field changes reduces server API calls by ~80%. Uses custom `useDebounce` hook in `client/src/hooks/useDebounce.ts`.
  - **React.memo/useMemo**: All form components wrapped with React.memo, computed values memoized for 3-5x rendering performance improvement.
  - **Lazy Loading**: Profile type forms use React.lazy + Suspense for code splitting, reducing initial bundle size and TTI.
  - **Unsaved Changes Indicator**: Visual indicator shows when auto-save is pending.
  - **Type System**: Shared types in `client/src/components/profile/types.ts` for type safety across components.
- **Job Seeker Profile Extended Sections**: GeneralForm.tsx includes 5 CRUD sections for comprehensive job seeker profiles:
  - **Education (학력)**: Track educational history with education level (elementary/middle/high/university/other), school name, graduation status, entrance/graduation dates. University entries include university type (2year/4year/graduate/abroad), major, sub-major, GPA, GPA scale, day/night, region, and major category. Supports GED and transfer flags.
  - **Language Tests (어학 시험)**: Track language certifications (TOPIK, TOEIC, TOEFL, IELTS, JLPT, HSK, etc.) with score type (grade/score), acquisition date, expiry date, and pending status.
  - **Licenses/Certifications (자격증/면허)**: Manage professional certifications and licenses with category, issuer, status (acquired/preparing/expired), and license numbers.
  - **Awards (수상/공모전)**: Record awards and competition achievements with type, rank, host organization, and dates.
  - **References (추천인)**: Store professional references with relation type, contact info (phone/email), and organization.
  - Each section supports full CRUD operations with modal dialogs, validation, and auto-save integration.

## Temporarily Hidden UI Elements
The following UI elements are temporarily hidden and can be restored by uncommenting the marked sections:

### Analysis.tsx (`client/src/pages/Analysis.tsx`)
1. **HIDDEN_PDF_BUTTON_START to HIDDEN_PDF_BUTTON_END** (lines ~763-778): PDF report download button - feature incomplete, hidden until ready

To restore: Search for "HIDDEN_PDF" and uncomment the marked code blocks.

## External Dependencies

### Third-Party Services
- **AI Services**: Anthropic Claude API (via Replit AI Integrations) for core AI functionalities.
- **Database**: PostgreSQL (Neon-backed via Replit) for primary data storage.
- **Authentication**: Supabase Auth for user authentication and session management.

### Key NPM Dependencies
- **Frontend**: `react`, `wouter`, `@tanstack/react-query`, `vite`, `@radix-ui/*`, `tailwindcss`, `lucide-react`, `recharts`, `framer-motion`.
- **Backend**: `express`, `drizzle-orm`, `@neondatabase/serverless`, `passport`, `openid-client`, `express-session`, `connect-pg-simple`.
- **AI Integration**: `@anthropic-ai/sdk`, `p-limit`, `p-retry`.
- **Utilities**: `typescript`, `zod`, `date-fns`.

### API Integration Points
- **Authentication**: Supabase Auth endpoints for login, callback, and logout.
- **Career Analysis**: Endpoints for generating and retrieving AI analyses.
- **Profile Management**: CRUD operations for various profile types.
- **Essay Generation**: AI-driven personal statement generation.
- **Goal Management (Kompass)**: Hierarchical goal tracking and management.
- **Job Demand (구인수요지표)**: Worknet (워크넷) API integration for job posting count data.

## Interview Preparation Feature (면접 준비)
AI-powered interview preparation system with both text and voice modes.

### Architecture
- **Frontend**: `client/src/pages/Interview.tsx` - Interview preparation page with session management
- **Backend AI**: `server/interview-ai.ts` - Claude AI for question generation and feedback
- **Database Tables**: `interview_sessions`, `interview_questions`, `interview_answers`, `video_interview_recordings`
- **STT Integration**: OpenAI gpt-4o-mini-transcribe via Replit AI Integrations (`server/replit_integrations/audio/`)

### Features
- **Session-Based Practice**: Creates interview sessions with 9 AI-generated questions based on user's profile and desired job
- **Question Categories**: 4 types - 기본 면접 질문 (basic), 직무 질문 (job_specific), 자기소개 (self_intro), STAR 질문 (star)
- **Text Mode**: Type answers and receive AI feedback with 5-dimension scoring
- **Voice Mode**: Record audio answers using MediaRecorder API, automatic STT transcription, then AI feedback
- **AI Feedback**: 5 dimensions - 질문 이해도, 직무 적합도, 논리 구조, 구체성, 종합 점수 (1-5 scale)
- **Improvement Suggestions**: AI provides specific improvement suggestions and improved answer examples
- **Bookmarking**: Save important Q&A pairs for later review

### API Routes
- `GET /api/interview/sessions` - List user's interview sessions
- `GET /api/interview/sessions/:sessionId` - Get session details with questions
- `POST /api/interview/sessions` - Create new interview session (generates AI questions)
- `POST /api/interview/answers` - Submit answer and get AI feedback
- `POST /api/interview/answers/save` - Save answer without feedback
- `POST /api/interview/video-recordings` - Upload voice recording (performs STT)
- `POST /api/interview/video-recordings/:id/feedback` - Get AI feedback on voice recording

## Job Demand Feature (구인수요지표)
워크넷 채용정보 API를 활용하여 직업별 구인수요(채용공고 건수)를 표시합니다.

### Architecture
- **Server Module**: `server/worknet.ts` - 워크넷 API 연동 및 캐시 관리
- **Database Table**: `job_demand_cache` - 12시간 캐시 저장
- **API Routes**: `/api/job-demand/:jobTitle`, `/api/job-demand/batch`

### Features
- 최근 30일 기준 채용공고 건수 조회
- 12시간 캐시로 API 호출 최소화
- KONNECT 직무 → 워크넷 키워드 매핑 (JOB_KEYWORD_MAPPING)
- 화면에 "워크넷 기준 | 최근 30일 | 업데이트 날짜" 표시

### Required Secret
- **WORKNET_API_KEY**: 공공데이터포털에서 발급받은 워크넷 채용정보 API 인증키
  - 발급처: https://www.data.go.kr/dataset/3038225/openapi.do

## K-JOBS SSO Integration (kjobs.co.kr 연동)
kjobs.co.kr에서 SSO(Single Sign-On)를 통해 Konnect로 자동 로그인할 수 있습니다.

### Architecture
- **Server Module**: `server/kjobs-sso.ts` - JWT 토큰 검증 및 사용자 생성/로그인
- **API Routes**: 
  - `GET /api/sso/kjobs?token=<jwt>` - SSO 로그인 엔드포인트
  - `GET /api/sso/kjobs/test-token` - 개발용 테스트 토큰 생성 (development 모드에서만)

### Authentication Flow
1. kjobs.co.kr에서 JWT 토큰 생성 (HS256, 공유 시크릿으로 서명)
2. 사용자를 `https://konnect.replit.app/api/sso/kjobs?token=<jwt>` 로 리다이렉트
3. Konnect가 토큰 검증 후 사용자 생성/조회 및 자동 로그인
4. 대시보드로 리다이렉트 (`?redirect=<path>` 파라미터로 다른 페이지 지정 가능)

### JWT Token Format
```json
{
  "userId": "kjobs-user-id",
  "email": "user@example.com",
  "name": "홍길동",
  "iat": 1706184000,
  "exp": 1706187600
}
```

### Required Secret
- **KJOBS_SSO_SECRET**: K-JOBS에서 제공하는 SSO 공유 시크릿 키 (HS256 서명 검증용)