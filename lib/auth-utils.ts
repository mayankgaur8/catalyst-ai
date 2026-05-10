import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Extract userId from request headers
 * Headers: x-user-id (from localStorage catalyst-auth store)
 */
export function getUserIdFromHeader(req: NextRequest): string | null {
  const userId = req.headers.get("x-user-id");
  if (!userId) return null;
  return userId;
}

export type AuthenticatedUser = {
  id: string;
  role: "USER" | "ADMIN";
  plan: "FREE" | "PRO" | "ELITE";
};

export async function getAuthenticatedUserFromRequest(
  req: NextRequest
): Promise<AuthenticatedUser | null> {
  const userId = getUserIdFromHeader(req);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      subscription: { select: { plan: true } },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    role: user.role,
    plan: user.subscription?.plan ?? "FREE",
  };
}

export async function requireAuthenticatedUser(req: NextRequest) {
  const user = await getAuthenticatedUserFromRequest(req);
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user };
}

/**
 * Extract user plan from headers
 */
export function getUserPlanFromHeader(req: NextRequest): string {
  return req.headers.get("x-user-plan") || "free";
}

/**
 * Extract user role from headers
 */
export function getUserRoleFromHeader(req: NextRequest): string {
  return req.headers.get("x-user-role") || "user";
}

/**
 * Check if user is admin
 */
export function isAdminFromHeader(req: NextRequest): boolean {
  return getUserRoleFromHeader(req) === "admin";
}

export function isAdminUser(user: AuthenticatedUser): boolean {
  return user.role === "ADMIN";
}
