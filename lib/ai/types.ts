// ── AI Provider abstraction layer — shared types ──────────────────────────────

export type AIFeature =
  | "doubt_solver"
  | "video_summary"
  | "quiz_generation"
  | "study_planner"
  | "mock_analysis"
  | "weak_area_recommendation"
  | "daily_motivation";

export type AIProvider = "groq" | "gemini" | "openrouter" | "ollama";

export type AIUserPlan = "free" | "pro" | "elite" | "admin";

// ── Request / Response shapes ─────────────────────────────────────────────────

export interface AIRequestPayload {
  feature: AIFeature;
  prompt: string;
  context?: Record<string, unknown>;
}

export interface AIRouteRequest extends AIRequestPayload {
  userId: string;
  plan: AIUserPlan;
  isAdmin: boolean;
}

export interface ProviderResult {
  text: string;
  tokenEstimate: number;
}

export interface AIResult {
  text: string;
  provider: AIProvider;
  latencyMs: number;
  tokenEstimate: number;
  cached: boolean;
}

// ── Logging ───────────────────────────────────────────────────────────────────

export type AILogStatus = "success" | "error" | "timeout" | "quota_exceeded";

export interface AILogEntry {
  requestId: string;
  userId: string;
  feature: AIFeature;
  provider: AIProvider;
  latencyMs: number;
  tokenEstimate: number;
  status: AILogStatus;
  error?: string;
  cached: boolean;
  timestamp: string;
}

// ── Errors ────────────────────────────────────────────────────────────────────

export class AIProviderError extends Error {
  readonly provider: AIProvider;
  readonly isTimeout: boolean;

  constructor(message: string, provider: AIProvider, isTimeout = false) {
    super(message);
    this.name = "AIProviderError";
    this.provider = provider;
    this.isTimeout = isTimeout;
  }
}

export class AIQuotaExceededError extends Error {
  readonly userId: string;
  readonly plan: AIUserPlan;
  readonly feature: AIFeature;

  constructor(userId: string, plan: AIUserPlan, feature: AIFeature) {
    super(`Daily AI quota exceeded (plan: ${plan})`);
    this.name = "AIQuotaExceededError";
    this.userId = userId;
    this.plan = plan;
    this.feature = feature;
  }
}

export class AIAllProvidersFailedError extends Error {
  readonly errors: Array<{ provider: AIProvider; message: string }>;

  constructor(errors: Array<{ provider: AIProvider; message: string }>) {
    super("All AI providers failed");
    this.name = "AIAllProvidersFailedError";
    this.errors = errors;
  }
}
