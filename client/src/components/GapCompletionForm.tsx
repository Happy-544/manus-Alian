/**
 * Gap Completion Form Component
 * Displays a single BOQ item with missing fields and AI suggestions
 * Allows users to fill in missing data with real-time validation
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle, Lightbulb, Loader2, TrendingUp, ChevronDown } from "lucide-react";
import { SupplierSelector, type Supplier } from "./SupplierSelector";

export interface BOQLineItem {
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
  location?: string;
  drawingReference?: string;
}

export interface GapAnalysisResult {
  itemId: string;
  missingFields: string[];
  severity: "HIGH" | "MEDIUM" | "LOW";
  suggestions?: {
    unitPrice?: {
      suggestedPrice: number;
      priceRange: { min: number; max: number };
      confidence: number;
      source: string;
    };
    supplier?: {
      suppliers: Array<{
        name: string;
        rating: number;
        leadTime: number;
        minOrder: number;
        pricePerUnit: number;
        contact: string;
        specialization: string[];
      }>;
      confidence: number;
    };
    leadTime?: {
      suggestedLeadTime: number;
      range: { min: number; max: number };
      confidence: number;
      factors: string[];
    };
  };
}

interface GapCompletionFormProps {
  item: BOQLineItem;
  gap: GapAnalysisResult;
  onComplete: (completedItem: BOQLineItem) => void;
  isLoading?: boolean;
  onLoadSuggestions?: () => void;
}

export function GapCompletionForm({
  item,
  gap,
  onComplete,
  isLoading = false,
  onLoadSuggestions,
}: GapCompletionFormProps) {
  const [formData, setFormData] = useState<BOQLineItem>(item);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSupplierSelector, setShowSupplierSelector] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    const totalFields = gap.missingFields.length;
    const completedFields = gap.missingFields.filter((field) => {
      const value = formData[field as keyof BOQLineItem];
      return value !== undefined && value !== null && value !== "";
    }).length;
    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  }, [formData, gap.missingFields]);

  const validateField = (field: string, value: any): string | null => {
    switch (field) {
      case "unitPrice":
        if (value === undefined || value === null || value === "") return "Unit price is required";
        if (isNaN(value) || Number(value) <= 0) return "Unit price must be greater than 0";
        return null;
      case "supplier":
        if (!value || value.trim() === "") return "Supplier is required";
        return null;
      case "leadTime":
        if (value === undefined || value === null || value === "") return "Lead time is required";
        if (isNaN(value) || Number(value) <= 0) return "Lead time must be greater than 0";
        return null;
      case "material":
        if (!value || value.trim() === "") return "Material is required";
        return null;
      case "brand":
        if (!value || value.trim() === "") return "Brand is required";
        return null;
      default:
        return null;
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validate field
    const error = validateField(field, value);
    setValidationErrors((prev) => {
      if (error) {
        return { ...prev, [field]: error };
      } else {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
    });
  };

  const handleSubmit = () => {
    // Validate all missing fields
    const errors: Record<string, string> = {};
    for (const field of gap.missingFields) {
      const error = validateField(field, formData[field as keyof BOQLineItem]);
      if (error) {
        errors[field] = error;
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // All validations passed
    onComplete(formData);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return "border-red-500/20 bg-red-500/10";
      case "MEDIUM":
        return "border-amber-500/20 bg-amber-500/10";
      case "LOW":
        return "border-blue-500/20 bg-blue-500/10";
      default:
        return "border-border";
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return "destructive";
      case "MEDIUM":
        return "secondary";
      case "LOW":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Card className={`border-2 ${getSeverityColor(gap.severity)}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{item.description}</CardTitle>
            <CardDescription className="mt-1">
              {item.quantity} {item.unit} • {item.category}
              {item.location && ` • ${item.location}`}
            </CardDescription>
          </div>
          <Badge variant={getSeverityBadgeVariant(gap.severity)}>
            {gap.severity} Priority
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Completion</span>
            <span className="text-xs font-semibold text-foreground">{completionPercentage}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold to-gold/60 transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Missing Fields Alert */}
        {gap.missingFields.length > 0 && (
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-600">
              {gap.missingFields.length} field{gap.missingFields.length > 1 ? "s" : ""} need to be completed
            </AlertDescription>
          </Alert>
        )}

        {/* Form Fields */}
        <div className="space-y-5">
          {gap.missingFields.includes("unitPrice") && (
            <div>
              <label className="block text-sm font-semibold mb-2">Unit Price (AED)</label>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Enter unit price"
                  value={formData.unitPrice || ""}
                  onChange={(e) => handleFieldChange("unitPrice", e.target.value ? Number(e.target.value) : undefined)}
                  className={`w-full px-3 py-2 border rounded-md text-sm ${
                    validationErrors.unitPrice
                      ? "border-red-500 bg-red-50"
                      : "border-border"
                  }`}
                />
                {validationErrors.unitPrice && (
                  <p className="text-xs text-red-600">{validationErrors.unitPrice}</p>
                )}
                {gap.suggestions?.unitPrice && (
                  <div className="p-3 bg-muted rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-muted-foreground">AI Suggestion</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-gold" />
                        <span className="text-xs text-gold">
                          {Math.round(gap.suggestions.unitPrice.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      AED {gap.suggestions.unitPrice.suggestedPrice.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: AED {gap.suggestions.unitPrice.priceRange.min.toFixed(2)} - AED{" "}
                      {gap.suggestions.unitPrice.priceRange.max.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Source: {gap.suggestions.unitPrice.source}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 h-7 text-xs"
                      onClick={() =>
                        handleFieldChange("unitPrice", gap.suggestions?.unitPrice?.suggestedPrice)
                      }
                    >
                      Use Suggestion
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {gap.missingFields.includes("supplier") && (
            <div>
              <label className="block text-sm font-semibold mb-2">Supplier</label>
              <div className="space-y-2">
                {/* Display selected supplier or input field */}
                {formData.supplier ? (
                  <div className="p-3 bg-muted rounded-md border border-gold/50 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{formData.supplier}</p>
                      <p className="text-xs text-muted-foreground">Selected supplier</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        handleFieldChange("supplier", undefined);
                        setShowSupplierSelector(false);
                      }}
                      className="h-7 text-xs"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Enter supplier name or select from database"
                    value={formData.supplier || ""}
                    onChange={(e) => handleFieldChange("supplier", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm ${
                      validationErrors.supplier
                        ? "border-red-500 bg-red-50"
                        : "border-border"
                    }`}
                  />
                )}
                
                {/* Supplier Selector Toggle */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSupplierSelector(!showSupplierSelector)}
                  className="w-full h-8 text-xs"
                >
                  <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${showSupplierSelector ? "rotate-180" : ""}`} />
                  {showSupplierSelector ? "Hide Supplier Database" : "Browse Supplier Database"}
                </Button>

                {/* Supplier Selector Component */}
                {showSupplierSelector && (
                  <div className="p-3 bg-muted/50 rounded-md border border-border">
                    <SupplierSelector
                      category={item.category}
                      onSelect={(supplier: Supplier) => {
                        handleFieldChange("supplier", supplier.name);
                        if (supplier.leadTime && !formData.leadTime) {
                          handleFieldChange("leadTime", supplier.leadTime);
                        }
                        setShowSupplierSelector(false);
                      }}
                      selectedSupplierId={undefined}
                      maxResults={5}
                      showSearch={true}
                    />
                  </div>
                )}

                {validationErrors.supplier && (
                  <p className="text-xs text-red-600">{validationErrors.supplier}</p>
                )}

                {/* AI Suggestions Fallback */}
                {!showSupplierSelector && gap.suggestions?.supplier && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">AI Suggested Suppliers</span>
                      <span className="text-xs text-gold">
                        {Math.round(gap.suggestions.supplier.confidence * 100)}% confidence
                      </span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {gap.suggestions.supplier.suppliers.slice(0, 3).map((supplier, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-muted rounded-md border border-border/50 hover:border-gold/30 transition-colors cursor-pointer"
                          onClick={() => handleFieldChange("supplier", supplier.name)}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-sm font-semibold text-foreground">{supplier.name}</p>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gold">★ {supplier.rating.toFixed(1)}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Lead time: {supplier.leadTime} days • Min order: {supplier.minOrder} units
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Price: AED {supplier.pricePerUnit.toFixed(2)}/unit
                          </p>
                          {supplier.specialization.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {supplier.specialization.slice(0, 2).map((spec, i) => (
                                <Badge key={i} variant="outline" className="text-xs h-5">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {gap.missingFields.includes("leadTime") && (
            <div>
              <label className="block text-sm font-semibold mb-2">Lead Time (Days)</label>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Enter lead time in days"
                  value={formData.leadTime || ""}
                  onChange={(e) => handleFieldChange("leadTime", e.target.value ? Number(e.target.value) : undefined)}
                  className={`w-full px-3 py-2 border rounded-md text-sm ${
                    validationErrors.leadTime
                      ? "border-red-500 bg-red-50"
                      : "border-border"
                  }`}
                />
                {validationErrors.leadTime && (
                  <p className="text-xs text-red-600">{validationErrors.leadTime}</p>
                )}
                {gap.suggestions?.leadTime && (
                  <div className="p-3 bg-muted rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-muted-foreground">AI Suggestion</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-gold" />
                        <span className="text-xs text-gold">
                          {Math.round(gap.suggestions.leadTime.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {gap.suggestions.leadTime.suggestedLeadTime} days
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: {gap.suggestions.leadTime.range.min} - {gap.suggestions.leadTime.range.max} days
                    </p>
                    {gap.suggestions.leadTime.factors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Factors:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {gap.suggestions.leadTime.factors.map((factor, i) => (
                            <li key={i}>• {factor}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 h-7 text-xs"
                      onClick={() =>
                        handleFieldChange("leadTime", gap.suggestions?.leadTime?.suggestedLeadTime)
                      }
                    >
                      Use Suggestion
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {gap.missingFields.includes("material") && (
            <div>
              <label className="block text-sm font-semibold mb-2">Material</label>
              <input
                type="text"
                placeholder="Enter material type"
                value={formData.material || ""}
                onChange={(e) => handleFieldChange("material", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  validationErrors.material
                    ? "border-red-500 bg-red-50"
                    : "border-border"
                }`}
              />
              {validationErrors.material && (
                <p className="text-xs text-red-600">{validationErrors.material}</p>
              )}
            </div>
          )}

          {gap.missingFields.includes("brand") && (
            <div>
              <label className="block text-sm font-semibold mb-2">Brand</label>
              <input
                type="text"
                placeholder="Enter brand name"
                value={formData.brand || ""}
                onChange={(e) => handleFieldChange("brand", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  validationErrors.brand
                    ? "border-red-500 bg-red-50"
                    : "border-border"
                }`}
              />
              {validationErrors.brand && (
                <p className="text-xs text-red-600">{validationErrors.brand}</p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 bg-gold hover:bg-gold/90 text-black"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Item
              </>
            )}
          </Button>
          {onLoadSuggestions && (
            <Button
              onClick={onLoadSuggestions}
              variant="outline"
              disabled={isLoading}
              className="flex-1"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Load Suggestions
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
