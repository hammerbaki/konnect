import { storage } from "./storage";
import { 
  enqueueJob,
  dequeueJob, 
  markJobProcessing, 
  markJobDone, 
  canProcessImmediately,
  getQueueStats,
  getProcessingJobIds,
  clearProcessingEntry,
  GLOBAL_LIMIT,
  CONCURRENCY_LIMITS,
} from "./jobQueue";
import { 
  generateCareerAnalysis,
  generateForeignStudentAnalysis,
  generatePersonalEssay, 
  revisePersonalEssay,
  generateGoals,
  type GoalLevel 
} from "./ai";
import type { AiJobType, AiJob, NotificationType } from "@shared/schema";

function getNotificationDetails(
  type: AiJobType, 
  profileTitle?: string, 
  profileId?: string | null
): { notificationType: NotificationType; title: string; message: string; linkUrl: string } {
  const displayName = profileTitle || "프로필";
  
  switch (type) {
    case "analysis":
      return {
        notificationType: "analysis_complete",
        title: `${displayName} 분석 완료`,
        message: `'${displayName}' 프로필의 AI 진로 분석이 완료되었습니다. 결과를 확인해 보세요!`,
        linkUrl: profileId ? `/analysis?profile=${profileId}` : "/analysis",
      };
    case "essay":
      return {
        notificationType: "essay_complete",
        title: "자기소개서 생성 완료",
        message: `'${displayName}' 프로필의 자기소개서가 생성되었습니다. 결과를 확인해 보세요!`,
        linkUrl: profileId ? `/personal-statement?profile=${profileId}` : "/personal-statement",
      };
    case "essay_revision":
      return {
        notificationType: "essay_complete",
        title: "자기소개서 수정 완료",
        message: "AI 자기소개서 수정이 완료되었습니다. 결과를 확인해 보세요!",
        linkUrl: "/personal-statement",
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
    const payload = job.payload as any;
    const profileTitle = payload?.profileTitle || payload?.title;
    const { notificationType, title, message, linkUrl } = getNotificationDetails(
      job.type as AiJobType, 
      profileTitle,
      job.profileId
    );
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
const STALE_JOB_TIMEOUT = 5 * 60 * 1000; // 5 minutes - jobs processing longer than this are considered stale
let lastHadWork = false;
let currentTimer: NodeJS.Timeout | null = null; // Track the current timeout
let pollFn: (() => Promise<void>) | null = null; // Store reference to poll function
let lastStaleCleanup = 0;
const STALE_CLEANUP_INTERVAL = 60000; // Run stale cleanup every 60 seconds

/**
 * Clean up stale entries from the processing map.
 * A job is considered stale if:
 * - It doesn't exist in the database
 * - It's marked as completed or failed in the database
 * - It's been processing for longer than STALE_JOB_TIMEOUT
 * 
 * Exported so it can be called from admin endpoints.
 */
export async function cleanupStaleProcessingJobs(): Promise<number> {
  try {
    const processingMap = await getProcessingJobIds();
    const now = Date.now();
    let clearedCount = 0;
    
    for (const [jobId, type] of Object.entries(processingMap)) {
      try {
        const job = await storage.getAiJob(jobId);
        
        let isStale = false;
        let reason = "";
        
        if (!job) {
          isStale = true;
          reason = "job not found in database";
        } else if (job.status === "completed" || job.status === "failed") {
          isStale = true;
          reason = `job already ${job.status}`;
        } else if (job.status === "processing" && job.startedAt) {
          const startTime = job.startedAt instanceof Date 
            ? job.startedAt.getTime() 
            : new Date(job.startedAt).getTime();
          if (!isNaN(startTime) && now - startTime > STALE_JOB_TIMEOUT) {
            isStale = true;
            reason = `job processing for ${Math.round((now - startTime) / 1000)}s (timeout: ${STALE_JOB_TIMEOUT / 1000}s)`;
            // Mark the job as failed in the database
            await storage.updateAiJobError(jobId, "작업 시간이 초과되었습니다. 포인트가 환불되었습니다.");
            
            // Auto-refund points for timed out jobs
            try {
              let refundAmount = 0;
              const jobType = job.type as AiJobType;
              const payload = job.payload as any;
              
              if (jobType === 'analysis') {
                refundAmount = await storage.getServiceCost('analysis');
              } else if (jobType === 'essay') {
                refundAmount = await storage.getServiceCost('essay');
              } else if (jobType === 'essay_revision') {
                refundAmount = await storage.getServiceCost('essay_revision');
              } else if (jobType === 'goal' && payload?.level) {
                const isStrategicLevel = payload.level === 'year' || payload.level === 'half';
                if (isStrategicLevel) {
                  refundAmount = await storage.getServiceCost('goal_strategic');
                }
              }
              
              if (refundAmount > 0) {
                await storage.addUserCredits(job.userId, refundAmount, "작업 시간 초과 환불");
                console.log(`Refunded ${refundAmount} points to user ${job.userId} for timed out job ${jobId}`);
              }
            } catch (refundErr) {
              console.error(`Failed to refund points for timed out job ${jobId}:`, refundErr);
            }
          }
        } else if (job.status === "queued") {
          // Job is queued in DB but marked as processing in Redis - inconsistent state
          isStale = true;
          reason = "job is queued in DB but marked processing in Redis";
        }
        
        if (isStale) {
          await clearProcessingEntry(jobId);
          clearedCount++;
          console.log(`Cleared stale processing entry: ${jobId} (${type}) - ${reason}`);
        }
      } catch (err) {
        console.error(`Error checking stale job ${jobId}:`, err);
      }
    }
    
    return clearedCount;
  } catch (err) {
    console.error("Error in stale job cleanup:", err);
    return 0;
  }
}

// Maximum time for AI processing before considering it stuck
const AI_PROCESSING_TIMEOUT_MS = 180000; // 3 minutes

function withProcessingTimeout<T>(promise: Promise<T>, jobId: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`AI processing timed out after ${AI_PROCESSING_TIMEOUT_MS / 1000}s`)), AI_PROCESSING_TIMEOUT_MS)
    )
  ]);
}

