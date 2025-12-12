import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TokenProvider } from "@/lib/TokenContext";
import { MobileActionProvider } from "@/lib/MobileActionContext";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Suspense, lazy, useEffect } from "react";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NotFound = lazy(() => import("./pages/not-found"));
const Analysis = lazy(() => import("./pages/Analysis"));
const Goals = lazy(() => import("./pages/Goals"));
const KompassDetail = lazy(() => import("./pages/KompassDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const PersonalStatement = lazy(() => import("./pages/PersonalStatement"));
const Report = lazy(() => import("./pages/Report"));
const Explorer = lazy(() => import("./pages/Explorer"));
const Settings = lazy(() => import("./pages/Settings"));
const TokenRecharge = lazy(() => import("./pages/TokenRecharge"));
const Admin = lazy(() => import("./pages/Admin"));

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

function PageLoader() {
  return null;
}

function usePageTracking() {
  const [location] = useLocation();
  
  useEffect(() => {
    fetch('/api/track/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    }).catch(() => {});
  }, [location]);
}

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>; [key: string]: any }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  return <Component {...rest} />;
}

function Router() {
  usePageTracking();
  
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/dashboard">
          {(params) => (
            <RoleProtectedRoute slug="/dashboard">
              <Dashboard {...params} />
            </RoleProtectedRoute>
          )}
        </Route>
        <Route path="/analysis">
          {(params) => (
            <RoleProtectedRoute slug="/analysis">
              <Analysis {...params} />
            </RoleProtectedRoute>
          )}
        </Route>
        <Route path="/goals">
          {(params) => (
            <RoleProtectedRoute slug="/goals">
              <Goals {...params} />
            </RoleProtectedRoute>
          )}
        </Route>
        <Route path="/goals/:id">
          {() => (
            <RoleProtectedRoute slug="/kompass">
              <KompassDetail />
            </RoleProtectedRoute>
          )}
        </Route>
        <Route path="/profile">
          {(params) => (
            <RoleProtectedRoute slug="/profile">
              <Profile {...params} />
            </RoleProtectedRoute>
          )}
        </Route>
        <Route path="/personal-statement">
          {(params) => (
            <RoleProtectedRoute slug="/essays">
              <PersonalStatement {...params} />
            </RoleProtectedRoute>
          )}
        </Route>
        <Route path="/report">
          {(params) => <ProtectedRoute component={Report} params={params} />}
        </Route>
        <Route path="/explorer">
          {(params) => (
            <RoleProtectedRoute slug="/explorer">
              <Explorer {...params} />
            </RoleProtectedRoute>
          )}
        </Route>
        <Route path="/settings">
          {(params) => (
            <RoleProtectedRoute slug="/settings">
              <Settings {...params} />
            </RoleProtectedRoute>
          )}
        </Route>
        <Route path="/recharge">
          {(params) => (
            <RoleProtectedRoute slug="/recharge">
              <TokenRecharge {...params} />
            </RoleProtectedRoute>
          )}
        </Route>
        <Route path="/admin">
          {(params) => (
            <RoleProtectedRoute slug="/admin">
              <Admin {...params} />
            </RoleProtectedRoute>
          )}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TokenProvider>
          <MobileActionProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </MobileActionProvider>
        </TokenProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
