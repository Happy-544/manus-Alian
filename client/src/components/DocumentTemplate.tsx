/**
 * DocumentTemplate Component
 * Base template for all professional documents with Alpago branding
 */

import { ReactNode } from "react";

export interface DocumentMetadata {
  projectName: string;
  projectLocation?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  documentType: string;
  documentTitle: string;
  generatedDate: Date;
  generatedBy: string;
  projectId: number;
  documentId?: number;
  version?: number;
  status?: string;
}

interface DocumentTemplateProps {
  metadata: DocumentMetadata;
  children: ReactNode;
  footerContent?: ReactNode;
  showPageNumbers?: boolean;
  showWatermark?: boolean;
}

export function DocumentTemplate({
  metadata,
  children,
  footerContent,
  showPageNumbers = true,
  showWatermark = false,
}: DocumentTemplateProps) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(metadata.generatedDate);

  return (
    <div className="w-full bg-white text-foreground print:bg-white print:text-black">
      {/* Watermark */}
      {showWatermark && (
        <div className="fixed inset-0 flex items-center justify-center opacity-5 pointer-events-none print:opacity-10 z-0">
          <div className="text-9xl font-bold text-gold transform -rotate-45">DRAFT</div>
        </div>
      )}

      {/* Document Container */}
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="border-b-2 border-gold pb-6 mb-8 print:page-break-after-avoid">
          {/* Logo and Company Info */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-3xl font-bold text-gold mb-1">ALPAGO</div>
              <p className="text-xs text-muted-foreground">Fit-Out & Interior Design Solutions</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p className="font-semibold">{metadata.documentType}</p>
              <p>v{metadata.version || 1}</p>
            </div>
          </div>

          {/* Document Title */}
          <h1 className="text-3xl font-bold text-foreground mb-4">{metadata.documentTitle}</h1>

          {/* Project Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground font-semibold">Project</p>
              <p className="text-foreground font-medium">{metadata.projectName}</p>
              {metadata.projectLocation && (
                <p className="text-muted-foreground text-xs mt-1">{metadata.projectLocation}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground font-semibold">Client</p>
              <p className="text-foreground font-medium">{metadata.clientName || "N/A"}</p>
              {metadata.clientEmail && (
                <p className="text-muted-foreground text-xs mt-1">{metadata.clientEmail}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground font-semibold">Generated</p>
              <p className="text-foreground font-medium">{formattedDate}</p>
              <p className="text-muted-foreground text-xs mt-1">by {metadata.generatedBy}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-semibold">Status</p>
              <p className="text-foreground font-medium capitalize">{metadata.status || "Final"}</p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="prose prose-sm max-w-none mb-8 print:prose-print">
          {children}
        </div>

        {/* Footer Section */}
        {footerContent && (
          <div className="border-t-2 border-gold pt-6 mt-8 print:page-break-before-avoid">
            {footerContent}
          </div>
        )}

        {/* Default Footer */}
        {!footerContent && (
          <div className="border-t-2 border-gold pt-6 mt-8 text-xs text-muted-foreground print:page-break-before-avoid">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">ALPAGO</p>
                <p>Professional Fit-Out & Interior Design Solutions</p>
              </div>
              {showPageNumbers && (
                <div className="text-right">
                  <p>Document ID: {metadata.projectId}-{metadata.documentId || "N/A"}</p>
                  <p className="mt-2 print:hidden">Page <span className="page-number">1</span></p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 20mm;
            background: white;
          }
          .print\\:page-break-after-avoid {
            page-break-after: avoid;
          }
          .print\\:page-break-before-avoid {
            page-break-before: avoid;
          }
          .prose-print {
            font-size: 11pt;
            line-height: 1.5;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Document Section Component
 * Reusable section for document content
 */
interface DocumentSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function DocumentSection({
  title,
  subtitle,
  children,
  className = "",
}: DocumentSectionProps) {
  return (
    <section className={`mb-8 ${className}`}>
      <div className="border-l-4 border-gold pl-4 mb-4">
        <h2 className="text-xl font-bold text-foreground mb-1">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="ml-4">{children}</div>
    </section>
  );
}

/**
 * Document Table Component
 * Professional table styling for document content
 */
interface DocumentTableProps {
  headers: string[];
  rows: (string | number)[][];
  footer?: (string | number)[];
  className?: string;
}

export function DocumentTable({
  headers,
  rows,
  footer,
  className = "",
}: DocumentTableProps) {
  return (
    <div className={`overflow-x-auto mb-6 ${className}`}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gold/10 border-b-2 border-gold">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-left font-semibold text-foreground border-r border-gold/30 last:border-r-0"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={`border-b border-border ${
                rowIdx % 2 === 0 ? "bg-muted/30" : "bg-white"
              }`}
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="px-4 py-3 text-foreground border-r border-border/50 last:border-r-0"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot>
            <tr className="bg-gold/5 border-t-2 border-gold font-semibold">
              {footer.map((cell, idx) => (
                <td
                  key={idx}
                  className="px-4 py-3 text-foreground border-r border-gold/30 last:border-r-0"
                >
                  {cell}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

/**
 * Document Highlight Box Component
 * For important information
 */
interface DocumentHighlightProps {
  title: string;
  content: ReactNode;
  type?: "info" | "warning" | "success" | "critical";
}

export function DocumentHighlight({
  title,
  content,
  type = "info",
}: DocumentHighlightProps) {
  const colors = {
    info: "border-blue-500/30 bg-blue-500/5",
    warning: "border-amber-500/30 bg-amber-500/5",
    success: "border-green-500/30 bg-green-500/5",
    critical: "border-red-500/30 bg-red-500/5",
  };

  const textColors = {
    info: "text-blue-700",
    warning: "text-amber-700",
    success: "text-green-700",
    critical: "text-red-700",
  };

  return (
    <div className={`border-l-4 p-4 rounded-r-lg mb-6 ${colors[type]}`}>
      <p className={`font-semibold mb-2 ${textColors[type]}`}>{title}</p>
      <div className="text-sm text-foreground">{content}</div>
    </div>
  );
}
