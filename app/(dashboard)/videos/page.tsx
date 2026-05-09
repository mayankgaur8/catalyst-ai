"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  Play, BookOpen, Clock, Users, Star, Lock,
  Search, Filter, ChevronRight, Video, FileText, Bookmark, ThumbsUp
} from "lucide-react";
import { cn } from "@/lib/utils";

const VIDEOS = [
  { id: 1, title: "CAT 2024 Strategy: How to Score 99+ Percentile", instructor: "Prof. Arun Kumar", duration: "52:34", views: "82K", rating: 4.9, section: "Strategy", free: true, thumbnail: "S" },
  { id: 2, title: "Number System: Complete Masterclass + Tricks", instructor: "Rajiv Mehta", duration: "1:24:15", views: "45K", rating: 4.8, section: "QA", free: true, thumbnail: "N" },
  { id: 3, title: "RC Mastery: Active Reading for CAT VARC", instructor: "Dr. Priya Nair", duration: "48:22", views: "38K", rating: 4.9, section: "VARC", free: false, thumbnail: "R" },
  { id: 4, title: "DILR: Seating Arrangement Deep Dive", instructor: "Vikram Sharma", duration: "1:12:08", views: "29K", rating: 4.7, section: "DILR", free: false, thumbnail: "D" },
  { id: 5, title: "Algebra Shortcuts You Never Knew Existed", instructor: "Rajiv Mehta", duration: "38:50", views: "24K", rating: 4.8, section: "QA", free: false, thumbnail: "A" },
  { id: 6, title: "Para Jumbles: Framework & Strategy", instructor: "Dr. Priya Nair", duration: "35:15", views: "18K", rating: 4.7, section: "VARC", free: false, thumbnail: "P" },
  { id: 7, title: "Data Interpretation: Advanced Caselet Solving", instructor: "Vikram Sharma", duration: "55:40", views: "15K", rating: 4.8, section: "DILR", free: false, thumbnail: "D" },
  { id: 8, title: "Geometry Shortcuts & CAT PYQs", instructor: "Prof. Arun Kumar", duration: "1:02:18", views: "21K", rating: 4.9, section: "QA", free: false, thumbnail: "G" },
];

const sectionColors: Record<string, string> = {
  QA: "bg-blue-500/20 text-blue-400",
  VARC: "bg-purple-500/20 text-purple-400",
  DILR: "bg-green-500/20 text-green-400",
  Strategy: "bg-yellow-500/20 text-yellow-400",
};

