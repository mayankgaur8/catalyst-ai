import type { AIProvider, AIFeature, AIUserPlan, MetricsSummary, AILogEntry } from "./types";

// ── Initial state ─────────────────────────────────────────────────────────────

const ALL_PROVIDERS: AIProvider[] = ["groq", "gemini", "openrouter", "ollama"];
const ALL_FEATURES: AIFeature[] = [
  "doubt_solver", "video_summary", "quiz_generation",
  "study_planner", "mock_analysis", "weak_area_recommendation", "daily_motivation",
];
const ALL_PLANS: AIUserPlan[] = ["free", "pro", "elite", "admin"];

function makeInitial(): MetricsSummary {
  return {
    totalRequests: 0,
    totalCostUSD:  0,
    cacheHits:     0,
    fallbacks:     0,
    quotaExceeded: 0,
    rateLimited:   0,
    byProvider: Object.fromEntries(
      ALL_PROVIDERS.map((p) => [p, { requests: 0, costUSD: 0, errors: 0 }])
    ) as MetricsSummary["byProvider"],
    byFeature: Object.fromEntries(
      ALL_FEATURES.map((f) => [f, { requests: 0 }])
    ) as MetricsSummary["byFeature"],
    byPlan: Object.fromEntries(
      ALL_PLANS.map((p) => [p, { requests: 0 }])
    ) as MetricsSummary["byPlan"],
  };
}

let summary: MetricsSummary = makeInitial();

// ── Public API ────────────────────────────────────────────────────────────────

export function recordMetric(entry: AILogEntry): void {
  summary.totalRequests++;
  summary.totalCostUSD += entry.costUSD ?? 0;

  if (entry.cached) summary.cacheHits++;
  if ((entry.fallbackAttempts ?? 0) > 0) summary.fallbacks++;
  if (entry.status === "quota_exceeded") summary.quotaExceeded++;

  const prov = summary.byProvider[entry.provider];
  if (prov) {
    prov.requests++;
    prov.costUSD += entry.costUSD ?? 0;
    if (entry.status === "error" || entry.status === "timeout") prov.errors++;
  }

  const feat = summary.byFeature[entry.feature];
  if (feat) feat.requests++;

  if (entry.plan) {
    const pl = summary.byPlan[entry.plan];
    if (pl) pl.requests++;
  }
}

export function recordRateLimited(): void {
  summary.rateLimited++;
}

export function getMetricsSummary(): MetricsSummary {
  return { ...summary };
}

/** Reset all counters — test only. */
export function _resetForTest(): void {
  summary = makeInitial();
}
