/**
 * BOQ Excel Import Router
 * tRPC endpoints for importing BOQ data from Excel files
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  parseBOQExcel,
  validateBOQImportData,
  calculateBOQTotalCost,
  groupBOQByCategory,
  getBOQImportSummary,
  generateBOQTemplate,
  type BOQImportRow,
} from "../boqExcelImport";

export const boqExcelImportRouter = router({
  /**
   * Download BOQ Excel template
   */
  downloadTemplate: protectedProcedure.query(async () => {
    try {
      const buffer = generateBOQTemplate();
      return {
        success: true,
        fileName: "BOQ_Template.xlsx",
        fileSize: buffer.length,
        // In production, return a signed URL or use file storage
        message: "Template generated successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate template",
      };
    }
  }),

  /**
   * Parse and validate BOQ Excel file
   */
  parseExcelFile: protectedProcedure
    .input(
      z.object({
        fileBuffer: z.instanceof(Buffer),
        fileName: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Parse Excel file
        const parseResult = parseBOQExcel(input.fileBuffer);

        if (!parseResult.success && parseResult.errorRows > 0) {
          return {
            success: false,
            message: `Failed to parse file. ${parseResult.errorRows} error(s) found.`,
            errors: parseResult.errors,
            data: [],
          };
        }

        // Validate parsed data
        const validationResult = validateBOQImportData(parseResult.data);

        return {
          success: validationResult.success,
          totalRows: validationResult.totalRows,
          importedRows: validationResult.importedRows,
          errorRows: validationResult.errorRows,
          errors: validationResult.errors,
          data: validationResult.data,
          message: validationResult.success
            ? `Successfully parsed ${validationResult.importedRows} items`
            : `Parsed with ${validationResult.errorRows} error(s)`,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Failed to parse Excel file",
          errors: [
            {
              rowNumber: 1,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          ],
          data: [],
        };
      }
    }),

  /**
   * Get BOQ import summary
   */
  getSummary: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            description: z.string(),
            category: z.string(),
            quantity: z.number(),
            unitOfMeasure: z.string(),
            unitPrice: z.number().optional(),
            supplier: z.string().optional(),
            leadTime: z.number().optional(),
            notes: z.string().optional(),
            material: z.string().optional(),
            brand: z.string().optional(),
          })
        ),
      })
    )
    .query(({ input }) => {
      try {
        const summary = getBOQImportSummary(input.items as BOQImportRow[]);
        return {
          success: true,
          summary,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Failed to generate summary",
          summary: null,
        };
      }
    }),

  /**
   * Group BOQ items by category
   */
  groupByCategory: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            description: z.string(),
            category: z.string(),
            quantity: z.number(),
            unitOfMeasure: z.string(),
            unitPrice: z.number().optional(),
            supplier: z.string().optional(),
            leadTime: z.number().optional(),
            notes: z.string().optional(),
            material: z.string().optional(),
            brand: z.string().optional(),
          })
        ),
      })
    )
    .query(({ input }) => {
      try {
        const grouped = groupBOQByCategory(input.items as BOQImportRow[]);
        return {
          success: true,
          categories: Object.entries(grouped).map(([category, items]) => ({
            category,
            itemCount: items.length,
            items,
          })),
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Failed to group items",
          categories: [],
        };
      }
    }),

  /**
   * Calculate total cost for BOQ items
   */
  calculateTotalCost: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            description: z.string(),
            category: z.string(),
            quantity: z.number(),
            unitOfMeasure: z.string(),
            unitPrice: z.number().optional(),
            supplier: z.string().optional(),
            leadTime: z.number().optional(),
            notes: z.string().optional(),
            material: z.string().optional(),
            brand: z.string().optional(),
          })
        ),
      })
    )
    .query(({ input }) => {
      try {
        const totalCost = calculateBOQTotalCost(input.items as BOQImportRow[]);
        const itemsWithPrice = input.items.filter((item) => item.unitPrice).length;
        const itemsWithoutPrice = input.items.length - itemsWithPrice;

        return {
          success: true,
          totalCost,
          itemsWithPrice,
          itemsWithoutPrice,
          estimatedCost: totalCost,
          message: `Total cost: AED ${totalCost.toFixed(2)}${itemsWithoutPrice > 0 ? ` (${itemsWithoutPrice} items without price)` : ""}`,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Failed to calculate cost",
          totalCost: 0,
          itemsWithPrice: 0,
          itemsWithoutPrice: 0,
        };
      }
    }),

  /**
   * Validate BOQ data before import
   */
  validateData: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            description: z.string(),
            category: z.string(),
            quantity: z.number(),
            unitOfMeasure: z.string(),
            unitPrice: z.number().optional(),
            supplier: z.string().optional(),
            leadTime: z.number().optional(),
            notes: z.string().optional(),
            material: z.string().optional(),
            brand: z.string().optional(),
          })
        ),
      })
    )
    .mutation(({ input }) => {
      try {
        const validationResult = validateBOQImportData(input.items as BOQImportRow[]);

        return {
          success: validationResult.success,
          totalRows: validationResult.totalRows,
          validRows: validationResult.importedRows,
          errorRows: validationResult.errorRows,
          errors: validationResult.errors,
          message: validationResult.success
            ? "All items are valid"
            : `${validationResult.errorRows} item(s) have validation errors`,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Validation failed",
          totalRows: 0,
          validRows: 0,
          errorRows: 0,
          errors: [],
        };
      }
    }),

  /**
   * Import BOQ items to project
   */
  importToProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
        items: z.array(
          z.object({
            description: z.string(),
            category: z.string(),
            quantity: z.number(),
            unitOfMeasure: z.string(),
            unitPrice: z.number().optional(),
            supplier: z.string().optional(),
            leadTime: z.number().optional(),
            notes: z.string().optional(),
            material: z.string().optional(),
            brand: z.string().optional(),
          })
        ),
        sendNotification: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // In production, this would save items to the database
        // For now, return success with import summary

        const summary = getBOQImportSummary(input.items as BOQImportRow[]);

        return {
          success: true,
          projectId: input.projectId,
          importedCount: input.items.length,
          totalCost: summary.totalCost,
          summary,
          message: `Successfully imported ${input.items.length} items to project ${input.projectId}`,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Failed to import items",
          projectId: input.projectId,
          importedCount: 0,
        };
      }
    }),
});
