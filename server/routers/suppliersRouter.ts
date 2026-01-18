/**
 * Suppliers Router
 * tRPC router for supplier/vendor management CRUD operations
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { vendors } from "../../drizzle/schema";
import { eq, like, and } from "drizzle-orm";

// Zod schemas for validation
const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  category: z.enum(["materials", "equipment", "labor", "services", "furniture", "fixtures", "electrical", "plumbing", "hvac", "other"]).default("other"),
  rating: z.number().min(0).max(5).default(0),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

const supplierUpdateSchema = supplierSchema.partial();

const supplierFilterSchema = z.object({
  category: z.string().optional(),
  searchTerm: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Use vendors table for suppliers
export const suppliersRouter = router({
  /**
   * Get all suppliers with optional filtering
   */
  getAll: publicProcedure
    .input(supplierFilterSchema)
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions = [];
      
      if (input.category) {
        conditions.push(eq(vendors.category, input.category as any));
      }
      
      if (input.isActive !== undefined) {
        conditions.push(eq(vendors.isActive, input.isActive));
      }
      
      if (input.searchTerm) {
        conditions.push(
          like(vendors.name, `%${input.searchTerm}%`)
        );
      }

      let query = db.select().from(vendors);
      if (conditions.length > 0) {
        query = db.select().from(vendors).where(and(...conditions));
      }

      const result = await query;
      return result || [];
    }),

  /**
   * Get supplier by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const result = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, input.id))
        .limit(1);
      
      return result[0] || null;
    }),

  /**
   * Create new supplier
   */
  create: protectedProcedure
    .input(supplierSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      const result = await db
        .insert(vendors)
        .values({
          name: input.name,
          contactPerson: input.contactPerson,
          email: input.email,
          phone: input.phone,
          address: input.address,
          category: input.category as any,
          rating: input.rating,
          notes: input.notes,
          isActive: input.isActive,
          createdById: ctx.user?.id || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      return { success: true, id: (result as any).insertId };
    }),

  /**
   * Update supplier
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: supplierUpdateSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const updateData: any = {
        ...input.data,
        updatedAt: new Date(),
      };

      if (input.data.category) {
        updateData.category = input.data.category as any;
      }

      await db
        .update(vendors)
        .set(updateData)
        .where(eq(vendors.id, input.id));

      return { success: true };
    }),

  /**
   * Delete supplier
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      await db.delete(vendors).where(eq(vendors.id, input.id));

      return { success: true };
    }),

  /**
   * Update supplier rating
   */
  updateRating: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        rating: z.number().min(0).max(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      await db
        .update(vendors)
        .set({
          rating: input.rating,
          updatedAt: new Date(),
        })
        .where(eq(vendors.id, input.id));

      return { success: true };
    }),

  /**
   * Get suppliers by category
   */
  getByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const result = await db
        .select()
        .from(vendors)
        .where(eq(vendors.category, input.category as any));
      
      return result || [];
    }),

  /**
   * Search suppliers
   */
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const result = await db
        .select()
        .from(vendors)
        .where(like(vendors.name, `%${input.query}%`));
      
      return result || [];
    }),

  /**
   * Get top-rated suppliers
   */
  getTopRated: publicProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const result = await db
        .select()
        .from(vendors)
        .orderBy((s) => s.rating)
        .limit(input.limit);
      
      return result || [];
    }),

  /**
   * Bulk update supplier status
   */
  bulkUpdateStatus: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      for (const id of input.ids) {
        await db
          .update(vendors)
          .set({
            isActive: input.isActive,
            updatedAt: new Date(),
          })
          .where(eq(vendors.id, id));
      }

      return { success: true, updated: input.ids.length };
    }),
});
