import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserFromRequest } from "@/lib/auth-utils";

// GET /api/conversations/[id] - Get conversation with messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id: userId } = user;

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        messages: {
          select: {
            id: true,
            role: true,
            content: true,
            metadata: true,
            feedback: true,
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
    console.error("GET /api/conversations/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
  }
}

// PATCH /api/conversations/[id] - Update conversation
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id: userId } = user;

    const { id } = await params;
    const { title, topic, isPinned, isFavorite } = await req.json();

    // Verify ownership
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(topic && { topic }),
        ...(isPinned !== undefined && { isPinned }),
        ...(isFavorite !== undefined && { isFavorite }),
      },
      include: {
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/conversations/[id] error:", error);
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
  }
}

// DELETE /api/conversations/[id] - Soft delete conversation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id: userId } = user;

    const { id } = await params;

    // Verify ownership
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const deleted = await prisma.conversation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error("DELETE /api/conversations/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }
}
