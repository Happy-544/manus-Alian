/**
 * Project Templates tRPC Router
 * Provides endpoints for template management and cloning
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createProjectTemplate,
  getUserTemplates,
  getTemplateById,
  updateProjectTemplate,
  deleteProjectTemplate,
  addSupplierToTemplate,
  getTemplateSuppliers,
  removeSupplierFromTemplate,
  addBOQItemToTemplate,
  getTemplateBOQItems,
  removeBOQItemFromTemplate,
  cloneTemplateToProject,
  getTemplateStats,
  searchTemplates,
} from "../projectTemplates";

export const projectTemplatesRouter = router({
  /**
   * Create a new project template
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().max(1000).optional(),
        category: z.string().min(1).max(100),
        tags: z.array(z.string()).optional(),
        isPublic: z.boolean().default(false),
        previewImage: z.string().url().optional(),
        defaultSettings: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createProjectTemplate(ctx.user.id, input);
    }),

  /**
   * Get all templates for current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserTemplates(ctx.user.id);
  }),

  /**
   * Get template by ID
   */
  getById: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getTemplateById(input.templateId);
    }),

  /**
   * Update a template
   */
  update: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().max(1000).optional(),
        category: z.string().min(1).max(100).optional(),
        tags: z.array(z.string()).optional(),
        isPublic: z.boolean().optional(),
        previewImage: z.string().url().optional(),
        defaultSettings: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { templateId, ...data } = input;
      return updateProjectTemplate(templateId, ctx.user.id, data);
    }),

  /**
   * Delete a template
   */
  delete: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return deleteProjectTemplate(input.templateId, ctx.user.id);
    }),

  /**
   * Add supplier to template
   */
  addSupplier: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        vendorId: z.number(),
        isPrimary: z.boolean().default(false),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return addSupplierToTemplate(
        input.templateId,
        input.vendorId,
        input.isPrimary,
        input.notes
      );
    }),

  /**
   * Get template suppliers
   */
  getSuppliers: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getTemplateSuppliers(input.templateId);
    }),

  /**
   * Remove supplier from template
   */
  removeSupplier: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        vendorId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return removeSupplierFromTemplate(input.templateId, input.vendorId);
    }),
  /**
   * Add BOQ item to template
   */
  addBOQItem: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        description: z.string().min(1).max(500),
        category: z.string().min(1).max(100),
        quantity: z.number().positive().max(1000000),
        unitOfMeasure: z.string().min(1).max(50),
        unitPrice: z.number().positive().max(1000000).optional(),
        vendorId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { templateId, description, category, quantity, unitOfMeasure, unitPrice, vendorId } = input;
      return addBOQItemToTemplate(templateId, {
        description,
        category,
        quantity,
        unitOfMeasure,
        unitPrice,
        vendorId,
      });
    }),

  /**
   * Get template BOQ items
   */
  getBOQItems: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getTemplateBOQItems(input.templateId);
    }),

  /**
   * Remove BOQ item from template
   */
  removeBOQItem: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        itemId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return removeBOQItemFromTemplate(input.templateId, input.itemId);
    }),

  /**
   * Clone template to create new project
   */
  clone: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        projectName: z.string().min(1).max(255),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return cloneTemplateToProject(input.templateId, input.projectName, ctx.user.id);
    }),

  /**
   * Get template statistics
   */
  getStats: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getTemplateStats(input.templateId);
    }),

  /**
   * Search templates
   */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        category: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return searchTemplates(ctx.user.id, input.query, input.category);
    }),

  /**
   * Get templates by category
   */
  getByCategory: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ ctx, input }) => {
      const templates = await getUserTemplates(ctx.user.id);
      return templates.filter((t: any) => t.category === input.category);
    }),

  /**
   * Get public templates
   */
  getPublic: protectedProcedure.query(async ({ ctx }) => {
    const templates = await getUserTemplates(ctx.user.id);
    return templates.filter((t: any) => t.isPublic);
  }),
});
