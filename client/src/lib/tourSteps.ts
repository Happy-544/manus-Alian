/**
 * Product Tour Steps
 * Defines the guided tour steps for new users
 */

import { TourStep } from "@/components/ProductTour";

export const PRODUCT_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to AliPM",
    description:
      "Your comprehensive platform for managing fit-out and interior design projects. Let's explore the key features that will help you streamline your workflow.",
    target: "body",
    position: "bottom",
  },
  {
    id: "dashboard",
    title: "Project Dashboard",
    description:
      "Get a quick overview of all your active projects, pending approvals, and budget status. Track project progress and team activity in real-time.",
    target: "[data-tour='dashboard']",
    position: "bottom",
  },
  {
    id: "new-document",
    title: "Create Professional Documents",
    description:
      "Generate professional BOQ, drawings, baselines, procurement logs, engineering documentation, and budget estimates. Our guided workflow makes it easy.",
    target: "[data-tour='new-document']",
    position: "right",
  },
  {
    id: "document-library",
    title: "Document Library",
    description:
      "Access all your generated documents, view version history, and collaborate with team members. Share documents with specific permissions.",
    target: "[data-tour='document-library']",
    position: "right",
  },
  {
    id: "gap-analysis",
    title: "Intelligent Gap Analysis",
    description:
      "Our AI automatically detects missing BOQ data and suggests suppliers and unit prices. Fill gaps quickly with AI-powered recommendations.",
    target: "[data-tour='gap-analysis']",
    position: "right",
  },
  {
    id: "suppliers",
    title: "Supplier Database",
    description:
      "Manage your supplier network with ratings, lead times, and specializations. Quickly select suppliers when completing BOQ gaps.",
    target: "[data-tour='suppliers']",
    position: "right",
  },
  {
    id: "templates",
    title: "Project Templates",
    description:
      "Save and reuse project configurations, supplier lists, and BOQ structures. Speed up future project setup with templates.",
    target: "[data-tour='templates']",
    position: "right",
  },
  {
    id: "timeline",
    title: "Project Timeline",
    description:
      "Visualize your project schedule, track milestones, and manage dependencies. Keep your team aligned on project progress.",
    target: "[data-tour='timeline']",
    position: "right",
  },
  {
    id: "procurement",
    title: "Procurement Tracking",
    description:
      "Track purchase orders, supplier deliveries, and material arrivals. Stay on top of procurement timelines and costs.",
    target: "[data-tour='procurement']",
    position: "right",
  },
  {
    id: "team",
    title: "Team Collaboration",
    description:
      "Invite team members, assign roles, and collaborate on projects. Share documents and communicate within the platform.",
    target: "[data-tour='team']",
    position: "right",
  },
  {
    id: "settings",
    title: "Customize Your Workspace",
    description:
      "Configure project settings, manage integrations, and personalize your experience. Set up notifications and preferences.",
    target: "[data-tour='settings']",
    position: "left",
  },
  {
    id: "complete",
    title: "You're All Set!",
    description:
      "You now know the key features of AliPM. Start by creating your first project or uploading an existing one. Happy managing!",
    target: "body",
    position: "bottom",
  },
];

export const TOUR_STORAGE_KEY = "alipm_tour_completed";
export const FIRST_LOGIN_KEY = "alipm_first_login";

export function hasCompletedTour(): boolean {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function markTourAsCompleted(): void {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
  } catch {
    // Silently fail if localStorage is not available
  }
}

export function isFirstLogin(): boolean {
  try {
    const firstLogin = localStorage.getItem(FIRST_LOGIN_KEY);
    if (firstLogin === null) {
      localStorage.setItem(FIRST_LOGIN_KEY, "false");
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function resetTour(): void {
  try {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  } catch {
    // Silently fail if localStorage is not available
  }
}
