# Konnect - AI Career Guidance Platform

## Overview
Konnect is an AI-powered Korean-language career guidance platform. It offers personalized career analysis, goal management, and personal statement generation for a diverse user base, including students and job seekers. The platform aims to deliver intelligent career insights to help users plan and manage their career paths effectively.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend uses React 18, TypeScript, and Vite. It incorporates Radix UI and shadcn/ui components, styled with the **Dream Design System** and Tailwind CSS v4 for a mobile-first, responsive design. The design system features three brand colors: **dream** (#320e9d - deep indigo/violet), **coral** (#ea6a64 - salmon/coral), and **gold** (#c79e41 - warm gold). The landing page theme is "너와 나의 꿈이 만나는 곳 / 꿈을 잇다" (Connecting Dreams). The sidebar uses grouped navigation sections (홈, AI 도구, 탐색) with dream/coral/gold section headers. State management is handled by TanStack Query and React Context, with Wouter for routing. Key features include optimistic UI updates, context-based feature flags, and reusable layout components. PDF report generation is implemented client-side using jsPDF and html2canvas. Profile pages are optimized for performance using modular components, debounced auto-save, memoization, and lazy loading.

### Backend
The backend is an Express.js application built with Node.js and TypeScript. It uses Supabase Auth for user authentication and PostgreSQL with Drizzle ORM for data persistence. AI integration is managed via the Anthropic Claude API, incorporating custom rate limiting and retry logic. The API is RESTful, with Zod for request validation and comprehensive error handling. Additional features include a credit-based AI usage system, configurable service pricing, and a redemption code system.

### Database Configuration
- **Development**: Replit's built-in PostgreSQL (Neon-backed) via `DATABASE_URL`, using `@neondatabase/serverless` + `drizzle-orm/neon-serverless`
- **Production**: Supabase PostgreSQL via `PROD_DATABASE_URL`, using standard `pg` driver + `drizzle-orm/node-postgres`
- **Schema Push (dev)**: `npx drizzle-kit push`
- **Schema Push (prod)**: `DRIZZLE_TARGET=prod npx drizzle-kit push` (auto-switches to direct connection port 5432 with SSL)
- The `drizzle.config.ts` supports both targets via the `DRIZZLE_TARGET` env var

### Data Architecture
The database schema includes tables for `users`, `profiles`, `career_analyses`, `personal_essays`, `kompass_goals`, `visitor_metrics`, `service_pricing`, `system_settings`, `redemption_codes`, `redemption_history`, and `iap_transactions`. A multi-profile system allows users to manage different career personas, utilizing JSONB fields for flexible data storage.

### Key Architectural Decisions
- **Multi-Profile System**: Supports distinct career profiles per user.
- **Credit-Based AI Usage**: Manages AI API costs and offers a freemium model.
- **Supabase Auth Integration**: Provides secure and customizable authentication.
- **Mobile-First Design**: Ensures optimal user experience across devices.
- **AI Response Storage**: Stores AI results for instant display and historical tracking.
- **Rate Limiting Strategy**: Manages external API rate limits with client and server-side mechanisms.
- **Visitor Analytics**: Uses Redis for real-time tracking aggregated hourly to PostgreSQL.
- **In-App Purchase (IAP) System**: Supports mobile IAP with server-side receipt verification for Apple and Google.
- **Interview Preparation Feature**: AI-powered system for interview practice with text and voice modes, generating questions and providing feedback on 5 dimensions.
- **Job Demand Feature**: Integrates with Worknet API to display job posting counts, utilizing a caching mechanism.
- **K-JOBS SSO Integration**: Enables Single Sign-On from kjobs.co.kr via JWT token verification.
- **Group Management Feature**: Allows administrators to manage user groups, invite members, assign roles, and view aggregated analysis results for group members.

## External Dependencies

### Third-Party Services
- **AI Services**: Anthropic Claude API (via Replit AI Integrations), OpenAI gpt-4o-mini-transcribe (via Replit AI Integrations)
- **Database**: PostgreSQL (Neon-backed via Replit)
- **Authentication**: Supabase Auth
- **Caching/Queueing**: Upstash Redis (production)
- **Job Posting Data**: Worknet (워크넷) API

### Key NPM Dependencies
- **Frontend**: `react`, `wouter`, `@tanstack/react-query`, `vite`, `@radix-ui/*`, `tailwindcss`, `lucide-react`, `recharts`, `framer-motion`.
- **Backend**: `express`, `drizzle-orm`, `@neondatabase/serverless`, `passport`, `openid-client`, `express-session`, `connect-pg-simple`.
- **AI Integration**: `@anthropic-ai/sdk`, `p-limit`, `p-retry`.
- **Utilities**: `typescript`, `zod`, `date-fns`.

### API Integration Points
- **Authentication**: Supabase Auth endpoints.
- **Career Analysis**: Endpoints for AI analysis.
- **Profile Management**: CRUD operations for user profiles.
- **Essay Generation**: AI-driven personal statement generation.
- **Goal Management**: Hierarchical goal tracking.
- **Job Demand**: Worknet API for job posting data.
- **SSO**: K-JOBS SSO for user login.
- **Interview Prep**: Endpoints for managing interview sessions, questions, answers, and feedback.
- **Group Management**: API for group CRUD, member management, and viewing group analyses.