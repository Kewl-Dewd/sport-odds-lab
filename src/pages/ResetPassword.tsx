import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { TrendingUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((evt, session) => {
      if (evt === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate("/choose-mode", { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center justify-center gap-2 font-bold text-xl">
            <TrendingUp className="h-6 w-6 text-primary" />
            Sports Market Lab
          </Link>
          <p className="text-sm text-muted-foreground">Choose a new password</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!ready && (
            <p className="text-sm text-muted-foreground text-center">
              Open this page from the reset link in your email.
            </p>
          )}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="New password (min 8 chars)" type="password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Confirm new password" type="password" className="pl-9" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Button variant="hero" className="w-full" onClick={submit} disabled={submitting || !ready}>
            Update password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
