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
import { db } from "./db";
import { cachedJobs, cachedMajors, aptitudeAnalyses } from "@shared/schema";
import { inArray, ilike, or } from "drizzle-orm";
import {
  JOB_FIELD_MAPPING, INTEREST_LABELS_KR, APTITUDE_LABELS_KR,
  prioritizeByKeywords,
} from "./aptitudeConstants";

// Local helper: normalizeMajorName (re-export from dataSync not available here)
function normalizeMajorName(name: string): string {
  return name.replace(/[^가-힣a-zA-Z0-9]/g, '').toLowerCase();
}

async function processAptitudeAnalysis(payload: any): Promise<any> {
  const { interestScores, aptitudeScores, top3 } = payload as {
    interestScores: Record<string, number>;
    aptitudeScores: Record<string, number>;
    top3: string[];
    userId: string;
  };

  // ── 1. 타겟 field 목록 ─────────────────────────────────────────────
  const targetFields = [...new Set(top3.flatMap(cat => JOB_FIELD_MAPPING[cat] || []))];

  // ── 2. DB에서 해당 field 직업 전체 조회 ─────────────────────────
  let jobCandidates = await db.select({
    jobName: cachedJobs.jobName,
    field: cachedJobs.field,
    salary: cachedJobs.salary,
    growth: cachedJobs.growth,
    relatedMajors: cachedJobs.relatedMajors,
    description: cachedJobs.description,
  }).from(cachedJobs).where(inArray(cachedJobs.field, targetFields));

  // ── 3. 키워드 우선순위 정렬 ───────────────────────────────────────
  const TECH_FIELD = '연구직 및 공학 기술직';
  const EDU_FIELD  = '교육·법률·사회복지·경찰·소방직 및 군인';
  const techGroupCatsInTop3 = top3.filter(c => ['SCI', 'IT', 'ENG'].includes(c));
  if (techGroupCatsInTop3.length > 0) {
    jobCandidates = prioritizeByKeywords(jobCandidates, techGroupCatsInTop3, TECH_FIELD);
  }
  const eduGroupCatsInTop3 = top3.filter(c => ['LAW', 'EDU', 'SOC'].includes(c));
  if (eduGroupCatsInTop3.length > 0) {
    jobCandidates = prioritizeByKeywords(jobCandidates, eduGroupCatsInTop3, EDU_FIELD);
  }

  // ── 4. 관련 학과 목록 수집 ────────────────────────────────────────
  const allMajorNames = [...new Set(
    jobCandidates.flatMap(j => Array.isArray(j.relatedMajors) ? (j.relatedMajors as string[]) : [])
  )];

  let majorCandidates: Array<{
    majorName: string | null; category: string | null;
    description: string | null; relatedJobs: unknown;
  }> = [];

  if (allMajorNames.length > 0) {
    majorCandidates = await db.select({
      majorName: cachedMajors.majorName, category: cachedMajors.category,
      description: cachedMajors.description, relatedJobs: cachedMajors.relatedJobs,
    }).from(cachedMajors).where(inArray(cachedMajors.majorName, allMajorNames.slice(0, 80)));

    const foundNames = new Set(majorCandidates.map(m => m.majorName));
    const notFound   = allMajorNames.filter(n => !foundNames.has(n)).slice(0, 40);
    if (notFound.length > 0) {
      const fuzzyResults = await db.select({
        majorName: cachedMajors.majorName, category: cachedMajors.category,
        description: cachedMajors.description, relatedJobs: cachedMajors.relatedJobs,
      }).from(cachedMajors)
        .where(or(...notFound.map(n => ilike(cachedMajors.majorName, `%${normalizeMajorName(n)}%`))));
      const existingNames = new Set(majorCandidates.map(m => m.majorName));
      for (const r of fuzzyResults) {
        if (!existingNames.has(r.majorName)) { majorCandidates.push(r); existingNames.add(r.majorName ?? ''); }
      }
    }
  }
  if (majorCandidates.length < 10) {
    const extra = await db.select({
      majorName: cachedMajors.majorName, category: cachedMajors.category,
      description: cachedMajors.description, relatedJobs: cachedMajors.relatedJobs,
    }).from(cachedMajors).limit(40);
    const existingNames = new Set(majorCandidates.map(m => m.majorName));
    majorCandidates = [...majorCandidates, ...extra.filter(m => !existingNames.has(m.majorName))];
  }

  // ── 5. LLM 프롬프트 구성 ──────────────────────────────────────────
  const top3Desc   = top3.map(k => `${INTEREST_LABELS_KR[k]}(${interestScores[k]}점)`).join(', ');
  const topAptDesc = Object.entries(aptitudeScores).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([k, v]) => `${APTITUDE_LABELS_KR[k]}(${v}점)`).join(', ');
  const jobListStr   = jobCandidates.slice(0, 60).map(j =>
    `- ${j.jobName}(분류:${j.field}${j.salary ? ',연봉:' + Math.round(j.salary / 10000) + '만원' : ''})`).join('\n');
  const majorListStr = majorCandidates.slice(0, 40).map(m => `- ${m.majorName}(${m.category || ''})`).join('\n');

  const prompt = `당신은 진로 상담 전문가입니다. 아래 학생의 적성검사 결과와 실제 데이터를 기반으로 추천 사유를 작성해주세요.

[학생 검사 결과]
흥미 상위 3개: ${top3Desc}
적성 강점: ${topAptDesc}

[추천 후보 직업 목록 - 실제 DB 데이터]
${jobListStr}

[추천 후보 학과 목록 - 실제 DB 데이터]
${majorListStr}

위 목록에서 학생의 흥미와 적성에 가장 적합한 직업 5개, 학과 5개를 선택하고,
각각에 대해 50자 이내의 추천 사유를 작성해주세요.

⚠️ 규칙:
- 위 목록에 없는 직업이나 학과를 추천하지 마세요
- 급여, 취업률, 전망 등 수치를 생성하지 마세요
- 추천 사유만 작성하세요

JSON 형식으로만 응답하세요:
{
  "recommendedJobs": [{"name": "직업명", "reason": "추천 사유"}],
  "recommendedMajors": [{"name": "학과명", "reason": "추천 사유"}],
  "summary": "전체 분석 요약 (200자 이내)"
}`;

  // ── 6. GPT-4o-mini 호출 ───────────────────────────────────────────
  const { default: OpenAI } = await import('openai');
  const openaiClient = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
  const completion = await openaiClient.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  });
  const aiResult = JSON.parse(completion.choices[0].message.content || '{}');
  const llmJobs:   Array<{ name: string; reason: string }> = aiResult.recommendedJobs   || [];
  const llmMajors: Array<{ name: string; reason: string }> = aiResult.recommendedMajors || [];

  // ── 7. LLM 추천명 → DB 실제 데이터 매핑 ──────────────────────────
  const jobMap  = new Map(jobCandidates.map(j => [j.jobName, j]));
  const finalJobs = llmJobs.map(({ name, reason }) => {
    const dbJob = jobMap.get(name);
    return { name, reason, salary: dbJob?.salary ?? null, field: dbJob?.field ?? null, growth: dbJob?.growth ?? null };
  }).filter(j => j.name);

  const majorMap = new Map(majorCandidates.map(m => [m.majorName, m]));
  const recMajorRelatedJobNames = llmMajors.flatMap(({ name }) => {
    const dbMajor = majorMap.get(name);
    return Array.isArray(dbMajor?.relatedJobs) ? (dbMajor.relatedJobs as string[]) : [];
  });
  let majorJobSalaryMap: Map<string, { min: number; max: number }> = new Map();
  if (recMajorRelatedJobNames.length > 0) {
    const uniqueJobNames = [...new Set(recMajorRelatedJobNames)];
    const jobSalaryRows = await db.select({ jobName: cachedJobs.jobName, salary: cachedJobs.salary })
      .from(cachedJobs).where(inArray(cachedJobs.jobName, uniqueJobNames.slice(0, 60)));
    const jobSalaryLookup = new Map(jobSalaryRows.map(j => [j.jobName, j.salary]));
    for (const { name } of llmMajors) {
      const dbMajor = majorMap.get(name);
      const relJobs  = Array.isArray(dbMajor?.relatedJobs) ? (dbMajor.relatedJobs as string[]) : [];
      const salaries = relJobs.map(jn => jobSalaryLookup.get(jn)).filter((s): s is number => s != null && s > 0);
      if (salaries.length > 0) {
        majorJobSalaryMap.set(name, { min: Math.min(...salaries), max: Math.max(...salaries) });
      }
    }
  }
  const finalMajors = llmMajors.map(({ name, reason }) => {
    const dbMajor    = majorMap.get(name);
    const salaryRange = majorJobSalaryMap.get(name);
    return {
      name, reason,
      category: dbMajor?.category ?? null,
      description: dbMajor?.description ?? null,
      salaryMin: salaryRange ? salaryRange.min : null,
      salaryMax: salaryRange ? salaryRange.max : null,
    };
  }).filter(m => m.name);

  // ── 8. DB 저장 ────────────────────────────────────────────────────
  const inserted = await db.insert(aptitudeAnalyses).values({
    userId: payload.userId,
    interestScores,
    aptitudeScores,
    recommendedJobs:    finalJobs,
    recommendedMajors:  finalMajors,
    summary: aiResult.summary || '',
  }).returning();

  return inserted[0];
}

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
            await storage.updateAiJobError(jobId, "작업 시간이 초과되었습니다. 학습권이 환불되었습니다.");
            
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
        if (payload.profileType === 'international_university' || payload.profileType === 'international') {
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
                profileType: 'international_university',
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
      case "aptitude_analysis": {
        console.log(`[AI Worker] Processing aptitude_analysis for job ${job.id}...`);
        await storage.updateAiJobStatus(job.id, "processing", 20);
        result = await withProcessingTimeout(
          processAptitudeAnalysis(payload),
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
  const hasQueuedJobs = stats.goal.queued > 0 || stats.essay.queued > 0 || stats.analysis.queued > 0 || stats.aptitude_analysis.queued > 0;
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
  const types: AiJobType[] = ["goal", "essay", "analysis", "aptitude_analysis"];
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
