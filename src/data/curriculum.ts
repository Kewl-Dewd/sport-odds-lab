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

/** Lessons a student must acknowledge before placing their first position. */
export const GATE_LESSON_KEYS = ["rg-risks", "rg-warning-signs"];

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

const RAW_CURRICULUM: CurriculumTopic[] = [
  {
    key: "responsible-play",
    title: "1. Before you start: the real-world risks",
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
  {
    key: "canadian-industry",
    title: "2. The Canadian wagering industry",
    summary:
      "How legal single-event wagering works in Canada, who regulates it, and who profits.",
    modules: [
      {
        key: "single-event-wagering-in-canada-after-bill-c-218",
        title: "Single-event wagering in Canada after Bill C-218",
        minutes: 4,
        kind: "lesson",
        body: `## From parlays-only to single games

Until 2021 the Criminal Code only let provinces offer **parlay** bets (at least two outcomes on one ticket). Betting on one game was illegal in Canada, so that money went to offshore sites and illegal bookmakers.

**Bill C-218, the Safe and Regulated Sports Betting Act**, removed the parlay requirement from section 207(4)(b) of the Criminal Code. It received Royal Assent on **June 29, 2021** and came into force on **August 27, 2021**.

### What changed and what didn't
- Provinces can now "conduct and manage" single-event sports betting, either on their own or through licensed operators.
- Betting is still a **provincial** responsibility: each province decides who can offer it and how.
- **Horse racing** is still regulated federally by the Canadian Pari-Mutuel Agency and wasn't part of the change.
- Betting with an unlicensed bookmaker is still illegal.

### Why it matters for this class
Single-game betting is easy to understand and heavily advertised, so most new bettors start there. It also makes every game something you can bet on, which is why regulators pair it with age limits, advertising rules and self-exclusion tools (Module 6).

**Sources:** Parliament of Canada, LEGISinfo, Bill C-218 (43rd Parliament, 2nd session); Criminal Code of Canada, s. 207; Wikipedia, "Sports betting in Canada" (CC BY-SA).`,
      },
      {
        key: "who-regulates-aglc-igaming-ontario-and-provincia",
        title: "Who regulates: AGLC, iGaming Ontario and provincial bodies",
        minutes: 4,
        kind: "lesson",
        body: `## Who makes the rules

The Criminal Code lets each province **conduct and manage** gambling, so there is no single national regulator.

### Alberta
- **AGLC (Alberta Gaming, Liquor and Cannabis)** is the regulator. It runs background checks on operators and suppliers, and checks that they follow the rules.
- **AiGC (Alberta iGaming Corporation)** is a Crown corporation created by the *iGaming Alberta Act* (Bill 48, 2025). It manages operator agreements, anti-money-laundering compliance and revenue sharing.
- **PlayAlberta.ca** was AGLC's own online site, and was the only legal option before the open market.

### Ontario
- **AGCO (Alcohol and Gaming Commission of Ontario)** writes and enforces the Registrar's Standards for Internet Gaming.
- **iGaming Ontario** manages the private market, which opened on **April 4, 2022**.

### Other provinces
Most provinces sell betting through a lottery corporation: BCLC (PlayNow), Loto-Québec (Mise-o-jeu), the Atlantic Lottery Corporation (Proline) and the Western Canada Lottery Corporation in the Prairies.

### Why two bodies?
Keeping the regulator (who checks the rules) separate from the market manager (who signs contracts and collects revenue) reduces conflicts of interest. A body that both earns from gambling and polices it has mixed incentives.

**Sources:** abigaming.ca (AiGC General FAQs); alberta.ca, "Alberta's iGaming Strategy"; agco.ca; igamingontario.ca.`,
      },
      {
        key: "operator-models-provincial-monopoly-private-lice",
        title: "Operator models: provincial monopoly, private licensed, offshore grey market",
        minutes: 4,
        kind: "lesson",
        body: `## Three ways to run a market

**1. Provincial monopoly.** The government is the only legal seller, for example BCLC's PlayNow or Loto-Québec. Profits go straight to the province. The downside is fewer choices and less competitive prices, so some players go offshore.

**2. Private licensed (open) market.** Private brands register with the province and pay a share of revenue. Ontario opened its market in April 2022. Alberta followed: AiGC launched it on **July 13, 2026** with 22 registered sites. Under Alberta's model, operators keep 80% of net iGaming revenue and the province keeps 20%. Before that, 3% of gross revenue goes to First Nations initiatives and social-responsibility funding.

**3. Offshore grey market.** These sites are licensed somewhere else (Malta, Curaçao, Kahnawake) but not by the province. Alberta estimated that about **70%** of online gambling in the province happened on these unregulated sites before 2026. Player protection on them varies, there may be no self-exclusion link, and disputes are hard to settle.

### The policy trade-off
The goal of an open market is **channelization**: moving existing players onto regulated sites, not creating new players. Critics point out that more licensed brands also means more advertising.

### Discussion
Which model best protects a 19-year-old student? Which one raises the most revenue? Can one model do both?

**Sources:** alberta.ca, "Alberta's iGaming Strategy"; abigaming.ca news release, July 13 2026; igamingontario.ca.`,
      },
      {
        key: "leagues-teams-broadcasters-and-sportsbooks-follo",
        title: "Leagues, teams, broadcasters and sportsbooks: following the money",
        minutes: 4,
        kind: "lesson",
        body: `## Where the money flows

Legal betting created a new set of business relationships across sport.

- **Leagues** sign official data and sponsorship deals with sportsbooks. Sportsbooks pay for fast, official stats, which are needed for live betting.
- **Teams and arenas** sell naming rights, signs and in-venue betting lounges.
- **Broadcasters** sell ad time and add odds to the broadcast. Some own a stake in a sportsbook.
- **Media and affiliates** earn a commission for every new customer they sign up.
- **Data companies** (Sportradar, Genius Sports) sell feeds to books and integrity monitoring to leagues.
- **Governments** collect their share of revenue.

### The integrity side
More betting money means more pressure on athletes and officials. Leagues work with monitoring services that flag unusual betting patterns, and the major North American leagues have suspended players for breaking betting rules.

### Following the money
For any partnership, ask:
1. Who pays whom?
2. What does each side get: data, customers, brand reach?
3. Who sees the ads? Are any of them under 18?
4. Does the partnership create a conflict of interest for the broadcaster or the league?

**Sources:** company annual reports (Sportradar, Genius Sports); Canadian Gaming Association public reports; Wikipedia, "Sports betting" (CC BY-SA).`,
      },
      {
        key: "assignment-map-a-sport-organization-s-wagering-p",
        title: "Assignment: map a sport organization's wagering partnerships",
        minutes: 4,
        kind: "assignment",
        body: `## Assignment: follow one organization's money

Choose one professional team or league that plays in Canada, such as the Oilers, Flames, Elks or Stampeders, or the NHL, CFL or MLS.

**Deliver a one-page map (diagram plus about 300 words) that shows:**
1. Every wagering-related partner you can find: official sportsbook, data provider, broadcaster betting segments, arena signs.
2. Which way the money moves for each relationship, and what each side gets.
3. Where the partnership shows up for fans: jerseys, broadcasts, apps, social media.
4. One integrity or responsible-gambling safeguard the organization publicly commits to.
5. Your view: does this relationship raise any concerns about youth exposure or conflicts of interest?

**Research tips:** team press releases, league sponsorship pages, annual reports, news archives. Cite at least three sources.

**Grading:** accuracy and sourcing (40%), clarity of the map (30%), critical analysis (30%).`,
      },
    ],
  },
  {
    key: "how-betting-works",
    title: "3. The mathematics of odds",
    summary:
      "Reading odds, implied probability, the vig, expected value and how the house edge grows.",
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
        key: "expected-value-hold-percentage-and-theoretical-r",
        title: "Expected value, hold percentage and theoretical return",
        minutes: 4,
        kind: "lesson",
        body: `## Three numbers that describe every bet

### Expected value (EV)
EV is the average result per dollar if you repeated the same bet many times:

**EV = (your win probability × profit if you win) − (loss probability × stake)**

Example: a $10 bet at +150 (profit $15) where you believe the true win chance is 40%:
0.40 × 15 − 0.60 × 10 = 6 − 6 = **$0**, a break-even bet. At 45% the EV is **+$1.25**. The bet slip calculates this from your forecast.

### Hold percentage
Hold is the share of all money bet that the book keeps. For a two-way market with implied probabilities p1 and p2:

**Theoretical hold = 1 − 1 ÷ (p1 + p2)**

At −110 / −110, each side implies 52.38%, which adds up to 104.76%. The hold is 1 − 1/1.0476 ≈ **4.5%**.

### Theoretical return to player (RTP)
RTP = 1 − hold. At standard −110 pricing, bettors get about **95.5 cents back per dollar** on average. Casino slots usually return 85–95%.

### Actual vs theoretical hold
Over one weekend the book's actual result can be anything, positive or negative. Over thousands of bets, actual hold gets closer to theoretical hold. Your instructor's Book dashboard shows both.

**Take-away:** because of the hold, the average bettor's EV is negative. You only get a positive-EV bet when your probability is better than the market's no-vig probability.

**Sources:** Wikipedia, "Expected value" and "Mathematics of bookmaking" (CC BY-SA).`,
      },
      {
        key: "props-and-parlays-where-the-house-edge-grows",
        title: "Props and parlays: where the house edge grows",
        minutes: 4,
        kind: "lesson",
        body: `## Why the edge grows

### Props
Player and game props (shots on goal, first scorer, passing yards) usually have **higher margins**, often 6–10% or more, compared with about 4.5% on main lines. Books take on more risk with less information, and less money is bet on props to sharpen the price.

### Parlays multiply the margin
Each leg has its own vig. Combining legs **multiplies** the edges:

**Parlay fair-value ratio = (1 − hold)^legs (approximately)**

| Legs (each −110) | Payout | Fair payout | Edge |
|---|---|---|---|
| 2 | +264 | +300 | ~9% |
| 3 | +596 | +700 | ~13% |
| 5 | +2,333 | +3,100 | ~21% |

### Same-game parlays
Legs from one game are **correlated**: if a quarterback throws for 300 yards, his receiver likely gains a lot of yards too. Books price that correlation themselves and often add extra margin on top.

### Why books promote them
Parlays and props give the book its highest hold, and lottery-style payouts appeal to casual bettors. That is why they get the most advertising and "boost" promotions.

Try the **Parlay calculator** on the Tools page and watch the combined edge grow with each leg.

**Sources:** Wikipedia, "Parlay (gambling)" and "Mathematics of bookmaking" (CC BY-SA); Tools page calculations in this app.`,
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
    key: "strategy",
    title: "4. Risk, variance and the house edge",
    summary:
      "Staking, variance, sample size and why most edges disappear.",
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
        title: "Expected value and why most edges disappear",
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
    ],
  },
  {
    key: "data-models",
    title: "5. Data, models and market prices",
    summary:
      "Sourcing data, building a simple model, and testing it against the market.",
    modules: [
      {
        key: "sourcing-and-preparing-sport-data",
        title: "Sourcing and preparing sport data",
        minutes: 4,
        kind: "lesson",
        body: `## Good models start with clean data

### Free and open sources
- **Official league sites** (NHL, MLB, NBA): box scores, standings, schedules.
- **Sports-Reference family** (Hockey-, Baseball-, Basketball-, Pro-Football-Reference): long histories, CSV export.
- **MoneyPuck, Natural Stat Trick** (hockey): expected goals and shot data.
- **Baseball Savant / Retrosheet** (baseball): pitch-level and historical game logs.
- **Kaggle open datasets**: ready-made historical results and odds.
- **This app's history**: your past bets, forecasts and closing lines.

Always check the site's terms of use before scraping, and credit the source.

### Preparing the data
1. **Define the question.** For example: "Will the home team win?"
2. **One row per game**, with the date, both teams, the result and features.
3. **Use only information known before the game.** Using the final score to predict the winner is called **leakage**, and it makes a model look far better than it is.
4. **Handle missing values** (postponed games, team relocations).
5. **Keep team names consistent** across sources.
6. **Split by time:** build on older seasons and test on the most recent one.

### Useful starting features
Goal or run differential, home/away, rest days, back-to-backs, starting goalie or pitcher, recent form over a fixed window.

**Sources:** sports-reference.com; moneypuck.com; baseballsavant.mlb.com; kaggle.com/datasets.`,
      },
      {
        key: "building-a-simple-rating-model",
        title: "Building a simple rating model",
        minutes: 4,
        kind: "lesson",
        body: `## A rating model in a spreadsheet

### Option 1: Elo ratings
Elo was invented for chess and is widely used in sports (FiveThirtyEight published open NFL, NBA and MLB Elo data).

1. Every team starts at **1500**.
2. Expected win chance for team A: **E = 1 ÷ (1 + 10^((Rb − Ra) ÷ 400))**
3. After the game: **new rating = old + K × (result − E)**, where result is 1 for a win and 0 for a loss. K is often 20.
4. Add about 50–100 points to the home team's rating before calculating E.

A 100-point gap gives the stronger team about a **64%** win chance.

### Option 2: Points-differential rating
Average goal (or run) differential per game, adjusted for home advantage. Convert it to a probability with a simple lookup from past games: "teams +0.5 goals better won X% of the time."

### Turning it into a forecast
Your model outputs a probability, for example 58%. Enter it as your **forecast** on the bet slip. The app then shows your EV against the market price.

### Keep it simple
A model with three good inputs that you understand beats a model with thirty you can't explain. Write down the rules **before** you look at tonight's odds.

**Sources:** Wikipedia, "Elo rating system" (CC BY-SA); FiveThirtyEight open data on GitHub (CC BY 4.0).`,
      },
      {
        key: "comparing-your-model-to-the-market",
        title: "Comparing your model to the market",
        minutes: 4,
        kind: "lesson",
        body: `## You vs. the market

The market's **no-vig probability** is a very strong benchmark: it combines information from thousands of bettors and professional oddsmakers.

### Step by step
1. Convert both sides' odds to implied probabilities.
2. Remove the vig: divide each by their total. The bet slip shows this as **No-vig fair**.
3. Compare: your model's 58% vs. the market's 52% gives a **6-point disagreement**.

### Interpreting a disagreement
- **Small gaps (under 3 points)** are usually noise. The vig alone is about 2.3 points per side.
- **Large gaps** are more often a sign your model is missing something (an injury, the starting goalie) than a real edge.
- Check the news before trusting a big edge.

### Measuring who was right
- **Brier score:** the average of (forecast − result)². Lower is better. Compute it for your model and for the no-vig market over the same games.
- **Closing line value:** did the line move toward your number before the game started?
- **Calibration:** when you say 60%, does it happen about 60% of the time? See your Calibration page.

If the market's Brier score beats yours over 100+ games, that is a normal and useful finding. It shows how efficient betting markets are.

**Sources:** Wikipedia, "Brier score" and "Efficient-market hypothesis" (CC BY-SA).`,
      },
      {
        key: "line-movement",
        title: "Line movement, information and market efficiency",
        minutes: 4,
        kind: "lesson",
        body: `## Why the number changes

In this app the line only moves when the **live odds feed** moves — your own bet never changes the price (see "How the book makes money"). Out in the market, prices move for two reasons:
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
        key: "why-models-fail-sample-size-overfitting-and-vari",
        title: "Why models fail: sample size, overfitting and variance",
        minutes: 4,
        kind: "lesson",
        body: `## Three ways a good-looking model fools you

### 1. Sample size
A bettor who wins 55% of 40 bets could easily have a true win rate of 50%. The standard error of a win rate is about √(p(1−p)/n). For n = 40 that is ±7.9 points. You need **hundreds to thousands** of bets before a 2–3 point edge is distinguishable from luck.

### 2. Overfitting
If you add enough rules ("home teams on Tuesdays after a loss when it snows…"), any model can fit past results perfectly. It is memorizing noise, not learning patterns.
**Defences:** few inputs, decide the rules before testing, and always test on games the model has never seen (out-of-sample).

### 3. Variance
Even a correct 55% forecast loses 45% of the time. Losing streaks of 6–8 bets are normal over a season. Results swing much more than skill does, which is why this class scores **forecast accuracy and CLV** rather than profit.

### Other traps
- **Data leakage:** using information that wasn't available before the game.
- **Survivorship bias:** only studying "systems" that happened to work.
- **The market adapts:** once an edge is public, prices adjust and it disappears.

**Take-away:** be suspicious of any model that looks great on past data. Judge it by its performance on future games.

**Sources:** Wikipedia, "Overfitting", "Law of large numbers" and "Gambler's fallacy" (CC BY-SA).`,
      },
      {
        key: "assignment-model-vs-market-report",
        title: "Assignment: model vs. market report",
        minutes: 4,
        kind: "assignment",
        body: `## Assignment: model vs. market report

Over at least **two weeks** (or the betting window your instructor sets):

1. **Build** a simple model (Elo, points differential, or one of your own) and write down its rules **before** you start.
2. **Forecast** every game you bet in the app using your model's probability. Bet only small, consistent stakes.
3. **Report** (500–750 words plus one chart):
   - Your model's rules and data sources.
   - Your Brier score vs. the market no-vig Brier score over the same games.
   - Your average closing line value (from the Calibration page).
   - Your calibration chart. Were you overconfident or underconfident?
   - Your profit/loss, and why it does or doesn't tell you whether the model is good.
   - One change you would make, and how you would test it without overfitting.

**Grading:** method and honesty (40%), correct use of Brier/CLV/calibration (40%), reflection (20%). A model that loses money but is analysed well can earn full marks.`,
      },
    ],
  },
  {
    key: "bias-advertising-support",
    title: "6. Bias, advertising and support",
    summary:
      "Behavioural traps, risk indicators, advertising standards and where to get help.",
    modules: [
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
      {
        key: "cognitive-biases-in-wagering-decisions",
        title: "Cognitive biases in wagering decisions",
        minutes: 4,
        kind: "lesson",
        body: `## How the brain misreads chance

Psychologists have documented systematic errors that matter a lot in betting.

- **Gambler's fallacy:** believing a result is "due" after a streak. Independent events have no memory.
- **Hot-hand belief:** expecting a streak to continue regardless of the underlying odds.
- **Illusion of control:** believing knowledge or rituals affect random outcomes more than they do.
- **Near-miss effect:** a bet that "almost" won feels like progress and encourages more betting, even though it was simply a loss.
- **Loss aversion:** losses hurt about twice as much as equal gains feel good (Kahneman and Tversky). This drives chasing.
- **Overconfidence:** most people's "90% sure" picks win far less than 90% of the time. Your Calibration page measures this directly.
- **Anchoring:** fixating on the first number seen, such as an opening line or a pundit's pick.
- **Selective memory:** remembering wins clearly and forgetting losses.

### Why sportsbooks benefit
Live betting, cash-out buttons, boosted parlays and instant notifications speed up decisions, and fast decisions make these biases stronger.

### What helps
Write the reason down before you bet, use fixed stake sizes, take breaks, and review your journal honestly.

**Sources:** Wikipedia, "Gambler's fallacy", "Illusion of control", "Loss aversion" and "Prospect theory" (CC BY-SA); Responsible Gambling Council, responsiblegambling.org.`,
      },
      {
        key: "risk-indicators-among-post-secondary-students",
        title: "Risk indicators among post-secondary students",
        minutes: 4,
        kind: "lesson",
        body: `## Why students are a higher-risk group

Research in Canada and elsewhere consistently finds that **young adults (18–24)** have higher rates of problem gambling than older adults. Contributing factors:

- **Brain development:** the parts of the brain that control impulses keep maturing into the mid-20s.
- **New independence:** first access to credit, student loans and a regular income.
- **Social exposure:** group chats, shared parlays, watching games with friends.
- **Heavy advertising** during sports broadcasts and on social media.
- **Overlap with other risks:** alcohol, gaming loot boxes, financial stress.
- **Sports knowledge** gives a false sense of skill ("I know hockey, so I'll win").

### Warning signs to watch for
- Betting with tuition, rent or loan money.
- Borrowing, or selling things, to bet or to cover losses.
- Chasing losses; raising stakes to get the same excitement.
- Missing class, work or sleep because of betting.
- Hiding or lying about how much you bet.
- Mood depending on results; irritability when trying to cut back.

A recognised self-check is the **Problem Gambling Severity Index (PGSI)**, nine questions developed in Canada.

### If you notice these signs
Talk to someone early. In Alberta, call the **Addiction Helpline at 1-866-332-2322** (24/7, free, confidential, includes gambling) or contact campus counselling. See the Support Resources page.

**Sources:** Canadian Centre on Substance Use and Addiction (ccsa.ca), Problem Gambling Severity Index; Alberta Health Services, Addiction Helpline listing; Responsible Gambling Council.`,
      },
      {
        key: "responsible-gambling-tools-what-operators-and-re",
        title: "Responsible-gambling tools: what operators and regulators offer",
        minutes: 4,
        kind: "lesson",
        body: `## Tools that exist to help you stay in control

### Tools on regulated sites
- **Deposit limits:** a daily, weekly or monthly cap. Lowering a limit takes effect immediately; raising it usually requires a waiting period.
- **Loss and wager limits:** caps on how much you can lose or bet.
- **Time limits and reality checks:** pop-ups showing how long you've played and your net result.
- **Cool-off periods:** a short lockout (24 hours to a few weeks).
- **Self-exclusion:** a longer ban (6 months to several years) that you can't undo early.
- **Activity statements:** a full history of deposits, bets and net losses.

### What regulators require
- Alberta's open market includes a **centralized self-exclusion system**: one sign-up covers every registered site. Advertising rules prohibit targeting minors and vulnerable people.
- Every Alberta operator must be independently **RG Check accredited** (a Responsible Gambling Council program).
- **GameSense** (from BCLC, used by AGLC in Alberta) provides advisors and plain-language information about odds and myths.
- Ontario's AGCO standards require similar limits and self-exclusion.

### Using them well
Set limits **before** you start, when you're calm, not after a loss. Treat any urge to raise a limit as a warning sign.

**Sources:** alberta.ca, "Alberta's iGaming Strategy"; abigaming.ca launch release, July 2026; gamesense.com; responsiblegambling.org (RG Check).`,
      },
      {
        key: "advertising-standards-in-canada-and-how-ads-shap",
        title: "Advertising standards in Canada and how ads shape behaviour",
        minutes: 4,
        kind: "lesson",
        body: `## The rules, and the persuasion

### Canadian standards
- **Ontario (AGCO):** since **February 28, 2024**, active and recently retired athletes, and celebrities likely to appeal to minors, have been banned from internet gambling ads, except in responsible-gambling messages. Advertising of inducements (bonuses) is only allowed on the operator's own site or in direct messages to people who opted in.
- **Alberta:** the iGaming framework includes strict rules on advertising, marketing and promotions. Operators may not target minors or high-risk and vulnerable individuals.
- **Federal:** Senate Bill S-269 proposed a national framework for sports-betting ads. Health groups have called for restrictions similar to those on tobacco.
- **Canadian Gaming Association** has its own voluntary advertising code.

### How ads shape behaviour
- **Normalization:** odds during broadcasts make betting seem like part of being a fan.
- **Free bets and boosts** lower the perceived cost of starting.
- **Highlighting wins** (screenshots of big parlays) while losses stay invisible.
- **Urgency:** "Bet now," live odds, countdown timers.
- **Skill framing:** "Bet smarter" suggests skill beats the margin.

### Activity
Watch one game broadcast and count every betting reference: ads, odds on screen, sponsored segments. Classify each using the list above.

**Sources:** AGCO, Registrar's Standards for Internet Gaming (agco.ca), February 2024 update; alberta.ca, "Alberta's iGaming Strategy"; Parliament of Canada, Bill S-269.`,
      },
      {
        key: "support-and-referral-pathways-in-alberta",
        title: "Support and referral pathways in Alberta",
        minutes: 4,
        kind: "lesson",
        body: `## Where to go for help in Alberta

### 24/7 phone support
- **Addiction Helpline: 1-866-332-2322**. Free and confidential, 24 hours a day, 7 days a week; covers problem gambling. Staffed by nurses, social workers and psychologists.
- **Health Link: 811** for general health advice and referrals.
- **Mental Health Helpline: 1-877-303-2642**.
- **211 Alberta** connects you with community services, including support for **family members** worried about someone else's gambling.
- In an emergency, call **911**.

### Self-help and tools
- **GameSense** (AGLC): information, myths vs. facts, and advisors.
- **Self-exclusion**: available through AGLC and, in the open market, a centralized system that covers all registered sites.
- **Gamblers Anonymous** (gamblersanonymous.org) and **Gam-Anon** for peer support.

### On campus
Your college's counselling services are free and confidential for students. Your instructor can help you find them.

### How a referral usually works
1. Call the helpline or visit counselling.
2. A short screening, often using the Problem Gambling Severity Index.
3. A referral to outpatient counselling, a group program or online support, depending on your needs.

You don't need to be "in crisis" to call. Early conversations work best.

See the [Support Resources](/support) page.

**Sources:** Alberta Health Services, Addiction & Mental Health helplines (albertahealthservices.ca); Recovery Alberta (recoveryalberta.ca); abigaming.ca FAQs (211 Alberta).`,
      },
    ],
  },
  {
    key: "using-the-app",
    title: "7. Using the app",
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
    key: "intro",
    title: "Extra: Getting started",
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
    key: "alberta-law",
    title: "Extra: Rules and laws: betting in Alberta",
    summary:
      "Who is allowed to bet in Alberta, how the new iGaming Alberta Act changed the market in 2025–26, the advertising and integrity rules, and the player protections you are legally owed.",
    modules: [
      {
        key: "ab-legal-basics",
        title: "Who can legally bet in Alberta, and on what",
        minutes: 4,
        kind: "lesson",
        body: `## The legal basics

Gambling in Canada is governed by the **Criminal Code**, which makes gambling illegal *unless* a province conducts and manages it. So every legal bet you can place in Alberta exists because the province authorised it.

### The age rule
- You must be **18 or older** to gamble in Alberta — casinos, lottery, retail sportsbooks and online. (Ontario, BC and most other provinces are 19.)
- Operators must verify identity and age before you can deposit or bet. Using someone else's account, or letting a minor use yours, breaks the operator's terms and provincial rules.

### Single-event sports betting
Until 2021 Canadians could only bet **parlays** on sport — you had to combine multiple games. Federal **Bill C-218** amended the Criminal Code in August 2021 to allow **single-event wagering**. That one change created the modern Canadian sports-betting market: single-game moneylines, spreads, totals, player props and live betting.

### Who runs gambling in Alberta
- **AGLC** (Alberta Gaming, Liquor and Cannabis) is the regulator and licensing body.
- **PlayAlberta.ca** was, for years, the *only* legal online sportsbook and casino in the province — run by AGLC itself.
- Everything else advertising to Albertans was **grey market**: offshore operators, legal to use as a player but not licensed or accountable here.

### What is *not* legal
- Betting with an unregistered bookmaker, or acting as one (taking bets from friends for profit).
- Betting on an event you can influence — see the integrity module.
- Match-fixing and cheating at play are Criminal Code offences, not just league violations.

> In this class you bet simulated dollars on live prices. Nothing here is a real wager — but the rules below are the rules that would apply the moment it was.`,
      },
      {
        key: "ab-igaming-act",
        title: "What's new: the iGaming Alberta Act and the open market",
        minutes: 4,
        kind: "lesson",
        body: `## Alberta's market changed in 2026

This is the newest piece of law in the course, so it is worth knowing precisely.

### The legislation
In spring 2025 the Alberta legislature passed **Bill 48, the iGaming Alberta Act**, which also amended the *Gaming, Liquor and Cannabis Act*. It set up the market structure Alberta uses today.

### What it created
- The **Alberta iGaming Corporation (AiGC)** — a new provincial corporation that "conducts and manages" the private online market, which is the constitutional requirement under the Criminal Code.
- **AGLC as regulator** — it registers and polices private operators, and enforces responsible-gambling and advertising standards.
- A path for **grey-market operators to become legal**, on the condition they register, pay into the provincial share, and meet player-protection standards.

### Go-live
Alberta's regulated online market **opened on 13 July 2026** with roughly **50 AGLC-registered operators** offering real-money sports betting and casino games. Alberta became the **second Canadian province** with an open, competitive iGaming market — Ontario was first, in April 2022. PlayAlberta continues to operate alongside the private books.

### Why it matters to a bettor
- **Competition changes prices.** More books means more line shopping, more promos, and slightly better average pricing — which is exactly the market-efficiency argument from Topic 2.
- **Registration means recourse.** A registered operator has to hold your funds properly, honour settled bets, and give you self-exclusion and limit tools. An offshore book owes you nothing.
- **Check the register before you deposit.** AGLC publishes the list of registered operators; if a site is not on it, it is not accountable in Alberta.

### Questions to think about
1. Alberta captured tax revenue that was previously leaving the province. What does the province owe players in return?
2. Open markets increase advertising volume. Who bears that cost?`,
      },
      {
        key: "ab-integrity-ads",
        title: "Integrity rules, advertising limits and player protections",
        minutes: 4,
        kind: "lesson",
        body: `## The rules around the bet

### Integrity: who may never bet
Athletes, coaches, officials, team staff and league employees are barred from betting on their own sport — by league rule and, where inside information is involved, potentially by law. The offences that matter:
- **Match-fixing / cheating at play** is a Criminal Code offence.
- **Using or selling inside information** (an unreported injury, a lineup decision) is prohibited by every league and by operator terms; accounts get frozen and bets voided.
- Operators must report suspicious betting patterns to the regulator and to integrity monitors.

If you play a varsity or junior sport, assume you may **not** bet on that sport at all — check your league's policy before you ever open a real account.

### Advertising rules
Canadian advertising standards and provincial rules restrict how books may market:
- No advertising targeted at people under the legal age, and no use of youth-appealing imagery or characters.
- Ontario banned **athletes and celebrities who appeal to minors** from gambling ads; Alberta's regulated market applies comparable standards through AGLC.
- **Inducements, bonuses and free-bet offers** cannot be advertised to the general public in Ontario's model — they may only be shown to players who opt in. Expect similar tightening as Alberta's market matures.
- Ads must carry responsible-gambling messaging and a helpline.

Rules in this space are still moving. Federal proposals to standardise gambling-ad limits nationally have been debated but not passed as of this course.

### What a registered operator must give you
Every AGLC-registered site must offer:
- **Deposit, loss and time limits** you set yourself.
- **Self-exclusion** — a binding block on your account for a chosen period.
- **Reality checks** — session-time reminders.
- Visible links to help, including Alberta's **GameSense** program and the **Alberta Problem Gambling Helpline: 1-866-332-2322** (24/7, free, confidential).

### Quick check
- Legal age in Alberta: **18**.
- Single-event betting legal since: **August 2021** (Bill C-218).
- Regulated open market live since: **13 July 2026** (iGaming Alberta Act).
- Regulator: **AGLC**. Market operator: **Alberta iGaming Corporation**.`,
      },
    ],
  },
];

