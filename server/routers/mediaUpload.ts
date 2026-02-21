import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { mediaFiles } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { storagePut, storageGet } from "../storage";
import { nanoid } from "nanoid";

export const mediaUploadRouter = router({
  list: protectedProcedure
    .input(z.object({
      hotelId: z.number().int().optional(),
      limit: z.number().int().default(50),
      offset: z.number().int().default(0),
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

      const query = hotelId ? db.select().from(mediaFiles).where(eq(mediaFiles.hotelId, hotelId)) : db.select().from(mediaFiles);
      const data = await query.orderBy(mediaFiles.createdAt).limit(input.limit).offset(input.offset);

      return data;
    }),

  getStats: protectedProcedure
    .input(z.object({ hotelId: z.number().int().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { totalFiles: 0, totalSize: 0 };

      let hotelId = input.hotelId;
      if (!hotelId && ctx.user.role === "hotelAdmin" && ctx.user.hotelId) {
        hotelId = ctx.user.hotelId;
      }

      if (hotelId && ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== hotelId) {
        throw new Error("Unauthorized");
      }

      const query = hotelId 
        ? db.select({ total: sql<number>`count(*)`, totalSize: sql<number>`coalesce(sum(fileSize), 0)` }).from(mediaFiles).where(eq(mediaFiles.hotelId, hotelId))
        : db.select({ total: sql<number>`count(*)`, totalSize: sql<number>`coalesce(sum(fileSize), 0)` }).from(mediaFiles);
      
      const result = await query;
      return {
        totalFiles: result[0]?.total || 0,
        totalSize: result[0]?.totalSize || 0,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db.select().from(mediaFiles).where(eq(mediaFiles.id, input.id)).limit(1);
      if (result.length === 0) return null;

      // Check authorization
      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== result[0].hotelId) {
        throw new Error("Unauthorized");
      }

      return result[0];
    }),

  getSignedUrl: protectedProcedure
    .input(z.object({ fileKey: z.string() }))
    .query(async ({ input }) => {
      const result = await storageGet(input.fileKey);
      return result;
    }),

  generateUploadUrl: protectedProcedure
    .input(z.object({
      hotelId: z.number(),
      fileName: z.string(),
      fileType: z.string(),
      mimeType: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      // hotelAdmin can only upload for their own hotel
      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== input.hotelId) {
        throw new Error("Unauthorized");
      }

      // Generate a unique file key
      const fileKey = `media/${input.hotelId}/${ctx.user.id}/${nanoid()}/${input.fileName}`;

      // Return the file key for client-side upload
      // Client will upload directly to S3 using presigned URL
      return {
        fileKey,
        uploadUrl: `${process.env.VITE_FRONTEND_FORGE_API_URL}/upload?key=${fileKey}`,
      };
    }),

  registerUpload: protectedProcedure
    .input(z.object({
      hotelId: z.number(),
      fileName: z.string(),
      fileKey: z.string(),
      fileUrl: z.string(),
      fileType: z.string(),
      mimeType: z.string(),
      fileSize: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      // hotelAdmin can only upload for their own hotel
      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== input.hotelId) {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(mediaFiles).values({
        hotelId: input.hotelId,
        fileName: input.fileName,
        fileKey: input.fileKey,
        fileUrl: input.fileUrl,
        fileType: input.fileType,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        uploadedBy: ctx.user.id,
      });

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

      const file = await db.select().from(mediaFiles).where(eq(mediaFiles.id, input.id)).limit(1);
      if (file.length === 0) {
        throw new Error("File not found");
      }

      // Check authorization
      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== file[0].hotelId) {
        throw new Error("Unauthorized");
      }

      // Delete from database
      await db.delete(mediaFiles).where(eq(mediaFiles.id, input.id));

      return { success: true };
    }),
});
