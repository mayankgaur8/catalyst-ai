import { NextRequest, NextResponse } from "next/server";
import { getVideos } from "@/lib/videoServerStore";
import { getAuthenticatedUserFromRequest } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const includeDeleted = searchParams.get("includeDeleted") === "true";

  // Only admins can see deleted videos; role is resolved from the DB.
  const user = await getAuthenticatedUserFromRequest(req);
  const videos = getVideos(includeDeleted && user?.role === "ADMIN");

  return NextResponse.json({ videos });
}
