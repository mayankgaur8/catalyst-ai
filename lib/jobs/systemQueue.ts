import { Queue, type JobsOptions } from "bullmq";
import { setDependencyStatus } from "@/lib/runtime/ops";
import { getRedisUrl } from "@/lib/ai/storage/redis";

let queueRedis: import("ioredis").Redis | null = null;
function getQueueRedis() {
  if (queueRedis) return queueRedis;
  const redisUrl = getRedisUrl();
  if (!redisUrl) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { default: Redis } = require("ioredis") as { default: typeof import("ioredis").Redis };
  queueRedis = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 2, enableReadyCheck: false });
  return queueRedis;
}

export type SystemJobName =
  | "summarize-memory"
  | "generate-embeddings"
  | "aggregate-analytics"
  | "send-streak-reminder"
  | "send-comeback-notification"
  | "send-email-digest"
  | "analyze-weak-areas"
  | "refresh-recommendations";

export interface SystemJobPayload {
  userId?: string;
  conversationId?: string;
  memoryId?: string;
  reason?: string;
  [key: string]: unknown;
}

const queueOptions: JobsOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 15_000,
  },
  removeOnComplete: 100,
  removeOnFail: 200,
};

let queue: Queue<SystemJobPayload, unknown, SystemJobName> | null = null;

function getQueue(): Queue<SystemJobPayload, unknown, SystemJobName> | null {
  if (queue) return queue;

  const redisUrl = getRedisUrl();
  if (!redisUrl) {
    setDependencyStatus("queue", "degraded", "REDIS_URL missing; queue is disabled");
    return null;
  }

  const connection = getQueueRedis();
  if (!connection) {
    setDependencyStatus("queue", "degraded", "REDIS_URL missing; queue is disabled");
    return null;
  }

  queue = new Queue<SystemJobPayload, unknown, SystemJobName>("catalyst-system", {
    connection,
  });

  setDependencyStatus("queue", "healthy", "BullMQ queue initialized");
  return queue;
}

export async function enqueueSystemJob(name: SystemJobName, payload: SystemJobPayload, options?: JobsOptions) {
  const q = getQueue();
  if (!q) {
    return { id: `local-${Date.now()}`, name, skipped: true };
  }

  return q.add(name, payload, {
    ...queueOptions,
    ...options,
  });
}

export async function getQueueHealth() {
  const q = getQueue();
  if (!q) {
    return {
      status: "degraded" as const,
      counts: {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: 0,
      },
    };
  }

  const counts = await q.getJobCounts("waiting", "active", "completed", "failed", "delayed", "paused");
  return {
    status: "healthy" as const,
    counts,
  };
}

export async function closeQueue() {
  if (queue) {
    await queue.close();
    queue = null;
  }
}
