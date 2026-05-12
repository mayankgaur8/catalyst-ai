import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromHeader } from "@/lib/auth-utils";
import { getSubscriptionUser, getEffectivePlan, isAdmin, isPremium, isElite } from "@/lib/subscription";

export async function GET(req: NextRequest) {
  const userId = getUserIdFromHeader(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getSubscriptionUser(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const admin = isAdmin(user);
  const effectivePlan = getEffectivePlan(user);
  const sub = user.subscription;

  return NextResponse.json({
    userId: user.id,
    role: user.role,
    isAdmin: admin,
    effectivePlan,
    isPremium: isPremium(user),
    isElite: isElite(user),
    subscription: sub
      ? {
          plan: sub.plan,
          status: sub.status,
          provider: sub.provider,
          billingCycle: sub.billingCycle,
          expiresAt: sub.expiresAt,
        }
      : null,
    // Admins never see quota warnings
    showUpgradePrompts: !admin && effectivePlan === "free",
  });
}
