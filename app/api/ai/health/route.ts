import { NextResponse } from "next/server";
import { getAllHealth } from "@/lib/ai/circuitBreaker";

export const runtime = "nodejs";

// ── GET /api/ai/health ────────────────────────────────────────────────────────
// Returns which AI providers are configured (key present) and healthy (circuit open/closed).
// Safe to call without authentication — key values are never exposed.
//
// curl https://your-app.vercel.app/api/ai/health

export async function GET() {
  const health = getAllHealth();

  function providerStatus(key: string | undefined, circuitState: string): "configured" | "missing" | "circuit_open" {
    if (!key) return "missing";
    if (circuitState === "OPEN") return "circuit_open";
    return "configured";
  }

  const providers = {
    groq:        providerStatus(process.env.GROQ_API_KEY,       health.groq?.state       ?? "CLOSED"),
    gemini:      providerStatus(process.env.GEMINI_API_KEY,     health.gemini?.state     ?? "CLOSED"),
    openrouter:  providerStatus(process.env.OPENROUTER_API_KEY, health.openrouter?.state ?? "CLOSED"),
  };

  const anyConfigured = Object.values(providers).some((s) => s === "configured");
  const missingKeys   = Object.entries(providers)
    .filter(([, s]) => s === "missing")
    .map(([name]) => `${name.toUpperCase()}_API_KEY`);

  const response = {
    ok: anyConfigured,
    providers,
    ...(missingKeys.length > 0 && {
      missingEnvVars: missingKeys,
      action: `Add the following to Vercel → Project → Settings → Environment Variables: ${missingKeys.join(", ")}`,
    }),
  };

  return NextResponse.json(response, { status: anyConfigured ? 200 : 503 });
}
