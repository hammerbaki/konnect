import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client from environment variables
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// In-memory cache to reduce Redis calls
const cache = new Map<string, { success: boolean; reset: number }>();

// Different rate limiters for different use cases
// AI Analysis: 10 requests per minute per user (expensive operations)
export const aiAnalysisLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "ratelimit:ai:analysis",
});

// AI Goal Generation: 20 requests per minute per user
export const aiGoalLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
  prefix: "ratelimit:ai:goals",
});

// AI Essay Generation: 5 requests per minute per user (longer operations)
export const aiEssayLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "ratelimit:ai:essay",
});

// Global API rate limiter: 100 requests per minute per IP
export const globalApiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "ratelimit:api:global",
});

// Daily quota per user: 50 AI requests per day
export const dailyQuotaLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "1 d"),
  analytics: true,
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

// Check rate limit for a specific limiter and identifier
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<RateLimitResult> {
  try {
    const result = await limiter.limit(identifier);
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // On Redis failure, allow the request but log the error
    return {
      success: true,
      limit: 0,
      remaining: 0,
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
  const dailyResult = await checkRateLimit(dailyQuotaLimiter, userId);
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

  return checkRateLimit(limiter, userId);
}

// Express middleware for global API rate limiting
export function createRateLimitMiddleware() {
  return async (req: any, res: any, next: any) => {
    const identifier = req.ip || req.headers["x-forwarded-for"] || "anonymous";
    
    const result = await checkRateLimit(globalApiLimiter, identifier);
    
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
    await redis.ping();
    return true;
  } catch (error) {
    console.error("Redis connection check failed:", error);
    return false;
  }
}
