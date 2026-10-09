import { useState } from "react";
import { supabase } from "@/lib/supabase";
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

      // Call Edge Function (el precio lo decide el servidor a partir de plan + periodo)
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ plan, interval }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Error creando el checkout");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;

    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error inesperado";
      setError(msg);
      setLoading(false);
      // Show alert so user knows something went wrong
      alert(`No se pudo iniciar el pago: ${msg}`);
    }
  };

  // Portal de facturación de Stripe: cambiar de plan, de tarjeta o cancelar
  const openPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "portal" }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "No se pudo abrir el portal de facturación");
      window.location.href = data.url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error inesperado";
      setError(msg);
      setLoading(false);
      alert(msg);
    }
  };

  return { startCheckout, openPortal, loading, error };
}
