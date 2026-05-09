import type { AIFeature, ProviderResult } from "../types";
import { AIProviderError } from "../types";
import { buildSinglePrompt } from "../prompts";

const PROVIDER = "gemini" as const;
const TIMEOUT  = 20_000;
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiResponse {
  candidates?: Array<{
    content: { parts: Array<{ text: string }> };
  }>;
  usageMetadata?: { totalTokenCount: number };
}

export async function callGemini(feature: AIFeature, prompt: string): Promise<ProviderResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AIProviderError("GEMINI_API_KEY not configured", PROVIDER);

  const model      = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(`${API_BASE}/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildSinglePrompt(feature, prompt) }] }],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new AIProviderError(`Gemini HTTP ${res.status}: ${body.slice(0, 200)}`, PROVIDER);
    }

    const data = await res.json() as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return {
      text,
      tokenEstimate: data.usageMetadata?.totalTokenCount ?? Math.ceil((prompt.length + text.length) / 4),
    };
  } catch (err) {
    if (err instanceof AIProviderError) throw err;
    const isTimeout = err instanceof Error && err.name === "AbortError";
    throw new AIProviderError(
      isTimeout ? "Gemini request timed out" : String(err instanceof Error ? err.message : err),
      PROVIDER,
      isTimeout
    );
  } finally {
    clearTimeout(timer);
  }
}
