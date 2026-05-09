"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  Trophy, Star, Crown, Flame, Zap, Medal, TrendingUp,
  Filter, Search, Users, ArrowUp, ArrowDown
} from "lucide-react";
import { cn } from "@/lib/utils";

const LEADERBOARD = [
  { rank: 1, name: "Priya Sharma", college: "Delhi", percentile: 99.2, xp: 18450, streak: 87, accuracy: 88, change: 0 },
  { rank: 2, name: "Rahul Gupta", college: "Mumbai", percentile: 98.8, xp: 17200, streak: 65, accuracy: 85, change: 1 },
  { rank: 3, name: "Sneha Patel", college: "Bangalore", percentile: 98.5, xp: 16800, streak: 92, accuracy: 82, change: -1 },
  { rank: 4, name: "Arjun Sharma", college: "Delhi", percentile: 89.2, xp: 4250, streak: 14, accuracy: 76, change: 2, isYou: true },
  { rank: 5, name: "Vikram Singh", college: "Pune", percentile: 97.1, xp: 15200, streak: 45, accuracy: 79, change: 1 },
  { rank: 6, name: "Ananya Roy", college: "Kolkata", percentile: 96.8, xp: 14700, streak: 38, accuracy: 81, change: -2 },
  { rank: 7, name: "Karthik M", college: "Chennai", percentile: 96.2, xp: 14200, streak: 72, accuracy: 78, change: 3 },
  { rank: 8, name: "Nisha Verma", college: "Hyderabad", percentile: 95.8, xp: 13800, streak: 29, accuracy: 84, change: 0 },
  { rank: 9, name: "Amit Kumar", college: "Ahmedabad", percentile: 95.4, xp: 13200, streak: 54, accuracy: 77, change: -1 },
  { rank: 10, name: "Pooja Mehta", college: "Jaipur", percentile: 94.9, xp: 12600, streak: 41, accuracy: 80, change: 2 },
];

const BADGES = [
  { icon: "🔥", name: "7-Day Streak", desc: "Study 7 days in a row", earned: true },
  { icon: "⚡", name: "Speed Demon", desc: "Solve 20 QA Qs in under 30 min", earned: true },
  { icon: "🎯", name: "QA Master", desc: "90%+ accuracy in QA section", earned: true },
  { icon: "📚", name: "First Mock", desc: "Complete your first mock test", earned: true },
  { icon: "🏆", name: "Top 10%", desc: "Reach top 10% on leaderboard", earned: false },
  { icon: "💯", name: "Perfect Score", desc: "100% accuracy on a topic test", earned: false },
  { icon: "🌟", name: "30-Day Legend", desc: "30 consecutive study days", earned: false },
  { icon: "🎓", name: "IIM Bound", desc: "Achieve 99+ percentile in mock", earned: false },
];

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown size={20} className="text-yellow-400" />;
  if (rank === 2) return <Medal size={20} className="text-slate-300" />;
  if (rank === 3) return <Medal size={20} className="text-amber-600" />;
  return <span className="text-white/40 text-sm font-bold w-5 text-center">#{rank}</span>;
};

