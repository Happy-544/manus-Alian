/**
 * User Onboarding Flow Component
 * Guided tour for new users explaining AliPM features and document creation workflow
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText,
  Upload,
  BarChart3,
  CheckCircle,
  ArrowRight,
  X,
  Lightbulb,
  Zap,
  BookOpen,
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string;
  action?: string;
  actionLink?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to AliPM",
    description: "Fit-Out Project Management Excellence",
    icon: <FileText className="w-12 h-12 text-gold" />,
    details:
      "AliPM is your comprehensive platform for managing fit-out and interior design projects. Create professional documents, manage budgets, track procurement, and collaborate with your team—all in one place.",
  },
  {
    id: "document-creation",
    title: "Document Creation Workflow",
    description: "The Heart of AliPM",
    icon: <Upload className="w-12 h-12 text-gold" />,
    details:
      "Start by uploading your BOQ (Bill of Quantities) and project drawings. AliPM automatically analyzes these files, detects any discrepancies, and helps you complete missing information before generating professional documents.",
    action: "Start Creating Document",
    actionLink: "/documents/new",
  },
  {
    id: "analysis",
    title: "Smart File Analysis",
    description: "AI-Powered Intelligence",
    icon: <BarChart3 className="w-12 h-12 text-gold" />,
    details:
      "Our AI analyzes your BOQ and drawings to extract measurements, validate quantities, and identify conflicts. With a 2% tolerance threshold, we ensure accuracy and flag items needing revision for your review.",
  },
  {
    id: "deliverables",
    title: "Professional Deliverables",
    description: "Six Document Types",
    icon: <CheckCircle className="w-12 h-12 text-gold" />,
    details:
      "Generate six professional documents automatically: Baseline Program, Procurement Log, Engineering Log, Budget Estimation, Value Engineering, and Risk Assessment—all with AliPM branding and professional formatting.",
  },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard Shortcuts",
    description: "Work Faster",
    icon: <Zap className="w-12 h-12 text-gold" />,
    details:
      "Use keyboard shortcuts for rapid navigation: Ctrl+N (New Document), Ctrl+K (Search), Ctrl+S (Sprints), Ctrl+I (Invite), Ctrl+A (Analytics), Ctrl+? (Help)",
  },
  {
    id: "collaboration",
    title: "Team Collaboration",
    description: "Work Together",
    icon: <Lightbulb className="w-12 h-12 text-gold" />,
    details:
      "Invite team members, assign tasks, track progress, and communicate within AliPM. Share documents, add comments, and maintain version history for complete project transparency.",
  },
];

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem("alipm-onboarding-completed");
    if (!completed) {
      setIsOpen(true);
    } else {
      setHasCompletedOnboarding(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("alipm-onboarding-completed", "true");
    setIsOpen(false);
    setHasCompletedOnboarding(true);
  };

  const handleSkip = () => {
    localStorage.setItem("alipm-onboarding-completed", "true");
    setIsOpen(false);
    setHasCompletedOnboarding(true);
  };

  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <>
      {/* Onboarding Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl bg-background border-gold/20">
          <DialogHeader className="border-b border-gold/20 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                  {step.icon}
                </div>
                <div>
                  <DialogTitle className="text-xl text-primary">{step.title}</DialogTitle>
                  <DialogDescription className="text-gold">{step.description}</DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="h-8 w-8 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="py-6">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Step {currentStep + 1} of {ONBOARDING_STEPS.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <p className="text-foreground leading-relaxed">{step.details}</p>

              {/* Tips Box */}
              <div className="bg-primary/5 border border-gold/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <BookOpen className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-primary mb-1">Pro Tip</p>
                    <p className="text-sm text-muted-foreground">
                      {step.id === "welcome" &&
                        "You can access this onboarding guide anytime from the Help menu."}
                      {step.id === "document-creation" &&
                        "Start with a sample BOQ file to understand the format and workflow."}
                      {step.id === "analysis" &&
                        "The AI analysis is automatic—just upload your files and let AliPM do the work."}
                      {step.id === "deliverables" &&
                        "All documents are generated with professional formatting and can be exported as PDF or DOCX."}
                      {step.id === "keyboard-shortcuts" &&
                        "Memorize the shortcuts you use most to significantly speed up your workflow."}
                      {step.id === "collaboration" &&
                        "Invite team members early to get feedback on documents before final approval."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-gold/20 pt-4 flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="border-gold/20"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={handleSkip}
                className="border-gold/20 text-muted-foreground"
              >
                Skip Tour
              </Button>
            </div>

            <div className="flex gap-2">
              {step.action && step.actionLink && (
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.href = step.actionLink!;
                    handleComplete();
                  }}
                  className="border-gold/20"
                >
                  {step.action}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="bg-gold text-primary hover:bg-gold/90"
              >
                {currentStep === ONBOARDING_STEPS.length - 1 ? "Complete" : "Next"}
                {currentStep < ONBOARDING_STEPS.length - 1 && (
                  <ArrowRight className="w-4 h-4 ml-2" />
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help Button to Restart Onboarding */}
      {hasCompletedOnboarding && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setCurrentStep(0);
            setIsOpen(true);
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Help & Onboarding
        </Button>
      )}
    </>
  );
}

/**
 * Onboarding Checklist Component
 * Shows user progress through key onboarding tasks
 */
export function OnboardingChecklist() {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem("alipm-onboarding-tasks");
    if (saved) {
      setCompletedTasks(new Set(JSON.parse(saved)));
    }
  }, []);

  const tasks = [
    { id: "upload-boq", label: "Upload your first BOQ file", icon: <Upload className="w-4 h-4" /> },
    {
      id: "upload-drawings",
      label: "Upload project drawings",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "generate-document",
      label: "Generate your first document",
      icon: <CheckCircle className="w-4 h-4" />,
    },
    {
      id: "invite-team",
      label: "Invite team members",
      icon: <Zap className="w-4 h-4" />,
    },
  ];

  const handleTaskComplete = (taskId: string) => {
    const updated = new Set(completedTasks);
    if (updated.has(taskId)) {
      updated.delete(taskId);
    } else {
      updated.add(taskId);
    }
    setCompletedTasks(updated);
    localStorage.setItem("alipm-onboarding-tasks", JSON.stringify(Array.from(updated)));
  };

  const progress = (completedTasks.size / tasks.length) * 100;

  return (
    <Card className="border-gold/20">
      <CardHeader>
        <CardTitle className="text-lg">Getting Started Checklist</CardTitle>
        <CardDescription>Complete these tasks to unlock the full power of AliPM</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{completedTasks.size} of {tasks.length} completed</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => handleTaskComplete(task.id)}
              className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-primary/5 transition-colors text-left"
            >
              <input
                type="checkbox"
                checked={completedTasks.has(task.id)}
                onChange={() => {}}
                className="w-5 h-5 rounded border-gold/30 text-gold cursor-pointer"
              />
              <div className="flex-1 flex items-center gap-2">
                <div className="text-gold">{task.icon}</div>
                <span className={completedTasks.has(task.id) ? "line-through text-muted-foreground" : ""}>
                  {task.label}
                </span>
              </div>
              {completedTasks.has(task.id) && (
                <CheckCircle className="w-4 h-4 text-gold" />
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
