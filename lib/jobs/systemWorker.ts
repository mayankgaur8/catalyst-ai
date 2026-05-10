import { Worker, type Job } from "bullmq";
import { getRedisUrl } from "@/lib/ai/storage/redis";
import { setDependencyStatus } from "@/lib/runtime/ops";
import type { SystemJobName, SystemJobPayload } from "@/lib/jobs/systemQueue";
import { rememberMemory, searchMemories } from "@/lib/memory/service";
import { createEmbedding, summarizeText } from "@/lib/memory/embeddings";
import { prisma } from "@/lib/prisma";
import { sendStreakReminderEmail, sendComebackEmail, sendWeeklyReportEmail } from "@/lib/email/service";

// Local type for JSON values to avoid Prisma namespace import
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

let workerRedis: import("ioredis").Redis | null = null;
function getWorkerRedis() {
  if (workerRedis) return workerRedis;
  const redisUrl = getRedisUrl();
  if (!redisUrl) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { default: Redis } = require("ioredis") as { default: typeof import("ioredis").Redis };
  workerRedis = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 2, enableReadyCheck: false });
  return workerRedis;
}

// ─── Job Handlers ──────────────────────────────────────────────────────────────

async function handleSummarizeMemory(data: SystemJobPayload) {
  const memoryId = data.memoryId;
  if (!memoryId) return { ok: false, error: "memoryId required" };

  const memory = await prisma.memory.findUnique({ where: { id: memoryId } });
  if (!memory) return { ok: false, error: "Memory not found" };

  const summary = summarizeText(memory.summary, 2);
  const embedding = createEmbedding(summary);

  await prisma.memory.update({
    where: { id: memoryId },
    data: { embedding: embedding as any },
  });

  return { ok: true, memoryId, summarized: summary };
}

async function handleGenerateEmbeddings(data: SystemJobPayload) {
  const conversationId = data.conversationId;
  if (!conversationId) return { ok: false, error: "conversationId required" };

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  let processed = 0;
  for (const msg of messages) {
    if (msg.embedding) continue; // skip already embedded
    const embedding = createEmbedding(msg.content.slice(0, 500));
    await prisma.message.update({
      where: { id: msg.id },
      data: { embedding: embedding as any },
    });
    processed++;
  }

  return { ok: true, conversationId, processed };
}

async function handleAggregateAnalytics() {
  // Count active users in last 24h via analytics events
  const since = new Date(Date.now() - 86_400_000);
  const dau = await prisma.analyticsEvent.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: since } },
  });
  return { ok: true, dau: dau.length, computedAt: new Date().toISOString() };
}

async function handleSendStreakReminder(data: SystemJobPayload) {
  const userId = data.userId;
  if (!userId) return { ok: false, error: "userId required" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, streak: true },
  });
  if (!user) return { ok: false, error: "User not found" };

  if (user.streak < 2) return { ok: false, reason: "Streak too low — no reminder needed" };

  await sendStreakReminderEmail(user.email, user.name ?? "Aspirant", user.streak);
  return { ok: true, userId, streak: user.streak };
}

async function handleSendComebackNotification(data: SystemJobPayload) {
  const userId = data.userId;
  if (!userId) return { ok: false, error: "userId required" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user) return { ok: false, error: "User not found" };

  await sendComebackEmail(user.email, user.name ?? "Aspirant");
  return { ok: true, userId };
}

async function handleSendEmailDigest(data: SystemJobPayload) {
  const userId = data.userId;
  if (!userId) return { ok: false, error: "userId required" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user) return { ok: false, error: "User not found" };

  const since = new Date(Date.now() - 7 * 86_400_000);
  const sessions = await prisma.conversation.count({ where: { userId, createdAt: { gte: since } } });
  const questions = await prisma.quizAttempt.count({ where: { userId } });

  await sendWeeklyReportEmail(user.email, user.name ?? "Aspirant", {
    sessions,
    questions,
    percentile: Math.min(99, 50 + sessions * 2 + questions * 0.1), // rough estimate
  });
  return { ok: true, userId, sessions, questions };
}

async function handleAnalyzeWeakAreas(data: SystemJobPayload) {
  const userId = data.userId;
  if (!userId) return { ok: false, error: "userId required" };

  const memories = await searchMemories(userId, "weak struggle difficulty hard", 10);
  const weakTopics = memories
    .map((m: Awaited<ReturnType<typeof searchMemories>>[number]) => m.memory.relatedTopics)
    .flat()
    .filter(Boolean)
    .slice(0, 5);

  return { ok: true, userId, weakTopics };
}

async function handleRefreshRecommendations(data: SystemJobPayload) {
  const userId = data.userId;
  if (!userId) return { ok: false, error: "userId required" };

  const recentMemories = await searchMemories(userId, "practice improve study focus", 5);
  // In production: generate personalized topic recommendations from AI
  // and cache them in Redis for fast dashboard retrieval
  return { ok: true, userId, memoryCount: recentMemories.length };
}

// ─── Worker factory ────────────────────────────────────────────────────────────

function createWorker() {
  const connection = getWorkerRedis();
  if (!connection) {
    setDependencyStatus("queue", "degraded", "REDIS_URL missing; worker disabled");
    return null;
  }

  const worker = new Worker<SystemJobPayload, unknown, SystemJobName>(
    "catalyst-system",
    async (job: Job<SystemJobPayload, unknown, SystemJobName>) => {
      switch (job.name) {
        case "summarize-memory":
          return handleSummarizeMemory(job.data);
        case "generate-embeddings":
          return handleGenerateEmbeddings(job.data);
        case "aggregate-analytics":
          return handleAggregateAnalytics();
        case "send-streak-reminder":
          return handleSendStreakReminder(job.data);
        case "send-comeback-notification":
          return handleSendComebackNotification(job.data);
        case "send-email-digest":
          return handleSendEmailDigest(job.data);
        case "analyze-weak-areas":
          return handleAnalyzeWeakAreas(job.data);
        case "refresh-recommendations":
          return handleRefreshRecommendations(job.data);
        default:
          return { ok: false, error: "Unknown job" };
      }
    },
    {
      connection,
      concurrency: Number(process.env.BULLMQ_CONCURRENCY ?? 8),
    }
  );

  worker.on("ready", () => setDependencyStatus("queue", "healthy", "BullMQ worker ready"));
  worker.on("failed", (job, error) => {
    setDependencyStatus("queue", "degraded", `Job ${job?.name ?? "unknown"} failed: ${error.message}`);
  });

  return worker;
}

let workerInstance: Worker<SystemJobPayload, unknown, SystemJobName> | null = null;

export function ensureSystemWorker() {
  if (workerInstance) return workerInstance;
  workerInstance = createWorker();
  return workerInstance;
}
