import type { AIFeature, ProviderResult } from "../types";
import { AIProviderError } from "../types";
import { buildMessages } from "../prompts";

const PROVIDER  = "groq" as const;
const TIMEOUT   = 15_000;
const API_URL   = "https://api.groq.com/openai/v1/chat/completions";

interface GroqResponse {
  choices: Array<{ message: { content: string } }>;
  usage?: { total_tokens: number };
}

export async function callGroq(feature: AIFeature, prompt: string): Promise<ProviderResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new AIProviderError("GROQ_API_KEY not configured", PROVIDER);

  const model      = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
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
      throw new AIProviderError(`Groq HTTP ${res.status}: ${body.slice(0, 200)}`, PROVIDER);
    }

    const data = await res.json() as GroqResponse;
    const text = data.choices[0]?.message?.content ?? "";
    return {
      text,
      tokenEstimate: data.usage?.total_tokens ?? Math.ceil((prompt.length + text.length) / 4),
    };
  } catch (err) {
    if (err instanceof AIProviderError) throw err;
    const isTimeout = err instanceof Error && err.name === "AbortError";
    throw new AIProviderError(
      isTimeout ? "Groq request timed out" : String(err instanceof Error ? err.message : err),
      PROVIDER,
      isTimeout
    );
  } finally {
    clearTimeout(timer);
  }
}
