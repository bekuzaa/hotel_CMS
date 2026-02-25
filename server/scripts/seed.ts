/**
 * Database seed script - Run after migrations
 * Creates the initial super admin user, hotel, and TV apps
 * 
 * Usage: npx tsx server/scripts/seed.ts
 */

import { getDb } from "../db";
import { users, hotels, tvApps, serviceMenuItems } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Default TV apps
const DEFAULT_APPS = [
  { appName: "LIVE TV", appType: "live_tv", iconName: "Tv", displayOrder: 0 },
  { appName: "RADIO", appType: "radio", iconName: "Radio", displayOrder: 1 },
  { appName: "YOUTUBE", appType: "youtube", packageName: "com.google.android.youtube.tv", iconName: "Youtube", displayOrder: 2 },
  { appName: "NETFLIX", appType: "app", packageName: "com.netflix.mediaclient", iconName: "Film", displayOrder: 3 },
  { appName: "SPOTIFY", appType: "app", packageName: "com.spotify.tv.android", iconName: "Music", displayOrder: 4 },
  { appName: "DISNEY+", appType: "app", packageName: "com.disney.disneyplus", iconName: "Film", displayOrder: 5 },
  { appName: "PRIME VIDEO", appType: "app", packageName: "com.amazon.avod.thirdpartyclient", iconName: "Film", displayOrder: 6 },
  { appName: "HBO GO", appType: "app", packageName: "eu.hbogo.androidtv", iconName: "Film", displayOrder: 7 },
  { appName: "APPLE TV+", appType: "app", packageName: "com.apple.atve.sony.app", iconName: "Tv", displayOrder: 8 },
  { appName: "FOOD MENU", appType: "hotel_service", iconName: "UtensilsCrossed", displayOrder: 9 },
  { appName: "PLACES", appType: "hotel_service", iconName: "MapPin", displayOrder: 10 },
  { appName: "ROOMS", appType: "hotel_service", iconName: "Bed", displayOrder: 11 },
  { appName: "ALL APPS", appType: "app", iconName: "Grid3X3", displayOrder: 12 },
  { appName: "SLIDE SHOW", appType: "slideshow", iconName: "Image", displayOrder: 13 },
  { appName: "SETTINGS", appType: "app", iconName: "Settings", displayOrder: 14 },
];

