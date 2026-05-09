import type { AIFeature, ProviderResult } from "../types";
import { AIProviderError } from "../types";
import { buildMessages } from "../prompts";

const PROVIDER = "openrouter" as const;
const TIMEOUT  = 20_000;
const API_URL  = "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterResponse {
  choices: Array<{ message: { content: string } }>;
  usage?: { total_tokens: number };
}

export async function callOpenRouter(feature: AIFeature, prompt: string): Promise<ProviderResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new AIProviderError("OPENROUTER_API_KEY not configured", PROVIDER);

  // Default to a known free model; override with OPENROUTER_MODEL env var
  const model      = process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free";
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://catalystai.app",
        "X-Title": "CATalyst AI",
      },
      body: JSON.stringify({
        model,
        messages: buildMessages(feature, prompt),
        max_tokens: 1024,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new AIProviderError(`OpenRouter HTTP ${res.status}: ${body.slice(0, 200)}`, PROVIDER);
    }

    const data = await res.json() as OpenRouterResponse;
    const text = data.choices[0]?.message?.content ?? "";
    return {
      text,
      tokenEstimate: data.usage?.total_tokens ?? Math.ceil((prompt.length + text.length) / 4),
    };
  } catch (err) {
    if (err instanceof AIProviderError) throw err;
    const isTimeout = err instanceof Error && err.name === "AbortError";
    throw new AIProviderError(
      isTimeout ? "OpenRouter request timed out" : String(err instanceof Error ? err.message : err),
      PROVIDER,
      isTimeout
    );
  } finally {
    clearTimeout(timer);
  }
}
