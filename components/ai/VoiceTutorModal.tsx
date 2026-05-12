"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Mic, MicOff, Volume2, Loader2, AlertCircle,
  Send, RefreshCw, ShieldOff, Settings, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  checkMicrophoneAccess,
  getMicPermissionState,
  MIC_ERROR_MESSAGES,
  type MicrophoneError,
} from "@/lib/voice/checkMicrophoneAccess";

// ─── Browser speech API types ─────────────────────────────────────────────────
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
  onerror:  ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend:    (() => void) | null;
}

// ─── Session state ────────────────────────────────────────────────────────────
type SessionState =
  | "idle"
  | "preparing"
  | "permission-required"
  | "listening"
  | "processing"
  | "speaking"
  | "blocked"        // permanently denied in browser / OS settings
  | "error"
  | "unsupported";

const STATE_LABELS: Record<SessionState, string> = {
  idle:                  "Ready to start",
  preparing:             "Preparing voice session…",
  "permission-required": "Waiting for microphone permission…",
  listening:             "Listening…",
  processing:            "Processing your question…",
  speaking:              "Speaking…",
  blocked:               "Microphone blocked in browser settings",
  error:                 "Something went wrong",
  unsupported:           "Voice not supported — use text below",
};

// ─── Browser detection ────────────────────────────────────────────────────────
interface BrowserInfo {
  name: string;
  steps: string[];
  settingsUrl?: string;
}

function detectBrowser(): BrowserInfo {
  if (typeof navigator === "undefined") return { name: "Chrome", steps: [] };
  const ua = navigator.userAgent;
  const isSafari  = /Safari/.test(ua) && !/Chrome/.test(ua);
  const isFirefox = /Firefox/.test(ua);
  const isEdge    = /Edg\//.test(ua);

  if (isSafari) return {
    name: "Safari",
    steps: [
      "Open Safari → Settings for This Website…",
      "Set Microphone to Allow",
      "Refresh this page",
    ],
  };
  if (isFirefox) return {
    name: "Firefox",
    steps: [
      "Click the lock icon (🔒) in the address bar",
      "Click Connection Secure → More Information",
      "Go to the Permissions tab",
      "Allow Microphone access",
      "Refresh this page",
    ],
  };
  if (isEdge) return {
    name: "Edge",
    steps: [
      "Click the lock icon (🔒) in the address bar",
      "Click Permissions for this site",
      "Set Microphone to Allow",
      "Refresh this page",
    ],
  };
  return {
    name: "Chrome",
    steps: [
      "Click the lock icon (🔒) in the address bar",
      "Click Site settings",
      "Set Microphone to Allow",
      "Refresh this page",
    ],
  };
}

function detectOS(): "mac" | "windows" | "other" {
  if (typeof navigator === "undefined") return "other";
  const p = navigator.platform ?? "";
  if (/Mac/.test(p)) return "mac";
  if (/Win/.test(p)) return "windows";
  return "other";
}

// ─── SpeechRecognition constructor accessor ───────────────────────────────────
function getSpeechRecognitionCtor(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as Record<string, unknown>).SpeechRecognition as (new () => SpeechRecognitionInstance) ??
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition as (new () => SpeechRecognitionInstance) ??
    null
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
interface VoiceTutorModalProps {
  open: boolean;
  onClose: () => void;
}

