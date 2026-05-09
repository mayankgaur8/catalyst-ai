"use client";

import { useEffect, useRef, useCallback, useState, useReducer } from "react";
import {
  X, AlertCircle, Bookmark, BookmarkCheck, CheckCircle2,
  ExternalLink, FileText, Lightbulb, ChevronDown, ChevronUp,
  RotateCcw, Loader2, ThumbsUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VideoLesson } from "@/lib/videos";
import { useVideoStore } from "@/store/useVideoStore";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/lib/toast";
import { playSound } from "@/lib/sounds";
import { trackVideoEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

// Minimal inline YouTube IFrame API types (avoids needing @types/youtube)
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

interface VideoModalProps {
  video: VideoLesson;
  onClose: () => void;
}

const XP_REWARD = 50;
const POLL_MS   = 2500;

function loadYTApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();

  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.getElementById("yt-iframe-api")) {
      const s = document.createElement("script");
      s.id  = "yt-iframe-api";
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
}

export default function VideoModal({ video, onClose }: VideoModalProps) {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef          = useRef<YTPlayerInstance | null>(null);
  const pollRef            = useRef<ReturnType<typeof setInterval> | null>(null);
  const rewardedRef        = useRef(false);
  const startedRef         = useRef(false);
  const completedRef       = useRef(false);

  const { updateProgress, markXpAwarded, history } = useVideoStore();
  const { updateXP, soundEnabled }                 = useAuthStore();

  // Keep a ref so the polling callback always reads the latest value
  // without needing to be in the useCallback dep array.
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  const prevRecord = history[video.id];

  useEffect(() => {
    rewardedRef.current = prevRecord?.xpAwarded ?? false;
  }, [prevRecord?.xpAwarded, video.id]);

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
        // Approximate watched seconds as current time (simple, not range-based for now)
        updateProgress(video.id, pct, Math.round(current));

        // 70% milestone — XP + sound + toast + analytics
        if (pct >= 70 && !rewardedRef.current) {
          rewardedRef.current = true;
          markXpAwarded(video.id);
          updateXP(XP_REWARD);
          if (soundEnabledRef.current) playSound("xp", true);
          toast.xp(
            XP_REWARD,
            video.xpToastMessage ?? "🔥 Great job! Keep pushing toward 99+ percentile."
          );
          trackVideoEvent("VIDEO_70_PERCENT_REACHED", video.id, { pct: Math.round(pct) });
        }

        // Completion milestone (95%)
        if (pct >= 95 && !completedRef.current) {
          completedRef.current = true;
          trackVideoEvent("VIDEO_COMPLETED", video.id, { pct: Math.round(pct) });
        }
      } catch {
        // player may not be ready yet
      }
    }, POLL_MS);
  }, [video.id, video.xpToastMessage, updateProgress, markXpAwarded, updateXP, stopPolling]);

  useEffect(() => {
    if (!video.youtubeId) return;

    let destroyed = false;

    loadYTApi().then(() => {
      if (destroyed || !playerContainerRef.current) return;

      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        videoId: video.youtubeId!,
        playerVars: {
          autoplay:       1,
          rel:            0,
          modestbranding: 1,
          enablejsapi:    1,
          origin:         typeof window !== "undefined" ? window.location.origin : "",
        },
        events: {
          onStateChange(e) {
            if (e.data === window.YT.PlayerState.PLAYING) {
              // Fire VIDEO_STARTED once per modal open
              if (!startedRef.current) {
                startedRef.current = true;
                trackVideoEvent("VIDEO_STARTED", video.id);
              }
              startPolling();
            } else {
              stopPolling();
              // Snapshot progress on pause / end
              try {
                const current  = e.target.getCurrentTime();
                const duration = e.target.getDuration();
                if (duration) updateProgress(video.id, (current / duration) * 100, Math.round(current));
              } catch { /* ignore */ }
            }
          },
          onError() {
            stopPolling();
          },
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

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const progressPct = useVideoStore.getState().history[video.id]?.progressPct ?? 0;

  return (
    <AnimatePresence>
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 lg:p-8"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="modal-panel"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          className="w-full max-w-5xl bg-dark-800 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          role="dialog"
          aria-modal="true"
          aria-label={video.title}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
            <h2 className="font-semibold text-sm lg:text-base line-clamp-1 pr-4">{video.title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
              aria-label="Close video"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body — scrollable on mobile */}
          <div className="overflow-y-auto flex-1">
            <div className="lg:flex">
              {/* Player column */}
              <div className="lg:flex-1">
                {/* Aspect-ratio container — prevents CLS */}
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  {video.youtubeId ? (
                    <div
                      ref={playerContainerRef}
                      className="absolute inset-0"
                      id={`yt-player-${video.id}`}
                    />
                  ) : (
                    // Fallback when no YouTube ID
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-900 gap-4 text-white/40">
                      <AlertCircle size={40} className="text-white/20" />
                      <p className="text-sm">Video not available yet</p>
                    </div>
                  )}
                </div>

                {/* Watch progress bar */}
                {progressPct > 0 && (
                  <div className="px-5 py-2 border-t border-white/5">
                    <div className="flex items-center justify-between text-[11px] text-white/30 mb-1.5">
                      <span>Watch progress</span>
                      <span className={cn(progressPct >= 70 ? "text-green-400" : "text-neon-blue")}>
                        {Math.round(progressPct)}%
                        {progressPct >= 70 && " · XP awarded!"}
                      </span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          progressPct >= 70 ? "bg-green-400" : "bg-neon-blue"
                        )}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Meta + actions */}
                <div className="p-5 border-t border-white/5">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-white/35 mb-4">
                    <span className="font-medium text-white/60">{video.instructor}</span>
                    <span>·</span>
                    <span>{video.views} views</span>
                    <span>·</span>
                    <span>{video.duration}</span>
                    <span>·</span>
                    <span className="text-yellow-400">★ {video.rating}</span>
                  </div>

                  <p className="text-sm text-white/45 leading-relaxed mb-4">{video.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {video.tags.map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-white/35">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-xs text-white/50 hover:text-white border border-white/8 transition-all">
                      <Bookmark size={13} /> Save
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-xs text-white/50 hover:text-white border border-white/8 transition-all">
                      <ThumbsUp size={13} /> Like
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-xs text-white/50 hover:text-white border border-white/8 transition-all">
                      <FileText size={13} /> Notes
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar — related videos (desktop only) */}
              <RelatedSidebar currentId={video.id} category={video.category} onPlay={onClose} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Related sidebar ────────────────────────────────────────────────────────────

function RelatedSidebar({ currentId, category, onPlay }: { currentId: string; category: string; onPlay: () => void }) {
  const videos = useVideoStore((s) => s.getVideos())
    .filter((v) => v.category === category && v.id !== currentId)
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
            onClick={onPlay}
            className="w-full text-left p-4 hover:bg-white/5 transition-all group"
          >
            <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-neon-blue transition-colors">
              {v.title}
            </p>
            <p className="text-xs text-white/25 mt-1">{v.instructor} · {v.duration}</p>
          </button>
        ))}
      </div>
    </aside>
  );
}
