// The class sportsbook's own P&L — the instructor runs the book, and students
// can see exactly what the house is making off their action.
import { Landmark, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBookSummary } from "@/features/classes/usePublishing";

const money = (n: number) =>
  `${n < 0 ? "−" : ""}$${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

interface Props {
  classId: string | undefined;
  /** Instructor view gets the exposure detail; students get the plain-English version. */
  audience?: "instructor" | "student";
}

export function BookSummaryCard({ classId, audience = "student" }: Props) {
  const { data, isLoading } = useBookSummary(classId);

  if (!classId) return null;

  const stats = [
    { label: "Handle (total wagered)", value: money(data?.handle ?? 0), hint: `${data?.bet_count ?? 0} bets · ${data?.bettor_count ?? 0} bettors` },
    { label: "Paid back to students", value: money(data?.paid_out ?? 0), hint: `on ${money(data?.settled_stake ?? 0)} of settled stakes` },
    { label: "Book profit / loss", value: money(data?.book_pnl ?? 0), hint: "settled stakes kept minus payouts", accent: true },
    { label: "Hold %", value: `${(data?.hold_pct ?? 0).toFixed(1)}%`, hint: "share of settled handle the book kept" },
  ];

  const pnl = data?.book_pnl ?? 0;
  const PnlIcon = pnl >= 0 ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Landmark className="h-4 w-4" /> The book
          <Badge variant={pnl >= 0 ? "default" : "destructive"} className="ml-1">
            <PnlIcon className="mr-1 h-3 w-3" />
            {money(pnl)}
          </Badge>
        </CardTitle>
        <CardDescription>
          {audience === "instructor"
            ? "You run the book for this class. Every student stake is action against the house — this is your position."
            : "Your class is a real sportsbook and your instructor is the house. This is what the book has made off the class so far."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p
                className={`text-xl font-bold tabular-nums ${
                  s.accent ? (pnl >= 0 ? "text-success" : "text-destructive") : ""
                }`}
              >
                {isLoading ? "—" : s.value}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.hint}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
          <p>
            <strong className="text-foreground">Open action:</strong>{" "}
            {money(data?.open_stake ?? 0)} still live, with {money(data?.open_liability ?? 0)} of
            payout liability if every open bet wins.
          </p>
          <p>
            Book profit = stakes on losing bets − profit paid on winning bets. Pushes and voids are
            returned and don&apos;t count either way. Hold % is the book&apos;s cut of settled handle —
            real books typically hold 4–8%.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
