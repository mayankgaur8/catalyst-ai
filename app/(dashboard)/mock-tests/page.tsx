"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Clock, Play, Trophy, BarChart2, Target, Lightbulb,
  CheckCircle, Bookmark, Flag, AlertCircle, ArrowLeft,
  TrendingUp, Brain, FileText, Zap,
  Flame, Search, Filter,
} from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { SAMPLE_QUESTIONS } from "@/lib/data";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore } from "@/store/useGameStore";
import { toast } from "@/lib/toast";
import { addNotification } from "@/lib/notifications";
import {
  MOCK_TESTS, CATEGORY_META, LABEL_META, DIFFICULTY_COLOR, DIFFICULTY_BAR,
  MockCategory, MockTest,
} from "@/lib/mockTests";

type TestState = "list" | "running" | "analysis";
type FilterCategory = "All" | MockCategory;

const ALL_CATEGORIES: FilterCategory[] = [
  "All", "Full", "Sectional", "Adaptive", "Speed", "Topic",
  "Beginner", "Intermediate", "Advanced", "PYQ", "Mini", "Marathon", "XAT",
];

// ── AI Insight banner ─────────────────────────────────────────────────────────

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

// ── Mock Test Card ─────────────────────────────────────────────────────────────

function MockCard({ test, onStart }: { test: MockTest; onStart: () => void }) {
  const catMeta = CATEGORY_META[test.category];
  const diffColor = DIFFICULTY_COLOR[test.difficulty];
  const diffBar = DIFFICULTY_BAR[test.difficulty];
  const isNew = test.attempts === 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "glass rounded-2xl border border-white/5 overflow-hidden group transition-all duration-300",
        "hover:border-white/12 hover:shadow-[0_0_28px_rgba(0,212,255,0.10)]",
      )}
    >
      {/* Card top stripe — category colour */}
      <div className={cn("h-0.5 w-full bg-gradient-to-r", getCategoryGradient(test.category))} />

      <div className="p-5">
        {/* Top row: category + labels */}
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

        {/* Title + description */}
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

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Questions", value: test.questions, icon: FileText },
            { label: "Duration", value: `${test.duration}m`, icon: Clock },
            { label: "Attempts", value: test.attempts, icon: Trophy },
          ].map((s) => (
            <div key={s.label} className="bg-white/3 rounded-xl py-2 px-1 text-center border border-white/5">
              <div className="text-sm font-bold text-white/90">{s.value}</div>
              <div className="text-[10px] text-white/30 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Accuracy + XP row */}
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
              <span className="text-neon-purple font-semibold">+{test.percentileGain}%ile</span> gain
            </span>
          )}
          <span className="ml-auto flex items-center gap-1">
            <Zap size={10} className="text-yellow-400" />
            <span className="text-yellow-400 font-semibold">{test.xpReward} XP</span>
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          aria-label={`${isNew ? "Start" : "Retake"} ${test.name}`}
          className={cn(
            "w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95",
            isNew
              ? "bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-[0_0_14px_rgba(0,212,255,0.25)] hover:shadow-[0_0_22px_rgba(0,212,255,0.4)]"
              : "bg-white/8 text-white/70 hover:bg-white/12 border border-white/10",
          )}
        >
          <Play size={12} fill="currentColor" />
          {isNew ? "Start Test" : "Retake Test"}
        </button>
      </div>
    </motion.article>
  );
}

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

// ── Mock Test Interface (running state) ───────────────────────────────────────

function MockTestInterface({ onFinish }: { onFinish: (answers: Record<number, number>) => void }) {
  const questions = SAMPLE_QUESTIONS;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(40 * 60);
  const [section, setSection] = useState<"varc" | "dilr" | "qa">("varc");

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timer); onFinish(answers); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [answers, onFinish]);

  const currentQ = questions[currentIdx] || questions[0];
  const answered = Object.keys(answers).length;

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
              { label: "Answered",     color: "bg-green-500",    count: answered },
              { label: "Marked",       color: "bg-yellow-500",   count: marked.size },
              { label: "Not Answered", color: "bg-white/20",     count: questions.length - answered - marked.size },
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

