import { NextRequest, NextResponse } from "next/server";
import { updateNotes, toggleSavedForLater } from "@/lib/videoServerStore";
import { getAuthenticatedUserFromRequest } from "@/lib/auth-utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params;
  const user = await getAuthenticatedUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  if (action === "save-notes") {
    const notes = String(body.notes ?? "").slice(0, 5000);
    const record = updateNotes(user.id, videoId, notes);
    return NextResponse.json({ record });
  }

  if (action === "toggle-saved") {
    const record = toggleSavedForLater(user.id, videoId);
    return NextResponse.json({ record });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
