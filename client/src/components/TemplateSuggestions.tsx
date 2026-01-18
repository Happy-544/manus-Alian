/**
 * Template Suggestions Component
 * Displays AI-suggested templates based on project description
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export interface TemplateSuggestion {
  templateId: number;
  templateName: string;
  category: string;
  description: string;
  confidenceScore: number;
  matchingReasons: string[];
  previewImage: string | undefined;
}

export interface TemplateSuggestionsProps {
  projectName: string;
  projectDescription: string;
  projectType?: string;
  budget?: string;
  timeline?: string;
  location?: string;
  onTemplateSelect?: (templateId: number, templateName: string) => void;
  isLoading?: boolean;
}

export function TemplateSuggestions({
  projectName,
  projectDescription,
  projectType,
  budget,
  timeline,
  location,
  onTemplateSelect,
  isLoading: externalLoading = false,
}: TemplateSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<TemplateSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRequested, setHasRequested] = useState(false);

  const suggestMutation = trpc.templateSuggestions.suggestForProject.useMutation({
    onSuccess: (data) => {
      setSuggestions(data as TemplateSuggestion[]);
      setError(null);
      setIsLoading(false);
      setHasRequested(true);

      if (data.length === 0) {
        toast.info("No matching templates found. Create a new template to get started.");
      } else {
        toast.success(`Found ${data.length} matching templates!`);
      }
    },
    onError: (error) => {
      setError(error.message || "Failed to get template suggestions");
      setIsLoading(false);
      toast.error("Failed to suggest templates");
    },
  });

  const handleGetSuggestions = async () => {
    if (!projectName.trim() || !projectDescription.trim()) {
      setError("Project name and description are required");
      return;
    }

    setIsLoading(true);
    setError(null);

    suggestMutation.mutate({
      projectName,
      projectDescription,
      projectType,
      budget,
      timeline,
      location,
    });
  };

  const handleSelectTemplate = (templateId: number, templateName: string) => {
    if (onTemplateSelect) {
      onTemplateSelect(templateId, templateName);
      toast.success(`Template "${templateName}" selected!`);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-blue-100 text-blue-800";
    if (score >= 40) return "bg-amber-100 text-amber-800";
    return "bg-gray-100 text-gray-800";
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Possible Match";
    return "Low Match";
  };

  return (
    <div className="space-y-6">
      {/* Get Suggestions Button */}
      <div className="flex gap-3">
        <Button
          onClick={handleGetSuggestions}
          disabled={isLoading || externalLoading || !projectName.trim() || !projectDescription.trim()}
          className="bg-accent hover:bg-accent/90 text-primary font-semibold gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Get AI Suggestions
        </Button>
        {hasRequested && (
          <Button
            onClick={handleGetSuggestions}
            variant="outline"
            disabled={isLoading || externalLoading}
            className="border-accent/50"
          >
            Refresh
          </Button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {(isLoading || externalLoading) && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-primary/10">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Suggestions Yet */}
      {!isLoading && !externalLoading && !hasRequested && (
        <Card className="border-primary/10 border-dashed">
          <CardContent className="pt-6 text-center">
            <Sparkles className="w-8 h-8 text-accent mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">
              Click "Get AI Suggestions" to find templates that match your project
            </p>
          </CardContent>
        </Card>
      )}

      {/* Suggestions List */}
      {!isLoading && !externalLoading && hasRequested && suggestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-primary">
              Suggested Templates ({suggestions.length})
            </h3>
            <p className="text-sm text-muted-foreground">
              AI-powered recommendations based on your project
            </p>
          </div>

          {suggestions.map((suggestion, index) => (
            <Card
              key={suggestion.templateId}
              className="border-2 border-primary/10 hover:border-accent/50 transition-all hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg text-primary">
                        {index + 1}. {suggestion.templateName}
                      </CardTitle>
                      <Badge className={`${getConfidenceColor(suggestion.confidenceScore)}`}>
                        {suggestion.confidenceScore}% Match
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {getConfidenceLabel(suggestion.confidenceScore)} • {suggestion.category}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() =>
                      handleSelectTemplate(suggestion.templateId, suggestion.templateName)
                    }
                    className="bg-accent hover:bg-accent/90 text-primary font-semibold gap-2 whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Use Template
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Template Description */}
                {suggestion.description && (
                  <div>
                    <p className="text-sm font-semibold text-primary mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                  </div>
                )}

                {/* Matching Reasons */}
                <div>
                  <p className="text-sm font-semibold text-primary mb-2">Why This Template?</p>
                  <ul className="space-y-2">
                    {suggestion.matchingReasons.map((reason, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="text-accent font-bold">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Preview Image */}
                {suggestion.previewImage && (
                  <div>
                    <p className="text-sm font-semibold text-primary mb-2">Preview</p>
                    <img
                      src={suggestion.previewImage}
                      alt={suggestion.templateName}
                      className="w-full h-40 object-cover rounded-lg border border-primary/10"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State After Request */}
      {!isLoading && !externalLoading && hasRequested && suggestions.length === 0 && (
        <Card className="border-primary/10">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-3" />
            <p className="font-semibold text-primary mb-1">No Matching Templates</p>
            <p className="text-sm text-muted-foreground">
              No templates matched your project description. Try creating a new template or adjusting your project details.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
