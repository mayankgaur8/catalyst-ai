/**
 * Transactional email service — works with Resend (primary) or
 * any SMTP-compatible provider. Falls back to console logging in development.
 */

export type EmailTemplate =
  | "welcome"
  | "email-verification"
  | "password-reset"
  | "study-reminder"
  | "streak-reminder"
  | "comeback"
  | "ai-report"
  | "payment-success"
  | "payment-failed"
  | "subscription-cancelled";

export interface SendEmailOptions {
  to: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
}

interface ResendSuccessResponse {
  id: string;
}

interface EmailPayload {
  from: string;
  to: string;
  subject: string;
  html: string;
}

// ─── Template Definitions ──────────────────────────────────────────────────────

function renderTemplate(template: EmailTemplate, data: Record<string, unknown>): { subject: string; html: string } {
  const name = String(data.name ?? "Aspirant");
  const appName = "CATalyst AI";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://catalystai.in";

  const base = (content: string) => `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: -apple-system, sans-serif; background: #0a0f1e; color: #e2e8f0; margin: 0; padding: 0; }
      .wrapper { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
      .card { background: #111827; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 32px; }
      .logo { font-size: 22px; font-weight: 800; color: #38bdf8; margin-bottom: 24px; }
      h1 { font-size: 20px; font-weight: 700; color: #f1f5f9; margin: 0 0 12px; }
      p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px; }
      .btn { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg,#38bdf8,#818cf8); color: white; font-weight: 600; font-size: 14px; border-radius: 10px; text-decoration: none; margin: 8px 0; }
      .footer { margin-top: 24px; font-size: 12px; color: #475569; text-align: center; }
      .stat { background: rgba(56,189,248,0.08); border: 1px solid rgba(56,189,248,0.2); border-radius: 10px; padding: 12px 16px; margin: 8px 0; }
      .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
      .stat-value { font-size: 20px; font-weight: 700; color: #38bdf8; }
    </style></head>
    <body><div class="wrapper"><div class="card">
      <div class="logo">⚡ ${appName}</div>
      ${content}
      <div class="footer">You're receiving this because you signed up at ${appName}. <a href="${appUrl}/settings" style="color:#38bdf8">Manage preferences</a></div>
    </div></div></body></html>
  `;

  switch (template) {
    case "welcome":
      return {
        subject: `Welcome to ${appName}, ${name}! 🎯`,
        html: base(`
          <h1>You're in, ${name}! 🚀</h1>
          <p>Welcome to the most intelligent CAT prep platform. Your AI mentor is ready to personalize every session for you.</p>
          <p>Here's what's waiting for you:</p>
          <div class="stat"><div class="stat-label">AI Sessions</div><div class="stat-value">∞ unlimited</div></div>
          <div class="stat"><div class="stat-label">Practice Questions</div><div class="stat-value">10,000+</div></div>
          <a href="${appUrl}/dashboard" class="btn">Start Learning →</a>
          <p>Your AI mentor learns from every session. The more you use it, the smarter it gets for <em>you</em>.</p>
        `),
      };

    case "email-verification":
      return {
        subject: `Verify your ${appName} email`,
        html: base(`
          <h1>Verify your email</h1>
          <p>Click the button below to verify your email address. This link expires in 24 hours.</p>
          <a href="${String(data.verificationUrl)}" class="btn">Verify Email →</a>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        `),
      };

    case "password-reset":
      return {
        subject: `Reset your ${appName} password`,
        html: base(`
          <h1>Reset your password</h1>
          <p>We received a request to reset your password. Click below to create a new one. This link expires in 1 hour.</p>
          <a href="${String(data.resetUrl)}" class="btn">Reset Password →</a>
          <p>If you didn't request this, please ignore this email — your password won't change.</p>
        `),
      };

    case "study-reminder":
      return {
        subject: `📚 Your study session is waiting, ${name}`,
        html: base(`
          <h1>Ready to level up today?</h1>
          <p>Your personalized study plan has today's session ready. Even 25 focused minutes builds your CAT percentile.</p>
          <div class="stat"><div class="stat-label">Today's Goal</div><div class="stat-value">${String(data.goal ?? "1 topic + 20 questions")}</div></div>
          <a href="${appUrl}/ai-doubt-solver" class="btn">Start Today's Session →</a>
          <p>Your AI mentor remembers exactly where you left off.</p>
        `),
      };

    case "streak-reminder":
      return {
        subject: `🔥 Don't break your ${String(data.streak ?? 0)}-day streak, ${name}!`,
        html: base(`
          <h1>Your streak is at risk! 🔥</h1>
          <p>You have a <strong style="color:#f97316">${String(data.streak ?? 0)}-day</strong> study streak. Keep it alive with even one short session today.</p>
          <div class="stat"><div class="stat-label">Current Streak</div><div class="stat-value">${String(data.streak ?? 0)} days 🔥</div></div>
          <a href="${appUrl}/dashboard" class="btn">Keep My Streak →</a>
          <p>Toppers who maintained 30+ day streaks scored 97th+ percentile. You're on track.</p>
        `),
      };

    case "comeback":
      return {
        subject: `We miss you, ${name} — your AI mentor has new insights 💡`,
        html: base(`
          <h1>Your AI mentor has been busy 🤖</h1>
          <p>It's been a while since your last session. Your mentor has analyzed your past performance and identified 3 high-ROI areas to focus on.</p>
          <a href="${appUrl}/ai-doubt-solver" class="btn">See Your Insights →</a>
          <p>CAT is ${String(data.daysLeft ?? "coming up")}. Your competitors haven't stopped — neither should you.</p>
        `),
      };

    case "ai-report":
      return {
        subject: `📊 Your weekly AI study report is ready, ${name}`,
        html: base(`
          <h1>Your weekly performance report</h1>
          <p>Here's how your CAT prep looks this week:</p>
          <div class="stat"><div class="stat-label">Sessions Completed</div><div class="stat-value">${String(data.sessions ?? 0)}</div></div>
          <div class="stat"><div class="stat-label">Questions Solved</div><div class="stat-value">${String(data.questions ?? 0)}</div></div>
          <div class="stat"><div class="stat-label">Estimated Percentile</div><div class="stat-value">${String(data.percentile ?? "–")}%</div></div>
          <a href="${appUrl}/dashboard" class="btn">View Full Report →</a>
        `),
      };

    case "payment-success":
      return {
        subject: `✅ ${appName} ${String(data.plan ?? "Pro")} — Payment confirmed`,
        html: base(`
          <h1>You're now on ${String(data.plan ?? "Pro")} 🎉</h1>
          <p>Your payment of ₹${String(data.amount ?? "0")} was successful. All Pro features are now unlocked.</p>
          <div class="stat"><div class="stat-label">Plan</div><div class="stat-value">${String(data.plan ?? "Pro")}</div></div>
          <div class="stat"><div class="stat-label">Valid Until</div><div class="stat-value">${String(data.expiresAt ?? "–")}</div></div>
          <a href="${appUrl}/dashboard" class="btn">Explore Pro Features →</a>
        `),
      };

    case "payment-failed":
      return {
        subject: `⚠️ Payment failed — ${appName}`,
        html: base(`
          <h1>Payment issue</h1>
          <p>We couldn't process your payment. Please update your payment method to continue using ${String(data.plan ?? "Pro")} features.</p>
          <a href="${appUrl}/pricing" class="btn">Retry Payment →</a>
          <p>Your progress and memories are safe — we'll hold your account for 7 days.</p>
        `),
      };

    case "subscription-cancelled":
      return {
        subject: `Your ${appName} subscription has been cancelled`,
        html: base(`
          <h1>Subscription cancelled</h1>
          <p>Your ${String(data.plan ?? "Pro")} plan has been cancelled. You'll have access until ${String(data.expiresAt ?? "the end of your billing period")}.</p>
          <p>Your memories, conversations, and progress are all saved for when you return.</p>
          <a href="${appUrl}/pricing" class="btn">Reactivate Anytime →</a>
        `),
      };
  }
}

