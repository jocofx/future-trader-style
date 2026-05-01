import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { STRIPE_PRICES } from "@/lib/stripe";
import type { Plan, BillingInterval } from "@/lib/stripe";

export function useCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const startCheckout = async (plan: Exclude<Plan, "free">, interval: BillingInterval) => {
    setLoading(true);
    setError(null);

    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Not logged in → redirect to login with plan intent
        window.location.href = `/login?plan=${plan}&interval=${interval}`;
        return;
      }

      // Get the correct price ID
      const priceId = STRIPE_PRICES[plan][interval];

      // Call Edge Function
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ priceId, plan, interval }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Error creando el checkout");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;

    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      setLoading(false);
    }
  };

  return { startCheckout, loading, error };
}
