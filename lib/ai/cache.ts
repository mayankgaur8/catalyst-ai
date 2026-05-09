import { createHash } from "node:crypto";
import type { AIFeature } from "./types";
import { storage } from "./storage";

// ── Configuration ─────────────────────────────────────────────────────────────

const NO_CACHE_FEATURES = new Set<AIFeature>([
  "study_planner",
  "mock_analysis",
  "weak_area_recommendation",
]);

const TTL_SECONDS: Record<AIFeature, number> = {
  doubt_solver:             2 * 60 * 60,   // 2 h
  video_summary:           24 * 60 * 60,   // 24 h
  quiz_generation:          1 * 60 * 60,   // 1 h
  daily_motivation:        24 * 60 * 60,   // 24 h
  study_planner:            0,
  mock_analysis:            0,
  weak_area_recommendation: 0,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeKey(feature: AIFeature, prompt: string): string {
  const normalized = `${feature}:${prompt.trim().toLowerCase()}`;
  return "cache:" + createHash("sha256").update(normalized).digest("hex").slice(0, 32);
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getCache(feature: AIFeature, prompt: string): Promise<string | null> {
  if (NO_CACHE_FEATURES.has(feature)) return null;
  return storage.get(makeKey(feature, prompt));
}

export async function setCache(feature: AIFeature, prompt: string, text: string): Promise<void> {
  const ttl = TTL_SECONDS[feature];
  if (ttl === 0) return;
  await storage.set(makeKey(feature, prompt), text, ttl);
}

/** Clear all cached entries — dev/test only (no-op against Redis). */
export function clearCache(): void {
  (storage as { clearSync?: () => void }).clearSync?.();
}
