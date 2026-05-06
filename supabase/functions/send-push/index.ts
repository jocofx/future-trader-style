// Supabase Edge Function — Web Push Sender
// Uses web-push compatible approach for iOS/Chrome/Firefox

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

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = "";
  bytes.forEach(b => str += String.fromCharCode(b));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function b64decode(str: string): Uint8Array {
  const pad = "=".repeat((4 - str.length % 4) % 4);
  const b64 = (str + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

async function generateVapidJwt(endpoint: string): Promise<string> {
  const origin  = new URL(endpoint).origin;
  const now     = Math.floor(Date.now() / 1000);

  const header  = { alg: "ES256", typ: "JWT" };
  const payload = { aud: origin, exp: now + 3600, sub: VAPID_SUBJECT };

  const enc = (o: object) =>
    btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  const unsigned = `${enc(header)}.${enc(payload)}`;

  // VAPID private key is a raw 32-byte P-256 key in base64url
  // We need to wrap it in proper EC private key format
  const rawPriv = b64decode(VAPID_PRIVATE);
  const rawPub  = b64decode(VAPID_PUBLIC);

  // Build EC private key in JWK format (more reliable than PKCS8)
  const jwk = {
    kty: "EC",
    crv: "P-256",
    d:   b64url(rawPriv),
    x:   b64url(rawPub.slice(1, 33)),
    y:   b64url(rawPub.slice(33, 65)),
    key_ops: ["sign"],
    ext: true,
  };

  const key = await crypto.subtle.importKey(
    "jwk", jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false, ["sign"]
  );

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsigned)
  );

  return `${unsigned}.${b64url(sig)}`;
}

async function sendWebPush(subscription: any, payload: object): Promise<{ status: number; body: string }> {
  const endpoint  = subscription.endpoint;
  const jwt       = await generateVapidJwt(endpoint);
  const bodyStr   = JSON.stringify(payload);
  const bodyBytes = new TextEncoder().encode(bodyStr);

  // For Apple, we need encrypted payload
  // Try sending with plaintext first (works on Chrome/Firefox)
  // then encrypted for Apple
  const isApple = endpoint.includes("apple.com");

  if (!isApple) {
    // Chrome/Firefox — plaintext with Content-Type text/plain
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `vapid t=${jwt},k=${VAPID_PUBLIC}`,
        "Content-Type":  "text/plain;charset=UTF-8",
        "TTL":           "86400",
      },
      body: bodyStr,
    });
    return { status: res.status, body: await res.text() };
  }

  // Apple — requires encrypted payload
  const authSecret    = b64decode(subscription.keys.auth);
  const clientPubKey  = b64decode(subscription.keys.p256dh);

  // Generate ephemeral key pair for ECDH
  const ephemeral = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true, ["deriveBits"]
  );

  const ephemeralPubRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", ephemeral.publicKey)
  );

  const clientKey = await crypto.subtle.importKey(
    "raw", clientPubKey,
    { name: "ECDH", namedCurve: "P-256" },
    false, []
  );

  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: clientKey },
    ephemeral.privateKey, 256
  );
  const sharedSecret = new Uint8Array(sharedBits);

  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF extract + expand
  async function hkdf(ikm: Uint8Array, saltBytes: Uint8Array, info: Uint8Array, len: number) {
    const ikmKey = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
    return new Uint8Array(await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: saltBytes, info },
      ikmKey, len * 8
    ));
  }

  // PRK
  const authInfo = new TextEncoder().encode("Content-Encoding: auth\0");
  const prk      = await hkdf(sharedSecret, authSecret, authInfo, 32);

  // Build info for key and nonce
  function buildInfo(type: string): Uint8Array {
    const typeBuf = new TextEncoder().encode(`Content-Encoding: ${type}\0P-256\0`);
    const buf     = new Uint8Array(typeBuf.length + 2 + clientPubKey.length + 2 + ephemeralPubRaw.length);
    let i = 0;
    buf.set(typeBuf, i); i += typeBuf.length;
    new DataView(buf.buffer).setUint16(i, clientPubKey.length, false); i += 2;
    buf.set(clientPubKey, i); i += clientPubKey.length;
    new DataView(buf.buffer).setUint16(i, ephemeralPubRaw.length, false); i += 2;
    buf.set(ephemeralPubRaw, i);
    return buf;
  }

  const contentKey = await hkdf(prk, salt, buildInfo("aesgcm"), 16);
  const nonce      = await hkdf(prk, salt, buildInfo("nonce"),   12);

  const aesKey = await crypto.subtle.importKey("raw", contentKey, "AES-GCM", false, ["encrypt"]);

  // Add 2-byte padding prefix
  const padded = new Uint8Array(bodyBytes.length + 2);
  padded.set(bodyBytes, 2);

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, padded)
  );

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization":   `vapid t=${jwt},k=${VAPID_PUBLIC}`,
      "Content-Type":    "application/octet-stream",
      "Content-Encoding":"aesgcm",
      "Encryption":      `salt=${b64url(salt)}`,
      "Crypto-Key":      `dh=${b64url(ephemeralPubRaw)};p256ecdsa=${VAPID_PUBLIC}`,
      "TTL":             "86400",
    },
    body: ciphertext,
  });

  return { status: res.status, body: await res.text() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { user_id, title, body, url, tag } = await req.json();
    if (!user_id || !title) return json({ error: "Missing user_id or title" }, 400);
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) return json({ error: "VAPID keys not configured" }, 500);

    const { data } = await supabase
      .from("configuracion")
      .select("valor")
      .eq("user_id", user_id)
      .eq("clave", "push_subscription")
      .maybeSingle();

    if (!data?.valor) return json({ error: "No push subscription found" }, 404);

    const { status, body: resBody } = await sendWebPush(data.valor, {
      title, body: body ?? "", url: url ?? "/app", tag: tag ?? "tradyncapp", icon: "/icon-192.png",
    });

    console.log(`Push result: status=${status} body=${resBody}`);
    return json({ ok: status < 300, status, response: resBody });
  } catch (err) {
    console.error("send-push error:", err);
    return json({ error: String(err) }, 500);
  }
});
