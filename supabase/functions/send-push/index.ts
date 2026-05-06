// Supabase Edge Function — Web Push via web-push library
import webpush from "https://esm.sh/web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PUBLIC  = Deno.env.get("VAPID_PUBLIC_KEY")  ?? "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization,x-client-info,apikey,content-type",
};

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { user_id, title, body, url, tag } = await req.json();
    if (!user_id || !title) return json({ error: "Missing user_id or title" }, 400);
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) return json({ error: "VAPID keys not configured" }, 500);

    // Get user subscription
    const { data } = await supabase
      .from("configuracion")
      .select("valor")
      .eq("user_id", user_id)
      .eq("clave", "push_subscription")
      .maybeSingle();

    if (!data?.valor) return json({ error: "No push subscription found" }, 404);

    // Configure web-push with VAPID
    webpush.setVapidDetails(
      "mailto:hola@tradyncapp.com",
      VAPID_PUBLIC,
      VAPID_PRIVATE
    );

    const payload = JSON.stringify({
      title: title,
      body:  body  ?? "",
      url:   url   ?? "/app",
      tag:   tag   ?? "tradyncapp",
      icon:  "/icon-192.png",
    });

    const result = await webpush.sendNotification(data.valor, payload);

    console.log(`Push sent: status=${result.statusCode}`);
    return json({ ok: true, status: result.statusCode });

  } catch (err: any) {
    console.error("send-push error:", err.statusCode, err.body, err.message);
    return json({ error: err.message, statusCode: err.statusCode, body: err.body }, 500);
  }
});
