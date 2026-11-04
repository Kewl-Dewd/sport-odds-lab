// 15-week course-in-a-box: course learning outcomes, weekly schedule with
// lecture slide outlines, and project rubrics. Built with backward design:
// outcomes -> assessments -> weekly activities.

export interface CourseOutcome { code: string; text: string; modules: number[] }

export const COURSE_OUTCOMES: CourseOutcome[] = [
  { code: "CLO1", text: "Explain the real-world risks of sports wagering and identify support resources in Alberta.", modules: [1, 7] },
  { code: "CLO2", text: "Describe the legal, regulatory and commercial structure of sports wagering in Canada and Alberta.", modules: [3] },
  { code: "CLO3", text: "Convert odds between formats and calculate implied probability, overround, no-vig probability and expected value.", modules: [2, 4] },
  { code: "CLO4", text: "Explain how a sportsbook earns its margin, and analyse handle, payouts and hold for a class book.", modules: [4, 5] },
  { code: "CLO5", text: "Build a simple forecasting model and evaluate it against market prices using Brier score, calibration and closing line value.", modules: [5, 6] },
  { code: "CLO6", text: "Analyse how cognitive biases, product design and advertising shape wagering behaviour.", modules: [7] },
];

export interface CourseWeek {
  week: number;
  title: string;
  /** Curriculum topic key covered this week. */
  topicKey: string;
  lessons: string[];
  activity: string;
  assessment?: string;
  slides: string[];
}

