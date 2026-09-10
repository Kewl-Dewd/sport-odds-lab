import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useActiveMembership, useJoinClass } from "@/features/classes/useClasses";
import { HouseMoneyBanner } from "@/features/HouseMoneyBanner";

export default function JoinClassPage() {
  const { code: codeFromLink } = useParams<{ code: string }>();
  const [code, setCode] = useState(codeFromLink?.toUpperCase() ?? "");
  const navigate = useNavigate();
  const joinClass = useJoinClass();
  const { data: membership } = useActiveMembership();
  const autoJoined = useRef(false);

  // An invite link carries the code, so join without making the student
  // retype what they just clicked.
  useEffect(() => {
    if (!codeFromLink || autoJoined.current) return;
    autoJoined.current = true;
    void join(codeFromLink);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeFromLink]);

  const join = async (raw: string) => {
    try {
      const result = await joinClass.mutateAsync(raw);
      if (result.ok) {
        toast.success(`Joined ${result.class_name}`);
        navigate("/dashboard");
      } else {
        toast.error(result.error ?? "Could not join class");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not join class");
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length === 0) return;
    void join(code);
  };

  return (
    <div className="container max-w-md py-10 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Join a class
          </CardTitle>
          <CardDescription>
            Enter the 6-character join code from your instructor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {membership && (
            <p className="text-sm text-muted-foreground">
              You&apos;re currently in <span className="font-medium text-foreground">{membership.klass.name}</span>.
              Joining another class will add a second enrollment.
            </p>
          )}
          <form onSubmit={submit} className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. K7XQ2M"
              maxLength={12}
              className="font-mono tracking-widest uppercase"
              autoFocus
            />
            <Button type="submit" disabled={joinClass.isPending || code.trim().length < 4}>
              {joinClass.isPending ? "Joining…" : "Join"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <HouseMoneyBanner />
    </div>
  );
}
