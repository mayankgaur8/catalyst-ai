import { NextRequest, NextResponse } from "next/server";
import { getVideoById } from "@/lib/videoServerStore";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const video = getVideoById(id);
  if (!video || video.deletedAt) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }
  return NextResponse.json({ video });
}
