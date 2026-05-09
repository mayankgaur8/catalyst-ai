import type { AIProvider } from "./types";

// ── Cost table: USD per 1M tokens ────────────────────────────────────────────
// Sourced from provider pricing pages (2025). Update as pricing changes.

const COST_TABLE: Record<string, { input: number; output: number }> = {
  "groq:llama-3.1-8b-instant":                          { input: 0.05,  output: 0.08  },
  "groq:llama-3.3-70b-versatile":                        { input: 0.59,  output: 0.79  },
  "groq:mixtral-8x7b-32768":                             { input: 0.27,  output: 0.27  },
  "gemini:gemini-2.5-flash-lite":                        { input: 0.075, output: 0.30  },
  "gemini:gemini-2.5-flash":                             { input: 0.15,  output: 0.60  },
  "gemini:gemini-2.0-flash":                             { input: 0.10,  output: 0.40  },
  "openrouter:meta-llama/llama-3.1-8b-instruct:free":   { input: 0,     output: 0     },
  "openrouter:*":                                        { input: 0,     output: 0     },
  "ollama:*":                                            { input: 0,     output: 0     },
};

function lookupCost(provider: AIProvider, model: string): { input: number; output: number } {
  return (
    COST_TABLE[`${provider}:${model}`] ??
    COST_TABLE[`${provider}:*`] ??
    { input: 0, output: 0 }
  );
}

/**
 * Returns estimated cost in USD for a request.
 * Token counts are approximate (4 chars ≈ 1 token).
 */
export function estimateCost(
  provider: AIProvider,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const { input, output } = lookupCost(provider, model);
  return (input * inputTokens + output * outputTokens) / 1_000_000;
}

export function getModelCosts(): typeof COST_TABLE {
  return { ...COST_TABLE };
}

/** Rough token count from character length. */
export function charsToTokens(chars: number): number {
  return Math.ceil(chars / 4);
}
