import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getBaselinesByProject: vi.fn().mockResolvedValue([
      {
        id: 1,
        projectId: 1,
        name: "Original Schedule",
        version: 1,
        plannedStartDate: new Date("2024-01-01"),
        plannedEndDate: new Date("2024-06-30"),
        plannedBudget: "1000000",
        isActive: true,
        createdAt: new Date(),
      },
    ]),
    getActiveBaseline: vi.fn().mockResolvedValue({
      id: 1,
      projectId: 1,
      name: "Original Schedule",
      version: 1,
      plannedStartDate: new Date("2024-01-01"),
      plannedEndDate: new Date("2024-06-30"),
      isActive: true,
    }),
    getBaselineById: vi.fn().mockResolvedValue({
      id: 1,
      name: "Original Schedule",
      version: 1,
    }),
    getBaselineTasks: vi.fn().mockResolvedValue([
      {
        id: 1,
        baselineId: 1,
        taskId: 1,
        taskName: "Task 1",
        plannedStartDate: new Date("2024-01-01"),
        plannedEndDate: new Date("2024-01-15"),
        plannedProgress: 0,
      },
    ]),
    createBaseline: vi.fn().mockResolvedValue(1),
    updateBaseline: vi.fn().mockResolvedValue(undefined),
    deleteBaseline: vi.fn().mockResolvedValue(undefined),
    createBaselineTasks: vi.fn().mockResolvedValue(undefined),
    deleteBaselineTasks: vi.fn().mockResolvedValue(undefined),
    getScheduleVariances: vi.fn().mockResolvedValue([
      {
        id: 1,
        projectId: 1,
        baselineId: 1,
        taskId: 1,
        varianceType: "start_delay",
        plannedValue: "2024-01-01",
        actualValue: "2024-01-05",
        varianceDays: 4,
        impact: "low",
        recordedAt: new Date(),
      },
    ]),
    createScheduleVariance: vi.fn().mockResolvedValue(1),
    getProgressSnapshots: vi.fn().mockResolvedValue([
      {
        id: 1,
        projectId: 1,
        snapshotDate: new Date(),
        plannedProgress: 50,
        actualProgress: 45,
        schedulePerformanceIndex: "0.90",
        costPerformanceIndex: "1.05",
        plannedValue: "500000",
        earnedValue: "450000",
        actualCost: "428571",
      },
    ]),
    createProgressSnapshot: vi.fn().mockResolvedValue(1),
    getTasksByProject: vi.fn().mockResolvedValue([
      {
        id: 1,
        title: "Task 1",
        status: "in_progress",
        progress: 50,
        startDate: new Date("2024-01-05"),
        dueDate: new Date("2024-01-20"),
        updatedAt: new Date(),
      },
    ]),
    getProjectById: vi.fn().mockResolvedValue({
      id: 1,
      name: "Test Project",
      status: "in_progress",
      budget: "1000000",
      progress: 45,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-06-30"),
    }),
    getExpensesByProject: vi.fn().mockResolvedValue([
      { id: 1, amount: "100000" },
      { id: 2, amount: "50000" },
    ]),
    createActivityLog: vi.fn().mockResolvedValue(1),
  };
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
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

describe("baseline router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists baselines by project", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.baseline.list({ projectId: 1 });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Original Schedule");
  });

  it("gets active baseline", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.baseline.getActive({ projectId: 1 });

    expect(result).toBeDefined();
    expect(result?.isActive).toBe(true);
  });

  it("gets baseline by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.baseline.getById({ id: 1 });

    expect(result).toBeDefined();
    expect(result?.name).toBe("Original Schedule");
  });

  it("gets baseline tasks", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.baseline.getTasks({ baselineId: 1 });

    expect(result).toHaveLength(1);
    expect(result[0].taskName).toBe("Task 1");
  });

  it("creates a baseline", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.baseline.create({
      projectId: 1,
      name: "New Baseline",
      plannedStartDate: "2024-01-01",
      plannedEndDate: "2024-06-30",
      plannedBudget: "1000000",
    });

    expect(result).toEqual({ id: 1 });
  });

  it("updates a baseline", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.baseline.update({
      id: 1,
      name: "Updated Baseline",
    });

    expect(result).toEqual({ success: true });
  });

  it("deletes a baseline", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.baseline.delete({ id: 1 });

    expect(result).toEqual({ success: true });
  });

  it("gets schedule variances", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.baseline.getVariances({ projectId: 1 });

    expect(result).toHaveLength(1);
    expect(result[0].varianceType).toBe("start_delay");
  });

  it("gets progress snapshots", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.baseline.getSnapshots({ projectId: 1 });

    expect(result).toHaveLength(1);
    expect(result[0].schedulePerformanceIndex).toBe("0.90");
  });

  it("records a progress snapshot", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.baseline.recordSnapshot({
      projectId: 1,
      notes: "Weekly snapshot",
    });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("spi");
    expect(result).toHaveProperty("cpi");
  });
});
