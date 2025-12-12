import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";

export interface PageVisibility {
  userRole: string;
  pages: Record<string, boolean>;
}

export function usePageAccess() {
  const { isAuthenticated, user } = useAuth();

  const { data: visibility, isLoading, isFetching } = useQuery<PageVisibility>({
    queryKey: ['page-visibility', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/page-visibility', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch page visibility');
      return res.json();
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Use user's role from auth context as fallback when visibility not loaded
  const userRole = visibility?.userRole ?? user?.role ?? 'user';
  const isStaffOrAdmin = userRole === 'staff' || userRole === 'admin';

  const canAccess = (slug: string): boolean => {
    // If visibility data not loaded yet, use role-based defaults
    if (!visibility) {
      // While loading, allow access based on user's actual role from auth
      // Admin page is always admin/staff only
      if (slug === '/admin') {
        return isStaffOrAdmin;
      }
      // For other pages, allow access while loading (route protection will handle it)
      return true;
    }
    
    if (slug in visibility.pages) {
      return visibility.pages[slug];
    }
    
    // Unknown pages default to staff/admin only
    return isStaffOrAdmin;
  };

  return {
    canAccess,
    userRole,
    isLoading: isLoading || isFetching,
    visibility,
  };
}
