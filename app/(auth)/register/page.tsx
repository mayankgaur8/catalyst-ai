"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye, EyeOff, Mail, Lock, User, Phone, CheckCircle2,
  ArrowRight, ArrowLeft, Zap, AlertCircle, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

const STEPS = ["Account", "Profile", "Goals"];
const TARGET_EXAMS = ["CAT", "XAT", "IIFT", "SNAP", "NMAT", "MAT"];
const TARGET_YEARS = ["2025", "2026", "2027"];
const GRADUATE_STREAMS = ["Engineering", "Commerce", "Science", "Arts", "Law", "Medicine", "Other"];
const WORK_EXP = ["Fresher (0 yrs)", "1 year", "2 years", "3 years", "4+ years"];

export default function RegisterPage() {
  const router = useRouter();
  const { login, isAuthenticated, plan, hasCompletedOnboarding } = useAuthStore();

  const [step, setStep] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
    stream: "", workExp: "", targetExams: [] as string[], targetYear: "", agreeTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated) {
      if (!plan) return router.push("/plan-selection");
      if (!hasCompletedOnboarding) return router.push("/onboarding");
      router.push("/dashboard");
    }
  }, [isAuthenticated, plan, hasCompletedOnboarding, router]);

  const setField = (key: string, value: string | boolean | string[]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleExam = (exam: string) =>
    setField("targetExams", form.targetExams.includes(exam)
      ? form.targetExams.filter((e) => e !== exam)
      : [...form.targetExams, exam]);

  function validateStep() {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!form.name.trim()) e.name = "Full name is required";
      if (!form.email.includes("@")) e.email = "Valid email required";
      if (form.phone && !/^\d{10}$/.test(form.phone)) e.phone = "10-digit number required";
      if (form.password.length < 8) e.password = "Minimum 8 characters";
      if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
      if (!form.agreeTerms) e.agreeTerms = "You must agree to continue";
    }
    if (step === 1) {
      if (!form.stream) e.stream = "Select your graduation stream";
    }
    if (step === 2) {
      if (form.targetExams.length === 0) e.targetExams = "Select at least one exam";
      if (!form.targetYear) e.targetYear = "Select your target year";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function next() {
    if (!validateStep()) return;
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      setSubmitting(true);
      await new Promise((r) => setTimeout(r, 1200));
      login(form.email, form.name, "user");
      setSuccess(true);
    }
  }

  const inputClass = (field: string) =>
    cn(
      "w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 transition-all text-sm",
      errors[field]
        ? "border-red-500/50 focus:ring-red-500/20"
        : "border-white/10 focus:ring-neon-blue/20 focus:border-neon-blue/40"
    );

  if (success) {
    return (
      <div className="min-h-screen bg-dark-900 animated-bg flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Account created!</h2>
          <p className="text-white/40 mb-6">Taking you to plan selection...</p>
          <div className="w-8 h-8 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin mx-auto" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 animated-bg flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-neon-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-neon-purple/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center glow-blue">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold neon-text">CATalyst AI</span>
          </Link>
          <p className="text-white/40 text-sm">Create your free account and start preparing</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all",
                i < step ? "bg-neon-blue border-neon-blue text-dark-900" :
                i === step ? "border-neon-blue text-neon-blue bg-neon-blue/10" :
                "border-white/15 text-white/25"
              )}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn("text-xs font-medium", i === step ? "text-white" : "text-white/30")}>{label}</span>
              {i < STEPS.length - 1 && <div className={cn("w-8 h-px", i < step ? "bg-neon-blue" : "bg-white/10")} />}
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-8 border border-white/8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4">Create Account</h2>

                  <button
                    onClick={async () => {
                      setSubmitting(true);
                      await new Promise((r) => setTimeout(r, 1000));
                      login("google.user@gmail.com", "Google User", "user");
                      setSuccess(true);
                    }}
                    className="w-full flex items-center justify-center gap-3 py-3 glass-strong border border-white/10 hover:border-white/20 rounded-xl text-white/70 hover:text-white text-sm font-medium transition-all"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-3 text-white/20 text-xs">
                    <div className="flex-1 h-px bg-white/10" />OR<div className="flex-1 h-px bg-white/10" />
                  </div>

                  <div>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <input className={cn(inputClass("name"), "pl-10")} placeholder="Full Name"
                        value={form.name} onChange={(e) => setField("name", e.target.value)} />
                    </div>
                    {errors.name && <p className="flex items-center gap-1 text-red-400 text-xs mt-1"><AlertCircle size={11}/>{errors.name}</p>}
                  </div>

                  <div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <input className={cn(inputClass("email"), "pl-10")} placeholder="Email Address" type="email"
                        value={form.email} onChange={(e) => setField("email", e.target.value)} />
                    </div>
                    {errors.email && <p className="flex items-center gap-1 text-red-400 text-xs mt-1"><AlertCircle size={11}/>{errors.email}</p>}
                  </div>

                  <div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <input className={cn(inputClass("phone"), "pl-10")} placeholder="Phone (optional)" type="tel"
                        value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
                    </div>
                    {errors.phone && <p className="flex items-center gap-1 text-red-400 text-xs mt-1"><AlertCircle size={11}/>{errors.phone}</p>}
                  </div>

                  <div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <input className={cn(inputClass("password"), "pl-10 pr-10")} placeholder="Password (min 8 chars)" type={showPass ? "text" : "password"}
                        value={form.password} onChange={(e) => setField("password", e.target.value)} />
                      <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="flex items-center gap-1 text-red-400 text-xs mt-1"><AlertCircle size={11}/>{errors.password}</p>}
                  </div>

                  <div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <input className={cn(inputClass("confirmPassword"), "pl-10 pr-10")} placeholder="Confirm Password" type={showConfirm ? "text" : "password"}
                        value={form.confirmPassword} onChange={(e) => setField("confirmPassword", e.target.value)} />
                      <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="flex items-center gap-1 text-red-400 text-xs mt-1"><AlertCircle size={11}/>{errors.confirmPassword}</p>}
                  </div>

                  <div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={form.agreeTerms} onChange={(e) => setField("agreeTerms", e.target.checked)} className="mt-1 accent-cyan-400" />
                      <span className="text-white/40 text-sm">
                        I agree to the <span className="text-neon-blue cursor-pointer hover:underline">Terms of Service</span> and <span className="text-neon-blue cursor-pointer hover:underline">Privacy Policy</span>
                      </span>
                    </label>
                    {errors.agreeTerms && <p className="flex items-center gap-1 text-red-400 text-xs mt-1"><AlertCircle size={11}/>{errors.agreeTerms}</p>}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-4">Your Profile</h2>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wider mb-3 block">Graduation Stream</label>
                    <div className="grid grid-cols-2 gap-2">
                      {GRADUATE_STREAMS.map((s) => (
                        <button key={s} onClick={() => setField("stream", s)}
                          className={cn(
                            "py-2.5 px-3 rounded-xl text-sm border transition-all",
                            form.stream === s
                              ? "bg-neon-blue/20 border-neon-blue/40 text-neon-blue"
                              : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
                          )}>
                          {s}
                        </button>
                      ))}
                    </div>
                    {errors.stream && <p className="flex items-center gap-1 text-red-400 text-xs mt-2"><AlertCircle size={11}/>{errors.stream}</p>}
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wider mb-3 block">Work Experience</label>
                    <div className="grid grid-cols-2 gap-2">
                      {WORK_EXP.map((w) => (
                        <button key={w} onClick={() => setField("workExp", w)}
                          className={cn(
                            "py-2.5 px-3 rounded-xl text-sm border transition-all",
                            form.workExp === w
                              ? "bg-neon-purple/20 border-neon-purple/40 text-neon-purple"
                              : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
                          )}>
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-4">Your Goals</h2>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wider mb-3 block">Target Exams</label>
                    <div className="grid grid-cols-3 gap-2">
                      {TARGET_EXAMS.map((exam) => (
                        <button key={exam} onClick={() => toggleExam(exam)}
                          className={cn(
                            "py-2.5 rounded-xl text-sm font-semibold border transition-all",
                            form.targetExams.includes(exam)
                              ? "bg-neon-blue/20 border-neon-blue/40 text-neon-blue"
                              : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                          )}>
                          {exam}
                        </button>
                      ))}
                    </div>
                    {errors.targetExams && <p className="flex items-center gap-1 text-red-400 text-xs mt-2"><AlertCircle size={11}/>{errors.targetExams}</p>}
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wider mb-3 block">Target Year</label>
                    <div className="flex gap-2">
                      {TARGET_YEARS.map((y) => (
                        <button key={y} onClick={() => setField("targetYear", y)}
                          className={cn(
                            "flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all",
                            form.targetYear === y
                              ? "bg-neon-purple/20 border-neon-purple/40 text-neon-purple"
                              : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                          )}>
                          {y}
                        </button>
                      ))}
                    </div>
                    {errors.targetYear && <p className="flex items-center gap-1 text-red-400 text-xs mt-2"><AlertCircle size={11}/>{errors.targetYear}</p>}
                  </div>

                  <div className="p-4 rounded-xl bg-neon-blue/5 border border-neon-blue/20 text-sm space-y-1.5">
                    <p className="text-white/60"><span className="text-white/30">Name:</span> {form.name}</p>
                    <p className="text-white/60"><span className="text-white/30">Email:</span> {form.email}</p>
                    <p className="text-white/60"><span className="text-white/30">Stream:</span> {form.stream || "—"}</p>
                    <p className="text-white/60"><span className="text-white/30">Exams:</span> {form.targetExams.join(", ") || "—"}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl glass border border-white/10 text-white/60 hover:text-white text-sm transition-all">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button
              onClick={next}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>{step === STEPS.length - 1 ? "Create Account" : "Continue"}<ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>

          {step === 0 && (
            <p className="text-center text-white/30 text-sm mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-neon-blue hover:text-neon-blue/80 font-medium">Sign in</Link>
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/20">
          <Shield size={12} />
          <span>Your data is encrypted and never sold</span>
        </div>
      </motion.div>
    </div>
  );
}
