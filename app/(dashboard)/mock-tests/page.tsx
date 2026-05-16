"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Clock, Play, Trophy, BarChart2, Target,
  Bookmark, Flag,
  TrendingUp, Brain, FileText, Zap, Flame, Search, Filter,
  X, ChevronDown, ChevronUp, GitCompare, RotateCcw,
  Calendar, CheckCircle2, Circle,
} from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { SAMPLE_QUESTIONS } from "@/lib/data";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore } from "@/store/useGameStore";
import { toast } from "@/lib/toast";
import { addNotification } from "@/lib/notifications";
import {
  MOCK_TESTS, CATEGORY_META, LABEL_META, DIFFICULTY_COLOR, DIFFICULTY_BAR,
  MOCK_ATTEMPT_HISTORY, SEVEN_DAY_PLAN,
  MockCategory, MockTest,
} from "@/lib/mockTests";
import TestAnalysis from "@/components/mock/TestAnalysis";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type TestState = "list" | "running" | "analysis";
type FilterCategory = "All" | MockCategory;

const ALL_CATEGORIES: FilterCategory[] = [
  "All", "Full", "Sectional", "Adaptive", "Speed", "Topic",
  "Beginner", "Intermediate", "Advanced", "PYQ", "Mini", "Marathon", "XAT",
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getCategoryGradient(cat: MockCategory): string {
  const map: Partial<Record<MockCategory, string>> = {
    Full:         "from-neon-blue/60 to-neon-purple/60",
    Sectional:    "from-purple-500/60 to-pink-500/60",
    Adaptive:     "from-yellow-500/60 to-orange-500/60",
    Speed:        "from-red-500/60 to-orange-400/60",
    Topic:        "from-green-500/60 to-teal-500/60",
    Beginner:     "from-emerald-500/60 to-green-400/60",
    Intermediate: "from-orange-400/60 to-yellow-400/60",
    Advanced:     "from-rose-500/60 to-red-500/60",
    PYQ:          "from-amber-500/60 to-yellow-500/60",
    Mini:         "from-teal-500/60 to-cyan-400/60",
    Marathon:     "from-pink-500/60 to-rose-400/60",
    XAT:          "from-indigo-500/60 to-blue-500/60",
  };
  return map[cat] ?? "from-white/20 to-white/10";
}

function getDiffGradient(d: string): string {
  if (d === "Starter")      return "bg-gradient-to-r from-emerald-500 to-green-400";
  if (d === "Intermediate") return "bg-gradient-to-r from-yellow-400 to-orange-400";
  if (d === "Advanced")     return "bg-gradient-to-r from-orange-500 to-red-400";
  if (d === "CAT Level")    return "bg-gradient-to-r from-red-500 to-rose-400";
  if (d === "Dynamic")      return "bg-gradient-to-r from-neon-blue to-neon-purple";
  return "bg-gradient-to-r from-white/40 to-white/20";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Insight Banner
// ─────────────────────────────────────────────────────────────────────────────

function AIInsightBanner() {
  const insights = [
    { icon: "🎯", text: "Your DILR accuracy dropped 8% this week — try a Sectional mock today." },
    { icon: "⚡", text: "Morning mock sessions show 12% higher accuracy for you. Schedule wisely." },
    { icon: "📈", text: "You're 4 mocks away from unlocking the 'Mock Warrior' achievement." },
    { icon: "🔥", text: "CAT 2024 Simulation is trending — 90% of 99-percentilers have attempted it." },
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % insights.length), 4000);
    return () => clearInterval(t);
  }, [insights.length]);

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neon-blue/5 border border-neon-blue/15">
      <Brain size={15} className="text-neon-blue flex-shrink-0" />
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="text-xs text-white/60"
        >
          <span className="mr-1.5">{insights[idx].icon}</span>
          <span className="text-neon-blue font-semibold">AI Mentor: </span>
          {insights[idx].text}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Detail Modal
// ─────────────────────────────────────────────────────────────────────────────

