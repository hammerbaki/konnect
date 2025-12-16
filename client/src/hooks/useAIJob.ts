import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/queryClient";
import { useActiveJobs } from "@/lib/ActiveJobsContext";

export type AIJobType = "analysis" | "essay" | "essay_revision" | "goal";
export type AIJobStatus = "queued" | "processing" | "completed" | "failed";

interface AIJobResponse {
  id: string;
  type: string;
  status: AIJobStatus;
  progress: number;
  result: any;
  error: string | null;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

interface SubmitJobResponse {
  jobId: string;
  immediate: boolean;
  status: string;
}

interface UseAIJobOptions {
  onSuccess?: (result: any, jobId: string) => void;
  onError?: (error: string) => void;
  pollInterval?: number;
  jobType?: AIJobType;
  profileId?: string | null;
}

export function useAIJob(options: UseAIJobOptions = {}) {
  const { onSuccess, onError, pollInterval = 500, jobType, profileId } = options;
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<AIJobStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const completedJobsRef = useRef<Set<string>>(new Set());
  const { addJob, removeJob, getActiveJob, hasActiveJob } = useActiveJobs();
  const queryClient = useQueryClient();

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const pollJobStatus = useCallback(async (id: string) => {
    // Prevent processing if job was already completed
    if (completedJobsRef.current.has(id)) {
      clearPolling();
      return null;
    }
    
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`/api/ai/jobs/${id}`, {
        credentials: "include",
        headers: authHeaders,
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch job status");
      }
      
      const job: AIJobResponse = await response.json();
      setProgress(job.progress);
      setStatus(job.status);
      
      if (job.status === "completed") {
        if (completedJobsRef.current.has(id)) {
          return job.result;
        }
        completedJobsRef.current.add(id);
        clearPolling();
        setIsLoading(false);
        removeJob(id);
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
        onSuccess?.(job.result, id);
        return job.result;
      }
      
      if (job.status === "failed") {
        completedJobsRef.current.add(id);
        clearPolling();
        setIsLoading(false);
        removeJob(id);
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
        onError?.(job.error || "작업이 실패했습니다.");
        return null;
      }
      
      return null;
    } catch (error) {
      console.error("Error polling job status:", error);
      return null;
    }
  }, [clearPolling, onSuccess, onError, removeJob, queryClient]);

  const startPolling = useCallback((id: string) => {
    clearPolling();
    pollIntervalRef.current = setInterval(() => {
      pollJobStatus(id);
    }, pollInterval);
  }, [clearPolling, pollJobStatus, pollInterval]);

  const submitJob = useCallback(async (
    type: AIJobType,
    profileId: string | null,
    payload: any
  ): Promise<string | null> => {
    setIsLoading(true);
    setProgress(0);
    setStatus("queued");
    
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/ai/jobs", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, profileId, payload }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "작업 제출 실패");
      }
      
      const response: SubmitJobResponse = await res.json();
      
      setJobId(response.jobId);
      addJob(response.jobId, type, profileId || undefined);
      
      if (response.immediate) {
        setStatus("processing");
        setProgress(10);
      }
      
      startPolling(response.jobId);
      
      return response.jobId;
    } catch (error: any) {
      setIsLoading(false);
      setStatus("failed");
      onError?.(error.message || "작업 제출 중 오류가 발생했습니다.");
      return null;
    }
  }, [startPolling, onError, addJob]);

  const reset = useCallback(() => {
    clearPolling();
    setJobId(null);
    setProgress(0);
    setStatus(null);
    setIsLoading(false);
  }, [clearPolling]);

  useEffect(() => {
    if (jobType && profileId) {
      const activeJob = getActiveJob(jobType, profileId);
      if (activeJob && !completedJobsRef.current.has(activeJob.id)) {
        setJobId(activeJob.id);
        setIsLoading(true);
        setStatus("processing");
        setProgress(10);
        startPolling(activeJob.id);
      } else {
        clearPolling();
        setJobId(null);
        setIsLoading(false);
        setStatus(null);
        setProgress(0);
      }
    }
  }, [jobType, profileId, getActiveJob, startPolling, clearPolling]);

  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  const isActiveForProfile = useCallback((type: AIJobType, pId: string) => {
    return hasActiveJob(type, pId);
  }, [hasActiveJob]);

  return {
    submitJob,
    reset,
    jobId,
    progress,
    status,
    isLoading,
    isActiveForProfile,
  };
}

export function useQueueStats() {
  return useQuery({
    queryKey: ["queue-stats"],
    queryFn: async () => {
      const response = await fetch("/api/ai/queue/stats", {
        credentials: "include",
      });
      return response.json();
    },
    refetchInterval: 5000,
  });
}
