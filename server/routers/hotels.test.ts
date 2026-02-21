import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: string = "superAdmin", hotelId?: number): TrpcContext {
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

describe("hotels router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext("superAdmin");
  });

  describe("getAll", () => {
    it("should return hotels for superAdmin", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.hotels.getAll();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should throw error for non-superAdmin", async () => {
      const adminCtx = createAuthContext("admin");
      const caller = appRouter.createCaller(adminCtx);

      await expect(caller.hotels.getAll()).rejects.toThrow();
    });
  });

  describe("getById", () => {
    it("should return hotel for valid id", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.hotels.getById({ id: 1 });

      if (result) {
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("hotelName");
        expect(result).toHaveProperty("hotelCode");
      }
    });

    it("should throw error for non-existent hotel", async () => {
      const caller = appRouter.createCaller(ctx);

      await expect(caller.hotels.getById({ id: 999999 })).rejects.toThrow();
    });

    it("should allow hotelAdmin to view their own hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);
      const result = await caller.hotels.getById({ id: 1 });

      if (result) {
        expect(result.id).toBe(1);
      }
    });

    it("should throw error when hotelAdmin views different hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      await expect(caller.hotels.getById({ id: 2 })).rejects.toThrow();
    });
  });

  describe("getCurrentHotel", () => {
    it("should return current hotel for hotelAdmin", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);
      const result = await caller.hotels.getCurrentHotel();

      if (result) {
        expect(result).toHaveProperty("id");
        expect(result.id).toBe(1);
      }
    });

    it("should throw error for non-hotelAdmin", async () => {
      const caller = appRouter.createCaller(ctx);

      await expect(caller.hotels.getCurrentHotel()).rejects.toThrow();
    });
  });

  describe("create", () => {
    it("should create hotel for superAdmin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.hotels.create({
        hotelName: `Test Hotel ${Date.now()}`,
        hotelCode: `TH${Date.now()}`,
        city: "Bangkok",
        country: "Thailand",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should throw error for non-superAdmin", async () => {
      const adminCtx = createAuthContext("admin");
      const caller = appRouter.createCaller(adminCtx);

      await expect(
        caller.hotels.create({
          hotelName: "Test Hotel",
          hotelCode: "TH001",
        })
      ).rejects.toThrow();
    });

    it("should throw error for duplicate hotel code", async () => {
      const caller = appRouter.createCaller(ctx);

      // First create should succeed
      await caller.hotels.create({
        hotelName: "Test Hotel 1",
        hotelCode: "DUPLICATE_CODE",
      });

      // Second create with same code should fail
      await expect(
        caller.hotels.create({
          hotelName: "Test Hotel 2",
          hotelCode: "DUPLICATE_CODE",
        })
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("should update hotel for superAdmin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.hotels.update({
        id: 1,
        hotelName: "Updated Hotel Name",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should allow hotelAdmin to update their hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      const result = await caller.hotels.update({
        id: 1,
        hotelName: "Updated by Hotel Admin",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should throw error when hotelAdmin updates different hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      await expect(
        caller.hotels.update({
          id: 2,
          hotelName: "Should Fail",
        })
      ).rejects.toThrow();
    });

    it("should throw error for non-existent hotel", async () => {
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.hotels.update({
          id: 999999,
          hotelName: "Non-existent",
        })
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should throw error for non-superAdmin", async () => {
      const adminCtx = createAuthContext("admin");
      const caller = appRouter.createCaller(adminCtx);

      await expect(caller.hotels.delete({ id: 1 })).rejects.toThrow();
    });

    it("should throw error for non-existent hotel", async () => {
      const caller = appRouter.createCaller(ctx);

      await expect(caller.hotels.delete({ id: 999999 })).rejects.toThrow();
    });
  });

  describe("getStats", () => {
    it("should return hotel stats for superAdmin", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.hotels.getStats({ hotelId: 1 });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("hotelId");
      expect(result).toHaveProperty("hotelName");
      expect(result).toHaveProperty("totalRooms");
    });

    it("should return hotel stats for hotelAdmin of that hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);
      const result = await caller.hotels.getStats({});

      expect(result).toBeDefined();
      expect(result).toHaveProperty("hotelId");
    });
  });

  describe("listForAssignment", () => {
    it("should return hotels for assignment for superAdmin", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.hotels.listForAssignment();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should throw error for non-superAdmin", async () => {
      const adminCtx = createAuthContext("admin");
      const caller = appRouter.createCaller(adminCtx);

      await expect(caller.hotels.listForAssignment()).rejects.toThrow();
    });
  });
});
