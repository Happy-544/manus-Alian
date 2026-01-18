/**
 * Conflict Resolution Page
 * Handles BOQ vs Drawings conflict resolution in the document workflow
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  ConflictResolution,
  type ConflictItem,
} from "@/components/ConflictResolution";

interface ConflictResolutionPageProps {
  projectId: number;
  boqFile?: File;
  drawingFile?: File;
  onComplete?: (resolvedConflicts: ConflictItem[]) => void;
  onBack?: () => void;
  onNext?: () => void;
}

export function ConflictResolutionPage({
  projectId,
  boqFile,
  drawingFile,
  onComplete,
  onBack,
  onNext,
}: ConflictResolutionPageProps) {
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allResolved, setAllResolved] = useState(false);

  // Load sample conflicts on component mount
  useEffect(() => {
    const loadConflicts = async () => {
      try {
        setIsLoading(true);
        // In production, this would call an API endpoint to analyze BOQ and Drawing files
        // For now, we'll use sample data
        const sampleConflicts = generateSampleConflicts();
        setConflicts(sampleConflicts);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load conflicts");
      } finally {
        setIsLoading(false);
      }
    };

    loadConflicts();
  }, [projectId, boqFile, drawingFile]);

  const handleResolveConflict = (conflictId: string, resolution: string) => {
    setConflicts((prevConflicts) =>
      prevConflicts.map((conflict) =>
        conflict.id === conflictId
          ? { ...conflict, resolved: true, resolution }
          : conflict
      )
    );

    // Check if all conflicts are resolved
    const updatedConflicts = conflicts.map((conflict) =>
      conflict.id === conflictId
        ? { ...conflict, resolved: true, resolution }
        : conflict
    );
    const allResolved = updatedConflicts.every((c) => c.resolved);
    setAllResolved(allResolved);
  };

  const handleResolveAll = () => {
    setConflicts((prevConflicts) =>
      prevConflicts.map((conflict) =>
        conflict.resolved
          ? conflict
          : { ...conflict, resolved: true, resolution: "accept_boq" }
      )
    );
    setAllResolved(true);
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(conflicts);
    }
    if (onNext) {
      onNext();
    }
  };

  return (
    <div className="w-full space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Conflict Resolution</h1>
        <p className="text-muted-foreground">
          Review and resolve discrepancies between BOQ and Drawing documents
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gold" />
          <p className="text-muted-foreground">Analyzing BOQ and Drawing files...</p>
        </Card>
      )}

      {/* Conflict Resolution Component */}
      {!isLoading && !error && (
        <>
          <ConflictResolution
            conflicts={conflicts}
            onResolve={handleResolveConflict}
            onResolveAll={handleResolveAll}
            isLoading={isLoading}
          />

          {/* Action Buttons */}
          <div className="flex justify-between gap-4 pt-6 border-t">
            <Button
              variant="outline"
              onClick={onBack}
              className="gap-2"
            >
              ← Back
            </Button>

            <div className="flex gap-2">
              {allResolved && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    All conflicts resolved
                  </span>
                </div>
              )}
              <Button
                onClick={handleComplete}
                disabled={!allResolved}
                className="gap-2"
              >
                Continue to Gap Completion →
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Generate sample conflicts for demonstration
 */
function generateSampleConflicts(): ConflictItem[] {
  return [
    {
      id: "conflict-1",
      itemDescription: "Ceramic Floor Tiles - Premium Grade",
      category: "Flooring",
      boqData: {
        quantity: 200,
        unit: "sqm",
        unitRate: 120,
        supplier: "Al Futtaim Ceramics",
        location: "Ground Floor",
      },
      drawingData: {
        quantity: 180,
        unit: "sqm",
        location: "Ground Floor - Lobby Area",
        notes: "High traffic area requires premium grade",
      },
      conflictType: "quantity_mismatch",
      severity: "high",
      resolved: false,
    },
    {
      id: "conflict-2",
      itemDescription: "Gypsum Board Partition System",
      category: "Partitioning",
      boqData: {
        quantity: 150,
        unit: "sqm",
        unitRate: 85,
        supplier: "Emirates Gypsum",
        location: "Level 1-3",
      },
      drawingData: {
        quantity: 150,
        unit: "sqm",
        location: "Levels 1-3, Zones A & B",
        notes: "Fire-rated partition required in Zone A",
      },
      conflictType: "specification_mismatch",
      severity: "medium",
      resolved: false,
    },
    {
      id: "conflict-3",
      itemDescription: "Aluminum Window Frames",
      category: "Fenestration",
      boqData: {
        quantity: 45,
        unit: "units",
        unitRate: 450,
        supplier: "Gulf Aluminum",
        location: "Facade",
      },
      drawingData: {
        quantity: 48,
        unit: "units",
        location: "Facade - All Elevations",
        notes: "Includes 3 additional corner windows",
      },
      conflictType: "quantity_mismatch",
      severity: "medium",
      resolved: false,
    },
    {
      id: "conflict-4",
      itemDescription: "Paint - Interior Walls",
      category: "Finishing",
      boqData: {
        quantity: 500,
        unit: "liters",
        unitRate: 35,
        supplier: "Nippon Paint",
        location: "All Interior",
      },
      drawingData: {
        location: "All Interior Walls",
        notes: "Specification: Acrylic emulsion, 2 coats",
      },
      conflictType: "specification_mismatch",
      severity: "low",
      resolved: false,
    },
    {
      id: "conflict-5",
      itemDescription: "Electrical Conduit & Wiring",
      category: "MEP",
      boqData: {
        quantity: 2000,
        unit: "meters",
        unitRate: 15,
        supplier: "Schneider Electric",
        location: "Throughout",
      },
      drawingData: {
        location: "All floors - Conduit routing per drawing",
        notes: "Item found in Drawing but not in BOQ",
      },
      conflictType: "missing_in_boq",
      severity: "high",
      resolved: false,
    },
    {
      id: "conflict-6",
      itemDescription: "Marble Cladding - Lobby",
      category: "Cladding",
      boqData: {
        quantity: 80,
        unit: "sqm",
        unitRate: 250,
        supplier: "Emirates Marble",
        location: "Lobby Area",
      },
      drawingData: {
        location: "Lobby - Feature Wall Only",
        notes: "Item in BOQ but not shown in current drawing revision",
      },
      conflictType: "missing_in_drawing",
      severity: "medium",
      resolved: false,
    },
  ];
}
