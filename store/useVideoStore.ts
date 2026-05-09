import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { VideoLesson, DEFAULT_VIDEOS } from "@/lib/videos";

export interface WatchRecord {
  videoId: string;
  progressPct: number;
  /** Actual seconds watched (unique, de-duped ranges) */
  watchedSeconds: number;
  xpAwarded: boolean;
  lastWatched: string;
  completedAt: string | null;
  savedForLater: boolean;
  notes: string;
}

export interface QuizResult {
  videoId: string;
  score: number;
  total: number;
  xpAwarded: boolean;
  completedAt: string;
}

interface VideoState {
  history: Record<string, WatchRecord>;
  /** null = use DEFAULT_VIDEOS; populated = admin has made edits */
  adminOverrides: VideoLesson[] | null;
  quizResults: Record<string, QuizResult>;
}

interface VideoActions {
  updateProgress: (videoId: string, pct: number, watchedSeconds: number) => void;
  markXpAwarded: (videoId: string) => void;
  toggleSaved: (videoId: string) => void;
  updateNotes: (videoId: string, notes: string) => void;
  markCompleted: (videoId: string) => void;
  saveQuizResult: (videoId: string, score: number, total: number) => void;
  // admin CRUD
  getVideos: () => VideoLesson[];
  getAdminVideos: () => VideoLesson[];
  addVideo: (v: VideoLesson) => void;
  removeVideo: (id: string) => void;
  softDeleteVideo: (id: string) => void;
  restoreVideo: (id: string) => void;
  editVideo: (id: string, patch: Partial<VideoLesson>) => void;
  reorder: (id: string, direction: "up" | "down") => void;
  resetToDefaults: () => void;
  // API sync
  syncProgressToAPI: (videoId: string) => Promise<void>;
  syncCompleteToAPI: (videoId: string) => Promise<{ xpGranted: boolean; xpAmount: number }>;
}

function getAPIHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("catalyst-auth");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const state = parsed?.state ?? {};
    const headers: Record<string, string> = {};
    if (state.user?.id) headers["x-user-id"] = state.user.id;
    if (state.user?.role) headers["x-user-role"] = state.user.role;
    if (state.plan) headers["x-user-plan"] = state.plan;
    return headers;
  } catch {
    return {};
  }
}

