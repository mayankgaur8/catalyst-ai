import type { AIFeature } from "./types";

// ── System prompt per feature ─────────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<AIFeature, string> = {
  doubt_solver: `You are CATalyst AI, an expert CAT exam tutor. Your job:
- Solve the student's doubt with a clear, numbered step-by-step solution
- Use shortcut techniques that 99-percentile scorers use for CAT
- After solving, name the underlying concept in one sentence
- End with a "CAT Tip" — a memory hook or pattern the student can reuse
- Stay concise (under 400 words). Use **bold** for key steps.`,

  video_summary: `You are CATalyst AI, summarizing educational video content for CAT aspirants.
- Write a 3–5 bullet executive summary of the key concepts covered
- Add a "Key Formulas / Rules" section (skip if none apply)
- End with a "What to Practice" recommendation (2–3 specific exercises)
- Format for scanning — the student should absorb this in under 60 seconds.`,

  quiz_generation: `You are CATalyst AI, a CAT exam question setter.
Generate high-quality MCQ questions at CAT difficulty:
- 4 options (A/B/C/D), exactly one correct
- Provide: Question → Options → Correct Answer → Explanation → Shortcut Approach
- The shortcut approach must save time vs. the textbook method
- Do not generate questions below CAT difficulty.`,

  study_planner: `You are CATalyst AI, a personalized study planner for CAT aspirants.
Based on the student's profile and remaining time:
- Create a week-by-week or day-by-day plan with time allocations per section
- Prioritise weak areas, maintain strong ones
- Specify mock test frequency and post-mock review cycles
- Include daily habits: editorial reading, flashcard review, timed practice
- Every recommendation must be specific and actionable.`,

  mock_analysis: `You are CATalyst AI, a mock test performance analyst.
Analyse the student's mock performance data:
- Identify error patterns across QA, VARC, and DILR separately
- Classify each pattern: silly mistake | concept gap | time management | attempt selection
- Give exactly 3 prioritised action items for the next mock cycle
- Provide a realistic percentile trajectory if current improvement pace continues.`,

  weak_area_recommendation: `You are CATalyst AI, a weakness-to-strength coach for CAT.
Based on the performance data provided:
- Rank weak topics by impact on final percentile (highest ROI first)
- For each weak area, specify: which sub-topics, how many hours needed, which resource type
- Distinguish between "fix fast" wins (1–2 weeks) and "long-term" rebuilds
- Avoid generic advice — every recommendation must tie to the data.`,

  daily_motivation: `You are CATalyst AI, a motivational coach for CAT aspirants.
Deliver:
1. A powerful 2–3 sentence message tailored to CAT pressure and long preparation cycles
2. A realistic quote from a topper, IIM alumnus, or thought leader (attribute properly)
3. One micro-habit for today that takes under 10 minutes but compounds over time
Keep it authentic, high-energy, and CAT-specific — not generic life advice.`,
};

// ── Context types ─────────────────────────────────────────────────────────────

export interface HistoryMessage {
  role: "user" | "ai";
  content: string;
}

export interface UserProfileContext {
  name?: string;
  targetPercentile?: number;
  weaknesses?: string[];
  plan?: string;
  exams?: string[];
  studyHours?: string;
}

type ChatRole = "system" | "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

// ── Context builders ──────────────────────────────────────────────────────────

const MAX_HISTORY_CHARS = 2800;
const MAX_MSG_CHARS     = 480;

function buildProfileLine(profile: UserProfileContext): string {
  const parts: string[] = [];
  if (profile.name)             parts.push(`Student: ${profile.name}`);
  if (profile.targetPercentile) parts.push(`Target: ${profile.targetPercentile}th percentile`);
  if (profile.weaknesses?.length) parts.push(`Weak areas: ${profile.weaknesses.slice(0, 4).join(", ")}`);
  if (profile.plan)             parts.push(`Plan: ${profile.plan}`);
  if (profile.studyHours)       parts.push(`Study: ${profile.studyHours}h/day`);
  return parts.length ? `[Context — ${parts.join(" | ")}]` : "";
}

function truncateHistory(history: HistoryMessage[]): HistoryMessage[] {
  const recent = history.slice(-8).map((m) => ({
    role: m.role,
    content: m.content.length > MAX_MSG_CHARS
      ? m.content.slice(0, MAX_MSG_CHARS) + "…"
      : m.content,
  }));
  // Trim from front if total chars exceed limit
  let total = recent.reduce((s, m) => s + m.content.length, 0);
  while (total > MAX_HISTORY_CHARS && recent.length > 1) {
    const removed = recent.shift();
    total -= removed?.content.length ?? 0;
  }
  return recent;
}

// ── Prompt builders ───────────────────────────────────────────────────────────

export interface PromptOptions {
  history?: HistoryMessage[];
  userProfile?: UserProfileContext;
}

/**
 * Returns OpenAI-style messages array (for Groq / OpenRouter).
 * Injects conversation history as proper user/assistant turns.
 * Prepends a profile context line to the system prompt when available.
 */
export function buildMessages(
  feature: AIFeature,
  userPrompt: string,
  options?: PromptOptions
): ChatMessage[] {
  const profileLine = options?.userProfile
    ? buildProfileLine(options.userProfile)
    : "";

  const systemContent = profileLine
    ? `${SYSTEM_PROMPTS[feature]}\n\n${profileLine}`
    : SYSTEM_PROMPTS[feature];

  const messages: ChatMessage[] = [{ role: "system", content: systemContent }];

  if (options?.history?.length) {
    const safe = truncateHistory(options.history);
    for (const m of safe) {
      messages.push({ role: m.role === "user" ? "user" : "assistant", content: m.content });
    }
  }

  messages.push({ role: "user", content: userPrompt });
  return messages;
}

/**
 * Returns a single combined prompt string (for Gemini / Ollama).
 * Prepends history as a labelled block when available.
 */
export function buildSinglePrompt(
  feature: AIFeature,
  userPrompt: string,
  options?: PromptOptions
): string {
  const profileLine = options?.userProfile ? buildProfileLine(options.userProfile) : "";
  const system = profileLine
    ? `${SYSTEM_PROMPTS[feature]}\n\n${profileLine}`
    : SYSTEM_PROMPTS[feature];

  if (options?.history?.length) {
    const safe = truncateHistory(options.history);
    const historyBlock = safe
      .map((m) => `[${m.role === "user" ? "Student" : "AI"}]: ${m.content}`)
      .join("\n");
    return `${system}\n\n--- Conversation so far ---\n${historyBlock}\n---\n\n${userPrompt}`;
  }

  return `${system}\n\n---\n\n${userPrompt}`;
}
