export type VideoCategory = "QA" | "VARC" | "DILR" | "Strategy";
export type VideoAccess = "free" | "pro";

export interface VideoLesson {
  id: string;
  youtubeId: string | null;
  title: string;
  instructor: string;
  description: string;
  duration: string;
  views: string;
  rating: number;
  category: VideoCategory;
  access: VideoAccess;
  tags: string[];
  featured: boolean;
  order: number;
  /** Custom toast message shown when +XP is awarded at 70% watch completion */
  xpToastMessage?: string;
}

export const CATEGORY_COLORS: Record<VideoCategory, string> = {
  Strategy: "bg-yellow-500/20 text-yellow-400 border-yellow-500/20",
  QA:       "bg-blue-500/20 text-blue-400 border-blue-500/20",
  VARC:     "bg-purple-500/20 text-purple-400 border-purple-500/20",
  DILR:     "bg-green-500/20 text-green-400 border-green-500/20",
};

export function ytThumbnail(youtubeId: string, quality: "hqdefault" | "maxresdefault" = "maxresdefault"): string {
  return `https://img.youtube.com/vi/${youtubeId}/${quality}.jpg`;
}

export const DEFAULT_VIDEOS: VideoLesson[] = [
  {
    id: "v1",
    youtubeId: "lSIyjEf267E",
    title: "CAT 2024 Strategy: How to Score 99+ Percentile",
    instructor: "Prof. Arun Kumar",
    description:
      "Master the complete CAT 2024 preparation strategy to score 99+ percentile. Learn topper techniques for QA, VARC, and DILR, mock test analysis, time management, accuracy improvement, revision planning, and AI-powered preparation methods.",
    duration: "52:34",
    views: "82K",
    rating: 4.9,
    category: "Strategy",
    access: "free",
    tags: ["CAT 2024", "CAT Strategy", "MBA Preparation", "IIM", "CAT Percentile", "DILR", "VARC", "Quantitative Aptitude", "CATalyst AI"],
    featured: true,
    order: 0,
  },
  {
    id: "v2",
    youtubeId: "45Kw2LC0HFE",
    title: "Number System: Complete Masterclass + Tricks",
    instructor: "Rajiv Mehta",
    description:
      "Master CAT Number Systems from basics to advanced tricks including divisibility rules, HCF & LCM, remainders, modular arithmetic, cyclicity, unit digit concepts, prime numbers, and CAT-level shortcut techniques. Designed for aspirants targeting 99+ percentile with speed-building methods and exam-oriented problem solving.",
    duration: "1:24:15",
    views: "45K",
    rating: 4.8,
    category: "QA",
    access: "free",
    tags: [
      "CAT", "QA", "Number System", "Quant", "Remainder Theorem",
      "HCF", "LCM", "Modular Arithmetic", "CAT 2024", "CAT Preparation",
    ],
    featured: false,
    order: 1,
    xpToastMessage: "🔥 Number mastery unlocked! Keep pushing toward 99+ percentile.",
  },
  {
    id: "v3",
    youtubeId: null,
    title: "RC Mastery: Active Reading for CAT VARC",
    instructor: "Dr. Priya Nair",
    description: "Active reading strategies and inference techniques for Reading Comprehension passages in CAT VARC.",
    duration: "48:22",
    views: "38K",
    rating: 4.9,
    category: "VARC",
    access: "pro",
    tags: ["RC", "Reading Comprehension", "VARC", "CAT"],
    featured: false,
    order: 2,
  },
  {
    id: "v4",
    youtubeId: null,
    title: "DILR: Seating Arrangement Deep Dive",
    instructor: "Vikram Sharma",
    description: "Master all variants of seating arrangement questions — linear, circular, floor-based — with systematic approaches.",
    duration: "1:12:08",
    views: "29K",
    rating: 4.7,
    category: "DILR",
    access: "pro",
    tags: ["DILR", "Seating Arrangement", "Logic", "CAT"],
    featured: false,
    order: 3,
  },
  {
    id: "v5",
    youtubeId: null,
    title: "Algebra Shortcuts You Never Knew Existed",
    instructor: "Rajiv Mehta",
    description: "Speed-up your algebra solving with non-obvious shortcuts and pattern recognition techniques.",
    duration: "38:50",
    views: "24K",
    rating: 4.8,
    category: "QA",
    access: "pro",
    tags: ["Algebra", "QA", "Shortcuts", "CAT Math"],
    featured: false,
    order: 4,
  },
  {
    id: "v6",
    youtubeId: null,
    title: "Para Jumbles: Framework & Strategy",
    instructor: "Dr. Priya Nair",
    description: "A reliable 3-step framework to solve Para Jumble questions with high accuracy in CAT VARC.",
    duration: "35:15",
    views: "18K",
    rating: 4.7,
    category: "VARC",
    access: "pro",
    tags: ["Para Jumbles", "VARC", "CAT", "Sentence Ordering"],
    featured: false,
    order: 5,
  },
  {
    id: "v7",
    youtubeId: null,
    title: "Data Interpretation: Advanced Caselet Solving",
    instructor: "Vikram Sharma",
    description: "Crack complex caselet DI sets with structured tabulation and approximation techniques.",
    duration: "55:40",
    views: "15K",
    rating: 4.8,
    category: "DILR",
    access: "pro",
    tags: ["DI", "Data Interpretation", "Caselet", "DILR"],
    featured: false,
    order: 6,
  },
  {
    id: "v8",
    youtubeId: null,
    title: "Geometry Shortcuts & CAT PYQs",
    instructor: "Prof. Arun Kumar",
    description: "High-yield geometry shortcuts with walkthroughs of previous year CAT questions from 2018–2024.",
    duration: "1:02:18",
    views: "21K",
    rating: 4.9,
    category: "QA",
    access: "pro",
    tags: ["Geometry", "QA", "PYQ", "CAT Math"],
    featured: false,
    order: 7,
  },
];
