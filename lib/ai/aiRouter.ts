import { randomUUID } from "node:crypto";
import type { AIProvider, AIRouteRequest, AIResult } from "./types";
import { AIAllProvidersFailedError, AIProviderError } from "./types";
import { callGroq } from "./providers/groq";
import { callGemini } from "./providers/gemini";
import { callOpenRouter } from "./providers/openrouter";
import { callOllama } from "./providers/ollama";
import { getCache, setCache } from "./cache";
import { checkAndConsumeQuota } from "./quota";
import { logAIRequest } from "./logger";

// ── Provider registry ─────────────────────────────────────────────────────────

type ProviderCaller = typeof callGroq;

const PROVIDERS: Record<AIProvider, ProviderCaller> = {
  groq:        callGroq,
  gemini:      callGemini,
  openrouter:  callOpenRouter,
  ollama:      callOllama,
};

function getProviderOrder(): AIProvider[] {
  const raw = process.env.AI_PROVIDER_ORDER ?? "groq,gemini,openrouter,ollama";
  return raw
    .split(",")
    .map((s) => s.trim() as AIProvider)
    .filter((s) => s in PROVIDERS);
}

// ── Main router ───────────────────────────────────────────────────────────────

/**
 * Routes an AI request through available providers in priority order.
 *
 * Flow:
 *  1. Quota check          — throws AIQuotaExceededError on breach
 *  2. Cache lookup         — returns immediately on hit
 *  3. Provider waterfall   — tries each provider, logs every attempt
 *  4. Cache write          — stores on success
 *  5. All failed           — throws AIAllProvidersFailedError
 */
export async function routeAI(request: AIRouteRequest): Promise<AIResult> {
  const { feature, prompt, userId, plan, isAdmin } = request;
  const requestId = randomUUID();

  // ── 1. Quota ──────────────────────────────────────────────────────────────
  checkAndConsumeQuota(userId, plan, feature, isAdmin);

  // ── 2. Cache lookup ───────────────────────────────────────────────────────
  const cached = getCache(feature, prompt);
  if (cached) {
    logAIRequest({
      requestId, userId, feature,
      provider: "groq",   // doesn't matter for cached; groq is just a placeholder
      latencyMs: 0,
      tokenEstimate: 0,
      status: "success",
      cached: true,
      timestamp: new Date().toISOString(),
    });
    return { text: cached, provider: "groq", latencyMs: 0, tokenEstimate: 0, cached: true };
  }

  // ── 3. Provider waterfall ─────────────────────────────────────────────────
  const order  = getProviderOrder();
  const errors: Array<{ provider: AIProvider; message: string }> = [];

  for (const provider of order) {
    const caller = PROVIDERS[provider];
    const start  = Date.now();

    try {
      const result    = await caller(feature, prompt);
      const latencyMs = Date.now() - start;

      logAIRequest({
        requestId, userId, feature, provider, latencyMs,
        tokenEstimate: result.tokenEstimate,
        status: "success",
        cached: false,
        timestamp: new Date().toISOString(),
      });

      // ── 4. Cache write ──────────────────────────────────────────────────
      setCache(feature, prompt, result.text);

      return { text: result.text, provider, latencyMs, tokenEstimate: result.tokenEstimate, cached: false };

    } catch (err) {
      const latencyMs = Date.now() - start;
      const message   = err instanceof Error ? err.message : String(err);
      const isTimeout = err instanceof AIProviderError && err.isTimeout;

      logAIRequest({
        requestId, userId, feature, provider, latencyMs,
        tokenEstimate: 0,
        status: isTimeout ? "timeout" : "error",
        error: message,
        cached: false,
        timestamp: new Date().toISOString(),
      });

      errors.push({ provider, message });
      // continue to next provider
    }
  }

  // ── 5. All providers failed ───────────────────────────────────────────────
  throw new AIAllProvidersFailedError(errors);
}
