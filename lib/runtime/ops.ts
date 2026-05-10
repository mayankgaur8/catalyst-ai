import { getMetricsSummary } from "@/lib/ai/metrics";
import { getRecentLogs } from "@/lib/ai/logger";
import { getAllHealth } from "@/lib/ai/circuitBreaker";

export type DependencyName = "db" | "redis" | "queue" | "sentry" | "otel";
export type DependencyStatus = "healthy" | "degraded" | "unavailable";

export interface DependencySnapshot {
  status: DependencyStatus;
  details?: string;
  latencyMs?: number;
  updatedAt: string;
}

export interface RuntimeSnapshot {
  startedAt: string;
  uptimeSeconds: number;
  nodeEnv: string;
  deploymentTarget: string;
  activeStreams: number;
  streamDisconnects: number;
  requestCount: number;
  avgResponseLatencyMs: number;
  p95ResponseLatencyMs: number;
  memoryMB: number;
  dependencies: Record<DependencyName, DependencySnapshot>;
}

const startedAt = new Date();
let startupLogged = false;
let activeStreams = 0;
let streamDisconnects = 0;
const responseLatencies: number[] = [];

const dependencyState: Record<DependencyName, DependencySnapshot> = {
  db: { status: "degraded", updatedAt: startedAt.toISOString(), details: "not checked yet" },
  redis: { status: "degraded", updatedAt: startedAt.toISOString(), details: "not checked yet" },
  queue: { status: "degraded", updatedAt: startedAt.toISOString(), details: "not checked yet" },
  sentry: { status: "degraded", updatedAt: startedAt.toISOString(), details: "not checked yet" },
  otel: { status: "degraded", updatedAt: startedAt.toISOString(), details: "not checked yet" },
};

export function logStartupOnce(): void {
  if (startupLogged) return;
  startupLogged = true;

  const payload = {
    event: "startup",
    startedAt: startedAt.toISOString(),
    nodeEnv: process.env.NODE_ENV ?? "development",
    deploymentTarget: process.env.VERCEL ? "vercel" : process.env.AZURE_APP_SERVICE ? "azure-app-service" : "local",
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasRedisUrl: Boolean(process.env.REDIS_URL),
    hasSentry: Boolean(process.env.SENTRY_DSN),
    hasOtel: Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT),
  };

  console.log(JSON.stringify(payload));
}

export function incrementActiveStreams(): void {
  activeStreams += 1;
}

export function decrementActiveStreams(): void {
  activeStreams = Math.max(0, activeStreams - 1);
}

export function recordStreamDisconnect(): void {
  streamDisconnects += 1;
}

export function recordResponseLatency(latencyMs: number): void {
  if (!Number.isFinite(latencyMs) || latencyMs < 0) return;
  responseLatencies.push(latencyMs);
  if (responseLatencies.length > 250) responseLatencies.shift();
}

export function setDependencyStatus(
  name: DependencyName,
  status: DependencyStatus,
  details?: string,
  latencyMs?: number
): void {
  dependencyState[name] = {
    status,
    details,
    latencyMs,
    updatedAt: new Date().toISOString(),
  };
}

export function getRuntimeSnapshot(): RuntimeSnapshot {
  const metrics = getMetricsSummary();
  const latencies = getRecentLogs(200)
    .map((entry) => entry.latencyMs)
    .filter((value) => Number.isFinite(value) && value >= 0);

  const sorted = [...latencies].sort((a, b) => a - b);
  const p95Index = sorted.length === 0 ? 0 : Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  const avg = sorted.length ? sorted.reduce((sum, value) => sum + value, 0) / sorted.length : 0;

  return {
    startedAt: startedAt.toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startedAt.getTime()) / 1000),
    nodeEnv: process.env.NODE_ENV ?? "development",
    deploymentTarget: process.env.VERCEL ? "vercel" : process.env.AZURE_APP_SERVICE ? "azure-app-service" : "local",
    activeStreams,
    streamDisconnects,
    requestCount: metrics.totalRequests,
    avgResponseLatencyMs: Math.round(avg),
    p95ResponseLatencyMs: Math.round(sorted[p95Index] ?? 0),
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    dependencies: { ...dependencyState },
  };
}

export function getProviderLatencySeries() {
  const logs = getRecentLogs(120).reverse();
  return logs.map((entry) => ({
    timestamp: entry.timestamp,
    provider: entry.provider,
    latencyMs: entry.latencyMs,
    status: entry.status,
    cached: entry.cached,
  }));
}

export function getSystemHealthOverview() {
  const health = getAllHealth();
  return {
    providers: health,
    runtime: getRuntimeSnapshot(),
  };
}
