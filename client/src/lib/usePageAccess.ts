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
    // Seed with localStorage so the sidebar renders correctly on the very first paint
    initialData: () => (user?.id ? readCache(user.id) : undefined),
    // Always treat initialData as stale so a background refetch happens immediately
    initialDataUpdatedAt: 0,
    enabled: isAuthenticated && !!user?.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 500,
  });

  const userRole = visibility?.userRole ?? user?.role ?? 'user';
  const isStaffOrAdmin = userRole === 'staff' || userRole === 'admin';

  const canAccess = (slug: string): boolean => {
    if (!visibility) {
      // No data yet (true first visit, no localStorage cache)
      // /admin is always staff/admin-only
      if (slug === '/admin') return isStaffOrAdmin;
      // Allow everything else while loading — localStorage cache will have
      // prevented this state on all subsequent loads (see initialData above)
      return true;
    }

    if (slug in visibility.pages) {
      return visibility.pages[slug];
    }

    // Pages not in config → staff/admin only
    return isStaffOrAdmin;
  };

  return {
    canAccess,
    userRole,
    isStaffOrAdmin,
    // isLoading is true only when we have NO data at all (no cache, no response yet)
    isLoading: isLoading && !visibility && !error,
    isRefetching: isFetching && !!visibility,
    visibility,
    error,
  };
}