function MockDetailModal({
  test,
  onClose,
  onStart,
}: {
  test: MockTest;
  onClose: () => void;
  onStart: () => void;
}) {
  const catMeta = CATEGORY_META[test.category];
  const diffColor = DIFFICULTY_COLOR[test.difficulty];

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const statItems = [
    { label: "Questions",   value: String(test.questions),       icon: FileText },
    { label: "Duration",    value: `${test.duration} min`,       icon: Clock },
    { label: "XP Reward",   value: `+${test.xpReward} XP`,      icon: Zap },
    { label: "Difficulty",  value: test.difficulty,              icon: Target },
    { label: "Target",      value: `${test.targetPercentile}%ile`, icon: Trophy },
    { label: "Attempts",    value: String(test.attempts),        icon: RotateCcw },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${test.name}`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-dark-800 border border-white/10 shadow-[0_0_60px_rgba(0,212,255,0.12)]"
      >
        {/* Header stripe */}
        <div className={cn("h-1 w-full bg-gradient-to-r rounded-t-2xl", getCategoryGradient(test.category))} />

        <div className="p-6">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex flex-wrap gap-2">
              <span className={cn("text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wide", catMeta.color)}>
                {catMeta.icon} {catMeta.label}
              </span>
              {test.labels.map((l) => (
                <span key={l} className={cn("text-[10px] px-2 py-0.5 rounded border font-semibold", LABEL_META[l].color)}>
                  {LABEL_META[l].text}
                </span>
              ))}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg glass border border-white/8 text-white/40 hover:text-white transition-colors flex-shrink-0"
              aria-label="Close modal"
            >
              <X size={15} />
            </button>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold mb-1">{test.name}</h2>
          <p className="text-sm text-white/50 mb-5 leading-relaxed">{test.description}</p>

          {/* Stat grid */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {statItems.map((s) => (
              <div key={s.label} className="bg-white/3 rounded-xl p-3 border border-white/5 text-center">
                <s.icon size={14} className="mx-auto text-white/30 mb-1" />
                <div className={cn("text-sm font-bold", s.label === "Difficulty" ? diffColor : "text-white/90")}>
                  {s.value}
                </div>
                <div className="text-[10px] text-white/30 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5 mb-5" />

          {/* Topics */}
          {test.topics && test.topics.length > 0 && (
            <div className="mb-5">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Topics Covered</h3>
              <div className="flex flex-wrap gap-2">
                {test.topics.map((t) => (
                  <span key={t} className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-white/60">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommended for */}
          {test.recommendedFor && (
            <div className="mb-5">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Recommended For</h3>
              <p className="text-sm text-white/60 leading-relaxed">{test.recommendedFor}</p>
            </div>
          )}

          {/* Expected improvement */}
          {test.expectedImprovement && (
            <div className="mb-5 flex items-start gap-3 p-3 rounded-xl bg-green-500/8 border border-green-500/20">
              <TrendingUp size={15} className="text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-green-400 mb-0.5">Expected Improvement</div>
                <p className="text-sm text-white/60">{test.expectedImprovement}</p>
              </div>
            </div>
          )}

          {/* AI Mentor advice */}
          {test.aiMentorAdvice && (
            <div className="mb-6 flex items-start gap-3 p-3 rounded-xl bg-neon-blue/8 border border-neon-blue/20">
              <Brain size={15} className="text-neon-blue mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-neon-blue mb-0.5">AI Mentor Advice</div>
                <p className="text-sm text-white/60">{test.aiMentorAdvice}</p>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex gap-3">
            <button
              onClick={() => { onClose(); onStart(); }}
              className="flex-1 py-3 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.25)] hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] transition-all active:scale-95"
            >
              <Play size={14} fill="white" />
              {test.attempts === 0 ? "Start Test" : "Retake Test"}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 glass rounded-xl text-sm font-semibold text-white/50 border border-white/8 hover:text-white transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Card
// ─────────────────────────────────────────────────────────────────────────────

function MockCard({
  test,
  onStart,
  onDetails,
  compareMode,
  isSelected,
  onCompareToggle,
}: {
  test: MockTest;
  onStart: () => void;
  onDetails: () => void;
  compareMode: boolean;
  isSelected: boolean;
  onCompareToggle: () => void;
}) {
  const catMeta  = CATEGORY_META[test.category];
  const diffColor = DIFFICULTY_COLOR[test.difficulty];
  const diffBar   = DIFFICULTY_BAR[test.difficulty];
  const isNew     = test.attempts === 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.22 }}
      onClick={!compareMode ? onDetails : undefined}
      className={cn(
        "glass rounded-2xl border overflow-hidden group transition-all duration-300 cursor-pointer",
        compareMode && isSelected
          ? "border-neon-blue/50 shadow-[0_0_20px_rgba(0,212,255,0.2)]"
          : "border-white/5 hover:border-white/12 hover:shadow-[0_0_28px_rgba(0,212,255,0.10)]",
      )}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${test.name}`}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (compareMode) { onCompareToggle(); } else { onDetails(); } } }}
    >
      <div className={cn("h-0.5 w-full bg-gradient-to-r", getCategoryGradient(test.category))} />

      <div className="p-5">
        {/* Badges row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wide", catMeta.color)}>
              {catMeta.icon} {catMeta.label}
            </span>
            {test.labels.slice(0, 2).map((l) => (
              <span key={l} className={cn("text-[10px] px-2 py-0.5 rounded border font-semibold", LABEL_META[l].color)}>
                {LABEL_META[l].text}
              </span>
            ))}
          </div>
          {test.bestPercentile && (
            <div className="text-right flex-shrink-0">
              <div className="text-base font-bold text-yellow-400 leading-none">{test.bestPercentile}%ile</div>
              <div className="text-[10px] text-white/30 mt-0.5">Best</div>
            </div>
          )}
        </div>

        <h3 className="font-semibold text-sm leading-snug mb-1">{test.name}</h3>
        <p className="text-[11px] text-white/35 line-clamp-2 leading-relaxed mb-3">{test.description}</p>

        {/* Difficulty bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className={cn("text-[10px] font-semibold", diffColor)}>{test.difficulty}</span>
            <span className="text-[10px] text-white/30">Target: {test.targetPercentile}%ile</span>
          </div>
          <div className="h-1 bg-white/8 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${diffBar}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={cn("h-full rounded-full", getDiffGradient(test.difficulty))}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Questions", value: test.questions },
            { label: "Duration",  value: `${test.duration}m` },
            { label: "Attempts",  value: test.attempts },
          ].map((s) => (
            <div key={s.label} className="bg-white/3 rounded-xl py-2 px-1 text-center border border-white/5">
              <div className="text-sm font-bold text-white/90">{s.value}</div>
              <div className="text-[10px] text-white/30 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Accuracy + XP */}
        <div className="flex items-center gap-3 mb-4 text-[11px] text-white/35">
          {test.avgAccuracy !== null && (
            <span className="flex items-center gap-1">
              <Target size={10} className="text-green-400" />
              <span className="text-green-400 font-semibold">{test.avgAccuracy}%</span> acc
            </span>
          )}
          {test.percentileGain !== null && (
            <span className="flex items-center gap-1">
              <TrendingUp size={10} className="text-neon-purple" />
              <span className="text-neon-purple font-semibold">+{test.percentileGain}%ile</span>
            </span>
          )}
          <span className="ml-auto flex items-center gap-1">
            <Zap size={10} className="text-yellow-400" />
            <span className="text-yellow-400 font-semibold">{test.xpReward} XP</span>
          </span>
        </div>

        {/* Buttons */}
        {compareMode ? (
          <button
            onClick={(e) => { e.stopPropagation(); onCompareToggle(); }}
            className={cn(
              "w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all border",
              isSelected
                ? "bg-neon-blue/20 border-neon-blue/30 text-neon-blue"
                : "bg-white/5 border-white/10 text-white/50 hover:bg-white/8",
            )}
          >
            {isSelected ? <CheckCircle2 size={12} /> : <Circle size={12} />}
            {isSelected ? "Selected for Compare" : "Select to Compare"}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onStart(); }}
              aria-label={`${isNew ? "Start" : "Retake"} ${test.name}`}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95",
                isNew
                  ? "bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-[0_0_14px_rgba(0,212,255,0.25)] hover:shadow-[0_0_22px_rgba(0,212,255,0.4)]"
                  : "bg-white/8 text-white/70 hover:bg-white/12 border border-white/10",
              )}
            >
              <Play size={12} fill="currentColor" />
              {isNew ? "Start" : "Retake"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDetails(); }}
              className="px-3 py-2.5 glass rounded-xl text-xs text-white/40 hover:text-white border border-white/8 transition-colors"
              aria-label="View details"
            >
              <FileText size={12} />
            </button>
          </div>
        )}
      </div>
    </motion.article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7-Day Practice Plan
