"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Users, BookOpen, BarChart3, TrendingUp, Shield,
  Search, Plus, Edit2, Trash2, Eye, CheckCircle, XCircle,
  AlertTriangle, Download, Star, Zap,
  ToggleLeft, ToggleRight, Grid3X3, Activity,
  ArrowLeft, ChevronRight, Lock
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { PLAN_FEATURES, canAccess } from "@/lib/features";
import type { Plan, Feature } from "@/lib/features";

// ── Mock data ─────────────────────────────────────────────────────────────────

const STATS = [
  { label: "Total Users",    value: "12,480", change: "+8.4%",  up: true,  icon: Users,         color: "blue" },
  { label: "Active Today",   value: "3,217",  change: "+12.1%", up: true,  icon: TrendingUp,    color: "purple" },
  { label: "Questions",      value: "8,640",  change: "+2.3%",  up: true,  icon: BookOpen,      color: "green" },
  { label: "Flagged Issues", value: "14",     change: "-3",     up: false, icon: AlertTriangle, color: "red" },
];

const SIGNUP_DATA = [
  { day: "Mon", users: 142 }, { day: "Tue", users: 218 }, { day: "Wed", users: 196 },
  { day: "Thu", users: 310 }, { day: "Fri", users: 284 }, { day: "Sat", users: 402 }, { day: "Sun", users: 337 },
];

const PLAN_DATA = [
  { name: "Free",  value: 7420, color: "#6b7280" },
  { name: "Pro",   value: 3890, color: "#3b82f6" },
  { name: "Elite", value: 1170, color: "#a855f7" },
];

const SECTION_DATA = [
  { section: "QA",   attempts: 48200, avg: 68 },
  { section: "VARC", attempts: 43100, avg: 72 },
  { section: "DILR", attempts: 39800, avg: 61 },
];

const MOCK_USERS = [
  { id: 1, name: "Arjun Sharma",  email: "arjun@example.com",  plan: "Pro",   joined: "2025-01-12", status: "active",   score: 94 },
  { id: 2, name: "Priya Mehta",   email: "priya@example.com",  plan: "Elite", joined: "2025-02-03", status: "active",   score: 98 },
  { id: 3, name: "Rahul Gupta",   email: "rahul@example.com",  plan: "Free",  joined: "2025-03-18", status: "inactive", score: 72 },
  { id: 4, name: "Sneha Joshi",   email: "sneha@example.com",  plan: "Pro",   joined: "2025-04-01", status: "active",   score: 89 },
  { id: 5, name: "Karthik R.",    email: "karthik@example.com",plan: "Free",  joined: "2025-04-22", status: "banned",   score: 55 },
  { id: 6, name: "Divya Nair",    email: "divya@example.com",  plan: "Elite", joined: "2025-05-07", status: "active",   score: 96 },
];

const MOCK_QUESTIONS = [
  { id: 101, text: "If x² - 5x + 6 = 0, find the roots.",                          section: "QA",   difficulty: "Easy",   status: "active",  reports: 0 },
  { id: 102, text: "Choose the correct antonym of 'Ephemeral'.",                    section: "VARC", difficulty: "Medium", status: "active",  reports: 2 },
  { id: 103, text: "In a group of 5, how many ways can 2 be selected?",             section: "DILR", difficulty: "Easy",   status: "flagged", reports: 5 },
  { id: 104, text: "A train covers 360 km at 72 km/h. Find the time.",             section: "QA",   difficulty: "Easy",   status: "active",  reports: 0 },
  { id: 105, text: "Passage: The Rise of Renewable Energy — Q1",                    section: "VARC", difficulty: "Hard",   status: "active",  reports: 1 },
];

const ALL_FEATURES: Feature[] = [
  "DASHBOARD", "PRACTICE_BASIC", "MOCK_BASIC", "DAILY_STREAK", "LEADERBOARD_VIEW",
  "PRACTICE_UNLIMITED", "MOCK_UNLIMITED", "AI_DOUBT_SOLVER", "STUDY_PLANNER",
  "VIDEO_LIBRARY", "GD_PI_PREP", "COLLEGE_PREDICTOR", "PERCENTILE_PREDICTOR",
  "ANALYTICS_DEEP", "ADAPTIVE_PLAN", "LEADERBOARD_COMPETE",
  "AI_MENTOR", "VOICE_TUTOR", "MOCK_INTERVIEW", "LIVE_SESSIONS",
  "SOP_BUILDER", "PERSONAL_COACH", "MBA_PREDICTOR", "DAILY_ROADMAP",
];

