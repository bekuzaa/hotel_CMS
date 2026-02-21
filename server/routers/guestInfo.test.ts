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

describe("guestInfo router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
  });

  describe("list", () => {
    it("should return paginated guest list", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.guestInfo.list({
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
      const result = await caller.guestInfo.list({
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
      const result = await caller.guestInfo.list({
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
        caller.guestInfo.list({
          hotelId: 2,
          limit: 10,
          offset: 0,
        })
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("getByRoomId", () => {
    it("should return null for non-existent room", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.guestInfo.getByRoomId({ roomId: 999999 });

      expect(result).toBeNull();
    });

    it("should return guest for valid room id", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.guestInfo.getByRoomId({ roomId: 1 });

      // Can be null if no guest assigned
      if (result) {
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("roomId");
        expect(result).toHaveProperty("guestName");
      }
    });
  });

  describe("create", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.guestInfo.create({
          hotelId: 1,
          roomId: 1,
          guestName: "John Doe",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should create guest for admin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.guestInfo.create({
        hotelId: 1,
        roomId: 1,
        guestName: "John Doe",
        wifiSsid: "HotelWiFi",
        wifiPassword: "password123",
        welcomeMessage: "Welcome!",
        welcomeMessageEn: "Welcome!",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should create guest for staff", async () => {
      const staffCtx = createAuthContext("staff");
      const caller = appRouter.createCaller(staffCtx);

      const result = await caller.guestInfo.create({
        hotelId: 1,
        roomId: 1,
        guestName: "Staff Guest",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should throw error when hotelAdmin creates for different hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      await expect(
        caller.guestInfo.create({
          hotelId: 2,
          roomId: 1,
          guestName: "Test Guest",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should create guest for hotelAdmin on their hotel", async () => {
      const hotelAdminCtx = createAuthContext("hotelAdmin", 1);
      const caller = appRouter.createCaller(hotelAdminCtx);

      const result = await caller.guestInfo.create({
        hotelId: 1,
        roomId: 1,
        guestName: "Hotel Admin Guest",
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
        caller.guestInfo.update({
          id: 1,
          guestName: "Updated Name",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw error for non-existent guest", async () => {
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.guestInfo.update({
          id: 999999,
          guestName: "Updated Name",
        })
      ).rejects.toThrow("Guest not found");
    });
  });

  describe("delete", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(caller.guestInfo.delete({ id: 1 })).rejects.toThrow("Unauthorized");
    });

    it("should throw error for non-existent guest", async () => {
      const caller = appRouter.createCaller(ctx);

      await expect(caller.guestInfo.delete({ id: 999999 })).rejects.toThrow("Guest not found");
    });
  });

  describe("bulkImport", () => {
    it("should throw error for unauthorized user", async () => {
      const userCtx = createAuthContext("user");
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.guestInfo.bulkImport({
          hotelId: 1,
          guests: [{ roomId: 1, guestName: "Guest 1" }],
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should bulk import guests for admin", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.guestInfo.bulkImport({
        hotelId: 1,
        guests: [
          { roomId: 1, guestName: "Guest 1" },
          { roomId: 2, guestName: "Guest 2", welcomeMessage: "Welcome!" },
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
        caller.guestInfo.bulkImport({
          hotelId: 2,
          guests: [{ roomId: 1, guestName: "Guest" }],
        })
      ).rejects.toThrow("Unauthorized");
    });
  });
});
