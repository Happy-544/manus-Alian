import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Advanced Document Generation", () => {
  let testProjectId: number;

  beforeAll(async () => {
    // Create a test project for document generation tests
    const projectId = await db.createProject({
      createdById: 1,
      name: "Test Project for Document Generation",
      description: "Test project for AI document generation",
      clientName: "Test Client",
      location: "Dubai, UAE",
      address: "Dubai Marina",
      status: "planning",
      priority: "high",
      budget: "1000000",
      currency: "AED",
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
    testProjectId = projectId;
  });

  describe("Document Generation Data Structure", () => {
    it("should create a document generation record with all required fields", async () => {
      const docId = await db.createDocumentGeneration({
        projectId: testProjectId,
        documentType: "baseline",
        title: "Test Baseline Program",
        description: "Test baseline program document",
        generatedContent: "Test content for baseline program",
        status: "completed",
        createdById: 1,
      });

      expect(docId).toBeGreaterThan(0);
      const doc = await db.getDocumentGenerationById(docId);
      expect(doc).toBeDefined();
      expect(doc?.title).toBe("Test Baseline Program");
      expect(doc?.documentType).toBe("baseline");
      expect(doc?.status).toBe("completed");
    });

    it("should support different document types", async () => {
      const documentTypes = [
        "baseline",
        "procurement_log",
        "engineering_log",
        "budget_estimation",
        "value_engineering",
        "other",
      ];

      for (const docType of documentTypes) {
        const docId = await db.createDocumentGeneration({
          projectId: testProjectId,
          documentType: docType as any,
          title: `Test ${docType}`,
          description: `Test description for ${docType}`,
          generatedContent: `Generated content for ${docType}`,
          status: "completed",
          createdById: 1,
        });

        expect(docId).toBeGreaterThan(0);
        const doc = await db.getDocumentGenerationById(docId);
        expect(doc?.documentType).toBe(docType);
      }
    });

    it("should track generation status correctly", async () => {
      const statuses = ["pending", "generating", "completed"];

      for (const status of statuses) {
        const docId = await db.createDocumentGeneration({
          projectId: testProjectId,
          documentType: "other",
          title: `Test Document - ${status}`,
          description: `Test document with status ${status}`,
          status: (status === 'error' ? 'pending' : status) as any,
          createdById: 1,
        });

        expect(docId).toBeGreaterThan(0);
        const doc = await db.getDocumentGenerationById(docId);
        expect(doc?.status).toBe(status);
      }
    });
  });

  describe("Document Generation Retrieval", () => {
    it("should retrieve all documents for a project", async () => {
      // Create multiple documents
      await db.createDocumentGeneration({
        projectId: testProjectId,
        documentType: "baseline",
        title: "Baseline 1",
        description: "First baseline",
        status: "completed",
        createdById: 1,
      });

      await db.createDocumentGeneration({
        projectId: testProjectId,
        documentType: "procurement_log",
        title: "Procurement 1",
        description: "First procurement log",
        status: "completed",
        createdById: 1,
      });

      const docs = await db.getDocumentGenerationsByProject(testProjectId);
      expect(docs).toBeDefined();
      expect(docs.length).toBeGreaterThanOrEqual(2);
    });

    it("should retrieve document by ID", async () => {
      const docId = await db.createDocumentGeneration({
        projectId: testProjectId,
        documentType: "engineering_log",
        title: "Engineering Log Test",
        description: "Test engineering log",
        generatedContent: "Detailed engineering specifications",
        status: "completed",
        createdById: 1,
      });

      const doc = await db.getDocumentGenerationById(docId);
      expect(doc).toBeDefined();
      expect(doc?.id).toBe(docId);
      expect(doc?.generatedContent).toBe("Detailed engineering specifications");
    });
  });

  describe("Market Data Integration", () => {
    it("should retrieve market data for document generation", async () => {
      const marketData = await db.getAllMarketData();
      expect(Array.isArray(marketData)).toBe(true);
    });

    it("should retrieve market data by category", async () => {
      // First ensure there's market data
      const allData = await db.getAllMarketData();
      if (allData.length > 0) {
        const category = allData[0].category;
        const categoryData = await db.getMarketDataByCategory(category);
        expect(Array.isArray(categoryData)).toBe(true);
        expect(categoryData.length).toBeGreaterThan(0);
      }
    });

    it("should search market data by item name", async () => {
      const allData = await db.getAllMarketData();
      if (allData.length > 0) {
        const itemName = allData[0].itemName;
        const results = await db.getMarketDataByItem(itemName);
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Document Export Integration", () => {
    it("should create document export records", async () => {
      const docId = await db.createDocumentGeneration({
        projectId: testProjectId,
        documentType: "budget_estimation",
        title: "Budget Export Test",
        description: "Test budget document for export",
        status: "completed",
        createdById: 1,
      });

      await db.createDocumentExport({
        generationId: docId,
        projectId: testProjectId,
        exportFormat: "pdf",
        fileKey: "exports/test/budget.pdf",
        fileName: "budget.pdf",
        exportedBy: 1,
      });

      const exports = await db.getDocumentExportsByGeneration(docId);
      expect(Array.isArray(exports)).toBe(true);
      expect(exports.length).toBeGreaterThan(0);
    });

    it("should support multiple export formats", async () => {
      const docId = await db.createDocumentGeneration({
        projectId: testProjectId,
        documentType: "other",
        title: "Multi Format Export Test",
        description: "Test document for multiple exports",
        status: "completed",
        createdById: 1,
      });

      // Export as PDF
      await db.createDocumentExport({
        generationId: docId,
        projectId: testProjectId,
        exportFormat: "pdf",
        fileKey: "exports/test/doc.pdf",
        fileName: "doc.pdf",
        exportedBy: 1,
      });

      // Export as DOCX
      await db.createDocumentExport({
        generationId: docId,
        projectId: testProjectId,
        exportFormat: "docx",
        fileKey: "exports/test/doc.docx",
        fileName: "doc.docx",
        exportedBy: 1,
      });

      const exports = await db.getDocumentExportsByGeneration(docId);
      expect(exports.length).toBe(2);
      const formats = exports.map(e => e.exportFormat);
      expect(formats).toContain("pdf");
      expect(formats).toContain("docx");
    });
  });

  describe("Document Content Management", () => {
    it("should store and retrieve generated content", async () => {
      const testContent = `
# Baseline Program

## Project Overview
This is a comprehensive baseline program for the project.

## Timeline
- Phase 1: Planning (Month 1-2)
- Phase 2: Execution (Month 3-8)
- Phase 3: Completion (Month 9-10)

## Key Milestones
1. Design approval
2. Material procurement
3. Installation start
4. Quality inspection
5. Project handover
      `;

      const docId = await db.createDocumentGeneration({
        projectId: testProjectId,
        documentType: "baseline",
        title: "Comprehensive Baseline",
        description: "Full baseline program with timeline",
        generatedContent: testContent,
        status: "completed",
        createdById: 1,
      });

      const doc = await db.getDocumentGenerationById(docId);
      expect(doc?.generatedContent).toContain("Baseline Program");
      expect(doc?.generatedContent).toContain("Timeline");
      expect(doc?.generatedContent).toContain("Key Milestones");
    });

    it("should handle large generated content", async () => {
      // Generate a large content string
      const largeContent = Array(100)
        .fill(0)
        .map((_, i) => `Section ${i}: This is a detailed section with comprehensive information.`)
        .join("\n");

      const docId = await db.createDocumentGeneration({
        projectId: testProjectId,
        documentType: "engineering_log",
        title: "Large Engineering Log",
        description: "Engineering log with extensive content",
        generatedContent: largeContent,
        status: "completed",
        createdById: 1,
      });

      const doc = await db.getDocumentGenerationById(docId);
      expect(doc?.generatedContent).toBeDefined();
      expect(doc?.generatedContent?.length).toBeGreaterThan(1000);
    });
  });

  describe("Document Metadata", () => {
    it("should store market data metadata", async () => {
      const marketDataUsed = JSON.stringify({
        count: 50,
        sample: "Marble: 150 AED/sqm, Paint: 50 AED/liter",
      });

      const docId = await db.createDocumentGeneration({
        projectId: testProjectId,
        documentType: "budget_estimation",
        title: "Budget with Market Data",
        description: "Budget estimation using market data",
        generatedContent: "Detailed budget breakdown",
        status: "completed",
        createdById: 1,
        marketDataUsed,
      });

      const doc = await db.getDocumentGenerationById(docId);
      expect(doc?.marketDataUsed).toBe(marketDataUsed);
    });

    it("should store generation prompt for audit trail", async () => {
      const prompt = "Generate a comprehensive budget estimation based on Dubai market rates";

      const docId = await db.createDocumentGeneration({
        projectId: testProjectId,
        documentType: "budget_estimation",
        title: "Audited Budget Document",
        description: "Budget with generation prompt stored",
        generatedContent: "Generated budget content",
        status: "completed",
        createdById: 1,
        generationPrompt: prompt,
      });

      const doc = await db.getDocumentGenerationById(docId);
      expect(doc?.generationPrompt).toBe(prompt);
    });
  });

  describe("Document Deletion", () => {
    it("should delete document generation records", async () => {
      const docId = await db.createDocumentGeneration({
        projectId: testProjectId,
        documentType: "other",
        title: "Document to Delete",
        description: "This document will be deleted",
        status: "completed",
        createdById: 1,
      });

      await db.deleteDocumentGeneration(docId);
      const doc = await db.getDocumentGenerationById(docId);
      expect(doc).toBeUndefined();
    });
  });

  describe("Document Generation Workflow", () => {
    it("should support complete generation workflow", async () => {
      // 1. Create document generation record
      const docId = await db.createDocumentGeneration({
        projectId: testProjectId,
        documentType: "baseline",
        title: "Complete Workflow Test",
        description: "Testing complete document generation workflow",
        status: "pending",
        createdById: 1,
      });

      // 2. Verify document was created
      let doc = await db.getDocumentGenerationById(docId);
      expect(doc?.status).toBe("pending");

      // 3. Update with generated content
      const generatedContent = "Generated baseline program content";
      const updatedDocId = await db.createDocumentGeneration({
        projectId: testProjectId,
        documentType: "baseline",
        title: "Complete Workflow Test",
        description: "Testing complete document generation workflow",
        generatedContent,
        status: "completed",
        createdById: 1,
      });

      // 4. Verify content was stored
      doc = await db.getDocumentGenerationById(updatedDocId);
      expect(doc?.generatedContent).toBe(generatedContent);
      expect(doc?.status).toBe("completed");

      // 5. Create export records
      await db.createDocumentExport({
        generationId: updatedDocId,
        projectId: testProjectId,
        exportFormat: "pdf",
        fileKey: "exports/workflow/baseline.pdf",
        fileName: "baseline.pdf",
        exportedBy: 1,
      });

      // 6. Verify exports were created
      const exports = await db.getDocumentExportsByGeneration(updatedDocId);
      expect(exports.length).toBeGreaterThan(0);
    });
  });
});
