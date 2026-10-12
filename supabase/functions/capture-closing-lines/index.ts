// Scheduled job: capture the closing moneyline for games whose betting window
// is closing (or whose game is about to start), store it on published games,
// and compute closing line value (CLV) for every matching position.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ODDS_BASE = "https://api.odds-api.io/v3";
const BOOKMAKERS = "DraftKings,FanDuel";
const LEAD_MS = 15 * 60 * 1000; // capture up to 15 min before start / window close
const GIVE_UP_MS = 6 * 60 * 60 * 1000; // stop retrying 6h after the trigger time
const MAX_EVENTS = 25;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 1 ? n : 0;
};

/** Averaged moneyline (team / "Draw" -> decimal odds) across bookmakers. */
function parseMoneyline(payload: Record<string, unknown>, home: string, away: string) {
  const books = payload?.bookmakers as Record<string, unknown> | undefined;
  const acc: Record<string, { s: number; n: number }> = {};
  const add = (k: string, v: number) => {
    if (!v) return;
    acc[k] ??= { s: 0, n: 0 };
    acc[k].s += v;
    acc[k].n += 1;
  };
  if (books && typeof books === "object") {
    for (const entries of Object.values(books)) {
      if (!Array.isArray(entries)) continue;
      for (const m of entries) {
        const name = String((m as { name?: string })?.name ?? "").toLowerCase();
        const rows = (m as { odds?: unknown[] })?.odds;
        if (!Array.isArray(rows) || !rows.length) continue;
        if (name !== "ml" && name !== "moneyline" && name !== "1x2") continue;
        const r = rows[0] as Record<string, unknown>;
        add(home, num(r.home));
        add(away, num(r.away));
        add("Draw", num(r.draw ?? r.x));
      }
    }
  }
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(acc)) if (v.n) out[k] = v.s / v.n;
  return out;
}

function fairProbs(ml: Record<string, number>) {
  const sum = Object.values(ml).reduce((t, d) => t + 1 / d, 0);
  const out: Record<string, number> = {};
  for (const [k, d] of Object.entries(ml)) out[k] = sum > 0 ? 1 / d / sum : 0;
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const apiKey = Deno.env.get("ODDS_API_KEY");
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apiKey || !url || !key) return json({ error: "Missing configuration" }, 500);
  const db = createClient(url, key);

  const now = Date.now();
  const since = new Date(now - 14 * 864e5).toISOString();

  const [{ data: bets, error: betErr }, { data: pubs, error: pubErr }] = await Promise.all([
    db.from("bets")
      .select("id, external_event_id, event_starts_at, round_id, selection, odds_decimal, market_title, published_market_id")
      .is("closing_captured_at", null)
      .not("external_event_id", "is", null)
      .gte("placed_at", since)
      .limit(2000),
    db.from("published_markets")
      .select("id, external_event_id, commence_at, round_id, home_team, away_team")
      .is("closing_captured_at", null)
      .gte("created_at", since)
      .limit(1000),
  ]);
  if (betErr || pubErr) return json({ error: betErr?.message ?? pubErr?.message }, 500);

  const roundIds = [...new Set([...(bets ?? []), ...(pubs ?? [])].map((r) => r.round_id).filter(Boolean))];
  const roundEnds = new Map<string, number>();
  if (roundIds.length) {
    const { data: rounds } = await db.from("class_rounds").select("id, ends_at").in("id", roundIds);
    for (const r of rounds ?? []) roundEnds.set(r.id, new Date(r.ends_at).getTime());
  }

  // Trigger time per event = earliest of game start and window close.
  const events = new Map<string, { trigger: number; home?: string; away?: string; title?: string }>();
  const note = (id: string, start: string | null, roundId: string | null, extra: { home?: string; away?: string; title?: string }) => {
    const times = [start ? new Date(start).getTime() : NaN, roundId ? roundEnds.get(roundId) ?? NaN : NaN].filter(Number.isFinite);
    if (!times.length) return;
    const t = Math.min(...times);
    const cur = events.get(id);
    events.set(id, { trigger: cur ? Math.min(cur.trigger, t) : t, ...cur, ...Object.fromEntries(Object.entries(extra).filter(([, v]) => v)) });
  };
  for (const p of pubs ?? []) note(p.external_event_id, p.commence_at, p.round_id, { home: p.home_team, away: p.away_team });
  for (const b of bets ?? []) note(b.external_event_id!, b.event_starts_at, b.round_id, { title: b.market_title });

  const due = [...events.entries()].filter(([, e]) => e.trigger - LEAD_MS <= now).slice(0, MAX_EVENTS);
  const results: Record<string, string> = {};

  for (const [eventId, e] of due) {
    let home = e.home, away = e.away;
    let ml: Record<string, number> = {};
    try {
      const params = new URLSearchParams({ apiKey, eventId, bookmakers: BOOKMAKERS });
      const res = await fetch(`${ODDS_BASE}/odds?${params}`);
      if (res.ok) {
        const payload = await res.json();
        home ??= payload?.home;
        away ??= payload?.away;
        if ((!home || !away) && e.title?.includes(" vs ")) [home, away] = e.title.split(" vs ");
        if (home && away) ml = parseMoneyline(payload, home, away);
      }
    } catch (err) {
      console.error("closing fetch failed", eventId, err);
    }

    const stamp = new Date().toISOString();
    if (Object.keys(ml).length < 2) {
      // Line already off the board: retry until the give-up window passes.
      if (now - e.trigger > GIVE_UP_MS) {
        await db.from("bets").update({ closing_captured_at: stamp }).eq("external_event_id", eventId).is("closing_captured_at", null);
        await db.from("published_markets").update({ closing_captured_at: stamp }).eq("external_event_id", eventId).is("closing_captured_at", null);
        results[eventId] = "unavailable";
      } else results[eventId] = "retry";
      continue;
    }

    const fair = fairProbs(ml);
    await db.from("published_markets")
      .update({ closing_snapshot: { moneyline: ml, fair }, closing_captured_at: stamp })
      .eq("external_event_id", eventId)
      .is("closing_captured_at", null);

    for (const b of (bets ?? []).filter((x) => x.external_event_id === eventId)) {
      const sel = String(b.selection ?? "").replace(/\s+ML$/, "");
      const closing = fair[sel];
      const o = Number(b.odds_decimal);
      const locked = o > 0 ? (o < 1 ? 1 / o : o) : 0;
      const update: Record<string, unknown> = { closing_captured_at: stamp };
      if (closing != null && locked > 1) {
        update.closing_no_vig_prob = closing;
        update.clv_pct = (locked * closing - 1) * 100;
        update.closing_odds = ml[sel];
      }
      await db.from("bets").update(update).eq("id", b.id);
    }
    results[eventId] = "captured";
  }

  return json({ checked: events.size, processed: due.length, results });
});
