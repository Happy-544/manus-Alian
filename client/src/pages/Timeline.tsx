import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { addDays, differenceInDays, format, isAfter, isBefore, startOfMonth, endOfMonth, eachDayOfInterval, isToday, startOfWeek, endOfWeek } from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";

const statusColors = {
  planning: "bg-blue-500",
  in_progress: "bg-amber-500",
  on_hold: "bg-gray-400",
  completed: "bg-green-500",
  cancelled: "bg-red-400",
};

const milestoneStatusColors = {
  pending: "bg-slate-400",
  in_progress: "bg-blue-500",
  completed: "bg-green-500",
  delayed: "bg-red-500",
};

export default function Timeline() {
  const [, setLocation] = useLocation();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery();

  // Get milestones for selected project or all projects
  const { data: milestones } = trpc.milestones.list.useQuery(
    { projectId: parseInt(selectedProjectId) },
    { enabled: selectedProjectId !== "all" }
  );

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === "month") {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
  }, [currentDate, viewMode]);

  const navigatePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      setCurrentDate(addDays(currentDate, -7));
    }
  };

  const navigateNext = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      setCurrentDate(addDays(currentDate, 7));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Filter projects based on selection
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (selectedProjectId === "all") return projects;
    return projects.filter((p) => p.id.toString() === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Calculate project bar position and width
  const getProjectBarStyle = (project: NonNullable<typeof projects>[0]) => {
    if (!project.startDate || !project.endDate) return null;

    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.endDate);
    const rangeStart = dateRange[0];
    const rangeEnd = dateRange[dateRange.length - 1];

    // Check if project overlaps with current range
    if (isAfter(projectStart, rangeEnd) || isBefore(projectEnd, rangeStart)) {
      return null;
    }

    const effectiveStart = isBefore(projectStart, rangeStart) ? rangeStart : projectStart;
    const effectiveEnd = isAfter(projectEnd, rangeEnd) ? rangeEnd : projectEnd;

    const startOffset = differenceInDays(effectiveStart, rangeStart);
    const duration = differenceInDays(effectiveEnd, effectiveStart) + 1;
    const totalDays = dateRange.length;

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Timeline</h2>
          <p className="text-muted-foreground">
            Visualize project schedules and milestones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timeline Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={navigatePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="font-semibold ml-2">
                {viewMode === "month"
                  ? format(currentDate, "MMMM yyyy")
                  : `${format(dateRange[0], "MMM d")} - ${format(dateRange[dateRange.length - 1], "MMM d, yyyy")}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(v: "month" | "week") => setViewMode(v)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects to display</h3>
              <p className="text-muted-foreground mb-4">
                Create a project with start and end dates to see it on the timeline
              </p>
              <Button onClick={() => setLocation("/projects?new=true")}>
                Create Project
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Date Headers */}
              <div className="min-w-[800px]">
                <div className="flex border-b pb-2 mb-4">
                  <div className="w-48 shrink-0 font-medium text-sm text-muted-foreground">
                    Project
                  </div>
                  <div className="flex-1 flex">
                    {dateRange.map((date, index) => (
                      <div
                        key={index}
                        className={`flex-1 text-center text-xs ${
                          isToday(date) ? "font-bold text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {viewMode === "week" ? (
                          <>
                            <div>{format(date, "EEE")}</div>
                            <div className={isToday(date) ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mx-auto" : ""}>
                              {format(date, "d")}
                            </div>
                          </>
                        ) : (
                          <div className={isToday(date) ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mx-auto" : ""}>
                            {format(date, "d")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Project Rows */}
                <div className="space-y-3">
                  {filteredProjects.map((project) => {
                    const barStyle = getProjectBarStyle(project);
                    const statusColor = statusColors[project.status as keyof typeof statusColors] || "bg-gray-400";

                    return (
                      <div key={project.id} className="flex items-center">
                        <div
                          className="w-48 shrink-0 pr-4 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => setLocation(`/projects/${project.id}`)}
                        >
                          <p className="font-medium text-sm truncate">{project.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {project.clientName || "No client"}
                          </p>
                        </div>
                        <div className="flex-1 relative h-10 bg-muted/30 rounded">
                          {barStyle && (
                            <div
                              className={`absolute top-1 bottom-1 ${statusColor} rounded cursor-pointer hover:opacity-80 transition-opacity flex items-center px-2`}
                              style={barStyle}
                              onClick={() => setLocation(`/projects/${project.id}`)}
                            >
                              <span className="text-xs text-white font-medium truncate">
                                {project.progress || 0}%
                              </span>
                            </div>
                          )}
                          {!barStyle && !project.startDate && (
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                              No dates set
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestones Section */}
      {selectedProjectId !== "all" && milestones && milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {milestones.map((milestone) => {
                const statusColor = milestoneStatusColors[milestone.status as keyof typeof milestoneStatusColors] || "bg-gray-400";
                const isOverdue = milestone.dueDate && new Date(milestone.dueDate) < new Date() && milestone.status !== "completed";

                return (
                  <div key={milestone.id} className="flex items-center gap-4 p-3 rounded-lg border">
                    <div className={`h-3 w-3 rounded-full ${statusColor}`} />
                    <div className="flex-1">
                      <p className="font-medium">{milestone.name}</p>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center gap-1 text-sm ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                        <Clock className="h-4 w-4" />
                        <span>{format(new Date(milestone.dueDate), "MMM d, yyyy")}</span>
                      </div>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {milestone.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-sm font-medium">Status Legend:</span>
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded ${color}`} />
                <span className="text-sm capitalize">{status.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
