import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "test",
    role: "user",
    avatar: null,
    phone: null,
    jobTitle: null,
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

describe("materials router", () => {
  it("should create a material item", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.materials.create({
      projectId: 1,
      name: "Portland Cement",
      description: "High-quality cement",
      category: "concrete",
      quantity: 100,
      unit: "kg",
      estimatedUnitCost: 5,
      supplier: "Cement Co",
      specificationNotes: "Grade A",
      status: "pending",
      priority: "high",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should list material items for a project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.materials.list({
      projectId: 1,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should get a material item by ID", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a material
    const created = await caller.materials.create({
      projectId: 1,
      name: "Steel Bars",
      category: "steel",
      quantity: 50,
      unit: "kg",
      status: "pending",
      priority: "medium",
    });

    // Then retrieve it
    const result = await caller.materials.getById({
      id: created.id,
    });

    expect(result).toBeDefined();
    if (result) {
      expect(result.name).toBe("Steel Bars");
      expect(result.category).toBe("steel");
    }
  });

  it("should update a material item", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a material
    const created = await caller.materials.create({
      projectId: 1,
      name: "Paint",
      category: "paint",
      quantity: 20,
      unit: "liters",
      status: "pending",
      priority: "low",
    });

    // Update it
    const result = await caller.materials.update({
      id: created.id,
      status: "ordered",
      priority: "high",
    });

    expect(result.success).toBe(true);
  });

  it("should delete a material item", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a material
    const created = await caller.materials.create({
      projectId: 1,
      name: "Electrical Wire",
      category: "electrical",
      quantity: 100,
      unit: "meters",
      status: "pending",
      priority: "medium",
    });

    // Delete it
    const result = await caller.materials.delete({
      id: created.id,
    });

    expect(result.success).toBe(true);
  });
});

describe("ffe router", () => {
  it("should create an FF&E item", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ffe.create({
      projectId: 1,
      name: "Executive Desk",
      description: "Premium office desk",
      category: "furniture",
      type: "Executive",
      quantity: 5,
      unit: "piece",
      estimatedUnitCost: 1500,
      manufacturer: "Office Furniture Co",
      modelNumber: "ED-2024",
      specificationNotes: "Mahogany finish",
      status: "pending",
      priority: "high",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should list FF&E items for a project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ffe.list({
      projectId: 1,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should get an FF&E item by ID", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create an FF&E item
    const created = await caller.ffe.create({
      projectId: 1,
      name: "Conference Table",
      category: "furniture",
      quantity: 2,
      status: "pending",
      priority: "medium",
    });

    // Then retrieve it
    const result = await caller.ffe.getById({
      id: created.id,
    });

    expect(result).toBeDefined();
    if (result) {
      expect(result.name).toBe("Conference Table");
      expect(result.category).toBe("furniture");
    }
  });

  it("should update an FF&E item", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create an FF&E item
    const created = await caller.ffe.create({
      projectId: 1,
      name: "Office Lighting",
      category: "lighting",
      quantity: 20,
      status: "pending",
      priority: "low",
    });

    // Update it
    const result = await caller.ffe.update({
      id: created.id,
      status: "delivered",
      priority: "high",
    });

    expect(result.success).toBe(true);
  });

  it("should delete an FF&E item", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create an FF&E item
    const created = await caller.ffe.create({
      projectId: 1,
      name: "HVAC System",
      category: "hvac",
      quantity: 1,
      status: "pending",
      priority: "critical",
    });

    // Delete it
    const result = await caller.ffe.delete({
      id: created.id,
    });

    expect(result.success).toBe(true);
  });
});
