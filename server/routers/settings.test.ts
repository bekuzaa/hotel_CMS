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

describe("settings router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
  });

  describe("getSystemConfig", () => {
    it("should return system config", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.settings.getSystemConfig();

      // Can be null if no config exists
      if (result) {
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("configKey");
      } else {
        expect(result).toBeNull();
      }
    });
  });

  describe("updateSystemConfig", () => {
    it("should throw error for non-admin user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.settings.updateSystemConfig({
          configKey: "test",
          configValue: "value",
          configType: "string",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should update config for admin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.settings.updateSystemConfig({
        configKey: "test_config",
        configValue: "test_value",
        configType: "string",
        description: "Test configuration",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe("listUsers", () => {
    it("should throw error for non-admin user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.settings.listUsers({ limit: 10, offset: 0 })
      ).rejects.toThrow("Unauthorized");
    });

    it("should return users for admin", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.settings.listUsers({ limit: 10, offset: 0 });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should return all users for superAdmin", async () => {
      const superAdminCtx = createAuthContext("superAdmin");
      const caller = appRouter.createCaller(superAdminCtx);
      const result = await caller.settings.listUsers({ limit: 10, offset: 0 });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("total");
    });
  });

  describe("updateUserRole", () => {
    it("should throw error for non-admin assigning superAdmin role", async () => {
      const adminCtx = createAuthContext("admin");
      const caller = appRouter.createCaller(adminCtx);

      await expect(
        caller.settings.updateUserRole({
          userId: 2,
          role: "superAdmin",
        })
      ).rejects.toThrow("Only superAdmin can assign superAdmin role");
    });

    it("should allow superAdmin to assign any role", async () => {
      const superAdminCtx = createAuthContext("superAdmin");
      const caller = appRouter.createCaller(superAdminCtx);

      const result = await caller.settings.updateUserRole({
        userId: 2,
        role: "hotelAdmin",
        hotelId: 1,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should throw error for non-superAdmin assigning hotelId", async () => {
      const adminCtx = createAuthContext("admin");
      const caller = appRouter.createCaller(adminCtx);

      await expect(
        caller.settings.updateUserRole({
          userId: 2,
          role: "manager",
          hotelId: 1,
        })
      ).rejects.toThrow("Only superAdmin can assign hotels");
    });
  });

  describe("assignHotelToUser", () => {
    it("should throw error for non-superAdmin", async () => {
      const adminCtx = createAuthContext("admin");
      const caller = appRouter.createCaller(adminCtx);

      await expect(
        caller.settings.assignHotelToUser({
          userId: 2,
          hotelId: 1,
        })
      ).rejects.toThrow("Only superAdmin can assign hotels to users");
    });

    it("should assign hotel for superAdmin", async () => {
      const superAdminCtx = createAuthContext("superAdmin");
      const caller = appRouter.createCaller(superAdminCtx);

      const result = await caller.settings.assignHotelToUser({
        userId: 2,
        hotelId: 1,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should allow unassigning hotel (null hotelId)", async () => {
      const superAdminCtx = createAuthContext("superAdmin");
      const caller = appRouter.createCaller(superAdminCtx);

      const result = await caller.settings.assignHotelToUser({
        userId: 2,
        hotelId: null,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe("deleteUser", () => {
    it("should throw error for non-admin user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.settings.deleteUser({ userId: 2 })
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw error when deleting own account", async () => {
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.settings.deleteUser({ userId: 1 })
      ).rejects.toThrow("Cannot delete your own account");
    });

    it("should soft delete user for admin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.settings.deleteUser({ userId: 2 });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe("getHotelsForAssignment", () => {
    it("should throw error for non-superAdmin", async () => {
      const adminCtx = createAuthContext("admin");
      const caller = appRouter.createCaller(adminCtx);

      await expect(
        caller.settings.getHotelsForAssignment()
      ).rejects.toThrow("Only superAdmin can view hotels for assignment");
    });

    it("should return hotels for superAdmin", async () => {
      const superAdminCtx = createAuthContext("superAdmin");
      const caller = appRouter.createCaller(superAdminCtx);

      const result = await caller.settings.getHotelsForAssignment();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getLocalizationSettings", () => {
    it("should return localization settings", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.settings.getLocalizationSettings();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("supportedLanguages");
      expect(result).toHaveProperty("defaultLanguage");
      expect(Array.isArray(result.supportedLanguages)).toBe(true);
    });
  });

  describe("getSystemStatus", () => {
    it("should return system status", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.settings.getSystemStatus();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("timestamp");
    });
  });

  describe("exportData", () => {
    it("should throw error for non-admin user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.settings.exportData({ dataType: "rooms" })
      ).rejects.toThrow("Unauthorized");
    });

    it("should start export for admin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.settings.exportData({ dataType: "rooms" });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.dataType).toBe("rooms");
    });

    it("should export all data types", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.settings.exportData({ dataType: "all" });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });
});
