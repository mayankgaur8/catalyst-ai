"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Search, Play, Star, Eye, RotateCcw, ShieldCheck,
  PlusCircle, ChevronRight, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoLesson, VideoCategory, CATEGORY_COLORS, ytThumbnail, canAccessVideo } from "@/lib/videos";
import { useVideoStore } from "@/store/useVideoStore";
import { useAuthStore } from "@/store/useAuthStore";
import VideoCard from "@/components/ui/VideoCard";

// Lazy-load the modal so the YT iframe API is only fetched on demand
const VideoModal = dynamic(() => import("@/components/ui/VideoModal"), { ssr: false });

// Lazy-load the admin edit modal
const AdminEditModal = dynamic(() => import("@/components/ui/VideoAdminEditModal"), { ssr: false });

const FILTERS: Array<"All" | VideoCategory> = ["All", "Strategy", "QA", "VARC", "DILR"];

const FILTER_COLORS: Record<string, string> = {
  Strategy: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  QA:       "text-blue-400 bg-blue-500/10 border-blue-500/20",
  VARC:     "text-purple-400 bg-purple-500/10 border-purple-500/20",
  DILR:     "text-green-400 bg-green-500/10 border-green-500/20",
};

export default function VideosPage() {
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState<"All" | VideoCategory>("All");
  const [activeVideo, setActiveVideo] = useState<VideoLesson | null>(null);
  const [editTarget, setEditTarget]   = useState<VideoLesson | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { getVideos, softDeleteVideo, reorder, resetToDefaults, history } = useVideoStore();
  const { isAdmin, plan, previewPlan } = useAuthStore();

  // Use preview plan if admin is testing, otherwise use user's actual plan
  const userPlan = isAdmin && previewPlan ? previewPlan : plan;

  const allVideos = getVideos().sort((a, b) => a.order - b.order);

  const featured = useMemo(
    () => allVideos.find((v) => v.featured) ?? allVideos[0],
    [allVideos]
  );

  const recentlyWatched = useMemo(() => {
    return allVideos
      .filter((v) => history[v.id]?.lastWatched)
      .sort((a, b) => {
        const ta = new Date(history[a.id]?.lastWatched ?? 0).getTime();
        const tb = new Date(history[b.id]?.lastWatched ?? 0).getTime();
        return tb - ta;
      })
      .slice(0, 4);
  }, [allVideos, history]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allVideos.filter((v) => {
      // Non-admins: hide draft videos and inaccessible plan-gated videos
      if (!isAdmin) {
        if (v.status !== "published") return false;
        if (!canAccessVideo(userPlan ?? "free", v.access, false)) return false;
      }
      const matchCat = filter === "All" || v.category === filter;
      const matchQ   = !q || v.title.toLowerCase().includes(q) || v.instructor.toLowerCase().includes(q) || v.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchQ;
    });
  }, [allVideos, filter, search, isAdmin, userPlan]);

  const watchedCount = Object.values(history).filter((r) => r.progressPct >= 95).length;

  function handleDelete(id: string) {
    if (deleteConfirm === id) {
      softDeleteVideo(id);   // soft delete — sets deletedAt, recoverable via resetToDefaults
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Video Learning</h1>
            <p className="text-white/40 mt-1 text-sm">Expert-led lectures, concept explainers &amp; PYQ walkthroughs</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress counter */}
            <div className="glass px-4 py-2 rounded-xl border border-white/5 text-right">
              <div className="text-[10px] text-white/30 uppercase tracking-wide">Completed</div>
              <div className="text-lg font-bold text-neon-blue">{watchedCount} / {allVideos.length}</div>
            </div>
            {/* Admin reset */}
            {isAdmin && (
              <button
                onClick={resetToDefaults}
                className="flex items-center gap-1.5 px-3 py-2 glass rounded-xl text-xs text-white/40 hover:text-white border border-white/8 transition-all"
              >
                <RotateCcw size={13} /> Reset order
              </button>
            )}
          </div>
        </div>

        {/* Admin banner */}
        {isAdmin && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs">
            <ShieldCheck size={15} />
            <span className="font-semibold">Admin mode</span>
            <span className="text-yellow-400/60">— hover cards to edit, reorder, or soft-delete. Reset restores all.</span>
            {allVideos.some((v) => v.status === "draft") && (
              <span className="px-2 py-0.5 bg-yellow-400/20 border border-yellow-400/30 rounded-full text-[10px] font-bold">
                {allVideos.filter((v) => v.status === "draft").length} draft
              </span>
            )}
            <button
              onClick={() => setEditTarget({ id: `v${Date.now()}`, youtubeId: "", title: "", instructor: "", description: "", duration: "", views: "0", rating: 4.5, category: "Strategy", access: "free", tags: [], featured: false, order: allVideos.length, status: "draft", deletedAt: null })}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/20 border border-yellow-400/30 rounded-lg hover:bg-yellow-400/30 transition-all font-semibold"
            >
              <PlusCircle size={13} /> Add video
            </button>
          </div>
        )}

        {/* ── Recently Watched ──────────────────────────────────────────────── */}
        {recentlyWatched.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-white/40 uppercase tracking-wider">
                <Clock size={11} /> Recently Watched
              </span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {recentlyWatched.map((v) => (
                <RecentVideoRow
                  key={v.id}
                  video={v}
                  progressPct={history[v.id]?.progressPct ?? 0}
                  onPlay={setActiveVideo}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Featured hero ─────────────────────────────────────────────────── */}
        {featured && <FeaturedHero video={featured} onPlay={setActiveVideo} />}

        {/* ── Search + filters ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search videos, topics, instructors..."
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-blue/40 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "text-xs px-3 py-2 rounded-xl border font-medium transition-all",
                  filter === f
                    ? f === "All"
                      ? "bg-neon-blue/20 border-neon-blue/30 text-neon-blue"
                      : cn("border", FILTER_COLORS[f])
                    : "glass border-white/10 text-white/40 hover:text-white"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Strategy section header ───────────────────────────────────────── */}
        {(filter === "All" || filter === "Strategy") && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider px-2 py-1 bg-yellow-400/10 rounded-lg border border-yellow-400/20">
              Strategy
            </span>
            <div className="flex-1 h-px bg-white/5" />
            <button
              onClick={() => setFilter("Strategy")}
              className="text-xs text-white/30 hover:text-white flex items-center gap-1 transition-colors"
            >
              See all <ChevronRight size={12} />
            </button>
          </div>
        )}

        {/* ── Video grid ───────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center text-white/30 text-sm"
            >
              No videos match your search.
            </motion.div>
          ) : (
            <motion.div
              key={filter + search}
              className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5"
            >
              {filtered.map((v, i) => (
                <VideoCard
                  key={v.id}
                  video={v}
                  index={i}
                  isAdmin={isAdmin}
                  userPlan={userPlan ?? "free"}
                  onPlay={setActiveVideo}
                  onEdit={setEditTarget}
                  onDelete={handleDelete}
                  onReorder={reorder}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete confirmation toast-style hint */}
        <AnimatePresence>
          {deleteConfirm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 px-5 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm backdrop-blur-xl"
            >
              Click Delete again to confirm removal.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Video player modal ─────────────────────────────────────────────── */}
      {activeVideo && (
        <VideoModal
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
          onNavigate={setActiveVideo}
        />
      )}

      {/* ── Admin edit modal ───────────────────────────────────────────────── */}
      {editTarget && (
        <AdminEditModal
          video={editTarget}
          isNew={!allVideos.find((v) => v.id === editTarget.id)}
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  );
}

// ── Recently Watched row card ──────────────────────────────────────────────────

function RecentVideoRow({
  video,
  progressPct,
  onPlay,
}: {
  video: VideoLesson;
  progressPct: number;
  onPlay: (v: VideoLesson) => void;
}) {
  const isCompleted = progressPct >= 95;
  const thumbnailUrl = video.youtubeId ? ytThumbnail(video.youtubeId, "hqdefault") : null;

  return (
    <button
      onClick={() => onPlay(video)}
      className="group relative rounded-xl overflow-hidden border border-white/8 hover:border-neon-blue/30 bg-dark-700 transition-all hover:shadow-[0_0_20px_rgba(0,212,255,0.15)] text-left"
      aria-label={`Resume ${video.title}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-dark-600">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-black text-white/10">{video.category[0]}</span>
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div className="w-8 h-8 rounded-full bg-neon-blue/90 flex items-center justify-center shadow-[0_0_16px_rgba(0,212,255,0.6)]">
            <Play size={12} className="ml-0.5" fill="white" />
          </div>
        </div>
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
          <div
            className={cn("h-full transition-all", isCompleted ? "bg-green-400" : "bg-neon-blue")}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
      {/* Title + progress label */}
      <div className="px-2.5 py-2">
        <p className="text-[11px] font-medium leading-snug line-clamp-2 text-white/70 group-hover:text-white transition-colors">
          {video.title}
        </p>
        <p className="text-[10px] text-white/30 mt-0.5">
          {isCompleted ? "Completed" : `${Math.round(progressPct)}% watched`}
        </p>
      </div>
    </button>
  );
}

// ── Featured hero card ─────────────────────────────────────────────────────────

function FeaturedHero({ video, onPlay }: { video: VideoLesson; onPlay: (v: VideoLesson) => void }) {
  const thumbnailUrl = video.youtubeId ? ytThumbnail(video.youtubeId, "maxresdefault") : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neon-blue/20 min-h-[220px] flex items-end">
      {/* Background thumbnail */}
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={video.title}
          fill
          className="object-cover opacity-30"
          priority
          sizes="100vw"
          onError={(e) => {
            // fallback to hqdefault on error
            const img = e.currentTarget as HTMLImageElement;
            if (video.youtubeId && !img.src.includes("hqdefault")) {
              img.src = ytThumbnail(video.youtubeId, "hqdefault");
            }
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/10 to-neon-purple/10" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-dark-900/80 to-transparent" />

      {/* Content */}
      <div className="relative z-10 p-6 lg:p-8 w-full">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold text-neon-blue uppercase tracking-widest px-2 py-1 bg-neon-blue/15 rounded-lg border border-neon-blue/20">
            Featured
          </span>
          <span className={cn("text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border", CATEGORY_COLORS[video.category])}>
            {video.category}
          </span>
          {video.access === "free" && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-green-500/15 border border-green-500/20 text-green-400">
              Free
            </span>
          )}
        </div>

        <h2 className="text-xl lg:text-2xl font-bold mb-1 max-w-2xl leading-tight">{video.title}</h2>

        <div className="flex flex-wrap items-center gap-3 text-xs text-white/50 mb-4">
          <span>{video.instructor}</span>
          <span>·</span>
          <span>{video.duration}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Eye size={11} /> {video.views} views
          </span>
          <span>·</span>
          <span className="flex items-center gap-1 text-yellow-400">
            <Star size={11} fill="currentColor" /> {video.rating}
          </span>
        </div>

        <button
          onClick={() => onPlay(video)}
          className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl font-semibold text-sm shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] transition-all active:scale-95"
        >
          <Play size={16} fill="white" /> Watch Free
        </button>
      </div>
    </div>
  );
}
