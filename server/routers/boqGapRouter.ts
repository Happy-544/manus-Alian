/**
 * tRPC Router for BOQ Gap Completion
 * Handles gap detection, suggestion generation, and data persistence
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  detectMissingData,
  generateGapAnalysisWithSuggestions,
  suggestUnitPrice,
  suggestSuppliers,
  suggestLeadTime,
  validateBOQData,
  type BOQLineItem,
} from "../boqGapCompletion";

/**
 * BOQ Line Item Schema for validation
 */
const BOQLineItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  quantity: z.number().positive(),
  unit: z.string(),
  unitPrice: z.number().optional(),
  supplier: z.string().optional(),
  leadTime: z.number().optional(),
  category: z.string(),
  material: z.string().optional(),
  brand: z.string().optional(),
  drawingReference: z.string().optional(),
  location: z.string().optional(),
});

/**
 * tRPC Router for BOQ Gap Completion
 */
export const boqGapRouter = router({
  /**
   * Analyze BOQ items and detect missing data
   * Returns gap analysis for all items
   */
  analyzeGaps: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        items: z.array(BOQLineItemSchema),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { projectId, items } = input;

        // Detect gaps in the provided items
        const gaps = detectMissingData(items as BOQLineItem[]);

        // Filter high and medium severity gaps
        const criticalGaps = gaps.filter(
          (gap) => gap.severity === "HIGH" || gap.severity === "MEDIUM"
        );

        return {
          success: true,
          totalItems: items.length,
          itemsWithGaps: gaps.length,
          criticalGaps: criticalGaps.length,
          gaps: gaps,
          timestamp: new Date(),
        };
      } catch (error) {
        console.error("Error analyzing BOQ gaps:", error);
        return {
          success: false,
          error: "Failed to analyze BOQ gaps",
          gaps: [],
        };
      }
    }),

  /**
   * Generate suggestions for a specific BOQ item
   * Provides AI-powered suggestions for missing fields
   */
  generateSuggestions: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        item: BOQLineItemSchema,
        fields: z.array(z.string()), // Fields to generate suggestions for
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { projectId, item, fields } = input;
        const suggestions: Record<string, any> = {};

        // Generate suggestions for each requested field
        for (const field of fields) {
          if (field === "unitPrice") {
            suggestions.unitPrice = await suggestUnitPrice(item as BOQLineItem);
          } else if (field === "supplier") {
            suggestions.supplier = await suggestSuppliers(item as BOQLineItem);
          } else if (field === "leadTime") {
            suggestions.leadTime = await suggestLeadTime(
              item as BOQLineItem,
              item.supplier
            );
          }
        }

        return {
          success: true,
          itemId: item.id,
          suggestions,
          timestamp: new Date(),
        };
      } catch (error) {
        console.error("Error generating suggestions:", error);
        return {
          success: false,
          error: "Failed to generate suggestions",
          suggestions: {},
        };
      }
    }),

  /**
   * Get comprehensive gap analysis with suggestions
   * Analyzes gaps and generates suggestions for all items
   */
  analyzeWithSuggestions: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        items: z.array(BOQLineItemSchema),
        includeMarketData: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { projectId, items, includeMarketData } = input;

        // Generate comprehensive gap analysis with suggestions
        const gapAnalysis = await generateGapAnalysisWithSuggestions(
          items as BOQLineItem[],
          includeMarketData ? {} : undefined,
          undefined
        );

        // Group gaps by severity
        const gapsBySeverity = {
          HIGH: gapAnalysis.filter((g) => g.severity === "HIGH"),
          MEDIUM: gapAnalysis.filter((g) => g.severity === "MEDIUM"),
          LOW: gapAnalysis.filter((g) => g.severity === "LOW"),
        };

        return {
          success: true,
          totalItems: items.length,
          gapAnalysis,
          gapsBySeverity,
          summary: {
            totalGaps: gapAnalysis.length,
            highSeverity: gapsBySeverity.HIGH.length,
            mediumSeverity: gapsBySeverity.MEDIUM.length,
            lowSeverity: gapsBySeverity.LOW.length,
          },
          timestamp: new Date(),
        };
      } catch (error) {
        console.error("Error analyzing with suggestions:", error);
        return {
          success: false,
          error: "Failed to analyze BOQ with suggestions",
          gapAnalysis: [],
          gapsBySeverity: { HIGH: [], MEDIUM: [], LOW: [] },
          summary: {
            totalGaps: 0,
            highSeverity: 0,
            mediumSeverity: 0,
            lowSeverity: 0,
          },
        };
      }
    }),

  /**
   * Validate completed BOQ item
   * Checks if all required fields are filled and valid
   */
  validateItem: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        item: BOQLineItemSchema,
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { projectId, item } = input;

        // Validate the item
        const validation = validateBOQData(item as BOQLineItem);

        return {
          success: validation.isValid,
          itemId: item.id,
          isValid: validation.isValid,
          errors: validation.errors,
          timestamp: new Date(),
        };
      } catch (error) {
        console.error("Error validating item:", error);
        return {
          success: false,
          itemId: item.id,
          isValid: false,
          errors: ["Validation failed"],
        };
      }
    }),

  /**
   * Batch generate suggestions for multiple items
   * Efficient endpoint for generating suggestions for all items at once
   */
  batchGenerateSuggestions: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        items: z.array(BOQLineItemSchema),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { projectId, items } = input;

        // Generate suggestions for all items in parallel
        const suggestionsMap: Record<string, Record<string, any>> = {};

        await Promise.all(
          items.map(async (itemData: any) => {
            const gaps = detectMissingData([itemData as BOQLineItem])[0];
            if (gaps && gaps.missingFields.length > 0) {
              suggestionsMap[itemData.id] = {};

              // Generate suggestions for each missing field
              for (const field of gaps.missingFields) {
                if (field === "unitPrice") {
                  suggestionsMap[itemData.id].unitPrice = await suggestUnitPrice(
                    itemData as BOQLineItem
                  );
                } else if (field === "supplier") {
                  suggestionsMap[itemData.id].supplier = await suggestSuppliers(
                    itemData as BOQLineItem
                  );
                } else if (field === "leadTime") {
                  suggestionsMap[itemData.id].leadTime = await suggestLeadTime(
                    itemData as BOQLineItem,
                    itemData.supplier
                  );
                }
              }
            }
          })
        );

        return {
          success: true,
          projectId,
          itemsProcessed: items.length,
          itemsWithSuggestions: Object.keys(suggestionsMap).length,
          suggestions: suggestionsMap,
          timestamp: new Date(),
        };
      } catch (error) {
        console.error("Error batch generating suggestions:", error);
        return {
          success: false,
          error: "Failed to batch generate suggestions",
          itemsProcessed: 0,
          itemsWithSuggestions: 0,
          suggestions: {},
        };
      }
    }),

  /**
   * Get BOQ gap completion status for a project
   * Returns summary of completed vs pending items
   */
  getCompletionStatus: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        boqTemplateId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { projectId, boqTemplateId } = input;

        // Return mock data for now - actual implementation requires DB queries
        return {
          success: true,
          projectId,
          boqTemplateId,
          statistics: {
            totalItems: 0,
            completedItems: 0,
            pendingItems: 0,
            itemsWithMissingData: 0,
            completionPercentage: 0,
          },
          timestamp: new Date(),
        };
      } catch (error) {
        console.error("Error getting completion status:", error);
        return {
          success: false,
          error: "Failed to get completion status",
          statistics: {
            totalItems: 0,
            completedItems: 0,
            pendingItems: 0,
            itemsWithMissingData: 0,
            completionPercentage: 0,
          },
        };
      }
    }),
});
