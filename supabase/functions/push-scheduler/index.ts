// Supabase Edge Function — Push Notification Scheduler
// Called by Supabase cron every minute
// Checks which users have a reminder due at current time and sends push

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const SUPABASE_URL    = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON   = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const CORS = { "Access-Control-Allow-Origin": "*" };

// Reminder types with their messages
const REMINDERS: Record<string, { title: string; body: string; url: string }> = {
  recordatorio_diario:    { title: "✍️ Diario de trading",    body: "¿Has escrito tu reflexión del día?",          url: "/app/diario"      },
  recordatorio_habitos:   { title: "💪 Hábitos del día",      body: "¿Has registrado tus hábitos de hoy?",         url: "/app/habitos"     },
  recordatorio_premarket: { title: "📋 Pre-Market checklist", body: "Prepara tu sesión antes de operar.",          url: "/app/premarket"   },
  resumen_diario:         { title: "📊 Resumen diario",       body: "Tu resumen de trading del día está listo.",   url: "/app/estadisticas"},
  recordatorio_cierre:    { title: "🔔 Cierre del día",       body: "¿Has revisado tus operaciones de hoy?",       url: "/app/operaciones" },
  premarket_diario:       { title: "📅 Pre-Market",           body: "Revisa los eventos económicos del día.",      url: "/app/premarket"   },
};

async function sendPush(userId: string, notification: { title: string; body: string; url: string }) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON}`,
    },
    body: JSON.stringify({ user_id: userId, ...notification }),
  });
  return res.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // Current UTC time
    const now     = new Date();
    const utcHH   = now.getUTCHours();
    const utcMM   = now.getUTCMinutes();
    const timeNow = `${String(utcHH).padStart(2,"0")}:${String(utcMM).padStart(2,"0")}`;
    const utcMinutes = utcHH * 60 + utcMM;

    console.log(`Scheduler running at UTC ${timeNow}`);

    // Get all users with push subscriptions
    const { data: subscriptions } = await supabase
      .from("configuracion")
      .select("user_id")
      .eq("clave", "push_subscription");

    if (!subscriptions?.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), { headers: CORS });
    }

    const userIds = subscriptions.map(s => s.user_id);
    let sent = 0;

    // Get notification preferences for all subscribed users
    const { data: prefs } = await supabase
      .from("configuracion")
      .select("user_id, valor")
      .eq("clave", "notif_prefs")
      .in("user_id", userIds);

    for (const pref of prefs ?? []) {
      const userId = pref.user_id;
      const notifPrefs = pref.valor as Record<string, { push: boolean; time?: string }>;

      for (const [type, reminder] of Object.entries(REMINDERS)) {
        const userPref = notifPrefs?.[type];
        if (!userPref?.push || !userPref?.time) continue;

        // Check if current time matches
        // time is stored in local time, tzOffset in minutes (e.g. -120 for UTC+2)
        const tzOffset = (notifPrefs as any)._tzOffset ?? 0; // minutes from UTC
        const localHH = (utcMinutes - tzOffset + 1440) % 1440;
        const localTime = `${String(Math.floor(localHH/60)).padStart(2,"0")}:${String(localHH%60).padStart(2,"0")}`;
        if (userPref.time !== localTime) continue;

        // Send push
        const ok = await sendPush(userId, reminder);
        if (ok) {
          sent++;
          console.log(`✓ Push sent: user=${userId} type=${type}`);
        }
      }
    }

    console.log(`Scheduler done: ${sent} pushes sent`);
    return new Response(JSON.stringify({ ok: true, sent, time: timeNow }), {
      headers: { ...CORS, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Scheduler error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS });
  }
});
