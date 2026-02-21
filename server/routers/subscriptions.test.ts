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

describe("subscriptions router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext("superAdmin");
  });

  describe("listPackages", () => {
    it("should return packages for superAdmin", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.subscriptions.listPackages();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should throw error for non-superAdmin", async () => {
      const adminCtx = createAuthContext("admin");
      const caller = appRouter.createCaller(adminCtx);

      await expect(caller.subscriptions.listPackages()).rejects.toThrow();
    });
  });

  describe("createPackage", () => {
    it("should create package for superAdmin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.subscriptions.createPackage({
        packageName: `Test Package ${Date.now()}`,
        packageCode: `TP${Date.now()}`,
        durationDays: 365,
        price: 10000,
        description: "Test package",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should throw error for non-superAdmin", async () => {
      const adminCtx = createAuthContext("admin");
      const caller = appRouter.createCaller(adminCtx);

      await expect(
        caller.subscriptions.createPackage({
          packageName: "Test Package",
          packageCode: "TP001",
        })
      ).rejects.toThrow();
    });
  });

  describe("updatePackage", () => {
    it("should update package for superAdmin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.subscriptions.updatePackage({
        id: 1,
        packageName: "Updated Package",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should throw error for non-superAdmin", async () => {
      const adminCtx = createAuthContext("admin");
      const caller = appRouter.createCaller(adminCtx);

      await expect(
        caller.subscriptions.updatePackage({
          id: 1,
          packageName: "Updated",
        })
      ).rejects.toThrow();
    });
  });

  describe("listHotelSubscriptions", () => {
    it("should return hotel subscriptions for superAdmin", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.subscriptions.listHotelSubscriptions({
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should throw error for non-superAdmin", async () => {
      const adminCtx = createAuthContext("admin");
      const caller = appRouter.createCaller(adminCtx);

      await expect(
        caller.subscriptions.listHotelSubscriptions({ limit: 10, offset: 0 })
      ).rejects.toThrow();
    });
  });

  describe("assignSubscription", () => {
    it("should throw error for non-superAdmin", async () => {
      const adminCtx = createAuthContext("admin");
      const caller = appRouter.createCaller(adminCtx);

      await expect(
        caller.subscriptions.assignSubscription({
          hotelId: 1,
          packageId: 1,
          startDate: new Date(),
        })
      ).rejects.toThrow();
    });
  });

  describe("getSubscriptionStatus", () => {
    it("should return subscription status for hotelAdmin", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      // This may return null if no subscription exists
      const result = await caller.subscriptions.getSubscriptionStatus({});

      // Result can be null or subscription object
      if (result) {
        expect(result).toHaveProperty("subscription");
        expect(result).toHaveProperty("package");
        expect(result).toHaveProperty("hotel");
        expect(result).toHaveProperty("isExpired");
        expect(result).toHaveProperty("daysRemaining");
      }
    });

    it("should return subscription status for superAdmin", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.subscriptions.getSubscriptionStatus({ hotelId: 1 });

      if (result) {
        expect(result).toHaveProperty("subscription");
        expect(result).toHaveProperty("isExpired");
      }
    });

    it("should throw error for hotelAdmin accessing different hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      await expect(
        caller.subscriptions.getSubscriptionStatus({ hotelId: 2 })
      ).rejects.toThrow();
    });
  });

  describe("renewSubscription", () => {
    it("should throw error for non-superAdmin", async () => {
      const adminCtx = createAuthContext("admin");
      const caller = appRouter.createCaller(adminCtx);

      await expect(
        caller.subscriptions.renewSubscription({ hotelId: 1 })
      ).rejects.toThrow();
    });
  });

  describe("disableSubscription", () => {
    it("should throw error for non-superAdmin", async () => {
      const adminCtx = createAuthContext("admin");
      const caller = appRouter.createCaller(adminCtx);

      await expect(
        caller.subscriptions.disableSubscription({ hotelId: 1 })
      ).rejects.toThrow();
    });
  });
});
