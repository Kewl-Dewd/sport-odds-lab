import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateClass } from "@/features/classes/useClasses";

/**
 * Create a class section (the real unit of work for instructors).
 * Games themselves come from the live odds feed — nothing is hand-authored.
 */
export function NewClassDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const createClass = useCreateClass();
  const navigate = useNavigate();

  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState("");
  const [term, setTerm] = useState("");
  const [bankroll, setBankroll] = useState("1000");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState("");

  const submit = async () => {
    if (!name.trim()) return;
    try {
      const created = await createClass.mutateAsync({
        name: name.trim(),
        term: term.trim() || undefined,
        starting_bankroll: Number(bankroll) || 1000,
        semester_start: start || undefined,
        semester_end: end || undefined,
      });
      toast.success("Class created — share the join code with your students");
      onOpenChange(false);
      setName(""); setTerm(""); setBankroll("1000"); setEnd("");
      navigate(`/instructor/classes/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create class");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New class</DialogTitle>
          <DialogDescription>
            Students join with a code and bet on real games pulled from the live odds
            feed — you run the book. Set how long the class runs and what everyone starts with.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nc-name">Class name</Label>
            <Input
              id="nc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sports Wagering Analytics — Section A"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nc-term">Term (optional)</Label>
            <Input
              id="nc-term"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Fall 2026"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nc-start">Starts</Label>
              <Input id="nc-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nc-end">Ends</Label>
              <Input id="nc-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nc-bankroll">Starting bankroll ($)</Label>
            <Input
              id="nc-bankroll"
              type="number"
              min={1}
              value={bankroll}
              onChange={(e) => setBankroll(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              You can add shorter betting windows or contests inside the class afterward.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={createClass.isPending || !name.trim()}>
            {createClass.isPending ? "Creating…" : "Create class"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
