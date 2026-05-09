import { NextRequest, NextResponse } from "next/server";
import { saveProgress, getVideoById, userCanAccess } from "@/lib/videoServerStore";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params;

  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const video = getVideoById(videoId);
  if (!video || video.deletedAt) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const userPlan = req.headers.get("x-user-plan");
  const userRole = req.headers.get("x-user-role");
  if (userRole !== "admin" && !userCanAccess(userPlan, video.access)) {
    return NextResponse.json({ error: "Forbidden: insufficient plan" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const progressPct: number = Math.min(100, Math.max(0, Number(body.progressPct ?? 0)));
  const watchedSeconds: number = Math.max(0, Number(body.watchedSeconds ?? 0));

  const record = saveProgress(userId, videoId, { progressPct, watchedSeconds });
  return NextResponse.json({ record });
}
