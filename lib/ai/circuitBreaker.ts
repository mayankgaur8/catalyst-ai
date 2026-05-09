import type { AIProvider, ProviderHealth, CircuitState } from "./types";

// ── Configuration ─────────────────────────────────────────────────────────────

const FAILURE_THRESHOLD = 3;    // failures in window before OPEN
const FAILURE_WINDOW_MS = 60_000;  // 60s sliding window
const COOLDOWN_MS       = 30_000;  // 30s before HALF_OPEN probe

// ── State ─────────────────────────────────────────────────────────────────────

interface BreakState {
  state: CircuitState;
  failureTimestamps: number[];
  openedAt: number | null;
}

const ALL_PROVIDERS: AIProvider[] = ["groq", "gemini", "openrouter", "ollama"];

function makeInitial(): BreakState {
  return { state: "CLOSED", failureTimestamps: [], openedAt: null };
}

const states = new Map<AIProvider, BreakState>(
  ALL_PROVIDERS.map((p) => [p, makeInitial()])
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function pruneOldFailures(s: BreakState): void {
  const cutoff = Date.now() - FAILURE_WINDOW_MS;
  s.failureTimestamps = s.failureTimestamps.filter((t) => t > cutoff);
}

function get(provider: AIProvider): BreakState {
  if (!states.has(provider)) states.set(provider, makeInitial());
  return states.get(provider)!;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function canCall(provider: AIProvider): boolean {
  const s = get(provider);

  if (s.state === "CLOSED") return true;

  if (s.state === "OPEN") {
    if (s.openedAt !== null && Date.now() - s.openedAt > COOLDOWN_MS) {
      s.state = "HALF_OPEN";
      return true;   // allow one probe request
    }
    return false;
  }

  // HALF_OPEN — allow through (probe is already in flight)
  return true;
}

export function recordSuccess(provider: AIProvider): void {
  const s = get(provider);
  s.state = "CLOSED";
  s.failureTimestamps = [];
  s.openedAt = null;
}

export function recordFailure(provider: AIProvider): void {
  const s = get(provider);
  pruneOldFailures(s);
  s.failureTimestamps.push(Date.now());

  if (s.state === "HALF_OPEN" || s.failureTimestamps.length >= FAILURE_THRESHOLD) {
    s.state = "OPEN";
    s.openedAt = Date.now();
  }
}

export function getProviderHealth(provider: AIProvider): ProviderHealth {
  const s = get(provider);
  pruneOldFailures(s);
  return {
    provider,
    state: s.state,
    failures: s.failureTimestamps.length,
    lastFailureAt: s.failureTimestamps.at(-1) ?? null,
    openedAt: s.openedAt,
  };
}

export function getAllHealth(): Record<AIProvider, ProviderHealth> {
  return {
    groq:        getProviderHealth("groq"),
    gemini:      getProviderHealth("gemini"),
    openrouter:  getProviderHealth("openrouter"),
    ollama:      getProviderHealth("ollama"),
  };
}

/** Reset all circuit breakers — test only. */
export function _resetForTest(): void {
  ALL_PROVIDERS.forEach((p) => states.set(p, makeInitial()));
}
