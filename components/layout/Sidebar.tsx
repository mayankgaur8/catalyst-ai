"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, FileText, Brain,
  Trophy, Calendar, Video, Settings, ChevronLeft,
  Zap, Target, MessageSquare, Star, Crown,
  BarChart2, Flame, X, LogOut, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { canAccess } from "@/lib/features";
import { PLAN_BADGE_COLORS } from "@/lib/features";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "main", feature: null },
  { name: "Practice", href: "/practice", icon: BookOpen, section: "main", feature: "PRACTICE_BASIC" },
  { name: "Mock Tests", href: "/mock-tests", icon: FileText, section: "main", feature: "MOCK_BASIC" },
  { name: "AI Doubt Solver", href: "/ai-doubt-solver", icon: Brain, section: "ai", feature: "AI_DOUBT_SOLVER" },
  { name: "Study Planner", href: "/study-planner", icon: Calendar, section: "ai", feature: "STUDY_PLANNER" },
  { name: "Video Lessons", href: "/videos", icon: Video, section: "learn", feature: "VIDEO_LIBRARY" },
  { name: "GD / PI / WAT", href: "/gd-pi", icon: MessageSquare, section: "learn", feature: "GD_PI_PREP" },
  { name: "College Predictor", href: "/college-predictor", icon: Target, section: "tools", feature: "COLLEGE_PREDICTOR" },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy, section: "tools", feature: "LEADERBOARD_VIEW" },
  { name: "Analytics", href: "/dashboard", icon: BarChart2, section: "tools", feature: "ANALYTICS_DEEP" },
  { name: "Settings", href: "/settings", icon: Settings, section: "account", feature: null },
] as const;

const SECTION_LABELS: Record<string, string> = {
  main: "Core",
  ai: "AI Features",
  learn: "Learning",
  tools: "Tools",
  account: "Account",
};

const PLAN_LABELS = { free: "Free", pro: "Pro", elite: "Elite" };

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, plan, logout } = useAuthStore();

  const activePlan = plan ?? "free";
  const sections = Array.from(new Set(NAV_ITEMS.map((n) => n.section)));

  const xpForLevel = 500 * Math.pow(2, (user?.level ?? 1) - 1);
  const xpInLevel = (user?.xp ?? 0) % xpForLevel;
  const xpPercent = Math.min(100, (xpInLevel / xpForLevel) * 100);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 h-screen z-50 flex flex-col",
          "bg-dark-800 border-r border-white/5",
          "lg:translate-x-0 transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-white/5 flex-shrink-0">
          <motion.div animate={{ justifyContent: collapsed ? "center" : "flex-start" }} className="flex items-center gap-3 w-full">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center flex-shrink-0 glow-blue">
              <Zap size={16} className="text-white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-bold text-lg neon-text whitespace-nowrap overflow-hidden"
                >
                  CATalyst AI
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
          <button onClick={onClose} className="lg:hidden ml-auto text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* User Quick Stats */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-3 mt-3 p-3 glass rounded-xl overflow-hidden flex-shrink-0"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {user?.name?.[0] ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name ?? "User"}</p>
                  <span className={cn(
                    "inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border capitalize",
                    PLAN_BADGE_COLORS[activePlan]
                  )}>
                    {activePlan === "elite" && <Crown size={9} />}
                    {PLAN_LABELS[activePlan]}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/50">
                <span className="flex items-center gap-1">
                  <Flame size={12} className="text-orange-400" /> {user?.streak ?? 0}d streak
                </span>
                <span className="flex items-center gap-1">
                  <Star size={12} className="text-yellow-400" /> {(user?.xp ?? 0).toLocaleString()} XP
                </span>
              </div>
              <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-neon-blue to-neon-purple rounded-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {sections.map((section) => (
            <div key={section}>
              <AnimatePresence>
                {!collapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 py-1 text-xs font-semibold text-white/25 uppercase tracking-wider"
                  >
                    {SECTION_LABELS[section]}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="space-y-0.5">
                {NAV_ITEMS.filter((n) => n.section === section).map((item) => {
                  const isActive = pathname === item.href;
                  const isLocked = item.feature !== null && !canAccess(activePlan, item.feature as Parameters<typeof canAccess>[1]);

                  return (
                    <Link
                      key={item.href}
                      href={isLocked ? "/plan-selection" : item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group relative",
                        isActive && !isLocked
                          ? "bg-gradient-to-r from-neon-blue/20 to-neon-purple/10 text-white border border-neon-blue/20"
                          : isLocked
                          ? "text-white/25 cursor-pointer hover:text-white/40"
                          : "text-white/50 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {isActive && !isLocked && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-transparent rounded-xl"
                        />
                      )}
                      <item.icon
                        size={18}
                        className={cn(
                          "flex-shrink-0 transition-colors",
                          isLocked ? "text-white/20" : isActive ? "text-neon-blue" : "group-hover:text-white"
                        )}
                      />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="overflow-hidden whitespace-nowrap flex-1"
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {!collapsed && isLocked && <Lock size={11} className="text-white/20 flex-shrink-0" />}
                      {collapsed && (
                        <div className="absolute left-full ml-3 px-2 py-1 bg-dark-600 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-white/10 flex items-center gap-1">
                          {item.name}
                          {isLocked && <Lock size={10} className="text-white/40" />}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Subscription badge / upgrade CTA */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-3 mb-2 flex-shrink-0"
            >
              {activePlan === "free" && (
                <Link href="/plan-selection">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-neon-blue/15 to-neon-purple/10 border border-neon-blue/20 cursor-pointer hover:border-neon-blue/40 transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={14} className="text-neon-blue" />
                      <span className="text-xs font-semibold text-neon-blue">Free Plan</span>
                    </div>
                    <p className="text-xs text-white/40 mb-2">Unlock AI Doubt Solver, unlimited mocks & more.</p>
                    <div className="w-full py-1.5 text-xs font-semibold bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg text-white text-center">
                      Upgrade to Pro →
                    </div>
                  </div>
                </Link>
              )}
              {activePlan === "pro" && (
                <Link href="/plan-selection">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-neon-purple/15 to-pink-500/10 border border-neon-purple/20 cursor-pointer hover:border-neon-purple/40 transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <Crown size={14} className="text-yellow-400" />
                      <span className="text-xs font-semibold text-yellow-400">Pro Member</span>
                    </div>
                    <p className="text-xs text-white/40 mb-2">Unlock AI mentor, voice tutor & mock interviews.</p>
                    <div className="w-full py-1.5 text-xs font-semibold bg-gradient-to-r from-neon-purple to-pink-600 rounded-lg text-white text-center">
                      Upgrade to Elite →
                    </div>
                  </div>
                </Link>
              )}
              {activePlan === "elite" && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-400/10 to-orange-400/5 border border-yellow-400/20">
                  <div className="flex items-center gap-2">
                    <Crown size={14} className="text-yellow-400" />
                    <span className="text-xs font-semibold text-yellow-400">Elite Member</span>
                    <span className="text-lg ml-auto">👑</span>
                  </div>
                  <p className="text-xs text-white/30 mt-1">All features unlocked. You&apos;re on the best plan!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logout button */}
        <div className="border-t border-white/5 flex-shrink-0">
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:text-red-400 hover:bg-red-400/5 transition-all text-sm",
              collapsed && "justify-center"
            )}
          >
            <LogOut size={16} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Collapse button */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center h-10 border-t border-white/5 text-white/30 hover:text-white transition-colors flex-shrink-0"
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronLeft size={16} />
          </motion.div>
        </button>
      </motion.aside>
    </>
  );
}
