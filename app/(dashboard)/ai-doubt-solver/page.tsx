"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import {
  Brain, Upload, Mic, Send, Lightbulb, CheckCircle,
  Sparkles, BookOpen, ArrowRight, Copy, ThumbsUp, ThumbsDown, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SAMPLE_QUESTIONS } from "@/lib/data";

interface Message {
  id: number;
  role: "user" | "ai";
  content: string;
  question?: string;
  solution?: {
    steps: string[];
    shortcut?: string;
    conceptNote?: string;
  };
  loading?: boolean;
}

const DOUBT_EXAMPLES = [
  "What is the remainder when 7^100 is divided by 48?",
  "How to solve seating arrangement problems quickly?",
  "Explain the concept of AP and GP with shortcuts",
  "When should I use permutation vs combination?",
  "How to identify the main idea in an RC passage?",
];

const AI_RESPONSE: Message["solution"] = {
  steps: [
    "**Step 1:** Identify the pattern in powers of 7 mod 48",
    "7¹ = 7, 7² = 49 ≡ 1 (mod 48)",
    "**Step 2:** Since 7² ≡ 1 (mod 48), any even power of 7 ≡ 1",
    "**Step 3:** 7^100 = (7²)^50 ≡ 1^50 = 1 (mod 48)",
    "**Answer: Remainder = 1** ✓",
  ],
  shortcut: "For remainder problems: find the cyclicity! If a^n ≡ 1 (mod m) for some small n, then a^(kn) ≡ 1 for any k.",
  conceptNote: "This uses Euler's theorem. For CAT, remember: powers of small numbers create cycles. 7² ≡ 1 (mod 48) means the cycle length is 2.",
};

