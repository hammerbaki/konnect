import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TokenProvider } from "@/lib/TokenContext";
import { MobileActionProvider } from "@/lib/MobileActionContext";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/not-found";
import Analysis from "./pages/Analysis";
import Goals from "./pages/Goals";
import KompassDetail from "./pages/KompassDetail";
import Profile from "./pages/Profile";
import PersonalStatement from "./pages/PersonalStatement";
import Report from "./pages/Report";
import Explorer from "./pages/Explorer";
import Settings from "./pages/Settings";
import TokenRecharge from "./pages/TokenRecharge";

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>; [key: string]: any }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F4F6]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3182F6]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
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
