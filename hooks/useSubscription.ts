"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import type { Plan } from "@/lib/features";

export interface SubscriptionStatus {
  effectivePlan: Plan | null;
  isAdmin: boolean;
  isPremium: boolean;
  isElite: boolean;
  showUpgradePrompts: boolean;
  expiresAt: string | null;
  billingCycle: string | null;
  provider: string | null;
  isLoading: boolean;
  error: string | null;
  /** Manually re-fetch after payment */
  refresh: () => void;
}

/**
 * Fetches the server-side subscription status once on mount and after
 * payment confirmation. Keeps the Zustand auth store in sync.
 *
 * Admin users always see effectivePlan = "elite" — no API call needed.
 */
export function useSubscription(): SubscriptionStatus {
  const { user, isAdmin: storeAdmin, setUserPlan } = useAuthStore();
  const [status, setStatus] = useState<Omit<SubscriptionStatus, "refresh">>({
    effectivePlan: null,
    isAdmin: storeAdmin,
    isPremium: false,
    isElite: storeAdmin,
    showUpgradePrompts: !storeAdmin,
    expiresAt: null,
    billingCycle: null,
    provider: null,
    isLoading: true,
    error: null,
  });

  const refreshCount = useRef(0);

  const fetch = useCallback(async () => {
    if (!user?.id) {
      setStatus((s) => ({ ...s, isLoading: false }));
      return;
    }

    try {
      const res = await window.fetch("/api/subscription/status", {
        headers: { "x-user-id": user.id },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json() as {
        effectivePlan: Plan;
        isAdmin: boolean;
        isPremium: boolean;
        isElite: boolean;
        showUpgradePrompts: boolean;
        subscription: {
          plan: Plan;
          status: string;
          expiresAt: string | null;
          billingCycle: string | null;
          provider: string | null;
        } | null;
      };

      // Sync Zustand store so feature gates update immediately
      if (data.effectivePlan && data.effectivePlan !== "free") {
        setUserPlan(data.effectivePlan);
      }

      setStatus({
        effectivePlan: data.effectivePlan,
        isAdmin: data.isAdmin,
        isPremium: data.isPremium,
        isElite: data.isElite,
        showUpgradePrompts: data.showUpgradePrompts,
        expiresAt: data.subscription?.expiresAt ?? null,
        billingCycle: data.subscription?.billingCycle ?? null,
        provider: data.subscription?.provider ?? null,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setStatus((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load subscription",
      }));
    }
  }, [user?.id, setUserPlan]);

  useEffect(() => {
    void fetch();
  }, [fetch, refreshCount.current]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => {
    refreshCount.current += 1;
    setStatus((s) => ({ ...s, isLoading: true, error: null }));
    void fetch();
  }, [fetch]);

  return { ...status, refresh };
}
