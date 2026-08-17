import { useState } from "react";
import { Link } from "react-router-dom";
import { Archive, Copy, Plus, School, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateClass, useMyClasses } from "@/features/classes/useClasses";

export default function InstructorClassesPage() {
  const { data: classes = [], isLoading } = useMyClasses();
  const createClass = useCreateClass();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [term, setTerm] = useState("");
  const [bankroll, setBankroll] = useState("1000");

  const active = classes.filter((c) => !c.is_archived);
  const archived = classes.filter((c) => c.is_archived);

  const submit = async () => {
    if (!name.trim()) return;
    try {
      await createClass.mutateAsync({
        name: name.trim(),
        term: term.trim() || undefined,
        starting_bankroll: Number(bankroll) || 1000,
      });
      toast.success("Class created");
      setCreateOpen(false);
      setName(""); setTerm(""); setBankroll("1000");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create class");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Join code copied");
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <School className="h-6 w-6 text-primary" /> Class Sections
          </h1>
          <p className="text-sm text-muted-foreground">
            Create sections, share join codes, and configure each class independently.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> New class
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading classes…</p>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              No classes yet. Create your first section and share its join code with students.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Create a class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {active.map((c) => (
              <Card key={c.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    <span className="truncate">{c.name}</span>
                    {c.term && <Badge variant="outline">{c.term}</Badge>}
                  </CardTitle>
                  <CardDescription>
                    Bankroll ${c.starting_bankroll.toLocaleString()}
                    {c.semester_start && ` · ${c.semester_start} → ${c.semester_end ?? "…"}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-3">
                  <button
                    onClick={() => copyCode(c.join_code)}
                    className="flex w-full items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 font-mono text-sm tracking-widest hover:bg-muted"
                    title="Copy join code"
                  >
                    {c.join_code}
                    <Copy className="h-3.5 w-3.5 opacity-60" />
                  </button>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link to={`/instructor/classes/${c.id}`}>
                      <Users className="mr-1.5 h-4 w-4" /> Manage class
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {archived.length > 0 && (
            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Archive className="h-4 w-4" /> Archived
              </h2>
              <div className="grid gap-2 md:grid-cols-3">
                {archived.map((c) => (
                  <Link
                    key={c.id}
                    to={`/instructor/classes/${c.id}`}
                    className="rounded-lg border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                  >
                    {c.name} {c.term && <span className="opacity-60">· {c.term}</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New class section</DialogTitle>
            <DialogDescription>
              A join code is generated automatically — you can share or regenerate it afterward.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="class-name">Class name</Label>
              <Input
                id="class-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sports Wagering Analytics — Section A"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="class-term">Term (optional)</Label>
              <Input
                id="class-term"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Fall 2026"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="class-bankroll">Starting bankroll ($)</Label>
              <Input
                id="class-bankroll"
                type="number"
                min={1}
                value={bankroll}
                onChange={(e) => setBankroll(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={createClass.isPending || !name.trim()}>
              {createClass.isPending ? "Creating…" : "Create class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
