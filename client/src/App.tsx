import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import DashboardLayout from "./components/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AIAssistant from "./pages/AIAssistant";
import Budget from "./pages/Budget";
import Documents from "./pages/Documents";
import Home from "./pages/Home";
import Notifications from "./pages/Notifications";
import ProjectDetail from "./pages/ProjectDetail";
import Projects from "./pages/Projects";
import Settings from "./pages/Settings";
import Tasks from "./pages/Tasks";
import Team from "./pages/Team";
import Timeline from "./pages/Timeline";
import Procurement from "./pages/Procurement";
import Baseline from "./pages/Baseline";
import Materials from "./pages/Materials";
import FFE from "./pages/FFE";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/projects" component={Projects} />
        <Route path="/projects/:id" component={ProjectDetail} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/timeline" component={Timeline} />
        <Route path="/procurement" component={Procurement} />
        <Route path="/baseline" component={Baseline} />
        <Route path="/materials" component={Materials} />
        <Route path="/ffe" component={FFE} />
        <Route path="/budget" component={Budget} />
        <Route path="/documents" component={Documents} />
        <Route path="/team" component={Team} />
        <Route path="/ai-assistant" component={AIAssistant} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/settings" component={Settings} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
