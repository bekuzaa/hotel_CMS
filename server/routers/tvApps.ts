import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { tvApps } from "../../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";

// Default apps that are created for new hotels
const DEFAULT_APPS = [
  { appName: "LIVE TV", appType: "live_tv", iconName: "Tv", displayOrder: 0, isDefault: true },
  { appName: "RADIO", appType: "radio", iconName: "Radio", displayOrder: 1, isDefault: true },
  { appName: "YOUTUBE", appType: "youtube", packageName: "com.google.android.youtube.tv", iconName: "Youtube", displayOrder: 2, isDefault: true },
  { appName: "NETFLIX", appType: "app", packageName: "com.netflix.mediaclient", iconName: "Film", displayOrder: 3, isDefault: true },
  { appName: "SPOTIFY", appType: "app", packageName: "com.spotify.tv.android", iconName: "Music", displayOrder: 4, isDefault: true },
  { appName: "DISNEY+", appType: "app", packageName: "com.disney.disneyplus", iconName: "Film", displayOrder: 5, isDefault: true },
  { appName: "PRIME VIDEO", appType: "app", packageName: "com.amazon.avod.thirdpartyclient", iconName: "Film", displayOrder: 6, isDefault: true },
  { appName: "HBO GO", appType: "app", packageName: "eu.hbogo.androidtv", iconName: "Film", displayOrder: 7, isDefault: true },
  { appName: "APPLE TV+", appType: "app", packageName: "com.apple.atve.sony.app", iconName: "Tv", displayOrder: 8, isDefault: true },
  { appName: "FOOD MENU", appType: "hotel_service", iconName: "UtensilsCrossed", displayOrder: 9, isDefault: true },
  { appName: "PLACES", appType: "hotel_service", iconName: "MapPin", displayOrder: 10, isDefault: true },
  { appName: "ROOMS", appType: "hotel_service", iconName: "Bed", displayOrder: 11, isDefault: true },
  { appName: "ALL APPS", appType: "app", iconName: "Grid3X3", displayOrder: 12, isDefault: true },
  { appName: "SLIDE SHOW", appType: "slideshow", iconName: "Image", displayOrder: 13, isDefault: true },
  { appName: "SETTINGS", appType: "app", iconName: "Settings", displayOrder: 14, isDefault: true },
];

