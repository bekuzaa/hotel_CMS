/**
 * Real-time Sync Router
 * tRPC procedures for real-time synchronization
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getConnectedDevices,
  getConnectionStats,
  broadcastToDevices,
  sendToDevice,
} from "../_core/websocket";

export const syncRouter = router({
  // Get connected devices
  getConnectedDevices: protectedProcedure
    .input(
      z.object({
        hotelId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      let hotelId = input.hotelId;

      // hotelAdmin can only see their own hotel's devices
      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId) {
        hotelId = ctx.user.hotelId;
      }

      const devices = getConnectedDevices(hotelId);

      return devices.map((d) => ({
        id: d.id,
        hotelId: d.hotelId,
        roomNumber: d.roomNumber,
        connectedAt: d.connectedAt,
        lastHeartbeat: d.lastHeartbeat,
      }));
    }),

  // Get connection statistics
  getConnectionStats: protectedProcedure.query(() => {
    return getConnectionStats();
  }),

  // Refresh content on all devices in a hotel
  refreshContent: protectedProcedure
    .input(
      z.object({
        hotelId: z.number(),
        contentType: z.enum(["all", "channels", "menus", "backgrounds", "guests"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      // hotelAdmin can only refresh their own hotel
      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== input.hotelId) {
        throw new Error("Unauthorized");
      }

      broadcastToDevices(input.hotelId, {
        type: "refresh_content",
        payload: { contentType: input.contentType || "all" },
        hotelId: input.hotelId,
        timestamp: new Date(),
      });

      return { success: true };
    }),

  // Send message to specific device
  sendMessage: protectedProcedure
    .input(
      z.object({
        deviceId: z.string(),
        message: z.object({
          type: z.string(),
          payload: z.any(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
        throw new Error("Unauthorized");
      }

      const sent = sendToDevice(input.deviceId, {
        type: input.message.type,
        payload: input.message.payload,
        timestamp: new Date(),
      });

      return { success: sent };
    }),

  // Broadcast announcement to devices
  broadcastAnnouncement: protectedProcedure
    .input(
      z.object({
        hotelId: z.number(),
        title: z.string(),
        message: z.string(),
        duration: z.number().optional(), // seconds to display
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      // hotelAdmin can only broadcast to their own hotel
      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== input.hotelId) {
        throw new Error("Unauthorized");
      }

      broadcastToDevices(input.hotelId, {
        type: "announcement",
        payload: {
          title: input.title,
          message: input.message,
          duration: input.duration || 10,
        },
        hotelId: input.hotelId,
        timestamp: new Date(),
      });

      return { success: true };
    }),
});
