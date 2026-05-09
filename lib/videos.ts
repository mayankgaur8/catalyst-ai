export type VideoCategory = "QA" | "VARC" | "DILR" | "Strategy";
export type VideoAccess = "free" | "pro" | "elite";
export type VideoStatus = "published" | "draft";

export interface VideoQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

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
  status: VideoStatus;
  deletedAt: string | null;
  /** AI-generated summary */
  aiSummary?: string;
  /** Key takeaways list */
  keyTakeaways?: string[];
  /** Quiz questions shown post-video */
  quiz?: VideoQuizQuestion[];
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

export const PLAN_ACCESS_ORDER: VideoAccess[] = ["free", "pro", "elite"];

/** Returns true if userPlan can access a video with requiredAccess */
export function canAccessVideo(userPlan: string | null | undefined, requiredAccess: VideoAccess, isAdmin = false): boolean {
  if (isAdmin) return true;
  if (!userPlan) return requiredAccess === "free";
  const userIdx = PLAN_ACCESS_ORDER.indexOf(userPlan as VideoAccess);
  const reqIdx  = PLAN_ACCESS_ORDER.indexOf(requiredAccess);
  return userIdx >= reqIdx;
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
    status: "published",
    deletedAt: null,
    aiSummary: "This masterclass covers the end-to-end CAT preparation strategy for 99+ percentile. Key areas: time management, section-wise approach, mock analysis, and last-month revision plan.",
    keyTakeaways: [
      "Attempt 40–45 questions in QA with 80%+ accuracy over raw attempts",
      "Read 2–3 editorials daily to improve RC speed and comprehension",
      "Analyze mocks within 24 hours; identify error patterns, not just scores",
      "Maintain a 'mistake journal' and review it weekly",
      "Target slot-specific cut-offs, not an aggregate of all IIMs",
    ],
    quiz: [
      {
        id: "v1q1",
        question: "What is the recommended number of mocks to take before CAT?",
        options: ["5–10", "15–20", "30+", "It doesn't matter"],
        correctIndex: 2,
        explanation: "Toppers typically take 30+ full mocks to build exam stamina, identify patterns, and fine-tune time management.",
      },
      {
        id: "v1q2",
        question: "What should you prioritize immediately after taking a mock test?",
        options: ["Take another mock immediately", "Rest for two days", "Deep analysis within 24 hours", "Only review wrong answers"],
        correctIndex: 2,
        explanation: "Analyzing a mock within 24 hours — including correct answers you guessed — is more valuable than taking more mocks without reflection.",
      },
    ],
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
    status: "published",
    deletedAt: null,
    xpToastMessage: "🔥 Number mastery unlocked! Keep pushing toward 99+ percentile.",
    aiSummary: "Comprehensive coverage of Number System for CAT — from divisibility rules to advanced remainder theorem techniques. Essential for QA section dominance.",
    keyTakeaways: [
      "Divisibility rules for 2–13 must be memorised for speed",
      "Remainder theorem shortcut: use cyclicity of last digits for large powers",
      "HCF × LCM = Product of two numbers (for exactly 2 numbers only)",
      "Sum of first N natural numbers = N(N+1)/2",
      "Practice at least 3 PYQ sets from each sub-topic",
    ],
    quiz: [
      {
        id: "v2q1",
        question: "What is the remainder when 7^100 is divided by 50?",
        options: ["1", "7", "49", "43"],
        correctIndex: 0,
        explanation: "7^4 = 2401 ≡ 1 (mod 50). Since 100 = 4×25, 7^100 ≡ 1^25 = 1 (mod 50).",
      },
      {
        id: "v2q2",
        question: "How many factors does 360 have?",
        options: ["18", "24", "12", "36"],
        correctIndex: 1,
        explanation: "360 = 2³ × 3² × 5¹. Number of factors = (3+1)(2+1)(1+1) = 4×3×2 = 24.",
      },
    ],
  },
  {
    id: "v3",
    youtubeId: "nhxze00LqPU",
    title: "RC Mastery: Active Reading for CAT VARC",
    instructor: "Dr. Priya Nair",
    description:
      "Master the art of Reading Comprehension for CAT VARC with advanced active-reading techniques used by 99+ percentile scorers. Learn how to improve reading speed, identify author tone, eliminate trap options, understand inference-based questions, and solve RC passages under strict time pressure. Covers paragraph mapping, retention strategies, critical reasoning patterns, and high-scoring VARC frameworks with real CAT-level examples and practice techniques.",
    duration: "48:22",
    views: "38K",
    rating: 4.9,
    category: "VARC",
    access: "pro",
    tags: [
      "CAT VARC", "Reading Comprehension", "RC Mastery", "Active Reading",
      "CAT 2024", "VARC Strategy", "99 Percentile", "Critical Reasoning",
      "CAT Preparation", "Reading Speed",
    ],
    featured: false,
    order: 2,
    status: "published",
    deletedAt: null,
    xpToastMessage: "📚 VARC mastery unlocked! Your reading speed and comprehension are leveling up.",
    aiSummary:
      "This session teaches a complete RC mastery framework for CAT aspirants aiming for 99+ percentile. Students will learn active reading methods, comprehension retention systems, elimination strategies, inference solving, and real exam passage analysis to maximize VARC accuracy and speed.",
    keyTakeaways: [
      "Active reading techniques for CAT RC: engage with each paragraph, don't just skim",
      "Identify author tone quickly using signal words (unfortunately, remarkably, alarmingly)",
      "Eliminate trap options with extreme language: 'always', 'never', 'only', 'all'",
      "Speed-read without losing comprehension — scan for structure, not every word",
      "Paragraph mapping: write a 3–5 word summary per paragraph as you read",
      "Inference questions: derive only what the passage implies, never use outside knowledge",
      "Time management: 3–4 min reading + 4–5 min for 5 questions = 7–8 min per passage",
      "Smart annotation: mark S (summary), T (tone), E (example) while reading",
      "Build reading stamina with daily editorial reading (Hindu, Economist, Atlantic)",
      "CAT toppers' framework: read purpose → map structure → predict answers before looking at options",
    ],
    quiz: [
      {
        id: "v3q1",
        question: "When a CAT RC author uses words like 'unfortunately', 'regrettably', and 'alarmingly', the most likely tone is:",
        options: ["Optimistic and hopeful", "Neutral and factual", "Critical or pessimistic", "Sarcastic and mocking"],
        correctIndex: 2,
        explanation: "Tone-marker words like 'unfortunately', 'regrettably', and 'alarmingly' signal that the author disapproves of or is troubled by the subject. Identifying these signal words instantly reveals tone without re-reading the passage.",
      },
      {
        id: "v3q2",
        question: "Which best describes an 'inference' question in CAT RC?",
        options: [
          "A question asking what the passage explicitly and directly states",
          "A question requiring you to conclude what must be true based on passage implications",
          "A question about the author's background or credentials",
          "A question that requires general knowledge about the topic",
        ],
        correctIndex: 1,
        explanation: "Inference questions test your ability to derive conclusions strongly implied by the text but not explicitly written. You should never use outside knowledge — if the passage doesn't support it, the answer is wrong.",
      },
      {
        id: "v3q3",
        question: "When eliminating RC answer choices in CAT, which type should you eliminate FIRST?",
        options: [
          "Options that partially rephrase something from the passage",
          "Options containing extreme language: 'always', 'never', 'only', 'all'",
          "Options that are longer than the others",
          "The first and last option in every question",
        ],
        correctIndex: 1,
        explanation: "Extreme language is a red flag in RC options. Academic and editorial passages rarely make absolute claims, so any option using 'always', 'never', 'only', or 'all' is almost always wrong unless the passage explicitly uses that language.",
      },
      {
        id: "v3q4",
        question: "Which active reading technique is MOST effective for locating information quickly during CAT RC?",
        options: [
          "Reading the entire passage twice before looking at questions",
          "Underlining every word that seems important",
          "Paragraph mapping — noting the main idea of each paragraph in 3–5 words",
          "Skipping the passage and going directly to answer options",
        ],
        correctIndex: 2,
        explanation: "Paragraph mapping means jotting a brief 3–5 word note per paragraph as you read. This creates a mental index of the passage, so when a question asks about a specific idea, you know exactly which paragraph to revisit — saving 30–60 seconds per passage.",
      },
      {
        id: "v3q5",
        question: "For a 500-word CAT RC passage with 5 questions, what is the recommended total time allocation?",
        options: ["3–4 minutes", "10–12 minutes", "7–8 minutes", "15+ minutes"],
        correctIndex: 2,
        explanation: "The optimal split is ~3–4 minutes for careful reading + ~4–5 minutes for 5 questions = 7–8 minutes total. Spending more risks not finishing the VARC section; spending less leads to comprehension errors that cost accuracy marks.",
      },
    ],
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
    status: "published",
    deletedAt: null,
    aiSummary: "Systematic methods for solving all seating arrangement variants. Includes grid-based tabulation, constraint propagation, and case elimination.",
    keyTakeaways: [
      "Always draw a rough table/grid before solving",
      "Start with the most constrained entity (fewest options)",
      "Circular arrangements: fix one element and arrange the rest",
      "Floor arrangements: treat each floor as a row in your grid",
      "Re-read constraints after placing each entity to catch contradictions early",
    ],
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
    status: "published",
    deletedAt: null,
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
    status: "published",
    deletedAt: null,
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
    access: "elite",
    tags: ["DI", "Data Interpretation", "Caselet", "DILR"],
    featured: false,
    order: 6,
    status: "published",
    deletedAt: null,
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
    access: "elite",
    tags: ["Geometry", "QA", "PYQ", "CAT Math"],
    featured: false,
    order: 7,
    status: "published",
    deletedAt: null,
  },
];
