import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type NotifType = "reminder" | "streak" | "mock" | "achievement" | "system" | "goal";

export interface InAppNotification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  icon: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

export interface NotifPrefs {
  dailyReminder: boolean;
  streakAlert: boolean;
  mockAlert: boolean;
  weeklyReport: boolean;
  achievementAlert: boolean;
  promotions: boolean;
}

interface NotifState {
  notifications: InAppNotification[];
  prefs: NotifPrefs;
  pushGranted: boolean;
}

interface NotifActions {
  addNotification: (n: Omit<InAppNotification, "id" | "read" | "createdAt">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  updatePrefs: (prefs: Partial<NotifPrefs>) => void;
  setPushGranted: (val: boolean) => void;
  /** Seed default notifications on first login (no-op if already seeded) */
  seedIfEmpty: () => void;
}

export const DEFAULT_NOTIF_PREFS: NotifPrefs = {
  dailyReminder: true,
  streakAlert: true,
  mockAlert: true,
  weeklyReport: false,
  achievementAlert: true,
  promotions: false,
};

function makeSeedNotifications(): InAppNotification[] {
  const seeds: Omit<InAppNotification, "id" | "read" | "createdAt">[] = [
    {
      type: "mock",
      title: "Mock Analysis Ready",
      body: "Your CAT Full Mock #2 analysis is complete. Review your weak areas now.",
      icon: "📊",
      href: "/mock-tests",
    },
    {
      type: "streak",
      title: "🔥 3-Day Streak!",
      body: "You're on a 3-day streak. Keep it up to unlock the Streak Starter badge.",
      icon: "🔥",
    },
    {
      type: "reminder",
      title: "New RC Passage Added",
      body: "Check out the new passage on 'Climate Economics' in the VARC practice section.",
      icon: "📖",
      href: "/practice",
    },
    {
      type: "goal",
      title: "Weekly Goal at 60%",
      body: "You've hit 60% of your weekly question target. 3 days left — finish strong!",
      icon: "🎯",
    },
    {
      type: "system",
      title: "AI Study Plan Updated",
      body: "Your adaptive plan has been revised based on last week's performance data.",
      icon: "🤖",
    },
  ];
  return seeds.map((n, i) => ({
    ...n,
    id: `seed_${i}`,
    read: false,
    createdAt: new Date(Date.now() - i * 3_600_000).toISOString(),
  }));
}

export const useNotifStore = create<NotifState & NotifActions>()(
  persist(
    (set, get) => ({
      notifications: [],
      prefs: DEFAULT_NOTIF_PREFS,
      pushGranted: false,

      addNotification: (n) => {
        const notification: InAppNotification = {
          ...n,
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ notifications: [notification, ...s.notifications].slice(0, 50) }));
      },

      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      dismiss: (id) =>
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

      clearAll: () => set({ notifications: [] }),

      updatePrefs: (prefs) =>
        set((s) => ({ prefs: { ...s.prefs, ...prefs } })),

      setPushGranted: (val) => set({ pushGranted: val }),

      seedIfEmpty: () => {
        if (get().notifications.length === 0) {
          set({ notifications: makeSeedNotifications() });
        }
      },
    }),
    {
      name: "catalyst-notifications",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/** Add a notification from anywhere — store actions, event handlers, etc. */
export function addNotification(
  type: NotifType,
  title: string,
  body: string,
  icon: string,
  href?: string
) {
  useNotifStore.getState().addNotification({ type, title, body, icon, href });
}
