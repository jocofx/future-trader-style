import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { getEffectivePlan, planHasFeature, PLAN_LIMITS } from "@/lib/stripe";
import type { Plan } from "@/lib/stripe";

export function usePlan() {
  const { plan: rawPlan } = useApp();

  const plan: Plan = useMemo(() => {
    const p = rawPlan as string;
    if (p === "pro")   return "pro";
    if (p === "basic") return "basic";
    return "free";
  }, [rawPlan]);

  const limits   = PLAN_LIMITS[plan];
  const isFree   = plan === "free";
  const isBasic  = plan === "basic" || plan === "pro"; // basic+ features
  const isPro    = plan === "pro";

  const can = (feature: string) => planHasFeature(plan, feature);

  // Check if user hit trade limit (Free plan)
  const canAddTrade = (currentTotal: number) => {
    if (plan !== "free") return true;
    return currentTotal < limits.max_trades;
  };

  return { plan, limits, isFree, isBasic, isPro, can, canAddTrade };
}

// ── Upgrade prompt component data ─────────────────────────────────
export const UPGRADE_PROMPTS: Record<string, { title: string; desc: string; cta: string }> = {
  stats: {
    title: "Estadísticas avanzadas",
    desc: "Accede a profit factor, expectancy, drawdown y filtros avanzados.",
    cta: "Actualizar a Basic — €9/mes",
  },
  premarket: {
    title: "Pre-Market diario",
    desc: "Planifica tu sesión con sesgo, niveles y checklist personal.",
    cta: "Actualizar a Basic — €9/mes",
  },
  capital: {
    title: "Capital Tracker",
    desc: "Registra challenges, fondeadas y calcula tu ROI real.",
    cta: "Actualizar a Basic — €9/mes",
  },
  coach_ia: {
    title: "Coach IA incluido",
    desc: "150 mensajes/mes con contexto de tus operaciones reales. Sin API key.",
    cta: "Actualizar a Pro — €29/mes",
  },
  gestor_ea: {
    title: "Gestor de Expert Advisors",
    desc: "Monitoriza y controla tus bots de algotrading en tiempo real.",
    cta: "Actualizar a Pro — €29/mes",
  },
  broker: {
    title: "Conexión directa al broker",
    desc: "Sincroniza tus operaciones automáticamente desde MT4/MT5 y más.",
    cta: "Actualizar a Pro — €29/mes",
  },
  max_trades: {
    title: "Has alcanzado el límite del plan Free",
    desc: "Tienes 10 operaciones registradas. Basic te da operaciones ilimitadas.",
    cta: "Actualizar a Basic — €9/mes",
  },
  max_accounts: {
    title: "Límite de cuentas alcanzado",
    desc: "Pro te permite cuentas ilimitadas para separar tus estrategias.",
    cta: "Actualizar a Pro — €29/mes",
  },
};
