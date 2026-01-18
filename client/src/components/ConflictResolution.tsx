/**
 * Conflict Resolution Component
 * Handles BOQ vs Drawings discrepancies with side-by-side comparison
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

export interface ConflictItem {
  id: string;
  itemDescription: string;
  category: string;
  boqData: {
    quantity: number;
    unit: string;
    unitRate?: number;
    supplier?: string;
    location?: string;
  };
  drawingData: {
    quantity?: number;
    unit?: string;
    location?: string;
    notes?: string;
  };
  conflictType: "quantity_mismatch" | "location_mismatch" | "missing_in_boq" | "missing_in_drawing" | "specification_mismatch";
  severity: "high" | "medium" | "low";
  resolved: boolean;
  resolution?: string;
}

export interface ConflictResolutionProps {
  conflicts: ConflictItem[];
  onResolve: (conflictId: string, resolution: string) => void;
  onResolveAll: () => void;
  isLoading?: boolean;
}

export function ConflictResolution({
  conflicts,
  onResolve,
  onResolveAll,
  isLoading = false,
}: ConflictResolutionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<Record<string, string>>({});

  const unresolvedConflicts = conflicts.filter((c) => !c.resolved);
  const resolvedConflicts = conflicts.filter((c) => c.resolved);
  const highSeverityCount = unresolvedConflicts.filter((c) => c.severity === "high").length;

  const handleResolve = (conflictId: string, resolution: string) => {
    onResolve(conflictId, resolution);
    setSelectedResolution((prev) => ({ ...prev, [conflictId]: resolution }));
  };

  const getConflictIcon = (severity: string) => {
    if (severity === "high") {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
    if (severity === "medium") {
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
    return <AlertTriangle className="w-5 h-5 text-blue-500" />;
  };

  const getConflictDescription = (conflict: ConflictItem): string => {
    switch (conflict.conflictType) {
      case "quantity_mismatch":
        return `BOQ shows ${conflict.boqData.quantity} ${conflict.boqData.unit}, but Drawing shows ${conflict.drawingData.quantity} ${conflict.drawingData.unit}`;
      case "location_mismatch":
        return `BOQ location: ${conflict.boqData.location || "Not specified"} vs Drawing location: ${conflict.drawingData.location || "Not specified"}`;
      case "missing_in_boq":
        return `Item found in Drawing but missing in BOQ`;
      case "missing_in_drawing":
        return `Item in BOQ but not referenced in Drawing`;
      case "specification_mismatch":
        return `Specification differences between BOQ and Drawing`;
      default:
        return "Conflict detected";
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <p className="text-sm text-blue-600 font-semibold mb-1">Total Conflicts</p>
          <p className="text-2xl font-bold text-blue-900">{conflicts.length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <p className="text-sm text-red-600 font-semibold mb-1">High Severity</p>
          <p className="text-2xl font-bold text-red-900">{highSeverityCount}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <p className="text-sm text-amber-600 font-semibold mb-1">Unresolved</p>
          <p className="text-2xl font-bold text-amber-900">{unresolvedConflicts.length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <p className="text-sm text-green-600 font-semibold mb-1">Resolved</p>
          <p className="text-2xl font-bold text-green-900">{resolvedConflicts.length}</p>
        </Card>
      </div>

      {/* Alert for High Severity Conflicts */}
      {highSeverityCount > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {highSeverityCount} high-severity conflict{highSeverityCount !== 1 ? "s" : ""} require{highSeverityCount === 1 ? "s" : ""} immediate attention
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs for Unresolved and Resolved */}
      <Tabs defaultValue="unresolved" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unresolved" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Unresolved ({unresolvedConflicts.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Resolved ({resolvedConflicts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unresolved" className="space-y-4">
          {unresolvedConflicts.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-foreground mb-2">All Conflicts Resolved!</p>
              <p className="text-muted-foreground">All BOQ and Drawing discrepancies have been resolved.</p>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  {unresolvedConflicts.length} conflict{unresolvedConflicts.length !== 1 ? "s" : ""} to resolve
                </p>
                <Button
                  onClick={onResolveAll}
                  disabled={isLoading || unresolvedConflicts.length === 0}
                  className="gap-2"
                >
                  Resolve All
                </Button>
              </div>
              <div className="space-y-3">
                {unresolvedConflicts.map((conflict) => (
                  <ConflictCard
                    key={conflict.id}
                    conflict={conflict}
                    isExpanded={expandedId === conflict.id}
                    onToggle={() =>
                      setExpandedId(expandedId === conflict.id ? null : conflict.id)
                    }
                    onResolve={handleResolve}
                    selectedResolution={selectedResolution[conflict.id]}
                    getConflictIcon={getConflictIcon}
                    getConflictDescription={getConflictDescription}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedConflicts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No resolved conflicts yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {resolvedConflicts.map((conflict) => (
                <Card key={conflict.id} className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{conflict.itemDescription}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Resolution: {conflict.resolution || "Accepted"}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Individual Conflict Card Component
 */
interface ConflictCardProps {
  conflict: ConflictItem;
  isExpanded: boolean;
  onToggle: () => void;
  onResolve: (conflictId: string, resolution: string) => void;
  selectedResolution?: string;
  getConflictIcon: (severity: string) => React.ReactNode;
  getConflictDescription: (conflict: ConflictItem) => string;
}

function ConflictCard({
  conflict,
  isExpanded,
  onToggle,
  onResolve,
  selectedResolution,
  getConflictIcon,
  getConflictDescription,
}: ConflictCardProps) {
  const resolutionOptions = [
    { value: "accept_boq", label: "Accept BOQ Data" },
    { value: "accept_drawing", label: "Accept Drawing Data" },
    { value: "manual_review", label: "Manual Review Required" },
    { value: "split_difference", label: "Use Average/Split" },
  ];

  return (
    <Card className={`p-4 border-l-4 ${
      conflict.severity === "high"
        ? "border-l-red-500 bg-red-50"
        : conflict.severity === "medium"
          ? "border-l-amber-500 bg-amber-50"
          : "border-l-blue-500 bg-blue-50"
    }`}>
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-start gap-4 flex-1 text-left">
          {getConflictIcon(conflict.severity)}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-foreground">{conflict.itemDescription}</p>
              <Badge variant="outline" className="text-xs">
                {conflict.category}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${
                  conflict.severity === "high"
                    ? "bg-red-100 text-red-800 border-red-300"
                    : conflict.severity === "medium"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-blue-100 text-blue-800 border-blue-300"
                }`}
              >
                {conflict.severity.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {getConflictDescription(conflict)}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4 border-t pt-4">
          {/* Side-by-side Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BOQ Data */}
            <div className="bg-white p-3 rounded border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2">BOQ Data</p>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Quantity:</span>{" "}
                  <span className="font-medium">
                    {conflict.boqData.quantity} {conflict.boqData.unit}
                  </span>
                </p>
                {conflict.boqData.unitRate && (
                  <p>
                    <span className="text-muted-foreground">Unit Rate:</span>{" "}
                    <span className="font-medium">AED {conflict.boqData.unitRate}</span>
                  </p>
                )}
                {conflict.boqData.supplier && (
                  <p>
                    <span className="text-muted-foreground">Supplier:</span>{" "}
                    <span className="font-medium">{conflict.boqData.supplier}</span>
                  </p>
                )}
                {conflict.boqData.location && (
                  <p>
                    <span className="text-muted-foreground">Location:</span>{" "}
                    <span className="font-medium">{conflict.boqData.location}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Drawing Data */}
            <div className="bg-white p-3 rounded border border-amber-200">
              <p className="text-sm font-semibold text-amber-900 mb-2">Drawing Data</p>
              <div className="space-y-1 text-sm">
                {conflict.drawingData.quantity ? (
                  <p>
                    <span className="text-muted-foreground">Quantity:</span>{" "}
                    <span className="font-medium">
                      {conflict.drawingData.quantity} {conflict.drawingData.unit}
                    </span>
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">Not specified</p>
                )}
                {conflict.drawingData.location && (
                  <p>
                    <span className="text-muted-foreground">Location:</span>{" "}
                    <span className="font-medium">{conflict.drawingData.location}</span>
                  </p>
                )}
                {conflict.drawingData.notes && (
                  <p>
                    <span className="text-muted-foreground">Notes:</span>{" "}
                    <span className="font-medium">{conflict.drawingData.notes}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Resolution Options */}
          <div className="bg-white p-3 rounded border">
            <p className="text-sm font-semibold text-foreground mb-3">Resolve Conflict</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {resolutionOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedResolution === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => onResolve(conflict.id, option.value)}
                  className="justify-start"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
