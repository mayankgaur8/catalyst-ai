/**
 * Unified payment webhook — handles both Razorpay and Stripe events.
 *
 * Razorpay: X-Razorpay-Signature header, HMAC-SHA256(body, RAZORPAY_WEBHOOK_SECRET)
 * Stripe:   Stripe-Signature header, verified via Stripe's timestamp+sig format
 *
 * All mutations are idempotent: duplicate events are silently ignored.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { activateSubscription } from "@/lib/subscription";
import { sendPaymentSuccessEmail, sendPaymentFailedEmail } from "@/lib/email/service";

// ─── Signature verification ───────────────────────────────────────────────────

function verifyRazorpayWebhook(body: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

function verifyStripeWebhook(body: string, signatureHeader: string | null): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  // Stripe-Signature: t=timestamp,v1=sig1,v1=sig2...
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => p.split("=") as [string, string])
  );
  const timestamp = parts["t"];
  const sig = parts["v1"];
  if (!timestamp || !sig) return false;

  // Reject events older than 5 minutes (replay protection)
  const tolerance = 300;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > tolerance) return false;

  const payload = `${timestamp}.${body}`;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

// ─── Razorpay event handler ───────────────────────────────────────────────────

async function handleRazorpayEvent(event: string, payload: Record<string, unknown>) {
  const payment = (payload as { payment?: { entity?: Record<string, unknown> } }).payment?.entity;
  const subscription = (payload as { subscription?: { entity?: Record<string, unknown> } }).subscription?.entity;

  if (event === "payment.captured" && payment) {
    const paymentId = String(payment["id"] ?? "");
    const orderId = String(payment["order_id"] ?? "");
    const amount = Number(payment["amount"] ?? 0);
    const currency = String(payment["currency"] ?? "INR");
    const notes = (payment["notes"] ?? {}) as Record<string, string>;

    const userId = notes["userId"];
    const planRaw = notes["plan"]?.toUpperCase();
    const billingCycle = (notes["billingCycle"] ?? "monthly") as "monthly" | "yearly";

    if (!userId || (planRaw !== "PRO" && planRaw !== "ELITE")) return;
    const plan = planRaw as "PRO" | "ELITE";
    const idempotencyKey = `razorpay:${paymentId}`;

    // Idempotent — skip if already processed
    const dup = await prisma.paymentTransaction.findUnique({ where: { idempotencyKey } });
    if (dup) return;

    await prisma.paymentTransaction.create({
      data: {
        userId,
        provider: "razorpay",
        paymentId,
        providerOrderId: orderId,
        plan,
        amount,
        currency,
        status: "captured",
        idempotencyKey,
      },
    });

    // Mark PaymentOrder paid if it exists
    await prisma.paymentOrder.updateMany({
      where: { providerId: orderId, status: "created" },
      data: { status: "paid" },
    });

    const sub = await activateSubscription({ userId, plan, billingCycle, provider: "razorpay" });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (user) {
      void sendPaymentSuccessEmail(
        user.email,
        user.name ?? "Aspirant",
        plan,
        `₹${(amount / 100).toLocaleString("en-IN")}`,
        sub.expiresAt?.toLocaleDateString("en-IN") ?? "—"
      );
    }
    return;
  }

  if ((event === "subscription.cancelled" || event === "subscription.expired") && subscription) {
    const razorpaySubId = String(subscription["id"] ?? "");
    if (!razorpaySubId) return;

    await prisma.subscription.updateMany({
      where: { razorpaySubId },
      data: { status: event === "subscription.cancelled" ? "CANCELLED" : "EXPIRED" },
    });
    return;
  }

  if (event === "payment.failed" && payment) {
    const notes = (payment["notes"] ?? {}) as Record<string, string>;
    const userId = notes["userId"];
    const plan = notes["plan"]?.toUpperCase() as "PRO" | "ELITE" | undefined;
    if (userId && plan) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
      if (user) void sendPaymentFailedEmail(user.email, user.name ?? "Aspirant", plan);
    }
    return;
  }
}

// ─── Stripe event handler ─────────────────────────────────────────────────────

async function handleStripeEvent(type: string, object: Record<string, unknown>) {
  if (type === "payment_intent.succeeded") {
    const paymentId = String(object["id"] ?? "");
    const amount = Number(object["amount"] ?? 0);
    const currency = String(object["currency"] ?? "usd").toUpperCase();
    const metadata = (object["metadata"] ?? {}) as Record<string, string>;

    const userId = metadata["userId"];
    const planRaw = metadata["plan"]?.toUpperCase();
    const billingCycle = (metadata["billingCycle"] ?? "monthly") as "monthly" | "yearly";

    if (!userId || (planRaw !== "PRO" && planRaw !== "ELITE")) return;
    const plan = planRaw as "PRO" | "ELITE";
    const idempotencyKey = `stripe:${paymentId}`;

    const dup = await prisma.paymentTransaction.findUnique({ where: { idempotencyKey } });
    if (dup) return;

    await prisma.paymentTransaction.create({
      data: {
        userId,
        provider: "stripe",
        paymentId,
        plan,
        amount,
        currency,
        status: "captured",
        idempotencyKey,
      },
    });

    await prisma.paymentOrder.updateMany({
      where: { providerId: paymentId, status: "created" },
      data: { status: "paid" },
    });

    const sub = await activateSubscription({ userId, plan, billingCycle, provider: "stripe" });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (user) {
      void sendPaymentSuccessEmail(
        user.email,
        user.name ?? "Aspirant",
        plan,
        `$${(amount / 100).toFixed(2)}`,
        sub.expiresAt?.toLocaleDateString("en-IN") ?? "—"
      );
    }
    return;
  }

  if (type === "customer.subscription.deleted") {
    const stripeSubId = String(object["id"] ?? "");
    if (stripeSubId) {
      await prisma.subscription.updateMany({
        where: { stripeSubId },
        data: { status: "CANCELLED" },
      });
    }
    return;
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const raw = await req.text();

  const razorpaySig = req.headers.get("x-razorpay-signature");
  const stripeSig = req.headers.get("stripe-signature");

  // Determine provider from headers
  const isRazorpay = Boolean(razorpaySig);
  const isStripe = Boolean(stripeSig);

  if (!isRazorpay && !isStripe) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  if (isRazorpay) {
    if (!verifyRazorpayWebhook(raw, razorpaySig)) {
      return NextResponse.json({ error: "Invalid Razorpay signature" }, { status: 401 });
    }
    const body = JSON.parse(raw) as { event: string; payload: Record<string, unknown> };
    try {
      await handleRazorpayEvent(body.event, body.payload);
    } catch (err) {
      console.error("[webhook/razorpay]", err);
      return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // Stripe
  if (!verifyStripeWebhook(raw, stripeSig)) {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 401 });
  }
  const event = JSON.parse(raw) as { type: string; data: { object: Record<string, unknown> } };
  try {
    await handleStripeEvent(event.type, event.data.object);
  } catch (err) {
    console.error("[webhook/stripe]", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
