import { NextRequest, NextResponse } from "next/server";
import { getVideos } from "@/lib/videoServerStore";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const includeDeleted = searchParams.get("includeDeleted") === "true";

  // Only admins can see deleted videos (checked via x-user-role header)
  const role = req.headers.get("x-user-role");
  const videos = getVideos(includeDeleted && role === "admin");

  return NextResponse.json({ videos });
}
