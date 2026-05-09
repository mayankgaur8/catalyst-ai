import { NextRequest, NextResponse } from "next/server";
import { reorderVideos } from "@/lib/videoServerStore";

export async function POST(req: NextRequest) {
  const role = req.headers.get("x-user-role");
  const adminId = req.headers.get("x-user-id");
  if (role !== "admin" || !adminId) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const orderedIds: string[] = Array.isArray(body.orderedIds) ? body.orderedIds : [];
  if (orderedIds.length === 0) {
    return NextResponse.json({ error: "orderedIds array is required" }, { status: 400 });
  }

  reorderVideos(orderedIds, adminId);
  return NextResponse.json({ success: true });
}
