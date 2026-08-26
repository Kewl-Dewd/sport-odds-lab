import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { STUDENT_ACCESS_PRICE_ID } from "@/lib/stripe";
import { useAccess, useRedeemCode } from "@/hooks/useAccess";
import { toast } from "sonner";

const INCLUDED = [
  "Full access to the sportsbook simulator",
  "Place simulated bets and track your bankroll",
  "Join your instructor's class with a join code",
  "Bet journal, leaderboards and responsible-play lessons",
];

export default function GetAccess() {
  const { hasAccess, access, expiresAt, loading } = useAccess();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [code, setCode] = useState("");
  const redeem = useRedeemCode();

  const submitCode = async () => {
    if (!code.trim()) return;
    try {
      await redeem.mutateAsync(code.trim());
      toast.success("Course code redeemed — you have a full year of access.");
      setCode("");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <>
      <PaymentTestModeBanner />
      <div className="container max-w-4xl py-10 space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Get full access</h1>
          <p className="text-muted-foreground">
            $10 for a full year, or redeem a course code from your instructor.
          </p>
        </header>

        {!loading && hasAccess && (
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

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">$10</span>
                <span className="text-sm font-normal text-muted-foreground">/ year</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {!checkoutOpen ? (
                <Button variant="hero" className="w-full" onClick={() => setCheckoutOpen(true)}>
                  Buy a year of access
                </Button>
              ) : (
                <StripeEmbeddedCheckout priceId={STUDENT_ACCESS_PRICE_ID} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <KeyRound className="h-5 w-5 text-primary" /> Have a course code?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Instructors can buy seats in bulk and hand out a course code. Redeeming one gives
                you a full year at no cost.
              </p>
              <Input
                placeholder="Enter course code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && submitCode()}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={submitCode}
                disabled={redeem.isPending || !code.trim()}
              >
                {redeem.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Redeem code
              </Button>
              <Badge variant="secondary" className="text-xs">
                Instructors: contact us for bulk seat pricing
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