export default function LeaderboardPage() {
  const [filter, setFilter] = useState("Weekly");
  const [tab, setTab] = useState<"leaderboard" | "badges">("leaderboard");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leaderboard & Achievements</h1>
          <p className="text-white/40 mt-1 text-sm">Compete, achieve, and stay motivated</p>
        </div>
        <div className="glass px-4 py-2 rounded-xl border border-white/5">
          <div className="text-sm text-white/40">Your Rank</div>
          <div className="text-2xl font-bold text-neon-blue">#4</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 glass rounded-2xl border border-white/5 w-fit">
        {["leaderboard", "badges"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as typeof tab)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all",
              tab === t ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30" : "text-white/40 hover:text-white"
            )}
          >
            {t === "leaderboard" ? "🏆 Leaderboard" : "🎖 My Badges"}
          </button>
        ))}
      </div>

      {tab === "leaderboard" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2">
            {["Daily", "Weekly", "Monthly", "All Time"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "text-sm px-4 py-2 rounded-xl border transition-all",
                  filter === f ? "bg-neon-blue/20 border-neon-blue/30 text-neon-blue" : "glass border-white/10 text-white/40 hover:text-white"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[LEADERBOARD[1], LEADERBOARD[0], LEADERBOARD[2]].map((user, i) => (
              <motion.div
                key={user.rank}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "glass rounded-2xl p-5 border text-center",
                  user.rank === 1 ? "border-yellow-400/30 bg-yellow-400/5 mt-0" : "border-white/8 mt-4"
                )}
              >
                <div className="text-3xl mb-2">
                  {user.rank === 1 ? "👑" : user.rank === 2 ? "🥈" : "🥉"}
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-lg font-bold mx-auto mb-2">
                  {user.name[0]}
                </div>
                <div className="font-semibold text-sm">{user.name.split(" ")[0]}</div>
                <div className="text-xs text-white/30 mt-0.5">{user.college}</div>
                <div className={cn(
                  "text-lg font-bold mt-2",
                  user.rank === 1 ? "text-yellow-400" : user.rank === 2 ? "text-slate-300" : "text-amber-600"
                )}>
                  {user.percentile}%ile
                </div>
                <div className="text-xs text-white/30">{user.xp.toLocaleString()} XP</div>
              </motion.div>
            ))}
          </div>

          {/* Full Leaderboard */}
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="grid grid-cols-12 text-xs text-white/25 uppercase tracking-wider px-5 py-3 border-b border-white/5">
              <div className="col-span-1">Rank</div>
              <div className="col-span-4">Student</div>
              <div className="col-span-2 text-right">Percentile</div>
              <div className="col-span-2 text-right">XP</div>
              <div className="col-span-2 text-right">Streak</div>
              <div className="col-span-1 text-right">Δ</div>
            </div>
            <div className="divide-y divide-white/3">
              {LEADERBOARD.map((user, i) => (
                <motion.div
                  key={user.rank}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    "grid grid-cols-12 items-center px-5 py-3.5 transition-all",
                    user.isYou ? "bg-neon-blue/8 border-l-2 border-neon-blue" : "hover:bg-white/3"
                  )}
                >
                  <div className="col-span-1 flex items-center">
                    <RankIcon rank={user.rank} />
                  </div>
                  <div className="col-span-4 flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      user.isYou ? "bg-gradient-to-br from-neon-blue to-neon-purple" : "bg-white/10"
                    )}>
                      {user.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium flex items-center gap-1">
                        {user.name}
                        {user.isYou && <span className="text-xs bg-neon-blue/20 text-neon-blue px-1.5 rounded">You</span>}
                      </div>
                      <div className="text-xs text-white/25">{user.college}</div>
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className={cn("text-sm font-semibold", user.percentile >= 99 ? "text-yellow-400" : user.percentile >= 95 ? "text-green-400" : "text-white/70")}>
                      {user.percentile}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm text-yellow-400 font-medium">{user.xp.toLocaleString()}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm flex items-center justify-end gap-1 text-orange-400">
                      <Flame size={12} /> {user.streak}d
                    </span>
                  </div>
                  <div className="col-span-1 text-right">
                    {user.change > 0 ? (
                      <span className="text-xs text-green-400 flex items-center justify-end gap-0.5"><ArrowUp size={10} />{user.change}</span>
                    ) : user.change < 0 ? (
                      <span className="text-xs text-red-400 flex items-center justify-end gap-0.5"><ArrowDown size={10} />{Math.abs(user.change)}</span>
                    ) : (
                      <span className="text-xs text-white/20">—</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "badges" && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Star size={16} className="text-yellow-400" />
              <span className="font-semibold">4 / 8 badges earned</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {BADGES.map((badge, i) => (
              <motion.div
                key={badge.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "glass rounded-2xl p-5 border text-center transition-all",
                  badge.earned ? "border-yellow-400/20 bg-yellow-400/5" : "border-white/5 opacity-50"
                )}
              >
                <div className="text-4xl mb-3">{badge.icon}</div>
                <div className="font-semibold text-sm mb-1">{badge.name}</div>
                <div className="text-xs text-white/30">{badge.desc}</div>
                {badge.earned && (
                  <div className="mt-3 text-xs text-yellow-400 font-medium flex items-center justify-center gap-1">
                    <Star size={10} /> Earned
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
