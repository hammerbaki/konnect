# Konnect Mobile App Integration Guide

This document provides complete API documentation and integration guidelines for connecting the Konnect Expo/React Native mobile app to the backend.

## Backend Configuration

```
Production API URL: https://konnect.careers
Development API URL: https://a0651719-f4de-4ca3-be73-f7bfee96fc6b-00-3le6emqlmfolt.picard.replit.dev

Supabase URL: https://kzjgmqjdtmnrzxsgeerp.supabase.co
Supabase Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6amdtcWpkdG1ucnp4c2dlZXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzA1NDAsImV4cCI6MjA4MDc0NjU0MH0.U9zhShJ-vK9qD6kWIInm-xPqBK01yojFXwg19SAXWjg
```

## Environment Variables for Expo App

Create a `.env` file in your Expo project:

```env
EXPO_PUBLIC_API_URL=https://konnect.careers
EXPO_PUBLIC_SUPABASE_URL=https://kzjgmqjdtmnrzxsgeerp.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6amdtcWpkdG1ucnp4c2dlZXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzA1NDAsImV4cCI6MjA4MDc0NjU0MH0.U9zhShJ-vK9qD6kWIInm-xPqBK01yojFXwg19SAXWjg
```

---

## Authentication Setup

### Required Packages

```bash
npx expo install @supabase/supabase-js expo-secure-store
npm install react-native-iap  # For In-App Purchases
```

### Supabase Client with Secure Storage

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### API Client with Bearer Token Authentication

```typescript
// lib/api.ts
import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(error.message || 'Request failed', response.status);
  }
  
  return response.json();
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  
  post: <T>(endpoint: string, data?: any) => apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  }),
  
  patch: <T>(endpoint: string, data?: any) => apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  }),
  
  put: <T>(endpoint: string, data?: any) => apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  }),
  
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};
```

---

## Complete API Reference

### Legend
- **Auth Required**: Requires `Authorization: Bearer <token>` header
- **Public**: No authentication needed

---

### 1. User & Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/config` | Public | Get Supabase configuration |
| GET | `/api/user` | Required | Get complete user data (credits, GP, profile) |
| GET | `/api/user-identity` | Required | Get user identity info |
| PATCH | `/api/user-identity` | Required | Update user identity |
| GET | `/api/user-settings` | Required | Get user settings |
| PATCH | `/api/user-settings` | Required | Update user settings |
| GET | `/api/user-profile` | Required | Get user profile |
| PUT | `/api/user-profile` | Required | Update user profile |
| GET | `/api/auth/user` | Required | Get authenticated user |
| POST | `/api/auth/logout` | Required | Logout user |
| DELETE | `/api/auth/delete-account` | Required | Delete user account |

#### Response Types

```typescript
// GET /api/user
interface UserResponse {
  id: string;
  email: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  gender: string | null;
  birthDate: string | null;
  credits: number;
  giftPoints: number;
  referralCode: string | null;
  createdAt: string;
}

// GET /api/user-identity
interface UserIdentity {
  id: string;
  displayName: string;
  email: string;
  gender: string | null;
  birthDate: string | null;
}

// PATCH /api/user-identity
interface UpdateUserIdentity {
  displayName?: string;
  gender?: 'male' | 'female' | 'other';
  birthDate?: string; // YYYY-MM-DD format
}

// GET /api/user-settings
interface UserSettings {
  phone: string | null;
  marketingConsent: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
}
```

---

### 2. Profiles

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/profiles` | Required | Get all user profiles |
| GET | `/api/profiles/:id` | Required | Get specific profile |
| POST | `/api/profiles` | Required | Create new profile |
| PATCH | `/api/profiles/:id` | Required | Update profile |
| DELETE | `/api/profiles/:id` | Required | Delete profile |

#### Types

```typescript
type ProfileType = 'elementary' | 'middle' | 'high' | 'university' | 'general';

