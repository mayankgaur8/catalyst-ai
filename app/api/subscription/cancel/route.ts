import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromHeader } from "@/lib/auth-utils";
import { getSubscriptionUser, isAdmin } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  const userId = getUserIdFromHeader(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getSubscriptionUser(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Admins cannot cancel (they have no subscription to cancel)
  if (isAdmin(user)) {
    return NextResponse.json({ error: "Admin accounts cannot be cancelled" }, { status: 400 });
  }

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  if (sub.status === "CANCELLED") {
    return NextResponse.json({ error: "Already cancelled" }, { status: 409 });
  }

  // Cancel-at-period-end: mark cancelled but keep expiresAt intact
  // so user retains access until expiry date.
  await prisma.subscription.update({
    where: { userId },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({
    ok: true,
    message: "Subscription cancelled. Access continues until the current period ends.",
    expiresAt: sub.expiresAt,
  });
}
