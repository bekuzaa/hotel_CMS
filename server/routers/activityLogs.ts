import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { activityLogs } from "../../drizzle/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

/**
 * Activity Logs Router
 * Tracks and retrieves user activity and system events
 */
export const activityLogsRouter = router({
  // Get all activity logs with pagination
  getAll: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
      userId: z.number().optional(),
      entityType: z.string().optional(),
      action: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { data: [], total: 0 };

      try {
        // Get all logs first
        const allLogs = await db.select().from(activityLogs);
        
        // Filter in memory
        let filtered = allLogs;
        if (input.userId) {
          filtered = filtered.filter(log => log.userId === input.userId);
        }
        if (input.entityType) {
          filtered = filtered.filter(log => log.entityType === input.entityType);
        }
        if (input.action) {
          filtered = filtered.filter(log => log.action === input.action);
        }

        const total = filtered.length;
        
        // Sort and paginate
        const data = filtered
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(input.offset, input.offset + input.limit);

        return { data, total };
      } catch (error) {
        console.error("Error fetching activity logs:", error);
        return { data: [], total: 0 };
      }
    }),

  // Get activity logs for a specific user
  getByUserId: protectedProcedure
    .input(z.object({
      userId: z.number(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const logs = await db.select().from(activityLogs)
          .where(eq(activityLogs.userId, input.userId))
          .orderBy(desc(activityLogs.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return logs;
      } catch (error) {
        console.error("Error fetching user activity logs:", error);
        return [];
      }
    }),

  // Get activity logs for a specific entity
  getByEntity: protectedProcedure
    .input(z.object({
      entityType: z.string(),
      entityId: z.number(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const logs = await db.select().from(activityLogs)
          .where(
            and(
              eq(activityLogs.entityType, input.entityType),
              eq(activityLogs.entityId, input.entityId)
            )
          )
          .orderBy(desc(activityLogs.createdAt))
          .limit(input.limit);

        return logs;
      } catch (error) {
        console.error("Error fetching entity activity logs:", error);
        return [];
      }
    }),

  // Get activity logs by date range
  getByDateRange: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const logs = await db.select().from(activityLogs)
          .where(
            and(
              gte(activityLogs.createdAt, input.startDate),
              lte(activityLogs.createdAt, input.endDate)
            )
          )
          .orderBy(desc(activityLogs.createdAt))
          .limit(input.limit);

        return logs;
      } catch (error) {
        console.error("Error fetching activity logs by date range:", error);
        return [];
      }
    }),

  // Get activity summary by action type
  getActionSummary: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return {};

    try {
      const allLogs = await db.select().from(activityLogs);

      const summary: Record<string, number> = {};
      allLogs.forEach(log => {
        summary[log.action] = (summary[log.action] || 0) + 1;
      });

      return summary;
    } catch (error) {
      console.error("Error fetching action summary:", error);
      return {};
    }
  }),

  // Get activity summary by entity type
  getEntityTypeSummary: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return {};

    try {
      const allLogs = await db.select().from(activityLogs);

      const summary: Record<string, number> = {};
      allLogs.forEach(log => {
        summary[log.entityType] = (summary[log.entityType] || 0) + 1;
      });

      return summary;
    } catch (error) {
      console.error("Error fetching entity type summary:", error);
      return {};
    }
  }),

  // Log an activity (internal use)
  logActivity: publicProcedure
    .input(z.object({
      userId: z.number(),
      action: z.string(),
      entityType: z.string(),
      entityId: z.number().optional(),
      changes: z.string().optional(),
      ipAddress: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        await db.insert(activityLogs).values({
          userId: input.userId,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId || null,
          changes: input.changes || null,
          ipAddress: input.ipAddress || null,
        });

        return { success: true };
      } catch (error) {
        console.error("Error logging activity:", error);
        throw error;
      }
    }),

  // Get recent activities (last 24 hours)
  getRecentActivities: publicProcedure
    .input(z.object({
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const logs = await db.select().from(activityLogs)
          .where(gte(activityLogs.createdAt, oneDayAgo))
          .orderBy(desc(activityLogs.createdAt))
          .limit(input.limit);

        return logs;
      } catch (error) {
        console.error("Error fetching recent activities:", error);
        return [];
      }
    }),

  // Get activity statistics
  getStatistics: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        totalActivities: 0,
        activitiesLast24h: 0,
        uniqueUsers: 0,
        topActions: [],
        topEntities: [],
      };
    }

    try {
      const allLogs = await db.select().from(activityLogs);
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const last24hLogs = allLogs.filter(log => log.createdAt >= oneDayAgo);
      const uniqueUsers = new Set(allLogs.map(log => log.userId)).size;

      // Get top actions
      const actionCounts: Record<string, number> = {};
      allLogs.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });
      const topActions = Object.entries(actionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([action, count]) => ({ action, count }));

      // Get top entities
      const entityCounts: Record<string, number> = {};
      allLogs.forEach(log => {
        entityCounts[log.entityType] = (entityCounts[log.entityType] || 0) + 1;
      });
      const topEntities = Object.entries(entityCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([entityType, count]) => ({ entityType, count }));

      return {
        totalActivities: allLogs.length,
        activitiesLast24h: last24hLogs.length,
        uniqueUsers,
        topActions,
        topEntities,
      };
    } catch (error) {
      console.error("Error fetching activity statistics:", error);
      return {
        totalActivities: 0,
        activitiesLast24h: 0,
        uniqueUsers: 0,
        topActions: [],
        topEntities: [],
      };
    }
  }),
});
