import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link, Navigate } from "react-router-dom";
import { TrendingUp, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "signin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
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
    toast.success("Signed in");
  };

  const signUp = async () => {
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/choose-mode`,
        data: { display_name: displayName },
      },
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Account created");
  };


  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center justify-center gap-2 font-bold text-xl">
            <TrendingUp className="h-6 w-6 text-primary" />
            Sports Market Lab
          </Link>
          <p className="text-sm text-muted-foreground">Sign in to your classroom account</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab}>
            <TabsList className="w-full">
              <TabsTrigger value="signin" className="flex-1">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Email" type="email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Password" type="password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
              <Button variant="hero" className="w-full" onClick={signIn} disabled={submitting}>Sign In</Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Display name" className="pl-9" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Email" type="email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Password (min 8 chars)" type="password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
              <Button variant="hero" className="w-full" onClick={signUp} disabled={submitting}>Create Account</Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
