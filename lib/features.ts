export type Plan = "free" | "pro" | "elite";

export type Feature =
  // Core
  | "DASHBOARD"
  | "PRACTICE_BASIC"
  | "MOCK_BASIC"
  | "DAILY_STREAK"
  | "LEADERBOARD_VIEW"
  // Pro
  | "PRACTICE_UNLIMITED"
  | "MOCK_UNLIMITED"
  | "AI_DOUBT_SOLVER"
  | "STUDY_PLANNER"
  | "VIDEO_LIBRARY"
  | "GD_PI_PREP"
  | "COLLEGE_PREDICTOR"
  | "PERCENTILE_PREDICTOR"
  | "ANALYTICS_DEEP"
  | "ADAPTIVE_PLAN"
  | "LEADERBOARD_COMPETE"
  // Elite
  | "AI_MENTOR"
  | "VOICE_TUTOR"
  | "MOCK_INTERVIEW"
  | "LIVE_SESSIONS"
  | "SOP_BUILDER"
  | "PERSONAL_COACH"
  | "MBA_PREDICTOR"
  | "DAILY_ROADMAP";

const PLAN_FEATURES: Record<Plan, Set<Feature>> = {
  free: new Set<Feature>([
    "DASHBOARD",
    "PRACTICE_BASIC",
    "MOCK_BASIC",
    "DAILY_STREAK",
    "LEADERBOARD_VIEW",
  ]),
  pro: new Set<Feature>([
    "DASHBOARD",
    "PRACTICE_BASIC",
    "PRACTICE_UNLIMITED",
    "MOCK_BASIC",
    "MOCK_UNLIMITED",
    "DAILY_STREAK",
    "LEADERBOARD_VIEW",
    "LEADERBOARD_COMPETE",
    "AI_DOUBT_SOLVER",
    "STUDY_PLANNER",
    "VIDEO_LIBRARY",
    "GD_PI_PREP",
    "COLLEGE_PREDICTOR",
    "PERCENTILE_PREDICTOR",
    "ANALYTICS_DEEP",
    "ADAPTIVE_PLAN",
  ]),
  elite: new Set<Feature>([
    "DASHBOARD",
    "PRACTICE_BASIC",
    "PRACTICE_UNLIMITED",
    "MOCK_BASIC",
    "MOCK_UNLIMITED",
    "DAILY_STREAK",
    "LEADERBOARD_VIEW",
    "LEADERBOARD_COMPETE",
    "AI_DOUBT_SOLVER",
    "STUDY_PLANNER",
    "VIDEO_LIBRARY",
    "GD_PI_PREP",
    "COLLEGE_PREDICTOR",
    "PERCENTILE_PREDICTOR",
    "ANALYTICS_DEEP",
    "ADAPTIVE_PLAN",
    "AI_MENTOR",
    "VOICE_TUTOR",
    "MOCK_INTERVIEW",
    "LIVE_SESSIONS",
    "SOP_BUILDER",
    "PERSONAL_COACH",
    "MBA_PREDICTOR",
    "DAILY_ROADMAP",
  ]),
};

export function canAccess(plan: Plan | null | undefined, feature: Feature): boolean {
  if (!plan) return false;
  return PLAN_FEATURES[plan]?.has(feature) ?? false;
}

export function getRequiredPlan(feature: Feature): Plan {
  if (PLAN_FEATURES.free.has(feature)) return "free";
  if (PLAN_FEATURES.pro.has(feature)) return "pro";
  return "elite";
}

export const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  pro: "Pro",
  elite: "Elite",
};

export const PLAN_COLORS: Record<Plan, string> = {
  free: "text-white/60",
  pro: "text-neon-blue",
  elite: "text-neon-purple",
};

export const PLAN_BADGE_COLORS: Record<Plan, string> = {
  free: "bg-white/10 text-white/60 border-white/10",
  pro: "bg-neon-blue/20 text-neon-blue border-neon-blue/30",
  elite: "bg-neon-purple/20 text-neon-purple border-neon-purple/30",
};
