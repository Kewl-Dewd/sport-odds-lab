import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { needsAnswer, onConsentChange, readChoice, saveChoices, type Purpose } from "@/lib/consent";

const PURPOSES: Purpose[] = ["analytics", "advertising"];

const CookieSettingsContext = createContext<() => void>(() => {});
export const useOpenCookieSettings = () => useContext(CookieSettingsContext);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [showBanner, setShowBanner] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const gpc =
    typeof navigator !== "undefined" &&
    (navigator as unknown as { globalPrivacyControl?: boolean }).globalPrivacyControl === true;

  useEffect(() => {
    let alive = true;
    const check = () => void needsAnswer(PURPOSES).then((needed) => alive && setShowBanner(needed));
    check();
    const off = onConsentChange(check);
    return () => {
      alive = false;
      off();
    };
  }, []);

  useEffect(() => {
    if (showBanner) bannerRef.current?.focus();
  }, [showBanner]);

  const openSettings = useCallback(() => {
    setAnalytics(readChoice("analytics") === "granted");
    setAdvertising(readChoice("advertising") === "granted");
    setSettingsOpen(true);
  }, []);

  const answerAll = (choice: "granted" | "denied") => {
    saveChoices({ analytics: choice, advertising: choice });
    setShowBanner(false);
  };

  const saveSettings = () => {
    saveChoices({ analytics: analytics ? "granted" : "denied", advertising: advertising ? "granted" : "denied" });
    setSettingsOpen(false);
    setShowBanner(false);
  };

  return (
    <CookieSettingsContext.Provider value={openSettings}>
      {children}

      {showBanner && (
        <div
          ref={bannerRef}
          tabIndex={-1}
          role="region"
          aria-label="Cookie choices"
          className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-xl border border-foreground/25 bg-card p-5 shadow-paper-card outline-none md:bottom-5"
        >
          <p className="font-display text-base font-semibold tracking-[-0.02em] text-foreground">Your privacy choices</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            We count visits without cookies. If you accept, we also measure clicks and other actions, and use
            advertising cookies to see which of our ads bring instructors to the site.{" "}
            <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy policy</Link>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => answerAll("denied")}>Reject all</Button>
            <Button variant="outline" onClick={() => answerAll("granted")}>Accept all</Button>
          </div>
          <button
            type="button"
            onClick={openSettings}
            className="mt-3 w-full text-center text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Cookie settings
          </button>
        </div>
      )}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cookie settings</DialogTitle>
            <DialogDescription>
              {gpc
                ? "Your browser's privacy signal is on, so measurement and advertising stay off."
                : "Choose what we may use. You can change this any time from the footer."}
            </DialogDescription>
          </DialogHeader>
          <div className="divide-y divide-border border-y border-border">
            <div className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-semibold">Necessary</p>
                <p className="text-xs text-muted-foreground">Keeps you signed in and the site working. Always on.</p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Always on</span>
            </div>
            <label className="flex items-start justify-between gap-4 py-3">
              <span>
                <span className="block text-sm font-semibold">Analytics, provided by Lovable</span>
                <span className="block text-xs text-muted-foreground">Clicks and other actions on the site.</span>
              </span>
              <Switch checked={!gpc && analytics} disabled={gpc} onCheckedChange={setAnalytics} aria-label="Analytics" />
            </label>
            <label className="flex items-start justify-between gap-4 py-3">
              <span>
                <span className="block text-sm font-semibold">Advertising, provided by Meta</span>
                <span className="block text-xs text-muted-foreground">Shows which Facebook and Instagram ads lead to new instructor accounts.</span>
              </span>
              <Switch checked={!gpc && advertising} disabled={gpc} onCheckedChange={setAdvertising} aria-label="Advertising" />
            </label>
          </div>
          <DialogFooter>
            <Button onClick={saveSettings} disabled={gpc}>Save choices</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CookieSettingsContext.Provider>
  );
}
