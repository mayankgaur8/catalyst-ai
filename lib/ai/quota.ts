import type { AIFeature, AIUserPlan } from "./types";
import { AIQuotaExceededError } from "./types";

// ── Daily limits by plan ──────────────────────────────────────────────────────

const DAILY_TOTALS: Record<AIUserPlan, number> = {
  free:  10,
  pro:   50,
  elite: 150,
  admin: Infinity,
};

// Per-feature sub-quotas (a subset of the daily total).
// undefined means "no separate per-feature cap beyond the daily total".
const FEATURE_CAPS: Record<AIFeature, Partial<Record<AIUserPlan, number>>> = {
  quiz_generation:          { free: 2,  pro: 10,  elite: 30 },
  video_summary:            { free: 3,  pro: 15,  elite: 50 },
  doubt_solver:             { free: 5,  pro: 20              },
  study_planner:            { free: 1,  pro: 5,   elite: 15 },
  mock_analysis:            { free: 2,  pro: 10,  elite: 30 },
  weak_area_recommendation: { free: 2,  pro: 10,  elite: 30 },
  daily_motivation:         {},
};

// ── In-memory usage store ─────────────────────────────────────────────────────
// key: "userId:YYYY-MM-DD"           → total requests today
// key: "userId:YYYY-MM-DD:feature"   → per-feature requests today

const dailyUsage   = new Map<string, number>();
const featureUsage = new Map<string, number>();

function today(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function dailyKey(userId: string): string {
  return `${userId}:${today()}`;
}

function featureKey(userId: string, feature: AIFeature): string {
  return `${userId}:${today()}:${feature}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Checks quota and atomically consumes one unit.
 * Throws AIQuotaExceededError if any limit is exceeded.
 * Admin and plan==="admin" always pass through.
 */
export function checkAndConsumeQuota(
  userId: string,
  plan: AIUserPlan,
  feature: AIFeature,
  isAdmin: boolean
): void {
  if (isAdmin || plan === "admin") return;

  const dKey  = dailyKey(userId);
  const used  = dailyUsage.get(dKey) ?? 0;
  const limit = DAILY_TOTALS[plan];

  if (used >= limit) throw new AIQuotaExceededError(userId, plan, feature);

  const featureCap = FEATURE_CAPS[feature][plan];
  if (featureCap !== undefined) {
    const fKey  = featureKey(userId, feature);
    const fUsed = featureUsage.get(fKey) ?? 0;
    if (fUsed >= featureCap) throw new AIQuotaExceededError(userId, plan, feature);
    featureUsage.set(fKey, fUsed + 1);
  }

  dailyUsage.set(dKey, used + 1);
}

export function getQuotaStatus(
  userId: string,
  plan: AIUserPlan
): { used: number; limit: number; remaining: number } {
  const limit = DAILY_TOTALS[plan];
  const used  = dailyUsage.get(dailyKey(userId)) ?? 0;
  const cap   = limit === Infinity ? 999999 : limit;
  return { used, limit: cap, remaining: Math.max(0, cap - used) };
}

// ── Test helpers (never call in production code) ──────────────────────────────

export function _clearQuotaForTest(): void {
  dailyUsage.clear();
  featureUsage.clear();
}

export function _setDailyUsageForTest(userId: string, count: number): void {
  dailyUsage.set(`${userId}:${today()}`, count);
}
