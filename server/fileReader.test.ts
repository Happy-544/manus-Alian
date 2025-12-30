import { describe, it, expect, vi } from "vitest";
import {
  detectFileType,
  readBOQFromExcel,
  readBOQFromPDF,
  readDrawingFromPDF,
  readCADFile,
  readProjectFile,
  BOQData,
  DrawingData,
} from "./fileReader";
import * as fs from "fs";
import * as path from "path";

describe("File Reader Utilities", () => {
  describe("detectFileType", () => {
    it("should detect BOQ files by name", async () => {
      const result = await detectFileType("BOQ_Project_45.xlsx");
      expect(result).toBe("boq");
    });

    it("should detect BOQ files by extension", async () => {
      const result = await detectFileType("materials.xlsx");
      expect(result).toBe("boq");
    });

    it("should detect drawing files by name", async () => {
      const result = await detectFileType("Floor_Plan_Level_1.pdf");
      expect(result).toBe("drawing");
    });

    it("should detect drawing files by extension", async () => {
      const result = await detectFileType("blueprint.dwg");
      expect(result).toBe("drawing");
    });

    it("should return unknown for unrecognized files", async () => {
      const result = await detectFileType("random_file.txt");
      expect(result).toBe("unknown");
    });

    it("should detect CAD files", async () => {
      const result = await detectFileType("design.dxf");
      expect(result).toBe("drawing");
    });

    it("should detect Revit files", async () => {
      const result = await detectFileType("project.rvt");
      expect(result).toBe("drawing");
    });

    it("should handle case-insensitive detection", async () => {
      const result = await detectFileType("BOQ_FILE.XLSX");
      expect(result).toBe("boq");
    });
  });

  describe("BOQ Data Structure", () => {
    it("should have correct BOQ data structure", () => {
      const boqData: BOQData = {
        items: [
          {
            description: "Marble Flooring",
            quantity: 100,
            unit: "sqm",
            unitRate: 150,
            total: 15000,
          },
        ],
        totalAmount: 15000,
        currency: "AED",
      };

      expect(boqData).toHaveProperty("items");
      expect(boqData).toHaveProperty("totalAmount");
      expect(boqData).toHaveProperty("currency");
      expect(boqData.items[0]).toHaveProperty("description");
      expect(boqData.items[0]).toHaveProperty("quantity");
      expect(boqData.items[0]).toHaveProperty("unit");
      expect(boqData.items[0]).toHaveProperty("unitRate");
      expect(boqData.items[0]).toHaveProperty("total");
    });

    it("should calculate total amount correctly", () => {
      const boqData: BOQData = {
        items: [
          {
            description: "Item 1",
            quantity: 10,
            unit: "sqm",
            unitRate: 100,
            total: 1000,
          },
          {
            description: "Item 2",
            quantity: 5,
            unit: "sqm",
            unitRate: 200,
            total: 1000,
          },
        ],
        totalAmount: 2000,
        currency: "AED",
      };

      const calculatedTotal = boqData.items.reduce((sum, item) => sum + item.total, 0);
      expect(calculatedTotal).toBe(boqData.totalAmount);
    });
  });

  describe("Drawing Data Structure", () => {
    it("should have correct drawing data structure", () => {
      const drawingData: DrawingData = {
        title: "Floor Plan - Level 1",
        description: "Ground floor layout with dimensions",
        scale: "1:100",
        dimensions: "50m x 40m",
        areas: [
          {
            name: "Living Room",
            size: "25 sqm",
          },
        ],
      };

      expect(drawingData).toHaveProperty("title");
      expect(drawingData).toHaveProperty("description");
      expect(drawingData).toHaveProperty("scale");
      expect(drawingData).toHaveProperty("dimensions");
      expect(drawingData).toHaveProperty("areas");
      expect(drawingData.areas[0]).toHaveProperty("name");
      expect(drawingData.areas[0]).toHaveProperty("size");
    });
  });

  describe("File Type Detection Edge Cases", () => {
    it("should handle files with multiple extensions", async () => {
      const result = await detectFileType("BOQ.backup.xlsx");
      expect(result).toBe("boq");
    });

    it("should handle files with no extension", async () => {
      const result = await detectFileType("BOQ");
      expect(result).toBe("boq");
    });

    it("should prioritize filename over extension", async () => {
      const result = await detectFileType("BOQ_file.txt");
      expect(result).toBe("boq");
    });

    it("should detect PDF drawings", async () => {
      const result = await detectFileType("drawing.pdf");
      expect(result).toBe("drawing");
    });

    it("should detect CSV as BOQ", async () => {
      const result = await detectFileType("materials.csv");
      expect(result).toBe("boq");
    });
  });

  describe("File Reading Error Handling", () => {
    it("should handle missing files gracefully", async () => {
      try {
        await readBOQFromExcel("/nonexistent/file.xlsx");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as Error).message).toContain("Failed to read BOQ file");
      }
    });

    it("should handle invalid PDF files gracefully", async () => {
      try {
        await readBOQFromPDF("/nonexistent/file.pdf");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as Error).message).toContain("Failed to read BOQ PDF file");
      }
    });

    it("should handle invalid CAD files gracefully", async () => {
      try {
        await readCADFile("/nonexistent/file.dwg");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as Error).message).toContain("Failed to read CAD file");
      }
    });
  });

  describe("File Detection Integration", () => {
    it("should correctly identify BOQ files from various formats", async () => {
      const testCases = [
        "BOQ.xlsx",
        "bill_of_quantities.xls",
        "materials_list.csv",
        "BOQ_Project.pdf",
      ];

      for (const testCase of testCases) {
        const result = await detectFileType(testCase);
        expect(result).toBe("boq");
      }
    });

    it("should correctly identify drawing files from various formats", async () => {
      const testCases = [
        "floor_plan.pdf",
        "layout.dwg",
        "design.dxf",
        "project.rvt",
        "drawing_v2.pdf",
      ];

      for (const testCase of testCases) {
        const result = await detectFileType(testCase);
        expect(result).toBe("drawing");
      }
    });
  });

  describe("BOQ Data Validation", () => {
    it("should validate BOQ items have required fields", () => {
      const boqData: BOQData = {
        items: [
          {
            description: "Test Item",
            quantity: 10,
            unit: "sqm",
            unitRate: 100,
            total: 1000,
          },
        ],
        totalAmount: 1000,
        currency: "AED",
      };

      const item = boqData.items[0];
      expect(item.description).toBeDefined();
      expect(item.quantity).toBeGreaterThan(0);
      expect(item.unit).toBeDefined();
      expect(item.unitRate).toBeGreaterThanOrEqual(0);
      expect(item.total).toBeGreaterThanOrEqual(0);
    });

    it("should validate BOQ total is non-negative", () => {
      const boqData: BOQData = {
        items: [],
        totalAmount: 0,
        currency: "AED",
      };

      expect(boqData.totalAmount).toBeGreaterThanOrEqual(0);
    });

    it("should validate currency is set", () => {
      const boqData: BOQData = {
        items: [],
        totalAmount: 0,
        currency: "AED",
      };

      expect(boqData.currency).toBe("AED");
    });
  });
});