export const COURSE_WEEKS: CourseWeek[] = [
  { week: 1, title: "Course launch and the real-world risks", topicKey: "responsible-play", lessons: ["rg-risks", "rg-warning-signs", "rg-reflection"], activity: "Join the class, set personal limits, find support resources.", assessment: "Module 1 quiz",
    slides: ["Welcome: a classroom sportsbook, simulated money only", "Course outcomes and how grading rewards analysis, not winnings", "Who is most at risk: young men 18–24", "The house edge at -110 in one picture", "Warning signs and how to talk to a friend", "Alberta support: 1-866-332-2322, GameSense, campus counselling", "Activity: write your personal limits"] },
  { week: 2, title: "Using the app and your first forecast", topicKey: "using-the-app", lessons: ["intro-welcome", "intro-tour", "app-markets", "app-slip", "app-portfolio", "app-journal", "intro-first-bet"], activity: "Place and journal a first forecasted bet.", assessment: "Module 2 quiz; first journal entry",
    slides: ["Tour: Markets, My Bets, Journal, Learning, Calibration", "Reading the board: moneyline, spread, total", "The bet slip: stake, to win, total payout", "Why you forecast before you see the price (anchoring)", "Bankroll, at risk and P&L", "What makes a gradeable journal entry", "Live demo: instructor places and journals a bet"] },
  { week: 3, title: "Canada's wagering industry", topicKey: "canadian-industry", lessons: ["single-event-wagering-in-canada-after-bill-c-218", "who-regulates-aglc-igaming-ontario-and-provincia", "operator-models-provincial-monopoly-private-lice"], activity: "Classify sportsbooks you see advertised by operating model.",
    slides: ["Before 2021: parlay-only provincial lotteries", "Bill C-218 and single-event wagering", "Regulator vs operator", "Three models: monopoly, licensed private, grey market", "Ontario 2022 and what it changed", "Discussion: can a province run and regulate gambling?"] },
  { week: 4, title: "Following the money and Alberta law", topicKey: "canadian-industry", lessons: ["leagues-teams-broadcasters-and-sportsbooks-follo", "ab-legal-basics", "ab-igaming-act", "ab-integrity-ads", "assignment-map-a-sport-organization-s-wagering-p"], activity: "Start the partnership map project.", assessment: "Project 1: Partnership map; Module 3 quiz",
    slides: ["Handle, GGR and where the money goes", "Leagues, data deals and sponsorships", "Alberta: age 18, AGLC, PlayAlberta", "iGaming Alberta Act and the July 2026 open market", "Integrity rules and player protections", "Project 1 brief and rubric walkthrough"] },
  { week: 5, title: "Reading odds", topicKey: "how-betting-works", lessons: ["odds-formats", "implied-vig"], activity: "Convert ten prices and compute no-vig for three games.",
    slides: ["American, decimal, fractional", "Favourites and underdogs", "Odds to implied probability", "Overround: why it sums past 100%", "No-vig probability step by step", "Practice with the Tools page"] },
  { week: 6, title: "How the book makes money", topicKey: "how-betting-works", lessons: ["how-the-book-earns", "bet-types"], activity: "Review the class Book summary together.",
    slides: ["A balanced book locks in its margin", "Hold %: (handle − payouts) / handle", "Our class book: live prices, no line movement", "Moneyline, spread, totals, parlays", "Short-run swings vs long-run hold", "Live: this week's class book numbers"] },
  { week: 7, title: "Expected value and the house edge", topicKey: "how-betting-works", lessons: ["expected-value-hold-percentage-and-theoretical-r", "props-and-parlays-where-the-house-edge-grows"], activity: "Compare 2-, 4- and 6-leg parlay edges with the parlay calculator.", assessment: "Module 4 quiz",
    slides: ["EV formula with a worked example", "EV is an average, not a promise", "Theoretical return to player", "Why props carry bigger margins", "Parlays: edges compound", "Same-game parlays and correlation"] },
  { week: 8, title: "Midterm: price a game", topicKey: "how-betting-works", lessons: ["betting-quiz"], activity: "Price a game independently and compare with the market.", assessment: "Project 2: Price-a-game (midterm)",
    slides: ["From probability to fair odds", "Fair odds formulas for favourites and underdogs", "Comparing your price with no-vig", "What a meaningful gap looks like", "Project 2 brief and rubric"] },
  { week: 9, title: "Staking and bankroll", topicKey: "strategy", lessons: ["bankroll-units"], activity: "Adopt a written staking rule.",
    slides: ["Units and flat staking", "Risk of ruin in one chart", "Why big stakes fail even with an edge", "Activity: choose your rule"] },
  { week: 10, title: "Variance and why edges disappear", topicKey: "strategy", lessons: ["variance", "expected-value"], activity: "Analyse the leaderboard's profit view for luck.", assessment: "Module 5 quiz",
    slides: ["Variance and drawdowns", "Sample size: why 30 bets prove nothing", "Market efficiency", "Closing line value as a skill signal", "Why books limit winners"] },
  { week: 11, title: "Data for forecasting", topicKey: "data-models", lessons: ["sourcing-and-preparing-sport-data"], activity: "Build a clean team dataset in a spreadsheet.",
    slides: ["Free sources: leagues, Sports-Reference, open datasets", "Cleaning: missing, duplicate, mislabelled", "Useful features: margin, rest, home", "Activity: build your dataset"] },
  { week: 12, title: "Building a rating model", topicKey: "data-models", lessons: ["building-a-simple-rating-model", "comparing-your-model-to-the-market"], activity: "Turn ratings into probabilities and compare with the market.",
    slides: ["Ratings from scoring margin", "Home advantage", "Elo in five minutes", "Model vs no-vig market", "When is a gap meaningful?"] },
  { week: 13, title: "Line movement and model failure", topicKey: "data-models", lessons: ["line-movement", "why-models-fail-sample-size-overfitting-and-vari"], activity: "Check CLV on your forecasts so far.", assessment: "Module 6 quiz",
    slides: ["Why lines move", "Opening vs closing prices", "Reading your CLV", "Overfitting", "Out-of-sample testing"] },
  { week: 14, title: "Bias, advertising and support", topicKey: "bias-advertising-support", lessons: ["bias", "cognitive-biases-in-wagering-decisions", "risk-indicators-among-post-secondary-students", "responsible-gambling-tools-what-operators-and-re", "advertising-standards-in-canada-and-how-ads-shap", "support-and-referral-pathways-in-alberta"], activity: "Ad analysis in small groups.", assessment: "Module 7 quiz",
    slides: ["Tilt, recency, favourite-longshot", "Gambler's fallacy, confirmation, illusion of control", "How product design uses bias", "Students and risk", "Canadian ad standards", "Support pathways, revisited"] },
  { week: 15, title: "Final project and wrap-up", topicKey: "data-models", lessons: ["assignment-model-vs-market-report"], activity: "Present model-vs-market findings and calibration reflection.", assessment: "Project 3: Model-vs-market report; Project 4: Journal portfolio",
    slides: ["What the class book earned this term", "Class calibration chart", "What we learned about beating markets", "Final report expectations", "Course reflection"] },
];