interface Profile {
  id: string;
  userId: string;
  type: ProfileType;
  title: string;
  icon: string;
  color: string;
  data: Record<string, any>; // Flexible JSONB data
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// POST /api/profiles
interface CreateProfile {
  type: ProfileType;
  title?: string;
  data?: Record<string, any>;
}
```

---

### 3. Career Analysis

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/profiles/:profileId/analyses` | Required | Get analyses for profile |
| POST | `/api/profiles/:profileId/analyses` | Required | Save analysis |
| POST | `/api/profiles/:profileId/generate-analysis` | Required | Generate AI analysis (costs points) |
| DELETE | `/api/analyses/:id` | Required | Delete analysis |

#### Types

```typescript
interface CareerAnalysis {
  id: string;
  profileId: string;
  content: Record<string, any>; // AI-generated analysis data
  rawResponse: string | null;
  createdAt: string;
}

// POST /api/profiles/:profileId/generate-analysis
interface GenerateAnalysisRequest {
  profileData: Record<string, any>;
}
```

---

### 4. Personal Essays

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/profiles/:profileId/essays` | Required | Get essays for profile |
| POST | `/api/profiles/:profileId/essays` | Required | Save essay |
| POST | `/api/profiles/:profileId/generate-essay` | Required | Generate AI essay (costs points) |
| PATCH | `/api/essays/:id` | Required | Update essay |
| DELETE | `/api/essays/:id` | Required | Delete essay |

#### Types

```typescript
interface PersonalEssay {
  id: string;
  profileId: string;
  targetType: string;
  targetName: string;
  targetUrl: string | null;
  content: Record<string, any>;
  rawResponse: string | null;
  createdAt: string;
  updatedAt: string;
}

// POST /api/profiles/:profileId/generate-essay
interface GenerateEssayRequest {
  targetType: string;
  targetName: string;
  targetUrl?: string;
  profileData: Record<string, any>;
  essayQuestions?: string[];
}
```

---

### 5. Kompass Goals

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/kompass` | Required | Get all goals |
| GET | `/api/kompass/:id` | Required | Get specific goal |
| GET | `/api/profiles/:profileId/kompass` | Required | Get goals for profile |
| POST | `/api/profiles/:profileId/kompass` | Required | Create goal |
| PATCH | `/api/kompass/:id` | Required | Update goal |
| DELETE | `/api/kompass/:id` | Required | Delete goal |
| POST | `/api/goals/ai-suggest` | Required | Get AI goal suggestions (costs points) |

#### Types

```typescript
type GoalLevel = 'yearly' | 'half-yearly' | 'monthly' | 'weekly' | 'daily';
type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled';

interface KompassGoal {
  id: string;
  profileId: string;
  parentId: string | null;
  level: GoalLevel;
  title: string;
  description: string | null;
  status: GoalStatus;
  startDate: string | null;
  endDate: string | null;
  progress: number; // 0-100
  order: number;
  createdAt: string;
  updatedAt: string;
}

// POST /api/profiles/:profileId/kompass
interface CreateGoal {
  parentId?: string;
  level: GoalLevel;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

// POST /api/goals/ai-suggest
interface AISuggestRequest {
  profileId: string;
  parentGoalId?: string;
  level: GoalLevel;
}
```

---

### 6. Points & Gift Points

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/gift-points/balance` | Required | Get GP balance |
| GET | `/api/gift-points/ledger` | Required | Get GP transaction history |
| GET | `/api/gift-points/transactions` | Required | Get GP transactions |
| GET | `/api/points/history` | Required | Get points usage history |
| GET | `/api/signup-bonus` | Required | Get signup bonus info |

#### Types

```typescript
interface GiftPointBalance {
  balance: number;
  expiringWithin30Days: number;
}

interface GiftPointTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  reason: string;
  expiresAt: string | null;
  createdAt: string;
}
```

---

### 7. In-App Purchases (IAP)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/iap/products` | Public | Get available IAP products |
| POST | `/api/iap/verify/apple` | Required | Verify Apple receipt |
| POST | `/api/iap/verify/google` | Required | Verify Google receipt |
| GET | `/api/iap/history` | Required | Get IAP transaction history |

#### Types

