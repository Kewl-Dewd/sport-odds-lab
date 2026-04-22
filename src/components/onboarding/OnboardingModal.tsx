import { useState, useEffect, createContext, useContext, type ReactNode } from "react";
import { X, ChevronRight, ChevronLeft, TrendingUp, DollarSign, BarChart3, Trophy, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ONBOARDING_KEY = "sml-onboarding-done";

const steps = [
  {
    icon: TrendingUp,
    title: "Welcome to Sports Market Lab!",
    description: "This is a prediction market simulator where you trade shares on sports outcomes using virtual cash. It's like a stock exchange, but for sports predictions.",
    tip: "Tip: Prices represent the market's belief about how likely an outcome is.",
  },
  {
    icon: DollarSign,
    title: "You Start with Virtual Cash",
    description: "Your instructor has set a starting balance for you. Use it to buy shares in outcomes you think are likely. Sell shares you think are overpriced.",
    tip: "Tip: Don't go all-in on one trade. Diversify your bets!",
  },
  {
    icon: BarChart3,
    title: "Prices Move with Every Trade",
    description: "When you buy shares, the price goes up. When you sell, it goes down. This is how markets discover the true probability of outcomes — through trading activity.",
    tip: "Tip: A price of 60¢ means the market thinks there's a ~60% chance of that outcome.",
  },
  {
    icon: Trophy,
    title: "Settlement & Scoring",
    description: "When the event ends, the winning outcome pays $1.00 per share. Losers pay $0. Your goal: build the highest portfolio value through smart predictions.",
    tip: "Tip: Check the leaderboard to see how you rank against classmates!",
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
                Got it — start trading
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
