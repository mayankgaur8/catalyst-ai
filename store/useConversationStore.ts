import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ChatMessage {
  id: number;
  role: "user" | "ai";
  content: string;
  provider?: string;
  cached?: boolean;
  streaming?: boolean;
  error?: boolean;
  timestamp: number;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

interface ConversationState {
  conversations: Conversation[];
  activeId: string | null;
  nextMsgId: number;
}

interface ConversationActions {
  newConversation: (userId: string) => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  togglePin: (id: string) => void;
  setActive: (id: string) => void;
  addMessage: (convId: string, msg: Omit<ChatMessage, "id" | "timestamp">) => number;
  updateMessage: (convId: string, msgId: number, patch: Partial<ChatMessage>) => void;
  clearMessages: (convId: string) => void;
  getActive: () => Conversation | null;
  getUserConversations: (userId: string) => Conversation[];
}

type ConversationStore = ConversationState & ConversationActions;

function makeId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeId: null,
      nextMsgId: 1,

      newConversation: (userId) => {
        const id = makeId();
        const now = Date.now();
        const conv: Conversation = {
          id, userId, title: "New Chat",
          messages: [], pinned: false, createdAt: now, updatedAt: now,
        };
        set((s) => ({ conversations: [conv, ...s.conversations], activeId: id }));
        return id;
      },

      deleteConversation: (id) => {
        set((s) => {
          const convs = s.conversations.filter((c) => c.id !== id);
          const activeId = s.activeId === id ? (convs[0]?.id ?? null) : s.activeId;
          return { conversations: convs, activeId };
        });
      },

      renameConversation: (id, title) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id
              ? { ...c, title: title.trim() || "Untitled", updatedAt: Date.now() }
              : c
          ),
        }));
      },

      togglePin: (id) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, pinned: !c.pinned } : c
          ),
        }));
      },

      setActive: (id) => set({ activeId: id }),

      addMessage: (convId, msg) => {
        const id = get().nextMsgId;
        const timestamp = Date.now();
        set((s) => ({
          nextMsgId: s.nextMsgId + 1,
          conversations: s.conversations.map((c) => {
            if (c.id !== convId) return c;
            const isFirstUserMsg = c.messages.length === 0 && msg.role === "user";
            return {
              ...c,
              updatedAt: timestamp,
              title: isFirstUserMsg
                ? msg.content.slice(0, 45) + (msg.content.length > 45 ? "…" : "")
                : c.title,
              messages: [...c.messages, { ...msg, id, timestamp }],
            };
          }),
        }));
        return id;
      },

      updateMessage: (convId, msgId, patch) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id !== convId ? c : {
              ...c,
              updatedAt: Date.now(),
              messages: c.messages.map((m) => m.id === msgId ? { ...m, ...patch } : m),
            }
          ),
        }));
      },

      clearMessages: (convId) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id !== convId ? c : { ...c, messages: [], title: "New Chat", updatedAt: Date.now() }
          ),
        }));
      },

      getActive: () => {
        const { conversations, activeId } = get();
        return conversations.find((c) => c.id === activeId) ?? null;
      },

      getUserConversations: (userId) =>
        get().conversations.filter((c) => c.userId === userId),
    }),
    {
      name: "catalyst-conversations",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Clear stuck streaming states from previous sessions
        state.conversations = state.conversations.map((conv) => ({
          ...conv,
          messages: conv.messages.map((m) =>
            m.streaming ? { ...m, streaming: false, content: m.content || "(Interrupted)" } : m
          ),
        }));
      },
    }
  )
);

// ── Helpers ───────────────────────────────────────────────────────────────────

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(ts).toLocaleDateString();
}
