// Shown to a signed-in student who isn't in a class yet: the very first thing
// they need is the join code from their instructor.
import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useJoinClass } from "@/features/classes/useClasses";

export function JoinClassCard() {
  const [code, setCode] = useState("");
  const joinClass = useJoinClass();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 4) return;
    try {
      const result = await joinClass.mutateAsync(code);
      if (result.ok) {
        toast.success(`Joined ${result.class_name}`);
        setCode("");
      } else {
        toast.error(result.error ?? "Could not join class");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not join class");
    }
  };

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GraduationCap className="h-5 w-5 text-primary" />
          Join your class
        </CardTitle>
        <CardDescription>
          Enter the 6-character class code your instructor gave you to get your
          bankroll, coursework, and the class betting board.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 max-w-md">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. K7XQ2M"
            maxLength={12}
            className="font-mono tracking-widest uppercase"
            autoFocus
          />
          <Button type="submit" disabled={joinClass.isPending || code.trim().length < 4}>
            {joinClass.isPending ? "Joining…" : "Join class"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
