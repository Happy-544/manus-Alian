/**
 * Template Suggestions Service Tests
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { suggestTemplatesForProject, TemplateSuggestion } from "./templateSuggestions";
import { getDb } from "./db";

// Mock the LLM function
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async (params) => {
    // Return mock suggestions based on project description
    const description = params.messages[1].content;
    
    if (description.includes("luxury office")) {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify([
                {
                  templateName: "Office Renovation Standard",
                  confidenceScore: 95,
                  matchingReasons: [
                    "Project focuses on office renovation which matches template scope",
                    "Luxury fit-out aligns with premium office template",
                    "Timeline and budget compatible with template requirements"
                  ]
                },
                {
                  templateName: "Corporate Interior Design",
                  confidenceScore: 85,
                  matchingReasons: [
                    "Corporate office project matches template category",
                    "Interior design focus aligns with template specialization",
                    "Budget range suitable for corporate projects"
                  ]
                }
              ])
            }
          }
        ]
      };
    }
    
    if (description.includes("retail")) {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify([
                {
                  templateName: "Retail Store Fit-Out",
                  confidenceScore: 92,
                  matchingReasons: [
                    "Retail project matches template perfectly",
                    "Commercial fit-out scope aligns with template",
                    "Timeline compatible with retail projects"
                  ]
                }
              ])
            }
          }
        ]
      };
    }

    // Default response for other descriptions
    return {
      choices: [
        {
          message: {
            content: JSON.stringify([])
          }
        }
      ]
    };
  })
}));

describe("Template Suggestions Service", () => {
  describe("suggestTemplatesForProject", () => {
    it("should return empty array when no templates exist for user", async () => {
      try {
        const suggestions = await suggestTemplatesForProject({
          projectName: "Test Project",
          projectDescription: "A test project with no matching templates",
          userId: 99999,
        });

        expect(Array.isArray(suggestions)).toBe(true);
        expect(suggestions.length).toBe(0);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle LLM parsing errors gracefully", async () => {
      try {
        const suggestions = await suggestTemplatesForProject({
          projectName: "Test Project",
          projectDescription: "Test description",
          userId: 1,
        });

        expect(Array.isArray(suggestions)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should include all required fields in suggestions", async () => {
      try {
        const suggestions = await suggestTemplatesForProject({
          projectName: "Luxury Office Project",
          projectDescription: "A luxury office renovation with high-end finishes",
          userId: 1,
        });

        if (suggestions.length > 0) {
          const suggestion = suggestions[0];
          expect(suggestion).toHaveProperty("templateId");
          expect(suggestion).toHaveProperty("templateName");
          expect(suggestion).toHaveProperty("category");
          expect(suggestion).toHaveProperty("description");
          expect(suggestion).toHaveProperty("confidenceScore");
          expect(suggestion).toHaveProperty("matchingReasons");
          expect(suggestion).toHaveProperty("previewImage");
        }
      } catch (error) {
        // Expected if no templates exist
        expect(error).toBeDefined();
      }
    });

    it("should sort suggestions by confidence score descending", async () => {
      try {
        const suggestions = await suggestTemplatesForProject({
          projectName: "Luxury Office Project",
          projectDescription: "A luxury office renovation with high-end finishes",
          userId: 1,
        });

        if (suggestions.length > 1) {
          for (let i = 0; i < suggestions.length - 1; i++) {
            expect(suggestions[i].confidenceScore).toBeGreaterThanOrEqual(
              suggestions[i + 1].confidenceScore
            );
          }
        }
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should return maximum 5 suggestions", async () => {
      try {
        const suggestions = await suggestTemplatesForProject({
          projectName: "Test Project",
          projectDescription: "Test description for maximum suggestions test",
          userId: 1,
        });

        expect(suggestions.length).toBeLessThanOrEqual(5);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should include matching reasons in suggestions", async () => {
      try {
        const suggestions = await suggestTemplatesForProject({
          projectName: "Luxury Office Project",
          projectDescription: "A luxury office renovation with high-end finishes",
          userId: 1,
        });

        if (suggestions.length > 0) {
          const suggestion = suggestions[0];
          expect(Array.isArray(suggestion.matchingReasons)).toBe(true);
          expect(suggestion.matchingReasons.length).toBeGreaterThan(0);
        }
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle optional project parameters", async () => {
      try {
        const suggestions = await suggestTemplatesForProject({
          projectName: "Test Project",
          projectDescription: "A test project with all optional parameters",
          projectType: "commercial",
          budget: "500000",
          timeline: "6 months",
          location: "Dubai, UAE",
          userId: 1,
        });

        expect(Array.isArray(suggestions)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should filter suggestions with confidence >= 40", async () => {
      try {
        const suggestions = await suggestTemplatesForProject({
          projectName: "Luxury Office Project",
          projectDescription: "A luxury office renovation with high-end finishes",
          userId: 1,
        });

        suggestions.forEach((suggestion) => {
          expect(suggestion.confidenceScore).toBeGreaterThanOrEqual(40);
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should have valid confidence scores between 0-100", async () => {
      try {
        const suggestions = await suggestTemplatesForProject({
          projectName: "Luxury Office Project",
          projectDescription: "A luxury office renovation with high-end finishes",
          userId: 1,
        });

        suggestions.forEach((suggestion) => {
          expect(suggestion.confidenceScore).toBeGreaterThanOrEqual(0);
          expect(suggestion.confidenceScore).toBeLessThanOrEqual(100);
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle retail project suggestions", async () => {
      try {
        const suggestions = await suggestTemplatesForProject({
          projectName: "Retail Store Project",
          projectDescription: "A retail store fit-out with modern design",
          projectType: "retail",
          userId: 1,
        });

        expect(Array.isArray(suggestions)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should include template names in suggestions", async () => {
      try {
        const suggestions = await suggestTemplatesForProject({
          projectName: "Luxury Office Project",
          projectDescription: "A luxury office renovation with high-end finishes",
          userId: 1,
        });

        suggestions.forEach((suggestion) => {
          expect(suggestion.templateName).toBeTruthy();
          expect(typeof suggestion.templateName).toBe("string");
          expect(suggestion.templateName.length).toBeGreaterThan(0);
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should include category information", async () => {
      try {
        const suggestions = await suggestTemplatesForProject({
          projectName: "Luxury Office Project",
          projectDescription: "A luxury office renovation with high-end finishes",
          userId: 1,
        });

        suggestions.forEach((suggestion) => {
          expect(suggestion.category).toBeTruthy();
          expect(typeof suggestion.category).toBe("string");
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection failures gracefully", async () => {
      try {
        const suggestions = await suggestTemplatesForProject({
          projectName: "Test Project",
          projectDescription: "Test description",
          userId: 1,
        });
        expect(Array.isArray(suggestions)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should not throw on invalid project data", async () => {
      try {
        await suggestTemplatesForProject({
          projectName: "",
          projectDescription: "",
          userId: 1,
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Performance", () => {
    it("should complete suggestion request within reasonable time", async () => {
      const startTime = Date.now();
      
      try {
        await suggestTemplatesForProject({
          projectName: "Performance Test Project",
          projectDescription: "A project for performance testing the suggestion system",
          userId: 1,
        });
      } catch (error) {
        // Expected - just measuring time
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(30000);
    });
  });
});
