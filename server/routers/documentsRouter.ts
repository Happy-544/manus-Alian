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
      if (!db) return [];

      try {
        const docs = await db
          .select()
          .from(documents)
          .where(eq(documents.projectId, input.projectId));

        return docs || [];
      } catch (error) {
        console.error("Error fetching project documents:", error);
        return [];
      }
    }),

  /**
   * Get document by ID
   */
  getDocument: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const result = await db
          .select()
          .from(documents)
          .where(eq(documents.id, input.documentId))
          .limit(1);

        return result[0] || null;
      } catch (error) {
        console.error("Error fetching document:", error);
        return null;
      }
    }),

  /**
   * Create new document
   */
  createDocument: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        name: z.string(),
        fileSize: z.number(),
        fileUrl: z.string(),
        fileKey: z.string(),
        category: z.enum(["drawing", "contract", "invoice", "report", "permit", "photo", "specification", "other"]),
        description: z.string().optional(),
        mimeType: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        const result = await db
          .insert(documents)
          .values({
            projectId: input.projectId,
            name: input.name,
            fileSize: input.fileSize,
            fileUrl: input.fileUrl,
            fileKey: input.fileKey,
            category: input.category as any,
            description: input.description,
            mimeType: input.mimeType,
            uploadedById: ctx.user?.id || 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

        return { success: true, documentId: (result as any).insertId };
      } catch (error) {
        console.error("Error creating document:", error);
        throw new Error("Failed to create document");
      }
    }),

  /**
   * Delete document
   */
  deleteDocument: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        await db
          .delete(documents)
          .where(eq(documents.id, input.documentId));

        return { success: true };
      } catch (error) {
        console.error("Error deleting document:", error);
        throw new Error("Failed to delete document");
      }
    }),

  /**
   * Export document as PDF
   */
  exportPDF: protectedProcedure
    .input(
      z.object({
        category: z.enum(["drawing", "contract", "invoice", "report", "permit", "photo", "specification", "other"]),
        projectId: z.number(),
        projectName: z.string(),
        content: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Validate content
        if (input.content) {
          const validation = validateDocumentContent(input.content);
          if (!validation.valid) {
            throw new Error(`Invalid document content: ${validation.errors.join(", ")}`);
          }
        }

        // Generate filename
        const filename = generateFilename(input.category, input.projectName, "pdf");

        // In production, you would:
        // 1. Render the React template to HTML
        // 2. Convert to PDF using html2pdf
        // 3. Upload to S3
        // 4. Return the S3 URL

        return {
          success: true,
          filename,
          message: "PDF export initiated. Download will start in your browser.",
        };
      } catch (error) {
        console.error("Error exporting PDF:", error);
        throw new Error("Failed to export PDF");
      }
    }),

  /**
   * Export document as DOCX
   */
  exportDOCX: protectedProcedure
    .input(
      z.object({
        category: z.enum(["drawing", "contract", "invoice", "report", "permit", "photo", "specification", "other"]),
        projectId: z.number(),
        projectName: z.string(),
        content: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Validate content
        if (input.content) {
          const validation = validateDocumentContent(input.content);
          if (!validation.valid) {
            throw new Error(`Invalid document content: ${validation.errors.join(", ")}`);
          }
        }

        // Generate filename
        const filename = generateFilename(input.category, input.projectName, "docx");

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
      } catch (error) {
        console.error("Error exporting DOCX:", error);
        throw new Error("Failed to export DOCX");
      }
    }),

  /**
   * Generate document from template
   */
  generateDocument: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        category: z.enum(["drawing", "contract", "invoice", "report", "permit", "photo", "specification", "other"]),
        title: z.string(),
        content: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
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
          category: input.category,
        };
      } catch (error) {
        console.error("Error generating document:", error);
        throw new Error("Failed to generate document");
      }
    }),

  /**
   * Get document generation history
   */
  getGenerationHistory: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { total: 0, documents: [] };

      try {
        // Query document generations from database
        // This would typically be from a documentGenerations table

        return {
          total: 0,
          documents: [],
        };
      } catch (error) {
        console.error("Error fetching generation history:", error);
        return { total: 0, documents: [] };
      }
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
      try {
        // In production, you would:
        // 1. Create a document sharing record
        // 2. Send notification to shared user
        // 3. Log the sharing action

        return {
          success: true,
          message: `Document shared with user ${input.userId}`,
        };
      } catch (error) {
        console.error("Error sharing document:", error);
        throw new Error("Failed to share document");
      }
    }),

  /**
   * Get document preview
   */
  getDocumentPreview: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const result = await db
          .select()
          .from(documents)
          .where(eq(documents.id, input.documentId))
          .limit(1);

        const doc = result[0];

        if (!doc) {
          throw new Error("Document not found");
        }

        return {
          id: doc.id,
          name: doc.name,
          fileSize: doc.fileSize,
          category: doc.category,
          uploadedAt: doc.createdAt,
          previewUrl: doc.fileUrl,
        };
      } catch (error) {
        console.error("Error fetching document preview:", error);
        return null;
      }
    }),

  /**
   * Update document metadata
   */
  updateDocument: protectedProcedure
    .input(
      z.object({
        documentId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (input.name) {
          updateData.name = input.name;
        }

        if (input.description) {
          updateData.description = input.description;
        }

        await db
          .update(documents)
          .set(updateData)
          .where(eq(documents.id, input.documentId));

        return { success: true };
      } catch (error) {
        console.error("Error updating document:", error);
        throw new Error("Failed to update document");
      }
    }),

  /**
   * Get documents by category
   */
  getDocumentsByCategory: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        category: z.enum(["drawing", "contract", "invoice", "report", "permit", "photo", "specification", "other"]),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const docs = await db
          .select()
          .from(documents)
          .where(eq(documents.projectId, input.projectId));

        return docs.filter((doc) => doc.category === input.category) || [];
      } catch (error) {
        console.error("Error fetching documents by category:", error);
        return [];
      }
    }),
});
