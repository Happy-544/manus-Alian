/**
 * Document Preview and Export Component
 * Handles document preview, PDF/DOCX export, and printing
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Printer, FileText, Eye } from "lucide-react";

export interface DocumentPreviewExportProps {
  documentTitle: string;
  documentType: string;
  children: React.ReactNode;
  onExportPDF?: () => Promise<void>;
  onExportDOCX?: () => Promise<void>;
  isExporting?: boolean;
}

export function DocumentPreviewExport({
  documentTitle,
  documentType,
  children,
  onExportPDF,
  onExportDOCX,
  isExporting = false,
}: DocumentPreviewExportProps) {
  const [activeTab, setActiveTab] = useState("preview");
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(printRef.current.innerHTML);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header with Export Options */}
      <Card className="p-4 bg-gradient-to-r from-gold/5 to-gold/10 border-gold/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{documentTitle}</h2>
            <p className="text-sm text-muted-foreground mt-1">{documentType} Document</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            {onExportPDF && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportPDF}
                disabled={isExporting}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                PDF
              </Button>
            )}
            {onExportDOCX && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportDOCX}
                disabled={isExporting}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                DOCX
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs for Preview and Details */}
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
          {/* Document Preview Container */}
          <Card className="p-8 bg-white overflow-auto max-h-[calc(100vh-300px)]">
            <div ref={printRef} className="prose prose-sm max-w-none">
              {children}
            </div>
          </Card>

          {/* Print Styles */}
          <style>{`
            @media print {
              body {
                margin: 0;
                padding: 20mm;
              }
              .no-print {
                display: none;
              }
              .prose {
                max-width: 100%;
              }
            }
          `}</style>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Document Type</p>
                <p className="text-foreground">{documentType}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Title</p>
                <p className="text-foreground">{documentTitle}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Generated</p>
                <p className="text-foreground">{new Date().toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Export Options</p>
                <div className="flex gap-2 mt-2">
                  {onExportPDF && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={onExportPDF}
                      disabled={isExporting}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export as PDF
                    </Button>
                  )}
                  {onExportDOCX && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={onExportDOCX}
                      disabled={isExporting}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export as DOCX
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
