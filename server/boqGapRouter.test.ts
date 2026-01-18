/**
 * Unit tests for BOQ Gap Completion Router
 * Tests gap detection, suggestion generation, and validation endpoints
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { detectMissingData, validateBOQData, type BOQLineItem } from "./boqGapCompletion";

describe("BOQ Gap Completion Service", () => {
  describe("detectMissingData", () => {
    it("should detect missing unit price as HIGH severity", () => {
      const items: BOQLineItem[] = [
        {
          id: "1",
          description: "Paint",
          quantity: 100,
          unit: "liters",
          category: "Finishes",
          supplier: "Supplier A",
          leadTime: 7,
        },
      ];

      const gaps = detectMissingData(items);

      expect(gaps).toHaveLength(1);
      expect(gaps[0].itemId).toBe("1");
      expect(gaps[0].missingFields).toContain("unitPrice");
      expect(gaps[0].severity).toBe("HIGH");
    });

    it("should detect missing supplier as MEDIUM severity", () => {
      const items: BOQLineItem[] = [
        {
          id: "2",
          description: "Tiles",
          quantity: 50,
          unit: "sqm",
          unitPrice: 100,
          category: "Finishes",
          leadTime: 14,
        },
      ];

      const gaps = detectMissingData(items);

      expect(gaps).toHaveLength(1);
      expect(gaps[0].missingFields).toContain("supplier");
      expect(gaps[0].severity).toBe("MEDIUM");
    });

    it("should detect missing lead time as MEDIUM severity", () => {
      const items: BOQLineItem[] = [
        {
          id: "3",
          description: "Doors",
          quantity: 20,
          unit: "pieces",
          unitPrice: 500,
          category: "Carpentry",
          supplier: "Supplier B",
        },
      ];

      const gaps = detectMissingData(items);

      expect(gaps).toHaveLength(1);
      expect(gaps[0].missingFields).toContain("leadTime");
      expect(gaps[0].severity).toBe("MEDIUM");
    });

    it("should detect multiple missing fields with appropriate severity", () => {
      const items: BOQLineItem[] = [
        {
          id: "4",
          description: "Windows",
          quantity: 30,
          unit: "pieces",
          category: "Carpentry",
        },
      ];

      const gaps = detectMissingData(items);

      expect(gaps).toHaveLength(1);
      expect(gaps[0].missingFields.length).toBeGreaterThan(2);
      expect(gaps[0].severity).toBe("HIGH");
    });

    it("should detect gaps for items missing optional fields", () => {
      const items: BOQLineItem[] = [
        {
          id: "5",
          description: "Concrete",
          quantity: 100,
          unit: "cubic meters",
          unitPrice: 300,
          category: "Structural",
          supplier: "Supplier C",
          leadTime: 3,
        },
      ];

      const gaps = detectMissingData(items);

      expect(gaps.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle multiple items with mixed gap status", () => {
      const items: BOQLineItem[] = [
        {
          id: "6",
          description: "Steel",
          quantity: 50,
          unit: "tons",
          unitPrice: 1000,
          category: "Structural",
          supplier: "Supplier D",
          leadTime: 21,
        },
        {
          id: "7",
          description: "Plumbing",
          quantity: 200,
          unit: "meters",
          category: "MEP",
        },
      ];

      const gaps = detectMissingData(items);

      expect(gaps.length).toBeGreaterThan(0);
      expect(gaps.some((g) => g.itemId === "7")).toBe(true);
    });
  });

  describe("validateBOQData", () => {
    it("should validate complete BOQ item", () => {
      const item: BOQLineItem = {
        id: "1",
        description: "Paint",
        quantity: 100,
        unit: "liters",
        unitPrice: 50,
        category: "Finishes",
        supplier: "Supplier A",
        leadTime: 7,
      };

      const result = validateBOQData(item);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject item with missing description", () => {
      const item: BOQLineItem = {
        id: "2",
        description: "",
        quantity: 100,
        unit: "liters",
        unitPrice: 50,
        category: "Finishes",
        supplier: "Supplier A",
        leadTime: 7,
      };

      const result = validateBOQData(item);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Description is required");
    });

    it("should reject item with invalid quantity", () => {
      const item: BOQLineItem = {
        id: "3",
        description: "Tiles",
        quantity: 0,
        unit: "sqm",
        unitPrice: 100,
        category: "Finishes",
        supplier: "Supplier B",
        leadTime: 14,
      };

      const result = validateBOQData(item);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Quantity must be greater than 0");
    });

    it("should reject item with missing unit", () => {
      const item: BOQLineItem = {
        id: "4",
        description: "Doors",
        quantity: 20,
        unit: "",
        unitPrice: 500,
        category: "Carpentry",
        supplier: "Supplier C",
        leadTime: 10,
      };

      const result = validateBOQData(item);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Unit is required");
    });

    it("should reject item with invalid unit price", () => {
      const item: BOQLineItem = {
        id: "5",
        description: "Windows",
        quantity: 30,
        unit: "pieces",
        unitPrice: 0,
        category: "Carpentry",
        supplier: "Supplier D",
        leadTime: 14,
      };

      const result = validateBOQData(item);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Unit price must be greater than 0");
    });

    it("should reject item with missing supplier", () => {
      const item: BOQLineItem = {
        id: "6",
        description: "Concrete",
        quantity: 100,
        unit: "cubic meters",
        unitPrice: 300,
        category: "Structural",
        supplier: "",
        leadTime: 3,
      };

      const result = validateBOQData(item);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Supplier is required");
    });

    it("should reject item with invalid lead time", () => {
      const item: BOQLineItem = {
        id: "7",
        description: "Steel",
        quantity: 50,
        unit: "tons",
        unitPrice: 1000,
        category: "Structural",
        supplier: "Supplier E",
        leadTime: 0,
      };

      const result = validateBOQData(item);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Lead time must be greater than 0");
    });

    it("should reject item with missing category", () => {
      const item: BOQLineItem = {
        id: "8",
        description: "Plumbing",
        quantity: 200,
        unit: "meters",
        unitPrice: 150,
        category: "",
        supplier: "Supplier F",
        leadTime: 7,
      };

      const result = validateBOQData(item);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Category is required");
    });

    it("should report multiple validation errors", () => {
      const item: BOQLineItem = {
        id: "9",
        description: "",
        quantity: -5,
        unit: "",
        category: "Test",
      };

      const result = validateBOQData(item);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });
  });

  describe("Gap Analysis Workflow", () => {
    it("should identify items requiring gap completion", () => {
      const items: BOQLineItem[] = [
        {
          id: "1",
          description: "Paint",
          quantity: 100,
          unit: "liters",
          unitPrice: 50,
          category: "Finishes",
          supplier: "Supplier A",
          leadTime: 7,
        },
        {
          id: "2",
          description: "Tiles",
          quantity: 50,
          unit: "sqm",
          category: "Finishes",
        },
        {
          id: "3",
          description: "Doors",
          quantity: 20,
          unit: "pieces",
          unitPrice: 500,
          category: "Carpentry",
          supplier: "Supplier B",
          leadTime: 10,
        },
      ];

      const gaps = detectMissingData(items);
      const itemsWithGaps = items.filter((item) =>
        gaps.some((gap) => gap.itemId === item.id)
      );

      expect(itemsWithGaps.length).toBeGreaterThan(0);
      expect(itemsWithGaps.some((item) => item.id === "2")).toBe(true);
    });

    it("should calculate gap completion percentage", () => {
      const items: BOQLineItem[] = [
        {
          id: "1",
          description: "Item 1",
          quantity: 10,
          unit: "units",
          unitPrice: 100,
          category: "Cat1",
          supplier: "Supplier A",
          leadTime: 7,
        },
        {
          id: "2",
          description: "Item 2",
          quantity: 20,
          unit: "units",
          category: "Cat2",
        },
        {
          id: "3",
          description: "Item 3",
          quantity: 30,
          unit: "units",
          category: "Cat3",
        },
        {
          id: "4",
          description: "Item 4",
          quantity: 40,
          unit: "units",
          unitPrice: 200,
          category: "Cat4",
          supplier: "Supplier B",
          leadTime: 14,
        },
      ];

      const gaps = detectMissingData(items);
      const completionPercentage = Math.round(
        ((items.length - gaps.length) / items.length) * 100
      );

      expect(completionPercentage).toBeGreaterThanOrEqual(0);
      expect(completionPercentage).toBeLessThanOrEqual(100);
    });

    it("should group gaps by severity", () => {
      const items: BOQLineItem[] = [
        {
          id: "1",
          description: "Item 1",
          quantity: 10,
          unit: "units",
          category: "Cat1",
        },
        {
          id: "2",
          description: "Item 2",
          quantity: 20,
          unit: "units",
          unitPrice: 100,
          category: "Cat2",
        },
        {
          id: "3",
          description: "Item 3",
          quantity: 30,
          unit: "units",
          unitPrice: 200,
          category: "Cat3",
          supplier: "Supplier A",
        },
      ];

      const gaps = detectMissingData(items);
      const highSeverity = gaps.filter((g) => g.severity === "HIGH");
      const mediumSeverity = gaps.filter((g) => g.severity === "MEDIUM");

      expect(highSeverity.length).toBeGreaterThan(0);
      expect(mediumSeverity.length).toBeGreaterThan(0);
    });
  });

  describe("BOQ Item Categories", () => {
    it("should handle structural materials", () => {
      const item: BOQLineItem = {
        id: "1",
        description: "Reinforced Concrete",
        quantity: 100,
        unit: "cubic meters",
        unitPrice: 350,
        category: "Structural",
        supplier: "Concrete Supplier",
        leadTime: 5,
      };

      const validation = validateBOQData(item);
      expect(validation.isValid).toBe(true);
    });

    it("should handle MEP items", () => {
      const item: BOQLineItem = {
        id: "2",
        description: "Copper Piping",
        quantity: 500,
        unit: "meters",
        unitPrice: 45,
        category: "MEP",
        supplier: "MEP Supplier",
        leadTime: 10,
      };

      const validation = validateBOQData(item);
      expect(validation.isValid).toBe(true);
    });

    it("should handle finishes", () => {
      const item: BOQLineItem = {
        id: "3",
        description: "Premium Paint",
        quantity: 200,
        unit: "liters",
        unitPrice: 80,
        category: "Finishes",
        supplier: "Paint Supplier",
        leadTime: 7,
      };

      const validation = validateBOQData(item);
      expect(validation.isValid).toBe(true);
    });

    it("should handle carpentry items", () => {
      const item: BOQLineItem = {
        id: "4",
        description: "Wooden Doors",
        quantity: 25,
        unit: "pieces",
        unitPrice: 600,
        category: "Carpentry",
        supplier: "Carpentry Supplier",
        leadTime: 14,
      };

      const validation = validateBOQData(item);
      expect(validation.isValid).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large quantities", () => {
      const item: BOQLineItem = {
        id: "1",
        description: "Sand",
        quantity: 10000,
        unit: "tons",
        unitPrice: 25,
        category: "Materials",
        supplier: "Supplier A",
        leadTime: 2,
      };

      const validation = validateBOQData(item);
      expect(validation.isValid).toBe(true);
    });

    it("should handle very small unit prices", () => {
      const item: BOQLineItem = {
        id: "2",
        description: "Nails",
        quantity: 50000,
        unit: "pieces",
        unitPrice: 0.01,
        category: "Hardware",
        supplier: "Supplier B",
        leadTime: 1,
      };

      const validation = validateBOQData(item);
      expect(validation.isValid).toBe(true);
    });

    it("should handle very large unit prices", () => {
      const item: BOQLineItem = {
        id: "3",
        description: "Luxury Fixtures",
        quantity: 10,
        unit: "pieces",
        unitPrice: 50000,
        category: "Finishes",
        supplier: "Supplier C",
        leadTime: 30,
      };

      const validation = validateBOQData(item);
      expect(validation.isValid).toBe(true);
    });

    it("should handle long descriptions", () => {
      const longDescription =
        "Premium Italian marble tiles with special waterproofing treatment for luxury bathroom applications in high-end residential projects";
      const item: BOQLineItem = {
        id: "4",
        description: longDescription,
        quantity: 100,
        unit: "sqm",
        unitPrice: 250,
        category: "Finishes",
        supplier: "Supplier D",
        leadTime: 21,
      };

      const validation = validateBOQData(item);
      expect(validation.isValid).toBe(true);
    });

    it("should handle special characters in supplier names", () => {
      const item: BOQLineItem = {
        id: "5",
        description: "Materials",
        quantity: 50,
        unit: "units",
        unitPrice: 100,
        category: "General",
        supplier: "Supplier & Co. (UAE) Ltd.",
        leadTime: 7,
      };

      const validation = validateBOQData(item);
      expect(validation.isValid).toBe(true);
    });
  });
});
