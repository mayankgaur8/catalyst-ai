import { NextRequest, NextResponse } from "next/server";
import { routeAI } from "@/lib/ai/aiRouter";
import { getQuotaStatus } from "@/lib/ai/quota";
import { getRecentLogs } from "@/lib/ai/logger";
import type { AIFeature, AIUserPlan } from "@/lib/ai/types";
import { AIQuotaExceededError, AIAllProvidersFailedError } from "@/lib/ai/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_FEATURES = new Set<AIFeature>([
  "doubt_solver", "video_summary", "quiz_generation",
  "study_planner", "mock_analysis", "weak_area_recommendation", "daily_motivation",
]);

function extractAuth(req: NextRequest): { userId: string; plan: AIUserPlan; isAdmin: boolean } {
  const userId  = req.headers.get("x-user-id")   ?? "anonymous";
  const role    = req.headers.get("x-user-role")  ?? "user";
  const rawPlan = req.headers.get("x-user-plan")  ?? "free";
  const isAdmin = role === "admin";
  const plan    = isAdmin ? "admin" : (rawPlan as AIUserPlan);
  return { userId, plan, isAdmin };
}

// ── POST /api/ai — main inference endpoint ────────────────────────────────────

export async function POST(req: NextRequest) {
  const { userId, plan, isAdmin } = extractAuth(req);

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

  if (prompt.length > 4000) {
    return NextResponse.json(
      { error: "prompt_too_long", message: "prompt must not exceed 4000 characters" },
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
    });

    return NextResponse.json({
      text:          result.text,
      provider:      result.provider,
      latencyMs:     result.latencyMs,
      tokenEstimate: result.tokenEstimate,
      cached:        result.cached,
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
          error:     "service_unavailable",
          message:   "AI mentor is warming up. Please try again in a moment.",
          // Only expose provider details outside production for debugging
          details:   process.env.NODE_ENV !== "production" ? err.errors : undefined,
        },
        { status: 503 }
      );
    }

    console.error("[POST /api/ai] Unexpected error:", err);
    return NextResponse.json({ error: "internal_error", message: "Something went wrong." }, { status: 500 });
  }
}

// ── GET /api/ai — quota status + admin log viewer ─────────────────────────────

export async function GET(req: NextRequest) {
  const { userId, plan, isAdmin } = extractAuth(req);
  const type = new URL(req.url).searchParams.get("type");

  if (type === "quota") {
    const status = getQuotaStatus(userId, plan);
    return NextResponse.json({ ...status, plan });
  }

  if (type === "logs") {
    if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const limitParam = new URL(req.url).searchParams.get("limit");
    const limit = Math.min(Number(limitParam ?? 50), 200);
    return NextResponse.json({ logs: getRecentLogs(limit) });
  }

  return NextResponse.json(
    { error: "bad_request", message: 'Use ?type=quota or ?type=logs (admin only)' },
    { status: 400 }
  );
}
