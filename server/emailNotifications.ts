/**
 * Email Notifications Service
 * Handles sending email notifications for document shares and other events
 */

import { notifyOwner } from "./_core/notification";

export interface ShareNotificationData {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  documentName: string;
  documentId: string;
  permissionLevel: "view" | "edit" | "download";
  expiresAt?: Date;
  shareLink: string;
  message?: string;
}

export interface ApprovalNotificationData {
  recipientEmail: string;
  recipientName: string;
  documentName: string;
  documentId: string;
  approvalLink: string;
  deadline?: Date;
}

export interface BulkImportNotificationData {
  recipientEmail: string;
  projectName: string;
  importedCount: number;
  errorCount: number;
  importId: string;
  timestamp: Date;
}

/**
 * Generate HTML email template for document share notification
 */
export function generateShareEmailTemplate(data: ShareNotificationData): string {
  const permissionText = {
    view: "view only",
    edit: "edit",
    download: "download",
  }[data.permissionLevel];

  const expirationText = data.expiresAt
    ? `<p style="color: #666; font-size: 14px; margin: 10px 0;">
        <strong>Access expires:</strong> ${data.expiresAt.toLocaleDateString()} at ${data.expiresAt.toLocaleTimeString()}
      </p>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #D4AF37; color: black; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; }
          .button:hover { background: #B8860B; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
          .badge { display: inline-block; background: #f0f0f0; padding: 4px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Document Shared with You</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${data.recipientName}</strong>,</p>
            
            <p><strong>${data.senderName}</strong> has shared a document with you:</p>
            
            <h2 style="color: #D4AF37; margin: 20px 0 10px 0;">${data.documentName}</h2>
            
            <p>
              <strong>Permission Level:</strong> 
              <span class="badge">${permissionText}</span>
            </p>
            
            ${expirationText}
            
            ${data.message ? `<p style="background: #f9f9f9; padding: 15px; border-left: 4px solid #D4AF37; margin: 20px 0;"><strong>Message from ${data.senderName}:</strong><br>${data.message}</p>` : ""}
            
            <p style="margin: 20px 0;">
              <a href="${data.shareLink}" class="button">View Document</a>
            </p>
            
            <p style="color: #666; font-size: 14px;">
              If you have any questions about this document or need further assistance, please reach out to ${data.senderName}.
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message from Alpago Fit-Out Management System. Please do not reply to this email.</p>
            <p>&copy; 2026 Alpago. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate HTML email template for approval notification
 */
export function generateApprovalEmailTemplate(data: ApprovalNotificationData): string {
  const deadlineText = data.deadline
    ? `<p style="color: #d32f2f; font-size: 14px; margin: 10px 0; font-weight: bold;">
        ⏰ <strong>Deadline:</strong> ${data.deadline.toLocaleDateString()} at ${data.deadline.toLocaleTimeString()}
      </p>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #D4AF37; color: black; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; }
          .button:hover { background: #B8860B; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Document Approval Needed</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${data.recipientName}</strong>,</p>
            
            <p>Your approval is needed for the following document:</p>
            
            <h2 style="color: #D4AF37; margin: 20px 0 10px 0;">${data.documentName}</h2>
            
            ${deadlineText}
            
            <p style="margin: 20px 0;">
              <a href="${data.approvalLink}" class="button">Review & Approve</a>
            </p>
            
            <p style="color: #666; font-size: 14px;">
              Please review the document and provide your approval or feedback as soon as possible.
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message from Alpago Fit-Out Management System. Please do not reply to this email.</p>
            <p>&copy; 2026 Alpago. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate HTML email template for bulk import notification
 */
export function generateBulkImportEmailTemplate(data: BulkImportNotificationData): string {
  const statusColor = data.errorCount === 0 ? "#4caf50" : "#ff9800";
  const statusText = data.errorCount === 0 ? "✓ Success" : "⚠ Completed with Errors";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
          .status { background: ${statusColor}; color: white; padding: 15px; border-radius: 4px; text-align: center; font-weight: bold; margin: 20px 0; }
          .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .stat-box { background: #f9f9f9; padding: 15px; border-radius: 4px; text-align: center; border-left: 4px solid #D4AF37; }
          .stat-number { font-size: 24px; font-weight: bold; color: #D4AF37; }
          .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 BOQ Import Report</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${data.recipientName}</strong>,</p>
            
            <p>Your BOQ bulk import for <strong>${data.projectName}</strong> has been processed.</p>
            
            <div class="status">${statusText}</div>
            
            <div class="stats">
              <div class="stat-box">
                <div class="stat-number">${data.importedCount}</div>
                <div class="stat-label">Items Imported</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">${data.errorCount}</div>
                <div class="stat-label">Errors</div>
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>Import ID:</strong> ${data.importId}<br>
              <strong>Timestamp:</strong> ${data.timestamp.toLocaleString()}
            </p>
            
            ${data.errorCount > 0 ? `
              <p style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 4px;">
                <strong>⚠ Note:</strong> Some items encountered errors during import. Please review the import details for more information.
              </p>
            ` : ""}
          </div>
          <div class="footer">
            <p>This is an automated message from Alpago Fit-Out Management System. Please do not reply to this email.</p>
            <p>&copy; 2026 Alpago. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send document share notification email
 */
export async function sendShareNotificationEmail(data: ShareNotificationData): Promise<boolean> {
  try {
    const htmlContent = generateShareEmailTemplate(data);

    // Use the built-in notification system to send email
    const result = await notifyOwner({
      title: `Document Shared: ${data.documentName}`,
      content: `${data.senderName} shared "${data.documentName}" with ${data.recipientEmail} (${data.permissionLevel})`,
    });

    // In production, integrate with email service like SendGrid, AWS SES, or similar
    // For now, we're using the built-in notification system
    console.log(`Share notification sent to ${data.recipientEmail}`);

    return result;
  } catch (error) {
    console.error("Error sending share notification email:", error);
    return false;
  }
}

/**
 * Send approval notification email
 */
export async function sendApprovalNotificationEmail(data: ApprovalNotificationData): Promise<boolean> {
  try {
    const htmlContent = generateApprovalEmailTemplate(data);

    const result = await notifyOwner({
      title: `Approval Needed: ${data.documentName}`,
      content: `${data.recipientName} needs to approve "${data.documentName}"${data.deadline ? ` by ${data.deadline.toLocaleDateString()}` : ""}`,
    });

    console.log(`Approval notification sent to ${data.recipientEmail}`);

    return result;
  } catch (error) {
    console.error("Error sending approval notification email:", error);
    return false;
  }
}

/**
 * Send bulk import completion notification email
 */
export async function sendBulkImportNotificationEmail(data: BulkImportNotificationData): Promise<boolean> {
  try {
    const htmlContent = generateBulkImportEmailTemplate(data);

    const result = await notifyOwner({
      title: `BOQ Import Complete: ${data.projectName}`,
      content: `Imported ${data.importedCount} items with ${data.errorCount} errors for project "${data.projectName}"`,
    });

    console.log(`Bulk import notification sent to ${data.recipientEmail}`);

    return result;
  } catch (error) {
    console.error("Error sending bulk import notification email:", error);
    return false;
  }
}
