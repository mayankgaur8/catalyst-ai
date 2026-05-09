import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Quest {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  xpReward: number;
  type: "practice" | "mock" | "study" | "accuracy" | "streak";
  completed: boolean;
  icon: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  xpReward: number;
  condition: { type: string; value: number };
}

export interface XPEvent {
  id: string;
  type: string;
  amount: number;
  label: string;
  timestamp: string;
}

const DAILY_QUESTS: Quest[] = [
  {
    id: "q_practice",
    title: "Practice Session",
    description: "Solve 10 practice questions",
    target: 10,
    progress: 0,
    xpReward: 50,
    type: "practice",
    completed: false,
    icon: "📚",
  },
  {
    id: "q_accuracy",
    title: "Accuracy Master",
    description: "Get 7 correct answers in a row",
    target: 7,
    progress: 0,
    xpReward: 80,
    type: "accuracy",
    completed: false,
    icon: "🎯",
  },
  {
    id: "q_study",
    title: "Time Keeper",
    description: "Complete a 30-min study session",
    target: 1,
    progress: 0,
    xpReward: 60,
    type: "study",
    completed: false,
    icon: "⏱️",
  },
  {
    id: "q_mock",
    title: "Mock Warrior",
    description: "Attempt a full mock test",
    target: 1,
    progress: 0,
    xpReward: 100,
    type: "mock",
    completed: false,
    icon: "⚔️",
  },
  {
    id: "q_streak",
    title: "Daily Streak",
    description: "Keep your streak alive today",
    target: 1,
    progress: 1,
    xpReward: 30,
    type: "streak",
    completed: true,
    icon: "🔥",
  },
];

const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: "a_first_login", title: "First Login", description: "Started your CAT journey", icon: "🚀", unlockedAt: null, xpReward: 50, condition: { type: "login", value: 1 } },
  { id: "a_first_q", title: "First Question", description: "Solved your first question", icon: "✨", unlockedAt: null, xpReward: 25, condition: { type: "questions", value: 1 } },
  { id: "a_century", title: "Century!", description: "Solved 100 questions", icon: "💯", unlockedAt: null, xpReward: 200, condition: { type: "questions", value: 100 } },
  { id: "a_streak_7", title: "Streak Starter", description: "Maintained a 7-day streak", icon: "🔥", unlockedAt: null, xpReward: 150, condition: { type: "streak", value: 7 } },
  { id: "a_streak_30", title: "On Fire!", description: "30-day streak champion", icon: "🌟", unlockedAt: null, xpReward: 500, condition: { type: "streak", value: 30 } },
  { id: "a_mock_5", title: "Mock Master", description: "Completed 5 mock tests", icon: "🏆", unlockedAt: null, xpReward: 300, condition: { type: "mocks", value: 5 } },
  { id: "a_scholar", title: "Scholar", description: "Reached Level 2", icon: "📖", unlockedAt: null, xpReward: 100, condition: { type: "level", value: 2 } },
  { id: "a_accuracy", title: "Accuracy King", description: "80%+ accuracy in a session", icon: "🎯", unlockedAt: null, xpReward: 200, condition: { type: "accuracy", value: 80 } },
  { id: "a_speed", title: "Speed Demon", description: "Solved 50 questions in a day", icon: "⚡", unlockedAt: null, xpReward: 250, condition: { type: "daily_questions", value: 50 } },
  { id: "a_iim", title: "IIM Bound", description: "Predicted 99+ percentile", icon: "🎓", unlockedAt: null, xpReward: 1000, condition: { type: "percentile", value: 99 } },
];

interface GameState {
  quests: Quest[];
  achievements: Achievement[];
  xpEvents: XPEvent[];
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  totalMocksTaken: number;
  lastQuestReset: string;
  newlyUnlocked: Achievement | null;
  consecutiveCorrect: number;
}

interface GameActions {
  incrementQuestProgress: (type: Quest["type"], amount?: number) => void;
  recordAnswer: (correct: boolean) => void;
  incrementMocksTaken: () => void;
  tryUnlockAchievements: (xp: number, streak: number, level: number) => Achievement | null;
  addXPEvent: (event: Omit<XPEvent, "id" | "timestamp">) => void;
  clearNewlyUnlocked: () => void;
  resetDailyQuestsIfNeeded: () => void;
}

type GameStore = GameState & GameActions;

const INITIAL_GAME: GameState = {
  quests: DAILY_QUESTS,
  achievements: ALL_ACHIEVEMENTS,
  xpEvents: [],
  totalQuestionsAnswered: 0,
  totalCorrectAnswers: 0,
  totalMocksTaken: 0,
  lastQuestReset: new Date().toDateString(),
  newlyUnlocked: null,
  consecutiveCorrect: 0,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_GAME,

      incrementQuestProgress: (type, amount = 1) => {
        set((state) => ({
          quests: state.quests.map((q) => {
            if (q.type !== type || q.completed) return q;
            const newProgress = Math.min(q.progress + amount, q.target);
            return { ...q, progress: newProgress, completed: newProgress >= q.target };
          }),
        }));
      },

      recordAnswer: (correct) => {
        const state = get();
        const newConsecutive = correct ? state.consecutiveCorrect + 1 : 0;
        const newTotal = state.totalQuestionsAnswered + 1;
        const newCorrect = correct ? state.totalCorrectAnswers + 1 : state.totalCorrectAnswers;

        set({
          totalQuestionsAnswered: newTotal,
          totalCorrectAnswers: newCorrect,
          consecutiveCorrect: newConsecutive,
        });

        // Quest progress
        get().incrementQuestProgress("practice", 1);
        if (correct && newConsecutive > 0) {
          // Check accuracy quest progress
          const accuracyQuest = get().quests.find((q) => q.type === "accuracy");
          if (accuracyQuest && !accuracyQuest.completed) {
            set((s) => ({
              quests: s.quests.map((q) =>
                q.type === "accuracy"
                  ? { ...q, progress: Math.min(newConsecutive, q.target), completed: newConsecutive >= q.target }
                  : q
              ),
            }));
          }
        }
      },

      incrementMocksTaken: () => {
        set((state) => ({ totalMocksTaken: state.totalMocksTaken + 1 }));
        get().incrementQuestProgress("mock", 1);
      },

      tryUnlockAchievements: (xp, streak, level) => {
        const { achievements, totalQuestionsAnswered, totalMocksTaken } = get();
        const stats = { questions: totalQuestionsAnswered, streak, level, mocks: totalMocksTaken, xp };

        for (const ach of achievements) {
          if (ach.unlockedAt) continue;
          const { type, value } = ach.condition;
          const stat = stats[type as keyof typeof stats] ?? 0;
          if (stat >= value) {
            const now = new Date().toISOString();
            const unlocked = { ...ach, unlockedAt: now };
            set({
              achievements: achievements.map((a) => (a.id === ach.id ? unlocked : a)),
              newlyUnlocked: unlocked,
            });
            return unlocked;
          }
        }
        return null;
      },

      addXPEvent: (event) => {
        const xpEvent: XPEvent = {
          ...event,
          id: `xp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          xpEvents: [xpEvent, ...state.xpEvents].slice(0, 50),
        }));
      },

      clearNewlyUnlocked: () => set({ newlyUnlocked: null }),

      resetDailyQuestsIfNeeded: () => {
        const today = new Date().toDateString();
        if (get().lastQuestReset === today) return;
        set({
          quests: DAILY_QUESTS.map((q) => ({ ...q, progress: 0, completed: false })),
          lastQuestReset: today,
          consecutiveCorrect: 0,
        });
      },
    }),
    {
      name: "catalyst-game",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
