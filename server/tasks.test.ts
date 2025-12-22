import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module with importOriginal to include all exports
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal() as object;
  return {
    ...actual,
    getTasksByProject: vi.fn(),
    getTasksByAssignee: vi.fn(),
    getTaskById: vi.fn(),
    getTaskStats: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    createNotification: vi.fn(),
    createActivityLog: vi.fn(),
  };
});

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
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

describe("tasks router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("tasks.list", () => {
    it("returns tasks for a project", async () => {
      const mockTasks = [
        { id: 1, title: "Task 1", status: "todo", projectId: 1 },
        { id: 2, title: "Task 2", status: "in_progress", projectId: 1 },
      ];
      
      vi.mocked(db.getTasksByProject).mockResolvedValue(mockTasks as any);
      
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.tasks.list({ projectId: 1 });
      
      expect(db.getTasksByProject).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTasks);
    });
  });

  describe("tasks.myTasks", () => {
    it("returns tasks assigned to the current user", async () => {
      const mockTasks = [
        { id: 1, title: "My Task 1", assigneeId: 1 },
        { id: 2, title: "My Task 2", assigneeId: 1 },
      ];
      
      vi.mocked(db.getTasksByAssignee).mockResolvedValue(mockTasks as any);
      
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.tasks.myTasks();
      
      expect(db.getTasksByAssignee).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTasks);
    });
  });

  describe("tasks.getById", () => {
    it("returns a task by id", async () => {
      const mockTask = {
        id: 1,
        title: "Test Task",
        description: "Task description",
        status: "in_progress",
        priority: "high",
      };
      
      vi.mocked(db.getTaskById).mockResolvedValue(mockTask as any);
      
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.tasks.getById({ id: 1 });
      
      expect(db.getTaskById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTask);
    });
  });

  describe("tasks.stats", () => {
    it("returns task statistics", async () => {
      const mockStats = {
        total: 10,
        completed: 3,
        inProgress: 4,
        todo: 2,
        inReview: 1,
      };
      
      vi.mocked(db.getTaskStats).mockResolvedValue(mockStats);
      
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.tasks.stats({});
      
      expect(db.getTaskStats).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockStats);
    });

    it("returns task statistics for a specific project", async () => {
      const mockStats = {
        total: 5,
        completed: 2,
        inProgress: 2,
        todo: 1,
        inReview: 0,
      };
      
      vi.mocked(db.getTaskStats).mockResolvedValue(mockStats);
      
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.tasks.stats({ projectId: 1 });
      
      expect(db.getTaskStats).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockStats);
    });
  });

  describe("tasks.create", () => {
    it("creates a new task with required fields", async () => {
      vi.mocked(db.createTask).mockResolvedValue(1);
      vi.mocked(db.createActivityLog).mockResolvedValue(1);
      
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const input = {
        projectId: 1,
        title: "New Task",
        description: "Task description",
        priority: "high" as const,
        status: "todo" as const,
      };
      
      const result = await caller.tasks.create(input);
      
      expect(db.createTask).toHaveBeenCalledWith(expect.objectContaining({
        projectId: 1,
        title: "New Task",
        description: "Task description",
        priority: "high",
        createdById: 1,
      }));
      expect(result).toEqual({ id: 1 });
    });

    it("creates notification when task is assigned", async () => {
      vi.mocked(db.createTask).mockResolvedValue(1);
      vi.mocked(db.createNotification).mockResolvedValue(1);
      vi.mocked(db.createActivityLog).mockResolvedValue(1);
      
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      await caller.tasks.create({
        projectId: 1,
        title: "Assigned Task",
        assigneeId: 2,
      });
      
      expect(db.createNotification).toHaveBeenCalledWith(expect.objectContaining({
        userId: 2,
        projectId: 1,
        type: "task_assigned",
        title: "New Task Assigned",
      }));
    });
  });

  describe("tasks.update", () => {
    it("updates an existing task", async () => {
      vi.mocked(db.updateTask).mockResolvedValue(undefined);
      
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.tasks.update({
        id: 1,
        title: "Updated Task Title",
        status: "completed",
      });
      
      expect(db.updateTask).toHaveBeenCalledWith(1, expect.objectContaining({
        title: "Updated Task Title",
        status: "completed",
      }));
      expect(result).toEqual({ success: true });
    });
  });

  describe("tasks.delete", () => {
    it("deletes a task by id", async () => {
      vi.mocked(db.deleteTask).mockResolvedValue(undefined);
      
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.tasks.delete({ id: 1 });
      
      expect(db.deleteTask).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true });
    });
  });
});
