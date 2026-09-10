import { useState, useEffect, createContext, useContext, type ReactNode } from "react";
import { X, ChevronRight, ChevronLeft, TrendingUp, DollarSign, BarChart3, Trophy, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ONBOARDING_KEY = "sml-onboarding-done";

const steps = [
  {
    icon: TrendingUp,
    title: "Welcome to Sports Market Lab!",
    description: "This is a classroom sportsbook simulator. You place virtual wagers against live moneyline, spread and totals odds — and your instructor runs the book.",
    tip: "Tip: Odds are the book's estimate of how likely an outcome is.",
  },
  {
    icon: DollarSign,
    title: "You Start with a Virtual Bankroll",
    description: "Your instructor sets your starting bankroll. Stake it on the games they publish for your class. Your stake is deducted when the bet is placed and returned with winnings if it hits.",
    tip: "Tip: Don't put your whole bankroll on one game — manage your stake sizes.",
  },
  {
    icon: BarChart3,
    title: "Odds Are Locked When You Bet",
    description: "Odds move as game time approaches, but the price you accept is locked in. Compare the odds you got to the closing line to see whether you found value.",
    tip: "Tip: Beating the closing line consistently is the best sign of skill.",
  },
  {
    icon: Trophy,
    title: "Settlement & the House",
    description: "When games finish, winning bets pay stake × odds and losing bets pay nothing. The class sees the book's handle and profit, so you learn both sides of the counter.",
    tip: "Tip: Check the leaderboard to see how your bankroll ranks against classmates.",
  },
];


export function OnboardingModal({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const current = steps[step];

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-card border rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
        {/* Progress */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex gap-1 flex-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <span className="ml-3 text-xs font-mono text-muted-foreground tabular-nums shrink-0">
            {step + 1}/{steps.length}
          </span>
        </div>

        <div className="p-6 pt-2 space-y-5">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <current.icon className="h-7 w-7 text-primary" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold">{current.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
          </div>

          <div className="rounded-lg bg-muted/50 border p-3 flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">{current.tip}</p>
          </div>

          <div className="flex gap-3">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-1" />Back
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button variant="hero" onClick={() => setStep(step + 1)} className="flex-1">
                Next<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button variant="hero" onClick={handleComplete} className="flex-1">
                Got it — start learning
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <button
              onClick={handleComplete}
              className="hover:text-foreground transition-colors"
            >
              Skip walkthrough
            </button>
            <a
              href="/how-it-works"
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Read the full guide →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setShowOnboarding(true);
  }, []);

  return {
    showOnboarding,
    completeOnboarding: () => setShowOnboarding(false),
    resetOnboarding: () => {
      localStorage.removeItem(ONBOARDING_KEY);
      setShowOnboarding(true);
    },
  };
}
