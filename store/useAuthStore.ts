import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Plan } from "@/lib/features";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "user" | "admin";
  // Gamification
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
  // Auth
  user: AuthUser | null;
  isAuthenticated: boolean;
  // Subscription flow
  plan: Plan | null;
  subscriptionActivatedAt: string | null;
  subscriptionExpiresAt: string | null;
  // Onboarding
  hasCompletedOnboarding: boolean;
  onboardingData: OnboardingData | null;
  // Admin override
  isAdmin: boolean;
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
  // Admin only
  setUserPlan: (plan: Plan) => void;
}

type AuthStore = AuthState & AuthActions;

const INITIAL_STATE: AuthState = {
  user: null,
  isAuthenticated: false,
  plan: null,
  subscriptionActivatedAt: null,
  subscriptionExpiresAt: null,
  hasCompletedOnboarding: false,
  onboardingData: null,
  isAdmin: false,
};

function makeUser(email: string, name: string, role: "user" | "admin" = "user"): AuthUser {
  return {
    id: `user_${Date.now()}`,
    name,
    email,
    role,
    xp: 0,
    streak: 0,
    level: 1,
    badges: [],
  };
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      login: (email, name, role = "user") => {
        set({
          user: makeUser(email, name, role),
          isAuthenticated: true,
          isAdmin: role === "admin",
        });
      },

      loginWithGoogle: (name, email) => {
        set({
          user: makeUser(email, name, "user"),
          isAuthenticated: true,
          isAdmin: false,
        });
      },

      logout: () => {
        set({ ...INITIAL_STATE });
      },

      selectPlan: (plan) => {
        set({ plan });
      },

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

      completeOnboarding: (data) => {
        set({ hasCompletedOnboarding: true, onboardingData: data });
      },

      updateXP: (amount) => {
        const { user } = get();
        if (!user) return;
        const newXP = user.xp + amount;
        const newLevel = Math.floor(newXP / 500) + 1;
        set({ user: { ...user, xp: newXP, level: Math.min(newLevel, 10) } });
      },

      updateStreak: () => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, streak: user.streak + 1 } });
      },

      setUserPlan: (plan) => {
        get().activateSubscription(plan, 12);
      },
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
      }),
    }
  )
);

// Convenience hook for checking subscription expiry
export function useSubscriptionStatus() {
  const { plan, subscriptionExpiresAt } = useAuthStore();
  if (!plan) return { plan: null, isActive: false, isExpired: false };
  if (plan === "free") return { plan, isActive: true, isExpired: false };
  if (!subscriptionExpiresAt) return { plan, isActive: false, isExpired: false };
  const isExpired = new Date(subscriptionExpiresAt) < new Date();
  return { plan: isExpired ? "free" as Plan : plan, isActive: !isExpired, isExpired };
}
