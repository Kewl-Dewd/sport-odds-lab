import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppMode = "prediction" | "sportsbook" | "racetrack";

export const MODE_LABELS: Record<AppMode, string> = {
  prediction: "Prediction Market",
  sportsbook: "Sportsbook",
  racetrack: "Racetrack",
};

export const MODE_DESCRIPTIONS: Record<AppMode, string> = {
  prediction: "LMSR-style probability markets. Buy outcome shares; price = implied probability.",
  sportsbook: "Fixed-odds wagers on moneylines, spreads, and totals. Stake → payout.",
  racetrack: "Pari-mutuel pools for Win / Place / Show. Odds set by the crowd.",
};

const STORAGE_KEY = "sml.appMode";

/**
 * Modes currently exposed in the UI. Prediction & racetrack remain fully
 * implemented but hidden for now — re-add them here to bring them back.
 */
export const ENABLED_MODES: AppMode[] = ["sportsbook"];
export const SINGLE_MODE: AppMode | null =
  ENABLED_MODES.length === 1 ? ENABLED_MODES[0] : null;

interface ModeState {
  mode: AppMode | null;
  setMode: (m: AppMode | null) => void;
  clearMode: () => void;
}

const ModeContext = createContext<ModeState | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode | null>(() => {
    if (SINGLE_MODE) return SINGLE_MODE;
    if (typeof window === "undefined") return null;
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "prediction" || v === "sportsbook" || v === "racetrack" ? v : null;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mode) window.localStorage.setItem(STORAGE_KEY, mode);
    else window.localStorage.removeItem(STORAGE_KEY);
  }, [mode]);

  const setMode = (m: AppMode | null) => setModeState(m);
  const clearMode = () => setModeState(null);

  return (
    <ModeContext.Provider value={{ mode, setMode, clearMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}

/** Filter helper: does a market belong to the given mode? */
export function marketMatchesMode(
  market: { sportsbook?: { enabled?: boolean } | undefined; racetrack?: { enabled?: boolean } | undefined; outcomes: unknown[] },
  mode: AppMode,
): boolean {
  switch (mode) {
    case "sportsbook":
      return !!market.sportsbook?.enabled;
    case "racetrack":
      return !!market.racetrack?.enabled;
    case "prediction":
      // Prediction-market is the default; show any market that has outcomes and isn't sportsbook/racetrack-only.
      return market.outcomes.length > 0;
  }
}
