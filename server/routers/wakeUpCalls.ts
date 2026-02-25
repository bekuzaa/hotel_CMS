import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { wakeUpCalls } from "../../drizzle/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { broadcastToClients } from "../_core/websocket";

/**
 * Wake-up Calls Router
 * Allows guests to schedule wake-up calls from the TV
 * Hotel staff can manage and track wake-up calls
 */
export const wakeUpCallsRouter = router({
  // List wake-up calls for a hotel (CMS)
  list: protectedProcedure
    .input(z.object({
      hotelId: z.number(),
      status: z.string().optional(),
      date: z.string().optional(), // YYYY-MM-DD format
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(wakeUpCalls)
        .where(eq(wakeUpCalls.hotelId, input.hotelId))
        .orderBy(desc(wakeUpCalls.scheduledTime));

      // Filter by status
      if (input.status) {
        query = db.select().from(wakeUpCalls)
          .where(and(
            eq(wakeUpCalls.hotelId, input.hotelId),
            eq(wakeUpCalls.status, input.status)
          ))
          .orderBy(desc(wakeUpCalls.scheduledTime));
      }

      const calls = await query;
      return calls;
    }),

  // Get wake-up calls for a specific room (TV)
  getByRoom: publicProcedure
    .input(z.object({
      hotelId: z.number(),
      roomNumber: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const calls = await db.select().from(wakeUpCalls)
        .where(and(
          eq(wakeUpCalls.hotelId, input.hotelId),
          eq(wakeUpCalls.roomNumber, input.roomNumber),
          gte(wakeUpCalls.scheduledTime, today)
        ))
        .orderBy(wakeUpCalls.scheduledTime);

      return calls;
    }),

  // Create a wake-up call (TV or CMS)
  create: publicProcedure
    .input(z.object({
      hotelId: z.number(),
      roomNumber: z.string(),
      scheduledTime: z.string().or(z.date()),
      recurring: z.boolean().default(false),
      recurringDays: z.array(z.string()).optional(),
      alarmType: z.string().default("tv"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const scheduledTime = typeof input.scheduledTime === "string" 
        ? new Date(input.scheduledTime) 
        : input.scheduledTime;

      const [call] = await db.insert(wakeUpCalls).values({
        hotelId: input.hotelId,
        roomNumber: input.roomNumber,
        scheduledTime,
        recurring: input.recurring,
        recurringDays: input.recurringDays ? JSON.stringify(input.recurringDays) : null,
        alarmType: input.alarmType,
        notes: input.notes,
        status: "pending",
      }).returning();

      // Broadcast to CMS
      broadcastToClients({
        type: "new_wakeup_call",
        payload: { id: call.id, hotelId: input.hotelId, roomNumber: input.roomNumber, scheduledTime },
        hotelId: input.hotelId,
        timestamp: new Date(),
      });

      return call;
    }),

  // Update wake-up call status (CMS)
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.string().optional(),
      scheduledTime: z.string().or(z.date()).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updates: Record<string, any> = { updatedAt: new Date() };

      if (input.status) {
        updates.status = input.status;
        if (input.status === "completed") {
          updates.triggeredAt = new Date();
        } else if (input.status === "cancelled") {
          updates.cancelledAt = new Date();
        }
      }

      if (input.scheduledTime) {
        updates.scheduledTime = typeof input.scheduledTime === "string" 
          ? new Date(input.scheduledTime) 
          : input.scheduledTime;
      }

      if (input.notes !== undefined) {
        updates.notes = input.notes;
      }

      const [updated] = await db.update(wakeUpCalls)
        .set(updates)
        .where(eq(wakeUpCalls.id, input.id))
        .returning();

      return updated;
    }),

  // Cancel wake-up call (TV or CMS)
  cancel: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [updated] = await db.update(wakeUpCalls)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(wakeUpCalls.id, input.id))
        .returning();

      return updated;
    }),

  // Snooze wake-up call (TV)
  snooze: publicProcedure
    .input(z.object({
      id: z.number(),
      snoozeMinutes: z.number().default(5),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get current call
      const [current] = await db.select().from(wakeUpCalls)
        .where(eq(wakeUpCalls.id, input.id));

      if (!current) throw new Error("Wake-up call not found");

      // Create new snoozed time
      const newTime = new Date(current.scheduledTime);
      newTime.setMinutes(newTime.getMinutes() + input.snoozeMinutes);

      const [updated] = await db.update(wakeUpCalls)
        .set({
          scheduledTime: newTime,
          status: "snoozed",
          updatedAt: new Date(),
        })
        .where(eq(wakeUpCalls.id, input.id))
        .returning();

      return updated;
    }),

  // Mark as triggered (TV when alarm goes off)
  trigger: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [updated] = await db.update(wakeUpCalls)
        .set({
          status: "completed",
          triggeredAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(wakeUpCalls.id, input.id))
        .returning();

      return updated;
    }),

  // Delete wake-up call (CMS)
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(wakeUpCalls).where(eq(wakeUpCalls.id, input.id));
      return { success: true };
    }),

  // Get upcoming calls (for dashboard)
  getUpcoming: protectedProcedure
    .input(z.object({
      hotelId: z.number(),
      limit: z.number().default(10),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const now = new Date();
      const calls = await db.select().from(wakeUpCalls)
        .where(and(
          eq(wakeUpCalls.hotelId, input.hotelId),
          eq(wakeUpCalls.status, "pending"),
          gte(wakeUpCalls.scheduledTime, now)
        ))
        .orderBy(wakeUpCalls.scheduledTime)
        .limit(input.limit);

      return calls;
    }),

  // Get statistics (for dashboard)
  getStats: protectedProcedure
    .input(z.object({
      hotelId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [pending, completed, todayCount] = await Promise.all([
        db.select().from(wakeUpCalls)
          .where(and(
            eq(wakeUpCalls.hotelId, input.hotelId),
            eq(wakeUpCalls.status, "pending")
          )),
        db.select().from(wakeUpCalls)
          .where(and(
            eq(wakeUpCalls.hotelId, input.hotelId),
            eq(wakeUpCalls.status, "completed")
          )),
        db.select().from(wakeUpCalls)
          .where(and(
            eq(wakeUpCalls.hotelId, input.hotelId),
            gte(wakeUpCalls.scheduledTime, today),
            lte(wakeUpCalls.scheduledTime, tomorrow)
          )),
      ]);

      return {
        pending: pending.length,
        completed: completed.length,
        today: todayCount.length,
      };
    }),
});