export const tvAppsRouter = router({
  // Get apps for a hotel (public - called by TV launcher)
  getByHotel: publicProcedure
    .input(z.object({ hotelId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const apps = await db
        .select()
        .from(tvApps)
        .where(and(eq(tvApps.hotelId, input.hotelId), eq(tvApps.isVisible, true)))
        .orderBy(asc(tvApps.displayOrder));

      return apps;
    }),

  // Get all apps for a hotel (including hidden) - CMS admin
  list: protectedProcedure
    .input(z.object({ hotelId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "hotelAdmin" && ctx.user.role !== "superAdmin" && ctx.user.role !== "manager") {
        throw new Error("Unauthorized");
      }

      // Hotel admin can only see their own hotel's apps
      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== input.hotelId) {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) return [];

      const apps = await db
        .select()
        .from(tvApps)
        .where(eq(tvApps.hotelId, input.hotelId))
        .orderBy(asc(tvApps.displayOrder));

      return apps;
    }),

  // Create app for hotel
  create: protectedProcedure
    .input(
      z.object({
        hotelId: z.number(),
        appName: z.string().min(1).max(100),
        appType: z.enum(["live_tv", "youtube", "app", "url", "slideshow", "radio", "hotel_service"]),
        packageName: z.string().max(255).optional(),
        deepLink: z.string().max(500).optional(),
        iconUrl: z.string().max(500).optional(),
        iconName: z.string().max(50).optional(),
        displayOrder: z.number().int().default(0),
        isVisible: z.boolean().default(true),
        customLabel: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "hotelAdmin" && ctx.user.role !== "superAdmin" && ctx.user.role !== "manager") {
        throw new Error("Unauthorized");
      }

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== input.hotelId) {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(tvApps).values({
        hotelId: input.hotelId,
        appName: input.appName,
        appType: input.appType,
        packageName: input.packageName || null,
        deepLink: input.deepLink || null,
        iconUrl: input.iconUrl || null,
        iconName: input.iconName || null,
        displayOrder: input.displayOrder,
        isVisible: input.isVisible,
        customLabel: input.customLabel || null,
        isDefault: false,
      });

      return { success: true };
    }),

  // Update app
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        appName: z.string().min(1).max(100).optional(),
        appType: z.enum(["live_tv", "youtube", "app", "url", "slideshow", "radio", "hotel_service"]).optional(),
        packageName: z.string().max(255).optional(),
        deepLink: z.string().max(500).optional(),
        iconUrl: z.string().max(500).optional(),
        iconName: z.string().max(50).optional(),
        displayOrder: z.number().int().optional(),
        isVisible: z.boolean().optional(),
        customLabel: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "hotelAdmin" && ctx.user.role !== "superAdmin" && ctx.user.role !== "manager") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const app = await db.select().from(tvApps).where(eq(tvApps.id, input.id)).limit(1);
      if (app.length === 0) throw new Error("App not found");

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== app[0].hotelId) {
        throw new Error("Unauthorized");
      }

      const { id, ...updateData } = input;
      await db.update(tvApps).set(updateData).where(eq(tvApps.id, id));

      return { success: true };
    }),

  // Delete app
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "hotelAdmin" && ctx.user.role !== "superAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const app = await db.select().from(tvApps).where(eq(tvApps.id, input.id)).limit(1);
      if (app.length === 0) throw new Error("App not found");

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== app[0].hotelId) {
        throw new Error("Unauthorized");
      }

      await db.delete(tvApps).where(eq(tvApps.id, input.id));

      return { success: true };
    }),

  // Reorder apps
  reorder: protectedProcedure
    .input(
      z.object({
        hotelId: z.number(),
        appIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "hotelAdmin" && ctx.user.role !== "superAdmin") {
        throw new Error("Unauthorized");
      }

      if (ctx.user.role === "hotelAdmin" && ctx.user.hotelId !== input.hotelId) {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Update display order for each app
      for (let i = 0; i < input.appIds.length; i++) {
        await db
          .update(tvApps)
          .set({ displayOrder: i })
          .where(eq(tvApps.id, input.appIds[i]));
      }

      return { success: true };
    }),

  // Initialize default apps for a hotel
  initializeDefaults: protectedProcedure
    .input(z.object({ hotelId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "superAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if apps already exist for this hotel
      const existing = await db
        .select()
        .from(tvApps)
        .where(eq(tvApps.hotelId, input.hotelId))
        .limit(1);

      if (existing.length > 0) {
        return { success: true, message: "Apps already initialized" };
      }

      // Insert default apps
      for (const app of DEFAULT_APPS) {
        await db.insert(tvApps).values({
          hotelId: input.hotelId,
          appName: app.appName,
          appType: app.appType as "live_tv" | "youtube" | "app" | "url" | "slideshow" | "radio" | "hotel_service",
          iconName: app.iconName,
          displayOrder: app.displayOrder,
          isDefault: app.isDefault,
          isVisible: true,
        });
      }

      return { success: true, message: "Default apps initialized" };
    }),

  // Reset to defaults
  resetToDefaults: protectedProcedure
    .input(z.object({ hotelId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "superAdmin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Delete all existing apps for this hotel
      await db.delete(tvApps).where(eq(tvApps.hotelId, input.hotelId));

      // Insert default apps
      for (const app of DEFAULT_APPS) {
        await db.insert(tvApps).values({
          hotelId: input.hotelId,
          appName: app.appName,
          appType: app.appType as "live_tv" | "youtube" | "app" | "url" | "slideshow" | "radio" | "hotel_service",
          iconName: app.iconName,
          displayOrder: app.displayOrder,
          isDefault: app.isDefault,
          isVisible: true,
        });
      }

      return { success: true };
    }),

  // Get available icons (Lucide icons)
  getAvailableIcons: publicProcedure.query(() => {
    return [
      { name: "Tv", label: "TV" },
      { name: "Radio", label: "Radio" },
      { name: "Youtube", label: "YouTube" },
      { name: "UtensilsCrossed", label: "Food/Restaurant" },
      { name: "MapPin", label: "Location/Places" },
      { name: "Bed", label: "Room/Hotel" },
      { name: "Grid3X3", label: "Apps Grid" },
      { name: "Image", label: "Gallery/Slideshow" },
      { name: "Settings", label: "Settings" },
      { name: "Wifi", label: "WiFi" },
      { name: "Phone", label: "Phone" },
      { name: "MessageSquare", label: "Messages" },
      { name: "Calendar", label: "Calendar" },
      { name: "Clock", label: "Clock" },
      { name: "Cloud", label: "Weather" },
      { name: "Music", label: "Music" },
      { name: "Film", label: "Movies" },
      { name: "Camera", label: "Camera" },
      { name: "ShoppingBag", label: "Shopping" },
      { name: "Dumbbell", label: "Fitness" },
      { name: "Car", label: "Transportation" },
      { name: "Plane", label: "Travel" },
      { name: "Heart", label: "Favorites" },
      { name: "Star", label: "Star" },
      { name: "Home", label: "Home" },
      { name: "User", label: "User/Profile" },
      { name: "Info", label: "Information" },
      { name: "HelpCircle", label: "Help" },
      { name: "Bell", label: "Notifications" },
      { name: "Airplay", label: "Cast" },
    ];
  }),
});
