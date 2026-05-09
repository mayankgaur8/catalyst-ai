"use client";

import { motion } from "framer-motion";
import { Lock, ArrowRight, Crown, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Feature, Plan } from "@/lib/features";
import { getRequiredPlan, PLAN_LABELS } from "@/lib/features";

interface LockedFeatureProps {
  feature: Feature;
  className?: string;
  children?: React.ReactNode;
  compact?: boolean;
}

const PLAN_ICONS: Record<Plan, React.ReactNode> = {
  free: <Zap size={16} className="text-white/60" />,
  pro: <Zap size={16} className="text-neon-blue" />,
  elite: <Crown size={16} className="text-yellow-400" />,
};

const PLAN_UPGRADE_COLORS: Record<Plan, string> = {
  free: "from-white/10 to-white/5 border-white/10",
  pro: "from-neon-blue/20 to-neon-purple/10 border-neon-blue/30",
  elite: "from-neon-purple/20 to-pink-500/10 border-neon-purple/30",
};

const PLAN_BUTTON_COLORS: Record<Plan, string> = {
  free: "bg-white/10 hover:bg-white/20 text-white",
  pro: "bg-gradient-to-r from-neon-blue to-neon-purple text-white glow-blue",
  elite: "bg-gradient-to-r from-neon-purple to-pink-600 text-white glow-purple",
};

export function LockedFeature({ feature, className, children, compact = false }: LockedFeatureProps) {
  const router = useRouter();
  const requiredPlan = getRequiredPlan(feature);
  const planLabel = PLAN_LABELS[requiredPlan];

  if (compact) {
    return (
      <div className={cn("relative overflow-hidden rounded-xl", className)}>
        {children && <div className="opacity-20 pointer-events-none select-none">{children}</div>}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-dark-800/80 backdrop-blur-sm rounded-xl border border-white/10">
          <Lock size={20} className="text-white/50" />
          <p className="text-xs text-white/50 text-center px-2">
            Requires <span className="font-semibold">{planLabel}</span>
          </p>
          <button
            onClick={() => router.push("/plan-selection")}
            className={cn("text-xs px-3 py-1.5 rounded-lg font-semibold", PLAN_BUTTON_COLORS[requiredPlan])}
          >
            Upgrade
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-2xl border bg-gradient-to-br p-6 text-center",
        PLAN_UPGRADE_COLORS[requiredPlan],
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-dark-800/60 border border-white/10 flex items-center justify-center mx-auto mb-4">
        <Lock size={22} className="text-white/40" />
      </div>

      <div className="flex items-center justify-center gap-2 mb-2">
        {PLAN_ICONS[requiredPlan]}
        <span className="text-sm font-bold">{planLabel} Feature</span>
      </div>

      <p className="text-white/40 text-sm mb-5 max-w-xs mx-auto">
        This feature is available on the <strong className="text-white/60">{planLabel} plan</strong>.
        Upgrade to unlock AI-powered preparation tools.
      </p>

      <button
        onClick={() => router.push("/plan-selection")}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold mx-auto transition-all",
          PLAN_BUTTON_COLORS[requiredPlan]
        )}
      >
        Upgrade to {planLabel} <ArrowRight size={14} />
      </button>
    </motion.div>
  );
}
