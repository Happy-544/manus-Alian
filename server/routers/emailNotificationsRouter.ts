/**
 * Email Notifications Router
 * tRPC endpoints for sending email notifications for document shares and other events
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  sendShareNotificationEmail,
  sendApprovalNotificationEmail,
  sendBulkImportNotificationEmail,
  type ShareNotificationData,
  type ApprovalNotificationData,
  type BulkImportNotificationData,
} from "../emailNotifications";

export const emailNotificationsRouter = router({
  /**
   * Send document share notification email
   */
  sendShareNotification: protectedProcedure
    .input(
      z.object({
        recipientEmail: z.string().email(),
        recipientName: z.string().min(1),
        documentName: z.string().min(1),
        documentId: z.string().min(1),
        permissionLevel: z.enum(["view", "edit", "download"]),
        expiresAt: z.date().optional(),
        shareLink: z.string().url(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const data: ShareNotificationData = {
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        senderName: "Mohamed Ali", // In production, use ctx.user.name
        documentName: input.documentName,
        documentId: input.documentId,
        permissionLevel: input.permissionLevel,
        expiresAt: input.expiresAt,
        shareLink: input.shareLink,
        message: input.message,
      };

      const result = await sendShareNotificationEmail(data);

      return {
        success: result,
        message: result
          ? `Share notification sent to ${input.recipientEmail}`
          : `Failed to send notification to ${input.recipientEmail}`,
      };
    }),

  /**
   * Send approval notification email
   */
  sendApprovalNotification: protectedProcedure
    .input(
      z.object({
        recipientEmail: z.string().email(),
        recipientName: z.string().min(1),
        documentName: z.string().min(1),
        documentId: z.string().min(1),
        approvalLink: z.string().url(),
        deadline: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const data: ApprovalNotificationData = {
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        documentName: input.documentName,
        documentId: input.documentId,
        approvalLink: input.approvalLink,
        deadline: input.deadline,
      };

      const result = await sendApprovalNotificationEmail(data);

      return {
        success: result,
        message: result
          ? `Approval notification sent to ${input.recipientEmail}`
          : `Failed to send approval notification to ${input.recipientEmail}`,
      };
    }),

  /**
   * Send bulk import completion notification email
   */
  sendBulkImportNotification: protectedProcedure
    .input(
      z.object({
        recipientEmail: z.string().email(),
        projectName: z.string().min(1),
        importedCount: z.number().int().min(0),
        errorCount: z.number().int().min(0),
        importId: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const data: BulkImportNotificationData = {
        recipientEmail: input.recipientEmail,
        projectName: input.projectName,
        importedCount: input.importedCount,
        errorCount: input.errorCount,
        importId: input.importId,
        timestamp: new Date(),
      };

      const result = await sendBulkImportNotificationEmail(data);

      return {
        success: result,
        message: result
          ? `Import notification sent to ${input.recipientEmail}`
          : `Failed to send import notification to ${input.recipientEmail}`,
      };
    }),

  /**
   * Send batch share notifications
   */
  sendBatchShareNotifications: protectedProcedure
    .input(
      z.object({
        recipients: z.array(
          z.object({
            email: z.string().email(),
            name: z.string().min(1),
          })
        ),
        documentName: z.string().min(1),
        documentId: z.string().min(1),
        permissionLevel: z.enum(["view", "edit", "download"]),
        shareLink: z.string().url(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const results = await Promise.all(
        input.recipients.map((recipient) =>
          sendShareNotificationEmail({
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            senderName: "Mohamed Ali",
            documentName: input.documentName,
            documentId: input.documentId,
            permissionLevel: input.permissionLevel,
            shareLink: input.shareLink,
            message: input.message,
          })
        )
      );

      const successCount = results.filter((r) => r).length;
      const failureCount = results.length - successCount;

      return {
        success: failureCount === 0,
        successCount,
        failureCount,
        message: `Sent ${successCount} notifications${failureCount > 0 ? ` (${failureCount} failed)` : ""}`,
      };
    }),

  /**
   * Resend failed notification
   */
  resendNotification: protectedProcedure
    .input(
      z.object({
        type: z.enum(["share", "approval", "import"]),
        recipientEmail: z.string().email(),
        notificationData: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        let result = false;

        switch (input.type) {
          case "share":
            result = await sendShareNotificationEmail(
              input.notificationData as unknown as ShareNotificationData
            );
            break;
          case "approval":
            result = await sendApprovalNotificationEmail(
              input.notificationData as unknown as ApprovalNotificationData
            );
            break;
          case "import":
            result = await sendBulkImportNotificationEmail(
              input.notificationData as unknown as BulkImportNotificationData
            );
            break;
        }

        return {
          success: result,
          message: result
            ? `${input.type} notification resent to ${input.recipientEmail}`
            : `Failed to resend ${input.type} notification`,
        };
      } catch (error) {
        return {
          success: false,
          message: `Error resending notification: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    }),
});
