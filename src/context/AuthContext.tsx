import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "instructor" | "student";

interface AuthState {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  /** True only if user has the instructor role AND is not currently previewing as a student. */
  isInstructor: boolean;
  /** True if the underlying account is an instructor (regardless of preview toggle). */
  isInstructorAccount: boolean;
  /** True when an instructor has toggled "View as student". */
  viewAsStudent: boolean;
  setViewAsStudent: (v: boolean) => void;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const INSTRUCTOR_EMAIL = "kurtspady@gmail.com";
const VIEW_AS_STUDENT_KEY = "sml.viewAsStudent";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewAsStudent, setViewAsStudentState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(VIEW_AS_STUDENT_KEY) === "1";
  });

  const setViewAsStudent = (v: boolean) => {
    setViewAsStudentState(v);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VIEW_AS_STUDENT_KEY, v ? "1" : "0");
    }
  };

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_evt, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (!newSession?.user) {
        setRole(null);
        setLoading(false);
        return;
      }
      setTimeout(() => fetchRole(newSession.user.id, newSession.user.email), 0);
    });

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) {
        fetchRole(existing.user.id, existing.user.email);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId: string, email: string | undefined) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .order("role", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (data?.role) {
        setRole(data.role as AppRole);
      } else if (email && email.toLowerCase() === INSTRUCTOR_EMAIL) {
        setRole("instructor");
      } else {
        setRole("student");
      }
    } catch {
      setRole(email?.toLowerCase() === INSTRUCTOR_EMAIL ? "instructor" : "student");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setViewAsStudent(false);
    await supabase.auth.signOut();
  };

  const isInstructorAccount =
    role === "instructor" || (user?.email?.toLowerCase() === INSTRUCTOR_EMAIL);
  const isInstructor = isInstructorAccount && !viewAsStudent;

  return (
    <AuthContext.Provider
      value={{
        session, user, role,
        isInstructor, isInstructorAccount,
        viewAsStudent, setViewAsStudent,
        loading, signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
