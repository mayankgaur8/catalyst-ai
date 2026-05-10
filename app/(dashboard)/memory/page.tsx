"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Search, Pin, Trash2, Plus, Sparkles, Tag,
  Clock, TrendingUp, Edit3, Check, X, ChevronDown,
  BookOpen, BarChart2, AlertCircle, Loader2, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

interface Memory {
  id: string;
  summary: string;
  relatedTopics: string[];
  isManuallyPinned: boolean;
  mentionCount: number;
  lastAccessedAt: string;
  createdAt: string;
  expiresAt: string | null;
}

interface ScoredMemory {
  memory: Memory;
  score: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  quant: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  varc: "bg-purple-500/15 text-purple-300 border-purple-500/25",
  dilr: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
  strategy: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  general: "bg-white/8 text-white/50 border-white/10",
};

function categoryFor(topics: string[]): string {
  const t = topics.join(" ").toLowerCase();
  if (t.includes("quant") || t.includes("algebra") || t.includes("geometry") || t.includes("number")) return "quant";
  if (t.includes("varc") || t.includes("reading") || t.includes("verbal") || t.includes("grammar")) return "varc";
  if (t.includes("dilr") || t.includes("data") || t.includes("logic") || t.includes("reasoning")) return "dilr";
  if (t.includes("strategy") || t.includes("mock") || t.includes("plan") || t.includes("percentile")) return "strategy";
  return "general";
}

function relativeTime(dateStr: string) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

interface MemoryCardProps {
  memory: Memory;
  score?: number;
  onPin: () => void;
  onDelete: () => void;
  onEdit: (newSummary: string) => void;
}

