"use client";

import { useEffect, useRef, useCallback, useState, useReducer } from "react";
import {
  X, AlertCircle, Bookmark, BookmarkCheck, CheckCircle2,
  ExternalLink, FileText, Lightbulb, ChevronDown, ChevronUp,
  RotateCcw, Loader2, ThumbsUp, Zap, Trophy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VideoLesson, VideoQuizQuestion } from "@/lib/videos";
import { useVideoStore } from "@/store/useVideoStore";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/lib/toast";
import { playSound } from "@/lib/sounds";
import { trackVideoEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

// ── YouTube IFrame API types ───────────────────────────────────────────────────

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YTPlayerInstance }) => void;
            onStateChange?: (e: { data: number; target: YTPlayerInstance }) => void;
            onError?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface YTPlayerInstance {
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
  playVideo(): void;
  pauseVideo(): void;
}

// ── Quiz reducer ──────────────────────────────────────────────────────────────

interface QuizState {
  phase: "idle" | "active" | "done";
  currentQ: number;
  selections: (number | null)[];
  revealed: boolean[];
  score: number;
}

type QuizAction =
  | { type: "OPEN"; total: number }
  | { type: "SELECT"; answerIdx: number; correctIdx: number }
  | { type: "NEXT"; total: number }
  | { type: "FINISH" }
  | { type: "RESET"; total: number };

function initQuizState(total: number): QuizState {
  return {
    phase: "active",
    currentQ: 0,
    selections: new Array(total).fill(null),
    revealed: new Array(total).fill(false),
    score: 0,
  };
}

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "OPEN":
      return initQuizState(action.total);

    case "SELECT": {
      if (state.phase !== "active" || state.revealed[state.currentQ]) return state;
      const newSelections = [...state.selections];
      newSelections[state.currentQ] = action.answerIdx;
      const newRevealed = [...state.revealed];
      newRevealed[state.currentQ] = true;
      const isCorrect = action.answerIdx === action.correctIdx;
      return {
        ...state,
        selections: newSelections,
        revealed:   newRevealed,
        score:      state.score + (isCorrect ? 1 : 0),
      };
    }

    case "NEXT":
      if (state.phase !== "active" || state.currentQ >= action.total - 1) return state;
      return { ...state, currentQ: state.currentQ + 1 };

    case "FINISH":
      return { ...state, phase: "done" };

    case "RESET":
      return initQuizState(action.total);

    default:
      return state;
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const XP_REWARD         = 50;
const XP_PER_CORRECT    = 10;
const POLL_MS           = 2500;

// ── YT API loader ─────────────────────────────────────────────────────────────

function loadYTApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
    if (!document.getElementById("yt-iframe-api")) {
      const s = document.createElement("script");
      s.id  = "yt-iframe-api";
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface VideoModalProps {
  video: VideoLesson;
  onClose: () => void;
  /** Navigate to a different video without closing the modal */
  onNavigate?: (video: VideoLesson) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VideoModal({ video, onClose, onNavigate }: VideoModalProps) {
  // ── Refs ──
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef          = useRef<YTPlayerInstance | null>(null);
  const pollRef            = useRef<ReturnType<typeof setInterval> | null>(null);
  const rewardedRef        = useRef(false);
  const startedRef         = useRef(false);
  const completedRef       = useRef(false);

  // ── Store ──
  const updateProgress  = useVideoStore((s) => s.updateProgress);
  const markXpAwarded   = useVideoStore((s) => s.markXpAwarded);
  const toggleSaved     = useVideoStore((s) => s.toggleSaved);
  const updateNotes     = useVideoStore((s) => s.updateNotes);
  const saveQuizResult  = useVideoStore((s) => s.saveQuizResult);
  const prevRecord      = useVideoStore((s) => s.history[video.id]);
  const quizResult      = useVideoStore((s) => s.quizResults[video.id]);
  // Reactive: re-renders when progress changes during playback
  const progressPct     = useVideoStore((s) => s.history[video.id]?.progressPct ?? 0);

  const isSaved         = prevRecord?.savedForLater ?? false;
  const existingNotes   = prevRecord?.notes ?? "";

  const { updateXP, soundEnabled } = useAuthStore();
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  useEffect(() => {
    rewardedRef.current = prevRecord?.xpAwarded ?? false;
  }, [prevRecord?.xpAwarded, video.id]);

  // ── UI state ──
  const [showTakeaways, setShowTakeaways] = useState(false);
  const [showSummary,   setShowSummary]   = useState(false);
  const [notesOpen,     setNotesOpen]     = useState(false);
  const [notesText,     setNotesText]     = useState(existingNotes);

  // ── Quiz state via reducer ──
  const totalQ = video.quiz?.length ?? 0;
  const [quiz, quizDispatch] = useReducer(quizReducer, {
    phase: "idle", currentQ: 0,
    selections: new Array(totalQ).fill(null),
    revealed:   new Array(totalQ).fill(false),
    score: 0,
  });

  // After quiz finishes: save result + award XP
  useEffect(() => {
    if (quiz.phase !== "done") return;
    saveQuizResult(video.id, quiz.score, totalQ);
    const xpEarned = quiz.score * XP_PER_CORRECT;
    if (xpEarned > 0) {
      updateXP(xpEarned);
      if (soundEnabledRef.current) playSound("xp", true);
      toast.xp(xpEarned, `Quiz complete! ${quiz.score}/${totalQ} correct.`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.phase]);

  // ── Polling ──
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      try {
        const current  = player.getCurrentTime();
        const duration = player.getDuration();
        if (!duration) return;
        const pct = (current / duration) * 100;
        updateProgress(video.id, pct, Math.round(current));

        if (pct >= 70 && !rewardedRef.current) {
          rewardedRef.current = true;
          markXpAwarded(video.id);
          updateXP(XP_REWARD);
          if (soundEnabledRef.current) playSound("xp", true);
          toast.xp(XP_REWARD, video.xpToastMessage ?? "🔥 Great job! Keep pushing toward 99+ percentile.");
          trackVideoEvent("VIDEO_70_PERCENT_REACHED", video.id, { pct: Math.round(pct) });
        }

        if (pct >= 95 && !completedRef.current) {
          completedRef.current = true;
          trackVideoEvent("VIDEO_COMPLETED", video.id, { pct: Math.round(pct) });
        }
      } catch { /* player not ready */ }
    }, POLL_MS);
  }, [video.id, video.xpToastMessage, updateProgress, markXpAwarded, updateXP, stopPolling]);

  // ── YT player init ──
  useEffect(() => {
    if (!video.youtubeId) return;
    let destroyed = false;

    loadYTApi().then(() => {
      if (destroyed || !playerContainerRef.current) return;
      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        videoId: video.youtubeId!,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, enablejsapi: 1,
          origin: typeof window !== "undefined" ? window.location.origin : "" },
        events: {
          onStateChange(e) {
            if (e.data === window.YT.PlayerState.PLAYING) {
              if (!startedRef.current) {
                startedRef.current = true;
                trackVideoEvent("VIDEO_STARTED", video.id);
              }
              startPolling();
            } else {
              stopPolling();
              try {
                const cur = e.target.getCurrentTime();
                const dur = e.target.getDuration();
                if (dur) updateProgress(video.id, (cur / dur) * 100, Math.round(cur));
              } catch { /* ignore */ }
            }
          },
          onError() { stopPolling(); },
        },
      });
    });

    return () => {
      destroyed = true;
      stopPolling();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.youtubeId]);

  // ── Keyboard + scroll lock ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ── Render ──
  const quizUnlocked = progressPct >= 70 && totalQ > 0;
  const isWatched    = progressPct >= 95;

  return (
    <AnimatePresence>
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 lg:p-8"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="modal-panel"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          className="w-full max-w-5xl bg-dark-800 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]"
          role="dialog"
          aria-modal="true"
          aria-label={video.title}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-white/5 flex-shrink-0 gap-3">
            <h2 className="font-semibold text-sm lg:text-base line-clamp-1 flex-1">{video.title}</h2>
            <div className="flex items-center gap-1 flex-shrink-0">
              {video.youtubeId && (
                <a
                  href={`https://youtu.be/${video.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Open on YouTube"
                >
                  <ExternalLink size={15} />
                </a>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Close video"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="overflow-y-auto flex-1 overscroll-contain">
            <div className="lg:flex">

              {/* ── Player column ── */}
              <div className="lg:flex-1 min-w-0">

                {/* Player */}
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  {video.youtubeId ? (
                    <div ref={playerContainerRef} className="absolute inset-0" id={`yt-player-${video.id}`} />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-900 gap-4 text-white/40">
                      <AlertCircle size={40} className="text-white/20" />
                      <p className="text-sm">Video not available yet</p>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {progressPct > 0 && (
                  <div className="px-4 sm:px-5 py-2 border-t border-white/5">
                    <div className="flex items-center justify-between text-[11px] text-white/30 mb-1.5">
                      <span>Watch progress</span>
                      <span className={cn(progressPct >= 70 ? "text-green-400" : "text-neon-blue")}>
                        {Math.round(progressPct)}%
                        {progressPct >= 70 && " · +50 XP earned"}
                      </span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", progressPct >= 70 ? "bg-green-400" : "bg-neon-blue")}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                    {/* 70% milestone marker */}
                    <div className="relative h-0">
                      <div className="absolute top-0 h-2 border-l border-white/20" style={{ left: "70%" }} />
                    </div>
                  </div>
                )}

                {/* Meta row */}
                <div className="px-4 sm:px-5 pt-4 pb-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/35">
                    <span className="font-medium text-white/60">{video.instructor}</span>
                    <span>·</span>
                    <span>{video.views} views</span>
                    <span>·</span>
                    <span>{video.duration}</span>
                    <span>·</span>
                    <span className="text-yellow-400">★ {video.rating}</span>
                    {isWatched && (
                      <span className="flex items-center gap-1 text-green-400 font-medium">
                        <CheckCircle2 size={11} /> Completed
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="px-4 sm:px-5 pb-3">
                  <p className="text-sm text-white/45 leading-relaxed">{video.description}</p>
                </div>

                {/* Action bar */}
                <div className="px-4 sm:px-5 pb-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleSaved(video.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border transition-all",
                      isSaved
                        ? "bg-neon-blue/20 border-neon-blue/30 text-neon-blue"
                        : "glass border-white/8 text-white/50 hover:text-white"
                    )}
                  >
                    {isSaved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                    {isSaved ? "Saved" : "Save"}
                  </button>

                  <button
                    onClick={() => setNotesOpen((o) => !o)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 glass rounded-xl text-xs border transition-all",
                      notesOpen ? "border-neon-purple/30 text-neon-purple" : "border-white/8 text-white/50 hover:text-white"
                    )}
                  >
                    <FileText size={13} /> Notes
                  </button>

                  <button className="flex items-center gap-1.5 px-4 py-2 glass rounded-xl text-xs text-white/50 hover:text-white border border-white/8 transition-all">
                    <ThumbsUp size={13} /> Like
                  </button>
                </div>

                {/* Notes textarea */}
                <AnimatePresence>
                  {notesOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-white/5"
                    >
                      <div className="px-4 sm:px-5 py-3 space-y-2">
                        <p className="text-[10px] text-white/25 uppercase tracking-wider">Your Notes</p>
                        <textarea
                          value={notesText}
                          onChange={(e) => setNotesText(e.target.value)}
                          onBlur={() => updateNotes(video.id, notesText)}
                          placeholder="Jot down key concepts, shortcuts, or reminders…"
                          rows={4}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-purple/40 resize-none transition-colors"
                        />
                        <button
                          onClick={() => { updateNotes(video.id, notesText); toast.success("Notes saved!"); }}
                          className="text-[11px] px-3 py-1.5 bg-neon-purple/20 border border-neon-purple/30 text-neon-purple rounded-lg hover:bg-neon-purple/30 transition-all"
                        >
                          Save Notes
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tags */}
                <div className="px-4 sm:px-5 pb-4 flex flex-wrap gap-1.5 border-t border-white/5 pt-4">
                  {video.tags.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-white/30">
                      {t}
                    </span>
                  ))}
                </div>

                {/* ── Key Takeaways ── */}
                {video.keyTakeaways && video.keyTakeaways.length > 0 && (
                  <div className="border-t border-white/5">
                    <button
                      onClick={() => setShowTakeaways((v) => !v)}
                      className="w-full flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-white/3 transition-colors text-left"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-neon-green">
                        <Lightbulb size={14} className="text-neon-green" /> Key Takeaways
                      </span>
                      {showTakeaways ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
                    </button>
                    <AnimatePresence>
                      {showTakeaways && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 sm:px-5 pb-4 space-y-2">
                            {video.keyTakeaways.map((t, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
                                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-neon-green/20 text-neon-green text-[10px] font-bold flex items-center justify-center">
                                  {i + 1}
                                </span>
                                {t}
                              </li>
                            ))}
                          </div>
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* ── AI Summary ── */}
                {video.aiSummary && (
                  <div className="border-t border-white/5">
                    <button
                      onClick={() => setShowSummary((v) => !v)}
                      className="w-full flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-white/3 transition-colors text-left"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-neon-purple">
                        <Zap size={14} className="text-neon-purple" /> AI Summary
                      </span>
                      {showSummary ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
                    </button>
                    <AnimatePresence>
                      {showSummary && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 sm:px-5 pb-4">
                            <p className="text-sm text-white/55 leading-relaxed bg-neon-purple/5 border border-neon-purple/10 rounded-xl p-3">
                              {video.aiSummary}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* ── Quiz section ── */}
                {quizUnlocked && (
                  <QuizSection
                    questions={video.quiz!}
                    state={quiz}
                    dispatch={quizDispatch}
                    priorResult={quizResult ?? null}
                  />
                )}
              </div>

              {/* ── Related sidebar (desktop) ── */}
              <RelatedSidebar
                currentId={video.id}
                category={video.category}
                onNavigate={onNavigate}
                onClose={onClose}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Quiz section ───────────────────────────────────────────────────────────────

interface QuizSectionProps {
  questions: VideoQuizQuestion[];
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
  priorResult: import("@/store/useVideoStore").QuizResult | null;
}

function QuizSection({ questions, state, dispatch, priorResult }: QuizSectionProps) {
  const total = questions.length;
  const q     = questions[state.currentQ];
  const isLast = state.currentQ === total - 1;

  if (state.phase === "idle") {
    return (
      <div className="border-t border-white/5 px-4 sm:px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={15} className="text-yellow-400" />
            <span className="text-sm font-medium">Quick Quiz · {total} Questions</span>
            <span className="text-[10px] px-2 py-0.5 bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 rounded-full">
              +{total * 10} XP available
            </span>
          </div>
          {priorResult ? (
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span className="text-green-400">{priorResult.score}/{priorResult.total} correct</span>
              <button
                onClick={() => dispatch({ type: "RESET", total })}
                className="flex items-center gap-1 px-2.5 py-1 glass rounded-lg border border-white/8 hover:text-white transition-all"
              >
                <RotateCcw size={11} /> Retry
              </button>
            </div>
          ) : (
            <button
              onClick={() => dispatch({ type: "OPEN", total })}
              className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 rounded-xl text-xs font-semibold hover:bg-yellow-400/30 transition-all"
            >
              Start Quiz →
            </button>
          )}
        </div>
      </div>
    );
  }

  if (state.phase === "done") {
    const pct = Math.round((state.score / total) * 100);
    return (
      <div className="border-t border-white/5 px-4 sm:px-5 py-5">
        <div className="text-center space-y-3">
          <div className="text-3xl font-black">
            {pct >= 80 ? "🎯" : pct >= 50 ? "👍" : "📚"}
          </div>
          <div>
            <p className="text-lg font-bold">
              {state.score}/{total} correct &mdash; {pct >= 80 ? "Excellent!" : pct >= 50 ? "Good effort!" : "Keep practicing!"}
            </p>
            <p className="text-sm text-white/40 mt-0.5">+{state.score * 10} XP earned</p>
          </div>
          <button
            onClick={() => dispatch({ type: "RESET", total })}
            className="flex items-center gap-1.5 mx-auto px-4 py-2 glass border border-white/10 rounded-xl text-xs text-white/50 hover:text-white transition-all"
          >
            <RotateCcw size={12} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // Active phase
  const selected  = state.selections[state.currentQ];
  const revealed  = state.revealed[state.currentQ];

  return (
    <div className="border-t border-white/5 px-4 sm:px-5 py-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-yellow-400">
          <Trophy size={13} /> Question {state.currentQ + 1} / {total}
        </span>
        <span className="text-xs text-white/30">{state.score} correct so far</span>
      </div>

      {/* Question */}
      <p className="text-sm font-medium leading-relaxed">{q.question}</p>

      {/* Options */}
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect  = i === q.correctIndex;
          let cls = "w-full text-left px-3.5 py-2.5 rounded-xl border text-sm transition-all ";

          if (!revealed) {
            cls += "glass border-white/8 text-white/70 hover:border-neon-blue/40 hover:text-white";
          } else if (isCorrect) {
            cls += "bg-green-500/15 border-green-500/30 text-green-300";
          } else if (isSelected && !isCorrect) {
            cls += "bg-red-500/15 border-red-500/30 text-red-300";
          } else {
            cls += "glass border-white/5 text-white/30";
          }

          return (
            <button
              key={i}
              onClick={() => dispatch({ type: "SELECT", answerIdx: i, correctIdx: q.correctIndex })}
              disabled={revealed}
              className={cls}
            >
              <span className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-white/30 flex-shrink-0">
                  {["A", "B", "C", "D"][i]}
                </span>
                {opt}
                {revealed && isCorrect && <CheckCircle2 size={13} className="ml-auto text-green-400 flex-shrink-0" />}
              </span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {revealed && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-white/50 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 leading-relaxed"
        >
          <span className="font-semibold text-white/70">Explanation: </span>
          {q.explanation}
        </motion.div>
      )}

      {/* Next / Finish */}
      {revealed && (
        <div className="flex justify-end">
          {isLast ? (
            <button
              onClick={() => dispatch({ type: "FINISH" })}
              className="px-5 py-2 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl text-sm font-semibold shadow-[0_0_16px_rgba(0,212,255,0.3)] hover:shadow-[0_0_24px_rgba(0,212,255,0.5)] transition-all"
            >
              Finish Quiz
            </button>
          ) : (
            <button
              onClick={() => dispatch({ type: "NEXT", total })}
              className="px-5 py-2 bg-neon-blue/20 border border-neon-blue/30 text-neon-blue rounded-xl text-sm font-semibold hover:bg-neon-blue/30 transition-all"
            >
              Next →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Related sidebar ────────────────────────────────────────────────────────────

interface RelatedProps {
  currentId: string;
  category: string;
  onNavigate?: (v: VideoLesson) => void;
  onClose: () => void;
}

function RelatedSidebar({ currentId, category, onNavigate, onClose }: RelatedProps) {
  const videos = useVideoStore((s) => s.getVideos())
    .filter((v) => v.category === category && v.id !== currentId && v.status === "published")
    .slice(0, 4);

  if (videos.length === 0) return null;

  return (
    <aside className="hidden lg:block lg:w-72 border-l border-white/5 flex-shrink-0">
      <div className="p-4 border-b border-white/5">
        <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Up Next</h4>
      </div>
      <div className="divide-y divide-white/5">
        {videos.map((v) => (
          <button
            key={v.id}
            onClick={() => onNavigate ? onNavigate(v) : onClose()}
            className="w-full text-left p-4 hover:bg-white/5 transition-all group"
          >
            <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-neon-blue transition-colors">
              {v.title}
            </p>
            <p className="text-xs text-white/25 mt-1">{v.instructor} · {v.duration}</p>
            {v.access !== "free" && (
              <span className="mt-1 inline-block text-[9px] px-1.5 py-0.5 rounded bg-neon-purple/20 text-neon-purple font-bold">
                {v.access.toUpperCase()}
              </span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}
