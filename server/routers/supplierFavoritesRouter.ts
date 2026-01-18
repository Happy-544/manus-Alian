/**
 * Supplier Favorites tRPC Router
 * Handles user's favorite suppliers management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  addSupplierFavorite,
  removeSupplierFavorite,
  isSupplierFavorite,
  getUserFavoriteSupplierIds,
  getUserFavoritesCount,
  clearUserFavorites,
} from "../supplierFavorites";
import { getDb } from "../db";
import { vendors } from "../../drizzle/schema";
import { inArray } from "drizzle-orm";

export const supplierFavoritesRouter = router({
  /**
   * Add supplier to favorites
   */
  addFavorite: protectedProcedure
    .input(z.object({ supplierId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const success = await addSupplierFavorite(ctx.user.id, input.supplierId);
        return { success };
      } catch (error) {
        console.error("Error adding favorite:", error);
        throw new Error("Failed to add supplier to favorites");
      }
    }),

  /**
   * Remove supplier from favorites
   */
  removeFavorite: protectedProcedure
    .input(z.object({ supplierId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const success = await removeSupplierFavorite(ctx.user.id, input.supplierId);
        return { success };
      } catch (error) {
        console.error("Error removing favorite:", error);
        throw new Error("Failed to remove supplier from favorites");
      }
    }),

  /**
   * Check if supplier is favorite
   */
  isFavorite: protectedProcedure
    .input(z.object({ supplierId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const isFav = await isSupplierFavorite(ctx.user.id, input.supplierId);
        return { isFavorite: isFav };
      } catch (error) {
        console.error("Error checking favorite:", error);
        return { isFavorite: false };
      }
    }),

  /**
   * Get all favorite suppliers for current user
   */
  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const favoriteIds = await getUserFavoriteSupplierIds(ctx.user.id);

      if (favoriteIds.length === 0) {
        return [];
      }

      const result = await db.select().from(vendors).where(inArray(vendors.id, favoriteIds));
      return result || [];
    } catch (error) {
      console.error("Error getting favorites:", error);
      return [];
    }
  }),

  /**
   * Get favorite suppliers count
   */
  getFavoritesCount: protectedProcedure.query(async ({ ctx }) => {
    try {
      const count = await getUserFavoritesCount(ctx.user.id);
      return { count };
    } catch (error) {
      console.error("Error getting favorites count:", error);
      return { count: 0 };
    }
  }),

  /**
   * Get favorite supplier IDs
   */
  getFavoriteIds: protectedProcedure.query(async ({ ctx }) => {
    try {
      const ids = await getUserFavoriteSupplierIds(ctx.user.id);
      return { ids };
    } catch (error) {
      console.error("Error getting favorite IDs:", error);
      return { ids: [] };
    }
  }),

  /**
   * Clear all favorites
   */
  clearAll: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const success = await clearUserFavorites(ctx.user.id);
      return { success };
    } catch (error) {
      console.error("Error clearing favorites:", error);
      throw new Error("Failed to clear favorites");
    }
  }),

  /**
   * Toggle favorite status
   */
  toggleFavorite: protectedProcedure
    .input(z.object({ supplierId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const isFav = await isSupplierFavorite(ctx.user.id, input.supplierId);

        if (isFav) {
          await removeSupplierFavorite(ctx.user.id, input.supplierId);
          return { isFavorite: false };
        } else {
          await addSupplierFavorite(ctx.user.id, input.supplierId);
          return { isFavorite: true };
        }
      } catch (error) {
        console.error("Error toggling favorite:", error);
        throw new Error("Failed to toggle favorite status");
      }
    }),
});
