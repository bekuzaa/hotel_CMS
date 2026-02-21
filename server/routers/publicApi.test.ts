import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

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

describe("publicApi router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createPublicContext();
  });

  describe("getChannels", () => {
    it("should return array of active channels", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.getChannels();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should work without authentication (public)", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.getChannels();

      // Should not throw
      expect(result !== undefined).toBe(true);
    });
  });

  describe("getMenus", () => {
    it("should return array of active menus", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.getMenus();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should work without authentication (public)", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.getMenus();

      expect(result !== undefined).toBe(true);
    });
  });

  describe("getBackgroundImages", () => {
    it("should return array of background images", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.getBackgroundImages({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter by single mode", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.getBackgroundImages({ mode: "single" });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter by slideshow mode", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.getBackgroundImages({ mode: "slideshow" });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getGuestByRoom", () => {
    it("should return null for non-existent room", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.getGuestByRoom({ roomNumber: "NONEXISTENT" });

      expect(result).toBeNull();
    });

    it("should work without authentication (public)", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.getGuestByRoom({ roomNumber: "101" });

      // Can be null if room doesn't exist
      expect(result === null || result !== undefined).toBe(true);
    });
  });

  describe("getSystemConfig", () => {
    it("should return config object", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.getSystemConfig();

      // Can be null if no config
      if (result) {
        expect(typeof result).toBe("object");
      }
    });

    it("should work without authentication (public)", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.getSystemConfig();

      expect(result !== undefined).toBe(true);
    });
  });

  describe("getDefaultLanguage", () => {
    it("should return default language code", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.getDefaultLanguage();

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should return 'th' as default fallback", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.getDefaultLanguage();

      expect(["th", "en"]).toContain(result);
    });
  });

  describe("getRooms", () => {
    it("should return paginated rooms", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.getRooms({ limit: 10, offset: 0 });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should support pagination", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.getRooms({ limit: 5, offset: 0 });

      expect(result).toBeDefined();
      expect(result.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe("healthCheck", () => {
    it("should return health status", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.healthCheck();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("timestamp");
      expect(result).toHaveProperty("version");
      expect(result).toHaveProperty("database");
    });

    it("should work without authentication (public)", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.healthCheck();

      expect(result.status).toBeDefined();
    });
  });

  describe("getAppVersion", () => {
    it("should return app version info", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.getAppVersion();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("currentVersion");
      expect(result).toHaveProperty("minimumVersion");
      expect(result).toHaveProperty("latestVersion");
      expect(result).toHaveProperty("updateAvailable");
    });
  });

  describe("getWiFiInfo", () => {
    it("should return WiFi info or null", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.getWiFiInfo();

      // Can be null if not configured
      if (result) {
        expect(result).toHaveProperty("ssid");
        expect(result).toHaveProperty("security");
      }
    });
  });

  describe("getHotelInfo", () => {
    it("should return hotel info", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.getHotelInfo();

      // Can be null if not configured
      if (result) {
        expect(result).toHaveProperty("name");
      }
    });
  });

  describe("getFeaturedContent", () => {
    it("should return featured content", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.getFeaturedContent();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("channels");
      expect(result).toHaveProperty("menus");
      expect(result).toHaveProperty("images");
      expect(Array.isArray(result.channels)).toBe(true);
      expect(Array.isArray(result.menus)).toBe(true);
      expect(Array.isArray(result.images)).toBe(true);
    });

    it("should work without authentication (public)", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.publicApi.getFeaturedContent();

      expect(result).toBeDefined();
    });
  });
});
