import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { usePageAccess } from "@/lib/usePageAccess";

interface RoleProtectedRouteProps {
  children: ReactNode;
  slug: string;
  fallback?: ReactNode;
}

function AccessDenied() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2F4F6] gap-4 p-4">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-gray-900">접근 권한이 없습니다</h1>
      <p className="text-gray-600 text-center">이 페이지에 접근할 권한이 없습니다.</p>
      <a 
        href="/dashboard" 
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        data-testid="link-back-dashboard"
      >
        대시보드로 돌아가기
      </a>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2F4F6] gap-4">
      <div className="w-14 h-14 rounded-[18px] bg-gray-200 animate-pulse"></div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse"></div>
        <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: "150ms" }}></div>
        <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: "300ms" }}></div>
      </div>
    </div>
  );
}

export function RoleProtectedRoute({ children, slug, fallback }: RoleProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { canAccess, isVisibilityPending, visibility } = usePageAccess();

  // Wait while auth is initializing
  if (authLoading && !user) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  // Wait if we have absolutely no visibility data (no cache + no API response yet).
  // This prevents the "접근 권한이 없습니다" flash on first login before the API responds.
  // Returning users skip this because localStorage cache seeds visibility immediately.
  if (isVisibilityPending && !visibility) {
    return <LoadingSpinner />;
  }

  if (!canAccess(slug)) {
    return fallback ?? <AccessDenied />;
  }

  return <>{children}</>;
}
