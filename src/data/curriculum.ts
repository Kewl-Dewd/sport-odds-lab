// Built-in starter curriculum for sports-betting classes.
//
// Instructors assign topics (or individual modules) to a class from the
// Learning tab; each assigned module becomes a row in `class_lessons` and
// shows up in the student's Assigned learning section, grouped by topic.
//
// Sources referenced in the responsible-play topic: National Council on
// Problem Gambling (ncpgambling.org), the 1-800-GAMBLER helpline, Responsible
// Gambling Council (responsiblegambling.org), GameSense, and Gamblers
// Anonymous (gamblersanonymous.org).

export type CurriculumKind = "lesson" | "assignment" | "rg";

export interface CurriculumModule {
  key: string;
  title: string;
  minutes: number;
  kind: CurriculumKind;
  /** Acknowledgment-style completion (used for responsible-play content). */
  requiresAck?: boolean;
  body: string;
}

export interface CurriculumTopic {
  key: string;
  title: string;
  summary: string;
  modules: CurriculumModule[];
}

export const CURRICULUM: CurriculumTopic[] = [
  {
    key: "intro",
    title: "1. Getting started",
    summary:
      "What this course is, how the class sportsbook works, and the ground rules before anyone places a bet.",
    modules: [
      {
        key: "intro-welcome",
        title: "Welcome: what this app is (and isn't)",
        minutes: 4,
        kind: "lesson",
        body: `## Welcome to the class sportsbook

This app is a **simulation built on real market data**. The games, teams and odds you see are pulled live from a commercial odds feed — the same numbers a real sportsbook is posting right now. What is *not* real is the money: every student starts with a bankroll of simulated units set by the instructor.

### Why simulate?
Sports betting is one of the cleanest classrooms in finance. Every position has:
- a **known price** (the odds),
- a **known expiry** (the final whistle),
- and a **binary, verifiable outcome**.

That means you can measure your decision quality in weeks instead of years, and you can see the difference between a good decision and a good result.

### The three roles in this class
1. **You, the bettor.** You research, price and place positions with a limited bankroll.
2. **Your instructor, the book.** They decide which markets are open, how long a round runs, and they see the book's profit and loss.
3. **The market.** The odds move as money and information arrive. Your edge, if you have one, lives in the gap between the price and reality.

### What you will be graded on
Not on how much you win. Randomness is loud over a semester of bets. You will be assessed on process: staking discipline, the quality of your written rationale in the bet journal, and completion of the learning modules.

### Ground rules
- No real money is ever wagered, deposited or won in this app.
- Bets are visible to your instructor and, in the class ticker, to your classmates.
- The responsible-play module is required. Do it before you place a large share of your bankroll.

**Take-away:** treat your simulated bankroll like it is real capital you are accountable for. Habits you build here are the habits you keep.`,
      },
      {
        key: "intro-tour",
        title: "A tour of the app in five minutes",
        minutes: 3,
        kind: "lesson",
        body: `## Where everything lives

**Dashboard** — your home base. Bankroll, open exposure, profit and loss, your assigned learning, and the class action ticker showing what your classmates are betting.

**Markets** — the live board. Upcoming games pulled from the odds feed, filtered to the sports and leagues your instructor allowed. Click any game to see the full price on each side.

**Bet slip** — opens when you select a price. Enter your stake, confirm the odds and payout, then place.

**My Bets / Portfolio** — every position you hold, split into open and settled. This is where you check exposure before adding another bet.

**Journal** — the written record of *why* you took each position. In most classes this is a graded requirement.

**Responsible play** — the safety module, plus links to real help resources.

**Leaderboard** — class standings for the current round.

### Two numbers to watch daily
- **Bankroll:** cash you can still deploy.
- **Open exposure:** money already at risk in unsettled bets. A leaderboard position with 80% of the bankroll at risk is not a lead, it is a coin flip waiting to happen.`,
      },
      {
        key: "intro-first-bet",
        title: "Assignment: place and journal your first bet",
        minutes: 15,
        kind: "assignment",
        body: `## Your first position

1. Open **Markets** and pick one game from an allowed league that starts in the next 72 hours.
2. Before you look at the price, write down which side you think wins and roughly how often (e.g. "home team, about 60%").
3. Now look at the odds and convert them to an implied probability (the next topic covers the maths; use the payout shown on the slip as a guide).
4. Place a **small** bet — no more than 1–2% of your bankroll.
5. Open **Journal** and record:
   - your estimated probability *before* seeing the price,
   - the price you got,
   - the single piece of information you leaned on most,
   - what would have to happen for you to admit the bet was a mistake.

**Submit:** a completed journal entry linked to the bet. Your instructor sees both.

**Why the pre-estimate matters:** once you see a price, your brain anchors to it. Writing your number first is the only way to find out whether you actually disagreed with the market or just went along with it.`,
      },
    ],
  },
  {
    key: "how-betting-works",
    title: "2. How sports betting works",
    summary:
      "Odds formats, implied probability, the vig, and the main bet types you will see on the board.",
    modules: [
      {
        key: "odds-formats",
        title: "Reading odds: American, decimal and fractional",
        minutes: 3,
        kind: "lesson",
        body: `## Three ways to write the same price

**Decimal (used in this app's payout maths).** The number is your total return per unit staked, stake included. 2.50 means 10 units returns 25 (15 profit).

**American.** A negative number is how much you must risk to win 100. A positive number is what you win on a 100 risk.
- \u2212150 → risk 150 to win 100 → decimal 1.667
- +200 → risk 100 to win 200 → decimal 3.00

**Fractional.** Profit over stake. 5/2 means 5 profit for every 2 risked → decimal 3.50.

### Conversions worth memorising
- American negative → decimal: \`1 + (100 / |odds|)\`
- American positive → decimal: \`1 + (odds / 100)\`
- Decimal → implied probability: \`1 / decimal\`

### Quick reference
| American | Decimal | Implied |
|---|---|---|
| \u2212300 | 1.33 | 75.0% |
| \u2212150 | 1.67 | 60.0% |
| \u2212110 | 1.91 | 52.4% |
| +100 | 2.00 | 50.0% |
| +150 | 2.50 | 40.0% |
| +300 | 4.00 | 25.0% |

**Practice:** convert three prices from the live board into implied probabilities before your next class.`,
      },
      {
        key: "implied-vig",
        title: "Implied probability and the vig",
        minutes: 4,
        kind: "lesson",
        body: `## The house edge, in one calculation

Take a typical two-sided market at \u2212110 / \u2212110 (decimal 1.909 each).

- Implied probability each side: 1 / 1.909 = **52.4%**
- Add them: 52.4% + 52.4% = **104.8%**

Real probabilities must sum to 100%. The extra **4.8%** is the *overround*, or **vig** — the book's built-in margin. It is the price of doing business, and it is why a coin-flip bettor loses money slowly and inevitably.

### Removing the vig ("no-vig" or fair odds)
Divide each side's implied probability by the total:
- 52.4 / 104.8 = **50.0%** fair on each side.

Do this on every market you take. The fair price tells you what the market really thinks; the posted price tells you what you must beat.

### Break-even
At \u2212110 you must win **52.4%** of bets just to break even. A bettor hitting 55% is doing extremely well. A bettor hitting 60% over a large sample is a professional.

### What this means for you
Your edge is not "I think the home team wins." Your edge is "I think the home team wins **more often than 52.4%**, and the price does not reflect that."`,
      },
      {
        key: "how-the-book-earns",
        title: "How the book makes money (and why our lines don't move)",
        minutes: 4,
        kind: "lesson",
        body: `## We run this class like a real sportsbook

Every price you see on the Markets board comes **straight from a live odds feed** — the same numbers a commercial book is posting right now. Two things follow from that, and they are the whole point of this module.

### 1. Your bet does not move the line
On a prediction-market exchange, buying pushes the price up against you. A sportsbook does not work that way. The book **posts a price and honours it** for every ticket it writes until it decides to repost. So in this app:

- The odds on the slip are the odds you get. No slippage, no "line moved on you."
- The number only changes when the **feed** changes — an injury, a lineup scratch, weather, or sharp money moving the real market.
- Bet early at a price you like, or wait and see if the feed moves your way. That is a real decision with a real cost.

### 2. The vig is already inside the price
The book does not charge a commission on the side. It charges by **shading both prices**. Add up the implied chances on a two-way market and you get something above 100%:

| | Posted | Implied |
|---|---|---|
| Home | −110 | 52.4% |
| Away | −110 | 52.4% |
| **Total** | | **104.8%** |

That extra **4.8%** is the overround. Expressed as a share of the money written, the book's theoretical **hold** is:

> hold = (total implied − 100%) ÷ total implied = 4.8 / 104.8 = **4.6%**

So on a perfectly balanced book — equal money on both sides — the house keeps about **$4.60 of every $100 wagered**, no matter who wins. It never needs to pick a winner.

### 3. Why the book still has risk
Real books are rarely balanced. If the whole class hammers one side, the instructor's book is **exposed**: it wins big if that side loses and loses big if it wins. Your instructor can see this live on the class Book dashboard — handle, payouts, exposure by game, and hold %.

Watch it over a round and you will see the two forces that run the industry:
- **Vig** grinds a small, certain edge out of volume.
- **Imbalance** adds variance the book did not choose.

### What to take away
- You are always paying the vig. A break-even bettor at −110 needs **52.4%** winners just to stand still.
- The posted price is not a probability — divide by the total to get the fair (no-vig) number before you decide anything.
- The book's profit is the mirror image of the class's losses. Watching the house side is the fastest way to understand why "the house always wins" is a statement about **margin and volume**, not luck.`,
      },

      {
        key: "bet-types",
        title: "Bet types: moneyline, spread, totals and parlays",
        minutes: 4,
        kind: "lesson",
        body: `## The menu

**Moneyline** — pick the winner, no handicap. Simple, but favourites pay poorly and underdogs need genuine upset value.

**Point spread (handicap)** — the favourite must win by more than the spread; the underdog can lose by less than it and still cash. Spreads exist to move a lopsided game toward a 50/50 proposition so the book can take money on both sides.

**Totals (over/under)** — bet on the combined score, not the winner. Often driven by pace, weather, injuries to scorers and defensive quality.

**Parlays** — several bets combined; all legs must win. The payout looks huge because the probability is tiny. Multiply the decimal odds of each leg to see the true price, then compare it to what the book pays. Parlays carry compounded vig, which is why they are the most profitable product on a real sportsbook's menu.

### Worked parlay example
Three legs at \u2212110 (1.909 each): 1.909³ = **6.96** fair-ish decimal, but the true no-vig price is 2.0³ = **8.00**. You are giving up roughly 13% of expected value for the convenience of one ticket.

**Rule of thumb for this class:** if you place a parlay, journal an explicit reason why the legs are correlated or mispriced. "Bigger payout" is not a reason.`,
      },
      {
        key: "line-movement",
        title: "Line movement, closing line value and market efficiency",
        minutes: 4,
        kind: "lesson",
        body: `## Why the number changes

Prices move for two reasons:
1. **Information** — an injury, a lineup scratch, weather, a goalie announcement.
2. **Money** — the book adjusts to balance its exposure.

### Closing line value (CLV)
The **closing line** is the last price before kick-off. It is the single best publicly available estimate of true probability, because it contains every piece of information and every dollar of sharp money.

If you consistently bet at prices better than the close — you took +150 and it closed +120 — you have **positive CLV**. Over a large sample, CLV predicts profitability far better than your win rate does. This app records the closing odds on your settled bets for exactly this reason.

### How to use it
- Beating the close on 55%+ of your bets means your process has an edge, even in a losing month.
- Consistently getting worse prices than the close means you are the money the market moves against.

**Take-away:** grade yourself on the price you got, not just the result you got.`,
      },
      {
        key: "betting-quiz",
        title: "Assignment: price a game yourself",
        minutes: 20,
        kind: "assignment",
        body: `## Beat the board

Pick one upcoming game on the class board and, **before looking at the odds**:

1. Estimate each side's win probability. Justify it in three bullet points (form, injuries, rest, home advantage, pace, whatever your reasoning is).
2. Convert your probabilities into fair decimal odds (\`1 / probability\`).
3. Now open the market. Remove the vig from the posted price to get the market's fair probability.
4. Compare. Where do you disagree, and by how many percentage points?
5. State whether that gap is large enough to bet on, and what stake you would use.

**Submit** as a journal entry. A disagreement of one or two points is noise; you are looking for a gap that survives your own scepticism.`,
      },
    ],
  },
  {
    key: "using-the-app",
    title: "3. Using the app",
    summary:
      "Navigating the board, placing bets correctly, tracking exposure, and keeping a journal your instructor can grade.",
    modules: [
      {
        key: "app-markets",
        title: "The markets board and finding a game",
        minutes: 3,
        kind: "lesson",
        body: `## Working the board

The board shows upcoming games from the leagues your instructor enabled, sorted by start time. Each row gives you the teams, the start time, and the available prices.

**Things to check before you click:**
- **Start time.** Once a game starts it leaves the board; you cannot bet it.
- **Which market you are on.** Moneyline, spread and total are different tabs of the same game.
- **Whether your instructor curated the board.** Some classes only allow specific published games or a specific round.

**Refreshing:** prices are cached for a few minutes to stay inside the data feed's limits. If a price looks stale, reload the page — the number you get is the number confirmed on the slip.`,
      },
      {
        key: "app-slip",
        title: "Placing a bet: the slip, stake and payout",
        minutes: 3,
        kind: "lesson",
        body: `## Anatomy of the bet slip

1. **Selection** — the team or side you are backing.
2. **Odds** — the decimal price locked in when you confirm. Later movement does not change your ticket.
3. **Stake** — units risked. Your bankroll must cover it, and it must respect any per-bet cap your instructor set.
4. **Potential payout** — stake × odds, stake included. Profit is payout minus stake.

### Class limits you may hit
- **Max stake per bet.** Set by your instructor to stop all-in behaviour.
- **Max bets per day.** Slows down tilt-betting.
- **Journal required.** Some classes require a rationale before the slip will submit.

### After you place
The bet moves to **My Bets** as *open*, your bankroll drops by the stake, and your open exposure rises. When the game settles, the result and payout post automatically and your bankroll updates.`,
      },
      {
        key: "app-portfolio",
        title: "Tracking exposure, P&L and the leaderboard",
        minutes: 3,
        kind: "lesson",
        body: `## Reading your own numbers

**Bankroll** — deployable cash. **Open exposure** — stake locked in unsettled bets. **Settled P&L** — realised profit or loss. Your leaderboard position uses total value, so a big open position can flatter you until it resolves.

### Metrics worth knowing
- **ROI** = profit ÷ total staked. A better measure than raw profit, because it accounts for how much you risked to get there.
- **Win rate** — useful only alongside average odds. 70% at heavy favourites can be a losing strategy; 40% at long prices can be a winning one.
- **Average stake** — if this creeps up after losses, you are chasing.

### The class ticker
The dashboard ticker shows classmates' bets and results. Use it to notice herd behaviour: when the whole class piles onto one side, ask why, and ask whether the price still justifies it.`,
      },
      {
        key: "app-journal",
        title: "Keeping a journal your instructor can grade",
        minutes: 3,
        kind: "assignment",
        body: `## What a good entry looks like

A strong journal entry is short, specific and falsifiable:

> **Bet:** Home side, moneyline, decimal 2.10, 2% of bankroll.
> **My estimate:** 52% win. Market implies 47.6% after removing vig.
> **Reason:** Their starting keeper is back from injury and the road team is on the second night of a back-to-back.
> **What would prove me wrong:** if the keeper is a late scratch, or the road team rests nobody.
> **Confidence:** 6/10.

After the game settles, add one line of reflection: *was the process right, independent of the result?*

**Assignment:** journal every bet you place for the next two weeks. Your instructor sees completion rates in the progress gradebook.`,
      },
    ],
  },
  {
    key: "strategy",
    title: "4. Bankroll and strategy",
    summary:
      "Staking, variance, expected value, and the behavioural traps that beat most bettors before the market does.",
    modules: [
      {
        key: "bankroll-units",
        title: "Bankroll management and unit sizing",
        minutes: 3,
        kind: "lesson",
        body: `## Survive first, win later

Your bankroll is your ability to keep playing. Blow it up and even a genuine edge is worthless.

### Flat staking
Bet the same percentage — commonly **1–2%** of the starting bankroll — on every position. Boring, robust, and the default recommendation for this class.

### Kelly criterion
Kelly gives the mathematically growth-optimal stake:

\`f = (bp \u2212 q) / b\`

where \`b\` = decimal odds − 1, \`p\` = your win probability, \`q\` = 1 − p.

Example: odds 2.50 (b = 1.5), your p = 0.45, q = 0.55 → f = (1.5 × 0.45 − 0.55) / 1.5 = **8.3%** of bankroll.

Full Kelly is violently volatile and assumes your probability estimate is correct — it never is. Practitioners use **quarter Kelly** or **half Kelly**, which keeps most of the growth with a fraction of the drawdown.

### Non-negotiables
- Never increase stake size to recover a loss.
- Size on your edge, not your confidence or your mood.
- Cap total open exposure (a common rule: no more than 10–15% of bankroll at risk at once).`,
      },
      {
        key: "variance",
        title: "Variance, drawdowns and sample size",
        minutes: 3,
        kind: "lesson",
        body: `## Why good bettors lose for months

A bettor with a genuine 3% edge at even-ish odds will still have losing stretches that feel like a broken strategy. Over 100 bets at 53% true win rate, finishing below break-even is entirely ordinary.

### The numbers
- 100 bets is a *sample*, not evidence.
- 1,000 bets starts to separate skill from luck.
- Drawdowns of 20–30% of bankroll happen to profitable bettors.

### What to do about it
- Judge process, not outcome: was the price good, was the stake right, was the reasoning written down?
- Track **CLV** — it converges far faster than profit.
- Never re-size your bets because of a short run in either direction.

**Classroom implication:** a semester is a small sample. The leaderboard winner is often the luckiest competent player, not the best analyst. Your journal is where the real skill shows.`,
      },
      {
        key: "expected-value",
        title: "Expected value and finding an edge",
        minutes: 3,
        kind: "lesson",
        body: `## The only question that matters

\`EV = (probability of winning × profit) \u2212 (probability of losing × stake)\`

Example: 10 units at decimal 2.50 (profit 15), your estimated win probability 45%.
EV = (0.45 × 15) − (0.55 × 10) = 6.75 − 5.50 = **+1.25 units** per bet.

Positive EV over many bets is the entire game.

### Where edges actually come from
- **Information speed** — reacting to a lineup or weather change before the price does.
- **Niche markets** — lower limits and less attention mean softer prices than a marquee game.
- **Price shopping** — taking the best available number moves your break-even meaningfully.
- **Model discipline** — a simple model applied consistently beats gut feel applied erratically.

### Where edges do not come from
Recent results, team loyalty, "due for a win", parlay dreams, or a system with no measurement.`,
      },
      {
        key: "bias",
        title: "Behavioural traps: tilt, recency and the favourite bias",
        minutes: 3,
        kind: "lesson",
        body: `## The opponent in your own head

**Tilt / chasing.** Increasing stakes after a loss to "get it back". The single most common way bankrolls die.

**Recency bias.** Overweighting the last game you watched. Markets already priced it.

**Confirmation bias.** Searching for stats that support the bet you already want.

**Favourite–longshot bias.** Casual money overprices longshots (dreams of a big payout) and undervalues short favourites. Know which side of that you are on.

**Availability from narrative.** Media storylines are entertainment, not information.

**Sunk-cost betting.** Doubling on a live bet purely because you are already in it.

### Countermeasures used in this class
- Written pre-bet rationale (kills confirmation bias).
- Fixed unit sizing (kills tilt).
- Post-settlement reflection (separates process from result).
- Daily bet caps set by your instructor (kills volume spirals).`,
      },
    ],
  },
  {
    key: "responsible-play",
    title: "5. Responsible play",
    summary:
      "Required module: the real-world risks, the warning signs, and where to get help.",
    modules: [
      {
        key: "rg-risks",
        title: "The real-world risks behind the simulation",
        minutes: 4,
        kind: "rg",
        requiresAck: true,
        body: `## This is required reading

The app is simulated. The behaviour it teaches is not.

### What the research says
- Roughly **1%** of adults meet the criteria for gambling disorder, and another **2–3%** experience problem-gambling harms (National Council on Problem Gambling).
- **Young men aged 18–24** are the highest-risk demographic for sports betting harm — the same group most likely to be in this class.
- Harm concentrates: a small minority of accounts generates most of the losses on commercial books.
- Sports betting apps are designed for engagement — push notifications, same-game parlays, live betting, deposit bonuses. Every one of those features increases frequency, and frequency multiplies the house edge.

### The maths of the house edge
At standard \u2212110 pricing the book keeps roughly 4.5–5% of every dollar wagered over time. Parlays are far worse. There is no strategy that removes the edge; there is only being right often enough to beat it, which almost nobody is.

### Rules that actually protect people
- Bet only money you have already decided you can lose.
- Set a hard budget and a time limit before you start, not during.
- Never bet to recover losses.
- Never bet with borrowed money or credit.
- Do not bet while drinking, angry, or after a bad day.
- Keep it a small part of how you enjoy sport.

By acknowledging this module you confirm you have read it and understand that no betting strategy overcomes the house edge over time.`,
      },
      {
        key: "rg-warning-signs",
        title: "Warning signs and how to help someone",
        minutes: 4,
        kind: "rg",
        requiresAck: true,
        body: `## Know the signs

In yourself or a friend:
- Betting more, or more often, than intended.
- Chasing losses with bigger bets.
- Hiding bets, or lying about how much or how often.
- Borrowing money, selling things, or missing bills to bet.
- Restlessness or irritability when trying to cut back.
- Betting to escape stress, loneliness or low mood.
- Missing classes, work or commitments because of betting.
- Relationships suffering; people expressing concern.

### If it's you
Take a break. Use self-exclusion and deposit limits — every licensed operator must offer them. Tell one person you trust. Call the helpline. None of this requires you to have hit rock bottom first.

### If it's a friend
- Pick a private moment and be direct without accusing: *"I've noticed you've been betting a lot — how are you doing?"*
- Listen instead of lecturing; shame drives it underground.
- Do not lend money or cover losses. It extends the problem.
- Offer to help find support, and share the helpline.
- Look after yourself too — family and friends can call the same helplines.

### Get help (free, confidential, 24/7)
- **1-800-GAMBLER** (1-800-426-2537) — US National Problem Gambling Helpline; text or chat also available.
- **ncpgambling.org** — National Council on Problem Gambling: screening tools and state-by-state resources.
- **ConnexOntario 1-866-531-2600** / **responsiblegambling.org** — Canadian support and the Responsible Gambling Council.
- **gamblersanonymous.org** — peer support meetings, in person and online.
- **Gam-Anon** — support for family and friends.

Campus counselling services also handle this and are usually free to students.`,
      },
      {
        key: "rg-reflection",
        title: "Assignment: personal limits reflection",
        minutes: 15,
        kind: "assignment",
        body: `## Write your own rules

In 250–400 words:

1. Set the limits you would apply if this were real money: a monthly budget, a maximum single stake, a maximum number of betting days per week, and a stop-loss that ends the month.
2. Explain how the app's design features — the ticker, the leaderboard, the live board, instant settlement — pushed you toward betting more than you planned. Be specific about a moment it happened.
3. Identify the one warning sign you would find hardest to notice in yourself, and name the person you would tell.
4. Describe how you would respond if a friend told you they were in trouble with betting.

There is no right answer and no grade for "correct" limits. You are graded on honesty and specificity.`,
      },
    ],
  },
];

export const CURRICULUM_MODULES: (CurriculumModule & { topic: string; topicTitle: string })[] =
  CURRICULUM.flatMap((t) =>
    t.modules.map((m) => ({ ...m, topic: t.key, topicTitle: t.title })),
  );

export function findCurriculumModule(key: string) {
  return CURRICULUM_MODULES.find((m) => m.key === key);
}
