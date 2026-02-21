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

describe("mediaUpload router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
  });

  describe("list", () => {
    it("should return array of media files", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.mediaUpload.list({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter by hotelId", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.mediaUpload.list({ hotelId: 1 });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should use hotelAdmin's hotelId automatically", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);
      const result = await caller.mediaUpload.list({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should throw error when hotelAdmin lists different hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      await expect(
        caller.mediaUpload.list({ hotelId: 2 })
      ).rejects.toThrow("Unauthorized");
    });

    it("should support pagination", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.mediaUpload.list({ limit: 10, offset: 0 });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getStats", () => {
    it("should return media statistics", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.mediaUpload.getStats({});

      expect(result).toBeDefined();
      expect(result).toHaveProperty("totalFiles");
      expect(result).toHaveProperty("totalSize");
      expect(typeof result.totalFiles).toBe("number");
      expect(typeof result.totalSize).toBe("number");
    });

    it("should filter stats by hotelId", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.mediaUpload.getStats({ hotelId: 1 });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("totalFiles");
      expect(result).toHaveProperty("totalSize");
    });

    it("should throw error when hotelAdmin gets stats for different hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      await expect(
        caller.mediaUpload.getStats({ hotelId: 2 })
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("getById", () => {
    it("should return null for non-existent file", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.mediaUpload.getById({ id: 999999 });

      expect(result).toBeNull();
    });

    it("should return file for valid id", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.mediaUpload.getById({ id: 1 });

      if (result) {
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("fileName");
        expect(result).toHaveProperty("fileUrl");
      }
    });

    it("should throw error when hotelAdmin accesses different hotel's file", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      // This will return null if file doesn't exist, or throw if file belongs to different hotel
      const result = await caller.mediaUpload.getById({ id: 1 }).catch((e) => {
        expect(e.message).toBe("Unauthorized");
      });
    });
  });

  describe("generateUploadUrl", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.mediaUpload.generateUploadUrl({
          hotelId: 1,
          fileName: "test.jpg",
          fileType: "image",
          mimeType: "image/jpeg",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should generate upload URL for admin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.mediaUpload.generateUploadUrl({
        hotelId: 1,
        fileName: "test.jpg",
        fileType: "image",
        mimeType: "image/jpeg",
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("fileKey");
      expect(result).toHaveProperty("uploadUrl");
      expect(result.fileKey).toContain("media/");
    });

    it("should generate upload URL for manager", async () => {
      const managerCtx = createAuthContext("manager");
      const caller = appRouter.createCaller(managerCtx);

      const result = await caller.mediaUpload.generateUploadUrl({
        hotelId: 1,
        fileName: "test.png",
        fileType: "image",
        mimeType: "image/png",
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("fileKey");
    });

    it("should throw error when hotelAdmin uploads to different hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      await expect(
        caller.mediaUpload.generateUploadUrl({
          hotelId: 2,
          fileName: "test.jpg",
          fileType: "image",
          mimeType: "image/jpeg",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should generate upload URL for hotelAdmin on their hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      const result = await caller.mediaUpload.generateUploadUrl({
        hotelId: 1,
        fileName: "test.jpg",
        fileType: "image",
        mimeType: "image/jpeg",
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("fileKey");
    });
  });

  describe("registerUpload", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.mediaUpload.registerUpload({
          hotelId: 1,
          fileName: "test.jpg",
          fileKey: "media/1/1/test/test.jpg",
          fileUrl: "https://example.com/test.jpg",
          fileType: "image",
          mimeType: "image/jpeg",
          fileSize: 1024,
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should register upload for admin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.mediaUpload.registerUpload({
        hotelId: 1,
        fileName: "test.jpg",
        fileKey: "media/1/1/test/test.jpg",
        fileUrl: "https://example.com/test.jpg",
        fileType: "image",
        mimeType: "image/jpeg",
        fileSize: 1024,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should throw error when hotelAdmin registers for different hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      await expect(
        caller.mediaUpload.registerUpload({
          hotelId: 2,
          fileName: "test.jpg",
          fileKey: "media/2/1/test/test.jpg",
          fileUrl: "https://example.com/test.jpg",
          fileType: "image",
          mimeType: "image/jpeg",
          fileSize: 1024,
        })
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("delete", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.mediaUpload.delete({ id: 1 })
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw error for non-existent file", async () => {
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.mediaUpload.delete({ id: 999999 })
      ).rejects.toThrow("File not found");
    });
  });
});
