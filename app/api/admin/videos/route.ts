import { NextRequest, NextResponse } from "next/server";
import { getVideos, createVideo } from "@/lib/videoServerStore";
import { VideoLesson } from "@/lib/videos";

function requireAdmin(req: NextRequest): NextResponse | null {
  const role = req.headers.get("x-user-role");
  const adminId = req.headers.get("x-user-id");
  if (role !== "admin" || !adminId) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const err = requireAdmin(req);
  if (err) return err;

  const includeDeleted = new URL(req.url).searchParams.get("includeDeleted") === "true";
  return NextResponse.json({ videos: getVideos(includeDeleted) });
}

export async function POST(req: NextRequest) {
  const err = requireAdmin(req);
  if (err) return err;

  const adminId = req.headers.get("x-user-id")!;
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

  const created = createVideo(video, adminId);
  return NextResponse.json({ video: created }, { status: 201 });
}
