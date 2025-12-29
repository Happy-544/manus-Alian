import { describe, it, expect, vi } from "vitest";
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

describe("documentGeneration router", () => {
  it("should have documentGeneration router available", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Verify the router exists
    expect(caller.documentGeneration).toBeDefined();
    expect(typeof caller.documentGeneration.generateComprehensive).toBe("function");
  });

  it("should handle comprehensive document generation mutation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // This test verifies the mutation is callable
    // The actual AI generation is tested through integration
    expect(caller.documentGeneration.generateComprehensive).toBeDefined();
  });
});
