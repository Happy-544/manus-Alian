/**
 * Project Dashboard Page
 * Displays KPIs, active projects, document generation status, and team activity feed
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  DollarSign,
  Activity,
  ArrowRight,
  Download,
  Share2,
  Plus,
} from "lucide-react";

// Sample KPI data
const kpiData = {
  activeProjects: 12,
  totalDocuments: 156,
  pendingApprovals: 8,
  completedDocuments: 148,
  totalBudget: 2450000,
  spentBudget: 1825000,
  teamMembers: 24,
};

// Sample project data
const projectsData = [
  {
    id: "proj-001",
    name: "Marina Towers - Phase 1",
    status: "in-progress",
    progress: 65,
    documents: 12,
    budget: 450000,
    spent: 320000,
    team: 5,
    dueDate: "2026-03-15",
  },
  {
    id: "proj-002",
    name: "Downtown Plaza Renovation",
    status: "in-progress",
    progress: 45,
    documents: 8,
    budget: 320000,
    spent: 145000,
    team: 3,
    dueDate: "2026-04-20",
  },
  {
    id: "proj-003",
    name: "Airport Terminal Expansion",
    status: "planning",
    progress: 15,
    documents: 5,
    budget: 850000,
    spent: 0,
    team: 8,
    dueDate: "2026-06-01",
  },
  {
    id: "proj-004",
    name: "Residential Complex - Block A",
    status: "completed",
    progress: 100,
    documents: 24,
    budget: 580000,
    spent: 580000,
    team: 6,
    dueDate: "2025-12-20",
  },
];

// Sample document status data
const documentStatusData = [
  { status: "Draft", count: 24, color: "#94a3b8" },
  { status: "In Review", count: 32, color: "#f59e0b" },
  { status: "Approved", count: 92, color: "#10b981" },
  { status: "Archived", count: 8, color: "#6366f1" },
];

// Sample activity feed
const activityFeed = [
  {
    id: "act-001",
    type: "document-shared",
    user: "Ahmed Hassan",
    action: "shared",
    target: "BOQ - Marina Towers",
    timestamp: new Date(Date.now() - 15 * 60000),
    icon: Share2,
  },
  {
    id: "act-002",
    type: "document-approved",
    user: "Fatima Al-Mansouri",
    action: "approved",
    target: "Engineering Log - Phase 1",
    timestamp: new Date(Date.now() - 45 * 60000),
    icon: CheckCircle,
  },
  {
    id: "act-003",
    type: "document-created",
    user: "Mohamed Ali",
    action: "created",
    target: "Procurement Log - Downtown Plaza",
    timestamp: new Date(Date.now() - 2 * 60 * 60000),
    icon: FileText,
  },
  {
    id: "act-004",
    type: "project-updated",
    user: "Khaled Ibrahim",
    action: "updated progress to",
    target: "Airport Terminal - 15%",
    timestamp: new Date(Date.now() - 3 * 60 * 60000),
    icon: TrendingUp,
  },
  {
    id: "act-005",
    type: "user-joined",
    user: "Layla Ahmed",
    action: "joined project",
    target: "Marina Towers - Phase 1",
    timestamp: new Date(Date.now() - 5 * 60 * 60000),
    icon: Users,
  },
];

// Sample budget trend data
const budgetTrendData = [
  { month: "Jan", planned: 200000, actual: 180000 },
  { month: "Feb", planned: 250000, actual: 245000 },
  { month: "Mar", planned: 300000, actual: 320000 },
  { month: "Apr", planned: 280000, actual: 265000 },
  { month: "May", planned: 320000, actual: 315000 },
  { month: "Jun", planned: 400000, actual: 500000 },
];

export function ProjectDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");

  const budgetPercentage = useMemo(() => {
    return Math.round((kpiData.spentBudget / kpiData.totalBudget) * 100);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "in-progress":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "planning":
        return "bg-amber-500/10 text-amber-700 border-amber-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "in-progress":
        return <Clock className="w-4 h-4" />;
      case "planning":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-8 h-8 text-gold" />
            Project Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of all projects, documents, and team activity
          </p>
        </div>
        <Button className="gap-2 bg-gold hover:bg-gold/90 text-black">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Projects */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Active Projects
              <TrendingUp className="w-4 h-4 text-gold" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {kpiData.activeProjects}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        {/* Total Documents */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Total Documents
              <FileText className="w-4 h-4 text-gold" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {kpiData.totalDocuments}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpiData.completedDocuments} completed
            </p>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Pending Approvals
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {kpiData.pendingApprovals}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        {/* Budget Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Budget Status
              <DollarSign className="w-4 h-4 text-gold" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {budgetPercentage}%
            </div>
            <Progress value={budgetPercentage} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              AED {(kpiData.spentBudget / 1000000).toFixed(1)}M of{" "}
              {(kpiData.totalBudget / 1000000).toFixed(1)}M
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Document Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Document Status Distribution</CardTitle>
                <CardDescription>
                  Breakdown of all documents by status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={documentStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {documentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Budget Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Trend</CardTitle>
                <CardDescription>
                  Planned vs Actual spending over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={budgetTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="planned"
                      stroke="#D4AF37"
                      strokeWidth={2}
                      name="Planned"
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Actual"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="space-y-3">
            {projectsData.map((project) => (
              <Card key={project.id} className="hover:border-gold/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={`text-xs border ${getStatusColor(
                              project.status
                            )}`}
                          >
                            {getStatusIcon(project.status)}
                            <span className="ml-1 capitalize">
                              {project.status}
                            </span>
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Due: {new Date(project.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          {project.progress}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Complete
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <Progress value={project.progress} className="h-2" />

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Documents</p>
                        <p className="font-semibold text-foreground">
                          {project.documents}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Budget</p>
                        <p className="font-semibold text-foreground">
                          AED {(project.budget / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Spent</p>
                        <p className="font-semibold text-foreground">
                          AED {(project.spent / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Team</p>
                        <p className="font-semibold text-foreground">
                          {project.team}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                        <FileText className="w-3 h-3 mr-1" />
                        View Documents
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        Team
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Activity Feed Tab */}
        <TabsContent value="activity" className="space-y-3">
          {activityFeed.map((activity) => {
            const Icon = activity.icon;
            return (
              <Card key={activity.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-gold" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">{activity.user}</span>{" "}
                        <span className="text-muted-foreground">
                          {activity.action}
                        </span>{" "}
                        <span className="font-semibold text-gold">
                          {activity.target}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
