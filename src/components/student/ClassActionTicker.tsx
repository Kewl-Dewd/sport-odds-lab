import { useCallback, useEffect, useMemo, useState } from "react";
import { Radio, TrendingUp, TrendingDown, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface BetRow {
  id: string;
  user_id: string;
  class_id: string | null;
  market_title: string;
  selection: string;
  bet_type: string;
  stake: number;
  status: string;
  payout: number | null;
  placed_at: string;
  settled_at: string | null;
}

interface TickerItem {
  key: string;
  name: string;
  kind: "placed" | "won" | "lost" | "push";
  text: string;
  amount: number;
  at: number;
}

function money(n: number) {
  return `$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function firstName(name: string) {
  return name.split(" ")[0];
}

function relTime(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** Live class ticker: who is placing what bet, and how the bets settled. */
export function ClassActionTicker() {
  const { user } = useAuth();
  const [items, setItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: bets } = await supabase
      .from("bets")
      .select("id, user_id, class_id, market_title, selection, bet_type, stake, status, payout, placed_at, settled_at")
      .not("class_id", "is", null)
      .order("placed_at", { ascending: false })
      .limit(40);

    const rows = (bets ?? []) as BetRow[];
    const ids = [...new Set(rows.map((r) => r.user_id))];
    const nameById: Record<string, string> = {};
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", ids);
      for (const p of (profs ?? []) as Array<{ user_id: string; display_name: string | null; email: string }>) {
        nameById[p.user_id] = p.display_name ?? p.email.split("@")[0];
      }
    }

    const out: TickerItem[] = [];
    for (const b of rows) {
      const name = nameById[b.user_id] ?? "A bettor";
      const who = b.user_id === user?.id ? "You" : firstName(name);
      if (b.status === "open") {
        out.push({
          key: `${b.id}-placed`,
          name: who,
          kind: "placed",
          text: `${who} backed ${b.selection} (${b.bet_type}) — ${b.market_title}`,
          amount: Number(b.stake),
          at: new Date(b.placed_at).getTime(),
        });
      } else {
        const payout = Number(b.payout ?? 0);
        const net = payout - Number(b.stake);
        const kind = net > 0.01 ? "won" : net < -0.01 ? "lost" : "push";
        out.push({
          key: `${b.id}-settled`,
          name: who,
          kind,
          text:
            kind === "won"
              ? `${who} cashed ${b.selection} — ${b.market_title}`
              : kind === "lost"
                ? `${who} lost on ${b.selection} — ${b.market_title}`
                : `${who} pushed on ${b.selection} — ${b.market_title}`,
          amount: kind === "push" ? Number(b.stake) : net,
          at: new Date(b.settled_at ?? b.placed_at).getTime(),
        });
      }
    }
    out.sort((a, b) => b.at - a.at);
    setItems(out.slice(0, 25));
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [user, load]);

  const marquee = useMemo(() => (items.length ? [...items, ...items] : []), [items]);

  if (!user) return null;
  if (loading && items.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Radio className="h-4 w-4 text-primary animate-pulse-subtle" />
        <span className="text-sm font-semibold">Class action</span>
        <span className="text-xs text-muted-foreground">live bets &amp; results</span>
      </div>

      {items.length === 0 ? (
        <div className="px-3 py-3 text-xs text-muted-foreground">
          No bets in your classes yet — be the first to get some action on the board.
        </div>
      ) : (
        <div className="group relative overflow-hidden">
          <div className="flex w-max gap-6 whitespace-nowrap py-2 animate-ticker group-hover:[animation-play-state:paused]">
            {marquee.map((it, i) => (
              <span key={`${it.key}-${i}`} className="inline-flex items-center gap-2 text-xs px-1">
                {it.kind === "placed" ? (
                  <Ticket className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : it.kind === "won" ? (
                  <TrendingUp className="h-3.5 w-3.5 text-success shrink-0" />
                ) : it.kind === "lost" ? (
                  <TrendingDown className="h-3.5 w-3.5 text-destructive shrink-0" />
                ) : (
                  <Ticket className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="font-medium">{it.text}</span>
                <span
                  className={cn(
                    "font-mono font-semibold tabular-nums",
                    it.kind === "won" && "text-success",
                    it.kind === "lost" && "text-destructive",
                  )}
                >
                  {it.kind === "placed"
                    ? money(it.amount)
                    : it.kind === "won"
                      ? `+${money(it.amount)}`
                      : it.kind === "lost"
                        ? `-${money(it.amount)}`
                        : "push"}
                </span>
                <span className="text-muted-foreground">{relTime(it.at)}</span>
                <span className="text-border">•</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
