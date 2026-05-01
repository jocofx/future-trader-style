// ── Stripe configuration ──────────────────────────────────────────
// Price IDs — create these in Stripe Dashboard and paste here

export const STRIPE_PRICES = {
  basic: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_BASIC_MONTHLY ?? "",
    yearly:  import.meta.env.VITE_STRIPE_PRICE_BASIC_YEARLY  ?? "",
  },
  pro: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY ?? "",
    yearly:  import.meta.env.VITE_STRIPE_PRICE_PRO_YEARLY  ?? "",
  },
} as const;

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
    features: ["stats","premarket","capital","diario","habitos","insights","calendar","psicologia","afiliados"],
  },
  pro: {
    max_trades:    Infinity,
    max_accounts:  Infinity,
    history_days:  Infinity,
    ai_messages:   150,
    features: ["stats","premarket","capital","diario","habitos","insights","calendar","psicologia","afiliados","gestor_ea","broker","coach_ia_included"],
  },
} as const;

// Helper — check if a feature is available for a plan
export function planHasFeature(plan: Plan, feature: string): boolean {
  if (plan === "free") return false;
  return (PLAN_LIMITS[plan].features as readonly string[]).includes(feature);
}

// Helper — get effective plan from Supabase suscripciones row
export function getEffectivePlan(row: { plan: string; estado: string } | null): Plan {
  if (!row) return "free";
  if (row.estado !== "active" && row.estado !== "trialing") return "free";
  if (row.plan === "pro")   return "pro";
  if (row.plan === "basic") return "basic";
  return "free";
}
