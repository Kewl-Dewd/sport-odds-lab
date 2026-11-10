import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link, Navigate } from "react-router-dom";
import { Mail, Lock, User, GraduationCap, Users, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
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
    <div className="paper-grain relative border-b border-foreground/10">
      <div className="container relative grid max-w-6xl items-center gap-12 px-5 py-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-20">
        <section className="relative z-10">
          <div className="section-kicker mb-6">The classroom sportsbook · Est. 2026</div>
          <h1 className="max-w-2xl font-display text-[clamp(3.2rem,7vw,6.2rem)] font-semibold leading-[0.95] tracking-[-0.06em]">
            Your seat in<br />the <span className="font-editorial font-normal italic text-primary">market.</span>
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
            Read real prices, put your forecast on record, and learn why the number matters more than the pick.
          </p>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-foreground/15 pt-5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            <span>Real market prices</span>
            <span>Virtual funds</span>
            <span>Analysis over outcomes</span>
          </div>
          <p className="mt-8 hidden font-editorial text-xl italic text-muted-foreground lg:block">
            A field study in price, probability, and disciplined thinking.
          </p>
        </section>

        <section className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto" aria-label="Account access">
          <div className="absolute -right-2 -top-5 z-20 rotate-3 border border-primary bg-accent px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.13em] text-accent-foreground shadow-[3px_4px_0_hsl(var(--primary))]">
            <Sparkles className="mr-1.5 inline h-3 w-3" /> Virtual funds only
          </div>
          <Card className="relative border-foreground/25 shadow-paper-card">
            <CardHeader className="border-b border-foreground/15 pb-5">
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="flex h-10 w-10 -rotate-3 items-center justify-center border border-primary/20 bg-background">
                  <img src={logoBeaker} alt="" className="h-8 w-8 object-contain" />
                </div>
                <div>
                  <span className="block font-display text-lg font-semibold tracking-[-0.035em] text-foreground">Sports Market Lab</span>
                  <span className="block font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                    Classroom field lab
                  </span>
                </div>
              </Link>
              <p className="pt-3 text-sm leading-6 text-muted-foreground">
                Sign in to continue your fieldwork, or create an account to join the lab.
              </p>
            </CardHeader>

            <CardContent className="space-y-5 pt-5">
              <Tabs defaultValue={defaultTab}>
                <TabsList className="grid h-11 w-full grid-cols-2">
                  <TabsTrigger value="signin" className="font-mono text-[10px] uppercase tracking-wider">Sign in</TabsTrigger>
                  <TabsTrigger value="signup" className="font-mono text-[10px] uppercase tracking-wider">Create account</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-5 space-y-4">
                  <div className="space-y-3">
                    <label className="block space-y-1.5">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Email address</span>
                      <span className="relative block">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          aria-label="Email address"
                          autoComplete="email"
                          placeholder="you@college.ca"
                          type="email"
                          className="h-11 pl-10"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </span>
                    </label>
                    <label className="block space-y-1.5">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Password</span>
                      <span className="relative block">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          aria-label="Password"
                          autoComplete="current-password"
                          placeholder="Your password"
                          type="password"
                          className="h-11 pl-10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </span>
                    </label>
                  </div>

                  <Button variant="hero" className="h-11 w-full" onClick={signIn} disabled={submitting}>
                    {submitting ? "Signing in…" : "Sign in"}<ArrowRight />
                  </Button>

                  <button
                    type="button"
                    onClick={forgotPassword}
                    disabled={submitting}
                    className="w-full text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary"
                  >
                    Forgot your password?
                  </button>
                </TabsContent>

                <TabsContent value="signup" className="mt-5 space-y-4">
                  <div className="space-y-3">
                    <label className="block space-y-1.5">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Your name</span>
                      <span className="relative block">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          aria-label="Full name or display name"
                          autoComplete="name"
                          placeholder="Full name or display name"
                          className="h-11 pl-10"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                        />
                      </span>
                    </label>
                    <label className="block space-y-1.5">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Email address</span>
                      <span className="relative block">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          aria-label="Email address"
                          autoComplete="email"
                          placeholder="you@college.ca"
                          type="email"
                          className="h-11 pl-10"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </span>
                    </label>
                    <label className="block space-y-1.5">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Choose a password</span>
                      <span className="relative block">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          aria-label="Password"
                          autoComplete="new-password"
                          placeholder="Minimum 8 characters"
                          type="password"
                          className="h-11 pl-10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </span>
                    </label>
                  </div>

                  <fieldset className="space-y-2 pt-1">
                    <legend className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">I’m joining as</legend>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        aria-pressed={role === "student"}
                        className={`flex items-center gap-2.5 border p-3 text-left transition-all ${
                          role === "student"
                            ? "border-primary bg-primary text-primary-foreground shadow-[2px_3px_0_hsl(var(--accent))]"
                            : "border-foreground/20 bg-background text-muted-foreground hover:border-primary"
                        }`}
                        onClick={() => setRole("student")}
                      >
                        <GraduationCap className="h-5 w-5 shrink-0" />
                        <span>
                          <span className={`block text-xs font-semibold ${role === "student" ? "text-primary-foreground" : "text-foreground"}`}>Student</span>
                          <span className={`block text-[10px] ${role === "student" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>Join a class</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-pressed={role === "instructor"}
                        className={`flex items-center gap-2.5 border p-3 text-left transition-all ${
                          role === "instructor"
                            ? "border-primary bg-primary text-primary-foreground shadow-[2px_3px_0_hsl(var(--accent))]"
                            : "border-foreground/20 bg-background text-muted-foreground hover:border-primary"
                        }`}
                        onClick={() => setRole("instructor")}
                      >
                        <Users className="h-5 w-5 shrink-0" />
                        <span>
                          <span className={`block text-xs font-semibold ${role === "instructor" ? "text-primary-foreground" : "text-foreground"}`}>Instructor</span>
                          <span className={`block text-[10px] ${role === "instructor" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>Run the lab</span>
                        </span>
                      </button>
                    </div>
                  </fieldset>

                  <Button variant="hero" className="h-11 w-full" onClick={signUp} disabled={submitting}>
                    {submitting ? "Creating account…" : "Create account"}<ArrowRight />
                  </Button>
                </TabsContent>
              </Tabs>

              <div className="border-t border-foreground/15 pt-4 text-center">
                <span className="flex items-center justify-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Educational coursework · No real-money wagering
                </span>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
