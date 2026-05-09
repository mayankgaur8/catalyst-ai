"use client";

import { useState } from "react";
import {
  Bell, Shield, Moon, CreditCard, LogOut,
  ChevronRight, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

const SettingRow = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
    <div>
      <div className="text-sm font-medium">{label}</div>
      {desc && <div className="text-xs text-white/30 mt-0.5">{desc}</div>}
    </div>
    {children}
  </div>
);

const Toggle2 = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className={cn(
      "w-11 h-6 rounded-full transition-all relative",
      enabled ? "bg-neon-blue" : "bg-white/15"
    )}
  >
    <div className={cn(
      "w-4 h-4 rounded-full bg-white absolute top-1 transition-all",
      enabled ? "left-6" : "left-1"
    )} />
  </button>
);

export default function SettingsPage() {
  const { user, plan, onboardingData } = useAuthStore();
  const [notifications, setNotifications] = useState({
    dailyReminder: true,
    mockAlerts: true,
    streakAlert: true,
    weeklyReport: false,
    promotions: false,
  });
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState("English");

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile Settings */}
      <div className="glass rounded-2xl border border-white/8">
        <div className="p-5 border-b border-white/5">
          <h2 className="font-semibold flex items-center gap-2"><Lock size={16} className="text-neon-blue" /> Account</h2>
        </div>
        <div className="px-5">
          <SettingRow label="Full Name" desc={user?.name}>
            <button className="text-xs text-neon-blue">Edit</button>
          </SettingRow>
          <SettingRow label="Email" desc={user?.email}>
            <button className="text-xs text-neon-blue">Change</button>
          </SettingRow>
          <SettingRow label="Password" desc="Last changed: 3 months ago">
            <button className="text-xs text-neon-blue">Update</button>
          </SettingRow>
          <SettingRow label="Target Percentile" desc={`Currently: ${onboardingData?.targetPercentile ?? 95}+`}>
            <button className="text-xs text-neon-blue">Edit Goals</button>
          </SettingRow>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass rounded-2xl border border-white/8">
        <div className="p-5 border-b border-white/5">
          <h2 className="font-semibold flex items-center gap-2"><Bell size={16} className="text-neon-blue" /> Notifications</h2>
        </div>
        <div className="px-5">
          <SettingRow label="Daily Study Reminder" desc="Get reminded to complete your daily tasks">
            <Toggle2 enabled={notifications.dailyReminder} onToggle={() => setNotifications(n => ({ ...n, dailyReminder: !n.dailyReminder }))} />
          </SettingRow>
          <SettingRow label="Mock Test Alerts" desc="Notifications for upcoming mock tests">
            <Toggle2 enabled={notifications.mockAlerts} onToggle={() => setNotifications(n => ({ ...n, mockAlerts: !n.mockAlerts }))} />
          </SettingRow>
          <SettingRow label="Streak Alerts" desc="Warning when your streak is about to break">
            <Toggle2 enabled={notifications.streakAlert} onToggle={() => setNotifications(n => ({ ...n, streakAlert: !n.streakAlert }))} />
          </SettingRow>
          <SettingRow label="Weekly Progress Report" desc="Email summary every Sunday">
            <Toggle2 enabled={notifications.weeklyReport} onToggle={() => setNotifications(n => ({ ...n, weeklyReport: !n.weeklyReport }))} />
          </SettingRow>
          <SettingRow label="Promotions & Offers">
            <Toggle2 enabled={notifications.promotions} onToggle={() => setNotifications(n => ({ ...n, promotions: !n.promotions }))} />
          </SettingRow>
        </div>
      </div>

      {/* Appearance */}
      <div className="glass rounded-2xl border border-white/8">
        <div className="p-5 border-b border-white/5">
          <h2 className="font-semibold flex items-center gap-2"><Moon size={16} className="text-neon-blue" /> Appearance</h2>
        </div>
        <div className="px-5">
          <SettingRow label="Dark Mode" desc="Always enabled for best experience">
            <Toggle2 enabled={darkMode} onToggle={() => setDarkMode(!darkMode)} />
          </SettingRow>
          <SettingRow label="Language" desc="Platform language">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>
          </SettingRow>
        </div>
      </div>

      {/* Subscription */}
      <div className="glass rounded-2xl border border-white/8">
        <div className="p-5 border-b border-white/5">
          <h2 className="font-semibold flex items-center gap-2"><CreditCard size={16} className="text-neon-blue" /> Subscription</h2>
        </div>
        <div className="px-5">
          <SettingRow label="Current Plan" desc={`${(plan ?? "free").toUpperCase()} — Active`}>
            <span className="text-xs bg-neon-blue/20 text-neon-blue px-2 py-1 rounded-full font-semibold capitalize">{plan ?? "free"}</span>
          </SettingRow>
          <SettingRow label="Upgrade Plan" desc="Unlock AI Mock Interviews and more">
            <button className="text-xs text-neon-blue px-3 py-1.5 bg-neon-blue/10 rounded-lg border border-neon-blue/20">Upgrade</button>
          </SettingRow>
          <SettingRow label="Billing History">
            <button className="text-xs text-white/40 hover:text-white flex items-center gap-1">View <ChevronRight size={12} /></button>
          </SettingRow>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass rounded-2xl border border-red-500/20">
        <div className="p-5 border-b border-white/5">
          <h2 className="font-semibold text-red-400 flex items-center gap-2"><Shield size={16} /> Danger Zone</h2>
        </div>
        <div className="px-5">
          <SettingRow label="Sign Out" desc="Sign out from all devices">
            <button className="text-xs text-red-400 flex items-center gap-1 hover:text-red-300">
              <LogOut size={14} /> Sign Out
            </button>
          </SettingRow>
          <SettingRow label="Delete Account" desc="Permanently delete your account and all data">
            <button className="text-xs text-red-400 hover:text-red-300">Delete</button>
          </SettingRow>
        </div>
      </div>
    </div>
  );
}
