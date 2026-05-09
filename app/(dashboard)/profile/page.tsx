"use client";

import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { Crown, Flame, Star, Award, Target, Edit3, BarChart2, TrendingUp, Calendar } from "lucide-react";
import { cn, LEVELS, getLevel } from "@/lib/utils";
import { PLAN_BADGE_COLORS } from "@/lib/features";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const mockHistory = [
  { month: "Jun", percentile: 75 },
  { month: "Jul", percentile: 80 },
  { month: "Aug", percentile: 84 },
  { month: "Sep", percentile: 87 },
  { month: "Oct", percentile: 89 },
  { month: "Nov", percentile: 91 },
];

export default function ProfilePage() {
  const { user, plan, onboardingData } = useAuthStore();
  if (!user) return null;

  const activePlan = plan ?? "free";
  const level = getLevel(user.xp);
  const nextLevel = LEVELS.find((l) => l.level === level.level + 1);
  const xpProgress = nextLevel ? ((user.xp - level.minXP) / (nextLevel.minXP - level.minXP)) * 100 : 100;
  const dreamColleges = onboardingData?.dreamColleges ?? [];
  const badges = user.badges.length > 0 ? user.badges : ["First Login", "Profile Complete"];

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">My Profile</h1>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 border border-white/8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue/3 rounded-full -translate-y-32 translate-x-32" />
        <div className="relative flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-3xl font-bold flex-shrink-0">
            {user.name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-white/40 mt-0.5">{user.email}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-semibold capitalize border",
                    PLAN_BADGE_COLORS[activePlan]
                  )}>
                    {activePlan === "elite" && "👑 "}{activePlan} member
                  </span>
                  <span className="flex items-center gap-1 text-sm text-orange-400">
                    <Flame size={14} />{user.streak} day streak
                  </span>
                </div>
              </div>
              <button className="p-2 glass rounded-xl text-white/40 hover:text-white border border-white/8">
                <Edit3 size={16} />
              </button>
            </div>

            {/* Level & XP */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Crown size={14} className="text-yellow-400" />
                  <span className="text-sm font-semibold">Level {level.level} — {level.name}</span>
                </div>
                <span className="text-xs text-white/30">
                  {user.xp.toLocaleString()} / {nextLevel?.minXP.toLocaleString()} XP
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                />
              </div>
              <p className="text-xs text-white/25 mt-1">
                {nextLevel ? `${(nextLevel.minXP - user.xp).toLocaleString()} XP to ${nextLevel.name}` : "Max Level!"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Target Percentile", value: `${onboardingData?.targetPercentile ?? 95}+`, icon: Target, color: "text-neon-blue" },
          { label: "Questions Solved", value: "2,841", icon: BarChart2, color: "text-green-400" },
          { label: "Mock Tests Taken", value: "11", icon: Award, color: "text-yellow-400" },
          { label: "Study Hours", value: "186h", icon: Calendar, color: "text-neon-purple" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 border border-white/5 text-center">
            <s.icon size={20} className={cn(s.color, "mx-auto mb-2")} />
            <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
            <div className="text-xs text-white/30 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Percentile History */}
      <div className="glass rounded-2xl p-5 border border-white/5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-neon-blue" />
          Percentile Journey
        </h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={mockHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.4)" }} />
            <YAxis domain={[60, 100]} stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.4)" }} />
            <Tooltip contentStyle={{ background: "#0f0f2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d4ff" />
                <stop offset="100%" stopColor="#b14aed" />
              </linearGradient>
            </defs>
            <Bar dataKey="percentile" fill="url(#barGrad)" radius={[4, 4, 0, 0]} name="Percentile" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Dream Colleges */}
      {dreamColleges.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-white/5">
          <h3 className="font-semibold mb-4">Dream Colleges</h3>
          <div className="flex flex-wrap gap-2">
            {dreamColleges.map((college) => (
              <span key={college} className="text-sm px-3 py-1.5 bg-neon-blue/10 border border-neon-blue/20 text-neon-blue rounded-xl">
                🎓 {college}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="glass rounded-2xl p-5 border border-white/5">
        <h3 className="font-semibold mb-4">Earned Badges</h3>
        <div className="flex flex-wrap gap-3">
          {badges.map((badge) => (
            <div key={badge} className="flex items-center gap-2 px-3 py-2 glass rounded-xl border border-yellow-400/20 bg-yellow-400/5">
              <Star size={14} className="text-yellow-400" />
              <span className="text-sm font-medium">{badge}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
