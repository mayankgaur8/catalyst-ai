import { NextRequest } from "next/server";
import { extractSecureUser } from "@/lib/ai/session";
import { checkRateLimit } from "@/lib/ai/rateLimiter";
import { filterPrompt } from "@/lib/ai/contentFilter";
import { checkAndConsumeQuota } from "@/lib/ai/quota";
import { getCache, setCache } from "@/lib/ai/cache";
import { streamGroq } from "@/lib/ai/providers/groq";
import { routeAI } from "@/lib/ai/aiRouter";
import { buildMessages, type HistoryMessage, type UserProfileContext } from "@/lib/ai/prompts";
import type { AIFeature } from "@/lib/ai/types";
import { AIRateLimitError, AIQuotaExceededError, AIAllProvidersFailedError } from "@/lib/ai/types";
import { decrementActiveStreams, incrementActiveStreams, recordResponseLatency, recordStreamDisconnect } from "@/lib/runtime/ops";
import { ensureAIEnvironment } from "@/lib/ai/startup";

// ── Vercel runtime — must be Node.js for streaming SSE ────────────────────────
export const runtime = "nodejs";
export const maxDuration = 60; // seconds (requires Vercel Pro or higher)

const VALID_FEATURES = new Set<AIFeature>([
  "doubt_solver",
  "video_summary",
  "quiz_generation",
  "study_planner",
  "mock_analysis",
  "weak_area_recommendation",
  "daily_motivation",
]);

const encoder = new TextEncoder();

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function sseBytes(event: string, data: unknown): Uint8Array {
  return encoder.encode(sse(event, data));
}

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
} as const;

function parseHistory(raw: unknown): HistoryMessage[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((message): message is { role: string; content: string } => {
      return (
        typeof message === "object" &&
        message !== null &&
        typeof (message as Record<string, unknown>).role === "string" &&
        typeof (message as Record<string, unknown>).content === "string"
      );
    })
    .filter((message) => message.role === "USER" || message.role === "ASSISTANT")
    .map((message) => ({
      role: message.role === "USER" ? "user" : "assistant",
      content: message.content,
    }))
    .slice(-8) as HistoryMessage[];
}

function parseUserProfile(raw: unknown): UserProfileContext | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;

  const profile = raw as Record<string, unknown>;
  return {
    name: typeof profile.name === "string" ? profile.name : undefined,
    targetPercentile: typeof profile.targetPercentile === "number" ? profile.targetPercentile : undefined,
    weaknesses: Array.isArray(profile.weaknesses) ? (profile.weaknesses as string[]).slice(0, 6) : undefined,
    plan: typeof profile.plan === "string" ? profile.plan : undefined,
    studyHours: typeof profile.studyHours === "string" ? profile.studyHours : undefined,
    exams: Array.isArray(profile.exams) ? (profile.exams as string[]) : undefined,
  };
}

