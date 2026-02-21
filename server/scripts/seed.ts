/**
 * Database seed script - Run after migrations
 * Creates the initial super admin user
 * 
 * Usage: npx tsx server/scripts/seed.ts
 */

import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function seed() {
  console.log("🌱 Starting database seed...");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database connection failed");
    process.exit(1);
  }

  // Check if admin user already exists
  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.username, "gmmz"))
    .limit(1);

  if (existingAdmin.length > 0) {
    console.log("⚠️ Admin user already exists");
    return;
  }

  // Create super admin
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
  console.log("");
  console.log("🎉 Seed completed!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
