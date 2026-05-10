import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromHeader } from "@/lib/auth-utils";

// GET /api/conversations - List user conversations with pagination
export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromHeader(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const pinnedOnly = searchParams.get("pinned") === "true";

    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      deletedAt: null,
    };

    if (pinnedOnly) where.isPinned = true;

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
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
        skip,
        take: limit,
      }),
      prisma.conversation.count({ where }),
    ]);

    return NextResponse.json({
      conversations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/conversations error:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

// POST /api/conversations - Create new conversation
export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromHeader(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title = "New Conversation", topic = "general" } = await req.json();

    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title,
        topic,
      },
      include: {
        messages: true,
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error("POST /api/conversations error:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
