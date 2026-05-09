import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock all four providers before any imports resolve ────────────────────────
// Vitest hoists vi.mock() calls, so these run before module initialization.

vi.mock("@/lib/ai/providers/groq", () => ({ callGroq: vi.fn() }));
vi.mock("@/lib/ai/providers/gemini", () => ({ callGemini: vi.fn() }));
vi.mock("@/lib/ai/providers/openrouter", () => ({ callOpenRouter: vi.fn() }));
vi.mock("@/lib/ai/providers/ollama", () => ({ callOllama: vi.fn() }));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { routeAI } from "@/lib/ai/aiRouter";
import { _clearQuotaForTest, _setDailyUsageForTest } from "@/lib/ai/quota";
import { clearCache } from "@/lib/ai/cache";
import { AIAllProvidersFailedError, AIProviderError, AIQuotaExceededError } from "@/lib/ai/types";

import { callGroq } from "@/lib/ai/providers/groq";
import { callGemini } from "@/lib/ai/providers/gemini";
import { callOpenRouter } from "@/lib/ai/providers/openrouter";
import { callOllama } from "@/lib/ai/providers/ollama";

// ── Shared fixtures ───────────────────────────────────────────────────────────

const FREE_REQUEST = {
  feature:  "doubt_solver" as const,
  prompt:   "What is the remainder when 7^100 is divided by 48?",
  userId:   "user_free_001",
  plan:     "free"  as const,
  isAdmin:  false,
};

const ADMIN_REQUEST = {
  ...FREE_REQUEST,
  userId:  "admin_001",
  plan:    "admin" as const,
  isAdmin: true,
};

const PROVIDER_OK = { text: "The answer is 1.", tokenEstimate: 120 };

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  _clearQuotaForTest();
  clearCache();
  // Guarantee a consistent provider order for every test
  process.env.AI_PROVIDER_ORDER = "groq,gemini,openrouter,ollama";
});

// ── Test suite ────────────────────────────────────────────────────────────────

