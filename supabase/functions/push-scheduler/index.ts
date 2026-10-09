// Supabase Edge Function — recordatorios push
//
// La ejecuta cada minuto la tarea programada "push-scheduler" (pg_cron).
// Mira qué usuarios tienen un recordatorio configurado para este minuto
// (en su hora local) y envía la notificación a todos sus dispositivos.
//
// Desplegar con verify_jwt = false (la llama la base de datos).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

type Notification = { title: string; body: string; url: string };

const REMINDERS: Record<string, Notification> = {
  recordatorio_diario:    { title: "✍️ Diario de trading",    body: "¿Has escrito tu reflexión del día?",        url: "/app/diario"       },
  recordatorio_habitos:   { title: "💪 Hábitos del día",      body: "¿Has registrado tus hábitos de hoy?",       url: "/app/habitos"      },
  recordatorio_premarket: { title: "📋 Pre-Market checklist", body: "Prepara tu sesión antes de operar.",        url: "/app/premarket"    },
  resumen_diario:         { title: "📊 Resumen diario",       body: "Tu resumen de trading del día está listo.", url: "/app/estadisticas" },
  recordatorio_cierre:    { title: "🔔 Cierre del día",       body: "¿Has revisado tus operaciones de hoy?",    url: "/app/operaciones"  },
  premarket_diario:       { title: "📅 Pre-Market",           body: "Revisa los eventos económicos del día.",   url: "/app/premarket"    },
};

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

// Devuelve "ok", "gone" (el navegador dio de baja la suscripción) o "error"
async function sendPush(subscription: unknown, n: Notification): Promise<"ok" | "gone" | "error"> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_KEY}` },
    body:    JSON.stringify({ subscription, ...n }),
  });
  if (res.ok) return "ok";
  const data = await res.json().catch(() => ({}));
  console.warn(`send-push ${res.status}: ${JSON.stringify(data)}`);
  return data?.gone ? "gone" : "error";
}

Deno.serve(async () => {
  try {
    const now        = new Date();
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

    // Una sola consulta: preferencias de aviso y dispositivos suscritos
    const { data: rows, error } = await supabase
      .from("configuracion")
      .select("user_id, clave, valor")
      .or("clave.eq.notif_prefs,clave.like.push_subscription*");
    if (error) throw new Error(error.message);

    // deno-lint-ignore no-explicit-any
    const prefs = (rows ?? []).filter((r: any) => r.clave === "notif_prefs");
    // deno-lint-ignore no-explicit-any
    const subs  = (rows ?? []).filter((r: any) => r.clave !== "notif_prefs" && r.valor);
    if (!prefs.length || !subs.length) return json({ ok: true, sent: 0 });

    let sent = 0;

    for (const pref of prefs) {
      // deno-lint-ignore no-explicit-any
      const notifPrefs = (pref.valor ?? {}) as Record<string, any>;
      // deno-lint-ignore no-explicit-any
      const userSubs   = subs.filter((s: any) => s.user_id === pref.user_id);
      if (!userSubs.length) continue;

      // Hora local del usuario (_tzOffset = minutos al este de UTC)
      const tzOffset     = Number(notifPrefs._tzOffset ?? 0);
      const localMinutes = (utcMinutes + tzOffset + 1440) % 1440;
      const localTime    = `${String(Math.floor(localMinutes / 60)).padStart(2, "0")}:${String(localMinutes % 60).padStart(2, "0")}`;

      for (const [type, reminder] of Object.entries(REMINDERS)) {
        const p = notifPrefs[type] as { push?: boolean; time?: string } | undefined;
        if (!p?.push || p.time !== localTime) continue;

        for (const sub of userSubs) {
          const result = await sendPush(sub.valor, reminder);
          if (result === "ok") sent++;
          if (result === "gone") {
            // Dispositivo dado de baja: se quita para no reintentar cada día
            await supabase.from("configuracion").delete()
              .eq("user_id", sub.user_id).eq("clave", sub.clave);
          }
        }
        console.log(`Recordatorio ${type} → user=${pref.user_id} (${userSubs.length} dispositivos)`);
      }
    }

    return json({ ok: true, sent });
  } catch (err) {
    console.error("Scheduler error:", err);
    return json({ error: String(err) }, 500);
  }
});
