"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  GraduationCap, TrendingUp, Target, Check, X, Star,
  ChevronDown, Info, Sparkles, Building2, Award, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COLLEGES } from "@/lib/utils";

export default function CollegePredictorPage() {
  const [percentile, setPercentile] = useState(90);
  const [category, setCategory] = useState("General");
  const [gender, setGender] = useState("Male");
  const [workExp, setWorkExp] = useState(0);
  const [academics, setAcademics] = useState({ x: 85, xii: 80, grad: 75 });
  const [showResults, setShowResults] = useState(false);

  const categories = ["General", "OBC", "SC", "ST", "EWS"];
  const genders = ["Male", "Female", "Transgender"];

  const getCategoryBonus = () => {
    switch (category) {
      case "OBC": return 2;
      case "SC": case "ST": return 5;
      case "EWS": return 2;
      default: return 0;
    }
  };

  const getGenderBonus = () => gender === "Female" ? 1 : 0;
  const getWorkExpBonus = () => Math.min(workExp, 3) * 0.5;

  const effectivePercentile = percentile + getCategoryBonus() + getGenderBonus() + getWorkExpBonus();

  const getChance = (cutoff: number) => {
    const diff = effectivePercentile - cutoff;
    if (diff >= 2) return "high";
    if (diff >= 0) return "moderate";
    if (diff >= -2) return "low";
    return "unlikely";
  };

  const chanceConfig = {
    high: { label: "High Chance", color: "text-green-400", bg: "bg-green-500/15 border-green-500/30", icon: Check },
    moderate: { label: "Moderate", color: "text-yellow-400", bg: "bg-yellow-500/15 border-yellow-500/30", icon: Star },
    low: { label: "Low Chance", color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/30", icon: TrendingUp },
    unlikely: { label: "Unlikely", color: "text-red-400", bg: "bg-red-500/15 border-red-500/20", icon: X },
  };

  const predictedColleges = COLLEGES.map((c) => ({
    ...c,
    chance: getChance(c.cutoff),
    effectiveCutoff: c.cutoff - getCategoryBonus() - getGenderBonus(),
  })).sort((a, b) => {
    const order = { high: 0, moderate: 1, low: 2, unlikely: 3 };
    return order[a.chance as keyof typeof order] - order[b.chance as keyof typeof order];
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MBA College Predictor</h1>
        <p className="text-white/40 mt-1 text-sm">AI-powered admission chance prediction based on your profile</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-2xl p-5 border border-white/8 space-y-5">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles size={16} className="text-neon-blue" />
              Your Profile
            </h3>

            {/* Percentile */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs text-white/40 uppercase tracking-wider">CAT Percentile</label>
                <span className="text-neon-blue font-bold text-lg">{percentile}</span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                step={0.5}
                value={percentile}
                onChange={(e) => setPercentile(Number(e.target.value))}
                className="w-full h-2 accent-cyan-400"
              />
              <div className="flex justify-between text-xs text-white/20 mt-1">
                <span>50</span><span>75</span><span>90</span><span>99</span><span>100</span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-lg border transition-all",
                      category === c ? "bg-neon-blue/20 border-neon-blue/30 text-neon-blue" : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Gender</label>
              <div className="flex gap-2">
                {genders.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-lg border transition-all flex-1",
                      gender === g ? "bg-neon-purple/20 border-neon-purple/30 text-neon-purple" : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Work Experience */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs text-white/40 uppercase tracking-wider">Work Experience</label>
                <span className="text-white/60 text-sm font-medium">{workExp} {workExp === 1 ? "year" : "years"}</span>
              </div>
              <input
                type="range"
                min={0}
                max={6}
                value={workExp}
                onChange={(e) => setWorkExp(Number(e.target.value))}
                className="w-full h-2 accent-purple-400"
              />
            </div>

            {/* Academics */}
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">Academic Scores (%)</label>
              <div className="space-y-2">
                {[
                  { label: "Class X", key: "x" as const },
                  { label: "Class XII", key: "xii" as const },
                  { label: "Graduation", key: "grad" as const },
                ].map((a) => (
                  <div key={a.key} className="flex items-center gap-3">
                    <span className="text-xs text-white/40 w-20">{a.label}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={academics[a.key]}
                      onChange={(e) => setAcademics({ ...academics, [a.key]: Number(e.target.value) })}
                      className="flex-1 px-3 py-1.5 bg-white/5 border border-white/8 rounded-lg text-sm text-white focus:outline-none focus:border-neon-blue/40"
                    />
                    <span className="text-xs text-white/30">%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Effective Percentile */}
            <div className="p-3 bg-neon-blue/8 rounded-xl border border-neon-blue/20">
              <p className="text-xs text-white/40 mb-1">Effective Percentile (after adjustments)</p>
              <div className="text-2xl font-bold text-neon-blue">{Math.min(100, effectivePercentile).toFixed(1)}</div>
              {effectivePercentile > percentile && (
                <p className="text-xs text-green-400 mt-1">+{(effectivePercentile - percentile).toFixed(1)} from category/gender bonus</p>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowResults(true)}
              className="w-full py-3 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            >
              <Sparkles size={16} /> Predict My Colleges
            </motion.button>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {!showResults ? (
            <div className="glass rounded-2xl p-12 border border-white/5 text-center">
              <GraduationCap size={64} className="mx-auto text-white/10 mb-4" />
              <h3 className="text-xl font-semibold text-white/40 mb-2">Enter your profile</h3>
              <p className="text-white/20 text-sm">Fill in your details and click &quot;Predict My Colleges&quot; to see your admission chances</p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Admission Predictions</h3>
                  <div className="flex items-center gap-4 text-xs text-white/30">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400" /> High</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400" /> Moderate</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400" /> Low</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400" /> Unlikely</span>
                  </div>
                </div>

                {predictedColleges.map((college, i) => {
                  const config = chanceConfig[college.chance as keyof typeof chanceConfig];
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={college.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn("flex items-center gap-4 p-4 rounded-xl border transition-all", config.bg)}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0",
                        college.tier === 1 ? "bg-yellow-400/20 text-yellow-400" : "bg-white/10 text-white/50"
                      )}>
                        {college.logo.slice(0, 3)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{college.name}</span>
                          {college.tier === 1 && <Star size={12} className="text-yellow-400 flex-shrink-0" />}
                        </div>
                        <div className="text-xs text-white/30 mt-0.5">
                          Your effective percentile: {Math.min(100, effectivePercentile).toFixed(1)} | Cutoff: {college.cutoff}+
                        </div>
                      </div>
                      <div className={cn("flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg", config.color, "bg-black/20")}>
                        <Icon size={12} />
                        {config.label}
                      </div>
                    </motion.div>
                  );
                })}

                <div className="p-4 bg-neon-blue/5 rounded-xl border border-neon-blue/15">
                  <div className="flex items-start gap-3">
                    <Info size={16} className="text-neon-blue flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-white/50">
                      These predictions are based on historical cutoff data and your profile. Actual selection depends on WAT-PI performance, work experience, and final CAT scores. Keep preparing!
                    </p>
                  </div>
                </div>
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
