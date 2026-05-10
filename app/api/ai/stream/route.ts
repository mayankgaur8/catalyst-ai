import { NextRequest } from "next/server";
import { extractSecureUser } from "@/lib/ai/session";
import { checkRateLimit } from "@/lib/ai/rateLimiter";
import { filterPrompt } from "@/lib/ai/contentFilter";
import { checkAndConsumeQuota } from "@/lib/ai/quota";
import { getCache, setCache } from "@/lib/ai/cache";
import { streamGroq } from "@/lib/ai/providers/groq";
import { routeAI } from "@/lib/ai/aiRouter";
import { buildMessages } from "@/lib/ai/prompts";
import type { AIFeature } from "@/lib/ai/types";
import type { HistoryMessage, UserProfileContext } from "@/lib/ai/prompts";
import { AIRateLimitError, AIQuotaExceededError } from "@/lib/ai/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_FEATURES = new Set<AIFeature>([
  "doubt_solver", "video_summary", "quiz_generation",
  "study_planner", "mock_analysis", "weak_area_recommendation", "daily_motivation",
]);

const enc = new TextEncoder();

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function sseBytes(event: string, data: unknown): Uint8Array {
  return enc.encode(sse(event, data));
}

const SSE_HEADERS = {
  "Content-Type":  "text/event-stream",
  "Cache-Control": "no-cache",
  "Connection":    "keep-alive",
} as const;

// ── Body parsing helpers ──────────────────────────────────────────────────────

function parseHistory(raw: unknown): HistoryMessage[] {
  if (!Array.isArray(raw)) return [];
  return (raw
    .filter((m): m is { role: string; content: string } =>
      typeof m === "object" && m !== null &&
      typeof (m as Record<string, unknown>).role === "string" &&
      typeof (m as Record<string, unknown>).content === "string"
    )
    .filter((m) => m.role === "USER" || m.role === "ASSISTANT")
    .map((m) => ({ role: m.role === "USER" ? "user" : "assistant" as const, content: m.content }))
    .slice(-8)) as HistoryMessage[];
}

function parseUserProfile(raw: unknown): UserProfileContext | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const u = raw as Record<string, unknown>;
  return {
    name:             typeof u.name === "string" ? u.name : undefined,
    targetPercentile: typeof u.targetPercentile === "number" ? u.targetPercentile : undefined,
    weaknesses:       Array.isArray(u.weaknesses) ? (u.weaknesses as string[]).slice(0, 6) : undefined,
    plan:             typeof u.plan === "string" ? u.plan : undefined,
    studyHours:       typeof u.studyHours === "string" ? u.studyHours : undefined,
    exams:            Array.isArray(u.exams) ? (u.exams as string[]) : undefined,
  };
}

// ── POST /api/ai/stream ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { userId, plan, isAdmin } = extractSecureUser(req);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Rate limit
  try {
    await checkRateLimit(ip, userId, plan);
  } catch (err) {
    if (err instanceof AIRateLimitError) {
      return new Response(
        sse("error", { code: "rate_limited", message: "Too many requests. Please slow down." }),
        { status: 429, headers: SSE_HEADERS }
      );
    }
    throw err;
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return new Response(sse("error", { code: "invalid_json" }), { status: 400, headers: SSE_HEADERS });
  }

  const { feature, prompt } = body;
  const history     = parseHistory(body.history);
  const userProfile = parseUserProfile(body.userProfile);

  if (typeof feature !== "string" || !VALID_FEATURES.has(feature as AIFeature)) {
    return new Response(sse("error", { code: "invalid_feature" }), { status: 400, headers: SSE_HEADERS });
  }
  if (typeof prompt !== "string" || prompt.trim().length < 3) {
    return new Response(sse("error", { code: "invalid_prompt" }), { status: 400, headers: SSE_HEADERS });
  }

  // Content filter
  const filterResult = filterPrompt(prompt);
  if (filterResult.blocked) {
    return new Response(
      sse("error", { code: "content_blocked", reason: filterResult.reason }),
      { status: 400, headers: SSE_HEADERS }
    );
  }

  const trimmedPrompt = prompt.trim();
  const typedFeature  = feature as AIFeature;

  // Cache check — stream cached value instantly
  const cacheKey = history.length ? null : trimmedPrompt; // skip cache if has history (personalised)
  const cached = cacheKey ? await getCache(typedFeature, cacheKey) : null;
  if (cached) {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(sseBytes("chunk", { text: cached }));
        controller.enqueue(sseBytes("done",  { provider: "cache", cached: true }));
        controller.close();
      },
    });
    return new Response(stream, { headers: SSE_HEADERS });
  }

  // Quota
  try {
    await checkAndConsumeQuota(userId, plan, typedFeature, isAdmin);
  } catch (err) {
    if (err instanceof AIQuotaExceededError) {
      return new Response(
        sse("error", {
          code: "quota_exceeded",
          message: "You've reached your daily AI request limit.",
          uiMessage: "Daily AI limit reached. Upgrade to Pro for more requests, or try again tomorrow.",
        }),
        { status: 429, headers: SSE_HEADERS }
      );
    }
    throw err;
  }

  // Build context-enriched messages
  const messages = buildMessages(typedFeature, trimmedPrompt, { history, userProfile });

  // Streaming response
  const stream = new ReadableStream({
    async start(controller) {
      let fullText = "";

      try {
        // Primary: Groq streaming with full context
        for await (const chunk of streamGroq(typedFeature, trimmedPrompt, messages)) {
          fullText += chunk;
          controller.enqueue(sseBytes("chunk", { text: chunk }));
        }
        // Cache only context-free responses
        if (!history.length && cacheKey) {
          await setCache(typedFeature, cacheKey, fullText);
        }
        controller.enqueue(sseBytes("done", { provider: "groq", cached: false }));

      } catch {
        // Signal fallback to client before attempting
        controller.enqueue(sseBytes("status", { message: "Trying backup AI model…" }));

        try {
          const result = await routeAI({
            feature: typedFeature, prompt: trimmedPrompt,
            userId, plan, isAdmin, skipQuota: true,
          });
          controller.enqueue(sseBytes("chunk", { text: result.text }));
          controller.enqueue(sseBytes("done",  { provider: result.provider, cached: result.cached }));
        } catch (fallbackErr) {
          const message = fallbackErr instanceof Error
            ? fallbackErr.message
            : "AI mentor is warming up.";
          controller.enqueue(sseBytes("error", { code: "all_failed", message }));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
