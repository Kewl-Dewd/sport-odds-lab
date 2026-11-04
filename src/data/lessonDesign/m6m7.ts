// Modules 6 (data and models) and 7 (bias, advertising and support).
import { q, type LessonDesign } from "./types";

export const M6_M7: Record<string, LessonDesign> = {
  "sourcing-and-preparing-sport-data": {
    objectives: ["Identify free, reliable sport data sources.", "Clean a small dataset for analysis."],
    task: "Download last season's standings for one league (e.g. from a league site or Sports-Reference) into a spreadsheet.",
    taskAnswer: "Any credible source with wins, losses and points for/against is acceptable.",
    reflection: "What data would you want but can't easily get?",
    quiz: [
      q("A good first step with new data is:", ["Bet immediately", "Check for missing or duplicate rows", "Delete outliers", "Ignore dates"], 1, "Cleaning prevents garbage-in, garbage-out."),
      q("Points for/against helps estimate:", ["Ticket prices", "Team strength", "Weather", "Attendance"], 1, "Scoring margin is a strong indicator of quality."),
      q("A reliable source is:", ["A random tweet", "An official league or established stats site", "A betting tipster", "A forum rumour"], 1, "Use official or well-maintained sources."),
    ],
  },
  "building-a-simple-rating-model": {
    objectives: ["Build a simple team rating from scoring margin.", "Convert a rating difference into a win probability."],
    task: "Calculate average goal/point differential for two teams and use it to estimate who is stronger.",
    taskAnswer: "The team with higher average differential is rated stronger; home advantage can be added (≈ +0.2–0.3 goals NHL, ≈ +2–3 pts NBA).",
    reflection: "What important factor does your simple model ignore?",
    quiz: [
      q("A rating model estimates:", ["Ticket demand", "Relative team strength", "Player salaries", "TV ratings"], 1, "Ratings summarise strength."),
      q("Home advantage should:", ["Be ignored", "Be added as an adjustment", "Double the rating", "Only apply in playoffs"], 1, "Home teams win more often than average."),
      q("Elo ratings update after:", ["Each game", "Each season only", "Never", "Each trade"], 0, "Elo adjusts ratings after every result."),
    ],
  },
  "comparing-your-model-to-the-market": {
    objectives: ["Compare model probabilities with no-vig market probabilities.", "Decide when a difference is meaningful."],
    task: "For three games, list your model's probability and the market's no-vig probability side by side.",
    taskAnswer: "Differences under ~3% are usually noise; larger gaps need a reason the market might be wrong.",
    reflection: "When your model disagrees with the market, what is the most likely explanation?",
    quiz: [
      q("If your model says 55% and no-vig is 54%:", ["Big edge", "Within noise", "Bet max", "The market is broken"], 1, "1% is well within model error."),
      q("The market usually knows:", ["Less than you", "Injury news and sharp money you might not", "Nothing", "Only the score"], 1, "Markets aggregate lots of information."),
      q("You should bet when:", ["Any difference exists", "Your edge exceeds the vig and your error", "You feel lucky", "The team is popular"], 1, "An edge must beat both margin and uncertainty."),
    ],
  },
  "line-movement": {
    objectives: ["Explain why lines move.", "Define closing line value (CLV)."],
    task: "Compare a game's price when you bet with its closing price on the Calibration page.",
    taskAnswer: "If you got better odds than closing, CLV is positive.",
    reflection: "Is beating the closing line more meaningful than winning the bet? Why?",
    quiz: [
      q("Lines move mainly because of:", ["Random noise", "New information and betting action", "The weather only", "League orders"], 1, "Books react to news and money."),
      q("CLV compares your price with:", ["The opening price", "The closing price", "Another book", "Your forecast"], 1, "CLV uses the closing no-vig price."),
      q("Consistently positive CLV indicates:", ["Luck", "Skill at finding value", "Cheating", "Nothing"], 1, "Beating the close is a long-run skill signal."),
    ],
  },
  "why-models-fail-sample-size-overfitting-and-vari": {
    objectives: ["Define overfitting.", "Explain how sample size limits model confidence."],
    task: "Name one variable you could add to your model and explain how it might overfit.",
    taskAnswer: "E.g. 'record on Tuesdays' — fits past noise, won't predict future results.",
    reflection: "How would you test whether your model works on new games?",
    quiz: [
      q("Overfitting means:", ["The model fits noise in past data", "The model is too simple", "The model is perfect", "Too few teams"], 0, "Overfit models perform poorly on new data."),
      q("A good test of a model:", ["Same data it was built on", "Out-of-sample games", "Friends' opinions", "One game"], 1, "Test on data the model hasn't seen."),
      q("More variables always:", ["Improve predictions", "Can increase overfitting risk", "Remove variance", "Beat the market"], 1, "Complexity can capture noise."),
    ],
  },
  "assignment-model-vs-market-report": {
    objectives: ["Evaluate your model against the market over many games.", "Communicate results with calibration and CLV evidence."],
    task: "Write a 2–3 page report comparing your forecasts (Brier, calibration chart, CLV) with the market over the term.",
    taskAnswer: "Grade with the Model-vs-Market Report rubric.",
    reflection: "What would you change about your forecasting process next time?",
    quiz: [
      q("The best evidence of forecasting skill in your report:", ["Total profit", "Brier score and calibration", "Biggest win", "Number of bets"], 1, "Accuracy measures beat profit over short samples."),
      q("A calibration chart compares:", ["Forecast % vs actual win rate", "Profit vs time", "Bets vs days", "Odds vs teams"], 0, "Calibrated forecasters' 60% picks win ~60% of the time."),
      q("A good report acknowledges:", ["Only wins", "Limitations like sample size", "Nothing", "Rumours"], 1, "Honest limitations strengthen analysis."),
    ],
  },
  bias: {
    objectives: ["Recognise tilt, recency and favourite bias.", "Describe a strategy to counter each."],
    task: "Review your last 5 bets: did you mostly back favourites or popular teams?",
    taskAnswer: "Students should identify a pattern and connect it to a named bias.",
    reflection: "Which bias do you see most in yourself?",
    quiz: [
      q("Tilt is:", ["A bet type", "Emotional, impulsive betting after a loss", "A model", "A line move"], 1, "Tilt is emotion-driven decision-making."),
      q("Recency bias:", ["Overweights recent results", "Ignores the present", "Is a type of vig", "Applies only to hockey"], 0, "We overreact to what happened last."),
      q("Favourite-longshot bias says bettors:", ["Overbet longshots", "Underbet longshots", "Never bet favourites", "Are perfectly rational"], 0, "Longshots tend to be overbet relative to true chances."),
    ],
  },
  "cognitive-biases-in-wagering-decisions": {
    objectives: ["Define the gambler's fallacy, illusion of control and confirmation bias.", "Link biases to product design."],
    task: "Find one app feature (in a real book's ad or app) that exploits a cognitive bias.",
    taskAnswer: "E.g. 'near miss' parlay alerts (illusion of control), boosts (anchoring), cash-out prompts (loss aversion).",
    reflection: "Should regulators restrict features that exploit biases?",
    quiz: [
      q("Gambler's fallacy:", ["Believing a streak must end", "Believing in skill", "Knowing the odds", "Hedging"], 0, "Independent events don't 'balance out' short-term."),
      q("Confirmation bias means:", ["Seeking info that supports what you already think", "Checking all evidence", "Using models", "Ignoring news"], 0, "We favour confirming evidence."),
      q("Illusion of control:", ["Believing you influence chance outcomes", "Being in control", "Setting limits", "Self-exclusion"], 0, "Rituals and picks feel like control over chance."),
    ],
  },
  "risk-indicators-among-post-secondary-students": {
    objectives: ["Describe risk factors for students.", "Identify campus supports."],
    task: "Find your campus counselling contact and add it to your journal.",
    taskAnswer: "For Olds College: Counselling Services via Student Services; any campus contact is acceptable.",
    reflection: "Why might college students be particularly targeted by betting ads?",
    quiz: [
      q("A student risk factor:", ["Stable routine", "Easy app access plus financial stress", "Not watching sports", "Low phone use"], 1, "Access plus stress raises risk."),
      q("Sports betting harm is linked to:", ["Only adults over 50", "Higher rates among young men", "Nobody", "Only casinos"], 1, "Young men show elevated rates."),
      q("Campus counselling is:", ["Only for academics", "A confidential support option", "Paid only", "Only for staff"], 1, "Counselling is confidential and student-focused."),
    ],
  },
  "responsible-gambling-tools-what-operators-and-re": {
    objectives: ["List operator RG tools.", "Evaluate their effectiveness."],
    task: "Compare RG tools on PlayAlberta vs one other licensed operator.",
    taskAnswer: "Expect deposit/loss/time limits, self-exclusion, reality checks, activity statements.",
    reflection: "Which tool would you actually use, and which would you ignore?",
    quiz: [
      q("A deposit limit:", ["Caps how much you can add", "Caps winnings", "Raises odds", "Is a bonus"], 0, "Deposit limits cap funding."),
      q("Reality checks:", ["Pop-up session reminders", "Bonuses", "Odds boosts", "Payouts"], 0, "They remind you of time spent."),
      q("RG tools work best when:", ["Set before betting starts", "Set after big losses", "Never used", "Shared with friends"], 0, "Pre-commitment is most effective."),
    ],
  },
  "advertising-standards-in-canada-and-how-ads-shap": {
    objectives: ["Describe Canadian betting advertising rules.", "Analyse how ads shape perceptions."],
    task: "Watch one betting ad and note who it targets and what it promises.",
    taskAnswer: "Common themes: social belonging, easy wins, bonuses; often young male audience.",
    reflection: "Should betting ads be banned during live sports broadcasts?",
    quiz: [
      q("Ontario restricted ads featuring:", ["Celebrities and athletes appealing to minors", "Logos", "Stadiums", "Odds"], 0, "AGCO standards restrict athletes/celebrities appealing to minors."),
      q("A misleading ad claim:", ["'Gamble responsibly'", "'Risk-free bet'", "'18+'", "'Know your limit'"], 1, "'Risk-free' implies no loss; regulators restrict it."),
      q("Ads mainly aim to:", ["Educate about odds", "Increase sign-ups and betting frequency", "Reduce betting", "Fund research"], 1, "Advertising is a customer-acquisition tool."),
    ],
  },
  "support-and-referral-pathways-in-alberta": {
    objectives: ["Identify Alberta support services.", "Describe how to refer someone."],
    task: "Visit the Support page and identify two services and how to contact them.",
    taskAnswer: "Alberta Addiction Helpline 1-866-332-2322; GameSense; campus counselling.",
    reflection: "What makes it hard for someone to reach out for help?",
    quiz: [
      q("The Alberta Addiction Helpline is available:", ["Weekdays only", "24/7", "Mornings only", "By appointment"], 1, "It's free, confidential and 24/7."),
      q("GameSense is:", ["A betting app", "A responsible-gambling information program", "A sports league", "A tax"], 1, "GameSense provides RG information."),
      q("Referring a friend means:", ["Forcing them", "Sharing resources and encouraging contact", "Reporting them to police", "Ignoring it"], 1, "Support, not pressure."),
    ],
  },
};
