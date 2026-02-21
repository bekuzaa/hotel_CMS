import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { systemConfig, users, hotels } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const settingsRouter = router({
  // System Configuration
  getSystemConfig: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;
    
    const config = await db.select().from(systemConfig).limit(1);
    return config.length > 0 ? config[0] : null;
  }),

  updateSystemConfig: protectedProcedure
    .input(z.object({
      configKey: z.string(),
      configValue: z.string(),
      configType: z.string(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db.select().from(systemConfig)
        .where(eq(systemConfig.configKey, input.configKey))
        .limit(1);
      
      if (existing.length > 0) {
        await db.update(systemConfig)
          .set({
            configValue: input.configValue,
            configType: input.configType,
            description: input.description,
            updatedAt: new Date(),
          })
          .where(eq(systemConfig.configKey, input.configKey));
      } else {
        await db.insert(systemConfig).values({
          configKey: input.configKey,
          configValue: input.configValue,
          configType: input.configType,
          description: input.description,
        });
      }

      return { success: true };
    }),

  // User Management
  listUsers: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input, ctx }) => {
      // Only admin and superAdmin can list users
      if (ctx.user.role !== "admin" && ctx.user.role !== "superAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) return { data: [], total: 0 };

      // superAdmin sees all users, admin sees users in their hotel
      let allUsers;
      if (ctx.user.role === "superAdmin") {
        allUsers = await db.select().from(users).orderBy(users.createdAt);
      } else {
        // admin can only see users in their hotel
        allUsers = await db.select().from(users)
          .where(eq(users.hotelId, ctx.user.hotelId || 0))
          .orderBy(users.createdAt);
      }
      
      const total = allUsers.length;
      const data = allUsers.slice(input.offset, input.offset + input.limit);

      return { data, total };
    }),

  updateUserRole: protectedProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["admin", "manager", "staff", "user", "superAdmin", "hotelAdmin"]),
      hotelId: z.number().nullable().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Only superAdmin can assign superAdmin role or change hotelId
      if (input.role === "superAdmin" && ctx.user.role !== "superAdmin") {
        throw new Error("Only superAdmin can assign superAdmin role");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // admin can only update users in their hotel
      if (ctx.user.role === "admin" && ctx.user.hotelId) {
        const targetUser = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
        if (targetUser.length === 0 || targetUser[0].hotelId !== ctx.user.hotelId) {
          throw new Error("Unauthorized");
        }
      }

      // Only superAdmin can change hotelId
      if (input.hotelId !== undefined && ctx.user.role !== "superAdmin") {
        throw new Error("Only superAdmin can assign hotels");
      }

      const updateData: any = { role: input.role };
      if (input.hotelId !== undefined) {
        updateData.hotelId = input.hotelId;
      }

      await db.update(users)
        .set(updateData)
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  assignHotelToUser: protectedProcedure
    .input(z.object({
      userId: z.number(),
      hotelId: z.number().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Only superAdmin can assign hotels
      if (ctx.user.role !== "superAdmin") {
        throw new Error("Only superAdmin can assign hotels to users");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(users)
        .set({ hotelId: input.hotelId })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  deleteUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "superAdmin") {
        throw new Error("Unauthorized");
      }

      if (input.userId === ctx.user.id) {
        throw new Error("Cannot delete your own account");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Soft delete by marking as inactive
      await db.update(users)
        .set({ email: null, isActive: false })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  // Get hotels for assignment (superAdmin only)
  getHotelsForAssignment: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "superAdmin") {
      throw new Error("Only superAdmin can view hotels for assignment");
    }

    const db = await getDb();
    if (!db) return [];

    const allHotels = await db.select().from(hotels).where(eq(hotels.isActive, true));
    return allHotels.map((h) => ({
      id: h.id,
      hotelName: h.hotelName,
      hotelCode: h.hotelCode,
    }));
  }),

  // Localization Settings
  getLocalizationSettings: protectedProcedure.query(async () => {
    return {
      supportedLanguages: [
        { code: "th", name: "ไทย", nativeName: "ไทย" },
        { code: "en", name: "English", nativeName: "English" },
      ],
      defaultLanguage: "th",
    };
  }),

  // System Status
  getSystemStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        status: "error",
        message: "Database not available",
        timestamp: new Date(),
      };
    }

    try {
      // Simple health check
      const userCount = await db.select().from(users).limit(1);
      
      return {
        status: "healthy",
        message: "System is running normally",
        timestamp: new Date(),
        database: "connected",
      };
    } catch (error) {
      return {
        status: "error",
        message: "Database connection failed",
        timestamp: new Date(),
        database: "disconnected",
      };
    }
  }),

  // Backup & Export
  exportData: protectedProcedure
    .input(z.object({
      dataType: z.enum(["rooms", "guests", "channels", "menus", "all"]),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      // This would return data for export
      // In production, you'd generate CSV or JSON files
      return {
        success: true,
        message: "Export started",
        dataType: input.dataType,
      };
    }),
});
