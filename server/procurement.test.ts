import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getVendors: vi.fn().mockResolvedValue([
      {
        id: 1,
        name: "ABC Supplies",
        category: "materials",
        contactPerson: "John Doe",
        email: "john@abc.com",
        phone: "+1234567890",
        rating: 4,
        isActive: true,
      },
    ]),
    getVendorById: vi.fn().mockResolvedValue({
      id: 1,
      name: "ABC Supplies",
      category: "materials",
    }),
    getVendorsByCategory: vi.fn().mockResolvedValue([
      { id: 1, name: "ABC Supplies", category: "materials", rating: 4 },
    ]),
    createVendor: vi.fn().mockResolvedValue(1),
    updateVendor: vi.fn().mockResolvedValue(undefined),
    deleteVendor: vi.fn().mockResolvedValue(undefined),
    getProcurementItemsByProject: vi.fn().mockResolvedValue([
      {
        id: 1,
        projectId: 1,
        name: "Office Desk",
        category: "furniture",
        quantity: "10",
        unit: "pcs",
        estimatedUnitCost: "500",
        totalCost: "5000",
        status: "pending",
        priority: "medium",
      },
    ]),
    getProcurementStats: vi.fn().mockResolvedValue({
      total: 10,
      pending: 5,
      ordered: 3,
      delivered: 2,
      totalCost: "50000",
    }),
    getProcurementItemById: vi.fn().mockResolvedValue({
      id: 1,
      name: "Office Desk",
      category: "furniture",
      quantity: "10",
      specifications: "Standard office desk",
    }),
    createProcurementItem: vi.fn().mockResolvedValue(1),
    updateProcurementItem: vi.fn().mockResolvedValue(undefined),
    deleteProcurementItem: vi.fn().mockResolvedValue(undefined),
    createActivityLog: vi.fn().mockResolvedValue(1),
    getProjectById: vi.fn().mockResolvedValue({
      id: 1,
      name: "Test Project",
      location: "Dubai",
      budget: "1000000",
      currency: "AED",
    }),
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

describe("vendors router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists all vendors", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.vendors.list();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("ABC Supplies");
  });

  it("gets vendor by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.vendors.getById({ id: 1 });

    expect(result).toBeDefined();
    expect(result?.name).toBe("ABC Supplies");
  });

  it("gets vendors by category", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.vendors.getByCategory({ category: "materials" });

    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("materials");
  });

  it("creates a vendor", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.vendors.create({
      name: "New Vendor",
      category: "equipment",
      email: "vendor@test.com",
    });

    expect(result).toEqual({ id: 1 });
  });

  it("updates a vendor", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.vendors.update({
      id: 1,
      name: "Updated Vendor",
    });

    expect(result).toEqual({ success: true });
  });

  it("deletes a vendor", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.vendors.delete({ id: 1 });

    expect(result).toEqual({ success: true });
  });
});

describe("procurement router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists procurement items by project", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.procurement.list({ projectId: 1 });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Office Desk");
  });

  it("gets procurement stats", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.procurement.stats({ projectId: 1 });

    expect(result.total).toBe(10);
    expect(result.pending).toBe(5);
  });

  it("gets procurement item by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.procurement.getById({ id: 1 });

    expect(result).toBeDefined();
    expect(result?.name).toBe("Office Desk");
  });

  it("creates a procurement item", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.procurement.create({
      projectId: 1,
      name: "Office Chair",
      category: "furniture",
      quantity: "20",
      unit: "pcs",
      estimatedUnitCost: "200",
      priority: "high",
    });

    expect(result).toEqual({ id: 1 });
  });

  it("updates a procurement item", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.procurement.update({
      id: 1,
      status: "ordered",
    });

    expect(result).toEqual({ success: true });
  });

  it("deletes a procurement item", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.procurement.delete({ id: 1 });

    expect(result).toEqual({ success: true });
  });
});
