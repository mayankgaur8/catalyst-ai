import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPaymentSuccessEmail, sendPaymentFailedEmail } from "@/lib/email/service";

function verifySignature(payload: string, signature: string | null, secret: string | undefined): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return expected === signature;
}

interface WebhookBody {
  userId?: string;
  plan?: "FREE" | "PRO" | "ELITE";
  status?: string;
  amount?: string;
  expiresAt?: string;
  event?: string; // e.g. "payment.captured", "subscription.cancelled", "payment.failed"
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const provider = req.headers.get("x-webhook-provider") ?? "stripe";
  const signature = req.headers.get("x-webhook-signature");

  const secret = provider === "razorpay"
    ? process.env.RAZORPAY_WEBHOOK_SECRET
    : process.env.STRIPE_WEBHOOK_SECRET;

  if (!verifySignature(raw, signature, secret)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  const body = JSON.parse(raw) as WebhookBody;
  if (!body.userId || !body.plan) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const planStatus = body.status === "active" ? "ACTIVE" : "TRIAL";

  await prisma.subscription.upsert({
    where: { userId: body.userId },
    create: {
      userId: body.userId,
      plan: body.plan,
      status: planStatus,
    },
    update: {
      plan: body.plan,
      status: planStatus,
    },
  });

  // Fire-and-forget emails based on event type
  const user = await prisma.user.findUnique({
    where: { id: body.userId },
    select: { email: true, name: true },
  });

  if (user) {
    const name = user.name ?? "Aspirant";
    const event = body.event ?? (body.status === "active" ? "payment.captured" : "payment.failed");

    if (event === "payment.captured" || event === "payment.success") {
      void sendPaymentSuccessEmail(user.email, name, body.plan, body.amount ?? "–", body.expiresAt ?? "–");
    } else if (event === "payment.failed") {
      void sendPaymentFailedEmail(user.email, name, body.plan);
    }
  }

  return NextResponse.json({ ok: true });
}
