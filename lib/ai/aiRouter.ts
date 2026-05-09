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
import { canCall, recordSuccess, recordFailure } from "./circuitBreaker";
import { estimateCost, charsToTokens } from "./costs";
import { recordMetric } from "./metrics";

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

function getDefaultModel(provider: AIProvider): string {
  switch (provider) {
    case "groq":       return process.env.GROQ_MODEL       ?? "llama-3.1-8b-instant";
    case "gemini":     return process.env.GEMINI_MODEL     ?? "gemini-2.5-flash-lite";
    case "openrouter": return process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free";
    case "ollama":     return process.env.OLLAMA_MODEL     ?? "llama3.1";
  }
}

// ── Main router ───────────────────────────────────────────────────────────────

/**
 * Routes an AI request through available providers in priority order.
 *
 * Flow:
 *  1. Quota check          — throws AIQuotaExceededError on breach
 *  2. Cache lookup         — returns immediately on hit
 *  3. Provider waterfall   — circuit-breaker guarded, logs every attempt
 *  4. Cache write          — stores on success
 *  5. All failed           — throws AIAllProvidersFailedError
 */
export async function routeAI(request: AIRouteRequest): Promise<AIResult> {
  const { feature, prompt, userId, plan, isAdmin, skipQuota, ipAddress } = request;
  const requestId = randomUUID();
  const traceId   = requestId;

  // ── 1. Quota ──────────────────────────────────────────────────────────────
  if (!skipQuota) {
    await checkAndConsumeQuota(userId, plan, feature, isAdmin);
  }

  // ── 2. Cache lookup ───────────────────────────────────────────────────────
  const cached = await getCache(feature, prompt);
  if (cached) {
    const entry = {
      requestId, traceId, userId, plan, ipAddress, feature,
      provider: "groq" as AIProvider,
      latencyMs: 0, tokenEstimate: 0,
      status: "success" as const,
      cached: true,
      timestamp: new Date().toISOString(),
    };
    logAIRequest(entry);
    recordMetric(entry);
    return {
      text: cached, provider: "groq", latencyMs: 0, tokenEstimate: 0,
      inputTokens: 0, outputTokens: 0, costUSD: 0,
      cached: true, fallbackAttempts: 0,
    };
  }

  // ── 3. Provider waterfall ─────────────────────────────────────────────────
  const order  = getProviderOrder();
  const errors: Array<{ provider: AIProvider; message: string }> = [];
  let fallbackAttempts = 0;

  for (const provider of order) {
    if (!canCall(provider)) {
      errors.push({ provider, message: "circuit breaker open" });
      continue;
    }

    const caller = PROVIDERS[provider];
    const start  = Date.now();

    try {
      const result       = await caller(feature, prompt);
      const latencyMs    = Date.now() - start;
      const model        = getDefaultModel(provider);
      const inputTokens  = result.inputTokens  ?? charsToTokens(prompt.length);
      const outputTokens = result.outputTokens ?? charsToTokens(result.text.length);
      const costUSD      = estimateCost(provider, model, inputTokens, outputTokens);

      recordSuccess(provider);

      const entry = {
        requestId, traceId, userId, plan, ipAddress, feature, provider, latencyMs,
        tokenEstimate: result.tokenEstimate,
        inputTokens, outputTokens, costUSD,
        status: "success" as const,
        cached: false, fallbackAttempts,
        timestamp: new Date().toISOString(),
      };
      logAIRequest(entry);
      recordMetric(entry);

      // ── 4. Cache write ────────────────────────────────────────────────────
      await setCache(feature, prompt, result.text);

      return {
        text: result.text, provider, latencyMs,
        tokenEstimate: result.tokenEstimate,
        inputTokens, outputTokens, costUSD,
        cached: false, fallbackAttempts,
      };

    } catch (err) {
      const latencyMs = Date.now() - start;
      const message   = err instanceof Error ? err.message : String(err);
      const isTimeout = err instanceof AIProviderError && err.isTimeout;

      recordFailure(provider);

      const entry = {
        requestId, traceId, userId, plan, ipAddress, feature, provider, latencyMs,
        tokenEstimate: 0,
        status: (isTimeout ? "timeout" : "error") as "timeout" | "error",
        error: message,
        cached: false, fallbackAttempts,
        timestamp: new Date().toISOString(),
      };
      logAIRequest(entry);
      recordMetric(entry);

      errors.push({ provider, message });
      fallbackAttempts++;
    }
  }

  // ── 5. All providers failed ───────────────────────────────────────────────
  throw new AIAllProvidersFailedError(errors);
}
