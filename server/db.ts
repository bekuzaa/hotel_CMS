import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, tvChannels, rooms, guestInformation, menuItems, backgroundImages } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.isActive, true));
}

// TV Channels
export async function getTvChannels() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tvChannels).orderBy(tvChannels.displayOrder);
}

export async function getTvChannelById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tvChannels).where(eq(tvChannels.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Rooms
export async function getRooms(limit?: number, offset?: number) {
  const db = await getDb();
  if (!db) return [];
  let query: any = db.select().from(rooms);
  if (limit) query = query.limit(limit);
  if (offset) query = query.offset(offset);
  return query;
}

export async function getRoomByNumber(roomNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(rooms).where(eq(rooms.roomNumber, roomNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getRoomCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(rooms);
  return result.length;
}

// Guest Information
export async function getGuestByRoomId(roomId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(guestInformation).where(eq(guestInformation.roomId, roomId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Menu Items
export async function getMenuItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuItems).where(eq(menuItems.isActive, true)).orderBy(menuItems.displayOrder);
}

// Background Images
export async function getBackgroundImages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(backgroundImages).where(eq(backgroundImages.isActive, true)).orderBy(backgroundImages.displayOrder);
}