export interface Rubric { key: string; title: string; weight: string; criteria: { name: string; levels: [string, string, string, string] }[] }

export const RUBRIC_LEVELS = ["Excellent (4)", "Proficient (3)", "Developing (2)", "Beginning (1)"];

export const RUBRICS: Rubric[] = [
  { key: "partnership-map", title: "Project 1: Partnership map (Week 4)", weight: "10%", criteria: [
    { name: "Accuracy", levels: ["All partners and deal terms correct and current", "Minor errors", "Several errors or outdated", "Mostly inaccurate"] },
    { name: "Completeness", levels: ["Covers sponsors, data, media and league deals", "Covers most deal types", "Covers one or two", "Logos only"] },
    { name: "Analysis of trade-offs", levels: ["Weighs revenue vs reputational and harm risks with evidence", "Identifies trade-offs with some evidence", "Lists risks without analysis", "No analysis"] },
    { name: "Sources", levels: ["Credible, cited throughout", "Mostly credible and cited", "Few or weak sources", "None"] },
  ] },
  { key: "price-a-game", title: "Project 2: Price-a-game (Midterm, Week 8)", weight: "15%", criteria: [
    { name: "Probability estimate", levels: ["Clear, evidence-based estimate with stated assumptions", "Reasonable estimate, some evidence", "Estimate with little reasoning", "No justification"] },
    { name: "Odds conversion", levels: ["Fair odds, implied and no-vig all correct", "One small error", "Several errors", "Incorrect method"] },
    { name: "Market comparison", levels: ["Explains the gap and judges whether it is noise", "Explains the gap", "States the gap only", "No comparison"] },
    { name: "Communication", levels: ["Clear, concise, well organised", "Mostly clear", "Hard to follow", "Unclear"] },
  ] },
  { key: "model-vs-market", title: "Project 3: Model-vs-market report (Final, Week 15)", weight: "20%", criteria: [
    { name: "Model design", levels: ["Sound, documented, avoids overfitting", "Sound with minor gaps", "Simplistic or undocumented", "No real model"] },
    { name: "Evaluation", levels: ["Uses Brier, calibration and CLV correctly", "Uses two measures correctly", "Uses profit or one measure", "No evaluation"] },
    { name: "Interpretation", levels: ["Separates skill from variance; honest limitations", "Some discussion of variance", "Over-claims from small sample", "No interpretation"] },
    { name: "Reflection and next steps", levels: ["Specific, actionable improvements", "General improvements", "Vague", "None"] },
  ] },
  { key: "journal-portfolio", title: "Project 4: Journal portfolio (Week 15)", weight: "10%", criteria: [
    { name: "Consistency", levels: ["Every bet journaled", "Most bets (75%+)", "About half", "Few or none"] },
    { name: "Quality of reasoning", levels: ["Specific evidence on nearly every entry", "Evidence on most", "Mostly opinion", "No reasons given"] },
    { name: "Process vs outcome", levels: ["Regularly judges process separately from results", "Sometimes", "Rarely", "Never"] },
    { name: "Responsible-play awareness", levels: ["Tracks limits and reflects on behaviour", "Mentions limits", "Little awareness", "None"] },
  ] },
];

export const SYLLABUS_WEIGHTS = [
  { item: "Module quizzes (7)", weight: "20%" },
  { item: "Lesson completion and reflections", weight: "10%" },
  { item: "Forecast accuracy (Brier score)", weight: "10%" },
  { item: "Project 1: Partnership map", weight: "10%" },
  { item: "Project 2: Price-a-game (midterm)", weight: "15%" },
  { item: "Project 3: Model-vs-market report (final)", weight: "20%" },
  { item: "Project 4: Journal portfolio", weight: "10%" },
  { item: "Participation and class book discussions", weight: "5%" },
];