export async function processJob(job: AiJob): Promise<any> {
  const type = job.type as AiJobType;
  const payload = job.payload as any;
  
  console.log(`[AI Worker] Starting job ${job.id} (type: ${type})`);
  
  await storage.updateAiJobStatus(job.id, "processing", 10);
  await markJobProcessing(job.id, type);
  
  try {
    let result: any;
    
    switch (type) {
      case "analysis": {
        console.log(`[AI Worker] Processing analysis for job ${job.id}, profileType: ${payload.profileType}`);
        await storage.updateAiJobStatus(job.id, "processing", 30);
        // Construct a profile-like object for the AI function
        const profileForAnalysis = {
          type: payload.profileType,
          title: payload.profileTitle || "프로필",
          profileData: payload.profileData || {},
        };
        
        // Use specialized analysis for international students
        if (payload.profileType === 'international') {
          console.log(`[AI Worker] Using international student analysis for job ${job.id}`);
          result = await withProcessingTimeout(
            generateForeignStudentAnalysis(profileForAnalysis as any, payload.userIdentity),
            job.id
          );
          
          // Save foreign student analysis with specialized format
          // The result contains: profileType, summary, fit, recommendations, actionPlan, visaWarning, dataGaps, rawResponse
          if (job.profileId) {
            const foreignStudentData = {
              summary: result.summary,
              fit: result.fit,
              recommendations: result.recommendations,
              actionPlan: result.actionPlan,
              visaWarning: result.visaWarning,
              dataGaps: result.dataGaps,
            };
            
            await storage.createAnalysis({
              profileId: job.profileId,
              summary: result.summary?.oneLine || "",
              stats: null,
              chartData: null,
              recommendations: {
                profileType: 'international',
                foreignStudentData: foreignStudentData,
              },
              aiRawResponse: result.rawResponse,
            });
          }
        } else {
          result = await withProcessingTimeout(
            generateCareerAnalysis(profileForAnalysis as any, payload.userIdentity),
            job.id
          );
          
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
        }
        
        // Update profile lastAnalyzed for all analysis types
        if (job.profileId) {
          await storage.updateProfile(job.profileId, {
            lastAnalyzed: new Date(),
          });
        }
        break;
      }
      case "essay": {
        console.log(`[AI Worker] Processing essay for job ${job.id}...`);
        await storage.updateAiJobStatus(job.id, "processing", 30);
        result = await withProcessingTimeout(
          generatePersonalEssay(
            payload.profileType,
            payload.category,
            payload.topic,
            payload.context,
            payload.profileData,
            payload.targetInfo
          ),
          job.id
        );
        break;
      }
      case "essay_revision": {
        console.log(`[AI Worker] Processing essay revision for job ${job.id}...`);
        await storage.updateAiJobStatus(job.id, "processing", 30);
        result = await withProcessingTimeout(
          revisePersonalEssay(
            payload.originalTitle,
            payload.originalContent,
            payload.revisionRequest
          ),
          job.id
        );
        break;
      }
      case "goal": {
        console.log(`[AI Worker] Processing goal for job ${job.id}...`);
        await storage.updateAiJobStatus(job.id, "processing", 30);
        result = await withProcessingTimeout(
          generateGoals(
            payload.level as GoalLevel,
            {
              visionTitle: payload.visionTitle,
              visionDescription: payload.visionDescription,
              targetYear: payload.targetYear,
              ancestorChain: payload.ancestorChain || [],
              siblings: payload.siblings || [],
            },
            payload.count
          ),
          job.id
        );
        break;
      }
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
    
    // Extract token usage from result if present
    const tokenUsage = result?.tokenUsage ? {
      inputTokens: result.tokenUsage.inputTokens,
      outputTokens: result.tokenUsage.outputTokens,
      cacheReadTokens: result.tokenUsage.cacheReadTokens,
      cacheWriteTokens: result.tokenUsage.cacheWriteTokens,
      totalTokens: result.tokenUsage.totalTokens,
      estimatedCostCents: result.tokenUsage.estimatedCostCents,
    } : undefined;
    
    console.log(`[AI Worker] Job ${job.id} completed successfully`);
    
    await storage.updateAiJobResult(job.id, result, tokenUsage);
    await markJobDone(job.id);
    
    // Wake worker to process any queued jobs now that capacity is freed
    wakeWorker();
    
    // Create notification for completed job
    await createJobCompletionNotification(job);
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[AI Worker] Job ${job.id} failed:`, errorMessage);
    await storage.updateAiJobError(job.id, errorMessage);
    await markJobDone(job.id);
    
    // Wake worker to process any queued jobs now that capacity is freed
    wakeWorker();
    
    throw error;
  }
}

interface ProcessResult {
  processed: boolean;  // Did we successfully process a job?
  sawWork: boolean;    // Did we see queued jobs or hit capacity limits?
}

async function processNextJob(queueType: AiJobType): Promise<ProcessResult> {
  const stats = await getQueueStats();
  
  // Check if there's any work in the system (queued or processing)
  const hasQueuedJobs = stats.goal.queued > 0 || stats.essay.queued > 0 || stats.analysis.queued > 0;
  const hasProcessingJobs = stats.totalProcessing > 0;
  const sawWork = hasQueuedJobs || hasProcessingJobs;
  
  // Global limit check
  if (stats.totalProcessing >= GLOBAL_LIMIT) {
    return { processed: false, sawWork };
  }
  
  // For essay queue, check combined essay + essay_revision processing count
  // since they share the same queue and concurrency limit
  if (queueType === "essay") {
    const combinedProcessing = stats.essay.processing; // Already includes essay_revision (see getQueueStats)
    if (combinedProcessing >= CONCURRENCY_LIMITS.essay) {
      return { processed: false, sawWork };
    }
  } else {
    const typeStats = stats[queueType];
    if (typeStats.processing >= CONCURRENCY_LIMITS[queueType]) {
      return { processed: false, sawWork };
    }
  }
  
  const jobId = await dequeueJob(queueType);
  if (!jobId) {
    // No jobs in this queue, but there might be work in other queues
    return { processed: false, sawWork };
  }
  
  const job = await storage.getAiJob(jobId);
  if (!job || job.status !== "queued") {
    // Job not found or already processed, but we still saw work
    return { processed: false, sawWork: true };
  }
  
  // Process the job - uses job.type (could be essay or essay_revision)
  processJob(job).catch(err => {
    console.error(`Job ${jobId} failed:`, err);
  });
  
  return { processed: true, sawWork: true };
}

async function workerLoop(): Promise<{ didWork: boolean; hasActiveWork: boolean }> {
  // Note: essay_revision shares queue with essay, so only process unique queues
  // When we dequeue from essay queue, we check the actual job type for proper handling
  const types: AiJobType[] = ["goal", "essay", "analysis"];
  let didWork = false;
  let sawWork = false;
  
  for (const type of types) {
    const result = await processNextJob(type);
    if (result.processed) didWork = true;
    if (result.sawWork) sawWork = true;
  }
  
  // Use local knowledge from processNextJob calls to determine if there's active work
  // This avoids a second stats fetch that could race and give stale results
  // hasActiveWork = true if any processNextJob saw queued jobs or processing jobs
  const hasActiveWork = didWork || sawWork;
  
  return { didWork, hasActiveWork };
}

export function startWorker(): void {
  if (isWorkerRunning) {
    return;
  }
  
  isWorkerRunning = true;
  console.log("✓ AI job worker started");
  
  // Run initial stale cleanup on startup
  cleanupStaleProcessingJobs().then(cleared => {
    if (cleared > 0) {
      console.log(`✓ Startup cleanup: cleared ${cleared} stale processing entries`);
    }
  }).catch(err => {
    console.error("Startup stale cleanup failed:", err);
  });
  
  const poll = async () => {
    if (!isWorkerRunning) return;
    
    // Mark poll as in progress to prevent duplicate polls from wakeWorker
    pollInProgress = true;
    
    // Clear any pending timer reference
    currentTimer = null;
    
    // Periodically run stale cleanup (every 60 seconds)
    const now = Date.now();
    if (now - lastStaleCleanup > STALE_CLEANUP_INTERVAL) {
      lastStaleCleanup = now;
      cleanupStaleProcessingJobs().catch(err => {
        console.error("Periodic stale cleanup failed:", err);
      });
    }
    
    let shouldUseFastPoll = false;
    try {
      const result = await workerLoop();
      lastHadWork = result.didWork;
      // Use fast polling if there's any active work (queued, processing, or just completed)
      shouldUseFastPoll = result.hasActiveWork;
    } catch (error) {
      console.error("Worker loop error:", error);
    }
    
    // Mark poll as complete before scheduling next
    pollInProgress = false;
    
    // Use faster polling when there's active work, slower when truly idle
    const interval = shouldUseFastPoll ? FAST_POLL_INTERVAL : POLL_INTERVAL;
    currentTimer = setTimeout(poll, interval);
  };
  
  // Store reference to poll function for wakeWorker
  pollFn = poll;
  
  // Start polling immediately
  poll();
}

export function stopWorker(): void {
  isWorkerRunning = false;
  if (currentTimer) {
    clearTimeout(currentTimer);
    currentTimer = null;
  }
  console.log("AI job worker stopped");
}

// Track if a wake/poll is already scheduled or running to prevent duplicate polls
let pollInProgress = false;
let wakeScheduled = false;

/**
 * Signal the worker to wake up and process queued jobs immediately.
 * Cancels any pending sleep timer and runs the worker loop now.
 * Safe to call from any context - handles both active and idle worker states.
 */
export function wakeWorker(): void {
  if (!isWorkerRunning || !pollFn) return;
  
  // Don't schedule if a wake is already scheduled or poll is in progress
  if (wakeScheduled || pollInProgress) return;
  wakeScheduled = true;
  
  // Cancel the current sleep timer if it exists
  if (currentTimer) {
    clearTimeout(currentTimer);
    currentTimer = null;
  }
  
  // Run the poll immediately
  setImmediate(() => {
    wakeScheduled = false;
    if (pollFn && isWorkerRunning && !pollInProgress) {
      pollFn();
    }
  });
}

/**
 * Submit a job to the queue for background processing.
 * Uses a hybrid approach: processes immediately if capacity allows, otherwise queues.
 * Returns immediately with job ID - processing happens async.
 */
export async function submitQueuedJob(
  userId: string,
  profileId: string | null,
  type: AiJobType,
  payload: any
): Promise<{ jobId: string; status: "queued" | "processing" }> {
  // Create job record in database
  const job = await storage.createAiJob({
    userId,
    profileId,
    type,
    status: "queued",
    progress: 0,
    payload,
  });
  
  // Ensure worker is running (idempotent - won't restart if already running)
  startWorker();
  
  // Check if we can process immediately (fast path for good UX)
  const canProcessNow = await canProcessImmediately(type);
  
  if (canProcessNow) {
    // Process immediately in background - no queue delay
    console.log(`Job ${job.id} starting immediately (type: ${type})`);
    processJob(job).catch(err => {
      console.error(`Job ${job.id} failed:`, err);
    });
    return { jobId: job.id, status: "processing" };
  }
  
  // Queue for background processing
  await enqueueJob(job.id, type);
  console.log(`Job ${job.id} queued for background processing (type: ${type})`);
  
  // Wake the worker to process the job immediately (instead of waiting for 30s idle timer)
  wakeWorker();
  
  return { jobId: job.id, status: "queued" };
}

/**
 * @deprecated Use submitQueuedJob instead. Kept for backward compatibility.
 */
export async function submitJobWithFastPath(
  userId: string,
  profileId: string | null,
  type: AiJobType,
  payload: any
): Promise<{ jobId: string; immediate: boolean }> {
  const result = await submitQueuedJob(userId, profileId, type, payload);
  return { jobId: result.jobId, immediate: false };
}
