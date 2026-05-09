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

// ── Request / Response ────────────────────────────────────────────────────────

export interface AIRequestPayload {
  feature: AIFeature;
  prompt: string;
  context?: Record<string, unknown>;
}

export interface AIRouteRequest extends AIRequestPayload {
  userId: string;
  plan: AIUserPlan;
  isAdmin: boolean;
  /** Skip quota check — used when streaming falls back to routeAI to avoid double-counting */
  skipQuota?: boolean;
  /** IP address forwarded from the edge */
  ipAddress?: string;
}

export interface ProviderResult {
  text: string;
  tokenEstimate: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface AIResult {
  text: string;
  provider: AIProvider;
  latencyMs: number;
  tokenEstimate: number;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  cached: boolean;
  fallbackAttempts: number;
}

// ── Provider health (circuit breaker) ────────────────────────────────────────

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface ProviderHealth {
  provider: AIProvider;
  state: CircuitState;
  failures: number;
  lastFailureAt: number | null;
  openedAt: number | null;
}

// ── Logging ───────────────────────────────────────────────────────────────────

export type AILogStatus = "success" | "error" | "timeout" | "quota_exceeded";

export interface AILogEntry {
  requestId: string;
  traceId?: string;
  userId: string;
  plan?: AIUserPlan;
  ipAddress?: string;
  feature: AIFeature;
  provider: AIProvider;
  latencyMs: number;
  tokenEstimate: number;
  inputTokens?: number;
  outputTokens?: number;
  costUSD?: number;
  status: AILogStatus;
  error?: string;
  cached: boolean;
  fallbackAttempts?: number;
  circuitBreakerTripped?: boolean;
  timestamp: string;
}

// ── Metrics ───────────────────────────────────────────────────────────────────

export interface MetricsSummary {
  totalRequests: number;
  totalCostUSD: number;
  cacheHits: number;
  fallbacks: number;
  quotaExceeded: number;
  rateLimited: number;
  byProvider: Record<AIProvider, { requests: number; costUSD: number; errors: number }>;
  byFeature: Record<AIFeature, { requests: number }>;
  byPlan: Record<AIUserPlan, { requests: number }>;
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

export class AIRateLimitError extends Error {
  readonly ip: string;
  readonly userId: string;
  readonly windowType: "ip" | "user";

  constructor(ip: string, userId: string, windowType: "ip" | "user") {
    super(`Rate limit exceeded (${windowType})`);
    this.name = "AIRateLimitError";
    this.ip = ip;
    this.userId = userId;
    this.windowType = windowType;
  }
}

export class AIContentFilterError extends Error {
  readonly reason: string;

  constructor(reason: string) {
    super(`Prompt blocked: ${reason}`);
    this.name = "AIContentFilterError";
    this.reason = reason;
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
