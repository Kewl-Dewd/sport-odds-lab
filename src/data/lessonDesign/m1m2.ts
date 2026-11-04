// Modules 1 (risks) and 2 (using the app).
import { q, type LessonDesign } from "./types";

export const M1_M2: Record<string, LessonDesign> = {
  "rg-risks": {
    objectives: [
      "Explain why a simulated sportsbook still teaches real-world risk.",
      "Describe the house edge at standard -110 pricing.",
      "List four personal rules that reduce gambling harm.",
    ],
    task: "Open Markets, pick any game and write down both moneyline prices. Use the Tools page no-vig calculator to find the book's margin on that game.",
    taskAnswer: "Most major-league moneylines show a margin of roughly 3–6%. Students should state the margin as the book's built-in edge on that game.",
    reflection: "Which feature of real betting apps (push alerts, same-game parlays, live betting, bonuses) do you think would affect you most, and why?",
    quiz: [
      q("At standard -110 / -110 pricing, roughly how much does the book keep over time?", ["0%", "About 4.5–5%", "About 20%", "It depends only on luck"], 1, "Paying -110 on both sides builds in about a 4.5% margin; over many bets that is the book's expected take."),
      q("Which age group is at highest risk of sports-betting harm?", ["Adults over 65", "Men aged 18–24", "Women aged 35–44", "Teens under 16"], 1, "Research consistently identifies young men aged 18–24 as the highest-risk group for sports-betting harm."),
      q("Which is a protective rule?", ["Increase stakes to win back losses", "Set a budget before you start", "Bet more after a bad day", "Use credit when cash runs out"], 1, "Setting limits before betting, not during, is one of the most effective protections."),
    ],
  },
  "rg-warning-signs": {
    objectives: [
      "Recognise behavioural warning signs of problem gambling.",
      "Describe a supportive way to raise concerns with a friend.",
      "Name at least one Alberta support line.",
    ],
    task: "Open the Support page in the app and save one helpline number to your phone.",
    taskAnswer: "The Alberta Addiction Helpline (1-866-332-2322, 24/7) is the expected answer; any listed resource is acceptable.",
    reflection: "If a friend showed two of the warning signs, what would you actually say to them? Write the first sentence.",
    quiz: [
      q("Which is a warning sign?", ["Betting the same small amount weekly", "Chasing losses with bigger bets", "Watching games without betting", "Tracking bets in a journal"], 1, "Chasing losses is one of the clearest signs that betting is out of control."),
      q("The best way to start a conversation with a friend about their betting is to:", ["Lecture them about odds", "Describe what you've noticed without judgement", "Tell their family first", "Ignore it until it gets worse"], 1, "Calm, specific, non-judgemental observations make people more willing to talk."),
      q("Help lines in Alberta are:", ["Only for people in crisis", "Free, confidential and available 24/7", "Only available by referral", "Only for adults over 25"], 1, "Alberta's helpline is free, confidential and open around the clock to anyone, including friends and family."),
    ],
  },
  "rg-reflection": {
    objectives: ["Set specific personal limits for time and money.", "Identify your personal triggers for risky decisions."],
    task: "Write your weekly simulated budget and the maximum time you will spend in the app per session in your journal.",
    taskAnswer: "Any specific, measurable numbers are acceptable (e.g. $100/week, 20 minutes/session). Vague answers ('not too much') should be returned.",
    reflection: "What is one situation (time of day, mood, setting) where you would be most likely to break your own limits?",
    quiz: [
      q("A good limit is:", ["'I'll stop when it feels wrong'", "Specific and decided in advance", "Changed after each loss", "Kept secret from everyone"], 1, "Limits work when they are specific and set before you start."),
      q("Why write limits down?", ["It is required by law", "It makes it harder to rationalise breaking them later", "It improves your odds", "It has no effect"], 1, "Writing a commitment reduces in-the-moment rationalising."),
      q("Which is a common trigger for risky betting?", ["Feeling calm and rested", "Alcohol or strong emotion", "Reading a lesson", "Checking the weather"], 1, "Alcohol, anger and boredom all reduce self-control."),
    ],
  },
  "intro-welcome": {
    objectives: ["Explain what Sports Market Lab simulates and what it does not.", "Describe how the class is graded on analysis, not winnings."],
    task: "Open your Dashboard and find your starting bankroll and class name.",
    taskAnswer: "SPM2020 uses a $1,000 starting bankroll; other classes show their configured amount.",
    reflection: "What do you expect to learn from running bets against a real-price book, and what are you sceptical about?",
    quiz: [
      q("Money in the app is:", ["Real and withdrawable", "Simulated and has no cash value", "Converted to grades", "Paid by the instructor"], 1, "All funds are virtual; it is a teaching simulation."),
      q("Your grade is mostly based on:", ["Total profit", "Analysis: forecasts, journal and lessons", "Number of bets placed", "Biggest single win"], 1, "The course rewards forecasting and analysis because profit over a short term is mostly variance."),
      q("Who 'runs the book' in your class?", ["A real sportsbook", "Your instructor's class book", "Other students", "Nobody"], 1, "Each class acts as its own sportsbook, run by the instructor, so you can see how a book earns."),
    ],
  },
  "intro-tour": {
    objectives: ["Navigate to Markets, My Bets, Journal, Learning and Calibration.", "Explain what each main screen is for."],
    task: "Visit each screen in the menu once and note one thing you learned on each.",
    taskAnswer: "Expect a short note for Markets (prices), My Bets (open positions), Journal (reasons), Learning (lessons) and Calibration (forecast accuracy).",
    reflection: "Which screen do you think will be most useful for learning, and why?",
    quiz: [
      q("Where do you see the bets you've already placed?", ["Markets", "My Bets", "Glossary", "Support"], 1, "My Bets lists your open and settled positions."),
      q("The Calibration page shows:", ["Your profit", "How well your forecasts match actual outcomes", "Upcoming games", "Your instructor's notes"], 1, "Calibration compares your forecast probabilities with how often those picks won."),
      q("Where do you write why you placed a bet?", ["Journal", "Leaderboard", "Tools", "Dashboard"], 0, "The Journal records your reasoning so it can be graded."),
    ],
  },
  "intro-first-bet": {
    objectives: ["Write a pre-bet probability estimate before seeing the price.", "Place and journal one bet correctly."],
    task: "Before opening a game, write your own win probability for one team. Then place a $10 bet and journal it.",
    taskAnswer: "A complete submission has a forecast saved with the bet, a journal entry with a reason, and a comparison of the student's number with the no-vig price.",
    reflection: "How far was your number from the market's no-vig number? Did seeing the price tempt you to change it?",
    quiz: [
      q("Why write your estimate before seeing the price?", ["It's faster", "To avoid anchoring on the market's number", "The app requires it legally", "To win more often"], 1, "Seeing a price first anchors your judgement; writing first shows whether you truly disagree."),
      q("Positive expected value at your forecast means:", ["You will win this bet", "If your forecast is right, the bet pays more than it costs on average", "The book loses money", "The odds will move"], 1, "EV is an average over many repetitions, not a guarantee for one bet."),
      q("A good journal entry includes:", ["Only the team name", "Your reason and the evidence behind it", "The final score only", "How you feel about the other team"], 1, "Graded journals focus on reasoning and evidence."),
    ],
  },
  "app-markets": {
    objectives: ["Find a game on the Markets board by league and date.", "Read moneyline, spread and total prices."],
    task: "Find one NHL or NBA game for tomorrow and write down the moneyline, spread and total.",
    taskAnswer: "Any real listed game is acceptable; check that the three bet types are correctly identified.",
    reflection: "What information is missing from the board that you'd want before betting?",
    quiz: [
      q("A moneyline bet is a bet on:", ["The exact score", "Which team wins", "Total points", "The first scorer"], 1, "Moneyline is a straight pick of the winner."),
      q("A total (over/under) is a bet on:", ["The combined score", "The winning margin", "Player stats", "Who scores first"], 0, "Totals are about combined points/goals/runs."),
      q("Markets show prices for:", ["Only today", "Up to three days ahead", "The whole season", "Only finished games"], 1, "The board lists today, tomorrow and the next day."),
    ],
  },
  "app-slip": {
    objectives: ["Calculate 'to win' and 'total payout' from American odds.", "Enter a forecast and read the EV figure."],
    task: "Open a bet slip on a +150 underdog (or the closest available) and note the 'to win' amount for a $10 stake.",
    taskAnswer: "+150 on $10 wins $15 (total payout $25). Students using a different price should show the formula: stake × odds/100.",
    reflection: "Did the EV number change your mind about the bet? Why or why not?",
    quiz: [
      q("A $10 bet at +150 wins:", ["$1.50", "$15", "$25", "$150"], 1, "Positive American odds show the profit on $100; $10 × 150/100 = $15."),
      q("A $10 bet at -200 wins:", ["$5", "$20", "$2", "$10"], 0, "Negative odds show the stake needed to win $100; $10 × 100/200 = $5."),
      q("Total payout equals:", ["Only the winnings", "Stake plus winnings", "Winnings minus vig", "Stake times two"], 1, "Total payout returns your stake plus profit."),
    ],
  },
  "app-portfolio": {
    objectives: ["Read bankroll, at-risk amount and P&L.", "Explain how the leaderboard is scored in your class."],
    task: "Open My Bets and write down your bankroll, money at risk and number of open bets.",
    taskAnswer: "Bankroll + at-risk should equal starting bankroll ± settled P&L.",
    reflection: "Is your current leaderboard rank a good measure of your skill? Explain using the word variance.",
    quiz: [
      q("'At risk' means:", ["Money you've lost", "Stakes tied up in ungraded bets", "Your total profit", "The book's exposure"], 1, "At-risk is the sum of stakes on open bets."),
      q("The default contest scoring is:", ["Profit", "Forecast accuracy (Brier score)", "Number of wins", "Biggest payout"], 1, "New contest windows score forecast accuracy, lower Brier is better."),
      q("A lower Brier score means:", ["Worse forecasts", "Better forecasts", "More bets", "More profit"], 1, "Brier measures squared forecast error; lower is better."),
    ],
  },
  "app-journal": {
    objectives: ["Write a gradeable journal entry with reason, evidence and confidence.", "Reflect on process separately from outcome."],
    task: "Journal your most recent bet: reason, one piece of evidence, confidence 1–5.",
    taskAnswer: "Look for a specific reason backed by evidence (injury report, rating, rest days), not 'they're good'.",
    reflection: "Describe a bet that won for the wrong reason, or lost for the right one.",
    quiz: [
      q("Judging a decision only by its result is called:", ["Calibration", "Resulting (outcome bias)", "Hedging", "Arbitrage"], 1, "Resulting confuses outcome with decision quality."),
      q("Best evidence for a journal entry:", ["'Gut feeling'", "A specific stat or news item", "A friend's tip", "The team colour"], 1, "Specific, checkable evidence makes reasoning gradeable."),
      q("Journal completion is:", ["Ignored", "A graded component in the gradebook", "Only for instructors", "Optional for contests"], 1, "Instructors can weight journal completion in the gradebook."),
    ],
  },
};
