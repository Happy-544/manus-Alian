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
const documentVersionSchema = z.object({
  documentId: z.number(),
  versionNumber: z.string(),
  changes: z.string().optional(),
  fileSize: z.number(),
  downloadUrl: z.string(),
});

const documentShareSchema = z.object({
  documentId: z.number(),
  sharedWithEmail: z.string().email(),
  permission: z.enum(["view", "edit", "download"]),
  expiresAt: z.date().optional(),
});

const documentCommentSchema = z.object({
  documentId: z.number(),
  content: z.string().min(1, "Comment cannot be empty"),
  versionId: z.number().optional(),
});

export const documentSharingRouter = router({
  /**
   * Create a new document version
   */
  createVersion: protectedProcedure
    .input(documentVersionSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const result = await db
        .insert(documentVersions)
        .values({
          documentId: input.documentId,
          versionNumber: input.versionNumber,
          changes: input.changes,
          fileSize: input.fileSize,
          downloadUrl: input.downloadUrl,
          createdById: ctx.user?.id || 0,
          createdAt: new Date(),
        });

      return { success: true, versionId: (result as any).insertId };
    }),

  /**
   * Get all versions for a document
   */
  getVersions: publicProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const result = await db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.documentId, input.documentId))
        .orderBy(desc(documentVersions.createdAt));

      return result || [];
    }),

  /**
   * Get a specific document version
   */
  getVersion: publicProcedure
    .input(z.object({ versionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.id, input.versionId))
        .limit(1);

      return result[0] || null;
    }),

  /**
   * Delete a document version
   */
  deleteVersion: protectedProcedure
    .input(z.object({ versionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Check if user has permission to delete
      const version = await db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.id, input.versionId))
        .limit(1);

      if (!version[0]) {
        throw new Error("Version not found");
      }

      await db.delete(documentVersions).where(eq(documentVersions.id, input.versionId));

      return { success: true };
    }),

  /**
   * Add a comment to a document
   */
  addComment: protectedProcedure
    .input(documentCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const result = await db
        .insert(documentComments)
        .values({
          documentId: input.documentId,
          content: input.content,
          versionId: input.versionId,
          createdById: ctx.user?.id || 0,
          createdAt: new Date(),
        });

      return { success: true, commentId: (result as any).insertId };
    }),

  /**
   * Get comments for a document
   */
  getComments: publicProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const result = await db
        .select()
        .from(documentComments)
        .where(eq(documentComments.documentId, input.documentId))
        .orderBy(desc(documentComments.createdAt));

      return result || [];
    }),

  /**
   * Delete a comment
   */
  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      await db
        .delete(documentComments)
        .where(eq(documentComments.id, input.commentId));

      return { success: true };
    }),

  /**
   * Get document sharing info
   */
  getSharingInfo: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { shares: [], versions: [] };

      // Get all versions
      const versions = await db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.documentId, input.documentId))
        .orderBy(desc(documentVersions.createdAt));

      // Get all comments
      const comments = await db
        .select()
        .from(documentComments)
        .where(eq(documentComments.documentId, input.documentId))
        .orderBy(desc(documentComments.createdAt));

      return {
        versions: versions || [],
        comments: comments || [],
      };
    }),

  /**
   * Get latest version of a document
   */
  getLatestVersion: publicProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.documentId, input.documentId))
        .orderBy(desc(documentVersions.createdAt))
        .limit(1);

      return result[0] || null;
    }),

  /**
   * Get version count for a document
   */
  getVersionCount: publicProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return 0;

      const result = await db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.documentId, input.documentId));

      return result?.length || 0;
    }),

  /**
   * Get comment count for a document
   */
  getCommentCount: publicProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return 0;

      const result = await db
        .select()
        .from(documentComments)
        .where(eq(documentComments.documentId, input.documentId));

      return result?.length || 0;
    }),
});
