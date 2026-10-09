// Supabase Edge Function — Stripe Webhook Handler
//
// IMPORTANTE: esta función debe desplegarse con verify_jwt = false.
// Stripe no envía sesión de usuario; la autenticidad se comprueba con la
// firma del aviso (STRIPE_WEBHOOK_SECRET).
//
// La tabla `suscripciones` tiene una fila por usuario (UNIQUE user_id) con:
//   plan, activa, fecha_fin, stripe_customer_id, stripe_subscription_id

import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-04-10",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const isLive = (status: string) => status === "active" || status === "trialing";

// Producto de Stripe → plan. Es la fuente de verdad: si el cliente cambia de
// plan desde el portal de facturación, el producto cambia pero los metadatos no.
const PRODUCT_PLAN: Record<string, "basic" | "pro"> = {
  "prod_UR1vdHO4PI7ccW": "basic", // Tradync Basic
  "prod_UR20ifoDxTOGXO": "pro",   // Tradync Pro
};

// deno-lint-ignore no-explicit-any
function planOf(sub: any): "basic" | "pro" {
  const product = sub?.items?.data?.[0]?.price?.product;
  const productId = typeof product === "string" ? product : product?.id;
  if (productId && PRODUCT_PLAN[productId]) return PRODUCT_PLAN[productId];
  return sub?.metadata?.plan === "pro" ? "pro" : "basic";
}

// current_period_end está en la suscripción (API antigua) o en sus items (API nueva)
// deno-lint-ignore no-explicit-any
function periodEnd(sub: any): string | null {
  const ts = sub?.items?.data?.[0]?.current_period_end ?? sub?.current_period_end ?? null;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

// user_id de una factura: subscription_details (API antigua) o parent.subscription_details (API nueva)
// deno-lint-ignore no-explicit-any
function invoiceUserId(inv: any): string | null {
  return inv?.subscription_details?.metadata?.user_id
      ?? inv?.parent?.subscription_details?.metadata?.user_id
      ?? null;
}

// Los fallos de escritura deben devolver error para que Stripe reintente
// deno-lint-ignore no-explicit-any
function must(res: { error: any }, what: string) {
  if (res.error) throw new Error(`${what}: ${res.error.message ?? JSON.stringify(res.error)}`);
}

async function currentRow(uid: string) {
  const { data, error } = await supabase
    .from("suscripciones")
    .select("stripe_subscription_id, activa, plan")
    .eq("user_id", uid)
    .maybeSingle();
  if (error) throw new Error(`leer suscripciones: ${error.message}`);
  return data as { stripe_subscription_id: string | null; activa: boolean | null; plan: string | null } | null;
}

// Marca al usuario con una suscripción viva
// deno-lint-ignore no-explicit-any
async function activate(uid: string, sub: any) {
  must(await supabase.from("suscripciones").upsert({
    user_id:                uid,
    plan:                   planOf(sub),
    activa:                 true,
    fecha_fin:              periodEnd(sub),
    stripe_customer_id:     typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
    stripe_subscription_id: sub.id,
    updated_at:             new Date().toISOString(),
  }, { onConflict: "user_id" }), "activar suscripción");
}

// Busca otra suscripción viva del mismo usuario (p. ej. si pagó dos veces)
async function otherLiveSubscription(uid: string, exceptId: string) {
  try {
    const found = await stripe.subscriptions.search({
      query: `metadata['user_id']:'${uid.replace(/[^a-zA-Z0-9-]/g, "")}'`,
      limit: 20,
    });
    return found.data.find((s) => s.id !== exceptId && isLive(s.status)) ?? null;
  } catch (e) {
    console.warn("No se pudo buscar otras suscripciones:", e);
    return null;
  }
}

// Una suscripción ha dejado de estar viva: degradar solo si es la que cuenta
// deno-lint-ignore no-explicit-any
async function deactivate(uid: string, sub: any) {
  const row = await currentRow(uid);

  // La fila apunta a otra suscripción distinta: esta no es la vigente, no tocar
  if (row?.stripe_subscription_id && row.stripe_subscription_id !== sub.id) {
    console.log(`Ignorado: ${sub.id} no es la suscripción vigente de user=${uid}`);
    return;
  }

  // ¿Tiene otra suscripción viva? Entonces pasa a ser la vigente
  const other = await otherLiveSubscription(uid, sub.id);
  if (other) {
    await activate(uid, other);
    console.log(`✓ user=${uid} sigue activo con ${other.id}`);
    return;
  }

  must(await supabase.from("suscripciones").upsert({
    user_id:    uid,
    plan:       "free",
    activa:     false,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" }), "desactivar suscripción");
  console.log(`✓ Sin suscripción activa: user=${uid} (estado Stripe: ${sub.status})`);
}

async function sendEmail(type: string, uid: string) {
  try {
    const { data: profile } = await supabase
      .from("profiles").select("full_name, email").eq("id", uid).maybeSingle();
    let email: string | null = profile?.email ?? null;
    if (!email) {
      const { data } = await supabase.auth.admin.getUserById(uid);
      email = data?.user?.email ?? null;
    }
    if (!email) return;
    await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ type, to: email, data: { name: profile?.full_name ?? "" } }),
    });
  } catch (e) {
    console.warn(`Email ${type} no enviado:`, e);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const signature = req.headers.get("stripe-signature");
  const body      = await req.text();
  const secret    = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

  // ── Verificar firma ───────────────────────────────────────────
  let event: Stripe.Event;
  try {
    if (!signature || !secret) throw new Error("Falta la firma o el secreto");
    event = await stripe.webhooks.constructEventAsync(body, signature, secret);
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  console.log("Stripe event:", event.type, event.id);

  try {
    switch (event.type) {

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        // deno-lint-ignore no-explicit-any
        const sub = event.data.object as any;
        const uid = sub.metadata?.user_id;
        if (!uid) { console.warn("Suscripción sin user_id en metadata:", sub.id); break; }

        if (isLive(sub.status)) {
          await activate(uid, sub);
          console.log(`✓ Plan activo: user=${uid} plan=${planOf(sub)} estado=${sub.status}`);
          if (event.type === "customer.subscription.created") await sendEmail("welcome", uid);
        } else {
          await deactivate(uid, sub);
        }
        break;
      }

      case "customer.subscription.deleted": {
        // deno-lint-ignore no-explicit-any
        const sub = event.data.object as any;
        const uid = sub.metadata?.user_id;
        if (!uid) break;
        await deactivate(uid, sub);
        break;
      }

      case "invoice.payment_failed": {
        // El estado del plan lo decide customer.subscription.updated/deleted;
        // aquí solo se avisa al usuario.
        const uid = invoiceUserId(event.data.object);
        if (uid) await sendEmail("payment_failed", uid);
        break;
      }

      case "customer.subscription.trial_will_end": {
        // deno-lint-ignore no-explicit-any
        const uid = (event.data.object as any).metadata?.user_id;
        if (uid) await sendEmail("trial_ending", uid);
        break;
      }

      default:
        console.log(`Evento sin acción: ${event.type}`);
    }
  } catch (err) {
    console.error("Handler error:", err);
    return new Response("Handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
