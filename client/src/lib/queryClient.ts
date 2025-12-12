import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getSupabase } from "./supabase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Try to parse as JSON and extract user-friendly message
    let message: string;
    let details: any = null;
    
    try {
      const json = JSON.parse(text);
      message = json.message || json.error || text;
      details = json;
    } catch {
      // JSON parsing failed, create friendly message based on status code
      if (res.status === 401) {
        message = "로그인이 필요합니다.";
      } else if (res.status === 402) {
        message = "포인트가 부족합니다.";
      } else if (res.status === 403) {
        message = "접근 권한이 없습니다.";
      } else if (res.status === 404) {
        message = "요청한 리소스를 찾을 수 없습니다.";
      } else if (res.status >= 500) {
        message = "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
      } else {
        message = text || "알 수 없는 오류가 발생했습니다.";
      }
    }
    
    // Create error with additional context
    const error = new Error(message) as Error & { status?: number; details?: any };
    error.status = res.status;
    error.details = details;
    throw error;
  }
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = await getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return {
        Authorization: `Bearer ${session.access_token}`,
      };
    }
  } catch (error) {
    console.error("Error getting auth headers:", error);
  }
  return {};
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  
  const res = await fetch(url, {
    method,
    headers: {
      ...authHeaders,
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const authHeaders = await getAuthHeaders();
    
    const res = await fetch(queryKey.join("/") as string, {
      headers: authHeaders,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Cache time constants (in milliseconds)
const TEN_MINUTES = 1000 * 60 * 10;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      // Data never goes stale automatically - prevents skeleton loaders on navigation
      // Manual invalidation is used after mutations (create/update/delete)
      staleTime: Infinity,
      // Keep data in cache for 10 minutes after component unmounts
      gcTime: TEN_MINUTES,
      // Don't refetch on window focus - reduces unnecessary requests
      refetchOnWindowFocus: false,
      // Don't refetch on mount - data will be served from cache
      refetchOnMount: false,
      // Don't refetch when reconnecting
      refetchOnReconnect: false,
      // No automatic polling
      refetchInterval: false,
      // Don't retry failed requests
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
