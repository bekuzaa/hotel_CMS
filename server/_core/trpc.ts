import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { getDb } from "../db";
import { hotelSubscriptions, hotels } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

// Subscription check utility
export async function checkSubscriptionActive(hotelId: number): Promise<{ active: boolean; expired: boolean; daysRemaining: number | null }> {
  const db = await getDb();
  if (!db) return { active: false, expired: false, daysRemaining: null };

  const subscription = await db
    .select()
    .from(hotelSubscriptions)
    .where(and(
      eq(hotelSubscriptions.hotelId, hotelId),
      eq(hotelSubscriptions.isActive, true)
    ))
    .limit(1);

  if (subscription.length === 0) {
    return { active: false, expired: false, daysRemaining: null };
  }

  const sub = subscription[0];
  
  // Lifetime subscription
  if (!sub.expiryDate) {
    return { active: true, expired: false, daysRemaining: null };
  }

  const now = new Date();
  const expiryDate = new Date(sub.expiryDate);
  const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { active: false, expired: true, daysRemaining };
  }

  return { active: true, expired: false, daysRemaining };
}

// Procedure that requires active subscription (for hotelAdmin)
export const subscriptionRequiredProcedure = protectedProcedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    // superAdmin bypasses subscription check
    if (ctx.user.role === 'superAdmin') {
      return next({ ctx });
    }

    // Get hotelId for the user
    const hotelId = ctx.user.hotelId;
    if (!hotelId) {
      throw new TRPCError({ 
        code: "FORBIDDEN", 
        message: "No hotel assigned to user" 
      });
    }

    const subscriptionStatus = await checkSubscriptionActive(hotelId);
    
    if (!subscriptionStatus.active) {
      throw new TRPCError({ 
        code: "FORBIDDEN", 
        message: subscriptionStatus.expired 
          ? "Subscription has expired. Please renew to continue using this service."
          : "No active subscription. Please contact administrator."
      });
    }

    return next({ 
      ctx: {
        ...ctx,
        subscription: subscriptionStatus,
      } 
    });
  }),
);
