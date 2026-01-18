/**
 * Gap Completion Page Component
 * Manages the complete gap completion workflow with analysis, suggestions, and progress tracking
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Zap,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { GapCompletionForm, type BOQLineItem, type GapAnalysisResult } from "./GapCompletionForm";
import { trpc } from "@/lib/trpc";

interface GapCompletionPageProps {
  projectId: number;
  boqItems: BOQLineItem[];
  onComplete?: (completedItems: BOQLineItem[]) => void;
  onSkip?: () => void;
}

export function GapCompletionPage({
  projectId,
  boqItems,
  onComplete,
  onSkip,
}: GapCompletionPageProps) {
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysisResult[]>([]);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isAnalyzing, isLoadingSuggestions] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "high" | "medium" | "low">("all");

  // tRPC hooks
  const analyzeGapsMutation = trpc.boqGap.analyzeGaps.useMutation();
  const generateSuggestionsMutation = trpc.boqGap.generateSuggestions.useMutation();
  const validateItemMutation = trpc.boqGap.validateItem.useMutation();

  // Analyze gaps on mount
  useEffect(() => {
    if (boqItems.length > 0) {
      handleAnalyzeGaps();
    }
  }, [boqItems]);

  const handleAnalyzeGaps = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeGapsMutation.mutateAsync({
        projectId,
        items: boqItems,
      });

      if (result.success && result.gaps) {
        setGapAnalysis(result.gaps);
      }
    } catch (error) {
      console.error("Error analyzing gaps:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadSuggestions = async (itemId: string) => {
    const item = boqItems.find((i) => i.id === itemId);
    const gap = gapAnalysis.find((g) => g.itemId === itemId);

    if (!item || !gap) return;

    setIsSavingItem(itemId);
    try {
      const result = await generateSuggestionsMutation.mutateAsync({
        projectId,
        item,
        fields: gap.missingFields,
      });

      if (result.success && result.suggestions) {
        // Update gap analysis with suggestions
        setGapAnalysis((prev) =>
          prev.map((g) =>
            g.itemId === itemId
              ? { ...g, suggestions: result.suggestions as any }
              : g
          )
        );
      }
    } catch (error) {
      console.error("Error loading suggestions:", error);
    } finally {
      setIsSavingItem(null);
    }
  };

  const handleCompleteItem = async (completedItem: BOQLineItem) => {
    setIsSavingItem(completedItem.id);
    try {
      // Validate the completed item
      const validation = await validateItemMutation.mutateAsync({
        projectId,
        item: completedItem,
      });

      if (validation.isValid) {
        setCompletedItems((prev) => new Set([...prev, completedItem.id]));
      }
    } catch (error) {
      console.error("Error validating item:", error);
    } finally {
      setIsSavingItem(null);
    }
  };

  const toggleItemExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Filter gaps by severity
  const filteredGaps = gapAnalysis.filter((gap) => {
    if (activeTab === "all") return true;
    return gap.severity.toLowerCase() === activeTab;
  });

  // Calculate statistics
  const totalGaps = gapAnalysis.length;
  const highSeverityCount = gapAnalysis.filter((g) => g.severity === "HIGH").length;
  const mediumSeverityCount = gapAnalysis.filter((g) => g.severity === "MEDIUM").length;
  const lowSeverityCount = gapAnalysis.filter((g) => g.severity === "LOW").length;
  const completionPercentage = totalGaps > 0 ? Math.round((completedItems.size / totalGaps) * 100) : 0;

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-gold animate-spin mb-4" />
        <p className="text-sm font-semibold text-foreground">Analyzing BOQ items for missing data...</p>
        <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
      </div>
    );
  }

  if (totalGaps === 0) {
    return (
      <Alert className="border-green-500/50 bg-green-500/10">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <AlertDescription className="text-green-600 ml-2">
          <strong>Perfect!</strong> All BOQ items are complete. No gaps detected.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Complete Missing Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gold">{totalGaps}</p>
                <p className="text-xs text-muted-foreground mt-1">Items with gaps</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{highSeverityCount}</p>
                <p className="text-xs text-muted-foreground mt-1">High priority</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-600">{mediumSeverityCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Medium priority</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{lowSeverityCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Low priority</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Overall Progress */}
      <Card className="border-gold/20 bg-gradient-to-r from-gold/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Overall Progress</CardTitle>
            <span className="text-2xl font-bold text-gold">{completionPercentage}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="h-3" />
          <p className="text-xs text-muted-foreground mt-3">
            {completedItems.size} of {totalGaps} items completed
          </p>
        </CardContent>
      </Card>

      {/* Severity Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "all", label: "All", count: totalGaps },
          { id: "high", label: "High Priority", count: highSeverityCount, color: "text-red-600" },
          { id: "medium", label: "Medium Priority", count: mediumSeverityCount, color: "text-amber-600" },
          { id: "low", label: "Low Priority", count: lowSeverityCount, color: "text-blue-600" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-semibold ${
              activeTab === tab.id
                ? "border-gold bg-gold/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:border-gold/50"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 font-bold ${tab.color || "text-gold"}`}>({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Gap Forms List */}
      <div className="space-y-4">
        {filteredGaps.map((gap) => {
          const item = boqItems.find((i) => i.id === gap.itemId);
          const isExpanded = expandedItems.has(gap.itemId);
          const isCompleted = completedItems.has(gap.itemId);

          if (!item) return null;

          return (
            <div key={gap.itemId}>
              {/* Collapsed View */}
              {!isExpanded && (
                <Card
                  className={`border-2 cursor-pointer hover:border-gold/50 transition-all ${
                    isCompleted
                      ? "border-green-500/20 bg-green-500/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => toggleItemExpanded(gap.itemId)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-foreground">{item.description}</p>
                          {isCompleted && (
                            <Badge variant="outline" className="border-green-500 text-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                          <Badge
                            variant={
                              gap.severity === "HIGH"
                                ? "destructive"
                                : gap.severity === "MEDIUM"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {gap.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {gap.missingFields.length} field{gap.missingFields.length > 1 ? "s" : ""} to complete
                        </p>
                      </div>
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Expanded View */}
              {isExpanded && (
                <div className="space-y-4">
                  <GapCompletionForm
                    item={item}
                    gap={gap}
                    onComplete={handleCompleteItem}
                    isLoading={isSavingItem === gap.itemId}
                    onLoadSuggestions={() => handleLoadSuggestions(gap.itemId)}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => toggleItemExpanded(gap.itemId)}
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Collapse
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 border-t border-border">
        <Button variant="outline" onClick={onSkip}>
          Skip for Now
        </Button>
        <Button
          onClick={() => onComplete?.(Array.from(completedItems).map((id) => boqItems.find((i) => i.id === id)!).filter(Boolean))}
          disabled={completedItems.size === 0}
          className="ml-auto bg-gold text-primary hover:bg-gold/90 flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Continue ({completedItems.size}/{totalGaps} completed)
        </Button>
      </div>
    </div>
  );
}
