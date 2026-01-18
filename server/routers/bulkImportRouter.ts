/**
 * Bulk Import tRPC Router
 * Handles bulk import operations for template suggestions
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  parseCSV,
  parseJSON,
  createBulkImport,
  getBulkImportProgress,
  processBulkImport,
  getBulkImportResults,
  deleteBulkImport,
} from "../bulkImportService";
import { TRPCError } from "@trpc/server";

export const bulkImportRouter = router({
  /**
   * Upload and parse a bulk import file
   */
  uploadFile: protectedProcedure
    .input(
      z.object({
        fileName: z.string().min(1),
        fileContent: z.string().min(1),
        fileType: z.enum(["csv", "json"]),
        fileSize: z.number().positive(),
      })
    )
    .mutation(async ({ input, ctx }: { input: { fileName: string; fileContent: string; fileType: "csv" | "json"; fileSize: number }; ctx: any }) => {
      try {
        // Parse file based on type
        let projects;
        if (input.fileType === "csv") {
          projects = parseCSV(input.fileContent);
        } else {
          projects = parseJSON(input.fileContent);
        }

        // Create bulk import record
        const bulkImportId = await createBulkImport(
          ctx.user.id,
          input.fileName,
          input.fileSize,
          input.fileType,
          projects
        );

        return {
          bulkImportId,
          totalItems: projects.length,
          message: `Successfully parsed ${projects.length} projects from file`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error ? error.message : "Failed to parse file",
        });
      }
    }),

  /**
   * Start processing a bulk import
   */
  startProcessing: protectedProcedure
    .input(
      z.object({
        bulkImportId: z.number().positive(),
      })
    )
    .mutation(async ({ input, ctx }: { input: { bulkImportId: number }; ctx: any }) => {
      try {
        // Process in background (fire and forget)
        processBulkImport(input.bulkImportId, ctx.user.id).catch((error) => {
          console.error("Bulk import processing error:", error);
        });

        return {
          message: "Processing started",
          bulkImportId: input.bulkImportId,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to start processing",
        });
      }
    }),

  /**
   * Get bulk import progress
   */
  getProgress: protectedProcedure
    .input(
      z.object({
        bulkImportId: z.number().positive(),
      })
    )
    .query(async ({ input }: { input: { bulkImportId: number } }) => {
      try {
        const progress = await getBulkImportProgress(input.bulkImportId);
        return progress;
      } catch (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            error instanceof Error ? error.message : "Bulk import not found",
        });
      }
    }),

  /**
   * Get bulk import results
   */
  getResults: protectedProcedure
    .input(
      z.object({
        bulkImportId: z.number().positive(),
      })
    )
    .query(async ({ input }: { input: { bulkImportId: number } }) => {
      try {
        const results = await getBulkImportResults(input.bulkImportId);
        return results;
      } catch (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            error instanceof Error ? error.message : "Results not found",
        });
      }
    }),

  /**
   * Delete a bulk import and its results
   */
  delete: protectedProcedure
    .input(
      z.object({
        bulkImportId: z.number().positive(),
      })
    )
    .mutation(async ({ input }: { input: { bulkImportId: number } }) => {
      try {
        await deleteBulkImport(input.bulkImportId);
        return {
          message: "Bulk import deleted successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to delete",
        });
      }
    }),

  /**
   * Export results to CSV format
   */
  exportResults: protectedProcedure
    .input(
      z.object({
        bulkImportId: z.number().positive(),
      })
    )
    .query(async ({ input }: { input: { bulkImportId: number } }) => {
      try {
        const results = await getBulkImportResults(input.bulkImportId);

        // Generate CSV content
        let csvContent =
          "Project Name,Project Description,Template Name,Category,Confidence Score,Matching Reasons\n";

        for (const result of results) {
          const item = result.item;
          const suggestions = result.suggestions;

          if (suggestions.length === 0) {
            csvContent += `"${escapeCSV(item.projectName)}","${escapeCSV(item.projectDescription)}","No suggestions","N/A","N/A","N/A"\n`;
          } else {
            for (const suggestion of suggestions) {
              const reasons = suggestion.matchingReasons
                .join("; ")
                .substring(0, 500);
              csvContent += `"${escapeCSV(item.projectName)}","${escapeCSV(item.projectDescription)}","${escapeCSV(suggestion.templateName)}","${escapeCSV(suggestion.category)}","${suggestion.confidenceScore}%","${escapeCSV(reasons)}"\n`;
            }
          }
        }

        return {
          csvContent,
          fileName: `bulk-import-results-${input.bulkImportId}-${Date.now()}.csv`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to export",
        });
      }
    }),
});

/**
 * Escape CSV special characters
 */
function escapeCSV(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/"/g, '""')
    .substring(0, 1000);
}
