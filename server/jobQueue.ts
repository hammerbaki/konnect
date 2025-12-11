import { Redis } from "@upstash/redis";
import { storage } from "./storage";
import type { AiJob, AiJobType } from "@shared/schema";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const QUEUE_KEYS = {
  goal: "ai:queue:goal",
  essay: "ai:queue:essay", 
  analysis: "ai:queue:analysis",
};

const PROCESSING_KEY = "ai:processing";

const CONCURRENCY_LIMITS = {
  goal: 6,
  essay: 2,
  analysis: 2,
};

const GLOBAL_LIMIT = 8;

export interface QueueStats {
  goal: { queued: number; processing: number };
  essay: { queued: number; processing: number };
  analysis: { queued: number; processing: number };
  totalProcessing: number;
}

export async function enqueueJob(jobId: string, type: AiJobType): Promise<void> {
  const queueKey = QUEUE_KEYS[type];
  await redis.rpush(queueKey, jobId);
}

export async function dequeueJob(type: AiJobType): Promise<string | null> {
  const queueKey = QUEUE_KEYS[type];
  const jobId = await redis.lpop<string>(queueKey);
  return jobId;
}

export async function getQueueLength(type: AiJobType): Promise<number> {
  const queueKey = QUEUE_KEYS[type];
  return await redis.llen(queueKey);
}

export async function markJobProcessing(jobId: string, type: AiJobType): Promise<void> {
  await redis.hset(PROCESSING_KEY, { [jobId]: type });
}

export async function markJobDone(jobId: string): Promise<void> {
  await redis.hdel(PROCESSING_KEY, jobId);
}

export async function getProcessingCount(type?: AiJobType): Promise<number> {
  const processing = await redis.hgetall<Record<string, string>>(PROCESSING_KEY);
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
  
  const processing = await redis.hgetall<Record<string, string>>(PROCESSING_KEY) || {};
  const processingTypes = Object.values(processing);
  
  return {
    goal: {
      queued: goalQueued,
      processing: processingTypes.filter(t => t === "goal").length,
    },
    essay: {
      queued: essayQueued,
      processing: processingTypes.filter(t => t === "essay").length,
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
  const queue = await redis.lrange<string>(queueKey, 0, -1);
  const position = queue.indexOf(jobId);
  return position === -1 ? 0 : position + 1;
}

export function estimateProgress(job: AiJob): number {
  if (job.status === "completed") return 100;
  if (job.status === "failed") return 0;
  if (job.status === "queued") return 5;
  
  if (job.status === "processing") {
    if (!job.startedAt) return 10;
    
    const elapsed = Date.now() - new Date(job.startedAt).getTime();
    const estimatedDuration = job.type === "goal" ? 8000 : 20000;
    const progress = Math.min(90, 10 + (elapsed / estimatedDuration) * 80);
    return Math.round(progress);
  }
  
  return job.progress;
}
