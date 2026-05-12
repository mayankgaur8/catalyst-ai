"use client";

import { useAuthStore, useEffectivePlan } from "@/store/useAuthStore";
import { canAccess, getRequiredPlan, type Feature, type Plan } from "@/lib/features";

export interface FeatureAccess {
  /** True if the current user can use this feature */
  allowed: boolean;
  /** The minimum plan required (free | pro | elite) */
  requiredPlan: Plan;
  /** True if user is admin — always allowed regardless of plan */
  isAdmin: boolean;
  /** The user's current effective plan */
  currentPlan: Plan | null;
}

/**
 * Returns access information for a single feature.
 *
 * Admins are always allowed — they are never shown paywalls.
 *
 * Usage:
 *   const { allowed, requiredPlan } = useFeatureAccess("AI_DOUBT_SOLVER");
 *   if (!allowed) return <LockedFeature feature="AI_DOUBT_SOLVER" />;
 */
export function useFeatureAccess(feature: Feature): FeatureAccess {
  const { isAdmin } = useAuthStore();
  const currentPlan = useEffectivePlan();

  if (isAdmin) {
    return { allowed: true, requiredPlan: getRequiredPlan(feature), isAdmin: true, currentPlan };
  }

  return {
    allowed: canAccess(currentPlan, feature),
    requiredPlan: getRequiredPlan(feature),
    isAdmin: false,
    currentPlan,
  };
}
