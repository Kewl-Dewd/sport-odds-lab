import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const BodySchema = z.object({
  class_id: z.string().uuid(),
  emails: z.array(z.string().email().max(255)).min(1).max(100),
});

const SITE_URL = "https://sportsmarketlab.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const user = userData.user;

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { class_id, emails } = parsed.data;

    // Only the class owner (or a platform admin) may invite into a class.
    const { data: klass } = await admin
      .from("classes")
      .select("id,name,owner_id,join_code")
      .eq("id", class_id)
      .maybeSingle();
    if (!klass) return json({ error: "Class not found" }, 404);

    if (klass.owner_id !== user.id) {
      const { data: isAdmin } = await admin
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!isAdmin) return json({ error: "Only the class owner can invite students" }, 403);
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("display_name,email")
      .eq("user_id", klass.owner_id)
      .maybeSingle();
    const instructorName = profile?.display_name || profile?.email || "Your instructor";
    const inviteUrl = `${SITE_URL}/join/${klass.join_code}`;

    const unique = Array.from(new Set(emails.map((e) => e.trim().toLowerCase())));
    const failed: string[] = [];
    let sent = 0;

    for (const email of unique) {
      const { error: insertErr } = await admin
        .from("class_invites")
        .upsert(
          { class_id, email, invited_by: user.id, status: "sent" },
          { onConflict: "class_id,email" },
        );
      if (insertErr) {
        console.error("invite row failed", email, insertErr.message);
        failed.push(email);
        continue;
      }
      try {
        await sendTemplateEmail("class-invite", email, {
          templateData: {
            className: klass.name,
            instructorName,
            joinCode: klass.join_code,
            inviteUrl,
          },
          idempotencyKey: `class-invite-${class_id}-${email}-${Date.now()}`,
        });
        sent += 1;
      } catch (e) {
        console.error("invite email failed", email, e);
        failed.push(email);
      }
    }

    return json({ ok: true, sent, failed });
  } catch (e) {
    console.error("send-class-invite error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
