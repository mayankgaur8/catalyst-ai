import type { AILogEntry } from "./types";

// ── In-process log ring-buffer ────────────────────────────────────────────────

const MAX_ENTRIES = 1000;
const ring: AILogEntry[] = [];

export function logAIRequest(entry: AILogEntry): void {
  ring.unshift(entry);
  if (ring.length > MAX_ENTRIES) ring.pop();

  if (process.env.NODE_ENV !== "production") {
    const { requestId, userId, feature, provider, latencyMs, status, cached, error } = entry;
    console.log(
      `[CATalyst AI] ${status.toUpperCase().padEnd(14)} feature=${feature} provider=${provider} ` +
      `latency=${latencyMs}ms cached=${cached} user=${userId} req=${requestId}` +
      (error ? ` error="${error}"` : "")
    );
  } else {
    // Structured JSON for log aggregators (Datadog, Loki, Axiom…)
    console.log(JSON.stringify(entry));
  }
}

export function getRecentLogs(limit = 50): AILogEntry[] {
  return ring.slice(0, Math.min(limit, MAX_ENTRIES));
}
