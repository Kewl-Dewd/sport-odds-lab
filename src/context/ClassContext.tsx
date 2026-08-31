// Tracks which class a student is currently working in. Students can be
// enrolled in several classes at once (own bankroll and coursework each),
// so the active choice is persisted and surfaced through a nav switcher.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { db, unwrap, type ClassMemberRow, type ClassRow } from "@/features/db";

export interface Enrollment {
  membership: ClassMemberRow;
  klass: ClassRow;
}

const ACTIVE_CLASS_KEY = "sml.activeClassId";

interface ClassContextValue {
  enrollments: Enrollment[];
  activeClassId: string | null;
  activeEnrollment: Enrollment | null;
  setActiveClassId: (id: string | null) => void;
  isLoading: boolean;
}

const ClassContext = createContext<ClassContextValue | undefined>(undefined);

export function useMyEnrollments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["enrollments", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Enrollment[]> => {
      const memberships = unwrap<ClassMemberRow[]>(
        await db
          .from("class_members")
          .select("*")
          .eq("user_id", user!.id)
          .order("joined_at", { ascending: false }),
      );
      if (memberships.length === 0) return [];
      const classes = unwrap<ClassRow[]>(
        await db.from("classes").select("*").in("id", memberships.map((m) => m.class_id)),
      );
      return memberships
        .map((m) => ({ membership: m, klass: classes.find((c) => c.id === m.class_id)! }))
        .filter((e) => e.klass && !e.klass.is_archived);
    },
  });
}

export function ClassProvider({ children }: { children: ReactNode }) {
  const { data: enrollments = [], isLoading } = useMyEnrollments();
  const [activeClassId, setActive] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_CLASS_KEY),
  );

  const setActiveClassId = (id: string | null) => {
    setActive(id);
    if (id) localStorage.setItem(ACTIVE_CLASS_KEY, id);
    else localStorage.removeItem(ACTIVE_CLASS_KEY);
  };

  // Fall back to the newest enrollment when the stored class is gone.
  useEffect(() => {
    if (enrollments.length === 0) return;
    if (!activeClassId || !enrollments.some((e) => e.klass.id === activeClassId)) {
      setActiveClassId(enrollments[0].klass.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollments, activeClassId]);

  const value = useMemo<ClassContextValue>(() => {
    const activeEnrollment =
      enrollments.find((e) => e.klass.id === activeClassId) ?? enrollments[0] ?? null;
    return {
      enrollments,
      activeClassId: activeEnrollment?.klass.id ?? null,
      activeEnrollment,
      setActiveClassId,
      isLoading,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollments, activeClassId, isLoading]);

  return <ClassContext.Provider value={value}>{children}</ClassContext.Provider>;
}

export function useActiveClass() {
  const ctx = useContext(ClassContext);
  if (!ctx) throw new Error("useActiveClass must be used inside ClassProvider");
  return ctx;
}