// ─── Sender ────────────────────────────────────────────────────────────────────

async function sendViaResend(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error ${response.status}: ${error}`);
  }

  const data = await response.json() as ResendSuccessResponse;
  console.log(`[Email] Sent via Resend — id: ${data.id}, to: ${payload.to}`);
}

export async function sendEmail(options: SendEmailOptions): Promise<{ ok: boolean; error?: string }> {
  try {
    const { subject, html } = renderTemplate(options.template, options.data);
    const from = process.env.EMAIL_FROM ?? "CATalyst AI <noreply@catalystai.in>";

    const payload: EmailPayload = { from, to: options.to, subject, html };

    if (process.env.RESEND_API_KEY) {
      await sendViaResend(payload);
    } else {
      // Dev fallback — log to console
      console.log(`[Email DEV] to=${options.to} subject="${subject}"`);
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Email] Send failed:", message);
    return { ok: false, error: message };
  }
}

// ─── Convenience helpers ───────────────────────────────────────────────────────

export const sendWelcomeEmail = (to: string, name: string) =>
  sendEmail({ to, template: "welcome", data: { name } });

export const sendVerificationEmail = (to: string, name: string, verificationUrl: string) =>
  sendEmail({ to, template: "email-verification", data: { name, verificationUrl } });

export const sendPasswordResetEmail = (to: string, name: string, resetUrl: string) =>
  sendEmail({ to, template: "password-reset", data: { name, resetUrl } });

export const sendStreakReminderEmail = (to: string, name: string, streak: number) =>
  sendEmail({ to, template: "streak-reminder", data: { name, streak } });

export const sendStudyReminderEmail = (to: string, name: string, goal?: string) =>
  sendEmail({ to, template: "study-reminder", data: { name, goal } });

export const sendComebackEmail = (to: string, name: string, daysLeft?: string) =>
  sendEmail({ to, template: "comeback", data: { name, daysLeft } });

export const sendWeeklyReportEmail = (to: string, name: string, stats: { sessions: number; questions: number; percentile: number }) =>
  sendEmail({ to, template: "ai-report", data: { name, ...stats } });

export const sendPaymentSuccessEmail = (to: string, name: string, plan: string, amount: string, expiresAt: string) =>
  sendEmail({ to, template: "payment-success", data: { name, plan, amount, expiresAt } });

export const sendPaymentFailedEmail = (to: string, name: string, plan: string) =>
  sendEmail({ to, template: "payment-failed", data: { name, plan } });