const FEATURE_LABELS: Record<Feature, string> = {
  DASHBOARD:           "Dashboard",
  PRACTICE_BASIC:      "Practice (Basic)",
  MOCK_BASIC:          "Mock Tests (Basic)",
  DAILY_STREAK:        "Daily Streak",
  LEADERBOARD_VIEW:    "Leaderboard View",
  PRACTICE_UNLIMITED:  "Unlimited Practice",
  MOCK_UNLIMITED:      "Unlimited Mocks",
  AI_DOUBT_SOLVER:     "AI Doubt Solver",
  STUDY_PLANNER:       "Study Planner",
  VIDEO_LIBRARY:       "Video Library",
  GD_PI_PREP:          "GD/PI Prep",
  COLLEGE_PREDICTOR:   "College Predictor",
  PERCENTILE_PREDICTOR:"Percentile Predictor",
  ANALYTICS_DEEP:      "Deep Analytics",
  ADAPTIVE_PLAN:       "Adaptive Plan",
  LEADERBOARD_COMPETE: "Leaderboard Compete",
  AI_MENTOR:           "AI Mentor",
  VOICE_TUTOR:         "Voice Tutor",
  MOCK_INTERVIEW:      "Mock Interview",
  LIVE_SESSIONS:       "Live Sessions",
  SOP_BUILDER:         "SOP Builder",
  PERSONAL_COACH:      "Personal Coach",
  MBA_PREDICTOR:       "MBA Predictor",
  DAILY_ROADMAP:       "Daily Roadmap",
};

// ── Styling maps ──────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  blue:   "text-blue-400 bg-blue-500/10 border-blue-500/20",
  purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  green:  "text-green-400 bg-green-500/10 border-green-500/20",
  red:    "text-red-400 bg-red-500/10 border-red-500/20",
};

const PLAN_BADGE: Record<string, string> = {
  Free:  "bg-gray-500/20 text-gray-400",
  Pro:   "bg-blue-500/20 text-blue-300",
  Elite: "bg-purple-500/20 text-purple-300",
};

const STATUS_BADGE: Record<string, string> = {
  active:   "bg-green-500/20 text-green-400",
  inactive: "bg-yellow-500/20 text-yellow-400",
  banned:   "bg-red-500/20 text-red-400",
  flagged:  "bg-red-500/20 text-red-400",
};

const DIFF_BADGE: Record<string, string> = {
  Easy:   "bg-green-500/20 text-green-400",
  Medium: "bg-yellow-500/20 text-yellow-400",
  Hard:   "bg-red-500/20 text-red-400",
};

const PLAN_COLORS: Record<Plan, { bg: string; text: string; border: string; label: string }> = {
  free:  { bg: "bg-gray-500/10",   text: "text-gray-300",    border: "border-gray-500/30",   label: "Free" },
  pro:   { bg: "bg-blue-500/10",   text: "text-blue-300",    border: "border-blue-500/30",   label: "Pro" },
  elite: { bg: "bg-purple-500/10", text: "text-purple-300",  border: "border-purple-500/30", label: "Elite" },
};

const PLANS: Plan[] = ["free", "pro", "elite"];

// ── Default feature flags (can be toggled by admin) ───────────────────────────

const DEFAULT_FLAGS: Record<string, { label: string; enabled: boolean; desc: string }> = {
  ai_doubt_solver:     { label: "AI Doubt Solver",      enabled: true,  desc: "GPT-powered question solver" },
  sound_effects:       { label: "Sound Effects",         enabled: true,  desc: "Audio feedback in practice" },
  leaderboard:         { label: "Leaderboard",           enabled: true,  desc: "Global ranking board" },
  voice_tutor:         { label: "Voice Tutor",           enabled: false, desc: "AI speech-based tutoring" },
  whatsapp_notifs:     { label: "WhatsApp Notifications",enabled: false, desc: "Reminder via WhatsApp" },
  mock_ai_analysis:    { label: "Mock AI Analysis",      enabled: true,  desc: "Post-mock AI feedback" },
  college_predictor:   { label: "College Predictor",     enabled: true,  desc: "Admission chance calculator" },
  beta_features:       { label: "Beta Features",         enabled: false, desc: "Experimental feature access" },
};

