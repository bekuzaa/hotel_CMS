import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import * as crypto from "crypto";

// Simple password hashing function
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Generate session token
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const authRouter = router({
  // Get current user
  me: publicProcedure.query((opts) => opts.ctx.user),

  // Local login with username/password
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1, "Username is required"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Find user by username
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (userResult.length === 0) {
        throw new Error("Invalid username or password");
      }

      const user = userResult[0];

      // Check if user is active
      if (!user.isActive) {
        throw new Error("Account is deactivated");
      }

      // Verify password
      const passwordHash = hashPassword(input.password);
      if (user.passwordHash !== passwordHash) {
        throw new Error("Invalid username or password");
      }

      // Update last signed in
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      // Set session cookie
      const sessionToken = generateSessionToken();
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return user without password
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }),

  // Logout
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  // Create initial super admin (only if no users exist)
  createInitialAdmin: publicProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Check if any user exists
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      throw new Error("Users already exist. Use normal registration.");
    }

    // Create initial super admin
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

    return { success: true, message: "Initial admin created. Username: gmmz, Password: gmmz@1234" };
  }),
});
