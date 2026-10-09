// ── Planes ────────────────────────────────────────────────────────
// Los precios de Stripe viven en el servidor (función create-checkout):
// la web solo envía plan + periodo.

// Aviso de "modo pruebas" en la app. En producción VITE_STRIPE_MODE=live.
export const IS_TEST_MODE = import.meta.env.VITE_STRIPE_MODE !== "live";

export type Plan = "free" | "basic" | "pro";
export type BillingInterval = "monthly" | "yearly";

// Plan limits — mirrors the DB table and feature flags
export const PLAN_LIMITS = {
  free: {
    max_trades:    10,      // lifetime total
    max_accounts:  1,
    history_days:  7,
    ai_messages:   0,
    features: [] as string[],
  },
  basic: {
    max_trades:    Infinity,
    max_accounts:  3,
    history_days:  Infinity,
    ai_messages:   0,        // user provides own API key
    features: ["stats","premarket","capital","diario","habitos","insights","calendar","psicologia","afiliados","logros"],
  },
  pro: {
    max_trades:    Infinity,
    max_accounts:  Infinity,
    history_days:  Infinity,
    ai_messages:   150,
    features: ["stats","premarket","capital","diario","habitos","insights","calendar","psicologia","afiliados","logros","gestor_ea","broker","coach_ia","coach_ia_included","logros"],
  },
} as const;

// Helper — check if a feature is available for a plan
export function planHasFeature(plan: Plan, feature: string): boolean {
  if (plan === "free") return false;
  return (PLAN_LIMITS[plan].features as readonly string[]).includes(feature);
}

// Helper — get effective plan from Supabase suscripciones row
// Supports both old schema (estado string) and new schema (activa boolean)
export function getEffectivePlan(row: { plan: string; estado?: string; activa?: boolean } | null): Plan {
  if (!row) return "free";
  // New schema: activa boolean
  if (typeof row.activa === "boolean") {
    if (!row.activa) return "free";
  } else {
    // Legacy: estado string
    if (row.estado !== "active" && row.estado !== "trialing") return "free";
  }
  if (row.plan === "pro")   return "pro";
  if (row.plan === "basic") return "basic";
  return "free";
}
