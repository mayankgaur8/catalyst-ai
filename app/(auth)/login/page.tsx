"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Zap, Eye, EyeOff, Mail, Lock, ArrowRight, GitFork,
  AlertCircle, CheckCircle2, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, isAuthenticated, plan, hasCompletedOnboarding } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (!plan) return router.push("/plan-selection");
      if (!hasCompletedOnboarding) return router.push("/onboarding");
      router.push("/dashboard");
    }
  }, [isAuthenticated, plan, hasCompletedOnboarding, router]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.email.includes("@")) e.email = "Enter a valid email address";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    const name = form.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const role = form.email === "admin@catalyst.ai" ? "admin" : "user";
    login(form.email, name, role);
    setSuccess(true);
    await new Promise((r) => setTimeout(r, 600));
    // Redirect happens via useEffect
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    loginWithGoogle("Arjun Sharma", "arjun.sharma@gmail.com");
    setSuccess(true);
  }

  async function handleGithubLogin() {
    setGoogleLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    loginWithGoogle("Dev User", "dev@github.com");
    setSuccess(true);
  }

  return (
    <div className="min-h-screen bg-dark-900 animated-bg flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-80 h-80 bg-neon-blue/5 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-20 right-10 w-60 h-60 bg-neon-purple/8 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative">
          <Link href="/" className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center glow-blue">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold neon-text">CATalyst AI</span>
          </Link>

          <h2 className="text-5xl font-bold leading-tight text-white mb-6">
            Your MBA journey<br />
            <span className="neon-text">starts today.</span>
          </h2>
          <p className="text-white/50 text-lg leading-relaxed max-w-sm">
            Join 50,000+ aspirants using AI-powered preparation to crack CAT and secure their dream MBA.
          </p>
        </div>

        <div className="relative space-y-5">
          {[
            { stat: "99.8%", label: "Highest percentile achieved", icon: "🏆" },
            { stat: "50K+", label: "Active students on platform", icon: "👥" },
            { stat: "IIM A/B/C", label: "Top selections this year", icon: "🎓" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-4 glass px-4 py-3 rounded-xl border border-white/5"
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <div className="text-xl font-bold neon-text">{item.stat}</div>
                <div className="text-white/40 text-sm">{item.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold neon-text">CATalyst AI</span>
          </div>

          <div className="glass rounded-3xl p-8 border border-white/8">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-green-400" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Welcome back!</h2>
                  <p className="text-white/40 text-sm">Setting up your dashboard...</p>
                  <div className="mt-4 w-8 h-8 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin mx-auto" />
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="mb-8">
                    <h1 className="text-2xl font-bold">Welcome back</h1>
                    <p className="text-white/40 mt-1 text-sm">Sign in to continue your CAT preparation</p>
                  </div>

                  {/* Social Login */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={handleGoogleLogin}
                      disabled={googleLoading}
                      className="flex items-center justify-center gap-2 py-3 glass-strong rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 text-sm font-medium"
                    >
                      {googleLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      )}
                      Google
                    </button>
                    <button
                      onClick={handleGithubLogin}
                      disabled={googleLoading}
                      className="flex items-center justify-center gap-2 py-3 glass-strong rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 text-sm font-medium"
                    >
                      <GitFork size={16} />
                      GitHub
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-white/8" />
                    <span className="text-xs text-white/25">or with email</span>
                    <div className="flex-1 h-px bg-white/8" />
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="text-xs text-white/40 mb-2 block uppercase tracking-wider">Email</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="your@email.com"
                          className={cn(
                            "w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:bg-white/8 transition-all",
                            errors.email ? "border-red-500/50 focus:border-red-500/70" : "border-white/8 focus:border-neon-blue/40"
                          )}
                        />
                      </div>
                      {errors.email && (
                        <p className="flex items-center gap-1 text-red-400 text-xs mt-1">
                          <AlertCircle size={11} /> {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs text-white/40 mb-2 block uppercase tracking-wider">Password</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          placeholder="Enter password"
                          className={cn(
                            "w-full pl-10 pr-10 py-3 bg-white/5 border rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none transition-all",
                            errors.password ? "border-red-500/50 focus:border-red-500/70" : "border-white/8 focus:border-neon-blue/40"
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="flex items-center gap-1 text-red-400 text-xs mt-1">
                          <AlertCircle size={11} /> {errors.password}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button type="button" className="text-xs text-neon-blue hover:text-neon-blue/80">
                        Forgot password?
                      </button>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
                        "bg-gradient-to-r from-neon-blue to-neon-purple text-white glow-blue",
                        "hover:opacity-90",
                        loading && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Sign In <ArrowRight size={16} /></>
                      )}
                    </motion.button>
                  </form>

                  <p className="text-center text-sm text-white/30 mt-6">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-neon-blue hover:text-neon-blue/80 font-medium">
                      Start for free
                    </Link>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/20">
            <Shield size={12} />
            <span>Demo: any email/password works • admin@catalyst.ai for admin access</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
