"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MicOff, Volume2, Loader2, AlertCircle, Send, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Browser speech API types (not in lib.dom for all envs) ──────────────────
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SessionState =
  | "idle"
  | "preparing"
  | "permission-required"
  | "listening"
  | "processing"
  | "speaking"
  | "error"
  | "unsupported";

const STATE_LABELS: Record<SessionState, string> = {
  idle:                "Ready to start",
  preparing:           "Preparing voice session…",
  "permission-required": "Microphone permission required",
  listening:           "Listening…",
  processing:          "Processing your question…",
  speaking:            "Speaking…",
  error:               "Something went wrong",
  unsupported:         "Speech recognition not available in this browser",
};

interface VoiceTutorModalProps {
  open: boolean;
  onClose: () => void;
}

export function VoiceTutorModal({ open, onClose }: VoiceTutorModalProps) {
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [typedInput, setTypedInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ── Stop media when modal closes (no setState — that's not an external system)
  // State resets happen at the start of startSession() instead.
  useEffect(() => {
    if (!open) stopEverything();
  }, [open]);

  // ── Keyboard close ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Body scroll lock ───────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function stopEverything() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
  }

  function handleClose() {
    stopEverything();
    onClose();
  }

  // ── Check Speech Recognition support ──────────────────────────────────────
  function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
    if (typeof window === "undefined") return null;
    return (
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition ??
      null
    );
  }

  // ── Start the voice session ─────────────────────────────────────────────────
  async function startSession() {
    console.log("Start Voice Session clicked");
    setErrorMessage("");
    setTranscript("");
    setResponse("");
    setSessionState("preparing");

    // SSR / non-browser guard
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setSessionState("unsupported");
      return;
    }

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      console.warn("Speech recognition unsupported");
      setSessionState("unsupported");
      return;
    }

    // Request mic permission
    setSessionState("permission-required");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      console.log("Microphone permission granted");
    } catch (err) {
      console.warn("Microphone permission denied", err);
      setErrorMessage("Microphone access denied. Please allow microphone access and try again.");
      setSessionState("error");
      return;
    }

    // Start speech recognition
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      console.log("Transcript received:", text);
      setTranscript(text);
      recognition.stop();
      void handleQuery(text);
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.warn("Speech recognition error:", e.error);
      if (e.error === "no-speech") {
        setErrorMessage("No speech detected. Please try again.");
      } else if (e.error === "not-allowed") {
        setErrorMessage("Microphone access was blocked.");
      } else {
        setErrorMessage(`Recognition error: ${e.error}`);
      }
      setSessionState("error");
    };

    recognition.onend = () => {
      // Only revert to idle if we haven't already moved to processing/error
      setSessionState((prev) =>
        prev === "listening" ? "idle" : prev
      );
    };

    setSessionState("listening");
    recognition.start();
  }

  // ── Send transcript/typed text to AI ──────────────────────────────────────
  async function handleQuery(text: string) {
    if (!text.trim()) return;
    setSessionState("processing");

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: "doubt_solver",
          prompt: `You are an expert CAT preparation AI voice tutor. Answer concisely (3-4 sentences max) for voice playback:\n\n${text}`,
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json() as { text: string };
      const answer = data.text.trim();
      setResponse(answer);
      speakResponse(answer);
    } catch (err) {
      console.error("AI query failed:", err);
      setErrorMessage("Could not reach AI. Please try again.");
      setSessionState("error");
    }
  }

  // ── Text-to-Speech ─────────────────────────────────────────────────────────
  function speakResponse(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSessionState("idle");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    utterance.lang = "en-IN";
    utterance.rate = 0.95;

    utterance.onstart = () => setSessionState("speaking");
    utterance.onend = () => setSessionState("idle");
    utterance.onerror = () => setSessionState("idle");

    window.speechSynthesis.speak(utterance);
  }

  // ── Typed input fallback ───────────────────────────────────────────────────
  async function handleTypedSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!typedInput.trim()) return;
    const q = typedInput.trim();
    setTypedInput("");
    setTranscript(q);
    await handleQuery(q);
  }

  const isUnsupported = sessionState === "unsupported";
  const isBusy = sessionState === "preparing" || sessionState === "processing" || sessionState === "speaking";
  const isListening = sessionState === "listening";

  // Evaluated directly from sessionState to avoid TypeScript narrowing the type
  // to exclude "speaking" inside the isBusy branch of a nested ternary (TS2367).
  const micIcon = (() => {
    if (sessionState === "preparing" || sessionState === "processing") {
      return <Loader2 size={28} className="text-white/60 animate-spin" />;
    }
    if (sessionState === "listening") return <MicOff size={28} className="text-red-400" />;
    if (sessionState === "speaking")  return <Volume2  size={28} className="text-blue-400" />;
    if (sessionState === "error")     return <RefreshCw size={28} className="text-red-400" />;
    return <Mic size={28} className="text-yellow-400" />;
  })();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-md rounded-2xl border border-yellow-400/25 bg-dark-800 shadow-2xl overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(250,204,21,0.06) 0%, rgba(17,17,27,0.98) 60%)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center">
                    <Mic size={16} className="text-yellow-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm">AI Voice Tutor</h2>
                    <p className="text-xs text-white/40">Speak your CAT doubt aloud</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="text-white/30 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* State display */}
              <div className="px-6 py-6 space-y-5">
                {/* Mic orb */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    {/* Pulse rings when listening */}
                    {isListening && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping" />
                        <div className="absolute -inset-3 rounded-full bg-yellow-400/10 animate-pulse" />
                      </>
                    )}
                    <button
                      onClick={sessionState === "idle" || sessionState === "error" ? startSession : undefined}
                      disabled={isBusy || isListening || isUnsupported}
                      className={cn(
                        "relative w-20 h-20 rounded-full flex items-center justify-center transition-all",
                        "border-2 font-semibold",
                        sessionState === "idle" && "bg-yellow-400/20 border-yellow-400/50 hover:bg-yellow-400/30 cursor-pointer",
                        isListening && "bg-red-500/20 border-red-400/60 cursor-default",
                        sessionState === "speaking" && "bg-blue-500/20 border-blue-400/50 cursor-default",
                        isBusy && !isListening && "bg-white/5 border-white/20 cursor-default",
                        sessionState === "error" && "bg-red-500/10 border-red-500/30 hover:bg-red-500/20 cursor-pointer",
                        isUnsupported && "bg-white/5 border-white/10 cursor-default opacity-50",
                      )}
                      aria-label={isListening ? "Listening" : "Start listening"}
                    >
                      {micIcon}
                    </button>
                  </div>

                  {/* State label */}
                  <p className={cn(
                    "text-sm font-medium text-center",
                    sessionState === "error" ? "text-red-400" : "text-white/60"
                  )}>
                    {sessionState === "error" ? errorMessage : STATE_LABELS[sessionState]}
                  </p>
                </div>

                {/* Transcript + response */}
                {(transcript || response) && (
                  <div className="space-y-3">
                    {transcript && (
                      <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/8">
                        <p className="text-xs text-white/40 mb-1 flex items-center gap-1">
                          <Mic size={10} /> You asked
                        </p>
                        <p className="text-sm text-white/80">{transcript}</p>
                      </div>
                    )}
                    {response && (
                      <div className="px-4 py-3 bg-yellow-400/5 rounded-xl border border-yellow-400/15">
                        <p className="text-xs text-yellow-400/60 mb-1 flex items-center gap-1">
                          <Volume2 size={10} /> AI Tutor
                        </p>
                        <p className="text-sm text-white/80 leading-relaxed">{response}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Permission required hint */}
                {sessionState === "permission-required" && (
                  <div className="flex items-start gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-400">
                    <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                    Your browser will ask for microphone access — click Allow to continue.
                  </div>
                )}

                {/* Unsupported: typed fallback */}
                {isUnsupported && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white/50">
                      <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                      Speech recognition isn&apos;t supported in this browser. Use the text input below.
                    </div>
                    <form onSubmit={handleTypedSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={typedInput}
                        onChange={(e) => setTypedInput(e.target.value)}
                        placeholder="Type your CAT doubt…"
                        className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-yellow-400/40 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!typedInput.trim() || isBusy}
                        className="px-4 py-2.5 bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 rounded-xl text-sm font-medium hover:bg-yellow-400/30 transition-all disabled:opacity-40"
                      >
                        <Send size={15} />
                      </button>
                    </form>
                  </div>
                )}

                {/* Typed input also available in normal mode after first response */}
                {!isUnsupported && sessionState === "idle" && (
                  <form onSubmit={handleTypedSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={typedInput}
                      onChange={(e) => setTypedInput(e.target.value)}
                      placeholder="Or type your question…"
                      className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-yellow-400/40 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!typedInput.trim()}
                      className="px-4 py-2.5 bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 rounded-xl text-sm font-medium hover:bg-yellow-400/30 transition-all disabled:opacity-40"
                    >
                      <Send size={15} />
                    </button>
                  </form>
                )}
              </div>

              {/* Footer hint */}
              <div className="px-6 pb-5 text-center">
                <p className="text-xs text-white/25">
                  {isListening
                    ? "Speak clearly — click the mic to stop early"
                    : "Tap the mic to start · Press Esc to close"}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