```typescript
// GET /api/iap/products
interface IAPProduct {
  productId: string;
  points: number;
  bonusPoints: number;
  displayName: string;
  totalPoints: number;
}

// Available products:
// - com.konnect.points.1000: 1,000P
// - com.konnect.points.3000: 3,000P + 300 bonus
// - com.konnect.points.5000: 5,000P + 700 bonus
// - com.konnect.points.10000: 10,000P + 2,000 bonus

// POST /api/iap/verify/apple
interface AppleVerifyRequest {
  platform: 'apple';
  productId: string;
  transactionId: string;
  receiptData: string; // Base64 encoded receipt
  originalTransactionId?: string;
}

// POST /api/iap/verify/google
interface GoogleVerifyRequest {
  platform: 'google';
  productId: string;
  transactionId: string;
  receiptData: string; // Purchase token
  originalTransactionId?: string;
}

// Response for both
interface IAPVerifyResponse {
  success: boolean;
  message: string;
  pointsAwarded: number;
  newBalance: number;
  appleTransactionId?: string;
  sandbox?: boolean;
  devMode?: boolean;
  alreadyProcessed?: boolean;
}
```

#### IAP Integration Example

```typescript
// Using react-native-iap
import * as RNIap from 'react-native-iap';
import { api } from './api';

const productIds = [
  'com.konnect.points.1000',
  'com.konnect.points.3000',
  'com.konnect.points.5000',
  'com.konnect.points.10000',
];

async function initIAP() {
  await RNIap.initConnection();
  const products = await RNIap.getProducts({ skus: productIds });
  return products;
}

async function purchaseProduct(productId: string) {
  const purchase = await RNIap.requestPurchase({ sku: productId });
  
  // Verify with server
  const platform = Platform.OS === 'ios' ? 'apple' : 'google';
  const endpoint = `/api/iap/verify/${platform}`;
  
  const result = await api.post(endpoint, {
    platform,
    productId,
    transactionId: purchase.transactionId,
    receiptData: Platform.OS === 'ios' 
      ? purchase.transactionReceipt 
      : purchase.purchaseToken,
    originalTransactionId: purchase.originalTransactionIdentifierIOS,
  });
  
  // Acknowledge purchase after server verification
  if (result.success) {
    await RNIap.finishTransaction({ purchase });
  }
  
  return result;
}
```

---

### 8. Payments (Web-based Toss Payments)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/payments/packages` | Required | Get payment packages |
| GET | `/api/payments/config` | Required | Get payment config |
| GET | `/api/payments/history` | Required | Get payment history |
| POST | `/api/payments/init` | Required | Initialize payment |
| POST | `/api/payments/confirm` | Required | Confirm payment |
| POST | `/api/payments/fail` | Required | Handle payment failure |

Note: For mobile apps, use IAP instead of web payments.

---

### 9. Referral System

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/referral/info` | Required | Get referral info and code |
| GET | `/api/referral/invitees` | Required | Get list of invited users |
| POST | `/api/referral/claim` | Required | Claim referral reward |
| POST | `/api/redeem` | Required | Apply referral code during signup |
| POST | `/api/redeem-code` | Required | Apply coupon code |

#### Types

```typescript
// GET /api/referral/info
interface ReferralInfo {
  referralCode: string;
  referralLink: string;
  totalInvited: number;
  rewardPerReferral: number;
  pendingRewards: number;
}

// POST /api/redeem
interface RedeemReferralRequest {
  referralCode: string;
}

// POST /api/redeem-code
interface RedeemCouponRequest {
  code: string;
}
```

---

### 10. Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | Required | Get all notifications |
| GET | `/api/notifications/unread-count` | Required | Get unread count |
| PATCH | `/api/notifications/:id/read` | Required | Mark as read |
| PATCH | `/api/notifications/read-all` | Required | Mark all as read |
| DELETE | `/api/notifications/:id` | Required | Delete notification |

#### Types

```typescript
interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  isRead: boolean;
  createdAt: string;
}
```

---

### 11. Career Explorer (Public)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/careers` | Public | Get career list |
| GET | `/api/careers/search?q=keyword` | Public | Search careers |
| GET | `/api/careers/category/:category` | Public | Get careers by category |
| GET | `/api/careers/:id` | Public | Get career details |
| GET | `/api/careers/stats/overview` | Public | Get career statistics |

---

