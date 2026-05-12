import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromHeader } from "@/lib/auth-utils";
import { activateSubscription } from "@/lib/subscription";
import { sendPaymentSuccessEmail } from "@/lib/email/service";

// ─── Razorpay signature verification ─────────────────────────────────────────
// signature = HMAC-SHA256(orderId + "|" + paymentId, keySecret)

function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const userId = getUserIdFromHeader(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    provider?: string;
    // Razorpay fields
    paymentId?: string;
    orderId?: string;
    signature?: string;
    // Stripe (handled via webhook, but kept here for client confirmation)
    paymentIntentId?: string;
  };

  const provider = body.provider ?? "razorpay";
  const idempotencyKey = `${provider}:${body.paymentId ?? body.paymentIntentId}`;

  // Replay attack prevention — each paymentId is unique
  const existing = await prisma.paymentTransaction.findUnique({
    where: { idempotencyKey },
  });
  if (existing) {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  if (provider === "razorpay") {
    const { paymentId, orderId, signature } = body;
    if (!paymentId || !orderId || !signature) {
      return NextResponse.json({ error: "Missing razorpay fields" }, { status: 400 });
    }

    if (!verifyRazorpaySignature(orderId, paymentId, signature)) {
      return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
    }

    // Find our stored PaymentOrder to get plan + billingCycle
    const order = await prisma.paymentOrder.findUnique({ where: { providerId: orderId } });
    if (!order || order.userId !== userId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const plan = order.plan as "PRO" | "ELITE";
    const billingCycle = (order.billingCycle ?? "monthly") as "monthly" | "yearly";

    // Record transaction (idempotency key prevents double-processing)
    await prisma.paymentTransaction.create({
      data: {
        userId,
        paymentOrderId: order.id,
        provider: "razorpay",
        paymentId,
        providerOrderId: orderId,
        plan,
        amount: order.amount,
        currency: order.currency,
        status: "captured",
        idempotencyKey,
      },
    });

    // Update PaymentOrder status
    await prisma.paymentOrder.update({
      where: { id: order.id },
      data: { status: "paid" },
    });

    // Activate subscription
    const sub = await activateSubscription({
      userId,
      plan,
      billingCycle,
      provider: "razorpay",
    });

    // Fire email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    if (user) {
      const expiresLabel = sub.expiresAt?.toLocaleDateString("en-IN") ?? "—";
      void sendPaymentSuccessEmail(
        user.email,
        user.name ?? "Aspirant",
        plan,
        `₹${(order.amount / 100).toLocaleString("en-IN")}`,
        expiresLabel
      );
    }

    return NextResponse.json({
      ok: true,
      subscription: {
        plan: sub.plan,
        status: sub.status,
        expiresAt: sub.expiresAt,
        billingCycle: sub.billingCycle,
      },
    });
  }

  return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
}
