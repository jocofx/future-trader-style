// Supabase Edge Function — Push Notification Scheduler
// Called by Supabase cron every minute

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const CORS = { "Access-Control-Allow-Origin": "*" };

const REMINDERS: Record<string, { title: string; body: string; url: string }> = {
  recordatorio_diario:    { title: "✍️ Diario de trading",    body: "¿Has escrito tu reflexión del día?",        url: "/app/diario"       },
  recordatorio_habitos:   { title: "💪 Hábitos del día",      body: "¿Has registrado tus hábitos de hoy?",       url: "/app/habitos"      },
  recordatorio_premarket: { title: "📋 Pre-Market checklist", body: "Prepara tu sesión antes de operar.",        url: "/app/premarket"    },
  resumen_diario:         { title: "📊 Resumen diario",       body: "Tu resumen de trading del día está listo.", url: "/app/estadisticas" },
  recordatorio_cierre:    { title: "🔔 Cierre del día",       body: "¿Has revisado tus operaciones de hoy?",    url: "/app/operaciones"  },
  premarket_diario:       { title: "📅 Pre-Market",           body: "Revisa los eventos económicos del día.",   url: "/app/premarket"    },
};

async function sendPush(userId: string, notification: { title: string; body: string; url: string }) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, ...notification }),
  });
  const text = await res.text();
  console.log(`send-push response: ${res.status} ${text}`);
  return res.status < 300;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // Current UTC time in minutes since midnight
    const now        = new Date();
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const timeUtc    = `${String(now.getUTCHours()).padStart(2,"0")}:${String(now.getUTCMinutes()).padStart(2,"0")}`;

    console.log(`Scheduler UTC: ${timeUtc} (${utcMinutes} min)`);

    // Get all users with push subscriptions
    const { data: subscriptions } = await supabase
      .from("configuracion")
      .select("user_id")
      .eq("clave", "push_subscription");

    if (!subscriptions?.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0, time: timeUtc }), { headers: CORS });
    }

    const userIds = subscriptions.map((s: any) => s.user_id);
    let sent = 0;

    // Get notification preferences for all subscribed users
    const { data: prefs } = await supabase
      .from("configuracion")
      .select("user_id, valor")
      .eq("clave", "notif_prefs")
      .in("user_id", userIds);

    for (const pref of prefs ?? []) {
      const userId     = pref.user_id;
      const notifPrefs = pref.valor as Record<string, any>;

      // Get timezone offset for this user (minutes east of UTC, e.g. 120 for UTC+2)
      const tzOffset   = notifPrefs._tzOffset ?? 0;

      // Convert UTC minutes to user's local minutes
      const localMinutes = (utcMinutes + tzOffset + 1440) % 1440;
      const localTime    = `${String(Math.floor(localMinutes / 60)).padStart(2,"0")}:${String(localMinutes % 60).padStart(2,"0")}`;

      console.log(`User ${userId}: UTC=${timeUtc} offset=${tzOffset} local=${localTime}`);

      for (const [type, reminder] of Object.entries(REMINDERS)) {
        const userPref = notifPrefs[type] as { push?: boolean; time?: string } | undefined;
        if (!userPref?.push || !userPref?.time) continue;

        console.log(`  Checking ${type}: configured=${userPref.time} local=${localTime}`);

        if (userPref.time !== localTime) continue;

        console.log(`  MATCH! Sending push for ${type}`);
        const ok = await sendPush(userId, reminder);
        if (ok) sent++;
      }
    }

    console.log(`Done: ${sent} pushes sent`);
    return new Response(JSON.stringify({ ok: true, sent, time: timeUtc }), {
      headers: { ...CORS, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Scheduler error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS });
  }
});
