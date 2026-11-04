# 15-week "Course in a Box" for Sports Market Lab

Design approach: **backward design** (outcomes → assessments → activities) and Gagné-style lesson flow (objectives → content → practice → check → reflect), modelled on How the Market Works' assigned-learning layout. Keeps the existing 7 modules, stretched across 15 weeks.

## Course map (7 modules / 15 weeks)

```text
Wk 1     M1 Before you start: risks, warning signs, limits  (gate lessons stay first)
Wk 2     M7 Using the app (moved early) + first forecasted bet
Wk 3-4   M2 The Canadian wagering industry  (+ Alberta law folded in)
Wk 5-7   M3 Mathematics of odds
Wk 8     Midterm: "Price a game" project + module quiz review
Wk 9-10  M4 Risk, variance and the house edge
Wk 11-13 M5 Data, models and market prices
Wk 14    M6 Bias, advertising and support
Wk 15    Final project: model-vs-market report + calibration reflection
```
"Extra: Getting started" and "Extra: Alberta law" are folded into M7 and M2, so nothing is labelled Extra any more.

## What every lesson gets
1. **Learning objectives**: 2–3 "By the end you can…" statements at the top.
2. **Content**: existing text, expanded where thin, with sources listed.
3. **Hands-on app task**: e.g. "Find tonight's NHL game and work out the no-vig price."
4. **Quick quiz**: 3–5 auto-graded multiple-choice questions with feedback.
5. **Reflection prompt**: short written answer the instructor can read.

Each module also gets a **module quiz** (8–10 questions) and course-level **learning outcomes** (6 CLOs) mapped to modules.

## Grading (instructor picks)
- Gradebook gets a new **Quizzes** weight, alongside lessons, journal, forecast accuracy and CLV.
- Class Settings gets a toggle: **Quiz scores count** or **Completion only**.
- Default for new classes: quizzes 20%, lessons 20%, journal 25%, forecast 25%, CLV 10%.

## Instructor kit (new "Instructor kit" page per class)
- **Printable 15-week syllabus**: outcomes, weekly schedule, assessment weights, academic integrity and responsible-play statements.
- **Lecture slide outlines**: 6–8 bullet slides per week, printable.
- **Answer keys**: every quiz answer with explanation, plus worked answers for app tasks.
- **Rubrics**: 4-level rubrics for the 4 projects (partnership map, price-a-game, journal portfolio, model-vs-market report).

A new **15-week Semester** course plan goes into Quick setup and becomes the default.

## Technical details
- `src/data/curriculum.ts`: add `objectives`, `task`, `reflection`, `quiz[]` to `CurriculumModule`; add `outcomes` to topics; reorder topics and fold Extras. Lesson keys stay the same, so existing class assignments and progress keep working.
- New `src/data/courseKit.ts`: CLOs, 15-week schedule, slide outlines, rubrics.
- New table `class_quiz_attempts` (user, class, lesson key, score, answers, created_at) with RLS: students write/read their own, instructors read their class. Reflections saved in `class_lesson_progress` via new nullable `reflection text` column (or a small `class_lesson_reflections` table if that table is in protected feature SQL).
- `classes.quiz_grading` setting (`'scored' | 'completion'`).
- `Learn.tsx` lesson view: objectives card, task card, quiz component, reflection box.
- `gradebook.ts` + tests: quiz weight and completion-only mode.
- New page `InstructorKit.tsx` with print styles; link from class page and instructor menu.
- Content written by me from open sources (AGLC, Gov. of Alberta, RGC, GameSense, CCSA, Wikipedia, OpenIntro Statistics), cited per lesson.

## Not included
- No changes to `src/features/` files or existing migration SQL.
- No LMS (Moodle/Canvas) direct integration: CSV export only.
