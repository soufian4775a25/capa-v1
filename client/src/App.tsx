import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Trainers from "@/pages/trainers";
import Modules from "@/pages/modules";
import Groups from "@/pages/groups";
import Rooms from "@/pages/rooms";
import Capacity from "@/pages/capacity";
import Reports from "@/pages/reports";
import CompetencyMatrix from "@/pages/competency-matrix";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/trainers" component={Trainers} />
      <Route path="/modules" component={Modules} />
      <Route path="/groups" component={Groups} />
      <Route path="/rooms" component={Rooms} />
      <Route path="/capacity" component={Capacity} />
      <Route path="/reports" component={Reports} />
      <Route path="/competency-matrix" component={CompetencyMatrix} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
