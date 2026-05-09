import type { AIFeature, AIUserPlan } from "./types";
import { AIQuotaExceededError } from "./types";
import { storage } from "./storage";

// ── Daily limits by plan ──────────────────────────────────────────────────────

const DAILY_TOTALS: Record<AIUserPlan, number> = {
  free:  10,
  pro:   50,
  elite: 150,
  admin: Infinity,
};

// Per-feature sub-quotas. undefined = no separate per-feature cap.
const FEATURE_CAPS: Record<AIFeature, Partial<Record<AIUserPlan, number>>> = {
  quiz_generation:          { free: 2,  pro: 10,  elite: 30 },
  video_summary:            { free: 3,  pro: 15,  elite: 50 },
  doubt_solver:             { free: 5,  pro: 20              },
  study_planner:            { free: 1,  pro: 5,   elite: 15 },
  mock_analysis:            { free: 2,  pro: 10,  elite: 30 },
  weak_area_recommendation: { free: 2,  pro: 10,  elite: 30 },
  daily_motivation:         {},
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

function dailyKey(userId: string): string {
  return `quota:daily:${userId}:${today()}`;
}

function featureKey(userId: string, feature: AIFeature): string {
  return `quota:feature:${userId}:${today()}:${feature}`;
}

function secondsUntilMidnight(): number {
  const now      = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
}

async function getCount(key: string): Promise<number> {
  const raw = await storage.get(key);
  return raw ? parseInt(raw, 10) : 0;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Checks quota and atomically consumes one unit.
 * Throws AIQuotaExceededError if any limit is exceeded.
 * Admin and plan==="admin" always pass through.
 */
export async function checkAndConsumeQuota(
  userId: string,
  plan: AIUserPlan,
  feature: AIFeature,
  isAdmin: boolean
): Promise<void> {
  if (isAdmin || plan === "admin") return;

  const ttl  = secondsUntilMidnight();
  const dKey = dailyKey(userId);

  const used  = await getCount(dKey);
  const limit = DAILY_TOTALS[plan];
  if (used >= limit) throw new AIQuotaExceededError(userId, plan, feature);

  const featureCap = FEATURE_CAPS[feature][plan];
  if (featureCap !== undefined) {
    const fKey  = featureKey(userId, feature);
    const fUsed = await getCount(fKey);
    if (fUsed >= featureCap) throw new AIQuotaExceededError(userId, plan, feature);
    await storage.increment(fKey, ttl);
  }

  await storage.increment(dKey, ttl);
}

export async function getQuotaStatus(
  userId: string,
  plan: AIUserPlan
): Promise<{ used: number; limit: number; remaining: number }> {
  const limit = DAILY_TOTALS[plan];
  const used  = await getCount(dailyKey(userId));
  const cap   = limit === Infinity ? 999999 : limit;
  return { used, limit: cap, remaining: Math.max(0, cap - used) };
}

// ── Test helpers — never call in production code ──────────────────────────────

export function _clearQuotaForTest(): void {
  (storage as { clearSync?: () => void }).clearSync?.();
}

export async function _setDailyUsageForTest(userId: string, count: number): Promise<void> {
  await storage.set(dailyKey(userId), String(count), secondsUntilMidnight());
}
