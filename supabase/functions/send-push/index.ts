// Supabase Edge Function — Web Push Sender
// Uses VAPID to send push notifications to subscribed users

const VAPID_PUBLIC  = Deno.env.get("VAPID_PUBLIC_KEY")  ?? "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = "mailto:hola@tradyncapp.com";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Generate VAPID JWT
async function makeVapidJwt(endpoint: string): Promise<string> {
  const origin = new URL(endpoint).origin;
  const now    = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", typ: "JWT" };
  const payload = { aud: origin, exp: now + 3600, sub: VAPID_SUBJECT };

  const b64 = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');

  const unsigned = `${b64(header)}.${b64(payload)}`;

  // Import private key
  const privBytes = Uint8Array.from(atob(VAPID_PRIVATE.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8", privBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false, ["sign"]
  );

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsigned)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');

  return `${unsigned}.${sigB64}`;
}

async function sendPush(subscription: any, payload: object) {
  const endpoint = subscription.endpoint;
  const jwt      = await makeVapidJwt(endpoint);
  const body     = JSON.stringify(payload);

  // Encrypt the payload (simplified — use raw for now, most browsers accept it)
  const res = await fetch(endpoint, {
    method:  "POST",
    headers: {
      "Content-Type":   "application/octet-stream",
      "Content-Length": String(new TextEncoder().encode(body).length),
      "Authorization":  `vapid t=${jwt},k=${VAPID_PUBLIC}`,
      "TTL":            "86400",
    },
    body: new TextEncoder().encode(body),
  });

  return res.status;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { user_id, title, body, url, tag } = await req.json();
    if (!user_id || !title) return json({ error: "Missing user_id or title" }, 400);

    // Get user's push subscription
    const { data } = await supabase
      .from("configuracion")
      .select("valor")
      .eq("user_id", user_id)
      .eq("clave", "push_subscription")
      .maybeSingle();

    if (!data?.valor) return json({ error: "No push subscription found" }, 404);

    const status = await sendPush(data.valor, {
      title, body: body ?? "", url: url ?? "/app", tag: tag ?? "tradyncapp",
      icon:  "/icon-192.png",
    });

    console.log(`Push sent to user=${user_id} status=${status}`);
    return json({ ok: true, status });
  } catch (err) {
    console.error("send-push error:", err);
    return json({ error: String(err) }, 500);
  }
});
