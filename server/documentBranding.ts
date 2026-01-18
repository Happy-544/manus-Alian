/**
 * Document Branding Service
 * Adds AliPM branding to generated documents (headers, footers, cover pages)
 */

import { Document as PDFDocument, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const BRAND_COLOR = "#0B1E3D"; // Navy blue
const ACCENT_COLOR = "#D4AF37"; // Gold
const COMPANY_NAME = "AliPM";
const COMPANY_TAGLINE = "Fit-Out Project Management";

/**
 * Document header with AliPM branding
 */
export function getDocumentHeader(
  projectName: string,
  documentType: string,
  date: Date = new Date()
): string {
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <div style="border-bottom: 2px solid ${ACCENT_COLOR}; padding-bottom: 20px; margin-bottom: 30px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="color: ${BRAND_COLOR}; font-size: 28px; margin: 0; font-weight: bold;">
            ${COMPANY_NAME}
          </h1>
          <p style="color: ${ACCENT_COLOR}; font-size: 12px; margin: 5px 0 0 0;">
            ${COMPANY_TAGLINE}
          </p>
        </div>
        <div style="text-align: right;">
          <p style="color: ${BRAND_COLOR}; font-size: 12px; margin: 0;">
            <strong>Project:</strong> ${projectName}
          </p>
          <p style="color: ${BRAND_COLOR}; font-size: 12px; margin: 5px 0 0 0;">
            <strong>Date:</strong> ${formattedDate}
          </p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Document footer with AliPM branding
 */
export function getDocumentFooter(pageNumber: number, totalPages: number): string {
  return `
    <div style="border-top: 1px solid ${ACCENT_COLOR}; padding-top: 15px; margin-top: 30px; text-align: center; color: #666; font-size: 10px;">
      <p style="margin: 0;">
        <strong>${COMPANY_NAME}</strong> - ${COMPANY_TAGLINE}
      </p>
      <p style="margin: 5px 0 0 0;">
        Page ${pageNumber} of ${totalPages} | © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
      </p>
    </div>
  `;
}

/**
 * Document cover page with AliPM branding
 */
export function getDocumentCoverPage(
  documentType: string,
  projectName: string,
  projectLocation: string,
  preparedBy: string,
  date: Date = new Date()
): string {
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #1a3a52 100%);
            color: #333;
          }
          .cover-page {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            padding: 60px 40px;
            background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #1a3a52 100%);
            color: white;
            text-align: center;
          }
          .header {
            margin-top: 40px;
          }
          .logo {
            font-size: 48px;
            font-weight: bold;
            color: ${ACCENT_COLOR};
            margin: 0;
          }
          .tagline {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            margin: 10px 0 0 0;
          }
          .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .document-type {
            font-size: 36px;
            font-weight: bold;
            margin: 0 0 30px 0;
            color: ${ACCENT_COLOR};
          }
          .project-info {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-left: 4px solid ${ACCENT_COLOR};
            margin: 20px 0;
            max-width: 500px;
          }
          .project-info-item {
            margin: 15px 0;
            font-size: 14px;
          }
          .project-info-label {
            color: ${ACCENT_COLOR};
            font-weight: bold;
          }
          .project-info-value {
            color: rgba(255, 255, 255, 0.9);
            margin-top: 5px;
          }
          .footer {
            margin-bottom: 40px;
            text-align: center;
          }
          .date {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            margin: 0;
          }
          .prepared-by {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            margin: 10px 0 0 0;
          }
        </style>
      </head>
      <body>
        <div class="cover-page">
          <div class="header">
            <p class="logo">${COMPANY_NAME}</p>
            <p class="tagline">${COMPANY_TAGLINE}</p>
          </div>

          <div class="content">
            <p class="document-type">${documentType}</p>
            
            <div class="project-info">
              <div class="project-info-item">
                <div class="project-info-label">PROJECT NAME</div>
                <div class="project-info-value">${projectName}</div>
              </div>
              <div class="project-info-item">
                <div class="project-info-label">LOCATION</div>
                <div class="project-info-value">${projectLocation}</div>
              </div>
              <div class="project-info-item">
                <div class="project-info-label">DOCUMENT TYPE</div>
                <div class="project-info-value">${documentType}</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p class="date">${formattedDate}</p>
            <p class="prepared-by">Prepared by: ${preparedBy}</p>
            <p class="date">© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Professional section header for documents
 */
export function getSectionHeader(title: string, subtitle?: string): string {
  return `
    <div style="border-bottom: 2px solid ${ACCENT_COLOR}; padding-bottom: 10px; margin: 30px 0 20px 0;">
      <h2 style="color: ${BRAND_COLOR}; font-size: 20px; margin: 0; font-weight: bold;">
        ${title}
      </h2>
      ${subtitle ? `<p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">${subtitle}</p>` : ""}
    </div>
  `;
}

/**
 * Professional table header with AliPM styling
 */
export function getTableHeader(columns: string[]): string {
  const headerCells = columns
    .map(
      (col) =>
        `<th style="background-color: ${BRAND_COLOR}; color: white; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid ${ACCENT_COLOR};">${col}</th>`
    )
    .join("");

  return `<thead><tr>${headerCells}</tr></thead>`;
}

/**
 * Professional table row with alternating colors
 */
export function getTableRow(
  cells: string[],
  isAlternate: boolean = false
): string {
  const backgroundColor = isAlternate ? "#f9f9f9" : "#ffffff";
  const rowCells = cells
    .map(
      (cell) =>
        `<td style="padding: 12px; text-align: left; background-color: ${backgroundColor}; border-bottom: 1px solid #e0e0e0;">${cell}</td>`
    )
    .join("");

  return `<tr>${rowCells}</tr>`;
}

/**
 * Professional highlight box for important information
 */
export function getHighlightBox(title: string, content: string): string {
  return `
    <div style="background-color: #f0f9ff; border-left: 4px solid ${ACCENT_COLOR}; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="color: ${BRAND_COLOR}; font-weight: bold; margin: 0 0 10px 0;">
        ${title}
      </p>
      <p style="color: #333; margin: 0; line-height: 1.6;">
        ${content}
      </p>
    </div>
  `;
}

/**
 * Professional watermark for documents
 */
export function getWatermark(): string {
  return `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); opacity: 0.1; font-size: 120px; font-weight: bold; color: ${BRAND_COLOR}; z-index: -1; pointer-events: none;">
      ${COMPANY_NAME}
    </div>
  `;
}

/**
 * Document metadata footer
 */
export function getDocumentMetadata(
  documentType: string,
  projectName: string,
  version: string = "1.0",
  confidential: boolean = false
): string {
  return `
    <div style="background-color: #f5f5f5; padding: 15px; margin-top: 40px; border-top: 1px solid #ddd; font-size: 10px; color: #666;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 5px 0;">
            <strong>Document Type:</strong> ${documentType}
          </td>
          <td style="padding: 5px 0; text-align: right;">
            <strong>Version:</strong> ${version}
          </td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">
            <strong>Project:</strong> ${projectName}
          </td>
          <td style="padding: 5px 0; text-align: right;">
            <strong>Generated:</strong> ${new Date().toLocaleString()}
          </td>
        </tr>
        ${
          confidential
            ? `
        <tr>
          <td colspan="2" style="padding: 5px 0; color: ${ACCENT_COLOR}; font-weight: bold;">
            ⚠️ CONFIDENTIAL - For authorized use only
          </td>
        </tr>
        `
            : ""
        }
      </table>
    </div>
  `;
}
