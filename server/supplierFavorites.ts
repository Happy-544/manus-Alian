/**
 * Supplier Favorites Service
 * Manages user's favorite suppliers for quick access during gap completion
 */

import { eq, and } from "drizzle-orm";
import { getDb } from "./db";

// In-memory storage for favorites (in production, would use database)
// Format: { userId: { supplierId: true } }
const userFavorites: Record<number, Set<number>> = {};

export interface SupplierFavorite {
  userId: number;
  supplierId: number;
  addedAt: Date;
}

/**
 * Add supplier to user's favorites
 */
export async function addSupplierFavorite(userId: number, supplierId: number): Promise<boolean> {
  try {
    if (!userFavorites[userId]) {
      userFavorites[userId] = new Set();
    }
    userFavorites[userId].add(supplierId);
    return true;
  } catch (error) {
    console.error("Error adding supplier favorite:", error);
    return false;
  }
}

/**
 * Remove supplier from user's favorites
 */
export async function removeSupplierFavorite(userId: number, supplierId: number): Promise<boolean> {
  try {
    if (userFavorites[userId]) {
      userFavorites[userId].delete(supplierId);
    }
    return true;
  } catch (error) {
    console.error("Error removing supplier favorite:", error);
    return false;
  }
}

/**
 * Check if supplier is in user's favorites
 */
export async function isSupplierFavorite(userId: number, supplierId: number): Promise<boolean> {
  try {
    return userFavorites[userId]?.has(supplierId) ?? false;
  } catch (error) {
    console.error("Error checking supplier favorite:", error);
    return false;
  }
}

/**
 * Get all favorite supplier IDs for a user
 */
export async function getUserFavoriteSupplierIds(userId: number): Promise<number[]> {
  try {
    return Array.from(userFavorites[userId] ?? new Set());
  } catch (error) {
    console.error("Error getting user favorite suppliers:", error);
    return [];
  }
}

/**
 * Clear all favorites for a user
 */
export async function clearUserFavorites(userId: number): Promise<boolean> {
  try {
    delete userFavorites[userId];
    return true;
  } catch (error) {
    console.error("Error clearing user favorites:", error);
    return false;
  }
}

/**
 * Get count of user's favorite suppliers
 */
export async function getUserFavoritesCount(userId: number): Promise<number> {
  try {
    return userFavorites[userId]?.size ?? 0;
  } catch (error) {
    console.error("Error getting favorites count:", error);
    return 0;
  }
}