### 12. AI Job Queue

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/jobs` | Required | Create AI job |
| GET | `/api/ai/jobs/:id` | Required | Get job status |
| POST | `/api/ai/jobs/:id/cancel` | Required | Cancel job |
| GET | `/api/ai/queue/stats` | Required | Get queue statistics |

#### Types

```typescript
type JobType = 'career_analysis' | 'personal_essay' | 'goal_suggestion';
type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface AIJob {
  id: string;
  userId: string;
  profileId: string;
  type: JobType;
  status: JobStatus;
  input: Record<string, any>;
  result: Record<string, any> | null;
  error: string | null;
  progress: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

// POST /api/ai/jobs
interface CreateJobRequest {
  profileId: string;
  type: JobType;
  input: Record<string, any>;
}
```

---

### 13. Service Pricing (Public)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/service-pricing` | Public | Get all service prices |

#### Response

```typescript
interface ServicePricing {
  id: string;
  serviceKey: string;
  pointCost: number;
  description: string;
}

// Service keys:
// - career_analysis: Career analysis generation
// - personal_essay: Essay generation
// - goal_yearly: Yearly goal AI suggestion
// - goal_half_yearly: Half-yearly goal AI suggestion
// - goal_monthly: Monthly goal AI suggestion
// - goal_weekly: Weekly goal AI suggestion
// - goal_daily: Daily goal AI suggestion
```

---

## Error Handling

All API errors follow this format:

```typescript
interface APIError {
  message: string;
  errors?: Array<{
    path: string[];
    message: string;
  }>;
}

// HTTP Status Codes
// 200 - Success
// 201 - Created
// 400 - Bad Request (validation error)
// 401 - Unauthorized (missing or invalid token)
// 403 - Forbidden (insufficient permissions)
// 404 - Not Found
// 429 - Too Many Requests (rate limited)
// 500 - Internal Server Error
// 503 - Service Unavailable
```

### Error Handling Example

```typescript
import { api, ApiError } from './api';

async function fetchUser() {
  try {
    const user = await api.get('/api/user');
    return user;
  } catch (error) {
    if (error instanceof ApiError) {
      switch (error.status) {
        case 401:
          // Redirect to login
          break;
        case 429:
          // Show rate limit message
          break;
        default:
          // Show generic error
          break;
      }
    }
    throw error;
  }
}
```

---

## Security Best Practices

### 1. Token Storage
- Always use `expo-secure-store` for storing tokens
- Never store tokens in AsyncStorage or localStorage
- Tokens are automatically encrypted on device

### 2. API Communication
- All requests must use HTTPS
- Include Bearer token in Authorization header
- Never log sensitive data

### 3. Token Refresh
- Supabase automatically refreshes tokens
- Listen to `onAuthStateChange` for token updates
- Handle `SIGNED_OUT` event to clear local state

### 4. IAP Security
- Always verify receipts on server
- Never trust client-side purchase validation
- Handle duplicate transactions (idempotency)

---

## CORS Configuration

The backend is configured to accept requests from:
- Mobile apps (no Origin header)
- `https://konnect.careers`
- `http://localhost:19006` (Expo web)
- `http://localhost:8081` (Metro)
- `capacitor://localhost` (iOS Capacitor)
- `http://localhost` (Android Capacitor)

---

## Rate Limits

- General API: 100 requests per minute
- AI endpoints: 10 requests per minute
- Auth endpoints: 20 requests per minute

When rate limited, you'll receive a 429 status code.

---

## Testing

### Test Authentication

```typescript
// Check if user is authenticated
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  console.log('Authenticated as:', session.user.email);
}

// Test API access
try {
  const user = await api.get('/api/user');
  console.log('User data:', user);
} catch (error) {
  console.error('API error:', error);
}
```

### Test Endpoints

```bash
# Test public endpoint
curl https://konnect.careers/api/iap/products

# Test authenticated endpoint
curl https://konnect.careers/api/user \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Quick Start Checklist

1. [ ] Install required packages (`@supabase/supabase-js`, `expo-secure-store`)
2. [ ] Create `.env` file with API URL and Supabase credentials
3. [ ] Set up Supabase client with SecureStore adapter
4. [ ] Create API client with Bearer token authentication
5. [ ] Implement login/signup flow with Supabase Auth
6. [ ] Test `/api/user` endpoint after authentication
7. [ ] Implement IAP flow with server-side verification
8. [ ] Handle errors and token refresh

---

## Support

For API issues or questions, contact the backend team.
