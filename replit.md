# Konnect - AI Career Guidance Platform

## Overview

Konnect is a Korean-language AI-powered career guidance platform that provides personalized career analysis, goal management, and personal statement generation. The application serves multiple user segments including elementary, middle, and high school students, university students, and general job seekers. Built with a React frontend and Express backend, it leverages Claude AI for intelligent career insights and uses PostgreSQL for data persistence.

## Recent Changes

### December 8, 2024 - Replit Auth Integration (Social Login)
- **Replaced custom authentication with Replit Auth**
- Removed custom email/password + magic link authentication
- Added social login support: Google, Apple, GitHub, X (Twitter), Email
- Simplified users table (removed passwordHash, emailVerified columns)
- Removed magic_link_tokens table
- Updated frontend Login page with clean redirect to Replit Auth
- Production database migrated to Supabase for better stability
- All 537 career records preserved and migrated

### December 4, 2024 - Backend Implementation Complete + Production Deployment Fixes
- **Complete backend infrastructure implemented** with PostgreSQL, Replit Auth, and Anthropic AI
- **Production deployment fixes** applied to prevent crash loops
- **ESM/CJS bundling fixes**: Replaced problematic npm packages (memoizee, p-limit, p-retry) with custom implementations to prevent "is not a function" errors in production builds
- **Error handling** added throughout (uncaught exceptions, unhandled rejections, initialization errors)
- **Environment validation** added at startup with clear error messages
- **Detailed logging** for all initialization steps for easier debugging
- **Database connection** hardened with timeouts and error listeners
- **Authentication setup** wrapped in try-catch with detailed logs
- All API endpoints tested and working (profiles, analyses, essays, kompass goals)
- Credit system fully functional (10 free credits per user)
- AI generation with custom rate limiting and exponential backoff retry logic operational

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript and Vite as the build tool

**UI Component System**: 
- Radix UI primitives for accessible, unstyled components
- shadcn/ui component library with Toss Design System styling
- Tailwind CSS for utility-first styling with custom Korean design tokens

**State Management**:
- TanStack Query (React Query) for server state management and API caching
- React Context for global state (TokenContext for credit management, MobileActionContext for mobile UI actions)
- Local component state with React hooks

**Routing**: Wouter for lightweight client-side routing

**Key Design Patterns**:
- Mobile-first responsive design with separate desktop/mobile navigation components
- Context-based feature flags and user preferences
- Optimistic UI updates with React Query mutations
- Reusable layout wrapper (Layout component) for consistent page structure

**Client Structure**:
- `/pages` - Route-level components (Dashboard, Analysis, Goals, Profile, etc.)
- `/components` - Reusable UI components organized by domain (layout, token, ui)
- `/lib` - Utilities, API client, mock data, and context providers
- `/hooks` - Custom React hooks for common patterns

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**Authentication System**:
- Replit Auth integration using OpenID Connect (OIDC)
- Passport.js strategy for session management
- PostgreSQL-backed session storage via connect-pg-simple
- JWT token refresh mechanism
- Protected routes using `isAuthenticated` middleware

**Database Layer**:
- ORM: Drizzle ORM for type-safe database operations
- Migration system via drizzle-kit
- Storage abstraction layer (`server/storage.ts`) implementing repository pattern
- Support for multiple profile types with flexible JSONB schema

**AI Integration**:
- Anthropic Claude API via Replit AI Integrations (no manual API key required)
- Rate limiting: 2 concurrent requests using custom concurrency limiter (ESM-compatible)
- Retry logic with custom exponential backoff (2s-128s, 7 attempts) for handling rate limits
- Profile-specific system prompts for tailored career analysis
- Streaming responses support for real-time AI generation

**API Design**:
- RESTful endpoints organized by resource (profiles, analyses, essays, goals)
- Consistent error handling and HTTP status codes
- Request validation using Zod schemas
- All routes require authentication except auth endpoints

**Server Structure**:
- `/server/routes.ts` - API endpoint definitions
- `/server/storage.ts` - Database abstraction layer
- `/server/ai.ts` - AI service integration
- `/server/replitAuth.ts` - Authentication configuration
- `/server/db.ts` - Database connection setup

### Data Architecture

**Database Tables**:

1. **sessions** - Session storage for authentication (sid, sess, expire)
2. **users** - User accounts with Replit Auth integration (id, email, firstName, lastName, profileImageUrl, credits)
3. **profiles** - Multi-profile system supporting 5 types (id, userId, type, title, icon, color, profileData as JSONB)
4. **career_analyses** - AI-generated career analysis results (id, profileId, summary, stats, chartData, recommendations, aiRawResponse)
5. **personal_essays** - AI-generated essays and personal statements (id, profileId, category, topic, title, content, draftVersion)
6. **kompass_goals** - Hierarchical goal management system (id, profileId, targetYear, visionData as JSONB, progress)

