"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Brain, TrendingUp, AlertCircle, CheckCircle, Lightbulb,
  Target, Clock, BarChart2, BookOpen, Zap, ChevronDown, ChevronUp,
  RotateCcw, Star, ArrowRight, Trophy, Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MOCK_ANALYSIS_DATA,
  MISTAKE_TYPE_CONFIG, PRIORITY_CONFIG, REVISION_PRIORITY_CONFIG,
  MistakeRecord, SectionScore, WeaknessEntry, RevisionItem,
  PercentileRecord, TimeAnalysisItem,
} from "@/lib/mockAnalysis";

// ─────────────────────────────────────────────────────────────────────────────
// Tab definitions
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "overview" | "mistakes" | "weakness" | "revision" | "growth" | "time" | "report";

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: "overview",  label: "Overview",    icon: <BarChart2 size={13} /> },
  { id: "mistakes",  label: "Mistakes",    icon: <AlertCircle size={13} /> },
  { id: "weakness",  label: "Weakness Map",icon: <Target size={13} /> },
  { id: "revision",  label: "Revision",    icon: <BookOpen size={13} /> },
  { id: "growth",    label: "Growth",      icon: <TrendingUp size={13} /> },
  { id: "time",      label: "Time",        icon: <Clock size={13} /> },
  { id: "report",    label: "AI Report",   icon: <Brain size={13} /> },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function SectionLabel({ section }: { section: "VARC" | "DILR" | "QA" }) {
  const colors = {
    VARC: "bg-purple-500/20 text-purple-400 border-purple-500/25",
    DILR: "bg-green-500/20 text-green-400 border-green-500/25",
    QA:   "bg-blue-500/20 text-blue-400 border-blue-500/25",
  };
  return (
    <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase", colors[section])}>
      {section}
    </span>
  );
}

function AccuracyBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color =
    pct >= 80 ? "from-green-500 to-emerald-400" :
    pct >= 60 ? "from-yellow-500 to-orange-400" :
    "from-red-500 to-rose-400";
  return (
    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className={cn("h-full rounded-full bg-gradient-to-r", color)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview Tab
// ─────────────────────────────────────────────────────────────────────────────

function OverviewTab() {
  const d = MOCK_ANALYSIS_DATA;

  return (
    <div className="space-y-5">
      {/* Overall stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Overall Percentile", value: `${d.overallPercentile}%ile`, sub: "Top 11% in India",       color: "text-yellow-400" },
          { label: "Total Score",        value: `${d.totalScore}/${d.maxScore}`, sub: `${Math.round((d.totalScore/d.maxScore)*100)}% score`, color: "text-neon-blue" },
          { label: "Accuracy",           value: `${d.overallAccuracy}%`,      sub: `${d.correct}C / ${d.wrong}W / ${d.unattempted}U`, color: "text-green-400" },
          { label: "Time Used",          value: `${d.timeTaken}/${d.timeAllotted}m`, sub: `${d.timeAllotted - d.timeTaken} min remaining`, color: "text-purple-400" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 border border-white/5 text-center">
            <div className={cn("text-2xl font-bold mb-1", s.color)}>{s.value}</div>
            <div className="text-xs font-medium text-white/60">{s.label}</div>
            <div className="text-[10px] text-white/30 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Section breakdown */}
      <div className="glass rounded-2xl p-5 border border-white/5">
        <h3 className="text-sm font-bold mb-4">Section-wise Performance</h3>
        <div className="space-y-4">
          {d.sectionScores.map((s) => (
            <SectionRow key={s.section} s={s} />
          ))}
        </div>
      </div>

      {/* Difficulty performance */}
      <div className="glass rounded-2xl p-5 border border-white/5">
        <h3 className="text-sm font-bold mb-4">Difficulty-wise Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {d.difficultyPerformance.map((dp) => {
            const color =
              dp.accuracy >= 80 ? "text-green-400" :
              dp.accuracy >= 60 ? "text-yellow-400" :
              dp.accuracy >= 40 ? "text-orange-400" : "text-red-400";
            return (
              <div key={dp.difficulty} className="bg-white/3 rounded-xl p-3 border border-white/5">
                <div className="text-[10px] text-white/40 uppercase tracking-wide mb-1">{dp.difficulty}</div>
                <div className={cn("text-2xl font-bold", color)}>{dp.accuracy}%</div>
                <div className="text-[10px] text-white/30 mt-0.5">{dp.correct}/{dp.attempted} correct</div>
                <AccuracyBar value={dp.accuracy} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Topic accuracy */}
      <div className="glass rounded-2xl p-5 border border-white/5">
        <h3 className="text-sm font-bold mb-4">Topic-wise Accuracy</h3>
        <div className="space-y-3">
          {d.topicAccuracy
            .sort((a, b) => a.accuracy - b.accuracy)
            .map((t) => (
              <div key={t.topic} className="flex items-center gap-3">
                <SectionLabel section={t.section} />
                <span className="text-xs text-white/60 w-40 truncate flex-shrink-0">{t.topic}</span>
                <div className="flex-1">
                  <AccuracyBar value={t.accuracy} />
                </div>
                <span className={cn(
                  "text-xs font-bold w-10 text-right flex-shrink-0",
                  t.accuracy >= 80 ? "text-green-400" :
                  t.accuracy >= 60 ? "text-yellow-400" : "text-red-400",
                )}>
                  {t.accuracy}%
                </span>
                <span className="text-[10px] text-white/25 w-14 text-right flex-shrink-0">
                  {t.correct}/{t.attempted}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function SectionRow({ s }: { s: SectionScore }) {
  const sectionColor = {
    VARC: "from-purple-500 to-pink-500",
    DILR: "from-green-500 to-teal-400",
    QA:   "from-neon-blue to-neon-purple",
  }[s.section];

  return (
    <div className="p-4 bg-white/3 rounded-xl border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SectionLabel section={s.section} />
          <span className="font-semibold text-sm">{s.section}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-green-400 font-medium">+{s.correct * 3}</span>
          <span className="text-red-400 font-medium">-{s.wrong}</span>
          <span className="font-bold text-yellow-400">{s.percentile}%ile</span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
        {[
          { label: "Correct",   value: s.correct,     color: "text-green-400 bg-green-500/10" },
          { label: "Wrong",     value: s.wrong,       color: "text-red-400 bg-red-500/10" },
          { label: "Skipped",   value: s.unattempted, color: "text-white/40 bg-white/5" },
          { label: "Time",      value: `${s.timeSpent}m`, color: s.timeSpent > s.timeAllotted ? "text-red-400 bg-red-500/10" : "text-neon-blue bg-neon-blue/10" },
        ].map((c) => (
          <div key={c.label} className={cn("rounded-lg p-2", c.color)}>
            <div className="font-bold text-base">{c.value}</div>
            <div className="text-white/30 text-[9px]">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(s.score / s.total) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full bg-gradient-to-r", sectionColor)}
        />
      </div>
      <div className="text-[10px] text-white/30 mt-1">Score: {s.score}/{s.total}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mistakes Tab
// ─────────────────────────────────────────────────────────────────────────────

function MistakesTab({ onRetry }: { onRetry: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [sectionFilter, setSectionFilter] = useState<"All" | "VARC" | "DILR" | "QA">("All");

  const mistakes = MOCK_ANALYSIS_DATA.mistakes.filter(
    (m) => sectionFilter === "All" || m.section === sectionFilter,
  );

  return (
    <div className="space-y-4">
      {/* Section filter */}
      <div className="flex gap-2">
        {(["All", "VARC", "DILR", "QA"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSectionFilter(s)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-xl border font-medium transition-all",
              sectionFilter === s
                ? "bg-neon-blue/20 border-neon-blue/30 text-neon-blue"
                : "glass border-white/8 text-white/40 hover:text-white",
            )}
          >
            {s} {s !== "All" && `(${MOCK_ANALYSIS_DATA.mistakes.filter((m) => m.section === s).length})`}
          </button>
        ))}
        <div className="ml-auto text-xs text-white/30 flex items-center">
          {mistakes.length} mistake{mistakes.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Mistake cards */}
      {mistakes.map((m) => (
        <MistakeCard
          key={m.id}
          mistake={m}
          isExpanded={expanded === m.id}
          onToggle={() => setExpanded(expanded === m.id ? null : m.id)}
          onRetry={onRetry}
        />
      ))}
    </div>
  );
}

function MistakeCard({
  mistake, isExpanded, onToggle, onRetry,
}: {
  mistake: MistakeRecord;
  isExpanded: boolean;
  onToggle: () => void;
  onRetry: () => void;
}) {
  const typeCfg = MISTAKE_TYPE_CONFIG[mistake.mistakeType];
  const timeOver = mistake.timeSpent > 120;

  return (
    <div className={cn(
      "glass rounded-2xl border overflow-hidden transition-all",
      isExpanded ? "border-white/12" : "border-white/5 hover:border-white/10",
    )}>
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-start gap-3 text-left"
        aria-expanded={isExpanded}
      >
        <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-red-400">Q{mistake.questionNum}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <SectionLabel section={mistake.section} />
            <span className="text-[10px] text-white/35">{mistake.topic}</span>
            <span className={cn("text-[10px] px-2 py-0.5 rounded border font-semibold", typeCfg.color)}>
              {typeCfg.short}
            </span>
            {timeOver && (
              <span className="text-[10px] px-2 py-0.5 rounded border bg-orange-500/15 text-orange-400 border-orange-500/25">
                ⏱ {Math.round(mistake.timeSpent / 60)}m {mistake.timeSpent % 60}s
              </span>
            )}
          </div>
          <p className="text-xs text-white/55 line-clamp-2 leading-relaxed">
            {mistake.questionText}
          </p>
        </div>
        <span className="text-white/30 flex-shrink-0 mt-1">
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
              {/* Full question */}
              <div className="p-3 bg-white/3 rounded-xl border border-white/5">
                <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">{mistake.questionText}</p>
              </div>

              {/* Answer options */}
              <div className="space-y-2">
                {mistake.options.map((opt, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border text-sm",
                      idx === mistake.correctIdx
                        ? "bg-green-500/10 border-green-500/25 text-green-300"
                        : idx === mistake.selectedIdx
                          ? "bg-red-500/10 border-red-500/25 text-red-300"
                          : "bg-white/2 border-white/5 text-white/40",
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
                      idx === mistake.correctIdx ? "bg-green-500/30" :
                      idx === mistake.selectedIdx ? "bg-red-500/30" : "bg-white/8",
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="flex-1">{opt}</span>
                    {idx === mistake.correctIdx && (
                      <span className="text-[10px] text-green-400 font-bold flex-shrink-0">✓ Correct</span>
                    )}
                    {idx === mistake.selectedIdx && idx !== mistake.correctIdx && (
                      <span className="text-[10px] text-red-400 font-bold flex-shrink-0">✗ Your answer</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Concept gap */}
              <div className="p-3 rounded-xl bg-orange-500/8 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertCircle size={13} className="text-orange-400" />
                  <span className="text-xs font-bold text-orange-400">Concept Gap</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">{mistake.conceptGap}</p>
              </div>

              {/* Shortcut method */}
              <div className="p-3 rounded-xl bg-neon-blue/8 border border-neon-blue/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap size={13} className="text-neon-blue" />
                  <span className="text-xs font-bold text-neon-blue">Shortcut Method</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">{mistake.shortcutMethod}</p>
              </div>

              {/* AI explanation */}
              <div className="p-3 rounded-xl bg-neon-purple/8 border border-neon-purple/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <Brain size={13} className="text-neon-purple" />
                  <span className="text-xs font-bold text-neon-purple">AI Explanation</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">{mistake.aiExplanation}</p>
              </div>

              {/* Retry button */}
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 bg-neon-blue/15 border border-neon-blue/25 rounded-xl text-xs text-neon-blue font-semibold hover:bg-neon-blue/25 transition-all"
              >
                <RotateCcw size={11} /> Retry This Question
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Weakness Map Tab
// ─────────────────────────────────────────────────────────────────────────────

function WeaknessTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/15">
        <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
        <p className="text-xs text-white/60">
          <span className="text-red-400 font-semibold">AI detected {MOCK_ANALYSIS_DATA.weaknesses.length} weaknesses</span>
          {" "}— sorted by impact on your percentile. Fix Critical gaps first.
        </p>
      </div>

      {MOCK_ANALYSIS_DATA.weaknesses.map((w, i) => (
        <WeaknessCard key={w.topic} entry={w} rank={i + 1} />
      ))}
    </div>
  );
}

function WeaknessCard({ entry, rank }: { entry: WeaknessEntry; rank: number }) {
  const priorityCfg = PRIORITY_CONFIG[entry.priority];
  const potentialGain = entry.priority === "Critical" ? "8–12" : entry.priority === "High" ? "4–7" : "2–3";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.06 }}
      className="glass rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
            rank === 1 ? "bg-red-500/30 text-red-400" :
            rank === 2 ? "bg-orange-500/30 text-orange-400" : "bg-yellow-500/30 text-yellow-400",
          )}>
            {rank}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{entry.topic}</h3>
              <SectionLabel section={entry.section} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn("text-[10px] px-2 py-0.5 rounded border font-bold", priorityCfg.color)}>
            <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1", priorityCfg.dot)} />
            {entry.priority}
          </span>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/3 rounded-xl p-2.5 text-center border border-white/5">
          <div className={cn(
            "text-lg font-bold",
            entry.accuracy < 40 ? "text-red-400" :
            entry.accuracy < 60 ? "text-orange-400" : "text-yellow-400",
          )}>
            {entry.accuracy}%
          </div>
          <div className="text-[9px] text-white/30">Accuracy</div>
          <AccuracyBar value={entry.accuracy} />
        </div>
        <div className="bg-white/3 rounded-xl p-2.5 text-center border border-white/5">
          <div className="text-lg font-bold text-orange-400">{entry.timeLoss}m</div>
          <div className="text-[9px] text-white/30">Time Lost</div>
        </div>
        <div className="bg-white/3 rounded-xl p-2.5 text-center border border-white/5">
          <div className="text-lg font-bold text-neon-purple">+{potentialGain}</div>
          <div className="text-[9px] text-white/30">%ile Gain</div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-2">
        <div className="flex items-start gap-2 text-xs">
          <Play size={10} className="text-neon-blue mt-0.5 flex-shrink-0" />
          <span className="text-white/50">
            <span className="text-neon-blue font-semibold">Next mock: </span>
            {entry.recommendedMock}
          </span>
        </div>
        <div className="flex items-start gap-2 text-xs">
          <BookOpen size={10} className="text-neon-purple mt-0.5 flex-shrink-0" />
          <span className="text-white/50">
            <span className="text-neon-purple font-semibold">Revise: </span>
            {entry.recommendedRevision}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Revision Queue Tab
// ─────────────────────────────────────────────────────────────────────────────

function RevisionTab({ onStart }: { onStart: () => void }) {
  const totalTime = MOCK_ANALYSIS_DATA.revisionQueue.reduce((acc, r) => {
    const mins = parseInt(r.estimatedTime);
    return acc + (isNaN(mins) ? 0 : mins);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-neon-purple/8 border border-neon-purple/15">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-neon-purple" />
          <span className="text-xs text-white/60">
            <span className="text-neon-purple font-semibold">{MOCK_ANALYSIS_DATA.revisionQueue.length} topics</span> in revision queue
          </span>
        </div>
        <span className="text-xs text-white/40">~{totalTime} min total</span>
      </div>

      {/* Queue list */}
      <div className="space-y-3">
        {MOCK_ANALYSIS_DATA.revisionQueue.map((item, i) => (
          <RevisionCard key={item.id} item={item} index={i} onStart={onStart} />
        ))}
      </div>
    </div>
  );
}

function RevisionCard({ item, index, onStart }: { item: RevisionItem; index: number; onStart: () => void }) {
  const cfg = REVISION_PRIORITY_CONFIG[item.priority];
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass rounded-2xl border border-white/5 p-4 flex items-center gap-4 hover:border-white/10 transition-all"
    >
      {/* Priority rank */}
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border flex-shrink-0", cfg.color)}>
        {item.priority}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold truncate">{item.topic}</span>
          <SectionLabel section={item.section} />
        </div>
        <div className="flex items-center gap-3 text-[11px] text-white/35">
          <span>{item.wrongCount} wrong answer{item.wrongCount !== 1 ? "s" : ""}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock size={9} /> {item.estimatedTime}
          </span>
        </div>
      </div>

      {/* Start revision button */}
      <button
        onClick={onStart}
        className="flex items-center gap-1.5 px-3 py-2 bg-neon-purple/15 border border-neon-purple/25 rounded-xl text-xs text-neon-purple font-semibold hover:bg-neon-purple/25 transition-all flex-shrink-0"
      >
        <Play size={10} fill="currentColor" /> Start
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Growth Tracker Tab
// ─────────────────────────────────────────────────────────────────────────────

function GrowthTab() {
  const history = MOCK_ANALYSIS_DATA.percentileHistory;
  const min = Math.min(...history.map((h) => h.percentile)) - 5;
  const max = 100;
  const range = max - min;
  const best    = Math.max(...history.map((h) => h.percentile));
  const avg     = parseFloat((history.reduce((s, h) => s + h.percentile, 0) / history.length).toFixed(1));
  const first   = history[0].percentile;
  const latest  = history[history.length - 1].percentile;
  const trend   = parseFloat((latest - first).toFixed(1));
  const target  = 95;
  const gap     = parseFloat((target - latest).toFixed(1));

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Best Percentile",    value: `${best}%ile`,          color: "text-yellow-400" },
          { label: "Average Percentile", value: `${avg}%ile`,           color: "text-neon-blue"  },
          { label: "Improvement Trend",  value: `↑ +${trend}%ile`,      color: "text-green-400"  },
          { label: "Gap to 95%ile",      value: gap > 0 ? `${gap}%ile` : "Achieved!", color: gap > 0 ? "text-orange-400" : "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 border border-white/5 text-center">
            <div className={cn("text-2xl font-bold mb-1", s.color)}>{s.value}</div>
            <div className="text-xs text-white/50">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="glass rounded-2xl p-5 border border-white/5">
        <h3 className="text-sm font-bold mb-5">Percentile Growth — Last {history.length} Mocks</h3>

        {/* Bar chart */}
        <div className="flex items-end gap-3 h-36 mb-3">
          {history.map((h, i) => {
            const barH = ((h.percentile - min) / range) * 100;
            const isLatest = i === history.length - 1;
            return (
              <div key={h.mockName} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[9px] text-white/50 font-semibold">{h.percentile}%</div>
                <div className="w-full flex items-end" style={{ height: "110px" }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${barH}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                    className={cn(
                      "w-full rounded-t-lg",
                      isLatest
                        ? "bg-gradient-to-b from-neon-blue to-neon-purple shadow-[0_0_12px_rgba(0,212,255,0.3)]"
                        : "bg-gradient-to-b from-white/25 to-white/10",
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* X axis labels */}
        <div className="flex gap-3">
          {history.map((h) => (
            <div key={h.mockName} className="flex-1 text-center text-[9px] text-white/30">{h.shortName}</div>
          ))}
        </div>

        {/* Target line annotation */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 h-px border-t border-dashed border-neon-purple/40" />
          <span className="text-[10px] text-neon-purple font-semibold">Target: 95%ile</span>
          <div className="flex-1 h-px border-t border-dashed border-neon-purple/40" />
        </div>
      </div>

      {/* Mock-by-mock breakdown */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Attempt Log</span>
        </div>
        {history.map((h, i) => {
          const prev = i > 0 ? history[i - 1].percentile : null;
          const delta = prev !== null ? parseFloat((h.percentile - prev).toFixed(1)) : null;
          return (
            <div key={h.mockName} className="flex items-center gap-4 px-5 py-3 border-b border-white/5 last:border-0">
              <span className="text-[10px] text-white/25 w-20 flex-shrink-0">{h.date}</span>
              <span className="text-xs font-medium text-white/70 flex-1 truncate">{h.mockName}</span>
              <span className="text-xs text-white/40">{h.accuracy}% acc</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {delta !== null && (
                  <span className={cn("text-[10px] font-semibold", delta >= 0 ? "text-green-400" : "text-red-400")}>
                    {delta >= 0 ? `+${delta}` : delta}
                  </span>
                )}
                <span className="text-sm font-bold text-yellow-400">{h.percentile}%ile</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Time Management Tab
// ─────────────────────────────────────────────────────────────────────────────

function TimeTab() {
  const items = MOCK_ANALYSIS_DATA.timeAnalysis;
  const tooSlow      = items.filter((i) => i.status === "too-slow");
  const tooFastWrong = items.filter((i) => i.status === "too-fast-wrong");
  const efficient    = items.filter((i) => i.status === "efficient");

  const d = MOCK_ANALYSIS_DATA;
  const sectionEfficiency = d.sectionScores.map((s) => ({
    section: s.section,
    efficiency: Math.round(((s.timeAllotted - Math.abs(s.timeSpent - s.timeAllotted)) / s.timeAllotted) * 100),
    over: s.timeSpent > s.timeAllotted,
    delta: s.timeSpent - s.timeAllotted,
  }));

  return (
    <div className="space-y-5">
      {/* Section time efficiency */}
      <div className="glass rounded-2xl p-5 border border-white/5">
        <h3 className="text-sm font-bold mb-4">Section Time Efficiency</h3>
        <div className="grid grid-cols-3 gap-3">
          {sectionEfficiency.map((s) => (
            <div key={s.section} className="bg-white/3 rounded-xl p-3 border border-white/5 text-center">
              <SectionLabel section={s.section as "VARC" | "DILR" | "QA"} />
              <div className={cn(
                "text-2xl font-bold mt-2",
                s.over ? "text-red-400" : "text-green-400",
              )}>
                {s.over ? `+${s.delta}m` : s.delta < 0 ? `${s.delta}m` : "On time"}
              </div>
              <div className="text-[9px] text-white/30 mt-0.5">
                {s.over ? "Over allotted" : "Under allotted"}
              </div>
              <AccuracyBar value={s.efficiency} />
              <div className="text-[9px] text-white/40 mt-1">{s.efficiency}% efficient</div>
            </div>
          ))}
        </div>
      </div>

      {/* Too slow */}
      <TimeGroup
        title="Spent Too Long"
        color="text-red-400"
        bgColor="bg-red-500/8 border-red-500/15"
        icon={<Clock size={13} className="text-red-400" />}
        items={tooSlow}
        note="These questions ate into your time budget. Apply a 2-min cap and move on."
      />

      {/* Too fast + wrong */}
      <TimeGroup
        title="Rushed & Wrong"
        color="text-orange-400"
        bgColor="bg-orange-500/8 border-orange-500/15"
        icon={<AlertCircle size={13} className="text-orange-400" />}
        items={tooFastWrong}
        note="Answered too quickly — likely from false confidence or inadequate reading. Slow down on these topics."
      />

      {/* Efficient */}
      <TimeGroup
        title="Efficient Questions"
        color="text-green-400"
        bgColor="bg-green-500/8 border-green-500/15"
        icon={<CheckCircle size={13} className="text-green-400" />}
        items={efficient}
        note="These were answered at ideal speed. Maintain this approach."
      />
    </div>
  );
}

function TimeGroup({
  title, color, bgColor, icon, items, note,
}: {
  title: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  items: TimeAnalysisItem[];
  note: string;
}) {
  if (!items.length) return null;
  return (
    <div className="glass rounded-2xl border border-white/5 overflow-hidden">
      <div className={cn("px-4 py-3 border-b border-white/5 flex items-center gap-2", bgColor)}>
        {icon}
        <span className={cn("text-xs font-bold", color)}>{title}</span>
        <span className="text-[10px] text-white/30 ml-auto">{items.length} questions</span>
      </div>
      <div className="p-1">
        {items.map((item) => {
          const overOrUnder = item.status === "too-slow"
            ? `+${Math.round((item.timeSpent - item.idealTime) / 60)}m ${(item.timeSpent - item.idealTime) % 60}s over`
            : item.status === "too-fast-wrong"
              ? `${Math.round((item.idealTime - item.timeSpent))}s too fast`
              : "On time";
          return (
            <div key={item.questionNum} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/3 rounded-xl transition-colors">
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                item.status === "too-slow"      ? "bg-red-500/20 text-red-400" :
                item.status === "too-fast-wrong" ? "bg-orange-500/20 text-orange-400" :
                "bg-green-500/20 text-green-400",
              )}>
                {item.questionNum}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <SectionLabel section={item.section} />
                  <span className="text-xs text-white/55 truncate">{item.topic}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-semibold text-white/70">
                  {Math.floor(item.timeSpent / 60)}:{String(item.timeSpent % 60).padStart(2, "0")}
                </div>
                <div className="text-[9px] text-white/30">actual</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-semibold text-white/40">
                  {Math.floor(item.idealTime / 60)}:{String(item.idealTime % 60).padStart(2, "0")}
                </div>
                <div className="text-[9px] text-white/25">ideal</div>
              </div>
              <span className={cn(
                "text-[9px] font-semibold flex-shrink-0 hidden sm:block",
                item.status === "too-slow" ? "text-red-400" :
                item.status === "too-fast-wrong" ? "text-orange-400" : "text-green-400",
              )}>
                {overOrUnder}
              </span>
            </div>
          );
        })}
      </div>
      <div className="px-4 py-2 border-t border-white/5 bg-white/2">
        <p className="text-[10px] text-white/35 italic">{note}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Report Tab
// ─────────────────────────────────────────────────────────────────────────────

function ReportTab({ onRetake }: { onRetake: () => void }) {
  const r = MOCK_ANALYSIS_DATA.mentorReport;
  const d = MOCK_ANALYSIS_DATA;

  return (
    <div className="space-y-5">
      {/* Score headline */}
      <div className="relative overflow-hidden rounded-2xl border border-neon-blue/25 bg-gradient-to-br from-neon-blue/8 to-neon-purple/8 p-6">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neon-blue via-transparent to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={18} className="text-neon-blue" />
            <span className="font-bold text-neon-blue">AI Mentor Final Report</span>
          </div>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-5xl font-black text-yellow-400">{d.overallPercentile}%ile</span>
            <div>
              <div className="text-sm font-semibold text-white/70">{d.testName}</div>
              <div className="text-xs text-white/35">{d.attemptDate} · {d.totalScore}/{d.maxScore} score</div>
            </div>
          </div>
        </div>
      </div>

      {/* What went well */}
      <div className="glass rounded-2xl border border-green-500/20 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-green-500/15 bg-green-500/8">
          <CheckCircle size={14} className="text-green-400" />
          <span className="text-sm font-bold text-green-400">What Went Well</span>
        </div>
        <div className="p-4 space-y-3">
          {r.wentWell.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-green-400">{i + 1}</span>
              </div>
              <p className="text-sm text-white/65 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What went wrong */}
      <div className="glass rounded-2xl border border-red-500/20 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-red-500/15 bg-red-500/8">
          <AlertCircle size={14} className="text-red-400" />
          <span className="text-sm font-bold text-red-400">What Went Wrong</span>
        </div>
        <div className="p-4 space-y-3">
          {r.wentWrong.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-red-400">{i + 1}</span>
              </div>
              <p className="text-sm text-white/65 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Next 3 actions */}
      <div className="glass rounded-2xl border border-neon-blue/20 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-neon-blue/15 bg-neon-blue/8">
          <ArrowRight size={14} className="text-neon-blue" />
          <span className="text-sm font-bold text-neon-blue">Your Next 3 Actions</span>
        </div>
        <div className="p-4 space-y-3">
          {r.nextActions.map((action, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-neon-blue/5 rounded-xl border border-neon-blue/10">
              <div className="w-6 h-6 rounded-lg bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-bold text-neon-blue">{i + 1}</span>
              </div>
              <p className="text-sm text-white/65 leading-relaxed">{action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Next recommended mock */}
      <div className="flex items-center gap-4 p-4 glass rounded-2xl border border-neon-purple/20">
        <div className="w-10 h-10 rounded-xl bg-neon-purple/20 border border-neon-purple/30 flex items-center justify-center flex-shrink-0">
          <Play size={16} className="text-neon-purple" fill="currentColor" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-white/35 mb-0.5">Next Recommended Mock</div>
          <div className="text-sm font-bold">{r.nextMock}</div>
        </div>
        <button
          onClick={onRetake}
          className="px-4 py-2 bg-neon-purple/20 border border-neon-purple/30 rounded-xl text-xs text-neon-purple font-semibold hover:bg-neon-purple/30 transition-all flex-shrink-0"
        >
          Start Now
        </button>
      </div>

      {/* Motivational message */}
      <div className="relative overflow-hidden p-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
        <Star size={60} className="absolute -right-4 -top-4 text-yellow-400/8" />
        <div className="flex items-center gap-2 mb-3">
          <Star size={14} className="text-yellow-400" fill="currentColor" />
          <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">AI Mentor Message</span>
        </div>
        <p className="text-sm text-white/65 leading-relaxed">{r.motivationalMessage}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main TestAnalysis export
// ─────────────────────────────────────────────────────────────────────────────

export default function TestAnalysis({
  onBack,
  onRetake,
}: {
  onBack: () => void;
  onRetake: () => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const d = MOCK_ANALYSIS_DATA;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 glass rounded-xl text-white/50 hover:text-white border border-white/8 transition-all"
          aria-label="Back to test list"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold">Test Analysis</h2>
          <p className="text-white/40 text-sm truncate">{d.testName} — AI Powered Deep Dive</p>
        </div>
        <button
          onClick={onRetake}
          className="flex items-center gap-2 px-4 py-2 bg-neon-blue/15 border border-neon-blue/25 rounded-xl text-xs text-neon-blue font-semibold hover:bg-neon-blue/25 transition-all"
        >
          <RotateCcw size={12} /> Retake
        </button>
      </div>

      {/* Tab bar — horizontal scroll on mobile */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex gap-1.5 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-neon-blue/20 border-neon-blue/30 text-neon-blue shadow-[0_0_10px_rgba(0,212,255,0.15)]"
                  : "glass border-white/8 text-white/40 hover:text-white",
              )}
              aria-selected={activeTab === tab.id}
            >
              {tab.icon}
              {tab.label}
              {tab.id === "mistakes" && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-red-500/25 text-red-400 text-[9px] font-bold">
                  {d.mistakes.length}
                </span>
              )}
              {tab.id === "weakness" && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-orange-500/25 text-orange-400 text-[9px] font-bold">
                  {d.weaknesses.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "overview"  && <OverviewTab />}
          {activeTab === "mistakes"  && <MistakesTab onRetry={onRetake} />}
          {activeTab === "weakness"  && <WeaknessTab />}
          {activeTab === "revision"  && <RevisionTab onStart={onRetake} />}
          {activeTab === "growth"    && <GrowthTab />}
          {activeTab === "time"      && <TimeTab />}
          {activeTab === "report"    && <ReportTab onRetake={onRetake} />}
        </motion.div>
      </AnimatePresence>

      {/* Bottom CTA */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onRetake}
          className="flex-1 py-3 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
        >
          <Play size={14} fill="white" /> Practice Weak Areas
        </button>
        <button
          onClick={onBack}
          className="flex-1 py-3 glass rounded-xl text-sm font-semibold text-white/60 border border-white/10 hover:text-white transition-all"
        >
          Back to Tests
        </button>
      </div>
    </div>
  );
}
