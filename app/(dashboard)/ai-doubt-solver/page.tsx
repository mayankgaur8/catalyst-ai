"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import {
  Brain, Upload, Mic, Send, Sparkles, ArrowRight,
  AlertCircle, Square, Plus, Search, Pin, Pencil, Trash2,
  RefreshCw, RotateCcw, MessageSquare, Loader2,
  Zap, BookOpen, FlaskConical, FileText, Copy, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import {
  useConversationStore,
  relativeTime,
  type ChatMessage,
} from "@/store/useConversationStore";
import { MarkdownMessage } from "@/components/ai/MarkdownMessage";

// ── Constants ─────────────────────────────────────────────────────────────────

const DOUBT_EXAMPLES = [
  "What is the remainder when 7^100 is divided by 48?",
  "How to solve seating arrangement problems quickly?",
  "Explain the concept of AP and GP with shortcuts",
  "When should I use permutation vs combination?",
  "How to identify the main idea in an RC passage?",
];

const QUICK_ACTIONS = [
  { id: "explain_simpler", label: "Explain simpler",    icon: Brain,        prompt: "Explain that in even simpler words, like I'm a complete beginner to this topic." },
  { id: "shortcut",        label: "Shortcut trick",     icon: Zap,          prompt: "What is the fastest shortcut trick or formula for this type of CAT question?" },
  { id: "practice",        label: "Practice questions", icon: FlaskConical, prompt: "Generate 3 fresh CAT-level practice questions on exactly this topic, with full solutions." },
  { id: "flashcards",      label: "Create flashcards",  icon: FileText,     prompt: "Create 5 concise flashcard Q&A pairs to help me memorize this concept." },
] as const;

const STREAM_TIMEOUT_MS = 30_000;

// ── Sidebar: single conversation item ────────────────────────────────────────

interface ConvItemProps {
  conv:     { id: string; title: string; isPinned: boolean; updatedAt: string };
  isActive: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  onPin:    () => void;
}

function ConvItem({ conv, isActive, onSelect, onRename, onDelete, onPin }: ConvItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(conv.title);
  const inputRef              = useRef<HTMLInputElement>(null);

  const commitRename = useCallback(() => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== conv.title) onRename(draft.trim());
    else setDraft(conv.title);
  }, [draft, conv.title, onRename]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm",
        isActive
          ? "bg-neon-blue/15 border border-neon-blue/25 text-white"
          : "hover:bg-white/5 border border-transparent text-white/50 hover:text-white/80"
      )}
      onClick={() => { if (!editing) onSelect(); }}
    >
      <MessageSquare size={13} className={cn("flex-shrink-0", isActive ? "text-neon-blue" : "text-white/25")} />

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") { setEditing(false); setDraft(conv.title); }
            }}
            onBlur={commitRename}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent border-b border-neon-blue/40 outline-none text-white text-sm pb-0.5"
          />
        ) : (
          <>
            <div className="truncate text-xs font-medium leading-snug">{conv.title}</div>
            <div className="text-[10px] text-white/25 mt-0.5">{relativeTime(conv.updatedAt)}</div>
          </>
        )}
      </div>

      {conv.isPinned && !editing && (
        <Pin size={10} className="flex-shrink-0 text-neon-blue/50 rotate-45" />
      )}

      {!editing && (
        <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onPin(); }}
            className="p-1 rounded-md hover:bg-white/10 text-white/30 hover:text-neon-blue"
            title={conv.isPinned ? "Unpin" : "Pin"}
          >
            <Pin size={11} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(true); setDraft(conv.title); }}
            className="p-1 rounded-md hover:bg-white/10 text-white/30 hover:text-white"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded-md hover:bg-red-500/20 text-white/30 hover:text-red-400"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Animated thinking dots ────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <span className="flex gap-0.5 items-center ml-0.5">
      {[0, 0.15, 0.3].map((delay, i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-neon-blue/60 animate-bounce"
          style={{ animationDelay: `${delay}s`, animationDuration: "0.9s" }}
        />
      ))}
    </span>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  msg: ChatMessage;
  userId?: string;
  conversationId?: string;
}

