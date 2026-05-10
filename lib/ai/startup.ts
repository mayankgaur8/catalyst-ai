// ── CATalyst AI — startup environment validator ───────────────────────────────
// Call ensureAIEnvironment() at the top of each API route handler.
// In production, throws immediately on misconfiguration so the error surfaces
// in deploy logs rather than at runtime during a real user request.

let initialized = false;

/** Mask a key value for safe logging — never logs the actual secret. */
function maskKey(value: string | undefined): string {
  if (!value) return "❌ MISSING";
  return `✅ configured (${value.slice(0, 4)}…)`;
}

export function ensureAIEnvironment(): void {
  if (initialized) return;
  initialized = true;

  const isProd = process.env.NODE_ENV === "production";
  const errors: string[] = [];

  // ── Hard failures (production only) ────────────────────────────────────────

  if (isProd) {
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      errors.push(
        "SESSION_SECRET must be set to a 32+ character random string in production. " +
        "Generate with: openssl rand -base64 32"
      );
    }

    const hasProvider = [
      process.env.GROQ_API_KEY,
      process.env.GEMINI_API_KEY,
      process.env.OPENROUTER_API_KEY,
    ].some(Boolean);

    if (!hasProvider) {
      errors.push(
        "At least one AI provider key is required: GROQ_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY. " +
        "Add them in Vercel → Project → Settings → Environment Variables."
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `[CATalyst AI] Startup configuration error — cannot serve AI requests:\n` +
      errors.map((e) => `  ✗ ${e}`).join("\n") +
      `\n\nSee .env.local.example for all required variables.`
    );
  }

  // ── Always log provider status on boot (safe: masked values only) ──────────

  if (process.env.NODE_ENV === "test") return;

  console.log(
    "[CATalyst AI] Provider configuration:\n" +
    `  GROQ_API_KEY       ${maskKey(process.env.GROQ_API_KEY)}\n` +
    `  GEMINI_API_KEY     ${maskKey(process.env.GEMINI_API_KEY)}\n` +
    `  OPENROUTER_API_KEY ${maskKey(process.env.OPENROUTER_API_KEY)}\n` +
    `  Provider order:    ${process.env.AI_PROVIDER_ORDER ?? "groq,gemini,openrouter,ollama (default)"}`
  );

  const warn = (msg: string) => console.warn(`[CATalyst AI] ⚠ ${msg}`);

  if (!process.env.GROQ_API_KEY)         warn("GROQ_API_KEY not set — Groq disabled");
  if (!process.env.GEMINI_API_KEY)       warn("GEMINI_API_KEY not set — Gemini disabled");
  if (!process.env.OPENROUTER_API_KEY)   warn("OPENROUTER_API_KEY not set — OpenRouter disabled");
  if (!process.env.SESSION_SECRET)       warn("SESSION_SECRET not set — using header-based auth (dev only)");
  if (!process.env.ADMIN_EMAILS)         warn("ADMIN_EMAILS not set — admin console inaccessible");
  if (isProd && !process.env.REDIS_URL)  warn("REDIS_URL not set — using in-memory storage (not suitable for multi-instance prod)");
}

/** Reset for tests — ensures each test file can re-trigger validation. */
export function _resetStartupForTest(): void {
  initialized = false;
}
