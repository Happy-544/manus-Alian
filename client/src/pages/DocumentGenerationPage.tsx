/**
 * Document Generation Page
 * Displays document preview and handles PDF/DOCX export
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Printer, Eye, FileText, Loader2, AlertCircle } from "lucide-react";
import type { DocumentMetadata } from "@/components/DocumentTemplate";
import { BOQTemplate } from "@/components/templates/BOQTemplate";
import { BaselineTemplate } from "@/components/templates/BaselineTemplate";
import { ProcurementTemplate } from "@/components/templates/ProcurementTemplate";
import { EngineeringLogTemplate } from "@/components/templates/EngineeringLogTemplate";
import { BudgetTemplate } from "@/components/templates/BudgetTemplate";
import { DrawingsTemplate } from "@/components/templates/DrawingsTemplate";
import type { BOQItem } from "@/components/templates/BOQTemplate";
import type { BaselinePhase } from "@/components/templates/BaselineTemplate";
import type { ProcurementItem } from "@/components/templates/ProcurementTemplate";
import type { EngineeringEntry } from "@/components/templates/EngineeringLogTemplate";
import type { BudgetItem } from "@/components/templates/BudgetTemplate";
import type { DrawingSheet } from "@/components/templates/DrawingsTemplate";

type DocumentType = "boq" | "baseline" | "procurement" | "engineering" | "budget" | "drawings";

interface DocumentGenerationPageProps {
  documentType: DocumentType;
  projectId: number;
  projectName: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  projectLocation?: string;
  generatedBy: string;
}

export function DocumentGenerationPage({
  documentType,
  projectId,
  projectName,
  clientName,
  clientEmail,
  clientPhone,
  projectLocation,
  generatedBy,
}: DocumentGenerationPageProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("preview");

  // Sample data for different document types
  const metadata: DocumentMetadata = {
    projectName,
    projectLocation,
    clientName,
    clientEmail,
    clientPhone,
    documentType: documentType.toUpperCase(),
    documentTitle: getDocumentTitle(documentType),
    generatedDate: new Date(),
    generatedBy,
    projectId,
    version: 1,
    status: "draft",
  };

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      // Dynamic import of html2pdf to avoid bundle size issues
      const html2pdf = (await import("html2pdf.js")).default;

      const element = document.querySelector(".document-preview");
      if (!element) {
        throw new Error("Document preview not found");
      }

      const filename = `${documentType}_${projectName}_${new Date().toISOString().split("T")[0]}.pdf`;
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      };

      // Create a clone of the element to avoid modifying the DOM
      const clone = element.cloneNode(true) as HTMLElement;
      html2pdf().set(opt as any).from(clone).save();
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Failed to export PDF");
      console.error("PDF export error:", error);
    } finally {
      setIsExporting(false);
    }
  }, [documentType, projectName]);

  const handleExportDOCX = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      // For DOCX, we'd need to implement server-side generation
      // This is a placeholder for the frontend trigger
      const response = await fetch("/api/trpc/documents.exportDOCX", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: {
            documentType,
            projectId,
            projectName,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to export DOCX");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${documentType}_${projectName}_${new Date().toISOString().split("T")[0]}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Failed to export DOCX");
      console.error("DOCX export error:", error);
    } finally {
      setIsExporting(false);
    }
  }, [documentType, projectId, projectName]);

  return (
    <div className="w-full space-y-4 p-6">
      {/* Header */}
      <Card className="p-4 bg-gradient-to-r from-gold/5 to-gold/10 border-gold/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{getDocumentTitle(documentType)}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {projectName} • {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2"
              disabled={isExporting}
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportDOCX}
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              DOCX
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {exportError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{exportError}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-2">
            <FileText className="w-4 h-4" />
            Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4">
          <Card className="p-8 bg-white overflow-auto max-h-[calc(100vh-300px)]">
            <div className="document-preview">
              {renderDocumentPreview(documentType, metadata)}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Document Type</p>
                  <p className="text-foreground">{getDocumentTitle(documentType)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Project</p>
                  <p className="text-foreground">{projectName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Generated By</p>
                  <p className="text-foreground">{generatedBy}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Generated Date</p>
                  <p className="text-foreground">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
              {clientName && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Client Information</p>
                  <p className="text-foreground">{clientName}</p>
                  {clientEmail && <p className="text-sm text-muted-foreground">{clientEmail}</p>}
                  {clientPhone && <p className="text-sm text-muted-foreground">{clientPhone}</p>}
                </div>
              )}
              {projectLocation && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Location</p>
                  <p className="text-foreground">{projectLocation}</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Get document title based on type
 */
function getDocumentTitle(documentType: DocumentType): string {
  const titles: Record<DocumentType, string> = {
    boq: "Bill of Quantities (BOQ)",
    baseline: "Baseline Program",
    procurement: "Procurement Log",
    engineering: "Engineering Log",
    budget: "Budget Estimation",
    drawings: "Drawings Documentation",
  };
  return titles[documentType];
}

/**
 * Render document preview based on type
 */
function renderDocumentPreview(
  documentType: DocumentType,
  metadata: DocumentMetadata
): React.ReactNode {
  switch (documentType) {
    case "boq":
      return (
        <BOQTemplate
          metadata={metadata}
          items={getSampleBOQItems()}
          notes="All rates are subject to market conditions and supplier availability."
          terms="Payment Terms: 30% advance, 40% on delivery, 30% on completion"
        />
      );

    case "baseline":
      return (
        <BaselineTemplate
          metadata={metadata}
          phases={getSampleBaselinePhases()}
          projectStartDate={new Date()}
          projectEndDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)}
          totalDuration={90}
          keyMilestones={[
            "Design Approval - Week 2",
            "Material Procurement - Week 4",
            "Installation Start - Week 5",
            "MEP Testing - Week 10",
            "Final Handover - Week 13",
          ]}
        />
      );

    case "procurement":
      return (
        <ProcurementTemplate
          metadata={metadata}
          items={getSampleProcurementItems()}
          totalBudget={500000}
          currency="AED"
        />
      );

    case "engineering":
      return (
        <EngineeringLogTemplate
          metadata={metadata}
          entries={getSampleEngineeringEntries()}
          summary="This engineering log documents all technical findings, recommendations, and site observations for the project."
        />
      );

    case "budget":
      return (
        <BudgetTemplate
          metadata={metadata}
          items={getSampleBudgetItems()}
          contingencyPercentage={5}
          profitMargin={10}
          currency="AED"
        />
      );

    case "drawings":
      return (
        <DrawingsTemplate
          metadata={metadata}
          sheets={getSampleDrawingSheets()}
          projectScope="Complete fit-out and interior design for commercial space including MEP coordination and finishing works."
          drawingStandards={[
            "All dimensions in millimeters",
            "Levels referenced to site datum (0.00)",
            "Contractor to verify all dimensions on site",
          ]}
        />
      );

    default:
      return <div>Unknown document type</div>;
  }
}

/**
 * Sample data generators
 */
function getSampleBOQItems(): BOQItem[] {
  return [
    {
      id: "1",
      srNo: 1,
      description: "Gypsum Board Partition",
      unit: "sqm",
      quantity: 150,
      unitRate: 85,
      amount: 12750,
      category: "Partitioning",
    },
    {
      id: "2",
      srNo: 2,
      description: "Ceramic Tiles - Premium",
      unit: "sqm",
      quantity: 200,
      unitRate: 120,
      amount: 24000,
      category: "Flooring",
    },
  ];
}

function getSampleBaselinePhases(): BaselinePhase[] {
  return [
    {
      id: "1",
      phaseName: "Design & Approvals",
      description: "Design finalization and client approvals",
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      duration: 14,
      milestones: ["Design Submission", "Client Approval"],
    },
    {
      id: "2",
      phaseName: "Procurement",
      description: "Material and equipment procurement",
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      duration: 21,
      milestones: ["PO Issuance", "Material Delivery"],
    },
  ];
}

function getSampleProcurementItems(): ProcurementItem[] {
  return [
    {
      id: "1",
      srNo: 1,
      itemDescription: "Ceramic Floor Tiles",
      category: "Flooring",
      quantity: 200,
      unit: "sqm",
      estimatedCost: 24000,
      supplier: "Al Futtaim Ceramics",
      leadTime: 14,
      status: "ordered",
    },
    {
      id: "2",
      srNo: 2,
      itemDescription: "Gypsum Board",
      category: "Partitioning",
      quantity: 150,
      unit: "sqm",
      estimatedCost: 12750,
      supplier: "Emirates Gypsum",
      leadTime: 7,
      status: "pending",
    },
  ];
}

function getSampleEngineeringEntries(): EngineeringEntry[] {
  return [
    {
      id: "1",
      date: new Date(),
      category: "Structural",
      title: "Beam Load Capacity Verification",
      description: "Verified load capacity of existing beams for new partition placement",
      findings: "All beams have adequate capacity for proposed loads",
      recommendations: "Proceed with design as planned",
      status: "resolved",
      priority: "high",
    },
  ];
}

function getSampleBudgetItems(): BudgetItem[] {
  return [
    {
      id: "1",
      category: "Partitioning",
      description: "Gypsum Board Partition System",
      quantity: 150,
      unit: "sqm",
      unitRate: 85,
      amount: 12750,
    },
    {
      id: "2",
      category: "Flooring",
      description: "Premium Ceramic Tiles",
      quantity: 200,
      unit: "sqm",
      unitRate: 120,
      amount: 24000,
    },
  ];
}

function getSampleDrawingSheets(): DrawingSheet[] {
  return [
    {
      id: "1",
      sheetNumber: "A-01",
      title: "Floor Plan - Ground Level",
      description: "General arrangement and layout",
      scale: "1:100",
      drawnBy: "Architect",
      approvedBy: "Project Manager",
      date: new Date(),
      revision: "A",
      status: "approved",
    },
    {
      id: "2",
      sheetNumber: "A-02",
      title: "Elevation - Main Facade",
      description: "Front elevation and details",
      scale: "1:50",
      drawnBy: "Architect",
      date: new Date(),
      revision: "A",
      status: "for_review",
    },
  ];
}
