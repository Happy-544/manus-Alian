import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  FolderKanban,
  Pause,
  Plus,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";

const statusConfig = {
  planning: { label: "Planning", color: "bg-yellow-500", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-500", icon: TrendingUp },
  on_hold: { label: "On Hold", color: "bg-gray-500", icon: Pause },
  completed: { label: "Completed", color: "bg-green-500", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-500", icon: AlertCircle },
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery();
  const { data: projectStats, isLoading: statsLoading } = trpc.projects.stats.useQuery();
  const { data: taskStats } = trpc.tasks.stats.useQuery({});
  const { data: activities, isLoading: activitiesLoading } = trpc.activities.recent.useQuery({ limit: 10 });

  // SEO: Set page title and meta description
  useEffect(() => {
    document.title = "Fit-Out Project Management Dashboard | Construction Planning";
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Manage fit-out and construction projects efficiently. Track budgets, tasks, procurement, and generate AI-powered project documentation for Dubai projects.');

    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', 'fit-out management, construction project management, project dashboard, budget tracking, procurement management, Dubai projects, project planning, task management');
  }, []);

  const recentProjects = projects?.slice(0, 4) || [];
  const totalBudget = projects?.reduce((sum, p) => sum + parseFloat(p.budget || "0"), 0) || 0;
  const totalSpent = projects?.reduce((sum, p) => sum + parseFloat(p.spentAmount || "0"), 0) || 0;

  return (
    <div className="space-y-8">
      {/* Hero Section - Alpago Luxury Style */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary to-primary/80 p-12 text-white">
        <div className="absolute top-0 right-0 opacity-10">
          <Sparkles className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Fit-Out Project Management
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mb-6">
            Excellence in luxury project delivery. Manage budgets, tasks, procurement, and generate AI-powered documentation with architectural precision.
          </p>
          <Button 
            onClick={() => setLocation("/projects?new=true")}
            className="bg-accent hover:bg-accent/90 text-primary font-semibold gap-2"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Key Metrics Section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Project Overview & Key Metrics</h2>
        <p className="text-muted-foreground mb-6">Real-time insights into your construction and fit-out projects</p>
      </div>

      {/* Stats Cards - Luxury Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Projects Card */}
        <Card className="border-2 border-primary/20 hover:border-accent/50 transition-colors hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-primary">Total Projects</CardTitle>
            <div className="p-2 bg-accent/10 rounded-lg">
              <FolderKanban className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {statsLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <>
                <div className="text-4xl font-bold text-primary">{projectStats?.total || 0}</div>
                <p className="text-sm text-muted-foreground">
                  {projectStats?.active || 0} active projects
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Tasks Card */}
        <Card className="border-2 border-primary/20 hover:border-accent/50 transition-colors hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-primary">Active Tasks</CardTitle>
            <div className="p-2 bg-accent/10 rounded-lg">
              <Clock className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {statsLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <>
                <div className="text-4xl font-bold text-primary">{taskStats?.inProgress || 0}</div>
                <p className="text-sm text-muted-foreground">
                  {taskStats?.todo || 0} pending tasks
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Budget Card */}
        <Card className="border-2 border-primary/20 hover:border-accent/50 transition-colors hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-primary">Total Budget</CardTitle>
            <div className="p-2 bg-accent/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {projectsLoading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <>
                <div className="text-4xl font-bold text-primary">
                  ${(totalBudget / 1000000).toFixed(1)}M
                </div>
                <p className="text-sm text-muted-foreground">
                  ${(totalSpent / 1000000).toFixed(1)}M spent
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Completed Card */}
        <Card className="border-2 border-primary/20 hover:border-accent/50 transition-colors hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-primary">Completed</CardTitle>
            <div className="p-2 bg-accent/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {statsLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <>
                <div className="text-4xl font-bold text-primary">{projectStats?.completed || 0}</div>
                <p className="text-sm text-muted-foreground">
                  {projectStats?.total ? Math.round(((projectStats?.completed || 0) / projectStats?.total) * 100) : 0}% completion rate
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Recent Projects</h3>
            <Button variant="ghost" onClick={() => setLocation("/projects")} className="gap-2 text-accent hover:text-accent">
              View all
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {projectsLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border border-primary/10 rounded-lg">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </>
            ) : recentProjects.length > 0 ? (
              recentProjects.map((project) => {
                const StatusIcon = statusConfig[project.status as keyof typeof statusConfig]?.icon || Clock;
                const statusLabel = statusConfig[project.status as keyof typeof statusConfig]?.label || project.status;
                
                return (
                  <div
                    key={project.id}
                    className="p-4 border-2 border-primary/10 hover:border-accent/50 rounded-lg transition-all hover:shadow-md cursor-pointer"
                    onClick={() => setLocation(`/projects/${project.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-primary">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">{project.clientName}</p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {statusLabel}
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{project.progress || 0}%</span>
                      </div>
                      <Progress value={project.progress || 0} className="h-2" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No projects yet. Create your first project to get started.
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-2xl font-bold mb-6">Recent Activity</h3>

          <div className="space-y-4">
            {activitiesLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border border-primary/10 rounded-lg">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </>
            ) : activities && activities.length > 0 ? (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-4 border-2 border-primary/10 hover:border-accent/50 rounded-lg transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate">
                        {activity.action} - {activity.userName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
