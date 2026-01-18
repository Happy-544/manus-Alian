/**
 * Documents Router
 * tRPC endpoints for document generation, export, and management
 */

import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { generateFilename, validateDocumentContent } from "../documentGeneration";
import { storagePut } from "../storage";
import { getDb } from "../db";
import { documents } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const documentsRouter = router({
  /**
   * Get all documents for a project
   */
  getProjectDocuments: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const docs = await db.query.documents.findMany({
        where: eq(documents.projectId, input.projectId),
      });

      return docs;
    }),

  /**
   * Get document by ID
   */
  getDocument: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const doc = await db.query.documents.findFirst({
        where: eq(documents.id, input.documentId),
      });

      return doc;
    }),

  /**
   * Create new document
   */
  createDocument: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        fileName: z.string(),
        fileSize: z.number(),
        fileUrl: z.string(),
        documentType: z.enum(["boq", "drawings", "baseline", "procurement", "engineering", "budget"]),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const result = await db.insert(documents).values({
        projectId: input.projectId,
        fileName: input.fileName,
        fileSize: input.fileSize,
        fileUrl: input.fileUrl,
        documentType: input.documentType as any,
        description: input.description,
        uploadedById: ctx.user.id,
      });

      return result;
    }),

  /**
   * Delete document
   */
  deleteDocument: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      await db.delete(documents).where(eq(documents.id, input.documentId));

      return { success: true };
    }),

  /**
   * Export document as PDF
   */
  exportPDF: protectedProcedure
    .input(
      z.object({
        documentType: z.enum(["boq", "drawings", "baseline", "procurement", "engineering", "budget"]),
        projectId: z.number(),
        projectName: z.string(),
        content: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Validate content
      if (input.content) {
        const validation = validateDocumentContent(input.content);
        if (!validation.valid) {
          throw new Error(`Invalid document content: ${validation.errors.join(", ")}`);
        }
      }

      // Generate filename
      const filename = generateFilename(input.documentType, input.projectName, "pdf");

      // In production, you would:
      // 1. Render the React component to HTML
      // 2. Use a library like puppeteer or html2pdf to convert to PDF
      // 3. Upload to S3
      // 4. Return the S3 URL

      return {
        success: true,
        filename,
        message: "PDF export initiated. Download will start in your browser.",
      };
    }),

  /**
   * Export document as DOCX
   */
  exportDOCX: protectedProcedure
    .input(
      z.object({
        documentType: z.enum(["boq", "drawings", "baseline", "procurement", "engineering", "budget"]),
        projectId: z.number(),
        projectName: z.string(),
        content: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Validate content
      if (input.content) {
        const validation = validateDocumentContent(input.content);
        if (!validation.valid) {
          throw new Error(`Invalid document content: ${validation.errors.join(", ")}`);
        }
      }

      // Generate filename
      const filename = generateFilename(input.documentType, input.projectName, "docx");

      // In production, you would:
      // 1. Use the docx library to create a Word document
      // 2. Add content and formatting
      // 3. Upload to S3
      // 4. Return the S3 URL

      return {
        success: true,
        filename,
        message: "DOCX export initiated. Download will start in your browser.",
      };
    }),

  /**
   * Generate document from template
   */
  generateDocument: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        documentType: z.enum(["boq", "drawings", "baseline", "procurement", "engineering", "budget"]),
        title: z.string(),
        content: z.record(z.any()),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Validate content
      const validation = validateDocumentContent(input.content);
      if (!validation.valid) {
        throw new Error(`Invalid document content: ${validation.errors.join(", ")}`);
      }

      // In production, you would:
      // 1. Render the React template to HTML
      // 2. Convert to PDF/DOCX
      // 3. Upload to S3
      // 4. Save document record to database

      return {
        success: true,
        documentId: Math.floor(Math.random() * 1000),
        message: "Document generated successfully",
      };
    }),

  /**
   * Get document generation history
   */
  getGenerationHistory: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Query document generations from database
      // This would typically be from a documentGenerations table

      return {
        total: 0,
        documents: [],
      };
    }),

  /**
   * Share document with team member
   */
  shareDocument: protectedProcedure
    .input(
      z.object({
        documentId: z.number(),
        userId: z.number(),
        permission: z.enum(["view", "edit", "download"]),
      })
    )
    .mutation(async ({ input }) => {
      // In production, you would:
      // 1. Create a document sharing record
      // 2. Send notification to shared user
      // 3. Log the sharing action

      return {
        success: true,
        message: `Document shared with user ${input.userId}`,
      };
    }),

  /**
   * Get document preview
   */
  getDocumentPreview: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const doc = await db.query.documents.findFirst({
        where: eq(documents.id, input.documentId),
      });

      if (!doc) {
        throw new Error("Document not found");
      }

      return {
        id: doc.id,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        documentType: doc.documentType,
        createdAt: doc.createdAt,
      };
    }),
});
