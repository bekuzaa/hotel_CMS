import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

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
    res: {} as TrpcContext["res"],
  };
}

describe("activityLogs router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
  });

  describe("getAll", () => {
    it("should return paginated activity logs", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.activityLogs.getAll({
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.data)).toBe(true);
      expect(typeof result.total).toBe("number");
    });

    it("should filter by userId", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.activityLogs.getAll({
        limit: 10,
        offset: 0,
        userId: 1,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should filter by entityType", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.activityLogs.getAll({
        limit: 10,
        offset: 0,
        entityType: "tvChannel",
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should filter by action", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.activityLogs.getAll({
        limit: 10,
        offset: 0,
        action: "create",
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe("getByUserId", () => {
    it("should return activity logs for a specific user", async () => {
      const caller = appRouter.createCaller(ctx);
      const logs = await caller.activityLogs.getByUserId({
        userId: 1,
        limit: 10,
        offset: 0,
      });

      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe("getByEntity", () => {
    it("should return activity logs for a specific entity", async () => {
      const caller = appRouter.createCaller(ctx);
      const logs = await caller.activityLogs.getByEntity({
        entityType: "tvChannel",
        entityId: 1,
        limit: 10,
      });

      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe("getByDateRange", () => {
    it("should return activity logs within date range", async () => {
      const caller = appRouter.createCaller(ctx);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const logs = await caller.activityLogs.getByDateRange({
        startDate,
        endDate,
        limit: 100,
      });

      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe("getActionSummary", () => {
    it("should return summary of actions", async () => {
      const caller = appRouter.createCaller(ctx);
      const summary = await caller.activityLogs.getActionSummary();

      expect(typeof summary).toBe("object");
      expect(summary).not.toBeNull();
    });
  });

  describe("getEntityTypeSummary", () => {
    it("should return summary of entity types", async () => {
      const caller = appRouter.createCaller(ctx);
      const summary = await caller.activityLogs.getEntityTypeSummary();

      expect(typeof summary).toBe("object");
      expect(summary).not.toBeNull();
    });
  });

  describe("logActivity", () => {
    it("should log an activity", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.activityLogs.logActivity({
        userId: 1,
        action: "create",
        entityType: "tvChannel",
        entityId: 1,
        changes: JSON.stringify({ name: "Test Channel" }),
        ipAddress: "127.0.0.1",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe("getRecentActivities", () => {
    it("should return recent activities from last 24 hours", async () => {
      const caller = appRouter.createCaller(ctx);
      const activities = await caller.activityLogs.getRecentActivities({
        limit: 20,
      });

      expect(Array.isArray(activities)).toBe(true);
    });
  });

  describe("getStatistics", () => {
    it("should return activity statistics", async () => {
      const caller = appRouter.createCaller(ctx);
      const stats = await caller.activityLogs.getStatistics();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("totalActivities");
      expect(stats).toHaveProperty("activitiesLast24h");
      expect(stats).toHaveProperty("uniqueUsers");
      expect(stats).toHaveProperty("topActions");
      expect(stats).toHaveProperty("topEntities");

      expect(typeof stats.totalActivities).toBe("number");
      expect(typeof stats.activitiesLast24h).toBe("number");
      expect(typeof stats.uniqueUsers).toBe("number");
      expect(Array.isArray(stats.topActions)).toBe(true);
      expect(Array.isArray(stats.topEntities)).toBe(true);
    });
  });
});
