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

/**
 * Resolve active video list from defaults + optional admin overrides.
 * By default soft-deleted videos are excluded.
 */
export function resolveVideos(
  defaultVideos: VideoLesson[],
  adminVideos: VideoLesson[] | null,
  options?: { includeDeleted?: boolean }
): VideoLesson[] {
  const source = adminVideos ?? defaultVideos;

  // Backfill legacy/persisted admin overrides with updated default metadata.
  const defaultsById = new Map(defaultVideos.map((video) => [video.id, video] as const));
  const normalized = source.map((video) => {
    const base = defaultsById.get(video.id);
    if (!base) return video;

    return {
      ...base,
      ...video,
      youtubeId: video.youtubeId ?? base.youtubeId,
      description: video.description?.trim() ? video.description : base.description,
      tags: video.tags?.length ? video.tags : base.tags,
      aiSummary: video.aiSummary ?? base.aiSummary,
      keyTakeaways: video.keyTakeaways?.length ? video.keyTakeaways : base.keyTakeaways,
      quiz: video.quiz?.length ? video.quiz : base.quiz,
      xpToastMessage: video.xpToastMessage ?? base.xpToastMessage,
    };
  });

  if (options?.includeDeleted) return normalized;
  return normalized.filter((v) => v.deletedAt === null);
}

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
    youtubeId: "TEeeEplbvQ4",
    title: "DILR: Seating Arrangement Deep Dive",
    instructor: "Vikram Sharma",
    description:
      "Master CAT DILR Seating Arrangement sets with a complete deep-dive into linear arrangements, circular arrangements, double-row seating, directional logic, conditional clues, contradiction handling, and topper-level diagram techniques. Learn how to identify anchor clues, reduce possibilities, avoid common traps, and solve complex seating arrangement puzzles faster with high accuracy.",
    duration: "1:12:08",
    views: "29K",
    rating: 4.7,
    category: "DILR",
    access: "pro",
    tags: [
      "CAT DILR",
      "Seating Arrangement",
      "Logical Reasoning",
      "Circular Arrangement",
      "Linear Arrangement",
      "Puzzle Solving",
      "CAT 2024",
      "MBA Preparation",
      "DILR Masterclass",
      "99 Percentile",
    ],
    featured: false,
    order: 3,
    status: "published",
    deletedAt: null,
    xpToastMessage: "🧠 DILR puzzle mastery unlocked! Your logical reasoning power is evolving.",
    aiSummary:
      "This lesson teaches a structured, high-accuracy approach to CAT DILR seating arrangement problems. Students learn how to decode clues, build clean diagrams, eliminate wrong possibilities, and solve complex arrangement sets under exam pressure.",
    keyTakeaways: [
      "Linear seating arrangement strategy",
      "Circular seating shortcut methods",
      "Double-row facing arrangement logic",
      "Anchor clue identification",
      "Possibility reduction framework",
      "Contradiction-based elimination",
      "Time management for DILR sets",
      "CAT-level puzzle solving approach",
      "Diagram-based reasoning",
      "Accuracy improvement techniques",
    ],
    quiz: [
      {
        id: "v4q1",
        question: "In a linear arrangement with 8 people, if A is third from the left and B is immediately right of A, B's position is:",
        options: ["Second from left", "Fourth from left", "Third from right", "Fifth from left"],
        correctIndex: 1,
        explanation: "If A is third from the left, the immediately right seat is fourth from the left.",
      },
      {
        id: "v4q2",
        question: "In circular seating problems, why is one person's position often fixed first?",
        options: [
          "To reduce rotationally equivalent duplicate cases",
          "Because CAT requires alphabetical order",
          "To avoid drawing a circle",
          "It is only needed for even-number groups",
        ],
        correctIndex: 0,
        explanation: "Circular arrangements are equivalent under rotation; fixing one person removes redundant duplicate arrangements.",
      },
      {
        id: "v4q3",
        question: "In double-row seating where one row faces north and the other south, what is the key first step?",
        options: [
          "Assume everyone faces north",
          "Mark row orientation and opposite-facing direction before placing clues",
          "Start by placing the shortest names first",
          "Ignore facing direction until the end",
        ],
        correctIndex: 1,
        explanation: "Double-row logic depends on facing direction; row orientation must be fixed first to interpret left/right correctly.",
      },
      {
        id: "v4q4",
        question: "What best describes an anchor clue in seating arrangement sets?",
        options: [
          "A clue with no positional value",
          "A clue that fixes an absolute/near-absolute position and helps chain other clues",
          "A clue that only applies in circular puzzles",
          "A clue used only for elimination at the end",
        ],
        correctIndex: 1,
        explanation: "Anchor clues lock a position or relationship early, creating a base to attach other conditional clues quickly.",
      },
      {
        id: "v4q5",
        question: "If a placement creates contradiction with one clue in a multi-clue puzzle, the best action is:",
        options: [
          "Keep it and adjust all other clues",
          "Discard that case branch immediately and backtrack",
          "Ignore the conflicting clue",
          "Restart the full set from scratch",
        ],
        correctIndex: 1,
        explanation: "Contradiction-based elimination is core to DILR speed: prune impossible branches immediately and proceed with viable cases.",
      },
    ],
  },
  {
    id: "v5",
    youtubeId: "VkbKwW3ifb0",
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
    youtubeId: "rgVeDeBcdqU",
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
    youtubeId: "iMcK9-ksrdU",
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
    youtubeId: "RacSefBiUwk",
    title: "Geometry Shortcuts & CAT PYQs",
    instructor: "Rajiv Mehta",
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
  {
    id: "v9",
    youtubeId: "NlUcmtZXlsg",
    title: "RC for Non Readers",
    instructor: "Dr. Priya Nair",
    description:
      "Struggling with Reading Comprehension even though you don't read regularly? This session is built for non-readers who need to crack CAT VARC. Learn proven techniques to understand dense RC passages quickly, identify the main idea without full immersion, and answer inference and tone questions accurately — even with minimal reading habit. Includes passage dissection strategies, shortcut annotation methods, and high-accuracy frameworks used by toppers who started as non-readers.",
    duration: "44:30",
    views: "8K",
    rating: 4.8,
    category: "VARC",
    access: "pro",
    tags: [
      "RC", "Reading Comprehension", "VARC", "CAT", "Non Reader",
      "CAT 2024", "RC Strategy", "CAT VARC", "RC Shortcuts", "MBA Preparation",
    ],
    featured: false,
    order: 9,
    status: "published",
    deletedAt: null,
    xpToastMessage: "📖 RC breakthrough unlocked! Non-readers can conquer CAT VARC too.",
    aiSummary:
      "This lesson teaches non-readers how to approach CAT Reading Comprehension with confidence. Covers quick-passage dissection, inference resolution without deep reading, tone identification, and shortcut annotation methods designed for aspirants who are building their reading habit from scratch.",
    keyTakeaways: [
      "Skim for structure first: intro → body → conclusion — understand the skeleton before details",
      "First and last sentence of each paragraph carry ~80% of the paragraph meaning",
      "Tone markers (fortunately, alarmingly, ironically) are your fast-track to author opinion",
      "For inference questions: the answer must follow logically from the text, not from common sense",
      "Eliminate options with extreme language (always, never, only) — CAT passages rarely make absolutes",
      "Practice with 2 editorials per day: The Hindu, Economist, or The Atlantic",
      "Annotation shortcut: M (main idea), T (tone), E (example) — 3 symbols is all you need",
    ],
    quiz: [
      {
        id: "v9q1",
        question: "Which part of each RC paragraph carries the most critical information for a non-reader using shortcuts?",
        options: [
          "The middle sentences with detailed examples",
          "The first and last sentences",
          "Any sentence containing numbers or statistics",
          "Every third sentence",
        ],
        correctIndex: 1,
        explanation: "The first sentence introduces the paragraph topic and the last sentence summarises or transitions. For non-readers, reading just these two sentences per paragraph recovers ~80% of the paragraph meaning while saving significant time.",
      },
      {
        id: "v9q2",
        question: "A CAT RC passage uses the phrase 'Alarmingly, this trend has accelerated since 2010.' The author's most likely tone is:",
        options: ["Celebratory", "Neutral", "Concerned or critical", "Confused"],
        correctIndex: 2,
        explanation: "'Alarmingly' is a tone marker signalling concern or disapproval. Spotting such words instantly identifies the author's stance — a key shortcut for non-readers who cannot afford to re-read the full passage.",
      },
    ],
  },
  {
    id: "advanced-qa-masterclass",
    youtubeId: "5-vFkufYrVI",
    title: "Advanced Quantitative Aptitude Masterclass",
    instructor: "Rajiv Mehta",
    description:
      "Master advanced CAT Quant concepts, shortcuts, high-speed calculations, and exam-winning strategies designed for 99+ percentile aspirants. This elite-level masterclass covers the most challenging Quant topics tested in CAT, including advanced number theory, algebraic identities, geometry theorems, and speed-maths techniques that top scorers use to dominate the QA section.",
    duration: "58:45",
    views: "32K",
    rating: 4.9,
    category: "QA",
    access: "elite",
    tags: [
      "CAT Quant", "Advanced QA", "Quantitative Aptitude", "CAT Math",
      "Speed Maths", "High Calculations", "99 Percentile", "CAT 2024",
      "Rajiv Mehta", "Elite Quant",
    ],
    featured: true,
    order: 8,
    status: "published",
    deletedAt: null,
    xpToastMessage: "⚡ Elite Quant mastery unlocked! You're on track for 99+ percentile.",
    aiSummary:
      "An elite-level deep-dive into advanced CAT Quantitative Aptitude covering high-speed calculation techniques, advanced number theory, algebraic shortcuts, and exam-winning strategies. Built specifically for aspirants targeting 99+ percentile in the QA section.",
    keyTakeaways: [
      "Master Vedic Maths shortcuts to solve calculations 3× faster under exam pressure",
      "Advanced remainder theorem: apply Euler's theorem for large-exponent mod problems",
      "Identify question archetypes instantly — map to the fastest known solving pattern",
      "High-accuracy approach: skip-and-return strategy for unfamiliar question types",
      "Algebra identity toolkit: (a+b)², (a−b)³, AM-GM inequality — commit all to memory",
      "Geometry in 60 seconds: property-first approach for circles, triangles, and polygons",
      "Time splits: aim for 40 attempts in 40 min with 88%+ accuracy for 99+ percentile",
    ],
    quiz: [
      {
        id: "aqmq1",
        question: "Using the AM-GM inequality, the minimum value of x + 1/x for x > 0 is:",
        options: ["0", "1", "2", "0.5"],
        correctIndex: 2,
        explanation: "By AM-GM: x + 1/x ≥ 2√(x · 1/x) = 2. Equality holds when x = 1. This is a classic CAT trap — the minimum is 2, not 0.",
      },
      {
        id: "aqmq2",
        question: "What is the last two digits of 7^100?",
        options: ["01", "07", "49", "43"],
        correctIndex: 0,
        explanation: "7^4 = 2401, so 7^4 ≡ 01 (mod 100). Since 100 = 4×25, 7^100 = (7^4)^25 ≡ 01^25 = 01 (mod 100). Last two digits are 01.",
      },
      {
        id: "aqmq3",
        question: "For a CAT QA aspirant targeting 99+ percentile, the recommended accuracy rate while attempting 40 questions is:",
        options: ["60%", "70%", "88%+", "100%"],
        correctIndex: 2,
        explanation: "At 88%+ accuracy with 40 attempts, you achieve roughly 35 correct answers. With CAT's +3/−1 marking, that translates to a raw score of ~99, which historically aligns with the 99+ percentile threshold in QA.",
      },
    ],
  },
];
