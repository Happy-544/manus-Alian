import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  MoreVertical,
  Pencil,
  Users,
  Sparkles,
} from "lucide-react";
import { useParams, useLocation } from "wouter";

const statusConfig = {
  planning: { label: "Planning", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In Progress", color: "bg-green-100 text-green-700" },
  on_hold: { label: "On Hold", color: "bg-amber-100 text-amber-700" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

const priorityConfig = {
  low: { label: "Low", color: "bg-slate-100 text-slate-700" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-700" },
  high: { label: "High", color: "bg-amber-100 text-amber-700" },
  critical: { label: "Critical", color: "bg-red-100 text-red-700" },
};

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const projectId = parseInt(params.id || "0");

  const { data: project, isLoading } = trpc.projects.getById.useQuery(
    { id: projectId },
    { enabled: !!projectId }
  );

  const { data: tasks } = trpc.tasks.list.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const { data: members } = trpc.projectMembers.list.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const { data: milestones } = trpc.milestones.list.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold mb-2">Project not found</h2>
        <Button variant="outline" onClick={() => setLocation("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const status = statusConfig[project.status as keyof typeof statusConfig];
  const priority = priorityConfig[project.priority as keyof typeof priorityConfig];
  const budget = parseFloat(project.budget || "0");
  const spent = parseFloat(project.spentAmount || "0");
  const budgetPercent = budget > 0 ? (spent / budget) * 100 : 0;

  const completedTasks = tasks?.filter((t) => t.status === "completed").length || 0;
  const totalTasks = tasks?.length || 0;
  const taskPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Luxury Header Section */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/projects")}
            className="hover:bg-accent/10"
          >
            <ArrowLeft className="h-5 w-5 text-primary" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h1 className="text-4xl font-bold tracking-tight text-primary">
                {project.name}
              </h1>
              <Badge className={`${status?.color} font-semibold`}>
                {status?.label}
              </Badge>
              <Badge className={`${priority?.color} font-semibold`}>
                {priority?.label}
              </Badge>
            </div>
            {project.description && (
              <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>
        </div>
        <Button 
          className="bg-accent hover:bg-accent/90 text-primary font-semibold gap-2 whitespace-nowrap"
        >
          <Pencil className="w-4 h-4" />
          Edit Project
        </Button>
      </div>

      {/* Luxury Stats Cards with Gold Borders */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Progress Card */}
        <Card className="border-2 border-accent/50 hover:border-accent transition-colors hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-primary">Progress</CardTitle>
            <div className="p-2 bg-accent/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-4xl font-bold text-primary">{project.progress}%</div>
            <Progress value={project.progress || 0} className="h-2" />
            <p className="text-xs text-muted-foreground">Project completion</p>
          </CardContent>
        </Card>

        {/* Budget Card */}
        <Card className="border-2 border-accent/50 hover:border-accent transition-colors hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-primary">Budget</CardTitle>
            <div className="p-2 bg-accent/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-4xl font-bold text-primary">
              ${(spent / 1000000).toFixed(1)}M
            </div>
            <Progress value={Math.min(budgetPercent, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground">
              of ${(budget / 1000000).toFixed(1)}M budget
            </p>
          </CardContent>
        </Card>

        {/* Tasks Card */}
        <Card className="border-2 border-accent/50 hover:border-accent transition-colors hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-primary">Tasks</CardTitle>
            <div className="p-2 bg-accent/10 rounded-lg">
              <Clock className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-4xl font-bold text-primary">
              {completedTasks}/{totalTasks}
            </div>
            <Progress value={taskPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">Tasks completed</p>
          </CardContent>
        </Card>

        {/* Team Card */}
        <Card className="border-2 border-accent/50 hover:border-accent transition-colors hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-primary">Team</CardTitle>
            <div className="p-2 bg-accent/10 rounded-lg">
              <Users className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-4xl font-bold text-primary">{members?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Team members assigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Project Details Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Information Card */}
        <Card className="lg:col-span-2 border-2 border-primary/20 hover:border-accent/50 transition-colors">
          <CardHeader className="border-b border-primary/10 pb-4">
            <CardTitle className="text-2xl text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-accent uppercase tracking-wide">Client</p>
                <p className="text-lg font-medium text-primary">
                  {project.clientName || "Not specified"}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-accent uppercase tracking-wide">Location</p>
                <p className="text-lg font-medium text-primary flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  {project.location || "Not specified"}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-accent uppercase tracking-wide">Start Date</p>
                <p className="text-lg font-medium text-primary flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent" />
                  {project.startDate ? format(new Date(project.startDate), "MMM d, yyyy") : "Not set"}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-accent uppercase tracking-wide">End Date</p>
                <p className="text-lg font-medium text-primary flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent" />
                  {project.endDate ? format(new Date(project.endDate), "MMM d, yyyy") : "Not set"}
                </p>
              </div>
            </div>
            {project.address && (
              <div className="space-y-2 pt-4 border-t border-primary/10">
                <p className="text-sm font-semibold text-accent uppercase tracking-wide">Address</p>
                <p className="text-lg font-medium text-primary">{project.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Milestones Card */}
        <Card className="border-2 border-primary/20 hover:border-accent/50 transition-colors">
          <CardHeader className="border-b border-primary/10 pb-4">
            <CardTitle className="text-xl text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {!milestones || milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No milestones set
              </p>
            ) : (
              <div className="space-y-4">
                {milestones.slice(0, 5).map((milestone) => (
                  <div 
                    key={milestone.id} 
                    className="flex items-start gap-3 p-3 rounded-lg border border-primary/10 hover:border-accent/50 transition-colors"
                  >
                    <div
                      className={`h-4 w-4 rounded-full flex-shrink-0 mt-1 ${
                        milestone.status === "completed"
                          ? "bg-green-500"
                          : milestone.status === "in_progress"
                          ? "bg-accent"
                          : milestone.status === "delayed"
                          ? "bg-red-500"
                          : "bg-slate-300"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary">{milestone.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(milestone.dueDate), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="border-b border-primary/20 bg-transparent p-0">
          <TabsTrigger 
            value="tasks"
            className="border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent rounded-none"
          >
            Tasks ({totalTasks})
          </TabsTrigger>
          <TabsTrigger 
            value="team"
            className="border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent rounded-none"
          >
            Team ({members?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          {!tasks || tasks.length === 0 ? (
            <Card className="border-2 border-primary/20 py-12">
              <CardContent className="text-center">
                <p className="text-muted-foreground">No tasks yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks.slice(0, 10).map((task) => (
                <Card 
                  key={task.id}
                  className="border-2 border-primary/20 hover:border-accent/50 transition-colors hover:shadow-md"
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`h-4 w-4 rounded-full flex-shrink-0 ${
                          task.status === "completed"
                            ? "bg-green-500"
                            : task.status === "in_progress"
                            ? "bg-accent"
                            : task.status === "in_review"
                            ? "bg-purple-500"
                            : "bg-slate-300"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-primary">{task.title}</p>
                        {task.dueDate && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={`${priorityConfig[task.priority as keyof typeof priorityConfig]?.color} font-semibold`}>
                      {task.priority}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          {!members || members.length === 0 ? (
            <Card className="border-2 border-primary/20 py-12">
              <CardContent className="text-center">
                <p className="text-muted-foreground">No team members assigned</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {members.map((member) => (
                <Card 
                  key={member.id}
                  className="border-2 border-primary/20 hover:border-accent/50 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-primary">{member.userName || "Team Member"}</p>
                        <p className="text-sm text-muted-foreground mt-1">{member.role || "No role assigned"}</p>
                      </div>
                      <Badge variant="outline" className="border-accent/50">
                        {member.role}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
