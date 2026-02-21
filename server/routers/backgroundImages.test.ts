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

describe("backgroundImages router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
  });

  describe("list", () => {
    it("should return paginated background images", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.backgroundImages.list({
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
      const result = await caller.backgroundImages.list({
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
      const result = await caller.backgroundImages.list({
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("data");
    });

    it("should throw error when hotelAdmin lists different hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      await expect(
        caller.backgroundImages.list({
          hotelId: 2,
          limit: 10,
          offset: 0,
        })
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("getById", () => {
    it("should return null for non-existent image", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.backgroundImages.getById({ id: 999999 });

      expect(result).toBeNull();
    });

    it("should return image for valid id", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.backgroundImages.getById({ id: 1 });

      if (result) {
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("name");
        expect(result).toHaveProperty("imageUrl");
      }
    });
  });

  describe("create", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.backgroundImages.create({
          hotelId: 1,
          name: "Test Image",
          imageUrl: "https://example.com/image.jpg",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should create image for admin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.backgroundImages.create({
        hotelId: 1,
        name: "Test Background",
        imageUrl: "https://example.com/bg.jpg",
        displayMode: "single",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should create slideshow image", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.backgroundImages.create({
        hotelId: 1,
        name: "Slideshow Image",
        imageUrl: "https://example.com/slide.jpg",
        displayMode: "slideshow",
        displayDuration: 5000,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should throw error when hotelAdmin creates for different hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      await expect(
        caller.backgroundImages.create({
          hotelId: 2,
          name: "Test Image",
          imageUrl: "https://example.com/image.jpg",
        })
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("update", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.backgroundImages.update({
          id: 1,
          name: "Updated Image",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw error for non-existent image", async () => {
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.backgroundImages.update({
          id: 999999,
          name: "Updated Image",
        })
      ).rejects.toThrow("Image not found");
    });
  });

  describe("delete", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(caller.backgroundImages.delete({ id: 1 })).rejects.toThrow("Unauthorized");
    });

    it("should throw error for non-existent image", async () => {
      const caller = appRouter.createCaller(ctx);

      await expect(caller.backgroundImages.delete({ id: 999999 })).rejects.toThrow("Image not found");
    });
  });

  describe("reorder", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.backgroundImages.reorder({
          hotelId: 1,
          imageIds: [1, 2, 3],
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should reorder images for admin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.backgroundImages.reorder({
        hotelId: 1,
        imageIds: [1, 2, 3],
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should throw error when hotelAdmin reorders for different hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      await expect(
        caller.backgroundImages.reorder({
          hotelId: 2,
          imageIds: [1, 2],
        })
      ).rejects.toThrow("Unauthorized");
    });
  });
});