export const useVideoStore = create<VideoState & VideoActions>()(
  persist(
    (set, get) => ({
      history: {},
      adminOverrides: null,
      quizResults: {},

      updateProgress(videoId, pct, watchedSeconds) {
        set((s) => {
          const prev = s.history[videoId];
          const newPct = Math.max(prev?.progressPct ?? 0, pct);
          const newSecs = Math.max(prev?.watchedSeconds ?? 0, watchedSeconds);
          return {
            history: {
              ...s.history,
              [videoId]: {
                videoId,
                progressPct: newPct,
                watchedSeconds: newSecs,
                xpAwarded: prev?.xpAwarded ?? false,
                lastWatched: new Date().toISOString(),
                completedAt: newPct >= 95 ? (prev?.completedAt ?? new Date().toISOString()) : (prev?.completedAt ?? null),
                savedForLater: prev?.savedForLater ?? false,
                notes: prev?.notes ?? "",
              },
            },
          };
        });
      },

      markXpAwarded(videoId) {
        set((s) => ({
          history: {
            ...s.history,
            [videoId]: {
              ...(s.history[videoId] ?? {
                videoId,
                progressPct: 0,
                watchedSeconds: 0,
                lastWatched: new Date().toISOString(),
                completedAt: null,
                savedForLater: false,
                notes: "",
              }),
              xpAwarded: true,
            },
          },
        }));
      },

      toggleSaved(videoId) {
        set((s) => {
          const prev = s.history[videoId];
          return {
            history: {
              ...s.history,
              [videoId]: {
                videoId,
                progressPct: prev?.progressPct ?? 0,
                watchedSeconds: prev?.watchedSeconds ?? 0,
                xpAwarded: prev?.xpAwarded ?? false,
                lastWatched: prev?.lastWatched ?? new Date().toISOString(),
                completedAt: prev?.completedAt ?? null,
                savedForLater: !(prev?.savedForLater ?? false),
                notes: prev?.notes ?? "",
              },
            },
          };
        });
      },

      updateNotes(videoId, notes) {
        set((s) => {
          const prev = s.history[videoId];
          return {
            history: {
              ...s.history,
              [videoId]: {
                videoId,
                progressPct: prev?.progressPct ?? 0,
                watchedSeconds: prev?.watchedSeconds ?? 0,
                xpAwarded: prev?.xpAwarded ?? false,
                lastWatched: prev?.lastWatched ?? new Date().toISOString(),
                completedAt: prev?.completedAt ?? null,
                savedForLater: prev?.savedForLater ?? false,
                notes,
              },
            },
          };
        });
      },

      markCompleted(videoId) {
        set((s) => {
          const prev = s.history[videoId];
          return {
            history: {
              ...s.history,
              [videoId]: {
                videoId,
                progressPct: 100,
                watchedSeconds: prev?.watchedSeconds ?? 0,
                xpAwarded: true,
                lastWatched: new Date().toISOString(),
                completedAt: prev?.completedAt ?? new Date().toISOString(),
                savedForLater: prev?.savedForLater ?? false,
                notes: prev?.notes ?? "",
              },
            },
          };
        });
      },

      saveQuizResult(videoId, score, total) {
        set((s) => ({
          quizResults: {
            ...s.quizResults,
            [videoId]: { videoId, score, total, xpAwarded: true, completedAt: new Date().toISOString() },
          },
        }));
      },

      /** Returns all non-soft-deleted videos (published + draft). */
      getVideos() {
        const all = get().adminOverrides ?? DEFAULT_VIDEOS;
        return all.filter((v) => v.deletedAt === null);
      },

      /** Admin-only — includes soft-deleted videos. */
      getAdminVideos() {
        return get().adminOverrides ?? DEFAULT_VIDEOS;
      },

      addVideo(v) {
        const videos = get().getAdminVideos();
        set({ adminOverrides: [...videos, v] });
      },

      removeVideo(id) {
        const videos = get().getAdminVideos();
        set({ adminOverrides: videos.filter((v) => v.id !== id) });
      },

      softDeleteVideo(id) {
        const videos = get().getAdminVideos();
        set({ adminOverrides: videos.map((v) => v.id === id ? { ...v, deletedAt: new Date().toISOString() } : v) });
      },

      restoreVideo(id) {
        const videos = get().getAdminVideos();
        set({ adminOverrides: videos.map((v) => v.id === id ? { ...v, deletedAt: null } : v) });
      },

      editVideo(id, patch) {
        const videos = get().getAdminVideos();
        set({ adminOverrides: videos.map((v) => (v.id === id ? { ...v, ...patch } : v)) });
      },

      reorder(id, direction) {
        const videos = [...get().getVideos()].sort((a, b) => a.order - b.order);
        const idx = videos.findIndex((v) => v.id === id);
        if (idx === -1) return;
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= videos.length) return;
        const updated = [...videos];
        [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
        const reordered = updated.map((v, i) => ({ ...v, order: i }));
        set({ adminOverrides: reordered });
      },

      resetToDefaults() {
        set({ adminOverrides: null });
      },

      async syncProgressToAPI(videoId) {
        const record = get().history[videoId];
        if (!record) return;
        try {
          await fetch(`/api/videos/${videoId}/progress`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getAPIHeaders() },
            body: JSON.stringify({
              progressPct: record.progressPct,
              watchedSeconds: record.watchedSeconds,
            }),
          });
        } catch {
          // Silently fail — local Zustand is cache
        }
      },

      async syncCompleteToAPI(videoId) {
        const record = get().history[videoId];
        try {
          const res = await fetch(`/api/videos/${videoId}/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getAPIHeaders() },
            body: JSON.stringify({ watchedSeconds: record?.watchedSeconds ?? 0 }),
          });
          if (res.ok) {
            const data = await res.json();
            return { xpGranted: data.xpGranted ?? false, xpAmount: data.xpAmount ?? 0 };
          }
        } catch {
          // Silently fail
        }
        return { xpGranted: false, xpAmount: 0 };
      },
    }),
    {
      name: "catalyst-videos",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        history:        s.history,
        adminOverrides: s.adminOverrides,
        quizResults:    s.quizResults,
      }),
    }
  )
);
