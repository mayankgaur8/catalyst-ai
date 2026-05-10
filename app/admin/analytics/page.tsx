"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
  Users, TrendingUp, Brain, CreditCard, ArrowUpRight,
  ArrowDownRight, Zap, Activity, Target, BarChart2,
  RefreshCw, AlertTriangle
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PlanBreakdown {
  name: string;
  value: number;
  color: string;
}

interface DailyStats {
  date: string;
  dau: number;
  newUsers: number;
  sessions: number;
  revenue: number;
}

interface ConversionStep {
  step: string;
  count: number;
  rate: number;
}

interface ProviderHealth {
  name: string;
  successRate: number;
  avgLatencyMs: number;
  requestsToday: number;
}

interface AnalyticsData {
  overview: {
    dau: number;
    wau: number;
    mau: number;
    dauGrowth: number;
    mauGrowth: number;
    totalUsers: number;
    totalRevenue: number;
    revenueGrowth: number;
    arpu: number;
    avgSessionMin: number;
    retentionD7: number;
    retentionD30: number;
    aiRequestsToday: number;
    memoriesCreated: number;
  };
  dailyStats: DailyStats[];
  planBreakdown: PlanBreakdown[];
  conversionFunnel: ConversionStep[];
  providerHealth: ProviderHealth[];
  weakAreaDistribution: { subject: string; users: number }[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  sub,
  growth,
  icon: Icon,
  color = "sky",
}: {
  label: string;
  value: string | number;
  sub?: string;
  growth?: number;
  icon: React.ElementType;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    sky: "text-sky-400",
    purple: "text-purple-400",
    green: "text-emerald-400",
    amber: "text-amber-400",
    pink: "text-pink-400",
  };
  const bgMap: Record<string, string> = {
    sky: "bg-sky-500/10",
    purple: "bg-purple-500/10",
    green: "bg-emerald-500/10",
    amber: "bg-amber-500/10",
    pink: "bg-pink-500/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/3 border border-white/8 rounded-2xl p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-white/40 uppercase tracking-widest">{label}</span>
        <div className={`p-2 rounded-xl ${bgMap[color] ?? bgMap.sky}`}>
          <Icon size={14} className={colorMap[color] ?? colorMap.sky} />
        </div>
      </div>
      <div className={`text-2xl font-bold ${colorMap[color] ?? colorMap.sky} mb-0.5`}>{value}</div>
      {sub && <div className="text-[11px] text-white/30">{sub}</div>}
      {growth !== undefined && (
        <div className={`flex items-center gap-1 mt-1.5 text-[11px] font-medium ${growth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {growth >= 0
            ? <ArrowUpRight size={12} />
            : <ArrowDownRight size={12} />
          }
          {Math.abs(growth)}% vs last period
        </div>
      )}
    </motion.div>
  );
}

// ─── Mock data generator (replace with real API) ───────────────────────────────

function generateMockData(): AnalyticsData {
  const now = new Date();
  const dailyStats: DailyStats[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    return {
      date: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      dau: 800 + Math.floor(Math.random() * 400) + i * 15,
      newUsers: 40 + Math.floor(Math.random() * 60) + i * 2,
      sessions: 2400 + Math.floor(Math.random() * 800) + i * 30,
      revenue: 12000 + Math.floor(Math.random() * 8000) + i * 300,
    };
  });

  return {
    overview: {
      dau: 2140,
      wau: 9800,
      mau: 31200,
      dauGrowth: 8.4,
      mauGrowth: 22.1,
      totalUsers: 89400,
      totalRevenue: 4820000,
      revenueGrowth: 34.7,
      arpu: 487,
      avgSessionMin: 28,
      retentionD7: 58,
      retentionD30: 31,
      aiRequestsToday: 18400,
      memoriesCreated: 6200,
    },
    dailyStats,
    planBreakdown: [
      { name: "Free", value: 68, color: "#475569" },
      { name: "Pro", value: 24, color: "#38bdf8" },
      { name: "Elite", value: 8, color: "#818cf8" },
    ],
    conversionFunnel: [
      { step: "Registered", count: 89400, rate: 100 },
      { step: "Completed Onboarding", count: 71500, rate: 80 },
      { step: "First AI Session", count: 52300, rate: 58.5 },
      { step: "7-Day Active", count: 28900, rate: 32.3 },
      { step: "Converted to Paid", count: 28800, rate: 32.2 },
      { step: "Elite Plan", count: 7200, rate: 8.1 },
    ],
    providerHealth: [
      { name: "Groq", successRate: 99.2, avgLatencyMs: 380, requestsToday: 12800 },
      { name: "Gemini", successRate: 98.7, avgLatencyMs: 620, requestsToday: 4100 },
      { name: "OpenRouter", successRate: 97.1, avgLatencyMs: 1100, requestsToday: 1500 },
    ],
    weakAreaDistribution: [
      { subject: "Quant", users: 14200 },
      { subject: "VARC", users: 9800 },
      { subject: "DILR", users: 7400 },
      { subject: "Reading Comp", users: 6100 },
      { subject: "Algebra", users: 5300 },
    ],
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadData = useCallback(async () => {
    // In production, call /api/admin/analytics — using mock for now
    setData(generateMockData());
    setLastUpdated(new Date());
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => { void loadData(); }, [loadData]);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#080c16] flex items-center justify-center">
        <Activity size={24} className="text-sky-400 animate-pulse" />
      </div>
    );
  }

  const { overview } = data;

  return (
    <div className="min-h-screen bg-[#080c16] text-white p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Last updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <button
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white transition-all"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="DAU" value={overview.dau.toLocaleString()} growth={overview.dauGrowth} icon={Users} color="sky" />
        <Stat label="MAU" value={overview.mau.toLocaleString()} growth={overview.mauGrowth} icon={TrendingUp} color="green" />
        <Stat label="Total Revenue" value={`₹${(overview.totalRevenue / 100000).toFixed(1)}L`} growth={overview.revenueGrowth} icon={CreditCard} color="purple" />
        <Stat label="ARPU" value={`₹${overview.arpu}`} sub="per paid user / month" icon={Target} color="amber" />
        <Stat label="D7 Retention" value={`${overview.retentionD7}%`} sub="industry avg ~40%" icon={Activity} color="pink" />
        <Stat label="D30 Retention" value={`${overview.retentionD30}%`} sub="industry avg ~15%" icon={Activity} color="sky" />
        <Stat label="AI Requests Today" value={overview.aiRequestsToday.toLocaleString()} icon={Brain} color="purple" />
        <Stat label="Memories Created" value={overview.memoriesCreated.toLocaleString()} sub="today" icon={Zap} color="green" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* DAU trend */}
        <div className="lg:col-span-2 bg-white/3 border border-white/8 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white/70 mb-4">Daily Active Users — 30 days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.dailyStats}>
              <defs>
                <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Area type="monotone" dataKey="dau" stroke="#38bdf8" fill="url(#dauGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Plan breakdown */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white/70 mb-4">Plan Distribution</h2>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={data.planBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                {data.planBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }}
                formatter={(value) => [`${String(value)}%`, "Share"]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-2">
            {data.planBreakdown.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5 text-xs text-white/50">
                <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                {p.name} {p.value}%
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue trend */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white/70 mb-4">Daily Revenue (₹)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.dailyStats.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }}
                formatter={(v) => [`₹${Number(v).toLocaleString()}`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#818cf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion funnel */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white/70 mb-4">Conversion Funnel</h2>
          <div className="space-y-2.5">
            {data.conversionFunnel.map((step, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60">{step.step}</span>
                  <span className="text-white/40">{step.count.toLocaleString()} · {step.rate}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${step.rate}%`,
                      background: `hsl(${210 - i * 15}, 80%, 60%)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Provider health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white/70 mb-4">AI Provider Health</h2>
          <div className="space-y-4">
            {data.providerHealth.map((p) => (
              <div key={p.name} className="flex items-center gap-4">
                <div className="w-20 text-xs text-white/50 font-medium">{p.name}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] text-white/30 mb-1">
                    <span>Success {p.successRate}%</span>
                    <span>{p.avgLatencyMs}ms avg</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p.successRate}%`, background: p.successRate > 99 ? "#10b981" : p.successRate > 97 ? "#f59e0b" : "#ef4444" }}
                    />
                  </div>
                </div>
                <div className="text-[10px] text-white/30 w-16 text-right">{p.requestsToday.toLocaleString()} reqs</div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak areas */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white/70 mb-4">Top Weak Areas (User Distribution)</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.weakAreaDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} />
              <YAxis type="category" dataKey="subject" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={80} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="users" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alert banner for low retention */}
      {overview.retentionD30 < 35 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20 text-sm text-amber-300"
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            <strong>Retention Opportunity:</strong> D30 retention is {overview.retentionD30}%. Enable streak reminders, comeback emails, and weekly AI reports to push towards 35%+.
          </div>
        </motion.div>
      )}
    </div>
  );
}
