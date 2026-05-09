"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Clock, ChevronRight, Play, Trophy, BarChart2, Target, Lightbulb,
  CheckCircle, XCircle, Bookmark, Flag, AlertCircle, ArrowLeft,
  TrendingUp, Brain, Award, FileText, Zap, Star
} from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { SAMPLE_QUESTIONS } from "@/lib/data";

type TestState = "list" | "running" | "analysis";

const MOCK_TESTS = [
  { id: 1, name: "CAT Full Mock #1", type: "Full", questions: 66, duration: 120, difficulty: "CAT Level", attempts: 2, bestPercentile: 88.5 },
  { id: 2, name: "CAT Full Mock #2", type: "Full", questions: 66, duration: 120, difficulty: "CAT Level", attempts: 1, bestPercentile: 91.2 },
  { id: 3, name: "VARC Sectional #1", type: "Sectional", questions: 24, duration: 40, difficulty: "Advanced", attempts: 3, bestPercentile: 78 },
  { id: 4, name: "DILR Sectional #1", type: "Sectional", questions: 20, duration: 40, difficulty: "Advanced", attempts: 1, bestPercentile: 65 },
  { id: 5, name: "QA Speed Challenge", type: "Speed", questions: 30, duration: 30, difficulty: "Mixed", attempts: 0, bestPercentile: null },
  { id: 6, name: "XAT Mock #1", type: "Full", questions: 105, duration: 190, difficulty: "CAT Level", attempts: 0, bestPercentile: null },
  { id: 7, name: "Adaptive Mock #1", type: "Adaptive", questions: 40, duration: 60, difficulty: "Dynamic", attempts: 1, bestPercentile: 85 },
  { id: 8, name: "QA Topic Test - Number System", type: "Topic", questions: 20, duration: 25, difficulty: "Intermediate", attempts: 2, bestPercentile: null },
];

const TestCard = ({ test, onStart }: { test: typeof MOCK_TESTS[0]; onStart: () => void }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="glass rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all card-hover"
  >
    <div className="flex items-start justify-between mb-3">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            "text-xs font-bold px-2 py-0.5 rounded",
            test.type === "Full" ? "bg-neon-blue/20 text-neon-blue" :
            test.type === "Sectional" ? "bg-purple-500/20 text-purple-400" :
            test.type === "Adaptive" ? "bg-yellow-500/20 text-yellow-400" :
            test.type === "Speed" ? "bg-red-500/20 text-red-400" :
            "bg-green-500/20 text-green-400"
          )}>
            {test.type}
          </span>
          {test.attempts === 0 && (
            <span className="text-xs bg-green-400/10 text-green-400 px-2 py-0.5 rounded">New</span>
          )}
        </div>
        <h3 className="font-semibold">{test.name}</h3>
      </div>
      {test.bestPercentile && (
        <div className="text-right">
          <div className="text-lg font-bold text-yellow-400">{test.bestPercentile}</div>
          <div className="text-xs text-white/30">Best %ile</div>
        </div>
      )}
    </div>

    <div className="grid grid-cols-3 gap-3 mb-4">
      {[
        { label: "Questions", value: test.questions, icon: FileText },
        { label: "Duration", value: `${test.duration}m`, icon: Clock },
        { label: "Attempts", value: test.attempts, icon: Trophy },
      ].map((s) => (
        <div key={s.label} className="text-center">
          <div className="text-sm font-bold">{s.value}</div>
          <div className="text-xs text-white/30">{s.label}</div>
        </div>
      ))}
    </div>

    <button
      onClick={onStart}
      className={cn(
        "w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
        test.attempts === 0
          ? "bg-gradient-to-r from-neon-blue to-neon-purple text-white hover:opacity-90"
          : "bg-white/8 text-white/70 hover:bg-white/12 border border-white/10"
      )}
    >
      <Play size={14} />
      {test.attempts === 0 ? "Start Test" : "Retake Test"}
    </button>
  </motion.div>
);

