"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import MobileNav from "./MobileNav";
import ToastContainer from "@/components/ui/Toast";
import AchievementPopup from "@/components/ui/AchievementPopup";
import { useGameStore } from "@/store/useGameStore";
import { useAuthStore, useSubscriptionStatus } from "@/store/useAuthStore";
import { useNotifStore } from "@/lib/notifications";
import { setVolume } from "@/lib/sounds";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { resetDailyQuestsIfNeeded } = useGameStore();
  const { isAdmin, soundVolume } = useAuthStore();
  const { isExpired } = useSubscriptionStatus();
  const { seedIfEmpty } = useNotifStore();

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Sync persisted volume to sound engine on mount and on change
  useEffect(() => {
    setVolume(soundVolume / 100);
  }, [soundVolume]);

  // Reset daily quests at midnight
  useEffect(() => {
    resetDailyQuestsIfNeeded();
  }, [resetDailyQuestsIfNeeded]);

  // Seed default in-app notifications on first visit
  useEffect(() => {
    seedIfEmpty();
  }, [seedIfEmpty]);

  const mainMarginLeft = isMobile ? 0 : sidebarCollapsed ? 72 : 260;

  return (
    <div className="min-h-screen bg-dark-900 animated-bg">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={isMobile ? false : sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <Navbar
        onMenuClick={() => setSidebarOpen(true)}
        sidebarCollapsed={isMobile ? false : sidebarCollapsed}
      />

      {/* Admin plan-preview banner */}
      {isAdmin && <AdminPreviewBanner sidebarMargin={mainMarginLeft} />}

      {/* Subscription expiry warning */}
      {isExpired && <ExpiredBanner sidebarMargin={mainMarginLeft} />}

      <main
        className="pt-16 min-h-screen transition-all duration-300 pb-20 lg:pb-0"
        style={{ marginLeft: mainMarginLeft }}
      >
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <MobileNav />
      <ToastContainer />
      <AchievementPopup />
    </div>
  );
}

// ── Admin preview banner ───────────────────────────────────────────────────────

function AdminPreviewBanner({ sidebarMargin }: { sidebarMargin: number }) {
  const { previewPlan, setPreviewPlan } = useAuthStore();
  if (!previewPlan) return null;

  return (
    <div
      className="fixed top-16 right-0 z-30 flex items-center gap-3 px-4 py-2 bg-yellow-400/20 border-b border-l border-yellow-400/30 text-yellow-400 text-xs font-semibold backdrop-blur-xl transition-all duration-300"
      style={{ left: sidebarMargin }}
    >
      <span className="text-yellow-400/60">Admin:</span>
      Previewing <span className="uppercase font-black">{previewPlan}</span> plan
      <button
        onClick={() => setPreviewPlan(null)}
        className="ml-2 px-2 py-0.5 rounded-md bg-yellow-400/20 border border-yellow-400/30 hover:bg-yellow-400/30 transition-all"
      >
        Exit Preview
      </button>
    </div>
  );
}

// ── Subscription expiry banner ─────────────────────────────────────────────────

function ExpiredBanner({ sidebarMargin }: { sidebarMargin: number }) {
  return (
    <div
      className="fixed top-16 right-0 z-30 flex items-center gap-3 px-4 py-2 bg-red-500/15 border-b border-l border-red-500/30 text-red-300 text-xs font-semibold backdrop-blur-xl transition-all duration-300"
      style={{ left: sidebarMargin }}
    >
      <span>⚠️ Your subscription has expired.</span>
      <span className="text-red-400/60">You&apos;re on the Free plan until renewal.</span>
      <Link href="/plan-selection">
        <button className="ml-2 px-3 py-0.5 rounded-md bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-all text-red-300">
          Renew Now
        </button>
      </Link>
    </div>
  );
}
