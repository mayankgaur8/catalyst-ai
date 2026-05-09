import { NextRequest, NextResponse } from "next/server";
import { updateNotes, toggleSavedForLater } from "@/lib/videoServerStore";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params;
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  if (action === "save-notes") {
    const notes = String(body.notes ?? "").slice(0, 5000);
    const record = updateNotes(userId, videoId, notes);
    return NextResponse.json({ record });
  }

  if (action === "toggle-saved") {
    const record = toggleSavedForLater(userId, videoId);
    return NextResponse.json({ record });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
