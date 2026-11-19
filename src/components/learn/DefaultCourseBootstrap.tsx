import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import { useMyClasses } from "@/features/classes/useClasses";
import { useAssignedLessons, useAssignCurriculum } from "@/hooks/useCurriculum";
import { missingCourseEntries } from "@/lib/defaultCourse";

function EnsureDefaultCourse({ classId }: { classId: string }) {
  const { data: lessons = [], isLoading, isError } = useAssignedLessons(classId);
  const assign = useAssignCurriculum();
  const attempted = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading || isError || attempted.current === classId) return;
    attempted.current = classId;
    const missing = missingCourseEntries(lessons);
    if (!missing.length) return;
    const startSortOrder = Math.max(-1, ...lessons.map((lesson) => lesson.sort_order)) + 1;
    assign.mutate(
      { classId, modules: missing, startSortOrder },
      {
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Could not prepare the full course");
        },
      },
    );
    // The mutation identity changes on renders; the ref prevents duplicate inserts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, isError, isLoading, lessons]);

  return null;
}

/** Every signed-in instructor's classes receive the full default curriculum. */
export default function DefaultCourseBootstrap() {
  const { data: classes = [] } = useMyClasses();
  const location = useLocation();
  // Quick Setup writes its own dated full-course schedule before navigating away.
  if (location.pathname === "/instructor/quick-setup") return null;
  return <>{classes.map((klass) => <EnsureDefaultCourse key={klass.id} classId={klass.id} />)}</>;
}
