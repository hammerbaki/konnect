import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client safely - never crash
let redis: Redis | null = null;

try {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || '';
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';
  
  if (redisUrl && redisToken) {
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
  } else {
    console.warn('WARNING: Redis credentials not configured - using in-memory rate limiting');
  }
} catch (err) {
  console.error('Error initializing Redis client (non-fatal):', err);
}

export { redis };

// In-memory fallback rate limiter for when Redis is unavailable
// Uses a simple sliding window approach
const memoryLimits = new Map<string, { count: number; resetTime: number }>();

function inMemoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const key = identifier;
  
  let entry = memoryLimits.get(key);
  
  // Reset if window expired
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + windowMs };
    memoryLimits.set(key, entry);
  }
  
  // Check limit
  if (entry.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: entry.resetTime,
    };
  }
  
  // Increment and allow
  entry.count++;
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.resetTime,
  };
}

// Track Redis connection status
let redisAvailable = !!redis;

// In development, use in-memory rate limiting to conserve Redis commands
const isDevelopment = process.env.NODE_ENV !== "production";
if (isDevelopment) {
  console.log("Development mode: Using in-memory rate limiting to conserve Redis");
  redisAvailable = false;
}

// Create rate limiters safely - use dummy redis if not available
const dummyRedis = redis || new Redis({ url: 'https://dummy.upstash.io', token: 'dummy' });

// Different rate limiters for different use cases
// AI Analysis: 10 requests per minute per user (expensive operations)
export const aiAnalysisLimiter = new Ratelimit({
  redis: dummyRedis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: false,
  prefix: "ratelimit:ai:analysis",
});

// AI Goal Generation: 20 requests per minute per user
export const aiGoalLimiter = new Ratelimit({
  redis: dummyRedis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: false,
  prefix: "ratelimit:ai:goals",
});

// AI Essay Generation: 5 requests per minute per user (longer operations)
export const aiEssayLimiter = new Ratelimit({
  redis: dummyRedis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: false,
  prefix: "ratelimit:ai:essay",
});

// Global API rate limiter: 100 requests per minute per IP
export const globalApiLimiter = new Ratelimit({
  redis: dummyRedis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: false,
  prefix: "ratelimit:api:global",
});

// Daily quota per user: 50 AI requests per day
export const dailyQuotaLimiter = new Ratelimit({
  redis: dummyRedis,
  limiter: Ratelimit.slidingWindow(50, "1 d"),
  analytics: false,
  prefix: "ratelimit:daily:quota",
});

// Rate limit check result type
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Default limits for fallback (per minute)
const DEFAULT_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  analysis: { limit: 10, windowMs: 60000 },
  goals: { limit: 20, windowMs: 60000 },
  essay: { limit: 5, windowMs: 60000 },
  daily: { limit: 50, windowMs: 86400000 },
  global: { limit: 100, windowMs: 60000 },
};

// Check rate limit for a specific limiter and identifier
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string,
  fallbackType?: string
): Promise<RateLimitResult> {
  try {
    if (!redisAvailable) {
      throw new Error("Redis unavailable, using fallback");
    }
    
    const result = await limiter.limit(identifier);
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    };
  } catch (error) {
    // Use in-memory fallback when Redis fails
    if (fallbackType && DEFAULT_LIMITS[fallbackType]) {
      const config = DEFAULT_LIMITS[fallbackType];
      const fallbackResult = inMemoryRateLimit(
        `${fallbackType}:${identifier}`,
        config.limit,
        config.windowMs
      );
      console.warn(`Rate limit fallback used for ${fallbackType}:${identifier}`);
      return {
        ...fallbackResult,
        retryAfter: fallbackResult.success ? undefined : Math.ceil((fallbackResult.reset - Date.now()) / 1000),
      };
    }
    
    console.error("Rate limit check failed:", error);
    // On failure without fallback type, use global defaults and allow request
    const defaultLimit = 100;
    return {
      success: true,
      limit: defaultLimit,
      remaining: defaultLimit,
      reset: Date.now() + 60000,
    };
  }
}

// Comprehensive AI rate limit check (combines per-minute and daily limits)
export async function checkAIRateLimit(
  userId: string,
  operationType: "analysis" | "goals" | "essay"
): Promise<RateLimitResult> {
  // First check daily quota
  const dailyResult = await checkRateLimit(dailyQuotaLimiter, userId, "daily");
  if (!dailyResult.success) {
    return {
      ...dailyResult,
      retryAfter: Math.ceil((dailyResult.reset - Date.now()) / 1000),
    };
  }

  // Then check per-minute limit based on operation type
  let limiter: Ratelimit;
  switch (operationType) {
    case "analysis":
      limiter = aiAnalysisLimiter;
      break;
    case "goals":
      limiter = aiGoalLimiter;
      break;
    case "essay":
      limiter = aiEssayLimiter;
      break;
  }

  return checkRateLimit(limiter, userId, operationType);
}

// Express middleware for global API rate limiting
export function createRateLimitMiddleware() {
  return async (req: any, res: any, next: any) => {
    const identifier = req.ip || req.headers["x-forwarded-for"] || "anonymous";
    
    const result = await checkRateLimit(globalApiLimiter, identifier, "global");
    
    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", result.limit);
    res.setHeader("X-RateLimit-Remaining", result.remaining);
    res.setHeader("X-RateLimit-Reset", result.reset);
    
    if (!result.success) {
      return res.status(429).json({
        error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
        retryAfter: result.retryAfter,
      });
    }
    
    next();
  };
}

// Log rate limit statistics
export async function logRateLimitStats(userId: string): Promise<void> {
  try {
    const [analysisResult, goalResult, essayResult, dailyResult] = await Promise.all([
      aiAnalysisLimiter.getRemaining(userId),
      aiGoalLimiter.getRemaining(userId),
      aiEssayLimiter.getRemaining(userId),
      dailyQuotaLimiter.getRemaining(userId),
    ]);

    console.log(`Rate limit stats for user ${userId}:`, {
      analysis: analysisResult,
      goals: goalResult,
      essay: essayResult,
      daily: dailyResult,
    });
  } catch (error) {
    console.error("Failed to log rate limit stats:", error);
  }
}

// Check if Redis is connected and working
export async function checkRedisConnection(): Promise<boolean> {
  try {
    if (!redis) {
      redisAvailable = false;
      return false;
    }
    await redis.ping();
    redisAvailable = true;
    return true;
  } catch (error) {
    console.error("Redis connection check failed:", error);
    redisAvailable = false;
    return false;
  }
}
