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
The database schema includes `users`, `profiles`, `career_analyses`, `personal_essays`, and `kompass_goals`. A multi-profile system allows users to manage different career personas (elementary, middle, high, university, general job seeker), storing flexible structured data in JSONB fields. This design enables type-specific fields without extensive schema migrations.

### Key Architectural Decisions
- **Multi-Profile System**: Allows a single user to manage multiple distinct career profiles using flexible JSONB storage.
- **Credit-Based AI Usage**: Implements a credit system to manage AI API costs and prevent abuse, offering a freemium model.
- **Supabase Auth Integration**: Leverages Supabase for secure, customizable authentication with a Korean UI.
- **Mobile-First Design**: Prioritizes mobile user experience with responsive components and touch-friendly interactions, aligning with the target market's device usage.
- **AI Response Storage**: Stores both processed AI results and raw responses to enable instant display, historical tracking, and potential re-processing without re-running expensive AI calls.
- **Rate Limiting Strategy**: Combines client-side concurrency limits with server-side exponential backoff retry logic to manage Claude API rate limits effectively.
- **Career Explorer Performance**: Uses server-side stats caching (7-day expiry in `career_stats` table), skeleton loaders, and progressive loading (30 items with load-more).

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