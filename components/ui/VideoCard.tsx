"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play, Lock, Star, Clock, Eye, Edit2, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoLesson, CATEGORY_COLORS, ytThumbnail } from "@/lib/videos";
import { useVideoStore } from "@/store/useVideoStore";

interface VideoCardProps {
  video: VideoLesson;
  index?: number;
  isAdmin?: boolean;
  onPlay: (video: VideoLesson) => void;
  onEdit?: (video: VideoLesson) => void;
  onDelete?: (id: string) => void;
  onReorder?: (id: string, dir: "up" | "down") => void;
}

export default function VideoCard({
  video,
  index = 0,
  isAdmin = false,
  onPlay,
  onEdit,
  onDelete,
  onReorder,
}: VideoCardProps) {
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const history = useVideoStore((s) => s.history[video.id]);

  const progressPct = history?.progressPct ?? 0;
  const isWatched = progressPct >= 95;
  const thumbnailUrl = video.youtubeId ? ytThumbnail(video.youtubeId, "maxresdefault") : null;
  const fallbackUrl = video.youtubeId ? ytThumbnail(video.youtubeId, "hqdefault") : null;
  const isFree = video.access === "free";

  function handleThumbError() {
    if (!thumbError && fallbackUrl) {
      setThumbError(true);
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass rounded-2xl border border-white/5 overflow-hidden group card-hover focus-within:border-neon-blue/30"
      aria-label={video.title}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-dark-700 overflow-hidden">
        {/* Skeleton shimmer while thumbnail loads */}
        {!thumbLoaded && thumbnailUrl && (
          <div className="absolute inset-0 skeleton" />
        )}

        {/* Placeholder when no YouTube ID */}
        {!thumbnailUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-dark-600 to-dark-700">
            <span className="text-4xl font-black text-white/10 select-none">
              {video.category[0]}
            </span>
          </div>
        )}

        {/* YouTube thumbnail */}
        {thumbnailUrl && (
          <Image
            src={thumbError && fallbackUrl ? fallbackUrl : thumbnailUrl}
            alt={video.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className={cn(
              "object-cover transition-all duration-500 group-hover:scale-105",
              thumbLoaded ? "opacity-100" : "opacity-0"
            )}
            loading="lazy"
            onLoad={() => setThumbLoaded(true)}
            onError={handleThumbError}
            unoptimized={false}
          />
        )}

        {/* Hover overlay + play/lock button */}
        <button
          onClick={() => onPlay(video)}
          disabled={!isFree && !isAdmin}
          aria-label={isFree || isAdmin ? `Play ${video.title}` : `Unlock ${video.title} with PRO`}
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-all duration-200",
            "bg-black/0 hover:bg-black/40 focus:bg-black/40",
            (!isFree && !isAdmin) && "cursor-not-allowed"
          )}
        >
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200",
            "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100",
            isFree || isAdmin
              ? "bg-neon-blue/80 neon-play-btn"
              : "bg-white/15"
          )}>
            {isFree || isAdmin
              ? <Play size={22} className="text-white ml-1" fill="white" />
              : <Lock size={18} className="text-white" />
            }
          </div>
        </button>

        {/* PRO badge */}
        {!isFree && (
          <div className="absolute top-2 right-2 bg-neon-purple/85 backdrop-blur-sm text-[10px] px-2 py-0.5 rounded font-bold tracking-wide">
            PRO
          </div>
        )}

        {/* Duration */}
        <div className="absolute bottom-2 right-2 bg-black/65 backdrop-blur-sm text-[11px] px-2 py-0.5 rounded font-medium">
          {video.duration}
        </div>

        {/* Watch progress bar */}
        {progressPct > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              className={cn("h-full transition-all", isWatched ? "bg-green-400" : "bg-neon-blue")}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        {/* Admin controls overlay */}
        {isAdmin && (
          <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onReorder?.(video.id, "up"); }}
              className="p-1 rounded bg-black/60 text-white/70 hover:text-white"
              aria-label="Move up"
            >
              <ArrowUp size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onReorder?.(video.id, "down"); }}
              className="p-1 rounded bg-black/60 text-white/70 hover:text-white"
              aria-label="Move down"
            >
              <ArrowDown size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wide",
            CATEGORY_COLORS[video.category]
          )}>
            {video.category}
          </span>
          <div className="flex items-center gap-1 text-xs text-yellow-400 flex-shrink-0">
            <Star size={11} fill="currentColor" /> {video.rating}
          </div>
        </div>

        <h3 className="font-semibold text-sm leading-tight mb-2 line-clamp-2">{video.title}</h3>

        <div className="flex items-center justify-between text-xs text-white/30 mb-3">
          <span className="truncate">{video.instructor}</span>
          <span className="flex items-center gap-1 flex-shrink-0">
            <Eye size={10} /> {video.views}
          </span>
        </div>

        {/* Watch history indicator */}
        {progressPct > 0 && (
          <div className="text-[10px] text-white/25 mb-2 flex items-center gap-1">
            <Clock size={9} />
            {isWatched ? "Completed" : `${Math.round(progressPct)}% watched`}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onPlay(video)}
            disabled={!isFree && !isAdmin}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
              isFree || isAdmin
                ? "bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30 border border-neon-blue/20"
                : "bg-white/5 text-white/35 border border-white/8 cursor-not-allowed"
            )}
          >
            {isFree || isAdmin
              ? <><Play size={11} fill="currentColor" /> Watch Free</>
              : <><Lock size={11} /> Unlock with PRO</>
            }
          </button>

          {/* Admin edit/delete */}
          {isAdmin && (
            <>
              <button
                onClick={() => onEdit?.(video)}
                className="p-2 rounded-xl text-white/40 hover:text-neon-blue hover:bg-neon-blue/10 border border-white/8 transition-all"
                aria-label="Edit video"
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={() => onDelete?.(video.id)}
                className="p-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-400/10 border border-white/8 transition-all"
                aria-label="Delete video"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.article>
  );
}
