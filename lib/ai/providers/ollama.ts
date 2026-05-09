import type { AIFeature, ProviderResult } from "../types";
import { AIProviderError } from "../types";
import { buildSinglePrompt } from "../prompts";

const PROVIDER = "ollama" as const;
const TIMEOUT  = 25_000;

interface OllamaResponse {
  response: string;
  eval_count?: number;
  prompt_eval_count?: number;
}

export async function callOllama(feature: AIFeature, prompt: string): Promise<ProviderResult> {
  const baseUrl    = (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/$/, "");
  const model      = process.env.OLLAMA_MODEL ?? "llama3.1";
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: buildSinglePrompt(feature, prompt),
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new AIProviderError(`Ollama HTTP ${res.status}: ${body.slice(0, 200)}`, PROVIDER);
    }

    const data = await res.json() as OllamaResponse;
    const text = data.response ?? "";
    return {
      text,
      tokenEstimate: (data.eval_count ?? 0) + (data.prompt_eval_count ?? Math.ceil(prompt.length / 4)),
    };
  } catch (err) {
    if (err instanceof AIProviderError) throw err;
    const isTimeout = err instanceof Error && err.name === "AbortError";
    throw new AIProviderError(
      isTimeout ? "Ollama request timed out" : String(err instanceof Error ? err.message : err),
      PROVIDER,
      isTimeout
    );
  } finally {
    clearTimeout(timer);
  }
}
