import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { hotels, users } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

// Schema validation
const createHotelSchema = z.object({
  hotelName: z.string().min(1, "Hotel name is required"),
  hotelCode: z.string().min(1, "Hotel code is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  wifiSSID: z.string().optional(),
  wifiPassword: z.string().optional(),
  supportPhone: z.string().optional(),
  supportEmail: z.string().email().optional(),
  totalRooms: z.number().int().min(0).optional(),
});

const updateHotelSchema = z.object({
  id: z.number().int(),
  hotelName: z.string().optional(),
  hotelCode: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  wifiSSID: z.string().optional(),
  wifiPassword: z.string().optional(),
  supportPhone: z.string().optional(),
  supportEmail: z.string().email().optional(),
  totalRooms: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// Helper function to check if user is superAdmin
function isSuperAdmin(user: any): boolean {
  return user.role === "superAdmin";
}

// Helper function to check if user is hotelAdmin for specific hotel
function isHotelAdmin(user: any, hotelId: number): boolean {
  return user.role === "hotelAdmin" && user.hotelId === hotelId;
}

export const hotelsRouter = router({
  // Get all hotels (superAdmin only)
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!isSuperAdmin(ctx.user)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only superAdmin can view all hotels",
      });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const data = await db.select().from(hotels).where(eq(hotels.isActive, true));
    return data;
  }),

  // Get hotel by ID
  getById: protectedProcedure.input(z.object({ id: z.number().int() })).query(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const hotel = await db.select().from(hotels).where(eq(hotels.id, input.id)).limit(1);

    if (hotel.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Hotel not found" });
    }

    // Check authorization: superAdmin or hotelAdmin of this hotel
    if (!isSuperAdmin(ctx.user) && !isHotelAdmin(ctx.user, input.id)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to view this hotel",
      });
    }

    return hotel[0];
  }),

  // Get current user's hotel (for hotelAdmin)
  getCurrentHotel: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "hotelAdmin" || !ctx.user.hotelId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only hotelAdmin can use this endpoint",
      });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const hotel = await db.select().from(hotels).where(eq(hotels.id, ctx.user.hotelId)).limit(1);

    if (hotel.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Hotel not found" });
    }

    return hotel[0];
  }),

  // Create hotel (superAdmin only)
  create: protectedProcedure.input(createHotelSchema).mutation(async ({ input, ctx }) => {
    if (!isSuperAdmin(ctx.user)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only superAdmin can create hotels",
      });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Check if hotel code already exists
    const existing = await db.select().from(hotels).where(eq(hotels.hotelCode, input.hotelCode));
    if (existing.length > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Hotel code already exists",
      });
    }

    await db.insert(hotels).values({
      ...input,
      totalRooms: input.totalRooms || 0,
    });

    return { success: true };
  }),

  // Update hotel (superAdmin or hotelAdmin of that hotel)
  update: protectedProcedure.input(updateHotelSchema).mutation(async ({ input, ctx }) => {
    // Check authorization
    if (!isSuperAdmin(ctx.user) && !isHotelAdmin(ctx.user, input.id)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to update this hotel",
      });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Check if hotel exists
    const existing = await db.select().from(hotels).where(eq(hotels.id, input.id));
    if (existing.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Hotel not found" });
    }

    // Check if new hotel code already exists (if changing code)
    if (input.hotelCode && input.hotelCode !== existing[0].hotelCode) {
      const duplicate = await db.select().from(hotels).where(eq(hotels.hotelCode, input.hotelCode));
      if (duplicate.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Hotel code already exists",
        });
      }
    }

    const updateData: any = {};
    Object.keys(input).forEach((key) => {
      if (key !== "id" && input[key as keyof typeof input] !== undefined) {
        updateData[key] = input[key as keyof typeof input];
      }
    });

    await db.update(hotels).set(updateData).where(eq(hotels.id, input.id));

    return { success: true };
  }),

  // Delete hotel (superAdmin only)
  delete: protectedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input, ctx }) => {
    if (!isSuperAdmin(ctx.user)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only superAdmin can delete hotels",
      });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Check if hotel exists
    const existing = await db.select().from(hotels).where(eq(hotels.id, input.id));
    if (existing.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Hotel not found" });
    }

    // Check if hotel has any users
    const hotelUsers = await db.select().from(users).where(eq(users.hotelId, input.id));
    if (hotelUsers.length > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot delete hotel with existing users. Please reassign or delete users first.",
      });
    }

    // Soft delete by setting isActive to false
    await db.update(hotels).set({ isActive: false }).where(eq(hotels.id, input.id));

    return { success: true };
  }),

  // Get hotel statistics
  getStats: protectedProcedure.input(z.object({ hotelId: z.number().int().optional() })).query(async ({ input, ctx }) => {
    let hotelId = input.hotelId;

    // If hotelId not provided, use current user's hotel (for hotelAdmin)
    if (!hotelId) {
      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId) {
        hotelId = ctx.user.hotelId;
      } else if (!isSuperAdmin(ctx.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must provide hotelId or be a hotelAdmin",
        });
      }
    }

    // Check authorization
    if (hotelId && !isSuperAdmin(ctx.user) && !isHotelAdmin(ctx.user, hotelId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to view this hotel's statistics",
      });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Get hotel info
    const hotelData = hotelId ? await db.select().from(hotels).where(eq(hotels.id, hotelId)).limit(1) : null;

    return {
      hotelId: hotelId || null,
      hotelName: hotelData ? hotelData[0]?.hotelName : "System",
      totalRooms: hotelData ? hotelData[0]?.totalRooms : 0,
      isActive: hotelData ? hotelData[0]?.isActive : true,
    };
  }),

  // List hotels for hotelAdmin assignment
  listForAssignment: protectedProcedure.query(async ({ ctx }) => {
    if (!isSuperAdmin(ctx.user)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only superAdmin can list hotels for assignment",
      });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const allHotels = await db.select().from(hotels).where(eq(hotels.isActive, true));

    return allHotels.map((h) => ({
      id: h.id,
      name: h.hotelName,
      code: h.hotelCode,
    }));
  }),
});
