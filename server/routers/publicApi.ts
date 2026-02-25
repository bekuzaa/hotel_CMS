import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { tvChannels, menuItems, backgroundImages, guestInformation, rooms, systemConfig, hotels } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Public API for Android TV App
 * These endpoints are accessible without authentication
 * Used by TV devices to fetch configuration and content
 */
export const publicApiRouter = router({
  // Get all active TV channels
  getChannels: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const channels = await db.select().from(tvChannels)
      .where(eq(tvChannels.isActive, true))
      .orderBy(tvChannels.displayOrder);

    return channels.map(ch => ({
      id: ch.id,
      name: ch.name,
      nameEn: ch.nameEn,
      description: ch.description,
      descriptionEn: ch.descriptionEn,
      streamUrl: ch.streamUrl,
      thumbnailUrl: ch.thumbnailUrl,
      category: ch.category,
      displayOrder: ch.displayOrder,
    }));
  }),

  // Get all active menu items
  getMenus: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const menus = await db.select().from(menuItems)
      .where(eq(menuItems.isActive, true))
      .orderBy(menuItems.displayOrder);

    return menus.map(m => ({
      id: m.id,
      name: m.name,
      nameEn: m.nameEn,
      icon: m.icon,
      iconUrl: m.iconUrl,
      contentType: m.contentType,
      contentValue: m.contentValue,
      displayOrder: m.displayOrder,
    }));
  }),

  // Get background images configuration
  getBackgroundImages: publicProcedure
    .input(z.object({
      mode: z.enum(["single", "slideshow"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const images = await db.select().from(backgroundImages)
        .where(eq(backgroundImages.isActive, true))
        .orderBy(backgroundImages.displayOrder);

      return images
        .filter(img => !input.mode || img.displayMode === input.mode)
        .map(img => ({
          id: img.id,
          imageUrl: img.imageUrl,
          displayMode: img.displayMode,
          displayDuration: img.displayDuration,
          displayOrder: img.displayOrder,
        }));
    }),

  // Get guest information by room number
  getGuestByRoom: publicProcedure
    .input(z.object({ roomNumber: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      // First get room ID
      const room = await db.select().from(rooms)
        .where(eq(rooms.roomNumber, input.roomNumber))
        .limit(1);

      if (room.length === 0) return null;

      // Then get guest info
      const guest = await db.select().from(guestInformation)
        .where(eq(guestInformation.roomId, room[0].id))
        .limit(1);

      if (guest.length === 0) return null;

      return {
        guestName: guest[0].guestName,
        roomNumber: input.roomNumber,
        checkInDate: guest[0].checkInDate,
        checkOutDate: guest[0].checkOutDate,
        welcomeMessage: guest[0].welcomeMessage,
        wifiPassword: guest[0].wifiPassword,
        wifiSsid: guest[0].wifiSsid,
      };
    }),

  // Get system configuration
  getSystemConfig: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const configs = await db.select().from(systemConfig).limit(10);
    
    const config: Record<string, any> = {};
    configs.forEach(c => {
      try {
        if (c.configType === "number") {
          config[c.configKey] = Number(c.configValue);
        } else if (c.configType === "boolean") {
          config[c.configKey] = c.configValue === "true";
        } else if (c.configType === "json") {
          config[c.configKey] = JSON.parse(c.configValue || "{}");
        } else {
          config[c.configKey] = c.configValue;
        }
      } catch {
        config[c.configKey] = c.configValue;
      }
    });

    return config;
  }),

  // Get default language
  getDefaultLanguage: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return "th";

    const configs = await db.select().from(systemConfig)
      .where(eq(systemConfig.configKey, "defaultLanguage"))
      .limit(1);

    if (configs.length > 0) {
      return configs[0].configValue || "th";
    }
    return "th";
  }),

  // Get all rooms (for room list on TV)
  getRooms: publicProcedure
    .input(z.object({
      limit: z.number().default(100),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { data: [], total: 0 };

      const allRooms = await db.select().from(rooms)
        .where(eq(rooms.isActive, true))
        .orderBy(rooms.roomNumber);

      const total = allRooms.length;
      const data = allRooms.slice(input.offset, input.offset + input.limit);

      return {
        data: data.map(r => ({
          id: r.id,
          roomNumber: r.roomNumber,
          roomType: r.roomType,
          isActive: r.isActive,
        })),
        total,
      };
    }),

  // Health check endpoint
  healthCheck: publicProcedure.query(async () => {
    const db = await getDb();
    
    return {
      status: db ? "healthy" : "unhealthy",
      timestamp: new Date(),
      version: "1.0.0",
      database: db ? "connected" : "disconnected",
    };
  }),

  // Get app version and update info
  getAppVersion: publicProcedure.query(async () => {
    return {
      currentVersion: "1.0.0",
      minimumVersion: "1.0.0",
      latestVersion: "1.0.0",
      updateAvailable: false,
      downloadUrl: null,
      releaseNotes: "Initial release",
    };
  }),

  // Get WiFi credentials
  getWiFiInfo: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const configs = await db.select().from(systemConfig);
    
    const wifiSsid = configs.find(c => c.configKey === "wifiSsid")?.configValue;
    const wifiPassword = configs.find(c => c.configKey === "wifiPassword")?.configValue;

    if (!wifiSsid) return null;

    return {
      ssid: wifiSsid,
      password: wifiPassword || null,
      security: "WPA2",
    };
  }),

  // Get hotel information
  getHotelInfo: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const configs = await db.select().from(systemConfig);
    
    const hotelName = configs.find(c => c.configKey === "hotelName")?.configValue;
    const hotelLogo = configs.find(c => c.configKey === "hotelLogo")?.configValue;

    return {
      name: hotelName || "Hotel TV System",
      logo: hotelLogo || null,
    };
  }),

  // Get featured content
  getFeaturedContent: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { channels: [], menus: [], images: [] };

    const [channels, menus, images] = await Promise.all([
      db.select().from(tvChannels)
        .where(eq(tvChannels.isActive, true))
        .orderBy(tvChannels.displayOrder)
        .limit(5),
      db.select().from(menuItems)
        .where(eq(menuItems.isActive, true))
        .orderBy(menuItems.displayOrder)
        .limit(5),
      db.select().from(backgroundImages)
        .where(eq(backgroundImages.isActive, true))
        .orderBy(backgroundImages.displayOrder)
        .limit(3),
    ]);

    return {
      channels: channels.map(c => ({ id: c.id, name: c.name, thumbnail: c.thumbnailUrl })),
      menus: menus.map(m => ({ id: m.id, name: m.name, icon: m.icon })),
      images: images.map(i => ({ id: i.id, url: i.imageUrl })),
    };
  }),

  // Get weather for hotel
  getWeather: publicProcedure
    .input(z.object({ hotelId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const hotel = await db.select().from(hotels).where(eq(hotels.id, input.hotelId)).limit(1);
      const hotelData = hotel[0];

      if (!hotelData || !(hotelData as any).weatherCity || (hotelData as any).showWeather === false) {
        return null;
      }

      const city = (hotelData as any).weatherCity;
      const apiKey = (hotelData as any).weatherApiKey;

      // Use OpenWeatherMap API if key is configured, otherwise return mock data
      if (apiKey) {
        try {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
          );
          if (response.ok) {
            const data = await response.json();
            return {
              city: data.name,
              temp: Math.round(data.main.temp),
              description: data.weather[0].description,
              icon: data.weather[0].icon,
              humidity: data.main.humidity,
              feelsLike: Math.round(data.main.feels_like),
            };
          }
        } catch (error) {
          console.error("Weather API error:", error);
        }
      }

      // Return mock weather data for demo purposes
      const mockWeather = [
        { temp: 28, description: "Partly Cloudy", icon: "02d", humidity: 75 },
        { temp: 32, description: "Sunny", icon: "01d", humidity: 60 },
        { temp: 25, description: "Light Rain", icon: "10d", humidity: 85 },
        { temp: 30, description: "Clear Sky", icon: "01d", humidity: 65 },
      ];
      const randomWeather = mockWeather[Math.floor(Math.random() * mockWeather.length)];
      
      return {
        city: city.split(",")[0],
        ...randomWeather,
        feelsLike: randomWeather.temp - 2,
      };
    }),
});
