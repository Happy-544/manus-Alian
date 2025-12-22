import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module with importOriginal to include all exports
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal() as object;
  return {
    ...actual,
    getAllProjects: vi.fn(),
    getProjectsForUser: vi.fn(),
    getProjectById: vi.fn(),
    getProjectStats: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    getTasksByProject: vi.fn(),
    getMilestonesByProject: vi.fn(),
    getExpensesByProject: vi.fn(),
    createActivityLog: vi.fn(),
    addProjectMember: vi.fn(),
    getProjectMembers: vi.fn(),
    removeProjectMember: vi.fn(),
  };
});

// Import mocked db
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
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

describe("projects router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("projects.list", () => {
    it("returns all projects for admin users", async () => {
      const mockProjects = [
        { id: 1, name: "Project A", status: "in_progress" },
        { id: 2, name: "Project B", status: "planning" },
      ];
      
      vi.mocked(db.getAllProjects).mockResolvedValue(mockProjects as any);
      
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.projects.list();
      
      expect(db.getAllProjects).toHaveBeenCalled();
      expect(result).toEqual(mockProjects);
    });

    it("returns only user's projects for non-admin users", async () => {
      const mockProjects = [
        { id: 1, name: "My Project", status: "in_progress" },
      ];
      
      vi.mocked(db.getProjectsForUser).mockResolvedValue(mockProjects as any);
      
      const ctx = createMockContext("user");
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.projects.list();
      
      expect(db.getProjectsForUser).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProjects);
    });
  });

  describe("projects.getById", () => {
    it("returns a project by id", async () => {
      const mockProject = {
        id: 1,
        name: "Test Project",
        status: "in_progress",
        budget: "100000",
      };
      
      vi.mocked(db.getProjectById).mockResolvedValue(mockProject as any);
      
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.projects.getById({ id: 1 });
      
      expect(db.getProjectById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProject);
    });
  });

  describe("projects.create", () => {
    it("creates a new project with required fields", async () => {
      vi.mocked(db.createProject).mockResolvedValue(1);
      vi.mocked(db.createActivityLog).mockResolvedValue(1);
      
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const input = {
        name: "New Construction Project",
        description: "A test project",
        clientName: "Test Client",
        location: "New York",
        budget: "500000",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      };
      
      const result = await caller.projects.create(input);
      
      expect(db.createProject).toHaveBeenCalledWith(expect.objectContaining({
        name: "New Construction Project",
        description: "A test project",
        clientName: "Test Client",
        createdById: 1,
      }));
      expect(result).toEqual({ id: 1 });
    });

    it("creates activity log when project is created", async () => {
      vi.mocked(db.createProject).mockResolvedValue(5);
      vi.mocked(db.createActivityLog).mockResolvedValue(1);
      
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      await caller.projects.create({
        name: "Activity Log Test",
      });
      
      expect(db.createActivityLog).toHaveBeenCalledWith(expect.objectContaining({
        projectId: 5,
        userId: 1,
        action: "created",
        entityType: "project",
        entityId: 5,
      }));
    });
  });

  describe("projects.update", () => {
    it("updates an existing project", async () => {
      vi.mocked(db.updateProject).mockResolvedValue(undefined);
      
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.projects.update({
        id: 1,
        name: "Updated Project Name",
        status: "completed",
      });
      
      expect(db.updateProject).toHaveBeenCalledWith(1, expect.objectContaining({
        name: "Updated Project Name",
        status: "completed",
      }));
      expect(result).toEqual({ success: true });
    });
  });

  describe("projects.delete", () => {
    it("deletes a project by id", async () => {
      vi.mocked(db.deleteProject).mockResolvedValue(undefined);
      
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.projects.delete({ id: 1 });
      
      expect(db.deleteProject).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true });
    });
  });

  describe("projects.stats (global)", () => {
    it("returns global project statistics", async () => {
      const mockStats = {
        totalProjects: 5,
        activeProjects: 3,
        completedProjects: 2,
        totalBudget: 500000,
        totalSpent: 150000,
      };
      
      vi.mocked(db.getProjectStats).mockResolvedValue(mockStats as any);
      
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.projects.stats();
      
      expect(db.getProjectStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });
});
