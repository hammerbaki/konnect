import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";

export interface PageVisibility {
  userRole: string;
  pages: Record<string, boolean>;
}

export function usePageAccess() {
  const { isAuthenticated, user } = useAuth();

  const { data: visibility, isLoading } = useQuery<PageVisibility>({
    queryKey: ['page-visibility'],
    queryFn: async () => {
      const res = await fetch('/api/page-visibility', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch page visibility');
      return res.json();
    },
    enabled: isAuthenticated,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
  });

  const canAccess = (slug: string): boolean => {
    if (!visibility) {
      return true;
    }
    // For unknown pages, default to restricted (staff/admin only)
    // If page exists in visibility map, use its value
    // If not, assume it's a new page - deny access for regular users
    if (slug in visibility.pages) {
      return visibility.pages[slug];
    }
    // Unknown page - only staff/admin can access by default
    return visibility.userRole === 'staff' || visibility.userRole === 'admin';
  };

  const userRole = visibility?.userRole ?? 'user';

  return {
    canAccess,
    userRole,
    isLoading,
    visibility,
  };
}