**Profile Types**:
- `elementary` - Elementary school students (interest discovery)
- `middle` - Middle school students (aptitude identification)
- `high` - High school students (university admission focus)
- `university` - University students (job preparation)
- `general` - General job seekers (career advancement)

**JSONB Schema Strategy**: Each profile type stores flexible structured data in the `profileData` JSONB field, allowing different field requirements per type without schema migrations.

### Key Architectural Decisions

**Multi-Profile System**:
- **Problem**: Users need to manage different personas (e.g., student profile vs. professional profile)
- **Solution**: Single user can have multiple profiles with different types, each with specialized data structures
- **Rationale**: Flexible JSONB storage allows type-specific fields without table proliferation

**Credit-Based AI Usage**:
- **Problem**: Control AI API costs and prevent abuse
- **Solution**: Token/credit system where users receive 10 free credits, consuming 1 per AI operation
- **Rationale**: Sustainable freemium model with upgrade path

**Replit Auth Integration**:
- **Problem**: Need secure authentication without managing user credentials
- **Solution**: Delegate to Replit's OAuth/OIDC provider with automatic user provisioning
- **Rationale**: Reduces security surface area and leverages platform integration

**Mobile-First Design**:
- **Problem**: Korean users heavily favor mobile devices
- **Solution**: Separate mobile navigation (bottom bar with glassmorphism), responsive components, touch-friendly interactions
- **Rationale**: Aligns with target market usage patterns

**AI Response Storage**:
- **Problem**: Need to display analysis results without re-running expensive AI calls
- **Solution**: Store both processed results (summary, stats, chartData) and raw AI response in database
- **Rationale**: Enables instant display, historical tracking, and potential re-processing

**Rate Limiting Strategy**:
- **Problem**: Claude API has rate limits; concurrent requests can cause failures
- **Solution**: Client-side concurrency limit (2 requests) + server-side retry logic
- **Rationale**: Balances performance with API stability

## External Dependencies

### Third-Party Services

**AI Services**:
- Anthropic Claude API (via Replit AI Integrations) - Career analysis and essay generation
- System prompts customized for Korean career counseling context

**Database**:
- PostgreSQL (Neon-backed via Replit) - Primary data store
- WebSocket connection for serverless compatibility

**Authentication**:
- Replit Auth (OpenID Connect) - User authentication and session management
- Supports social login (Google, GitHub, etc.)

### Key NPM Dependencies

**Frontend Core**:
- `react` & `react-dom` - UI framework
- `wouter` - Client-side routing
- `@tanstack/react-query` - Server state management
- `vite` - Build tool and dev server

**UI Libraries**:
- `@radix-ui/*` - Accessible component primitives (20+ packages)
- `tailwindcss` - Utility CSS framework
- `lucide-react` - Icon system
- `recharts` - Data visualization charts
- `framer-motion` - Animation library

**Backend Core**:
- `express` - Web server framework
- `drizzle-orm` - TypeScript ORM
- `@neondatabase/serverless` - PostgreSQL driver with WebSocket support
- `passport` & `openid-client` - Authentication
- `express-session` & `connect-pg-simple` - Session management

**AI Integration**:
- `@anthropic-ai/sdk` - Claude API client
- `p-limit` - Concurrency control
- `p-retry` - Retry logic with exponential backoff

**Development Tools**:
- `typescript` - Type safety
- `tsx` - TypeScript execution
- `drizzle-kit` - Database migrations
- `esbuild` - Production bundling

**Data Processing**:
- `zod` - Runtime type validation
- `date-fns` - Date manipulation
- `memoizee` - Function memoization

### API Integration Points

1. **Replit Auth Endpoints**:
   - `GET /api/login` - Initiate OAuth flow
   - `GET /api/callback` - OAuth callback handler
   - `GET /api/logout` - Session termination

2. **Career Analysis Endpoints**:
   - `POST /api/analyses` - Generate new AI analysis (costs 1 credit)
   - `GET /api/analyses` - Retrieve user's analysis history

3. **Profile Management**:
   - CRUD operations on `/api/profiles/*`
   - Supports 5 distinct profile types with specialized schemas

4. **Essay Generation**:
   - `POST /api/essays` - AI-generated personal statements (costs 1 credit)
   - Category-based templates (university admission, job application, etc.)

5. **Goal Management (Kompass)**:
   - Hierarchical goal structure: Vision → Yearly → Half-Yearly → Monthly → Weekly → Daily
   - Stored as JSONB tree structure for flexible querying