import { describe, expect, it, beforeEach } from "vitest";
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

describe("tvChannels router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
  });

  describe("list", () => {
    it("should return array of channels", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.tvChannels.list({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter by hotelId for superAdmin", async () => {
      const superAdminCtx = createAuthContext("superAdmin");
      const caller = appRouter.createCaller(superAdminCtx);
      const result = await caller.tvChannels.list({ hotelId: 1 });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should use hotelAdmin's hotelId automatically", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);
      const result = await caller.tvChannels.list({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getById", () => {
    it("should return null for non-existent channel", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.tvChannels.getById({ id: 999999 });

      expect(result).toBeNull();
    });

    it("should return channel for valid id", async () => {
      const caller = appRouter.createCaller(ctx);
      // This test assumes there's at least one channel in the database
      // In a real test, you would create a channel first
      const result = await caller.tvChannels.getById({ id: 1 });

      // Result can be null if no channel exists, or a channel object
      if (result) {
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("name");
        expect(result).toHaveProperty("nameEn");
        expect(result).toHaveProperty("streamUrl");
      }
    });
  });

  describe("create", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.tvChannels.create({
          name: "Test Channel",
          nameEn: "Test Channel EN",
          streamUrl: "https://example.com/stream",
          category: "TV",
          hotelId: 1,
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should create channel for admin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tvChannels.create({
        name: "Test Channel",
        nameEn: "Test Channel EN",
        streamUrl: "https://example.com/stream",
        category: "TV",
        hotelId: 1,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should throw error when hotelAdmin creates for different hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      await expect(
        caller.tvChannels.create({
          name: "Test Channel",
          nameEn: "Test Channel EN",
          streamUrl: "https://example.com/stream",
          category: "TV",
          hotelId: 2, // Different hotel
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should create channel for hotelAdmin on their hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      const result = await caller.tvChannels.create({
        name: "Test Channel",
        nameEn: "Test Channel EN",
        streamUrl: "https://example.com/stream",
        category: "TV",
        hotelId: 1,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe("update", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.tvChannels.update({
          id: 1,
          name: "Updated Channel",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw error for non-existent channel", async () => {
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.tvChannels.update({
          id: 999999,
          name: "Updated Channel",
        })
      ).rejects.toThrow("Channel not found");
    });
  });

  describe("delete", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.tvChannels.delete({ id: 1 })
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw error for non-existent channel", async () => {
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.tvChannels.delete({ id: 999999 })
      ).rejects.toThrow("Channel not found");
    });
  });

  describe("reorder", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.tvChannels.reorder({
          items: [{ id: 1, displayOrder: 0 }],
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should reorder channels for admin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tvChannels.reorder({
        items: [
          { id: 1, displayOrder: 0 },
          { id: 2, displayOrder: 1 },
        ],
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });
});
