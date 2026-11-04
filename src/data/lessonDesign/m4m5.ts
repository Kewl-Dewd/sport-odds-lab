// Modules 4 (mathematics of odds) and 5 (risk, variance and the house edge).
import { q, type LessonDesign } from "./types";

export const M4_M5: Record<string, LessonDesign> = {
  "odds-formats": {
    objectives: ["Convert between American, decimal and fractional odds.", "Read favourites and underdogs from the sign."],
    task: "Use the Tools odds converter to convert -150 and +200 into decimal and fractional.",
    taskAnswer: "-150 = 1.67 decimal = 2/3; +200 = 3.00 decimal = 2/1.",
    reflection: "Which format is easiest for you to reason about, and why?",
    quiz: [
      q("+200 in decimal odds is:", ["2.00", "3.00", "1.50", "0.33"], 1, "Decimal = 1 + 200/100 = 3.00."),
      q("-150 means:", ["Bet $150 to win $100", "Bet $100 to win $150", "Bet $150 to win $150", "Even money"], 0, "Negative odds show the stake needed to win $100."),
      q("A negative American price indicates:", ["The underdog", "The favourite", "A draw", "A push"], 1, "Favourites carry negative prices."),
    ],
  },
  "implied-vig": {
    objectives: ["Calculate implied probability from odds.", "Calculate the overround and no-vig probability."],
    task: "Pick a game. Convert both moneylines to implied probabilities, add them, and calculate the no-vig probability for each side.",
    taskAnswer: "Example -120/+100: 54.5% + 50.0% = 104.5% (4.5% overround); no-vig = 52.2% / 47.8%.",
    reflection: "Why would a book prefer bettors not to know the no-vig price?",
    quiz: [
      q("Implied probability of -200 is:", ["33.3%", "50%", "66.7%", "200%"], 2, "200 / (200 + 100) = 66.7%."),
      q("If implied probabilities sum to 105%, the overround is:", ["0%", "5%", "105%", "50%"], 1, "Anything above 100% is the book's margin."),
      q("No-vig probability is found by:", ["Adding the vig", "Dividing each implied % by the total", "Doubling the odds", "Ignoring the favourite"], 1, "Normalise each side so they sum to 100%."),
    ],
  },
  "how-the-book-earns": {
    objectives: ["Explain how a balanced book earns its margin regardless of result.", "Calculate hold percentage."],
    task: "Open the class Book summary (or ask your instructor) and record handle, payouts and hold %.",
    taskAnswer: "Hold % = (handle − payouts) / handle. Short-run hold can swing; long-run hold trends toward the margin.",
    reflection: "Why might our class book lose money in a given week even though it has an edge?",
    quiz: [
      q("Hold % is:", ["Payouts / handle", "(Handle − payouts) / handle", "Bets / players", "Vig × 2"], 1, "Hold is the share of handle the book keeps."),
      q("A balanced book:", ["Always loses", "Earns the margin whichever side wins", "Never pays", "Moves lines every minute"], 1, "Equal action at fair-plus-vig prices locks in the margin."),
      q("In our class, odds move because:", ["Students bet a lot", "The live feed changes", "The instructor edits them", "Random"], 1, "Class books use live feed prices; no internal line movement."),
    ],
  },
  "bet-types": {
    objectives: ["Distinguish moneyline, spread, total and parlay bets.", "Explain why parlays carry a larger house edge."],
    task: "On one game, write what you'd need to happen to win a spread bet and a total bet.",
    taskAnswer: "Spread: favourite wins by more than the line (or underdog covers). Total: combined score above/below the number.",
    reflection: "Why do books promote parlays so heavily?",
    quiz: [
      q("A -1.5 spread bet wins if the team:", ["Wins by 1", "Wins by 2 or more", "Loses by 1", "Ties"], 1, "They must cover 1.5, so win by 2+."),
      q("A parlay wins only if:", ["Any leg wins", "Every leg wins", "Half the legs win", "The first leg wins"], 1, "All legs must win."),
      q("Adding legs to a parlay usually:", ["Lowers the house edge", "Increases the house edge", "Doesn't change it", "Removes it"], 1, "Margins compound with each leg."),
    ],
  },
  "expected-value-hold-percentage-and-theoretical-r": {
    objectives: ["Calculate expected value of a bet.", "Relate EV to theoretical return to player."],
    task: "For a $10 bet at +120 with your forecast of 50%, calculate EV.",
    taskAnswer: "EV = 0.5 × 12 − 0.5 × 10 = +$1.00.",
    reflection: "If EV is positive, why can you still lose money over 20 bets?",
    quiz: [
      q("EV of $10 at even money (+100) with 50% chance:", ["$0", "$5", "-$5", "$10"], 0, "0.5 × 10 − 0.5 × 10 = 0."),
      q("Negative EV means:", ["You'll lose this bet", "On average, the bet loses money", "The bet is illegal", "The odds are wrong"], 1, "EV is an average across repetitions."),
      q("Theoretical return to player at 4.5% hold is about:", ["4.5%", "95.5%", "100%", "50%"], 1, "Return = 100% − hold."),
    ],
  },
  "props-and-parlays-where-the-house-edge-grows": {
    objectives: ["Explain why prop markets carry higher margins.", "Calculate a parlay's combined edge."],
    task: "Use the Tools parlay calculator to compare a 2-leg and 4-leg parlay's house edge.",
    taskAnswer: "With ~4.5% per leg, a 2-leg parlay is ~9% and a 4-leg ~17% edge.",
    reflection: "How would you explain to a friend why a 6-leg parlay is a poor bet?",
    quiz: [
      q("Props usually have:", ["Lower margins", "Higher margins", "No margin", "Fixed even odds"], 1, "Less liquid, harder-to-price markets carry more margin."),
      q("Same-game parlays are risky because:", ["Legs are correlated and priced with extra margin", "They're illegal", "They never pay", "They have no vig"], 0, "Books add margin to correlated legs."),
      q("A parlay's margin compared to a single bet is:", ["Smaller", "Larger", "Equal", "Zero"], 1, "Margins multiply across legs."),
    ],
  },
  "betting-quiz": {
    objectives: ["Price a game independently.", "Compare your price with the market's no-vig price."],
    task: "Choose a game, estimate each team's win probability, convert to fair American odds, then compare with the book's no-vig price.",
    taskAnswer: "Grade with the Price-a-Game rubric. Fair odds for p > 50%: -100·p/(1−p); for p < 50%: +100·(1−p)/p.",
    reflection: "Where did your price disagree most with the market, and who is more likely right?",
    quiz: [
      q("Fair American odds for a 60% chance are:", ["-150", "+150", "-60", "+60"], 0, "-100 × 0.6/0.4 = -150."),
      q("Fair odds for a 25% chance:", ["+300", "-300", "+25", "-133"], 0, "+100 × 0.75/0.25 = +300."),
      q("If your price differs from the market by 1%, it is most likely:", ["A huge edge", "Noise", "Guaranteed profit", "A mistake by the book"], 1, "Small gaps are usually within your own estimation error."),
    ],
  },
  "bankroll-units": {
    objectives: ["Define a unit and flat staking.", "Explain why stake size controls risk of ruin."],
    task: "Calculate 1% and 2% of your current bankroll and use one of those as your stake on your next bet.",
    taskAnswer: "Example: $1,000 bankroll → $10 (1%) or $20 (2%).",
    reflection: "What staking rule will you follow for the rest of the term?",
    quiz: [
      q("A 'unit' is:", ["One bet", "A fixed share of bankroll used as a stake", "A team", "A payout"], 1, "Units standardise stake size."),
      q("Flat staking helps by:", ["Increasing variance", "Keeping risk consistent", "Guaranteeing profit", "Removing vig"], 1, "Consistent stakes stop one bad bet wiping you out."),
      q("Betting 25% per bet:", ["Is safe", "Greatly increases risk of ruin", "Has no effect", "Is required"], 1, "Large stakes make long losing streaks fatal."),
    ],
  },
  variance: {
    objectives: ["Explain variance and drawdowns.", "Describe why small samples mislead."],
    task: "Look at the class leaderboard 'Profit' view. How many bets has the top student placed? Is that enough to judge skill?",
    taskAnswer: "Usually fewer than 50 bets; far too few. Hundreds are needed to separate skill from luck.",
    reflection: "Describe a time luck made a decision look smarter than it was.",
    quiz: [
      q("Variance means:", ["Results spread around the expected value", "The vig", "Guaranteed losses", "A bet type"], 0, "Variance is spread around expectation."),
      q("A drawdown is:", ["A big win", "A decline from a bankroll peak", "A parlay leg", "A deposit"], 1, "Drawdown measures peak-to-trough losses."),
      q("To judge betting skill you need:", ["5 bets", "Hundreds of bets", "One big win", "A hot streak"], 1, "Small samples are dominated by luck."),
    ],
  },
  "expected-value": {
    objectives: ["Explain why most apparent edges disappear.", "Relate market efficiency to EV."],
    task: "Check your last 5 forecasts on the Calibration page: what was your average CLV?",
    taskAnswer: "Most students will see CLV near zero or negative — evidence that markets are hard to beat.",
    reflection: "If edges are rare, what is the value of studying betting markets at all?",
    quiz: [
      q("Why do most edges disappear?", ["Books cheat", "Markets incorporate information quickly", "Sports are rigged", "Luck runs out"], 1, "Efficient markets price in public information fast."),
      q("Positive CLV suggests:", ["You got a better price than closing", "You won", "You lost", "Nothing"], 0, "Beating the close is evidence of skill over time."),
      q("Books limit winning bettors because:", ["It's illegal to win", "Sharp bettors cost them money", "They like variety", "They are required to"], 1, "Books manage risk by limiting sharp customers."),
    ],
  },
};
