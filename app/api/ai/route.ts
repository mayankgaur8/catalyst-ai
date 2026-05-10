import { NextRequest, NextResponse } from "next/server";
import { routeAI } from "@/lib/ai/aiRouter";
import { getQuotaStatus } from "@/lib/ai/quota";
import { getRecentLogs } from "@/lib/ai/logger";
import { extractSecureUser } from "@/lib/ai/session";
import { checkRateLimit } from "@/lib/ai/rateLimiter";
import { filterPrompt } from "@/lib/ai/contentFilter";
import { getMetricsSummary } from "@/lib/ai/metrics";
import { getAllHealth } from "@/lib/ai/circuitBreaker";
import { clearCache } from "@/lib/ai/cache";
import { ensureAIEnvironment } from "@/lib/ai/startup";
import type { AIFeature } from "@/lib/ai/types";
import {
  AIQuotaExceededError,
  AIAllProvidersFailedError,
  AIRateLimitError,
} from "@/lib/ai/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const VALID_FEATURES = new Set<AIFeature>([
  "doubt_solver", "video_summary", "quiz_generation",
  "study_planner", "mock_analysis", "weak_area_recommendation", "daily_motivation",
]);

// ── POST /api/ai — main inference endpoint ────────────────────────────────────

export async function POST(req: NextRequest) {
  ensureAIEnvironment();
  const { userId, plan, isAdmin } = extractSecureUser(req);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    await checkRateLimit(ip, userId, plan);
  } catch (err) {
    if (err instanceof AIRateLimitError) {
      return NextResponse.json(
        { error: "rate_limited", message: "Too many requests. Please slow down.", windowType: err.windowType },
        { status: 429 }
      );
    }
    throw err;
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { feature, prompt, context } = body;

  if (typeof feature !== "string" || !VALID_FEATURES.has(feature as AIFeature)) {
    return NextResponse.json(
      { error: "invalid_feature", message: `feature must be one of: ${[...VALID_FEATURES].join(", ")}` },
      { status: 400 }
    );
  }

  if (typeof prompt !== "string" || prompt.trim().length < 3) {
    return NextResponse.json(
      { error: "invalid_prompt", message: "prompt must be a non-empty string (min 3 chars)" },
      { status: 400 }
    );
  }

  const filterResult = filterPrompt(prompt);
  if (filterResult.blocked) {
    return NextResponse.json(
      { error: "content_blocked", reason: filterResult.reason, message: "Your request was blocked by the content filter." },
      { status: 400 }
    );
  }

  try {
    const result = await routeAI({
      feature:  feature as AIFeature,
      prompt:   prompt.trim(),
      context:  typeof context === "object" && context !== null ? (context as Record<string, unknown>) : undefined,
      userId,
      plan,
      isAdmin,
      ipAddress: ip,
    });

    return NextResponse.json({
      text:             result.text,
      provider:         result.provider,
      latencyMs:        result.latencyMs,
      tokenEstimate:    result.tokenEstimate,
      costUSD:          result.costUSD,
      cached:           result.cached,
      fallbackAttempts: result.fallbackAttempts,
    });

  } catch (err) {
    if (err instanceof AIQuotaExceededError) {
      return NextResponse.json(
        {
          error:     "quota_exceeded",
          message:   "You've reached your daily AI request limit.",
          uiMessage: "AI mentor is warming up. Upgrade to Pro for more daily requests, or try again tomorrow.",
          plan,
        },
        { status: 429 }
      );
    }

    if (err instanceof AIAllProvidersFailedError) {
      return NextResponse.json(
        {
          error:   "service_unavailable",
          message: "AI mentor is warming up. Please try again in a moment.",
          details: process.env.NODE_ENV !== "production" ? err.errors : undefined,
        },
        { status: 503 }
      );
    }

    console.error("[POST /api/ai] Unexpected error:", err);
    return NextResponse.json({ error: "internal_error", message: "Something went wrong." }, { status: 500 });
  }
}

// ── GET /api/ai — quota, logs, metrics, health ────────────────────────────────

export async function GET(req: NextRequest) {
  const { userId, plan, isAdmin } = extractSecureUser(req);
  const type = new URL(req.url).searchParams.get("type");

  if (type === "quota") {
    const status = await getQuotaStatus(userId, plan);
    return NextResponse.json({ ...status, plan });
  }

  if (type === "logs") {
    if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const limitParam = new URL(req.url).searchParams.get("limit");
    const limit = Math.min(Number(limitParam ?? 50), 200);
    return NextResponse.json({ logs: getRecentLogs(limit) });
  }

  if (type === "metrics") {
    if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ metrics: getMetricsSummary() });
  }

  if (type === "health") {
    if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ health: getAllHealth() });
  }

  return NextResponse.json(
    { error: "bad_request", message: "Use ?type=quota, ?type=logs, ?type=metrics, or ?type=health (admin only)" },
    { status: 400 }
  );
}

// ── DELETE /api/ai — admin cache clear ───────────────────────────────────────

export async function DELETE(req: NextRequest) {
  ensureAIEnvironment();
  const { isAdmin } = extractSecureUser(req);
  if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  clearCache();
  return NextResponse.json({ success: true, message: "In-process cache cleared." });
}
