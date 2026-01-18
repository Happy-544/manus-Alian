import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OnboardingFlow, OnboardingChecklist } from "@/components/OnboardingFlow";
import {
  Plus,
  FileText,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Download,
  Share2,
  ArrowRight,
  Zap,
  Upload,
  BarChart3,
} from "lucide-react";

export function Home() {
  return (
    <div className="min-h-screen bg-background">
      <OnboardingFlow />
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-white px-4 md:px-8 py-8 md:py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">AliPM Fit-Out Project Management</h1>
          <p className="text-base md:text-xl text-white/90 mb-8 max-w-2xl">
            Excellence in luxury fit-out project delivery. Manage budgets, tasks, procurement, and generate AI-powered documentation with architectural precision.
          </p>
          
          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-gold text-primary hover:bg-gold/90 font-semibold">
              <Plus className="w-5 h-5 mr-2" />
              Create New Document
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              View Documents
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Upload BOQ */}
            <Card className="border-gold/20 hover:border-gold/40 transition-all cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">Upload BOQ</h3>
                <p className="text-sm text-muted-foreground">Upload Bill of Quantities file</p>
              </CardContent>
            </Card>

            {/* Upload Drawings */}
            <Card className="border-gold/20 hover:border-gold/40 transition-all cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">Upload Drawings</h3>
                <p className="text-sm text-muted-foreground">Upload CAD or PDF drawings</p>
              </CardContent>
            </Card>

            {/* Generate Report */}
            <Card className="border-gold/20 hover:border-gold/40 transition-all cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">Generate Report</h3>
                <p className="text-sm text-muted-foreground">Create professional documents</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Documents */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Recent Documents</h2>
            <Button variant="outline" className="text-gold border-gold/50 hover:bg-gold/5">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Document Card 1 */}
            <Card className="border-gold/20 hover:border-gold/40 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">VFS Wafi - Baseline Program</CardTitle>
                    <CardDescription className="text-xs mt-1">Created Jan 15, 2024</CardDescription>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Share2 className="w-3 h-3 mr-1" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Document Card 2 */}
            <Card className="border-gold/20 hover:border-gold/40 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">VFS Wafi - Procurement Log</CardTitle>
                    <CardDescription className="text-xs mt-1">Created Jan 15, 2024</CardDescription>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Share2 className="w-3 h-3 mr-1" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Document Card 3 */}
            <Card className="border-gold/20 hover:border-gold/40 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">VFS Wafi - Budget Estimation</CardTitle>
                    <CardDescription className="text-xs mt-1">Created Jan 10, 2024</CardDescription>
                  </div>
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    <Clock className="w-3 h-3 mr-1" />
                    Draft
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Share2 className="w-3 h-3 mr-1" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Project Overview & Key Metrics */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Project Overview & Key Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-gold/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Total Projects</p>
                    <p className="text-3xl font-bold text-foreground">4</p>
                    <p className="text-xs text-muted-foreground mt-1">1 active projects</p>
                  </div>
                  <FileText className="w-8 h-8 text-gold/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gold/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Active Tasks</p>
                    <p className="text-3xl font-bold text-foreground">0</p>
                    <p className="text-xs text-muted-foreground mt-1">2 pending tasks</p>
                  </div>
                  <Clock className="w-8 h-8 text-gold/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gold/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Total Budget</p>
                    <p className="text-3xl font-bold text-foreground">$10.0M</p>
                    <p className="text-xs text-muted-foreground mt-1">$0.0M spent</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-gold/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gold/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Completed</p>
                    <p className="text-3xl font-bold text-foreground">0%</p>
                    <p className="text-xs text-muted-foreground mt-1">0% completion rate</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-gold/30" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Recent Activity</h2>
          <Card className="border-gold/20">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
                    <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">Document Generated</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        VFS Wafi - Baseline Program was generated successfully
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">2 hours ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
