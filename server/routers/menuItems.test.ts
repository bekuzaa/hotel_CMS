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

describe("menuItems router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
  });

  describe("list", () => {
    it("should return array of menu items", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.menuItems.list({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter by hotelId for superAdmin", async () => {
      const superAdminCtx = createAuthContext("superAdmin");
      const caller = appRouter.createCaller(superAdminCtx);
      const result = await caller.menuItems.list({ hotelId: 1 });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should use hotelAdmin's hotelId automatically", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);
      const result = await caller.menuItems.list({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should throw error when hotelAdmin requests different hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      await expect(caller.menuItems.list({ hotelId: 2 })).rejects.toThrow("Unauthorized");
    });
  });

  describe("getById", () => {
    it("should return null for non-existent menu item", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.menuItems.getById({ id: 999999 });

      expect(result).toBeNull();
    });

    it("should return menu item for valid id", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.menuItems.getById({ id: 1 });

      if (result) {
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("name");
        expect(result).toHaveProperty("nameEn");
        expect(result).toHaveProperty("category");
      }
    });
  });

  describe("create", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.menuItems.create({
          hotelId: 1,
          name: "Test Menu",
          nameEn: "Test Menu",
          category: "Food",
          contentType: "url",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should create menu item for admin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.menuItems.create({
        hotelId: 1,
        name: "Test Menu",
        nameEn: "Test Menu EN",
        category: "Food",
        contentType: "url",
        contentValue: "https://example.com",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should create menu item for manager", async () => {
      const managerCtx = createAuthContext("manager");
      const caller = appRouter.createCaller(managerCtx);

      const result = await caller.menuItems.create({
        hotelId: 1,
        name: "Manager Menu",
        nameEn: "Manager Menu EN",
        category: "Info",
        contentType: "text",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should throw error when hotelAdmin creates for different hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      await expect(
        caller.menuItems.create({
          hotelId: 2,
          name: "Test Menu",
          nameEn: "Test Menu EN",
          category: "Food",
          contentType: "url",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should create menu item for hotelAdmin on their hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      const result = await caller.menuItems.create({
        hotelId: 1,
        name: "Hotel Admin Menu",
        nameEn: "Hotel Admin Menu EN",
        category: "Service",
        contentType: "image",
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
        caller.menuItems.update({
          id: 1,
          name: "Updated Menu",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw error for non-existent menu item", async () => {
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.menuItems.update({
          id: 999999,
          name: "Updated Menu",
        })
      ).rejects.toThrow("Menu item not found");
    });
  });

  describe("delete", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(caller.menuItems.delete({ id: 1 })).rejects.toThrow("Unauthorized");
    });

    it("should throw error for non-existent menu item", async () => {
      const caller = appRouter.createCaller(ctx);

      await expect(caller.menuItems.delete({ id: 999999 })).rejects.toThrow("Menu item not found");
    });
  });

  describe("reorder", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.menuItems.reorder({
          hotelId: 1,
          itemIds: [1, 2, 3],
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should reorder menu items for admin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.menuItems.reorder({
        hotelId: 1,
        itemIds: [1, 2, 3],
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should throw error when hotelAdmin reorders for different hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      await expect(
        caller.menuItems.reorder({
          hotelId: 2,
          itemIds: [1, 2],
        })
      ).rejects.toThrow("Unauthorized");
    });
  });
});
