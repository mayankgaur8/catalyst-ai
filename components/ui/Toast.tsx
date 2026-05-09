"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Zap } from "lucide-react";
import { useToastStore, ToastType } from "@/lib/toast";
import { cn } from "@/lib/utils";

const CONFIGS: Record<ToastType, { bg: string; textColor: string; label?: string }> = {
  success:     { bg: "bg-green-500/20 border-green-500/30",     textColor: "text-green-400" },
  error:       { bg: "bg-red-500/20 border-red-500/30",         textColor: "text-red-400" },
  info:        { bg: "bg-neon-blue/20 border-neon-blue/30",     textColor: "text-neon-blue" },
  warning:     { bg: "bg-yellow-500/20 border-yellow-500/30",   textColor: "text-yellow-400" },
  xp:          { bg: "bg-yellow-400/15 border-yellow-400/30",   textColor: "text-yellow-400",   label: "XP Earned" },
  achievement: { bg: "bg-neon-purple/20 border-neon-purple/30", textColor: "text-neon-purple",  label: "Achievement Unlocked!" },
  streak:      { bg: "bg-orange-500/20 border-orange-500/30",   textColor: "text-orange-400",   label: "Streak!" },
};

function ToastIcon({ type, icon }: { type: ToastType; icon?: string }) {
  if (icon) return <span className="text-xl flex-shrink-0">{icon}</span>;
  if (type === "xp") return <Zap size={18} className="text-yellow-400 flex-shrink-0" />;
  if (type === "success") return <CheckCircle size={18} className="text-green-400 flex-shrink-0" />;
  if (type === "error") return <AlertCircle size={18} className="text-red-400 flex-shrink-0" />;
  if (type === "warning") return <AlertTriangle size={18} className="text-yellow-400 flex-shrink-0" />;
  if (type === "info") return <Info size={18} className="text-neon-blue flex-shrink-0" />;
  return null;
}

export default function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const cfg = CONFIGS[t.type];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className={cn(
                "glass-strong rounded-2xl px-4 py-3 border flex items-start gap-3",
                "pointer-events-auto shadow-lg",
                cfg.bg
              )}
            >
              <ToastIcon type={t.type} icon={t.icon} />

              <div className="flex-1 min-w-0">
                {cfg.label && (
                  <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-70", cfg.textColor)}>
                    {cfg.label}
                  </p>
                )}
                <p className={cn("text-sm font-semibold leading-snug", cfg.textColor)}>
                  {t.type === "xp" && t.xpAmount ? `+${t.xpAmount} XP` : t.message}
                </p>
                {t.type === "xp" && t.message && (
                  <p className="text-xs text-white/40 mt-0.5">{t.message}</p>
                )}
              </div>

              <button
                onClick={() => dismiss(t.id)}
                className="text-white/30 hover:text-white/70 flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-all mt-0.5"
              >
                <X size={13} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
