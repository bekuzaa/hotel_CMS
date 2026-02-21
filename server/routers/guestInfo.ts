import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { guestInformation, rooms } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const guestInfoRouter = router({
  getByRoomId: protectedProcedure
    .input(z.object({ roomId: z.number(), hotelId: z.number().int().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      let hotelId = input.hotelId;
      if (!hotelId && ctx.user.role === "hotelAdmin" && ctx.user.hotelId) {
        hotelId = ctx.user.hotelId;
      }

      if (hotelId && ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== hotelId) {
        throw new Error("Unauthorized");
      }

      const query = hotelId
        ? db.select().from(guestInformation).where(and(eq(guestInformation.roomId, input.roomId), eq(guestInformation.hotelId, hotelId)))
        : db.select().from(guestInformation).where(eq(guestInformation.roomId, input.roomId));

      const result = await query.limit(1);
      return result.length > 0 ? result[0] : null;
    }),

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

      if (hotelId && ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== hotelId) {
        throw new Error("Unauthorized");
      }

      const query = hotelId ? db.select().from(guestInformation).where(eq(guestInformation.hotelId, hotelId)) : db.select().from(guestInformation);
      const allGuests = await query;
      const total = allGuests.length;

      const data = await query.limit(input.limit).offset(input.offset);
      return { data, total };
    }),

  create: protectedProcedure
    .input(z.object({
      hotelId: z.number().int(),
      roomId: z.number(),
      guestName: z.string().min(1),
      checkInDate: z.date().optional(),
      checkOutDate: z.date().optional(),
      wifiPassword: z.string().optional(),
      wifiSsid: z.string().optional(),
      welcomeMessage: z.string().optional(),
      welcomeMessageEn: z.string().optional(),
      additionalInfo: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "staff" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== input.hotelId) {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(guestInformation).values({
        hotelId: input.hotelId,
        roomId: input.roomId,
        guestName: input.guestName,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        wifiPassword: input.wifiPassword,
        wifiSsid: input.wifiSsid,
        welcomeMessage: input.welcomeMessage,
        welcomeMessageEn: input.welcomeMessageEn,
        additionalInfo: input.additionalInfo,
      });

      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      roomId: z.number().optional(),
      guestName: z.string().optional(),
      checkInDate: z.date().optional(),
      checkOutDate: z.date().optional(),
      wifiPassword: z.string().optional(),
      wifiSsid: z.string().optional(),
      welcomeMessage: z.string().optional(),
      welcomeMessageEn: z.string().optional(),
      additionalInfo: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "staff" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const guest = await db.select().from(guestInformation).where(eq(guestInformation.id, input.id)).limit(1);
      if (guest.length === 0) throw new Error("Guest not found");

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== guest[0].hotelId) {
        throw new Error("Unauthorized");
      }

      const { id, ...updateData } = input;
      await db.update(guestInformation).set(updateData).where(eq(guestInformation.id, id));

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "staff" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const guest = await db.select().from(guestInformation).where(eq(guestInformation.id, input.id)).limit(1);
      if (guest.length === 0) throw new Error("Guest not found");

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== guest[0].hotelId) {
        throw new Error("Unauthorized");
      }

      await db.delete(guestInformation).where(eq(guestInformation.id, input.id));

      return { success: true };
    }),

  bulkImport: protectedProcedure
    .input(z.object({
      hotelId: z.number().int(),
      guests: z.array(z.object({
        roomId: z.number(),
        guestName: z.string(),
        wifiPassword: z.string().optional(),
        wifiSsid: z.string().optional(),
        welcomeMessage: z.string().optional(),
        welcomeMessageEn: z.string().optional(),
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

      const guestsToInsert = input.guests.map(g => ({
        hotelId: input.hotelId,
        roomId: g.roomId,
        guestName: g.guestName,
        wifiPassword: g.wifiPassword,
        wifiSsid: g.wifiSsid,
        welcomeMessage: g.welcomeMessage,
        welcomeMessageEn: g.welcomeMessageEn,
      }));

      await db.insert(guestInformation).values(guestsToInsert);

      return { success: true, count: guestsToInsert.length };
    }),
});
