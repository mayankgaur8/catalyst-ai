"use client";

import { Menu, Bell, Search, Zap, ChevronDown, LogOut, Settings, User, Crown } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PLAN_BADGE_COLORS } from "@/lib/features";

interface NavbarProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

const NOTIFICATIONS = [
  { id: 1, text: "Your mock test analysis is ready!", time: "2m ago", dot: "bg-neon-blue" },
  { id: 2, text: "You're on a streak! Keep going!", time: "1h ago", dot: "bg-orange-400" },
  { id: 3, text: "New RC passage added: Economics", time: "3h ago", dot: "bg-green-400" },
  { id: 4, text: "AI Study Plan updated for this week", time: "Yesterday", dot: "bg-neon-purple" },
];

export default function Navbar({ onMenuClick, sidebarCollapsed }: NavbarProps) {
  const router = useRouter();
  const { user, plan, logout } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const activePlan = plan ?? "free";

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function handleLogout() {
    setShowUserMenu(false);
    logout();
    router.push("/");
  }

  return (
    <header
      className="fixed top-0 right-0 h-16 z-30 flex items-center px-4 gap-4 border-b border-white/5 bg-dark-800/80 backdrop-blur-xl"
      style={{ left: sidebarCollapsed ? 72 : 260, transition: "left 0.3s ease" }}
    >
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/5"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search topics, questions, videos..."
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/8 rounded-xl text-sm text-white/70 placeholder:text-white/25 focus:outline-none focus:border-neon-blue/40 focus:bg-white/8 transition-all"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        {/* XP Display */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 glass rounded-xl border border-white/5">
          <Zap size={14} className="text-yellow-400" />
          <span className="text-sm font-semibold text-yellow-400">{(user?.xp ?? 0).toLocaleString()}</span>
          <span className="text-xs text-white/30">XP</span>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            className="relative p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-neon-blue rounded-full" />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 glass-strong rounded-2xl border border-white/10 shadow-card overflow-hidden z-50"
              >
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  <button className="text-xs text-neon-blue hover:text-neon-blue/70">Mark all read</button>
                </div>
                <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
                  {NOTIFICATIONS.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-white/5 cursor-pointer transition-colors flex items-start gap-3">
                      <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", n.dot)} />
                      <div>
                        <p className="text-sm text-white/80">{n.text}</p>
                        <p className="text-xs text-white/30 mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-1.5 rounded-xl transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.name?.[0] ?? "?"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium leading-none">{user?.name?.split(" ")[0] ?? "User"}</p>
              <p className={cn("text-xs mt-0.5 capitalize font-medium", PLAN_BADGE_COLORS[activePlan].split(" ")[0])}>
                {activePlan === "elite" && "👑 "}{activePlan}
              </p>
            </div>
            <ChevronDown size={14} className="text-white/30 hidden sm:block" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 glass-strong rounded-2xl border border-white/10 shadow-card overflow-hidden z-50"
              >
                {/* User info */}
                <div className="p-4 border-b border-white/5">
                  <p className="font-semibold text-sm">{user?.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">{user?.email}</p>
                  <span className={cn(
                    "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border mt-2 capitalize",
                    PLAN_BADGE_COLORS[activePlan]
                  )}>
                    {activePlan === "elite" && <Crown size={9} />}
                    {activePlan} Plan
                  </span>
                </div>

                {/* Menu items */}
                <div className="p-1.5">
                  <Link href="/profile" onClick={() => setShowUserMenu(false)}>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all">
                      <User size={15} /> My Profile
                    </button>
                  </Link>
                  <Link href="/settings" onClick={() => setShowUserMenu(false)}>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all">
                      <Settings size={15} /> Settings
                    </button>
                  </Link>
                  {activePlan !== "elite" && (
                    <Link href="/plan-selection" onClick={() => setShowUserMenu(false)}>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-neon-blue hover:bg-neon-blue/10 transition-all">
                        <Crown size={15} /> Upgrade Plan
                      </button>
                    </Link>
                  )}
                  <div className="border-t border-white/5 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-red-400 hover:bg-red-400/5 transition-all"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
