import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function getPercentileColor(percentile: number): string {
  if (percentile >= 99) return "text-yellow-400";
  if (percentile >= 95) return "text-green-400";
  if (percentile >= 90) return "text-blue-400";
  if (percentile >= 80) return "text-cyan-400";
  return "text-slate-400";
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case "beginner": return "text-green-400 bg-green-400/10";
    case "intermediate": return "text-yellow-400 bg-yellow-400/10";
    case "advanced": return "text-orange-400 bg-orange-400/10";
    case "cat level": return "text-red-400 bg-red-400/10";
    default: return "text-slate-400 bg-slate-400/10";
  }
}

export function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return "#00ff88";
  if (accuracy >= 60) return "#00d4ff";
  if (accuracy >= 40) return "#f59e0b";
  return "#ef4444";
}

export function calculateXP(questionsAttempted: number, correctAnswers: number, timeSaved: number): number {
  return (correctAnswers * 10) + Math.floor(timeSaved / 30) * 2 + questionsAttempted;
}

export const LEVELS = [
  { level: 1, name: "Aspirant", minXP: 0, maxXP: 500 },
  { level: 2, name: "Scholar", minXP: 500, maxXP: 1500 },
  { level: 3, name: "Strategist", minXP: 1500, maxXP: 3000 },
  { level: 4, name: "Champion", minXP: 3000, maxXP: 6000 },
  { level: 5, name: "Elite", minXP: 6000, maxXP: 12000 },
  { level: 6, name: "Legend", minXP: 12000, maxXP: 25000 },
  { level: 7, name: "IIM Bound", minXP: 25000, maxXP: Infinity },
];

export function getLevel(xp: number) {
  return LEVELS.find((l) => xp >= l.minXP && xp < l.maxXP) || LEVELS[LEVELS.length - 1];
}

export const MOTIVATIONAL_QUOTES = [
  { quote: "The road to IIM is paved with consistent practice.", author: "CAT 99.8 Percentiler" },
  { quote: "Your percentile is a reflection of your discipline, not your intelligence.", author: "IIM Ahmedabad Alum" },
  { quote: "Every question you solve today is a step closer to your dream college.", author: "FMS Delhi Topper" },
  { quote: "Don't prepare to attempt. Prepare to ace.", author: "XLRI Graduate" },
  { quote: "Consistency beats talent when talent doesn't work consistently.", author: "IIM Bangalore Topper" },
  { quote: "The test doesn't measure what you know. It measures how well you perform under pressure.", author: "CAT Coach" },
  { quote: "Your future MBA starts with the choice you make today.", author: "IIM Calcutta Alum" },
];

export function getRandomQuote() {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}

export const COLLEGES = [
  { name: "IIM Ahmedabad", cutoff: 99.5, tier: 1, logo: "IIMA" },
  { name: "IIM Bangalore", cutoff: 99.0, tier: 1, logo: "IIMB" },
  { name: "IIM Calcutta", cutoff: 98.5, tier: 1, logo: "IIMC" },
  { name: "IIM Lucknow", cutoff: 97.0, tier: 1, logo: "IIML" },
  { name: "IIM Kozhikode", cutoff: 95.0, tier: 1, logo: "IIMK" },
  { name: "IIM Indore", cutoff: 94.0, tier: 1, logo: "IIMI" },
  { name: "FMS Delhi", cutoff: 98.0, tier: 1, logo: "FMS" },
  { name: "SPJIMR Mumbai", cutoff: 95.0, tier: 1, logo: "SPJ" },
  { name: "XLRI Jamshedpur", cutoff: 95.0, tier: 1, logo: "XLRI" },
  { name: "MDI Gurgaon", cutoff: 93.0, tier: 2, logo: "MDI" },
  { name: "NITIE Mumbai", cutoff: 92.0, tier: 2, logo: "NITIE" },
  { name: "IMT Ghaziabad", cutoff: 90.0, tier: 2, logo: "IMT" },
  { name: "IIM Shillong", cutoff: 90.0, tier: 2, logo: "IIMS" },
  { name: "FORE School", cutoff: 85.0, tier: 3, logo: "FORE" },
  { name: "Great Lakes", cutoff: 80.0, tier: 3, logo: "GL" },
];