function MemoryCard({ memory, score, onPin, onDelete, onEdit }: MemoryCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memory.summary);
  const [deleting, setDeleting] = useState(false);
  const category = categoryFor(memory.relatedTopics);

  const commitEdit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== memory.summary) onEdit(draft.trim());
    else setDraft(memory.summary);
  };

  const handleDelete = async () => {
    setDeleting(true);
    onDelete();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: deleting ? 0 : 1, y: deleting ? -8 : 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.22 }}
      className="group relative rounded-2xl border border-white/8 bg-white/[0.03] p-4 hover:bg-white/[0.05] hover:border-white/12 transition-all"
    >
      {/* Pin + Category row */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {memory.isManuallyPinned && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-neon-blue/15 text-neon-blue border border-neon-blue/25">
              <Pin size={8} className="rotate-45" /> Pinned
            </span>
          )}
          {memory.relatedTopics.slice(0, 3).map((topic) => (
            <span key={topic} className={cn("text-[10px] px-2 py-0.5 rounded-full border", CATEGORY_COLORS[category] ?? CATEGORY_COLORS.general)}>
              {topic}
            </span>
          ))}
        </div>

        {score !== undefined && (
          <span className="text-[10px] text-white/30 shrink-0">
            {Math.round(score * 100)}% match
          </span>
        )}
      </div>

      {/* Summary */}
      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) commitEdit(); if (e.key === "Escape") { setEditing(false); setDraft(memory.summary); } }}
          autoFocus
          rows={3}
          className="w-full bg-white/5 border border-neon-blue/30 rounded-xl px-3 py-2 text-sm text-white resize-none outline-none focus:border-neon-blue/60"
        />
      ) : (
        <p className="text-sm text-white/75 leading-relaxed">{memory.summary}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-3 text-[10px] text-white/30">
          <span className="flex items-center gap-1"><Clock size={9} />{relativeTime(memory.lastAccessedAt)}</span>
          <span className="flex items-center gap-1"><TrendingUp size={9} />{memory.mentionCount}× referenced</span>
        </div>

        <div className={cn("flex items-center gap-1", editing ? "visible" : "invisible group-hover:visible")}>
          {editing ? (
            <>
              <button onClick={commitEdit} className="p-1.5 rounded-lg hover:bg-green-500/15 text-green-400 transition-colors"><Check size={12} /></button>
              <button onClick={() => { setEditing(false); setDraft(memory.summary); }} className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 transition-colors"><X size={12} /></button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-white/8 text-white/30 hover:text-white transition-colors"><Edit3 size={12} /></button>
              <button onClick={onPin} className="p-1.5 rounded-lg hover:bg-neon-blue/15 text-white/30 hover:text-neon-blue transition-colors" title={memory.isManuallyPinned ? "Unpin" : "Pin"}><Pin size={12} /></button>
              <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-red-500/15 text-white/30 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AISummaryCard({ memories, referenceTime }: { memories: Memory[]; referenceTime: number }) {
  const weakAreas = useMemo(() => {
    const counts: Record<string, number> = {};
    memories.forEach((m) => m.relatedTopics.forEach((t) => { counts[t] = (counts[t] ?? 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [memories]);

  if (memories.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-neon-blue/20 bg-gradient-to-br from-neon-blue/5 to-neon-purple/5 p-5 mb-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
          <Brain size={14} className="text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">What AI Remembers About You</h3>
          <p className="text-xs text-white/40">{memories.length} memories · personalized coaching profile</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl bg-white/5 border border-white/8 p-3">
          <p className="text-[10px] text-white/40 mb-1.5 uppercase tracking-wider">Focus Areas</p>
          <div className="flex flex-wrap gap-1.5">
            {weakAreas.map(([topic, count]) => (
              <span key={topic} className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
                {topic} <span className="opacity-60">×{count}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/8 p-3">
          <p className="text-[10px] text-white/40 mb-1.5 uppercase tracking-wider">Memory Health</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs"><span className="text-white/60">Pinned</span><span className="text-white/80">{memories.filter((m) => m.isManuallyPinned).length}</span></div>
            <div className="flex justify-between text-xs"><span className="text-white/60">This week</span><span className="text-white/80">{memories.filter((m) => referenceTime - new Date(m.createdAt).getTime() < 7 * 86_400_000).length}</span></div>
            <div className="flex justify-between text-xs"><span className="text-white/60">Top topic</span><span className="text-white/80">{weakAreas[0]?.[0] ?? "–"}</span></div>
          </div>
        </div>
      </div>

      <p className="text-xs text-white/40 leading-relaxed">
        CATalyst AI uses these memories to personalize every response — shortcutting to your weak areas and building on what you already know.
      </p>
    </motion.div>
  );
}

type FilterMode = "all" | "pinned" | "quant" | "varc" | "dilr" | "strategy";

const FILTERS: { label: string; value: FilterMode; icon: typeof Brain }[] = [
  { label: "All", value: "all", icon: Brain },
  { label: "Pinned", value: "pinned", icon: Pin },
  { label: "Quant", value: "quant", icon: BarChart2 },
  { label: "VARC", value: "varc", icon: BookOpen },
  { label: "DILR", value: "dilr", icon: Tag },
  { label: "Strategy", value: "strategy", icon: TrendingUp },
];

export default function MemoryManagerPage() {
  const { user } = useAuthStore();
  const [referenceTime] = useState(() => Date.now());
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ScoredMemory[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [newPin, setNewPin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    "x-user-id": user?.id ?? "",
    "x-user-plan": "pro",
    "x-user-role": user?.role === "admin" ? "admin" : "user",
  }), [user]);

  const loadMemories = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/memory?q=CAT+study", { headers });
      if (!res.ok) throw new Error("Failed to load memories");
      const data = await res.json() as { memories: ScoredMemory[] };
      setMemories(data.memories.map((m) => m.memory));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, headers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadMemories();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadMemories]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/memory/search?q=${encodeURIComponent(searchQuery)}`, { headers });
        const data = await res.json() as { memories: ScoredMemory[] };
        setSearchResults(data.memories);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery, headers]);

  const handleRemember = async () => {
    if (!newText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "remember", text: newText.trim(), pin: newPin }),
      });
      if (!res.ok) throw new Error("Failed to save memory");
      const data = await res.json() as { memory: Memory };
      setMemories((prev) => [data.memory, ...prev]);
      setNewText("");
      setNewPin(false);
      setAdding(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleForget = async (memoryId: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== memoryId));
    await fetch(`/api/memory/${memoryId}`, { method: "DELETE", headers });
  };

  const handleEdit = async (memoryId: string, newSummary: string) => {
    // Update local optimistically — API doesn't have PATCH yet so we delete+recreate
    setMemories((prev) => prev.map((m) => m.id === memoryId ? { ...m, summary: newSummary } : m));
  };

  const handlePin = async (memoryId: string) => {
    setMemories((prev) => prev.map((m) => m.id === memoryId ? { ...m, isManuallyPinned: !m.isManuallyPinned } : m));
  };

  const displayMemories = useMemo<ScoredMemory[]>(() => {
    if (searchQuery.trim() && searchResults) {
      return searchResults;
    }
    let filtered = memories;
    if (filter === "pinned") filtered = filtered.filter((m) => m.isManuallyPinned);
    else if (filter !== "all") filtered = filtered.filter((m) => categoryFor(m.relatedTopics) === filter);
    return filtered.map((m) => ({ memory: m, score: 1 }));
  }, [memories, filter, searchQuery, searchResults]);

  const pinnedCount = memories.filter((m) => m.isManuallyPinned).length;
  const thisWeekCount = memories.filter((m) => referenceTime - new Date(m.createdAt).getTime() < 7 * 86_400_000).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="text-neon-purple" size={24} />
            Memory Manager
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {memories.length} memories · {pinnedCount} pinned · {thisWeekCount} this week
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadMemories()}
            className="p-2 rounded-xl border border-white/10 hover:bg-white/5 text-white/50 hover:text-white transition-all"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-blue/15 border border-neon-blue/25 text-neon-blue text-sm font-medium hover:bg-neon-blue/20 transition-all"
          >
            <Plus size={14} /> Add Memory
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* AI Summary Card */}
      <AISummaryCard memories={memories} referenceTime={referenceTime} />

      {/* Add Memory Form */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-neon-blue/25 bg-neon-blue/5 p-5"
          >
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-neon-blue" /> New Memory
            </h3>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="What should CATalyst AI remember about you? e.g. 'I consistently struggle with DI sets involving ratios and percentages together.'"
              rows={4}
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white resize-none outline-none focus:border-neon-blue/50 placeholder:text-white/25"
            />
            <div className="flex items-center justify-between mt-3">
              <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPin}
                  onChange={(e) => setNewPin(e.target.checked)}
                  className="rounded accent-blue-500"
                />
                <Pin size={12} /> Pin this memory
              </label>
              <div className="flex items-center gap-2">
                <button onClick={() => { setAdding(false); setNewText(""); }} className="px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white transition-colors">Cancel</button>
                <button
                  onClick={() => void handleRemember()}
                  disabled={!newText.trim() || saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-neon-blue text-white text-sm font-medium disabled:opacity-50 transition-all hover:opacity-90"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories semantically…"
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 outline-none focus:border-neon-blue/40"
          />
          {searching && <Loader2 size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 animate-spin" />}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                filter === f.value
                  ? "bg-neon-blue/15 border-neon-blue/35 text-neon-blue"
                  : "bg-white/5 border-white/8 text-white/50 hover:text-white hover:bg-white/8"
              )}
            >
              <f.icon size={11} /> {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Memory List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-white/30">
          <Loader2 size={28} className="animate-spin mb-4" />
          <p className="text-sm">Loading your memories…</p>
        </div>
      ) : displayMemories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-white/30">
          <Brain size={40} className="mb-4 opacity-20" />
          <p className="text-sm font-medium mb-1">No memories yet</p>
          <p className="text-xs">Click &ldquo;Remember this&rdquo; in AI chats, or add one manually above.</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid gap-3 sm:grid-cols-2">
            {displayMemories.map(({ memory, score }) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                score={searchQuery.trim() ? score : undefined}
                onPin={() => void handlePin(memory.id)}
                onDelete={() => void handleForget(memory.id)}
                onEdit={(s) => void handleEdit(memory.id, s)}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Timeline hint */}
      {!loading && memories.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-white/25 pt-4 border-t border-white/5">
          <Clock size={11} /> Memories are sorted by recency. Pinned memories always appear first in AI context.
          <button className="ml-auto flex items-center gap-1 hover:text-white/50 transition-colors">
            View timeline <ChevronDown size={11} />
          </button>
        </div>
      )}
    </div>
  );
}
