// Supabase Edge Function — pagos del usuario
//
//   POST { plan, interval }      → crea la sesión de pago (14 días de prueba
//                                  solo la primera vez)
//   POST { action: "portal" }    → abre el portal de facturación de Stripe
//                                  (cambiar de plan, tarjeta, cancelar)
//
// Si el usuario ya tiene una suscripción viva, nunca se crea otra: se le
// envía al portal. Así no puede acabar pagando dos veces.
//
// Se identifica al usuario con su sesión (cabecera Authorization).

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

// Precios que se pueden contratar. El precio lo decide el servidor a partir de
// plan + periodo; lo que envíe el navegador como precio se ignora.
const PRICES_LIVE = {
  basic: { monthly: "price_1TS9rU1bty03DSjpMsFoaEoJ", yearly: "price_1TS9uI1bty03DSjpDLTV7ifc" },
  pro:   { monthly: "price_1TS9wC1bty03DSjpZ78jfAmG", yearly: "price_1TS9wC1bty03DSjpVZ93271r" },
} as const;

const PRICES_TEST = {
  basic: { monthly: "price_1TSCbsP0m8lsmKp7GaLgCGL7", yearly: "price_1TSCcDP0m8lsmKp7v5hs3ESe" },
  pro:   { monthly: "price_1TSCd6P0m8lsmKp7XyYkwkho", yearly: "price_1TSCcqP0m8lsmKp7KJU7P5TB" },
} as const;

const PRICES = (Deno.env.get("STRIPE_SECRET_KEY") ?? "").startsWith("sk_test_")
  ? PRICES_TEST
  : PRICES_LIVE;

const APP_URL = "https://www.tradyncapp.com";
const ALLOWED_ORIGINS = new Set([
  APP_URL,
  "https://tradyncapp.com",
  "http://localhost:5173",
  "http://localhost:3000",
]);

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const isLive = (status: string) =>
  status === "active" || status === "trialing" || status === "past_due";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST")    return json({ error: "Method not allowed" }, 405);

  try {
    // ── Usuario ───────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "No authorization" }, 401);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) return json({ error: "Invalid token" }, 401);

    const body = await req.json().catch(() => ({})) as {
      action?:   "checkout" | "portal";
      plan?:     string;
      interval?: string;
    };

    const origin = req.headers.get("origin") ?? "";
    const appUrl = ALLOWED_ORIGINS.has(origin) ? origin : APP_URL;

    // ── Cliente de Stripe del usuario ─────────────────────────
    const { data: row } = await supabase
      .from("suscripciones")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId: string | undefined;
    if (row?.stripe_customer_id) {
      try {
        const c = await stripe.customers.retrieve(row.stripe_customer_id);
        if (!("deleted" in c && c.deleted)) customerId = row.stripe_customer_id;
      } catch {
        console.warn(`Customer ${row.stripe_customer_id} no existe en Stripe`);
      }
    }

    // ¿Tiene ya una suscripción viva?
    let liveSub: Stripe.Subscription | null = null;
    let hadSubscription = false;
    if (customerId) {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
      liveSub = subs.data.find((s) => isLive(s.status)) ?? null;
      hadSubscription = subs.data.length > 0;
    }

    // ── Portal de facturación ─────────────────────────────────
    if (body.action === "portal" || liveSub) {
      if (!customerId) return json({ error: "No tienes ninguna suscripción que gestionar." }, 400);
      const portal = await stripe.billingPortal.sessions.create({
        customer:   customerId,
        return_url: `${appUrl}/app/perfil`,
      });
      return json({ url: portal.url, portal: true });
    }

    // ── Nueva suscripción ─────────────────────────────────────
    const plan     = body.plan === "pro" ? "pro" : body.plan === "basic" ? "basic" : null;
    const interval = body.interval === "yearly" ? "yearly" : "monthly";
    if (!plan) return json({ error: "Plan no válido" }, 400);
    const priceId = PRICES[plan][interval];

    if (!customerId) {
      const customer = await stripe.customers.create({
        email:    user.email,
        metadata: { user_id: user.id, source: "tradync_web" },
      });
      customerId = customer.id;

      const { error: upErr } = await supabase.from("suscripciones").upsert({
        user_id:            user.id,
        stripe_customer_id: customer.id,
        updated_at:         new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (upErr) throw new Error(`No se pudo guardar el cliente: ${upErr.message}`);
    }

    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      mode:                 "subscription",
      payment_method_types: ["card"],
      line_items:           [{ price: priceId, quantity: 1 }],
      subscription_data: {
        // La prueba gratuita es solo para la primera suscripción
        ...(hadSubscription ? {} : { trial_period_days: 14 }),
        metadata: { user_id: user.id, plan, interval },
      },
      success_url:           `${appUrl}/app?checkout=success&plan=${plan}`,
      cancel_url:            `${appUrl}/#pricing`,
      allow_promotion_codes: true,
      locale:                "es",
      metadata:              { user_id: user.id, plan },
    });

    console.log(`✓ Checkout created: user=${user.id} plan=${plan} ${interval} session=${session.id}`);
    return json({ url: session.url });

  } catch (err) {
    console.error("Checkout error:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
