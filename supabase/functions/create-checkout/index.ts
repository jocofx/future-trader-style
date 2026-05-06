// Supabase Edge Function — Create Stripe Checkout Session
// Called from frontend when user clicks "Probar 14 días gratis"

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

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    // ── Auth: get user from JWT ───────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization" }), {
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // ── Parse request body ────────────────────────────────────
    const { priceId, plan, interval } = await req.json() as {
      priceId:  string;
      plan:     "basic" | "pro";
      interval: "monthly" | "yearly";
    };

    if (!priceId || !plan) {
      return new Response(JSON.stringify({ error: "Missing priceId or plan" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // ── Get or create Stripe customer ─────────────────────────
    let customerId: string | undefined;

    const { data: sub } = await supabase
      .from("suscripciones")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (sub?.stripe_customer_id) {
      // Verify customer still exists in Stripe (could be wrong mode)
      try {
        await stripe.customers.retrieve(sub.stripe_customer_id);
        customerId = sub.stripe_customer_id;
      } catch {
        // Customer not found in current mode (live vs test) — create new
        console.warn(`Customer ${sub.stripe_customer_id} not found, creating new one`);
        customerId = undefined;
      }
    }

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
          source:  "tradync_web",
        },
      });
      customerId = customer.id;

      // Update stored customer ID
      await supabase.from("suscripciones").upsert({
        user_id:           user.id,
        stripe_customer_id: customer.id,
        updated_at:        new Date().toISOString(),
      }, { onConflict: "user_id" });
    }

    // ── Create Checkout Session ───────────────────────────────
    const appUrl = "https://tradyncapp.com";  // always use production domain

    const session = await stripe.checkout.sessions.create({
      customer:            customerId,
      mode:                "subscription",
      payment_method_types: ["card"],
      line_items: [{
        price:    priceId,
        quantity: 1,
      }],
      // 14-day free trial
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          user_id:  user.id,
          plan:     plan,
          interval: interval,
        },
      },
      success_url: `${appUrl}/app?checkout=success&plan=${plan}`,
      cancel_url:  `${appUrl}/#pricing`,
      allow_promotion_codes: true,
      locale: "es",
      metadata: {
        user_id: user.id,
        plan:    plan,
      },
    });

    console.log(`✓ Checkout created: user=${user.id} plan=${plan} session=${session.id}`);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...CORS, "Content-Type": "application/json" },
      status:  200,
    });

  } catch (err) {
    console.error("Checkout error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