const NAV_TABS = [
  { id: "overview",   label: "Overview",      icon: BarChart3 },
  { id: "simulator",  label: "Plan Simulator",icon: Zap },
  { id: "matrix",     label: "Feature Matrix",icon: Grid3X3 },
  { id: "flags",      label: "Feature Flags", icon: ToggleRight },
  { id: "users",      label: "Users",         icon: Users },
  { id: "questions",  label: "Questions",     icon: BookOpen },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState("overview");
  const [userSearch, setUserSearch] = useState("");
  const [qSearch, setQSearch] = useState("");
  const [qSection, setQSection] = useState("All");
  const [flags, setFlags] = useState(DEFAULT_FLAGS);

  const { isAdmin, previewPlan, setPreviewPlan, user } = useAuthStore();

  const filteredUsers = MOCK_USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredQ = MOCK_QUESTIONS.filter(
    (q) =>
      (qSection === "All" || q.section === qSection) &&
      q.text.toLowerCase().includes(qSearch.toLowerCase())
  );

  function toggleFlag(key: string) {
    setFlags((f) => ({ ...f, [key]: { ...f[key], enabled: !f[key].enabled } }));
  }

  // Auth guard — redirect note (in real app, use middleware)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-6 p-6">
        <Lock size={48} className="text-red-400" />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">Admin access is restricted. Please log in with an admin account.</p>
          <Link href="/dashboard">
            <button className="px-6 py-2.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-xl hover:bg-blue-500/30 transition-all flex items-center gap-2 mx-auto">
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <div className="border-b border-white/10 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-30 px-4 lg:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white leading-none">Admin Panel</h1>
            <p className="text-xs text-gray-500">Logged in as {user?.name ?? "Admin"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-sm hover:text-white transition-all">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </button>
          </Link>
          <button className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-sm hover:text-white transition-all">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
        {/* Tabs — scrollable on mobile */}
        <div className="flex gap-1 mb-8 bg-white/5 border border-white/10 rounded-xl p-1 overflow-x-auto">
          {NAV_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all whitespace-nowrap",
                tab === t.id
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <t.icon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STATS.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className={cn("bg-white/5 border rounded-2xl p-4 lg:p-5", COLOR_MAP[s.color].split(" ").slice(2).join(" "))}>
                    <div className={cn("w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center mb-3 border", COLOR_MAP[s.color])}>
                      <s.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                    </div>
                    <p className="text-xl lg:text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-gray-400 text-xs lg:text-sm">{s.label}</p>
                    <p className={cn("text-xs mt-1 font-medium", s.up ? "text-green-400" : "text-red-400")}>{s.change}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 lg:p-6">
                  <h3 className="font-semibold text-white mb-4">New Signups — Last 7 Days</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={SIGNUP_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
                      <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 lg:p-6">
                  <h3 className="font-semibold text-white mb-4">Plan Distribution</h3>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={PLAN_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                        {PLAN_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {PLAN_DATA.map((p) => (
                      <div key={p.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                          <span className="text-gray-400">{p.name}</span>
                        </div>
                        <span className="text-white font-medium">{p.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 lg:p-6">
                <h3 className="font-semibold text-white mb-4">Section Performance (Avg Score %)</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={SECTION_DATA} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="section" tick={{ fill: "#6b7280", fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                    <Bar dataKey="avg" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* ── PLAN SIMULATOR ── */}
          {tab === "simulator" && (
            <motion.div key="simulator" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Plan Simulator</h2>
                <p className="text-gray-400 text-sm">
                  Preview the dashboard as any plan to test feature visibility, locked states, and upgrade flows.
                  Changes are admin-only and don&apos;t affect your subscription.
                </p>
              </div>

              {/* Current preview status */}
              <div className={cn(
                "flex items-center justify-between px-5 py-4 rounded-2xl border",
                previewPlan ? "bg-yellow-500/10 border-yellow-500/30" : "bg-white/5 border-white/10"
              )}>
                <div className="flex items-center gap-3">
                  <Activity size={18} className={previewPlan ? "text-yellow-400" : "text-gray-400"} />
                  <div>
                    <p className="font-semibold text-sm text-white">
                      {previewPlan ? `Previewing: ${previewPlan.toUpperCase()} plan` : "No preview active — using your real plan (Elite)"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {previewPlan ? "The dashboard shows features as seen by a " + previewPlan + " user." : "Select a plan below to start testing."}
                    </p>
                  </div>
                </div>
                {previewPlan && (
                  <button
                    onClick={() => setPreviewPlan(null)}
                    className="px-4 py-2 rounded-xl bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 text-sm font-medium hover:bg-yellow-400/30 transition-all"
                  >
                    Exit Preview
                  </button>
                )}
              </div>

              {/* Plan cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                {PLANS.map((p) => {
                  const cfg = PLAN_COLORS[p];
                  const isActive = previewPlan === p;
                  const featureCount = PLAN_FEATURES[p]?.size ?? 0;
                  return (
                    <motion.div
                      key={p}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPreviewPlan(isActive ? null : p)}
                      className={cn(
                        "cursor-pointer rounded-2xl p-5 border transition-all",
                        cfg.bg, cfg.border,
                        isActive && "ring-2 ring-offset-2 ring-offset-gray-950 ring-blue-500/50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className={cn("text-lg font-black uppercase tracking-wider", cfg.text)}>
                          {p === "elite" && "👑 "}{cfg.label}
                        </span>
                        {isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Active
                          </span>
                        )}
                      </div>

                      <p className={cn("text-3xl font-bold mb-1", cfg.text)}>{featureCount}</p>
                      <p className="text-gray-400 text-sm mb-4">features unlocked</p>

                      <div className="space-y-1.5">
                        {ALL_FEATURES.slice(0, 4).map((f) => {
                          const has = PLAN_FEATURES[p]?.has(f);
                          return (
                            <div key={f} className="flex items-center gap-2 text-xs">
                              {has
                                ? <CheckCircle size={12} className="text-green-400 flex-shrink-0" />
                                : <XCircle size={12} className="text-gray-600 flex-shrink-0" />}
                              <span className={has ? "text-gray-300" : "text-gray-600"}>{FEATURE_LABELS[f]}</span>
                            </div>
                          );
                        })}
                        <p className="text-xs text-gray-500 mt-2">+{featureCount - 4} more features</p>
                      </div>

                      <button className={cn(
                        "mt-4 w-full py-2 rounded-xl text-sm font-semibold transition-all border",
                        isActive
                          ? "bg-blue-500/30 border-blue-500/50 text-blue-200"
                          : cn(cfg.bg, cfg.border, cfg.text, "hover:opacity-80")
                      )}>
                        {isActive ? "✓ Currently Previewing" : `Preview as ${cfg.label}`}
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Quick test links */}
              {previewPlan && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5"
                >
                  <h3 className="font-semibold text-white mb-3 text-sm">Quick Test Links</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {[
                      { label: "Dashboard",       href: "/dashboard" },
                      { label: "Practice",        href: "/practice" },
                      { label: "Mock Tests",      href: "/mock-tests" },
                      { label: "AI Doubt Solver", href: "/ai-doubt-solver" },
                      { label: "College Predict.", href: "/college-predictor" },
                      { label: "Study Planner",   href: "/study-planner" },
                      { label: "Leaderboard",     href: "/leaderboard" },
                      { label: "Profile",         href: "/profile" },
                    ].map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-300 hover:text-white hover:border-white/20 transition-all group"
                      >
                        {link.label}
                        <ChevronRight size={12} className="text-gray-600 group-hover:text-white" />
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── FEATURE MATRIX ── */}
          {tab === "matrix" && (
            <motion.div key="matrix" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Feature Access Matrix</h2>
                <p className="text-gray-400 text-sm">Which features each plan can access.</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-5 py-3.5 text-gray-400 font-medium w-56">Feature</th>
                      {PLANS.map((p) => (
                        <th key={p} className={cn("px-5 py-3.5 font-bold text-center uppercase text-xs tracking-wider", PLAN_COLORS[p].text)}>
                          {p === "elite" ? "👑 " : ""}{p}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ALL_FEATURES.map((feature, i) => (
                      <tr key={feature} className={cn("border-b border-white/5 hover:bg-white/3", i % 2 === 0 ? "bg-white/[0.01]" : "")}>
                        <td className="px-5 py-3 text-gray-300 font-medium">{FEATURE_LABELS[feature]}</td>
                        {PLANS.map((p) => {
                          const has = canAccess(p, feature);
                          return (
                            <td key={p} className="px-5 py-3 text-center">
                              {has
                                ? <CheckCircle size={16} className="text-green-400 mx-auto" />
                                : <XCircle size={16} className="text-gray-700 mx-auto" />}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ── FEATURE FLAGS ── */}
          {tab === "flags" && (
            <motion.div key="flags" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Feature Flags</h2>
                <p className="text-gray-400 text-sm">Enable or disable platform features globally. Changes are local to this session.</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden">
                {Object.entries(flags).map(([key, flag]) => (
                  <div key={key} className="flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-all">
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-white">{flag.label}</p>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-bold border",
                          flag.enabled
                            ? "bg-green-500/15 text-green-400 border-green-500/30"
                            : "bg-gray-500/15 text-gray-500 border-gray-500/20"
                        )}>
                          {flag.enabled ? "ON" : "OFF"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{flag.desc}</p>
                    </div>
                    <button
                      onClick={() => toggleFlag(key)}
                      className="flex-shrink-0"
                      aria-label={`Toggle ${flag.label}`}
                    >
                      {flag.enabled
                        ? <ToggleRight size={32} className="text-green-400 hover:text-green-300 transition-colors" />
                        : <ToggleLeft  size={32} className="text-gray-600 hover:text-gray-400 transition-colors" />}
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-5 py-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-300">
                    Feature flags in this demo are session-local. In production, these would be persisted server-side and take effect for all users.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── USERS ── */}
          {tab === "users" && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">User Management</h2>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm hover:bg-blue-500/30 transition-all">
                  <Plus className="w-4 h-4" /> Add User
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400">
                      <th className="text-left px-5 py-3">User</th>
                      <th className="text-left px-5 py-3">Plan</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-left px-5 py-3">Score</th>
                      <th className="text-left px-5 py-3">Joined</th>
                      <th className="text-left px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {u.name[0]}
                            </div>
                            <div>
                              <p className="text-white font-medium">{u.name}</p>
                              <p className="text-gray-500 text-xs">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", PLAN_BADGE[u.plan])}>{u.plan}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", STATUS_BADGE[u.status])}>{u.status}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${u.score}%` }} />
                            </div>
                            <span className="text-gray-300">{u.score}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-400">{u.joined}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1">
                            <button className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-blue-400 transition-all"><Eye className="w-3.5 h-3.5" /></button>
                            <button className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-yellow-400 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No users found.</p>
                )}
              </div>
            </motion.div>
          )}

          {/* ── QUESTIONS ── */}
          {tab === "questions" && (
            <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Question Bank</h2>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm hover:bg-blue-500/30 transition-all">
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    value={qSearch}
                    onChange={(e) => setQSearch(e.target.value)}
                    placeholder="Search questions..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                  {["All", "QA", "VARC", "DILR"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setQSection(s)}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        qSection === s ? "bg-blue-500/20 text-blue-300" : "text-gray-400 hover:text-white"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {filteredQ.map((q) => (
                  <div key={q.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.07] transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-gray-500 text-xs">#{q.id}</span>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", DIFF_BADGE[q.difficulty])}>{q.difficulty}</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs">{q.section}</span>
                        {q.status === "flagged" && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs">
                            <AlertTriangle className="w-3 h-3" /> Flagged ({q.reports})
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm truncate">{q.text}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {q.reports > 0 && (
                        <span className="flex items-center gap-1 text-xs text-yellow-400 mr-2">
                          <Star className="w-3 h-3" /> {q.reports}
                        </span>
                      )}
                      <button className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-green-400 transition-all"><CheckCircle className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-yellow-400 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 transition-all"><XCircle className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
                {filteredQ.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No questions found.</p>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
