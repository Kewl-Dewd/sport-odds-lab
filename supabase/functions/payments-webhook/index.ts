import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

const ACCESS_DAYS = 365;

async function grantAccess(opts: {
  userId: string;
  customerId?: string | null;
  sessionId?: string | null;
  amountCents?: number | null;
}) {
  const supabase = getSupabase();

  // Extend from the later of "now" and any existing expiry.
  const { data: existing } = await supabase
    .from("user_access")
    .select("expires_at")
    .eq("user_id", opts.userId)
    .maybeSingle();

  const base = existing?.expires_at && new Date(existing.expires_at as string) > new Date()
    ? new Date(existing.expires_at as string)
    : new Date();
  const expires = new Date(base.getTime() + ACCESS_DAYS * 24 * 60 * 60 * 1000);

  const { error } = await supabase.from("user_access").upsert(
    {
      user_id: opts.userId,
      status: "active",
      source: "paid",
      expires_at: expires.toISOString(),
      stripe_customer_id: opts.customerId ?? null,
      stripe_session_id: opts.sessionId ?? null,
      last_payment_at: new Date().toISOString(),
      amount_cents: opts.amountCents ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) console.error("grantAccess failed", error);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  const object = event.data.object;

  switch (event.type) {
    case "checkout.session.completed": {
      if (object.payment_status === "unpaid") break;
      const userId = object.metadata?.userId;
      if (!userId) {
        console.error("checkout.session.completed without userId metadata");
        break;
      }
      await grantAccess({
        userId,
        customerId: typeof object.customer === "string" ? object.customer : object.customer?.id,
        sessionId: object.id,
        amountCents: object.amount_total ?? null,
      });
      break;
    }
    case "checkout.session.async_payment_succeeded": {
      const userId = object.metadata?.userId;
      if (userId) {
        await grantAccess({
          userId,
          customerId: typeof object.customer === "string" ? object.customer : object.customer?.id,
          sessionId: object.id,
          amountCents: object.amount_total ?? null,
        });
      }
      break;
    }
    case "checkout.session.async_payment_failed":
      console.log("Delayed payment failed for session", object.id);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Webhook received with invalid env:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    await handleWebhook(req, rawEnv);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
