import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type EducationMode = "beginner" | "advanced";

export interface LearningNudge {
  id: string;
  type: "concentration" | "slippage" | "settlement" | "unrealized" | "overconfident" | "diversification";
  title: string;
  message: string;
  dismissedAt?: string;
}

interface EducationContextValue {
  /** Master toggle — instructor controls this */
  educationEnabled: boolean;
  setEducationEnabled: (v: boolean) => void;

  /** Student-facing mode */
  mode: EducationMode;
  setMode: (m: EducationMode) => void;

  /** Active nudges */
  nudges: LearningNudge[];
  pushNudge: (nudge: Omit<LearningNudge, "id">) => void;
  dismissNudge: (id: string) => void;
  clearNudges: () => void;

  /** Dismissed nudge types for this session (avoid repeats) */
  dismissedTypes: Set<string>;
}

const EducationContext = createContext<EducationContextValue | null>(null);

export function EducationProvider({ children }: { children: ReactNode }) {
  const [educationEnabled, setEducationEnabled] = useState(true);
  const [mode, setMode] = useState<EducationMode>("beginner");
  const [nudges, setNudges] = useState<LearningNudge[]>([]);
  const [dismissedTypes, setDismissedTypes] = useState<Set<string>>(new Set());

  const pushNudge = useCallback((nudge: Omit<LearningNudge, "id">) => {
    if (dismissedTypes.has(nudge.type)) return;
    const id = `nudge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setNudges((prev) => {
      if (prev.some((n) => n.type === nudge.type)) return prev;
      return [...prev, { ...nudge, id }];
    });
  }, [dismissedTypes]);

  const dismissNudge = useCallback((id: string) => {
    setNudges((prev) => {
      const nudge = prev.find((n) => n.id === id);
      if (nudge) setDismissedTypes((s) => new Set(s).add(nudge.type));
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  const clearNudges = useCallback(() => setNudges([]), []);

  return (
    <EducationContext.Provider value={{
      educationEnabled, setEducationEnabled,
      mode, setMode,
      nudges, pushNudge, dismissNudge, clearNudges,
      dismissedTypes,
    }}>
      {children}
    </EducationContext.Provider>
  );
}

export function useEducation() {
  const ctx = useContext(EducationContext);
  if (!ctx) throw new Error("useEducation must be used within EducationProvider");
  return ctx;
}
