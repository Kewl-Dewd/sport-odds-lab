import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link, Navigate } from "react-router-dom";
import { Mail, Lock, User, GraduationCap, Users, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import logoBeaker from "@/assets/logo-beaker.png";

type UserRole = "student" | "instructor";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "signin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/choose-mode", { replace: true });
  }, [loading, user, navigate]);

  if (loading) return null;
  if (user) return <Navigate to="/choose-mode" replace />;

  const signIn = async () => {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in successfully");
  };

  const signUp = async () => {
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/choose-mode`,
        data: { display_name: displayName, role },
      },
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Check your email to confirm your account");
  };

  const forgotPassword = async () => {
    if (!email) return toast.error("Enter your email address first, then click Forgot Password");
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Password reset link sent — please check your email inbox");
  };

  return (
    <div className="min-h-[calc(100vh-9rem)] flex items-center justify-center p-4 bg-grid-pattern relative">
      <div className="absolute inset-0 hero-glow pointer-events-none" />

      <Card className="w-full max-w-md shadow-terminal-hover border-border/80 bg-card/95 backdrop-blur-md relative z-10">
        <CardHeader className="text-center space-y-3 pb-4">
          <Link to="/" className="inline-flex items-center justify-center gap-2.5 mx-auto">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <img src={logoBeaker} alt="" className="h-5 w-5 object-contain" />
            </div>
            <div className="text-left">
              <span className="font-bold text-base tracking-tight text-foreground block">Sports Market Lab</span>
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider block -mt-1">
                Classroom Terminal
              </span>
            </div>
          </Link>
          <p className="text-xs text-muted-foreground font-mono">
            SECURE ACADEMIC SIMULATION PORTAL
          </p>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          <Tabs defaultValue={defaultTab}>
            <TabsList className="w-full h-9">
              <TabsTrigger value="signin" className="flex-1 font-mono text-xs uppercase">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1 font-mono text-xs uppercase">Create Account</TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin" className="space-y-3.5 mt-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Institutional or personal email"
                    type="email"
                    className="pl-9 h-9 text-xs font-mono"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Password"
                    type="password"
                    className="pl-9 h-9 text-xs font-mono"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button
                variant="hero"
                className="w-full h-9 font-mono text-xs uppercase"
                onClick={signIn}
                disabled={submitting}
              >
                {submitting ? "Authenticating…" : "Authenticate Account"}
              </Button>

              <button
                type="button"
                onClick={forgotPassword}
                disabled={submitting}
                className="w-full text-xs text-muted-foreground hover:text-emerald-500 underline underline-offset-4 font-mono transition-colors"
              >
                Forgot your password?
              </button>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup" className="space-y-3.5 mt-4">
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Full name or display name"
                    className="pl-9 h-9 text-xs"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Email address"
                    type="email"
                    className="pl-9 h-9 text-xs font-mono"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Password (minimum 8 characters)"
                    type="password"
                    className="pl-9 h-9 text-xs font-mono"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Account Role:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                      role === "student"
                        ? "border-emerald-500 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500"
                        : "border-border/80 bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    }`}
                    onClick={() => setRole("student")}
                  >
                    <GraduationCap className={`h-4 w-4 shrink-0 ${role === "student" ? "text-emerald-500" : ""}`} />
                    <div>
                      <div className="font-semibold text-xs text-foreground">Student</div>
                      <div className="text-[10px] text-muted-foreground">Join class</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                      role === "instructor"
                        ? "border-emerald-500 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500"
                        : "border-border/80 bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    }`}
                    onClick={() => setRole("instructor")}
                  >
                    <Users className={`h-4 w-4 shrink-0 ${role === "instructor" ? "text-emerald-500" : ""}`} />
                    <div>
                      <div className="font-semibold text-xs text-foreground">Instructor</div>
                      <div className="text-[10px] text-muted-foreground">Run labs</div>
                    </div>
                  </button>
                </div>
              </div>

              <Button
                variant="hero"
                className="w-full h-9 font-mono text-xs uppercase"
                onClick={signUp}
                disabled={submitting}
              >
                {submitting ? "Registering…" : "Complete Registration"}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="pt-2 border-t border-border/60 text-center">
            <span className="text-[11px] font-mono text-muted-foreground flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              100% Virtual Currency · Educational Coursework Only
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
