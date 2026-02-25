import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { subscriptionPackages, hotelSubscriptions, hotels, users } from "../../drizzle/schema";
import { eq, and, lt, gt, sql } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

export const subscriptionsRouter = router({
  // Subscription Packages Management (Super Admin only)
  listPackages: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "superAdmin") {
      throw new Error("Unauthorized");
    }

    const db = await getDb();
    if (!db) return [];

    const packages = await db.select().from(subscriptionPackages).orderBy(subscriptionPackages.displayOrder);
    return packages;
  }),

  createPackage: protectedProcedure
    .input(z.object({
      packageName: z.string().min(1),
      packageCode: z.string().min(1),
      durationDays: z.number().int().nullable(),
      price: z.number().int().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "superAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(subscriptionPackages).values({
        ...input,
        isActive: true,
        displayOrder: 0,
      });

      return { success: true };
    }),

  updatePackage: protectedProcedure
    .input(z.object({
      id: z.number(),
      packageName: z.string().optional(),
      packageCode: z.string().optional(),
      durationDays: z.number().int().nullable().optional(),
      price: z.number().int().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "superAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;
      await db.update(subscriptionPackages).set(updateData).where(eq(subscriptionPackages.id, id));

      return { success: true };
    }),

  // Hotel Subscriptions Management (Super Admin)
  listHotelSubscriptions: protectedProcedure
    .input(z.object({
      limit: z.number().int().default(50),
      offset: z.number().int().default(0),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "superAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) return { data: [], total: 0 };

      const allSubs = await db.select().from(hotelSubscriptions);
      const data = await db
        .select({
          subscription: hotelSubscriptions,
          package: subscriptionPackages,
          hotel: hotels,
        })
        .from(hotelSubscriptions)
        .innerJoin(subscriptionPackages, eq(hotelSubscriptions.packageId, subscriptionPackages.id))
        .innerJoin(hotels, eq(hotelSubscriptions.hotelId, hotels.id))
        .limit(input.limit)
        .offset(input.offset);

      return { data, total: allSubs.length };
    }),

  assignSubscription: protectedProcedure
    .input(z.object({
      hotelId: z.number(),
      packageId: z.number(),
      startDate: z.date(),
      autoRenew: z.boolean().default(false),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "superAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get package to calculate expiry date
      const pkg = await db.select().from(subscriptionPackages).where(eq(subscriptionPackages.id, input.packageId)).limit(1);
      if (pkg.length === 0) throw new Error("Package not found");

      let expiryDate = null;
      if (pkg[0].durationDays !== null) {
        expiryDate = new Date(input.startDate);
        expiryDate.setDate(expiryDate.getDate() + pkg[0].durationDays);
      }

      // Check if hotel already has subscription
      const existing = await db
        .select()
        .from(hotelSubscriptions)
        .where(eq(hotelSubscriptions.hotelId, input.hotelId))
        .limit(1);

      if (existing.length > 0) {
        // Update existing subscription
        await db.update(hotelSubscriptions).set({
          packageId: input.packageId,
          startDate: input.startDate,
          expiryDate,
          autoRenew: input.autoRenew,
          notes: input.notes,
          isActive: true,
        }).where(eq(hotelSubscriptions.hotelId, input.hotelId));
      } else {
        // Create new subscription
        await db.insert(hotelSubscriptions).values({
          hotelId: input.hotelId,
          packageId: input.packageId,
          startDate: input.startDate,
          expiryDate,
          autoRenew: input.autoRenew,
          notes: input.notes,
          isActive: true,
        });
      }

      return { success: true };
    }),

  // Get subscription status (Hotel Admin can view their own)
  getSubscriptionStatus: protectedProcedure
    .input(z.object({
      hotelId: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      let hotelId = input.hotelId;

      // hotelAdmin can only view their own subscription
      if (ctx.user.role === "hotelAdmin") {
        if (!ctx.user.hotelId) throw new Error("Hotel ID not found");
        if (input.hotelId && input.hotelId !== ctx.user.hotelId) {
          throw new Error("Unauthorized");
        }
        hotelId = ctx.user.hotelId;
      } else if (ctx.user.role !== "superAdmin") {
        throw new Error("Unauthorized");
      }

      if (!hotelId) throw new Error("Hotel ID required");

      const subscription = await db
        .select({
          subscription: hotelSubscriptions,
          package: subscriptionPackages,
          hotel: hotels,
        })
        .from(hotelSubscriptions)
        .innerJoin(subscriptionPackages, eq(hotelSubscriptions.packageId, subscriptionPackages.id))
        .innerJoin(hotels, eq(hotelSubscriptions.hotelId, hotels.id))
        .where(eq(hotelSubscriptions.hotelId, hotelId))
        .limit(1);

      if (subscription.length === 0) return null;

      const sub = subscription[0];
      const now = new Date();
      const isExpired = sub.subscription.expiryDate && new Date(sub.subscription.expiryDate) < now;
      const daysRemaining = sub.subscription.expiryDate
        ? Math.ceil((new Date(sub.subscription.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        ...sub,
        isExpired,
        daysRemaining,
      };
    }),

  // Renew subscription (Super Admin)
  renewSubscription: protectedProcedure
    .input(z.object({
      hotelId: z.number(),
      packageId: z.number().optional(), // If not provided, use current package
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "superAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get current subscription
      const currentSub = await db
        .select()
        .from(hotelSubscriptions)
        .where(eq(hotelSubscriptions.hotelId, input.hotelId))
        .limit(1);

      if (currentSub.length === 0) throw new Error("Subscription not found");

      const packageId = input.packageId || currentSub[0].packageId;
      const pkg = await db.select().from(subscriptionPackages).where(eq(subscriptionPackages.id, packageId)).limit(1);
      if (pkg.length === 0) throw new Error("Package not found");

      const newStartDate = new Date();
      let newExpiryDate = null;

      if (pkg[0].durationDays !== null) {
        newExpiryDate = new Date(newStartDate);
        newExpiryDate.setDate(newExpiryDate.getDate() + pkg[0].durationDays);
      }

      await db.update(hotelSubscriptions).set({
        packageId,
        startDate: newStartDate,
        expiryDate: newExpiryDate,
        isActive: true,
      }).where(eq(hotelSubscriptions.hotelId, input.hotelId));

      return { success: true };
    }),

  // Disable subscription (Super Admin)
  disableSubscription: protectedProcedure
    .input(z.object({
      hotelId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "superAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(hotelSubscriptions).set({
        isActive: false,
      }).where(eq(hotelSubscriptions.hotelId, input.hotelId));

      return { success: true };
    }),

  // Get expiring subscriptions (Super Admin) - for renewal reminders
  getExpiringSubscriptions: protectedProcedure
    .input(z.object({
      daysThreshold: z.number().int().default(7), // Days before expiry
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "superAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) return [];

      const now = new Date();
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + input.daysThreshold);

      // Get subscriptions expiring within the threshold
      const expiring = await db
        .select({
          subscription: hotelSubscriptions,
          package: subscriptionPackages,
          hotel: hotels,
        })
        .from(hotelSubscriptions)
        .innerJoin(subscriptionPackages, eq(hotelSubscriptions.packageId, subscriptionPackages.id))
        .innerJoin(hotels, eq(hotelSubscriptions.hotelId, hotels.id))
        .where(and(
          eq(hotelSubscriptions.isActive, true),
          lt(hotelSubscriptions.expiryDate, thresholdDate),
          gt(hotelSubscriptions.expiryDate, now)
        ));

      // Calculate days remaining for each
      return expiring.map(item => {
        const daysRemaining = item.subscription.expiryDate
          ? Math.ceil((new Date(item.subscription.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        return {
          ...item,
          daysRemaining,
        };
      });
    }),

  // Send renewal reminder (Super Admin)
  sendRenewalReminder: protectedProcedure
    .input(z.object({
      hotelId: z.number(),
      customMessage: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "superAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get subscription and hotel info
      const subInfo = await db
        .select({
          subscription: hotelSubscriptions,
          package: subscriptionPackages,
          hotel: hotels,
        })
        .from(hotelSubscriptions)
        .innerJoin(subscriptionPackages, eq(hotelSubscriptions.packageId, subscriptionPackages.id))
        .innerJoin(hotels, eq(hotelSubscriptions.hotelId, hotels.id))
        .where(eq(hotelSubscriptions.hotelId, input.hotelId))
        .limit(1);

      if (subInfo.length === 0) {
        throw new Error("No subscription found for this hotel");
      }

      const { subscription, package: pkg, hotel } = subInfo[0];
      const daysRemaining = subscription.expiryDate
        ? Math.ceil((new Date(subscription.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

      // Get hotel admins to notify
      const hotelAdmins = await db
        .select()
        .from(users)
        .where(and(
          eq(users.hotelId, input.hotelId),
          eq(users.role, "hotelAdmin")
        ));

      const title = `Subscription Renewal Reminder - ${hotel.hotelName}`;
      const content = input.customMessage || 
        `Dear Hotel Admin,

Your subscription for "${hotel.hotelName}" is expiring soon.

Package: ${pkg.packageName}
Expiry Date: ${subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : 'Lifetime'}
${daysRemaining !== null ? `Days Remaining: ${daysRemaining}` : ''}

Please renew your subscription to ensure uninterrupted service.

Best regards,
Hotel TV System Team`;

      // Send notification to owner/admin
      const notified = await notifyOwner({ title, content });

      // Update last reminder sent date
      await db.update(hotelSubscriptions)
        .set({ lastReminderSent: new Date() })
        .where(eq(hotelSubscriptions.hotelId, input.hotelId));

      return {
        success: true,
        notified,
        recipientCount: hotelAdmins.length,
        daysRemaining,
      };
    }),

  // Batch send renewal reminders (Super Admin)
  batchSendReminders: protectedProcedure
    .input(z.object({
      daysThreshold: z.number().int().default(7),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "superAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const now = new Date();
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + input.daysThreshold);

      // Get expiring subscriptions
      const expiring = await db
        .select({
          subscription: hotelSubscriptions,
          package: subscriptionPackages,
          hotel: hotels,
        })
        .from(hotelSubscriptions)
        .innerJoin(subscriptionPackages, eq(hotelSubscriptions.packageId, subscriptionPackages.id))
        .innerJoin(hotels, eq(hotelSubscriptions.hotelId, hotels.id))
        .where(and(
          eq(hotelSubscriptions.isActive, true),
          lt(hotelSubscriptions.expiryDate, thresholdDate),
          gt(hotelSubscriptions.expiryDate, now)
        ));

      const results = [];

      for (const item of expiring) {
        const daysRemaining = item.subscription.expiryDate
          ? Math.ceil((new Date(item.subscription.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        const title = `Subscription Renewal Reminder - ${item.hotel.hotelName}`;
        const content = `Dear Hotel Admin,

Your subscription for "${item.hotel.hotelName}" is expiring soon.

Package: ${item.package.packageName}
Expiry Date: ${new Date(item.subscription.expiryDate!).toLocaleDateString()}
Days Remaining: ${daysRemaining}

Please renew your subscription to ensure uninterrupted service.

Best regards,
Hotel TV System Team`;

        const notified = await notifyOwner({ title, content });

        await db.update(hotelSubscriptions)
          .set({ lastReminderSent: now })
          .where(eq(hotelSubscriptions.hotelId, item.hotel.id));

        results.push({
          hotelId: item.hotel.id,
          hotelName: item.hotel.hotelName,
          daysRemaining,
          notified,
        });
      }

      return {
        success: true,
        totalSent: results.length,
        results,
      };
    }),
});
