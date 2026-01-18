import { describe, it, expect, beforeEach } from "vitest";
import {
  addSupplierFavorite,
  removeSupplierFavorite,
  isSupplierFavorite,
  getUserFavoriteSupplierIds,
  getUserFavoritesCount,
  clearUserFavorites,
} from "./supplierFavorites";

describe("Supplier Favorites Service", () => {
  const userId = 1;
  const supplierId1 = 10;
  const supplierId2 = 20;
  const supplierId3 = 30;

  beforeEach(async () => {
    // Clear favorites before each test
    await clearUserFavorites(userId);
  });

  describe("addSupplierFavorite", () => {
    it("should add a supplier to favorites", async () => {
      const result = await addSupplierFavorite(userId, supplierId1);
      expect(result).toBe(true);

      const isFav = await isSupplierFavorite(userId, supplierId1);
      expect(isFav).toBe(true);
    });

    it("should add multiple suppliers to favorites", async () => {
      await addSupplierFavorite(userId, supplierId1);
      await addSupplierFavorite(userId, supplierId2);
      await addSupplierFavorite(userId, supplierId3);

      const ids = await getUserFavoriteSupplierIds(userId);
      expect(ids).toContain(supplierId1);
      expect(ids).toContain(supplierId2);
      expect(ids).toContain(supplierId3);
      expect(ids.length).toBe(3);
    });

    it("should not add duplicate favorites", async () => {
      await addSupplierFavorite(userId, supplierId1);
      await addSupplierFavorite(userId, supplierId1);

      const ids = await getUserFavoriteSupplierIds(userId);
      expect(ids.length).toBe(1);
    });
  });

  describe("removeSupplierFavorite", () => {
    it("should remove a supplier from favorites", async () => {
      await addSupplierFavorite(userId, supplierId1);
      expect(await isSupplierFavorite(userId, supplierId1)).toBe(true);

      const result = await removeSupplierFavorite(userId, supplierId1);
      expect(result).toBe(true);
      expect(await isSupplierFavorite(userId, supplierId1)).toBe(false);
    });

    it("should remove specific supplier without affecting others", async () => {
      await addSupplierFavorite(userId, supplierId1);
      await addSupplierFavorite(userId, supplierId2);
      await addSupplierFavorite(userId, supplierId3);

      await removeSupplierFavorite(userId, supplierId2);

      const ids = await getUserFavoriteSupplierIds(userId);
      expect(ids).toContain(supplierId1);
      expect(ids).not.toContain(supplierId2);
      expect(ids).toContain(supplierId3);
      expect(ids.length).toBe(2);
    });

    it("should handle removing non-existent favorite gracefully", async () => {
      const result = await removeSupplierFavorite(userId, supplierId1);
      expect(result).toBe(true);
    });
  });

  describe("isSupplierFavorite", () => {
    it("should return true for favorite supplier", async () => {
      await addSupplierFavorite(userId, supplierId1);
      const isFav = await isSupplierFavorite(userId, supplierId1);
      expect(isFav).toBe(true);
    });

    it("should return false for non-favorite supplier", async () => {
      const isFav = await isSupplierFavorite(userId, supplierId1);
      expect(isFav).toBe(false);
    });

    it("should return false after removing favorite", async () => {
      await addSupplierFavorite(userId, supplierId1);
      await removeSupplierFavorite(userId, supplierId1);
      const isFav = await isSupplierFavorite(userId, supplierId1);
      expect(isFav).toBe(false);
    });
  });

  describe("getUserFavoriteSupplierIds", () => {
    it("should return empty array for user with no favorites", async () => {
      const ids = await getUserFavoriteSupplierIds(userId);
      expect(ids).toEqual([]);
    });

    it("should return all favorite supplier IDs", async () => {
      await addSupplierFavorite(userId, supplierId1);
      await addSupplierFavorite(userId, supplierId2);
      await addSupplierFavorite(userId, supplierId3);

      const ids = await getUserFavoriteSupplierIds(userId);
      expect(ids.length).toBe(3);
      expect(ids).toContain(supplierId1);
      expect(ids).toContain(supplierId2);
      expect(ids).toContain(supplierId3);
    });

    it("should return correct IDs for different users", async () => {
      const userId2 = 2;
      await addSupplierFavorite(userId, supplierId1);
      await addSupplierFavorite(userId2, supplierId2);

      const ids1 = await getUserFavoriteSupplierIds(userId);
      const ids2 = await getUserFavoriteSupplierIds(userId2);

      expect(ids1).toContain(supplierId1);
      expect(ids1).not.toContain(supplierId2);
      expect(ids2).toContain(supplierId2);
      expect(ids2).not.toContain(supplierId1);
    });
  });

  describe("getUserFavoritesCount", () => {
    it("should return 0 for user with no favorites", async () => {
      const count = await getUserFavoritesCount(userId);
      expect(count).toBe(0);
    });

    it("should return correct count of favorites", async () => {
      await addSupplierFavorite(userId, supplierId1);
      let count = await getUserFavoritesCount(userId);
      expect(count).toBe(1);

      await addSupplierFavorite(userId, supplierId2);
      count = await getUserFavoritesCount(userId);
      expect(count).toBe(2);

      await addSupplierFavorite(userId, supplierId3);
      count = await getUserFavoritesCount(userId);
      expect(count).toBe(3);
    });

    it("should update count when removing favorites", async () => {
      await addSupplierFavorite(userId, supplierId1);
      await addSupplierFavorite(userId, supplierId2);

      let count = await getUserFavoritesCount(userId);
      expect(count).toBe(2);

      await removeSupplierFavorite(userId, supplierId1);
      count = await getUserFavoritesCount(userId);
      expect(count).toBe(1);
    });
  });

  describe("clearUserFavorites", () => {
    it("should clear all favorites for a user", async () => {
      await addSupplierFavorite(userId, supplierId1);
      await addSupplierFavorite(userId, supplierId2);
      await addSupplierFavorite(userId, supplierId3);

      let count = await getUserFavoritesCount(userId);
      expect(count).toBe(3);

      const result = await clearUserFavorites(userId);
      expect(result).toBe(true);

      count = await getUserFavoritesCount(userId);
      expect(count).toBe(0);

      const ids = await getUserFavoriteSupplierIds(userId);
      expect(ids).toEqual([]);
    });

    it("should not affect other users' favorites", async () => {
      const userId2 = 2;

      await addSupplierFavorite(userId, supplierId1);
      await addSupplierFavorite(userId2, supplierId2);

      await clearUserFavorites(userId);

      const ids1 = await getUserFavoriteSupplierIds(userId);
      const ids2 = await getUserFavoriteSupplierIds(userId2);

      expect(ids1).toEqual([]);
      expect(ids2).toContain(supplierId2);
    });

    it("should handle clearing empty favorites gracefully", async () => {
      const result = await clearUserFavorites(userId);
      expect(result).toBe(true);

      const count = await getUserFavoritesCount(userId);
      expect(count).toBe(0);
    });
  });

  describe("Multiple user isolation", () => {
    it("should maintain separate favorites for different users", async () => {
      const userId2 = 2;
      const userId3 = 3;

      // Add favorites for different users
      await addSupplierFavorite(userId, supplierId1);
      await addSupplierFavorite(userId, supplierId2);

      await addSupplierFavorite(userId2, supplierId2);
      await addSupplierFavorite(userId2, supplierId3);

      await addSupplierFavorite(userId3, supplierId3);

      // Verify each user has correct favorites
      const ids1 = await getUserFavoriteSupplierIds(userId);
      const ids2 = await getUserFavoriteSupplierIds(userId2);
      const ids3 = await getUserFavoriteSupplierIds(userId3);

      expect(ids1).toEqual(expect.arrayContaining([supplierId1, supplierId2]));
      expect(ids2).toEqual(expect.arrayContaining([supplierId2, supplierId3]));
      expect(ids3).toEqual([supplierId3]);

      // Verify counts
      expect(await getUserFavoritesCount(userId)).toBe(2);
      expect(await getUserFavoritesCount(userId2)).toBe(2);
      expect(await getUserFavoritesCount(userId3)).toBe(1);
    });
  });
});
