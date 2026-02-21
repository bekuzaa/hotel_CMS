import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: string = "admin", hotelId?: number): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: role as any,
    hotelId,
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

// Mock the websocket module
vi.mock("../_core/websocket", () => ({
  getConnectedDevices: vi.fn(() => [
    {
      id: "device-1",
      hotelId: 1,
      roomNumber: "101",
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
    },
    {
      id: "device-2",
      hotelId: 1,
      roomNumber: "102",
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
    },
  ]),
  getConnectionStats: vi.fn(() => ({
    totalDevices: 2,
    totalClients: 1,
    devicesByHotel: { 1: 2 },
  })),
  broadcastToDevices: vi.fn(),
  sendToDevice: vi.fn(() => true),
}));

describe("sync router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
    vi.clearAllMocks();
  });

  describe("getConnectedDevices", () => {
    it("should return connected devices for admin", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.sync.getConnectedDevices({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter by hotelId", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.sync.getConnectedDevices({ hotelId: 1 });

      expect(result).toBeDefined();
    });

    it("should use hotelAdmin's hotelId automatically", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);
      const result = await caller.sync.getConnectedDevices({});

      expect(result).toBeDefined();
    });
  });

  describe("getConnectionStats", () => {
    it("should return connection statistics", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.sync.getConnectionStats();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("totalDevices");
      expect(result).toHaveProperty("totalClients");
      expect(result).toHaveProperty("devicesByHotel");
    });
  });

  describe("refreshContent", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.sync.refreshContent({ hotelId: 1 })
      ).rejects.toThrow("Unauthorized");
    });

    it("should refresh content for admin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.sync.refreshContent({ hotelId: 1 });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should refresh content for hotelAdmin on their hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      const result = await caller.sync.refreshContent({ hotelId: 1 });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should throw error when hotelAdmin refreshes different hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      await expect(
        caller.sync.refreshContent({ hotelId: 2 })
      ).rejects.toThrow("Unauthorized");
    });

    it("should support content type filter", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.sync.refreshContent({
        hotelId: 1,
        contentType: "channels",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe("sendMessage", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.sync.sendMessage({
          deviceId: "device-1",
          message: { type: "test", payload: {} },
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should send message for admin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.sync.sendMessage({
        deviceId: "device-1",
        message: { type: "test", payload: { data: "test" } },
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should send message for manager", async () => {
      const managerCtx = createAuthContext("manager");
      const caller = appRouter.createCaller(managerCtx);

      const result = await caller.sync.sendMessage({
        deviceId: "device-1",
        message: { type: "test", payload: {} },
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe("broadcastAnnouncement", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.sync.broadcastAnnouncement({
          hotelId: 1,
          title: "Test",
          message: "Test announcement",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should broadcast announcement for admin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.sync.broadcastAnnouncement({
        hotelId: 1,
        title: "Welcome",
        message: "Welcome to our hotel!",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should broadcast announcement with duration", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.sync.broadcastAnnouncement({
        hotelId: 1,
        title: "Alert",
        message: "Fire drill in 10 minutes",
        duration: 30,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should throw error when hotelAdmin broadcasts to different hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      await expect(
        caller.sync.broadcastAnnouncement({
          hotelId: 2,
          title: "Test",
          message: "Test",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should broadcast for hotelAdmin on their hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      const result = await caller.sync.broadcastAnnouncement({
        hotelId: 1,
        title: "Welcome",
        message: "Enjoy your stay!",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });
});
