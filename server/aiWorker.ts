import { storage } from "./storage";
import { 
  dequeueJob, 
  markJobProcessing, 
  markJobDone, 
  canProcessImmediately,
  getQueueStats,
} from "./jobQueue";
import { 
  generateCareerAnalysis, 
  generatePersonalEssay, 
  generateGoals,
  type GoalLevel 
} from "./ai";
import type { AiJobType, AiJob } from "@shared/schema";

let isWorkerRunning = false;
const POLL_INTERVAL = 1000;

export async function processJob(job: AiJob): Promise<any> {
  const type = job.type as AiJobType;
  const payload = job.payload as any;
  
  await storage.updateAiJobStatus(job.id, "processing", 10);
  await markJobProcessing(job.id, type);
  
  try {
    let result: any;
    
    switch (type) {
      case "analysis": {
        await storage.updateAiJobStatus(job.id, "processing", 30);
        result = await generateCareerAnalysis(payload.profileData, payload.profileType);
        break;
      }
      case "essay": {
        await storage.updateAiJobStatus(job.id, "processing", 30);
        result = await generatePersonalEssay(
          payload.profileData,
          payload.profileType,
          payload.category,
          payload.topic
        );
        break;
      }
      case "goal": {
        await storage.updateAiJobStatus(job.id, "processing", 30);
        result = await generateGoals(
          payload.level as GoalLevel,
          {
            visionTitle: payload.visionTitle,
            visionDescription: payload.visionDescription,
            targetYear: payload.targetYear,
            ancestorChain: payload.ancestorChain || [],
            siblings: payload.siblings || [],
          },
          payload.count
        );
        break;
      }
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
    
    await storage.updateAiJobResult(job.id, result);
    await markJobDone(job.id);
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await storage.updateAiJobError(job.id, errorMessage);
    await markJobDone(job.id);
    throw error;
  }
}

async function processNextJob(type: AiJobType): Promise<boolean> {
  const stats = await getQueueStats();
  const typeStats = stats[type];
  
  const concurrencyLimits: Record<AiJobType, number> = {
    goal: 6,
    essay: 2,
    analysis: 2,
  };
  
  if (stats.totalProcessing >= 8) {
    return false;
  }
  
  if (typeStats.processing >= concurrencyLimits[type]) {
    return false;
  }
  
  const jobId = await dequeueJob(type);
  if (!jobId) {
    return false;
  }
  
  const job = await storage.getAiJob(jobId);
  if (!job || job.status !== "queued") {
    return false;
  }
  
  processJob(job).catch(err => {
    console.error(`Job ${jobId} failed:`, err);
  });
  
  return true;
}

async function workerLoop(): Promise<void> {
  const types: AiJobType[] = ["goal", "essay", "analysis"];
  
  for (const type of types) {
    await processNextJob(type);
  }
}

export function startWorker(): void {
  if (isWorkerRunning) {
    return;
  }
  
  isWorkerRunning = true;
  console.log("✓ AI job worker started");
  
  const poll = async () => {
    if (!isWorkerRunning) return;
    
    try {
      await workerLoop();
    } catch (error) {
      console.error("Worker loop error:", error);
    }
    
    setTimeout(poll, POLL_INTERVAL);
  };
  
  poll();
}

export function stopWorker(): void {
  isWorkerRunning = false;
  console.log("AI job worker stopped");
}

export async function submitJobWithFastPath(
  userId: string,
  profileId: string | null,
  type: AiJobType,
  payload: any
): Promise<{ jobId: string; immediate: boolean }> {
  const job = await storage.createAiJob({
    userId,
    profileId,
    type,
    status: "queued",
    progress: 0,
    payload,
  });
  
  const canProcess = await canProcessImmediately(type);
  
  if (canProcess) {
    processJob(job).catch(err => {
      console.error(`Immediate job ${job.id} failed:`, err);
    });
    return { jobId: job.id, immediate: true };
  }
  
  const { enqueueJob } = await import("./jobQueue");
  await enqueueJob(job.id, type);
  
  return { jobId: job.id, immediate: false };
}
