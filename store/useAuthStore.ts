import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Plan } from "@/lib/features";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "user" | "admin";
  xp: number;
  streak: number;
  level: number;
  badges: string[];
}

export interface OnboardingData {
  targetPercentile: number;
  exams: string[];
  graduation: string;
  category: string;
  workExp: string;
  studyHours: string;
  dreamColleges: string[];
  weaknesses: string[];
  studyMode: "self" | "ai" | "mentor";
  examDate: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  plan: Plan | null;
  subscriptionActivatedAt: string | null;
  subscriptionExpiresAt: string | null;
  hasCompletedOnboarding: boolean;
  onboardingData: OnboardingData | null;
  isAdmin: boolean;
  // Admin plan preview — lets admin test feature access for any plan
  previewPlan: Plan | null;
  // User preferences
  soundEnabled: boolean;
  soundVolume: number; // 0–100
  notifEnabled: boolean;
}

interface AuthActions {
  login: (email: string, name: string, role?: "user" | "admin") => void;
  loginWithGoogle: (name: string, email: string) => void;
  logout: () => void;
  selectPlan: (plan: Plan) => void;
  activateSubscription: (plan: Plan, months?: number) => void;
  completeOnboarding: (data: OnboardingData) => void;
  updateXP: (amount: number) => void;
  updateStreak: () => void;
  addBadge: (badge: string) => void;
  // Admin actions
  setUserPlan: (plan: Plan) => void;
  setPreviewPlan: (plan: Plan | null) => void;
  // Preference actions
  setSoundEnabled: (val: boolean) => void;
  setSoundVolume: (val: number) => void;
  setNotifEnabled: (val: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

// Admin emails — in production this is enforced server-side; NEXT_PUBLIC_ prefix makes it available client-side for the demo
const ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "mayankgaur.8@gmail.com,admin@catalyst.ai"
)
  .split(",")
  .map((e) => e.trim().toLowerCase());

const INITIAL_STATE: AuthState = {
  user: null,
  isAuthenticated: false,
  plan: null,
  subscriptionActivatedAt: null,
  subscriptionExpiresAt: null,
  hasCompletedOnboarding: false,
  onboardingData: null,
  isAdmin: false,
  previewPlan: null,
  soundEnabled: true,
  soundVolume: 70,
  notifEnabled: true,
};

function makeUser(email: string, name: string, role: "user" | "admin" = "user"): AuthUser {
  const isAdmin = role === "admin";
  return {
    id: `user_${Date.now()}`,
    name,
    email,
    role,
    xp: isAdmin ? 9999 : 0,
    streak: isAdmin ? 30 : 0,
    level: isAdmin ? 7 : 1,
    badges: isAdmin ? ["Admin", "First Login", "Profile Complete"] : [],
  };
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      login: (email, name, role = "user") => {
        const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());
        const effectiveRole: "user" | "admin" = isAdminEmail ? "admin" : role;
        set({
          user: makeUser(email, name, effectiveRole),
          isAuthenticated: true,
          isAdmin: effectiveRole === "admin",
          // Admins bypass plan selection + onboarding so they can test all features immediately
          plan: isAdminEmail ? "elite" : null,
          hasCompletedOnboarding: isAdminEmail,
        });
      },

      loginWithGoogle: (name, email) => {
        const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());
        const role: "user" | "admin" = isAdminEmail ? "admin" : "user";
        set({
          user: makeUser(email, name, role),
          isAuthenticated: true,
          isAdmin: isAdminEmail,
          plan: isAdminEmail ? "elite" : null,
          hasCompletedOnboarding: isAdminEmail,
        });
      },

      logout: () => set({ ...INITIAL_STATE }),

      selectPlan: (plan) => set({ plan }),

      activateSubscription: (plan, months = 1) => {
        const now = new Date();
        const expiry = new Date(now);
        expiry.setMonth(expiry.getMonth() + months);
        set({
          plan,
          subscriptionActivatedAt: now.toISOString(),
          subscriptionExpiresAt: expiry.toISOString(),
        });
      },

      completeOnboarding: (data) =>
        set({ hasCompletedOnboarding: true, onboardingData: data }),

      updateXP: (amount) => {
        const { user } = get();
        if (!user) return;
        const newXP = user.xp + amount;
        const newLevel = Math.min(7, Math.floor(newXP / 500) + 1);
        set({ user: { ...user, xp: newXP, level: newLevel } });
      },

      updateStreak: () => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, streak: user.streak + 1 } });
      },

      addBadge: (badge) => {
        const { user } = get();
        if (!user || user.badges.includes(badge)) return;
        set({ user: { ...user, badges: [...user.badges, badge] } });
      },

      setUserPlan: (plan) => get().activateSubscription(plan, 12),

      setPreviewPlan: (plan) => {
        if (!get().isAdmin) return;
        set({ previewPlan: plan });
      },

      setSoundEnabled: (val) => set({ soundEnabled: val }),
      setSoundVolume: (val) => set({ soundVolume: Math.max(0, Math.min(100, val)) }),
      setNotifEnabled: (val) => set({ notifEnabled: val }),
    }),
    {
      name: "catalyst-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        plan: state.plan,
        subscriptionActivatedAt: state.subscriptionActivatedAt,
        subscriptionExpiresAt: state.subscriptionExpiresAt,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        onboardingData: state.onboardingData,
        isAdmin: state.isAdmin,
        previewPlan: state.previewPlan,
        soundEnabled: state.soundEnabled,
        soundVolume: state.soundVolume,
        notifEnabled: state.notifEnabled,
      }),
    }
  )
);

// Returns the plan to use for all feature-access checks.
// Admins can set previewPlan to test any plan's experience.
export function useEffectivePlan(): Plan | null {
  const { plan, previewPlan, isAdmin } = useAuthStore();
  return isAdmin && previewPlan ? previewPlan : plan;
}

export function useSubscriptionStatus() {
  const { plan, subscriptionExpiresAt } = useAuthStore();
  if (!plan) return { plan: null, isActive: false, isExpired: false };
  if (plan === "free") return { plan, isActive: true, isExpired: false };
  if (!subscriptionExpiresAt) return { plan, isActive: false, isExpired: false };
  const isExpired = new Date(subscriptionExpiresAt) < new Date();
  return { plan: isExpired ? ("free" as Plan) : plan, isActive: !isExpired, isExpired };
}
