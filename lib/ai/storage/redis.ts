import type { AIStorage } from "./types";

let redisClient: import("ioredis").Redis | null = null;
let initAttempted = false;

export function getRedisUrl(): string | null {
  return process.env.REDIS_URL ?? null;
}

export function getRedisClient(): import("ioredis").Redis | null {
  if (initAttempted) return redisClient;
  initAttempted = true;

  const url = getRedisUrl();
  if (!url) return null;

  try {
    // Dynamic require to avoid module-level import failure when ioredis isn't available
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { default: Redis } = require("ioredis") as { default: typeof import("ioredis").Redis };
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      enableReadyCheck: false,
    });
    redisClient.on("error", (err: Error) => {
      console.error("[RedisStorage] connection error:", err.message);
    });
  } catch (err) {
    console.warn("[RedisStorage] failed to init:", (err as Error).message);
  }

  return redisClient;
}

export async function pingRedis(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;
  try {
    return (await client.ping()) === "PONG";
  } catch {
    return false;
  }
}

export class RedisStorage implements AIStorage {
  async get(key: string): Promise<string | null> {
    const client = getRedisClient();
    if (!client) return null;
    try {
      return await client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const client = getRedisClient();
    if (!client) return;
    try {
      if (ttlSeconds) {
        await client.set(key, value, "EX", ttlSeconds);
      } else {
        await client.set(key, value);
      }
    } catch { /* swallow — fall through */ }
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const client = getRedisClient();
    if (!client) return 0;
    try {
      const pipeline = client.pipeline();
      pipeline.incr(key);
      if (ttlSeconds) pipeline.expire(key, ttlSeconds);
      const results = await pipeline.exec();
      const incrResult = results?.[0];
      return (incrResult?.[1] as number | null) ?? 0;
    } catch {
      return 0;
    }
  }

  async delete(key: string): Promise<void> {
    const client = getRedisClient();
    if (!client) return;
    try {
      await client.del(key);
    } catch { /* swallow */ }
  }
}
