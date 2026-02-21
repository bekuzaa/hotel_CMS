import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { backgroundImages } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const backgroundImagesRouter = router({
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

      const query = hotelId ? db.select().from(backgroundImages).where(eq(backgroundImages.hotelId, hotelId)) : db.select().from(backgroundImages);
      const allImages = await query;
      const data = await query.orderBy(backgroundImages.displayOrder).limit(input.limit).offset(input.offset);

      return { data, total: allImages.length };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db.select().from(backgroundImages).where(eq(backgroundImages.id, input.id)).limit(1);
      if (result.length === 0) return null;

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== result[0].hotelId) {
        throw new Error("Unauthorized");
      }

      return result[0];
    }),

  create: protectedProcedure
    .input(z.object({
      hotelId: z.number().int(),
      name: z.string().min(1),
      imageUrl: z.string().url(),
      displayMode: z.enum(["single", "slideshow"]).default("single"),
      displayDuration: z.number().int().default(5000),
      displayOrder: z.number().int().default(0),
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

      await db.insert(backgroundImages).values({
        hotelId: input.hotelId,
        name: input.name,
        imageUrl: input.imageUrl,
        displayMode: input.displayMode,
        displayDuration: input.displayDuration,
        displayOrder: input.displayOrder,
        isActive: true,
      });

      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      imageUrl: z.string().url().optional(),
      displayMode: z.enum(["single", "slideshow"]).optional(),
      displayDuration: z.number().int().optional(),
      displayOrder: z.number().int().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const image = await db.select().from(backgroundImages).where(eq(backgroundImages.id, input.id)).limit(1);
      if (image.length === 0) throw new Error("Image not found");

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== image[0].hotelId) {
        throw new Error("Unauthorized");
      }

      const { id, ...updateData } = input;
      await db.update(backgroundImages).set(updateData).where(eq(backgroundImages.id, id));

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

      const image = await db.select().from(backgroundImages).where(eq(backgroundImages.id, input.id)).limit(1);
      if (image.length === 0) throw new Error("Image not found");

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== image[0].hotelId) {
        throw new Error("Unauthorized");
      }

      await db.delete(backgroundImages).where(eq(backgroundImages.id, input.id));

      return { success: true };
    }),

  reorder: protectedProcedure
    .input(z.object({
      hotelId: z.number().int(),
      imageIds: z.array(z.number()),
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

      for (let i = 0; i < input.imageIds.length; i++) {
        await db.update(backgroundImages).set({ displayOrder: i }).where(eq(backgroundImages.id, input.imageIds[i]));
      }

      return { success: true };
    }),
});
