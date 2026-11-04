// Instructional design layer for each curriculum lesson: objectives, a
// hands-on app task (with a worked answer for the instructor key), a
// reflection prompt and a short auto-graded quiz.

export interface QuizQuestion {
  q: string;
  options: string[];
  /** Index of the correct option. */
  answer: number;
  /** Feedback shown after submitting; also used in the answer key. */
  why: string;
}

export interface LessonDesign {
  objectives: string[];
  task: string;
  taskAnswer: string;
  reflection: string;
  quiz: QuizQuestion[];
}

export const q = (question: string, options: string[], answer: number, why: string): QuizQuestion => ({
  q: question,
  options,
  answer,
  why,
});
