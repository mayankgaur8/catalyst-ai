"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Filter, CheckCircle, XCircle, Clock,
  Lightbulb, Brain, ArrowRight,
  ChevronDown, Play, Bookmark
} from "lucide-react";
import { cn, getDifficultyColor } from "@/lib/utils";
import { SAMPLE_QUESTIONS, TOPICS } from "@/lib/data";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore } from "@/store/useGameStore";
import { playSound } from "@/lib/sounds";
import { toast } from "@/lib/toast";

type Section = "qa" | "varc" | "dilr";

const SectionBadge = ({ section }: { section: Section }) => (
  <span className={cn(
    "text-xs font-bold px-2 py-0.5 rounded uppercase",
    section === "qa" ? "bg-blue-500/20 text-blue-400" :
    section === "varc" ? "bg-purple-500/20 text-purple-400" :
    "bg-green-500/20 text-green-400"
  )}>
    {section.toUpperCase()}
  </span>
);

export default function PracticePage() {
  const [activeSection, setActiveSection] = useState<Section>("qa");
  const [activeDifficulty, setActiveDifficulty] = useState("all");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0, skipped: 0, time: 0 });
  const [bookmarked, setBookmarked] = useState<number[]>([]);

  const { soundEnabled, updateXP, user } = useAuthStore();
  const { recordAnswer, tryUnlockAchievements } = useGameStore();

  const sectionQuestions = SAMPLE_QUESTIONS.filter(
    (q) => q.section === activeSection && (activeDifficulty === "all" || q.difficulty === activeDifficulty)
  );

  const currentQ = sectionQuestions[currentQIndex] || SAMPLE_QUESTIONS[0];

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelectedAnswer(idx);
    setAnswered(true);
    const correct = idx === currentQ.correctAnswer;
    if (correct) {
      setSessionStats((s) => ({ ...s, correct: s.correct + 1 }));
      playSound("correct", soundEnabled);
      updateXP(15);
      toast.xp(15, "Correct Answer!");
    } else {
      setSessionStats((s) => ({ ...s, wrong: s.wrong + 1 }));
      playSound("wrong", soundEnabled);
    }
    recordAnswer(correct);
    tryUnlockAchievements((user?.xp ?? 0) + (correct ? 15 : 0), user?.streak ?? 0, user?.level ?? 1);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setAnswered(false);
    setCurrentQIndex((i) => (i + 1) % Math.max(sectionQuestions.length, 1));
  };

  const sections: Section[] = ["qa", "varc", "dilr"];
  const difficulties = ["all", "beginner", "intermediate", "advanced", "cat level"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Practice Zone</h1>
          <p className="text-white/40 mt-1 text-sm">AI-adaptive questions with instant explanations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass px-3 py-2 rounded-xl border border-white/5 flex items-center gap-2 text-sm">
            <CheckCircle size={14} className="text-green-400" />
            <span className="text-green-400 font-semibold">{sessionStats.correct}</span>
            <XCircle size={14} className="text-red-400 ml-1" />
            <span className="text-red-400 font-semibold">{sessionStats.wrong}</span>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl text-sm font-semibold">
            <Play size={14} /> Quick Quiz
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-2 p-1 glass rounded-2xl border border-white/5 w-fit">
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => { setActiveSection(s); setCurrentQIndex(0); }}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
              activeSection === s
                ? s === "qa" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                  s === "varc" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" :
                  "bg-green-500/20 text-green-400 border border-green-500/30"
                : "text-white/40 hover:text-white/70"
            )}
          >
            {s === "qa" ? "Quantitative" : s === "varc" ? "VARC" : "DILR"}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Topic List */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-white/60 uppercase tracking-wider">Topics</h3>
          <div className="space-y-2">
            {TOPICS[activeSection].map((topic) => (
              <motion.button
                key={topic.name}
                whileHover={{ x: 4 }}
                onClick={() => setCurrentQIndex(0)}
                className="w-full glass rounded-xl p-4 border border-white/5 hover:border-white/10 text-left transition-all card-hover"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{topic.name}</span>
                  <span className={cn(
                    "text-xs font-semibold",
                    topic.mastery >= 70 ? "text-green-400" :
                    topic.mastery >= 50 ? "text-yellow-400" : "text-red-400"
                  )}>{topic.mastery}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${topic.mastery}%`,
                      background: topic.mastery >= 70 ? "#00ff88" : topic.mastery >= 50 ? "#f59e0b" : "#ef4444"
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {topic.subtopics.slice(0, 3).map((sub) => (
                    <span key={sub} className="text-xs px-2 py-0.5 bg-white/5 rounded-full text-white/30">{sub}</span>
                  ))}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right: Question Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Difficulty Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-white/30" />
            {difficulties.map((d) => (
              <button
                key={d}
                onClick={() => setActiveDifficulty(d)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-xl border capitalize transition-all",
                  activeDifficulty === d
                    ? "bg-neon-blue/20 border-neon-blue/30 text-neon-blue"
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
                )}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass rounded-2xl border border-white/8"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <SectionBadge section={currentQ.section} />
                  <span className={cn("text-xs px-2 py-0.5 rounded capitalize", getDifficultyColor(currentQ.difficulty))}>
                    {currentQ.difficulty}
                  </span>
                  <span className="text-xs text-white/25">{currentQ.topic}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBookmarked((b) => b.includes(currentQ.id) ? b.filter(x => x !== currentQ.id) : [...b, currentQ.id])}
                    className={cn("p-1.5 rounded-lg transition-all", bookmarked.includes(currentQ.id) ? "text-yellow-400" : "text-white/25 hover:text-white/60")}
                  >
                    <Bookmark size={16} />
                  </button>
                  <div className="flex items-center gap-1 text-xs text-white/25">
                    <Clock size={12} />
                    <span>~{currentQ.timeToSolve}s</span>
                  </div>
                </div>
              </div>

              {/* Question Text */}
              <div className="p-5">
                <p className="text-white/90 text-[15px] leading-relaxed mb-6 whitespace-pre-line">
                  {currentQ.text}
                </p>

                {/* Options */}
                <div className="space-y-3">
                  {currentQ.options.map((option, idx) => {
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = idx === currentQ.correctAnswer;
                    const showResult = answered;

                    return (
                      <motion.button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        whileTap={{ scale: 0.99 }}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                          !showResult && "hover:bg-white/5 hover:border-white/15 bg-white/3 border-white/8",
                          showResult && isCorrect && "bg-green-500/15 border-green-500/40",
                          showResult && isSelected && !isCorrect && "bg-red-500/15 border-red-500/40",
                          showResult && !isSelected && !isCorrect && "bg-white/2 border-white/5 opacity-50",
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
                          !showResult && "bg-white/8 text-white/60",
                          showResult && isCorrect && "bg-green-500/30 text-green-400",
                          showResult && isSelected && !isCorrect && "bg-red-500/30 text-red-400",
                          showResult && !isSelected && !isCorrect && "bg-white/5 text-white/25",
                        )}>
                          {showResult ? (isCorrect ? <CheckCircle size={16} /> : isSelected ? <XCircle size={16} /> : String.fromCharCode(65 + idx)) : String.fromCharCode(65 + idx)}
                        </div>
                        <span className={cn(
                          "text-sm",
                          showResult && isCorrect ? "text-green-300 font-medium" :
                          showResult && isSelected && !isCorrect ? "text-red-300" :
                          "text-white/80"
                        )}>{option}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Explanation */}
                <AnimatePresence>
                  {answered && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-5 overflow-hidden"
                    >
                      <button
                        onClick={() => setShowExplanation(!showExplanation)}
                        className="flex items-center gap-2 text-sm text-neon-blue font-medium mb-3"
                      >
                        <Lightbulb size={16} />
                        {showExplanation ? "Hide" : "Show"} AI Explanation
                        <ChevronDown size={14} className={cn("transition-transform", showExplanation && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {showExplanation && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 bg-neon-blue/5 rounded-xl border border-neon-blue/20"
                          >
                            <div className="flex items-start gap-3">
                              <Brain size={18} className="text-neon-blue mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-semibold text-neon-blue mb-2">AI Solution</p>
                                <p className="text-sm text-white/70 leading-relaxed">{currentQ.explanation}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex items-center gap-3 mt-4">
                        <button
                          onClick={handleNext}
                          className="flex-1 py-2.5 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                        >
                          Next Question <ArrowRight size={14} />
                        </button>
                        <button className="py-2.5 px-4 glass rounded-xl text-sm text-white/50 hover:text-white border border-white/8">
                          Report
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Question Nav */}
              <div className="flex items-center justify-between p-4 border-t border-white/5 text-xs text-white/30">
                <span>Q{currentQIndex + 1} of {Math.max(sectionQuestions.length, 1)}</span>
                <div className="flex gap-1">
                  {sectionQuestions.slice(0, 10).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setCurrentQIndex(i); setSelectedAnswer(null); setAnswered(false); setShowExplanation(false); }}
                      className={cn(
                        "w-6 h-6 rounded text-xs font-medium transition-all",
                        i === currentQIndex ? "bg-neon-blue text-dark-900" : "bg-white/5 hover:bg-white/10"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Session Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Correct", value: sessionStats.correct, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
              { label: "Wrong", value: sessionStats.wrong, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
              { label: "Accuracy", value: sessionStats.correct + sessionStats.wrong > 0 ? `${Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.wrong)) * 100)}%` : "-", color: "text-neon-blue", bg: "bg-neon-blue/10 border-neon-blue/20" },
            ].map((stat) => (
              <div key={stat.label} className={cn("rounded-xl p-3 border text-center", stat.bg)}>
                <div className={cn("text-xl font-bold", stat.color)}>{stat.value}</div>
                <div className="text-xs text-white/30 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
