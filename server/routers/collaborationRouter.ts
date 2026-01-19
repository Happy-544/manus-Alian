import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  createCollaborationSession,
  addActiveUser,
  removeActiveUser,
  getActiveUsers,
  updateCursorPosition,
  getCursorPositions,
  recordDocumentChange,
  updateUserTypingStatus,
} from "../collaborationService";
import {
  createEmailVerification,
  verifyEmailWithToken,
  isEmailVerified,
  resendVerificationEmail,
  getVerificationStatus,
} from "../emailVerificationService";

export const collaborationRouter = router({
  // Collaboration endpoints
  createSession: protectedProcedure
    .input(
      z.object({
        documentId: z.number(),
        expiresInMinutes: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const sessionId = await createCollaborationSession(
          input.documentId,
          input.expiresInMinutes
        );
        return { success: true, sessionId };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to create session",
        };
      }
    }),

  joinSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        documentId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await addActiveUser(input.sessionId, ctx.user.id, input.documentId);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to join session",
        };
      }
    }),

  leaveSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await removeActiveUser(input.sessionId, ctx.user.id);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to leave session",
        };
      }
    }),

  getActiveUsers: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      try {
        const users = await getActiveUsers(input.sessionId);
        return { success: true, users };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to get active users",
          users: [],
        };
      }
    }),

  updateCursor: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        documentId: z.number(),
        position: z.number(),
        line: z.number(),
        column: z.number(),
        selection: z
          .object({
            start: z.number(),
            end: z.number(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await updateCursorPosition(
          input.sessionId,
          ctx.user.id,
          input.documentId,
          input.position,
          input.line,
          input.column,
          input.selection
        );
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to update cursor",
        };
      }
    }),

  getCursorPositions: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      try {
        const positions = await getCursorPositions(input.sessionId);
        return { success: true, positions };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to get cursor positions",
          positions: [],
        };
      }
    }),

  recordChange: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        documentId: z.number(),
        changeType: z.enum(["insert", "delete", "replace", "format"]),
        position: z.number(),
        content: z.string().optional(),
        deletedContent: z.string().optional(),
        version: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await recordDocumentChange(
          input.documentId,
          input.sessionId,
          ctx.user.id,
          input.changeType,
          input.position,
          input.content,
          input.deletedContent,
          input.version
        );
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to record change",
        };
      }
    }),

  setTypingStatus: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        isTyping: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await updateUserTypingStatus(input.sessionId, ctx.user.id, input.isTyping);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to update typing status",
        };
      }
    }),

  // Email verification endpoints
  sendVerificationEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await createEmailVerification(ctx.user.id, input.email);
        // In production, send email via SMTP service
        return { success: true, verificationUrl: result.verificationUrl };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to send verification email",
        };
      }
    }),

  verifyEmail: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = await verifyEmailWithToken(input.token);
        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to verify email",
        };
      }
    }),

  isEmailVerified: protectedProcedure.query(async ({ ctx }) => {
    try {
      const verified = await isEmailVerified(ctx.user.id);
      return { verified };
    } catch (error) {
      return { verified: false };
    }
  }),

  resendVerificationEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await resendVerificationEmail(ctx.user.id, input.email);
        return { success: true, verificationUrl: result.verificationUrl };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to resend verification email",
        };
      }
    }),

  getVerificationStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const status = await getVerificationStatus(ctx.user.id);
      return { success: true, ...status };
    } catch (error) {
      return {
        success: false,
        verified: false,
        email: null,
        verifiedAt: null,
      };
    }
  }),
});
