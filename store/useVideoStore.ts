import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { VideoLesson, DEFAULT_VIDEOS } from "@/lib/videos";

export interface WatchRecord {
  videoId: string;
  progressPct: number;
  xpAwarded: boolean;
  lastWatched: string;
  completedAt: string | null;
}

interface VideoState {
  history: Record<string, WatchRecord>;
  // null = use DEFAULT_VIDEOS; populated = admin has made edits
  adminOverrides: VideoLesson[] | null;
}

interface VideoActions {
  updateProgress: (videoId: string, pct: number) => void;
  markXpAwarded: (videoId: string) => void;
  // admin CRUD
  getVideos: () => VideoLesson[];
  addVideo: (v: VideoLesson) => void;
  removeVideo: (id: string) => void;
  editVideo: (id: string, patch: Partial<VideoLesson>) => void;
  reorder: (id: string, direction: "up" | "down") => void;
  resetToDefaults: () => void;
}

export const useVideoStore = create<VideoState & VideoActions>()(
  persist(
    (set, get) => ({
      history: {},
      adminOverrides: null,

      updateProgress(videoId, pct) {
        set((s) => {
          const prev = s.history[videoId];
          const newPct = Math.max(prev?.progressPct ?? 0, pct);
          return {
            history: {
              ...s.history,
              [videoId]: {
                videoId,
                progressPct: newPct,
                xpAwarded: prev?.xpAwarded ?? false,
                lastWatched: new Date().toISOString(),
                completedAt: newPct >= 95 ? (prev?.completedAt ?? new Date().toISOString()) : (prev?.completedAt ?? null),
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
              ...(s.history[videoId] ?? { videoId, progressPct: 0, lastWatched: new Date().toISOString(), completedAt: null }),
              xpAwarded: true,
            },
          },
        }));
      },

      getVideos() {
        return get().adminOverrides ?? DEFAULT_VIDEOS;
      },

      addVideo(v) {
        const videos = get().getVideos();
        set({ adminOverrides: [...videos, v] });
      },

      removeVideo(id) {
        const videos = get().getVideos();
        set({ adminOverrides: videos.filter((v) => v.id !== id) });
      },

      editVideo(id, patch) {
        const videos = get().getVideos();
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
    }),
    {
      name: "catalyst-videos",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ history: s.history, adminOverrides: s.adminOverrides }),
    }
  )
);
