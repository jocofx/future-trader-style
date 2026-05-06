// Supabase Edge Function — Stripe Webhook Handler
// Deploy: supabase functions deploy stripe-webhook
// Set secret: supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
//             supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx

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

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body      = await req.text();
  const secret    = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

  // ── Verify signature ──────────────────────────────────────────
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, secret);
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  console.log("Stripe event:", event.type, event.id);

  // ── Handle events ─────────────────────────────────────────────
  try {
    switch (event.type) {

      // ── New subscription ───────────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub   = event.data.object as Stripe.Subscription;
        const uid   = sub.metadata.user_id;
        const plan  = sub.metadata.plan ?? "basic";
        const estado =
          sub.status === "active"   ? "active"   :
          sub.status === "trialing" ? "trialing" :
          sub.status === "past_due" ? "past_due" :
          sub.status === "canceled" ? "canceled" : "inactive";

        if (!uid) { console.warn("No user_id in subscription metadata"); break; }

        await supabase.from("suscripciones").upsert({
          user_id:                uid,
          plan:                   plan,
          stripe_customer_id:     sub.customer as string,
          stripe_subscription_id: sub.id,
          activa:                 sub.status === "active" || sub.status === "trialing",
          updated_at:             new Date().toISOString(),
        }, { onConflict: "user_id" });

        console.log(`✓ Plan updated: user=${uid} plan=${plan} estado=${estado}`);

        // Send welcome email on new subscription
        if (event.type === "customer.subscription.created") {
          const { data: profile } = await supabase
            .from("profiles").select("full_name, email").eq("id", uid).maybeSingle();
          await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              type: "welcome",
              to:   profile?.email ?? "",
              data: { name: profile?.full_name ?? "" },
            }),
          }).catch(e => console.warn("Welcome email failed:", e));
        }
        break;
      }

      // ── Subscription cancelled ────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const uid = sub.metadata.user_id;
        if (!uid) break;

        await supabase.from("suscripciones").upsert({
          user_id:  uid,
          plan:     "free",
          activa:   false,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        console.log(`✓ Subscription cancelled: user=${uid}`);
        break;
      }

      // ── Payment succeeded ─────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const uid     = invoice.subscription_details?.metadata?.user_id;
        if (!uid) break;

        await supabase.from("suscripciones")
          .update({ activa: true, updated_at: new Date().toISOString() })
          .eq("user_id", uid);

        console.log(`✓ Payment succeeded: user=${uid}`);
        break;
      }

      // ── Payment failed ────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const uid     = invoice.subscription_details?.metadata?.user_id;
        if (!uid) break;

        // Set past_due — Stripe will retry automatically
        await supabase.from("suscripciones")
          .update({ activa: false, updated_at: new Date().toISOString() })
          .eq("user_id", uid);

        const { data: pfProfile } = await supabase
          .from("profiles").select("full_name, email").eq("id", uid).maybeSingle();
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({
            type: "payment_failed",
            to:   pfProfile?.email ?? "",
            data: { name: pfProfile?.full_name ?? "" },
          }),
        }).catch(e => console.warn("Payment failed email failed:", e));
        console.log(`⚠ Payment failed email sent: user=${uid}`);
        break;
      }

      // ── Trial ending soon (3 days) ────────────────────────────
      case "customer.subscription.trial_will_end": {
        const sub = event.data.object as Stripe.Subscription;
        const uid = sub.metadata.user_id;
        const { data: profile } = await supabase
          .from("profiles").select("full_name, email").eq("id", uid).maybeSingle();
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({
            type: "trial_ending",
            to:   profile?.email ?? "",
            data: { name: profile?.full_name ?? "" },
          }),
        }).catch(e => console.warn("Trial ending email failed:", e));
        console.log(`📧 Trial ending email sent: user=${uid}`);
        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
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
