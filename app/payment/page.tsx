"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard, Shield, CheckCircle2, Lock,
  ArrowLeft, Sparkles, Tag, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import type { Plan } from "@/lib/features";

const PLAN_DETAILS: Record<string, { name: string; monthly: number; yearly: number; icon: string; color: string }> = {
  pro: { name: "Pro", monthly: 1999, yearly: 14999, icon: "⚡", color: "neon-blue" },
  elite: { name: "Elite", monthly: 3999, yearly: 29999, icon: "👑", color: "neon-purple" },
};

const COUPONS: Record<string, number> = {
  "CAT2025": 20,
  "FIRST50": 50,
  "WELCOME": 10,
  "IIM100": 15,
};

type PaymentMethod = "upi" | "card" | "netbanking" | "emi";

function PaymentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") as Plan | null;
  const billing = searchParams.get("billing") as "monthly" | "yearly" | null;

  const { isAuthenticated, activateSubscription, user, plan: currentPlan } = useAuthStore();

  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [upiId, setUpiId] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<"checkout" | "processing" | "success">("checkout");

  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
    if (!planId || !PLAN_DETAILS[planId]) router.push("/plan-selection");
    if (currentPlan) {
      router.push("/onboarding");
    }
  }, [isAuthenticated, planId, currentPlan, router]);

  const planInfo = planId ? PLAN_DETAILS[planId] : null;
  if (!planInfo || !planId) return null;

  const billingType = billing ?? "monthly";
  const basePrice = billingType === "yearly" ? planInfo.yearly : planInfo.monthly;
  const discountAmount = Math.round((basePrice * couponDiscount) / 100);
  const finalPrice = basePrice - discountAmount;

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (COUPONS[code]) {
      setCoupon(code);
      setCouponDiscount(COUPONS[code]);
      setCouponError("");
    } else {
      setCouponError("Invalid coupon code");
      setCoupon("");
      setCouponDiscount(0);
    }
  }

  function formatCard(value: string) {
    return value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
  }

  function formatExpiry(value: string) {
    const v = value.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 2) return v.slice(0, 2) + "/" + v.slice(2);
    return v;
  }

  async function handlePayment() {
    if (!planId) return;
    if (method === "upi" && !upiId.includes("@")) return;
    setProcessing(true);
    setStep("processing");
    await new Promise((r) => setTimeout(r, 2500));
    activateSubscription(planId, billingType === "yearly" ? 12 : 1);
    setStep("success");
    await new Promise((r) => setTimeout(r, 2000));
    router.push("/onboarding");
  }

  return (
    <div className="min-h-screen bg-dark-900 animated-bg">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/3 w-96 h-96 bg-neon-blue/4 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/3 w-80 h-80 bg-neon-purple/4 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative flex items-center justify-between px-6 py-4 border-b border-white/5">
        <button
          onClick={() => router.push("/plan-selection")}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back to plans
        </button>
        <div className="flex items-center gap-2 text-xs text-white/30">
          <Lock size={12} className="text-green-400" />
          <span className="text-green-400">Secure 256-bit SSL</span>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-dark-900/90 backdrop-blur-xl flex flex-col items-center justify-center z-50"
          >
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-neon-blue/20 animate-pulse" />
                <div className="absolute inset-0 rounded-full border-4 border-t-neon-blue animate-spin" />
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center">
                  <CreditCard size={28} className="text-neon-blue" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Processing Payment</h2>
              <p className="text-white/40 text-sm">Please wait, do not close this window...</p>
              <div className="flex gap-1.5 justify-center mt-6">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-dark-900/90 backdrop-blur-xl flex flex-col items-center justify-center z-50"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 size={48} className="text-green-400" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-2">Payment Successful!</h2>
              <p className="text-white/50 mb-2">{planInfo.icon} {planInfo.name} plan activated</p>
              <p className="text-white/30 text-sm">Redirecting to personalized onboarding...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full border border-neon-blue/20 text-sm text-neon-blue mb-4">
            <Sparkles size={14} />
            Step 3 of 4 — Complete Payment
          </div>
          <h1 className="text-3xl font-bold">Complete your subscription</h1>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Payment form */}
          <div className="lg:col-span-3 space-y-5">
            {/* Method selector */}
            <div className="glass rounded-2xl p-5 border border-white/8">
              <h3 className="font-semibold mb-4 text-sm text-white/70 uppercase tracking-wider">Payment Method</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                {([
                  { id: "upi", label: "UPI", icon: "₹" },
                  { id: "card", label: "Card", icon: "💳" },
                  { id: "netbanking", label: "Netbanking", icon: "🏦" },
                  { id: "emi", label: "EMI", icon: "📅" },
                ] as { id: PaymentMethod; label: string; icon: string }[]).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium border transition-all",
                      method === m.id
                        ? "bg-neon-blue/20 border-neon-blue/40 text-neon-blue"
                        : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                    )}
                  >
                    <span className="text-lg">{m.icon}</span>
                    {m.label}
                  </button>
                ))}
              </div>

              {method === "upi" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-blue/40 transition-all"
                  />
                  <p className="text-xs text-white/30 mt-2">Popular: PhonePe, GPay, Paytm, BHIM</p>
                </motion.div>
              )}

              {method === "card" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Card Number</label>
                    <div className="relative">
                      <CreditCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                      <input
                        type="text"
                        value={card.number}
                        onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-blue/40 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Cardholder Name</label>
                    <input
                      type="text"
                      value={card.name}
                      onChange={(e) => setCard({ ...card, name: e.target.value })}
                      placeholder="Name on card"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-blue/40 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Expiry</label>
                      <input
                        type="text"
                        value={card.expiry}
                        onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-blue/40 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">CVV</label>
                      <input
                        type="password"
                        value={card.cvv}
                        onChange={(e) => setCard({ ...card, cvv: e.target.value.slice(0, 3) })}
                        placeholder="•••"
                        maxLength={3}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-blue/40 transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {method === "netbanking" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="grid grid-cols-3 gap-2">
                    {["SBI", "HDFC", "ICICI", "Axis", "Kotak", "Others"].map((bank) => (
                      <button key={bank} className="py-3 px-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white/60 hover:border-neon-blue/30 hover:text-white transition-all">
                        {bank}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {method === "emi" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="space-y-2">
                    {[3, 6, 9, 12].map((months) => (
                      <div key={months} className="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm hover:border-neon-blue/30 cursor-pointer transition-all">
                        <span className="text-white/70">{months} months</span>
                        <span className="font-semibold text-neon-blue">₹{Math.round(finalPrice / months).toLocaleString()}/mo</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Coupon */}
            <div className="glass rounded-2xl p-5 border border-white/8">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={16} className="text-neon-blue" />
                <h3 className="font-semibold text-sm">Coupon Code</h3>
              </div>
              {coupon ? (
                <div className="flex items-center justify-between px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div>
                    <p className="text-green-400 font-semibold text-sm">{coupon} applied!</p>
                    <p className="text-green-400/70 text-xs">{couponDiscount}% off — saved ₹{discountAmount.toLocaleString()}</p>
                  </div>
                  <button onClick={() => { setCoupon(""); setCouponDiscount(0); setCouponInput(""); }}>
                    <X size={16} className="text-white/40 hover:text-white" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-blue/40 transition-all"
                  />
                  <button
                    onClick={applyCoupon}
                    className="px-4 py-2.5 bg-neon-blue/20 border border-neon-blue/30 text-neon-blue rounded-xl text-sm font-medium hover:bg-neon-blue/30 transition-all"
                  >
                    Apply
                  </button>
                </div>
              )}
              {couponError && <p className="text-red-400 text-xs mt-2">{couponError}</p>}
              <p className="text-white/25 text-xs mt-2">Try: CAT2025, FIRST50, WELCOME</p>
            </div>

            {/* Pay button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handlePayment}
              disabled={processing}
              className="w-full py-4 bg-gradient-to-r from-neon-blue to-neon-purple rounded-2xl font-bold text-lg flex items-center justify-center gap-3 glow-blue hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Lock size={18} />
              Pay ₹{finalPrice.toLocaleString()} Securely
            </motion.button>

            <div className="flex items-center justify-center gap-6 text-xs text-white/25">
              <div className="flex items-center gap-1.5"><Shield size={11} className="text-green-400" />SSL secured</div>
              <div className="flex items-center gap-1.5">Powered by Razorpay</div>
              <div className="flex items-center gap-1.5">PCI-DSS compliant</div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-6 border border-white/8 sticky top-6">
              <h3 className="font-semibold mb-5">Order Summary</h3>

              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-white/8">
                <div className="text-3xl">{planInfo.icon}</div>
                <div>
                  <p className="font-bold">CATalyst {planInfo.name}</p>
                  <p className="text-white/40 text-sm capitalize">{billingType} billing</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Base price</span>
                  <span>₹{basePrice.toLocaleString()}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Coupon ({coupon})</span>
                    <span>-₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/50">GST (18%)</span>
                  <span>₹{Math.round(finalPrice * 0.18).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-3 border-t border-white/8">
                  <span>Total</span>
                  <span className="neon-text">₹{Math.round(finalPrice * 1.18).toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-white/8 space-y-2.5">
                {[
                  "7-day money-back guarantee",
                  "Cancel anytime, no questions asked",
                  billingType === "yearly" ? "40% saved vs monthly" : "Switch to yearly & save 40%",
                  planId === "pro" ? "7-day free trial included" : "Priority onboarding support",
                ].map((text) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-white/40">
                    <CheckCircle2 size={12} className="text-green-400 flex-shrink-0" />
                    {text}
                  </div>
                ))}
              </div>

              <div className="mt-5 p-3 rounded-xl bg-neon-blue/5 border border-neon-blue/15">
                <p className="text-xs text-white/50 leading-relaxed">
                  <span className="text-neon-blue font-semibold">Hello {user?.name?.split(" ")[0]}!</span> You&apos;re one step away from
                  unlocking AI-powered CAT preparation. Let&apos;s do this. 🎯
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin" />
      </div>
    }>
      <PaymentPageInner />
    </Suspense>
  );
}
