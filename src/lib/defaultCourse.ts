import { COURSE_WEEKS } from "@/data/courseKit";
import { CURRICULUM, type CurriculumModule } from "@/data/curriculum";

export interface DefaultCourseEntry {
  module: CurriculumModule;
  topicKey: string;
}

/** The built-in course in its stable, authored order. */
export const FULL_COURSE_ENTRIES: DefaultCourseEntry[] = CURRICULUM.flatMap((topic) =>
  topic.modules.map((module) => ({ module, topicKey: topic.key })),
);

const TOPIC_BY_MODULE = new Map(FULL_COURSE_ENTRIES.map(({ module, topicKey }) => [module.key, topicKey]));

export function courseTopicForLesson(key?: string | null) {
  return key ? TOPIC_BY_MODULE.get(key) : undefined;
}

const WEEK_BY_MODULE = new Map<string, number>();
for (const week of COURSE_WEEKS) {
  for (const key of week.lessons) WEEK_BY_MODULE.set(key, week.week);
}

export function courseWeekForLesson(key?: string | null) {
  return key ? WEEK_BY_MODULE.get(key) : undefined;
}

/** Missing rows are safe to add without changing existing dates or progress. */
export function missingCourseEntries(
  existing: Array<{ curriculum_key: string | null }>,
): DefaultCourseEntry[] {
  const keys = new Set(existing.map((lesson) => lesson.curriculum_key).filter(Boolean));
  return FULL_COURSE_ENTRIES.filter(({ module }) => !keys.has(module.key));
}

/** Built-in lessons are visible unless the instructor explicitly hides them. */
export function isCourseLessonVisible(existing?: { is_published: boolean }) {
  return existing?.is_published ?? true;
}
