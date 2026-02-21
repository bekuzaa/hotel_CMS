import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { deviceStatus } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { broadcastToDevices, sendToDevice } from "../_core/websocket";

export const devicesRouter = router({
  // List all devices
  list: protectedProcedure
    .input(
      z.object({
        hotelId: z.number().int().optional(),
        limit: z.number().int().default(50),
        offset: z.number().int().default(0),
      })
    )
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

      let devices;
      if (hotelId) {
        devices = await db
          .select()
          .from(deviceStatus)
          .where(eq(deviceStatus.hotelId, hotelId))
          .orderBy(deviceStatus.roomNumber);
      } else {
        devices = await db.select().from(deviceStatus).orderBy(deviceStatus.roomNumber);
      }

      return devices.slice(input.offset, input.offset + input.limit);
    }),

  // Get device by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(deviceStatus)
        .where(eq(deviceStatus.id, input.id))
        .limit(1);

      if (result.length === 0) return null;

      // Check authorization
      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== result[0].hotelId) {
        throw new Error("Unauthorized");
      }

      return result[0];
    }),

  // Get device stats
  getStats: protectedProcedure
    .input(z.object({ hotelId: z.number().int().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { total: 0, online: 0, offline: 0, poweredOn: 0 };

      let hotelId = input.hotelId;
      if (!hotelId && ctx.user.role === "hotelAdmin" && ctx.user.hotelId) {
        hotelId = ctx.user.hotelId;
      }

      let devices;
      if (hotelId) {
        devices = await db
          .select()
          .from(deviceStatus)
          .where(eq(deviceStatus.hotelId, hotelId));
      } else {
        devices = await db.select().from(deviceStatus);
      }

      return {
        total: devices.length,
        online: devices.filter((d) => d.isOnline).length,
        offline: devices.filter((d) => !d.isOnline).length,
        poweredOn: devices.filter((d) => d.isPoweredOn).length,
      };
    }),

  // Update device info
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        deviceName: z.string().optional(),
        roomNumber: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const device = await db
        .select()
        .from(deviceStatus)
        .where(eq(deviceStatus.id, input.id))
        .limit(1);

      if (device.length === 0) throw new Error("Device not found");

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== device[0].hotelId) {
        throw new Error("Unauthorized");
      }

      const { id, ...updateData } = input;
      await db.update(deviceStatus).set(updateData).where(eq(deviceStatus.id, id));

      return { success: true };
    }),

  // Set volume
  setVolume: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        volume: z.number().int().min(0).max(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const device = await db
        .select()
        .from(deviceStatus)
        .where(eq(deviceStatus.id, input.id))
        .limit(1);

      if (device.length === 0) throw new Error("Device not found");

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== device[0].hotelId) {
        throw new Error("Unauthorized");
      }

      // Update database
      await db
        .update(deviceStatus)
        .set({
          volume: input.volume,
          lastCommand: `volume_${input.volume}`,
          lastCommandTime: new Date(),
        })
        .where(eq(deviceStatus.id, input.id));

      // Send command to device via WebSocket
      sendToDevice(device[0].deviceId, {
        type: "set_volume",
        payload: { volume: input.volume },
        timestamp: new Date(),
      });

      return { success: true, volume: input.volume };
    }),

  // Toggle mute
  toggleMute: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const device = await db
        .select()
        .from(deviceStatus)
        .where(eq(deviceStatus.id, input.id))
        .limit(1);

      if (device.length === 0) throw new Error("Device not found");

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== device[0].hotelId) {
        throw new Error("Unauthorized");
      }

      const newMuteState = !device[0].isMuted;

      await db
        .update(deviceStatus)
        .set({
          isMuted: newMuteState,
          lastCommand: newMuteState ? "mute" : "unmute",
          lastCommandTime: new Date(),
        })
        .where(eq(deviceStatus.id, input.id));

      // Send command to device
      sendToDevice(device[0].deviceId, {
        type: newMuteState ? "mute" : "unmute",
        payload: {},
        timestamp: new Date(),
      });

      return { success: true, isMuted: newMuteState };
    }),

  // Power off device
  powerOff: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const device = await db
        .select()
        .from(deviceStatus)
        .where(eq(deviceStatus.id, input.id))
        .limit(1);

      if (device.length === 0) throw new Error("Device not found");

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== device[0].hotelId) {
        throw new Error("Unauthorized");
      }

      await db
        .update(deviceStatus)
        .set({
          isPoweredOn: false,
          lastCommand: "power_off",
          lastCommandTime: new Date(),
        })
        .where(eq(deviceStatus.id, input.id));

      // Send command to device
      sendToDevice(device[0].deviceId, {
        type: "power_off",
        payload: {},
        timestamp: new Date(),
      });

      return { success: true };
    }),

  // Restart device
  restart: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const device = await db
        .select()
        .from(deviceStatus)
        .where(eq(deviceStatus.id, input.id))
        .limit(1);

      if (device.length === 0) throw new Error("Device not found");

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== device[0].hotelId) {
        throw new Error("Unauthorized");
      }

      await db
        .update(deviceStatus)
        .set({
          lastCommand: "restart",
          lastCommandTime: new Date(),
        })
        .where(eq(deviceStatus.id, input.id));

      // Send command to device
      sendToDevice(device[0].deviceId, {
        type: "restart",
        payload: {},
        timestamp: new Date(),
      });

      return { success: true };
    }),

  // Power on device
  powerOn: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const device = await db
        .select()
        .from(deviceStatus)
        .where(eq(deviceStatus.id, input.id))
        .limit(1);

      if (device.length === 0) throw new Error("Device not found");

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== device[0].hotelId) {
        throw new Error("Unauthorized");
      }

      await db
        .update(deviceStatus)
        .set({
          isPoweredOn: true,
          lastCommand: "power_on",
          lastCommandTime: new Date(),
        })
        .where(eq(deviceStatus.id, input.id));

      // Send command to device
      sendToDevice(device[0].deviceId, {
        type: "power_on",
        payload: {},
        timestamp: new Date(),
      });

      return { success: true };
    }),

  // Bulk power off all devices in hotel
  bulkPowerOff: protectedProcedure
    .input(z.object({ hotelId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== input.hotelId) {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(deviceStatus)
        .set({
          isPoweredOn: false,
          lastCommand: "power_off",
          lastCommandTime: new Date(),
        })
        .where(eq(deviceStatus.hotelId, input.hotelId));

      // Broadcast to all devices
      broadcastToDevices(input.hotelId, {
        type: "power_off",
        payload: {},
        hotelId: input.hotelId,
        timestamp: new Date(),
      });

      return { success: true };
    }),

  // Delete device
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "hotelAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const device = await db
        .select()
        .from(deviceStatus)
        .where(eq(deviceStatus.id, input.id))
        .limit(1);

      if (device.length === 0) throw new Error("Device not found");

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== device[0].hotelId) {
        throw new Error("Unauthorized");
      }

      await db.delete(deviceStatus).where(eq(deviceStatus.id, input.id));

      return { success: true };
    }),
});
