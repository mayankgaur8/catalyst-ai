"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Zap, Star, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

const PLANS = [
  {
    name: "Free",
    price: 0,
    period: "forever",
    desc: "Start your CAT journey with the essentials",
    icon: "🎯",
    features: [
      "50 practice questions/day",
      "2 full mock tests/month",
      "Basic AI explanations",
      "Dashboard & progress tracking",
      "1 sectional mock/week",
      "Community access",
    ],
    missing: ["Unlimited questions", "AI Doubt Solver", "GD/PI Prep", "College Predictor", "Live classes"],
    cta: "Start Free",
    planId: "free",
    color: "border-white/10",
  },
  {
    name: "Pro",
    price: 1999,
    yearlyPrice: 14999,
    period: "month",
    desc: "Everything you need for 99+ percentile",
    icon: "⚡",
    features: [
      "Unlimited practice questions",
      "Full AI Doubt Solver",
      "Unlimited mock tests",
      "AI Personalized Study Plan",
      "College Predictor",
      "GD/PI/WAT Preparation",
      "Video library (50+ hours)",
      "Leaderboard & gamification",
      "Sectional analysis",
      "Priority support",
    ],
    missing: ["AI Mock Interviews", "1:1 Mentorship"],
    cta: "Start Pro Trial",
    planId: "pro",
    color: "border-neon-blue/40",
    popular: true,
    tag: "Most Popular",
  },
  {
    name: "Elite",
    price: 3999,
    yearlyPrice: 29999,
    period: "month",
    desc: "For aspirants targeting IIM A/B/C",
    icon: "👑",
    features: [
      "Everything in Pro",
      "AI Mock Interviews (20+)",
      "IIM-specific prep module",
      "SOP & Essay builder",
      "1:1 Expert Mentorship (2/month)",
      "Live doubt solving sessions",
      "Personal performance coach",
      "GD groups with toppers",
      "Interview prep calls",
      "99%ile guarantee*",
    ],
    missing: [],
    cta: "Get Elite",
    planId: "elite",
    color: "border-neon-purple/40",
    tag: "Best Results",
    elite: true,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated, plan: currentPlan, hasCompletedOnboarding } = useAuthStore();

  function handleCTA(planId: string) {
    if (!isAuthenticated) {
      router.push("/register");
      return;
    }
    if (currentPlan) {
      // Already subscribed — go to dashboard or upgrade flow
      if (!hasCompletedOnboarding) router.push("/onboarding");
      else router.push("/dashboard");
      return;
    }
    // Authenticated but no plan yet
    router.push(`/plan-selection`);
  }

  return (
    <div className="min-h-screen bg-dark-900 animated-bg">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold neon-text">CATalyst AI</span>
        </Link>
        {isAuthenticated ? (
          <Link href="/dashboard" className="text-sm text-neon-blue hover:text-neon-blue/80">
            Go to Dashboard →
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/50 hover:text-white">Sign in</Link>
            <Link href="/register">
              <button className="text-sm px-4 py-2 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl font-semibold hover:opacity-90 transition-all">
                Get Started
              </button>
            </Link>
          </div>
        )}
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold mb-4"
          >
            Invest in your <span className="neon-text">MBA future</span>
          </motion.h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Less than the cost of a coaching class per day. Better than any classroom.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 glass px-4 py-2 rounded-full border border-white/10 text-sm">
            <Star size={14} className="text-yellow-400" />
            <span className="text-white/60">Save 40% with annual billing</span>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "glass rounded-3xl p-7 border relative transition-all flex flex-col",
                plan.color,
                plan.popular && "bg-neon-blue/5 scale-105",
                plan.elite && "bg-neon-purple/5"
              )}
            >
              {plan.tag && (
                <div className={cn(
                  "absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap",
                  plan.popular ? "bg-gradient-to-r from-neon-blue to-neon-purple" : "bg-gradient-to-r from-neon-purple to-pink-500"
                )}>
                  {plan.tag}
                </div>
              )}

              <div className="text-4xl mb-4">{plan.icon}</div>
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-white/40 text-sm mb-5">{plan.desc}</p>

              <div className="mb-6">
                <div className="flex items-end gap-1">
                  {plan.price === 0 ? (
                    <span className="text-4xl font-bold">Free</span>
                  ) : (
                    <>
                      <span className="text-white/40 text-sm">₹</span>
                      <span className="text-4xl font-bold">{plan.price.toLocaleString()}</span>
                      <span className="text-white/40 text-sm mb-1">/{plan.period}</span>
                    </>
                  )}
                </div>
                {"yearlyPrice" in plan && (
                  <p className="text-xs text-green-400 mt-1">
                    ₹{plan.yearlyPrice!.toLocaleString()}/year — save ₹{(plan.price * 12 - plan.yearlyPrice!).toLocaleString()}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleCTA(plan.planId)}
                className={cn(
                  "w-full py-3 rounded-xl font-semibold text-sm mb-6 transition-all flex items-center justify-center gap-2",
                  plan.popular
                    ? "bg-gradient-to-r from-neon-blue to-neon-purple text-white glow-blue hover:opacity-90"
                    : plan.elite
                    ? "bg-gradient-to-r from-neon-purple to-pink-500 text-white glow-purple hover:opacity-90"
                    : "glass border border-white/15 text-white hover:bg-white/8"
                )}
              >
                {plan.cta} {plan.price > 0 && <ArrowRight size={14} />}
              </button>

              <div className="space-y-2.5 flex-1">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5">
                    <Check size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-white/70">{feature}</span>
                  </div>
                ))}
                {plan.missing.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5 opacity-40">
                    <X size={14} className="text-white/30 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-white/40">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {[
              { q: "Is there a free trial for Pro?", a: "Yes! Pro comes with a 7-day free trial. Cancel anytime, no questions asked." },
              { q: "What payment methods do you accept?", a: "UPI, credit/debit cards, net banking, and EMI options via Razorpay." },
              { q: "Can I switch plans anytime?", a: "Yes, upgrade or downgrade anytime. Changes apply from the next billing cycle." },
              { q: "What is the 99%ile guarantee?", a: "Elite users who follow our plan and take 10+ mocks are guaranteed support until they achieve 99+ or get a full refund." },
            ].map((faq, i) => (
              <div key={i} className="glass rounded-2xl p-5 border border-white/5">
                <h4 className="font-semibold mb-2 text-sm">{faq.q}</h4>
                <p className="text-sm text-white/40">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
