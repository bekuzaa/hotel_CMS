import { describe, expect, it, beforeEach, vi } from "vitest";
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

describe("analytics router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
  });

  describe("getDashboardStats", () => {
    it("should return dashboard statistics", async () => {
      const caller = appRouter.createCaller(ctx);
      const stats = await caller.analytics.getDashboardStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("totalRooms");
      expect(stats).toHaveProperty("activeRooms");
      expect(stats).toHaveProperty("totalGuests");
      expect(stats).toHaveProperty("totalChannels");
      expect(stats).toHaveProperty("totalMenus");
      expect(stats).toHaveProperty("onlineDevices");
      expect(stats).toHaveProperty("offlineDevices");

      expect(typeof stats.totalRooms).toBe("number");
      expect(typeof stats.activeRooms).toBe("number");
      expect(typeof stats.totalGuests).toBe("number");
      expect(typeof stats.totalChannels).toBe("number");
      expect(typeof stats.totalMenus).toBe("number");
      expect(typeof stats.onlineDevices).toBe("number");
      expect(typeof stats.offlineDevices).toBe("number");
    });
  });

  describe("getRoomOccupancy", () => {
    it("should return room occupancy statistics", async () => {
      const caller = appRouter.createCaller(ctx);
      const occupancy = await caller.analytics.getRoomOccupancy();

      expect(occupancy).toBeDefined();
      expect(occupancy).toHaveProperty("occupied");
      expect(occupancy).toHaveProperty("vacant");
      expect(occupancy).toHaveProperty("maintenance");
      expect(occupancy).toHaveProperty("occupancyRate");

      expect(typeof occupancy.occupied).toBe("number");
      expect(typeof occupancy.vacant).toBe("number");
      expect(typeof occupancy.maintenance).toBe("number");
      expect(typeof occupancy.occupancyRate).toBe("number");

      expect(occupancy.occupancyRate).toBeGreaterThanOrEqual(0);
      expect(occupancy.occupancyRate).toBeLessThanOrEqual(100);
    });
  });

  describe("getDeviceStatus", () => {
    it("should return device status summary", async () => {
      const caller = appRouter.createCaller(ctx);
      const status = await caller.analytics.getDeviceStatus();

      expect(status).toBeDefined();
      expect(status).toHaveProperty("online");
      expect(status).toHaveProperty("offline");
      expect(status).toHaveProperty("idle");

      expect(typeof status.online).toBe("number");
      expect(typeof status.offline).toBe("number");
      expect(typeof status.idle).toBe("number");
    });
  });

  describe("getRecentActivity", () => {
    it("should return recent activity logs", async () => {
      const caller = appRouter.createCaller(ctx);
      const activities = await caller.analytics.getRecentActivity();

      expect(Array.isArray(activities)).toBe(true);
      
      if (activities.length > 0) {
        const activity = activities[0];
        expect(activity).toHaveProperty("id");
        expect(activity).toHaveProperty("userId");
        expect(activity).toHaveProperty("action");
        expect(activity).toHaveProperty("entityType");
        expect(activity).toHaveProperty("createdAt");
      }
    });
  });

  describe("getChannelPopularity", () => {
    it("should return channel popularity data", async () => {
      const caller = appRouter.createCaller(ctx);
      const channels = await caller.analytics.getChannelPopularity();

      expect(Array.isArray(channels)).toBe(true);
      
      if (channels.length > 0) {
        const channel = channels[0];
        expect(channel).toHaveProperty("id");
        expect(channel).toHaveProperty("name");
        expect(channel).toHaveProperty("views");
        expect(typeof channel.views).toBe("number");
      }
    });
  });

  describe("getSystemHealth", () => {
    it("should return system health status", async () => {
      const caller = appRouter.createCaller(ctx);
      const health = await caller.analytics.getSystemHealth();

      expect(health).toBeDefined();
      expect(health).toHaveProperty("database");
      expect(health).toHaveProperty("api");
      expect(health).toHaveProperty("storage");
      expect(health).toHaveProperty("uptime");
      expect(health).toHaveProperty("timestamp");

      expect(["healthy", "unhealthy"]).toContain(health.database);
      expect(["healthy", "unhealthy"]).toContain(health.api);
      expect(["healthy", "unhealthy"]).toContain(health.storage);
      expect(typeof health.uptime).toBe("number");
    });
  });

  describe("getGuestStats", () => {
    it("should return guest statistics", async () => {
      const caller = appRouter.createCaller(ctx);
      const stats = await caller.analytics.getGuestStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("checkInToday");
      expect(stats).toHaveProperty("checkOutToday");
      expect(stats).toHaveProperty("stayingGuests");

      expect(typeof stats.checkInToday).toBe("number");
      expect(typeof stats.checkOutToday).toBe("number");
      expect(typeof stats.stayingGuests).toBe("number");
    });
  });

  describe("getContentStats", () => {
    it("should return content statistics", async () => {
      const caller = appRouter.createCaller(ctx);
      const stats = await caller.analytics.getContentStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("channels");
      expect(stats).toHaveProperty("menus");
      expect(stats).toHaveProperty("backgrounds");
      expect(stats).toHaveProperty("mediaFiles");

      expect(typeof stats.channels).toBe("number");
      expect(typeof stats.menus).toBe("number");
      expect(typeof stats.backgrounds).toBe("number");
      expect(typeof stats.mediaFiles).toBe("number");
    });
  });
});
