"use client";

import { useRouter } from "next/navigation";
import { Crown, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore, useEffectivePlan } from "@/store/useAuthStore";
import type { Plan } from "@/lib/features";

interface PlanBadgeProps {
  className?: string;
  /** If true, clicking navigates to /plan-selection */
  clickable?: boolean;
  size?: "sm" | "md";
}

const BADGE_CONFIG: Record<Plan | "admin", {
  label: string;
  icon: React.ReactNode;
  style: string;
}> = {
  admin: {
    label: "Admin",
    icon: <Sparkles size={11} />,
    style: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  elite: {
    label: "Elite",
    icon: <Crown size={11} />,
    style: "bg-neon-purple/20 text-neon-purple border-neon-purple/30",
  },
  pro: {
    label: "Pro",
    icon: <Zap size={11} />,
    style: "bg-neon-blue/20 text-neon-blue border-neon-blue/30",
  },
  free: {
    label: "Free",
    icon: null,
    style: "bg-white/10 text-white/50 border-white/10",
  },
};

export function PlanBadge({ className, clickable = true, size = "sm" }: PlanBadgeProps) {
  const router = useRouter();
  const { isAdmin } = useAuthStore();
  const plan = useEffectivePlan();

  const key: Plan | "admin" = isAdmin ? "admin" : (plan ?? "free");
  const config = BADGE_CONFIG[key];

  const sizeClass = size === "sm"
    ? "text-[10px] px-1.5 py-0.5 gap-1"
    : "text-xs px-2 py-1 gap-1.5";

  return (
    <span
      onClick={clickable && !isAdmin ? () => router.push("/plan-selection") : undefined}
      className={cn(
        "inline-flex items-center rounded-full border font-semibold",
        sizeClass,
        config.style,
        clickable && !isAdmin && "cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
      title={isAdmin ? "Admin — full access" : `${config.label} plan`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
