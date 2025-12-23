import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module with importOriginal to include all exports
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal() as object;
  return {
    ...actual,
    getProjectById: vi.fn(),
    getTasksByProject: vi.fn(),
    getMilestonesByProject: vi.fn(),
    getExpensesByProject: vi.fn(),
    getProjectMembers: vi.fn(),
  };
});

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import * as db from "./db";
import { invokeLLM } from "./_core/llm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("AI router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ai.generateSummary", () => {
    it("generates a project summary using LLM", async () => {
      const mockProject = {
        id: 1,
        name: "Test Project",
        status: "in_progress",
        budget: "100000",
        currency: "USD",
        progress: 50,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      };
      const mockTasks = [
        { id: 1, status: "completed", dueDate: "2024-06-01" },
        { id: 2, status: "in_progress", dueDate: "2024-12-01" },
      ];
      const mockMilestones = [
        { id: 1, status: "completed" },
        { id: 2, status: "pending" },
      ];
      const mockExpenses = [
        { id: 1, amount: "10000" },
        { id: 2, amount: "5000" },
      ];

      vi.mocked(db.getProjectById).mockResolvedValue(mockProject as any);
      vi.mocked(db.getTasksByProject).mockResolvedValue(mockTasks as any);
      vi.mocked(db.getMilestonesByProject).mockResolvedValue(mockMilestones as any);
      vi.mocked(db.getExpensesByProject).mockResolvedValue(mockExpenses as any);
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [{ message: { content: "This is a test summary" } }],
      } as any);

      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.generateSummary({ projectId: 1 });

      expect(db.getProjectById).toHaveBeenCalledWith(1);
      expect(db.getTasksByProject).toHaveBeenCalledWith(1);
      expect(invokeLLM).toHaveBeenCalled();
      expect(result.summary).toBe("This is a test summary");
    });

    it("throws error when project not found", async () => {
      vi.mocked(db.getProjectById).mockResolvedValue(undefined);
      vi.mocked(db.getTasksByProject).mockResolvedValue([]);
      vi.mocked(db.getMilestonesByProject).mockResolvedValue([]);
      vi.mocked(db.getExpensesByProject).mockResolvedValue([]);

      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.ai.generateSummary({ projectId: 999 })).rejects.toThrow("Project not found");
    });
  });

  describe("ai.generateWeeklyReport", () => {
    it("generates a comprehensive weekly report", async () => {
      const mockProject = {
        id: 1,
        name: "JGE Villa 45",
        clientName: "Mr. Osman",
        location: "Dubai, UAE",
        status: "in_progress",
        budget: "7000000",
        currency: "USD",
        progress: 25,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      };
      const mockTasks = [
        { id: 1, title: "Foundation work", status: "completed", priority: "high", dueDate: "2024-06-01", updatedAt: new Date() },
        { id: 2, title: "Electrical wiring", status: "in_progress", priority: "medium", dueDate: "2024-12-01", updatedAt: new Date() },
        { id: 3, title: "Plumbing", status: "todo", priority: "low", dueDate: "2024-01-01", updatedAt: new Date() },
      ];
      const mockMilestones = [
        { id: 1, name: "Phase 1 Complete", status: "completed", dueDate: "2024-06-01" },
        { id: 2, name: "Phase 2 Complete", status: "pending", dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
      ];
      const mockExpenses = [
        { id: 1, amount: "500000", expenseDate: new Date() },
        { id: 2, amount: "200000", expenseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
      ];
      const mockMembers = [
        { id: 1, role: "project_manager", userId: 1 },
        { id: 2, role: "engineer", userId: 2 },
      ];

      vi.mocked(db.getProjectById).mockResolvedValue(mockProject as any);
      vi.mocked(db.getTasksByProject).mockResolvedValue(mockTasks as any);
      vi.mocked(db.getMilestonesByProject).mockResolvedValue(mockMilestones as any);
      vi.mocked(db.getExpensesByProject).mockResolvedValue(mockExpenses as any);
      vi.mocked(db.getProjectMembers).mockResolvedValue(mockMembers as any);
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [{ message: { content: "# Weekly Progress Report\n\nThis is a comprehensive weekly report..." } }],
      } as any);

      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.generateWeeklyReport({ projectId: 1 });

      expect(db.getProjectById).toHaveBeenCalledWith(1);
      expect(db.getTasksByProject).toHaveBeenCalledWith(1);
      expect(db.getMilestonesByProject).toHaveBeenCalledWith(1);
      expect(db.getExpensesByProject).toHaveBeenCalledWith(1);
      expect(db.getProjectMembers).toHaveBeenCalledWith(1);
      expect(invokeLLM).toHaveBeenCalled();
      
      // Check report content
      expect(result.report).toContain("Weekly Progress Report");
      
      // Check metadata
      expect(result.metadata).toBeDefined();
      expect(result.metadata.projectName).toBe("JGE Villa 45");
      expect(result.metadata.tasksCompleted).toBeGreaterThanOrEqual(0);
      expect(result.metadata.tasksInProgress).toBeGreaterThanOrEqual(0);
      expect(result.metadata.overdueTasks).toBeGreaterThanOrEqual(0);
      expect(result.metadata.budgetUtilization).toBeGreaterThanOrEqual(0);
    });

    it("throws error when project not found for weekly report", async () => {
      vi.mocked(db.getProjectById).mockResolvedValue(undefined);
      vi.mocked(db.getTasksByProject).mockResolvedValue([]);
      vi.mocked(db.getMilestonesByProject).mockResolvedValue([]);
      vi.mocked(db.getExpensesByProject).mockResolvedValue([]);
      vi.mocked(db.getProjectMembers).mockResolvedValue([]);

      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.ai.generateWeeklyReport({ projectId: 999 })).rejects.toThrow("Project not found");
    });

    it("calculates correct budget utilization", async () => {
      const mockProject = {
        id: 1,
        name: "Budget Test Project",
        clientName: "Test Client",
        location: "Test Location",
        status: "in_progress",
        budget: "100000",
        currency: "USD",
        progress: 50,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      };
      const mockExpenses = [
        { id: 1, amount: "25000", expenseDate: new Date() },
        { id: 2, amount: "25000", expenseDate: new Date() },
      ];

      vi.mocked(db.getProjectById).mockResolvedValue(mockProject as any);
      vi.mocked(db.getTasksByProject).mockResolvedValue([]);
      vi.mocked(db.getMilestonesByProject).mockResolvedValue([]);
      vi.mocked(db.getExpensesByProject).mockResolvedValue(mockExpenses as any);
      vi.mocked(db.getProjectMembers).mockResolvedValue([]);
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [{ message: { content: "Budget report content" } }],
      } as any);

      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.generateWeeklyReport({ projectId: 1 });

      // 50000 spent out of 100000 = 50% utilization
      expect(result.metadata.budgetUtilization).toBe(50);
    });
  });

  describe("ai.chat", () => {
    it("responds to chat messages about the project", async () => {
      const mockProject = {
        id: 1,
        name: "Test Project",
        status: "in_progress",
        budget: "100000",
        currency: "USD",
        progress: 50,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      };
      const mockTasks = [
        { id: 1, title: "Task 1", status: "completed" },
      ];

      vi.mocked(db.getProjectById).mockResolvedValue(mockProject as any);
      vi.mocked(db.getTasksByProject).mockResolvedValue(mockTasks as any);
      vi.mocked(db.getMilestonesByProject).mockResolvedValue([]);
      vi.mocked(db.getExpensesByProject).mockResolvedValue([]);
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [{ message: { content: "The project is progressing well." } }],
      } as any);

      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.chat({
        projectId: 1,
        message: "How is the project going?",
      });

      expect(db.getProjectById).toHaveBeenCalledWith(1);
      expect(invokeLLM).toHaveBeenCalled();
      expect(result.message).toBe("The project is progressing well.");
    });
  });
});
