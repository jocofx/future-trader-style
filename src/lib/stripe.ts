// ── Stripe configuration ──────────────────────────────────────────
// Price IDs — create these in Stripe Dashboard and paste here

// ── Live prices (production) ──────────────────────────────────
export const STRIPE_PRICES_LIVE = {
  basic: {
    monthly: "price_1TS9rU1bty03DSjpMsFoaEoJ",
    yearly:  "price_1TS9uI1bty03DSjpDLTV7ifc",
  },
  pro: {
    monthly: "price_1TS9wC1bty03DSjpZ78jfAmG",
    yearly:  "price_1TS9wC1bty03DSjpVZ93271r",
  },
} as const;

// ── Test prices (development) ─────────────────────────────────
export const STRIPE_PRICES_TEST = {
  basic: {
    monthly: "price_1TSCbsP0m8lsmKp7GaLgCGL7",
    yearly:  "price_1TSCcDP0m8lsmKp7v5hs3ESe",
  },
  pro: {
    monthly: "price_1TSCd6P0m8lsmKp7XyYkwkho",
    yearly:  "price_1TSCcqP0m8lsmKp7KJU7P5TB",
  },
} as const;

// ── MODO ACTIVO ──────────────────────────────────────────────
// TEST = probando con tarjetas de prueba (sk_test_ en Supabase)
// LIVE = producción real (sk_live_ en Supabase)
// Cambiar a false cuando todo esté verificado y listo para cobrar
const USE_TEST_MODE = true;

export const STRIPE_PRICES = USE_TEST_MODE
  ? STRIPE_PRICES_TEST
  : STRIPE_PRICES_LIVE;

// Fallback to env vars if set (for future flexibility)
// const STRIPE_PRICES_ENV = {
//   basic: { monthly: import.meta.env.VITE_STRIPE_PRICE_BASIC_MONTHLY, ... }
// }

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
