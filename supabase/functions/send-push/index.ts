// Supabase Edge Function — Web Push Sender with proper encryption
// Supports Chrome, Firefox AND Apple (iOS PWA)

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

function b64urlDecode(str: string): Uint8Array {
  const pad = "=".repeat((4 - str.length % 4) % 4);
  const b64 = (str + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function generateVapidJwt(endpoint: string): Promise<string> {
  const origin  = new URL(endpoint).origin;
  const now     = Math.floor(Date.now() / 1000);
  const header  = { alg: "ES256", typ: "JWT" };
  const payload = { aud: origin, exp: now + 3600, sub: VAPID_SUBJECT };

  const enc = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");

  const unsigned = `${enc(header)}.${enc(payload)}`;

  const privDer = b64urlDecode(VAPID_PRIVATE);
  
  // Build PKCS8 DER for P-256 private key
  const pkcs8Header = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13,
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02,
    0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02,
    0x01, 0x01, 0x04, 0x20,
  ]);
  const pkcs8 = new Uint8Array(pkcs8Header.length + privDer.length);
  pkcs8.set(pkcs8Header);
  pkcs8.set(privDer, pkcs8Header.length);

  const key = await crypto.subtle.importKey(
    "pkcs8", pkcs8,
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

// Encrypt payload for Web Push (ECDH + AES-128-GCM)
async function encryptPayload(
  subscription: { keys: { p256dh: string; auth: string } },
  plaintext: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const authSecret = b64urlDecode(subscription.keys.auth);
  const clientPublicKey = b64urlDecode(subscription.keys.p256dh);

  // Generate server key pair
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true, ["deriveBits"]
  );

  const serverPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", serverKeyPair.publicKey)
  );

  // Import client public key
  const clientKey = await crypto.subtle.importKey(
    "raw", clientPublicKey,
    { name: "ECDH", namedCurve: "P-256" },
    false, []
  );

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: clientKey },
      serverKeyPair.privateKey, 256
    )
  );

  // Salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF for PRK
  const hkdfKey = await crypto.subtle.importKey("raw", sharedSecret, "HKDF", false, ["deriveBits"]);

  // Auth secret HKDF
  const authInfo = new TextEncoder().encode("Content-Encoding: auth\0");
  const authIkm = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: authSecret, info: authInfo },
      hkdfKey, 256
    )
  );

  // Key and nonce derivation
  const authKey = await crypto.subtle.importKey("raw", authIkm, "HKDF", false, ["deriveBits"]);

  const keyInfo = buildInfo("aesgcm", clientPublicKey, serverPublicKeyRaw);
  const nonceInfo = buildInfo("nonce", clientPublicKey, serverPublicKeyRaw);

  const contentKey = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: keyInfo },
      authKey, 128
    )
  );
  const nonce = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: nonceInfo },
      authKey, 96
    )
  );

  // Encrypt
  const aesKey = await crypto.subtle.importKey("raw", contentKey, "AES-GCM", false, ["encrypt"]);
  const data = new TextEncoder().encode(plaintext);
  const padded = new Uint8Array(data.length + 2);
  padded.set([0, 0]); // no padding
  padded.set(data, 2);

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, padded)
  );

  return { ciphertext, salt, serverPublicKey: serverPublicKeyRaw };
}

function buildInfo(type: string, clientKey: Uint8Array, serverKey: Uint8Array): Uint8Array {
  const base = new TextEncoder().encode(`Content-Encoding: ${type}\0P-256\0`);
  const info = new Uint8Array(base.length + 2 + clientKey.length + 2 + serverKey.length);
  let offset = 0;
  info.set(base, offset); offset += base.length;
  info[offset++] = 0; info[offset++] = clientKey.length;
  info.set(clientKey, offset); offset += clientKey.length;
  info[offset++] = 0; info[offset++] = serverKey.length;
  info.set(serverKey, offset);
  return info;
}

async function sendWebPush(subscription: any, payload: object): Promise<number> {
  const endpoint = subscription.endpoint;
  const jwt = await generateVapidJwt(endpoint);
  const payloadStr = JSON.stringify(payload);

  try {
    // Try with encryption (required for Apple)
    const { ciphertext, salt, serverPublicKey } = await encryptPayload(subscription, payloadStr);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization":   `vapid t=${jwt},k=${VAPID_PUBLIC}`,
        "Content-Type":    "application/octet-stream",
        "Content-Encoding":"aesgcm",
        "Encryption":      `salt=${b64url(salt)}`,
        "Crypto-Key":      `dh=${b64url(serverPublicKey)};p256ecdsa=${VAPID_PUBLIC}`,
        "TTL":             "86400",
      },
      body: ciphertext,
    });

    console.log(`Push response: ${res.status} ${await res.text().catch(() => '')}`);
    return res.status;
  } catch (err) {
    console.error("Push send error:", err);
    return 500;
  }
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

    const status = await sendWebPush(data.valor, {
      title,
      body:  body ?? "",
      url:   url  ?? "/app",
      tag:   tag  ?? "tradyncapp",
      icon:  "/icon-192.png",
    });

    return json({ ok: status < 300, status });
  } catch (err) {
    console.error("send-push error:", err);
    return json({ error: String(err) }, 500);
  }
});
