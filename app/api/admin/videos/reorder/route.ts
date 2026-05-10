import { NextRequest, NextResponse } from "next/server";
import { reorderVideos } from "@/lib/videoServerStore";
import { getAuthenticatedUserFromRequest } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const orderedIds: string[] = Array.isArray(body.orderedIds) ? body.orderedIds : [];
  if (orderedIds.length === 0) {
    return NextResponse.json({ error: "orderedIds array is required" }, { status: 400 });
  }

  reorderVideos(orderedIds, user.id);
  return NextResponse.json({ success: true });
}
