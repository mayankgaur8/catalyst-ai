"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";
import { playSound } from "@/lib/sounds";

export default function AchievementPopup() {
  const { newlyUnlocked, clearNewlyUnlocked } = useGameStore();
  const { updateXP, soundEnabled } = useAuthStore();

  useEffect(() => {
    if (!newlyUnlocked) return;
    updateXP(newlyUnlocked.xpReward);
    playSound("achievement", soundEnabled);
    const timer = setTimeout(clearNewlyUnlocked, 5500);
    return () => clearTimeout(timer);
  }, [newlyUnlocked]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {newlyUnlocked && (
        <>
          {/* Backdrop pulse */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, rgba(177,74,237,0.12) 0%, transparent 70%)" }}
          />

          {/* Achievement card */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="fixed bottom-28 lg:bottom-8 left-1/2 -translate-x-1/2 z-[160] pointer-events-none"
          >
            <div className="glass-strong rounded-3xl px-8 py-6 border border-neon-purple/50 text-center max-w-[280px] shadow-2xl"
              style={{ boxShadow: "0 0 40px rgba(177,74,237,0.3)" }}>

              {/* Confetti emoji burst */}
              <motion.div
                animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.3, 1.1, 1.2, 1] }}
                transition={{ duration: 0.7 }}
                className="text-5xl mb-3"
              >
                {newlyUnlocked.icon}
              </motion.div>

              <p className="text-[10px] font-black text-neon-purple uppercase tracking-widest mb-1">
                Achievement Unlocked!
              </p>
              <p className="text-lg font-bold text-white">{newlyUnlocked.title}</p>
              <p className="text-sm text-white/50 mt-1">{newlyUnlocked.description}</p>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.35, type: "spring" }}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-yellow-400/20 border border-yellow-400/30"
              >
                <span className="text-yellow-400 font-bold text-sm">+{newlyUnlocked.xpReward} XP</span>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