// ── Test Analysis ─────────────────────────────────────────────────────────────

function TestAnalysis({ onBack }: { onBack: () => void }) {
  const sectionScores = [
    { section: "VARC", score: 42, total: 72, percentile: 82, correct: 14, wrong: 3, unattempted: 7 },
    { section: "DILR", score: 36, total: 60, percentile: 72, correct: 12, wrong: 6, unattempted: 2 },
    { section: "QA",   score: 54, total: 66, percentile: 88, correct: 18, wrong: 0, unattempted: 4 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 glass rounded-xl text-white/50 hover:text-white border border-white/8">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-bold">Test Analysis</h2>
          <p className="text-white/40 text-sm">Detailed Breakdown — AI Powered</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: "Overall Percentile", value: "89.2", sub: "↑ 3.7 from last mock", color: "text-yellow-400" },
          { label: "Total Score", value: "132/198", sub: "66.7% score", color: "text-neon-blue" },
          { label: "Accuracy", value: "81%", sub: "44 correct, 9 wrong", color: "text-green-400" },
          { label: "Time Used", value: "112/120m", sub: "8 min remaining", color: "text-purple-400" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 border border-white/5 text-center">
            <div className={cn("text-3xl font-bold mb-1", s.color)}>{s.value}</div>
            <div className="text-sm font-medium text-white/70">{s.label}</div>
            <div className="text-xs text-white/30 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-5 border border-white/5">
        <h3 className="font-semibold mb-4">Section-wise Performance</h3>
        <div className="space-y-4">
          {sectionScores.map((s) => (
            <div key={s.section} className="p-4 bg-white/3 rounded-xl border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">{s.section}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-400">+{s.correct * 3}</span>
                  <span className="text-red-400">-{s.wrong}</span>
                  <span className="font-bold text-neon-blue">{s.percentile}%ile</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                <div className="bg-green-500/10 rounded-lg p-2">
                  <div className="text-green-400 font-bold text-lg">{s.correct}</div>
                  <div className="text-white/30">Correct</div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-2">
                  <div className="text-red-400 font-bold text-lg">{s.wrong}</div>
                  <div className="text-white/30">Wrong</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="text-white/40 font-bold text-lg">{s.unattempted}</div>
                  <div className="text-white/30">Skipped</div>
                </div>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-neon-blue to-neon-purple rounded-full"
                  style={{ width: `${(s.score / s.total) * 100}%` }}
                />
              </div>
              <div className="text-xs text-white/30 mt-1">Score: {s.score}/{s.total}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5 border border-neon-blue/20 bg-neon-blue/3">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={20} className="text-neon-blue" />
          <h3 className="font-semibold">AI Performance Insights</h3>
        </div>
        <div className="space-y-3">
          {[
            { type: "strength", text: "QA: Excellent performance in Arithmetic (100% accuracy). Time management was efficient." },
            { type: "warning",  text: "DILR: Spent 18 min on 2 questions you got wrong — skip strategy needed for Games & Tournament sets." },
            { type: "tip",      text: "VARC: Reading speed is good but Para Summary accuracy is 40% — dedicate 3 sessions this week." },
            { type: "predict",  text: "If you improve DILR to 80%ile, your overall percentile jumps to 94+." },
          ].map((insight, i) => (
            <div key={i} className={cn(
              "flex items-start gap-3 p-3 rounded-xl",
              insight.type === "strength" && "bg-green-500/10 border border-green-500/20",
              insight.type === "warning"  && "bg-orange-500/10 border border-orange-500/20",
              insight.type === "tip"      && "bg-blue-500/10 border border-blue-500/20",
              insight.type === "predict"  && "bg-neon-purple/10 border border-neon-purple/20",
            )}>
              {insight.type === "strength" && <CheckCircle  size={15} className="text-green-400 mt-0.5 flex-shrink-0" />}
              {insight.type === "warning"  && <AlertCircle  size={15} className="text-orange-400 mt-0.5 flex-shrink-0" />}
              {insight.type === "tip"      && <Lightbulb    size={15} className="text-blue-400 mt-0.5 flex-shrink-0" />}
              {insight.type === "predict"  && <TrendingUp   size={15} className="text-neon-purple mt-0.5 flex-shrink-0" />}
              <p className="text-sm text-white/70">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 py-3 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl text-sm font-semibold">
          Practice Weak Areas
        </button>
        <button onClick={onBack} className="flex-1 py-3 glass rounded-xl text-sm font-semibold text-white/60 border border-white/10">
          Back to Tests
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MockTestsPage() {
  const [testState, setTestState]   = useState<TestState>("list");
  const [category, setCategory]     = useState<FilterCategory>("All");
  const [search, setSearch]         = useState("");
  const [showSearch, setShowSearch] = useState(false);

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
    for (const t of MOCK_TESTS) {
      m[t.category] = (m[t.category] ?? 0) + 1;
    }
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

  if (testState === "running")  return <MockTestInterface onFinish={handleFinish} />;
  if (testState === "analysis") return <TestAnalysis onBack={() => setTestState("list")} />;

  // Grouped for the "All" view
  const aiPicks    = MOCK_TESTS.filter((t) => t.labels.includes("ai-recommended")).slice(0, 3);
  const trending   = MOCK_TESTS.filter((t) => t.labels.includes("trending")).slice(0, 3);
  const showGroups = category === "All" && !search.trim();

  return (
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
        </div>
      </div>

      {/* ── AI Insight Banner ── */}
      <AIInsightBanner />

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Best Percentile", value: "91.2", sub: "CAT Full Mock #2",   color: "text-yellow-400",   icon: Trophy },
          { label: "Avg Percentile",  value: "84.6", sub: "last 5 mocks",       color: "text-neon-blue",    icon: BarChart2 },
          { label: "Avg Accuracy",    value: "74%",  sub: "needs improvement",  color: "text-green-400",    icon: Target },
          { label: "Percentile Trend",value: "↑ +6.6",sub: "vs last month",    color: "text-neon-purple",  icon: TrendingUp },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <s.icon size={14} className={cn(s.color, "opacity-70")} />
            </div>
            <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
            <div className="text-xs font-medium text-white/60 mt-0.5">{s.label}</div>
            <div className="text-[10px] text-white/25 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Category Filter Tabs ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-white/30" />
          <span className="text-xs text-white/30 uppercase tracking-wider font-semibold">Category</span>
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
            const meta = cat !== "All" ? CATEGORY_META[cat] : null;
            const count = categoryCounts[cat] ?? 0;
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

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        {showGroups ? (
          <motion.div key="grouped" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* AI Recommended */}
            <Section
              title="AI Recommended for You"
              icon={<Brain size={14} className="text-neon-blue" />}
              color="text-neon-blue"
              tests={aiPicks}
              onStart={() => setTestState("running")}
            />

            {/* Trending */}
            <Section
              title="Trending This Week"
              icon={<Flame size={14} className="text-orange-400" />}
              color="text-orange-400"
              tests={trending}
              onStart={() => setTestState("running")}
            />

            {/* All tests grouped by category */}
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
                  onStart={() => setTestState("running")}
                />
              );
            })}
          </motion.div>
        ) : (
          <motion.div key={category + search} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-white/30 text-sm">
                No tests found matching your filters.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((test) => (
                  <MockCard key={test.id} test={test} onStart={() => setTestState("running")} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Section helper ─────────────────────────────────────────────────────────────

function Section({
  title, subtitle, icon, color, tests, onStart,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  tests: MockTest[];
  onStart: () => void;
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
          <MockCard key={test.id} test={test} onStart={onStart} />
        ))}
      </div>
    </div>
  );
}
