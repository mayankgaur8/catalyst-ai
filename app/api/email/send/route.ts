import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/service";
import type { EmailTemplate } from "@/lib/email/service";
import { createHmac } from "node:crypto";

// Internal webhook — only callable with INTERNAL_WEBHOOK_SECRET
function verifyInternalSecret(req: NextRequest): boolean {
  const secret = process.env.INTERNAL_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production"; // allow in dev
  const signature = req.headers.get("x-internal-secret");
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update("catalyst-email").digest("hex");
  return signature === expected;
}

export async function POST(req: NextRequest) {
  if (!verifyInternalSecret(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as {
    to?: string;
    template?: string;
    data?: Record<string, unknown>;
  };

  if (!body.to || !body.template) {
    return NextResponse.json({ error: "to and template are required" }, { status: 400 });
  }

  const validTemplates = new Set<EmailTemplate>([
    "welcome", "email-verification", "password-reset", "study-reminder",
    "streak-reminder", "comeback", "ai-report", "payment-success",
    "payment-failed", "subscription-cancelled",
  ]);

  if (!validTemplates.has(body.template as EmailTemplate)) {
    return NextResponse.json({ error: "Invalid template" }, { status: 400 });
  }

  const result = await sendEmail({
    to: body.to,
    template: body.template as EmailTemplate,
    data: body.data ?? {},
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
