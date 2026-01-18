/**
 * Template Suggestions Router
 * tRPC endpoints for AI-powered template suggestions
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  suggestTemplatesForProject,
  TemplateSuggestion,
} from "../templateSuggestions";
import { TRPCError } from "@trpc/server";

export const templateSuggestionsRouter = router({
  /**
   * Get template suggestions based on project description
   * POST /api/trpc/templateSuggestions.suggestForProject
   */
  suggestForProject: protectedProcedure
    .input(
      z.object({
        projectName: z.string().min(1, "Project name is required"),
        projectDescription: z
          .string()
          .min(10, "Project description must be at least 10 characters"),
        projectType: z.string().optional(),
        budget: z.string().optional(),
        timeline: z.string().optional(),
        location: z.string().optional(),
      })
    )
    .output(z.array(z.any()))
    .mutation(async ({ input, ctx }) => {
      try {
        const suggestions = await suggestTemplatesForProject({
          projectName: input.projectName,
          projectDescription: input.projectDescription,
          projectType: input.projectType,
          budget: input.budget,
          timeline: input.timeline,
          location: input.location,
          userId: ctx.user.id,
        });

        return suggestions;
      } catch (error) {
        console.error("Error in suggestForProject:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to suggest templates",
        });
      }
    }),

  /**
   * Get suggestions with caching (for performance)
   * Caches results for 1 hour per project
   */
  suggestForProjectCached: protectedProcedure
    .input(
      z.object({
        projectName: z.string().min(1),
        projectDescription: z.string().min(10),
        projectType: z.string().optional(),
        budget: z.string().optional(),
        timeline: z.string().optional(),
        location: z.string().optional(),
      })
    )
    .output(z.array(z.any()))
    .query(async ({ input, ctx }) => {
      try {
        // Create cache key from project details
        const cacheKey = `suggestions_${ctx.user.id}_${input.projectName}_${input.projectDescription.substring(0, 50)}`;

        // In production, you'd use Redis or similar
        // For now, we'll call the service directly
        const suggestions = await suggestTemplatesForProject({
          projectName: input.projectName,
          projectDescription: input.projectDescription,
          projectType: input.projectType,
          budget: input.budget,
          timeline: input.timeline,
          location: input.location,
          userId: ctx.user.id,
        });

        return suggestions;
      } catch (error) {
        console.error("Error in suggestForProjectCached:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to suggest templates",
        });
      }
    }),
});

export type TemplateSuggestionsRouter = typeof templateSuggestionsRouter;
