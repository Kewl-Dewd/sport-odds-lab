// Edge function proxy for odds-api.io
// Keeps the API key server-side and exposes only the endpoints we need.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const ODDS_BASE = "https://api.odds-api.io/v3";

type Action = "sports" | "events" | "odds" | "scores";

interface RequestBody {
  action: Action;
  sport?: string;
  league?: string;
  date?: string; // YYYY-MM-DD
  limit?: number;
  eventId?: string | number;
  status?: string;
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
      return json(
        { error: `odds-api responded ${upstream.status}`, details: data },
        upstream.status,
      );
    }

    return json({ data });
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
