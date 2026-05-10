import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  streaming?: boolean; // True while streaming response
  error?: boolean; // True if message contains error
  provider?: string; // AI provider (Groq, Gemini, etc.)
  cached?: boolean; // True if response was cached
  metadata?: {
    provider?: string;
    model?: string;
    tokens?: number;
    latencyMs?: number;
  };
  feedback?: "helpful" | "unhelpful" | "flagged";
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  topic?: string;
  messages: ChatMessage[];
  isPinned: boolean;
  isFavorite: boolean;
  syncedWithBackend: boolean; // True if persisted to DB
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ConversationState {
  conversations: Conversation[];
  activeId: string | null;
  syncInProgress: Record<string, boolean>; // Track which conversations are syncing
}

interface ConversationActions {
  newConversation: (userId: string, title?: string, topic?: string) => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  togglePin: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setActive: (id: string) => void;
  addMessage: (convId: string, msg: Omit<ChatMessage, "id" | "createdAt" | "updatedAt">) => string;
  updateMessage: (convId: string, msgId: string, patch: Partial<ChatMessage>) => void;
  addMessageFeedback: (convId: string, msgId: string, feedback: ChatMessage["feedback"], flagReason?: string) => void;
  clearMessages: (convId: string) => void;
  getActive: () => Conversation | null;
  getUserConversations: (userId: string) => Conversation[];
  
  // Backend sync methods
  syncToBackend: (convId: string, userId: string) => Promise<void>;
  loadFromBackend: (userId: string, page?: number) => Promise<void>;
  syncMessage: (convId: string, userId: string, msgId: string) => Promise<void>;
  markSynced: (convId: string) => void;
}

type ConversationStore = ConversationState & ConversationActions;

function makeId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function makeMsgId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeId: null,
      syncInProgress: {},

      newConversation: (userId, title, topic) => {
        const id = makeId();
        const now = new Date().toISOString();
        const conv: Conversation = {
          id,
          userId,
          title: title || "New Conversation",
          topic: topic || "general",
          messages: [],
          isPinned: false,
          isFavorite: false,
          syncedWithBackend: false,
          createdAt: now,
          updatedAt: now,
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
              ? { ...c, title: title.trim() || "Untitled", updatedAt: new Date().toISOString() }
              : c
          ),
        }));
      },

      togglePin: (id) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, isPinned: !c.isPinned } : c
          ),
        }));
      },

      toggleFavorite: (id) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
          ),
        }));
      },

      setActive: (id) => set({ activeId: id }),

      addMessage: (convId, msg) => {
        const id = makeMsgId();
        const now = new Date().toISOString();
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== convId) return c;
            const isFirstUserMsg = c.messages.length === 0 && msg.role === "USER";
            return {
              ...c,
              updatedAt: now,
              title: isFirstUserMsg
                ? msg.content.slice(0, 45) + (msg.content.length > 45 ? "…" : "")
                : c.title,
              messages: [...c.messages, { ...msg, id, createdAt: now, updatedAt: now }],
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
              updatedAt: new Date().toISOString(),
              messages: c.messages.map((m) =>
                m.id === msgId ? { ...m, ...patch, updatedAt: new Date().toISOString() } : m
              ),
            }
          ),
        }));
      },

      addMessageFeedback: (convId, msgId, feedback, flagReason) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id !== convId ? c : {
              ...c,
              messages: c.messages.map((m) =>
                m.id === msgId
                  ? { ...m, feedback, ...(flagReason && { flagReason }) }
                  : m
              ),
            }
          ),
        }));
      },

      clearMessages: (convId) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id !== convId ? c : { ...c, messages: [], title: "New Conversation", updatedAt: new Date().toISOString() }
          ),
        }));
      },

      getActive: () => {
        const { conversations, activeId } = get();
        return conversations.find((c) => c.id === activeId) ?? null;
      },

      getUserConversations: (userId) =>
        get().conversations.filter((c) => c.userId === userId && !c.deletedAt),

      // Backend sync: save conversation to database
      syncToBackend: async (convId, userId) => {
        const conv = get().conversations.find((c) => c.id === convId);
        if (!conv || !userId) return;

        set((s) => ({
          syncInProgress: { ...s.syncInProgress, [convId]: true },
        }));

        try {
          const headers = {
            "x-user-id": userId,
            "Content-Type": "application/json",
          };

          // Create or update conversation
          const convRes = await fetch("/api/conversations", {
            method: "POST",
            headers,
            body: JSON.stringify({
              title: conv.title,
              topic: conv.topic,
            }),
          });

          if (!convRes.ok) throw new Error("Failed to sync conversation");

          const backendConv = await convRes.json();

          // Map local ID to backend ID
          set((s) => ({
            conversations: s.conversations.map((c) =>
              c.id === convId ? { ...c, id: backendConv.id, syncedWithBackend: true } : c
            ),
          }));
        } catch (error) {
          console.error("Failed to sync conversation to backend:", error);
        } finally {
          set((s) => ({
            syncInProgress: { ...s.syncInProgress, [convId]: false },
          }));
        }
      },

      // Backend load: fetch conversations from database
      loadFromBackend: async (userId, page = 1) => {
        try {
          const headers = { "x-user-id": userId };
          const res = await fetch(`/api/conversations?page=${page}&limit=20`, { headers });

          if (!res.ok) throw new Error("Failed to load conversations");

          const { conversations: backendConvs } = await res.json();

          set((s) => ({
            conversations: [
              ...s.conversations.filter((c) => !c.syncedWithBackend), // Keep local unsync'd
              ...backendConvs.map((bc: { id: string; userId: string; title: string; topic?: string; isPinned: boolean; isFavorite: boolean; deletedAt?: string | null; createdAt: string; updatedAt: string }) => ({
                ...bc,
                messages: [], // Load messages separately
                syncedWithBackend: true,
              })),
            ],
          }));
        } catch (error) {
          console.error("Failed to load conversations from backend:", error);
        }
      },

      // Backend sync: save message to database
      syncMessage: async (convId, userId, msgId) => {
        const conv = get().conversations.find((c) => c.id === convId);
        const msg = conv?.messages.find((m) => m.id === msgId);

        if (!conv || !msg || !userId || !conv.syncedWithBackend) return;

        try {
          const headers = {
            "x-user-id": userId,
            "Content-Type": "application/json",
          };

          const res = await fetch(`/api/conversations/${conv.id}/messages`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              role: msg.role,
              content: msg.content,
              metadata: msg.metadata,
            }),
          });

          if (!res.ok) throw new Error("Failed to sync message");
        } catch (error) {
          console.error("Failed to sync message to backend:", error);
        }
      },

      markSynced: (convId) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId ? { ...c, syncedWithBackend: true } : c
          ),
        }));
      },
    }),
    {
      name: "catalyst-conversations",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Clear stuck streaming states from previous sessions
        // (if needed in future)
      },
    }
  )
);

// ── Helpers ───────────────────────────────────────────────────────────────────

export function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(ts).toLocaleDateString();
}
