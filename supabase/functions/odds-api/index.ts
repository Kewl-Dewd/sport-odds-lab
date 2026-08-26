// Edge function proxy for odds-api.io
// Keeps the API key server-side and exposes only the endpoints we need.
//
// Adds a shared read-through cache (public.odds_cache) so an entire class
// shares one upstream request per unique query instead of one per student.
// The free tier allows 100 req/hr — without this, 30 students refreshing a
// markets page would exhaust the budget in minutes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const ODDS_BASE = "https://api.odds-api.io/v3";

// odds-api.io /odds requires an explicit bookmaker list.
const DEFAULT_BOOKMAKERS = "DraftKings,FanDuel";

type Action = "sports" | "events" | "odds" | "scores" | "bookmakers";

// How long each response type stays fresh. Sports list barely changes;
// live odds move fastest but 3 minutes is fine for classroom pacing.
const TTL_SECONDS: Record<Action, number> = {
  sports: 24 * 60 * 60,
  bookmakers: 24 * 60 * 60,
  events: 30 * 60,
  odds: 20 * 60,
  scores: 10 * 60,
};

// If the upstream API errors (rate limit, outage), serve a stale cached
// copy up to this old rather than failing the classroom session.
const STALE_GRACE_SECONDS = 6 * 60 * 60;

interface RequestBody {
  action: Action;
  sport?: string;
  league?: string;
  date?: string; // YYYY-MM-DD
  limit?: number;
  eventId?: string | number;
  status?: string;
  bookmakers?: string;
}

function cacheKeyFor(body: RequestBody): string {
  return [
    body.action,
    body.sport ?? "",
    body.league ?? "",
    body.date ?? "",
    body.limit ?? "",
    body.eventId ?? "",
    body.status ?? "",
    body.bookmakers ?? "",
  ].join("|");
}

function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("ODDS_API_KEY");
  if (!apiKey) {
    return json({ error: "ODDS_API_KEY is not configured" }, 500);
  }

  try {
    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    if (!body.action) {
      return json({ error: "Missing 'action' field" }, 400);
    }

    const url = buildUrl(body, apiKey);
    if (!url) {
      return json({ error: `Unsupported action: ${body.action}` }, 400);
    }

    const admin = adminClient();
    const key = cacheKeyFor(body);

    // 1. Fresh cache hit → no upstream request at all.
    let cachedRow: { payload: unknown; fetched_at: string; expires_at: string } | null = null;
    if (admin) {
      const { data } = await admin
        .from("odds_cache")
        .select("payload, fetched_at, expires_at")
        .eq("cache_key", key)
        .maybeSingle();
      cachedRow = data ?? null;
      if (cachedRow && new Date(cachedRow.expires_at).getTime() > Date.now()) {
        return json({ data: cachedRow.payload, cached: true, fetchedAt: cachedRow.fetched_at });
      }
    }

    // 2. Miss or expired → hit upstream.
    const upstream = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    const text = await upstream.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!upstream.ok) {
      console.error(`odds-api ${body.action} failed`, upstream.status, text.slice(0, 200));
      // 3. Upstream failure → serve stale copy if we have one recent enough.
      if (cachedRow) {
        const ageMs = Date.now() - new Date(cachedRow.fetched_at).getTime();
        if (ageMs < STALE_GRACE_SECONDS * 1000) {
          return json({ data: cachedRow.payload, cached: "stale", fetchedAt: cachedRow.fetched_at });
        }
      }
      return json(
        { error: `odds-api responded ${upstream.status}`, details: data },
        upstream.status,
      );
    }

    if (admin) {
      const now = Date.now();
      const expiresAt = new Date(now + TTL_SECONDS[body.action] * 1000).toISOString();
      await admin.from("odds_cache").upsert({
        cache_key: key,
        payload: data,
        fetched_at: new Date(now).toISOString(),
        expires_at: expiresAt,
      });
      // Opportunistic cleanup of long-dead rows (~2% of requests).
      if (Math.random() < 0.02) {
        await admin
          .from("odds_cache")
          .delete()
          .lt("expires_at", new Date(now - STALE_GRACE_SECONDS * 1000).toISOString());
      }
    }

    return json({ data, cached: false });
  } catch (err) {
    console.error("odds-api edge function error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return json({ error: message }, 500);
  }
});

function buildUrl(body: RequestBody, apiKey: string): string | null {
  const params = new URLSearchParams({ apiKey });

  switch (body.action) {
    case "sports":
      return `${ODDS_BASE}/sports?${params.toString()}`;

    case "bookmakers":
      return `${ODDS_BASE}/bookmakers?${params.toString()}`;

    case "events": {
      if (body.sport) params.set("sport", body.sport);
      if (body.league) params.set("league", body.league);
      if (body.date) params.set("date", body.date);
      if (body.status) params.set("status", body.status);
      params.set("limit", String(Math.min(body.limit ?? 25, 100)));
      return `${ODDS_BASE}/events?${params.toString()}`;
    }

    case "odds": {
      if (!body.eventId) return null;
      params.set("eventId", String(body.eventId));
      // odds-api.io requires an explicit bookmaker list on /odds.
      params.set("bookmakers", body.bookmakers ?? DEFAULT_BOOKMAKERS);
      return `${ODDS_BASE}/odds?${params.toString()}`;
    }

    case "scores": {
      if (body.sport) params.set("sport", body.sport);
      if (body.league) params.set("league", body.league);
      params.set("status", body.status ?? "finished");
      params.set("limit", String(Math.min(body.limit ?? 25, 100)));
      return `${ODDS_BASE}/events?${params.toString()}`;
    }

    default:
      return null;
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
