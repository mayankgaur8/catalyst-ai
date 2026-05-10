import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/auth-utils";
import { forgetMemory } from "@/lib/memory/service";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deleted = await forgetMemory(user.id, id);
  if (!deleted) return NextResponse.json({ error: "Memory not found" }, { status: 404 });

  return NextResponse.json({ success: true, deleted });
}
