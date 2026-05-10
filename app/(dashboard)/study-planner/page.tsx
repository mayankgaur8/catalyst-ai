"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  Calendar, Brain, Clock, Target, ChevronRight, Check,
  Sparkles, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const WEEKLY_PLAN = [
  {
    day: "Monday", date: "Nov 18",
    tasks: [
      { topic: "QA: Geometry - Circles", section: "qa", duration: 90, type: "Learn", done: true },
      { topic: "VARC: RC Practice (2 passages)", section: "varc", duration: 45, type: "Practice", done: true },
      { topic: "Vocabulary: 15 words", section: "varc", duration: 20, type: "Revision", done: false },
    ]
  },
  {
    day: "Tuesday", date: "Nov 19",
    tasks: [
      { topic: "DILR: Seating Arrangements", section: "dilr", duration: 75, type: "Learn", done: false },
      { topic: "QA: Number System revision", section: "qa", duration: 60, type: "Revision", done: false },
      { topic: "VARC: Para Jumbles (10 Qs)", section: "varc", duration: 30, type: "Practice", done: false },
    ]
  },
  {
    day: "Wednesday", date: "Nov 20",
    tasks: [
      { topic: "DILR: Data Interpretation - Tables", section: "dilr", duration: 90, type: "Practice", done: false },
      { topic: "QA: Algebra - Quadratic", section: "qa", duration: 60, type: "Learn", done: false },
    ]
  },
  {
    day: "Thursday", date: "Nov 21",
    tasks: [
      { topic: "Mock Test: DILR Sectional", section: "dilr", duration: 40, type: "Mock", done: false },
      { topic: "Mock Analysis & Revision", section: "dilr", duration: 45, type: "Revision", done: false },
      { topic: "QA: P&C Basics", section: "qa", duration: 60, type: "Learn", done: false },
    ]
  },
  {
    day: "Friday", date: "Nov 22",
    tasks: [
      { topic: "VARC: Odd Sentence Out", section: "varc", duration: 45, type: "Practice", done: false },
      { topic: "QA: TSD & Work Problems", section: "qa", duration: 75, type: "Practice", done: false },
      { topic: "DILR: Logical Grids", section: "dilr", duration: 60, type: "Learn", done: false },
    ]
  },
  {
    day: "Saturday", date: "Nov 23",
    tasks: [
      { topic: "Full CAT Mock Test", section: "qa", duration: 120, type: "Mock", done: false },
      { topic: "Mock Analysis with AI", section: "qa", duration: 60, type: "Revision", done: false },
    ]
  },
  {
    day: "Sunday", date: "Nov 24",
    tasks: [
      { topic: "Weak Topic Deep Dive", section: "dilr", duration: 90, type: "Practice", done: false },
      { topic: "Formula Sheet Revision", section: "qa", duration: 30, type: "Revision", done: false },
      { topic: "Light RC + Vocabulary", section: "varc", duration: 45, type: "Practice", done: false },
    ]
  },
];

const typeColors: Record<string, string> = {
  Learn: "bg-blue-500/20 text-blue-400",
  Practice: "bg-green-500/20 text-green-400",
  Mock: "bg-red-500/20 text-red-400",
  Revision: "bg-yellow-500/20 text-yellow-400",
};

const sectionColors: Record<string, string> = {
  qa: "border-l-blue-400",
  varc: "border-l-purple-400",
  dilr: "border-l-green-400",
};

