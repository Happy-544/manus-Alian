import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import DashboardLayout from "./components/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProductTour } from "./components/ProductTour";
import { useProductTour } from "./hooks/useProductTour";
import { PRODUCT_TOUR_STEPS } from "./lib/tourSteps";
import AIAssistant from "./pages/AIAssistant";
import Budget from "./pages/Budget";
import Documents from "./pages/Documents";
import { Home } from "./pages/Home";
import DocumentWorkflow from "./pages/DocumentWorkflow";
import DocumentLibrary from "./pages/DocumentLibrary";
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
import { Analytics } from "./pages/Analytics";
import { Sprints } from "./pages/Sprints";
import { SupplierManagement } from "./pages/SupplierManagement";
import { DocumentDetailPage } from "./pages/DocumentDetailPage";
import { ProjectDashboard } from "./pages/ProjectDashboard";

function Router() {
  const { showTour, handleTourComplete, handleTourSkip } = useProductTour();

  return (
    <>
      {showTour && (
        <ProductTour
          steps={PRODUCT_TOUR_STEPS}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
          autoStart={true}
        />
      )}
      <DashboardLayout>
        <Switch>
        <Route path="/" component={Home} />
        <Route path="/documents/new" component={DocumentWorkflow} />
        <Route path="/documents/library" component={DocumentLibrary} />
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
        <Route path="/sprints/:projectId" component={Sprints} />
        <Route path="/analytics/:projectId" component={Analytics} />
        <Route path="/suppliers" component={SupplierManagement} />
        <Route path="/documents/:id" component={DocumentDetailPage} />
        <Route path="/dashboard" component={ProjectDashboard} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
        </Switch>
      </DashboardLayout>
    </>
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
