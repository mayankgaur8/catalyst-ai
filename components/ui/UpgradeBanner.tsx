"use client";

import { motion } from "framer-motion";
import { ArrowRight, X, Zap, Crown, Sparkles } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/features";

interface UpgradeBannerProps {
  currentPlan: Plan;
  variant?: "banner" | "card" | "inline";
  className?: string;
}

const UPGRADE_COPY: Record<Plan, { from: string; to: Plan; headline: string; sub: string; cta: string; color: string; icon: React.ReactNode }> = {
  free: {
    from: "free",
    to: "pro",
    headline: "Unlock AI-Powered Preparation",
    sub: "Get unlimited questions, AI Doubt Solver, deep analytics & 10x more features.",
    cta: "Upgrade to Pro — ₹1,999/mo",
    color: "from-neon-blue/15 to-neon-purple/10 border-neon-blue/25",
    icon: <Zap size={16} className="text-neon-blue" />,
  },
  pro: {
    from: "pro",
    to: "elite",
    headline: "Get Your Personal AI Mentor",
    sub: "1:1 mentorship, AI voice tutor, mock interviews, and IIM-specific coaching.",
    cta: "Upgrade to Elite — ₹3,999/mo",
    color: "from-neon-purple/15 to-pink-500/10 border-neon-purple/25",
    icon: <Crown size={16} className="text-yellow-400" />,
  },
  elite: {
    from: "elite",
    to: "elite",
    headline: "You're on the best plan!",
    sub: "Access all features and achieve your dream percentile.",
    cta: "",
    color: "from-green-500/10 to-teal-500/5 border-green-500/20",
    icon: <Sparkles size={16} className="text-green-400" />,
  },
};

export function UpgradeBanner({ currentPlan, variant = "banner", className }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  if (currentPlan === "elite" || dismissed) return null;

  const copy = UPGRADE_COPY[currentPlan];

  if (variant === "inline") {
    return (
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r border text-sm",
        copy.color,
        className
      )}>
        {copy.icon}
        <span className="flex-1 text-white/70">{copy.sub}</span>
        <button
          onClick={() => router.push("/plan-selection")}
          className="text-neon-blue text-xs font-semibold flex items-center gap-1 whitespace-nowrap hover:gap-2 transition-all"
        >
          Upgrade <ArrowRight size={12} />
        </button>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "glass rounded-2xl p-5 border bg-gradient-to-br relative",
          copy.color,
          className
        )}
      >
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-white/30 hover:text-white"
        >
          <X size={14} />
        </button>
        <div className="flex items-center gap-2 mb-2">
          {copy.icon}
          <span className="text-sm font-bold">{copy.headline}</span>
        </div>
        <p className="text-xs text-white/40 mb-4">{copy.sub}</p>
        <button
          onClick={() => router.push("/plan-selection")}
          className={cn(
            "w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all",
            currentPlan === "free"
              ? "bg-gradient-to-r from-neon-blue to-neon-purple text-white glow-blue hover:opacity-90"
              : "bg-gradient-to-r from-neon-purple to-pink-600 text-white glow-purple hover:opacity-90"
          )}
        >
          {copy.cta} <ArrowRight size={12} />
        </button>
      </motion.div>
    );
  }

  // Banner variant
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-4 rounded-2xl border bg-gradient-to-r",
        copy.color,
        className
      )}
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-white/25 hover:text-white/60 transition-colors"
      >
        <X size={14} />
      </button>

      <div className="flex items-center gap-2 flex-shrink-0">
        {copy.icon}
        <span className="font-bold text-sm">{copy.headline}</span>
      </div>

      <p className="text-white/50 text-sm flex-1 pr-6">{copy.sub}</p>

      <button
        onClick={() => router.push("/plan-selection")}
        className={cn(
          "flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap",
          currentPlan === "free"
            ? "bg-gradient-to-r from-neon-blue to-neon-purple text-white hover:opacity-90"
            : "bg-gradient-to-r from-neon-purple to-pink-600 text-white hover:opacity-90"
        )}
      >
        {copy.cta} <ArrowRight size={14} />
      </button>
    </motion.div>
  );
}
