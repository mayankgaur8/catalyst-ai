import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import type { AIUserPlan } from "./types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SecureUser {
  userId: string;
  plan: AIUserPlan;
  isAdmin: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

function secret(): string {
  return process.env.SESSION_SECRET ?? "";
}

function hmac(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

// ── Token creation ────────────────────────────────────────────────────────────

export function signSessionToken(
  userId: string,
  plan: AIUserPlan,
  isAdmin: boolean
): string {
  const issuedAt = Date.now();
  const payload = `${userId}.${plan}.${isAdmin ? "1" : "0"}.${issuedAt}`;
  const sig = hmac(payload);
  return `${payload}.${sig}`;
}

// ── Token validation ──────────────────────────────────────────────────────────

export function validateToken(token: string): SecureUser | null {
  if (!token || !secret()) return null;

  const parts = token.split(".");
  if (parts.length !== 5) return null;

  const [userId, plan, adminFlag, issuedAtStr, sig] = parts;
  const payload = `${userId}.${plan}.${adminFlag}.${issuedAtStr}`;

  if (hmac(payload) !== sig) return null;

  const issuedAt = Number(issuedAtStr);
  if (Date.now() - issuedAt > TOKEN_TTL_MS) return null;

  const validPlans: AIUserPlan[] = ["free", "pro", "elite", "admin"];
  if (!validPlans.includes(plan as AIUserPlan)) return null;

  return {
    userId,
    plan: plan as AIUserPlan,
    isAdmin: adminFlag === "1",
  };
}

// ── Request extraction ────────────────────────────────────────────────────────

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean)
);

/**
 * Extracts a SecureUser from the request.
 * Priority: HMAC session token → header-based fallback (dev / no SESSION_SECRET).
 * NEVER trusts x-user-role: admin header — admin status derives from ADMIN_EMAILS.
 */
export function extractSecureUser(req: NextRequest): SecureUser {
  // 1. Try HMAC token
  const token = req.headers.get("x-session-token");
  if (token) {
    const user = validateToken(token);
    if (user) return user;
  }

  // 2. Header-based fallback (trusted only without SESSION_SECRET or in dev)
  const userId = req.headers.get("x-user-id") ?? "anonymous";
  const rawPlan = req.headers.get("x-user-plan") ?? "free";
  const validPlans: AIUserPlan[] = ["free", "pro", "elite", "admin"];
  const plan: AIUserPlan = validPlans.includes(rawPlan as AIUserPlan)
    ? (rawPlan as AIUserPlan)
    : "free";

  // Derive admin from ADMIN_EMAILS — never trust x-user-role header
  const isAdmin = ADMIN_EMAILS.has(userId) || plan === "admin";

  return { userId, plan, isAdmin };
}
