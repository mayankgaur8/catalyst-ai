import { prisma } from "@/lib/prisma";
import { getRedisClient } from "@/lib/ai/storage/redis";
import { setDependencyStatus } from "@/lib/runtime/ops";

export interface DependencyHealthResult {
  status: "healthy" | "degraded" | "unavailable";
  latencyMs: number;
  details?: string;
}

export async function checkDatabaseHealth(): Promise<DependencyHealthResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    setDependencyStatus("db", "healthy", "PostgreSQL reachable", latencyMs);
    return { status: "healthy", latencyMs };
  } catch (error) {
    const latencyMs = Date.now() - start;
    const details = error instanceof Error ? error.message : "database check failed";
    setDependencyStatus("db", "unavailable", details, latencyMs);
    return { status: "unavailable", latencyMs, details };
  }
}

export async function checkRedisHealth(): Promise<DependencyHealthResult> {
  const start = Date.now();
  const client = getRedisClient();
  if (!client) {
    const latencyMs = Date.now() - start;
    setDependencyStatus("redis", "degraded", "REDIS_URL not configured; using in-memory fallback", latencyMs);
    return { status: "degraded", latencyMs, details: "REDIS_URL not configured; using in-memory fallback" };
  }

  try {
    await client.ping();
    const latencyMs = Date.now() - start;
    setDependencyStatus("redis", "healthy", "Redis reachable", latencyMs);
    return { status: "healthy", latencyMs };
  } catch (error) {
    const latencyMs = Date.now() - start;
    const details = error instanceof Error ? error.message : "redis check failed";
    setDependencyStatus("redis", "unavailable", details, latencyMs);
    return { status: "unavailable", latencyMs, details };
  }
}

export async function getHealthSnapshot() {
  const [database, redis] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
  ]);

  return {
    database,
    redis,
  };
}
