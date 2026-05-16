// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type MistakeType =
  | "Conceptual Error"
  | "Calculation Mistake"
  | "Time Pressure"
  | "Misread Question"
  | "Guesswork"
  | "Poor Elimination";

export interface MistakeRecord {
  id: number;
  questionNum: number;
  section: "VARC" | "DILR" | "QA";
  topic: string;
  difficulty: string;
  questionText: string;
  options: string[];
  selectedIdx: number;
  correctIdx: number;
  mistakeType: MistakeType;
  conceptGap: string;
  shortcutMethod: string;
  aiExplanation: string;
  /** seconds spent on this question */
  timeSpent: number;
}

export interface SectionScore {
  section: "VARC" | "DILR" | "QA";
  score: number;
  total: number;
  percentile: number;
  correct: number;
  wrong: number;
  unattempted: number;
  /** minutes */
  timeSpent: number;
  timeAllotted: number;
}

export interface DifficultyPerformance {
  difficulty: "Easy" | "Medium" | "Hard" | "CAT Level";
  attempted: number;
  correct: number;
  accuracy: number;
}

export interface TopicAccuracy {
  topic: string;
  section: "VARC" | "DILR" | "QA";
  attempted: number;
  correct: number;
  accuracy: number;
}

export interface WeaknessEntry {
  topic: string;
  section: "VARC" | "DILR" | "QA";
  accuracy: number;
  /** minutes of exam time lost due to poor performance here */
  timeLoss: number;
  priority: "Critical" | "High" | "Medium";
  recommendedMock: string;
  recommendedRevision: string;
}

export interface RevisionItem {
  id: string;
  topic: string;
  section: "VARC" | "DILR" | "QA";
  wrongCount: number;
  priority: "P1" | "P2" | "P3";
  estimatedTime: string;
}

export interface PercentileRecord {
  mockName: string;
  shortName: string;
  date: string;
  percentile: number;
  accuracy: number;
}

export interface TimeAnalysisItem {
  questionNum: number;
  section: "VARC" | "DILR" | "QA";
  topic: string;
  timeSpent: number;
  idealTime: number;
  correct: boolean;
  status: "too-slow" | "too-fast-wrong" | "efficient";
}

export interface MentorReport {
  wentWell: string[];
  wentWrong: string[];
  nextActions: string[];
  nextMock: string;
  motivationalMessage: string;
}

