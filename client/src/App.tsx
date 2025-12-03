import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TokenProvider } from "@/lib/TokenContext";
import { MobileActionProvider } from "@/lib/MobileActionContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/not-found";
import Analysis from "./pages/Analysis";
import Goals from "./pages/Goals";
import KompassDetail from "./pages/KompassDetail";
import Profile from "./pages/Profile";
import PersonalStatement from "./pages/PersonalStatement";
import Report from "./pages/Report";

// Temporary placeholders until we create the files
const PlaceholderAnalysis = () => <div>Analysis Page Placeholder</div>;
const PlaceholderGoals = () => <div>Goals Page Placeholder</div>;

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/analysis" component={Analysis} />
      <Route path="/goals" component={Goals} />
      <Route path="/goals/:id" component={KompassDetail} />
      <Route path="/profile" component={Profile} />
      <Route path="/personal-statement" component={PersonalStatement} />
      <Route path="/report" component={Report} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TokenProvider>
        <MobileActionProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </MobileActionProvider>
      </TokenProvider>
    </QueryClientProvider>
  );
}

export default App;
