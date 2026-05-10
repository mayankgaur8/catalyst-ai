import type { AIFeature, ProviderResult } from "../types";
import { AIProviderError } from "../types";
import { buildMessages } from "../prompts";

const PROVIDER = "groq" as const;
const TIMEOUT  = 20_000; // 20 s — allows for Vercel cold-start overhead
const API_URL  = "https://api.groq.com/openai/v1/chat/completions";

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

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

interface GroqStreamChunk {
  choices: Array<{ delta: { content?: string }; finish_reason?: string | null }>;
}

/**
 * Streams tokens from Groq using SSE.
 * Accepts optional pre-built messages (with conversation history + personalization).
 * Falls back to buildMessages(feature, prompt) when messages are not provided.
 */
export async function* streamGroq(
  feature: AIFeature,
  prompt: string,
  prebuiltMessages?: ChatMsg[]
): AsyncGenerator<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new AIProviderError("GROQ_API_KEY not configured", PROVIDER);

  const model      = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), TIMEOUT);

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages:    prebuiltMessages ?? buildMessages(feature, prompt),
        max_tokens:  1024,
        temperature: 0.7,
        stream:      true,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    throw new AIProviderError(
      isTimeout ? "Groq stream timed out" : String(err instanceof Error ? err.message : err),
      PROVIDER,
      isTimeout
    );
  }

  if (!res.ok || !res.body) {
    clearTimeout(timer);
    const body = await res.text().catch(() => "");
    throw new AIProviderError(`Groq HTTP ${res.status}: ${body.slice(0, 200)}`, PROVIDER);
  }

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer    = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data) as GroqStreamChunk;
          const chunk  = parsed.choices[0]?.delta?.content;
          if (chunk) yield chunk;
        } catch { /* skip malformed SSE chunks */ }
      }
    }
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}