describe("routeAI", () => {

  // ── 1. Groq success ─────────────────────────────────────────────────────────
  it("returns the Groq result when Groq succeeds", async () => {
    vi.mocked(callGroq).mockResolvedValue(PROVIDER_OK);

    const result = await routeAI(FREE_REQUEST);

    expect(result.text).toBe(PROVIDER_OK.text);
    expect(result.provider).toBe("groq");
    expect(result.cached).toBe(false);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.tokenEstimate).toBe(120);
    expect(callGroq).toHaveBeenCalledOnce();
    expect(callGemini).not.toHaveBeenCalled();
    expect(callOpenRouter).not.toHaveBeenCalled();
  });

  // ── 2. Groq failure → Gemini fallback ───────────────────────────────────────
  it("falls back to Gemini when Groq throws an error", async () => {
    vi.mocked(callGroq).mockRejectedValue(
      new AIProviderError("Groq API rate-limited", "groq")
    );
    vi.mocked(callGemini).mockResolvedValue({ text: "Gemini answer", tokenEstimate: 95 });

    const result = await routeAI(FREE_REQUEST);

    expect(result.provider).toBe("gemini");
    expect(result.text).toBe("Gemini answer");
    expect(callGroq).toHaveBeenCalledOnce();
    expect(callGemini).toHaveBeenCalledOnce();
    expect(callOpenRouter).not.toHaveBeenCalled();
    expect(callOllama).not.toHaveBeenCalled();
  });

  // ── 3. All providers fail ────────────────────────────────────────────────────
  it("throws AIAllProvidersFailedError when every provider fails", async () => {
    vi.mocked(callGroq).mockRejectedValue(new AIProviderError("Groq down", "groq"));
    vi.mocked(callGemini).mockRejectedValue(new AIProviderError("Gemini down", "gemini"));
    vi.mocked(callOpenRouter).mockRejectedValue(new AIProviderError("OpenRouter down", "openrouter"));
    vi.mocked(callOllama).mockRejectedValue(new AIProviderError("Ollama down", "ollama"));

    await expect(routeAI(FREE_REQUEST)).rejects.toBeInstanceOf(AIAllProvidersFailedError);

    // Every provider must have been attempted exactly once
    expect(callGroq).toHaveBeenCalledOnce();
    expect(callGemini).toHaveBeenCalledOnce();
    expect(callOpenRouter).toHaveBeenCalledOnce();
    expect(callOllama).toHaveBeenCalledOnce();
  });

  it("AIAllProvidersFailedError carries per-provider error details", async () => {
    vi.mocked(callGroq).mockRejectedValue(new AIProviderError("timeout", "groq", true));
    vi.mocked(callGemini).mockRejectedValue(new AIProviderError("403", "gemini"));
    vi.mocked(callOpenRouter).mockRejectedValue(new AIProviderError("503", "openrouter"));
    vi.mocked(callOllama).mockRejectedValue(new AIProviderError("connection refused", "ollama"));

    let err!: AIAllProvidersFailedError;
    try { await routeAI(FREE_REQUEST); } catch (e) { err = e as AIAllProvidersFailedError; }

    expect(err).toBeInstanceOf(AIAllProvidersFailedError);
    expect(err.errors).toHaveLength(4);
    expect(err.errors.map((e: { provider: string }) => e.provider)).toEqual(["groq", "gemini", "openrouter", "ollama"]);
  });

  // ── 4. Timeout handling ──────────────────────────────────────────────────────
  it("treats AbortError (timeout) as a non-fatal error and tries the next provider", async () => {
    vi.mocked(callGroq).mockRejectedValue(
      new AIProviderError("Groq request timed out", "groq", true)  // isTimeout=true
    );
    vi.mocked(callGemini).mockResolvedValue({ text: "Gemini saved it", tokenEstimate: 80 });

    const result = await routeAI(FREE_REQUEST);

    expect(result.provider).toBe("gemini");
    expect(result.text).toBe("Gemini saved it");
    expect(callGroq).toHaveBeenCalledOnce();
    expect(callGemini).toHaveBeenCalledOnce();
  });

  it("propagates AIAllProvidersFailedError if every provider times out", async () => {
    const timeout = (p: "groq" | "gemini" | "openrouter" | "ollama") =>
      new AIProviderError(`${p} timed out`, p, true);

    vi.mocked(callGroq).mockRejectedValue(timeout("groq"));
    vi.mocked(callGemini).mockRejectedValue(timeout("gemini"));
    vi.mocked(callOpenRouter).mockRejectedValue(timeout("openrouter"));
    vi.mocked(callOllama).mockRejectedValue(timeout("ollama"));

    await expect(routeAI(FREE_REQUEST)).rejects.toBeInstanceOf(AIAllProvidersFailedError);
  });

  // ── 5. Quota exceeded ────────────────────────────────────────────────────────
  it("throws AIQuotaExceededError when the free daily limit is reached", async () => {
    // Free plan limit = 10 — exhaust it
    _setDailyUsageForTest(FREE_REQUEST.userId, 10);

    await expect(routeAI(FREE_REQUEST)).rejects.toBeInstanceOf(AIQuotaExceededError);

    // No provider should have been called
    expect(callGroq).not.toHaveBeenCalled();
    expect(callGemini).not.toHaveBeenCalled();
  });

  it("AIQuotaExceededError carries the correct user and plan", async () => {
    _setDailyUsageForTest(FREE_REQUEST.userId, 10);

    let err!: AIQuotaExceededError;
    try { await routeAI(FREE_REQUEST); } catch (e) { err = e as AIQuotaExceededError; }

    expect(err).toBeInstanceOf(AIQuotaExceededError);
    expect(err.userId).toBe(FREE_REQUEST.userId);
    expect(err.plan).toBe("free");
    expect(err.feature).toBe("doubt_solver");
  });

  // ── 6. Admin bypasses quota ──────────────────────────────────────────────────
  it("lets admin through even when their usage counter is at the free limit", async () => {
    _setDailyUsageForTest(ADMIN_REQUEST.userId, 10);
    vi.mocked(callGroq).mockResolvedValue({ text: "Admin answer", tokenEstimate: 50 });

    const result = await routeAI(ADMIN_REQUEST);

    expect(result.text).toBe("Admin answer");
    expect(callGroq).toHaveBeenCalledOnce();
  });

  it("admin with isAdmin=false but plan=admin also bypasses quota", async () => {
    const request = { ...FREE_REQUEST, plan: "admin" as const, isAdmin: false };
    _setDailyUsageForTest(request.userId, 999);
    vi.mocked(callGroq).mockResolvedValue(PROVIDER_OK);

    const result = await routeAI(request);
    expect(result.provider).toBe("groq");
  });

  // ── 7. Response caching ──────────────────────────────────────────────────────
  it("returns a cached response without calling any provider on the second request", async () => {
    vi.mocked(callGroq).mockResolvedValue(PROVIDER_OK);

    // First call — should hit Groq and write to cache
    const first = await routeAI(FREE_REQUEST);
    expect(first.cached).toBe(false);
    expect(callGroq).toHaveBeenCalledOnce();

    // Clear all mock call counts (but NOT the in-process cache)
    vi.clearAllMocks();

    // Second call — same feature + prompt → should be served from cache
    const second = await routeAI(FREE_REQUEST);

    expect(second.cached).toBe(true);
    expect(second.text).toBe(PROVIDER_OK.text);
    expect(callGroq).not.toHaveBeenCalled();
    expect(callGemini).not.toHaveBeenCalled();
    expect(callOpenRouter).not.toHaveBeenCalled();
    expect(callOllama).not.toHaveBeenCalled();
  });

  it("does not cache personalized features (mock_analysis)", async () => {
    // mock_analysis has free cap=2, so two requests are allowed
    const req = { ...FREE_REQUEST, feature: "mock_analysis" as const };
    vi.mocked(callGroq).mockResolvedValue(PROVIDER_OK);

    await routeAI(req);
    vi.clearAllMocks();
    vi.mocked(callGroq).mockResolvedValue({ text: "Fresh analysis", tokenEstimate: 60 });

    const second = await routeAI(req);

    // mock_analysis is never cached — Groq must have been called again
    expect(second.cached).toBe(false);
    expect(callGroq).toHaveBeenCalledOnce();
  });

  it("cache treats different prompts as distinct entries", async () => {
    vi.mocked(callGroq).mockResolvedValue(PROVIDER_OK);

    await routeAI(FREE_REQUEST);
    vi.clearAllMocks();
    vi.mocked(callGroq).mockResolvedValue({ text: "Different answer", tokenEstimate: 70 });

    const result = await routeAI({ ...FREE_REQUEST, prompt: "A completely different question?" });

    expect(result.cached).toBe(false);
    expect(callGroq).toHaveBeenCalledOnce();
  });
});
