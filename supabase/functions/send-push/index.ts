// Supabase Edge Function — notificación push (Web Push)
//
// Uso interno: solo la llama push-scheduler, que se identifica con la clave
// de servicio. Desplegar con verify_jwt = false; la comprobación se hace aquí.
//
// Body: { title, body?, url?, tag?, subscription }   ← dispositivo concreto
//    o  { title, body?, url?, tag?, user_id }        ← primer dispositivo del usuario
import webpush from "https://esm.sh/web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PUBLIC  = Deno.env.get("VAPID_PUBLIC_KEY")  ?? "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", SERVICE_KEY);

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (!SERVICE_KEY || req.headers.get("Authorization") !== `Bearer ${SERVICE_KEY}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await req.json();
    const { user_id, title, url, tag } = body;

    if (!title) return json({ error: "Missing title" }, 400);
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) return json({ error: "VAPID keys not configured" }, 500);

    webpush.setVapidDetails("mailto:hola@tradyncapp.com", VAPID_PUBLIC, VAPID_PRIVATE);

    const payload = JSON.stringify({
      title,
      body: body.body ?? "",
      url:  url ?? "/app",
      tag:  tag ?? "tradyncapp",
      icon: "/icon-192.png",
    });

    let subscription = body.subscription ?? null;

    if (!subscription && user_id) {
      const { data } = await supabase
        .from("configuracion")
        .select("valor")
        .eq("user_id", user_id)
        .like("clave", "push_subscription%")
        .limit(1)
        .maybeSingle();
      if (!data?.valor) return json({ error: "No push subscription found" }, 404);
      subscription = data.valor;
    }

    if (!subscription) return json({ error: "Missing subscription or user_id" }, 400);

    const result = await webpush.sendNotification(subscription, payload);
    console.log(`Push sent: status=${result.statusCode}`);
    return json({ ok: true, status: result.statusCode });

  // deno-lint-ignore no-explicit-any
  } catch (err: any) {
    console.error("send-push error:", err.statusCode, err.body, err.message);
    // 404/410 = el navegador dio de baja esa suscripción
    return json({ error: err.message, statusCode: err.statusCode, gone: err.statusCode === 404 || err.statusCode === 410 }, 500);
  }
});
