import { describe, it, expect } from "vitest";
import { estimateCost, charsToTokens, getModelCosts } from "@/lib/ai/costs";

describe("charsToTokens", () => {
  it("converts exactly 4 chars to 1 token", () => {
    expect(charsToTokens(4)).toBe(1);
  });

  it("rounds up when chars are not a multiple of 4", () => {
    expect(charsToTokens(1)).toBe(1);
    expect(charsToTokens(5)).toBe(2);
    expect(charsToTokens(7)).toBe(2);
    expect(charsToTokens(8)).toBe(2);
    expect(charsToTokens(9)).toBe(3);
  });

  it("handles larger numbers", () => {
    expect(charsToTokens(100)).toBe(25);
    expect(charsToTokens(4000)).toBe(1000);
  });
});

describe("estimateCost", () => {
  it("returns 0 for ollama (local, always free)", () => {
    expect(estimateCost("ollama", "llama3.1", 10_000, 5_000)).toBe(0);
  });

  it("returns 0 for openrouter free-tier wildcard", () => {
    expect(estimateCost("openrouter", "meta-llama/llama-3.1-8b-instruct:free", 1000, 500)).toBe(0);
    expect(estimateCost("openrouter", "some-other-model", 1000, 500)).toBe(0);
  });

  it("correctly prices Groq llama-3.1-8b-instant", () => {
    // input: $0.05/1M, output: $0.08/1M
    // 1_000_000 input + 1_000_000 output = $0.05 + $0.08 = $0.13
    expect(estimateCost("groq", "llama-3.1-8b-instant", 1_000_000, 1_000_000)).toBeCloseTo(0.13, 5);
  });

  it("correctly prices Groq llama-3.3-70b-versatile", () => {
    // input: $0.59/1M, output: $0.79/1M
    expect(estimateCost("groq", "llama-3.3-70b-versatile", 1_000_000, 1_000_000)).toBeCloseTo(1.38, 5);
  });

  it("correctly prices Gemini flash-lite", () => {
    // input: $0.075/1M, output: $0.30/1M
    // 500_000 input + 200_000 output = $0.0375 + $0.06 = $0.0975
    expect(estimateCost("gemini", "gemini-2.5-flash-lite", 500_000, 200_000)).toBeCloseTo(0.0975, 5);
  });

  it("correctly prices Gemini 2.5 flash", () => {
    // input: $0.15/1M, output: $0.60/1M
    expect(estimateCost("gemini", "gemini-2.5-flash", 1_000_000, 1_000_000)).toBeCloseTo(0.75, 5);
  });

  it("falls back to zero cost for an unknown model", () => {
    expect(estimateCost("groq", "nonexistent-model-xyz", 10_000, 5_000)).toBe(0);
    expect(estimateCost("gemini", "gemini-99", 10_000, 5_000)).toBe(0);
  });

  it("returns a small but positive cost for a real paid model with few tokens", () => {
    const cost = estimateCost("groq", "llama-3.1-8b-instant", 100, 50);
    // 100*0.05/1M + 50*0.08/1M = 0.000005 + 0.000004 = 0.000009
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeLessThan(0.01);
  });
});

describe("getModelCosts", () => {
  it("returns a non-empty cost table", () => {
    const table = getModelCosts();
    expect(Object.keys(table).length).toBeGreaterThan(0);
  });

  it("returns a copy — mutations do not affect the module", () => {
    const table = getModelCosts();
    table["groq:llama-3.1-8b-instant"] = { input: 999, output: 999 };
    const fresh = getModelCosts();
    expect(fresh["groq:llama-3.1-8b-instant"].input).not.toBe(999);
  });
});
