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
The database schema includes `users`, `profiles`, `career_analyses`, `personal_essays`, `kompass_goals`, `visitor_metrics`, `service_pricing`, `system_settings`, `redemption_codes`, and `redemption_history`. A multi-profile system allows users to manage different career personas (elementary, middle, high, university, general job seeker), storing flexible structured data in JSONB fields. The `visitor_metrics` table stores hourly aggregated analytics with a unique constraint on (date, hour) for upsert operations.

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

## Temporarily Hidden UI Elements (Points/Tokens)
The following UI elements have been temporarily hidden and can be restored by uncommenting the marked sections:

### Header.tsx (`client/src/components/layout/Header.tsx`)
1. **HIDDEN_POINTS_START to HIDDEN_POINTS_END** (lines ~80-96): Desktop and mobile points display (GP/P badges) and RedeemDialog button
2. **HIDDEN_POINTS_MOBILE_START to HIDDEN_POINTS_MOBILE_END** (lines ~117-126): Mobile dropdown "포인트 충전" button
3. **HIDDEN_POINTS_DROPDOWN_START to HIDDEN_POINTS_DROPDOWN_END** (lines ~138-145): Desktop dropdown "포인트 충전" button

### Sidebar.tsx (`client/src/components/layout/Sidebar.tsx`)
1. **HIDDEN_POINTS_SIDEBAR** (line ~43): Sidebar "포인트 충전" navigation item - commented out in allBottomItems array

### Settings.tsx (`client/src/pages/Settings.tsx`)
1. **HIDDEN_POINTS_SETTINGS_REWARD_START to END** (lines ~443-450): Referral GP reward description box
2. **HIDDEN_POINTS_SETTINGS_GP_EARNED_START to END** (lines ~486-496): "받은 GP" stats card
3. **HIDDEN_POINTS_SETTINGS_DELETE_INFO** (line ~666): "보유 포인트 및 GP" in account deletion warning

### Dashboard.tsx (`client/src/pages/Dashboard.tsx`)
1. **HIDDEN_POINTS_DASHBOARD_START to END** (lines ~210-220): "보유 포인트" card in welcome section

To restore: Search for "HIDDEN_POINTS" and uncomment the marked code blocks.

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