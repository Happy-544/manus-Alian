import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  Bot,
  Building2,
  Calendar,
  ChevronRight,
  ClipboardList,
  DollarSign,
  FileText,
  FolderKanban,
  HardHat,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Settings,
  Users,
  Package,
  Target,
  Sofa,
  Hammer,
  BarChart3,
  Plus,
  Library,
  Zap,
  TrendingUp,
  AlertCircle,
  Briefcase,
  MessageSquare,
  Layers,
  ChevronDown,
  Star,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/**
 * Reorganized Menu Structure with Document Creation as Primary Focus
 * Menu items grouped by category with sub-menus
 */
interface MenuSection {
  title: string;
  icon: any;
  items: MenuItem[];
}

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  badge?: string;
  subItems?: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "DOCUMENT CREATION",
    icon: FileText,
    items: [
      {
        icon: Plus,
        label: "New Document",
        path: "/documents/new",
        badge: "Primary",
      },
      {
        icon: Library,
        label: "Document Library",
        path: "/documents/library",
        subItems: [
          { icon: FileText, label: "My Documents", path: "/documents/library" },
          { icon: Users, label: "Shared Documents", path: "/documents/shared" },
          { icon: Layers, label: "Templates", path: "/documents/templates" },
          { icon: Clock, label: "History", path: "/documents/history" },
        ],
      },
      {
        icon: Settings,
        label: "Document Settings",
        path: "/documents/settings",
      },
    ],
  },
  {
    title: "PROJECTS",
    icon: FolderKanban,
    items: [
      {
        icon: FolderKanban,
        label: "Active Projects",
        path: "/projects",
        subItems: [
          { icon: List, label: "Project List", path: "/projects" },
          { icon: Info, label: "Project Details", path: "/projects/1" },
          { icon: Users, label: "Team Members", path: "/projects/1/team" },
        ],
      },
      {
        icon: Calendar,
        label: "Project Timeline",
        path: "/timeline",
        subItems: [
          { icon: Target, label: "Milestones", path: "/timeline" },
          { icon: Calendar, label: "Schedule", path: "/timeline/schedule" },
          { icon: TrendingUp, label: "Progress", path: "/timeline/progress" },
        ],
      },
    ],
  },
  {
    title: "PLANNING & ANALYSIS",
    icon: BarChart3,
    items: [
      {
        icon: Target,
        label: "Baseline & Schedule",
        path: "/planning/baseline",
        subItems: [
          {
            icon: Target,
            label: "Baseline Program",
            path: "/planning/baseline",
          },
          {
            icon: Calendar,
            label: "Schedule Management",
            path: "/planning/schedule",
          },
          {
            icon: TrendingUp,
            label: "Milestone Tracking",
            path: "/planning/milestones",
          },
        ],
      },
      {
        icon: DollarSign,
        label: "Budget Planning",
        path: "/planning/budget",
        subItems: [
          { icon: DollarSign, label: "Budget Estimation", path: "/planning/budget" },
          { icon: BarChart3, label: "Cost Breakdown", path: "/planning/budget/breakdown" },
          { icon: TrendingUp, label: "Budget vs Actual", path: "/planning/budget/actual" },
        ],
      },
      {
        icon: BarChart3,
        label: "Analytics & Reports",
        path: "/analytics/1",
        subItems: [
          { icon: BarChart3, label: "Analytics Dashboard", path: "/analytics/1" },
          { icon: Target, label: "Sprints", path: "/sprints/1" },
          { icon: TrendingUp, label: "Performance Metrics", path: "/analytics/metrics" },
        ],
      },
    ],
  },
  {
    title: "PROCUREMENT",
    icon: Package,
    items: [
      {
        icon: Package,
        label: "Procurement Log",
        path: "/procurement",
        subItems: [
          { icon: Package, label: "Purchase Orders", path: "/procurement" },
          { icon: Users, label: "Supplier Management", path: "/procurement/suppliers" },
          { icon: Truck, label: "Delivery Tracking", path: "/procurement/delivery" },
        ],
      },
      {
        icon: Sofa,
        label: "Materials & FF&E",
        path: "/materials",
        subItems: [
          { icon: Hammer, label: "Material Specifications", path: "/materials" },
          { icon: Sofa, label: "Furniture & Fixtures", path: "/ffe" },
          { icon: Package, label: "Equipment", path: "/materials/equipment" },
        ],
      },
      {
        icon: Zap,
        label: "Value Engineering",
        path: "/procurement/value-engineering",
      },
      {
        icon: Users,
        label: "Supplier Database",
        path: "/suppliers",
        subItems: [
          { icon: Users, label: "All Suppliers", path: "/suppliers" },
          { icon: Plus, label: "Add Supplier", path: "/suppliers/new" },
          { icon: Star, label: "Top Rated", path: "/suppliers/top-rated" },
        ],
      },
    ],
  },
  {
    title: "TEAM & COLLABORATION",
    icon: Users,
    items: [
      {
        icon: Users,
        label: "Team Members",
        path: "/team",
        subItems: [
          { icon: Users, label: "Team Directory", path: "/team" },
          { icon: Plus, label: "Add Members", path: "/team/add" },
          { icon: Settings, label: "Permissions", path: "/team/permissions" },
        ],
      },
      {
        icon: ClipboardList,
        label: "Tasks & Assignments",
        path: "/tasks",
        subItems: [
          { icon: ClipboardList, label: "Task List", path: "/tasks" },
          { icon: CheckCircle, label: "My Tasks", path: "/tasks/my" },
          { icon: Plus, label: "New Task", path: "/tasks/new" },
        ],
      },
      {
        icon: MessageSquare,
        label: "Communication",
        path: "/team/chat",
        subItems: [
          { icon: MessageSquare, label: "Team Chat", path: "/team/chat" },
          { icon: Bell, label: "Notifications", path: "/team/notifications" },
          { icon: Activity, label: "Activity Feed", path: "/team/activity" },
        ],
      },
    ],
  },
  {
    title: "SETTINGS",
    icon: Settings,
    items: [
      {
        icon: Settings,
        label: "Account Settings",
        path: "/settings/account",
      },
      {
        icon: Building2,
        label: "Project Settings",
        path: "/settings/project",
      },
      {
        icon: HardHat,
        label: "System Settings",
        path: "/settings/system",
      },
    ],
  },
];



