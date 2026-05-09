"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Zap, ArrowRight, ArrowLeft, Check, Clock,
  BarChart2, Sparkles, Brain, Target, BookOpen, GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COLLEGES } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import type { OnboardingData } from "@/store/useAuthStore";

const STEPS = [
  { id: 1, title: "Goal Setup", desc: "What are you targeting?" },
  { id: 2, title: "Exam Selection", desc: "Which exams are you preparing for?" },
  { id: 3, title: "Study Preference", desc: "How do you learn best?" },
  { id: 4, title: "Dream Colleges", desc: "Where do you want to go?" },
  { id: 5, title: "AI Plan", desc: "Your personalized roadmap is ready" },
];

const EXAMS = ["CAT", "XAT", "SNAP", "NMAT", "IIFT", "CMAT", "MAT", "MICAT", "TISSNET"];
const CATEGORIES = ["General", "OBC", "SC", "ST", "EWS"];
const WORK_EXP = ["Fresher (0 years)", "1 year", "2 years", "3 years", "4+ years"];
const STUDY_HOURS = ["1-2 hours", "3-4 hours", "5-6 hours", "7+ hours"];
const WEAKNESSES = [
  "Quantitative Aptitude", "Data Interpretation", "Logical Reasoning",
  "Reading Comprehension", "Para Jumbles", "Verbal Ability",
  "Time Management", "Mock Exam Pressure",
];
const STUDY_MODES = [
  { id: "self", label: "Self-Paced", desc: "Study at your own pace with AI assistance", icon: "📚" },
  { id: "ai", label: "AI-Guided", desc: "Let AI build and adjust your daily plan", icon: "🤖" },
  { id: "mentor", label: "Mentor-Guided", desc: "1:1 expert guidance + AI support", icon: "👨‍🏫" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, plan, hasCompletedOnboarding, completeOnboarding, user } = useAuthStore();

  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState<Omit<OnboardingData, "examDate">>({
    targetPercentile: 95,
    exams: [],
    graduation: "",
    category: "General",
    workExp: "",
    studyHours: "",
    dreamColleges: [],
    weaknesses: [],
    studyMode: "ai",
  });

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
    if (!plan) router.push("/plan-selection");
    if (hasCompletedOnboarding) router.push("/dashboard");
  }, [isAuthenticated, plan, hasCompletedOnboarding, router]);

  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  async function handleFinish() {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 2000));
    completeOnboarding({ ...form, examDate: "2025-11-23" });
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-dark-900 animated-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-neon-blue/4 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-neon-purple/4 rounded-full blur-3xl" />
      </div>

      <AnimatePresence>
        {generating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-dark-900/95 backdrop-blur-xl flex flex-col items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center max-w-md"
            >
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-neon-blue/20 animate-pulse" />
                <div className="absolute inset-0 rounded-full border-4 border-t-neon-blue animate-spin" />
                <div className="absolute inset-3 rounded-full bg-neon-blue/10 flex items-center justify-center">
                  <Brain size={28} className="text-neon-blue" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Building your AI plan...</h2>
              <p className="text-white/40 text-sm mb-6">
                Analyzing your profile and generating a personalized roadmap to {form.targetPercentile}+ percentile
              </p>
              <div className="space-y-2 text-left max-w-xs mx-auto">
                {[
                  "Analyzing weak areas...",
                  "Generating daily study schedule...",
                  "Creating adaptive mock plan...",
                  "Setting up AI mentor...",
                ].map((msg, i) => (
                  <motion.div
                    key={msg}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.4 }}
                    className="flex items-center gap-2 text-sm text-white/50"
                  >
                    <div className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-pulse" />
                    {msg}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center glow-blue">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold neon-text">CATalyst AI</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full border border-neon-blue/20 text-xs text-neon-blue mb-3">
            <Sparkles size={12} />
            Step 4 of 4 — Personalization
          </div>
          <h1 className="text-2xl font-bold">
            Let&apos;s build your AI study plan{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-white/40 mt-1 text-sm">Answer 5 quick questions to personalize your journey</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-1.5 mb-6 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all flex-shrink-0",
                step > s.id ? "bg-neon-blue text-dark-900" :
                step === s.id ? "bg-neon-blue/20 text-neon-blue border border-neon-blue" :
                "bg-white/5 text-white/25 border border-white/10"
              )}>
                {step > s.id ? <Check size={12} /> : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("w-6 h-0.5 flex-shrink-0", step > s.id ? "bg-neon-blue" : "bg-white/10")} />
              )}
            </div>
          ))}
        </div>

        {/* Step card */}
        <div className="glass rounded-3xl p-6 sm:p-8 border border-white/8">
          <AnimatePresence mode="wait">
            {/* Step 1: Goal Setup */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold">{STEPS[0].title}</h2>
                  <p className="text-white/40 text-sm mt-1">{STEPS[0].desc}</p>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">
                    Target CAT Percentile: <span className="text-neon-blue text-base font-bold">{form.targetPercentile}</span>
                  </label>
                  <input
                    type="range" min={70} max={100} value={form.targetPercentile}
                    onChange={(e) => setForm({ ...form, targetPercentile: Number(e.target.value) })}
                    className="w-full h-2 accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-white/25 mt-1">
                    {[70, 80, 90, 95, 99, 100].map((v) => <span key={v}>{v}</span>)}
                  </div>
                  <div className={cn(
                    "mt-3 text-xs px-3 py-2 rounded-lg",
                    form.targetPercentile >= 99 ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20" :
                    form.targetPercentile >= 95 ? "bg-neon-blue/10 text-neon-blue border border-neon-blue/20" :
                    "bg-white/5 text-white/40 border border-white/10"
                  )}>
                    {form.targetPercentile >= 99 ? "🏆 IIM A/B/C territory — Elite plan recommended" :
                     form.targetPercentile >= 95 ? "⚡ Top IIMs territory — Pro plan recommended" :
                     "📚 Good IIMs — Free plan is a great start"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Graduation Background</label>
                    <input
                      type="text" value={form.graduation}
                      onChange={(e) => setForm({ ...form, graduation: e.target.value })}
                      placeholder="e.g., B.Tech, B.Com"
                      className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-blue/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Category</label>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map((cat) => (
                        <button key={cat} onClick={() => setForm({ ...form, category: cat })}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs border transition-all",
                            form.category === cat
                              ? "bg-neon-purple/20 border-neon-purple/40 text-neon-purple"
                              : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                          )}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">Weak Areas (select all)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {WEAKNESSES.map((w) => (
                      <button key={w}
                        onClick={() => setForm({ ...form, weaknesses: toggle(form.weaknesses, w) })}
                        className={cn(
                          "px-3 py-2.5 rounded-xl text-xs border flex items-center gap-2 transition-all text-left",
                          form.weaknesses.includes(w)
                            ? "bg-orange-500/15 border-orange-500/40 text-orange-300"
                            : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                        )}>
                        <BarChart2 size={12} className="flex-shrink-0" /> {w}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Exam Selection */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold">{STEPS[1].title}</h2>
                  <p className="text-white/40 text-sm mt-1">{STEPS[1].desc}</p>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">Target Exams</label>
                  <div className="flex flex-wrap gap-2">
                    {EXAMS.map((exam) => (
                      <button key={exam}
                        onClick={() => setForm({ ...form, exams: toggle(form.exams, exam) })}
                        className={cn(
                          "px-4 py-2.5 rounded-xl text-sm font-medium border transition-all",
                          form.exams.includes(exam)
                            ? "bg-neon-blue/20 border-neon-blue/40 text-neon-blue"
                            : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                        )}>
                        {exam}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">Work Experience</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {WORK_EXP.map((exp) => (
                      <button key={exp}
                        onClick={() => setForm({ ...form, workExp: exp })}
                        className={cn(
                          "px-3 py-2.5 rounded-xl text-sm border transition-all",
                          form.workExp === exp
                            ? "bg-neon-blue/20 border-neon-blue/40 text-neon-blue"
                            : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                        )}>
                        {exp}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Study Preference */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold">{STEPS[2].title}</h2>
                  <p className="text-white/40 text-sm mt-1">{STEPS[2].desc}</p>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">Daily Study Hours</label>
                  <div className="grid grid-cols-2 gap-3">
                    {STUDY_HOURS.map((h) => (
                      <button key={h}
                        onClick={() => setForm({ ...form, studyHours: h })}
                        className={cn(
                          "px-4 py-3 rounded-xl text-sm border flex items-center gap-3 transition-all",
                          form.studyHours === h
                            ? "bg-neon-blue/20 border-neon-blue/40 text-neon-blue"
                            : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                        )}>
                        <Clock size={16} /> {h}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">Study Mode</label>
                  <div className="space-y-2">
                    {STUDY_MODES.map((mode) => (
                      <button key={mode.id}
                        onClick={() => setForm({ ...form, studyMode: mode.id as OnboardingData["studyMode"] })}
                        className={cn(
                          "w-full px-4 py-3.5 rounded-xl text-sm border flex items-center gap-4 transition-all text-left",
                          form.studyMode === mode.id
                            ? "bg-neon-blue/15 border-neon-blue/40"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        )}>
                        <span className="text-2xl flex-shrink-0">{mode.icon}</span>
                        <div>
                          <p className={cn("font-semibold", form.studyMode === mode.id ? "text-neon-blue" : "text-white/80")}>{mode.label}</p>
                          <p className="text-white/40 text-xs mt-0.5">{mode.desc}</p>
                        </div>
                        {form.studyMode === mode.id && <Check size={16} className="text-neon-blue ml-auto flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Dream Colleges */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold">{STEPS[3].title}</h2>
                  <p className="text-white/40 text-sm mt-1">{STEPS[3].desc}</p>
                </div>

                <div className="grid gap-2 max-h-80 overflow-y-auto pr-1">
                  {COLLEGES.slice(0, 12).map((college) => (
                    <button key={college.name}
                      onClick={() => setForm({ ...form, dreamColleges: toggle(form.dreamColleges, college.name) })}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm border transition-all text-left",
                        form.dreamColleges.includes(college.name)
                          ? "bg-neon-blue/15 border-neon-blue/40 text-white"
                          : "bg-white/3 border-white/8 text-white/60 hover:border-white/15"
                      )}>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
                        college.tier === 1 ? "bg-yellow-400/20 text-yellow-400" : "bg-white/10 text-white/50"
                      )}>
                        {college.logo.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{college.name}</div>
                        <div className="text-xs text-white/30">Cutoff: {college.cutoff}+ percentile</div>
                      </div>
                      {form.dreamColleges.includes(college.name) && (
                        <Check size={14} className="text-neon-blue flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
                {form.dreamColleges.length > 0 && (
                  <p className="text-xs text-neon-blue">{form.dreamColleges.length} college(s) selected</p>
                )}
              </motion.div>
            )}

            {/* Step 5: AI Plan */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold">{STEPS[4].title}</h2>
                  <p className="text-white/40 text-sm mt-1">Here&apos;s what AI prepared for you</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: Target, title: "Daily Questions", value: form.studyHours === "7+ hours" ? "80" : form.studyHours === "5-6 hours" ? "60" : "40", color: "text-neon-blue", bg: "bg-neon-blue/10 border-neon-blue/20" },
                    { icon: BookOpen, title: "Weekly Mocks", value: "2 Full + 3 Sectional", color: "text-neon-purple", bg: "bg-neon-purple/10 border-neon-purple/20" },
                    { icon: Brain, title: "Focus Areas", value: form.weaknesses.slice(0, 2).join(", ") || "All sections", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
                    { icon: GraduationCap, title: "Target", value: `${form.targetPercentile}+ percentile`, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
                  ].map((item) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className={cn("p-4 rounded-xl border", item.bg)}
                    >
                      <item.icon size={20} className={cn("mb-2", item.color)} />
                      <p className="text-white/40 text-xs">{item.title}</p>
                      <p className={cn("font-bold text-sm mt-0.5", item.color)}>{item.value}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 border border-white/10">
                  <div className="flex items-start gap-3">
                    <Sparkles size={18} className="text-neon-blue mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-2 neon-text">Your AI Roadmap is Ready!</p>
                      <p className="text-xs text-white/50 leading-relaxed">
                        Based on your profile, AI has created a personalized study plan targeting{" "}
                        <strong className="text-neon-blue">{form.targetPercentile}+ percentile</strong>.
                        Your dashboard will show daily tasks, adaptive questions, and weekly milestones.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className={cn(
                "flex items-center gap-2 text-sm px-4 py-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all",
                step === 1 && "invisible"
              )}
            >
              <ArrowLeft size={16} /> Back
            </button>

            <span className="text-xs text-white/25">{step} / {STEPS.length}</span>

            {step < STEPS.length ? (
              <button
                onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}
                className="flex items-center gap-2 text-sm px-6 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-neon-blue to-neon-purple text-white hover:opacity-90 transition-all"
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleFinish}
                className="flex items-center gap-2 text-sm px-6 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-neon-blue to-neon-purple text-white hover:opacity-90 transition-all glow-blue"
              >
                Start Preparing <Zap size={16} />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
