/**
 * Bulk Import Page
 * Upload and process multiple project descriptions for template suggestions
 */

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileJson,
  FileText,
  Loader,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface BulkImportState {
  bulkImportId: number | null;
  fileName: string | null;
  fileType: "csv" | "json" | null;
  status: "idle" | "uploading" | "processing" | "completed" | "error";
  progress: {
    totalItems: number;
    processedItems: number;
    successfulItems: number;
    failedItems: number;
  };
  error: string | null;
}

export default function BulkImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkImportState, setBulkImportState] = useState<BulkImportState>({
    bulkImportId: null,
    fileName: null,
    fileType: null,
    status: "idle",
    progress: {
      totalItems: 0,
      processedItems: 0,
      successfulItems: 0,
      failedItems: 0,
    },
    error: null,
  });

  const uploadFile = trpc.bulkImport.uploadFile.useMutation({
    onSuccess: (data) => {
      setBulkImportState((prev) => ({
        ...prev,
        bulkImportId: data.bulkImportId,
        status: "processing",
        progress: {
          totalItems: data.totalItems,
          processedItems: 0,
          successfulItems: 0,
          failedItems: 0,
        },
        error: null,
      }));

      toast.success(`Successfully uploaded ${data.totalItems} projects`);

      // Start processing
      startProcessing.mutate({ bulkImportId: data.bulkImportId });
    },
    onError: (error) => {
      setBulkImportState((prev) => ({
        ...prev,
        status: "error",
        error: error.message,
      }));
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const startProcessing = trpc.bulkImport.startProcessing.useMutation();

  const getProgress = trpc.bulkImport.getProgress.useQuery(
    { bulkImportId: bulkImportState.bulkImportId! },
    {
      enabled: bulkImportState.bulkImportId !== null && bulkImportState.status === "processing",
      refetchInterval: 2000, // Poll every 2 seconds
      onSuccess: (data) => {
        setBulkImportState((prev) => ({
          ...prev,
          progress: {
            totalItems: data.totalItems,
            processedItems: data.processedItems,
            successfulItems: data.successfulItems,
            failedItems: data.failedItems,
          },
          status: data.status === "completed" ? "completed" : "processing",
        }));

        if (data.status === "completed") {
          toast.success("Bulk import completed!");
        }
      },
    }
  );

  const getResults = trpc.bulkImport.getResults.useQuery(
    { bulkImportId: bulkImportState.bulkImportId! },
    {
      enabled: bulkImportState.bulkImportId !== null && bulkImportState.status === "completed",
    }
  );

  const exportResults = trpc.bulkImport.exportResults.useMutation({
    onSuccess: (data) => {
      // Create a blob and download
      const blob = new Blob([data.csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Results exported successfully");
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  const deleteBulkImport = trpc.bulkImport.delete.useMutation({
    onSuccess: () => {
      setBulkImportState({
        bulkImportId: null,
        fileName: null,
        fileType: null,
        status: "idle",
        progress: {
          totalItems: 0,
          processedItems: 0,
          successfulItems: 0,
          failedItems: 0,
        },
        error: null,
      });
      toast.success("Bulk import deleted");
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileType = file.name.endsWith(".csv") ? "csv" : file.name.endsWith(".json") ? "json" : null;
    if (!fileType) {
      toast.error("Please select a CSV or JSON file");
      return;
    }

    setBulkImportState((prev) => ({
      ...prev,
      status: "uploading",
      fileName: file.name,
      fileType,
    }));

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      uploadFile.mutate({
        fileName: file.name,
        fileContent: content,
        fileType,
        fileSize: file.size,
      });
    };
    reader.readAsText(file);
  };

  const progressPercent =
    bulkImportState.progress.totalItems > 0
      ? Math.round(
          (bulkImportState.progress.processedItems / bulkImportState.progress.totalItems) * 100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Bulk Import Projects</h2>
        <p className="text-muted-foreground">
          Upload multiple projects and get template suggestions for all of them at once
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="results" disabled={bulkImportState.bulkImportId === null}>
            Results
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-4">
          {bulkImportState.status === "idle" ? (
            <Card className="border-2 border-dashed border-primary/20">
              <CardContent className="pt-6">
                <div
                  className="flex flex-col items-center justify-center gap-4 py-12 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg mb-1">Upload CSV or JSON</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drop your file here or click to browse
                    </p>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      Select File
                    </Button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {bulkImportState.fileType === "csv" ? (
                      <FileText className="w-6 h-6 text-blue-600" />
                    ) : (
                      <FileJson className="w-6 h-6 text-orange-600" />
                    )}
                    <div>
                      <CardTitle>{bulkImportState.fileName}</CardTitle>
                      <CardDescription>
                        {bulkImportState.fileType?.toUpperCase()} • {bulkImportState.progress.totalItems} projects
                      </CardDescription>
                    </div>
                  </div>
                  {bulkImportState.status === "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteBulkImport.mutate({ bulkImportId: bulkImportState.bulkImportId! })}
                      disabled={deleteBulkImport.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Status */}
                <div className="flex items-center gap-3">
                  {bulkImportState.status === "uploading" && (
                    <>
                      <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                      <span className="text-sm font-medium">Uploading file...</span>
                    </>
                  )}
                  {bulkImportState.status === "processing" && (
                    <>
                      <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                      <span className="text-sm font-medium">Processing projects...</span>
                    </>
                  )}
                  {bulkImportState.status === "completed" && (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium">Processing completed</span>
                    </>
                  )}
                  {bulkImportState.status === "error" && (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium text-red-600">{bulkImportState.error}</span>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                {(bulkImportState.status === "processing" || bulkImportState.status === "completed") && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Progress</span>
                      <span className="text-muted-foreground">
                        {bulkImportState.progress.processedItems} / {bulkImportState.progress.totalItems}
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-700">
                      {bulkImportState.progress.successfulItems}
                    </div>
                    <div className="text-sm text-green-600">Successful</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-700">
                      {bulkImportState.progress.failedItems}
                    </div>
                    <div className="text-sm text-red-600">Failed</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-700">{progressPercent}%</div>
                    <div className="text-sm text-blue-600">Complete</div>
                  </div>
                </div>

                {/* Export Button */}
                {bulkImportState.status === "completed" && bulkImportState.bulkImportId && (
                  <Button
                    onClick={() =>
                      exportResults.mutate({ bulkImportId: bulkImportState.bulkImportId! })
                    }
                    disabled={exportResults.isPending}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {exportResults.isPending ? "Exporting..." : "Export Results as CSV"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Format Guide */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">File Format Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">CSV Format</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Required columns: projectName, projectDescription
                </p>
                <p className="text-sm text-muted-foreground">
                  Optional columns: projectType, budget, timeline, location
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">JSON Format</h4>
                <p className="text-sm text-muted-foreground">
                  Array of objects with projectName and projectDescription fields
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          {getResults.isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Loading results...</span>
                </div>
              </CardContent>
            </Card>
          ) : getResults.data && getResults.data.length > 0 ? (
            <div className="space-y-4">
              {getResults.data.map((result, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-base">{result.item.projectName}</CardTitle>
                    <CardDescription>{result.item.projectDescription}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result.suggestions.length > 0 ? (
                      <div className="space-y-3">
                        {result.suggestions.map((suggestion, sidx) => (
                          <div key={sidx} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold text-sm">{suggestion.templateName}</h4>
                                <p className="text-xs text-muted-foreground">{suggestion.category}</p>
                              </div>
                              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                                {suggestion.confidenceScore}%
                              </span>
                            </div>
                            {suggestion.description && (
                              <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No template suggestions found</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center gap-2 py-8">
                  <AlertCircle className="w-8 h-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No results available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
