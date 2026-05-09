import { NextRequest, NextResponse } from "next/server";
import { updateVideo, deleteVideo, restoreVideo, getVideoById } from "@/lib/videoServerStore";

function requireAdmin(req: NextRequest): { adminId: string } | NextResponse {
  const role = req.headers.get("x-user-role");
  const adminId = req.headers.get("x-user-id");
  if (role !== "admin" || !adminId) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  return { adminId };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const updated = updateVideo(id, body, auth.adminId);
  if (!updated) return NextResponse.json({ error: "Video not found" }, { status: 404 });
  return NextResponse.json({ video: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const ok = deleteVideo(id, auth.adminId);
  if (!ok) return NextResponse.json({ error: "Video not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // POST to /api/admin/videos/:id is used for restore
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (body.action === "restore") {
    const restored = restoreVideo(id, auth.adminId);
    if (!restored) return NextResponse.json({ error: "Video not found" }, { status: 404 });
    return NextResponse.json({ video: restored });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const video = getVideoById(id);
  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ video });
}
