"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Zap, Crown, Star, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import type { Plan } from "@/lib/features";

const PLANS = [
  {
    id: "free" as Plan,
    name: "Free",
    icon: "🎯",
    price: 0,
    period: "forever",
    desc: "Start your CAT journey with the essentials",
    color: "border-white/10",
    highlight: false,
    cta: "Start Free",
    features: [
      "50 practice questions/day",
      "2 full mock tests/month",
      "Basic AI explanations",
      "Dashboard & progress tracking",
      "1 sectional mock/week",
      "Daily streaks & XP",
    ],
    missing: ["Unlimited questions", "AI Doubt Solver", "Deep analytics", "College Predictor"],
  },
  {
    id: "pro" as Plan,
    name: "Pro",
    icon: "⚡",
    price: 1999,
    yearlyPrice: 14999,
    period: "month",
    desc: "Everything you need for 99+ percentile",
    color: "border-neon-blue/40",
    highlight: true,
    tag: "Most Popular",
    cta: "Start 7-Day Trial",
    features: [
      "Unlimited practice questions",
      "Full AI Doubt Solver",
      "Unlimited mock tests",
      "AI Personalized Study Plan",
      "College Predictor",
      "GD/PI/WAT Preparation",
      "Video library (50+ hours)",
      "Deep analytics & heatmaps",
      "Leaderboard & gamification",
      "Priority support",
    ],
    missing: ["AI Mock Interviews", "1:1 Mentorship", "Daily roadmap AI"],
  },
  {
    id: "elite" as Plan,
    name: "Elite",
    icon: "👑",
    price: 3999,
    yearlyPrice: 29999,
    period: "month",
    desc: "For aspirants targeting IIM A/B/C",
    color: "border-neon-purple/40",
    highlight: false,
    tag: "Best Results",
    cta: "Get Elite",
    features: [
      "Everything in Pro",
      "AI Mock Interviews (20+)",
      "IIM-specific prep module",
      "SOP & Essay builder",
      "1:1 Expert Mentorship (2/month)",
      "AI Voice Tutor",
      "Daily roadmap generation",
      "Live doubt solving sessions",
      "Personal performance coach",
      "MBA predictor & college match",
      "99%ile guarantee*",
    ],
    missing: [],
  },
];

export default function PlanSelectionPage() {
  const router = useRouter();
  const { isAuthenticated, plan, hasCompletedOnboarding, selectPlan, user } = useAuthStore();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [selecting, setSelecting] = useState<Plan | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return router.push("/login");
    if (plan) {
      if (!hasCompletedOnboarding) return router.push("/onboarding");
      router.push("/dashboard");
    }
  }, [isAuthenticated, plan, hasCompletedOnboarding, router]);

  async function handleSelectPlan(p: Plan) {
    setSelecting(p);
    await new Promise((r) => setTimeout(r, 500));
    selectPlan(p);
    if (p === "free") {
      router.push("/onboarding");
    } else {
      router.push(`/payment?plan=${p}&billing=${billing}`);
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 animated-bg">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-neon-purple/5 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center glow-blue">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold neon-text">CATalyst AI</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-sm font-bold">
            {user?.name?.[0]}
          </div>
          <span className="text-sm text-white/60 hidden sm:block">{user?.name}</span>
        </div>
      </nav>

      <div className="relative max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full border border-neon-blue/20 text-sm text-neon-blue mb-6"
          >
            <Sparkles size={14} />
            Step 2 of 4 — Choose Your Plan
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Invest in your <span className="neon-text">MBA future</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/40 text-lg max-w-xl mx-auto"
          >
            Less than the cost of a coaching class per day. Start free — upgrade anytime.
          </motion.p>

          {/* Billing toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center gap-3 mt-6"
          >
            <span className={cn("text-sm", billing === "monthly" ? "text-white" : "text-white/40")}>Monthly</span>
            <button
              onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
              className={cn(
                "relative w-12 h-6 rounded-full border transition-all",
                billing === "yearly"
                  ? "bg-neon-blue/30 border-neon-blue/40"
                  : "bg-white/10 border-white/15"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full transition-all",
                billing === "yearly"
                  ? "left-6 bg-neon-blue"
                  : "left-0.5 bg-white/60"
              )} />
            </button>
            <span className={cn("text-sm flex items-center gap-1.5", billing === "yearly" ? "text-white" : "text-white/40")}>
              Yearly
              <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/20">
                Save 40%
              </span>
            </span>
          </motion.div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "relative glass rounded-3xl p-7 border flex flex-col",
                plan.color,
                plan.highlight && "ring-1 ring-neon-blue/30 scale-[1.03]"
              )}
              style={plan.highlight ? { background: "rgba(0,212,255,0.04)" } : {}}
            >
              {plan.tag && (
                <div className={cn(
                  "absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap",
                  plan.highlight
                    ? "bg-gradient-to-r from-neon-blue to-neon-purple"
                    : "bg-gradient-to-r from-neon-purple to-pink-500"
                )}>
                  {plan.tag}
                </div>
              )}

              <div className="text-4xl mb-3">{plan.icon}</div>
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-white/40 text-sm mb-5">{plan.desc}</p>

              <div className="mb-6">
                {plan.price === 0 ? (
                  <div className="text-4xl font-bold">Free</div>
                ) : (
                  <>
                    <div className="flex items-end gap-1">
                      <span className="text-white/40 text-sm">₹</span>
                      <span className="text-4xl font-bold">
                        {billing === "yearly"
                          ? Math.round(plan.yearlyPrice! / 12).toLocaleString()
                          : plan.price.toLocaleString()}
                      </span>
                      <span className="text-white/40 text-sm mb-1">/mo</span>
                    </div>
                    {billing === "yearly" && (
                      <p className="text-xs text-green-400 mt-1">
                        ₹{plan.yearlyPrice!.toLocaleString()}/year — save ₹{(plan.price * 12 - plan.yearlyPrice!).toLocaleString()}
                      </p>
                    )}
                    {billing === "monthly" && plan.id === "pro" && (
                      <p className="text-xs text-neon-blue mt-1">7-day free trial included</p>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={!!selecting}
                className={cn(
                  "w-full py-3 rounded-xl font-semibold text-sm mb-6 transition-all flex items-center justify-center gap-2 disabled:opacity-60",
                  plan.highlight
                    ? "bg-gradient-to-r from-neon-blue to-neon-purple text-white glow-blue hover:opacity-90"
                    : plan.id === "elite"
                    ? "bg-gradient-to-r from-neon-purple to-pink-600 text-white glow-purple hover:opacity-90"
                    : "glass border border-white/15 text-white hover:bg-white/8"
                )}
              >
                {selecting === plan.id ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>{plan.cta} {plan.price > 0 && <ArrowRight size={14} />}</>
                )}
              </button>

              <div className="space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2.5">
                    <Check size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-white/70">{f}</span>
                  </div>
                ))}
                {plan.missing.map((f) => (
                  <div key={f} className="flex items-start gap-2.5 opacity-35">
                    <X size={14} className="text-white/30 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-white/40">{f}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-white/30"
        >
          {[
            { icon: "🔒", text: "SSL encrypted payments" },
            { icon: "↩️", text: "Cancel anytime" },
            { icon: "💳", text: "UPI, cards & net banking" },
            { icon: "⭐", text: "99%ile guarantee on Elite" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
