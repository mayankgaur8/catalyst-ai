import { create } from "zustand";

// Re-export Question type used across the app
export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  section: "varc" | "dilr" | "qa";
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "cat level";
  explanation: string;
  timeToSolve: number;
}

interface MockTestStore {
  currentTest: {
    id: string;
    questions: Question[];
    currentIndex: number;
    answers: Record<number, number>;
    markedForReview: Set<number>;
    timeRemaining: number;
    isActive: boolean;
    section: "varc" | "dilr" | "qa";
  } | null;
  setTest: (test: MockTestStore["currentTest"]) => void;
  answerQuestion: (index: number, answer: number) => void;
  toggleMarkForReview: (index: number) => void;
  setCurrentIndex: (index: number) => void;
  decrementTimer: () => void;
  endTest: () => void;
}

export const useMockTestStore = create<MockTestStore>((set) => ({
  currentTest: null,
  setTest: (test) => set({ currentTest: test }),
  answerQuestion: (index, answer) =>
    set((state) => ({
      currentTest: state.currentTest
        ? { ...state.currentTest, answers: { ...state.currentTest.answers, [index]: answer } }
        : null,
    })),
  toggleMarkForReview: (index) =>
    set((state) => {
      if (!state.currentTest) return state;
      const marked = new Set(state.currentTest.markedForReview);
      if (marked.has(index)) marked.delete(index);
      else marked.add(index);
      return { currentTest: { ...state.currentTest, markedForReview: marked } };
    }),
  setCurrentIndex: (index) =>
    set((state) => ({
      currentTest: state.currentTest ? { ...state.currentTest, currentIndex: index } : null,
    })),
  decrementTimer: () =>
    set((state) => ({
      currentTest: state.currentTest
        ? { ...state.currentTest, timeRemaining: Math.max(0, state.currentTest.timeRemaining - 1) }
        : null,
    })),
  endTest: () => set({ currentTest: null }),
}));

// Legacy alias — components that imported useUserStore get auth data from useAuthStore now.
// This shim keeps old imports working during migration.
export { useAuthStore as useUserStore } from "@/store/useAuthStore";
