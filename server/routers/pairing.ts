import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { deviceStatus, hotels } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

// Generate 6-character alphanumeric pairing code (letters + numbers)
function generatePairingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluded confusing chars: I, O, 0, 1
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const pairingRouter = router({
  // Request pairing code - called by TV app
  requestCode: publicProcedure
    .input(
      z.object({
        deviceId: z.string(),
        deviceName: z.string().optional(),
        deviceInfo: z.string().optional(), // JSON string with device model, Android version, etc.
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if device already exists
      const existingDevice = await db
        .select()
        .from(deviceStatus)
        .where(eq(deviceStatus.deviceId, input.deviceId))
        .limit(1);

      if (existingDevice.length > 0) {
        // Update existing device with new pairing code
        const pairingCode = generatePairingCode();
        await db
          .update(deviceStatus)
          .set({
            pairingCode,
            isOnline: true,
            lastSyncTime: new Date(),
            deviceName: input.deviceName || existingDevice[0].deviceName,
            deviceInfo: input.deviceInfo || existingDevice[0].deviceInfo,
            updatedAt: new Date(),
          })
          .where(eq(deviceStatus.deviceId, input.deviceId));

        return { pairingCode, deviceId: input.deviceId, isPaired: existingDevice[0].isPaired };
      }

      // Create new device with pairing code
      const pairingCode = generatePairingCode();
      await db.insert(deviceStatus).values({
        deviceId: input.deviceId,
        deviceName: input.deviceName || `TV-${input.deviceId.slice(-6)}`,
        pairingCode,
        isOnline: true,
        isPaired: false,
        lastSyncTime: new Date(),
        deviceInfo: input.deviceInfo,
      });

      return { pairingCode, deviceId: input.deviceId, isPaired: false };
    }),

  // Check pairing status - called by TV app
  checkStatus: publicProcedure
    .input(z.object({ deviceId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { isPaired: false, hotelId: null };

      const device = await db
        .select()
        .from(deviceStatus)
        .where(eq(deviceStatus.deviceId, input.deviceId))
        .limit(1);

      if (device.length === 0) {
        return { isPaired: false, hotelId: null };
      }

      return {
        isPaired: device[0].isPaired,
        hotelId: device[0].hotelId,
        roomNumber: device[0].roomNumber,
        deviceName: device[0].deviceName,
      };
    }),

  // Validate pairing code - called by CMS admin
  validateCode: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const device = await db
        .select()
        .from(deviceStatus)
        .where(eq(deviceStatus.pairingCode, input.code))
        .limit(1);

      if (device.length === 0) {
        return { valid: false, device: null };
      }

      // Check if already paired
      if (device[0].isPaired) {
        return { valid: false, device: null, message: "Device already paired" };
      }

      return {
        valid: true,
        device: {
          id: device[0].id,
          deviceId: device[0].deviceId,
          deviceName: device[0].deviceName,
          deviceInfo: device[0].deviceInfo ? JSON.parse(device[0].deviceInfo as string) : null,
          createdAt: device[0].createdAt,
        },
      };
    }),

  // Pair device to hotel - called by CMS admin
  pairDevice: protectedProcedure
    .input(
      z.object({
        code: z.string().length(6),
        hotelId: z.number(),
        roomNumber: z.string().optional(),
        deviceName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.role !== "hotelAdmin" && ctx.user.role !== "superAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const device = await db
        .select()
        .from(deviceStatus)
        .where(eq(deviceStatus.pairingCode, input.code))
        .limit(1);

      if (device.length === 0) {
        throw new Error("Invalid pairing code");
      }

      if (device[0].isPaired) {
        throw new Error("Device already paired");
      }

      // Hotel admin can only pair to their own hotel
      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== input.hotelId) {
        throw new Error("Unauthorized to pair to this hotel");
      }

      // Update device with hotel and room info
      await db
        .update(deviceStatus)
        .set({
          hotelId: input.hotelId,
          roomNumber: input.roomNumber || device[0].roomNumber,
          deviceName: input.deviceName || device[0].deviceName,
          isPaired: true,
          pairedAt: new Date(),
          pairingCode: null, // Clear pairing code after successful pairing
          updatedAt: new Date(),
        })
        .where(eq(deviceStatus.id, device[0].id));

      return { success: true, deviceId: device[0].deviceId };
    }),

  // Unpair device - called by CMS admin
  unpairDevice: protectedProcedure
    .input(z.object({ deviceId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "hotelAdmin" && ctx.user.role !== "superAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const device = await db
        .select()
        .from(deviceStatus)
        .where(eq(deviceStatus.id, input.deviceId))
        .limit(1);

      if (device.length === 0) {
        throw new Error("Device not found");
      }

      // Hotel admin can only unpair their own hotel's devices
      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== device[0].hotelId) {
        throw new Error("Unauthorized");
      }

      await db
        .update(deviceStatus)
        .set({
          hotelId: null,
          isPaired: false,
          pairedAt: null,
          roomNumber: null,
          updatedAt: new Date(),
        })
        .where(eq(deviceStatus.id, input.deviceId));

      return { success: true };
    }),

  // Get unpaired devices - for CMS admin to see pending devices
  getPendingDevices: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "hotelAdmin" && ctx.user.role !== "superAdmin") {
      throw new Error("Unauthorized");
    }

    const db = await getDb();
    if (!db) return [];

    const pendingDevices = await db
      .select()
      .from(deviceStatus)
      .where(eq(deviceStatus.isPaired, false));

    return pendingDevices.map((d) => ({
      id: d.id,
      deviceId: d.deviceId,
      deviceName: d.deviceName,
      pairingCode: d.pairingCode,
      deviceInfo: d.deviceInfo ? JSON.parse(d.deviceInfo as string) : null,
      createdAt: d.createdAt,
    }));
  }),

  // Update device heartbeat - called by TV app periodically
  heartbeat: publicProcedure
    .input(
      z.object({
        deviceId: z.string(),
        currentChannel: z.string().optional(),
        currentApp: z.string().optional(),
        volume: z.number().optional(),
        isMuted: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db
        .update(deviceStatus)
        .set({
          isOnline: true,
          lastSyncTime: new Date(),
          currentChannel: input.currentChannel,
          currentApp: input.currentApp,
          volume: input.volume,
          isMuted: input.isMuted,
          updatedAt: new Date(),
        })
        .where(eq(deviceStatus.deviceId, input.deviceId));

      return { success: true };
    }),

  // Get pending commands - called by TV app
  getCommands: publicProcedure
    .input(z.object({ deviceId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { commands: [] };

      const device = await db
        .select()
        .from(deviceStatus)
        .where(eq(deviceStatus.deviceId, input.deviceId))
        .limit(1);

      if (device.length === 0 || !device[0].lastCommand) {
        return { commands: [] };
      }

      // Return the last command and clear it
      const command = device[0].lastCommand;
      const commandTime = device[0].lastCommandTime;

      // Clear command after retrieval
      await db
        .update(deviceStatus)
        .set({
          lastCommand: null,
          lastCommandTime: null,
          updatedAt: new Date(),
        })
        .where(eq(deviceStatus.id, device[0].id));

      return {
        commands: command
          ? [
              {
                command,
                timestamp: commandTime,
              },
            ]
          : [],
      };
    }),
});
