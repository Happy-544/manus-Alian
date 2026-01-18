/**
 * Document Sharing Router
 * tRPC router for document versioning and sharing with permission management
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { documentVersions, documentComments } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

// Zod schemas for validation
const createVersionSchema = z.object({
  generationId: z.number(),
  projectId: z.number(),
  versionNumber: z.number(),
  content: z.string(),
  changesSummary: z.string().optional(),
  changeType: z.enum(["initial", "updated", "approved", "exported"]).default("initial"),
});

const addCommentSchema = z.object({
  generationId: z.number(),
  projectId: z.number(),
  content: z.string().min(1, "Comment cannot be empty"),
  sectionReference: z.string().optional(),
});

export const documentSharingRouter = router({
  /**
   * Create a new document version
   */
  createVersion: protectedProcedure
    .input(createVersionSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        const result = await db
          .insert(documentVersions)
          .values({
            generationId: input.generationId,
            projectId: input.projectId,
            versionNumber: input.versionNumber,
            content: input.content,
            changesSummary: input.changesSummary,
            changedBy: ctx.user?.id || 0,
            changeType: input.changeType as any,
            createdAt: new Date(),
          });

        return { success: true, versionId: (result as any).insertId };
      } catch (error) {
        console.error("Error creating document version:", error);
        throw new Error("Failed to create document version");
      }
    }),

  /**
   * Get all versions for a generation
   */
  getVersions: publicProcedure
    .input(z.object({ generationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const result = await db
          .select()
          .from(documentVersions)
          .where(eq(documentVersions.generationId, input.generationId))
          .orderBy(desc(documentVersions.createdAt));

        return result || [];
      } catch (error) {
        console.error("Error fetching document versions:", error);
        return [];
      }
    }),

  /**
   * Get a specific document version
   */
  getVersion: publicProcedure
    .input(z.object({ versionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const result = await db
          .select()
          .from(documentVersions)
          .where(eq(documentVersions.id, input.versionId))
          .limit(1);

        return result[0] || null;
      } catch (error) {
        console.error("Error fetching document version:", error);
        return null;
      }
    }),

  /**
   * Delete a document version
   */
  deleteVersion: protectedProcedure
    .input(z.object({ versionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        // Check if version exists
        const version = await db
          .select()
          .from(documentVersions)
          .where(eq(documentVersions.id, input.versionId))
          .limit(1);

        if (!version[0]) {
          throw new Error("Version not found");
        }

        await db
          .delete(documentVersions)
          .where(eq(documentVersions.id, input.versionId));

        return { success: true };
      } catch (error) {
        console.error("Error deleting document version:", error);
        throw new Error("Failed to delete document version");
      }
    }),

  /**
   * Add a comment to a document
   */
  addComment: protectedProcedure
    .input(addCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        const result = await db
          .insert(documentComments)
          .values({
            generationId: input.generationId,
            projectId: input.projectId,
            userId: ctx.user?.id || 0,
            content: input.content,
            sectionReference: input.sectionReference,
            isResolved: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

        return { success: true, commentId: (result as any).insertId };
      } catch (error) {
        console.error("Error adding comment:", error);
        throw new Error("Failed to add comment");
      }
    }),

  /**
   * Get comments for a document generation
   */
  getComments: publicProcedure
    .input(z.object({ generationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const result = await db
          .select()
          .from(documentComments)
          .where(eq(documentComments.generationId, input.generationId))
          .orderBy(desc(documentComments.createdAt));

        return result || [];
      } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
      }
    }),

  /**
   * Delete a comment
   */
  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        await db
          .delete(documentComments)
          .where(eq(documentComments.id, input.commentId));

        return { success: true };
      } catch (error) {
        console.error("Error deleting comment:", error);
        throw new Error("Failed to delete comment");
      }
    }),

  /**
   * Get document sharing info (versions and comments)
   */
  getSharingInfo: protectedProcedure
    .input(z.object({ generationId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { versions: [], comments: [] };

      try {
        // Get all versions
        const versions = await db
          .select()
          .from(documentVersions)
          .where(eq(documentVersions.generationId, input.generationId))
          .orderBy(desc(documentVersions.createdAt));

        // Get all comments
        const comments = await db
          .select()
          .from(documentComments)
          .where(eq(documentComments.generationId, input.generationId))
          .orderBy(desc(documentComments.createdAt));

        return {
          versions: versions || [],
          comments: comments || [],
        };
      } catch (error) {
        console.error("Error fetching sharing info:", error);
        return { versions: [], comments: [] };
      }
    }),

  /**
   * Get latest version of a document
   */
  getLatestVersion: publicProcedure
    .input(z.object({ generationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const result = await db
          .select()
          .from(documentVersions)
          .where(eq(documentVersions.generationId, input.generationId))
          .orderBy(desc(documentVersions.createdAt))
          .limit(1);

        return result[0] || null;
      } catch (error) {
        console.error("Error fetching latest version:", error);
        return null;
      }
    }),

  /**
   * Get version count for a document
   */
  getVersionCount: publicProcedure
    .input(z.object({ generationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return 0;

      try {
        const result = await db
          .select()
          .from(documentVersions)
          .where(eq(documentVersions.generationId, input.generationId));

        return result?.length || 0;
      } catch (error) {
        console.error("Error fetching version count:", error);
        return 0;
      }
    }),

  /**
   * Get comment count for a document
   */
  getCommentCount: publicProcedure
    .input(z.object({ generationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return 0;

      try {
        const result = await db
          .select()
          .from(documentComments)
          .where(eq(documentComments.generationId, input.generationId));

        return result?.length || 0;
      } catch (error) {
        console.error("Error fetching comment count:", error);
        return 0;
      }
    }),

  /**
   * Resolve a comment
   */
  resolveComment: protectedProcedure
    .input(z.object({ commentId: z.number(), resolved: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        await db
          .update(documentComments)
          .set({
            isResolved: input.resolved,
            updatedAt: new Date(),
          })
          .where(eq(documentComments.id, input.commentId));

        return { success: true };
      } catch (error) {
        console.error("Error resolving comment:", error);
        throw new Error("Failed to resolve comment");
      }
    }),

  /**
   * Get unresolved comments for a document
   */
  getUnresolvedComments: publicProcedure
    .input(z.object({ generationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const result = await db
          .select()
          .from(documentComments)
          .where(
            and(
              eq(documentComments.generationId, input.generationId),
              eq(documentComments.isResolved, false)
            )
          )
          .orderBy(desc(documentComments.createdAt));

        return result || [];
      } catch (error) {
        console.error("Error fetching unresolved comments:", error);
        return [];
      }
    }),
});
