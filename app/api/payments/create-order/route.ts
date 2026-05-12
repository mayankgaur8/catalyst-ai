import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSubscriptionUser, isAdmin, PLAN_AMOUNTS } from "@/lib/subscription";
import { getUserIdFromHeader } from "@/lib/auth-utils";

// ─── Razorpay order creation via REST (no SDK dependency) ────────────────────

async function createRazorpayOrder(amount: number, currency: string, receipt: string, notes: Record<string, string>) {
  const keyId = process.env.RAZORPAY_KEY_ID!;
  const keySecret = process.env.RAZORPAY_KEY_SECRET!;
  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount, currency, receipt, notes }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Razorpay order creation failed: ${err}`);
  }

  return res.json() as Promise<{ id: string; amount: number; currency: string; receipt: string }>;
}

// ─── Stripe PaymentIntent creation via REST ───────────────────────────────────

async function createStripeIntent(amount: number, currency: string, metadata: Record<string, string>) {
  const secretKey = process.env.STRIPE_SECRET_KEY!;
  const params = new URLSearchParams({
    amount: String(amount),
    currency: currency.toLowerCase(),
    "automatic_payment_methods[enabled]": "true",
    ...Object.fromEntries(Object.entries(metadata).map(([k, v]) => [`metadata[${k}]`, v])),
  });

  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe PaymentIntent creation failed: ${err}`);
  }

  return res.json() as Promise<{ id: string; client_secret: string; amount: number }>;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const userId = getUserIdFromHeader(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getSubscriptionUser(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Admins never pay
  if (isAdmin(user)) {
    return NextResponse.json({ error: "Admins have full access — no payment needed" }, { status: 400 });
  }

  const body = await req.json() as {
    plan?: string;
    billingCycle?: string;
    provider?: string;
  };

  const plan = body.plan?.toUpperCase();
  if (plan !== "PRO" && plan !== "ELITE") {
    return NextResponse.json({ error: "Invalid plan. Must be PRO or ELITE." }, { status: 400 });
  }

  const billingCycle = body.billingCycle === "yearly" ? "yearly" : "monthly";
  const provider = body.provider === "stripe" ? "stripe" : "razorpay";

  const planKey = plan.toLowerCase() as "pro" | "elite";
  const amount = PLAN_AMOUNTS[planKey][billingCycle];
  const currency = provider === "stripe" ? "USD" : "INR";
  const receipt = `rcpt_${userId.slice(-8)}_${Date.now()}`;

  const notes = {
    userId,
    plan,
    billingCycle,
    email: user.email,
  };

  try {
    if (provider === "razorpay") {
      const order = await createRazorpayOrder(amount, currency, receipt, notes);

      await prisma.paymentOrder.create({
        data: {
          userId,
          provider: "razorpay",
          providerId: order.id,
          plan: plan as "PRO" | "ELITE",
          amount,
          currency,
          billingCycle,
          metadata: notes,
        },
      });

      return NextResponse.json({
        provider: "razorpay",
        orderId: order.id,
        amount,
        currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        userName: user.email.split("@")[0],
        userEmail: user.email,
        description: `CATalyst AI ${plan} — ${billingCycle}`,
        notes,
      });
    } else {
      // Stripe amounts are in cents; INR in paise already, USD we convert (approximate)
      const stripeAmount = Math.round(amount / 100); // paise → rupees → cents (rough)
      const intent = await createStripeIntent(stripeAmount, "usd", notes);

      await prisma.paymentOrder.create({
        data: {
          userId,
          provider: "stripe",
          providerId: intent.id,
          plan: plan as "PRO" | "ELITE",
          amount: stripeAmount,
          currency: "USD",
          billingCycle,
          metadata: notes,
        },
      });

      return NextResponse.json({
        provider: "stripe",
        clientSecret: intent.client_secret,
        amount: stripeAmount,
        currency: "USD",
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_KEY,
      });
    }
  } catch (err) {
    console.error("[create-order]", err);
    return NextResponse.json({ error: "Payment order creation failed" }, { status: 502 });
  }
}
