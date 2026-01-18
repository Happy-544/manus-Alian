/**
 * Bulk Import Service Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { parseCSV, parseJSON, BulkImportProject } from "./bulkImportService";

describe("Bulk Import Service", () => {
  describe("CSV Parsing", () => {
    it("should parse valid CSV with required columns", () => {
      const csv = `projectName,projectDescription
Office Renovation,A modern office renovation project
Retail Store,A retail store fit-out project`;

      const projects = parseCSV(csv);

      expect(projects).toHaveLength(2);
      expect(projects[0].projectName).toBe("Office Renovation");
      expect(projects[0].projectDescription).toBe("A modern office renovation project");
      expect(projects[1].projectName).toBe("Retail Store");
    });

    it("should parse CSV with optional columns", () => {
      const csv = `projectName,projectDescription,projectType,budget,timeline,location
Office Renovation,A modern office renovation project,commercial,500000,6 months,Dubai
Retail Store,A retail store fit-out project,retail,250000,3 months,Abu Dhabi`;

      const projects = parseCSV(csv);

      expect(projects).toHaveLength(2);
      expect(projects[0].projectType).toBe("commercial");
      expect(projects[0].budget).toBe("500000");
      expect(projects[0].timeline).toBe("6 months");
      expect(projects[0].location).toBe("Dubai");
    });

    it("should skip empty lines", () => {
      const csv = `projectName,projectDescription
Office Renovation,A modern office renovation project

Retail Store,A retail store fit-out project`;

      const projects = parseCSV(csv);

      expect(projects).toHaveLength(2);
    });

    it("should throw error for missing required columns", () => {
      const csv = `projectName,budget
Office Renovation,500000`;

      expect(() => parseCSV(csv)).toThrow("CSV missing required columns");
    });

    it("should throw error for empty CSV", () => {
      const csv = `projectName,projectDescription`;

      expect(() => parseCSV(csv)).toThrow("CSV file must contain at least a header row and one data row");
    });

    it("should throw error for missing required fields in row", () => {
      const csv = `projectName,projectDescription
Office Renovation,`;

      expect(() => parseCSV(csv)).toThrow("projectName and projectDescription are required");
    });

    it("should handle case-insensitive headers", () => {
      const csv = `ProjectName,ProjectDescription
Office Renovation,A modern office renovation project`;

      const projects = parseCSV(csv);

      expect(projects).toHaveLength(1);
      expect(projects[0].projectName).toBe("Office Renovation");
    });
  });

  describe("JSON Parsing", () => {
    it("should parse valid JSON array", () => {
      const json = JSON.stringify([
        {
          projectName: "Office Renovation",
          projectDescription: "A modern office renovation project",
        },
        {
          projectName: "Retail Store",
          projectDescription: "A retail store fit-out project",
        },
      ]);

      const projects = parseJSON(json);

      expect(projects).toHaveLength(2);
      expect(projects[0].projectName).toBe("Office Renovation");
      expect(projects[1].projectName).toBe("Retail Store");
    });

    it("should parse JSON with optional fields", () => {
      const json = JSON.stringify([
        {
          projectName: "Office Renovation",
          projectDescription: "A modern office renovation project",
          projectType: "commercial",
          budget: "500000",
          timeline: "6 months",
          location: "Dubai",
        },
      ]);

      const projects = parseJSON(json);

      expect(projects).toHaveLength(1);
      expect(projects[0].projectType).toBe("commercial");
      expect(projects[0].budget).toBe("500000");
    });

    it("should throw error for invalid JSON", () => {
      const json = "{ invalid json }";

      expect(() => parseJSON(json)).toThrow("Invalid JSON format");
    });

    it("should throw error for non-array JSON", () => {
      const json = JSON.stringify({
        projectName: "Office Renovation",
        projectDescription: "A modern office renovation project",
      });

      expect(() => parseJSON(json)).toThrow("JSON must contain an array of projects");
    });

    it("should throw error for empty array", () => {
      const json = JSON.stringify([]);

      expect(() => parseJSON(json)).toThrow("JSON array must contain at least one project");
    });

    it("should throw error for missing required fields", () => {
      const json = JSON.stringify([
        {
          projectName: "Office Renovation",
        },
      ]);

      expect(() => parseJSON(json)).toThrow("projectDescription is required");
    });

    it("should throw error for non-string projectName", () => {
      const json = JSON.stringify([
        {
          projectName: 123,
          projectDescription: "A modern office renovation project",
        },
      ]);

      expect(() => parseJSON(json)).toThrow("projectName is required and must be a string");
    });

    it("should throw error for non-object items", () => {
      const json = JSON.stringify([
        "Office Renovation",
      ]);

      expect(() => parseJSON(json)).toThrow("must be an object");
    });
  });

  describe("Data Validation", () => {
    it("should validate project data structure", () => {
      const csv = `projectName,projectDescription
Office Renovation,A modern office renovation project`;

      const projects = parseCSV(csv);
      const project = projects[0];

      expect(project).toHaveProperty("projectName");
      expect(project).toHaveProperty("projectDescription");
      expect(typeof project.projectName).toBe("string");
      expect(typeof project.projectDescription).toBe("string");
    });

    it("should preserve optional fields", () => {
      const csv = `projectName,projectDescription,projectType,budget
Office Renovation,A modern office renovation project,commercial,500000`;

      const projects = parseCSV(csv);
      const project = projects[0];

      expect(project.projectType).toBe("commercial");
      expect(project.budget).toBe("500000");
      expect(project.timeline).toBeUndefined();
    });

    it("should handle special characters in descriptions", () => {
      const csv = `projectName,projectDescription
"Office Renovation","A modern office renovation project with ""special"" features"`;

      const projects = parseCSV(csv);

      expect(projects[0].projectDescription).toContain("special");
    });

    it("should handle large project descriptions", () => {
      const longDescription = "A".repeat(1000);
      const json = JSON.stringify([
        {
          projectName: "Office Renovation",
          projectDescription: longDescription,
        },
      ]);

      const projects = parseJSON(json);

      expect(projects[0].projectDescription).toHaveLength(1000);
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed CSV gracefully", () => {
      const csv = `projectName,projectDescription
Office Renovation,`;

      expect(() => parseCSV(csv)).toThrow();
    });

    it("should provide helpful error messages", () => {
      const csv = `projectName
Office Renovation`;

      try {
        parseCSV(csv);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("required");
      }
    });

    it("should handle empty file gracefully", () => {
      const csv = "";

      expect(() => parseCSV(csv)).toThrow();
    });
  });

  describe("Performance", () => {
    it("should parse large CSV files efficiently", () => {
      let csv = "projectName,projectDescription\n";
      for (let i = 0; i < 1000; i++) {
        csv += `Project ${i},Description for project ${i}\n`;
      }

      const startTime = Date.now();
      const projects = parseCSV(csv);
      const endTime = Date.now();

      expect(projects).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should parse large JSON files efficiently", () => {
      const projects: BulkImportProject[] = [];
      for (let i = 0; i < 1000; i++) {
        projects.push({
          projectName: `Project ${i}`,
          projectDescription: `Description for project ${i}`,
        });
      }
      const json = JSON.stringify(projects);

      const startTime = Date.now();
      const parsed = parseJSON(json);
      const endTime = Date.now();

      expect(parsed).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
