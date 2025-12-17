import { Redis } from "@upstash/redis";
import { storage } from "./storage";
import type { AiJob, AiJobType } from "@shared/schema";

// Check if we're in development mode to use in-memory queue
const isDevelopment = process.env.NODE_ENV !== "production";

// Redis instance for production
const redis = isDevelopment ? null : new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// In-memory queue for development
const memoryQueues: Record<string, string[]> = {
  "ai:queue:goal": [],
  "ai:queue:essay": [],
  "ai:queue:analysis": [],
};
const memoryProcessing: Record<string, string> = {};

if (isDevelopment) {
  console.log("Development mode: Using in-memory job queue to conserve Redis");
}

const QUEUE_KEYS: Record<AiJobType, string> = {
  goal: "ai:queue:goal",
  essay: "ai:queue:essay", 
  essay_revision: "ai:queue:essay", // Share queue with essay
  analysis: "ai:queue:analysis",
};

const PROCESSING_KEY = "ai:processing";

export const CONCURRENCY_LIMITS: Record<AiJobType, number> = {
  goal: 6,
  essay: 2,
  essay_revision: 2, // Share limit with essay
  analysis: 2,
};

export const GLOBAL_LIMIT = 8;

export interface QueueStats {
  goal: { queued: number; processing: number };
  essay: { queued: number; processing: number };
  essay_revision: { queued: number; processing: number };
  analysis: { queued: number; processing: number };
  totalProcessing: number;
}

export async function enqueueJob(jobId: string, type: AiJobType): Promise<void> {
  const queueKey = QUEUE_KEYS[type];
  if (isDevelopment) {
    memoryQueues[queueKey].push(jobId);
  } else {
    await redis!.rpush(queueKey, jobId);
  }
}

export async function dequeueJob(type: AiJobType): Promise<string | null> {
  const queueKey = QUEUE_KEYS[type];
  if (isDevelopment) {
    return memoryQueues[queueKey].shift() || null;
  }
  const jobId = await redis!.lpop<string>(queueKey);
  return jobId;
}

export async function getQueueLength(type: AiJobType): Promise<number> {
  const queueKey = QUEUE_KEYS[type];
  if (isDevelopment) {
    return memoryQueues[queueKey].length;
  }
  return await redis!.llen(queueKey);
}

export async function markJobProcessing(jobId: string, type: AiJobType): Promise<void> {
  if (isDevelopment) {
    memoryProcessing[jobId] = type;
  } else {
    await redis!.hset(PROCESSING_KEY, { [jobId]: type });
  }
}

export async function markJobDone(jobId: string): Promise<void> {
  if (isDevelopment) {
    delete memoryProcessing[jobId];
  } else {
    await redis!.hdel(PROCESSING_KEY, jobId);
  }
}

/**
 * Get all job IDs currently marked as processing in Redis.
 * Used for stale job cleanup.
 */
export async function getProcessingJobIds(): Promise<Record<string, string>> {
  if (isDevelopment) {
    return { ...memoryProcessing };
  }
  return await redis!.hgetall<Record<string, string>>(PROCESSING_KEY) || {};
}

/**
 * Clear a specific job from the processing map without checking status.
 * Used for stale job cleanup.
 */
export async function clearProcessingEntry(jobId: string): Promise<void> {
  if (isDevelopment) {
    delete memoryProcessing[jobId];
  } else {
    await redis!.hdel(PROCESSING_KEY, jobId);
  }
}

export async function getProcessingCount(type?: AiJobType): Promise<number> {
  let processing: Record<string, string>;
  if (isDevelopment) {
    processing = memoryProcessing;
  } else {
    processing = await redis!.hgetall<Record<string, string>>(PROCESSING_KEY) || {};
  }
  if (!processing) return 0;
  
  if (type) {
    return Object.values(processing).filter(t => t === type).length;
  }
  return Object.keys(processing).length;
}

export async function getQueueStats(): Promise<QueueStats> {
  const [goalQueued, essayQueued, analysisQueued] = await Promise.all([
    getQueueLength("goal"),
    getQueueLength("essay"),
    getQueueLength("analysis"),
  ]);
  
  let processing: Record<string, string>;
  if (isDevelopment) {
    processing = memoryProcessing;
  } else {
    processing = await redis!.hgetall<Record<string, string>>(PROCESSING_KEY) || {};
  }
  const processingTypes = Object.values(processing);
  
  // Count essay_revision in the essay processing count since they share the same queue
  const essayProcessing = processingTypes.filter(t => t === "essay" || t === "essay_revision").length;
  
  return {
    goal: {
      queued: goalQueued,
      processing: processingTypes.filter(t => t === "goal").length,
    },
    essay: {
      queued: essayQueued,
      processing: essayProcessing,
    },
    essay_revision: {
      queued: essayQueued, // Shares queue with essay
      processing: essayProcessing,
    },
    analysis: {
      queued: analysisQueued,
      processing: processingTypes.filter(t => t === "analysis").length,
    },
    totalProcessing: processingTypes.length,
  };
}

export async function canProcessImmediately(type: AiJobType): Promise<boolean> {
  const stats = await getQueueStats();
  const typeStats = stats[type];
  
  if (stats.totalProcessing >= GLOBAL_LIMIT) {
    return false;
  }
  
  if (typeStats.queued > 0 || typeStats.processing >= CONCURRENCY_LIMITS[type]) {
    return false;
  }
  
  return true;
}

export async function getJobPosition(jobId: string, type: AiJobType): Promise<number> {
  const queueKey = QUEUE_KEYS[type];
  let queue: string[];
  if (isDevelopment) {
    queue = memoryQueues[queueKey];
  } else {
    queue = await redis!.lrange<string>(queueKey, 0, -1);
  }
  const position = queue.indexOf(jobId);
  return position === -1 ? 0 : position + 1;
}

export function estimateProgress(job: AiJob): number {
  if (job.status === "completed") return 100;
  if (job.status === "failed") return 0;
  if (job.status === "queued") return 5;
  
  if (job.status === "processing") {
    // Try to calculate progress based on elapsed time
    if (job.startedAt) {
      try {
        const startTime = job.startedAt instanceof Date 
          ? job.startedAt.getTime() 
          : new Date(job.startedAt).getTime();
        
        if (!isNaN(startTime)) {
          const elapsed = Date.now() - startTime;
          // Use longer duration estimate for more gradual progress
          const estimatedDuration = job.type === "goal" ? 15000 : 45000;
          const progress = Math.min(90, 10 + (elapsed / estimatedDuration) * 80);
          return Math.round(progress);
        }
      } catch (e) {
        // Fall through to stored progress
      }
    }
    
    // Fall back to stored progress value if time-based calculation fails
    return Math.max(job.progress || 0, 10);
  }
  
  return job.progress || 0;
}
