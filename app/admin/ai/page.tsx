"use client";

import { useState, useEffect } from "react";
import {
  Activity, AlertTriangle, ArrowLeft, CheckCircle2, ChevronDown,
  ChevronUp, Clock, DollarSign, FlaskConical, Layers, Loader2,
  RefreshCw, Send, XCircle, Zap,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import type { AIFeature } from "@/lib/ai/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProviderHealth {
  provider:      string;
  state:         "CLOSED" | "OPEN" | "HALF_OPEN";
  failures:      number;
  lastFailureAt: number | null;
  openedAt:      number | null;
}

interface LogEntry {
  requestId:  string;
  userId:     string;
  feature:    string;
  provider:   string;
  latencyMs:  number;
  status:     string;
  cached:     boolean;
  costUSD?:   number;
  timestamp:  string;
  error?:     string;
}

interface Metrics {
  totalRequests: number;
  totalCostUSD:  number;
  cacheHits:     number;
  fallbacks:     number;
  quotaExceeded: number;
  rateLimited:   number;
  byProvider:    Record<string, { requests: number; costUSD: number; errors: number }>;
  byFeature:     Record<string, { requests: number }>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const NAV_TABS = [
  { id: "health", label: "Health",      icon: Activity },
  { id: "logs",   label: "Logs",        icon: Layers },
  { id: "costs",  label: "Costs",       icon: DollarSign },
  { id: "test",   label: "Test Panel",  icon: FlaskConical },
];

const STATE_STYLES: Record<string, string> = {
  CLOSED:    "bg-green-500/15 text-green-400 border-green-500/30",
  OPEN:      "bg-red-500/15   text-red-400   border-red-500/30",
  HALF_OPEN: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
};

const VALID_FEATURES: AIFeature[] = [
  "doubt_solver", "video_summary", "quiz_generation",
  "study_planner", "mock_analysis", "weak_area_recommendation", "daily_motivation",
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminAIPage() {
  const { user, isAdmin } = useAuthStore();

  const [tab,        setTab]        = useState("health");
  const [refreshKey, setRefreshKey] = useState(0);

  const [health,  setHealth]  = useState<Record<string, ProviderHealth> | null>(null);
  const [logs,    setLogs]    = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);

  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Test panel
  const [testFeature, setTestFeature] = useState<AIFeature>("doubt_solver");
  const [testPrompt,  setTestPrompt]  = useState("");
  const [testResult,  setTestResult]  = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testMeta,    setTestMeta]    = useState<Record<string, unknown> | null>(null);

  const adminHeaders: Record<string, string> = {
    "x-user-id":   user?.id   ?? "",
    "x-user-role": "admin",
    "x-user-plan": "admin",
  };

  // ── Data fetching ──────────────────────────────────────────────────────────
  // Using an async IIFE with an initial await so setState calls are not
  // synchronous within the effect body (satisfies the lint rule).

