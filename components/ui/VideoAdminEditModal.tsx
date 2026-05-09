"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";
import { motion } from "framer-motion";
import { VideoLesson, VideoCategory, VideoAccess } from "@/lib/videos";
import { useVideoStore } from "@/store/useVideoStore";
import { cn } from "@/lib/utils";

interface Props {
  video: VideoLesson;
  isNew: boolean;
  onClose: () => void;
}

const CATEGORIES: VideoCategory[] = ["Strategy", "QA", "VARC", "DILR"];

export default function VideoAdminEditModal({ video, isNew, onClose }: Props) {
  const { addVideo, editVideo } = useVideoStore();
  const [form, setForm] = useState<VideoLesson>({ ...video });

  function set<K extends keyof VideoLesson>(key: K, val: VideoLesson[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSave() {
    const trimmed: VideoLesson = {
      ...form,
      youtubeId: form.youtubeId?.trim() || null,
      title: form.title.trim(),
      instructor: form.instructor.trim(),
      description: form.description.trim(),
      tags: typeof form.tags === "string"
        ? (form.tags as unknown as string).split(",").map((t) => t.trim()).filter(Boolean)
        : form.tags,
    };
    if (isNew) {
      addVideo(trimmed);
    } else {
      editVideo(trimmed.id, trimmed);
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="w-full max-w-xl bg-dark-800 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="font-semibold text-sm">{isNew ? "Add Video" : "Edit Video"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <Field label="Title">
            <input value={form.title} onChange={(e) => set("title", e.target.value)} className={input()} />
          </Field>

          <Field label="YouTube Video ID" hint="e.g. lSIyjEf267E">
            <input value={form.youtubeId ?? ""} onChange={(e) => set("youtubeId", e.target.value || null)} className={input()} placeholder="Leave blank if unavailable" />
          </Field>

          <Field label="Instructor">
            <input value={form.instructor} onChange={(e) => set("instructor", e.target.value)} className={input()} />
          </Field>

          <Field label="Description">
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className={cn(input(), "resize-none")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Duration">
              <input value={form.duration} onChange={(e) => set("duration", e.target.value)} className={input()} placeholder="52:34" />
            </Field>
            <Field label="Views (display)">
              <input value={form.views} onChange={(e) => set("views", e.target.value)} className={input()} placeholder="82K" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Rating">
              <input type="number" min={1} max={5} step={0.1} value={form.rating} onChange={(e) => set("rating", parseFloat(e.target.value))} className={input()} />
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={(e) => set("category", e.target.value as VideoCategory)} className={cn(input(), "cursor-pointer")}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Access">
              <select value={form.access} onChange={(e) => set("access", e.target.value as VideoAccess)} className={cn(input(), "cursor-pointer")}>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
              </select>
            </Field>
            <Field label="Featured">
              <select value={form.featured ? "yes" : "no"} onChange={(e) => set("featured", e.target.value === "yes")} className={cn(input(), "cursor-pointer")}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </Field>
          </div>

          <Field label="Tags" hint="Comma-separated">
            <input
              value={Array.isArray(form.tags) ? form.tags.join(", ") : form.tags}
              onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
              className={input()}
              placeholder="CAT 2024, Strategy, MBA"
            />
          </Field>
        </div>

        <div className="px-5 py-4 border-t border-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-white/40 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.title.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-neon-blue/90 hover:bg-neon-blue rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={14} /> {isNew ? "Add Video" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/50">
        {label}
        {hint && <span className="ml-1 text-white/25 font-normal">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

function input() {
  return "w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-blue/40 transition-colors";
}
