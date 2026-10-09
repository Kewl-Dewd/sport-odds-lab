# Reward analysis, not winning bets

## What students and instructors will see
1. **Forecast on the bet slip**: students must enter their own win chance (0–100%) before they can confirm. As they type, three numbers appear side by side:
   - **Market implied**: what the posted price implies
   - **No-vig fair**: the implied chance with the book's margin taken out, using every side of the game
   - **Expected value**: the expected profit or loss on the stake, at the student's forecast
2. **Opening and closing prices**:
   - **Opening price**: saved automatically when the instructor publishes a game.
   - **Closing price**: when the betting window closes (or the game starts, whichever comes first), a scheduled job pulls the line again from The Odds API and saves it.
   - Each position then shows its **closing line value (CLV)** in My Bets and the Journal.
3. **Contest scoring options**:
   - Forecast accuracy (Brier score, lower is better). This becomes the **default** for new windows.
   - Closing line value (average CLV)
   - Journal completion
   - "Profit (for demonstration of variance)", which keeps the existing Profit/ROI/Wins scoring. It is still available, just no longer the default.
4. **Calibration page**:
   - Each student gets a "My Calibration" page: a chart of forecast buckets (0–10%, 10–20% … 90–100%) against how often those picks actually won, with a perfect-calibration diagonal and pick counts per bucket.
   - Instructors get a class-wide version in the class page, with a student filter.

## Schema changes (for your review, not applied yet)

```sql
-- 1. Forecast + pricing captured on each position
ALTER TABLE public.bets
  ADD COLUMN forecast_prob numeric,          -- student's forecast, 0..1
  ADD COLUMN implied_prob numeric,           -- 1 / locked decimal odds
  ADD COLUMN no_vig_prob numeric,            -- fair prob at placement (all sides)
  ADD COLUMN expected_value numeric,         -- $ EV at the student's forecast
  ADD COLUMN closing_no_vig_prob numeric,    -- fair prob at close
  ADD COLUMN clv_pct numeric,                -- (locked decimal * closing fair prob - 1) * 100
  ADD COLUMN published_market_id uuid REFERENCES public.published_markets(id) ON DELETE SET NULL;

-- Forecast must be between 0 and 1 when present (validation trigger, not CHECK)
CREATE FUNCTION public.validate_bet_forecast() RETURNS trigger ... ;
CREATE TRIGGER bets_validate_forecast BEFORE INSERT OR UPDATE ON public.bets ... ;

-- 2. Opening / closing price snapshots on published games
ALTER TABLE public.published_markets
  ADD COLUMN opening_snapshot jsonb,          -- all sides' prices at publish
  ADD COLUMN opening_captured_at timestamptz,
  ADD COLUMN closing_snapshot jsonb,
  ADD COLUMN closing_captured_at timestamptz;

-- 3. Scoring default for new contest windows
ALTER TABLE public.class_rounds ALTER COLUMN scoring SET DEFAULT 'brier';
-- allowed values (enforced in app): brier | clv | journal | profit | roi | wins

-- 4. Closing-price job: fills closing_snapshot, then back-fills
--    closing_no_vig_prob and clv_pct on matching bets
CREATE FUNCTION public.apply_closing_line(_published_market_id uuid, _snapshot jsonb) ... SECURITY DEFINER;
-- runs every 10 minutes via pg_cron -> new edge function "capture-closing-lines"

-- 5. Analysis leaderboard (respects existing class access rules)
CREATE FUNCTION public.class_analysis_leaderboard(_class_id uuid, _round_id uuid DEFAULT NULL)
  RETURNS TABLE(user_id uuid, display_name text, forecasts bigint,
                brier numeric, avg_clv_pct numeric, journal_pct numeric) ... SECURITY DEFINER;
```

These are all additions. Nothing is dropped or renamed, and existing bets keep working (their new fields stay empty and are left out of the averages). Existing contest windows keep their current scoring.

## Technical details
- No-vig chance = (1/odds for this side) ÷ (sum of 1/odds across all sides), so three-way soccer lines include the Draw. This is calculated in a new `src/lib/forecastMath.ts`, with unit tests for implied/no-vig chances, EV, Brier score, CLV and bucket assignment.
- The bet slip (`TradeTicketModal.tsx`) gets a forecast input. Confirm stays disabled until a forecast is entered. The forecast, implied, no-vig and EV values are written to the bet row through the existing bet-saving code.
- Publishing a game (`usePublishing.ts`) saves the current prices for all sides as `opening_snapshot`.
- The edge function `capture-closing-lines` finds published games whose window has ended or whose game has started and that have no closing snapshot yet. It fetches them through the cached odds feed, then calls `apply_closing_line`.
- `ClassRoundsTab.tsx` gets the new scoring options, with Forecast accuracy as the default. Standings use `class_analysis_leaderboard` for brier/clv/journal and the existing logic for the profit modes.
- New page `/calibration` (student) and a "Calibration" tab in the class page (instructor), drawn with the existing chart library from settled bets that have a forecast.
- Brier score = mean of (forecast − result)², where result is 1 if the pick won and 0 if it lost. Pushes and voids are excluded.