export function VoiceTutorModal({ open, onClose }: VoiceTutorModalProps) {
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [transcript,   setTranscript]   = useState("");
  const [response,     setResponse]     = useState("");
  const [typedInput,   setTypedInput]   = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const utteranceRef   = useRef<SpeechSynthesisUtterance | null>(null);

  // ── Stop all media when modal closes ────────────────────────────────────────
  useEffect(() => {
    if (!open) stopEverything();
  }, [open]);

  // ── Keyboard close ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Body scroll lock ─────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function stopEverything() {
    if (recognitionRef.current) {
      // Clear handlers before stopping to prevent state updates after close
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror  = null;
      recognitionRef.current.onend    = null;
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
  }

  function handleClose() {
    stopEverything();
    onClose();
  }

  function setError(code: MicrophoneError | string, isBlocked = false) {
    const msg = code in MIC_ERROR_MESSAGES
      ? MIC_ERROR_MESSAGES[code as MicrophoneError]
      : String(code);
    console.log("[VOICE_ERROR]", code, msg);
    setErrorMessage(msg);
    setSessionState(isBlocked ? "blocked" : "error");
  }

  // ── Start recognition (called after permission confirmed) ────────────────────
  function startRecognition() {
    const SpeechRecognition = getSpeechRecognitionCtor();
    if (!SpeechRecognition) {
      setSessionState("unsupported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      console.log("[VOICE] Transcript:", text);
      setTranscript(text);
      recognition.stop();
      void handleQuery(text);
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.log("[VOICE_ERROR] SpeechRecognition error:", e.error);
      switch (e.error) {
        case "not-allowed":
          setError("blocked", true);
          break;
        case "no-speech":
          setError("No speech detected. Please try again.");
          break;
        case "network":
          setError("Network error. Check your connection and try again.");
          break;
        default:
          setError(`Speech recognition error: ${e.error}`);
      }
    };

    recognition.onend = () => {
      setSessionState((prev) => prev === "listening" ? "idle" : prev);
    };

    console.log("[VOICE] Starting speech recognition");
    setSessionState("listening");
    recognition.start();
  }

  // ── Start full voice session ─────────────────────────────────────────────────
  async function startSession() {
    console.log("[VOICE] startSession called");
    setErrorMessage("");
    setTranscript("");
    setResponse("");
    setSessionState("preparing");

    // Environment guard
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      console.log("[VOICE] getUserMedia not available");
      setSessionState("unsupported");
      return;
    }

    if (!getSpeechRecognitionCtor()) {
      console.log("[VOICE] SpeechRecognition not available");
      setSessionState("unsupported");
      return;
    }

    // Fast-path: check if already denied before showing any prompt
    const preState = await getMicPermissionState();
    console.log("[VOICE_PERMISSION] Pre-check state:", preState);

    if (preState === "denied") {
      setError("blocked", true);
      return;
    }

    // Show permission-required UI while getUserMedia prompt is open
    if (preState === "prompt" || preState === "unknown") {
      setSessionState("permission-required");
    }

    const result = await checkMicrophoneAccess();
    console.log("[VOICE_PERMISSION] checkMicrophoneAccess result:", result);

    if (!result.supported) {
      setSessionState("unsupported");
      return;
    }

    if (result.blocked) {
      setError("blocked", true);
      return;
    }

    if (result.denied || !result.granted) {
      setError(result.error ?? "not-allowed");
      return;
    }

    if (!result.deviceFound) {
      setError("not-found");
      return;
    }

    startRecognition();
  }

  // ── Retry after blocked state ────────────────────────────────────────────────
  async function retryPermission() {
    console.log("[VOICE] retryPermission called");
    setSessionState("preparing");

    const result = await checkMicrophoneAccess();
    console.log("[VOICE_PERMISSION] retry result:", result);

    if (result.granted && result.deviceFound) {
      startRecognition();
    } else if (result.blocked) {
      setError("blocked", true);
    } else {
      setError(result.error ?? "not-allowed");
    }
  }

  // ── AI query ─────────────────────────────────────────────────────────────────
  async function handleQuery(text: string) {
    if (!text.trim()) return;
    setSessionState("processing");
    console.log("[VOICE] Sending query:", text.slice(0, 60));

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: "doubt_solver",
          prompt: `You are an expert CAT preparation AI voice tutor. Answer concisely (3-4 sentences max) for voice playback:\n\n${text}`,
        }),
      });

      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json() as { text: string };
      const answer = data.text.trim();
      setResponse(answer);
      speakResponse(answer);
    } catch (err) {
      console.log("[VOICE_ERROR] AI query failed:", err);
      setErrorMessage("Could not reach AI. Please check your connection and try again.");
      setSessionState("error");
    }
  }

  // ── Text-to-Speech ────────────────────────────────────────────────────────────
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
    utterance.onend   = () => setSessionState("idle");
    utterance.onerror = () => setSessionState("idle");
    window.speechSynthesis.speak(utterance);
  }

  // ── Typed fallback ────────────────────────────────────────────────────────────
  async function handleTypedSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!typedInput.trim()) return;
    const q = typedInput.trim();
    setTypedInput("");
    setTranscript(q);
    await handleQuery(q);
  }

  // ─── Derived flags ────────────────────────────────────────────────────────────
  const isListening   = sessionState === "listening";
  const isUnsupported = sessionState === "unsupported";
  const isBlocked     = sessionState === "blocked";
  const isBusy        = sessionState === "preparing"
    || sessionState === "processing"
    || sessionState === "speaking";

  const canTap = sessionState === "idle" || sessionState === "error";
  const showTextInput = sessionState === "idle"
    || sessionState === "error"
    || sessionState === "blocked"
    || sessionState === "unsupported";

  const browserInfo = detectBrowser();
  const os          = detectOS();

  const micIcon = (() => {
    if (sessionState === "preparing" || sessionState === "processing") {
      return <Loader2 size={28} className="text-white/60 animate-spin" />;
    }
    if (sessionState === "listening") return <MicOff   size={28} className="text-red-400" />;
    if (sessionState === "speaking")  return <Volume2  size={28} className="text-blue-400" />;
    if (sessionState === "blocked")   return <ShieldOff size={28} className="text-red-400" />;
    if (sessionState === "error")     return <RefreshCw size={28} className="text-red-400" />;
    return <Mic size={28} className="text-yellow-400" />;
  })();

  // ─── Render ───────────────────────────────────────────────────────────────────
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
            <div
              className="relative w-full max-w-md rounded-2xl border border-yellow-400/25 shadow-2xl overflow-hidden"
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

              {/* Body */}
              <div className="px-6 py-6 space-y-5 max-h-[70vh] overflow-y-auto">

                {/* ── Mic orb ── */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    {isListening && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping" />
                        <div className="absolute -inset-3 rounded-full bg-yellow-400/10 animate-pulse" />
                      </>
                    )}
                    <button
                      onClick={canTap ? startSession : undefined}
                      disabled={isBusy || isListening || isUnsupported || isBlocked}
                      className={cn(
                        "relative w-20 h-20 rounded-full flex items-center justify-center transition-all border-2",
                        sessionState === "idle"      && "bg-yellow-400/20 border-yellow-400/50 hover:bg-yellow-400/30 cursor-pointer",
                        isListening                  && "bg-red-500/20 border-red-400/60 cursor-default",
                        sessionState === "speaking"  && "bg-blue-500/20 border-blue-400/50 cursor-default",
                        (isBusy && !isListening)     && "bg-white/5 border-white/20 cursor-default",
                        sessionState === "error"     && "bg-red-500/10 border-red-500/30 hover:bg-red-500/20 cursor-pointer",
                        isBlocked                    && "bg-red-500/10 border-red-500/30 cursor-default opacity-60",
                        isUnsupported               && "bg-white/5 border-white/10 cursor-default opacity-50",
                      )}
                      aria-label={isListening ? "Listening" : "Start listening"}
                    >
                      {micIcon}
                    </button>
                  </div>

                  <p className={cn(
                    "text-sm font-medium text-center",
                    (sessionState === "error" || isBlocked) ? "text-red-400" : "text-white/60",
                  )}>
                    {STATE_LABELS[sessionState]}
                  </p>
                </div>

                {/* ── Permission prompt hint ── */}
                {sessionState === "permission-required" && (
                  <div className="flex items-start gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-400">
                    <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                    Your browser will ask for microphone access — click <strong className="mx-1">Allow</strong> to continue.
                  </div>
                )}

                {/* ── Error message (non-blocked) ── */}
                {sessionState === "error" && errorMessage && (
                  <div className="flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                    <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                    {errorMessage}
                  </div>
                )}

                {/* ── Blocked: browser-specific fix guide ── */}
                {isBlocked && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <ShieldOff size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-400">Microphone access blocked</p>
                        <p className="text-xs text-white/50 mt-0.5">
                          Please allow microphone access for CATalyst AI.
                        </p>
                      </div>
                    </div>

                    {/* Browser fix steps */}
                    <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl space-y-2.5">
                      <p className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                        <Settings size={11} />
                        Fix in {browserInfo.name}:
                      </p>
                      <ol className="space-y-1.5">
                        {browserInfo.steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-white/10 text-white/60 text-[10px] flex items-center justify-center mt-0.5">
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* OS-level hint */}
                    {os === "mac" && (
                      <p className="text-xs text-white/35 flex items-start gap-1.5">
                        <Settings size={11} className="mt-0.5 flex-shrink-0" />
                        macOS: System Settings → Privacy &amp; Security → Microphone → enable {browserInfo.name}
                      </p>
                    )}
                    {os === "windows" && (
                      <p className="text-xs text-white/35 flex items-start gap-1.5">
                        <Settings size={11} className="mt-0.5 flex-shrink-0" />
                        Windows: Settings → Privacy &amp; Security → Microphone → enable {browserInfo.name}
                      </p>
                    )}

                    <p className="text-center text-xs text-white/30">
                      Refresh the page after enabling microphone.
                    </p>

                    {/* Retry button */}
                    <button
                      onClick={retryPermission}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-yellow-400/15 border border-yellow-400/25 text-yellow-400 rounded-xl text-sm font-medium hover:bg-yellow-400/25 transition-all"
                    >
                      <RefreshCw size={13} />
                      I&apos;ve enabled it — Try Again
                    </button>

                    <a
                      href="https://support.google.com/chrome/answer/2693767"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 text-xs text-white/30 hover:text-white/50 transition-colors"
                    >
                      <ExternalLink size={11} />
                      Help: Enable microphone in browser
                    </a>
                  </div>
                )}

                {/* ── Unsupported notice ── */}
                {isUnsupported && (
                  <div className="flex items-start gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white/50">
                    <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                    Speech recognition isn&apos;t supported in this browser. Use the text input below.
                  </div>
                )}

                {/* ── Transcript + AI response ── */}
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

                {/* ── Text input (always available in non-active states) ── */}
                {showTextInput && (
                  <form onSubmit={handleTypedSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={typedInput}
                      onChange={(e) => setTypedInput(e.target.value)}
                      placeholder={isUnsupported || isBlocked ? "Type your CAT doubt…" : "Or type your question…"}
                      className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-yellow-400/40 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!typedInput.trim() || isBusy}
                      className="px-4 py-2.5 bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 rounded-xl text-sm hover:bg-yellow-400/30 transition-all disabled:opacity-40"
                    >
                      <Send size={15} />
                    </button>
                  </form>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 pb-5 text-center">
                <p className="text-xs text-white/25">
                  {isListening
                    ? "Speak clearly · click mic to stop early"
                    : "Tap the mic to start · Esc to close"}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
