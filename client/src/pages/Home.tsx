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
} from "lucide-react";
import { useLocation } from "wouter";

const statusConfig = {
  planning: { label: "Planning", color: "bg-blue-500", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-amber-500", icon: TrendingUp },
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

  const recentProjects = projects?.slice(0, 4) || [];
  const totalBudget = projects?.reduce((sum, p) => sum + parseFloat(p.budget || "0"), 0) || 0;
  const totalSpent = projects?.reduce((sum, p) => sum + parseFloat(p.spentAmount || "0"), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
          <p className="text-muted-foreground">
            Here's an overview of your construction projects.
          </p>
        </div>
        <Button onClick={() => setLocation("/projects?new=true")}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{projectStats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {projectStats?.active || 0} active projects
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{taskStats?.inProgress || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {taskStats?.todo || 0} pending tasks
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${totalBudget.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  ${totalSpent.toLocaleString()} spent
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{projectStats?.completed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {taskStats?.completed || 0} tasks done
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Projects */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Projects</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/projects")}>
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No projects yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setLocation("/projects?new=true")}
                >
                  Create your first project
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => {
                  const status = statusConfig[project.status as keyof typeof statusConfig];
                  const StatusIcon = status?.icon || Clock;
                  return (
                    <div
                      key={project.id}
                      className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => setLocation(`/projects/${project.id}`)}
                    >
                      <div className={`h-10 w-10 rounded-lg ${status?.color || "bg-gray-500"} flex items-center justify-center`}>
                        <StatusIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{project.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {status?.label || project.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {project.clientName || "No client"} • {project.location || "No location"}
                        </p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">
                          {project.progress || 0}%
                        </p>
                        <Progress value={project.progress || 0} className="w-20 h-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !activities || activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.slice(0, 6).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium">
                        {activity.userName?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.userName || "User"}</span>{" "}
                        <span className="text-muted-foreground">{activity.action}</span>{" "}
                        <span className="font-medium">{activity.entityType}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.projectName && `${activity.projectName} • `}
                        {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
