import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/auth-utils";
import { forgetMemory, rememberMemory, searchMemories } from "@/lib/memory/service";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const query = new URL(req.url).searchParams.get("q") ?? "";
  if (!query.trim()) {
    return NextResponse.json({ memories: [] });
  }

  const memories = await searchMemories(user.id, query, 8);
  return NextResponse.json({ memories });
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "remember");

  if (action === "remember") {
    const text = String(body.text ?? "").trim();
    if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });

    const memory = await rememberMemory({
      userId: user.id,
      conversationId: typeof body.conversationId === "string" ? body.conversationId : undefined,
      text,
      relatedTopics: Array.isArray(body.relatedTopics)
        ? body.relatedTopics.filter((value: unknown): value is string => typeof value === "string")
        : [],
      pin: Boolean(body.pin),
    });

    return NextResponse.json({ memory }, { status: 201 });
  }

  if (action === "forget") {
    const memoryId = String(body.memoryId ?? "");
    if (!memoryId) return NextResponse.json({ error: "memoryId is required" }, { status: 400 });

    const deleted = await forgetMemory(user.id, memoryId);
    if (!deleted) return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    return NextResponse.json({ success: true, deleted });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
