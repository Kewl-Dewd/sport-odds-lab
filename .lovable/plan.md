# Full 15-week student course and instructor library

## What changes

- Make the complete built-in 15-week curriculum the default for every instructor and student, including Kurt's instructor and student views and future sign-ups.
- Give students who have not joined a class the full course to browse immediately; class members see their instructor's published version.
- Add a student-safe 15-week overview with weekly lessons, assessments, and project rubrics. Keep slide teaching notes and quiz/task answer keys instructor-only.
- Change the built-in curriculum library to visibility controls only: instructors hide lessons into the library and restore them later. Lesson text remains unchanged.
- Preserve existing due dates, custom coursework, completions, quiz attempts, and stable lesson keys.

## Technical approach

- Reuse `class_lessons.is_published` for visible/library state; no schema migration is required.
- Add an instructor-route bootstrap outside `src/features/` that fills missing built-in lessons with the existing curriculum assignment hook, so current and future classes receive the full default setup.
- Update `src/components/learn/AssignedLearning.tsx`, `src/components/learn/CurriculumLibrary.tsx`, `src/hooks/useCurriculum.ts`, and `src/pages/Learn.tsx`; add a student course-overview component and small instructor-route wrappers.
- Do not modify `src/features/` or any existing migration SQL.

## Verification

- Test the default lesson set, visibility merging, and hide/restore behavior with focused unit tests.
- Sign in as Kurt and verify instructor and student views, including the current class's full course and library controls.
- Verify a new student sees the full course before joining a class and a newly created class receives the default setup.
- Check Learning and instructor Coursework on phone and desktop in light and dark themes, including quiz interaction, hidden-lesson restoration, and student visibility after refresh.