function MessageBubble({ msg, userId, conversationId }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [remembered, setRemembered] = useState(false);
  const [remembering, setRemembering] = useState(false);
  const isThinking = msg.streaming && !msg.content;
  const isStreaming = msg.streaming && !!msg.content;

  const handleCopy = () => {
    void navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemember = async () => {
    if (!userId || remembered || remembering) return;
    setRemembering(true);
    try {
      const endpoint = conversationId
        ? `/api/conversations/${conversationId}/memory`
        : "/api/memory";
      await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "x-user-plan": "pro",
          "x-user-role": "user",
        },
        body: JSON.stringify({
          text: msg.content,
          pin: false,
          relatedTopics: ["ai-response"],
        }),
      });
      setRemembered(true);
    } catch { /* silently fail */ } finally {
      setRemembering(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn("flex gap-3", msg.role === "USER" ? "flex-row-reverse" : "")}
    >
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
        msg.role === "ASSISTANT"
          ? "bg-gradient-to-br from-neon-blue to-neon-purple"
          : "bg-gradient-to-br from-orange-400 to-pink-500"
      )}>
        {msg.role === "ASSISTANT"
          ? <Brain size={14} className="text-white" />
          : <span className="text-[10px] font-bold text-white">A</span>
        }
      </div>

      <div className={cn(
        "max-w-[88%] flex flex-col gap-1.5",
        msg.role === "USER" ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          msg.role === "USER"
            ? "bg-gradient-to-br from-neon-blue/30 to-neon-purple/20 border border-neon-blue/20 text-white"
            : msg.error
              ? "bg-red-500/8 border border-red-500/20 text-red-300"
              : "bg-white/5 border border-white/8"
        )}>
          {isThinking ? (
            <div className="flex items-center gap-2 text-white/40">
              <Loader2 size={14} className="animate-spin text-neon-blue" />
              <span>CATalyst AI is thinking…</span>
              <ThinkingDots />
            </div>
          ) : msg.error ? (
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="flex-shrink-0 text-red-400 mt-0.5" />
              <span>{msg.content}</span>
            </div>
          ) : msg.role === "USER" ? (
            <span className="whitespace-pre-wrap">{msg.content}</span>
          ) : (
            <>
              <MarkdownMessage content={msg.content} />
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-neon-blue ml-0.5 animate-pulse rounded-sm align-middle" />
              )}
            </>
          )}
        </div>

        {msg.role === "ASSISTANT" && !msg.streaming && !msg.error && msg.content && (
          <div className="flex items-center gap-1.5">
            {msg.provider && (
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/5 text-white/25 border border-white/8">
                {msg.cached ? "cached · " : ""}{msg.provider}
              </span>
            )}
            <button
              onClick={handleCopy}
              className="p-1 rounded-md hover:bg-white/8 text-white/25 hover:text-white transition-all"
              title="Copy response"
            >
              {copied
                ? <Check size={12} className="text-green-400" />
                : <Copy size={12} />
              }
            </button>
            <button
              onClick={() => void handleRemember()}
              disabled={remembered || remembering}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] border transition-all",
                remembered
                  ? "bg-neon-purple/15 border-neon-purple/25 text-neon-purple"
                  : "bg-white/5 border-white/8 text-white/25 hover:bg-neon-purple/10 hover:text-neon-purple hover:border-neon-purple/20"
              )}
              title="Remember this response"
            >
              {remembering ? <Loader2 size={10} className="animate-spin" /> : <Brain size={10} />}
              {remembered ? "Remembered" : "Remember this"}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AIDoubtSolverPage() {
  const { user, plan, isAdmin, onboardingData } = useAuthStore();

  const {
    conversations, activeId,
    newConversation, deleteConversation, renameConversation, togglePin,
    setActive, addMessage, updateMessage, getActive, getUserConversations,
  } = useConversationStore();

  // ── Conversation bootstrap ────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.id) return;
    const userConvs = getUserConversations(user.id);
    if (userConvs.length === 0) {
      newConversation(user.id);
    } else if (!activeId || !userConvs.find((c) => c.id === activeId)) {
      setActive(userConvs[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const activeConv = getActive();
  const messages   = activeConv?.messages ?? [];

  const userConvs = useMemo(() => {
    const all      = getUserConversations(user?.id ?? "");
    const pinned   = all.filter((c) => c.isPinned).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const unpinned = all.filter((c) => !c.isPinned).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return { pinned, unpinned };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, user?.id]);

  // ── Local state ───────────────────────────────────────────────────────────

  const [input, setInput]             = useState("");
  const [mode, setMode]               = useState<"type" | "image" | "voice">("type");
  const [streaming, setStreaming]     = useState(false);
  const [thinking, setThinking]       = useState(false);
  const [statusMsg, setStatusMsg]     = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastPrompt, setLastPrompt]   = useState("");

  const abortRef           = useRef<AbortController | null>(null);
  const timeoutRef         = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef     = useRef<HTMLDivElement>(null);
  const isAtBottomRef      = useRef(true);

  // ── Personalization ───────────────────────────────────────────────────────

  const userProfile = useMemo(() => ({
    name:             user?.name,
    targetPercentile: onboardingData?.targetPercentile,
    weaknesses:       onboardingData?.weaknesses,
    plan:             plan ?? "free",
    studyHours:       onboardingData?.studyHours,
    exams:            onboardingData?.exams,
  }), [user?.name, onboardingData, plan]);

  const isIdle = !streaming && !thinking;

  // ── Scroll ────────────────────────────────────────────────────────────────

  const scrollToBottom = useCallback((force = false) => {
    if (!force && !isAtBottomRef.current) return;
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  useEffect(() => {
    isAtBottomRef.current = true;
    scrollToBottom(true);
  }, [activeId, scrollToBottom]);

  // ── Timeout helpers ───────────────────────────────────────────────────────

  const resetStreamTimeout = useCallback((controller: AbortController) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => controller.abort("timeout"), STREAM_TIMEOUT_MS);
  }, []);

  const clearStreamTimeout = useCallback(() => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  }, []);

  // ── Send ──────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !isIdle || !activeConv) return;

    setLastPrompt(text);
    isAtBottomRef.current = true;

    const convId = activeConv.id;
    addMessage(convId, { role: "USER", content: text });
    const aiMsgId = addMessage(convId, { role: "ASSISTANT", content: "", streaming: true });

    setInput("");
    setThinking(true);
    setStreaming(false);
    setStatusMsg(null);
    scrollToBottom(true);

    const controller = new AbortController();
    abortRef.current = controller;
    resetStreamTimeout(controller);

    const historySlice = activeConv.messages
      .filter((m) => !m.streaming && !m.error && m.content)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id":   user?.id ?? "anonymous",
          "x-user-role": isAdmin ? "admin" : "user",
          "x-user-plan": plan ?? "free",
        },
        body: JSON.stringify({
          feature: "doubt_solver",
          prompt: text,
          history: historySlice,
          userProfile,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        clearStreamTimeout();
        let errorMsg = "AI mentor is warming up. Please try again in a moment.";
        try {
          const data = await res.json() as Record<string, unknown>;
          errorMsg = res.status === 429
            ? (data.uiMessage as string | undefined) ?? "Daily AI limit reached. Upgrade to Pro for more requests."
            : (data.message as string | undefined) ?? errorMsg;
        } catch { /* ignore */ }
        updateMessage(convId, aiMsgId, { content: errorMsg, streaming: false, error: true });
        return;
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      const state   = { buffer: "", text: "" };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        resetStreamTimeout(controller);
        state.buffer += decoder.decode(value, { stream: true });
        const blocks = state.buffer.split("\n\n");
        state.buffer = blocks.pop() ?? "";

        for (const block of blocks) {
          if (!block.trim()) continue;

          const lines    = block.split("\n");
          const evtLine  = lines.find((l) => l.startsWith("event: "));
          const dataLine = lines.find((l) => l.startsWith("data: "));
          if (!evtLine || !dataLine) continue;

          const event   = evtLine.slice(7).trim();
          const dataStr = dataLine.slice(6).trim();
          let parsed: Record<string, unknown>;
          try { parsed = JSON.parse(dataStr) as Record<string, unknown>; }
          catch { continue; }

          if (event === "chunk") {
            state.text += (parsed.text as string | undefined) ?? "";
            setThinking(false);
            setStreaming(true);
            const snapshot = state.text;
            updateMessage(convId, aiMsgId, { content: snapshot, streaming: true });
            scrollToBottom();
          } else if (event === "status") {
            setStatusMsg((parsed.message as string | undefined) ?? null);
          } else if (event === "done") {
            clearStreamTimeout();
            updateMessage(convId, aiMsgId, {
              content:   state.text || "(No response)",
              streaming: false,
              provider:  parsed.provider as string | undefined,
              cached:    Boolean(parsed.cached),
            });
            setStatusMsg(null);
          } else if (event === "error") {
            clearStreamTimeout();
            const code = (parsed.code as string | undefined) ?? "";
            const rawMessage = (parsed.message as string | undefined) ?? "";

            // Translate backend error codes into user-friendly messages
            let displayMessage: string;
            if (code === "AI_KEYS_MISSING") {
              displayMessage =
                "AI mentor is currently offline — the server is not configured with any provider keys. " +
                "If you are the admin, add GROQ_API_KEY (or GEMINI_API_KEY / OPENROUTER_API_KEY) in " +
                "Vercel → Project → Settings → Environment Variables, then redeploy.";
            } else if (code === "misconfigured" || code === "AI_PROVIDERS_UNAVAILABLE") {
              displayMessage = "AI service is temporarily unavailable. Please try again shortly.";
            } else if (code === "all_failed") {
              if (rawMessage.includes("not configured")) {
                displayMessage = "AI provider API keys are not set in the server environment. " +
                  "Configure GROQ_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY in Vercel settings.";
              } else if (rawMessage.includes("timed out")) {
                displayMessage = "AI response timed out. Please try again.";
              } else if (rawMessage.includes("quota") || rawMessage.includes("429")) {
                displayMessage = "AI provider quota exceeded. Please try again in a few minutes.";
              } else {
                displayMessage = "All AI providers are temporarily unavailable. Please try again.";
              }
            } else if (code === "rate_limited") {
              displayMessage = "Too many requests. Please wait a moment and try again.";
            } else if (code === "quota_exceeded") {
              displayMessage = (parsed.uiMessage as string | undefined) ?? "Daily AI limit reached. Upgrade to Pro for more requests.";
            } else {
              displayMessage = rawMessage || "AI mentor is warming up. Please try again.";
            }

            updateMessage(convId, aiMsgId, {
              content:   displayMessage,
              streaming: false,
              error:     true,
            });
            setStatusMsg(null);
          }
        }
      }

    } catch (err) {
      clearStreamTimeout();
      const isUserAbort = (err as Error)?.name === "AbortError" && (err as Error)?.message !== "timeout";
      if (isUserAbort) {
        updateMessage(convId, aiMsgId, { streaming: false });
      } else {
        updateMessage(convId, aiMsgId, {
          content:   (err as Error)?.message === "timeout"
            ? "Response timed out. Please try again."
            : "AI mentor is warming up. Please try again in a moment.",
          streaming: false,
          error:     true,
        });
      }
      setStatusMsg(null);
    } finally {
      abortRef.current = null;
      setThinking(false);
      setStreaming(false);
      scrollToBottom(true);
    }
  }, [
    isIdle, activeConv, addMessage, updateMessage,
    user, plan, isAdmin, userProfile,
    scrollToBottom, resetStreamTimeout, clearStreamTimeout,
  ]);

  const cancelStream = useCallback(() => {
    clearStreamTimeout();
    abortRef.current?.abort();
  }, [clearStreamTimeout]);

  const retryLast = useCallback(() => {
    if (!lastPrompt || !isIdle || !activeConv) return;
    const last = activeConv.messages[activeConv.messages.length - 1];
    if (last?.role === "ASSISTANT" && last.error) {
      updateMessage(activeConv.id, last.id, { error: false, content: "" });
    }
    void sendMessage(lastPrompt);
  }, [lastPrompt, isIdle, activeConv, updateMessage, sendMessage]);

  const regenerateLast = useCallback(() => {
    if (!activeConv || !isIdle) return;
    const lastUser = [...activeConv.messages].reverse().find((m) => m.role === "USER");
    if (lastUser) void sendMessage(lastUser.content);
  }, [activeConv, isIdle, sendMessage]);

  // ── Filtered conversations ────────────────────────────────────────────────

  const filteredConvs = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return userConvs;
    const f = (c: { title: string }) => c.title.toLowerCase().includes(q);
    return { pinned: userConvs.pinned.filter(f), unpinned: userConvs.unpinned.filter(f) };
  }, [userConvs, searchQuery]);

  // ── Derived message state ─────────────────────────────────────────────────

  const lastAiMsg = useMemo(
    () => [...messages].reverse().find((m) => m.role === "ASSISTANT" && !m.streaming && !m.error && m.content) ?? null,
    [messages]
  );

  const lastMsgError = messages[messages.length - 1]?.error ?? false;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-4" style={{ height: "calc(100dvh - 120px)", minHeight: 520 }}>

      {/* ── Desktop conversation sidebar ─────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 flex-shrink-0 glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="p-3 border-b border-white/5">
          <button
            onClick={() => { if (user?.id) newConversation(user.id); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-neon-blue/15 border border-neon-blue/25 text-neon-blue text-xs font-medium hover:bg-neon-blue/20 transition-all"
          >
            <Plus size={13} /> New Chat
          </button>
        </div>

        <div className="px-3 pt-2 pb-1">
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats…"
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white/5 border border-white/8 rounded-lg text-white/70 placeholder:text-white/20 focus:outline-none focus:border-neon-blue/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {filteredConvs.pinned.length > 0 && (
            <>
              <div className="px-2 py-1 text-[10px] text-white/25 font-medium uppercase tracking-wider">Pinned</div>
              {filteredConvs.pinned.map((c) => (
                <ConvItem key={c.id} conv={c} isActive={c.id === activeId}
                  onSelect={() => setActive(c.id)}
                  onRename={(t) => renameConversation(c.id, t)}
                  onDelete={() => deleteConversation(c.id)}
                  onPin={() => togglePin(c.id)}
                />
              ))}
              {filteredConvs.unpinned.length > 0 && (
                <div className="px-2 py-1 mt-1 text-[10px] text-white/25 font-medium uppercase tracking-wider">All Chats</div>
              )}
            </>
          )}
          {filteredConvs.unpinned.map((c) => (
            <ConvItem key={c.id} conv={c} isActive={c.id === activeId}
              onSelect={() => setActive(c.id)}
              onRename={(t) => renameConversation(c.id, t)}
              onDelete={() => deleteConversation(c.id)}
              onPin={() => togglePin(c.id)}
            />
          ))}
          {filteredConvs.pinned.length === 0 && filteredConvs.unpinned.length === 0 && (
            <p className="text-center text-xs text-white/20 py-8">No chats found</p>
          )}
        </div>

        <div className="border-t border-white/5 p-3">
          <p className="text-[10px] text-white/25 font-medium uppercase tracking-wider mb-2">Quick Examples</p>
          <div className="space-y-1">
            {DOUBT_EXAMPLES.slice(0, 3).map((ex, i) => (
              <button key={i} onClick={() => { void sendMessage(ex); }}
                className="w-full text-left text-[11px] px-2.5 py-2 rounded-lg bg-white/3 border border-white/5 hover:border-neon-blue/25 hover:bg-neon-blue/5 text-white/40 hover:text-white/80 transition-all flex items-start gap-1.5"
              >
                <ArrowRight size={10} className="text-neon-blue flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{ex}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Chat Area ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col glass rounded-2xl border border-white/8 overflow-hidden min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-neon-blue" />
            <span className="text-sm font-semibold truncate max-w-[180px] sm:max-w-xs">
              {activeConv?.title ?? "AI Doubt Solver"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <AnimatePresence>
              {statusMsg && (
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-yellow-400/80 flex items-center gap-1.5"
                >
                  <Loader2 size={11} className="animate-spin" />
                  {statusMsg}
                </motion.span>
              )}
            </AnimatePresence>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 glass rounded-xl border border-white/5">
              <Sparkles size={12} className="text-neon-blue" />
              <span className="text-[11px] text-neon-blue font-medium hidden sm:inline">Groq · Gemini</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{ overscrollBehavior: "contain" }}
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-5 py-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/20 flex items-center justify-center">
                <Brain size={24} className="text-neon-blue" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-white/80 mb-1">CATalyst AI Mentor</h3>
                <p className="text-sm text-white/40 max-w-xs">Ask any CAT doubt — step-by-step solutions with shortcuts and exam strategies.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 w-full max-w-md">
                {DOUBT_EXAMPLES.map((ex, i) => (
                  <button key={i} onClick={() => { void sendMessage(ex); }}
                    className="text-left text-xs p-3 rounded-xl bg-white/3 border border-white/5 hover:border-neon-blue/30 hover:bg-neon-blue/5 text-white/50 hover:text-white transition-all flex items-start gap-2"
                  >
                    <ArrowRight size={11} className="text-neon-blue flex-shrink-0 mt-0.5" />
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} userId={user?.id} conversationId={activeConv?.id} />)}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick action strip */}
        {lastAiMsg && isIdle && (
          <div className="px-4 pb-2 pt-2 flex items-center gap-2 flex-wrap border-t border-white/3 flex-shrink-0">
            <span className="text-[10px] text-white/25">Follow-up:</span>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => { void sendMessage(action.prompt); }}
                className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/8 text-white/50 hover:text-white hover:border-neon-blue/30 hover:bg-neon-blue/5 transition-all"
              >
                <action.icon size={11} />
                {action.label}
              </button>
            ))}
            <button
              onClick={regenerateLast}
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/8 text-white/50 hover:text-yellow-400 hover:border-yellow-400/30 hover:bg-yellow-400/5 transition-all ml-auto"
            >
              <RotateCcw size={11} />
              Regenerate
            </button>
          </div>
        )}

        {/* Retry strip */}
        {lastMsgError && isIdle && lastPrompt && (
          <div className="px-4 pb-2 flex-shrink-0">
            <button
              onClick={retryLast}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-white/5 p-3 flex-shrink-0">
          <div className="flex gap-2 mb-2.5">
            {[
              { mode: "type"  as const, icon: Send,   label: "Type"  },
              { mode: "image" as const, icon: Upload,  label: "Image" },
              { mode: "voice" as const, icon: Mic,    label: "Voice" },
            ].map((m) => (
              <button key={m.mode} onClick={() => setMode(m.mode)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all",
                  mode === m.mode
                    ? "bg-neon-blue/20 border-neon-blue/30 text-neon-blue"
                    : "border-white/8 text-white/30 hover:text-white"
                )}
              >
                <m.icon size={12} /> {m.label}
              </button>
            ))}
            {/* Mobile: new chat */}
            <button
              onClick={() => { if (user?.id) newConversation(user.id); }}
              className="ml-auto lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-white/8 text-white/30 hover:text-neon-blue hover:border-neon-blue/30 transition-all"
            >
              <BookOpen size={12} /> Chats
            </button>
          </div>

          <div className="flex gap-2.5 items-end">
            <div className="flex-1">
              {mode === "type" && (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(input); }
                  }}
                  placeholder="Ask your CAT doubt… (Shift+Enter for new line)"
                  rows={2}
                  disabled={!isIdle}
                  className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-blue/40 resize-none disabled:opacity-50"
                />
              )}
              {mode === "image" && (
                <div className="border-2 border-dashed border-white/15 rounded-xl p-5 text-center hover:border-neon-blue/40 transition-all cursor-pointer">
                  <Upload size={20} className="mx-auto text-white/30 mb-1.5" />
                  <p className="text-xs text-white/40">Drop question image or click to upload</p>
                </div>
              )}
              {mode === "voice" && (
                <div className="border border-white/10 rounded-xl p-5 text-center">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto mb-1.5 cursor-pointer hover:bg-red-500/30 transition-all">
                    <Mic size={18} className="text-red-400" />
                  </div>
                  <p className="text-xs text-white/40">Tap to speak your doubt</p>
                </div>
              )}
            </div>

            {mode === "type" && (
              !isIdle ? (
                <button
                  onClick={cancelStream}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-red-500/20 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all"
                  aria-label="Stop generating"
                >
                  <Square size={16} className="text-red-400" />
                </button>
              ) : (
                <button
                  onClick={() => { void sendMessage(input); }}
                  disabled={!input.trim()}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all"
                >
                  <Send size={16} className="text-white" />
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
