/**
 * Document Generation Service
 * Handles PDF and DOCX export for all document templates
 */

import { Document as DocxDocument, Packer, Paragraph, Table, TableCell, TableRow, AlignmentType, BorderStyle, VerticalAlign, UnderlineType, HeadingLevel } from "docx";
import { ReactElement } from "react";

export interface DocumentExportOptions {
  format: "pdf" | "docx";
  filename: string;
  title: string;
  author?: string;
  subject?: string;
}

/**
 * Convert React component to HTML string for PDF generation
 * This is a placeholder - in production, you'd use a library like html2pdf or puppeteer
 */
export async function renderComponentToHTML(component: ReactElement): Promise<string> {
  // This would require server-side React rendering
  // For now, return a placeholder
  return "<html><body>Document</body></html>";
}

/**
 * Generate PDF from HTML content
 * Requires html2pdf or similar library on frontend
 */
export async function generatePDFFromHTML(
  htmlContent: string,
  filename: string
): Promise<Blob> {
  // This function should be called from the frontend
  // using a library like html2pdf or pdfkit
  throw new Error("PDF generation must be done on the frontend using html2pdf library");
}

/**
 * Generate DOCX document from structured data
 */
export async function generateDOCXDocument(
  title: string,
  sections: DocumentSection[],
  options: DocumentExportOptions
): Promise<Blob> {
  const doc = new DocxDocument({
    sections: [
      {
        children: [
          // Header with title
          new Paragraph({
            text: "ALPAGO",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: "Fit-Out & Interior Design Solutions",
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            size: 20,
          }),

          // Document title
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),

          // Document metadata
          new Table({
            width: { size: 100, type: "pct" },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph("Document Type:")],
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  }),
                  new TableCell({
                    children: [new Paragraph(options.subject || "Professional Document")],
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph("Generated:")],
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  }),
                  new TableCell({
                    children: [new Paragraph(new Date().toLocaleDateString())],
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  }),
                ],
              }),
            ],
          }),

          new Paragraph(""),
          new Paragraph(""),

          // Document sections
          ...sections.flatMap((section) => [
            new Paragraph({
              text: section.title,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            ...section.content,
            new Paragraph(""),
          ]),

          // Footer
          new Paragraph(""),
          new Paragraph(""),
          new Paragraph({
            text: "ALPAGO - Professional Fit-Out & Interior Design Solutions",
            alignment: AlignmentType.CENTER,
            size: 18,
            spacing: { before: 200 },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

/**
 * Document section structure for DOCX generation
 */
export interface DocumentSection {
  title: string;
  content: Paragraph[];
}

/**
 * Helper to create a paragraph with text
 */
export function createParagraph(
  text: string,
  options?: {
    bold?: boolean;
    italic?: boolean;
    size?: number;
    spacing?: { before?: number; after?: number };
  }
): Paragraph {
  return new Paragraph({
    text,
    bold: options?.bold,
    italic: options?.italic,
    size: options?.size,
    spacing: options?.spacing,
  });
}

/**
 * Helper to create a table for DOCX
 */
export function createTable(
  headers: string[],
  rows: (string | number)[][],
  footer?: (string | number)[]
): Table {
  const headerRow = new TableRow({
    children: headers.map(
      (header) =>
        new TableCell({
          children: [new Paragraph({ text: header, bold: true })],
          shading: { fill: "D3D3D3" },
        })
    ),
  });

  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [new Paragraph(String(cell))],
            })
        ),
      })
  );

  const footerRow = footer
    ? [
        new TableRow({
          children: footer.map(
            (cell) =>
              new TableCell({
                children: [new Paragraph({ text: String(cell), bold: true })],
                shading: { fill: "F0F0F0" },
              })
          ),
        }),
      ]
    : [];

  return new Table({
    width: { size: 100, type: "pct" },
    rows: [headerRow, ...dataRows, ...footerRow],
  });
}

/**
 * Export document to file (triggers download on frontend)
 */
export async function downloadDocument(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(
  documentType: string,
  projectName: string,
  format: "pdf" | "docx"
): string {
  const timestamp = new Date().toISOString().split("T")[0];
  const sanitizedName = projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const ext = format === "pdf" ? "pdf" : "docx";
  return `${documentType}_${sanitizedName}_${timestamp}.${ext}`;
}

/**
 * Validate document content before generation
 */
export function validateDocumentContent(content: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!content.metadata) {
    errors.push("Missing document metadata");
  }

  if (!content.metadata?.documentTitle) {
    errors.push("Missing document title");
  }

  if (!content.metadata?.projectName) {
    errors.push("Missing project name");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
