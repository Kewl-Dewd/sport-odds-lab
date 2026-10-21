import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { TRIAL_DAYS, useAccess, useRedeemCode } from "@/hooks/useAccess";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { STUDENT_ACCESS_PRICE_ID } from "@/lib/stripe";

const INCLUDED = [
  "Full access to the sportsbook simulator for one year",
  "Forecast, track and journal every position",
  "Join your instructor's class with a join code",
  "Assigned learning, calibration and responsible-play lessons",
];

export default function GetAccess() {
  const { entitled, access, expiresAt, loading, inTrial, trialDaysLeft } = useAccess();
  const redeem = useRedeemCode();
  const [code, setCode] = useState("");
  const [checkout, setCheckout] = useState(false);

  const onRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await redeem.mutateAsync(code);
      toast({ title: "Code redeemed", description: "Your access is active." });
      setCode("");
    } catch (err) {
      toast({ title: "Couldn't redeem code", description: (err as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-0">
      <PaymentTestModeBanner />
      <div className="container max-w-2xl py-10 space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Get access to Sports Market Lab</h1>
          <p className="text-muted-foreground">$10 for one year, or enter the course code from your instructor.</p>
        </header>

        {!loading && entitled && (
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="flex items-center gap-3 py-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div className="text-sm">
                <p className="font-medium">Your access is active.</p>
                <p className="text-muted-foreground">
                  {access?.source === "code" ? "Redeemed with a course code" : "Paid access"}
                  {expiresAt && ` · expires ${new Date(expiresAt).toLocaleDateString()}`}
                </p>
              </div>
              <Button asChild size="sm" className="ml-auto">
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !entitled && (
          <p className="text-center text-sm text-muted-foreground">
            {inTrial
              ? `You're on a free ${TRIAL_DAYS}-day trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left.`
              : "Your free trial has ended. Pay or enter a course code to keep going."}
          </p>
        )}

        {!entitled && (
          <>
            <Card>
              <CardContent className="py-6 space-y-3">
                <h2 className="font-semibold">Have a course code?</h2>
                <form onSubmit={onRedeem} className="flex gap-2">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    aria-label="Course code"
                  />
                  <Button type="submit" disabled={!code.trim() || redeem.isPending}>
                    {redeem.isPending ? "Checking…" : "Redeem"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-6 space-y-4">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-semibold">One-year access</h2>
                  <span className="text-2xl font-bold">$10</span>
                </div>
                <ul className="space-y-2 text-sm">
                  {INCLUDED.map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {checkout ? (
                  <StripeEmbeddedCheckout priceId={STUDENT_ACCESS_PRICE_ID} />
                ) : (
                  <Button variant="hero" className="w-full" onClick={() => setCheckout(true)}>
                    Pay $10 for one year
                  </Button>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
