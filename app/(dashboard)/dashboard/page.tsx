"use client";

import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";
import {
  Flame, Trophy, Target, Brain, TrendingUp, BookOpen,
  Calendar, Clock, Star, Award, ChevronRight, Play, ArrowUp,
  CheckCircle, AlertCircle, Sparkles, GraduationCap, Lock,
  Mic, Users, Video, Crown, BarChart2
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { canAccess } from "@/lib/features";
import { getRandomQuote, cn } from "@/lib/utils";
import { TOPICS } from "@/lib/data";
import Link from "next/link";
import { UpgradeBanner } from "@/components/ui/UpgradeBanner";

const mockPerformanceData = [
  { day: "Mon", percentile: 78, accuracy: 65 },
  { day: "Tue", percentile: 82, accuracy: 70 },
  { day: "Wed", percentile: 79, accuracy: 68 },
  { day: "Thu", percentile: 85, accuracy: 73 },
  { day: "Fri", percentile: 88, accuracy: 76 },
  { day: "Sat", percentile: 91, accuracy: 80 },
  { day: "Sun", percentile: 89, accuracy: 78 },
];

const radarData = [
  { subject: "QA", score: 72 },
  { subject: "VARC", score: 65 },
  { subject: "DILR", score: 55 },
  { subject: "Speed", score: 80 },
  { subject: "Accuracy", score: 70 },
  { subject: "Stamina", score: 60 },
];

const quote = getRandomQuote();

function StatCard({ label, value, sub, icon: Icon, color, trend, locked }: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; color: string; trend?: number; locked?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("glass rounded-2xl p-5 card-hover border border-white/5 relative", locked && "overflow-hidden")}
    >
      {locked && (
        <div className="absolute inset-0 bg-dark-800/70 backdrop-blur-sm flex flex-col items-center justify-center gap-1 z-10 rounded-2xl">
          <Lock size={18} className="text-white/30" />
          <span className="text-xs text-white/30">Pro feature</span>
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-2.5 rounded-xl", color)}>
          <Icon size={20} className="text-white" />
        </div>
        {trend !== undefined && (
          <div className={cn("flex items-center gap-1 text-xs font-medium", trend >= 0 ? "text-green-400" : "text-red-400")}>
            <ArrowUp size={12} className={trend < 0 ? "rotate-180" : ""} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-3xl font-bold mb-1 neon-text">{value}</div>
      <div className="text-sm font-medium text-white/70">{label}</div>
      <div className="text-xs text-white/30 mt-0.5">{sub}</div>
    </motion.div>
  );
}

function LockedCard({ title, desc, icon: Icon, plan }: { title: string; desc: string; icon: React.ElementType; plan: string }) {
  return (
    <div className="glass rounded-2xl p-5 border border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-dark-800/50 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/5">
        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <Lock size={18} className="text-white/30" />
        </div>
        <div className="text-center px-4">
          <p className="text-sm font-semibold text-white/50">{title}</p>
          <p className="text-xs text-white/30 mt-1">{desc}</p>
          <Link href="/plan-selection">
            <button className="mt-3 px-4 py-1.5 text-xs font-semibold bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg text-white hover:opacity-90 transition-all">
              Upgrade to {plan}
            </button>
          </Link>
        </div>
      </div>
      <div className="opacity-10 pointer-events-none">
        <div className="flex items-center gap-2 mb-4">
          <Icon size={18} />
          <h3 className="font-semibold">{title}</h3>
        </div>
        <div className="h-24 bg-white/5 rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, plan, onboardingData } = useAuthStore();

  const activePlan = plan ?? "free";
  const targetPercentile = onboardingData?.targetPercentile ?? 95;

  const canAccessDeepAnalytics = canAccess(activePlan, "ANALYTICS_DEEP");
  const canAccessAIMentor = canAccess(activePlan, "AI_MENTOR");
  const canAccessVoiceTutor = canAccess(activePlan, "VOICE_TUTOR");
  const canAccessMockInterview = canAccess(activePlan, "MOCK_INTERVIEW");
  const canAccessLiveSessions = canAccess(activePlan, "LIVE_SESSIONS");
  const canAccessMBAPredictor = canAccess(activePlan, "MBA_PREDICTOR");
  const canAccessDailyRoadmap = canAccess(activePlan, "DAILY_ROADMAP");

  const dailyTasks = [
    { task: "Complete 20 QA questions", done: true, xp: 50 },
    { task: "Read 2 RC passages", done: true, xp: 40 },
    { task: "10 DILR puzzle sets", done: false, xp: 60 },
    { task: "Vocabulary — 15 words", done: false, xp: 20 },
    { task: activePlan !== "free" ? "Full Mock Test (AI-scored)" : "Sectional Mock (QA)", done: false, xp: 100 },
  ];

  const weakAreas = onboardingData?.weaknesses?.slice(0, 4).map((w, i) => ({
    topic: w,
    score: [45, 40, 52, 35][i] ?? 50,
    section: ["QA", "DILR", "VARC", "QA"][i] ?? "QA",
  })) ?? [
    { topic: "Geometry", score: 45, section: "QA" },
    { topic: "Games & Tournaments", score: 40, section: "DILR" },
    { topic: "Para Jumbles", score: 52, section: "VARC" },
  ];

  const daysToCAT = Math.ceil((new Date("2025-11-23").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const firstName = user?.name?.split(" ")[0] ?? "there";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Upgrade Banner for free/pro users */}
      {activePlan !== "elite" && (
        <UpgradeBanner currentPlan={activePlan} variant="banner" />
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}, <span className="neon-text">{firstName}</span> 👋
          </h1>
          <p className="text-white/40 mt-1 text-sm">
            {daysToCAT > 0
              ? `${daysToCAT} days to CAT 2025 — targeting ${targetPercentile}+ percentile`
              : "CAT 2025 is here — give it your best!"}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="glass px-4 py-2 rounded-xl border border-white/5 text-center">
            <div className="text-2xl font-bold text-orange-400 flex items-center gap-1">
              <Flame size={20} /> {user?.streak ?? 0}
            </div>
            <div className="text-xs text-white/30">Day Streak</div>
          </div>
          <div className="glass px-4 py-2 rounded-xl border border-white/5 text-center">
            <div className="text-2xl font-bold text-yellow-400">{(user?.xp ?? 0).toLocaleString()}</div>
            <div className="text-xs text-white/30">Total XP</div>
          </div>
        </div>
      </motion.div>

      {/* AI Motivation Quote */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl p-6 border border-neon-blue/20"
        style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(177,74,237,0.08) 100%)" }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-neon-blue" />
            <span className="text-xs font-semibold text-neon-blue uppercase tracking-wider">AI Motivation</span>
          </div>
          <p className="text-lg font-medium text-white/90 italic">&quot;{quote.quote}&quot;</p>
          <p className="text-sm text-white/40 mt-2">— {quote.author}</p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Predicted Percentile" value="89.2" sub="↑ from 85.6 last week"
          icon={TrendingUp} color="bg-gradient-to-br from-neon-blue/30 to-neon-purple/20" trend={4.2} />
        <StatCard label="Overall Accuracy" value="76%" sub="Target: 85%"
          icon={Target} color="bg-gradient-to-br from-green-500/30 to-teal-500/20" trend={3} />
        <StatCard label="Questions Solved" value="2,841" sub="This month: 340"
          icon={BookOpen} color="bg-gradient-to-br from-orange-500/30 to-yellow-500/20" trend={12} />
        <StatCard label="Mocks Taken" value={activePlan === "free" ? "2/2" : "11"}
          sub={activePlan === "free" ? "Free limit reached" : "Best: 91.2 percentile"}
          icon={Award} color="bg-gradient-to-br from-neon-purple/30 to-pink-500/20"
          locked={activePlan === "free" && false} />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Performance Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass rounded-2xl p-5 border border-white/5 relative"
        >
          {!canAccessDeepAnalytics && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 glass rounded-2xl">
              <Lock size={24} className="text-white/30" />
              <div className="text-center">
                <p className="font-semibold text-sm text-white/60">Deep Analytics</p>
                <p className="text-xs text-white/35 mt-1">Unlock detailed trend analysis</p>
              </div>
              <Link href="/plan-selection">
                <button className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl text-white hover:opacity-90 transition-all">
                  Upgrade to Pro
                </button>
              </Link>
            </div>
          )}
          <div className={cn(!canAccessDeepAnalytics && "opacity-15 pointer-events-none")}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Percentile Trend</h3>
                <p className="text-xs text-white/30 mt-0.5">Last 7 days performance</p>
              </div>
              <div className="flex gap-2">
                {["Week", "Month", "All"].map((t) => (
                  <button key={t} className={cn("text-xs px-3 py-1 rounded-lg",
                    t === "Week" ? "bg-neon-blue/20 text-neon-blue" : "text-white/30 hover:text-white")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={mockPerformanceData}>
                <defs>
                  <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b14aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#b14aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.4)" }} />
                <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.4)" }} />
                <Tooltip contentStyle={{ background: "#0f0f2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} labelStyle={{ color: "rgba(255,255,255,0.7)" }} />
                <Area type="monotone" dataKey="percentile" stroke="#00d4ff" strokeWidth={2} fill="url(#pGrad)" name="Percentile" />
                <Area type="monotone" dataKey="accuracy" stroke="#b14aed" strokeWidth={2} fill="url(#aGrad)" name="Accuracy %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Skill Radar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5 border border-white/5"
        >
          <h3 className="font-semibold mb-1">Skill Profile</h3>
          <p className="text-xs text-white/30 mb-4">Your strength map</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }} />
              <Radar name="Score" dataKey="score" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Middle Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Daily Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5 border border-white/5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-neon-blue" />
              <h3 className="font-semibold">Today&apos;s Plan</h3>
            </div>
            <span className="text-xs text-white/30">{dailyTasks.filter((t) => t.done).length}/{dailyTasks.length} done</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full mb-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(dailyTasks.filter((t) => t.done).length / dailyTasks.length) * 100}%` }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="h-full bg-gradient-to-r from-neon-blue to-neon-purple rounded-full"
            />
          </div>
          {dailyTasks.map((task, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
              <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                task.done ? "border-green-400 bg-green-400/20" : "border-white/20")}>
                {task.done && <CheckCircle size={12} className="text-green-400" />}
              </div>
              <span className={cn("flex-1 text-sm", task.done ? "line-through text-white/30" : "text-white/80")}>{task.task}</span>
              <span className="text-xs text-yellow-400 font-medium">+{task.xp} XP</span>
            </div>
          ))}
          <button className="mt-4 w-full py-2 text-sm font-medium bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue rounded-xl border border-neon-blue/20 transition-all">
            View Full Study Plan
          </button>
        </motion.div>

        {/* Weak Areas AI Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass rounded-2xl p-5 border border-white/5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Brain size={18} className="text-neon-purple" />
            <h3 className="font-semibold">AI Weak Area Alert</h3>
          </div>
          <div className="space-y-3">
            {weakAreas.map((area, i) => (
              <div key={i} className="flex items-center gap-3">
                <AlertCircle size={16} className="text-orange-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{area.topic}</span>
                    <span className="text-white/40 text-xs">{area.section}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${area.score}%`, background: area.score < 50 ? "#ef4444" : "#f59e0b" }} />
                  </div>
                  <div className="text-xs text-white/30 mt-0.5">{area.score}% mastery</div>
                </div>
              </div>
            ))}
          </div>
          <Link href="/practice">
            <button className="mt-4 w-full py-2 text-sm font-medium bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/20 transition-all">
              Practice Weak Topics →
            </button>
          </Link>
        </motion.div>

        {/* Upcoming Mocks / AI Mentor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-5 border border-white/5"
        >
          {activePlan !== "free" ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={18} className="text-yellow-400" />
                <h3 className="font-semibold">Upcoming Mocks</h3>
              </div>
              {[
                { name: "Full CAT Mock #12", date: "Tomorrow", duration: "120 min" },
                { name: "DILR Sectional", date: "In 2 days", duration: "40 min" },
                { name: "QA Speed Challenge", date: "In 3 days", duration: "30 min" },
              ].map((test, i) => (
                <div key={i} className={cn("p-3 rounded-xl border transition-all cursor-pointer mb-2",
                  i === 0 ? "bg-neon-blue/10 border-neon-blue/20" : "bg-white/3 border-white/5 hover:bg-white/5")}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium">{test.name}</span>
                    {i === 0 && <span className="text-xs bg-neon-blue/20 text-neon-blue px-2 py-0.5 rounded-full">Next</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    <span>{test.date}</span><span>•</span><Clock size={10} /><span>{test.duration}</span>
                  </div>
                </div>
              ))}
              <Link href="/mock-tests">
                <button className="mt-2 w-full py-2 text-sm font-medium flex items-center justify-center gap-2 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 rounded-xl border border-yellow-400/20 transition-all">
                  <Play size={14} /> Start Mock Test
                </button>
              </Link>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={18} className="text-yellow-400" />
                <h3 className="font-semibold">Mock Tests</h3>
              </div>
              <div className="p-4 rounded-xl bg-neon-blue/5 border border-neon-blue/15 mb-3">
                <p className="text-sm font-semibold text-neon-blue mb-1">Free Plan: 2 mocks/month</p>
                <p className="text-xs text-white/40">You&apos;ve used 1 of 2 monthly mocks</p>
                <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-neon-blue rounded-full" />
                </div>
              </div>
              <Link href="/mock-tests">
                <button className="w-full py-2 text-sm font-medium flex items-center justify-center gap-2 bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue rounded-xl border border-neon-blue/20 transition-all">
                  <Play size={14} /> Take Mock Test
                </button>
              </Link>
              <Link href="/plan-selection">
                <button className="mt-2 w-full py-2 text-sm font-medium bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-xl hover:opacity-90 transition-all">
                  Upgrade for Unlimited Mocks →
                </button>
              </Link>
            </>
          )}
        </motion.div>
      </div>

      {/* Elite Features Row */}
      {(canAccessAIMentor || canAccessMockInterview) && (
        <div className="grid lg:grid-cols-3 gap-6">
          {canAccessAIMentor && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-5 border border-neon-purple/20"
              style={{ background: "rgba(177,74,237,0.04)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Brain size={18} className="text-neon-purple" />
                <h3 className="font-semibold">AI Mentor</h3>
                <span className="text-xs bg-neon-purple/20 text-neon-purple px-2 py-0.5 rounded-full border border-neon-purple/20">Elite</span>
              </div>
              <p className="text-sm text-white/50 mb-4">Your personal AI mentor is ready. Ask any question, get step-by-step guidance.</p>
              <Link href="/ai-doubt-solver">
                <button className="w-full py-2.5 text-sm font-semibold bg-gradient-to-r from-neon-purple to-pink-600 text-white rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  <Brain size={14} /> Open AI Mentor
                </button>
              </Link>
            </motion.div>
          )}

          {canAccessVoiceTutor && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass rounded-2xl p-5 border border-yellow-400/20"
              style={{ background: "rgba(250,204,21,0.03)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Mic size={18} className="text-yellow-400" />
                <h3 className="font-semibold">AI Voice Tutor</h3>
                <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-400/20">Elite</span>
              </div>
              <p className="text-sm text-white/50 mb-4">Learn through AI-powered voice explanations. Ask questions by speaking.</p>
              <button className="w-full py-2.5 text-sm font-semibold bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 rounded-xl hover:bg-yellow-400/30 transition-all flex items-center justify-center gap-2">
                <Mic size={14} /> Start Voice Session
              </button>
            </motion.div>
          )}

          {canAccessMockInterview && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-5 border border-green-500/20"
              style={{ background: "rgba(34,197,94,0.03)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Video size={18} className="text-green-400" />
                <h3 className="font-semibold">AI Mock Interview</h3>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">Elite</span>
              </div>
              <p className="text-sm text-white/50 mb-4">20 AI mock interviews with IIM-specific feedback and coaching.</p>
              <Link href="/gd-pi">
                <button className="w-full py-2.5 text-sm font-semibold bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl hover:bg-green-500/30 transition-all flex items-center justify-center gap-2">
                  <Video size={14} /> Start Interview Prep
                </button>
              </Link>
            </motion.div>
          )}
        </div>
      )}

      {/* Locked features for free users */}
      {activePlan === "free" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <LockedCard title="AI Doubt Solver" desc="Get instant AI-powered explanations" icon={Brain} plan="Pro" />
          <LockedCard title="Deep Analytics" desc="Track performance trends in detail" icon={BarChart2} plan="Pro" />
          <LockedCard title="AI Mentor" desc="Personal AI mentor for IIM prep" icon={Crown} plan="Elite" />
        </div>
      )}

      {/* Topic Mastery */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="glass rounded-2xl p-5 border border-white/5"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold">Topic Mastery Overview</h3>
            <p className="text-xs text-white/30 mt-0.5">Your section-wise performance breakdown</p>
          </div>
          <Link href="/practice" className="text-neon-blue text-sm flex items-center gap-1 hover:gap-2 transition-all">
            Practice Now <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {(["qa", "varc", "dilr"] as const).map((section) => (
            <div key={section}>
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("text-xs font-bold px-2 py-0.5 rounded uppercase",
                  section === "qa" ? "bg-blue-500/20 text-blue-400" :
                  section === "varc" ? "bg-purple-500/20 text-purple-400" :
                  "bg-green-500/20 text-green-400")}>
                  {section.toUpperCase()}
                </div>
              </div>
              <div className="space-y-2">
                {TOPICS[section].slice(0, 4).map((topic) => (
                  <div key={topic.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{topic.name}</span>
                      <span className={cn("font-medium",
                        topic.mastery >= 70 ? "text-green-400" :
                        topic.mastery >= 50 ? "text-yellow-400" : "text-red-400"
                      )}>{topic.mastery}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${topic.mastery}%` }}
                        transition={{ delay: 0.6 + Math.random() * 0.3, duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ background: topic.mastery >= 70 ? "#00ff88" : topic.mastery >= 50 ? "#f59e0b" : "#ef4444" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Daily Challenge", icon: Star, href: "/practice", color: "from-yellow-500/20 to-orange-500/10", border: "border-yellow-500/20", locked: false },
          { label: "AI Doubt Solver", icon: Brain, href: "/ai-doubt-solver", color: "from-neon-purple/20 to-neon-blue/10", border: "border-neon-purple/20", locked: !canAccess(activePlan, "AI_DOUBT_SOLVER") },
          { label: "College Predictor", icon: GraduationCap, href: "/college-predictor", color: "from-green-500/20 to-teal-500/10", border: "border-green-500/20", locked: !canAccess(activePlan, "COLLEGE_PREDICTOR") },
          { label: "Leaderboard", icon: Trophy, href: "/leaderboard", color: "from-pink-500/20 to-rose-500/10", border: "border-pink-500/20", locked: false },
        ].map((action) => (
          action.locked ? (
            <div key={action.label} className={cn("glass p-4 rounded-2xl border cursor-not-allowed text-center relative overflow-hidden", action.border, `bg-gradient-to-br ${action.color}`)}>
              <div className="absolute top-2 right-2">
                <Lock size={12} className="text-white/30" />
              </div>
              <action.icon size={24} className="mx-auto mb-2 text-white/25" />
              <p className="text-sm font-medium text-white/30">{action.label}</p>
              <p className="text-xs text-neon-blue/60 mt-1">Upgrade</p>
            </div>
          ) : (
            <Link key={action.label} href={action.href}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn("glass p-4 rounded-2xl border cursor-pointer text-center card-hover", action.border, `bg-gradient-to-br ${action.color}`)}
              >
                <action.icon size={24} className="mx-auto mb-2 text-white/70" />
                <p className="text-sm font-medium">{action.label}</p>
              </motion.div>
            </Link>
          )
        ))}
      </div>

      {/* Elite: Live Sessions + MBA Predictor */}
      {(canAccessLiveSessions || canAccessMBAPredictor || canAccessDailyRoadmap) && (
        <div className="grid lg:grid-cols-2 gap-6">
          {canAccessLiveSessions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-5 border border-neon-blue/20"
              style={{ background: "rgba(0,212,255,0.04)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-neon-blue" />
                  <h3 className="font-semibold">Live Sessions</h3>
                  <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full" /> LIVE
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { title: "DILR Strategy Masterclass", time: "Today 7PM", seats: 48 },
                  { title: "RC Shortcuts Workshop", time: "Tomorrow 6PM", seats: 120 },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-white/5 rounded-xl border border-white/5">
                    <div>
                      <p className="text-sm font-medium">{s.title}</p>
                      <p className="text-xs text-white/40">{s.time} • {s.seats} seats left</p>
                    </div>
                    <button className="text-xs px-3 py-1.5 bg-neon-blue/20 text-neon-blue rounded-lg border border-neon-blue/20 hover:bg-neon-blue/30 transition-all">
                      Join
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {canAccessMBAPredictor && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass rounded-2xl p-5 border border-neon-purple/20"
              style={{ background: "rgba(177,74,237,0.04)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap size={18} className="text-neon-purple" />
                <h3 className="font-semibold">MBA College Predictor</h3>
                <span className="text-xs bg-neon-purple/20 text-neon-purple px-2 py-0.5 rounded-full border border-neon-purple/20">Elite</span>
              </div>
              <p className="text-sm text-white/50 mb-4">
                Based on your current percentile of <strong className="text-white/70">89.2</strong>,
                here are your predicted college chances:
              </p>
              <div className="space-y-2">
                {[
                  { college: "IIM Kozhikode", chance: 72 },
                  { college: "IIM Indore", chance: 65 },
                  { college: "FMS Delhi", chance: 58 },
                ].map((c) => (
                  <div key={c.college} className="flex items-center gap-3">
                    <span className="text-sm text-white/70 w-32">{c.college}</span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-neon-purple to-pink-500 rounded-full" style={{ width: `${c.chance}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-neon-purple w-8">{c.chance}%</span>
                  </div>
                ))}
              </div>
              <Link href="/college-predictor">
                <button className="mt-4 w-full py-2 text-sm font-medium bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple rounded-xl border border-neon-purple/20 transition-all">
                  View Full Prediction →
                </button>
              </Link>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
