/**
 * BOQ Excel Import Service Tests
 */

import { describe, it, expect } from "vitest";
import {
  validateBOQImportData,
  calculateBOQTotalCost,
  groupBOQByCategory,
  getBOQImportSummary,
  type BOQImportRow,
} from "./boqExcelImport";

describe("BOQ Excel Import Service", () => {
  describe("validateBOQImportData", () => {
    it("should validate correct BOQ data", () => {
      const data: BOQImportRow[] = [
        {
          description: "Electrical Wiring",
          category: "Electrical",
          quantity: 100,
          unitOfMeasure: "meters",
          unitPrice: 50,
          supplier: "Supplier A",
          leadTime: 7,
        },
        {
          description: "Plumbing Pipes",
          category: "Plumbing",
          quantity: 50,
          unitOfMeasure: "meters",
          unitPrice: 75,
          supplier: "Supplier B",
          leadTime: 5,
        },
      ];

      const result = validateBOQImportData(data);

      expect(result.success).toBe(true);
      expect(result.importedRows).toBe(2);
      expect(result.errorRows).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject description exceeding 500 characters", () => {
      const longDescription = "a".repeat(501);
      const data: BOQImportRow[] = [
        {
          description: longDescription,
          category: "Electrical",
          quantity: 100,
          unitOfMeasure: "meters",
        },
      ];

      const result = validateBOQImportData(data);

      expect(result.success).toBe(false);
      expect(result.errorRows).toBe(1);
      expect(result.errors[0].error).toContain("500 characters");
    });

    it("should reject quantity exceeding 1,000,000", () => {
      const data: BOQImportRow[] = [
        {
          description: "Test Item",
          category: "Electrical",
          quantity: 1000001,
          unitOfMeasure: "units",
        },
      ];

      const result = validateBOQImportData(data);

      expect(result.success).toBe(false);
      expect(result.errorRows).toBe(1);
      expect(result.errors[0].error).toContain("1,000,000");
    });

    it("should reject unit price exceeding 1,000,000", () => {
      const data: BOQImportRow[] = [
        {
          description: "Expensive Item",
          category: "Electrical",
          quantity: 10,
          unitOfMeasure: "units",
          unitPrice: 1000001,
        },
      ];

      const result = validateBOQImportData(data);

      expect(result.success).toBe(false);
      expect(result.errorRows).toBe(1);
      expect(result.errors[0].error).toContain("1,000,000");
    });

    it("should reject lead time exceeding 365 days", () => {
      const data: BOQImportRow[] = [
        {
          description: "Test Item",
          category: "Electrical",
          quantity: 10,
          unitOfMeasure: "units",
          leadTime: 366,
        },
      ];

      const result = validateBOQImportData(data);

      expect(result.success).toBe(false);
      expect(result.errorRows).toBe(1);
      expect(result.errors[0].error).toContain("365 days");
    });

    it("should handle mixed valid and invalid data", () => {
      const data: BOQImportRow[] = [
        {
          description: "Valid Item",
          category: "Electrical",
          quantity: 100,
          unitOfMeasure: "meters",
          unitPrice: 50,
        },
        {
          description: "a".repeat(501),
          category: "Plumbing",
          quantity: 50,
          unitOfMeasure: "meters",
        },
        {
          description: "Another Valid Item",
          category: "HVAC",
          quantity: 200,
          unitOfMeasure: "units",
          unitPrice: 100,
        },
      ];

      const result = validateBOQImportData(data);

      expect(result.success).toBe(false);
      expect(result.importedRows).toBe(2);
      expect(result.errorRows).toBe(1);
    });
  });

  describe("calculateBOQTotalCost", () => {
    it("should calculate total cost correctly", () => {
      const data: BOQImportRow[] = [
        {
          description: "Item 1",
          category: "Electrical",
          quantity: 100,
          unitOfMeasure: "units",
          unitPrice: 50,
        },
        {
          description: "Item 2",
          category: "Plumbing",
          quantity: 50,
          unitOfMeasure: "units",
          unitPrice: 100,
        },
      ];

      const totalCost = calculateBOQTotalCost(data);

      expect(totalCost).toBe(100 * 50 + 50 * 100); // 5000 + 5000 = 10000
    });

    it("should ignore items without unit price", () => {
      const data: BOQImportRow[] = [
        {
          description: "Item with price",
          category: "Electrical",
          quantity: 100,
          unitOfMeasure: "units",
          unitPrice: 50,
        },
        {
          description: "Item without price",
          category: "Plumbing",
          quantity: 50,
          unitOfMeasure: "units",
        },
      ];

      const totalCost = calculateBOQTotalCost(data);

      expect(totalCost).toBe(100 * 50); // 5000
    });

    it("should return 0 for empty data", () => {
      const data: BOQImportRow[] = [];

      const totalCost = calculateBOQTotalCost(data);

      expect(totalCost).toBe(0);
    });

    it("should return 0 when no items have unit price", () => {
      const data: BOQImportRow[] = [
        {
          description: "Item 1",
          category: "Electrical",
          quantity: 100,
          unitOfMeasure: "units",
        },
        {
          description: "Item 2",
          category: "Plumbing",
          quantity: 50,
          unitOfMeasure: "units",
        },
      ];

      const totalCost = calculateBOQTotalCost(data);

      expect(totalCost).toBe(0);
    });
  });

  describe("groupBOQByCategory", () => {
    it("should group items by category", () => {
      const data: BOQImportRow[] = [
        {
          description: "Wiring",
          category: "Electrical",
          quantity: 100,
          unitOfMeasure: "meters",
        },
        {
          description: "Switch",
          category: "Electrical",
          quantity: 50,
          unitOfMeasure: "units",
        },
        {
          description: "Pipes",
          category: "Plumbing",
          quantity: 30,
          unitOfMeasure: "meters",
        },
      ];

      const grouped = groupBOQByCategory(data);

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped["Electrical"]).toHaveLength(2);
      expect(grouped["Plumbing"]).toHaveLength(1);
    });

    it("should handle empty data", () => {
      const data: BOQImportRow[] = [];

      const grouped = groupBOQByCategory(data);

      expect(Object.keys(grouped)).toHaveLength(0);
    });

    it("should handle single category", () => {
      const data: BOQImportRow[] = [
        {
          description: "Item 1",
          category: "Electrical",
          quantity: 100,
          unitOfMeasure: "units",
        },
        {
          description: "Item 2",
          category: "Electrical",
          quantity: 50,
          unitOfMeasure: "units",
        },
      ];

      const grouped = groupBOQByCategory(data);

      expect(Object.keys(grouped)).toHaveLength(1);
      expect(grouped["Electrical"]).toHaveLength(2);
    });
  });

  describe("getBOQImportSummary", () => {
    it("should generate correct summary", () => {
      const data: BOQImportRow[] = [
        {
          description: "Electrical Wiring",
          category: "Electrical",
          quantity: 100,
          unitOfMeasure: "meters",
          unitPrice: 50,
          supplier: "Supplier A",
        },
        {
          description: "Plumbing Pipes",
          category: "Plumbing",
          quantity: 50,
          unitOfMeasure: "meters",
          unitPrice: 75,
          supplier: "Supplier B",
        },
        {
          description: "HVAC Unit",
          category: "HVAC",
          quantity: 10,
          unitOfMeasure: "units",
          // No price
        },
      ];

      const summary = getBOQImportSummary(data);

      expect(summary.totalItems).toBe(3);
      expect(summary.totalQuantity).toBe(160); // 100 + 50 + 10
      expect(summary.totalCost).toBe(100 * 50 + 50 * 75); // 5000 + 3750 = 8750
      expect(summary.categoriesCount).toBe(3);
      expect(summary.itemsWithoutPrice).toBe(1);
      expect(summary.itemsWithoutSupplier).toBe(1); // HVAC Unit has no supplier
    });

    it("should calculate category breakdown correctly", () => {
      const data: BOQImportRow[] = [
        {
          description: "Item 1",
          category: "Electrical",
          quantity: 100,
          unitOfMeasure: "units",
          unitPrice: 50,
        },
        {
          description: "Item 2",
          category: "Electrical",
          quantity: 50,
          unitOfMeasure: "units",
          unitPrice: 100,
        },
        {
          description: "Item 3",
          category: "Plumbing",
          quantity: 30,
          unitOfMeasure: "units",
          unitPrice: 75,
        },
      ];

      const summary = getBOQImportSummary(data);

      expect(summary.categories).toHaveLength(2);

      const electricalCategory = summary.categories.find(
        (c) => c.category === "Electrical"
      );
      expect(electricalCategory?.itemCount).toBe(2);
      expect(electricalCategory?.quantity).toBe(150);
      expect(electricalCategory?.cost).toBe(100 * 50 + 50 * 100); // 10000

      const plumbingCategory = summary.categories.find(
        (c) => c.category === "Plumbing"
      );
      expect(plumbingCategory?.itemCount).toBe(1);
      expect(plumbingCategory?.quantity).toBe(30);
      expect(plumbingCategory?.cost).toBe(30 * 75); // 2250
    });

    it("should handle empty data", () => {
      const data: BOQImportRow[] = [];

      const summary = getBOQImportSummary(data);

      expect(summary.totalItems).toBe(0);
      expect(summary.totalQuantity).toBe(0);
      expect(summary.totalCost).toBe(0);
      expect(summary.categoriesCount).toBe(0);
      expect(summary.itemsWithoutPrice).toBe(0);
      expect(summary.itemsWithoutSupplier).toBe(0);
    });

    it("should count items without price and supplier", () => {
      const data: BOQImportRow[] = [
        {
          description: "Complete Item",
          category: "Electrical",
          quantity: 100,
          unitOfMeasure: "units",
          unitPrice: 50,
          supplier: "Supplier A",
        },
        {
          description: "Item without price",
          category: "Plumbing",
          quantity: 50,
          unitOfMeasure: "units",
          supplier: "Supplier B",
        },
        {
          description: "Item without supplier",
          category: "HVAC",
          quantity: 30,
          unitOfMeasure: "units",
          unitPrice: 100,
        },
        {
          description: "Item without both",
          category: "Carpentry",
          quantity: 20,
          unitOfMeasure: "units",
        },
      ];

      const summary = getBOQImportSummary(data);

      expect(summary.itemsWithoutPrice).toBe(2); // Items 2 and 4
      expect(summary.itemsWithoutSupplier).toBe(2); // Items 3 and 4
    });
  });
});