export async function POST(req: NextRequest) {
  // Validate environment up-front; throws a 500 in production if keys are missing
  try {
    ensureAIEnvironment();
  } catch (startupErr) {
    const msg = startupErr instanceof Error ? startupErr.message : "AI service misconfigured";
    console.error("[AI stream] startup validation failed:", msg);
    return new Response(
      sse("error", {
        code: "AI_KEYS_MISSING",
        message: "AI provider API keys are missing in production environment. Add GROQ_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY in Vercel → Project → Settings → Environment Variables, then redeploy.",
      }),
      { status: 503, headers: SSE_HEADERS }
    );
  }

  const { userId, plan, isAdmin } = extractSecureUser(req);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    await checkRateLimit(ip, userId, plan);
  } catch (error) {
    if (error instanceof AIRateLimitError) {
      return new Response(sse("error", { code: "rate_limited", message: "Too many requests. Please slow down." }), {
        status: 429,
        headers: SSE_HEADERS,
      });
    }
    throw error;
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return new Response(sse("error", { code: "invalid_json" }), { status: 400, headers: SSE_HEADERS });
  }

  const feature = body.feature;
  const prompt = body.prompt;
  const history = parseHistory(body.history);
  const userProfile = parseUserProfile(body.userProfile);

  if (typeof feature !== "string" || !VALID_FEATURES.has(feature as AIFeature)) {
    return new Response(sse("error", { code: "invalid_feature" }), { status: 400, headers: SSE_HEADERS });
  }
  if (typeof prompt !== "string" || prompt.trim().length < 3) {
    return new Response(sse("error", { code: "invalid_prompt" }), { status: 400, headers: SSE_HEADERS });
  }

  const filterResult = filterPrompt(prompt);
  if (filterResult.blocked) {
    return new Response(sse("error", { code: "content_blocked", reason: filterResult.reason }), {
      status: 400,
      headers: SSE_HEADERS,
    });
  }

  const trimmedPrompt = prompt.trim();
  const typedFeature = feature as AIFeature;
  const messages = buildMessages(typedFeature, trimmedPrompt, { history, userProfile });

  const cacheKey = history.length ? null : trimmedPrompt;
  const cached = cacheKey ? await getCache(typedFeature, cacheKey) : null;
  if (cached) {
    const cachedStream = new ReadableStream({
      start(controller) {
        controller.enqueue(sseBytes("chunk", { text: cached }));
        controller.enqueue(sseBytes("done", { provider: "cache", cached: true }));
        controller.close();
      },
    });
    return new Response(cachedStream, { headers: SSE_HEADERS });
  }

  try {
    await checkAndConsumeQuota(userId, plan, typedFeature, isAdmin);
  } catch (error) {
    if (error instanceof AIQuotaExceededError) {
      return new Response(
        sse("error", {
          code: "quota_exceeded",
          message: "You've reached your daily AI request limit.",
          uiMessage: "Daily AI limit reached. Upgrade to Pro for more requests, or try again tomorrow.",
        }),
        { status: 429, headers: SSE_HEADERS }
      );
    }
    throw error;
  }

  const startedAt = Date.now();
  incrementActiveStreams();
  let disconnected = false;

  const abortHandler = () => {
    if (disconnected) return;
    disconnected = true;
    recordStreamDisconnect();
    decrementActiveStreams();
  };

  req.signal.addEventListener("abort", abortHandler, { once: true });

  const stream = new ReadableStream({
    async start(controller) {
      let fullText = "";

      try {
        for await (const chunk of streamGroq(typedFeature, trimmedPrompt, messages)) {
          fullText += chunk;
          controller.enqueue(sseBytes("chunk", { text: chunk }));
        }

        if (!history.length && cacheKey) {
          await setCache(typedFeature, cacheKey, fullText);
        }

        controller.enqueue(sseBytes("done", { provider: "groq", cached: false }));
      } catch (groqErr) {
        const groqMsg = groqErr instanceof Error ? groqErr.message : String(groqErr);
        console.error("[AI stream] Groq failed, trying fallback providers:", groqMsg);
        controller.enqueue(sseBytes("status", { message: "Trying backup AI model…" }));

        try {
          const result = await routeAI({
            feature: typedFeature,
            prompt: trimmedPrompt,
            userId,
            plan,
            isAdmin,
            skipQuota: true,
          });
          controller.enqueue(sseBytes("chunk", { text: result.text }));
          controller.enqueue(sseBytes("done", { provider: result.provider, cached: result.cached }));
        } catch (fallbackErr) {
          const isAllFailed = fallbackErr instanceof AIAllProvidersFailedError;
          const message = isAllFailed
            ? fallbackErr.message  // now includes per-provider reasons e.g. "groq: GROQ_API_KEY not configured; gemini: ..."
            : fallbackErr instanceof Error
              ? fallbackErr.message
              : "AI mentor is warming up.";
          const providerErrors = isAllFailed ? fallbackErr.errors : undefined;

          console.error("[AI stream] All providers failed:", message);
          controller.enqueue(sseBytes("error", {
            code: "all_failed",
            message,
            // Surface per-provider errors for admin diagnostics
            providerErrors,
          }));
        }
      } finally {
        controller.close();
        req.signal.removeEventListener("abort", abortHandler);
        if (!disconnected) {
          decrementActiveStreams();
          recordResponseLatency(Date.now() - startedAt);
        }
      }
    },
    cancel() {
      if (disconnected) return;
      disconnected = true;
      recordStreamDisconnect();
      decrementActiveStreams();
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