  useEffect(() => {
    let active = true;

    const load = async () => {
      await Promise.resolve(); // defer all setState past the synchronous effect body
      if (!active) return;

      setLoading(true);
      try {
        if (tab === "health") {
          const res  = await fetch("/api/ai?type=health", { headers: adminHeaders });
          const data = await res.json() as { health: Record<string, ProviderHealth> };
          if (active) setHealth(data.health);

        } else if (tab === "logs") {
          const res  = await fetch("/api/ai?type=logs&limit=100", { headers: adminHeaders });
          const data = await res.json() as { logs: LogEntry[] };
          if (active) setLogs(data.logs ?? []);

        } else if (tab === "costs") {
          const res  = await fetch("/api/ai?type=metrics", { headers: adminHeaders });
          const data = await res.json() as { metrics: Metrics };
          if (active) setMetrics(data.metrics);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, user?.id, refreshKey]);

  // ── Test panel submit ──────────────────────────────────────────────────────

  const sendTestPrompt = async () => {
    if (!testPrompt.trim() || testLoading) return;
    setTestLoading(true);
    setTestResult(null);
    setTestMeta(null);
    try {
      const res  = await fetch("/api/ai", {
        method:  "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders },
        body:    JSON.stringify({ feature: testFeature, prompt: testPrompt }),
      });
      const data = await res.json() as Record<string, unknown>;
      setTestResult(res.ok ? (data.text as string) : `Error ${res.status}: ${JSON.stringify(data)}`);
      if (res.ok) setTestMeta(data);
    } catch (err) {
      setTestResult(err instanceof Error ? err.message : "Request failed");
    } finally {
      setTestLoading(false);
    }
  };

  // ── Auth guard ─────────────────────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
        <XCircle size={48} className="text-red-400" />
        <h1 className="text-2xl font-bold text-red-400">Admin Access Required</h1>
        <Link href="/dashboard">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/8 transition-all">
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-gray-950/80 backdrop-blur-xl px-4 lg:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white leading-none">AI Console</h1>
            <p className="text-xs text-gray-500">CATalyst AI · admin</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-sm hover:text-white transition-all"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Refresh
          </button>
          <Link href="/admin">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-sm hover:text-white transition-all">
              <ArrowLeft className="w-3.5 h-3.5" /> Admin
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6">
        {/* Tab bar */}
        <div className="flex gap-1 mb-6 bg-white/5 border border-white/10 rounded-xl p-1 overflow-x-auto">
          {NAV_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all whitespace-nowrap",
                tab === t.id
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── HEALTH ── */}
        {tab === "health" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Provider Circuit Breakers</h2>
            {loading && !health ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <Loader2 className="animate-spin mr-2" size={20} /> Loading…
              </div>
            ) : health ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.values(health).map((h) => (
                  <div key={h.provider} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold capitalize text-white">{h.provider}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border font-bold uppercase", STATE_STYLES[h.state ?? "CLOSED"])}>
                        {h.state}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Failures (60s)</span>
                        <span className={cn("font-mono", h.failures >= 3 ? "text-red-400" : "text-white")}>{h.failures}</span>
                      </div>
                      {h.lastFailureAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last failure</span>
                          <span className="text-gray-300 text-xs">{new Date(h.lastFailureAt).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/8">
                      {h.state === "CLOSED" ? (
                        <div className="flex items-center gap-1.5 text-green-400 text-xs">
                          <CheckCircle2 size={12} /> Accepting requests
                        </div>
                      ) : h.state === "OPEN" ? (
                        <div className="flex items-center gap-1.5 text-red-400 text-xs">
                          <XCircle size={12} /> Blocked (30s cooldown)
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-yellow-400 text-xs">
                          <AlertTriangle size={12} /> Probing…
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No health data. Is the API running?</p>
            )}
          </div>
        )}

        {/* ── LOGS ── */}
        {tab === "logs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Recent Requests</h2>
              <span className="text-xs text-gray-500">{logs.length} entries</span>
            </div>
            {loading && logs.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <Loader2 className="animate-spin mr-2" size={20} /> Loading…
              </div>
            ) : logs.length === 0 ? (
              <p className="text-center py-16 text-gray-500 text-sm">No requests logged yet.</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log) => (
                  <div key={log.requestId} className="bg-white/5 border border-white/8 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedLog(expandedLog === log.requestId ? null : log.requestId)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-all"
                    >
                      <span className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        log.status === "success" ? "bg-green-400" : log.status === "timeout" ? "bg-yellow-400" : "bg-red-400"
                      )} />
                      <span className="text-xs font-mono text-gray-400 w-20">{log.provider}</span>
                      <span className="text-xs text-gray-300 flex-1 truncate">{log.feature}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={10} /> {log.latencyMs}ms
                      </span>
                      {log.cached && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">cached</span>
                      )}
                      {log.costUSD ? (
                        <span className="text-[10px] text-green-400 font-mono">${log.costUSD.toFixed(6)}</span>
                      ) : null}
                      <span className="text-[10px] text-gray-600 ml-2">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      {expandedLog === log.requestId
                        ? <ChevronUp size={12} className="text-gray-500" />
                        : <ChevronDown size={12} className="text-gray-500" />}
                    </button>
                    {expandedLog === log.requestId && (
                      <div className="px-4 pb-3 border-t border-white/5">
                        <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-all bg-black/20 rounded-lg p-3 mt-2">
                          {JSON.stringify(log, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── COSTS ── */}
        {tab === "costs" && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold">Usage &amp; Costs</h2>
            {loading && !metrics ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <Loader2 className="animate-spin mr-2" size={20} /> Loading…
              </div>
            ) : metrics ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: "Total Requests",  value: String(metrics.totalRequests),          color: "text-blue-400" },
                    { label: "Total Cost",       value: `$${metrics.totalCostUSD.toFixed(4)}`, color: "text-green-400" },
                    { label: "Cache Hits",       value: String(metrics.cacheHits),             color: "text-purple-400" },
                    { label: "Fallbacks",        value: String(metrics.fallbacks),             color: "text-yellow-400" },
                    { label: "Quota Exceeded",   value: String(metrics.quotaExceeded),         color: "text-red-400" },
                    { label: "Rate Limited",     value: String(metrics.rateLimited),           color: "text-orange-400" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                      <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <h3 className="font-semibold text-white mb-4">Requests by Provider</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={Object.entries(metrics.byProvider).map(([provider, d]) => ({ provider, ...d }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="provider" tick={{ fill: "#6b7280", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                      <Bar dataKey="requests" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <h3 className="font-semibold text-white mb-4">Requests by Feature</h3>
                  <div className="space-y-2">
                    {Object.entries(metrics.byFeature)
                      .sort((a, b) => b[1].requests - a[1].requests)
                      .map(([feature, d]) => (
                        <div key={feature} className="flex items-center gap-3">
                          <span className="text-sm text-gray-300 w-44 truncate">{feature}</span>
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{
                                width: metrics.totalRequests
                                  ? `${(d.requests / metrics.totalRequests) * 100}%`
                                  : "0%",
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-400 w-8 text-right">{d.requests}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">No metrics available.</p>
            )}
          </div>
        )}

        {/* ── TEST PANEL ── */}
        {tab === "test" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold">Live AI Test Panel</h2>
              <p className="text-gray-400 text-sm mt-1">
                Send real requests through the AI stack. Admin quota bypass applies.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Feature</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {VALID_FEATURES.map((f) => (
                      <button
                        key={f}
                        onClick={() => setTestFeature(f)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-xs border transition-all text-left",
                          testFeature === f
                            ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                            : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                        )}
                      >
                        {f.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Prompt</label>
                  <textarea
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        void sendTestPrompt();
                      }
                    }}
                    placeholder={`Test prompt for ${testFeature.replace(/_/g, " ")}…`}
                    rows={5}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/40 resize-none"
                  />
                </div>

                <button
                  onClick={() => void sendTestPrompt()}
                  disabled={!testPrompt.trim() || testLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-xl text-sm font-medium hover:bg-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {testLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {testLoading ? "Sending…" : "Send (⌘↵)"}
                </button>
              </div>

              <div className="space-y-4">
                {testResult !== null ? (
                  <>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Response</label>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed min-h-[120px]">
                        {testResult}
                      </div>
                    </div>
                    {testMeta && (
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Metadata</label>
                        <pre className="bg-black/30 border border-white/8 rounded-xl px-4 py-3 text-xs font-mono text-gray-400 whitespace-pre-wrap overflow-auto">
                          {JSON.stringify(testMeta, null, 2)}
                        </pre>
                      </div>
                    )}
                  </>
                ) : testLoading ? (
                  <div className="flex items-center justify-center h-48 text-gray-500 text-sm gap-2">
                    <Loader2 size={16} className="animate-spin" /> Waiting for response…
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-gray-600 text-sm border border-white/5 rounded-xl border-dashed">
                    Response will appear here
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
