import { NextResponse } from "next/server";
import { validateProductionEnvironment } from "@/lib/runtime/env";
import { getHealthSnapshot } from "@/lib/runtime/health";

export async function GET() {
  const env = validateProductionEnvironment();
  const health = await getHealthSnapshot();
  const ready = env.ok && health.database.status === "healthy";

  return NextResponse.json(
    {
      ready,
      env,
      health,
    },
    { status: ready ? 200 : 503 }
  );
}
