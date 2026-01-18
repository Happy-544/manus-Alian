/**
 * Drawings Document Template
 * Professional template for architectural and technical drawings documentation
 */

import { DocumentTemplate, DocumentSection, DocumentTable, DocumentHighlight, DocumentMetadata } from "../DocumentTemplate";

export interface DrawingSheet {
  id: string;
  sheetNumber: string;
  title: string;
  description: string;
  scale: string;
  drawnBy: string;
  checkedBy?: string;
  approvedBy?: string;
  date: Date;
  revision: string;
  status: "draft" | "for_review" | "approved" | "as_built";
  fileUrl?: string;
}

export interface DrawingsTemplateProps {
  metadata: DocumentMetadata;
  sheets: DrawingSheet[];
  projectScope?: string;
  drawingStandards?: string[];
  revisionHistory?: Array<{
    revision: string;
    date: Date;
    description: string;
    approvedBy: string;
  }>;
}

export function DrawingsTemplate({
  metadata,
  sheets,
  projectScope,
  drawingStandards,
  revisionHistory,
}: DrawingsTemplateProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const sheetsByStatus = sheets.reduce(
    (acc, sheet) => {
      if (!acc[sheet.status]) {
        acc[sheet.status] = [];
      }
      acc[sheet.status].push(sheet);
      return acc;
    },
    {} as Record<string, DrawingSheet[]>
  );

  const statusColors = {
    draft: "text-amber-600",
    for_review: "text-blue-600",
    approved: "text-green-600",
    as_built: "text-purple-600",
  };

  const footerContent = (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-8">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">PREPARED BY</p>
          <p className="text-sm text-muted-foreground">_________________</p>
          <p className="text-xs text-muted-foreground mt-2">Signature & Date</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">CHECKED BY</p>
          <p className="text-sm text-muted-foreground">_________________</p>
          <p className="text-xs text-muted-foreground mt-2">Signature & Date</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">APPROVED BY</p>
          <p className="text-sm text-muted-foreground">_________________</p>
          <p className="text-xs text-muted-foreground mt-2">Signature & Date</p>
        </div>
      </div>
    </div>
  );

  return (
    <DocumentTemplate
      metadata={metadata}
      footerContent={footerContent}
      showPageNumbers={true}
    >
      {/* Project Scope */}
      {projectScope && (
        <DocumentSection title="Project Scope">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{projectScope}</p>
        </DocumentSection>
      )}

      {/* Drawing Summary */}
      <DocumentSection title="Drawing Summary">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground font-semibold mb-1">Total Sheets</p>
            <p className="text-2xl font-bold text-foreground">{sheets.length}</p>
          </div>
          <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/30">
            <p className="text-xs text-muted-foreground font-semibold mb-1">Approved</p>
            <p className="text-2xl font-bold text-green-600">{sheetsByStatus.approved?.length || 0}</p>
          </div>
          <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/30">
            <p className="text-xs text-muted-foreground font-semibold mb-1">For Review</p>
            <p className="text-2xl font-bold text-blue-600">{sheetsByStatus.for_review?.length || 0}</p>
          </div>
          <div className="p-4 bg-amber-500/5 rounded-lg border border-amber-500/30">
            <p className="text-xs text-muted-foreground font-semibold mb-1">Draft</p>
            <p className="text-2xl font-bold text-amber-600">{sheetsByStatus.draft?.length || 0}</p>
          </div>
        </div>
      </DocumentSection>

      {/* Drawing List */}
      <DocumentSection title="Drawing List">
        <DocumentTable
          headers={["Sheet No.", "Title", "Scale", "Status", "Revision", "Date"]}
          rows={sheets.map((sheet) => [
            sheet.sheetNumber,
            sheet.title,
            sheet.scale,
            sheet.status.replace("_", " ").charAt(0).toUpperCase() + sheet.status.replace("_", " ").slice(1),
            sheet.revision,
            formatDate(sheet.date),
          ])}
        />
      </DocumentSection>

      {/* Detailed Sheet Information */}
      {Object.entries(sheetsByStatus).map(([status, statusSheets]) => (
        <DocumentSection key={status} title={`${status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)} Sheets (${statusSheets.length})`}>
          <div className="space-y-4">
            {statusSheets.map((sheet, idx) => (
              <div key={sheet.id} className={`p-4 border-l-4 rounded-r-lg ${statusColors[sheet.status as keyof typeof statusColors] === "text-green-600" ? "border-green-500 bg-green-500/5" : statusColors[sheet.status as keyof typeof statusColors] === "text-blue-600" ? "border-blue-500 bg-blue-500/5" : statusColors[sheet.status as keyof typeof statusColors] === "text-amber-600" ? "border-amber-500 bg-amber-500/5" : "border-purple-500 bg-purple-500/5"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">Sheet {sheet.sheetNumber}: {sheet.title}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${statusColors[sheet.status as keyof typeof statusColors]}`}>
                        {sheet.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{sheet.description}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Rev. {sheet.revision}</p>
                    <p>{formatDate(sheet.date)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm mt-3 pt-3 border-t border-current/20">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Scale</p>
                    <p className="text-foreground">{sheet.scale}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Drawn By</p>
                    <p className="text-foreground">{sheet.drawnBy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold\">Approved By</p>
                    <p className="text-foreground">{sheet.approvedBy || "Pending"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DocumentSection>
      ))}

      {/* Drawing Standards */}
      {drawingStandards && drawingStandards.length > 0 && (
        <DocumentSection title="Drawing Standards & Conventions">
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground font-semibold">The following standards have been applied to all drawings:</p>
            <ul className="text-muted-foreground space-y-1">
              {drawingStandards.map((standard, idx) => (
                <li key={idx}>• {standard}</li>
              ))}
            </ul>
          </div>
        </DocumentSection>
      )}

      {/* Revision History */}
      {revisionHistory && revisionHistory.length > 0 && (
        <DocumentSection title="Revision History">
          <DocumentTable
            headers={["Revision", "Date", "Description", "Approved By"]}
            rows={revisionHistory.map((rev) => [
              rev.revision,
              formatDate(rev.date),
              rev.description,
              rev.approvedBy,
            ])}
          />
        </DocumentSection>
      )}

      {/* General Notes */}
      <DocumentSection title="General Notes">
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-semibold text-foreground mb-2">Drawing Conventions</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• All dimensions are in millimeters unless otherwise stated</li>
              <li>• All levels are referenced to site datum (0.00)</li>
              <li>• Drawings are to be read in conjunction with specifications and schedules</li>
              <li>• Contractor to verify all dimensions on site before commencing work</li>
              <li>• Any discrepancies must be reported to the architect immediately</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-2\">Approval Status</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• Draft: For internal review and coordination</li>
              <li>• For Review: Submitted for client and authority approvals</li>
              <li>• Approved: Authorized for construction</li>
              <li>• As Built: Updated with site variations and changes</li>
            </ul>
          </div>
        </div>
      </DocumentSection>

      {/* Important Notice */}
      <DocumentHighlight
        type="info"
        title="Important Notice"
        content={
          <div className="space-y-1 text-xs">
            <p>These drawings are the property of the Architect and are confidential.</p>
            <p>Unauthorized reproduction or distribution is prohibited.</p>
            <p>All drawings must be verified on site before construction commences.</p>
          </div>
        }
      />
    </DocumentTemplate>
  );
}
