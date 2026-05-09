import { NextRequest, NextResponse } from "next/server";
import { getAuditLog, getAnalytics } from "@/lib/videoServerStore";

export async function GET(req: NextRequest) {
  const role = req.headers.get("x-user-role");
  if (role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "analytics";

  if (type === "audit") {
    return NextResponse.json({ log: getAuditLog() });
  }

  return NextResponse.json({ analytics: getAnalytics() });
}
