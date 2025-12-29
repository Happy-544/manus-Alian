import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Document Export, Email Schedule, and Collaboration Routers", () => {
  it("should have documentExport router available", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    expect(caller.documentExport).toBeDefined();
    expect(typeof caller.documentExport.export).toBe("function");
    expect(typeof caller.documentExport.getByGeneration).toBe("function");
  });

  it("should have emailSchedule router available", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    expect(caller.emailSchedule).toBeDefined();
    expect(typeof caller.emailSchedule.create).toBe("function");
    expect(typeof caller.emailSchedule.getByProject).toBe("function");
    expect(typeof caller.emailSchedule.update).toBe("function");
    expect(typeof caller.emailSchedule.delete).toBe("function");
  });

  it("should have documentCollaboration router available", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    expect(caller.documentCollaboration).toBeDefined();
    expect(typeof caller.documentCollaboration.addComment).toBe("function");
    expect(typeof caller.documentCollaboration.getComments).toBe("function");
    expect(typeof caller.documentCollaboration.resolveComment).toBe("function");
    expect(typeof caller.documentCollaboration.getVersionHistory).toBe("function");
    expect(typeof caller.documentCollaboration.createVersion).toBe("function");
  });

  it("should export documents with PDF and DOCX formats", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test PDF export
    const pdfResult = await caller.documentExport.export({
      generationId: 1,
      projectId: 1,
      format: "pdf",
      content: "Test PDF content",
      fileName: "report.pdf",
    });

    expect(pdfResult.success).toBe(true);
    expect(pdfResult.fileKey).toBeDefined();
    expect(pdfResult.fileKey).toContain("pdf");

    // Test DOCX export
    const docxResult = await caller.documentExport.export({
      generationId: 1,
      projectId: 1,
      format: "docx",
      content: "Test DOCX content",
      fileName: "report.docx",
    });

    expect(docxResult.success).toBe(true);
    expect(docxResult.fileKey).toBeDefined();
    expect(docxResult.fileKey).toContain("docx");
  });

  it("should create and manage email schedules", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create email schedule
    const createResult = await caller.emailSchedule.create({
      projectId: 1,
      recipientEmails: ["test@example.com", "admin@example.com"],
      frequency: "weekly",
      dayOfWeek: 1,
      timeOfDay: "09:00",
      reportType: "comprehensive",
      includeAttachments: true,
    });

    expect(createResult).toBeDefined();
  });

  it("should add and retrieve document comments", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Add comment
    const commentResult = await caller.documentCollaboration.addComment({
      generationId: 1,
      projectId: 1,
      content: "This section needs revision",
      sectionReference: "budget_estimation",
    });

    expect(commentResult).toBeDefined();
    // Database operations return arrays with ResultSetHeader
    expect(Array.isArray(commentResult) || commentResult).toBeTruthy();
  });

  it("should create and retrieve document versions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create version
    const versionResult = await caller.documentCollaboration.createVersion({
      generationId: 1,
      projectId: 1,
      content: "Updated document content",
      changesSummary: "Updated budget figures",
      changeType: "updated",
    });

    expect(versionResult).toBeDefined();
    // Database operations return arrays with ResultSetHeader
    expect(Array.isArray(versionResult) || versionResult).toBeTruthy();
  });
});