export default function AIDoubtSolverPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "ai",
      content: "Hello! I'm your AI CAT mentor. Ask me any doubt — type it, upload an image, or pick an example below. I'll solve it step-by-step with shortcuts and CAT strategies. 🎯",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"type" | "image" | "voice">("type");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextMessageIdRef = useRef(1);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: nextMessageIdRef.current++, role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    // Simulate AI response
    const loadingMsg: Message = { id: nextMessageIdRef.current++, role: "ai", content: "", loading: true };
    setMessages((m) => [...m, loadingMsg]);

    await new Promise((r) => setTimeout(r, 1800));

    const aiMsg: Message = {
      id: nextMessageIdRef.current++,
      role: "ai",
      content: `Great question! Here's a step-by-step solution for: "${text}"`,
      solution: AI_RESPONSE,
    };
    setMessages((m) => [...m.slice(0, -1), aiMsg]);
    setLoading(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div className="space-y-6 h-full">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Doubt Solver</h1>
          <p className="text-white/40 mt-1 text-sm">Step-by-step solutions with shortcuts and concept clarity</p>
        </div>
        <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl border border-white/5">
          <Sparkles size={14} className="text-neon-blue" />
          <span className="text-sm text-neon-blue font-medium">GPT-4 Powered</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Example shortcuts + history */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-4 border border-white/5">
            <h3 className="text-sm font-semibold mb-3 text-white/60">Try an Example</h3>
            <div className="space-y-2">
              {DOUBT_EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(ex)}
                  className="w-full text-left text-xs p-3 rounded-xl bg-white/3 border border-white/5 hover:border-neon-blue/30 hover:bg-neon-blue/5 text-white/60 hover:text-white transition-all flex items-center gap-2"
                >
                  <ArrowRight size={12} className="text-neon-blue flex-shrink-0" />
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-4 border border-white/5">
            <h3 className="text-sm font-semibold mb-3 text-white/60">Recent Doubts</h3>
            <div className="space-y-2">
              {["Cyclicity problems", "Profit & Loss tricks", "Para Jumble strategy", "TSD formula sheet"].map((d, i) => (
                <button key={i} onClick={() => setInput(d)} className="w-full text-left text-xs p-2.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-all flex items-center gap-2">
                  <BookOpen size={12} className="text-white/20" />
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-4 border border-white/5">
            <h3 className="text-sm font-semibold mb-3 text-white/60">Stats</h3>
            <div className="space-y-2">
              {[
                { label: "Doubts Solved", value: "47", color: "text-neon-blue" },
                { label: "Concepts Cleared", value: "23", color: "text-green-400" },
                { label: "Avg Response", value: "< 2s", color: "text-yellow-400" },
              ].map((s) => (
                <div key={s.label} className="flex justify-between text-sm">
                  <span className="text-white/40">{s.label}</span>
                  <span className={cn("font-semibold", s.color)}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Chat Interface */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="glass rounded-2xl border border-white/8 flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: 500 }}>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "")}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                    msg.role === "ai"
                      ? "bg-gradient-to-br from-neon-blue to-neon-purple"
                      : "bg-gradient-to-br from-orange-400 to-pink-500"
                  )}>
                    {msg.role === "ai" ? <Brain size={16} className="text-white" /> : <span className="text-xs font-bold">A</span>}
                  </div>

                  {/* Message */}
                  <div className={cn("max-w-[85%]", msg.role === "user" ? "items-end" : "items-start", "flex flex-col gap-2")}>
                    <div className={cn(
                      "rounded-2xl px-4 py-3 text-sm",
                      msg.role === "user"
                        ? "bg-gradient-to-br from-neon-blue/30 to-neon-purple/20 border border-neon-blue/20 text-white"
                        : "bg-white/5 border border-white/8 text-white/80"
                    )}>
                      {msg.loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin text-neon-blue" />
                          <span className="text-white/50">AI is thinking...</span>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>

                    {/* Solution steps */}
                    {msg.solution && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="w-full space-y-3"
                      >
                        {/* Steps */}
                        <div className="bg-white/3 rounded-xl p-4 border border-white/5">
                          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Solution</p>
                          <div className="space-y-2">
                            {msg.solution.steps.map((step, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                                <div className="w-5 h-5 rounded-full bg-neon-blue/20 text-neon-blue text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {i + 1}
                                </div>
                                <span className="whitespace-pre-wrap">{step.replace(/\*\*(.*?)\*\*/g, '$1')}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Shortcut */}
                        {msg.solution.shortcut && (
                          <div className="bg-yellow-500/8 rounded-xl p-3 border border-yellow-500/20 flex items-start gap-2">
                            <Lightbulb size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-yellow-400 mb-1">CAT Shortcut</p>
                              <p className="text-xs text-white/60">{msg.solution.shortcut}</p>
                            </div>
                          </div>
                        )}

                        {/* Concept Note */}
                        {msg.solution.conceptNote && (
                          <div className="bg-neon-blue/5 rounded-xl p-3 border border-neon-blue/15 flex items-start gap-2">
                            <BookOpen size={16} className="text-neon-blue flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-neon-blue mb-1">Concept Note</p>
                              <p className="text-xs text-white/60">{msg.solution.conceptNote}</p>
                            </div>
                          </div>
                        )}

                        {/* Feedback */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/25">Was this helpful?</span>
                          <button className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-green-400 transition-all">
                            <ThumbsUp size={14} />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-red-400 transition-all">
                            <ThumbsDown size={14} />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-all ml-1">
                            <Copy size={14} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/5 p-4">
              {/* Mode toggle */}
              <div className="flex gap-2 mb-3">
                {[
                  { mode: "type" as const, icon: Send, label: "Type" },
                  { mode: "image" as const, icon: Upload, label: "Image" },
                  { mode: "voice" as const, icon: Mic, label: "Voice" },
                ].map((m) => (
                  <button
                    key={m.mode}
                    onClick={() => setMode(m.mode)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all",
                      mode === m.mode ? "bg-neon-blue/20 border-neon-blue/30 text-neon-blue" : "border-white/8 text-white/30 hover:text-white"
                    )}
                  >
                    <m.icon size={12} /> {m.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <div className="flex-1 relative">
                  {mode === "type" && (
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                      placeholder="Type your doubt here... (e.g., How to solve log equations?)"
                      rows={2}
                      className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-blue/40 resize-none"
                    />
                  )}
                  {mode === "image" && (
                    <div className="border-2 border-dashed border-white/15 rounded-xl p-6 text-center hover:border-neon-blue/40 transition-all cursor-pointer">
                      <Upload size={24} className="mx-auto text-white/30 mb-2" />
                      <p className="text-sm text-white/40">Drop question image here or click to upload</p>
                    </div>
                  )}
                  {mode === "voice" && (
                    <div className="border border-white/10 rounded-xl p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto mb-2 cursor-pointer hover:bg-red-500/30 transition-all">
                        <Mic size={24} className="text-red-400" />
                      </div>
                      <p className="text-sm text-white/40">Tap to speak your doubt</p>
                    </div>
                  )}
                </div>
                {mode === "type" && (
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || loading}
                    className="px-4 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all"
                  >
                    <Send size={18} className="text-white" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
