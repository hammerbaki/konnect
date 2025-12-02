import { Switch, Route } from "wouter";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/not-found";
import Analysis from "./pages/Analysis"; // We will create this next
import Goals from "./pages/Goals"; // We will create this next

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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <Router />
  );
}

export default App;
