import { NextRequest, NextResponse } from "next/server";
import { getVideos, createVideo } from "@/lib/videoServerStore";
import { VideoLesson } from "@/lib/videos";
import { getAuthenticatedUserFromRequest } from "@/lib/auth-utils";

async function requireAdmin(req: NextRequest): Promise<{ adminId: string } | NextResponse> {
  const user = await getAuthenticatedUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  return { adminId: user.id };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const includeDeleted = new URL(req.url).searchParams.get("includeDeleted") === "true";
  return NextResponse.json({ videos: getVideos(includeDeleted) });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  if (!body?.title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const video: VideoLesson = {
    id: `v_${Date.now()}`,
    youtubeId: body.youtubeId ?? null,
    title: String(body.title).trim(),
    instructor: String(body.instructor ?? "").trim(),
    description: String(body.description ?? "").trim(),
    duration: String(body.duration ?? ""),
    views: String(body.views ?? "0"),
    rating: Number(body.rating ?? 4.5),
    category: body.category ?? "Strategy",
    access: body.access ?? "free",
    tags: Array.isArray(body.tags) ? body.tags : [],
    featured: Boolean(body.featured ?? false),
    order: Number(body.order ?? 9999),
    status: body.status ?? "draft",
    deletedAt: null,
    aiSummary: body.aiSummary,
    keyTakeaways: body.keyTakeaways,
    quiz: body.quiz,
    xpToastMessage: body.xpToastMessage,
  };

  const created = createVideo(video, auth.adminId);
  return NextResponse.json({ video: created }, { status: 201 });
}
