"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Crown, Check, ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import type { Feature, Plan } from "@/lib/features";
import { getRequiredPlan, PLAN_LABELS } from "@/lib/features";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  /** Feature that triggered the paywall — used to show relevant plan */
  feature?: Feature;
  /** Override the headline */
  headline?: string;
}

const PLAN_CONFIG: Record<"pro" | "elite", {
  icon: React.ReactNode;
  gradient: string;
  border: string;
  badge: string;
  price: string;
  period: string;
  cta: string;
  ctaStyle: string;
  features: string[];
}> = {
  pro: {
    icon: <Zap size={18} className="text-neon-blue" />,
    gradient: "from-neon-blue/10 to-neon-purple/5",
    border: "border-neon-blue/30",
    badge: "bg-neon-blue/20 text-neon-blue border-neon-blue/30",
    price: "₹999",
    period: "/month",
    cta: "Upgrade to Pro",
    ctaStyle: "bg-gradient-to-r from-neon-blue to-neon-purple glow-blue hover:opacity-90",
    features: [
      "Unlimited AI Doubt Solver",
      "Unlimited Mock Tests",
      "Premium Video Library",
      "AI Study Planner",
      "Deep Analytics",
      "GD/PI/WAT Preparation",
    ],
  },
  elite: {
    icon: <Crown size={18} className="text-yellow-400" />,
    gradient: "from-neon-purple/10 to-pink-500/5",
    border: "border-neon-purple/30",
    badge: "bg-neon-purple/20 text-neon-purple border-neon-purple/30",
    price: "₹4,999",
    period: "/year",
    cta: "Upgrade to Elite",
    ctaStyle: "bg-gradient-to-r from-neon-purple to-pink-600 glow-purple hover:opacity-90",
    features: [
      "Everything in Pro",
      "Personal AI Mentor",
      "AI Mock Interviews",
      "SOP & Essay Builder",
      "Priority AI Responses",
      "Daily Roadmap Generation",
    ],
  },
};

export function PaywallModal({ open, onClose, feature, headline }: PaywallModalProps) {
  const router = useRouter();
  const { isAdmin } = useAuthStore();

  // Admins never see this modal — hard guard
  if (isAdmin) return null;

  const requiredPlan = feature ? getRequiredPlan(feature) : "pro";
  const targetPlan: "pro" | "elite" = requiredPlan === "elite" ? "elite" : "pro";
  const config = PLAN_CONFIG[targetPlan];

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function handleUpgrade() {
    onClose();
    router.push(`/plan-selection?highlight=${targetPlan}`);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={cn(
              "relative w-full max-w-md rounded-2xl border bg-gradient-to-br bg-dark-800 p-6 shadow-2xl",
              config.gradient,
              config.border,
            )}>
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-1">
                <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold", config.badge)}>
                  {config.icon}
                  {PLAN_LABELS[targetPlan]}
                </div>
              </div>

              <h2 className="text-xl font-bold mt-3 mb-1">
                {headline ?? `Unlock ${PLAN_LABELS[targetPlan]} Features`}
              </h2>
              <p className="text-white/50 text-sm mb-5">
                {targetPlan === "pro"
                  ? "Everything you need to crack CAT with 99+ percentile."
                  : "Your personal AI mentor for IIM A/B/C preparation."}
              </p>

              {/* Feature list */}
              <ul className="space-y-2 mb-6">
                {config.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                    <Check size={14} className="text-green-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={handleUpgrade}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all",
                  config.ctaStyle
                )}
              >
                {config.cta}
                <span className="text-white/70 font-normal">{config.price}{config.period}</span>
                <ArrowRight size={14} />
              </button>

              <p className="text-center text-white/30 text-xs mt-3">
                Cancel anytime · Secure payment via Razorpay
              </p>

              {/* Sparkle decoration */}
              <Sparkles
                size={48}
                className="absolute -top-4 -right-4 text-white/5 rotate-12"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
