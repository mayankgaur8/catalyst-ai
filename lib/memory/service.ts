import { prisma } from "@/lib/prisma";
import { createEmbedding, cosineSimilarity, summarizeText } from "@/lib/memory/embeddings";

export interface MemoryInput {
  userId: string;
  conversationId?: string;
  text: string;
  relatedTopics?: string[];
  pin?: boolean;
}

interface Memory {
  id: string;
  userId: string;
  conversationId?: string | null;
  summary: string;
  embedding: unknown;
  relatedTopics: string[];
  isManuallyPinned: boolean;
  expiresAt: Date | null;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface RankedMemory {
  memory: Memory;
  score: number;
}

export async function rememberMemory(input: MemoryInput) {
  const summary = summarizeText(input.text, 3);
  const embedding = createEmbedding(input.text);

  return prisma.memory.create({
    data: {
      userId: input.userId,
      conversationId: input.conversationId,
      summary,
      embedding,
      relatedTopics: input.relatedTopics ?? [],
      isManuallyPinned: input.pin ?? false,
      lastAccessedAt: new Date(),
    },
  });
}

export async function searchMemories(userId: string, query: string, limit = 5) {
  const queryEmbedding = createEmbedding(query);
  const memories = await prisma.memory.findMany({
    where: {
      userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    orderBy: [{ isManuallyPinned: "desc" }, { lastAccessedAt: "desc" }],
    take: 100,
  });

  const ranked = memories
    .map((memory: Memory) => {
      const memoryEmbedding = Array.isArray(memory.embedding) ? (memory.embedding as number[]) : createEmbedding(memory.summary);
      const topicScore = cosineSimilarity(queryEmbedding, memoryEmbedding);
      const textScore = memory.summary.toLowerCase().includes(query.toLowerCase()) ? 0.2 : 0;
      const topicOverlap = memory.relatedTopics.some((topic: string) => query.toLowerCase().includes(topic.toLowerCase())) ? 0.15 : 0;
      return {
        memory,
        score: Math.min(1, topicScore + textScore + topicOverlap),
      };
    })
    .filter((item: RankedMemory) => item.score >= 0.18)
    .sort((left: RankedMemory, right: RankedMemory) => right.score - left.score)
    .slice(0, limit);

  if (ranked.length > 0) {
    await prisma.memory.updateMany({
      where: { id: { in: ranked.map((item) => item.memory.id) } },
      data: { lastAccessedAt: new Date() },
    });
  }

  return ranked;
}

export async function forgetMemory(userId: string, memoryId: string) {
  const memory = await prisma.memory.findFirst({ where: { id: memoryId, userId } });
  if (!memory) return null;
  await prisma.memory.delete({ where: { id: memoryId } });
  return memory;
}
