import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromHeader } from "@/lib/auth-utils";

// PUT /api/conversations/[id]/messages/[messageId]/feedback - Add feedback to message
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const userId = getUserIdFromHeader(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: conversationId, messageId } = await params;
    const { feedback, flagReason } = await req.json();

    if (!["helpful", "unhelpful", "flagged"].includes(feedback)) {
      return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });
    }

    // Verify conversation ownership
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId, deletedAt: null },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Update message feedback
    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        feedback,
        ...(flagReason && { flagReason }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/conversations/[id]/messages/[messageId]/feedback error:", error);
    return NextResponse.json({ error: "Failed to add feedback" }, { status: 500 });
  }
}
