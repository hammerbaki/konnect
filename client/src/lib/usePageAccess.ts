import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { getAuthHeaders } from "./queryClient";

export interface PageVisibility {
  userRole: string;
  pages: Record<string, boolean>;
}

const getCacheKey = (userId: string) => `konnect-pv-${userId}`;

const readCache = (userId: string): PageVisibility | undefined => {
  try {
    const raw = localStorage.getItem(getCacheKey(userId));
    return raw ? (JSON.parse(raw) as PageVisibility) : undefined;
  } catch {
    return undefined;
  }
};

const writeCache = (userId: string, data: PageVisibility) => {
  try {
    localStorage.setItem(getCacheKey(userId), JSON.stringify(data));
  } catch {}
};

export function usePageAccess() {
  const { isAuthenticated, user } = useAuth();

  const { data: visibility, isLoading, isFetching, error } = useQuery<PageVisibility>({
    queryKey: ['page-visibility', user?.id],
    queryFn: async () => {
      const authHeaders = await getAuthHeaders();
      if (!authHeaders.Authorization) {
        throw new Error('No auth token available');
      }
      const res = await fetch('/api/page-visibility', {
        headers: authHeaders,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch page visibility');
      const data = await res.json() as PageVisibility;
      if (user?.id) writeCache(user.id, data);
      return data;
    },
    // Immediately seed from localStorage so the sidebar is correct on first render
    // after auth resolves — eliminates the flash for all returning users
    initialData: () => (user?.id ? readCache(user.id) : undefined),
    // Treat initialData as immediately stale so a background refetch always fires
    initialDataUpdatedAt: 0,
    enabled: isAuthenticated && !!user?.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 500,
  });

  // userRole is derived from visibility (most up-to-date) or user.role from auth
  const userRole = visibility?.userRole ?? user?.role ?? 'user';
  const isStaffOrAdmin = userRole === 'staff' || userRole === 'admin';

  // True only when we have NO data at all (no localStorage cache + no API response yet)
  // This is the state where we must not show restricted pages
  const visibilityPending = !visibility && !error;

  const canAccess = (slug: string): boolean => {
    // Admin page: role-based only, never needs visibility API (same as 관리자 behaviour)
    if (slug === '/admin') return isStaffOrAdmin;

    if (!visibility) {
      // No visibility data yet.
      // Deny access to prevent restricted items from flashing into view.
      // - Returning users: this state is skipped because localStorage initialData is used.
      // - First-time users: items stay hidden until the API responds (~200 ms after auth).
      return false;
    }

    if (slug in visibility.pages) {
      return visibility.pages[slug];
    }

    // Pages not listed in config → staff/admin only (safe default)
    return isStaffOrAdmin;
  };

  return {
    canAccess,
    userRole,
    isStaffOrAdmin,
    // True only on a genuine "no data" state (first-ever load, no cache)
    isVisibilityPending: visibilityPending,
    isLoading: isLoading && !visibility && !error,
    visibility,
    error,
  };
}