const MockTestInterface = ({ onFinish }: { onFinish: (answers: Record<number, number>) => void }) => {
  const questions = SAMPLE_QUESTIONS;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(40 * 60); // 40 minutes demo
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
  const attempted = questions.length;

  const getQStatus = (idx: number) => {
    if (marked.has(idx)) return "marked";
    if (answers[idx] !== undefined) return "answered";
    if (idx === currentIdx) return "current";
    return "unanswered";
  };

  return (
    <div className="fixed inset-0 bg-dark-900 z-50 flex flex-col">
      {/* Test Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-dark-800 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-neon-blue" />
            <span className="font-bold text-neon-blue">CATalyst AI</span>
          </div>
          <span className="text-white/30">|</span>
          <span className="text-sm text-white/60">CAT Full Mock #2</span>
        </div>

        {/* Section switcher */}
        <div className="flex gap-2">
          {(["varc", "dilr", "qa"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg font-semibold uppercase transition-all",
                section === s ? "bg-neon-blue/20 text-neon-blue" : "text-white/40 hover:text-white"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Timer */}
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg",
          timeLeft < 300 ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-dark-600 text-white"
        )}>
          <Clock size={18} />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Question Panel */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs text-white/40">Question {currentIdx + 1} of {questions.length}</span>
              <span className={cn("text-xs px-2 py-0.5 rounded capitalize",
                currentQ.difficulty === "cat level" ? "bg-red-500/20 text-red-400" :
                currentQ.difficulty === "advanced" ? "bg-orange-500/20 text-orange-400" :
                "bg-green-500/20 text-green-400"
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
                        : "bg-white/3 border-white/8 text-white/80 hover:bg-white/6 hover:border-white/15"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
                      answers[currentIdx] === idx ? "bg-neon-blue text-dark-900" : "bg-white/8 text-white/50"
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Question Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                className="px-4 py-2 glass rounded-xl text-sm text-white/60 hover:text-white border border-white/8"
              >
                ← Previous
              </button>
              <button
                onClick={() => {
                  const newMarked = new Set(marked);
                  if (newMarked.has(currentIdx)) newMarked.delete(currentIdx);
                  else newMarked.add(currentIdx);
                  setMarked(newMarked);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all",
                  marked.has(currentIdx)
                    ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                    : "glass border-white/8 text-white/60 hover:text-white"
                )}
              >
                <Bookmark size={14} />
                {marked.has(currentIdx) ? "Marked" : "Mark for Review"}
              </button>
              <button
                onClick={() => setAnswers({ ...answers })}
                className="px-4 py-2 glass rounded-xl text-sm text-white/60 hover:text-white border border-white/8"
              >
                Clear Response
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

        {/* Question Palette */}
        <div className="w-64 bg-dark-800 border-l border-white/5 p-4 overflow-y-auto">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Question Palette</h3>

          <div className="space-y-2 mb-4">
            {[
              { label: "Answered", color: "bg-green-500", count: answered },
              { label: "Not Answered", color: "bg-red-500/60", count: attempted - answered - marked.size },
              { label: "Marked", color: "bg-yellow-500", count: marked.size },
              { label: "Not Visited", color: "bg-white/20", count: attempted - answered - marked.size },
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
                  getQStatus(idx) === "answered" && "bg-green-500/80 text-white",
                  getQStatus(idx) === "marked" && "bg-yellow-500/80 text-dark-900",
                  getQStatus(idx) === "current" && "bg-neon-blue text-dark-900 ring-2 ring-neon-blue ring-offset-1 ring-offset-dark-800",
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
};

const TestAnalysis = ({ onBack }: { onBack: () => void }) => {
  const sectionScores = [
    { section: "VARC", score: 42, total: 72, percentile: 82, correct: 14, wrong: 3, unattempted: 7 },
    { section: "DILR", score: 36, total: 60, percentile: 72, correct: 12, wrong: 6, unattempted: 2 },
    { section: "QA", score: 54, total: 66, percentile: 88, correct: 18, wrong: 0, unattempted: 4 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 glass rounded-xl text-white/50 hover:text-white border border-white/8">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-bold">Test Analysis</h2>
          <p className="text-white/40 text-sm">CAT Full Mock #2 — Detailed Breakdown</p>
        </div>
      </div>

      {/* Overall Score */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: "Overall Percentile", value: "89.2", sub: "↑ 3.7 from last mock", color: "text-yellow-400", big: true },
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

      {/* Section breakdown */}
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
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
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

      {/* AI Insights */}
      <div className="glass rounded-2xl p-5 border border-neon-blue/20 bg-neon-blue/3">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={20} className="text-neon-blue" />
          <h3 className="font-semibold">AI Performance Insights</h3>
        </div>
        <div className="space-y-3">
          {[
            { type: "strength", text: "QA: Excellent performance in Arithmetic (100% accuracy). Time management was efficient." },
            { type: "warning", text: "DILR: Struggled with Games & Tournaments sets. Spent 18 min on 2 questions that you got wrong — skip strategy needed." },
            { type: "tip", text: "VARC: Reading speed is good. But Para Summary accuracy is 40% — focus on this topic this week." },
            { type: "predict", text: "If you improve DILR to 80%ile, your overall percentile will jump to 94+" },
          ].map((insight, i) => (
            <div key={i} className={cn(
              "flex items-start gap-3 p-3 rounded-xl",
              insight.type === "strength" && "bg-green-500/10 border border-green-500/20",
              insight.type === "warning" && "bg-orange-500/10 border border-orange-500/20",
              insight.type === "tip" && "bg-blue-500/10 border border-blue-500/20",
              insight.type === "predict" && "bg-neon-purple/10 border border-neon-purple/20",
            )}>
              {insight.type === "strength" && <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />}
              {insight.type === "warning" && <AlertCircle size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />}
              {insight.type === "tip" && <Lightbulb size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />}
              {insight.type === "predict" && <TrendingUp size={16} className="text-neon-purple mt-0.5 flex-shrink-0" />}
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
};

export default function MockTestsPage() {
  const [testState, setTestState] = useState<TestState>("list");
  const [filter, setFilter] = useState("All");

  const filters = ["All", "Full", "Sectional", "Adaptive", "Speed", "Topic"];
  const filtered = filter === "All" ? MOCK_TESTS : MOCK_TESTS.filter((t) => t.type === filter);

  const handleFinish = useCallback(() => {
    setTestState("analysis");
  }, []);

  if (testState === "running") return <MockTestInterface onFinish={handleFinish} />;
  if (testState === "analysis") return <TestAnalysis onBack={() => setTestState("list")} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mock Tests</h1>
          <p className="text-white/40 mt-1 text-sm">Simulate real CAT pressure. Track your growth.</p>
        </div>
        <div className="glass px-4 py-2 rounded-xl border border-white/5 text-center">
          <div className="text-xl font-bold text-yellow-400">11</div>
          <div className="text-xs text-white/30">Tests Taken</div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Best Percentile", value: "91.2", color: "text-yellow-400" },
          { label: "Avg Percentile", value: "84.6", color: "text-neon-blue" },
          { label: "Avg Accuracy", value: "74%", color: "text-green-400" },
          { label: "Trend", value: "↑ +6.6", color: "text-neon-purple" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 border border-white/5 text-center">
            <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
            <div className="text-xs text-white/30 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "text-sm px-4 py-2 rounded-xl border transition-all",
              filter === f
                ? "bg-neon-blue/20 border-neon-blue/30 text-neon-blue"
                : "glass border-white/10 text-white/40 hover:text-white"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Test Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((test) => (
          <TestCard key={test.id} test={test} onStart={() => setTestState("running")} />
        ))}
      </div>
    </div>
  );
}
