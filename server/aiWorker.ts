import { storage } from "./storage";
import { 
  dequeueJob, 
  markJobProcessing, 
  markJobDone, 
  canProcessImmediately,
  getQueueStats,
  GLOBAL_LIMIT,
  CONCURRENCY_LIMITS,
} from "./jobQueue";
import { 
  generateCareerAnalysis, 
  generatePersonalEssay, 
  revisePersonalEssay,
  generateGoals,
  type GoalLevel 
} from "./ai";
import type { AiJobType, AiJob, NotificationType } from "@shared/schema";

function getNotificationDetails(type: AiJobType): { notificationType: NotificationType; title: string; message: string; linkUrl: string } {
  switch (type) {
    case "analysis":
      return {
        notificationType: "analysis_complete",
        title: "진로 분석 완료",
        message: "AI 진로 분석이 완료되었습니다. 결과를 확인해 보세요!",
        linkUrl: "/analysis",
      };
    case "essay":
      return {
        notificationType: "essay_complete",
        title: "자기소개서 생성 완료",
        message: "AI 자기소개서가 생성되었습니다. 결과를 확인해 보세요!",
        linkUrl: "/essays",
      };
    case "essay_revision":
      return {
        notificationType: "essay_complete",
        title: "자기소개서 수정 완료",
        message: "AI 자기소개서 수정이 완료되었습니다. 결과를 확인해 보세요!",
        linkUrl: "/essays",
      };
    case "goal":
      return {
        notificationType: "goal_complete",
        title: "목표 생성 완료",
        message: "AI 목표가 생성되었습니다. Kompass에서 확인해 보세요!",
        linkUrl: "/kompass",
      };
    default:
      return {
        notificationType: "system",
        title: "작업 완료",
        message: "AI 작업이 완료되었습니다.",
        linkUrl: "/dashboard",
      };
  }
}

async function createJobCompletionNotification(job: AiJob): Promise<void> {
  try {
    const { notificationType, title, message, linkUrl } = getNotificationDetails(job.type as AiJobType);
    await storage.createNotification({
      userId: job.userId,
      type: notificationType,
      title,
      message,
      linkUrl,
      sourceJobId: job.id,
    });
  } catch (error) {
    console.error("Failed to create notification for job:", job.id, error);
  }
}

let isWorkerRunning = false;
const POLL_INTERVAL = 30000; // 30 seconds to reduce Redis usage
const FAST_POLL_INTERVAL = 2000; // 2 seconds when there are active jobs
let lastHadWork = false;

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
        // Construct a profile-like object for the AI function
        const profileForAnalysis = {
          type: payload.profileType,
          title: payload.profileTitle || "프로필",
          profileData: payload.profileData || {},
        };
        result = await generateCareerAnalysis(profileForAnalysis as any, payload.userIdentity);
        
        // Save analysis to analyses table so frontend query can fetch it
        if (job.profileId) {
          await storage.createAnalysis({
            profileId: job.profileId,
            summary: result.summary,
            stats: result.stats,
            chartData: null,
            recommendations: {
              careers: result.careerRecommendations,
            },
            aiRawResponse: result.rawResponse,
          });
          
          // Update profile lastAnalyzed timestamp
          await storage.updateProfile(job.profileId, {
            lastAnalyzed: new Date(),
          });
        }
        break;
      }
      case "essay": {
        await storage.updateAiJobStatus(job.id, "processing", 30);
        result = await generatePersonalEssay(
          payload.profileType,
          payload.category,
          payload.topic,
          payload.context,
          payload.profileData
        );
        break;
      }
      case "essay_revision": {
        await storage.updateAiJobStatus(job.id, "processing", 30);
        result = await revisePersonalEssay(
          payload.originalTitle,
          payload.originalContent,
          payload.revisionRequest
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
    
    // Create notification for completed job
    await createJobCompletionNotification(job);
    
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
    essay_revision: 2,
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

async function workerLoop(): Promise<boolean> {
  const types: AiJobType[] = ["goal", "essay", "essay_revision", "analysis"];
  let didWork = false;
  
  for (const type of types) {
    const processed = await processNextJob(type);
    if (processed) didWork = true;
  }
  
  return didWork;
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
      const didWork = await workerLoop();
      lastHadWork = didWork;
    } catch (error) {
      console.error("Worker loop error:", error);
    }
    
    // Use faster polling when there's active work, slower when idle
    const interval = lastHadWork ? FAST_POLL_INTERVAL : POLL_INTERVAL;
    setTimeout(poll, interval);
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
  
  // In autoscale deployments, always try to process immediately
  // The background worker may not be running between requests
  const stats = await getQueueStats();
  const typeStats = stats[type];
  
  // Only block if we're at global limit or type is already at max processing
  const canProcess = stats.totalProcessing < GLOBAL_LIMIT && 
                     typeStats.processing < CONCURRENCY_LIMITS[type];
  
  if (canProcess) {
    // Process immediately - don't rely on background worker in autoscale
    processJob(job).catch(err => {
      console.error(`Immediate job ${job.id} failed:`, err);
    });
    return { jobId: job.id, immediate: true };
  }
  
  // Only enqueue if we truly can't process now
  const { enqueueJob } = await import("./jobQueue");
  await enqueueJob(job.id, type);
  
  return { jobId: job.id, immediate: false };
}
