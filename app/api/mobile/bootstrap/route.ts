import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(Number(new URL(req.url).searchParams.get("limit") ?? 20), 50);
  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id, deletedAt: null },
    select: {
      id: true,
      title: true,
      topic: true,
      isPinned: true,
      isFavorite: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    take: limit,
  });

  return NextResponse.json({
    user,
    conversations,
    meta: {
      limit,
      offlineSync: true,
      resumableStreaming: true,
      lightweight: true,
    },
  });
}
