"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Zap, Star, ArrowRight, Quote, TrendingUp } from "lucide-react";

const STORIES = [
  {
    name: "Priya Sharma",
    from: "B.Tech CS, Tier-2 College",
    to: "IIM Ahmedabad, PGP 2024",
    percentile: 99.8,
    attempts: 1,
    quote: "I was a working professional with just 3 hours daily. CATalyst's AI plan made every minute count. The DILR practice sets were exactly like actual CAT. I went from 78 to 99.8 percentile in 8 months.",
    journey: ["Started: 78%ile in first diagnostic", "Month 3: 89%ile in mock", "Month 6: 95%ile consistently", "CAT 2023: 99.8%ile"],
    strategy: "Focused on DILR first (weakest), then maintained QA and VARC momentum",
    image: "P",
    color: "from-yellow-400 to-orange-400",
  },
  {
    name: "Rahul Kumar",
    from: "B.Com, Working Professional",
    to: "IIM Bangalore, PGPM 2024",
    percentile: 99.3,
    attempts: 2,
    quote: "First attempt: 91 percentile, not enough. Used CATalyst for the second attempt. The AI doubt solver saved me 3 hours per day. I solved more questions in 4 months than in 12 months before.",
    journey: ["Attempt 1: 91%ile (fell short)", "Month 2: AI rebuilt study plan", "Month 4: Consistent 97+ in mocks", "Attempt 2: 99.3%ile"],
    strategy: "Mock analysis was the key. Solved every mistake before moving forward.",
    image: "R",
    color: "from-neon-blue to-cyan-400",
  },
  {
    name: "Sneha Patel",
    from: "CA Dropout, 1 year gap",
    to: "FMS Delhi, MBA 2024",
    percentile: 99.1,
    attempts: 1,
    quote: "People said a CA dropout with a gap year can't crack CAT. CATalyst's AI built a custom plan ignoring my gaps. The daily streak kept me going even on bad days. 99.1 — I proved everyone wrong.",
    journey: ["Started from scratch", "Month 2: 82%ile baseline", "Month 5: 94%ile mock average", "CAT 2023: 99.1%ile"],
    strategy: "Consistency > Intensity. Never missed a single daily session for 7 months.",
    image: "S",
    color: "from-neon-purple to-pink-400",
  },
];

export default function SuccessStoriesPage() {
  return (
    <div className="min-h-screen bg-dark-900 animated-bg">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold neon-text">CATalyst AI</span>
        </Link>
        <Link href="/(auth)/onboarding">
          <button className="text-sm px-5 py-2.5 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl font-semibold">
            Start Free →
          </button>
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            From <span className="text-white/40">aspirant</span> to{" "}
            <span className="neon-text">IIM admit</span>
          </h1>
          <p className="text-white/40 text-lg">Real journeys. Real struggles. Real success stories.</p>
        </motion.div>

        <div className="space-y-12">
          {STORIES.map((story, i) => (
            <motion.div
              key={story.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="glass rounded-3xl p-8 border border-white/8"
            >
              <div className="grid md:grid-cols-3 gap-8">
                {/* Left: Person */}
                <div>
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${story.color} flex items-center justify-center text-3xl font-bold mb-4`}>
                    {story.image}
                  </div>
                  <h3 className="text-xl font-bold">{story.name}</h3>
                  <div className="text-sm text-white/40 mt-1">{story.from}</div>
                  <div className="flex items-center gap-1 text-neon-blue text-sm font-semibold mt-2">
                    <ArrowRight size={14} />
                    {story.to}
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-center">
                    <div className="text-3xl font-bold text-yellow-400">{story.percentile}</div>
                    <div className="text-xs text-white/40 mt-0.5">CAT Percentile</div>
                  </div>

                  <div className="mt-3 text-xs text-white/30">
                    Attempts: {story.attempts} • {story.attempts === 1 ? "First attempt!" : "Cracked it!"}
                  </div>
                </div>

                {/* Center: Quote + Journey */}
                <div className="md:col-span-2">
                  <div className="relative mb-6">
                    <Quote size={24} className="text-neon-blue/30 mb-2" />
                    <p className="text-white/70 leading-relaxed italic">&quot;{story.quote}&quot;</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">The Journey</h4>
                      <div className="space-y-2">
                        {story.journey.map((step, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br ${story.color} flex-shrink-0`}>
                              {j + 1}
                            </div>
                            <span className="text-sm text-white/60">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-white/3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={14} className="text-neon-blue" />
                        <span className="text-xs font-semibold text-white/50">Winning Strategy</span>
                      </div>
                      <p className="text-sm text-white/60 italic">&quot;{story.strategy}&quot;</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center glass rounded-3xl p-12 border border-neon-blue/20"
          style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(177,74,237,0.05))" }}
        >
          <h2 className="text-3xl font-bold mb-4">Ready to write YOUR success story?</h2>
          <p className="text-white/40 mb-8">Your IIM journey starts with a single decision. Make it today.</p>
          <Link href="/(auth)/onboarding">
            <button className="px-8 py-4 bg-gradient-to-r from-neon-blue to-neon-purple rounded-2xl font-bold text-lg glow-blue hover:opacity-90 transition-all">
              Start Your CAT Journey — Free ✨
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
