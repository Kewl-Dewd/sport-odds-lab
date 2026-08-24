import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "loading" | "valid" | "invalid" | "done" | "error";

export default function Unsubscribe() {
  const [state, setState] = useState<State>("loading");
  const [submitting, setSubmitting] = useState(false);
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_KEY } },
        );
        setState(res.ok ? "valid" : "invalid");
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    setSubmitting(true);
    const { error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    setSubmitting(false);
    setState(error ? "error" : "done");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Unsubscribe</CardTitle>
          <CardDescription>Sports Market Lab email preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "loading" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking your link...
            </div>
          )}
          {state === "valid" && (
            <>
              <p className="text-sm text-muted-foreground">
                Confirm that you want to stop receiving emails from Sports Market Lab.
              </p>
              <Button onClick={confirm} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm unsubscribe
              </Button>
            </>
          )}
          {state === "done" && (
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                You've been unsubscribed. You won't receive further emails from us.
              </p>
            </div>
          )}
          {(state === "invalid" || state === "error") && (
            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
              <p className="text-sm text-muted-foreground">
                This unsubscribe link is invalid or has expired.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