// Course order for the 15-week course-in-a-box. "Getting started" folds into
// Using the app, and Alberta law folds into the Canadian industry module.
// Lesson keys never change, so existing assignments and progress keep working.
const T = (k: string) => RAW_CURRICULUM.find((t) => t.key === k)!;
export const CURRICULUM: CurriculumTopic[] = [
  T("responsible-play"),
  { ...T("using-the-app"), title: "2. Using the app", summary: "What this app is, a tour of every screen, placing a bet correctly and keeping a journal your instructor can grade.", modules: [...T("intro").modules, ...T("using-the-app").modules] },
  { ...T("canadian-industry"), title: "3. The Canadian wagering industry", summary: "Legal single-event wagering in Canada and Alberta, who regulates it, and who profits.", modules: [...T("canadian-industry").modules, ...T("alberta-law").modules] },
  { ...T("how-betting-works"), title: "4. The mathematics of odds" },
  { ...T("strategy"), title: "5. Risk, variance and the house edge" },
  { ...T("data-models"), title: "6. Data, models and market prices" },
  { ...T("bias-advertising-support"), title: "7. Bias, advertising and support" },
];

/** Old topic keys that were folded into other modules. */
export const LEGACY_TOPICS: Record<string, string> = { intro: "using-the-app", "alberta-law": "canadian-industry" };

export const CURRICULUM_MODULES: (CurriculumModule & { topic: string; topicTitle: string })[] =
  CURRICULUM.flatMap((t) =>
    t.modules.map((m) => ({ ...m, topic: t.key, topicTitle: t.title })),
  );

export function findCurriculumModule(key: string) {
  return CURRICULUM_MODULES.find((m) => m.key === key);
}
