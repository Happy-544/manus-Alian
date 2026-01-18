/**
 * Document Comparison Timeline Component
 * Displays document versions with change summaries and allows reverting to previous versions
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  RotateCcw,
  Eye,
} from "lucide-react";

export interface DocumentVersion {
  versionId: string;
  versionNumber: number;
  generationId: string;
  createdAt: Date;
  changedBy: string;
  changesSummary: string;
  changeType: "created" | "modified" | "reviewed" | "approved";
  changes?: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
  fileSize?: number;
  status?: "draft" | "final" | "archived";
}

interface DocumentComparisonTimelineProps {
  versions: DocumentVersion[];
  currentVersionId: string;
  onRevert?: (versionId: string) => void;
  onViewVersion?: (versionId: string) => void;
  isLoading?: boolean;
}

export function DocumentComparisonTimeline({
  versions,
  currentVersionId,
  onRevert,
  onViewVersion,
  isLoading = false,
}: DocumentComparisonTimelineProps) {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case "created":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "modified":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "reviewed":
        return "bg-amber-500/10 text-amber-700 border-amber-500/20";
      case "approved":
        return "bg-purple-500/10 text-purple-700 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case "created":
        return <CheckCircle className="w-4 h-4" />;
      case "modified":
        return <AlertCircle className="w-4 h-4" />;
      case "reviewed":
        return <Eye className="w-4 h-4" />;
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isCurrentVersion = (versionId: string) => versionId === currentVersionId;
  const isExpanded = (versionId: string) => expandedVersion === versionId;

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold" />
              Document Version History
            </CardTitle>
            <CardDescription>
              {versions.length} version{versions.length !== 1 ? "s" : ""} • Compare and revert to previous versions
            </CardDescription>
          </div>
          {selectedVersions.length > 0 && (
            <Badge variant="secondary">
              {selectedVersions.length} selected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Timeline */}
        <div className="space-y-2">
          {versions.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No version history available yet. This is the first version of this document.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gold to-gold/20" />

              {/* Version Items */}
              <div className="space-y-3">
                {versions.map((version, index) => {
                  const isCurrent = isCurrentVersion(version.versionId);
                  const isExpand = isExpanded(version.versionId);

                  return (
                    <div key={version.versionId} className="relative pl-16">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute left-0 w-14 h-14 flex items-center justify-center rounded-full border-4 transition-all ${
                          isCurrent
                            ? "bg-gold border-gold text-black"
                            : "bg-background border-gold/30 text-muted-foreground"
                        }`}
                      >
                        {getChangeTypeIcon(version.changeType)}
                      </div>

                      {/* Version Card */}
                      <div
                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          isCurrent
                            ? "border-gold bg-gold/5"
                            : "border-border hover:border-gold/50 hover:bg-muted/50"
                        }`}
                        onClick={() =>
                          setExpandedVersion(isExpand ? null : version.versionId)
                        }
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-foreground">
                                Version {version.versionNumber}
                              </h4>
                              {isCurrent && (
                                <Badge className="bg-gold text-black text-xs">
                                  Current
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={`text-xs border ${getChangeTypeColor(
                                  version.changeType
                                )}`}
                              >
                                {version.changeType}
                              </Badge>
                              {version.status && (
                                <Badge variant="secondary" className="text-xs">
                                  {version.status}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(version.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {isExpand ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {/* Summary */}
                        <p className="text-sm text-foreground mb-2">
                          {version.changesSummary}
                        </p>

                        {/* Meta Info */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{version.changedBy}</span>
                          </div>
                          {version.fileSize && (
                            <div className="flex items-center gap-1">
                              <span>
                                {(version.fileSize / 1024).toFixed(2)} KB
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Expanded Details */}
                        {isExpand && (
                          <div className="mt-4 pt-4 border-t border-border space-y-3">
                            {/* Changes List */}
                            {version.changes && version.changes.length > 0 && (
                              <div>
                                <h5 className="text-xs font-semibold text-foreground mb-2">
                                  Changes Made:
                                </h5>
                                <div className="space-y-2">
                                  {version.changes.map((change, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2 bg-muted rounded text-xs"
                                    >
                                      <p className="font-semibold text-foreground">
                                        {change.field}
                                      </p>
                                      <div className="grid grid-cols-2 gap-2 mt-1">
                                        <div>
                                          <p className="text-muted-foreground">
                                            From:
                                          </p>
                                          <p className="text-foreground line-through opacity-50">
                                            {change.oldValue}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">
                                            To:
                                          </p>
                                          <p className="text-foreground font-semibold text-green-600">
                                            {change.newValue}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                              {onViewVersion && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewVersion(version.versionId);
                                  }}
                                  className="flex-1 h-7 text-xs"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View Version
                                </Button>
                              )}
                              {onRevert && !isCurrent && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex-1 h-7 text-xs"
                                    >
                                      <RotateCcw className="w-3 h-3 mr-1" />
                                      Revert
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>
                                        Revert to Version {version.versionNumber}?
                                      </DialogTitle>
                                      <DialogDescription>
                                        This will restore the document to this version.
                                        The current version will be saved as a new version.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="p-3 bg-muted rounded-md">
                                        <p className="text-sm font-semibold text-foreground mb-1">
                                          {version.changesSummary}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Created by {version.changedBy} on{" "}
                                          {formatDate(version.createdAt)}
                                        </p>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          className="flex-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          className="flex-1 bg-gold hover:bg-gold/90 text-black"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onRevert(version.versionId);
                                          }}
                                        >
                                          <RotateCcw className="w-3 h-3 mr-1" />
                                          Revert Now
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {versions.length > 0 && (
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Versions</p>
              <p className="text-lg font-semibold text-foreground">
                {versions.length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Latest Change</p>
              <p className="text-xs text-foreground">
                {formatDate(versions[0]?.createdAt || new Date())}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Last Editor</p>
              <p className="text-xs text-foreground truncate">
                {versions[0]?.changedBy || "Unknown"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