export default function VideosPage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [playing, setPlaying] = useState<number | null>(null);

  const filters = ["All", "QA", "VARC", "DILR", "Strategy"];
  const filtered = VIDEOS.filter(
    (v) => (filter === "All" || v.section === filter) && (search === "" || v.title.toLowerCase().includes(search.toLowerCase()))
  );

  if (playing !== null) {
    const video = VIDEOS.find(v => v.id === playing);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setPlaying(null)} className="p-2 glass rounded-xl text-white/50 hover:text-white border border-white/8">
            ← Back
          </button>
          <h2 className="text-xl font-bold truncate">{video?.title}</h2>
        </div>

        {/* Video Player */}
        <div className="aspect-video glass rounded-2xl border border-white/8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center mx-auto mb-4 glow-blue cursor-pointer">
              <Play size={32} className="text-white ml-1" />
            </div>
            <p className="text-white/40 text-sm">Video player would load here with actual video URL</p>
            <p className="text-white/20 text-xs mt-1">{video?.instructor} • {video?.duration}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass rounded-2xl p-5 border border-white/8">
              <h3 className="font-semibold mb-2">{video?.title}</h3>
              <div className="flex items-center gap-4 text-sm text-white/40 mb-4">
                <span>{video?.instructor}</span>
                <span>•</span>
                <span>{video?.views} views</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-yellow-400" />
                  {video?.rating}
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm text-white/60 hover:text-white border border-white/8">
                  <Bookmark size={14} /> Save
                </button>
                <button className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm text-white/60 hover:text-white border border-white/8">
                  <ThumbsUp size={14} /> Like
                </button>
                <button className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm text-white/60 hover:text-white border border-white/8">
                  <FileText size={14} /> Notes
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white/50">Related Videos</h4>
            {VIDEOS.filter(v => v.section === video?.section && v.id !== playing).slice(0, 3).map(v => (
              <button key={v.id} onClick={() => setPlaying(v.id)} className="w-full text-left glass rounded-xl p-3 border border-white/5 hover:border-white/10 transition-all">
                <p className="text-sm font-medium line-clamp-2">{v.title}</p>
                <p className="text-xs text-white/30 mt-1">{v.duration}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Video Learning</h1>
          <p className="text-white/40 mt-1 text-sm">Expert-led lectures, concept explainers & PYQ walkthroughs</p>
        </div>
        <div className="glass px-4 py-2 rounded-xl border border-white/5">
          <div className="text-xs text-white/30">Progress</div>
          <div className="text-lg font-bold text-neon-blue">8 / 42 watched</div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search videos..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-blue/40"
          />
        </div>
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "text-sm px-3 py-2 rounded-xl border transition-all",
                filter === f ? "bg-neon-blue/20 border-neon-blue/30 text-neon-blue" : "glass border-white/10 text-white/40 hover:text-white"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Featured */}
      <div className="relative overflow-hidden rounded-2xl p-8 border border-neon-blue/20" style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.1), rgba(177,74,237,0.05))" }}>
        <div className="relative">
          <span className="text-xs font-bold text-neon-blue uppercase tracking-wider">Featured</span>
          <h2 className="text-2xl font-bold mt-1 mb-2">CAT 2024 Strategy Masterclass</h2>
          <p className="text-white/50 text-sm mb-4">52 minutes • Prof. Arun Kumar • 82K views</p>
          <button onClick={() => setPlaying(1)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl font-semibold text-sm">
            <Play size={16} /> Watch Now (Free)
          </button>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((video, i) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl border border-white/5 overflow-hidden card-hover"
          >
            {/* Thumbnail */}
            <div className="aspect-video bg-gradient-to-br from-dark-600 to-dark-700 flex items-center justify-center relative">
              <div className="w-16 h-16 rounded-full bg-dark-500 flex items-center justify-center text-2xl font-bold text-white/20">
                {video.thumbnail}
              </div>
              <button
                onClick={() => !video.free ? null : setPlaying(video.id)}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
              >
                <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  {video.free ? <Play size={24} className="text-white ml-1" /> : <Lock size={20} className="text-white" />}
                </div>
              </button>
              {!video.free && (
                <div className="absolute top-2 right-2 bg-neon-purple/80 text-xs px-2 py-0.5 rounded font-bold">PRO</div>
              )}
              <div className="absolute bottom-2 right-2 bg-black/60 text-xs px-2 py-0.5 rounded">{video.duration}</div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={cn("text-xs px-2 py-0.5 rounded font-medium", sectionColors[video.section])}>{video.section}</span>
                <div className="flex items-center gap-1 text-xs text-yellow-400">
                  <Star size={11} /> {video.rating}
                </div>
              </div>
              <h3 className="font-semibold text-sm leading-tight mb-2 line-clamp-2">{video.title}</h3>
              <div className="flex items-center justify-between text-xs text-white/30">
                <span>{video.instructor}</span>
                <span>{video.views} views</span>
              </div>
              <button
                onClick={() => setPlaying(video.id)}
                className={cn(
                  "w-full mt-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
                  video.free
                    ? "bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30 border border-neon-blue/20"
                    : "bg-white/5 text-white/40 hover:bg-white/8 border border-white/8"
                )}
              >
                {video.free ? <><Play size={12} /> Watch Free</> : <><Lock size={12} /> Unlock with PRO</>}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
