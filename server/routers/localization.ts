import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { localizationSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const localizationRouter = router({
  // Get all localization settings
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const settings = await db.select().from(localizationSettings).orderBy(localizationSettings.languageCode);
    return settings;
  }),

  // Get specific language settings
  getByLanguage: publicProcedure
    .input(z.object({ languageCode: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const setting = await db.select().from(localizationSettings)
        .where(eq(localizationSettings.languageCode, input.languageCode))
        .limit(1);

      return setting.length > 0 ? setting[0] : null;
    }),

  // Get translation keys for a specific language
  getTranslations: publicProcedure
    .input(z.object({ languageCode: z.string() }))
    .query(async ({ input }) => {
      // Return default translations for now
      // In production, you would fetch from database
      const translations: Record<string, string> = {
        "nav.dashboard": input.languageCode === "th" ? "แดชบอร์ด" : "Dashboard",
        "nav.channels": input.languageCode === "th" ? "ช่องรายการ TV" : "TV Channels",
        "nav.menus": input.languageCode === "th" ? "เมนู" : "Menus",
        "nav.backgrounds": input.languageCode === "th" ? "รูปพื้นหลัง" : "Background Images",
        "nav.rooms": input.languageCode === "th" ? "ห้องพัก" : "Rooms",
        "nav.guests": input.languageCode === "th" ? "ข้อมูลผู้เข้าพัก" : "Guest Information",
        "nav.media": input.languageCode === "th" ? "แกลเลอรี่" : "Media Gallery",
        "nav.settings": input.languageCode === "th" ? "การตั้งค่า" : "Settings",
        "nav.users": input.languageCode === "th" ? "จัดการผู้ใช้" : "User Management",
      };
      return translations;
    }),

  // Update localization settings (admin only)
  update: protectedProcedure
    .input(z.object({
      languageCode: z.string(),
      languageName: z.string().optional(),
      isActive: z.boolean().optional(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db.select().from(localizationSettings)
        .where(eq(localizationSettings.languageCode, input.languageCode))
        .limit(1);

      if (existing.length > 0) {
        await db.update(localizationSettings)
          .set({
            languageName: input.languageName,
            isActive: input.isActive,
            isDefault: input.isDefault,
            updatedAt: new Date(),
          })
          .where(eq(localizationSettings.languageCode, input.languageCode));
      } else {
        await db.insert(localizationSettings).values({
          languageCode: input.languageCode,
          languageName: input.languageName || input.languageCode,
          isActive: input.isActive ?? true,
          isDefault: input.isDefault ?? false,
        });
      }

      return { success: true };
    }),

  // Get default translation keys structure
  getDefaultStructure: publicProcedure.query(async () => {
    return {
      // Navigation
      "nav.dashboard": "Dashboard",
      "nav.channels": "TV Channels",
      "nav.menus": "Menus",
      "nav.backgrounds": "Background Images",
      "nav.rooms": "Rooms",
      "nav.guests": "Guest Information",
      "nav.media": "Media Gallery",
      "nav.settings": "Settings",
      "nav.users": "User Management",

      // Common
      "common.add": "Add",
      "common.edit": "Edit",
      "common.delete": "Delete",
      "common.save": "Save",
      "common.cancel": "Cancel",
      "common.search": "Search",
      "common.filter": "Filter",
      "common.export": "Export",
      "common.import": "Import",
      "common.loading": "Loading...",
      "common.error": "Error",
      "common.success": "Success",
      "common.warning": "Warning",
      "common.info": "Information",

      // TV Channels
      "channels.title": "TV Channels",
      "channels.name": "Channel Name",
      "channels.url": "Stream URL",
      "channels.thumbnail": "Thumbnail",
      "channels.category": "Category",
      "channels.active": "Active",
      "channels.order": "Display Order",
      "channels.addNew": "Add New Channel",
      "channels.editChannel": "Edit Channel",
      "channels.deleteConfirm": "Are you sure you want to delete this channel?",

      // Menus
      "menus.title": "Menus",
      "menus.name": "Menu Name",
      "menus.icon": "Icon",
      "menus.link": "Link",
      "menus.addNew": "Add New Menu",
      "menus.editMenu": "Edit Menu",
      "menus.deleteConfirm": "Are you sure you want to delete this menu?",

      // Rooms
      "rooms.title": "Rooms",
      "rooms.roomNumber": "Room Number",
      "rooms.roomType": "Room Type",
      "rooms.status": "Status",
      "rooms.addNew": "Add New Room",
      "rooms.bulkImport": "Bulk Import",
      "rooms.editRoom": "Edit Room",
      "rooms.deleteConfirm": "Are you sure you want to delete this room?",

      // Guest Information
      "guests.title": "Guest Information",
      "guests.guestName": "Guest Name",
      "guests.roomNumber": "Room Number",
      "guests.checkIn": "Check-in Date",
      "guests.checkOut": "Check-out Date",
      "guests.wifiPassword": "WiFi Password",
      "guests.welcomeMessage": "Welcome Message",
      "guests.addNew": "Add New Guest",
      "guests.editGuest": "Edit Guest",
      "guests.deleteConfirm": "Are you sure you want to delete this guest?",

      // Settings
      "settings.title": "Settings",
      "settings.systemConfig": "System Configuration",
      "settings.hotelName": "Hotel Name",
      "settings.language": "Default Language",
      "settings.timezone": "Timezone",
      "settings.maintenanceMode": "Maintenance Mode",
      "settings.userManagement": "User Management",
      "settings.localization": "Localization",

      // Messages
      "message.addSuccess": "Added successfully",
      "message.editSuccess": "Updated successfully",
      "message.deleteSuccess": "Deleted successfully",
      "message.addError": "Failed to add",
      "message.editError": "Failed to update",
      "message.deleteError": "Failed to delete",
      "message.unauthorized": "Unauthorized access",
      "message.notFound": "Not found",
    };
  }),
});
