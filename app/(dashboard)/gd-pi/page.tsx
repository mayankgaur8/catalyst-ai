"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  MessageSquare, FileText, Brain,
  ChevronRight, Star, Lightbulb, Clock, Users,
  Sparkles, ThumbsUp, ThumbsDown
} from "lucide-react";
import { cn } from "@/lib/utils";

const GD_TOPICS = [
  "Should IIMs be privatized?",
  "Climate change: Is India doing enough?",
  "Work from home — productivity boon or culture bane?",
  "Is social media making youth more or less informed?",
  "Should reservation in private sector be implemented?",
  "AI will replace 50% of jobs by 2030 — Agree or Disagree?",
];

const PI_QUESTIONS = [
  { q: "Walk me through your resume.", type: "HR" },
  { q: "Why MBA? Why now?", type: "HR" },
  { q: "Why IIM Ahmedabad specifically?", type: "HR" },
  { q: "What are your short-term and long-term goals?", type: "HR" },
  { q: "Tell me about a leadership experience.", type: "Behavioral" },
  { q: "What is your biggest weakness?", type: "Behavioral" },
  { q: "How do you handle conflict in a team?", type: "Behavioral" },
  { q: "Explain your graduation project/final year thesis.", type: "Academic" },
  { q: "Why is your graduation percentage low?", type: "Academic" },
];

const WAT_TOPICS = [
  "The future of democracy in the age of social media",
  "India's space program — pride or misplaced priority?",
  "Digital India — promise vs reality",
];

