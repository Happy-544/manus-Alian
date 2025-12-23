import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Calendar, Plus, Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, BarChart3, Sparkles, Camera, History } from "lucide-react";
import { Streamdown } from "streamdown";

const impactColors: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

export default function Baseline() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Dialog states
  const [isCreateBaselineOpen, setIsCreateBaselineOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  
  // Form states
  const [newBaseline, setNewBaseline] = useState({
    name: "",
    description: "",
    plannedStartDate: "",
    plannedEndDate: "",
    plannedBudget: "",
  });
  
  const [analysisResult, setAnalysisResult] = useState("");
  
  // Queries
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: baselines, refetch: refetchBaselines } = trpc.baseline.list.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  const { data: activeBaseline } = trpc.baseline.getActive.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  const { data: baselineTasks } = trpc.baseline.getTasks.useQuery(
    { baselineId: activeBaseline?.id! },
    { enabled: !!activeBaseline?.id }
  );
  const { data: variances, refetch: refetchVariances } = trpc.baseline.getVariances.useQuery(
    { projectId: selectedProjectId!, baselineId: activeBaseline?.id },
    { enabled: !!selectedProjectId }
  );
  const { data: snapshots, refetch: refetchSnapshots } = trpc.baseline.getSnapshots.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  const { data: tasks } = trpc.tasks.list.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  
  // Mutations
  const createBaseline = trpc.baseline.create.useMutation({
    onSuccess: () => {
      toast.success("Baseline created successfully");
      setIsCreateBaselineOpen(false);
      resetForm();
      refetchBaselines();
    },
    onError: (error) => toast.error(error.message),
  });
  
  const deleteBaseline = trpc.baseline.delete.useMutation({
    onSuccess: () => {
      toast.success("Baseline deleted");
      refetchBaselines();
    },
    onError: (error) => toast.error(error.message),
  });
  
  const calculateVariances = trpc.baseline.calculateVariances.useMutation({
    onSuccess: (data) => {
      toast.success(`Found ${data.count} variances`);
      refetchVariances();
    },
    onError: (error) => toast.error(error.message),
  });
  
  const recordSnapshot = trpc.baseline.recordSnapshot.useMutation({
    onSuccess: (data) => {
      toast.success(`Snapshot recorded - SPI: ${data.spi.toFixed(2)}, CPI: ${data.cpi.toFixed(2)}`);
      refetchSnapshots();
    },
    onError: (error) => toast.error(error.message),
  });
  
  const analyzeSchedule = trpc.baseline.analyzeSchedule.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data.analysis);
      setIsAnalysisOpen(true);
    },
    onError: (error) => toast.error(error.message),
  });
  
  const resetForm = () => {
    setNewBaseline({
      name: "",
      description: "",
      plannedStartDate: "",
      plannedEndDate: "",
      plannedBudget: "",
    });
  };
  
  const handleCreateBaseline = () => {
    if (!selectedProjectId || !newBaseline.name || !newBaseline.plannedStartDate || !newBaseline.plannedEndDate) {
      toast.error("Please fill in required fields");
      return;
    }
    createBaseline.mutate({
      projectId: selectedProjectId,
      ...newBaseline,
    });
  };
  
  // Set first project as default
  if (projects?.length && !selectedProjectId) {
    setSelectedProjectId(projects[0].id);
  }
  
  // Calculate performance metrics
  const latestSnapshot = snapshots?.[0];
  const spi = latestSnapshot?.schedulePerformanceIndex ? parseFloat(latestSnapshot.schedulePerformanceIndex as any) : 1;
  const cpi = latestSnapshot?.costPerformanceIndex ? parseFloat(latestSnapshot.costPerformanceIndex as any) : 1;
  
  // Calculate task comparison
  const taskComparison = baselineTasks?.map(bt => {
    const currentTask = tasks?.find(t => t.id === bt.taskId);
    if (!currentTask) return null;
    
    let startVariance = 0;
    let endVariance = 0;
    let progressVariance = 0;
    
    if (bt.plannedStartDate && currentTask.startDate) {
      const planned = new Date(bt.plannedStartDate).getTime();
      const actual = new Date(currentTask.startDate).getTime();
      startVariance = Math.round((actual - planned) / (1000 * 60 * 60 * 24));
    }
    
    if (bt.plannedEndDate && currentTask.dueDate) {
      const planned = new Date(bt.plannedEndDate).getTime();
      const actual = new Date(currentTask.dueDate).getTime();
      endVariance = Math.round((actual - planned) / (1000 * 60 * 60 * 24));
    }
    
    progressVariance = (currentTask.progress || 0) - (bt.plannedProgress || 0);
    
    return {
      ...bt,
      currentTask,
      startVariance,
      endVariance,
      progressVariance,
    };
  }).filter(Boolean) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Baseline Program</h1>
            <p className="text-muted-foreground">Track planned vs actual progress and schedule performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedProjectId?.toString() || ""}
              onValueChange={(v) => setSelectedProjectId(parseInt(v))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Performance Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Schedule Performance (SPI)</CardTitle>
              {spi >= 1 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${spi >= 1 ? "text-green-600" : "text-red-600"}`}>
                {spi.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {spi >= 1 ? "On or ahead of schedule" : "Behind schedule"}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Performance (CPI)</CardTitle>
              {cpi >= 1 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${cpi >= 1 ? "text-green-600" : "text-red-600"}`}>
                {cpi.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {cpi >= 1 ? "Under or on budget" : "Over budget"}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Baseline</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeBaseline ? `v${activeBaseline.version}` : "None"}
              </div>
              <p className="text-xs text-muted-foreground">
                {activeBaseline?.name || "No baseline set"}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Variances</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{variances?.length || 0}</div>
              <p className="text-xs text-muted-foreground">schedule deviations</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Dialog open={isCreateBaselineOpen} onOpenChange={setIsCreateBaselineOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Baseline
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Baseline</DialogTitle>
                <DialogDescription>
                  Capture current schedule as a baseline for comparison
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div>
                  <Label>Baseline Name *</Label>
                  <Input
                    value={newBaseline.name}
                    onChange={(e) => setNewBaseline({ ...newBaseline, name: e.target.value })}
                    placeholder="e.g., Original Schedule, Rev 1"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newBaseline.description}
                    onChange={(e) => setNewBaseline({ ...newBaseline, description: e.target.value })}
                    placeholder="Baseline description..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Planned Start Date *</Label>
                    <Input
                      type="date"
                      value={newBaseline.plannedStartDate}
                      onChange={(e) => setNewBaseline({ ...newBaseline, plannedStartDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Planned End Date *</Label>
                    <Input
                      type="date"
                      value={newBaseline.plannedEndDate}
                      onChange={(e) => setNewBaseline({ ...newBaseline, plannedEndDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Planned Budget</Label>
                  <Input
                    type="number"
                    value={newBaseline.plannedBudget}
                    onChange={(e) => setNewBaseline({ ...newBaseline, plannedBudget: e.target.value })}
                    placeholder="Total budget amount"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateBaselineOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateBaseline} disabled={createBaseline.isPending}>
                  {createBaseline.isPending ? "Creating..." : "Create Baseline"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => selectedProjectId && recordSnapshot.mutate({ projectId: selectedProjectId })}
            disabled={!selectedProjectId || recordSnapshot.isPending}
          >
            <Camera className="h-4 w-4" />
            {recordSnapshot.isPending ? "Recording..." : "Record Snapshot"}
          </Button>
          
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => selectedProjectId && calculateVariances.mutate({ projectId: selectedProjectId })}
            disabled={!selectedProjectId || !activeBaseline || calculateVariances.isPending}
          >
            <BarChart3 className="h-4 w-4" />
            {calculateVariances.isPending ? "Calculating..." : "Calculate Variances"}
          </Button>
          
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => selectedProjectId && analyzeSchedule.mutate({ projectId: selectedProjectId })}
            disabled={!selectedProjectId || analyzeSchedule.isPending}
          >
            <Sparkles className="h-4 w-4" />
            {analyzeSchedule.isPending ? "Analyzing..." : "AI Analysis"}
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <Target className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="comparison" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Task Comparison
            </TabsTrigger>
            <TabsTrigger value="variances" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Variances
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Active Baseline Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Baseline</CardTitle>
                  <CardDescription>Current baseline for schedule comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeBaseline ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Name</span>
                        <span className="font-medium">{activeBaseline.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Version</span>
                        <Badge>v{activeBaseline.version}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Planned Start</span>
                        <span>{new Date(activeBaseline.plannedStartDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Planned End</span>
                        <span>{new Date(activeBaseline.plannedEndDate).toLocaleDateString()}</span>
                      </div>
                      {activeBaseline.plannedBudget && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Planned Budget</span>
                          <span>${Number(activeBaseline.plannedBudget).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tasks Captured</span>
                        <span>{baselineTasks?.length || 0}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No active baseline set</p>
                      <p className="text-sm">Create a baseline to start tracking schedule performance</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trend</CardTitle>
                  <CardDescription>Recent snapshot history</CardDescription>
                </CardHeader>
                <CardContent>
                  {snapshots?.length ? (
                    <div className="space-y-3">
                      {snapshots.slice(0, 5).map((snapshot, index) => {
                        const snapshotSpi = parseFloat(snapshot.schedulePerformanceIndex as any || "1");
                        const snapshotCpi = parseFloat(snapshot.costPerformanceIndex as any || "1");
                        return (
                          <div key={snapshot.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {new Date(snapshot.snapshotDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex gap-4">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">SPI:</span>
                                <span className={`text-sm font-medium ${snapshotSpi >= 1 ? "text-green-600" : "text-red-600"}`}>
                                  {snapshotSpi.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">CPI:</span>
                                <span className={`text-sm font-medium ${snapshotCpi >= 1 ? "text-green-600" : "text-red-600"}`}>
                                  {snapshotCpi.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No snapshots recorded</p>
                      <p className="text-sm">Record snapshots to track performance over time</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* All Baselines */}
            <Card>
              <CardHeader>
                <CardTitle>All Baselines</CardTitle>
                <CardDescription>History of project baselines</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Planned Start</TableHead>
                      <TableHead>Planned End</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!baselines?.length ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No baselines created yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      baselines.map((baseline) => (
                        <TableRow key={baseline.id}>
                          <TableCell>
                            <Badge variant="outline">v{baseline.version}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{baseline.name}</TableCell>
                          <TableCell>{new Date(baseline.plannedStartDate).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(baseline.plannedEndDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {baseline.isActive ? (
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>{new Date(baseline.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteBaseline.mutate({ id: baseline.id })}
                              disabled={baseline.isActive}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Task Comparison Tab */}
          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Baseline vs Current</CardTitle>
                <CardDescription>Compare planned schedule against actual progress</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Planned Start</TableHead>
                      <TableHead>Actual Start</TableHead>
                      <TableHead>Start Δ</TableHead>
                      <TableHead>Planned End</TableHead>
                      <TableHead>Actual End</TableHead>
                      <TableHead>End Δ</TableHead>
                      <TableHead>Progress Δ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taskComparison.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          {activeBaseline 
                            ? "No tasks in baseline" 
                            : "Create a baseline to compare tasks"
                          }
                        </TableCell>
                      </TableRow>
                    ) : (
                      taskComparison.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.taskName}</TableCell>
                          <TableCell>
                            {item.plannedStartDate 
                              ? new Date(item.plannedStartDate).toLocaleDateString()
                              : "-"
                            }
                          </TableCell>
                          <TableCell>
                            {item.currentTask?.startDate 
                              ? new Date(item.currentTask.startDate).toLocaleDateString()
                              : "-"
                            }
                          </TableCell>
                          <TableCell>
                            <span className={
                              item.startVariance > 0 ? "text-red-600" :
                              item.startVariance < 0 ? "text-green-600" :
                              ""
                            }>
                              {item.startVariance > 0 ? `+${item.startVariance}d` :
                               item.startVariance < 0 ? `${item.startVariance}d` :
                               "-"
                              }
                            </span>
                          </TableCell>
                          <TableCell>
                            {item.plannedEndDate 
                              ? new Date(item.plannedEndDate).toLocaleDateString()
                              : "-"
                            }
                          </TableCell>
                          <TableCell>
                            {item.currentTask?.dueDate 
                              ? new Date(item.currentTask.dueDate).toLocaleDateString()
                              : "-"
                            }
                          </TableCell>
                          <TableCell>
                            <span className={
                              item.endVariance > 0 ? "text-red-600" :
                              item.endVariance < 0 ? "text-green-600" :
                              ""
                            }>
                              {item.endVariance > 0 ? `+${item.endVariance}d` :
                               item.endVariance < 0 ? `${item.endVariance}d` :
                               "-"
                              }
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={
                              item.progressVariance > 0 ? "text-green-600" :
                              item.progressVariance < 0 ? "text-red-600" :
                              ""
                            }>
                              {item.progressVariance > 0 ? `+${item.progressVariance}%` :
                               item.progressVariance < 0 ? `${item.progressVariance}%` :
                               "-"
                              }
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Variances Tab */}
          <TabsContent value="variances" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Schedule Variances</CardTitle>
                <CardDescription>Deviations from baseline schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Planned</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Variance</TableHead>
                      <TableHead>Impact</TableHead>
                      <TableHead>Detected</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!variances?.length ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No variances detected. Click "Calculate Variances" to analyze.
                        </TableCell>
                      </TableRow>
                    ) : (
                      variances.map((variance) => (
                        <TableRow key={variance.id}>
                          <TableCell className="font-medium">{`Task #${variance.taskId}`}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {variance.varianceType === "start_delay" ? "Start Delay" :
                               variance.varianceType === "end_delay" ? "End Delay" :
                               variance.varianceType === "progress_variance" ? "Progress" :
                               variance.varianceType
                              }
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {variance.varianceType === "progress_variance"
                              ? `${variance.plannedValue}%`
                              : variance.plannedValue 
                                ? new Date(variance.plannedValue).toLocaleDateString()
                                : "-"
                            }
                          </TableCell>
                          <TableCell>
                            {variance.varianceType === "progress_variance"
                              ? `${variance.actualValue}%`
                              : variance.actualValue 
                                ? new Date(variance.actualValue).toLocaleDateString()
                                : "-"
                            }
                          </TableCell>
                          <TableCell>
                            {variance.varianceDays 
                              ? `${variance.varianceDays > 0 ? "+" : ""}${variance.varianceDays} days`
                              : variance.variancePercent
                                ? `${parseFloat(variance.variancePercent as any) > 0 ? "+" : ""}${variance.variancePercent}%`
                                : "-"
                            }
                          </TableCell>
                          <TableCell>
                            <Badge className={impactColors[variance.impact || "low"]}>
                              {variance.impact}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {variance.recordedAt 
                              ? new Date(variance.recordedAt).toLocaleDateString()
                              : "-"
                            }
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Progress Snapshots</CardTitle>
                <CardDescription>Historical performance data</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Planned Progress</TableHead>
                      <TableHead>Actual Progress</TableHead>
                      <TableHead>SPI</TableHead>
                      <TableHead>CPI</TableHead>
                      <TableHead>Planned Value</TableHead>
                      <TableHead>Earned Value</TableHead>
                      <TableHead>Actual Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!snapshots?.length ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No snapshots recorded yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      snapshots.map((snapshot) => (
                        <TableRow key={snapshot.id}>
                          <TableCell>{new Date(snapshot.snapshotDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={snapshot.plannedProgress || 0} className="w-16 h-2" />
                              <span>{snapshot.plannedProgress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={snapshot.actualProgress || 0} className="w-16 h-2" />
                              <span>{snapshot.actualProgress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={
                              parseFloat(snapshot.schedulePerformanceIndex as any || "1") >= 1 
                                ? "text-green-600" 
                                : "text-red-600"
                            }>
                              {parseFloat(snapshot.schedulePerformanceIndex as any || "1").toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={
                              parseFloat(snapshot.costPerformanceIndex as any || "1") >= 1 
                                ? "text-green-600" 
                                : "text-red-600"
                            }>
                              {parseFloat(snapshot.costPerformanceIndex as any || "1").toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            ${Number(snapshot.plannedValue || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            ${Number(snapshot.earnedValue || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            ${Number(snapshot.actualCost || 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* AI Analysis Dialog */}
        <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>AI Schedule Analysis</DialogTitle>
              <DialogDescription>
                AI-powered analysis of schedule performance and recommendations
              </DialogDescription>
            </DialogHeader>
            <div className="prose prose-sm max-w-none">
              <Streamdown>{analysisResult}</Streamdown>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsAnalysisOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
