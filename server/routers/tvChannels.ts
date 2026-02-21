import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { tvChannels } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const tvChannelsRouter = router({
  list: protectedProcedure
    .input(z.object({ hotelId: z.number().int().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];
      
      let hotelId: number | null = null;
      
      // For hotelAdmin, always use their hotel
      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId) {
        hotelId = ctx.user.hotelId;
      }
      // For superAdmin, use input hotelId if provided
      else if (ctx.user.role === "superAdmin" && input.hotelId) {
        hotelId = input.hotelId;
      }
      
      // Build query based on hotelId
      let channels;
      if (hotelId) {
        channels = await db.select().from(tvChannels).where(eq(tvChannels.hotelId, hotelId)).orderBy(tvChannels.displayOrder);
      } else {
        channels = await db.select().from(tvChannels).orderBy(tvChannels.displayOrder);
      }
      
      return channels;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;
      
      const result = await db.select().from(tvChannels).where(eq(tvChannels.id, input.id)).limit(1);
      if (result.length === 0) return null;
      
      // Check authorization
      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== result[0].hotelId) {
        throw new Error("Unauthorized");
      }
      
      return result[0];
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      nameEn: z.string().min(1),
      description: z.string().optional(),
      descriptionEn: z.string().optional(),
      streamUrl: z.string().url(),
      thumbnailUrl: z.string().url().optional(),
      category: z.string().min(1),
      displayOrder: z.number().int().default(0),
      hotelId: z.number().int(),
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

      await db.insert(tvChannels).values({
        ...input,
        isActive: true,
      });

      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      nameEn: z.string().optional(),
      description: z.string().optional(),
      descriptionEn: z.string().optional(),
      streamUrl: z.string().url().optional(),
      thumbnailUrl: z.string().url().optional(),
      category: z.string().optional(),
      displayOrder: z.number().int().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check authorization
      const channel = await db.select().from(tvChannels).where(eq(tvChannels.id, input.id)).limit(1);
      if (channel.length === 0) throw new Error("Channel not found");
      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== channel[0].hotelId) {
        throw new Error("Unauthorized");
      }

      const { id, ...updateData } = input;
      await db.update(tvChannels).set(updateData).where(eq(tvChannels.id, id));

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

      // Check authorization
      const channel = await db.select().from(tvChannels).where(eq(tvChannels.id, input.id)).limit(1);
      if (channel.length === 0) throw new Error("Channel not found");
      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== channel[0].hotelId) {
        throw new Error("Unauthorized");
      }

      await db.delete(tvChannels).where(eq(tvChannels.id, input.id));

      return { success: true };
    }),

  reorder: protectedProcedure
    .input(z.object({
      items: z.array(z.object({ id: z.number(), displayOrder: z.number() })),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      for (const item of input.items) {
        // Check authorization
        const channel = await db.select().from(tvChannels).where(eq(tvChannels.id, item.id)).limit(1);
        if (channel.length > 0 && ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== channel[0].hotelId) {
          throw new Error("Unauthorized");
        }
        await db.update(tvChannels).set({ displayOrder: item.displayOrder }).where(eq(tvChannels.id, item.id));
      }

      return { success: true };
    }),
});
