# Project rules

- Forecast/CLV/Brier/calibration math lives in `src/lib/forecastMath.ts` (unit-tested); UI and server code reuse it rather than re-deriving formulas — keeps scoring consistent everywhere.
- Closing prices are captured by the scheduled `capture-closing-lines` edge function keyed on `bets.external_event_id`; every new bet path must set `external_event_id`, `event_starts_at` and forecast fields — otherwise CLV and scoring silently skip those positions.
- Analysis contest standings come from the `class_analysis_leaderboard` security-definer RPC, not client-side bet reads — students cannot read classmates' bets under RLS.
- Lesson pedagogy (objectives, app task, quiz, reflection) lives in `src/data/lessonDesign/` keyed by curriculum lesson key, and the 15-week syllabus/slides/rubrics in `src/data/courseKit.ts`; lesson keys must never change because class assignments, progress and quiz attempts reference them.
