import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { rooms, guestInformation } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const roomsRouter = router({
  list: protectedProcedure
    .input(z.object({
      hotelId: z.number().int().optional(),
      limit: z.number().int().default(50),
      offset: z.number().int().default(0),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { data: [], total: 0 };

      let hotelId = input.hotelId;
      if (!hotelId && ctx.user.role === "hotelAdmin" && ctx.user.hotelId) {
        hotelId = ctx.user.hotelId;
      }

      // Check authorization
      if (hotelId && ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== hotelId) {
        throw new Error("Unauthorized");
      }

      const query = hotelId ? db.select().from(rooms).where(eq(rooms.hotelId, hotelId)) : db.select().from(rooms);
      const allRooms = await query;
      const data = await query.limit(input.limit).offset(input.offset);

      return { data, total: allRooms.length };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db.select().from(rooms).where(eq(rooms.id, input.id)).limit(1);
      if (result.length === 0) return null;

      // Check authorization
      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== result[0].hotelId) {
        throw new Error("Unauthorized");
      }

      return result[0];
    }),

  getByNumber: protectedProcedure
    .input(z.object({ roomNumber: z.string(), hotelId: z.number().int().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      let hotelId = input.hotelId;
      if (!hotelId && ctx.user.role === "hotelAdmin" && ctx.user.hotelId) {
        hotelId = ctx.user.hotelId;
      }

      // Check authorization
      if (hotelId && ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== hotelId) {
        throw new Error("Unauthorized");
      }

      const query = hotelId
        ? db.select().from(rooms).where(and(eq(rooms.roomNumber, input.roomNumber), eq(rooms.hotelId, hotelId)))
        : db.select().from(rooms).where(eq(rooms.roomNumber, input.roomNumber));

      const result = await query.limit(1);
      return result.length > 0 ? result[0] : null;
    }),

  create: protectedProcedure
    .input(z.object({
      hotelId: z.number().int(),
      roomNumber: z.string().min(1),
      floor: z.number().int().optional(),
      roomType: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      // hotelAdmin can only create for their own hotel
      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== input.hotelId) {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(rooms).values({
        hotelId: input.hotelId,
        roomNumber: input.roomNumber,
        floor: input.floor,
        roomType: input.roomType,
        isActive: true,
      });

      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      roomNumber: z.string().optional(),
      floor: z.number().int().optional(),
      roomType: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check authorization
      const room = await db.select().from(rooms).where(eq(rooms.id, input.id)).limit(1);
      if (room.length === 0) throw new Error("Room not found");

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== room[0].hotelId) {
        throw new Error("Unauthorized");
      }

      const { id, ...updateData } = input;
      await db.update(rooms).set(updateData).where(eq(rooms.id, id));

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const room = await db.select().from(rooms).where(eq(rooms.id, input.id)).limit(1);
      if (room.length === 0) throw new Error("Room not found");

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== room[0].hotelId) {
        throw new Error("Unauthorized");
      }

      await db.delete(rooms).where(eq(rooms.id, input.id));

      return { success: true };
    }),

  getStats: protectedProcedure
    .input(z.object({ hotelId: z.number().int().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { total: 0, occupied: 0, available: 0 };

      let hotelId = input.hotelId;
      if (!hotelId && ctx.user.role === "hotelAdmin" && ctx.user.hotelId) {
        hotelId = ctx.user.hotelId;
      }

      if (hotelId && ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== hotelId) {
        throw new Error("Unauthorized");
      }

      const query = hotelId ? db.select().from(rooms).where(eq(rooms.hotelId, hotelId)) : db.select().from(rooms);
      const allRooms = await query;

      const occupied = allRooms.filter(r => r.isActive).length;

      return {
        total: allRooms.length,
        occupied,
        available: allRooms.length - occupied,
      };
    }),

  bulkImport: protectedProcedure
    .input(z.object({
      hotelId: z.number().int(),
      rooms: z.array(z.object({
        roomNumber: z.string(),
        floor: z.number().int().optional(),
        roomType: z.string().optional(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== input.hotelId) {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const roomsToInsert = input.rooms.map(r => ({
        hotelId: input.hotelId,
        roomNumber: r.roomNumber,
        floor: r.floor,
        roomType: r.roomType,
        isActive: true,
      }));

      await db.insert(rooms).values(roomsToInsert);

      return { success: true, count: roomsToInsert.length };
    }),
});