export default function StudyPlannerPage() {
  const { user, plan } = useAuthStore();
  const [selectedDay, setSelectedDay] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiError, setAiError] = useState(false);

  const todayPlan = WEEKLY_PLAN[selectedDay];
  const totalMinutes = WEEKLY_PLAN.reduce((acc, day) => acc + day.tasks.reduce((a, t) => a + t.duration, 0), 0);
  const completedTasks = WEEKLY_PLAN.flatMap(d => d.tasks).filter(t => t.done).length;
  const totalTasks = WEEKLY_PLAN.flatMap(d => d.tasks).length;

  const handleRegenerate = async () => {
    setRegenerating(true);
    setAiInsight(null);
    setAiError(false);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id":   user?.id ?? "anonymous",
          "x-user-plan": plan ?? "free",
        },
        body: JSON.stringify({
          feature: "study_planner",
          prompt: `I am a CAT aspirant with the following weekly schedule: ${totalTasks} tasks across 7 days, ${Math.floor(totalMinutes / 60)} hours total study time. Completed tasks: ${completedTasks}/${totalTasks}. Please analyze this schedule and provide 3-4 specific, actionable improvements to optimize my CAT preparation. Focus on balancing QA, VARC, and DILR. Be concise and specific.`,
        }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (res.ok && typeof data.text === "string") {
        setAiInsight(data.text);
      } else {
        setAiError(true);
      }
    } catch {
      setAiError(true);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Study Planner</h1>
          <p className="text-white/40 mt-1 text-sm">Personalized weekly schedule generated by AI</p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-2 px-4 py-2 glass rounded-xl border border-neon-blue/20 text-neon-blue text-sm hover:bg-neon-blue/10 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={regenerating ? "animate-spin" : ""} />
          {regenerating ? "Regenerating..." : "Regenerate Plan"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Weekly Hours", value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`, icon: Clock, color: "text-neon-blue" },
          { label: "Tasks Done", value: `${completedTasks}/${totalTasks}`, icon: Check, color: "text-green-400" },
          { label: "This Week Targets", value: "3 Mocks + 12 Topics", icon: Target, color: "text-yellow-400" },
          { label: "Days to CAT", value: "42", icon: Calendar, color: "text-orange-400" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-4 border border-white/5"
          >
            <s.icon size={18} className={cn(s.color, "mb-2")} />
            <div className={cn("text-xl font-bold", s.color)}>{s.value}</div>
            <div className="text-xs text-white/30 mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* AI Insight Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 rounded-2xl border border-neon-blue/20 bg-gradient-to-r from-neon-blue/8 to-neon-purple/5 flex items-start gap-3"
      >
        <Brain size={20} className={cn("flex-shrink-0 mt-0.5", regenerating ? "text-white/30 animate-pulse" : "text-neon-blue")} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neon-blue mb-1">
            {regenerating ? "Analyzing your schedule…" : "AI Plan Insights"}
          </p>
          {aiError ? (
            <p className="text-sm text-red-400/80">
              AI mentor is warming up. Click &ldquo;Regenerate Plan&rdquo; to try again.
            </p>
          ) : aiInsight ? (
            <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">{aiInsight}</p>
          ) : (
            <p className="text-sm text-white/60">
              {regenerating
                ? "Generating personalized plan improvements…"
                : "Click “Regenerate Plan” to get AI-powered recommendations tailored to your progress."}
            </p>
          )}
        </div>
        <Sparkles size={16} className={cn("flex-shrink-0", regenerating ? "animate-spin text-white/30" : "text-neon-blue")} />
      </motion.div>

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {WEEKLY_PLAN.map((day, i) => {
          const dayDone = day.tasks.filter(t => t.done).length;
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={cn(
                "flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border transition-all",
                selectedDay === i
                  ? "bg-neon-blue/20 border-neon-blue/30 text-white"
                  : "glass border-white/8 text-white/40 hover:text-white"
              )}
            >
              <span className="text-xs font-medium">{DAYS[i]}</span>
              <span className="text-lg font-bold">{day.date.split(" ")[1]}</span>
              <div className="flex gap-1">
                {day.tasks.map((_, ti) => (
                  <div key={ti} className={cn("w-1.5 h-1.5 rounded-full", ti < dayDone ? "bg-green-400" : "bg-white/20")} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Day Tasks */}
      <motion.div
        key={selectedDay}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl border border-white/5 overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h3 className="font-semibold">{todayPlan.day} — {todayPlan.date}</h3>
            <p className="text-xs text-white/30 mt-0.5">
              {todayPlan.tasks.reduce((a, t) => a + t.duration, 0)} min total
              • {todayPlan.tasks.filter(t => t.done).length}/{todayPlan.tasks.length} done
            </p>
          </div>
          <button className="text-xs text-neon-blue px-3 py-1.5 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
            Add Task
          </button>
        </div>

        <div className="divide-y divide-white/3">
          {todayPlan.tasks.map((task, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "flex items-center gap-4 p-4 border-l-2 transition-all hover:bg-white/2",
                sectionColors[task.section],
                task.done && "opacity-50"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all",
                task.done ? "bg-green-400 border-green-400" : "border-white/20 hover:border-green-400"
              )}>
                {task.done && <Check size={12} className="text-dark-900" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("text-sm font-medium", task.done && "line-through")}>{task.topic}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded font-medium", typeColors[task.type])}>{task.type}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/30 mt-0.5">
                  <span className="flex items-center gap-1"><Clock size={10} /> {task.duration} min</span>
                  <span className="uppercase">{task.section}</span>
                </div>
              </div>

              <button className="text-white/25 hover:text-neon-blue transition-all">
                <ChevronRight size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Section Time Distribution */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { section: "Quantitative Aptitude", pct: 40, color: "from-blue-500 to-cyan-400", hours: "9.6h/week" },
          { section: "DILR", pct: 35, color: "from-green-500 to-teal-400", hours: "8.4h/week" },
          { section: "VARC", pct: 25, color: "from-purple-500 to-pink-400", hours: "6h/week" },
        ].map((s) => (
          <div key={s.section} className="glass rounded-2xl p-4 border border-white/5">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">{s.section}</span>
              <span className="text-xs text-white/30">{s.hours}</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.pct}%` }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className={cn("h-full rounded-full bg-gradient-to-r", s.color)}
              />
            </div>
            <span className="text-xs text-white/30">{s.pct}% of study time</span>
          </div>
        ))}
      </div>
    </div>
  );
}
