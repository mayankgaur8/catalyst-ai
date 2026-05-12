/**
 * Server-side subscription authority.
 *
 * Every API route that gates content by plan must call helpers from this
 * file — never trust client-sent headers for access decisions.
 *
 * Admin bypass rule:
 *   user.role === "ADMIN"  OR  email ∈ ADMIN_EMAILS  →  full ELITE access
 *   Admins are NEVER shown paywalls, never counted against quotas.
 */

import { prisma } from "@/lib/prisma";
import type { Plan, Role, SubscriptionStatus } from "@prisma/client";
import { canAccess, type Feature } from "@/lib/features";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubscriptionUser = {
  id: string;
  email: string;
  role: Role;
  subscription: {
    plan: Plan;
    status: SubscriptionStatus;
    expiresAt: Date | null;
    billingCycle: string | null;
    provider: string | null;
  } | null;
};

export type EffectivePlan = "free" | "pro" | "elite";

// ─── Admin list ───────────────────────────────────────────────────────────────

const ADMIN_EMAILS: Set<string> = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

// ─── Core helpers ─────────────────────────────────────────────────────────────

export function isAdmin(user: Pick<SubscriptionUser, "role" | "email">): boolean {
  return user.role === "ADMIN" || ADMIN_EMAILS.has(user.email.toLowerCase());
}

export function getEffectivePlan(user: SubscriptionUser): EffectivePlan {
  if (isAdmin(user)) return "elite";

  const sub = user.subscription;
  if (!sub || sub.status === "CANCELLED" || sub.status === "EXPIRED") return "free";
  if (sub.expiresAt && sub.expiresAt < new Date()) return "free";
  if (sub.plan === "FREE") return "free";

  return sub.plan.toLowerCase() as EffectivePlan;
}

export function isPremium(user: SubscriptionUser): boolean {
  const p = getEffectivePlan(user);
  return p === "pro" || p === "elite";
}

export function isElite(user: SubscriptionUser): boolean {
  return getEffectivePlan(user) === "elite";
}

export function canAccessFeature(user: SubscriptionUser, feature: Feature): boolean {
  if (isAdmin(user)) return true;
  return canAccess(getEffectivePlan(user), feature);
}

// ─── DB fetch ────────────────────────────────────────────────────────────────

export async function getSubscriptionUser(userId: string): Promise<SubscriptionUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      subscription: {
        select: {
          plan: true,
          status: true,
          expiresAt: true,
          billingCycle: true,
          provider: true,
        },
      },
    },
  });
}

// ─── Plan pricing (paise — 1 INR = 100 paise) ────────────────────────────────

export const PLAN_AMOUNTS: Record<"pro" | "elite", Record<"monthly" | "yearly", number>> = {
  pro:   { monthly: 99900,  yearly: 799900  }, // ₹999/mo  ₹7,999/yr
  elite: { monthly: 199900, yearly: 499900  }, // ₹1,999/mo ₹4,999/yr
};

export const PLAN_DISPLAY: Record<"pro" | "elite", Record<"monthly" | "yearly", string>> = {
  pro:   { monthly: "₹999/month",   yearly: "₹7,999/year"  },
  elite: { monthly: "₹1,999/month", yearly: "₹4,999/year"  },
};

// How many months does each billing cycle grant?
export const BILLING_MONTHS: Record<"monthly" | "yearly", number> = {
  monthly: 1,
  yearly: 12,
};

// ─── Subscription upsert helper ───────────────────────────────────────────────

export async function activateSubscription(opts: {
  userId: string;
  plan: "PRO" | "ELITE";
  billingCycle: "monthly" | "yearly";
  provider: string;
  razorpaySubId?: string;
  stripeSubId?: string;
  stripeCustomerId?: string;
}) {
  const months = BILLING_MONTHS[opts.billingCycle];
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);

  return prisma.subscription.upsert({
    where: { userId: opts.userId },
    create: {
      userId: opts.userId,
      plan: opts.plan,
      status: "ACTIVE",
      provider: opts.provider,
      billingCycle: opts.billingCycle,
      activatedAt: new Date(),
      expiresAt,
      razorpaySubId: opts.razorpaySubId,
      stripeSubId: opts.stripeSubId,
      stripeCustomerId: opts.stripeCustomerId,
    },
    update: {
      plan: opts.plan,
      status: "ACTIVE",
      provider: opts.provider,
      billingCycle: opts.billingCycle,
      activatedAt: new Date(),
      expiresAt,
      ...(opts.razorpaySubId && { razorpaySubId: opts.razorpaySubId }),
      ...(opts.stripeSubId && { stripeSubId: opts.stripeSubId }),
      ...(opts.stripeCustomerId && { stripeCustomerId: opts.stripeCustomerId }),
    },
  });
}