export default function GDPIPage() {
  const [activeTab, setActiveTab] = useState<"gd" | "pi" | "wat">("gd");
  const [gdTopic, setGdTopic] = useState<string | null>(null);
  const [piQuestion, setPIQuestion] = useState<typeof PI_QUESTIONS[0] | null>(null);
  const [watTopic, setWatTopic] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [aiFeedback, setAIFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getAIFeedback = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setAIFeedback("Strong opening with clear structure. Your argument flows well. However, consider adding 2-3 specific data points or examples to strengthen credibility. The conclusion is impactful but slightly long — aim for 2-3 crisp sentences. Overall: Good. Score: 7.5/10");
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">GD / PI / WAT Preparation</h1>
        <p className="text-white/40 mt-1 text-sm">AI-powered MBA interview and group discussion practice</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 glass rounded-2xl border border-white/5 w-fit">
        {[
          { key: "gd", label: "Group Discussion", icon: Users },
          { key: "pi", label: "PI Mock Interview", icon: MessageSquare },
          { key: "wat", label: "WAT Writing", icon: FileText },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key as typeof activeTab); setGdTopic(null); setPIQuestion(null); setWatTopic(null); setAnswer(""); setAIFeedback(null); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
              activeTab === tab.key ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30" : "text-white/40 hover:text-white"
            )}
          >
            <tab.icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* GD Tab */}
      {activeTab === "gd" && (
        <div className="space-y-4">
          {!gdTopic ? (
            <div>
              <h3 className="font-semibold mb-4 text-white/60">Select a GD Topic</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {GD_TOPICS.map((topic, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ x: 4 }}
                    onClick={() => setGdTopic(topic)}
                    className="text-left glass rounded-2xl p-5 border border-white/5 hover:border-neon-blue/30 hover:bg-neon-blue/5 transition-all"
                  >
                    <div className="text-xs text-white/30 mb-1">Topic {i + 1}</div>
                    <div className="font-medium">{topic}</div>
                    <div className="flex items-center gap-1 text-neon-blue text-xs mt-3">
                      Start Discussion <ChevronRight size={12} />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="glass rounded-2xl p-5 border border-neon-blue/20 bg-neon-blue/5">
                <div className="text-xs text-white/40 mb-1">Current GD Topic</div>
                <div className="text-lg font-semibold">{gdTopic}</div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Framework */}
                <div className="glass rounded-2xl p-5 border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain size={16} className="text-neon-purple" />
                    <h3 className="font-semibold text-sm">AI GD Framework</h3>
                  </div>
                  <div className="space-y-2 text-sm text-white/60">
                    <div className="flex items-start gap-2">
                      <span className="text-neon-blue font-bold w-5">1.</span>
                      <span><strong className="text-white">Opening:</strong> Start with a relevant stat or definition</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-neon-blue font-bold w-5">2.</span>
                      <span><strong className="text-white">For:</strong> 2 strong arguments with examples</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-neon-blue font-bold w-5">3.</span>
                      <span><strong className="text-white">Against:</strong> Acknowledge counterpoints</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-neon-blue font-bold w-5">4.</span>
                      <span><strong className="text-white">Solution:</strong> Balanced way forward</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-neon-blue font-bold w-5">5.</span>
                      <span><strong className="text-white">Close:</strong> Crisp summary or call to action</span>
                    </div>
                  </div>
                </div>

                {/* Points & Facts */}
                <div className="glass rounded-2xl p-5 border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb size={16} className="text-yellow-400" />
                    <h3 className="font-semibold text-sm">AI Research Points</h3>
                  </div>
                  <div className="space-y-2">
                    {[
                      "India ranks 101st in Global Hunger Index 2023",
                      "Social media penetration: 465M users in India",
                      "60% of Indians below 35 — youth democracy",
                      "Gig economy: 7.7M gig workers in India",
                    ].map((point, i) => (
                      <div key={i} className="text-xs text-white/60 flex items-start gap-2">
                        <Star size={10} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                        {point}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Practice input */}
              <div className="glass rounded-2xl p-5 border border-white/5">
                <h3 className="font-semibold text-sm mb-3">Practice Your Opening Statement</h3>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={`Write your opening statement for this GD topic...`}
                  rows={5}
                  className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-blue/40 resize-none mb-3"
                />
                <div className="flex gap-3">
                  <button
                    onClick={getAIFeedback}
                    disabled={!answer.trim() || loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl text-sm font-semibold disabled:opacity-40"
                  >
                    <Sparkles size={14} />
                    {loading ? "AI Analyzing..." : "Get AI Feedback"}
                  </button>
                  <button onClick={() => setGdTopic(null)} className="px-4 py-2.5 glass rounded-xl text-sm text-white/50 border border-white/8">
                    Change Topic
                  </button>
                </div>

                {aiFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-neon-blue/5 rounded-xl border border-neon-blue/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={16} className="text-neon-blue" />
                      <span className="text-sm font-semibold text-neon-blue">AI Feedback</span>
                    </div>
                    <p className="text-sm text-white/70">{aiFeedback}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <button className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-green-400"><ThumbsUp size={14} /></button>
                      <button className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-red-400"><ThumbsDown size={14} /></button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PI Tab */}
      {activeTab === "pi" && (
        <div className="space-y-4">
          {!piQuestion ? (
            <div>
              <h3 className="font-semibold mb-4 text-white/60">Select a PI Question to Practice</h3>
              <div className="space-y-2">
                {PI_QUESTIONS.map((q, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ x: 4 }}
                    onClick={() => setPIQuestion(q)}
                    className="w-full text-left glass rounded-xl p-4 border border-white/5 hover:border-neon-purple/30 hover:bg-neon-purple/5 transition-all flex items-center gap-4"
                  >
                    <span className={cn("text-xs px-2 py-0.5 rounded font-bold flex-shrink-0", {
                      "bg-blue-500/20 text-blue-400": q.type === "HR",
                      "bg-yellow-500/20 text-yellow-400": q.type === "Behavioral",
                      "bg-green-500/20 text-green-400": q.type === "Academic",
                    })}>
                      {q.type}
                    </span>
                    <span className="text-sm font-medium">{q.q}</span>
                    <ChevronRight size={16} className="text-white/20 ml-auto flex-shrink-0" />
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="glass rounded-2xl p-5 border border-neon-purple/20 bg-neon-purple/5">
                <div className="text-xs text-white/40 mb-1">PI Question</div>
                <div className="text-lg font-semibold">{piQuestion.q}</div>
              </div>

              <div className="glass rounded-2xl p-5 border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={16} className="text-neon-purple" />
                  <h3 className="font-semibold text-sm">STAR Method Framework</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {["Situation — Set the context", "Task — Your role/responsibility", "Action — What you did (focus here)", "Result — Quantified outcome"].map((s, i) => (
                    <div key={i} className="p-3 bg-white/3 rounded-xl border border-white/5">
                      <span className="text-neon-purple font-bold">{s.split("—")[0]}</span>
                      <br />
                      <span className="text-xs text-white/40">{s.split("—")[1]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-5 border border-white/5">
                <h3 className="font-semibold text-sm mb-3">Your Answer</h3>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Write your answer here using the STAR method..."
                  rows={6}
                  className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-purple/40 resize-none mb-3"
                />
                <div className="flex gap-3">
                  <button
                    onClick={getAIFeedback}
                    disabled={!answer.trim() || loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-neon-purple to-neon-blue rounded-xl text-sm font-semibold disabled:opacity-40"
                  >
                    <Sparkles size={14} />
                    {loading ? "Analyzing..." : "AI Feedback"}
                  </button>
                  <button onClick={() => { setPIQuestion(null); setAnswer(""); setAIFeedback(null); }} className="px-4 py-2.5 glass rounded-xl text-sm text-white/50 border border-white/8">
                    Next Question
                  </button>
                </div>
                {aiFeedback && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-4 bg-neon-purple/5 rounded-xl border border-neon-purple/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={16} className="text-neon-purple" />
                      <span className="text-sm font-semibold text-neon-purple">AI Feedback</span>
                    </div>
                    <p className="text-sm text-white/70">{aiFeedback}</p>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* WAT Tab */}
      {activeTab === "wat" && (
        <div className="space-y-4">
          <h3 className="font-semibold text-white/60 mb-2">WAT — Written Ability Test</h3>
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            {WAT_TOPICS.map((topic, i) => (
              <button
                key={i}
                onClick={() => setWatTopic(topic)}
                className={cn(
                  "text-left glass rounded-xl p-4 border transition-all",
                  watTopic === topic ? "border-neon-blue/30 bg-neon-blue/8" : "border-white/5 hover:border-neon-blue/20"
                )}
              >
                <div className="text-xs text-white/30 mb-1">Topic {i + 1}</div>
                <div className="text-sm font-medium">{topic}</div>
              </button>
            ))}
          </div>

          {watTopic && (
            <div className="glass rounded-2xl p-5 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Write your WAT essay (200-250 words)</h3>
                <div className="flex items-center gap-2 text-xs text-white/30">
                  <Clock size={12} /> 20 min limit
                </div>
              </div>
              <div className="text-sm text-neon-blue font-medium mb-3 p-3 bg-neon-blue/8 rounded-xl border border-neon-blue/15">
                &quot;{watTopic}&quot;
              </div>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write your essay here..."
                rows={10}
                className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-blue/40 resize-none mb-2"
              />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/30">{answer.split(/\s+/).filter(Boolean).length} words</span>
                <span className="text-xs text-white/30">Target: 200-250 words</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={getAIFeedback}
                  disabled={!answer.trim() || loading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl text-sm font-semibold disabled:opacity-40"
                >
                  <Sparkles size={14} />
                  {loading ? "Grading..." : "AI Grade & Feedback"}
                </button>
              </div>
              {aiFeedback && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-neon-blue/5 rounded-xl border border-neon-blue/20">
                  <p className="text-sm font-semibold text-neon-blue mb-2">AI Evaluation</p>
                  <p className="text-sm text-white/70">{aiFeedback}</p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
