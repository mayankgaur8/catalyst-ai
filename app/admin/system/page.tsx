"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, Database, RefreshCw, Server, Zap, Cpu, MemoryStick, Waves } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

type SystemSnapshot = {
  runtime: {
    startedAt: string;
    uptimeSeconds: number;
    nodeEnv: string;
    deploymentTarget: string;
    activeStreams: number;
    streamDisconnects: number;
    requestCount: number;
    avgResponseLatencyMs: number;
    p95ResponseLatencyMs: number;
    memoryMB: number;
    dependencies: Record<string, { status: string; details?: string; latencyMs?: number; updatedAt: string }>;
  };
  envHealth: {
    database: { status: string; latencyMs: number; details?: string };
    redis: { status: string; latencyMs: number; details?: string };
  };
  queueHealth: {
    status: string;
    counts: Record<string, number>;
  };
  providerHealth: Record<string, { state: string; failures: number; lastFailureAt: number | null; openedAt: number | null }>;
  metrics: {
    totalRequests: number;
    totalCostUSD: number;
    cacheHits: number;
    fallbacks: number;
    quotaExceeded: number;
    rateLimited: number;
    byProvider: Record<string, { requests: number; costUSD: number; errors: number }>;
    byFeature: Record<string, { requests: number }>;
    byPlan: Record<string, { requests: number }>;
  };
  recentLogs: Array<{ timestamp: string; provider: string; latencyMs: number; status: string; cached: boolean; costUSD?: number }>;
  latencySeries: Array<{ timestamp: string; provider: string; latencyMs: number; status: string; cached: boolean }>;
};

const CARD = "rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/10";

export default function AdminSystemPage() {
  const { user, isAdmin } = useAuthStore();
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/system?type=snapshot", {
          headers: {
            "x-user-id": user?.id ?? "",
            "x-user-plan": "admin",
            "x-user-role": "admin",
          },
        });
        const data = (await res.json()) as SystemSnapshot;
        if (mounted) setSnapshot(data);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [user?.id, refreshKey]);

  const latencyChart = useMemo(() => (snapshot?.latencySeries ?? []).slice(-30).map((entry, index) => ({
    label: String(index + 1),
    latencyMs: entry.latencyMs,
  })), [snapshot]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-400 font-semibold">Admin access required</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </div>
    );
  }

  const runtime = snapshot?.runtime;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14),_transparent_30%),#020617] text-white">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl px-4 lg:px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/35">Operations</p>
          <h1 className="text-xl font-semibold">System Control Room</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setRefreshKey((v) => v + 1)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70">
            <RefreshCw size={14} className={cn(loading && "animate-spin")} /> Refresh
          </button>
          <Link href="/admin" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70">
            <ArrowLeft size={14} /> Admin
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8 space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className={CARD}><div className="flex items-center justify-between"><span className="text-white/45 text-sm">Active Streams</span><Activity className="text-cyan-300" size={16} /></div><p className="text-3xl font-semibold mt-2">{runtime?.activeStreams ?? 0}</p><p className="text-xs text-white/40 mt-1">Disconnects: {runtime?.streamDisconnects ?? 0}</p></div>
          <div className={CARD}><div className="flex items-center justify-between"><span className="text-white/45 text-sm">Database</span><Database className="text-emerald-300" size={16} /></div><p className="text-3xl font-semibold mt-2">{snapshot?.envHealth.database.status ?? "unknown"}</p><p className="text-xs text-white/40 mt-1">{snapshot?.envHealth.database.latencyMs ?? 0}ms</p></div>
          <div className={CARD}><div className="flex items-center justify-between"><span className="text-white/45 text-sm">Redis / Queue</span><Server className="text-purple-300" size={16} /></div><p className="text-3xl font-semibold mt-2">{snapshot?.queueHealth.status ?? "unknown"}</p><p className="text-xs text-white/40 mt-1">Waiting: {snapshot?.queueHealth.counts.waiting ?? 0}</p></div>
          <div className={CARD}><div className="flex items-center justify-between"><span className="text-white/45 text-sm">AI Requests</span><Zap className="text-yellow-300" size={16} /></div><p className="text-3xl font-semibold mt-2">{snapshot?.metrics.totalRequests ?? 0}</p><p className="text-xs text-white/40 mt-1">Cost: ${snapshot?.metrics.totalCostUSD?.toFixed(4) ?? "0.0000"}</p></div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className={CARD + " lg:col-span-2"}>
            <div className="flex items-center justify-between mb-4"><h2 className="font-semibold">Response Latency</h2><Cpu className="text-blue-300" size={16} /></div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyChart}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.35)" }} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.35)" }} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <Line type="monotone" dataKey="latencyMs" stroke="#38bdf8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className={CARD}>
            <div className="flex items-center justify-between mb-4"><h2 className="font-semibold">Queues</h2><Waves className="text-purple-300" size={16} /></div>
            <div className="space-y-2 text-sm">
              {Object.entries(snapshot?.queueHealth.counts ?? {}).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/45 capitalize">{key}</span><span>{value}</span></div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className={CARD}>
            <div className="flex items-center justify-between mb-4"><h2 className="font-semibold">Provider Health</h2><Activity className="text-cyan-300" size={16} /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.entries(snapshot?.providerHealth ?? {}).map(([provider, health]) => (
                <div key={provider} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between"><span className="font-medium capitalize">{provider}</span><span className="text-xs px-2 py-0.5 rounded-full bg-white/5">{health.state}</span></div>
                  <p className="text-xs text-white/40 mt-2">Failures: {health.failures}</p>
                  <p className="text-xs text-white/40">Last failure: {health.lastFailureAt ? new Date(health.lastFailureAt).toLocaleTimeString() : "-"}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={CARD}>
            <div className="flex items-center justify-between mb-4"><h2 className="font-semibold">System Snapshot</h2><MemoryStick className="text-emerald-300" size={16} /></div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-white/5 p-3"><p className="text-white/40 text-xs">Uptime</p><p className="font-semibold">{Math.floor((runtime?.uptimeSeconds ?? 0) / 60)}m</p></div>
              <div className="rounded-xl bg-white/5 p-3"><p className="text-white/40 text-xs">Memory</p><p className="font-semibold">{runtime?.memoryMB ?? 0} MB</p></div>
              <div className="rounded-xl bg-white/5 p-3"><p className="text-white/40 text-xs">Avg Latency</p><p className="font-semibold">{runtime?.avgResponseLatencyMs ?? 0} ms</p></div>
              <div className="rounded-xl bg-white/5 p-3"><p className="text-white/40 text-xs">P95 Latency</p><p className="font-semibold">{runtime?.p95ResponseLatencyMs ?? 0} ms</p></div>
            </div>
          </div>
        </section>

        <section className={CARD}>
          <div className="flex items-center justify-between mb-4"><h2 className="font-semibold">Recent AI Latency</h2></div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(snapshot?.latencySeries ?? []).slice(-12)}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="provider" tick={{ fill: "rgba(255,255,255,0.35)" }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.35)" }} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)" }} />
                <Bar dataKey="latencyMs" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>
    </div>
  );
}
