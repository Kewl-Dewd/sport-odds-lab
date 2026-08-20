import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "instructor" | "student";
/** Which console the signed-in person is currently looking at. */
export type ViewAs = "student" | "instructor" | "admin";

interface AuthState {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  /** True only if user has the instructor role AND is not currently previewing as a student. */
  isInstructor: boolean;
  /** True if the underlying account is an instructor (regardless of preview toggle). */
  isInstructorAccount: boolean;
  /** True when the account holds platform-administrator access. */
  isPlatformAdmin: boolean;
  /** True when the account holds platform-administrator access, ignoring the view switcher. */
  isPlatformAdminAccount: boolean;
  /** Active console: student, instructor, or admin. */
  viewAs: ViewAs;
  setViewAs: (v: ViewAs) => void;
  /** True when an instructor has switched to the student console. */
  viewAsStudent: boolean;
  setViewAsStudent: (v: boolean) => void;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const INSTRUCTOR_EMAIL = "kurtspady@gmail.com";
const VIEW_AS_KEY = "sml.viewAs";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewAs, setViewAsState] = useState<ViewAs>(() => {
    if (typeof window === "undefined") return "instructor";
    const stored = window.localStorage.getItem(VIEW_AS_KEY);
    return stored === "student" || stored === "admin" || stored === "instructor"
      ? stored
      : "instructor";
  });

  const setViewAs = (v: ViewAs) => {
    setViewAsState(v);
    if (typeof window !== "undefined") window.localStorage.setItem(VIEW_AS_KEY, v);
  };

  const setViewAsStudent = (v: boolean) => setViewAs(v ? "student" : "instructor");


  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_evt, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (!newSession?.user) {
        setRole(null);
        setIsPlatformAdmin(false);
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

  // RLS lets only platform admins read this table, so a returned row is
  // itself the proof of access.
  const fetchPlatformAdmin = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("platform_admins" as never)
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      setIsPlatformAdmin(!!data);
    } catch {
      setIsPlatformAdmin(false);
    }
  };

  const fetchRole = async (userId: string, email: string | undefined) => {
    void fetchPlatformAdmin(userId);
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
  // The view switcher only offers consoles the account actually holds.
  const effectiveView: ViewAs =
    viewAs === "admin" && !isPlatformAdmin
      ? (isInstructorAccount ? "instructor" : "student")
      : viewAs === "instructor" && !isInstructorAccount
        ? "student"
        : viewAs;
  const viewAsStudent = effectiveView === "student";
  const isInstructor = isInstructorAccount && !viewAsStudent;

  return (
    <AuthContext.Provider
      value={{
        session, user, role,
        isInstructor, isInstructorAccount,
        isPlatformAdmin: isPlatformAdmin && effectiveView === "admin",
        isPlatformAdminAccount: isPlatformAdmin,
        viewAs: effectiveView, setViewAs,
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
