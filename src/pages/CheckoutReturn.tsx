import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAccess } from "@/hooks/useAccess";

export default function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  // Poll on the paid entitlement, not `hasAccess` (which is true during the free trial).
  const { entitled, refetch } = useAccess();

  // The webhook grants access moments after checkout; poll briefly.
  useEffect(() => {
    if (entitled) return;
    const t = setInterval(() => void refetch(), 2000);
    const stop = setTimeout(() => clearInterval(t), 20000);
    return () => {
      clearInterval(t);
      clearTimeout(stop);
    };
  }, [entitled, refetch]);

  return (
    <div className="container max-w-lg py-16">
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          {entitled ? (
            <>
              <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
              <h1 className="text-2xl font-bold">You're all set</h1>
              <p className="text-muted-foreground">
                Your access is active for the next year.
              </p>
              <Button asChild variant="hero">
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="h-10 w-10 text-primary mx-auto animate-spin" />
              <h1 className="text-2xl font-bold">Confirming your payment…</h1>
              <p className="text-muted-foreground text-sm">
                {sessionId ? "This usually takes a few seconds." : "No checkout session found."}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
