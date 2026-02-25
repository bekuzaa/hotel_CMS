import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */

// Hotels Management
export const hotels = sqliteTable("hotels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hotelName: text("hotelName").notNull(),
  hotelCode: text("hotelCode").notNull().unique(),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  phone: text("phone"),
  email: text("email"),
  wifiSSID: text("wifiSSID"),
  wifiPassword: text("wifiPassword"),
  supportPhone: text("supportPhone"),
  supportEmail: text("supportEmail"),
  totalRooms: integer("totalRooms").default(0).notNull(),
  // Branding customization
  logoUrl: text("logoUrl"),
  primaryColor: text("primaryColor").default("#1e40af"), // Default blue
  secondaryColor: text("secondaryColor").default("#3b82f6"), // Default light blue
  welcomeMessage: text("welcomeMessage"),
  welcomeMessageEn: text("welcomeMessageEn"),
  launcherBackground: text("launcherBackground"),
  // Weather configuration
  weatherCity: text("weatherCity"), // City name for weather API
  weatherApiKey: text("weatherApiKey"), // OpenWeatherMap API key (optional)
  showWeather: integer("showWeather", { mode: "boolean" }).default(true),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type Hotel = typeof hotels.$inferSelect;
export type InsertHotel = typeof hotels.$inferInsert;

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").unique(),
  username: text("username").unique(),
  passwordHash: text("passwordHash"),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").default("staff").notNull(), // user, admin, manager, staff, superAdmin, hotelAdmin
  hotelId: integer("hotelId"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TV Channels Management
export const tvChannels = sqliteTable("tvChannels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hotelId: integer("hotelId").notNull(),
  name: text("name").notNull(),
  nameEn: text("nameEn").notNull(),
  description: text("description"),
  descriptionEn: text("descriptionEn"),
  streamUrl: text("streamUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  category: text("category").notNull(),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  displayOrder: integer("displayOrder").default(0).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type TvChannel = typeof tvChannels.$inferSelect;
export type InsertTvChannel = typeof tvChannels.$inferInsert;

// Menu Items Management
export const menuItems = sqliteTable("menuItems", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hotelId: integer("hotelId").notNull(),
  name: text("name").notNull(),
  nameEn: text("nameEn").notNull(),
  icon: text("icon"),
  iconUrl: text("iconUrl"),
  category: text("category").notNull(),
  contentType: text("contentType").notNull(),
  contentValue: text("contentValue"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  displayOrder: integer("displayOrder").default(0).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;

// Background Images Management
export const backgroundImages = sqliteTable("backgroundImages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hotelId: integer("hotelId").notNull(),
  name: text("name").notNull(),
  imageUrl: text("imageUrl").notNull(),
  displayMode: text("displayMode").default("single").notNull(), // single, slideshow
  displayDuration: integer("displayDuration").default(5000),
  displayOrder: integer("displayOrder").default(0).notNull(),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type BackgroundImage = typeof backgroundImages.$inferSelect;
export type InsertBackgroundImage = typeof backgroundImages.$inferInsert;

// Rooms Management
export const rooms = sqliteTable("rooms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hotelId: integer("hotelId").notNull(),
  roomNumber: text("roomNumber").notNull(),
  floor: integer("floor"),
  roomType: text("roomType"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;

// Guest Information
export const guestInformation = sqliteTable("guestInformation", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hotelId: integer("hotelId").notNull(),
  roomId: integer("roomId").notNull(),
  guestName: text("guestName").notNull(),
  checkInDate: integer("checkInDate", { mode: "timestamp" }),
  checkOutDate: integer("checkOutDate", { mode: "timestamp" }),
  wifiPassword: text("wifiPassword"),
  wifiSsid: text("wifiSsid"),
  welcomeMessage: text("welcomeMessage"),
  welcomeMessageEn: text("welcomeMessageEn"),
  additionalInfo: text("additionalInfo"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type GuestInformation = typeof guestInformation.$inferSelect;
export type InsertGuestInformation = typeof guestInformation.$inferInsert;

// Media Files Storage
export const mediaFiles = sqliteTable("mediaFiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hotelId: integer("hotelId").notNull(),
  fileName: text("fileName").notNull(),
  fileKey: text("fileKey").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: text("fileType").notNull(),
  mimeType: text("mimeType"),
  fileSize: integer("fileSize"),
  uploadedBy: integer("uploadedBy").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type MediaFile = typeof mediaFiles.$inferSelect;
export type InsertMediaFile = typeof mediaFiles.$inferInsert;

// Localization/Language Settings
export const localizationSettings = sqliteTable("localizationSettings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  languageCode: text("languageCode").notNull().unique(),
  languageName: text("languageName").notNull(),
  isDefault: integer("isDefault", { mode: "boolean" }).default(false).notNull(),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type LocalizationSetting = typeof localizationSettings.$inferSelect;
export type InsertLocalizationSetting = typeof localizationSettings.$inferInsert;

// Activity Logs
export const activityLogs = sqliteTable("activityLogs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hotelId: integer("hotelId"),
  userId: integer("userId").notNull(),
  action: text("action").notNull(),
  entityType: text("entityType").notNull(),
  entityId: integer("entityId"),
  changes: text("changes"),
  ipAddress: text("ipAddress"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

// Device/TV Status Tracking
export const deviceStatus = sqliteTable("deviceStatus", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hotelId: integer("hotelId"),
  deviceId: text("deviceId").notNull(),
  deviceName: text("deviceName"),
  roomId: integer("roomId"),
  roomNumber: text("roomNumber"),
  pairingCode: text("pairingCode"),
  isPaired: integer("isPaired", { mode: "boolean" }).default(false).notNull(),
  pairedAt: integer("pairedAt", { mode: "timestamp" }),
  lastSyncTime: integer("lastSyncTime", { mode: "timestamp" }),
  isOnline: integer("isOnline", { mode: "boolean" }).default(false).notNull(),
  isPoweredOn: integer("isPoweredOn", { mode: "boolean" }).default(true).notNull(),
  volume: integer("volume").default(50).notNull(),
  isMuted: integer("isMuted", { mode: "boolean" }).default(false).notNull(),
  currentChannel: text("currentChannel"),
  currentApp: text("currentApp"),
  currentVersion: text("currentVersion"),
  deviceInfo: text("deviceInfo"),
  lastCommand: text("lastCommand"),
  lastCommandTime: integer("lastCommandTime", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type DeviceStatus = typeof deviceStatus.$inferSelect;
export type InsertDeviceStatus = typeof deviceStatus.$inferInsert;

// System Configuration
export const systemConfig = sqliteTable("systemConfig", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hotelId: integer("hotelId"),
  configKey: text("configKey").notNull(),
  configValue: text("configValue"),
  configType: text("configType").notNull(),
  description: text("description"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = typeof systemConfig.$inferInsert;

// Subscription Packages
export const subscriptionPackages = sqliteTable("subscriptionPackages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  packageName: text("packageName").notNull(),
  packageCode: text("packageCode").notNull().unique(),
  durationDays: integer("durationDays"),
  price: integer("price"),
  description: text("description"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  displayOrder: integer("displayOrder").default(0).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type SubscriptionPackage = typeof subscriptionPackages.$inferSelect;
export type InsertSubscriptionPackage = typeof subscriptionPackages.$inferInsert;

// Hotel Subscriptions
export const hotelSubscriptions = sqliteTable("hotelSubscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hotelId: integer("hotelId").notNull().unique(),
  packageId: integer("packageId").notNull(),
  startDate: integer("startDate", { mode: "timestamp" }).notNull(),
  expiryDate: integer("expiryDate", { mode: "timestamp" }),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  autoRenew: integer("autoRenew", { mode: "boolean" }).default(false).notNull(),
  renewalDate: integer("renewalDate", { mode: "timestamp" }),
  lastReminderSent: integer("lastReminderSent", { mode: "timestamp" }),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type HotelSubscription = typeof hotelSubscriptions.$inferSelect;
export type InsertHotelSubscription = typeof hotelSubscriptions.$inferInsert;

// TV Apps Configuration
export const tvApps = sqliteTable("tvApps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hotelId: integer("hotelId").notNull(),
  appName: text("appName").notNull(),
  appType: text("appType").notNull(), // live_tv, youtube, app, url, slideshow, radio, hotel_service
  packageName: text("packageName"),
  deepLink: text("deepLink"),
  iconUrl: text("iconUrl"),
  iconName: text("iconName"),
  displayOrder: integer("displayOrder").default(0).notNull(),
  isVisible: integer("isVisible", { mode: "boolean" }).default(true).notNull(),
  isDefault: integer("isDefault", { mode: "boolean" }).default(false).notNull(),
  customLabel: text("customLabel"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type TvApp = typeof tvApps.$inferSelect;
export type InsertTvApp = typeof tvApps.$inferInsert;

// Guest Service Requests
export const serviceRequests = sqliteTable("serviceRequests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hotelId: integer("hotelId").notNull(),
  roomNumber: text("roomNumber").notNull(),
  guestName: text("guestName"),
  requestType: text("requestType").notNull(), // room_service, housekeeping, maintenance, laundry, wake_up_call, other
  description: text("description"),
  items: text("items"), // JSON array of ordered items (for room service)
  priority: text("priority").default("normal"), // low, normal, high, urgent
  status: text("status").default("pending"), // pending, in_progress, completed, cancelled
  notes: text("notes"), // Staff notes
  assignedTo: text("assignedTo"), // Staff member assigned
  // Guest feedback
  rating: integer("rating"), // 1-5 stars
  feedback: text("feedback"), // Guest comment
  feedbackAt: integer("feedbackAt", { mode: "timestamp" }),
  completedAt: integer("completedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type InsertServiceRequest = typeof serviceRequests.$inferInsert;

// Service Menu Items (for room service)
export const serviceMenuItems = sqliteTable("serviceMenuItems", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hotelId: integer("hotelId").notNull(),
  category: text("category").notNull(), // food, beverage, amenities, other
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").default(0).notNull(),
  imageUrl: text("imageUrl"),
  isAvailable: integer("isAvailable", { mode: "boolean" }).default(true).notNull(),
  displayOrder: integer("displayOrder").default(0).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type ServiceMenuItem = typeof serviceMenuItems.$inferSelect;
export type InsertServiceMenuItem = typeof serviceMenuItems.$inferInsert;

// Wake-up Calls
export const wakeUpCalls = sqliteTable("wakeUpCalls", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hotelId: integer("hotelId").notNull(),
  roomNumber: text("roomNumber").notNull(),
  scheduledTime: integer("scheduledTime", { mode: "timestamp" }).notNull(), // Scheduled wake-up time
  recurring: integer("recurring", { mode: "boolean" }).default(false).notNull(), // Daily recurring
  recurringDays: text("recurringDays"), // JSON array of days ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
  status: text("status").default("pending").notNull(), // pending, completed, cancelled, snoozed
  alarmType: text("alarmType").default("tv"), // tv, phone, both
  notes: text("notes"), // Guest notes
  triggeredAt: integer("triggeredAt", { mode: "timestamp" }), // When alarm was triggered
  cancelledAt: integer("cancelledAt", { mode: "timestamp" }), // When cancelled
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type WakeUpCall = typeof wakeUpCalls.$inferSelect;
export type InsertWakeUpCall = typeof wakeUpCalls.$inferInsert;
