import { describe, expect, it } from "vitest";
import { COURSE_WEEKS } from "@/data/courseKit";
import { courseTopicForLesson, courseWeekForLesson, FULL_COURSE_ENTRIES, isCourseLessonVisible, missingCourseEntries } from "./defaultCourse";

describe("default 15-week course", () => {
  it("contains exactly 15 weeks and every scheduled lesson exists", () => {
    expect(COURSE_WEEKS.map((week) => week.week)).toEqual(Array.from({ length: 15 }, (_, index) => index + 1));
    const keys = new Set(FULL_COURSE_ENTRIES.map(({ module }) => module.key));
    for (const week of COURSE_WEEKS) {
      for (const key of week.lessons) expect(keys.has(key), `${week.title}: ${key}`).toBe(true);
    }
  });

  it("gives a new class every built-in lesson", () => {
    expect(missingCourseEntries([]).map(({ module }) => module.key)).toEqual(
      FULL_COURSE_ENTRIES.map(({ module }) => module.key),
    );
  });

  it("fills only missing lessons and preserves existing rows", () => {
    const firstFive = FULL_COURSE_ENTRIES.slice(0, 5);
    const existing = firstFive.map(({ module }) => ({ curriculum_key: module.key }));
    const missing = missingCourseEntries(existing);
    expect(missing).toHaveLength(FULL_COURSE_ENTRIES.length - 5);
    expect(missing.some(({ module }) => firstFive.some((item) => item.module.key === module.key))).toBe(false);
  });

  it("shows lessons by default and respects an instructor-hidden row", () => {
    expect(isCourseLessonVisible(undefined)).toBe(true);
    expect(isCourseLessonVisible({ is_published: true })).toBe(true);
    expect(isCourseLessonVisible({ is_published: false })).toBe(false);
  });

  it("maps the Week 6 and Week 7 lessons to their scheduled weeks", () => {
    expect(courseWeekForLesson("how-the-book-earns")).toBe(6);
    expect(courseWeekForLesson("expected-value-hold-percentage-and-theoretical-r")).toBe(7);
  });

  it("uses stable lesson keys instead of legacy topic labels", () => {
    expect(courseTopicForLesson("line-movement")).toBe("data-models");
    expect(courseTopicForLesson("bias")).toBe("bias-advertising-support");
  });
});
