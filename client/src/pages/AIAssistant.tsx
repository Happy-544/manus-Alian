import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  Bot,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  RefreshCw,
  Send,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Users,
  UserCheck,
  UserX,
  Activity,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "chat" | "summary" | "report";
}

interface ResourceAllocation {
  userId: number;
  name: string;
  role: string;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  todo: number;
  overdue: number;
  completedThisWeek: number;
  utilizationRate: number;
}

interface ReportMetadata {
  projectName: string;
  reportDate: string;
  periodStart: string;
  periodEnd: string;
  tasksCompleted: number;
  tasksInProgress: number;
  overdueTasks: number;
  budgetUtilization: number;
  weeklySpending: number;
  // Resource allocation metrics
  totalTeamMembers: number;
  avgUtilization: number;
  overloadedMembers: number;
  underutilizedMembers: number;
  unassignedTasks: number;
  resourceAllocation: ResourceAllocation[];
}

export default function AIAssistant() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [currentReport, setCurrentReport] = useState<string>("");
  const [reportMetadata, setReportMetadata] = useState<ReportMetadata | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: projects } = trpc.projects.list.useQuery();
  const { data: projectDetails } = trpc.projects.getById.useQuery(
    { id: parseInt(selectedProjectId) },
    { enabled: !!selectedProjectId }
  );

  const generateSummary = trpc.ai.generateSummary.useMutation({
    onSuccess: (data: any) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.summary,
          timestamp: new Date(),
          type: "summary",
        },
      ]);
      setIsLoading(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate summary");
      setIsLoading(false);
    },
  });

  const generateWeeklyReport = trpc.ai.generateWeeklyReport.useMutation({
    onSuccess: (data: any) => {
      setCurrentReport(data.report);
      setReportMetadata(data.metadata);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `📊 **Weekly Progress Report Generated**\n\nI've generated a comprehensive weekly report for **${data.metadata.projectName}**.\n\n**Report Highlights:**\n- Tasks Completed This Week: ${data.metadata.tasksCompleted}\n- Tasks In Progress: ${data.metadata.tasksInProgress}\n- Overdue Tasks: ${data.metadata.overdueTasks}\n- Budget Utilization: ${data.metadata.budgetUtilization}%\n\nClick "View Full Report" to see the complete report or download it.`,
          timestamp: new Date(),
          type: "report",
        },
      ]);
      setShowReportDialog(true);
      setIsLoading(false);
      toast.success("Weekly report generated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate weekly report");
      setIsLoading(false);
    },
  });

  const chat = trpc.ai.chat.useMutation({
    onSuccess: (data: any) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
          type: "chat",
        },
      ]);
      setIsLoading(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to get response");
      setIsLoading(false);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !selectedProjectId) return;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: inputValue,
        timestamp: new Date(),
      },
    ]);
    setIsLoading(true);
    chat.mutate({
      projectId: parseInt(selectedProjectId),
      message: inputValue,
    });
    setInputValue("");
  };

  const handleGenerateSummary = () => {
    if (!selectedProjectId) {
      toast.error("Please select a project first");
      return;
    }
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: "Generate a project summary",
        timestamp: new Date(),
      },
    ]);
    setIsLoading(true);
    generateSummary.mutate({ projectId: parseInt(selectedProjectId) });
  };

  const handleGenerateWeeklyReport = () => {
    if (!selectedProjectId) {
      toast.error("Please select a project first");
      return;
    }
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: "Generate a weekly progress report",
        timestamp: new Date(),
      },
    ]);
    setIsLoading(true);
    generateWeeklyReport.mutate({ projectId: parseInt(selectedProjectId) });
  };

  const handleDownloadReport = () => {
    if (!currentReport || !reportMetadata) return;
    
    const blob = new Blob([currentReport], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weekly-report-${reportMetadata.projectName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded successfully!");
  };

  const quickActions = [
    {
      icon: FileText,
      label: "Generate Summary",
      description: "Create a project summary",
      action: handleGenerateSummary,
      color: "text-blue-500",
    },
    {
      icon: ClipboardList,
      label: "Weekly Report",
      description: "Generate weekly progress report",
      action: handleGenerateWeeklyReport,
      color: "text-green-500",
      highlight: true,
    },
  ];

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Assistant
          </h2>
          <p className="text-muted-foreground">
            Get AI-powered insights, summaries, and weekly reports for your projects
          </p>
        </div>
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a project" />
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

      {!selectedProjectId ? (
        <Card className="flex-1 flex items-center justify-center">
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <Bot className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Project</h3>
            <p className="text-muted-foreground max-w-md">
              Choose a project to start chatting with the AI assistant and get
              intelligent insights about your construction project.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex-1 flex gap-6 min-h-0">
          {/* Quick Actions Sidebar */}
          <div className="w-64 shrink-0 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.highlight ? "default" : "outline"}
                    className={`w-full justify-start h-auto py-3 ${action.highlight ? "bg-primary hover:bg-primary/90" : ""}`}
                    onClick={action.action}
                    disabled={isLoading}
                  >
                    <action.icon className={`h-4 w-4 mr-2 shrink-0 ${action.highlight ? "text-primary-foreground" : action.color}`} />
                    <div className="text-left">
                      <p className="font-medium">{action.label}</p>
                      <p className={`text-xs ${action.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {action.description}
                      </p>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {projectDetails && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Project Context</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{projectDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">
                      {projectDetails.status?.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Progress</p>
                    <p className="font-medium">{projectDetails.progress}%</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Report History Hint */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Weekly Reports</p>
                    <p>Generate comprehensive progress reports with task summaries, budget analysis, and AI recommendations.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardContent className="flex-1 flex flex-col p-4 min-h-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                    <Bot className="h-12 w-12 mb-4 opacity-50" />
                    <p className="font-medium">Start a conversation</p>
                    <p className="text-sm">
                      Ask questions about your project or use quick actions
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={handleGenerateSummary}>
                        <FileText className="h-3 w-3 mr-1" />
                        Summary
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-muted bg-primary/10 border-primary/30" onClick={handleGenerateWeeklyReport}>
                        <ClipboardList className="h-3 w-3 mr-1" />
                        Weekly Report
                      </Badge>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <>
                            <Streamdown>{message.content}</Streamdown>
                            {message.type === "report" && (
                              <div className="mt-3 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setShowReportDialog(true)}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  View Full Report
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleDownloadReport}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <p>{message.content}</p>
                        )}
                        <p
                          className={`text-xs mt-1 ${
                            message.role === "user"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">
                          {generateWeeklyReport.isPending
                            ? "Generating weekly report..."
                            : "Thinking..."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about your project..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weekly Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Weekly Progress Report
              {reportMetadata && (
                <Badge variant="outline" className="ml-2">
                  {reportMetadata.reportDate}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {reportMetadata && (
            <>
              {/* Task & Budget Metrics */}
              <div className="grid grid-cols-4 gap-4 py-4 border-b">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-2xl font-bold">{reportMetadata.tasksCompleted}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Tasks Completed</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-2xl font-bold">{reportMetadata.tasksInProgress}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-2xl font-bold">{reportMetadata.overdueTasks}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-2xl font-bold">{reportMetadata.budgetUtilization}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Budget Used</p>
                </div>
              </div>
              
              {/* Resource Allocation Metrics */}
              <div className="grid grid-cols-4 gap-4 py-4 border-b bg-muted/30">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-indigo-600 mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-2xl font-bold">{reportMetadata.totalTeamMembers}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Team Members</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-cyan-600 mb-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-2xl font-bold">{reportMetadata.avgUtilization}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Avg Utilization</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                    <UserX className="h-4 w-4" />
                    <span className="text-2xl font-bold">{reportMetadata.overloadedMembers}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Overloaded</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                    <UserCheck className="h-4 w-4" />
                    <span className="text-2xl font-bold">{reportMetadata.unassignedTasks}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Unassigned Tasks</p>
                </div>
              </div>
              
              {/* Team Member Workload Table */}
              {reportMetadata.resourceAllocation && reportMetadata.resourceAllocation.length > 0 && (
                <div className="py-4 border-b">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Workload Distribution
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 font-medium">Member</th>
                          <th className="text-left py-2 px-2 font-medium">Role</th>
                          <th className="text-center py-2 px-2 font-medium">Total</th>
                          <th className="text-center py-2 px-2 font-medium">Done</th>
                          <th className="text-center py-2 px-2 font-medium">In Progress</th>
                          <th className="text-center py-2 px-2 font-medium">Overdue</th>
                          <th className="text-center py-2 px-2 font-medium">Utilization</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportMetadata.resourceAllocation.map((member, idx) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="py-2 px-2 font-medium">{member.name}</td>
                            <td className="py-2 px-2 capitalize text-muted-foreground">
                              {member.role.replace(/_/g, ' ')}
                            </td>
                            <td className="text-center py-2 px-2">{member.totalAssigned}</td>
                            <td className="text-center py-2 px-2 text-green-600">{member.completed}</td>
                            <td className="text-center py-2 px-2 text-blue-600">{member.inProgress}</td>
                            <td className="text-center py-2 px-2 text-red-600">{member.overdue}</td>
                            <td className="text-center py-2 px-2">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      member.utilizationRate > 80 
                                        ? 'bg-red-500' 
                                        : member.utilizationRate > 50 
                                          ? 'bg-yellow-500' 
                                          : 'bg-green-500'
                                    }`}
                                    style={{ width: `${member.utilizationRate}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-medium ${
                                  member.utilizationRate > 80 
                                    ? 'text-red-600' 
                                    : member.utilizationRate > 50 
                                      ? 'text-yellow-600' 
                                      : 'text-green-600'
                                }`}>
                                  {member.utilizationRate}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
          
          <div className="flex-1 overflow-y-auto py-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <Streamdown>{currentReport}</Streamdown>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Close
            </Button>
            <Button onClick={handleDownloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
