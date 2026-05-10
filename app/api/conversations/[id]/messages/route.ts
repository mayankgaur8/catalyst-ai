import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserFromRequest } from "@/lib/auth-utils";

// GET /api/conversations/[id]/messages - List messages in a conversation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id: userId } = user;

    const { id: conversationId } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId, deletedAt: null },
      select: {
        id: true,
        title: true,
        topic: true,
        messages: {
          select: {
            id: true,
            role: true,
            content: true,
            metadata: true,
            feedback: true,
            flagReason: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "asc" },
          skip,
          take: limit,
        },
        _count: { select: { messages: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...conversation,
      pagination: {
        page,
        limit,
        total: conversation._count.messages,
        pages: Math.ceil(conversation._count.messages / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/conversations/[id]/messages error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST /api/conversations/[id]/messages - Add message to conversation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id: userId } = user;

    const { id: conversationId } = await params;
    const { role, content, metadata } = await req.json();

    if (!role || !content) {
      return NextResponse.json({ error: "Missing role or content" }, { status: 400 });
    }

    if (!["USER", "ASSISTANT", "SYSTEM"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Verify conversation ownership
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId, deletedAt: null },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        metadata: metadata || {},
      },
    });

    // Update conversation updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("POST /api/conversations/[id]/messages error:", error);
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }
}
