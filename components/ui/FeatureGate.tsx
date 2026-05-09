"use client";

import { useAuthStore, useEffectivePlan } from "@/store/useAuthStore";
import { canAccess } from "@/lib/features";
import type { Feature } from "@/lib/features";
import { LockedFeature } from "./LockedFeature";

interface FeatureGateProps {
  feature: Feature;
  children: React.ReactNode;
  /** Custom fallback instead of the default LockedFeature UI */
  fallback?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

/**
 * Renders children when the user's effective plan includes the feature.
 * Admin is always let through regardless of previewPlan — they test the
 * locked UI explicitly via the Plan Simulator in the admin panel.
 *
 * Usage:
 *   <FeatureGate feature="AI_DOUBT_SOLVER">
 *     <DoubSolver />
 *   </FeatureGate>
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  compact,
  className,
}: FeatureGateProps) {
  const { isAdmin } = useAuthStore();
  const effectivePlan = useEffectivePlan();

  // Admins always pass through — they use the Plan Simulator to test locked UI
  if (isAdmin || canAccess(effectivePlan, feature)) {
    return <>{children}</>;
  }

  if (fallback !== undefined) return <>{fallback}</>;
  return <LockedFeature feature={feature} compact={compact} className={className} />;
}
