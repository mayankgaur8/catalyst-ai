import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { rememberMemory } from "@/lib/memory/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;
  const body = await req.json().catch(() => ({}));

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: user.id, deletedAt: null },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 8 } },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const fallbackText = conversation.messages.map((message) => message.content).join(" \n");
  const memory = await rememberMemory({
    userId: user.id,
    conversationId,
    text: String(body.text ?? fallbackText),
    relatedTopics: Array.isArray(body.relatedTopics)
      ? body.relatedTopics.filter((value: unknown): value is string => typeof value === "string")
      : [conversation.topic ?? "general"],
    pin: Boolean(body.pin ?? true),
  });

  return NextResponse.json({ memory }, { status: 201 });
}
