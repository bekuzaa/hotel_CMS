import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { serviceRequests, serviceMenuItems, hotels } from "../../drizzle/schema";
import { eq, desc, and, like, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { broadcastToClients } from "../_core/websocket";

// Input schemas
const createRequestSchema = z.object({
  hotelId: z.number().int(),
  roomNumber: z.string().min(1),
  guestName: z.string().optional(),
  requestType: z.enum(["room_service", "housekeeping", "maintenance", "laundry", "wake_up_call", "other"]),
  description: z.string().optional(),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number().int().min(1),
    price: z.number().min(0),
  })).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

const updateRequestSchema = z.object({
  id: z.number().int(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

const submitFeedbackSchema = z.object({
  id: z.number().int(),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().optional(),
});

const createMenuItemSchema = z.object({
  hotelId: z.number().int(),
  category: z.enum(["food", "beverage", "amenities", "other"]),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().optional(),
});

const updateMenuItemSchema = z.object({
  id: z.number().int(),
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

// Helper to check authorization
function hasHotelAccess(user: any, hotelId: number): boolean {
  if (user.role === "superAdmin") return true;
  if (user.hotelId === hotelId) return true;
  return false;
}

export const guestServicesRouter = router({
  // ============ Service Requests ============
  
  // List all service requests for a hotel
  listRequests: protectedProcedure
    .input(z.object({
      hotelId: z.number().int(),
      status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
      requestType: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input, ctx }) => {
      if (!hasHotelAccess(ctx.user, input.hotelId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      let requests;
      if (input.status) {
        requests = await db.select().from(serviceRequests)
          .where(and(
            eq(serviceRequests.hotelId, input.hotelId),
            eq(serviceRequests.status, input.status)
          ))
          .orderBy(desc(serviceRequests.createdAt))
          .limit(input.limit);
      } else {
        requests = await db.select().from(serviceRequests)
          .where(eq(serviceRequests.hotelId, input.hotelId))
          .orderBy(desc(serviceRequests.createdAt))
          .limit(input.limit);
      }

      return requests;
    }),

  // Get a single service request
  getRequest: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const request = await db.select().from(serviceRequests).where(eq(serviceRequests.id, input.id));
      if (request.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      if (!hasHotelAccess(ctx.user, request[0].hotelId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      return request[0];
    }),

  // Create a new service request (public - from TV)
  createRequest: publicProcedure
    .input(createRequestSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const request = await db.insert(serviceRequests).values({
        hotelId: input.hotelId,
        roomNumber: input.roomNumber,
        guestName: input.guestName || null,
        requestType: input.requestType,
        description: input.description || null,
        items: input.items ? JSON.stringify(input.items) : null,
        priority: input.priority || "normal",
        status: "pending",
      }).returning();

      // Broadcast notification to CMS clients
      broadcastToClients({
        type: "new_service_request",
        payload: {
          id: request[0].id,
          hotelId: input.hotelId,
          roomNumber: input.roomNumber,
          requestType: input.requestType,
          description: input.description,
          priority: input.priority || "normal",
        },
        hotelId: input.hotelId,
        timestamp: new Date(),
      });

      return request[0];
    }),

  // Update a service request
  updateRequest: protectedProcedure
    .input(updateRequestSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if request exists and user has access
      const existing = await db.select().from(serviceRequests).where(eq(serviceRequests.id, input.id));
      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      if (!hasHotelAccess(ctx.user, existing[0].hotelId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (input.status) {
        updateData.status = input.status;
        if (input.status === "completed") {
          updateData.completedAt = new Date();
        }
      }
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.assignedTo !== undefined) updateData.assignedTo = input.assignedTo;
      if (input.priority) updateData.priority = input.priority;

      const updated = await db.update(serviceRequests)
        .set(updateData)
        .where(eq(serviceRequests.id, input.id))
        .returning();

      return updated[0];
    }),

  // Delete a service request
  deleteRequest: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const existing = await db.select().from(serviceRequests).where(eq(serviceRequests.id, input.id));
      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      if (!hasHotelAccess(ctx.user, existing[0].hotelId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      await db.delete(serviceRequests).where(eq(serviceRequests.id, input.id));
      return { success: true };
    }),

  // Submit guest feedback (public - from TV)
  submitFeedback: publicProcedure
    .input(submitFeedbackSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const existing = await db.select().from(serviceRequests).where(eq(serviceRequests.id, input.id));
      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      // Only allow feedback on completed requests
      if (existing[0].status !== "completed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Can only submit feedback for completed requests" });
      }

      const updated = await db.update(serviceRequests)
        .set({
          rating: input.rating,
          feedback: input.feedback || null,
          feedbackAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(serviceRequests.id, input.id))
        .returning();

      return updated[0];
    }),

  // Get request statistics
  getRequestStats: protectedProcedure
    .input(z.object({ hotelId: z.number().int() }))
    .query(async ({ input, ctx }) => {
      if (!hasHotelAccess(ctx.user, input.hotelId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const allRequests = await db.select().from(serviceRequests)
        .where(eq(serviceRequests.hotelId, input.hotelId));

      const stats = {
        total: allRequests.length,
        pending: allRequests.filter(r => r.status === "pending").length,
        inProgress: allRequests.filter(r => r.status === "in_progress").length,
        completed: allRequests.filter(r => r.status === "completed").length,
        cancelled: allRequests.filter(r => r.status === "cancelled").length,
        byType: {
          roomService: allRequests.filter(r => r.requestType === "room_service").length,
          housekeeping: allRequests.filter(r => r.requestType === "housekeeping").length,
          maintenance: allRequests.filter(r => r.requestType === "maintenance").length,
          laundry: allRequests.filter(r => r.requestType === "laundry").length,
          wakeUpCall: allRequests.filter(r => r.requestType === "wake_up_call").length,
          other: allRequests.filter(r => r.requestType === "other").length,
        },
      };

      return stats;
    }),

  // ============ Service Menu Items ============

  // List menu items
  listMenuItems: publicProcedure
    .input(z.object({
      hotelId: z.number().int(),
      category: z.enum(["food", "beverage", "amenities", "other"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      let items;
      if (input.category) {
        items = await db.select().from(serviceMenuItems)
          .where(and(
            eq(serviceMenuItems.hotelId, input.hotelId),
            eq(serviceMenuItems.category, input.category),
            eq(serviceMenuItems.isAvailable, true)
          ))
          .orderBy(serviceMenuItems.displayOrder);
      } else {
        items = await db.select().from(serviceMenuItems)
          .where(and(
            eq(serviceMenuItems.hotelId, input.hotelId),
            eq(serviceMenuItems.isAvailable, true)
          ))
          .orderBy(serviceMenuItems.displayOrder);
      }

      return items;
    }),

  // Create menu item
  createMenuItem: protectedProcedure
    .input(createMenuItemSchema)
    .mutation(async ({ input, ctx }) => {
      if (!hasHotelAccess(ctx.user, input.hotelId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get max display order
      const existing = await db.select().from(serviceMenuItems)
        .where(eq(serviceMenuItems.hotelId, input.hotelId));
      const maxOrder = existing.length > 0 
        ? Math.max(...existing.map(i => i.displayOrder || 0)) 
        : -1;

      const item = await db.insert(serviceMenuItems).values({
        hotelId: input.hotelId,
        category: input.category,
        name: input.name,
        description: input.description || null,
        price: input.price,
        imageUrl: input.imageUrl || null,
        isAvailable: input.isAvailable !== undefined ? input.isAvailable : true,
        displayOrder: maxOrder + 1,
      }).returning();

      return item[0];
    }),

  // Update menu item
  updateMenuItem: protectedProcedure
    .input(updateMenuItemSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const existing = await db.select().from(serviceMenuItems).where(eq(serviceMenuItems.id, input.id));
      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Menu item not found" });
      }

      if (!hasHotelAccess(ctx.user, existing[0].hotelId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.price !== undefined) updateData.price = input.price;
      if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;
      if (input.isAvailable !== undefined) updateData.isAvailable = input.isAvailable;
      if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;

      const updated = await db.update(serviceMenuItems)
        .set(updateData)
        .where(eq(serviceMenuItems.id, input.id))
        .returning();

      return updated[0];
    }),

  // Delete menu item
  deleteMenuItem: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const existing = await db.select().from(serviceMenuItems).where(eq(serviceMenuItems.id, input.id));
      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Menu item not found" });
      }

      if (!hasHotelAccess(ctx.user, existing[0].hotelId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      await db.delete(serviceMenuItems).where(eq(serviceMenuItems.id, input.id));
      return { success: true };
    }),
});
