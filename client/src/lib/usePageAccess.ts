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
    return visibility.pages[slug] ?? true;
  };

  const userRole = visibility?.userRole ?? 'user';

  return {
    canAccess,
    userRole,
    isLoading,
    visibility,
  };
}
