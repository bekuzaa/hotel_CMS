import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
// Hotels Management
export const hotels = mysqlTable("hotels", {
  id: int("id").autoincrement().primaryKey(),
  hotelName: varchar("hotelName", { length: 255 }).notNull(),
  hotelCode: varchar("hotelCode", { length: 50 }).notNull().unique(), // Unique identifier for hotel
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  wifiSSID: varchar("wifiSSID", { length: 255 }),
  wifiPassword: varchar("wifiPassword", { length: 255 }),
  supportPhone: varchar("supportPhone", { length: 20 }),
  supportEmail: varchar("supportEmail", { length: 320 }),
  totalRooms: int("totalRooms").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Hotel = typeof hotels.$inferSelect;
export type InsertHotel = typeof hotels.$inferInsert;

export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).unique(),
  /** Username for local login */
  username: varchar("username", { length: 64 }).unique(),
  /** Password hash for local login */
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "manager", "staff", "superAdmin", "hotelAdmin"]).default("staff").notNull(),
  hotelId: int("hotelId"), // NULL for superAdmin, set for hotelAdmin/manager/staff
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TV Channels Management
export const tvChannels = mysqlTable("tvChannels", {
  id: int("id").autoincrement().primaryKey(),
  hotelId: int("hotelId").notNull(), // Multi-hotel support
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("nameEn", { length: 255 }).notNull(),
  description: text("description"),
  descriptionEn: text("descriptionEn"),
  streamUrl: varchar("streamUrl", { length: 1024 }).notNull(),
  thumbnailUrl: varchar("thumbnailUrl", { length: 1024 }),
  category: varchar("category", { length: 100 }).notNull(), // TV, YouTube, Netflix, etc.
  isActive: boolean("isActive").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TvChannel = typeof tvChannels.$inferSelect;
export type InsertTvChannel = typeof tvChannels.$inferInsert;

// Menu Items Management
export const menuItems = mysqlTable("menuItems", {
  id: int("id").autoincrement().primaryKey(),
  hotelId: int("hotelId").notNull(), // Multi-hotel support
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("nameEn", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 255 }), // Icon name or URL
  iconUrl: varchar("iconUrl", { length: 1024 }),
  category: varchar("category", { length: 100 }).notNull(), // Food, Hotel Guide, Entertainment, etc.
  contentType: varchar("contentType", { length: 50 }).notNull(), // url, image, text, etc.
  contentValue: text("contentValue"), // URL or content
  isActive: boolean("isActive").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;

// Background Images Management
export const backgroundImages = mysqlTable("backgroundImages", {
  id: int("id").autoincrement().primaryKey(),
  hotelId: int("hotelId").notNull(), // Multi-hotel support
  name: varchar("name", { length: 255 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 1024 }).notNull(),
  displayMode: mysqlEnum("displayMode", ["single", "slideshow"]).default("single").notNull(),
  displayDuration: int("displayDuration").default(5000), // milliseconds for slideshow
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BackgroundImage = typeof backgroundImages.$inferSelect;
export type InsertBackgroundImage = typeof backgroundImages.$inferInsert;

// Rooms Management (supports up to 1,000 rooms per hotel)
export const rooms = mysqlTable("rooms", {
  id: int("id").autoincrement().primaryKey(),
  hotelId: int("hotelId").notNull(), // Multi-hotel support
  roomNumber: varchar("roomNumber", { length: 50 }).notNull(),
  floor: int("floor"),
  roomType: varchar("roomType", { length: 100 }), // Standard, Deluxe, Suite, etc.
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;

// Guest Information
export const guestInformation = mysqlTable("guestInformation", {
  id: int("id").autoincrement().primaryKey(),
  hotelId: int("hotelId").notNull(), // Multi-hotel support
  roomId: int("roomId").notNull(),
  guestName: varchar("guestName", { length: 255 }).notNull(),
  checkInDate: timestamp("checkInDate"),
  checkOutDate: timestamp("checkOutDate"),
  wifiPassword: varchar("wifiPassword", { length: 255 }),
  wifiSsid: varchar("wifiSsid", { length: 255 }),
  welcomeMessage: text("welcomeMessage"),
  welcomeMessageEn: text("welcomeMessageEn"),
  additionalInfo: text("additionalInfo"), // JSON for flexible data
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GuestInformation = typeof guestInformation.$inferSelect;
export type InsertGuestInformation = typeof guestInformation.$inferInsert;

// Media Files Storage
export const mediaFiles = mysqlTable("mediaFiles", {
  id: int("id").autoincrement().primaryKey(),
  hotelId: int("hotelId").notNull(), // Multi-hotel support
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 1024 }).notNull(), // S3 key
  fileUrl: varchar("fileUrl", { length: 1024 }).notNull(),
  fileType: varchar("fileType", { length: 50 }).notNull(), // image, video, etc.
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"), // in bytes
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MediaFile = typeof mediaFiles.$inferSelect;
export type InsertMediaFile = typeof mediaFiles.$inferInsert;

// Localization/Language Settings
export const localizationSettings = mysqlTable("localizationSettings", {
  id: int("id").autoincrement().primaryKey(),
  languageCode: varchar("languageCode", { length: 10 }).notNull().unique(), // th, en
  languageName: varchar("languageName", { length: 100 }).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LocalizationSetting = typeof localizationSettings.$inferSelect;
export type InsertLocalizationSetting = typeof localizationSettings.$inferInsert;

// Activity Logs
export const activityLogs = mysqlTable("activityLogs", {
  id: int("id").autoincrement().primaryKey(),
  hotelId: int("hotelId"), // NULL for system-level actions, set for hotel-specific actions
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(), // create, update, delete, etc.
  entityType: varchar("entityType", { length: 100 }).notNull(), // tvChannel, room, guest, etc.
  entityId: int("entityId"),
  changes: text("changes"), // JSON for tracking what changed
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

// Device/TV Status Tracking
export const deviceStatus = mysqlTable("deviceStatus", {
  id: int("id").autoincrement().primaryKey(),
  hotelId: int("hotelId").notNull(), // Multi-hotel support
  deviceId: varchar("deviceId", { length: 255 }).notNull(),
  deviceName: varchar("deviceName", { length: 255 }), // Friendly name for the device
  roomId: int("roomId"),
  roomNumber: varchar("roomNumber", { length: 50 }),
  lastSyncTime: timestamp("lastSyncTime"),
  isOnline: boolean("isOnline").default(false).notNull(),
  isPoweredOn: boolean("isPoweredOn").default(true).notNull(), // Power status
  volume: int("volume").default(50).notNull(), // Volume level 0-100
  isMuted: boolean("isMuted").default(false).notNull(), // Mute status
  currentVersion: varchar("currentVersion", { length: 50 }),
  deviceInfo: text("deviceInfo"), // JSON
  lastCommand: varchar("lastCommand", { length: 50 }), // Last command sent: power_off, restart, volume_up, etc.
  lastCommandTime: timestamp("lastCommandTime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeviceStatus = typeof deviceStatus.$inferSelect;
export type InsertDeviceStatus = typeof deviceStatus.$inferInsert;

// System Configuration
export const systemConfig = mysqlTable("systemConfig", {
  id: int("id").autoincrement().primaryKey(),
  hotelId: int("hotelId"), // NULL for system-level config, set for hotel-specific config
  configKey: varchar("configKey", { length: 255 }).notNull(),
  configValue: text("configValue"),
  configType: varchar("configType", { length: 50 }).notNull(), // string, number, boolean, json
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = typeof systemConfig.$inferInsert;

// Subscription Packages (predefined packages)
export const subscriptionPackages = mysqlTable("subscriptionPackages", {
  id: int("id").autoincrement().primaryKey(),
  packageName: varchar("packageName", { length: 255 }).notNull(), // "1 Year", "2 Years", "1 Month", "7 Days", "Lifetime", "Custom"
  packageCode: varchar("packageCode", { length: 50 }).notNull().unique(), // 1Y, 2Y, 1M, 7D, LIFETIME, CUSTOM
  durationDays: int("durationDays"), // NULL for lifetime, number of days for others
  price: int("price"), // in cents or base currency unit
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionPackage = typeof subscriptionPackages.$inferSelect;
export type InsertSubscriptionPackage = typeof subscriptionPackages.$inferInsert;

// Hotel Subscriptions (track subscription for each hotel)
export const hotelSubscriptions = mysqlTable("hotelSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  hotelId: int("hotelId").notNull().unique(), // One active subscription per hotel
  packageId: int("packageId").notNull(),
  startDate: timestamp("startDate").notNull(),
  expiryDate: timestamp("expiryDate"), // NULL for lifetime subscriptions
  isActive: boolean("isActive").default(true).notNull(),
  autoRenew: boolean("autoRenew").default(false).notNull(),
  renewalDate: timestamp("renewalDate"), // Next renewal date if auto-renew is enabled
  lastReminderSent: timestamp("lastReminderSent"), // Last renewal reminder sent date
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HotelSubscription = typeof hotelSubscriptions.$inferSelect;
export type InsertHotelSubscription = typeof hotelSubscriptions.$inferInsert;