export interface MockAnalysisData {
  testName: string;
  attemptDate: string;
  overallPercentile: number;
  totalScore: number;
  maxScore: number;
  overallAccuracy: number;
  correct: number;
  wrong: number;
  unattempted: number;
  totalQuestions: number;
  timeTaken: number;
  timeAllotted: number;
  sectionScores: SectionScore[];
  difficultyPerformance: DifficultyPerformance[];
  topicAccuracy: TopicAccuracy[];
  mistakes: MistakeRecord[];
  weaknesses: WeaknessEntry[];
  revisionQueue: RevisionItem[];
  percentileHistory: PercentileRecord[];
  timeAnalysis: TimeAnalysisItem[];
  mentorReport: MentorReport;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mistake type display config
// ─────────────────────────────────────────────────────────────────────────────

export const MISTAKE_TYPE_CONFIG: Record<MistakeType, { color: string; short: string }> = {
  "Conceptual Error":    { color: "bg-red-500/20 text-red-400 border-red-500/30",       short: "Conceptual" },
  "Calculation Mistake": { color: "bg-orange-500/20 text-orange-400 border-orange-500/30", short: "Calculation" },
  "Time Pressure":       { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", short: "Time Pressure" },
  "Misread Question":    { color: "bg-purple-500/20 text-purple-400 border-purple-500/30", short: "Misread" },
  "Guesswork":           { color: "bg-pink-500/20 text-pink-400 border-pink-500/30",     short: "Guesswork" },
  "Poor Elimination":    { color: "bg-blue-500/20 text-blue-400 border-blue-500/30",     short: "Elimination" },
};

export const PRIORITY_CONFIG = {
  Critical: { color: "bg-red-500/20 text-red-400 border-red-500/30",     dot: "bg-red-500" },
  High:     { color: "bg-orange-500/20 text-orange-400 border-orange-500/30", dot: "bg-orange-500" },
  Medium:   { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", dot: "bg-yellow-500" },
};

export const REVISION_PRIORITY_CONFIG = {
  P1: { color: "bg-red-500/20 text-red-400 border-red-500/25",    label: "P1 — Urgent" },
  P2: { color: "bg-orange-500/20 text-orange-400 border-orange-500/25", label: "P2 — Important" },
  P3: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/25", label: "P3 — Review" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Static mock analysis data  (realistic CAT mock result)
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_ANALYSIS_DATA: MockAnalysisData = {
  testName: "CAT Full Mock #2",
  attemptDate: "2026-05-14",
  overallPercentile: 89.2,
  totalScore: 132,
  maxScore: 198,
  overallAccuracy: 81,
  correct: 44,
  wrong: 9,
  unattempted: 13,
  totalQuestions: 66,
  timeTaken: 112,
  timeAllotted: 120,

  sectionScores: [
    { section: "VARC", score: 42, total: 72, percentile: 82, correct: 14, wrong: 3, unattempted: 7,  timeSpent: 38, timeAllotted: 40 },
    { section: "DILR", score: 36, total: 60, percentile: 72, correct: 12, wrong: 6, unattempted: 2,  timeSpent: 42, timeAllotted: 40 },
    { section: "QA",   score: 54, total: 66, percentile: 88, correct: 18, wrong: 0, unattempted: 4,  timeSpent: 32, timeAllotted: 40 },
  ],

  difficultyPerformance: [
    { difficulty: "Easy",      attempted: 14, correct: 13, accuracy: 93 },
    { difficulty: "Medium",    attempted: 26, correct: 20, accuracy: 77 },
    { difficulty: "Hard",      attempted: 15, correct:  9, accuracy: 60 },
    { difficulty: "CAT Level", attempted:  8, correct:  2, accuracy: 25 },
  ],

  topicAccuracy: [
    { topic: "Arithmetic",         section: "QA",   attempted: 8,  correct: 7,  accuracy: 88 },
    { topic: "Algebra",            section: "QA",   attempted: 6,  correct: 5,  accuracy: 83 },
    { topic: "Number System",      section: "QA",   attempted: 4,  correct: 4,  accuracy: 100 },
    { topic: "Geometry",           section: "QA",   attempted: 4,  correct: 2,  accuracy: 50 },
    { topic: "Reading Comprehension", section: "VARC", attempted: 12, correct: 10, accuracy: 83 },
    { topic: "Para Jumbles",       section: "VARC", attempted: 5,  correct: 3,  accuracy: 60 },
    { topic: "Para Summary",       section: "VARC", attempted: 5,  correct: 2,  accuracy: 40 },
    { topic: "Data Interpretation", section: "DILR", attempted: 8, correct: 7,  accuracy: 88 },
    { topic: "Seating Arrangement", section: "DILR", attempted: 8, correct: 4,  accuracy: 50 },
    { topic: "Games & Tournament", section: "DILR", attempted: 4,  correct: 1,  accuracy: 25 },
  ],

  mistakes: [
    {
      id: 1,
      questionNum: 8,
      section: "VARC",
      topic: "Para Summary",
      difficulty: "Medium",
      questionText: "Choose the best summary of the following paragraph:\n\"The emergence of artificial intelligence in creative domains has sparked debate among artists. While some view AI as a tool that democratises art creation, others argue it threatens the authenticity and emotional depth that human experience brings to artistic expression. The tension between technological advancement and artistic identity remains unresolved.\"",
      options: [
        "AI makes art creation accessible to everyone, eliminating the need for human artists.",
        "The role of AI in art creation is debated — seen as democratising by some, a threat to authentic human expression by others.",
        "Human artists are being replaced by AI, causing a crisis in the art world.",
        "Technological advancement and artistic identity are complementary forces.",
      ],
      selectedIdx: 0,
      correctIdx: 1,
      mistakeType: "Misread Question",
      conceptGap: "Para Summary requires capturing the central tension, not a single viewpoint. The paragraph presents a debate — both sides must appear in the answer.",
      shortcutMethod: "Look for the option that reflects ALL key ideas (democratisation + authenticity threat + unresolved tension). Eliminate extreme options that state only one side as fact.",
      aiExplanation: "Option A is a distortion — the passage never says AI eliminates the need for human artists. Option B correctly captures both perspectives and the unresolved debate, matching the paragraph's balanced, nuanced tone. Always check if your chosen option is supported by every sentence in the paragraph.",
      timeSpent: 95,
    },
    {
      id: 2,
      questionNum: 15,
      section: "VARC",
      topic: "Para Jumbles",
      difficulty: "Hard",
      questionText: "Arrange the following sentences in a logical order:\nP: This led to a fundamental rethinking of economic policy across developed nations.\nQ: The 2008 financial crisis exposed deep structural flaws in deregulated markets.\nR: Keynesian stimulus, long dismissed, made a dramatic return to mainstream debate.\nS: Governments that had championed free markets found themselves nationalising banks.",
      options: ["QPSR", "QSPR", "PQSR", "SQRP"],
      selectedIdx: 2,
      correctIdx: 1,
      mistakeType: "Poor Elimination",
      conceptGap: "Para Jumbles: identify the mandatory first sentence (introductory, no pronoun opener, no connective). Q introduces the crisis → S shows the immediate reaction → P is the consequence → R is the ideological shift.",
      shortcutMethod: "Step 1: Find the opener (no pronoun, no connector). Q is the clear opener — it introduces the crisis. Step 2: Find mandatory pairs. S follows Q (banks were nationalised in response). Step 3: P follows S (consequence of S). R is the conclusion.",
      aiExplanation: "QSPR is the correct order. Q introduces the 2008 crisis. S shows the immediate government reaction (nationalising banks). P describes the consequence of that reaction (policy rethinking). R concludes with the ideological shift (Keynesian return). Option PQSR fails because P cannot open — it uses 'This led to…' which requires a preceding sentence.",
      timeSpent: 145,
    },
    {
      id: 3,
      questionNum: 23,
      section: "DILR",
      topic: "Seating Arrangement",
      difficulty: "Hard",
      questionText: "In a circular arrangement of 8 people (A–H), A sits two places to the right of E. B sits immediately to the left of D. C and F are not adjacent. G sits opposite H. Who sits immediately to the right of A?",
      options: ["B", "C", "F", "G"],
      selectedIdx: 3,
      correctIdx: 2,
      mistakeType: "Conceptual Error",
      conceptGap: "In circular arrangements, 'opposite' means diametrically opposite — 4 seats apart for 8 people. G opposite H fixes two positions. Then anchor A and E, and place B-D pair. Students often miscount 'two places to the right' in circular tables.",
      shortcutMethod: "Fix one person's position (say H at position 1, G at position 5). Place A at position 3, E at position 1 — wait, E is at position 5-2=3? Recount. Two places right of E means: E→next→next = A. Draw the circle and count clockwise.",
      aiExplanation: "The error was placing G immediately right of A without fully solving the arrangement. After fixing G(5)–H(1), E goes to position 6, A goes to position 8 (two right of E). B-D pair fills in, and F lands at position 7 (immediately right of A). Drawing the full arrangement before answering questions is essential for complex circular problems.",
      timeSpent: 210,
    },
    {
      id: 4,
      questionNum: 31,
      section: "DILR",
      topic: "Games & Tournament",
      difficulty: "CAT Level",
      questionText: "In a round-robin tournament with 5 teams, each team plays every other team exactly once. Team A won 3 matches. Team B lost to A and C, winning all others. How many matches did Team C win?",
      options: ["2", "3", "4", "Cannot be determined"],
      selectedIdx: 3,
      correctIdx: 1,
      mistakeType: "Guesswork",
      conceptGap: "Round-robin with 5 teams = 5×4/2 = 10 total matches. Set up a win-loss matrix. A won 3, B won 2 (won vs D,E; lost to A,C). Work through remaining matches systematically.",
      shortcutMethod: "Total wins = Total matches = 10. A=3, B=2. B lost to C, so C has at least 1 win. Map remaining games: C vs D, C vs E. If A beat D,E,C then C beat B but lost to A. C's wins from the info given = 3 (beat B, D, E). Verify: 3+2+3+? = 10.",
      aiExplanation: "Guessing 'Cannot be determined' was incorrect. With systematic matrix construction: A beats B,C,D (3 wins, lost to E). B beats D,E (2 wins). C beats B,D,E (3 wins, lost to A). D and E share remaining. The answer is deterministic — C won 3 matches. Always build the full table before concluding 'cannot be determined'.",
      timeSpent: 180,
    },
    {
      id: 5,
      questionNum: 38,
      section: "DILR",
      topic: "Seating Arrangement",
      difficulty: "Hard",
      questionText: "8 people sit in two parallel rows of 4. Row 1 faces north, Row 2 faces south. A is in row 1. B sits second from the left in row 2 and faces C. D is at an extreme end of row 1. Who sits opposite B?",
      options: ["A", "C", "D", "E"],
      selectedIdx: 0,
      correctIdx: 1,
      mistakeType: "Conceptual Error",
      conceptGap: "In double-row facing arrangements, 'faces' means directly opposite in the other row. B is 2nd from left in row 2 → the person facing B (directly opposite) is 2nd from right in row 1 (because rows face each other, so left-right is mirrored). The problem states B faces C, so C is directly opposite B.",
      shortcutMethod: "Rule: When two rows face each other, seat N in row 2 faces seat (5-N) in row 1 for a 4-seat row. So seat 2 in row 2 faces seat 3 in row 1. The clue 'B faces C' directly tells you C is opposite B — always trust explicit clues over calculations.",
      aiExplanation: "The answer is C — this was stated explicitly in the clue 'B faces C'. Reading the clue carefully eliminates the need for any calculation. The mistake was ignoring the explicit clue and trying to derive the answer from positioning. In DILR, always list all direct clues before deducing.",
      timeSpent: 160,
    },
    {
      id: 6,
      questionNum: 44,
      section: "DILR",
      topic: "Data Interpretation",
      difficulty: "Medium",
      questionText: "A table shows sales for 5 products across Q1-Q4. Product X had Q1=120, Q2=180, Q3=150, Q4=210. Product Y had Q1=90, Q2=110, Q3=200, Q4=160. By what % did Product X's Q4 sales exceed Product Y's Q4 sales?",
      options: ["25%", "30%", "31.25%", "28.5%"],
      selectedIdx: 1,
      correctIdx: 2,
      mistakeType: "Calculation Mistake",
      conceptGap: "Percentage difference formula: ((X-Y)/Y) × 100. X Q4=210, Y Q4=160. (210-160)/160 × 100 = 50/160 × 100 = 31.25%. Common error: dividing by X (200) instead of Y (160) gives 25%, which is wrong.",
      shortcutMethod: "Quick check: 50/160 = 5/16. 5/16 × 100 = 31.25. Alternatively: 160 × 1.25 = 200 ≠ 210; 160 × 1.3 = 208 ≠ 210; 160 × 1.3125 = 210 ✓. So 31.25%.",
      aiExplanation: "The error was calculating (210-160)/210 = 23.8% ≈ 30% instead of (210-160)/160 = 31.25%. For 'X exceeds Y by what %', always divide by Y (the reference base). Memorise: 'exceeds by %' → base is the smaller/reference number.",
      timeSpent: 75,
    },
    {
      id: 7,
      questionNum: 52,
      section: "VARC",
      topic: "Para Summary",
      difficulty: "Medium",
      questionText: "The passage argues that urban planning in the 20th century prioritised automobile infrastructure at the expense of pedestrian-friendly spaces, fundamentally altering the social fabric of cities. Community gathering spaces were replaced by parking lots, and the design of neighbourhoods shifted from human-scale to car-scale.",
      options: [
        "Cars destroyed social life in 20th century cities.",
        "Urban planning favoured cars over people, reshaping city design and social life.",
        "Pedestrian spaces are more important than roads for community building.",
        "Architects failed to design human-scale neighbourhoods in the 20th century.",
      ],
      selectedIdx: 2,
      correctIdx: 1,
      mistakeType: "Poor Elimination",
      conceptGap: "Option C states a prescription ('more important'), but the passage is descriptive — it describes what happened, not what should happen. The summary must match the tone and scope of the passage.",
      shortcutMethod: "Test each option: Does it use language beyond the passage? C says 'more important' — a value judgement the passage doesn't make. B accurately describes the cause (urban planning), effect (car-scale design), and consequence (altered social fabric) without adding or removing anything.",
      aiExplanation: "Option B is the correct summary. It captures the subject (urban planning), the bias (cars over pedestrians), and the consequence (reshaping design and social life). Option C is tempting but introduces a normative claim ('more important') that the passage never makes — it's a trap for students who read a conclusion into a descriptive passage.",
      timeSpent: 88,
    },
    {
      id: 8,
      questionNum: 57,
      section: "DILR",
      topic: "Games & Tournament",
      difficulty: "CAT Level",
      questionText: "In a knockout tournament with 16 teams, the top 8 seeds are guaranteed to avoid each other until the quarterfinals. Seed #1 wins all matches. Seed #2 loses in the semifinal. How many matches has Seed #2 won in total?",
      options: ["2", "3", "4", "Cannot be determined"],
      selectedIdx: 0,
      correctIdx: 1,
      mistakeType: "Conceptual Error",
      conceptGap: "Knockout tournament with 16 teams: Round of 16 → QF → SF → Final. Seed #2 reaches the SF (beats opponents in R16 and QF = 2 wins), then loses in the SF. Total wins = 3 if they reached the SF by winning 3 matches... Wait: R16(1 win) + QF(1 win) + SF(loss) = 2 wins before losing.",
      shortcutMethod: "Count rounds: 16 teams → R16 (round 1) → QF (round 2) → SF (round 3) → Final. Seed #2 loses in SF = lost in round 3. So they won rounds 1 and 2 = 2 wins + one more? No: R16=1 match, QF=1 match, SF=lost. Total wins = 2. Wait — 16→8→4→2→1. Seed #2 played: R16 (win), QF (win), SF (loss) = 2 wins? The answer given is 3 — let me recheck. Actually in a 16-team bracket: round of 16, quarterfinals, semifinals, final. To reach the semifinals, a team must win round of 16 AND quarterfinals = 2 wins. They lose in semis. So 2 wins... Hmm actually I need to count 16→8 (R16), 8→4 (QF), 4→2 (SF). Reaching SF requires winning 2 matches. Losing in SF means 2 total wins.",
      aiExplanation: "In a 16-team knockout, teams play: R16 (win 1), QF (win 2), SF (loss). Seed #2 won 2 matches before losing in the semifinal. The answer is 2, not 3. The mistake was assuming there was an additional qualifying round. Always map the bracket fully: 16→8→4→2→1 requires 4 wins to win the tournament. Reaching SF = 2 wins.",
      timeSpent: 195,
    },
    {
      id: 9,
      questionNum: 61,
      section: "DILR",
      topic: "Seating Arrangement",
      difficulty: "Hard",
      questionText: "Six people A-F sit around a hexagonal table, one at each side. A and D are opposite. B sits two places to the right of C. E is adjacent to both A and F. Who is opposite to B?",
      options: ["A", "C", "E", "F"],
      selectedIdx: 0,
      correctIdx: 2,
      mistakeType: "Time Pressure",
      conceptGap: "Hexagonal table: opposite = 3 seats apart. E is adjacent to both A and F → A-E-F must be consecutive. A and D are opposite (3 apart) → D is on the other side. B is 2 places right of C. Fill in the remaining positions: C-?-B sequence with A-E-F and D fixed.",
      shortcutMethod: "Fix A at position 1, D at position 4 (opposite). E is adjacent to A: E at 2 or 6. F is adjacent to E. Try E at 2, F at 3 → remaining spots for B,C: positions 5,6. B is 2 right of C: C=5, B= position 7? No. Try E at 6, F at 5 → C,B at 2,3: B 2 right of C means C=2, B=4? 4 is D. Try C=3, B=5=F conflict. Rethink with E at 2: A(1),E(2),F(3),D(4),?,? C and B at 5,6. B 2 right of C: C=6, B=8=2? Circular: C=6→+2=2=E. Conflict. C=5, B=7=1=A. Conflict. Try other side for E.",
      aiExplanation: "This was answered in only 95 seconds under time pressure, leading to an incorrect guess. The arrangement requires careful placement: A(1), D(4) opposite. E adjacent to both A and F — try E(6), F(5). Then C(2), B(4)=D conflict. Try E(2), F(3), remaining: C(5) or C(6). C(6)→B=2=E conflict. C(5)→B=1=A conflict. Re-examine: B 2 places RIGHT of C clockwise. C(6)→right→1→right→2=E. Conflict. So the only valid: rotate — A(2),D(5),E(1),F(6),C(3),B(5)=D conflict... The systematic approach requires 3+ minutes for this puzzle. The error was rushing.",
      timeSpent: 95,
    },
  ],

  weaknesses: [
    {
      topic: "Games & Tournament",
      section: "DILR",
      accuracy: 25,
      timeLoss: 12,
      priority: "Critical",
      recommendedMock: "DILR Sectional #2 — Puzzle Edition",
      recommendedRevision: "Games & Tournament — Framework & Approach",
    },
    {
      topic: "Para Summary",
      section: "VARC",
      accuracy: 40,
      timeLoss: 5,
      priority: "Critical",
      recommendedMock: "VARC Sectional #1",
      recommendedRevision: "Para Summary — Scope & Tone Matching",
    },
    {
      topic: "Seating Arrangement",
      section: "DILR",
      accuracy: 50,
      timeLoss: 8,
      priority: "High",
      recommendedMock: "DILR Sectional #1",
      recommendedRevision: "Seating Arrangement — Hexagonal & Double-Row",
    },
    {
      topic: "Geometry",
      section: "QA",
      accuracy: 50,
      timeLoss: 4,
      priority: "High",
      recommendedMock: "QA Topic — Geometry",
      recommendedRevision: "Geometry — Circle Theorems & Properties",
    },
    {
      topic: "Para Jumbles",
      section: "VARC",
      accuracy: 60,
      timeLoss: 3,
      priority: "Medium",
      recommendedMock: "VARC Topic — Para Jumbles",
      recommendedRevision: "Para Jumbles — 3-Step Framework",
    },
  ],

  revisionQueue: [
    { id: "r1", topic: "Games & Tournament",  section: "DILR", wrongCount: 2, priority: "P1", estimatedTime: "45 min" },
    { id: "r2", topic: "Para Summary",        section: "VARC", wrongCount: 2, priority: "P1", estimatedTime: "30 min" },
    { id: "r3", topic: "Seating Arrangement", section: "DILR", wrongCount: 3, priority: "P1", estimatedTime: "60 min" },
    { id: "r4", topic: "Para Jumbles",        section: "VARC", wrongCount: 1, priority: "P2", estimatedTime: "20 min" },
    { id: "r5", topic: "Geometry",            section: "QA",   wrongCount: 1, priority: "P2", estimatedTime: "25 min" },
    { id: "r6", topic: "Data Interpretation", section: "DILR", wrongCount: 1, priority: "P3", estimatedTime: "20 min" },
  ],

  percentileHistory: [
    { mockName: "VARC Sectional #1", shortName: "VARC S1",  date: "2026-04-28", percentile: 72, accuracy: 62 },
    { mockName: "Adaptive Mock #1",  shortName: "Adaptive",  date: "2026-05-07", percentile: 80, accuracy: 70 },
    { mockName: "CAT Full Mock #1",  shortName: "Full #1",   date: "2026-05-10", percentile: 85, accuracy: 74 },
    { mockName: "DILR Sectional #1", shortName: "DILR S1",   date: "2026-05-12", percentile: 87, accuracy: 76 },
    { mockName: "CAT Full Mock #2",  shortName: "Full #2",   date: "2026-05-14", percentile: 89.2, accuracy: 81 },
  ],

  timeAnalysis: [
    { questionNum: 3,  section: "VARC", topic: "Reading Comprehension", timeSpent: 420, idealTime: 240, correct: true,  status: "too-slow" },
    { questionNum: 12, section: "VARC", topic: "Para Jumbles",           timeSpent: 145, idealTime: 90,  correct: false, status: "too-slow" },
    { questionNum: 23, section: "DILR", topic: "Seating Arrangement",    timeSpent: 210, idealTime: 120, correct: false, status: "too-slow" },
    { questionNum: 31, section: "DILR", topic: "Games & Tournament",     timeSpent: 180, idealTime: 120, correct: false, status: "too-slow" },
    { questionNum: 38, section: "DILR", topic: "Seating Arrangement",    timeSpent: 160, idealTime: 120, correct: false, status: "too-slow" },
    { questionNum: 57, section: "DILR", topic: "Games & Tournament",     timeSpent: 195, idealTime: 120, correct: false, status: "too-slow" },
    { questionNum: 61, section: "DILR", topic: "Seating Arrangement",    timeSpent: 95,  idealTime: 180, correct: false, status: "too-fast-wrong" },
    { questionNum: 8,  section: "VARC", topic: "Para Summary",           timeSpent: 95,  idealTime: 90,  correct: false, status: "too-fast-wrong" },
    { questionNum: 44, section: "DILR", topic: "Data Interpretation",    timeSpent: 75,  idealTime: 90,  correct: false, status: "too-fast-wrong" },
    { questionNum: 52, section: "VARC", topic: "Para Summary",           timeSpent: 88,  idealTime: 90,  correct: false, status: "too-fast-wrong" },
    { questionNum: 7,  section: "QA",   topic: "Arithmetic",             timeSpent: 55,  idealTime: 60,  correct: true,  status: "efficient" },
    { questionNum: 14, section: "QA",   topic: "Number System",          timeSpent: 48,  idealTime: 60,  correct: true,  status: "efficient" },
    { questionNum: 27, section: "QA",   topic: "Algebra",                timeSpent: 72,  idealTime: 75,  correct: true,  status: "efficient" },
  ],

  mentorReport: {
    wentWell: [
      "QA section was outstanding — 18/22 attempted, 100% accuracy, 8 minutes ahead of time. Number System and Arithmetic were near-perfect.",
      "Data Interpretation (non-calculation DI) showed strong accuracy at 88%. Your caselet approach is well-structured.",
      "Reading Comprehension in VARC was solid at 83% — consistent with your last 3 mocks. Inference questions handled well.",
    ],
    wentWrong: [
      "DILR cost you the most. Games & Tournament accuracy dropped to 25% — you spent 375 seconds on 2 wrong answers. Skip-and-return strategy not applied.",
      "Para Summary is a systematic blind spot — 40% accuracy across 2 mocks. The 'scope trap' (adding normative claims) is a recurring pattern.",
      "Time management in DILR was poor: 2 minutes over allotted time, pushing QA into a rushed finish. Set harder DILR time caps.",
    ],
    nextActions: [
      "Attempt DILR Sectional #2 (Puzzle Edition) this week — focus on Games & Tournament sets with a strict 8-minute cap per set.",
      "Revise Para Summary with scope and tone matching exercises. Practice identifying 'prescriptive vs descriptive' language in RC passages.",
      "In next mock: attempt QA first (your strongest section) to bank time, then use the surplus in DILR.",
    ],
    nextMock: "DILR Sectional #2 — Puzzle Edition",
    motivationalMessage: "89.2%ile is excellent — you're in the top 11% of CAT aspirants. But 94+ is within reach. Your QA is already elite; fix DILR and Para Summary and the 95+ band opens up. Every mistake you just reviewed is a percentile point you're about to reclaim. Keep going.",
  },
};