export default function DashboardLayoutReorganized({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("sidebar-width");
    return saved ? parseInt(saved, 10) : 280;
  });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["DOCUMENT CREATION"])
  );
  const { loading, user } = useAuth();
  const [location, navigate] = useLocation();
  const resizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("sidebar-width", sidebarWidth.toString());
  }, [sidebarWidth]);

  const handleMouseDown = () => {
    const startX = event?.clientX || 0;
    const startWidth = sidebarWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(400, startWidth + (e.clientX - startX)));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  const toggleSection = (title: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(title)) {
      newExpanded.delete(title);
    } else {
      newExpanded.add(title);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Reorganized Sidebar */}
      <div
        className="flex flex-col bg-primary text-primary-foreground border-r border-gold/20"
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gold/20">
          <h1 className="text-xl font-bold text-gold">AliPM</h1>
          <p className="text-xs text-primary-foreground/70">Fit-Out Project Management</p>
        </div>

        {/* Sidebar Content - Menu Sections */}
        <div className="flex-1 overflow-y-auto py-4">
          {menuSections.map((section) => (
            <div key={section.title} className="mb-2">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full px-4 py-2 flex items-center justify-between text-xs font-semibold text-gold/80 hover:text-gold transition-colors"
              >
                <div className="flex items-center gap-2">
                  <section.icon size={14} />
                  <span>{section.title}</span>
                </div>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    expandedSections.has(section.title) ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Section Items */}
              {expandedSections.has(section.title) && (
                <div className="mt-1">
                  {section.items.map((item) => (
                    <div key={item.label}>
                      {/* Main Item */}
                      <button
                        onClick={() => navigate(item.path)}
                        className={`w-full px-4 py-2 flex items-center justify-between text-sm transition-colors ${
                          location === item.path
                            ? "bg-gold/20 text-gold"
                            : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary/80"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={16} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <Badge className="bg-gold text-primary text-xs">
                            {item.badge}
                          </Badge>
                        )}
                        {item.subItems && (
                          <ChevronRight size={14} className="ml-auto" />
                        )}
                      </button>

                      {/* Sub Items */}
                      {item.subItems && (
                        <div className="ml-4 border-l border-gold/20">
                          {item.subItems.map((subItem) => (
                            <button
                              key={subItem.label}
                              onClick={() => navigate(subItem.path)}
                              className={`w-full px-4 py-1.5 flex items-center gap-2 text-xs transition-colors ${
                                location === subItem.path
                                  ? "text-gold"
                                  : "text-primary-foreground/60 hover:text-primary-foreground/80"
                              }`}
                            >
                              <subItem.icon size={12} />
                              <span>{subItem.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar Footer - User Profile */}
        <div className="p-4 border-t border-gold/20">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gold text-primary">
                    {user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-xs">
                  <p className="font-semibold text-primary-foreground">
                    {user.name || "User"}
                  </p>
                  <p className="text-primary-foreground/60 truncate">
                    {user.email || "user@example.com"}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/settings/account")}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    // Handle logout
                    window.location.href = "/api/auth/logout";
                  }}>
                    <LogOut size={14} className="mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button
              className="w-full bg-gold text-primary hover:bg-gold/90"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        ref={resizeRef}
        onMouseDown={handleMouseDown}
        className="w-1 bg-gold/10 hover:bg-gold/30 cursor-col-resize transition-colors"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 border-b border-border bg-background flex items-center px-6 gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            {getPageTitle(location)}
          </h2>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Bell size={18} />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings size={18} />
            </Button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}

/**
 * Get page title from current location
 */
function getPageTitle(location: string): string {
  const titles: Record<string, string> = {
    "/": "Dashboard",
    "/documents/new": "Create New Document",
    "/documents/library": "Document Library",
    "/documents/settings": "Document Settings",
    "/projects": "Projects",
    "/timeline": "Timeline",
    "/planning/baseline": "Baseline Program",
    "/planning/budget": "Budget Planning",
    "/analytics/1": "Analytics",
    "/procurement": "Procurement",
    "/materials": "Materials & FF&E",
    "/team": "Team Members",
    "/tasks": "Tasks",
    "/settings/account": "Account Settings",
    "/settings/project": "Project Settings",
    "/settings/system": "System Settings",
  };

  return titles[location] || "Fit-Out Dashboard";
}


