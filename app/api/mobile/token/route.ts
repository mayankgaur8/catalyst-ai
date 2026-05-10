/**
 * Mobile API token refresh endpoint
 * POST /api/mobile/token
 *
 * Accepts a valid refresh token and issues a new short-lived access token.
 * Tokens are HMAC-SHA256 signed — no JWT library dependency.
 *
 * Token format: `<userId>.<expiresAt>.<hmac>`
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;       // 15 minutes
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getTokenSecret(): string {
  const secret = process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("SESSION_SECRET not configured");
  return secret;
}

function signToken(payload: string): string {
  return createHmac("sha256", getTokenSecret()).update(payload).digest("hex");
}

function createToken(userId: string, ttlMs: number): string {
  const expiresAt = Date.now() + ttlMs;
  const payload = `${userId}.${expiresAt}`;
  const hmac = signToken(payload);
  return `${payload}.${hmac}`;
}

function verifyToken(token: string): { userId: string; expiresAt: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [userId, expiresAtStr, providedHmac] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt)) return null;

    const payload = `${userId}.${expiresAtStr}`;
    const expectedHmac = signToken(payload);

    const providedBuf = Buffer.from(providedHmac, "hex");
    const expectedBuf = Buffer.from(expectedHmac, "hex");
    if (providedBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(providedBuf, expectedBuf)) return null;

    if (Date.now() > expiresAt) return null;

    return { userId, expiresAt };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { refreshToken?: string };

  if (!body.refreshToken) {
    return NextResponse.json({ error: "refreshToken required" }, { status: 400 });
  }

  const verified = verifyToken(body.refreshToken);
  if (!verified) {
    return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 401 });
  }

  // Verify user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: verified.userId },
    select: {
      id: true,
      email: true,
      role: true,
      subscription: { select: { plan: true, status: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 401 });
  }

  const accessToken = createToken(user.id, ACCESS_TOKEN_TTL_MS);
  const refreshToken = createToken(user.id, REFRESH_TOKEN_TTL_MS);

  return NextResponse.json({
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL_MS / 1000,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      plan: user.subscription?.plan ?? "FREE",
      subscriptionStatus: user.subscription?.status ?? null,
    },
  });
}

/**
 * GET /api/mobile/token — verify an access token (lightweight ping)
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 });
  }

  const verified = verifyToken(token);
  if (!verified) {
    return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    userId: verified.userId,
    expiresAt: new Date(verified.expiresAt).toISOString(),
  });
}
