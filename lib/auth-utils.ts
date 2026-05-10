import { NextRequest } from "next/server";

/**
 * Extract userId from request headers
 * Headers: x-user-id (from localStorage catalyst-auth store)
 */
export function getUserIdFromHeader(req: NextRequest): string | null {
  const userId = req.headers.get("x-user-id");
  if (!userId) return null;
  return userId;
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
