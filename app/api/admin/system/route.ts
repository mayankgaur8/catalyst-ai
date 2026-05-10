import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/auth-utils";
import { getHealthSnapshot } from "@/lib/runtime/health";
import { getRuntimeSnapshot, getProviderLatencySeries } from "@/lib/runtime/ops";
import { getMetricsSummary } from "@/lib/ai/metrics";
import { getRecentLogs } from "@/lib/ai/logger";
import { getAllHealth } from "@/lib/ai/circuitBreaker";
import { getQueueHealth } from "@/lib/jobs/systemQueue";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const type = new URL(req.url).searchParams.get("type") ?? "snapshot";

  const [envHealth, queueHealth] = await Promise.all([getHealthSnapshot(), getQueueHealth()]);
  const runtime = getRuntimeSnapshot();

  if (type === "snapshot") {
    return NextResponse.json({
      runtime,
      envHealth,
      queueHealth,
      providerHealth: getAllHealth(),
      metrics: getMetricsSummary(),
      recentLogs: getRecentLogs(25),
      latencySeries: getProviderLatencySeries(),
    });
  }

  if (type === "health") {
    return NextResponse.json({ runtime, envHealth, queueHealth, providerHealth: getAllHealth() });
  }

  if (type === "metrics") {
    return NextResponse.json({ metrics: getMetricsSummary(), latencySeries: getProviderLatencySeries() });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
