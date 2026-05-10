import { NextRequest, NextResponse } from "next/server";
import { getAuditLog, getAnalytics } from "@/lib/videoServerStore";
import { getAuthenticatedUserFromRequest } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "analytics";

  if (type === "audit") {
    return NextResponse.json({ log: getAuditLog() });
  }

  return NextResponse.json({ analytics: getAnalytics() });
}
