/**
 * Document Detail Page
 * Displays document with version history timeline and sharing options
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  Share2,
  Eye,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { DocumentComparisonTimeline, type DocumentVersion } from "@/components/DocumentComparisonTimeline";
import { DocumentVersioningSharing } from "@/components/DocumentVersioningSharing";

// Sample document data
const sampleDocument = {
  id: "doc-001",
  name: "BOQ - Project Alpha",
  category: "BOQ",
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  status: "final" as const,
  content: "Bill of Quantities for Project Alpha - Complete listing of all materials and services required.",
  fileSize: 2048000,
  owner: "Mohamed Ali",
};

// Sample version history
const sampleVersions: DocumentVersion[] = [
  {
    versionId: "v-001",
    versionNumber: 4,
    generationId: "gen-001",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    changedBy: "Mohamed Ali",
    changesSummary: "Final approval - All items reviewed and approved",
    changeType: "approved",
    status: "final",
    fileSize: 2048000,
    changes: [
      {
        field: "Status",
        oldValue: "In Review",
        newValue: "Final",
      },
      {
        field: "Approval",
        oldValue: "Pending",
        newValue: "Approved",
      },
    ],
  },
  {
    versionId: "v-002",
    versionNumber: 3,
    generationId: "gen-001",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    changedBy: "Project Manager",
    changesSummary: "Updated pricing and supplier information",
    changeType: "modified",
    status: "draft",
    fileSize: 1980000,
    changes: [
      {
        field: "Unit Prices",
        oldValue: "Previous pricing",
        newValue: "Updated with current market rates",
      },
      {
        field: "Suppliers",
        oldValue: "5 suppliers",
        newValue: "7 suppliers",
      },
      {
        field: "Total Cost",
        oldValue: "AED 450,000",
        newValue: "AED 485,000",
      },
    ],
  },
  {
    versionId: "v-003",
    versionNumber: 2,
    generationId: "gen-001",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    changedBy: "Architect",
    changesSummary: "Reviewed and added technical specifications",
    changeType: "reviewed",
    status: "draft",
    fileSize: 1850000,
    changes: [
      {
        field: "Specifications",
        oldValue: "Basic specs",
        newValue: "Detailed technical specifications added",
      },
      {
        field: "Categories",
        oldValue: "8 categories",
        newValue: "12 categories",
      },
    ],
  },
  {
    versionId: "v-004",
    versionNumber: 1,
    generationId: "gen-001",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    changedBy: "Mohamed Ali",
    changesSummary: "Initial BOQ creation from project requirements",
    changeType: "created",
    status: "draft",
    fileSize: 1500000,
  },
];

export function DocumentDetailPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");

  const handleRevert = (versionId: string) => {
    setIsLoading(true);
    // Simulate revert operation
    setTimeout(() => {
      console.log("Reverted to version:", versionId);
      setIsLoading(false);
    }, 1500);
  };

  const handleViewVersion = (versionId: string) => {
    console.log("Viewing version:", versionId);
  };

  const handleDownloadPDF = () => {
    setIsLoading(true);
    // Simulate PDF download
    setTimeout(() => {
      console.log("Downloading PDF...");
      setIsLoading(false);
    }, 1000);
  };

  const handleDownloadDOCX = () => {
    setIsLoading(true);
    // Simulate DOCX download
    setTimeout(() => {
      console.log("Downloading DOCX...");
      setIsLoading(false);
    }, 1000);
  };

  const handleShare = () => {
    console.log("Opening share dialog...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-8 h-8 text-gold" />
            {sampleDocument.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Created on {sampleDocument.createdAt.toLocaleDateString()} • Last updated{" "}
            {sampleDocument.updatedAt.toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm">
            {sampleDocument.category}
          </Badge>
          <Badge className="bg-gold text-black text-sm">
            {sampleDocument.status}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={handleDownloadPDF}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download PDF
        </Button>
        <Button
          onClick={handleDownloadDOCX}
          disabled={isLoading}
          variant="outline"
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download DOCX
        </Button>
        <Button
          onClick={handleShare}
          variant="outline"
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="history">Version History</TabsTrigger>
          <TabsTrigger value="sharing">Sharing</TabsTrigger>
        </TabsList>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
              <CardDescription>
                View the current version of your document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This is a preview of the document. Download to get the full formatted version.
                </AlertDescription>
              </Alert>

              <div className="p-6 bg-muted rounded-lg border border-border min-h-96">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {sampleDocument.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {sampleDocument.content}
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Owner
                      </p>
                      <p className="text-sm text-foreground">
                        {sampleDocument.owner}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        File Size
                      </p>
                      <p className="text-sm text-foreground">
                        {(sampleDocument.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Version History Tab */}
        <TabsContent value="history" className="space-y-4">
          <DocumentComparisonTimeline
            versions={sampleVersions}
            currentVersionId="v-001"
            onRevert={handleRevert}
            onViewVersion={handleViewVersion}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Sharing Tab */}
        <TabsContent value="sharing" className="space-y-4">
          <DocumentVersioningSharing
            documentId={sampleDocument.id}
            documentName={sampleDocument.name}
            currentVersion="4"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
