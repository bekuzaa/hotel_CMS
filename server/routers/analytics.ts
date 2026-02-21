import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { rooms, guestInformation, tvChannels, menuItems, deviceStatus, activityLogs, backgroundImages } from "../../drizzle/schema";
import { eq, count } from "drizzle-orm";

/**
 * Analytics Router
 * Provides dashboard statistics and analytics data
 */
export const analyticsRouter = router({
  // Get dashboard overview statistics
  getDashboardStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        totalRooms: 0,
        activeRooms: 0,
        totalGuests: 0,
        totalChannels: 0,
        totalMenus: 0,
        onlineDevices: 0,
        offlineDevices: 0,
      };
    }

    try {
      // Get room statistics
      const allRooms = await db.select({ count: count() }).from(rooms);
      const activeRoomsData = await db.select({ count: count() }).from(rooms)
        .where(eq(rooms.isActive, true));

      // Get guest statistics
      const totalGuestsData = await db.select({ count: count() }).from(guestInformation);

      // Get channel statistics
      const channelsData = await db.select({ count: count() }).from(tvChannels)
        .where(eq(tvChannels.isActive, true));

      // Get menu statistics
      const menusData = await db.select({ count: count() }).from(menuItems)
        .where(eq(menuItems.isActive, true));

      // Get device status
      const onlineDevicesData = await db.select({ count: count() }).from(deviceStatus)
        .where(eq(deviceStatus.isOnline, true));
      const offlineDevicesData = await db.select({ count: count() }).from(deviceStatus)
        .where(eq(deviceStatus.isOnline, false));

      return {
        totalRooms: allRooms[0]?.count || 0,
        activeRooms: activeRoomsData[0]?.count || 0,
        totalGuests: totalGuestsData[0]?.count || 0,
        totalChannels: channelsData[0]?.count || 0,
        totalMenus: menusData[0]?.count || 0,
        onlineDevices: onlineDevicesData[0]?.count || 0,
        offlineDevices: offlineDevicesData[0]?.count || 0,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return {
        totalRooms: 0,
        activeRooms: 0,
        totalGuests: 0,
        totalChannels: 0,
        totalMenus: 0,
        onlineDevices: 0,
        offlineDevices: 0,
      };
    }
  }),

  // Get room occupancy statistics
  getRoomOccupancy: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { occupied: 0, vacant: 0, maintenance: 0 };

    try {
      const occupiedRooms = await db.select({ count: count() }).from(guestInformation);
      const totalRoomsData = await db.select({ count: count() }).from(rooms)
        .where(eq(rooms.isActive, true));

      const total = totalRoomsData[0]?.count || 0;
      const occupied = occupiedRooms[0]?.count || 0;
      const vacant = total - occupied;

      return {
        occupied,
        vacant,
        maintenance: 0,
        occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
      };
    } catch (error) {
      console.error("Error fetching room occupancy:", error);
      return { occupied: 0, vacant: 0, maintenance: 0, occupancyRate: 0 };
    }
  }),

  // Get device status summary
  getDeviceStatus: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { online: 0, offline: 0, idle: 0 };

    try {
      const onlineDevices = await db.select({ count: count() }).from(deviceStatus)
        .where(eq(deviceStatus.isOnline, true));
      const offlineDevices = await db.select({ count: count() }).from(deviceStatus)
        .where(eq(deviceStatus.isOnline, false));

      return {
        online: onlineDevices[0]?.count || 0,
        offline: offlineDevices[0]?.count || 0,
        idle: 0,
      };
    } catch (error) {
      console.error("Error fetching device status:", error);
      return { online: 0, offline: 0, idle: 0 };
    }
  }),

  // Get recent activity
  getRecentActivity: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    try {
      const activities = await db.select().from(activityLogs)
        .orderBy(activityLogs.createdAt)
        .limit(10);

      return activities.map(a => ({
        id: a.id,
        userId: a.userId,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        changes: a.changes,
        ipAddress: a.ipAddress,
        createdAt: a.createdAt,
      }));
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      return [];
    }
  }),

  // Get channel popularity (based on activity logs)
  getChannelPopularity: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    try {
      const channels = await db.select().from(tvChannels)
        .where(eq(tvChannels.isActive, true))
        .orderBy(tvChannels.displayOrder)
        .limit(10);

      return channels.map(ch => ({
        id: ch.id,
        name: ch.name,
        views: Math.floor(Math.random() * 1000), // Placeholder - would be from activity logs
      }));
    } catch (error) {
      console.error("Error fetching channel popularity:", error);
      return [];
    }
  }),

  // Get system health status
  getSystemHealth: publicProcedure.query(async () => {
    const db = await getDb();
    
    return {
      database: db ? "healthy" : "unhealthy",
      api: "healthy",
      storage: "healthy",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date(),
    };
  }),

  // Get guest check-in/check-out statistics
  getGuestStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { checkInToday: 0, checkOutToday: 0, stayingGuests: 0 };

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const allGuests = await db.select().from(guestInformation);

      const checkInToday = allGuests.filter(g => {
        if (!g.checkInDate) return false;
        const checkIn = new Date(g.checkInDate);
        checkIn.setHours(0, 0, 0, 0);
        return checkIn.getTime() === today.getTime();
      }).length;

      const checkOutToday = allGuests.filter(g => {
        if (!g.checkOutDate) return false;
        const checkOut = new Date(g.checkOutDate);
        checkOut.setHours(0, 0, 0, 0);
        return checkOut.getTime() === today.getTime();
      }).length;

      const stayingGuests = allGuests.filter(g => {
        if (!g.checkInDate || !g.checkOutDate) return false;
        const checkIn = new Date(g.checkInDate);
        const checkOut = new Date(g.checkOutDate);
        return checkIn <= today && checkOut >= tomorrow;
      }).length;

      return {
        checkInToday,
        checkOutToday,
        stayingGuests,
      };
    } catch (error) {
      console.error("Error fetching guest stats:", error);
      return { checkInToday: 0, checkOutToday: 0, stayingGuests: 0 };
    }
  }),

  // Get content statistics
  getContentStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { channels: 0, menus: 0, backgrounds: 0, mediaFiles: 0 };

    try {
      const channelsData = await db.select({ count: count() }).from(tvChannels);
      const menusData = await db.select({ count: count() }).from(menuItems);
      const backgroundsData = await db.select({ count: count() }).from(backgroundImages);
      const mediaFilesData = await db.select({ count: count() }).from(backgroundImages);

      return {
        channels: channelsData[0]?.count || 0,
        menus: menusData[0]?.count || 0,
        backgrounds: backgroundsData[0]?.count || 0,
        mediaFiles: mediaFilesData[0]?.count || 0,
      };
    } catch (error) {
      console.error("Error fetching content stats:", error);
      return { channels: 0, menus: 0, backgrounds: 0, mediaFiles: 0 };
    }
  }),
});
