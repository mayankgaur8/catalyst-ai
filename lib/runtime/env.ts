import { logStartupOnce, setDependencyStatus } from "@/lib/runtime/ops";

export interface EnvValidationResult {
  ok: boolean;
  missing: string[];
  warnings: string[];
}

export function validateProductionEnvironment(): EnvValidationResult {
  logStartupOnce();

  const isProd = process.env.NODE_ENV === "production";
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (isProd && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) missing.push("SESSION_SECRET (32+ chars)");
  if (isProd && !process.env.REDIS_URL) warnings.push("REDIS_URL missing; queue and cache features will fall back to in-memory mode");
  if (isProd && !process.env.SENTRY_DSN) warnings.push("SENTRY_DSN missing; crash reporting disabled");
  if (isProd && !process.env.OTEL_EXPORTER_OTLP_ENDPOINT) warnings.push("OTEL_EXPORTER_OTLP_ENDPOINT missing; distributed tracing disabled");

  setDependencyStatus("sentry", process.env.SENTRY_DSN ? "healthy" : "degraded", process.env.SENTRY_DSN ? undefined : "missing SENTRY_DSN");
  setDependencyStatus("otel", process.env.OTEL_EXPORTER_OTLP_ENDPOINT ? "healthy" : "degraded", process.env.OTEL_EXPORTER_OTLP_ENDPOINT ? undefined : "missing OTEL_EXPORTER_OTLP_ENDPOINT");

  return {
    ok: missing.length === 0,
    missing,
    warnings,
  };
}
