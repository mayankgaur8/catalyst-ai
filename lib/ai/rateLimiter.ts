import type { AIUserPlan } from "./types";
import { AIRateLimitError } from "./types";
import { storage } from "./storage";

// ── Limits ────────────────────────────────────────────────────────────────────

const IP_LIMIT_PER_MINUTE = 60;

const USER_LIMIT_PER_MINUTE: Record<AIUserPlan, number> = {
  free:  10,
  pro:   30,
  elite: 60,
  admin: Infinity,
};

const WINDOW_SECONDS = 60;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Throws AIRateLimitError if the IP or user has exceeded their per-minute limit.
 * Uses a sliding-window counter backed by the storage adapter.
 */
export async function checkRateLimit(
  ip: string,
  userId: string,
  plan: AIUserPlan
): Promise<void> {
  // IP check
  const ipKey = `ratelimit:ip:${ip}`;
  const ipCount = await storage.increment(ipKey, WINDOW_SECONDS);
  if (ipCount > IP_LIMIT_PER_MINUTE) {
    throw new AIRateLimitError(ip, userId, "ip");
  }

  // User check (skip for admin)
  const userLimit = USER_LIMIT_PER_MINUTE[plan];
  if (userLimit !== Infinity) {
    const userKey = `ratelimit:user:${userId}`;
    const userCount = await storage.increment(userKey, WINDOW_SECONDS);
    if (userCount > userLimit) {
      throw new AIRateLimitError(ip, userId, "user");
    }
  }
}
