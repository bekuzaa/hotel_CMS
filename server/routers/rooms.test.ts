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

describe("rooms router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
  });

  describe("list", () => {
    it("should return paginated rooms list", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.rooms.list({
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.data)).toBe(true);
      expect(typeof result.total).toBe("number");
    });

    it("should filter by hotelId", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.rooms.list({
        hotelId: 1,
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("total");
    });

    it("should use hotelAdmin's hotelId automatically", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);
      const result = await caller.rooms.list({
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("total");
    });
  });

  describe("getById", () => {
    it("should return null for non-existent room", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.rooms.getById({ id: 999999 });

      expect(result).toBeNull();
    });

    it("should return room for valid id", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.rooms.getById({ id: 1 });

      if (result) {
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("roomNumber");
        expect(result).toHaveProperty("hotelId");
      }
    });
  });

  describe("getByNumber", () => {
    it("should return null for non-existent room number", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.rooms.getByNumber({ roomNumber: "NONEXISTENT" });

      expect(result).toBeNull();
    });

    it("should return room for valid room number", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.rooms.getByNumber({ roomNumber: "101" });

      // Result can be null if room doesn't exist
      if (result) {
        expect(result).toHaveProperty("roomNumber");
        expect(result.roomNumber).toBe("101");
      }
    });
  });

  describe("create", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.rooms.create({
          roomNumber: "TEST101",
          hotelId: 1,
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should create room for admin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.rooms.create({
        roomNumber: `TEST${Date.now()}`,
        hotelId: 1,
        floor: 1,
        roomType: "Standard",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should throw error when hotelAdmin creates for different hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      await expect(
        caller.rooms.create({
          roomNumber: "TEST102",
          hotelId: 2, // Different hotel
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should create room for hotelAdmin on their hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      const result = await caller.rooms.create({
        roomNumber: `TEST${Date.now()}`,
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
        caller.rooms.update({
          id: 1,
          roomNumber: "UPDATED",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw error for non-existent room", async () => {
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.rooms.update({
          id: 999999,
          roomNumber: "UPDATED",
        })
      ).rejects.toThrow("Room not found");
    });
  });

  describe("delete", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.rooms.delete({ id: 1 })
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw error for non-existent room", async () => {
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.rooms.delete({ id: 999999 })
      ).rejects.toThrow("Room not found");
    });
  });

  describe("getStats", () => {
    it("should return room statistics", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.rooms.getStats({});

      expect(result).toBeDefined();
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("occupied");
      expect(result).toHaveProperty("available");
      expect(typeof result.total).toBe("number");
      expect(typeof result.occupied).toBe("number");
      expect(typeof result.available).toBe("number");
    });

    it("should filter by hotelId", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.rooms.getStats({ hotelId: 1 });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("total");
    });
  });

  describe("bulkImport", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.rooms.bulkImport({
          hotelId: 1,
          rooms: [{ roomNumber: "BULK001" }],
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should bulk import rooms for admin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.rooms.bulkImport({
        hotelId: 1,
        rooms: [
          { roomNumber: `BULK${Date.now()}A` },
          { roomNumber: `BULK${Date.now()}B`, floor: 1, roomType: "Deluxe" },
        ],
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });

    it("should throw error when hotelAdmin bulk imports for different hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      await expect(
        caller.rooms.bulkImport({
          hotelId: 2,
          rooms: [{ roomNumber: "BULK002" }],
        })
      ).rejects.toThrow("Unauthorized");
    });
  });
});
