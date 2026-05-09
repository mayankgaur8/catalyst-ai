import { createHash } from "node:crypto";
import type { AIFeature } from "./types";

// ── Configuration ─────────────────────────────────────────────────────────────

// Features that are personalized — never cache their responses
const NO_CACHE_FEATURES = new Set<AIFeature>([
  "study_planner",
  "mock_analysis",
  "weak_area_recommendation",
]);

const TTL_MS: Record<AIFeature, number> = {
  doubt_solver:             2 * 60 * 60 * 1000,   // 2 h
  video_summary:           24 * 60 * 60 * 1000,   // 24 h
  quiz_generation:          1 * 60 * 60 * 1000,   // 1 h
  daily_motivation:        24 * 60 * 60 * 1000,   // 24 h
  study_planner:            0,                     // no-cache
  mock_analysis:            0,                     // no-cache
  weak_area_recommendation: 0,                     // no-cache
};

// ── Store ─────────────────────────────────────────────────────────────────────

interface CacheEntry {
  text: string;
  expiresAt: number;
}

// Module-level singleton — survives across requests in a single process
const store = new Map<string, CacheEntry>();

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeKey(feature: AIFeature, prompt: string): string {
  const normalized = `${feature}:${prompt.trim().toLowerCase()}`;
  return createHash("sha256").update(normalized).digest("hex").slice(0, 32);
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getCache(feature: AIFeature, prompt: string): string | null {
  if (NO_CACHE_FEATURES.has(feature)) return null;
  const key = makeKey(feature, prompt);
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.text;
}

export function setCache(feature: AIFeature, prompt: string, text: string): void {
  const ttl = TTL_MS[feature];
  if (ttl === 0) return;
  store.set(makeKey(feature, prompt), { text, expiresAt: Date.now() + ttl });
}

/** Evict all expired entries — call periodically if memory is a concern. */
export function evictExpired(): number {
  const now = Date.now();
  let evicted = 0;
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) {
      store.delete(key);
      evicted++;
    }
  }
  return evicted;
}

/** Clear everything — used in tests. */
export function clearCache(): void {
  store.clear();
}

export function getCacheStats(): { size: number } {
  return { size: store.size };
}
