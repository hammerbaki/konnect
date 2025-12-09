import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TokenProvider } from "@/lib/TokenContext";
import { MobileActionProvider } from "@/lib/MobileActionContext";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { Suspense, lazy } from "react";

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

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2F4F6] gap-4">
      <div className="w-14 h-14 rounded-[18px] bg-[#3182F6] flex items-center justify-center shadow-lg shadow-blue-500/20">
        <span className="text-white text-2xl font-bold">K</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#3182F6] animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-2 h-2 rounded-full bg-[#3182F6] animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="w-2 h-2 rounded-full bg-[#3182F6] animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
    </div>
  );
}

function PageLoader() {
  return null;
}

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>; [key: string]: any }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/dashboard">
          {(params) => <ProtectedRoute component={Dashboard} params={params} />}
        </Route>
        <Route path="/analysis">
          {(params) => <ProtectedRoute component={Analysis} params={params} />}
        </Route>
        <Route path="/goals">
          {(params) => <ProtectedRoute component={Goals} params={params} />}
        </Route>
        <Route path="/goals/:id">
          {(params) => <ProtectedRoute component={KompassDetail} params={params} />}
        </Route>
        <Route path="/profile">
          {(params) => <ProtectedRoute component={Profile} params={params} />}
        </Route>
        <Route path="/personal-statement">
          {(params) => <ProtectedRoute component={PersonalStatement} params={params} />}
        </Route>
        <Route path="/report">
          {(params) => <ProtectedRoute component={Report} params={params} />}
        </Route>
        <Route path="/explorer">
          {(params) => <ProtectedRoute component={Explorer} params={params} />}
        </Route>
        <Route path="/settings">
          {(params) => <ProtectedRoute component={Settings} params={params} />}
        </Route>
        <Route path="/recharge">
          {(params) => <ProtectedRoute component={TokenRecharge} params={params} />}
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
