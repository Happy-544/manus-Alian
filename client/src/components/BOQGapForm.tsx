/**
 * BOQ Gap Completion Smart Form Components
 * Intelligent forms for completing missing BOQ data with AI suggestions
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  Zap,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface BOQItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  supplier?: string;
  leadTime?: number;
  category: string;
  material?: string;
  brand?: string;
}

export interface GapSuggestion {
  field: string;
  suggestedValue: any;
  confidence: number;
  source: string;
  alternatives?: any[];
}

interface BOQGapFormProps {
  item: BOQItem;
  gaps: string[];
  suggestions: Record<string, any>;
  onComplete: (updatedItem: BOQItem) => void;
  onSkip: () => void;
}

/**
 * Single field gap completion form
 */
export function BOQGapFormField({
  item,
  field,
  suggestion,
  onUpdate,
}: {
  item: BOQItem;
  field: string;
  suggestion?: any;
  onUpdate: (field: string, value: any) => void;
}) {
  const [value, setValue] = useState(item[field as keyof BOQItem] || "");
  const [showAlternatives, setShowAlternatives] = useState(false);

  const handleAcceptSuggestion = () => {
    if (suggestion?.suggestedValue) {
      setValue(suggestion.suggestedValue);
      onUpdate(field, suggestion.suggestedValue);
    }
  };

  const getFieldLabel = () => {
    const labels: Record<string, string> = {
      unitPrice: "Unit Price (AED)",
      supplier: "Supplier Name",
      leadTime: "Lead Time (Days)",
      material: "Material",
      brand: "Brand/Manufacturer",
    };
    return labels[field] || field;
  };

  const getFieldDescription = () => {
    const descriptions: Record<string, string> = {
      unitPrice: "Price per unit in AED",
      supplier: "Primary supplier for this item",
      leadTime: "Expected delivery time in days",
      material: "Material composition or type",
      brand: "Brand or manufacturer name",
    };
    return descriptions[field] || "";
  };

  return (
    <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-gold/20">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">
          {getFieldLabel()}
        </label>
        {suggestion && (
          <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30">
            <Lightbulb className="w-3 h-3 mr-1" />
            AI Suggestion
          </Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{getFieldDescription()}</p>

      {/* Input Field */}
      <div className="space-y-2">
        {field === "leadTime" ? (
          <Input
            type="number"
            value={value}
            onChange={(e) => {
              setValue(Number(e.target.value));
              onUpdate(field, Number(e.target.value));
            }}
            placeholder={suggestion?.suggestedValue || "Enter value"}
            className="border-gold/20"
          />
        ) : field === "unitPrice" ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gold">AED</span>
            <Input
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => {
                setValue(Number(e.target.value));
                onUpdate(field, Number(e.target.value));
              }}
              placeholder={suggestion?.suggestedValue || "0.00"}
              className="border-gold/20"
            />
          </div>
        ) : (
          <Input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              onUpdate(field, e.target.value);
            }}
            placeholder={suggestion?.suggestedValue || "Enter value"}
            className="border-gold/20"
          />
        )}
      </div>

      {/* Suggestion Box */}
      {suggestion && (
        <div className="bg-gold/10 border border-gold/30 rounded p-3 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Suggested: {suggestion.suggestedValue}
                </p>
                <p className="text-xs text-muted-foreground">
                  Confidence: {Math.round(suggestion.confidence * 100)}% • Source: {suggestion.source}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAcceptSuggestion}
              className="text-gold hover:bg-gold/10"
            >
              Accept
            </Button>
          </div>

          {/* Alternatives */}
          {suggestion.alternatives && suggestion.alternatives.length > 0 && (
            <div className="border-t border-gold/20 pt-2">
              <button
                onClick={() => setShowAlternatives(!showAlternatives)}
                className="flex items-center gap-2 text-xs text-gold hover:text-gold/80 font-semibold"
              >
                {showAlternatives ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                View {suggestion.alternatives.length} alternatives
              </button>

              {showAlternatives && (
                <div className="mt-2 space-y-2">
                  {suggestion.alternatives.slice(0, 3).map((alt: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setValue(alt);
                        onUpdate(field, alt);
                      }}
                      className="w-full text-left p-2 rounded hover:bg-gold/20 text-sm text-foreground transition-colors"
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Complete BOQ gap form for a single item
 */
export function BOQGapForm({
  item,
  gaps,
  suggestions,
  onComplete,
  onSkip,
}: BOQGapFormProps) {
  const [updatedItem, setUpdatedItem] = useState<BOQItem>(item);
  const [currentGapIndex, setCurrentGapIndex] = useState(0);
  const [completedGaps, setCompletedGaps] = useState<Set<string>>(new Set());

  const currentGap = gaps[currentGapIndex];
  const progress = ((completedGaps.size + 1) / gaps.length) * 100;

  const handleFieldUpdate = (field: string, value: any) => {
    setUpdatedItem((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Mark gap as completed if value is provided
    if (value && value !== "") {
      setCompletedGaps((prev) => new Set([...prev, field]));
    }
  };

  const handleNext = () => {
    if (currentGapIndex < gaps.length - 1) {
      setCurrentGapIndex(currentGapIndex + 1);
    } else {
      onComplete(updatedItem);
    }
  };

  const handlePrevious = () => {
    if (currentGapIndex > 0) {
      setCurrentGapIndex(currentGapIndex - 1);
    }
  };

  return (
    <Card className="border-gold/20">
      <CardHeader>
        <div className="space-y-2">
          <CardTitle className="text-lg">Complete Missing Information</CardTitle>
          <CardDescription>
            Item: {item.description}
          </CardDescription>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">
              Step {currentGapIndex + 1} of {gaps.length}
            </span>
            <span className="text-sm font-semibold text-gold">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Gap Field */}
        <BOQGapFormField
          item={updatedItem}
          field={currentGap}
          suggestion={suggestions[currentGap]}
          onUpdate={handleFieldUpdate}
        />

        {/* Info Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <p className="font-semibold mb-1">Why is this needed?</p>
            <p className="text-muted-foreground">
              {currentGap === "unitPrice" &&
                "Unit prices are essential for accurate budget estimation and cost tracking."}
              {currentGap === "supplier" &&
                "Supplier information helps with procurement planning and lead time management."}
              {currentGap === "leadTime" &&
                "Lead times are critical for project scheduling and timeline management."}
              {currentGap === "material" &&
                "Material specifications ensure quality control and proper installation."}
              {currentGap === "brand" &&
                "Brand information helps maintain consistency and quality standards."}
            </p>
          </div>
        </div>

        {/* Completed Gaps Summary */}
        {completedGaps.size > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Completed:</p>
            <div className="flex flex-wrap gap-2">
              {Array.from(completedGaps).map((gap) => (
                <Badge key={gap} variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {gap}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <div className="border-t border-gold/20 p-6 flex justify-between gap-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentGapIndex === 0}
            className="border-gold/20"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={onSkip}
            className="border-gold/20 text-muted-foreground"
          >
            Skip Item
          </Button>
        </div>

        <Button
          onClick={handleNext}
          className="bg-gold text-primary hover:bg-gold/90"
        >
          {currentGapIndex === gaps.length - 1 ? "Complete" : "Next"}
        </Button>
      </div>
    </Card>
  );
}

/**
 * Multi-item gap completion dialog
 */
export function BOQGapCompletionDialog({
  isOpen,
  items,
  gapsByItem,
  suggestionsByItem,
  onComplete,
  onClose,
}: {
  isOpen: boolean;
  items: BOQItem[];
  gapsByItem: Record<string, string[]>;
  suggestionsByItem: Record<string, Record<string, any>>;
  onComplete: (updatedItems: BOQItem[]) => void;
  onClose: () => void;
}) {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [updatedItems, setUpdatedItems] = useState<BOQItem[]>(items);

  const itemsWithGaps = items.filter((item) => gapsByItem[item.id]?.length > 0);
  const currentItem = itemsWithGaps[currentItemIndex];

  const handleItemComplete = (updatedItem: BOQItem) => {
    setUpdatedItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );

    if (currentItemIndex < itemsWithGaps.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    } else {
      onComplete(updatedItems);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-gold/20">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">
            Complete BOQ Information
          </DialogTitle>
          <DialogDescription>
            {itemsWithGaps.length} items need additional information
          </DialogDescription>
        </DialogHeader>

        {currentItem && (
          <div className="py-6">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Item {currentItemIndex + 1} of {itemsWithGaps.length}</span>
                <span>{Math.round(((currentItemIndex + 1) / itemsWithGaps.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold transition-all duration-300"
                  style={{ width: `${((currentItemIndex + 1) / itemsWithGaps.length) * 100}%` }}
                />
              </div>
            </div>

            <BOQGapForm
              item={currentItem}
              gaps={gapsByItem[currentItem.id] || []}
              suggestions={suggestionsByItem[currentItem.id] || {}}
              onComplete={handleItemComplete}
              onSkip={() => {
                if (currentItemIndex < itemsWithGaps.length - 1) {
                  setCurrentItemIndex(currentItemIndex + 1);
                } else {
                  onComplete(updatedItems);
                  onClose();
                }
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