async function seed() {
  console.log("🌱 Starting database seed...");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database connection failed");
    process.exit(1);
  }

  // 1. Create super admin user
  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.username, "gmmz"))
    .limit(1);

  if (existingAdmin.length === 0) {
    const passwordHash = hashPassword("gmmz@1234");
    
    await db.insert(users).values({
      openId: null,
      username: "gmmz",
      passwordHash,
      name: "Super Admin",
      email: "admin@hotel.com",
      role: "superAdmin",
      isActive: true,
      loginMethod: "local",
    });

    console.log("✅ Super admin created successfully!");
    console.log("   Username: gmmz");
    console.log("   Password: gmmz@1234");
  } else {
    console.log("⚠️ Admin user already exists");
  }

  // 2. Create default hotel
  const existingHotels = await db.select().from(hotels).limit(1);
  
  let hotelId: number;
  
  if (existingHotels.length === 0) {
    const result = await db.insert(hotels).values({
      hotelName: "Demo Hotel",
      hotelCode: "DEMO001",
      address: "123 Main Street",
      city: "Bangkok",
      country: "Thailand",
      phone: "+66-2-123-4567",
      email: "info@demohotel.com",
      totalRooms: 100,
      isActive: true,
    });
    
    // Get the inserted hotel ID
    const newHotel = await db.select().from(hotels).limit(1);
    hotelId = newHotel[0].id;
    console.log("✅ Default hotel created: Demo Hotel (ID: " + hotelId + ")");
  } else {
    hotelId = existingHotels[0].id;
    console.log("⚠️ Hotel already exists (ID: " + hotelId + ")");
  }

  // 3. Create default TV apps for the hotel
  const existingApps = await db.select().from(tvApps).where(eq(tvApps.hotelId, hotelId));
  
  if (existingApps.length === 0) {
    // No apps exist, create all defaults
    for (const app of DEFAULT_APPS) {
      await db.insert(tvApps).values({
        hotelId,
        appName: app.appName,
        appType: app.appType as "live_tv" | "youtube" | "app" | "url" | "slideshow" | "radio" | "hotel_service",
        packageName: app.packageName || null,
        iconName: app.iconName,
        displayOrder: app.displayOrder,
        isDefault: true,
        isVisible: true,
      });
    }
    console.log("✅ Default TV apps created (" + DEFAULT_APPS.length + " apps)");
  } else {
    // Check for missing apps and add them
    const existingAppNames = existingApps.map(a => a.appName);
    const missingApps = DEFAULT_APPS.filter(app => !existingAppNames.includes(app.appName));
    
    if (missingApps.length > 0) {
      // Get max display order to append new apps
      const maxOrder = Math.max(...existingApps.map(a => a.displayOrder || 0));
      
      for (let i = 0; i < missingApps.length; i++) {
        const app = missingApps[i];
        await db.insert(tvApps).values({
          hotelId,
          appName: app.appName,
          appType: app.appType as "live_tv" | "youtube" | "app" | "url" | "slideshow" | "radio" | "hotel_service",
          packageName: app.packageName || null,
          iconName: app.iconName,
          displayOrder: maxOrder + i + 1, // Append after existing apps
          isDefault: true,
          isVisible: true,
        });
      }
      console.log("✅ Added missing TV apps: " + missingApps.map(a => a.appName).join(", "));      
    }
    
    // Always reorder all apps according to DEFAULT_APPS order
    const allApps = await db.select().from(tvApps).where(eq(tvApps.hotelId, hotelId));
    for (const defaultApp of DEFAULT_APPS) {
      const existing = allApps.find(a => a.appName === defaultApp.appName);
      if (existing) {
        await db.update(tvApps)
          .set({ displayOrder: defaultApp.displayOrder })
          .where(eq(tvApps.id, existing.id));
      }
    }
    console.log("✅ Reordered apps to match default order");
  }

  // 4. Create default room service menu items
  const existingMenuItems = await db.select().from(serviceMenuItems).where(eq(serviceMenuItems.hotelId, hotelId));
  
  if (existingMenuItems.length === 0) {
    const DEFAULT_MENU_ITEMS = [
      // Food
      { category: "food", name: "Club Sandwich", description: "Triple-decker sandwich with chicken, bacon, lettuce, and tomato", price: 12.99, displayOrder: 0 },
      { category: "food", name: "Caesar Salad", description: "Fresh romaine lettuce with parmesan and croutons", price: 9.99, displayOrder: 1 },
      { category: "food", name: "Margherita Pizza", description: "Classic pizza with tomato sauce, mozzarella, and fresh basil", price: 14.99, displayOrder: 2 },
      { category: "food", name: "Grilled Salmon", description: "Atlantic salmon with seasonal vegetables", price: 24.99, displayOrder: 3 },
      { category: "food", name: "Chicken Alfredo", description: "Fettuccine pasta with creamy alfredo sauce and grilled chicken", price: 16.99, displayOrder: 4 },
      { category: "food", name: "Beef Burger", description: "Angus beef patty with lettuce, tomato, and fries", price: 15.99, displayOrder: 5 },
      // Beverages
      { category: "beverage", name: "Orange Juice", description: "Freshly squeezed orange juice", price: 4.99, displayOrder: 0 },
      { category: "beverage", name: "Coffee", description: "Premium roasted coffee", price: 3.99, displayOrder: 1 },
      { category: "beverage", name: "Green Tea", description: "Japanese green tea", price: 3.49, displayOrder: 2 },
      { category: "beverage", name: "Sparkling Water", description: "Mineral water with bubbles", price: 2.99, displayOrder: 3 },
      { category: "beverage", name: "Red Wine Glass", description: "House selection of premium red wine", price: 9.99, displayOrder: 4 },
      // Amenities
      { category: "amenities", name: "Extra Towels", description: "Set of 2 bath towels", price: 0, displayOrder: 0 },
      { category: "amenities", name: "Toiletry Kit", description: "Shampoo, conditioner, soap, and lotion", price: 0, displayOrder: 1 },
      { category: "amenities", name: "Dental Kit", description: "Toothbrush and toothpaste", price: 0, displayOrder: 2 },
      { category: "amenities", name: "Shaving Kit", description: "Razor and shaving cream", price: 0, displayOrder: 3 },
    ];
    
    for (const item of DEFAULT_MENU_ITEMS) {
      await db.insert(serviceMenuItems).values({
        hotelId,
        category: item.category as "food" | "beverage" | "amenities" | "other",
        name: item.name,
        description: item.description,
        price: item.price,
        displayOrder: item.displayOrder,
        isAvailable: true,
      });
    }
    console.log("✅ Default menu items created (" + DEFAULT_MENU_ITEMS.length + " items)");
  } else {
    console.log("⚠️ Menu items already exist for hotel");
  }

  console.log("");
  console.log("🎉 Seed completed!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