// ─────────────────────────────────────────────────────────────────────────────

function SevenDayPlan({ onStart }: { onStart: () => void }) {
  const completedCount = SEVEN_DAY_PLAN.filter((d) => d.completed).length;
  const totalXP = SEVEN_DAY_PLAN.reduce((s, d) => s + d.xp, 0);
  const earnedXP = SEVEN_DAY_PLAN.filter((d) => d.completed).reduce((s, d) => s + d.xp, 0);

  return (
    <div className="glass rounded-2xl border border-white/8 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-neon-purple" />
          <span className="text-sm font-bold">Your 7-Day Mock Plan</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-purple/15 text-neon-purple border border-neon-purple/20 font-semibold">
            AI Generated
          </span>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-yellow-400">{earnedXP} / {totalXP} XP</div>
          <div className="text-[10px] text-white/30">{completedCount}/7 days</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-neon-purple to-neon-blue transition-all"
          style={{ width: `${(completedCount / 7) * 100}%` }}
        />
      </div>

      {/* Days */}
      <div className="p-4 grid sm:grid-cols-7 gap-2">
        {SEVEN_DAY_PLAN.map((day, i) => {
          const catMeta = CATEGORY_META[day.category];
          const isToday = i === completedCount;
          return (
            <div
              key={day.day}
              className={cn(
                "rounded-xl p-3 border transition-all",
                day.completed
                  ? "bg-green-500/8 border-green-500/20"
                  : isToday
                    ? "bg-neon-blue/8 border-neon-blue/25 shadow-[0_0_12px_rgba(0,212,255,0.12)]"
                    : "bg-white/2 border-white/5",
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  "text-[10px] font-bold",
                  day.completed ? "text-green-400" : isToday ? "text-neon-blue" : "text-white/30",
                )}>
                  {day.dayLabel}
                </span>
                {day.completed
                  ? <CheckCircle2 size={11} className="text-green-400" />
                  : isToday
                    ? <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
                    : <Circle size={11} className="text-white/20" />
                }
              </div>
              <div className="text-[9px] text-white/40 font-semibold uppercase tracking-wide mb-1">
                {catMeta.icon} {catMeta.label}
              </div>
              <div className="text-[10px] text-white/60 line-clamp-2 leading-snug mb-2">
                {day.testName}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-white/25">{day.duration}</span>
                <span className="text-[9px] text-yellow-400 font-bold">{day.xp}xp</span>
              </div>
              {isToday && (
                <button
                  onClick={onStart}
                  className="mt-2 w-full py-1 bg-neon-blue/20 border border-neon-blue/30 rounded-lg text-[10px] text-neon-blue font-bold flex items-center justify-center gap-1"
                >
                  <Play size={8} fill="currentColor" /> Start
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* AI reason for today */}
      {SEVEN_DAY_PLAN[completedCount] && (
        <div className="px-5 py-3 border-t border-white/5 flex items-start gap-2">
          <Brain size={12} className="text-neon-blue mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-white/45">
            <span className="text-neon-blue font-semibold">Today&apos;s pick: </span>
            {SEVEN_DAY_PLAN[completedCount].reason}
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Attempt History Timeline
// ─────────────────────────────────────────────────────────────────────────────

function AttemptHistory({ onRetake }: { onRetake: () => void }) {
  if (MOCK_ATTEMPT_HISTORY.length === 0) {
    return (
      <div className="glass rounded-2xl border border-white/5 p-8 text-center">
        <Trophy size={32} className="mx-auto text-white/15 mb-3" />
        <p className="text-sm font-semibold text-white/30">No attempts yet</p>
        <p className="text-xs text-white/20 mt-1">Complete your first mock to see history here.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-white/8 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
        <BarChart2 size={15} className="text-neon-blue" />
        <span className="text-sm font-bold">Attempt History</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/40 ml-auto">
          {MOCK_ATTEMPT_HISTORY.length} attempts
        </span>
      </div>

      <div className="divide-y divide-white/5">
        {MOCK_ATTEMPT_HISTORY.map((attempt, i) => {
          const catMeta = CATEGORY_META[attempt.category];
          const isImproved = attempt.improvement !== null && attempt.improvement > 0;
          const isDropped  = attempt.improvement !== null && attempt.improvement < 0;

          return (
            <motion.div
              key={attempt.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="px-5 py-4 flex items-center gap-4 hover:bg-white/2 transition-colors"
            >
              {/* Timeline dot */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full border-2",
                  i === 0 ? "bg-neon-blue border-neon-blue" : "bg-white/20 border-white/10",
                )} />
                {i < MOCK_ATTEMPT_HISTORY.length - 1 && (
                  <div className="w-px h-8 bg-white/8 mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase", catMeta.color)}>
                    {catMeta.icon} {catMeta.label}
                  </span>
                  <span className="text-[10px] text-white/25">{formatDate(attempt.date)}</span>
                </div>
                <p className="text-sm font-semibold text-white/80 truncate">{attempt.testName}</p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-white/40">
                  <span>Score: <span className="text-white/60 font-medium">{attempt.score}/{attempt.totalScore}</span></span>
                  <span>Acc: <span className="text-green-400 font-medium">{attempt.accuracy}%</span></span>
                  <span>Time: <span className="text-white/60 font-medium">{attempt.timeTaken}m</span></span>
                </div>
              </div>

              {/* Percentile + improvement */}
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold text-yellow-400">{attempt.percentile}%ile</div>
                {attempt.improvement !== null && (
                  <div className={cn(
                    "text-[10px] font-semibold flex items-center justify-end gap-0.5",
                    isImproved ? "text-green-400" : isDropped ? "text-red-400" : "text-white/30",
                  )}>
                    {isImproved && <TrendingUp size={9} />}
                    {isDropped  && <TrendingUp size={9} className="rotate-180" />}
                    {isImproved ? `+${attempt.improvement}` : attempt.improvement}%ile
                  </div>
                )}
              </div>

              {/* Retake */}
              <button
                onClick={onRetake}
                className="p-2 glass rounded-lg border border-white/8 text-white/30 hover:text-neon-blue hover:border-neon-blue/30 transition-all flex-shrink-0"
                aria-label={`Retake ${attempt.testName}`}
              >
                <RotateCcw size={12} />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Comparison Panel
// ─────────────────────────────────────────────────────────────────────────────

function MockComparePanel({
  testA,
  testB,
  onClear,
}: {
  testA: MockTest;
  testB: MockTest;
  onClear: () => void;
}) {
  const rows: Array<{
    label: string;
    a: string;
    b: string;
    winner?: "a" | "b" | "tie";
  }> = [
    {
      label: "Questions",
      a: String(testA.questions),
      b: String(testB.questions),
      winner: testA.questions === testB.questions ? "tie" : undefined,
    },
    {
      label: "Duration",
      a: `${testA.duration} min`,
      b: `${testB.duration} min`,
    },
    {
      label: "Best Percentile",
      a: testA.bestPercentile ? `${testA.bestPercentile}%ile` : "—",
      b: testB.bestPercentile ? `${testB.bestPercentile}%ile` : "—",
      winner:
        testA.bestPercentile && testB.bestPercentile
          ? testA.bestPercentile > testB.bestPercentile ? "a" : "b"
          : undefined,
    },
    {
      label: "Avg Accuracy",
      a: testA.avgAccuracy !== null ? `${testA.avgAccuracy}%` : "—",
      b: testB.avgAccuracy !== null ? `${testB.avgAccuracy}%` : "—",
      winner:
        testA.avgAccuracy !== null && testB.avgAccuracy !== null
          ? testA.avgAccuracy > testB.avgAccuracy ? "a" : "b"
          : undefined,
    },
    {
      label: "XP Reward",
      a: `+${testA.xpReward}`,
      b: `+${testB.xpReward}`,
      winner: testA.xpReward === testB.xpReward ? "tie" : testA.xpReward > testB.xpReward ? "a" : "b",
    },
    {
      label: "Percentile Gain",
      a: testA.percentileGain ? `+${testA.percentileGain}%ile` : "—",
      b: testB.percentileGain ? `+${testB.percentileGain}%ile` : "—",
      winner:
        testA.percentileGain !== null && testB.percentileGain !== null
          ? testA.percentileGain > testB.percentileGain ? "a" : "b"
          : undefined,
    },
    {
      label: "Attempts",
      a: String(testA.attempts),
      b: String(testB.attempts),
    },
  ];

  const aWins = rows.filter((r) => r.winner === "a").length;
  const bWins = rows.filter((r) => r.winner === "b").length;
  const recommendation = aWins > bWins ? testA : bWins > aWins ? testB : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="glass rounded-2xl border border-neon-blue/20 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare size={15} className="text-neon-blue" />
          <span className="text-sm font-bold">Mock Comparison</span>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white px-2 py-1 glass rounded-lg border border-white/8 transition-colors"
        >
          <X size={11} /> Clear
        </button>
      </div>

      {/* Test names */}
      <div className="grid grid-cols-3 gap-px bg-white/5">
        <div className="bg-dark-800 p-3 text-[10px] text-white/30 uppercase tracking-wider font-bold">Metric</div>
        <div className="bg-dark-800 p-3">
          <div className="text-[10px] text-white/40 mb-0.5">Test A</div>
          <div className="text-xs font-bold text-neon-blue truncate">{testA.name}</div>
        </div>
        <div className="bg-dark-800 p-3">
          <div className="text-[10px] text-white/40 mb-0.5">Test B</div>
          <div className="text-xs font-bold text-neon-purple truncate">{testB.name}</div>
        </div>
      </div>

      {/* Rows */}
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-3 gap-px bg-white/5">
          <div className="bg-dark-800 px-4 py-3 text-xs text-white/40">{row.label}</div>
          <div className={cn(
            "bg-dark-800 px-4 py-3 text-xs font-semibold",
            row.winner === "a" ? "text-green-400" : "text-white/70",
          )}>
            {row.a}
            {row.winner === "a" && <span className="ml-1 text-[9px] text-green-400">✓</span>}
          </div>
          <div className={cn(
            "bg-dark-800 px-4 py-3 text-xs font-semibold",
            row.winner === "b" ? "text-green-400" : "text-white/70",
          )}>
            {row.b}
            {row.winner === "b" && <span className="ml-1 text-[9px] text-green-400">✓</span>}
          </div>
        </div>
      ))}

      {/* AI Recommendation */}
      <div className="px-5 py-4 bg-neon-blue/4 border-t border-neon-blue/15 flex items-start gap-3">
        <Brain size={14} className="text-neon-blue mt-0.5 flex-shrink-0" />
        <p className="text-xs text-white/60">
          <span className="text-neon-blue font-semibold">AI Recommendation: </span>
          {recommendation
            ? `Start with "${recommendation.name}" — it scores higher on ${recommendation === testA ? aWins : bWins} out of 7 metrics and better matches your current profile.`
            : "Both tests are evenly matched. Pick the one that targets your weaker section."}
        </p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty / Loading states
// ─────────────────────────────────────────────────────────────────────────────

function EmptySearch({ query }: { query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-16 text-center"
    >
      <Search size={32} className="mx-auto text-white/15 mb-3" />
      <p className="text-sm font-semibold text-white/40">No tests match &ldquo;{query}&rdquo;</p>
      <p className="text-xs text-white/25 mt-1">Try a different keyword or browse by category.</p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section helper
// ─────────────────────────────────────────────────────────────────────────────

function Section({
  title, subtitle, icon, color, tests, onStart, onDetails, compareMode, selectedIds, onCompareToggle,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  tests: MockTest[];
  onStart: () => void;
  onDetails: (t: MockTest) => void;
  compareMode: boolean;
  selectedIds: Set<number>;
  onCompareToggle: (t: MockTest) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className={cn("text-xs font-bold uppercase tracking-wider", color)}>{title}</span>
          {subtitle && <span className="text-[10px] text-white/25">— {subtitle}</span>}
        </div>
        <div className="flex-1 h-px bg-white/5" />
        <span className="text-[10px] text-white/25">{tests.length} test{tests.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {tests.map((test) => (
          <MockCard
            key={test.id}
            test={test}
            onStart={onStart}
            onDetails={() => onDetails(test)}
            compareMode={compareMode}
            isSelected={selectedIds.has(test.id)}
            onCompareToggle={() => onCompareToggle(test)}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Test Interface (unchanged — running state)
// ─────────────────────────────────────────────────────────────────────────────

function MockTestInterface({ onFinish }: { onFinish: (answers: Record<number, number>) => void }) {
  const questions = SAMPLE_QUESTIONS;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers]       = useState<Record<number, number>>({});
  const [marked, setMarked]         = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft]     = useState(40 * 60);
  const [section, setSection]       = useState<"varc" | "dilr" | "qa">("varc");

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timer); onFinish(answers); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [answers, onFinish]);

  const currentQ  = questions[currentIdx] || questions[0];
  const answered  = Object.keys(answers).length;

  const getQStatus = (idx: number) => {
    if (marked.has(idx)) return "marked";
    if (answers[idx] !== undefined) return "answered";
    if (idx === currentIdx) return "current";
    return "unanswered";
  };

  return (
    <div className="fixed inset-0 bg-dark-900 z-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 bg-dark-800 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-neon-blue" />
            <span className="font-bold text-neon-blue">CATalyst AI</span>
          </div>
          <span className="text-white/30">|</span>
          <span className="text-sm text-white/60">Live Mock Test</span>
        </div>

        <div className="flex gap-2">
          {(["varc", "dilr", "qa"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg font-semibold uppercase transition-all",
                section === s ? "bg-neon-blue/20 text-neon-blue" : "text-white/40 hover:text-white",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg",
          timeLeft < 300 ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-dark-600 text-white",
        )}>
          <Clock size={18} />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs text-white/40">Question {currentIdx + 1} of {questions.length}</span>
              <span className={cn("text-xs px-2 py-0.5 rounded capitalize",
                currentQ.difficulty === "cat level" ? "bg-red-500/20 text-red-400" :
                currentQ.difficulty === "advanced"   ? "bg-orange-500/20 text-orange-400" :
                "bg-green-500/20 text-green-400",
              )}>
                {currentQ.difficulty}
              </span>
              <span className="text-xs text-white/25">{currentQ.topic}</span>
            </div>

            <div className="glass rounded-2xl p-6 border border-white/8 mb-4">
              <p className="text-[15px] leading-relaxed text-white/90 whitespace-pre-line mb-6">
                {currentQ.text}
              </p>
              <div className="space-y-3">
                {currentQ.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAnswers({ ...answers, [currentIdx]: idx })}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                      answers[currentIdx] === idx
                        ? "bg-neon-blue/15 border-neon-blue/40 text-white"
                        : "bg-white/3 border-white/8 text-white/80 hover:bg-white/6 hover:border-white/15",
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
                      answers[currentIdx] === idx ? "bg-neon-blue text-dark-900" : "bg-white/8 text-white/50",
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                className="px-4 py-2 glass rounded-xl text-sm text-white/60 hover:text-white border border-white/8"
              >
                ← Previous
              </button>
              <button
                onClick={() => {
                  const n = new Set(marked);
                  if (n.has(currentIdx)) n.delete(currentIdx); else n.add(currentIdx);
                  setMarked(n);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all",
                  marked.has(currentIdx)
                    ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                    : "glass border-white/8 text-white/60 hover:text-white",
                )}
              >
                <Bookmark size={14} />
                {marked.has(currentIdx) ? "Marked" : "Mark for Review"}
              </button>
              <button
                onClick={() => setAnswers({ ...answers })}
                className="px-4 py-2 glass rounded-xl text-sm text-white/60 hover:text-white border border-white/8"
              >
                Clear
              </button>
              <button
                onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                className="ml-auto px-6 py-2 bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue rounded-xl text-sm font-semibold border border-neon-blue/30"
              >
                Save & Next →
              </button>
            </div>
          </div>
        </div>

        <div className="w-64 bg-dark-800 border-l border-white/5 p-4 overflow-y-auto">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Question Palette</h3>
          <div className="space-y-2 mb-4">
            {[
              { label: "Answered",     color: "bg-green-500",  count: answered },
              { label: "Marked",       color: "bg-yellow-500", count: marked.size },
              { label: "Not Answered", color: "bg-white/20",   count: questions.length - answered - marked.size },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-xs text-white/50">
                <div className={cn("w-4 h-4 rounded", s.color)} />
                <span>{s.label}: {s.count}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-1.5 mb-4">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={cn(
                  "w-9 h-9 rounded-lg text-xs font-semibold transition-all",
                  getQStatus(idx) === "answered"   && "bg-green-500/80 text-white",
                  getQStatus(idx) === "marked"     && "bg-yellow-500/80 text-dark-900",
                  getQStatus(idx) === "current"    && "bg-neon-blue text-dark-900 ring-2 ring-neon-blue ring-offset-1 ring-offset-dark-800",
                  getQStatus(idx) === "unanswered" && "bg-white/8 text-white/40 hover:bg-white/15",
                )}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => onFinish(answers)}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
          >
            <Flag size={14} /> Submit Test
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Collapsible wrapper
// ─────────────────────────────────────────────────────────────────────────────

function Collapsible({
  title, defaultOpen = false, children,
}: { title: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-1 text-left group"
        aria-expanded={open}
      >
        <div className="flex-1">{title}</div>
        <span className="text-white/30 group-hover:text-white/60 transition-colors ml-2">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function MockTestsPage() {
  const [testState, setTestState]     = useState<TestState>("list");
  const [category, setCategory]       = useState<FilterCategory>("All");
  const [search, setSearch]           = useState("");
  const [showSearch, setShowSearch]   = useState(false);
  const [activeModal, setActiveModal] = useState<MockTest | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSet, setCompareSet]   = useState<Set<number>>(new Set());

  const filtered = useMemo(() => {
    let list = category === "All" ? MOCK_TESTS : MOCK_TESTS.filter((t) => t.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.topic ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [category, search]);

  const categoryCounts = useMemo(() => {
    const m: Partial<Record<FilterCategory, number>> = { All: MOCK_TESTS.length };
    for (const t of MOCK_TESTS) m[t.category] = (m[t.category] ?? 0) + 1;
    return m;
  }, []);

  const handleFinish = useCallback(() => {
    setTestState("analysis");
    const { incrementMocksTaken, tryUnlockAchievements } = useGameStore.getState();
    const { updateXP } = useAuthStore.getState();
    incrementMocksTaken();
    updateXP(150);
    toast.xp(150, "Mock Test Complete! 🏆");
    addNotification("mock", "Mock Analysis Ready", "Your latest mock test analysis is ready. Review your weak areas.", "📊", "/mock-tests");
    const freshUser = useAuthStore.getState().user;
    tryUnlockAchievements(freshUser?.xp ?? 0, freshUser?.streak ?? 0, freshUser?.level ?? 1);
  }, []);

  function toggleCompare(test: MockTest) {
    setCompareSet((prev) => {
      const next = new Set(prev);
      if (next.has(test.id)) { next.delete(test.id); return next; }
      if (next.size >= 2) return prev; // max 2
      next.add(test.id);
      return next;
    });
  }

  const compareTests = MOCK_TESTS.filter((t) => compareSet.has(t.id));

  // AI picks — tests with ai-recommended label not yet attempted first
  const aiPicks  = MOCK_TESTS.filter((t) => t.labels.includes("ai-recommended")).slice(0, 3);
  const trending = MOCK_TESTS.filter((t) => t.labels.includes("trending")).slice(0, 3);

  const showGroups = category === "All" && !search.trim();

  const sectionProps = {
    onStart: () => setTestState("running"),
    onDetails: (t: MockTest) => setActiveModal(t),
    compareMode,
    selectedIds: compareSet,
    onCompareToggle: toggleCompare,
  };

  if (testState === "running")  return <MockTestInterface onFinish={handleFinish} />;
  if (testState === "analysis") return <TestAnalysis onBack={() => setTestState("list")} onRetake={() => setTestState("running")} />;

  return (
    <>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Mock Tests</h1>
            <p className="text-white/40 mt-1 text-sm">
              {MOCK_TESTS.length} tests across 12 categories — simulate real CAT pressure
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="glass px-4 py-2 rounded-xl border border-white/5 text-center">
              <div className="text-xl font-bold text-yellow-400">11</div>
              <div className="text-[10px] text-white/30">Tests Taken</div>
            </div>
            <div className="glass px-4 py-2 rounded-xl border border-white/5 text-center">
              <div className="text-xl font-bold text-neon-blue">91.2</div>
              <div className="text-[10px] text-white/30">Best %ile</div>
            </div>
            {/* Compare mode toggle */}
            <button
              onClick={() => { setCompareMode((v) => !v); setCompareSet(new Set()); }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all",
                compareMode
                  ? "bg-neon-purple/20 border-neon-purple/30 text-neon-purple"
                  : "glass border-white/10 text-white/40 hover:text-white",
              )}
              aria-pressed={compareMode}
            >
              <GitCompare size={13} />
              {compareMode ? "Exit Compare" : "Compare"}
            </button>
          </div>
        </div>

        {/* ── Compare mode hint ── */}
        <AnimatePresence>
          {compareMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neon-purple/8 border border-neon-purple/20 text-sm text-white/60">
                <GitCompare size={14} className="text-neon-purple flex-shrink-0" />
                <span>
                  Select <strong className="text-white">2 tests</strong> to compare them side-by-side.
                  {compareSet.size > 0 && <span className="text-neon-purple font-semibold ml-2">{compareSet.size}/2 selected</span>}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Compare panel ── */}
        <AnimatePresence>
          {compareTests.length === 2 && (
            <MockComparePanel
              testA={compareTests[0]}
              testB={compareTests[1]}
              onClear={() => setCompareSet(new Set())}
            />
          )}
        </AnimatePresence>

        {/* ── AI Insight Banner ── */}
        <AIInsightBanner />

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Best Percentile",  value: "91.2",   sub: "CAT Full Mock #2",  color: "text-yellow-400",  Icon: Trophy },
            { label: "Avg Percentile",   value: "84.6",   sub: "last 5 mocks",      color: "text-neon-blue",   Icon: BarChart2 },
            { label: "Avg Accuracy",     value: "74%",    sub: "needs improvement", color: "text-green-400",   Icon: Target },
            { label: "Percentile Trend", value: "↑ +6.6", sub: "vs last month",     color: "text-neon-purple", Icon: TrendingUp },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4 border border-white/5">
              <s.Icon size={14} className={cn(s.color, "opacity-60 mb-2")} />
              <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
              <div className="text-xs font-medium text-white/60 mt-0.5">{s.label}</div>
              <div className="text-[10px] text-white/25 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── 7-Day Plan (collapsible) ── */}
        <Collapsible
          defaultOpen
          title={
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-neon-purple" />
              <span className="text-xs font-bold text-neon-purple uppercase tracking-wider">7-Day Practice Plan</span>
              <div className="flex-1 h-px bg-white/5 ml-2" />
            </div>
          }
        >
          <SevenDayPlan onStart={() => setTestState("running")} />
        </Collapsible>

        {/* ── Attempt History (collapsible) ── */}
        <Collapsible
          title={
            <div className="flex items-center gap-2">
              <BarChart2 size={13} className="text-neon-blue" />
              <span className="text-xs font-bold text-neon-blue uppercase tracking-wider">Attempt History</span>
              <div className="flex-1 h-px bg-white/5 ml-2" />
            </div>
          }
        >
          <AttemptHistory onRetake={() => setTestState("running")} />
        </Collapsible>

        {/* ── Category Filter ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-white/30" />
            <span className="text-xs text-white/30 uppercase tracking-wider font-semibold">Browse Tests</span>
            <button
              onClick={() => setShowSearch((v) => !v)}
              className="ml-auto p-1.5 glass rounded-lg border border-white/8 text-white/40 hover:text-white transition-colors"
              aria-label="Toggle search"
            >
              <Search size={13} />
            </button>
          </div>

          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tests, topics, categories..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-blue/40 transition-colors mb-2"
                  autoFocus
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => {
              const meta    = cat !== "All" ? CATEGORY_META[cat] : null;
              const count   = categoryCounts[cat] ?? 0;
              const isActive = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "text-xs px-3 py-2 rounded-xl border font-medium transition-all flex items-center gap-1.5",
                    isActive
                      ? cat === "All"
                        ? "bg-neon-blue/20 border-neon-blue/30 text-neon-blue"
                        : cn("border", meta?.color)
                      : "glass border-white/8 text-white/40 hover:text-white",
                  )}
                >
                  {meta?.icon && <span className="text-[11px]">{meta.icon}</span>}
                  {cat === "All" ? "All Tests" : meta?.label}
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-0.5",
                    isActive ? "bg-white/20" : "bg-white/8 text-white/30",
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Test Grid ── */}
        <AnimatePresence mode="wait">
          {showGroups ? (
            <motion.div key="grouped" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <Section
                title="AI Recommended for You"
                icon={<Brain size={14} className="text-neon-blue" />}
                color="text-neon-blue"
                tests={aiPicks}
                {...sectionProps}
              />
              <Section
                title="Trending This Week"
                icon={<Flame size={14} className="text-orange-400" />}
                color="text-orange-400"
                tests={trending}
                {...sectionProps}
              />
              {(Object.keys(CATEGORY_META) as MockCategory[]).map((cat) => {
                const tests = MOCK_TESTS.filter((t) => t.category === cat);
                if (!tests.length) return null;
                const meta = CATEGORY_META[cat];
                return (
                  <Section
                    key={cat}
                    title={meta.label}
                    subtitle={meta.description}
                    icon={<span className="text-sm">{meta.icon}</span>}
                    color={meta.color.split(" ")[0]}
                    tests={tests}
                    {...sectionProps}
                  />
                );
              })}
            </motion.div>
          ) : (
            <motion.div key={category + search} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {filtered.length === 0
                ? <EmptySearch query={search || category} />
                : (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((test) => (
                      <MockCard
                        key={test.id}
                        test={test}
                        onStart={() => setTestState("running")}
                        onDetails={() => setActiveModal(test)}
                        compareMode={compareMode}
                        isSelected={compareSet.has(test.id)}
                        onCompareToggle={() => toggleCompare(test)}
                      />
                    ))}
                  </div>
                )
              }
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Detail Modal (portal-style overlay) ── */}
      <AnimatePresence>
        {activeModal && (
          <MockDetailModal
            test={activeModal}
            onClose={() => setActiveModal(null)}
            onStart={() => setTestState("running")}
          />
        )}
      </AnimatePresence>
    </>
  );
}
