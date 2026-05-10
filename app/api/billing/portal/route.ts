import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
  const portalUrl = process.env.BILLING_PORTAL_URL ?? null;

  return NextResponse.json({
    userId: user.id,
    subscription,
    portalUrl,
    billingProviders: {
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      razorpay: Boolean(process.env.RAZORPAY_KEY_ID),
    },
  });
}
