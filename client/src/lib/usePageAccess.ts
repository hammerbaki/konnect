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
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const canAccess = (slug: string): boolean => {
    if (!visibility) {
      return false;
    }
    if (slug in visibility.pages) {
      return visibility.pages[slug];
    }
    return visibility.userRole === 'staff' || visibility.userRole === 'admin';
  };

  const userRole = visibility?.userRole ?? 'user';

  return {
    canAccess,
    userRole,
    isLoading: isLoading || isFetching,
    visibility,
  };
}
