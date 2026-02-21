import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { menuItems } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const menuItemsRouter = router({
  list: protectedProcedure
    .input(z.object({
      hotelId: z.number().int().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      let hotelId = input.hotelId;
      if (!hotelId && ctx.user.role === "hotelAdmin" && ctx.user.hotelId) {
        hotelId = ctx.user.hotelId;
      }

      // Check authorization
      if (hotelId && ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== hotelId) {
        throw new Error("Unauthorized");
      }

      let items;
      if (hotelId) {
        items = await db.select().from(menuItems).where(eq(menuItems.hotelId, hotelId)).orderBy(menuItems.displayOrder);
      } else {
        items = await db.select().from(menuItems).orderBy(menuItems.displayOrder);
      }

      return items;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db.select().from(menuItems).where(eq(menuItems.id, input.id)).limit(1);
      if (result.length === 0) return null;

      // Check authorization
      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== result[0].hotelId) {
        throw new Error("Unauthorized");
      }

      return result[0];
    }),

  create: protectedProcedure
    .input(z.object({
      hotelId: z.number().int(),
      name: z.string().min(1),
      nameEn: z.string().min(1),
      icon: z.string().optional(),
      iconUrl: z.string().optional(),
      category: z.string().min(1),
      contentType: z.enum(["url", "image", "text", "video"]),
      contentValue: z.string().optional(),
      displayOrder: z.number().int().default(0),
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

      await db.insert(menuItems).values({
        hotelId: input.hotelId,
        name: input.name,
        nameEn: input.nameEn,
        icon: input.icon,
        iconUrl: input.iconUrl,
        category: input.category,
        contentType: input.contentType,
        contentValue: input.contentValue,
        displayOrder: input.displayOrder,
        isActive: true,
      });

      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      nameEn: z.string().optional(),
      icon: z.string().optional(),
      iconUrl: z.string().optional(),
      category: z.string().optional(),
      contentType: z.enum(["url", "image", "text", "video"]).optional(),
      contentValue: z.string().optional(),
      displayOrder: z.number().int().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const item = await db.select().from(menuItems).where(eq(menuItems.id, input.id)).limit(1);
      if (item.length === 0) throw new Error("Menu item not found");

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== item[0].hotelId) {
        throw new Error("Unauthorized");
      }

      const { id, ...updateData } = input;
      await db.update(menuItems).set(updateData).where(eq(menuItems.id, id));

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

      const item = await db.select().from(menuItems).where(eq(menuItems.id, input.id)).limit(1);
      if (item.length === 0) throw new Error("Menu item not found");

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== item[0].hotelId) {
        throw new Error("Unauthorized");
      }

      await db.delete(menuItems).where(eq(menuItems.id, input.id));

      return { success: true };
    }),

  reorder: protectedProcedure
    .input(z.object({
      hotelId: z.number().int(),
      itemIds: z.array(z.number()),
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

      for (let i = 0; i < input.itemIds.length; i++) {
        await db.update(menuItems).set({ displayOrder: i }).where(eq(menuItems.id, input.itemIds[i]));
      }

      return { success: true };
    }),
});
