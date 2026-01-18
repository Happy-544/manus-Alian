/**
 * Email Notifications Service Tests
 */

import { describe, it, expect } from "vitest";
import {
  generateShareEmailTemplate,
  generateApprovalEmailTemplate,
  generateBulkImportEmailTemplate,
} from "./emailNotifications";

describe("Email Notifications Service", () => {
  describe("generateShareEmailTemplate", () => {
    it("should generate share email template with all fields", () => {
      const data = {
        recipientEmail: "test@example.com",
        recipientName: "John Doe",
        senderName: "Mohamed Ali",
        documentName: "BOQ - Marina Towers",
        documentId: "doc-001",
        permissionLevel: "edit" as const,
        shareLink: "https://example.com/share/abc123",
        message: "Please review this document",
      };

      const template = generateShareEmailTemplate(data);

      expect(template).toContain("Document Shared with You");
      expect(template).toContain("John Doe");
      expect(template).toContain("Mohamed Ali");
      expect(template).toContain("BOQ - Marina Towers");
      expect(template).toContain("edit");
      expect(template).toContain("Please review this document");
      expect(template).toContain("https://example.com/share/abc123");
    });

    it("should handle view permission level", () => {
      const data = {
        recipientEmail: "test@example.com",
        recipientName: "Jane Doe",
        senderName: "Mohamed Ali",
        documentName: "Engineering Log",
        documentId: "doc-002",
        permissionLevel: "view" as const,
        shareLink: "https://example.com/share/xyz789",
      };

      const template = generateShareEmailTemplate(data);

      expect(template).toContain("view only");
    });

    it("should handle download permission level", () => {
      const data = {
        recipientEmail: "test@example.com",
        recipientName: "Jane Doe",
        senderName: "Mohamed Ali",
        documentName: "Budget Report",
        documentId: "doc-003",
        permissionLevel: "download" as const,
        shareLink: "https://example.com/share/download123",
      };

      const template = generateShareEmailTemplate(data);

      expect(template).toContain("download");
    });

    it("should include expiration date if provided", () => {
      const expirationDate = new Date("2026-12-31");
      const data = {
        recipientEmail: "test@example.com",
        recipientName: "John Doe",
        senderName: "Mohamed Ali",
        documentName: "Temporary Document",
        documentId: "doc-004",
        permissionLevel: "view" as const,
        shareLink: "https://example.com/share/temp123",
        expiresAt: expirationDate,
      };

      const template = generateShareEmailTemplate(data);

      expect(template).toContain("Access expires");
      expect(template).toContain("2026");
    });

    it("should not include expiration if not provided", () => {
      const data = {
        recipientEmail: "test@example.com",
        recipientName: "John Doe",
        senderName: "Mohamed Ali",
        documentName: "Permanent Document",
        documentId: "doc-005",
        permissionLevel: "edit" as const,
        shareLink: "https://example.com/share/perm123",
      };

      const template = generateShareEmailTemplate(data);

      expect(template).not.toContain("Access expires");
    });

    it("should include Alpago branding", () => {
      const data = {
        recipientEmail: "test@example.com",
        recipientName: "John Doe",
        senderName: "Mohamed Ali",
        documentName: "Test Document",
        documentId: "doc-006",
        permissionLevel: "view" as const,
        shareLink: "https://example.com/share/brand123",
      };

      const template = generateShareEmailTemplate(data);

      expect(template).toContain("Alpago");
      expect(template).toContain("D4AF37"); // Gold color hex
    });
  });

  describe("generateApprovalEmailTemplate", () => {
    it("should generate approval email template with all fields", () => {
      const data = {
        recipientEmail: "approver@example.com",
        recipientName: "Approver Name",
        documentName: "Project Budget",
        documentId: "doc-007",
        approvalLink: "https://example.com/approve/abc123",
      };

      const template = generateApprovalEmailTemplate(data);

      expect(template).toContain("Document Approval Needed");
      expect(template).toContain("Approver Name");
      expect(template).toContain("Project Budget");
      expect(template).toContain("https://example.com/approve/abc123");
      expect(template).toContain("Review & Approve");
    });

    it("should include deadline if provided", () => {
      const deadline = new Date("2026-02-15");
      const data = {
        recipientEmail: "approver@example.com",
        recipientName: "Approver Name",
        documentName: "Project Budget",
        documentId: "doc-008",
        approvalLink: "https://example.com/approve/deadline123",
        deadline,
      };

      const template = generateApprovalEmailTemplate(data);

      expect(template).toContain("Deadline");
      expect(template).toContain("2026");
    });

    it("should not include deadline if not provided", () => {
      const data = {
        recipientEmail: "approver@example.com",
        recipientName: "Approver Name",
        documentName: "Project Budget",
        documentId: "doc-009",
        approvalLink: "https://example.com/approve/nodeadline123",
      };

      const template = generateApprovalEmailTemplate(data);

      expect(template).not.toContain("⏰");
    });

    it("should include Alpago branding", () => {
      const data = {
        recipientEmail: "approver@example.com",
        recipientName: "Approver Name",
        documentName: "Test Document",
        documentId: "doc-010",
        approvalLink: "https://example.com/approve/brand456",
      };

      const template = generateApprovalEmailTemplate(data);

      expect(template).toContain("Alpago");
      expect(template).toContain("D4AF37"); // Gold color hex
    });
  });

  describe("generateBulkImportEmailTemplate", () => {
    it("should generate bulk import email template with success", () => {
      const data = {
        recipientEmail: "user@example.com",
        projectName: "Marina Towers",
        importedCount: 150,
        errorCount: 0,
        importId: "import-001",
        timestamp: new Date("2026-01-18T10:00:00"),
      };

      const template = generateBulkImportEmailTemplate(data);

      expect(template).toContain("BOQ Import Report");
      expect(template).toContain("Marina Towers");
      expect(template).toContain("150");
      expect(template).toContain("Success");
      expect(template).toContain("import-001");
    });

    it("should generate bulk import email template with errors", () => {
      const data = {
        recipientEmail: "user@example.com",
        projectName: "Downtown Plaza",
        importedCount: 120,
        errorCount: 5,
        importId: "import-002",
        timestamp: new Date("2026-01-18T10:00:00"),
      };

      const template = generateBulkImportEmailTemplate(data);

      expect(template).toContain("BOQ Import Report");
      expect(template).toContain("Downtown Plaza");
      expect(template).toContain("120");
      expect(template).toContain("5");
      expect(template).toContain("Completed with Errors");
      expect(template).toContain("Some items encountered errors");
    });

    it("should include import statistics", () => {
      const data = {
        recipientEmail: "user@example.com",
        projectName: "Test Project",
        importedCount: 100,
        errorCount: 0,
        importId: "import-003",
        timestamp: new Date(),
      };

      const template = generateBulkImportEmailTemplate(data);

      expect(template).toContain("Items Imported");
      expect(template).toContain("Errors");
      expect(template).toContain("100");
    });

    it("should include Alpago branding", () => {
      const data = {
        recipientEmail: "user@example.com",
        projectName: "Test Project",
        importedCount: 50,
        errorCount: 0,
        importId: "import-004",
        timestamp: new Date(),
      };

      const template = generateBulkImportEmailTemplate(data);

      expect(template).toContain("Alpago");
      expect(template).toContain("D4AF37"); // Gold color hex
    });
  });

  describe("Email Template Structure", () => {
    it("share template should have proper HTML structure", () => {
      const data = {
        recipientEmail: "test@example.com",
        recipientName: "John Doe",
        senderName: "Mohamed Ali",
        documentName: "Test Document",
        documentId: "doc-011",
        permissionLevel: "view" as const,
        shareLink: "https://example.com/share/html123",
      };

      const template = generateShareEmailTemplate(data);

      expect(template).toContain("<!DOCTYPE html>");
      expect(template).toContain("<html>");
      expect(template).toContain("</html>");
      expect(template).toContain("<style>");
      expect(template).toContain("</style>");
    });

    it("approval template should include Alpago branding and HTML structure", () => {
      const data = {
        recipientEmail: "approver@example.com",
        recipientName: "Approver",
        documentName: "Test Document",
        documentId: "doc-012",
        approvalLink: "https://example.com/approve/html456",
      };

      const template = generateApprovalEmailTemplate(data);

      expect(template).toContain("<!DOCTYPE html>");
      expect(template).toContain("<html>");
      expect(template).toContain("</html>");
      expect(template).toContain("<style>");
      expect(template).toContain("</style>");
    });

    it("bulk import template should include Alpago branding", () => {
      const data = {
        recipientEmail: "user@example.com",
        projectName: "Test Project",
        importedCount: 100,
        errorCount: 0,
        importId: "import-005",
        timestamp: new Date(),
      };

      const template = generateBulkImportEmailTemplate(data);

      expect(template).toContain("<!DOCTYPE html>");
      expect(template).toContain("<html>");
      expect(template).toContain("</html>");
      expect(template).toContain("<style>");
      expect(template).toContain("</style>");
    });
  });
});
