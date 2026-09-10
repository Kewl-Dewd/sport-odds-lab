import { Link } from "react-router-dom";
import { Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TRIAL_DAYS, useAccess } from "@/hooks/useAccess";

const INCLUDED = [
  "Full access to the sportsbook simulator",
  "Place simulated bets and track your bankroll",
  "Join your instructor's class with a join code",
  "Bet journal, leaderboards and responsible-play lessons",
];

/** PILOT: access is free, so this page no longer sells access. */
export default function GetAccess() {
  const { entitled, access, expiresAt, loading, inTrial, trialDaysLeft } = useAccess();

  return (
    <div className="container max-w-2xl py-10 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Access is free during the pilot</h1>
        <p className="text-muted-foreground">
          You have full access while the pilot is running — no payment needed.
        </p>
      </header>

      {!loading && !entitled && inTrial && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div className="text-sm">
              <p className="font-medium">
                You&apos;re on a free {TRIAL_DAYS}-day trial — {trialDaysLeft} day
                {trialDaysLeft === 1 ? "" : "s"} left.
              </p>
              <p className="text-muted-foreground">
                Enjoy full access during the pilot.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && entitled && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div className="text-sm">
              <p className="font-medium">Your access is active.</p>
              <p className="text-muted-foreground">
                {!access
                  ? "Included with your instructor account"
                  : access.source === "code"
                    ? "Redeemed with a course code"
                    : "Paid access"}

                {expiresAt && ` · expires ${new Date(expiresAt).toLocaleDateString()}`}
              </p>
            </div>
            <Button asChild size="sm" className="ml-auto">
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Everything is included while the pilot is running:
          </p>
          <ul className="space-y-2 text-sm">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Button asChild variant="hero" className="w-full">
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
