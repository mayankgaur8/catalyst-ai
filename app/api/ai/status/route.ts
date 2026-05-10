import { NextResponse } from "next/server";
import { getAllHealth } from "@/lib/ai/circuitBreaker";

export const runtime = "nodejs";

// ── GET /api/ai/status ────────────────────────────────────────────────────────
// Returns which AI providers are configured and their circuit-breaker health.
// Used for admin diagnostics and production debugging.
// API keys are never exposed — only their presence is reported.

export async function GET() {
  const health = getAllHealth();

  const providers = {
    groq: {
      configured: Boolean(process.env.GROQ_API_KEY),
      model: process.env.GROQ_MODEL ?? "llama-3.1-8b-instant",
      circuitBreaker: health.groq?.state ?? "CLOSED",
    },
    gemini: {
      configured: Boolean(process.env.GEMINI_API_KEY),
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
      circuitBreaker: health.gemini?.state ?? "CLOSED",
    },
    openrouter: {
      configured: Boolean(process.env.OPENROUTER_API_KEY),
      model: process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free",
      circuitBreaker: health.openrouter?.state ?? "CLOSED",
    },
    ollama: {
      configured: true, // No key needed — availability depends on OLLAMA_BASE_URL connectivity
      baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
      model: process.env.OLLAMA_MODEL ?? "llama3.1",
      circuitBreaker: health.ollama?.state ?? "CLOSED",
    },
  };

  const anyConfigured = providers.groq.configured || providers.gemini.configured || providers.openrouter.configured;

  const missing: string[] = [];
  if (!providers.groq.configured)       missing.push("GROQ_API_KEY");
  if (!providers.gemini.configured)     missing.push("GEMINI_API_KEY");
  if (!providers.openrouter.configured) missing.push("OPENROUTER_API_KEY");
  if (!process.env.SESSION_SECRET)      missing.push("SESSION_SECRET");

  return NextResponse.json({
    ok: anyConfigured,
    providerOrder: (process.env.AI_PROVIDER_ORDER ?? "groq,gemini,openrouter,ollama").split(",").map((s) => s.trim()),
    providers,
    // Tells operators exactly which env vars to set
    missingEnvVars: missing,
    // Surface any misconfiguration clearly
    diagnosis: anyConfigured
      ? "At least one provider is configured. AI requests should succeed."
      : `No AI provider keys are set. Set at least one of: ${missing.slice(0, 3).join(", ")} in your Vercel Environment Variables.`,
  });
}
