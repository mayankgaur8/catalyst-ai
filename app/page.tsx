"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Zap, Brain, Target, Trophy, Star, ArrowRight,
  BarChart2, Video, MessageSquare, Sparkles, Play
} from "lucide-react";
import { EXAM_DETAILS } from "@/lib/data";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Brain, title: "AI Doubt Solver", desc: "Get step-by-step solutions with CAT shortcuts for any doubt in seconds.", color: "from-neon-blue/20 to-neon-purple/10" },
  { icon: Target, title: "Adaptive Mocks", desc: "Full CAT simulations with real-time percentile prediction and AI analysis.", color: "from-neon-purple/20 to-pink-500/10" },
  { icon: BarChart2, title: "Percentile Predictor", desc: "ML model trained on 5 years of CAT data predicts your exact percentile.", color: "from-green-500/20 to-teal-500/10" },
  { icon: Trophy, title: "Gamification", desc: "XP, badges, streaks and leaderboards keep you motivated every single day.", color: "from-yellow-500/20 to-orange-500/10" },
  { icon: Video, title: "Video Learning", desc: "Premium lectures by top faculty with AI summaries and auto-quizzes.", color: "from-blue-500/20 to-cyan-500/10" },
  { icon: MessageSquare, title: "GD/PI Prep", desc: "AI mock interviews, WAT feedback, and MBA SOP builder for final conversions.", color: "from-rose-500/20 to-orange-500/10" },
];

const STATS = [
  { value: "50,000+", label: "Active Aspirants" },
  { value: "99.8%", label: "Highest Percentile" },
  { value: "500+", label: "IIM Selections" },
  { value: "2M+", label: "Questions Solved" },
];

const TESTIMONIALS = [
  { name: "Priya Sharma", college: "IIM Ahmedabad", percentile: 99.8, quote: "CATalyst's AI study plan was a game-changer. The adaptive mocks were spot-on with actual CAT difficulty.", year: "CAT 2023" },
  { name: "Rahul Kumar", college: "IIM Bangalore", percentile: 99.3, quote: "The DILR practice sets and AI explanations helped me crack my weak section. From 65 to 97 percentile in DILR!", year: "CAT 2023" },
  { name: "Ananya Patel", college: "FMS Delhi", percentile: 99.1, quote: "The daily streak system kept me consistent. I never missed a single day of preparation thanks to gamification.", year: "CAT 2023" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-dark-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center glow-blue">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold neon-text">CATalyst AI</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-white/50">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#exams" className="hover:text-white transition-colors">Exams</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/success-stories" className="hover:text-white transition-colors">Success Stories</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-white/50 hover:text-white px-4 py-2 rounded-xl hover:bg-white/5 transition-all">
            Login
          </Link>
          <Link href="/register">
            <button className="text-sm px-5 py-2.5 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl font-semibold hover:opacity-90 transition-all glow-blue">
              Start Free →
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-purple/8 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-neon-blue/3 rounded-full blur-2xl" />
        </div>

        <div className="relative text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full border border-neon-blue/20 text-sm text-neon-blue mb-8"
          >
            <Sparkles size={14} />
            India&apos;s #1 AI-Powered MBA Preparation Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold leading-tight mb-6"
          >
            Crack CAT with{" "}
            <span className="neon-text">AI as your</span>
            <br />
            <span className="neon-text">Personal Mentor</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            AI-powered study plans, adaptive mocks, instant doubt solving, percentile prediction, and gamification — everything you need to secure your dream MBA.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-gradient-to-r from-neon-blue to-neon-purple rounded-2xl font-bold text-lg flex items-center gap-3 glow-blue hover:opacity-95 transition-all"
              >
                <Zap size={20} />
                Start Free Preparation
                <ArrowRight size={18} />
              </motion.button>
            </Link>
            <Link href="/dashboard">
              <button className="px-8 py-4 glass rounded-2xl font-semibold text-lg flex items-center gap-2 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all">
                <Play size={18} />
                View Demo Dashboard
              </button>
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-6 mt-12 text-sm text-white/30"
          >
            <div className="flex -space-x-2">
              {["P", "R", "A", "V", "S"].map((l, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-xs font-bold border-2 border-dark-900">
                  {l}
                </div>
              ))}
            </div>
            <span>Joined by <strong className="text-white">50,000+</strong> CAT aspirants</span>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center glass rounded-2xl p-6 border border-white/5"
            >
              <div className="text-3xl font-bold neon-text mb-1">{stat.value}</div>
              <div className="text-sm text-white/40">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Everything you need to crack CAT</h2>
            <p className="text-white/40 max-w-xl mx-auto">One platform. Complete preparation. AI-powered from day 1 to the final result.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className={cn("glass rounded-2xl p-6 border border-white/5 card-hover bg-gradient-to-br", feature.color)}
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                  <feature.icon size={20} className="text-neon-blue" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Exams */}
      <section id="exams" className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Prepare for all MBA Entrance Exams</h2>
            <p className="text-white/40">One platform covering 10+ MBA entrance exams</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXAM_DETAILS.map((exam, i) => (
              <motion.div
                key={exam.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-5 border border-white/5 card-hover"
              >
                <div className={cn("inline-block text-lg font-black px-3 py-1 rounded-xl bg-gradient-to-r text-white mb-3", exam.color)}>
                  {exam.name}
                </div>
                <h3 className="font-semibold mb-1">{exam.fullName}</h3>
                <p className="text-xs text-white/30 mb-3">by {exam.conductedBy}</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-white/50">
                  <div><span className="text-white/30">Duration:</span> {exam.duration}</div>
                  <div><span className="text-white/30">Questions:</span> {exam.questions}</div>
                  <div className="col-span-2"><span className="text-white/30">Colleges:</span> {exam.colleges}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Success Stories</h2>
            <p className="text-white/40">Real students. Real results. Real IIM admits.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-6 border border-white/8"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} size={14} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-5 italic">&quot;{t.quote}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-neon-blue">{t.college}</div>
                    <div className="text-xs text-white/30">{t.percentile} percentile • {t.year}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden glass rounded-3xl p-12 border border-neon-blue/20"
            style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(177,74,237,0.05))" }}
          >
            <div className="absolute top-0 left-0 w-full h-full bg-noise opacity-30" />
            <div className="relative">
              <div className="text-5xl mb-4">🎓</div>
              <h2 className="text-4xl font-bold mb-4">
                Your MBA success story<br />
                <span className="neon-text">starts today.</span>
              </h2>
              <p className="text-white/50 mb-8 max-w-xl mx-auto">
                Join 50,000+ aspirants using AI to crack CAT. Free to start. No credit card required.
              </p>
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-10 py-4 bg-gradient-to-r from-neon-blue to-neon-purple rounded-2xl font-bold text-lg glow-blue hover:opacity-95 transition-all"
                >
                  Start Your Journey — It&apos;s Free ✨
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold neon-text">CATalyst AI</span>
          </div>
          <p className="text-white/20 text-sm">© 2024 CATalyst AI. Built for CAT aspirants, by toppers.</p>
          <div className="flex gap-4 text-xs text-white/30">
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
