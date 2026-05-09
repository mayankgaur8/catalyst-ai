"use client";

import { useState } from "react";
import {
  Bell, Shield, Moon, CreditCard, LogOut,
  ChevronRight, Lock, Volume2, VolumeX
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotifStore } from "@/lib/notifications";
import { setVolume } from "@/lib/sounds";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SettingRow = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
    <div>
      <div className="text-sm font-medium">{label}</div>
      {desc && <div className="text-xs text-white/30 mt-0.5">{desc}</div>}
    </div>
    {children}
  </div>
);

const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    aria-checked={enabled}
    role="switch"
    className={cn(
      "w-11 h-6 rounded-full transition-all relative flex-shrink-0",
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
  const router = useRouter();
  const {
    user, plan, onboardingData,
    soundEnabled, soundVolume, notifEnabled,
    setSoundEnabled, setSoundVolume, setNotifEnabled,
    logout,
  } = useAuthStore();

  const { prefs, updatePrefs } = useNotifStore();

  const [language, setLanguage] = useState("English");

  function handleVolumeChange(val: number) {
    setSoundVolume(val);
    setVolume(val / 100); // immediately apply so user hears preview
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Account */}
      <div className="glass rounded-2xl border border-white/8">
        <div className="p-5 border-b border-white/5">
          <h2 className="font-semibold flex items-center gap-2">
            <Lock size={16} className="text-neon-blue" /> Account
          </h2>
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
          <SettingRow
            label="Target Percentile"
            desc={`Currently: ${onboardingData?.targetPercentile ?? 95}+`}
          >
            <button className="text-xs text-neon-blue">Edit Goals</button>
          </SettingRow>
        </div>
      </div>

      {/* Sound & Audio */}
      <div className="glass rounded-2xl border border-white/8">
        <div className="p-5 border-b border-white/5">
          <h2 className="font-semibold flex items-center gap-2">
            {soundEnabled ? (
              <Volume2 size={16} className="text-neon-blue" />
            ) : (
              <VolumeX size={16} className="text-white/40" />
            )}
            Sound &amp; Audio
          </h2>
        </div>
        <div className="px-5">
          <SettingRow
            label="Sound Effects"
            desc="Play audio feedback for correct/wrong answers and achievements"
          >
            <Toggle enabled={soundEnabled} onToggle={() => setSoundEnabled(!soundEnabled)} />
          </SettingRow>

          <div className="py-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium">Volume</div>
                <div className="text-xs text-white/30">Sound effect volume level</div>
              </div>
              <span className="text-sm font-semibold text-neon-blue w-10 text-right">
                {soundVolume}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={soundVolume}
              disabled={!soundEnabled}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className={cn("w-full", !soundEnabled && "opacity-30 cursor-not-allowed")}
            />
            <div className="flex justify-between text-[10px] text-white/20 mt-1">
              <span>Quiet</span>
              <span>Loud</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass rounded-2xl border border-white/8">
        <div className="p-5 border-b border-white/5">
          <h2 className="font-semibold flex items-center gap-2">
            <Bell size={16} className="text-neon-blue" /> Notifications
          </h2>
        </div>
        <div className="px-5">
          <SettingRow
            label="Enable Notifications"
            desc="Master toggle for all in-app notifications"
          >
            <Toggle enabled={notifEnabled} onToggle={() => setNotifEnabled(!notifEnabled)} />
          </SettingRow>

          <div className={cn("transition-opacity", !notifEnabled && "opacity-40 pointer-events-none")}>
            <SettingRow
              label="Daily Study Reminder"
              desc="Get reminded to complete your daily tasks"
            >
              <Toggle
                enabled={prefs.dailyReminder}
                onToggle={() => updatePrefs({ dailyReminder: !prefs.dailyReminder })}
              />
            </SettingRow>
            <SettingRow
              label="Mock Test Alerts"
              desc="Notifications for upcoming and completed mock tests"
            >
              <Toggle
                enabled={prefs.mockAlert}
                onToggle={() => updatePrefs({ mockAlert: !prefs.mockAlert })}
              />
            </SettingRow>
            <SettingRow
              label="Streak Alerts"
              desc="Warning when your streak is about to break"
            >
              <Toggle
                enabled={prefs.streakAlert}
                onToggle={() => updatePrefs({ streakAlert: !prefs.streakAlert })}
              />
            </SettingRow>
            <SettingRow
              label="Achievement Alerts"
              desc="Celebrate when you unlock a new achievement"
            >
              <Toggle
                enabled={prefs.achievementAlert}
                onToggle={() => updatePrefs({ achievementAlert: !prefs.achievementAlert })}
              />
            </SettingRow>
            <SettingRow
              label="Weekly Progress Report"
              desc="Email summary every Sunday"
            >
              <Toggle
                enabled={prefs.weeklyReport}
                onToggle={() => updatePrefs({ weeklyReport: !prefs.weeklyReport })}
              />
            </SettingRow>
            <SettingRow label="Promotions &amp; Offers">
              <Toggle
                enabled={prefs.promotions}
                onToggle={() => updatePrefs({ promotions: !prefs.promotions })}
              />
            </SettingRow>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="glass rounded-2xl border border-white/8">
        <div className="p-5 border-b border-white/5">
          <h2 className="font-semibold flex items-center gap-2">
            <Moon size={16} className="text-neon-blue" /> Appearance
          </h2>
        </div>
        <div className="px-5">
          <SettingRow label="Dark Mode" desc="Always enabled for best experience">
            <Toggle enabled={true} onToggle={() => {}} />
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
          <h2 className="font-semibold flex items-center gap-2">
            <CreditCard size={16} className="text-neon-blue" /> Subscription
          </h2>
        </div>
        <div className="px-5">
          <SettingRow
            label="Current Plan"
            desc={`${(plan ?? "free").toUpperCase()} — Active`}
          >
            <span className="text-xs bg-neon-blue/20 text-neon-blue px-2 py-1 rounded-full font-semibold capitalize">
              {plan ?? "free"}
            </span>
          </SettingRow>
          {plan !== "elite" && (
            <SettingRow label="Upgrade Plan" desc="Unlock AI Mock Interviews and more">
              <Link href="/plan-selection">
                <button className="text-xs text-neon-blue px-3 py-1.5 bg-neon-blue/10 rounded-lg border border-neon-blue/20">
                  Upgrade
                </button>
              </Link>
            </SettingRow>
          )}
          <SettingRow label="Billing History">
            <button className="text-xs text-white/40 hover:text-white flex items-center gap-1">
              View <ChevronRight size={12} />
            </button>
          </SettingRow>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass rounded-2xl border border-red-500/20">
        <div className="p-5 border-b border-white/5">
          <h2 className="font-semibold text-red-400 flex items-center gap-2">
            <Shield size={16} /> Danger Zone
          </h2>
        </div>
        <div className="px-5">
          <SettingRow label="Sign Out" desc="Sign out from all devices">
            <button
              onClick={handleLogout}
              className="text-xs text-red-400 flex items-center gap-1 hover:text-red-300"
            >
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
