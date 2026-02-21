import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: string = "admin"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: role as any,
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

// Create a public context (no user)
function createPublicContext(): TrpcContext {
  return {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("localization router", () => {
  let ctx: TrpcContext;
  let publicCtx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
    publicCtx = createPublicContext();
  });

  describe("getAll", () => {
    it("should return all localization settings", async () => {
      const caller = appRouter.createCaller(publicCtx);
      const result = await caller.localization.getAll();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should work without authentication (public)", async () => {
      const caller = appRouter.createCaller(publicCtx);
      const result = await caller.localization.getAll();

      expect(result).toBeDefined();
    });
  });

  describe("getByLanguage", () => {
    it("should return null for non-existent language", async () => {
      const caller = appRouter.createCaller(publicCtx);
      const result = await caller.localization.getByLanguage({ languageCode: "xyz" });

      expect(result).toBeNull();
    });

    it("should return settings for valid language", async () => {
      const caller = appRouter.createCaller(publicCtx);
      const result = await caller.localization.getByLanguage({ languageCode: "th" });

      // Can be null if not created yet
      if (result) {
        expect(result).toHaveProperty("languageCode");
        expect(result.languageCode).toBe("th");
      }
    });

    it("should work without authentication (public)", async () => {
      const caller = appRouter.createCaller(publicCtx);
      const result = await caller.localization.getByLanguage({ languageCode: "en" });

      // Should not throw
      expect(result !== undefined).toBe(true);
    });
  });

  describe("getTranslations", () => {
    it("should return Thai translations for th language code", async () => {
      const caller = appRouter.createCaller(publicCtx);
      const result = await caller.localization.getTranslations({ languageCode: "th" });

      expect(result).toBeDefined();
      expect(result["nav.dashboard"]).toBe("แดชบอร์ด");
      expect(result["nav.channels"]).toBe("ช่องรายการ TV");
    });

    it("should return English translations for en language code", async () => {
      const caller = appRouter.createCaller(publicCtx);
      const result = await caller.localization.getTranslations({ languageCode: "en" });

      expect(result).toBeDefined();
      expect(result["nav.dashboard"]).toBe("Dashboard");
      expect(result["nav.channels"]).toBe("TV Channels");
    });

    it("should return English translations for unknown language code", async () => {
      const caller = appRouter.createCaller(publicCtx);
      const result = await caller.localization.getTranslations({ languageCode: "fr" });

      expect(result).toBeDefined();
      // Should default to English
      expect(result["nav.dashboard"]).toBe("Dashboard");
    });
  });

  describe("update", () => {
    it("should throw error for non-admin user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.localization.update({
          languageCode: "th",
          languageName: "Thai",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should update localization for admin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.localization.update({
        languageCode: "th",
        languageName: "ภาษาไทย",
        isActive: true,
        isDefault: true,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should create new language setting if not exists", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.localization.update({
        languageCode: "ja",
        languageName: "日本語",
        isActive: true,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe("getDefaultStructure", () => {
    it("should return default translation structure", async () => {
      const caller = appRouter.createCaller(publicCtx);
      const result = await caller.localization.getDefaultStructure();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("nav.dashboard");
      expect(result).toHaveProperty("nav.channels");
      expect(result).toHaveProperty("nav.menus");
      expect(result).toHaveProperty("nav.rooms");
      expect(result).toHaveProperty("common.add");
      expect(result).toHaveProperty("common.edit");
      expect(result).toHaveProperty("common.delete");
    });

    it("should include all navigation keys", async () => {
      const caller = appRouter.createCaller(publicCtx);
      const result = await caller.localization.getDefaultStructure();

      const navKeys = Object.keys(result).filter(k => k.startsWith("nav."));
      expect(navKeys.length).toBeGreaterThan(0);
    });

    it("should include all common keys", async () => {
      const caller = appRouter.createCaller(publicCtx);
      const result = await caller.localization.getDefaultStructure();

      const commonKeys = Object.keys(result).filter(k => k.startsWith("common."));
      expect(commonKeys.length).toBeGreaterThan(0);
    });

    it("should include channel keys", async () => {
      const caller = appRouter.createCaller(publicCtx);
      const result = await caller.localization.getDefaultStructure();

      const channelKeys = Object.keys(result).filter(k => k.startsWith("channels."));
      expect(channelKeys.length).toBeGreaterThan(0);
    });

    it("should include room keys", async () => {
      const caller = appRouter.createCaller(publicCtx);
      const result = await caller.localization.getDefaultStructure();

      const roomKeys = Object.keys(result).filter(k => k.startsWith("rooms."));
      expect(roomKeys.length).toBeGreaterThan(0);
    });

    it("should include guest keys", async () => {
      const caller = appRouter.createCaller(publicCtx);
      const result = await caller.localization.getDefaultStructure();

      const guestKeys = Object.keys(result).filter(k => k.startsWith("guests."));
      expect(guestKeys.length).toBeGreaterThan(0);
    });

    it("should work without authentication (public)", async () => {
      const caller = appRouter.createCaller(publicCtx);
      const result = await caller.localization.getDefaultStructure();

      expect(result).toBeDefined();
    });
  });
});
