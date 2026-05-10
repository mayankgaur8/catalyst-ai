import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/auth-utils";
import { searchMemories } from "@/lib/memory/service";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const query = new URL(req.url).searchParams.get("q") ?? "";
  const memories = query.trim() ? await searchMemories(user.id, query, 8) : [];
  return NextResponse.json({ memories });
}
