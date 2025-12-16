import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from "react";
import { getAuthHeaders } from "@/lib/queryClient";

const ACTIVE_JOBS_KEY = "konnect_active_jobs";

interface ActiveJob {
  id: string;
  type: string;
  profileId?: string;
  startedAt: number;
}

interface ActiveJobsContextType {
  activeJobs: ActiveJob[];
  addJob: (jobId: string, type: string, profileId?: string) => void;
  removeJob: (jobId: string) => void;
  hasActiveJob: (type: string, profileId?: string) => boolean;
  getActiveJob: (type: string, profileId?: string) => ActiveJob | undefined;
  addOptimisticJob: (type: string, profileId?: string) => string;
  replaceOptimisticJob: (optimisticId: string, realJobId: string) => void;
}

const ActiveJobsContext = createContext<ActiveJobsContextType | undefined>(undefined);

function loadActiveJobs(): ActiveJob[] {
  try {
    const stored = localStorage.getItem(ACTIVE_JOBS_KEY);
    if (!stored) return [];
    const jobs = JSON.parse(stored);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return jobs.filter((job: ActiveJob) => job.startedAt > oneHourAgo);
  } catch {
    return [];
  }
}

function saveActiveJobs(jobs: ActiveJob[]) {
  try {
    localStorage.setItem(ACTIVE_JOBS_KEY, JSON.stringify(jobs));
  } catch {
  }
}

export function ActiveJobsProvider({ children }: { children: ReactNode }) {
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>(loadActiveJobs);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addJob = useCallback((jobId: string, type: string, profileId?: string) => {
    setActiveJobs(prev => {
      const existing = prev.find(j => j.id === jobId);
      if (existing) return prev;
      const newJobs = [...prev, { id: jobId, type, profileId, startedAt: Date.now() }];
      saveActiveJobs(newJobs);
      return newJobs;
    });
  }, []);

  const removeJob = useCallback((jobId: string) => {
    setActiveJobs(prev => {
      const newJobs = prev.filter(j => j.id !== jobId);
      saveActiveJobs(newJobs);
      return newJobs;
    });
  }, []);

  const hasActiveJob = useCallback((type: string, profileId?: string) => {
    return activeJobs.some(j => 
      j.type === type && 
      (profileId === undefined || j.profileId === profileId)
    );
  }, [activeJobs]);

  const getActiveJob = useCallback((type: string, profileId?: string) => {
    return activeJobs.find(j => 
      j.type === type && 
      (profileId === undefined || j.profileId === profileId)
    );
  }, [activeJobs]);

  const addOptimisticJob = useCallback((type: string, profileId?: string): string => {
    const optimisticId = `optimistic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setActiveJobs(prev => {
      const newJobs = [...prev, { id: optimisticId, type, profileId, startedAt: Date.now() }];
      saveActiveJobs(newJobs);
      return newJobs;
    });
    return optimisticId;
  }, []);

  const replaceOptimisticJob = useCallback((optimisticId: string, realJobId: string) => {
    setActiveJobs(prev => {
      const newJobs = prev.map(j => j.id === optimisticId ? { ...j, id: realJobId } : j);
      saveActiveJobs(newJobs);
      return newJobs;
    });
  }, []);

  useEffect(() => {
    const checkJobStatuses = async () => {
      if (activeJobs.length === 0) return;
      
      try {
        const authHeaders = await getAuthHeaders();
        const completedOrFailed: string[] = [];
        
        for (const job of activeJobs) {
          try {
            const res = await fetch(`/api/ai/jobs/${job.id}`, {
              credentials: "include",
              headers: authHeaders,
            });
            
            if (!res.ok) {
              if (res.status === 404) {
                completedOrFailed.push(job.id);
              }
              continue;
            }
            
            const jobData = await res.json();
            if (jobData.status === "completed" || jobData.status === "failed") {
              completedOrFailed.push(job.id);
            }
          } catch (error) {
          }
        }
        
        if (completedOrFailed.length > 0) {
          setActiveJobs(prev => {
            const newJobs = prev.filter(j => !completedOrFailed.includes(j.id));
            saveActiveJobs(newJobs);
            return newJobs;
          });
        }
      } catch (error) {
      }
    };

    checkJobStatuses();

    pollIntervalRef.current = setInterval(checkJobStatuses, 10000);
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [activeJobs.length]);

  return (
    <ActiveJobsContext.Provider value={{ activeJobs, addJob, removeJob, hasActiveJob, getActiveJob, addOptimisticJob, replaceOptimisticJob }}>
      {children}
    </ActiveJobsContext.Provider>
  );
}

export function useActiveJobs() {
  const context = useContext(ActiveJobsContext);
  if (context === undefined) {
    throw new Error("useActiveJobs must be used within an ActiveJobsProvider");
  }
  return context;
}
