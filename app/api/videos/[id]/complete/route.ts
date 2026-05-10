import { NextRequest, NextResponse } from "next/server";
import { completeVideo, getVideoById, userCanAccess } from "@/lib/videoServerStore";
import { getAuthenticatedUserFromRequest } from "@/lib/auth-utils";

const XP_REWARD = 50;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params;

  const user = await getAuthenticatedUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: userId, plan: userPlan, role: userRole } = user;

  const video = getVideoById(videoId);
  if (!video || video.deletedAt) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  if (userRole !== "ADMIN" && !userCanAccess(userPlan, video.access)) {
    return NextResponse.json({ error: "Forbidden: insufficient plan" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const watchedSeconds: number = Math.max(0, Number(body.watchedSeconds ?? 0));

  // Server-side validation: require minimum watch time before granting completion
  // Parse duration string (e.g. "52:34" or "1:24:15") to seconds
  const durationSecs = parseDuration(video.duration);
  const minRequired = durationSecs * 0.65; // allow small margin below 70%

  if (watchedSeconds < minRequired && userRole !== "ADMIN") {
    return NextResponse.json(
      { error: "Insufficient watch time for XP award", required: minRequired, actual: watchedSeconds },
      { status: 422 }
    );
  }

  const { record, xpGranted } = completeVideo(userId, videoId);
  return NextResponse.json({
    record,
    xpGranted,
    xpAmount: xpGranted ? XP_REWARD : 0,
  });
}

function parseDuration(duration: string): number {
  const parts = duration.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}
