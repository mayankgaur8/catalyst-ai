import { create } from "zustand";

export type ToastType =
  | "success"
  | "error"
  | "info"
  | "warning"
  | "xp"
  | "achievement"
  | "streak";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  xpAmount?: number;
  icon?: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
}

interface ToastActions {
  show: (item: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastState & ToastActions>((set) => ({
  toasts: [],

  show: (item) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const duration = item.duration ?? (item.type === "achievement" || item.type === "streak" ? 4500 : 3000);
    set((s) => ({ toasts: [...s.toasts, { ...item, id }].slice(-6) }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), duration);
    return id;
  },

  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  clear: () => set({ toasts: [] }),
}));

// Convenience helpers — call these anywhere (store or component)
export const toast = {
  success: (message: string) =>
    useToastStore.getState().show({ type: "success", message }),

  error: (message: string) =>
    useToastStore.getState().show({ type: "error", message }),

  info: (message: string) =>
    useToastStore.getState().show({ type: "info", message }),

  warning: (message: string) =>
    useToastStore.getState().show({ type: "warning", message }),

  xp: (amount: number, label = "XP earned!") =>
    useToastStore.getState().show({ type: "xp", message: label, xpAmount: amount }),

  achievement: (title: string, icon = "🏆") =>
    useToastStore.getState().show({ type: "achievement", message: title, icon, duration: 5000 }),

  streak: (days: number) =>
    useToastStore.getState().show({
      type: "streak",
      message: `${days}-day streak! Keep going!`,
      icon: "🔥",
      duration: 4000,
    }),
};
