import { NextResponse } from "next/server";
import { validateProductionEnvironment } from "@/lib/runtime/env";
import { getHealthSnapshot } from "@/lib/runtime/health";
import { getRuntimeSnapshot } from "@/lib/runtime/ops";

export async function GET() {
  const env = validateProductionEnvironment();
  const health = await getHealthSnapshot();
  const runtime = getRuntimeSnapshot();

  return NextResponse.json({
    status: env.ok && health.database.status === "healthy" ? "ok" : "degraded",
    env,
    health,
    runtime,
  });
}
